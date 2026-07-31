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
const opt = { frames: 51, fps: 30, size: "180x162", holdIn: 6, holdOut: 12, turns: 1, stageUrl: null, startAngle: 0, exposure: 1.05, lift: 1.0, tonemap: 'aces', sat: 1.0, puff: null, puffDir: '-1,0.15,0', puffSize: 0.20, puffCount: 7, hueShift: null, satMul: 1, valMul: 1, tilt: 0, bob: 0, gloss: 0, neutralVal: null, puffOffset: '0,0,0', puffInset: 0, airWave: 0 };
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
  // Which angle the clip RESTS on. Measured, not guessed: pick the frame where the subject
  // reads most front-on, then pass its rotation here so frame 1 and frame 51 both land there.
  else if (a === "--start-angle") opt.startAngle = Number(argv[++i]);
  else if (a === "--exposure") opt.exposure = Number(argv[++i]);   // tone-mapping exposure
  else if (a === "--lift") opt.lift = Number(argv[++i]);           // multiplies every light
  // ACES filmic crushes saturation in the highlights, which is exactly what made a bright red
  // read washed out. "none" keeps the colour and is what an icon wants.
  else if (a === "--tonemap") opt.tonemap = argv[++i];             // aces | linear | none
  else if (a === "--sat") opt.sat = Number(argv[++i]);             // final saturation multiplier
  // The secondary motion. Measured on the reference: Airbnb's house body stops at 1000ms while its
  // tree keeps swaying to 1400ms, so ONE part outlives the turn by about 400ms. At 30fps with the
  // default 12-frame hold-out that is exactly the tail of the clip, so the puff runs from the start
  // of the sweep to the last frame and never stops early.
  else if (a === "--puff") opt.puff = argv[++i];                   // emit point "x,y,z" in object space
  else if (a === "--puff-dir") opt.puffDir = argv[++i];            // travel direction "x,y,z"
  else if (a === "--puff-size") opt.puffSize = Number(argv[++i]);
  // Nudge the emitter in object space after the automatic placement. The auto point sits on the
  // bounding extreme along the jet axis, which is the mouth PLANE but not necessarily its centre,
  // so this closes the last few pixels measured off the rendered nozzle.
  else if (a === "--puff-offset") opt.puffOffset = argv[++i];      // "x,y,z" in object units
  // Push the emitter back INTO the mouth along the jet axis. The bounding extreme sits on the
  // outer surface, so a ribbon starting there begins a few pixels clear of the body and reads as
  // detached. Insetting makes it emerge from inside the nozzle.
  else if (a === "--puff-inset") opt.puffInset = Number(argv[++i]);
  // Animate the air that is FUSED into the mesh. Tripo returns one mesh, one primitive, one
  // material, so the air cannot be picked out by node or by material. It can be picked out by
  // COLOUR: the ribbons are grey and the dryer is yellow. Classify each vertex by sampling the
  // texture at its UV, then wave only those vertices, so the air flows while the body stays rigid.
  else if (a === "--air-wave") opt.airWave = Number(argv[++i]);    // 0 = off, ~1 = lively
  else if (a === "--puff-count") opt.puffCount = Number(argv[++i]);
  // Recolour the object at render time instead of paying to regenerate it. Only the SATURATED
  // pixels move: chrome, cream and white sit below the saturation floor and are left alone, so a
  // body colour can be swapped without touching the metal trim.
  else if (a === "--hue") opt.hueShift = Number(argv[++i]);        // target hue 0..1
  else if (a === "--sat-mul") opt.satMul = Number(argv[++i]);
  else if (a === "--val-mul") opt.valMul = Number(argv[++i]);
  // A flat 360 reads mechanical. The reference never does one thing at a time: the house turns AND
  // its tree sways. Tilt rocks the object on its own X axis through the turn, so it rises, dips and
  // comes back level exactly where it started, which keeps the loop closing.
  else if (a === "--tilt") opt.tilt = Number(argv[++i]);           // peak tilt in degrees
  else if (a === "--bob") opt.bob = Number(argv[++i]);             // vertical bob, fraction of height
  // The reference icons are not matte: they carry real specular highlights, which is what makes them
  // read as objects under a light rather than as flat colour. Generated meshes come back almost fully
  // rough, so without this every render looks washed out no matter what the colour is.
  else if (a === "--gloss") opt.gloss = Number(argv[++i]);          // 0 = leave as authored, 1 = glossy
  // The counterpart to --hue. --hue only moves pixels ABOVE the saturation floor, which is the
  // upholstery; this moves the ones BELOW it, which is the frame. Lets a cream frame become grey
  // without touching an approved colour sitting right next to it.
  else if (a === "--neutral-val") opt.neutralVal = Number(argv[++i]);  // target value 0..1 for the frame
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
renderer.toneMapping = ${opt.tonemap === 'none' ? 'THREE.NoToneMapping' : opt.tonemap === 'linear' ? 'THREE.LinearToneMapping' : 'THREE.ACESFilmicToneMapping'};
renderer.toneMappingExposure = ${opt.exposure};
renderer.domElement.id = "stage";
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = null;
// Soft, even studio light: gentle top key, no hard floor shadow, matching the reference read.
scene.add(new THREE.HemisphereLight(0xffffff, 0xdad7d2, 2.1 * ${opt.lift}));
const key = new THREE.DirectionalLight(0xffffff, 1.9 * ${opt.lift}); key.position.set(2.4, 4.0, 3.0); scene.add(key);
const fill = new THREE.DirectionalLight(0xffffff, 0.75 * ${opt.lift}); fill.position.set(-3.0, 1.4, 1.6); scene.add(fill);
const rim = new THREE.DirectionalLight(0xffffff, 0.5 * ${opt.lift}); rim.position.set(-1.0, 2.0, -3.2); scene.add(rim);

