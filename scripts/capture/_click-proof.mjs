import { chromium } from "playwright";
const URL = "http://127.0.0.1:3222/_research/solen-chair-icon";
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
const res = await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 60000 });
if (!res || res.status() >= 400) { console.log("REFUSED status", res && res.status()); process.exit(1); }
if (page.url().split("?")[0] !== URL) { console.log("REFUSED redirected ->", page.url()); process.exit(1); }
await page.waitForTimeout(3000);
const els = await page.evaluate(() => document.body.querySelectorAll("*").length);
if (els < 40) { console.log("REFUSED nothing rendered"); process.exit(1); }

for (const idx of [0, 1]) {                       // 3 = the Solen chair, 0 = an Airbnb control
  const cell = page.locator("#set .cell").nth(idx);
  const name = await cell.locator("video").evaluate(v => { v.pause(); v.currentTime = 0; return v.src.split("/").pop(); });
  const before = await cell.locator("video").evaluate(v => +v.currentTime.toFixed(3));
  await cell.click();                              // a REAL trusted click, not a synthetic event
  await page.waitForTimeout(700);
  const mid = await cell.locator("video").evaluate(v => +v.currentTime.toFixed(3));
  await page.waitForTimeout(1400);
  const end = await cell.locator("video").evaluate(v => ({ t: +v.currentTime.toFixed(3), paused: v.paused, dur: +v.duration.toFixed(3) }));
  console.log(`${name}: before=${before} mid=${mid} end=${end.t}/${end.dur} paused=${end.paused}`);
  console.log(`   ADVANCED=${mid > before}   PARKED_ON_LAST_FRAME=${Math.abs(end.t - end.dur) < 0.05 && end.paused}`);
}
await browser.close();
