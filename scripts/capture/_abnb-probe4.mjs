import { chromium } from "playwright";
const browser = await chromium.launch({ headless: true });
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

async function attempt(n) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 950 }, locale: "en-US", userAgent: UA });
  const page = await ctx.newPage();
  const res = await page.goto("https://www.airbnb.com/?locale=en", { waitUntil: "domcontentloaded", timeout: 60000 });
  if (!res || res.status() >= 400) { console.log(`attempt ${n}: REFUSED status ${res && res.status()}`); await ctx.close(); return null; }
  await page.waitForTimeout(6500);
  const els = await page.evaluate(() => document.body.querySelectorAll("*").length);
  if (els < 40) { console.log(`attempt ${n}: REFUSED nothing rendered`); await ctx.close(); return null; }
  const nv = await page.evaluate(() => document.querySelectorAll("video").length);
  console.log(`attempt ${n}: els=${els} videos=${nv}`);
  if (nv === 0) { await ctx.close(); return null; }
  return { ctx, page };
}

let got = null;
for (let i = 1; i <= 8 && !got; i++) got = await attempt(i);
if (!got) { console.log("NO ICON VARIANT after 8 attempts (A/B: media_web_homepage_enable_lava_search_icons)"); await browser.close(); process.exit(0); }
const { page } = got;

await page.evaluate(() => {
  window.__log = []; const t0 = performance.now();
  const wire = (v) => {
    if (v.__w) return; v.__w = 1;
    ["play","pause","ended"].forEach(ev => v.addEventListener(ev, () =>
      window.__log.push({ t: Math.round(performance.now()-t0), ev, nm: (v.currentSrc||v.src||"").split("/").pop(), ct: +v.currentTime.toFixed(2) })));
  };
  document.querySelectorAll("video").forEach(wire);
  new MutationObserver(() => document.querySelectorAll("video").forEach(wire)).observe(document.body, { childList: true, subtree: true });
});

const inv = async (label) => {
  const s = await page.evaluate(() => [...document.querySelectorAll("video")].map(v => {
    const r = v.getBoundingClientRect(); const cs = getComputedStyle(v);
    return { nm: (v.currentSrc||v.src||"").split("/").pop(), x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width),
      loop: v.loop, autoplay: v.autoplay, preload: v.preload, paused: v.paused, ct: +v.currentTime.toFixed(2), dur: +(v.duration||0).toFixed(2),
      op: cs.opacity, disp: cs.display, vis: cs.visibility, tr: cs.transition === "all 0s ease 0s" ? "" : cs.transition, tf: cs.transform };
  }));
  console.log(`\n--- ${label} ---`);
  s.forEach(v => console.log(`  ${v.nm.padEnd(30)} w=${v.w} @${v.x},${v.y} op=${v.op} disp=${v.disp} paused=${v.paused} ct=${v.ct} dur=${v.dur} loop=${v.loop} auto=${v.autoplay} pre=${v.preload} tr="${v.tr}" tf=${v.tf}`));
};

await inv("REST");
const tabs = await page.evaluate(() => [...document.querySelectorAll("a,button,[role='tab'],[role='radio'],[role='button']")]
  .map(e => { const r = e.getBoundingClientRect(); return { txt:(e.innerText||"").trim().replace(/\n.*/,"").slice(0,20), x: Math.round(r.x+r.width/2), y: Math.round(r.y+r.height/2), w: Math.round(r.width) }; })
  .filter(t => t.y < 100 && t.w > 40 && /^(homes|experiences|services)$/i.test(t.txt)));
console.log("\nTABS:", JSON.stringify(tabs));
for (const t of tabs) {
  await page.mouse.move(t.x, t.y); await page.waitForTimeout(1400); await inv(`HOVER ${t.txt}`);
  await page.mouse.move(20, 700); await page.waitForTimeout(1000); await inv(`UNHOVER ${t.txt}`);
}
for (const t of tabs) {
  await page.mouse.click(t.x, t.y); await page.waitForTimeout(300); await inv(`CLICK+300 ${t.txt}`);
  await page.waitForTimeout(1500); await inv(`CLICK+1800 ${t.txt}`);
}
console.log("\n=== VIDEO EVENT LOG ===");
(await page.evaluate(() => window.__log)).forEach(e => console.log(`  ${String(e.t).padStart(6)}ms ${e.ev.padEnd(6)} ct=${e.ct} ${e.nm}`));
await browser.close();