const pivot = new THREE.Group();
const pivotHolder = new THREE.Group();
scene.add(pivotHolder);      // the object spins on this, around world Y
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
  // classify vertices as AIR (grey) or BODY (coloured), by sampling the baked texture
  const AIR_WAVE = ${opt.airWave};
  if (AIR_WAVE > 0) {
    obj.traverse((n) => {
      if (!n.isMesh || !n.geometry || !n.material || !n.material.map) return;
      const tex = n.material.map, img = tex.image;
      if (!img) return;
      const cw = img.width, chh = img.height;
      const cv = document.createElement("canvas");
      cv.width = cw; cv.height = chh;
      const cx = cv.getContext("2d", { willReadFrequently: true });
      cx.drawImage(img, 0, 0);
      const px = cx.getImageData(0, 0, cw, chh).data;
      const g = n.geometry, pos = g.attributes.position, uv = g.attributes.uv;
      if (!uv) return;
      const isAir = new Float32Array(pos.count);
      let airCount = 0;
      for (let i = 0; i < pos.count; i++) {
        const u = uv.getX(i), v = uv.getY(i);
        const sx = Math.min(cw - 1, Math.max(0, Math.round(u * (cw - 1))));
        const sy = Math.min(chh - 1, Math.max(0, Math.round((1 - v) * (chh - 1))));
        const o = (sy * cw + sx) * 4;
        const r = px[o] / 255, gg = px[o + 1] / 255, b = px[o + 2] / 255;
        const mx = Math.max(r, gg, b), mn = Math.min(r, gg, b);
        const sat = mx === 0 ? 0 : (mx - mn) / mx;
        // grey = low saturation. The body is a saturated yellow, the air is neutral.
        const air = sat < 0.18 ? 1 : 0;
        isAir[i] = air;
        airCount += air;
      }
      g.setAttribute("aAir", new THREE.BufferAttribute(isAir, 1));
      g.userData.basePos = pos.array.slice();
      g.userData.airCount = airCount;
      console.log("air vertices:", airCount, "of", pos.count);
    });
  }
  window.__waveAir = (t) => {
    if (AIR_WAVE <= 0) return;
    obj.traverse((n) => {
      if (!n.isMesh || !n.geometry) return;
      const g = n.geometry, a = g.getAttribute("aAir"), base = g.userData.basePos;
      if (!a || !base) return;
      const pos = g.attributes.position, arr = pos.array;
      for (let i = 0; i < pos.count; i++) {
        const w = a.getX(i);
        if (w === 0) {
          arr[i * 3] = base[i * 3]; arr[i * 3 + 1] = base[i * 3 + 1]; arr[i * 3 + 2] = base[i * 3 + 2];
          continue;
        }
        const bx = base[i * 3], by = base[i * 3 + 1], bz = base[i * 3 + 2];
        // travel a wave along the ribbon: phase from the vertex's own position so the whole
        // stream ripples outward rather than wobbling as one lump
        const cyc = 2;                       // whole cycles across the clip, so it seams
        const ph = (bx + bz) * 5.2 - ((t * cyc) % 1) * Math.PI * 2;
        const amp = AIR_WAVE * 0.011;
        arr[i * 3] = bx;
        arr[i * 3 + 1] = by + Math.sin(ph) * amp;
        arr[i * 3 + 2] = bz + Math.cos(ph * 0.8) * amp * 0.6;
      }
      pos.needsUpdate = true;
      g.computeVertexNormals();
    });
  };
  const GLOSS = ${opt.gloss};
  if (GLOSS > 0) {
    // An environment is what a specular highlight actually reflects. Without one, lowering roughness
    // buys nothing, which is why "make it shinier" fails if you only touch the material.
    const pm = new THREE.PMREMGenerator(renderer);
    const envScene = new THREE.Scene();
    const top = new THREE.Mesh(
      new THREE.SphereGeometry(8, 16, 8),
      new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.BackSide })
    );
    envScene.add(top);
    const key = new THREE.Mesh(
      new THREE.PlaneGeometry(6, 6),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    key.position.set(-3, 4, 3); key.lookAt(0, 0, 0);
    envScene.add(key);
    scene.environment = pm.fromScene(envScene, 0.04).texture;
    scene.environmentIntensity = 0.55 + 0.75 * GLOSS;
    obj.traverse((n) => {
      if (!n.isMesh || !n.material) return;
      for (const m of (Array.isArray(n.material) ? n.material : [n.material])) {
        if (m.roughness !== undefined) m.roughness = Math.max(0.06, (m.roughness ?? 1) * (1 - 0.85 * GLOSS));
        if (m.metalness !== undefined) m.metalness = Math.min(0.85, (m.metalness ?? 0) + 0.30 * GLOSS);
        m.envMapIntensity = 0.7 + 1.1 * GLOSS;
        m.needsUpdate = true;
      }
    });
  }
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
  if (PUFF) {
    buildWaves(obj);
  }
  window.__ready = true;
}, undefined, (e) => { window.__error = String((e && e.message) || e); });


