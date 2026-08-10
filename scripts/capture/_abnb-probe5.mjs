import { chromium } from "playwright";
const browser = await chromium.launch({ headless: true });
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const INIT = () => {
  window.__log = []; const t0 = performance.now();
  const P = HTMLMediaElement.prototype;
  const origPlay = P.play;
  P.play = function () { window.__log.push({ t: Math.round(performance.now()-t0), ev: "play()", nm: (this.currentSrc||this.src||"").split("/").pop(), ct: +(this.currentTime||0).toFixed(2) }); return origPlay.apply(this, arguments); };
  const ctDesc = Object.getOwnPropertyDescriptor(P, "currentTime");
  Object.defineProperty(P, "currentTime", { get() { return ctDesc.get.call(this); },
    set(v) { window.__log.push({ t: Math.round(performance.now()-t0), ev: "set ct", nm: (this.currentSrc||this.src||"").split("/").pop(), ct: +Number(v).toFixed(2) }); return ctDesc.set.call(this, v); } });
  const wire = (v) => { if (v.__w) return; v.__w = 1;
    ["loadeddata","play","pause","ended"].forEach(ev => v.addEventListener(ev, () =>
      window.__log.push({ t: Math.round(performance.now()-t0), ev, nm: (v.currentSrc||v.src||"").split("/").pop(), ct: +v.currentTime.toFixed(2) }))); };
  const obs = () => { document.querySelectorAll("video").forEach(wire); };
  document.addEventListener("DOMContentLoaded", () => { obs(); new MutationObserver(obs).observe(document.documentElement, { childList: true, subtree: true }); });
  new MutationObserver(obs).observe(document.documentElement, { childList: true, subtree: true });
};
for (let i = 1; i <= 8; i++) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 950 }, locale: "en-US", userAgent: UA });
  await ctx.addInitScript(INIT);
  const page = await ctx.newPage();
  const res = await page.goto("https://www.airbnb.com/?locale=en", { waitUntil: "domcontentloaded", timeout: 60000 });
  if (!res || res.status() >= 400) { console.log(`attempt ${i}: REFUSED ${res && res.status()}`); await ctx.close(); continue; }
  await page.waitForTimeout(8000);
  if ((await page.evaluate(() => document.body.querySelectorAll("*").length)) < 40) { console.log(`attempt ${i}: REFUSED nothing rendered`); await ctx.close(); continue; }
  const nv = await page.evaluate(() => document.querySelectorAll("video").length);
  console.log(`attempt ${i}: videos=${nv}`);
  if (!nv) { await ctx.close(); continue; }
  console.log("\n=== LOAD-TIME LOG ===");
  (await page.evaluate(() => window.__log)).forEach(e => console.log(`  ${String(e.t).padStart(6)}ms ${e.ev.padEnd(11)} ct=${e.ct} ${e.nm}`));
  // now hover over the tab strip region and the icon itself
  const box = await page.evaluate(() => { const v = document.querySelector("video"); const r = v.getBoundingClientRect(); return { x: Math.round(r.x+r.width/2), y: Math.round(r.y+r.height/2) }; });
  await page.evaluate(() => window.__log.push({ t: -1, ev: "MARK", nm: "hover-icon", ct: 0 }));
  await page.mouse.move(box.x, box.y); await page.waitForTimeout(2200);
  await page.evaluate(() => window.__log.push({ t: -1, ev: "MARK", nm: "click-services", ct: 0 }));
  const svc = await page.evaluate(() => { const els=[...document.querySelectorAll("a,button,[role='button']")].filter(e=>/^services$/i.test((e.innerText||"").trim().split("\n")[0])); const r=els[0]?.getBoundingClientRect(); return r?{x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}:null; });
  if (svc) { await page.mouse.click(svc.x, svc.y); await page.waitForTimeout(2500); }
  console.log("\n=== FULL LOG (after hover + click Services) ===");
  (await page.evaluate(() => window.__log)).forEach(e => console.log(`  ${(e.t===-1?"  MARK":String(e.t).padStart(6)+"ms")} ${e.ev.padEnd(11)} ct=${e.ct} ${e.nm}`));
  await ctx.close(); break;
}
await browser.close();
