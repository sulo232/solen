// Temporary capture harness for the search-overlay CLOSE.
// CDP Page.startScreencast (real compositor frames) + a per-frame rAF DOM trace on the SAME clock.
// Not a screenshot-poll loop: a poll loop already cleared a real close-animation bug wrongly.
// Usage: node _closecap.mjs <w> <h> <outdir>
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const W = Number(process.argv[2] || 375);
const H = Number(process.argv[3] || 812);
const OUT = process.argv[4] || `/tmp/closecap_${W}x${H}`;
const BASE = "http://127.0.0.1:57223";

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true, args: ["--force-device-scale-factor=1", "--disable-lcd-text"] });
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
// Pre-seed cookie consent so the banner never paints into the measurement (harness only, no product change).
await ctx.addInitScript(() => {
  try {
    localStorage.setItem("solen-cookie-consent", JSON.stringify({ analytics: true, marketing: true, ts: Date.now() }));
  } catch { /* private mode: banner may show, reported by the analyzer */ }
});
const page = await ctx.newPage();
page.on("pageerror", (e) => console.log("PAGEERROR:", e.message));

await page.goto(`${BASE}/de`, { waitUntil: "networkidle", timeout: 120000 });
await page.waitForTimeout(1500);

// The home search pill (opens the overlay in place, R1).
const pill = page.locator('button[aria-label="Suche bearbeiten"]').first();
await pill.waitFor({ state: "visible", timeout: 30000 });

// Resting geometry of the pill's own visible box: this IS `originRect`
// (HomeSearchPill.tsx:111, pillRef), the rect the close morph must shrink back into.
const pillRect = await page.evaluate(() => {
  const b = document.querySelector('button[aria-label="Suche bearbeiten"]');
  const box = b && b.closest("div.rounded-pill");
  if (!box) return null;
  const r = box.getBoundingClientRect();
  return { x: +r.x.toFixed(2), y: +r.y.toFixed(2), w: +r.width.toFixed(2), h: +r.height.toFixed(2) };
});
console.log("PILL_RECT", JSON.stringify(pillRect));

await pill.click();
await page.waitForTimeout(1400); // fully settled open

// Arm the rAF DOM trace. It runs on Date.now(), the same epoch clock the screencast metadata uses.
await page.evaluate(() => {
  window.__trace = [];
  window.__tracing = true;
  const pick = () => {
    const scrim = document.querySelector('div.fixed.inset-0.backdrop-blur-xl');
    // The sheet wrapper is the fixed positioned motion.div that is not the scrim and holds the white card.
    const fixed = Array.from(document.querySelectorAll("div")).filter((d) => {
      const cs = getComputedStyle(d);
      return cs.position === "fixed" && d !== scrim && Number(cs.zIndex) >= 100;
    });
    const sheet = fixed.find((d) => d.querySelector(".bg-white")) || fixed[0] || null;
    const paper = sheet ? sheet.querySelector(".bg-white") : null;
    return { scrim, sheet, paper };
  };
  const step = () => {
    if (!window.__tracing) return;
    const { scrim, sheet, paper } = pick();
    const rr = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return { x: +r.x.toFixed(2), y: +r.y.toFixed(2), w: +r.width.toFixed(2), h: +r.height.toFixed(2) }; };
    window.__trace.push({
      t: Date.now(),
      scrimOp: scrim ? +getComputedStyle(scrim).opacity : null,
      sheet: rr(sheet),
      sheetOp: sheet ? +getComputedStyle(sheet).opacity : null,
      paper: rr(paper),
      paperOp: paper ? +getComputedStyle(paper).opacity : null,
      inDom: !!sheet,
    });
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
});

const cdp = await ctx.newCDPSession(page);
const frames = [];
cdp.on("Page.screencastFrame", async (f) => {
  frames.push({ t: f.metadata.timestamp * 1000, data: f.data });
  try { await cdp.send("Page.screencastFrameAck", { sessionId: f.sessionId }); } catch { /* stream ended */ }
});
await cdp.send("Page.startScreencast", { format: "png", everyNthFrame: 1, maxWidth: W, maxHeight: H });
await page.waitForTimeout(250); // let the stream warm up on the settled open

// Close via the X, and stamp the click on the same epoch clock.
// NOTE: two buttons on this page carry aria-label "Schliessen"; the overlay's own X is the
// z-[102] one (SearchOverlay.tsx close-X render). Picking by label alone clicks the other and
// the overlay never closes, which is how the first capture run produced zero motion frames.
const clickT = await page.evaluate(() => {
  const x = Array.from(document.querySelectorAll("button")).find(
    (b) => b.className && b.className.toString().includes("z-[102]"),
  );
  if (!x) throw new Error("overlay close X (z-[102]) not found");
  const t = Date.now();
  x.click();
  return t;
});
await page.waitForTimeout(1200);
await cdp.send("Page.stopScreencast");
const trace = await page.evaluate(() => { window.__tracing = false; return window.__trace; });

// Settled-closed reference frame: what the page looks like with no overlay at all.
await page.waitForTimeout(400);
const settled = await page.screenshot({ type: "png" });
fs.writeFileSync(path.join(OUT, "settled.png"), settled);

const rels = frames.map((f) => f.t - clickT);
console.log(`RAW_FRAMES ${frames.length} relMin ${rels.length ? Math.round(Math.min(...rels)) : "n/a"} relMax ${rels.length ? Math.round(Math.max(...rels)) : "n/a"}`);

let n = 0;
const idx = [];
for (const f of frames) {
  const rel = f.t - clickT;
  if (rel < -120 || rel > 900) continue;
  const name = `f${String(n).padStart(3, "0")}_${Math.round(rel)}.png`;
  fs.writeFileSync(path.join(OUT, name), Buffer.from(f.data, "base64"));
  idx.push({ file: name, t: +rel.toFixed(1) });
  n++;
}
fs.writeFileSync(path.join(OUT, "meta.json"), JSON.stringify({
  viewport: { w: W, h: H }, clickT, pillRect,
  frames: idx,
  trace: trace.map((r) => ({ ...r, t: +(r.t - clickT).toFixed(1) })).filter((r) => r.t >= -60 && r.t <= 900),
}, null, 2));
console.log(`FRAMES ${n}  TRACE ${trace.length}  OUT ${OUT}`);
await browser.close();
