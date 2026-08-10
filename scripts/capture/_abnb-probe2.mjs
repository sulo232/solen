import { chromium } from "playwright";
import { writeFileSync } from "node:fs";
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 950 }, locale: "en-US",
  userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36" });
const all = [];
ctx.on("response", r => all.push({ u: r.url(), ct: (r.headers()["content-type"]||"").split(";")[0], s: r.status() }));
const page = await ctx.newPage();
const res = await page.goto("https://www.airbnb.com/?locale=en", { waitUntil: "domcontentloaded", timeout: 60000 });
if (!res || res.status() >= 400) { console.log("REFUSED", res && res.status()); process.exit(1); }
await page.waitForTimeout(7000);
const els = await page.evaluate(() => document.body.querySelectorAll("*").length);
if (els < 40) { console.log("REFUSED nothing rendered"); process.exit(1); }
const hit = await page.evaluate(() => {
  const html = document.documentElement.outerHTML;
  const idx = []; let i = -1;
  const re = /lava/gi; let m;
  while ((m = re.exec(html)) && idx.length < 40) idx.push(html.slice(Math.max(0,m.index-120), m.index+160));
  return { count: (html.match(/lava/gi)||[]).length, samples: idx.slice(0,12) };
});
console.log("HTML 'lava' occurrences:", hit.count);
hit.samples.forEach((s,i)=>console.log(`  [${i}] ...${s.replace(/\s+/g," ")}...`));
// nav / tab bar imgs
const nav = await page.evaluate(() => {
  const out = [];
  document.querySelectorAll("img, picture source, video, canvas").forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.top < 260 && r.width > 0 && r.width < 260) out.push({ tag: el.tagName.toLowerCase(), w: Math.round(r.width), h: Math.round(r.height), x: Math.round(r.x), y: Math.round(r.y),
      src: (el.currentSrc || el.src || el.srcset || "").slice(0,220), alt: el.alt || "" });
  });
  return out;
});
console.log("\nTOP-AREA MEDIA (y<260):"); console.log(JSON.stringify(nav, null, 1).slice(0, 4000));
console.log("\nALL REQUESTS matching lava|webp|mp4|webm|riv|json-anim:");
console.log(all.filter(r=>/lava|\.webp|\.mp4|\.webm|\.riv|animat/i.test(r.u)).slice(0,40).map(r=>`${r.s} ${r.ct} ${r.u.slice(0,180)}`).join("\n") || "(none)");
writeFileSync("/tmp/claude/abnb-requests.json", JSON.stringify(all, null, 1));
console.log("\ntotal requests:", all.length);
await page.screenshot({ path: "/tmp/claude/abnb-home-top.png", clip: { x:0, y:0, width:1440, height:400 } });
await browser.close();
