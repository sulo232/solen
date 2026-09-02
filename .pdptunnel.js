// Tunnel the Next.js dev server on :3000. cloudflared is spawned as a CHILD of this node process
// because that is the form that has actually answered in this setup; started as its own background
// command it registers with Cloudflare and then the hostname never responds.
const { spawn } = require("child_process");

const cf = spawn("cloudflared", ["tunnel", "--url", "http://127.0.0.1:3077", "--no-autoupdate"],
  { stdio: ["ignore", "pipe", "pipe"] });

const scan = (b) => {
  const m = String(b).match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
  if (m) console.log("TUNNEL " + m[0]);
};
cf.stdout.on("data", scan);
cf.stderr.on("data", scan);
