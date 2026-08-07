const http=require('http'),fs=require('fs'),p=require('path'),{spawn}=require('child_process');
const ROOT=p.join(__dirname,'public'), PORT=3330;
const T={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.json':'application/json','.webp':'image/webp'};
const srv=http.createServer((q,r)=>{
  let u=decodeURIComponent(q.url.split('?')[0]);
  let f=p.normalize(p.join(ROOT,u));
  if(!f.startsWith(ROOT)){r.writeHead(403);return r.end('no');}
  try{ if(fs.statSync(f).isDirectory()) f=p.join(f,'index.html'); }catch(e){ r.writeHead(404); return r.end('404'); }
  fs.readFile(f,(e,d)=>{ if(e){r.writeHead(404);return r.end('404');}
    r.writeHead(200,{'Content-Type':T[p.extname(f)]||'application/octet-stream'}); r.end(d); });
});
srv.on('error',e=>{console.log('ORIGIN_FAIL '+e.code); process.exit(1);});
srv.listen(PORT,'127.0.0.1',()=>{
  console.log('ORIGIN_UP '+PORT);
  // cloudflared as a CHILD of this process, so it shares this process's network namespace
  const cf=spawn('cloudflared',['tunnel','--url','http://127.0.0.1:'+PORT,'--no-autoupdate'],{stdio:['ignore','pipe','pipe']});
  const scan=b=>{const m=String(b).match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/); if(m){console.log('TUNNEL '+m[0]);}};
  cf.stdout.on('data',scan); cf.stderr.on('data',scan);
});
