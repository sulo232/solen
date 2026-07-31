#!/usr/bin/env node
// scripts/capture/turntable-render.mjs , renders a GLB as a 360 turntable to transparent PNG
// frames, matching the measured Airbnb icon envelope in
// _design-system/references/airbnb--animated-icons.md:
//   51 frames at 30fps = 1.700 s, a still hold at both ends, near-linear turn with soft ends,
//   and the LAST frame identical to the first so the parked frame IS the rest icon.
//
// Why a real camera and not a video model: an icon has to return exactly to its start pose. A
// deterministic camera guarantees frame 50 == frame 0. A diffusion model cannot.
//
// NOTHING is written or reported unless the page really loaded and the model really rendered.
// guardedGoto() rules out an error status, a redirect away from the URL asked for, an error UI
// at status 200, and a page that never rendered; a post-run alpha check catches the silent case
// where the page loaded fine but the camera never saw the model.
//
// Usage: node scripts/capture/turntable-render.mjs <model.glb> <outdir>
//   [--frames 51] [--fps 30] [--size 180x162] [--hold-in 6] [--hold-out 12] [--turns 1]
import { chromium } from "playwright";
import { existsSync, mkdirSync, writeFileSync, copyFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../..");

const argv = process.argv.slice(2);
const glbPath = argv.shift();
const outdirArg = argv.shift();
if (!glbPath || !outdirArg) {
  console.error("Usage: node scripts/capture/turntable-render.mjs <model.glb> <outdir> [--frames 51] [--fps 30] [--size 180x162] [--hold-in 6] [--hold-out 12] [--turns 1]");
  process.exit(1);
}
const opt = { frames: 51, fps: 30, size: "180x162", holdIn: 6, holdOut: 12, turns: 1, stageUrl: null };
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  // ES modules are blocked over file:// by CORS (origin null), so when the outdir sits under
  // public/ pass the http URL of the staged page instead. Without this the canvas never mounts.
  if (a === "--stage-url") opt.stageUrl = argv[++i];
  else if (a === "--frames") opt.frames = Number(argv[++i]);
  else if (a === "--fps") opt.fps = Number(argv[++i]);
  else if (a === "--size") opt.size = argv[++i];
  else if (a === "--hold-in") opt.holdIn = Number(argv[++i]);
  else if (a === "--hold-out") opt.holdOut = Number(argv[++i]);
  else if (a === "--turns") opt.turns = Number(argv[++i]);
}
const m = /^(\d+)x(\d+)$/.exec(opt.size);
if (!m) { console.error(`bad --size "${opt.size}"`); process.exit(1); }
const W = Number(m[1]), H = Number(m[2]);

const outdir = resolve(outdirArg);
mkdirSync(outdir, { recursive: true });

// The four ways a measurement lies: bad status, landed somewhere else, error UI at 200, nothing
// rendered. All four are refusals, never results.
async function guardedGoto(page, url, { expectSelector } = {}) {
  let res;
  try {
    res = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
  } catch (e) {
    return { ok: false, reason: "navigation threw", detail: e.message.split("\n")[0] };
  }
  const status = res ? res.status() : 0;                 // file:// legitimately has no response
  if (res && status >= 400) return { ok: false, reason: "http status", detail: String(status) };
  const landed = page.url();
  if (landed.split("#")[0] !== url.split("#")[0]) return { ok: false, reason: "redirected", detail: `${url} -> ${landed}` };
  const body = await page.evaluate(() => ({
    els: document.body ? document.body.querySelectorAll("*").length : 0,
    text: (document.body?.innerText || "").slice(0, 500),
  })).catch(() => ({ els: 0, text: "" }));
  if (/(application error|something went wrong|internal server error|not found)/i.test(body.text)) {
    return { ok: false, reason: "error UI on a loaded page", detail: body.text.slice(0, 80) };
  }
  if (expectSelector) {
    const seen = await page.waitForSelector(expectSelector, { timeout: 30000 }).then(() => true).catch(() => false);
    if (!seen) return { ok: false, reason: "expected element never appeared", detail: expectSelector };
  } else if (body.els < 1) {
    return { ok: false, reason: "nothing rendered", detail: `${body.els} elements` };
  }
  return { ok: true, status, landed };
}
const refusal = (url, g) => `REFUSED  ${url}\n         ${g.reason}${g.detail ? ": " + g.detail : ""}  (no frames written, no verdict)`;