// ---- secondary motion: three DRAWN wind lines ------------------------------------------
// Rebuilt 2026-07-31 after the owner: "not this weird fucking robotic arm looking ass air, but
// like those wavy airs... research on how it's drawn". The convention he means is the drawn wind
// glyph: two or three horizontal strokes carrying a shallow sine, of constant weight, each ending
// in a small curl. It is a 2D mark, not a 3D object, which is why the tube version read as a
// robot arm: a tube has volume and catches light, a drawn line does not.
//
// So these are FLAT camera-facing strips living in the SCENE, not under the pivot. They do not
// rotate with the dryer, because a drawn mark never turns edge-on. And they appear only while the
// icon is MOVING, so the resting icon is just the dryer, tilted, exactly as asked.
const PUFF = ${opt.puff ? '"' + opt.puff + '"' : "null"};
const PUFF_DIR = ${JSON.stringify(opt.puffDir.split(",").map(Number))};
const PUFF_SIZE = ${opt.puffSize};
const WAVES = 3;
let windLines = [], windAnchor = new THREE.Vector3();

function buildWaves(obj) {
  // anchor at the object's own extreme along the jet axis: the nozzle end
  const bb = new THREE.Box3().setFromObject(obj);
  const d = new THREE.Vector3(PUFF_DIR[0], PUFF_DIR[1], PUFF_DIR[2]).normalize();
  const c = bb.getCenter(new THREE.Vector3());
  const hs = bb.getSize(new THREE.Vector3()).multiplyScalar(0.5);
  const reach = Math.abs(d.x) * hs.x + Math.abs(d.y) * hs.y + Math.abs(d.z) * hs.z;
  windAnchor = new THREE.Vector3(c.x + d.x * reach, c.y + d.y * reach, c.z + d.z * reach);

  const mat = new THREE.MeshBasicMaterial({
    color: 0x9AA0A6, transparent: true, opacity: 1, side: THREE.DoubleSide, depthWrite: false,
  });
  for (let w = 0; w < WAVES; w++) {
    // A stroke of CONSTANT weight following a shallow sine, with a curl at the tip. Built as a
    // ribbon in the XY plane so it always reads as a drawn line.
    const len = PUFF_SIZE * (5.4 - w * 0.5);
    const half = PUFF_SIZE * 0.115;                 // constant stroke weight
    const N = 48;
    const pos = [], idx = [];
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      const x = u * len;
      // shallow sine, plus a curl that only bites at the very end
      const curl = Math.max(0, (u - 0.78) / 0.22);
      const y = Math.sin(u * Math.PI * 2.1) * PUFF_SIZE * 0.30 * (0.35 + u * 0.9)
              - curl * curl * PUFF_SIZE * 0.85;
      pos.push(x, y + half, 0, x, y - half, 0);
      if (i < N) {
        const a = i * 2;
        idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    const m = new THREE.Mesh(g, mat.clone());
    m.userData.order = w;
    m.userData.row = (w - (WAVES - 1) / 2);          // stack across the jet
    m.visible = false;
    scene.add(m);                                     // SCENE, not pivot: it never turns
    windLines.push(m);
  }
}

// p is the clip's own progress. The lines exist only while the icon is turning.
function setPuff(p) {
  if (!PUFF || !windLines.length) return;
  for (const m of windLines) {
    if (p <= 0 || p >= 1) { m.visible = false; continue; }
    const lead = m.userData.order * 0.10;
    const local = p * 1.35 - lead;
    if (local < 0 || local > 1) { m.visible = false; continue; }
    // sit beside the icon, at the height of the anchor, always facing the camera
    const a = windAnchor.clone();
    pivotHolder.localToWorld(a);
    // sit them OFF THE NOZZLE END, left of the icon, at a size that stays a supporting mark
    m.position.set(-1.02 - PUFF_SIZE * 1.9, a.y + m.userData.row * PUFF_SIZE * 0.62, 0.45);
    m.quaternion.copy(camera.quaternion);
    const s = (0.58 + local * 0.16);
    m.scale.set(s, s, s);
    const shape = Math.min(1, local / 0.18) * Math.min(1, (1 - local) / 0.30);
    m.material.opacity = Math.max(0, Math.min(1, 1.5 * shape));
    m.visible = m.material.opacity > 0.02;
  }
}
window.__SAT = ${opt.sat};
window.__HUE = ${opt.hueShift === null ? 'null' : opt.hueShift};
window.__SATMUL = ${opt.satMul};
window.__VALMUL = ${opt.valMul};
window.__NEUTVAL = ${opt.neutralVal === null ? 'null' : opt.neutralVal};
const TILT = ${opt.tilt} * Math.PI / 180;
const BOB = ${opt.bob};
window.__renderAt = (rad, puffT, t, wt) => {
  pivot.rotation.y = rad;
  // One full sine over the turn: level at the start, up, level, down, level at the end. Because it
  // is a whole period the last frame lands exactly on the first, so the loop still closes.
  const phase = (t === undefined ? 0 : t) * Math.PI * 2;
  pivot.rotation.x = TILT * Math.sin(phase);
  if (window.__waveAir) window.__waveAir(wt === undefined ? 0 : wt);
  pivot.position.y = BOB * Math.sin(phase * 2);
  setPuff(puffT === undefined ? 0 : puffT);
  renderer.render(scene, camera);
  if (window.__SAT === 1 && window.__HUE === null && window.__NEUTVAL === null) return renderer.domElement.toDataURL("image/png");
  // Lift saturation on the colour channels only. Alpha is copied through untouched, so the
  // transparent edge never gets a halo.
  const c = renderer.domElement, g = document.createElement("canvas");
  g.width = c.width; g.height = c.height;
  const ctx = g.getContext("2d"); ctx.drawImage(c, 0, 0);
  const img = ctx.getImageData(0, 0, g.width, g.height), d = img.data, k = window.__SAT;
  const HUE = window.__HUE, SM = window.__SATMUL, VM = window.__VALMUL;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue;
    if (HUE !== null) {
      // rgb -> hsv, retarget the hue of coloured pixels only, hsv -> rgb
      const r0 = d[i] / 255, g0 = d[i + 1] / 255, b0 = d[i + 2] / 255;
      const mx = Math.max(r0, g0, b0), mn = Math.min(r0, g0, b0), df = mx - mn;
      const sat = mx === 0 ? 0 : df / mx;
      if (sat < 0.22 && window.__NEUTVAL !== null) {
        // drive the frame toward a flat grey at the target value, keeping its own shading relief so
        // it still reads as a lit 3D object rather than as a paper cut-out
        const rel = mx > 0 ? mx : 0;
        const V = Math.max(0, Math.min(1, window.__NEUTVAL * (0.42 + 0.58 * rel))) * 255;
        d[i] = V; d[i + 1] = V; d[i + 2] = V;
      }
      if (sat >= 0.22) {
        const S = Math.max(0, Math.min(1, sat * SM)), V = Math.max(0, Math.min(1, mx * VM));
        const h6 = HUE * 6, ii = Math.floor(h6), f = h6 - ii;
        const pv = V * (1 - S), q = V * (1 - S * f), t = V * (1 - S * (1 - f));
        let R, G, B;
        if (ii % 6 === 0) { R = V; G = t; B = pv; }
        else if (ii % 6 === 1) { R = q; G = V; B = pv; }
        else if (ii % 6 === 2) { R = pv; G = V; B = t; }
        else if (ii % 6 === 3) { R = pv; G = q; B = V; }
        else if (ii % 6 === 4) { R = t; G = pv; B = V; }
        else { R = V; G = pv; B = q; }
        d[i] = R * 255; d[i + 1] = G * 255; d[i + 2] = B * 255;
      }
    }
    const l = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
    d[i]     = Math.max(0, Math.min(255, l + (d[i]     - l) * k));
    d[i + 1] = Math.max(0, Math.min(255, l + (d[i + 1] - l) * k));
    d[i + 2] = Math.max(0, Math.min(255, l + (d[i + 2] - l) * k));
  }
  ctx.putImageData(img, 0, 0);
  return g.toDataURL("image/png");
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
  // k was 0.22, which made the first frames of the turn advance 0.000155 while the middle advanced
  // 0.009358: a SIXTY-FOLD difference. The object nearly stops, then surges, and the eye reads that
  // stall-then-catch-up as lagging and going backwards. It was never a dropped frame.
  // At 0.03 the ratio is 8.2x, and the captured reference measured NEAR-LINEAR anyway
  // (RMS 0.040 for linear against 0.127 for ease-out), so a shallow ease is also the truer match.
  const k = 0.03;                                   // fraction of the sweep spent easing
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
  const rad = (opt.startAngle * Math.PI / 180) + t * opt.turns * Math.PI * 2;
  // The puff opens with the sweep and runs to the LAST frame, so it outlives the body settling by
  // the hold-out, which at the defaults is the 400ms the reference's tree overhangs its house by.
  const puffT = opt.puff
    ? (f < opt.holdIn ? 0 : (f - opt.holdIn) / (opt.frames - 1 - opt.holdIn))
    : 0;
  const waveT = f / (opt.frames - 1);   // runs across the WHOLE clip, holds included
  const dataUrl = await page.evaluate(([r, pt, tt, wt]) => window.__renderAt(r, pt, tt, wt), [rad, puffT, t, waveT]);
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
