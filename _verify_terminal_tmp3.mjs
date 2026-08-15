import { chromium } from "@playwright/test";
const URL = "http://127.0.0.1:52933/en/dev/terminal";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 402, height: 874 } });
await page.goto(URL, { waitUntil: "networkidle", timeout: 20000 });
await page.waitForTimeout(500);

const checks = await page.evaluate(() => {
  function describe(x,y) {
    const el = document.elementFromPoint(x,y);
    if (!el) return null;
    return { tag: el.tagName, cls: el.className?.toString().slice(0,80), text: (el.textContent||"").slice(0,40) };
  }
  return {
    solenLogoPoint: describe(20, 349),
    stayInLoopPoint: describe(20, 168),
    bottomNavPoint: describe(43, 841),
    bottomLeftWidget: describe(38, 836),
  };
});
console.log(JSON.stringify(checks, null, 2));

// identify the floating circle widget
const widgetInfo = await page.evaluate(() => {
  const el = document.elementFromPoint(38, 836);
  if (!el) return null;
  let cur = el;
  const chain = [];
  while (cur && chain.length < 6) {
    chain.push({ tag: cur.tagName, id: cur.id, cls: cur.className?.toString?.().slice(0,80) });
    cur = cur.parentElement;
  }
  return chain;
});
console.log("WIDGET CHAIN", JSON.stringify(widgetInfo, null, 2));

await browser.close();
