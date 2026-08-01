// Serve the icon page + its assets and open a tunnel from a cloudflared spawned as THIS process's
// child, so it inherits this process's network namespace. A cloudflared started as its own
// background command registers with Cloudflare but its public hostname never answers here; the
// child-process form is the one that has actually worked in this repo before (.linkserve.js).
const http = require("http");
const fs = require("fs");
const p = require("path");
const { spawn } = require("child_process");

const ROOT = p.join(__dirname, "public");
const PORT = 3341;
const T = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "text/javascript",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".json": "application/json",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".apng": "image/apng",
};

const srv = http.createServer((q, r) => {
  let u = decodeURIComponent(q.url.split("?")[0]);
  let f = p.normalize(p.join(ROOT, u));
  if (!f.startsWith(ROOT)) { r.writeHead(403); return r.end("no"); }
  // the page is written as .html but linked without the extension
  if (!fs.existsSync(f) && fs.existsSync(f + ".html")) f = f + ".html";
  try { if (fs.statSync(f).isDirectory()) f = p.join(f, "index.html"); }
  catch (e) { r.writeHead(404); return r.end("404 " + u); }
  fs.readFile(f, (e, d) => {
    if (e) { r.writeHead(404); return r.end("404"); }
    r.writeHead(200, { "Content-Type": T[p.extname(f)] || "application/octet-stream" });
    r.end(d);
  });
});

srv.on("error", (e) => { console.log("ORIGIN_FAIL " + e.code); process.exit(1); });
srv.listen(PORT, "127.0.0.1", () => {
  console.log("ORIGIN_UP " + PORT);
  const cf = spawn("cloudflared", ["tunnel", "--url", "http://127.0.0.1:" + PORT, "--no-autoupdate"],
    { stdio: ["ignore", "pipe", "pipe"] });
  const scan = (b) => {
    const m = String(b).match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
    if (m) console.log("TUNNEL " + m[0]);
  };
  cf.stdout.on("data", scan);
  cf.stderr.on("data", scan);
});
