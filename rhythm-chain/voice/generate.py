# 預先生成節奏接龍的「一想到○○，我就想到」語音，並把每一段對齊到拍子上。
#
# 用法：
#   python3 generate.py                 用 macOS 內建「美佳」生成（試聽用）
#   AZURE_SPEECH_KEY=xxx python3 generate.py --engine azure   用 Azure 曉臻生成（正式版）
#   python3 generate.py --demo 輸出資料夾   另外產生「語音＋鼓聲＋玩家拍」的試聽檔
#
# 對齊規則（以 80 BPM 為基準，一拍 0.75 秒）：
#   「一想到」從第 1 拍開始；「我就想到」結尾落在最後一拍結束前 ENDGAP 秒；
#   題目放在兩者中間。整句佔的拍數取最少能放下的整數拍（至少 4 拍），
#   所以語音念完的下一拍就是玩家第 1 拍，節奏不會斷。
# 遊戲端用 playbackRate = bpm / 80 播放即可對上其他 BPM。
#
# 拼接與混音都在 Python 裡直接處理 PCM；ffmpeg 只做單一輸入的轉檔，
# 因為多輸入的 amix + apad 偶爾會卡住不結束。
import argparse, array, json, os, shutil, subprocess, tempfile, urllib.request, wave
from xml.sax.saxutils import escape

HERE = os.path.dirname(os.path.abspath(__file__))
RATE = 48000
REF_BPM = 80
BEAT = 60 / REF_BPM
GAP = .06       # 段落之間的最小間隔
ENDGAP = .08    # 「我就想到」結尾到下一拍的距離
TOPICS = ['夜市小吃', '水果', '飲料', '動物', '國家', '台灣地名', '交通工具', '便利商店商品', '早餐店餐點', '火鍋料', '日本料理', '甜點', '冰品', '職業', '卡通角色', '電影角色', '歌手', '家電', '家具', '文具', '廚房用品', '衣服', '鞋子', '顏色', '程式語言', '手機品牌', 'App', '運動', '台灣景點', '超級英雄']
# 要和 rhythm-chain/index.html 的 XMAS_TOPICS 一致
CHRISTMAS = ['聖誕節', '聖誕老公公', '聖誕樹', '聖誕禮物', '聖誕大餐', '聖誕歌', '冬天', '下雪', '交換禮物', '派對', '甜點', '溫暖的東西']

def run(cmd):
    r = subprocess.run(cmd, stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, text=True, timeout=60)
    if r.returncode:
        raise RuntimeError(f'{cmd[0]} 失敗：' + '\n'.join(r.stderr.strip().splitlines()[-5:]))

def to_pcm(src, dst, af=None):
    run(['ffmpeg', '-y', '-i', src] + (['-af', af] if af else []) + ['-ar', str(RATE), '-ac', '1', '-c:a', 'pcm_s16le', dst])

def read_pcm(path):
    with wave.open(path) as w:
        data = array.array('h'); data.frombytes(w.readframes(w.getnframes()))
    return data

def write_mp3(samples, out, kbps):
    with tempfile.TemporaryDirectory() as tmp:
        wav = os.path.join(tmp, 'mix.wav')
        with wave.open(wav, 'wb') as w:
            w.setnchannels(1); w.setsampwidth(2); w.setframerate(RATE); w.writeframes(samples.tobytes())
        run(['ffmpeg', '-y', '-i', wav, '-c:a', 'libmp3lame', '-b:a', f'{kbps}k', out])

def mix_into(dst, src, at_sec, vol=1.0):
    start = int(at_sec * RATE)
    for i, v in enumerate(src[:max(0, len(dst) - start)]):
        dst[start + i] = max(-32768, min(32767, dst[start + i] + int(v * vol)))

