import { chromium } from "@playwright/test";
const URL = "http://127.0.0.1:52933/en/dev/terminal";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 402, height: 1400 } });
await page.goto(URL, { waitUntil: "networkidle", timeout: 20000 });
await page.waitForTimeout(500);

const result = await page.evaluate(() => {
  const root = document.querySelector('div.fixed.inset-0');
  const pauseBtn = Array.from(root.querySelectorAll('button')).find(b => b.textContent.trim() === 'Pause queue');
  const startSpan = root.querySelector('span[role="button"]');
  function box(el) {
    if (!el) return "NOT FOUND IN SCOPE";
    const r = el.getBoundingClientRect();
    return { w: Math.round(r.width), h: Math.round(r.height) };
  }
  return {
    pauseQueue: box(pauseBtn),
    startSpan: box(startSpan),
    docPauseCount: document.querySelectorAll('button').length,
    allPauseQueueTexts: Array.from(document.querySelectorAll('button')).filter(b=>b.textContent.trim()==='Pause queue').length,
  };
});
console.log(JSON.stringify(result, null, 2));
await browser.close();
