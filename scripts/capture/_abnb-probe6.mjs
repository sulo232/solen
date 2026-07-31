import { chromium } from "playwright";
const browser = await chromium.launch({ headless: true });
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const INIT = () => {
  window.__log = []; const t0 = performance.now();
  const P = HTMLMediaElement.prototype, origPlay = P.play;
  P.play = function () { window.__log.push({ t: Math.round(performance.now()-t0), ev: "play()", nm: (this.currentSrc||this.src||"").split("/").pop() }); return origPlay.apply(this, arguments); };
  const wire = (v) => { if (v.__w) return; v.__w = 1;
    ["play","ended"].forEach(ev => v.addEventListener(ev, () => window.__log.push({ t: Math.round(performance.now()-t0), ev, nm: (v.currentSrc||v.src||"").split("/").pop(), ct: +v.currentTime.toFixed(2) }))); };
  new MutationObserver(() => document.querySelectorAll("video").forEach(wire)).observe(document.documentElement, { childList: true, subtree: true });
};
for (let i = 1; i <= 10; i++) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 950 }, locale: "en-US", userAgent: UA, recordVideo: { dir: "/tmp/claude/abnb-rec", size: { width: 1440, height: 950 } } });
  await ctx.addInitScript(INIT);
  const page = await ctx.newPage();
  const res = await page.goto("https://www.airbnb.com/?locale=en", { waitUntil: "domcontentloaded", timeout: 60000 });
  if (!res || res.status() >= 400) { console.log(`attempt ${i}: REFUSED ${res && res.status()}`); await ctx.close(); continue; }
  await page.waitForTimeout(7000);
  if ((await page.evaluate(() => document.body.querySelectorAll("*").length)) < 40) { console.log(`attempt ${i}: REFUSED nothing rendered`); await ctx.close(); continue; }
  const nv = await page.evaluate(() => document.querySelectorAll("video").length);
  console.log(`attempt ${i}: videos=${nv}`);
  if (!nv) { await ctx.close(); continue; }
  const tabs = await page.evaluate(() => [...document.querySelectorAll("a,button,[role='button'],[role='tab'],[role='radio'],label,div")]
    .map(e => { const r = e.getBoundingClientRect(); const txt=(e.innerText||"").trim().split("\n")[0]; return { txt, x: Math.round(r.x+r.width/2), y: Math.round(r.y+r.height/2), w: Math.round(r.width), h: Math.round(r.height) }; })
    .filter(t => t.y < 110 && t.w >= 60 && t.w < 260 && t.h < 90 && /^(homes|experiences|services)$/i.test(t.txt))
    .filter((t,i,a) => a.findIndex(z=>z.txt===t.txt)===i));
  console.log("TABS:", JSON.stringify(tabs));
  for (const t of tabs) {
    await page.evaluate((n) => window.__log.push({ t: -1, ev: "CLICK", nm: n }), t.txt);
    await page.mouse.click(t.x, t.y);
    await page.waitForTimeout(2600);
  }
  console.log("\n=== LOG ===");
  (await page.evaluate(() => window.__log)).forEach(e => console.log(`  ${(e.t===-1?">>>>>>":String(e.t).padStart(6)+"ms")} ${e.ev.padEnd(7)} ${e.nm}`));
  await ctx.close(); break;
}
await browser.close();
