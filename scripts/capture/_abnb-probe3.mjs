import { chromium } from "playwright";
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 950 }, locale: "en-US",
  userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36" });
const page = await ctx.newPage();
const res = await page.goto("https://www.airbnb.com/?locale=en", { waitUntil: "domcontentloaded", timeout: 60000 });
if (!res || res.status() >= 400) { console.log("REFUSED status", res && res.status()); process.exit(1); }
await page.waitForTimeout(7000);
if ((await page.evaluate(() => document.body.querySelectorAll("*").length)) < 40) { console.log("REFUSED nothing rendered"); process.exit(1); }

await page.evaluate(() => {
  window.__log = [];
  const t0 = performance.now();
  document.querySelectorAll("video").forEach((v, i) => {
    const nm = (v.currentSrc||v.src||"").split("/").pop();
    v.__nm = nm;
    ["play","pause","ended","seeked","timeupdate"].forEach(ev => v.addEventListener(ev, () => {
      if (ev === "timeupdate" && v.currentTime > 0.05) return;
      window.__log.push({ t: Math.round(performance.now()-t0), ev, nm, ct: +v.currentTime.toFixed(2) });
    }));
  });
});

const inv = async (label) => {
  const s = await page.evaluate(() => [...document.querySelectorAll("video")].map(v => {
    const r = v.getBoundingClientRect(); const cs = getComputedStyle(v);
    const p = v.parentElement;
    return { nm: (v.currentSrc||v.src||"").split("/").pop(), x: Math.round(r.x), y: Math.round(r.y),
      w: Math.round(r.width), h: Math.round(r.height), loop: v.loop, autoplay: v.autoplay, muted: v.muted,
      playsInline: v.playsInline, preload: v.preload, paused: v.paused, ct: +v.currentTime.toFixed(2), dur: +(v.duration||0).toFixed(2),
      opacity: cs.opacity, display: cs.display, visibility: cs.visibility, transition: cs.transition === "all 0s ease 0s" ? "" : cs.transition,
      parentCls: (p?.className||"").toString().slice(0,60) };
  }));
  console.log(`\n--- ${label} ---`);
  s.forEach(v => console.log(`  ${v.nm.padEnd(30)} ${v.w}x${v.h} @${v.x},${v.y} op=${v.opacity} disp=${v.display} paused=${v.paused} ct=${v.ct} dur=${v.dur} loop=${v.loop} autoplay=${v.autoplay} preload=${v.preload} tr="${v.transition}"`));
  return s;
};

const base = await inv("REST");
// tabs
const tabs = await page.evaluate(() => [...document.querySelectorAll("a,button,[role='tab'],[role='button']")]
  .map(e => { const r = e.getBoundingClientRect(); return { txt: (e.innerText||"").trim().slice(0,28), x: Math.round(r.x+r.width/2), y: Math.round(r.y+r.height/2), w: Math.round(r.width), h: Math.round(r.height) }; })
  .filter(t => t.y < 90 && t.w > 40 && /home|experience|service/i.test(t.txt)));
console.log("\nTABS:", JSON.stringify(tabs));

for (const t of tabs) {
  await page.mouse.move(t.x, t.y);
  await page.waitForTimeout(1200);
  await inv(`HOVER "${t.txt}"`);
  await page.mouse.move(20, 600); await page.waitForTimeout(900);
}
for (const t of tabs) {
  await page.mouse.click(t.x, t.y);
  await page.waitForTimeout(400);
  await inv(`CLICK+400ms "${t.txt}"`);
  await page.waitForTimeout(1600);
  await inv(`CLICK+2000ms "${t.txt}"`);
}
const log = await page.evaluate(() => window.__log);
console.log("\n=== VIDEO EVENT LOG ===");
log.forEach(e => console.log(`  ${String(e.t).padStart(6)}ms  ${e.ev.padEnd(9)} ct=${e.ct}  ${e.nm}`));
await browser.close();