def synth(text, path, engine):
    with tempfile.TemporaryDirectory() as tmp:
        if engine == 'say':
            raw = os.path.join(tmp, 'raw.aiff')
            run(['say', '-v', 'Meijia', '-o', raw, text])
        else:
            raw = os.path.join(tmp, 'raw.wav')
            key, region = os.environ['AZURE_SPEECH_KEY'], os.environ.get('AZURE_SPEECH_REGION', 'eastasia')
            voice = os.environ.get('AZURE_SPEECH_VOICE', 'zh-TW-HsiaoChenNeural')
            ssml = f"<speak version='1.0' xml:lang='zh-TW'><voice name='{voice}'>{escape(text)}</voice></speak>"
            req = urllib.request.Request(f'https://{region}.tts.speech.microsoft.com/cognitiveservices/v1', data=ssml.encode(), method='POST',
                                         headers={'Ocp-Apim-Subscription-Key': key, 'Content-Type': 'application/ssml+xml', 'X-Microsoft-OutputFormat': 'riff-48khz-16bit-mono-pcm', 'User-Agent': 'htmlGames-rhythm'})
            with urllib.request.urlopen(req, timeout=20) as r, open(raw, 'wb') as f:
                f.write(r.read())
        # 去掉頭尾靜音，讓第一個字剛好落在拍點上
        to_pcm(raw, path, 'silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse')

def build_phrase(topic, out, engine, cache):
    segs = []
    for text in ('一想到', topic, '我就想到'):
        p = os.path.join(cache, f'{engine}-{text}.wav')
        if not os.path.exists(p):
            synth(text, p, engine)
        segs.append(read_pcm(p))
    a, t, b = segs
    da, dt, db = (len(s) / RATE for s in segs)
    beats = int(max(4, -(-(da + dt + db + 2 * GAP + ENDGAP) // BEAT)))
    total = beats * BEAT
    b_at = total - ENDGAP - db
    t_at = da + (b_at - da - dt) / 2   # 題目置中，前後留白一樣多
    mix = array.array('h', bytes(2 * int(total * RATE)))
    for seg, at in ((a, 0), (t, t_at), (b, b_at)):
        mix_into(mix, seg, at)
    write_mp3(mix, out, 96)
    return beats

def build_demo(phrase, beats, players, bpm, out, drum):
    # 試聽檔：語音按 bpm 變速（不變調），鼓聲在每一拍，念題目時鼓聲小聲、輪到玩家時大聲
    beat = 60 / bpm
    with tempfile.TemporaryDirectory() as tmp:
        v = os.path.join(tmp, 'v.wav')
        to_pcm(phrase, v, f'atempo={bpm / REF_BPM}')
        voice = read_pcm(v)
    mix = array.array('h', bytes(2 * int((beats + players + 1) * beat * RATE)))
    mix_into(mix, voice, 0)
    for i in range(beats + players):
        mix_into(mix, drum, i * beat, .45 if i < beats else 1.3)
    write_mp3(mix, out, 128)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--engine', choices=['say', 'azure'], default='say')
    ap.add_argument('--demo', help='另外輸出試聽檔到這個資料夾')
    opt = ap.parse_args()
    cache = os.path.join(tempfile.gettempdir(), 'rhythm-voice-cache')
    os.makedirs(cache, exist_ok=True)
    manifest = {'engine': opt.engine, 'referenceBpm': REF_BPM, 'topics': {}}
    for i, topic in enumerate(dict.fromkeys(TOPICS + CHRISTMAS), start=1):
        name = f't{i:02d}.mp3'
        beats = build_phrase(topic, os.path.join(HERE, name), opt.engine, cache)
        manifest['topics'][topic] = {'file': name, 'beats': beats}
        print(f'{name}  {beats} 拍  {topic}', flush=True)
    with open(os.path.join(HERE, 'manifest.json'), 'w', encoding='utf-8') as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)
    if opt.demo:
        os.makedirs(opt.demo, exist_ok=True)
        with tempfile.TemporaryDirectory() as tmp:
            d = os.path.join(tmp, 'drum.wav')
            to_pcm(os.path.join(HERE, '..', 'drum_hit.wav'), d)
            drum = read_pcm(d)
        for topic, players, bpm in [('聖誕節', 3, 80), ('聖誕禮物', 4, 80), ('聖誕老公公', 3, 100), ('便利商店商品', 3, 80), ('水果', 4, 120)]:
            info = manifest['topics'][topic]
            build_demo(os.path.join(HERE, info['file']), info['beats'], players, bpm, os.path.join(opt.demo, f'試聽-{topic}-{players}人-{bpm}BPM.mp3'), drum)
        for topic, info in manifest['topics'].items():
            shutil.copy(os.path.join(HERE, info['file']), os.path.join(opt.demo, f"{info['file'][:-4]}-{topic}-{info['beats']}拍.mp3"))

if __name__ == '__main__':
    main()
