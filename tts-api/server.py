import hashlib, json, os, urllib.error, urllib.request, uuid
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs
from xml.sax.saxutils import escape
from pypinyin import pinyin, Style

KEY=os.environ.get('AZURE_SPEECH_KEY','').strip()
REGION=os.environ.get('AZURE_SPEECH_REGION','eastasia').strip()
VOICE=os.environ.get('AZURE_SPEECH_VOICE','zh-TW-HsiaoChenNeural').strip()
GROQ_KEY=os.environ.get('GROQ_API_KEY','').strip()
STT_MODEL=os.environ.get('GROQ_STT_MODEL','whisper-large-v3-turbo').strip()
ROOT=os.environ.get('CACHE_ROOT','/app/cache'); os.makedirs(ROOT,exist_ok=True)
MAX_CHARS=80
MAX_AUDIO=3*1024*1024
INITIALS=set('ㄅㄆㄇㄈㄉㄊㄋㄌㄍㄎㄏㄐㄑㄒㄓㄔㄕㄖㄗㄘㄙ')
AUDIO_EXT={'audio/webm':'webm','audio/ogg':'ogg','audio/mp4':'m4a','audio/x-m4a':'m4a','audio/mpeg':'mp3','audio/wav':'wav','audio/x-wav':'wav'}
def body(data): return json.dumps(data,ensure_ascii=False).encode()
def clamp_rate(raw):
    try: return min(1.5,max(0.5,round(float(raw),2)))
    except ValueError: return 1.0
def synthesize(text,rate):
    ssml=f"<speak version='1.0' xml:lang='zh-TW'><voice name='{escape(VOICE)}'><prosody rate='{round((rate-1)*100):+d}%'>{escape(text)}</prosody></voice></speak>"
    req=urllib.request.Request(f'https://{REGION}.tts.speech.microsoft.com/cognitiveservices/v1',data=ssml.encode(),method='POST',headers={'Ocp-Apim-Subscription-Key':KEY,'Content-Type':'application/ssml+xml','X-Microsoft-OutputFormat':'audio-24khz-48kbitrate-mono-mp3','User-Agent':'htmlGames-tts'})
    with urllib.request.urlopen(req,timeout=15) as r: return r.read()
def transcribe(audio,content_type):
    # Groq Whisper（OpenAI 相容的 multipart 介面）；prompt 讓它偏向輸出繁體中文詞語
    boundary=uuid.uuid4().hex; ext=AUDIO_EXT.get(content_type,'webm'); parts=[]
    for k,v in (('model',STT_MODEL),('language','zh'),('response_format','json'),('temperature','0'),('prompt','以下是一個繁體中文詞語。')):
        parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode())
    parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="answer.{ext}"\r\nContent-Type: {content_type}\r\n\r\n'.encode()+audio+b'\r\n')
    parts.append(f'--{boundary}--\r\n'.encode())
    req=urllib.request.Request('https://api.groq.com/openai/v1/audio/transcriptions',data=b''.join(parts),method='POST',headers={'Authorization':f'Bearer {GROQ_KEY}','Content-Type':f'multipart/form-data; boundary={boundary}','User-Agent':'htmlGames-stt'})
    with urllib.request.urlopen(req,timeout=20) as r: return json.loads(r.read()).get('text','').strip()
def firsts(ch):
    # 一個字所有讀音的第一個注音符號（破音字任何一個讀音符合都算）
    return {r[0] for r in pinyin(ch,style=Style.BOPOMOFO,heteronym=True)[0] if r}
def match_word(text,initials):
    # 在辨識結果中找連續 n 個字，每個字的聲母依序對上題目（「我想到雪人」裡的「雪人」也算）
    chars=[c for c in text if '㐀'<=c<='鿿']; n=len(initials)
    for i in range(len(chars)-n+1):
        w=chars[i:i+n]
        if all(initials[k] in firsts(w[k]) for k in range(n)): return ''.join(w)
    return None
class Handler(BaseHTTPRequestHandler):
    def send_json(self,data,code=200): self.send_response(code);self.send_header('Content-Type','application/json; charset=utf-8');self.end_headers();self.wfile.write(body(data))
    def do_GET(self):
        u=urlparse(self.path)
        if u.path=='/api/tts/health': return self.send_json({'configured':bool(KEY),'voice':VOICE,'region':REGION})
        if u.path=='/api/stt/health': return self.send_json({'configured':bool(GROQ_KEY),'model':STT_MODEL})
        if u.path!='/api/tts': return self.send_json({'message':'Not found'},404)
        q=parse_qs(u.query); text=' '.join(q.get('text',[''])[0].split()); rate=clamp_rate(q.get('rate',['1'])[0])
        if not text or len(text)>MAX_CHARS: return self.send_json({'message':f'text 需為 1～{MAX_CHARS} 個字'},400)
        if not KEY: return self.send_json({'message':'尚未設定 AZURE_SPEECH_KEY'},503)
        # 同一句話（同聲音、同語速）只向 Azure 合成一次，之後直接讀快取檔。
        path=os.path.join(ROOT,hashlib.sha256(f'{VOICE}|{rate}|{text}'.encode()).hexdigest()+'.mp3')
        if not os.path.exists(path):
            try: audio=synthesize(text,rate)
            except urllib.error.HTTPError as e: return self.send_json({'message':f'Azure 語音回應 {e.code}'},502)
            except Exception as e: return self.send_json({'message':f'Azure 語音連線失敗：{e}'},502)
            tmp=path+f'.{os.getpid()}.{id(self)}.tmp'
            with open(tmp,'wb') as f: f.write(audio)
            os.replace(tmp,path)
        data=open(path,'rb').read()
        self.send_response(200);self.send_header('Content-Type','audio/mpeg');self.send_header('Content-Length',str(len(data)));self.send_header('Cache-Control','public, max-age=86400');self.end_headers();self.wfile.write(data)
    def do_POST(self):
        u=urlparse(self.path)
        if u.path!='/api/stt': return self.send_json({'message':'Not found'},404)
        initials=[c for c in parse_qs(u.query).get('initials',[''])[0] if c in INITIALS]
        size=int(self.headers.get('Content-Length','0') or 0)
        if not 1<=len(initials)<=5: return self.send_json({'message':'initials 需為 1～5 個注音聲母'},400)
        if not 0<size<=MAX_AUDIO: return self.send_json({'message':'錄音檔大小不正確'},400)
        audio=self.rfile.read(size)
        if not GROQ_KEY: return self.send_json({'message':'尚未設定 GROQ_API_KEY'},503)
        content_type=(self.headers.get('Content-Type') or 'audio/webm').split(';')[0].strip()
        try: text=transcribe(audio,content_type)
        except urllib.error.HTTPError as e: return self.send_json({'message':f'Groq 語音辨識回應 {e.code}'},502)
        except Exception as e: return self.send_json({'message':f'Groq 語音辨識連線失敗：{e}'},502)
        matched=match_word(text,initials)
        self.send_json({'text':text,'matched':matched,'ok':bool(matched)})
ThreadingHTTPServer(('0.0.0.0',8080),Handler).serve_forever()