// Stage the model and the three.js build next to a scratch page, so the whole render is
// self-hosted: no CDN, and module imports stay same-origin.
const stage = join(outdir, "_stage");
mkdirSync(stage, { recursive: true });
const glbAbs = resolve(glbPath);
if (!existsSync(glbAbs)) { console.error(`REFUSED: model not found: ${glbAbs}`); process.exit(1); }
copyFileSync(glbAbs, join(stage, "model.glb"));
// Mirror three's own directory layout. GLTFLoader.js imports '../utils/BufferGeometryUtils.js'
// and '../utils/SkeletonUtils.js' by relative path, so flattening these into one folder makes the
// module 404 and fail silently: no canvas, no error, nothing in the console.
mkdirSync(join(stage, "loaders"), { recursive: true });
mkdirSync(join(stage, "utils"), { recursive: true });
for (const [from, to] of [
  [join(ROOT, "node_modules/three/build/three.module.js"), "three.module.js"],
  [join(ROOT, "node_modules/three/build/three.core.js"), "three.core.js"],
  [join(ROOT, "node_modules/three/examples/jsm/loaders/GLTFLoader.js"), "loaders/GLTFLoader.js"],
  [join(ROOT, "node_modules/three/examples/jsm/utils/BufferGeometryUtils.js"), "utils/BufferGeometryUtils.js"],
  [join(ROOT, "node_modules/three/examples/jsm/utils/SkeletonUtils.js"), "utils/SkeletonUtils.js"],
]) {
  if (!existsSync(from)) { console.error(`REFUSED: missing three.js file ${from}. Run: npm install three`); process.exit(1); }
  copyFileSync(from, join(stage, to));
}

const pageHtml = `<!doctype html><meta charset="utf-8">
<style>html,body{margin:0;background:transparent}canvas{display:block}</style>
<script type="importmap">{"imports":{"three":"./three.module.js","three/src/":"./","three/addons/":"./"}}</script>
<script>window.addEventListener("error",e=>{window.__error=String(e.message||e);});</script>
<script type="module">
import * as THREE from "./three.module.js";
import { GLTFLoader } from "./loaders/GLTFLoader.js";

const W = ${W}, H = ${H};
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(W, H, false);
renderer.setClearColor(0x000000, 0);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.domElement.id = "stage";
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = null;
// Soft, even studio light: gentle top key, no hard floor shadow, matching the reference read.
scene.add(new THREE.HemisphereLight(0xffffff, 0xdad7d2, 2.1));
const key = new THREE.DirectionalLight(0xffffff, 1.9); key.position.set(2.4, 4.0, 3.0); scene.add(key);
const fill = new THREE.DirectionalLight(0xffffff, 0.75); fill.position.set(-3.0, 1.4, 1.6); scene.add(fill);
const rim = new THREE.DirectionalLight(0xffffff, 0.5); rim.position.set(-1.0, 2.0, -3.2); scene.add(rim);

const pivot = new THREE.Group();      // the object spins on this, around world Y
scene.add(pivot);
const camera = new THREE.PerspectiveCamera(28, W / H, 0.1, 100);

window.__ready = false;
window.__error = null;

new GLTFLoader().load("./model.glb", (gltf) => {
  const obj = gltf.scene;
  // Centre on the pivot and normalise the size, so framing does not depend on whatever scale
  // the generator happened to emit.
  const box = new THREE.Box3().setFromObject(obj);
  const size = box.getSize(new THREE.Vector3());
  const centre = box.getCenter(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z) || 1;
  const s = 2 / maxDim;
  obj.scale.setScalar(s);
  obj.position.set(-centre.x * s, -centre.y * s, -centre.z * s);
  pivot.add(obj);

  // Frame it: pull back until the scaled bounds fit with margin on every side, at every angle.
  const fitted = new THREE.Box3().setFromObject(pivot);
  const fs = fitted.getSize(new THREE.Vector3());
  const radius = Math.max(Math.hypot(fs.x, fs.z) / 2, fs.y / 2);
  const vFov = (camera.fov * Math.PI) / 180;
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect);
  const margin = 1.28;
  const dist = margin * Math.max(radius / Math.tan(vFov / 2), radius / Math.tan(hFov / 2));
  camera.position.set(0, radius * 0.42, dist);           // a touch above eye level, like the reference
  camera.lookAt(0, 0, 0);
  window.__ready = true;
}, undefined, (e) => { window.__error = String((e && e.message) || e); });

window.__renderAt = (rad) => {
  pivot.rotation.y = rad;
  renderer.render(scene, camera);
  return renderer.domElement.toDataURL("image/png");
};
window.__alphaStats = () => {
  const c = renderer.domElement, g = document.createElement("canvas");
  g.width = c.width; g.height = c.height;
  const ctx = g.getContext("2d"); ctx.drawImage(c, 0, 0);
  const d = ctx.getImageData(0, 0, g.width, g.height).data;
  let opaque = 0;
  for (let i = 3; i < d.length; i += 4) if (d[i] > 25) opaque++;
  return { opaque, total: d.length / 4 };
};
</script>`;
writeFileSync(join(stage, "index.html"), pageHtml);

