import { chromium } from "@playwright/test";
const URL = "http://127.0.0.1:52933/en/dev/terminal";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 402, height: 1400 } });
await page.goto(URL, { waitUntil: "networkidle", timeout: 20000 });
await page.waitForTimeout(500);

const data = await page.evaluate(() => {
  const container = document.querySelector('div.fixed.inset-0');
  const scroller = container.querySelector('.mx-auto.flex.w-full.max-w-\\[760px\\].flex-col.gap-8');
  const sectionGaps = [];
  if (scroller) {
    const kids = Array.from(scroller.children);
    for (let i = 1; i < kids.length; i++) {
      const prev = kids[i-1].getBoundingClientRect();
      const cur = kids[i].getBoundingClientRect();
      sectionGaps.push(Math.round(cur.top - prev.bottom));
    }
  }
  // gap between Waiting rows
  const waitingRows = Array.from(document.querySelectorAll('.mt-4.flex.flex-col.gap-2 > div'));
  const rowGaps = [];
  for (let i = 1; i < waitingRows.length; i++) {
    const prev = waitingRows[i-1].getBoundingClientRect();
    const cur = waitingRows[i].getBoundingClientRect();
    rowGaps.push(Math.round(cur.top - prev.bottom));
  }
  // touch target heights of interactive controls
  const buttons = Array.from(document.querySelectorAll('div.fixed.inset-0 button, div.fixed.inset-0 [role="button"]'));
  const targets = buttons.map(b => {
    const r = b.getBoundingClientRect();
    return { text: (b.textContent||"").slice(0,20), w: Math.round(r.width), h: Math.round(r.height) };
  });
  return { sectionGaps, rowGaps, targets };
});
console.log(JSON.stringify(data, null, 2));
await browser.close();
