import hashlib, json, os, urllib.error, urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs
from xml.sax.saxutils import escape

KEY=os.environ.get('AZURE_SPEECH_KEY','').strip()
REGION=os.environ.get('AZURE_SPEECH_REGION','eastasia').strip()
VOICE=os.environ.get('AZURE_SPEECH_VOICE','zh-TW-HsiaoChenNeural').strip()
ROOT=os.environ.get('CACHE_ROOT','/app/cache'); os.makedirs(ROOT,exist_ok=True)
MAX_CHARS=80
def body(data): return json.dumps(data,ensure_ascii=False).encode()
def clamp_rate(raw):
    try: return min(1.5,max(0.5,round(float(raw),2)))
    except ValueError: return 1.0
def synthesize(text,rate):
    ssml=f"<speak version='1.0' xml:lang='zh-TW'><voice name='{escape(VOICE)}'><prosody rate='{round((rate-1)*100):+d}%'>{escape(text)}</prosody></voice></speak>"
    req=urllib.request.Request(f'https://{REGION}.tts.speech.microsoft.com/cognitiveservices/v1',data=ssml.encode(),method='POST',headers={'Ocp-Apim-Subscription-Key':KEY,'Content-Type':'application/ssml+xml','X-Microsoft-OutputFormat':'audio-24khz-48kbitrate-mono-mp3','User-Agent':'htmlGames-tts'})
    with urllib.request.urlopen(req,timeout=15) as r: return r.read()
class Handler(BaseHTTPRequestHandler):
    def send_json(self,data,code=200): self.send_response(code);self.send_header('Content-Type','application/json; charset=utf-8');self.end_headers();self.wfile.write(body(data))
    def do_GET(self):
        u=urlparse(self.path)
        if u.path=='/api/tts/health': return self.send_json({'configured':bool(KEY),'voice':VOICE,'region':REGION})
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
ThreadingHTTPServer(('0.0.0.0',8080),Handler).serve_forever()
