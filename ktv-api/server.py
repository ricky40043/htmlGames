import json, os, re, subprocess
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs

ROOT=os.environ.get('MEDIA_ROOT','/app/media'); os.makedirs(ROOT,exist_ok=True)
IDS={'01':'bu7nU9Mhpyo','02':'_sQSXwdtxlY','03':'_o0oeyCtoFA','04':'LWV-f6dMN3Q','05':'wSBXfzgqHtE','06':'KqjgLbKZ1h0','07':'YacpC7sUXMM','08':'NAODcPQcy9U','09':'nf0Ljc1lVQs','10':'V5b-kzEbwA8','11':'Qd33i-OoOk4'}
busy=False
def body(data): return json.dumps(data,ensure_ascii=False).encode()
def valid_id(i): return bool(re.fullmatch(r'\d{2}',i)) and i in IDS
def vid(url):
    p=urlparse(url); return (p.path.strip('/') if p.netloc=='youtu.be' else parse_qs(p.query).get('v',[''])[0])
class Handler(BaseHTTPRequestHandler):
    def send_json(self,data,code=200): self.send_response(code);self.send_header('Content-Type','application/json; charset=utf-8');self.end_headers();self.wfile.write(body(data))
    def do_GET(self):
        p=urlparse(self.path).path; m=re.fullmatch(r'/api/ktv/songs/(\d{2})/status',p)
        if m:
            i=m.group(1); path=os.path.join(ROOT,i+'.mp4');return self.send_json({'id':i,'status':'downloaded' if os.path.exists(path) else 'not-downloaded','localFile':f'/ktv/media/{i}.mp4' if os.path.exists(path) else None,'error':None} if valid_id(i) else {'message':'Invalid song id'},200 if valid_id(i) else 400)
        m=re.fullmatch(r'/api/ktv/songs/(\d{2})/media',p)
        if m and valid_id(m.group(1)) and os.path.exists(os.path.join(ROOT,m.group(1)+'.mp4')): self.send_response(200);self.send_header('Content-Type','video/mp4');self.send_header('Accept-Ranges','bytes');self.end_headers();return self.wfile.write(open(os.path.join(ROOT,m.group(1)+'.mp4'),'rb').read())
        self.send_json({'message':'Not found'},404)
    def do_POST(self):
        global busy
        m=re.fullmatch(r'/api/ktv/songs/(\d{2})/download',urlparse(self.path).path);i=m.group(1) if m else ''
        if not m or not valid_id(i): return self.send_json({'message':'Invalid song id'},400)
        data=json.loads(self.rfile.read(int(self.headers.get('Content-Length','0')))); url=data.get('youtubeUrl','');path=os.path.join(ROOT,i+'.mp4')
        if os.path.exists(path): return self.send_json({'id':i,'status':'downloaded','localFile':f'/ktv/media/{i}.mp4','error':None})
        if vid(url)!=IDS[i] or urlparse(url).netloc not in ('youtube.com','www.youtube.com','youtu.be'): return self.send_json({'message':'這首歌只能使用歌單中已核對的 YouTube 影片。'},400)
        if busy:return self.send_json({'message':'另一首歌曲正在下載，請稍候。'},409)
        busy=True
        try:
            p=subprocess.run(['yt-dlp','--no-playlist','--no-part','--no-overwrites','--format','bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]/b','--merge-output-format','mp4','--output',path,url],capture_output=True,text=True,timeout=1800)
            if p.returncode or not os.path.exists(path): raise RuntimeError((p.stderr or '下載失敗').strip().splitlines()[-1])
            return self.send_json({'id':i,'status':'downloaded','localFile':f'/ktv/media/{i}.mp4','error':None})
        except Exception as e:return self.send_json({'id':i,'status':'failed','localFile':None,'error':str(e)},200)
        finally: busy=False
ThreadingHTTPServer(('0.0.0.0',8080),Handler).serve_forever()