// The turn: still hold, then a near-LINEAR sweep with soft ends, then still hold. The reference
// measured linear at 0.040 against ease-out at 0.127, so this is a shallow ease, never a snap.
function easeSoftEnds(t) {
  const k = 0.22;                                   // fraction of the sweep spent easing
  if (t < k) return (t * t) / (2 * k * (1 - k));
  if (t > 1 - k) { const u = 1 - t; return 1 - (u * u) / (2 * k * (1 - k)); }
  return (t - k / 2) / (1 - k);
}

const browser = await chromium.launch({ headless: true, args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader"] });
const context = await browser.newContext({ viewport: { width: W + 40, height: H + 40 }, deviceScaleFactor: 1 });
const page = await context.newPage();
page.on("pageerror", (e) => console.error("  page error:", e.message));

const url = opt.stageUrl || ("file://" + join(stage, "index.html"));
if (!opt.stageUrl) {
  console.warn("note: no --stage-url given, using file://. Chromium blocks ES modules there (origin null),");
  console.warn("      so serve the outdir over http and pass --stage-url <url>/_stage/index.html.");
}
const g = await guardedGoto(page, url, { expectSelector: "canvas#stage" });
if (!g.ok) { console.error(refusal(url, g)); await browser.close(); process.exit(1); }

try {
  await page.waitForFunction(() => window.__ready || window.__error, { timeout: 90000 });
} catch {
  console.error(refusal(url, { reason: "model never finished loading", detail: "90s timeout" }));
  await browser.close(); process.exit(1);
}
const loadErr = await page.evaluate(() => window.__error);
if (loadErr) { console.error(refusal(url, { reason: "GLTFLoader failed", detail: loadErr })); await browser.close(); process.exit(1); }

const sweep = opt.frames - opt.holdIn - opt.holdOut;
if (sweep < 2) { console.error("REFUSED: the holds leave no room to turn"); await browser.close(); process.exit(1); }

let wrote = 0, emptyFrames = 0;
for (let f = 0; f < opt.frames; f++) {
  let t;
  if (f < opt.holdIn) t = 0;
  else if (f >= opt.frames - opt.holdOut) t = 1;
  else t = easeSoftEnds((f - opt.holdIn) / (sweep - 1));
  const rad = t * opt.turns * Math.PI * 2;
  const dataUrl = await page.evaluate((r) => window.__renderAt(r), rad);
  writeFileSync(join(outdir, String(f + 1).padStart(3, "0") + ".png"), Buffer.from(dataUrl.split(",")[1], "base64"));
  const stats = await page.evaluate(() => window.__alphaStats());
  if (stats.opaque === 0) emptyFrames++;
  wrote++;
}
await browser.close();

// The silent failure this catches: page loaded, render ran, camera saw nothing.
if (emptyFrames === wrote) {
  console.error(`REFUSED after the fact: all ${wrote} frames are fully transparent, the camera never saw the model. Treat this run as no result.`);
  process.exit(1);
}
console.log(`wrote ${wrote} frames -> ${outdir}`);
console.log(`  ${W}x${H} @${opt.fps}fps = ${(wrote / opt.fps * 1000).toFixed(0)}ms, hold-in ${(opt.holdIn / opt.fps * 1000).toFixed(0)}ms, hold-out ${(opt.holdOut / opt.fps * 1000).toFixed(0)}ms`);
if (emptyFrames) console.log(`  WARNING: ${emptyFrames} of ${wrote} frames were fully transparent`);
