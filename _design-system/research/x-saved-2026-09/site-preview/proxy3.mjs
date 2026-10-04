// Preview proxy: serves the real dev site (localhost:3000) with system3.js (Uber rules) injected into every HTML page.
// Product code is untouched; stop this process and the preview is gone.
import http from 'node:http';
import net from 'node:net';
import fs from 'node:fs';
import { StringDecoder } from 'node:string_decoder';
const UP = { host: '127.0.0.1', port: 3000 };
const PORT = Number(process.env.PORT || 3493);
const SYS = new URL(process.env.SYS || './system3.js', import.meta.url);
const TAG = '<script src="/__sys.js"></script>';

http.createServer((req, res) => {
  if (req.url === '/__sys.js') { res.writeHead(200, { 'content-type': 'text/javascript', 'cache-control': 'no-store' }); return res.end(fs.readFileSync(SYS)); }
  const headers = { ...req.headers }; delete headers['accept-encoding'];
  const up = http.request({ ...UP, method: req.method, path: req.url, headers }, (ur) => {
    const h = { ...ur.headers };
    if (h.location) h.location = h.location.replace(/^https?:\/\/(localhost|127\.0\.0\.1):3000/, '');
    const html = (h['content-type'] || '').includes('text/html');
    if (!html) { res.writeHead(ur.statusCode, h); return ur.pipe(res); }
    delete h['content-length']; delete h['content-encoding'];
    res.writeHead(ur.statusCode, h);
    let injected = false; const dec = new StringDecoder('utf8');
    ur.on('data', (chunk) => {
      let s = dec.write(chunk);
      if (!injected && s.includes('<head>')) { s = s.replace('<head>', '<head>' + TAG); injected = true; }
      res.write(s);
    });
    ur.on('end', () => res.end(dec.end()));
  });
  up.on('error', (err) => { console.error('[proxy] upstream error', req.url, err.message); if (!res.headersSent) res.writeHead(502); res.end('upstream error'); });
  req.pipe(up);
}).on('upgrade', (req, sock, head) => {
  const up = net.connect(UP.port, UP.host, () => {
    up.write(`${req.method} ${req.url} HTTP/${req.httpVersion}\r\n` + Object.entries(req.headers).map(([k, v]) => `${k}: ${v}`).join('\r\n') + '\r\n\r\n');
    up.write(head); sock.pipe(up).pipe(sock);
  });
  up.on('error', (err) => { console.error('[proxy] ws error', err.message); sock.destroy(); });
  sock.on('error', () => up.destroy());
}).listen(PORT, '127.0.0.1', () => console.log('[proxy] listening on', PORT));
