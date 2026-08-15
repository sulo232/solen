import { chromium } from "@playwright/test";
const URL = "http://127.0.0.1:52933/en/dev/terminal";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 402, height: 1400 } });
page.setDefaultTimeout(4000);
await page.goto(URL, { waitUntil: "networkidle", timeout: 20000 });
await page.waitForTimeout(500);

const colors = await page.evaluate(() => {
  function css(sel, prop) {
    const el = document.querySelector(sel);
    return el ? getComputedStyle(el)[prop] : "NOT FOUND";
  }
  return {
    pauseQueueColor: css('div.fixed.inset-0 button.text-s-accent', 'color'),
    liveDotBg: css('div.fixed.inset-0 .bg-s-success', 'backgroundColor'),
    freeLabelColor: (() => {
      const spans = Array.from(document.querySelectorAll('div.fixed.inset-0 p'));
      const el = spans.find(s => s.textContent.trim() === 'Free');
      return el ? getComputedStyle(el).color : "NOT FOUND";
    })(),
    inkAnchorColor: css('div.fixed.inset-0 p.font-display', 'color'),
    quietSelectedBg: (() => {
      const btn = Array.from(document.querySelectorAll('div.fixed.inset-0 button')).find(b => b.textContent.trim() === 'Quiet');
      return btn ? getComputedStyle(btn).backgroundColor : "NOT FOUND";
    })(),
  };
});
console.log(JSON.stringify(colors, null, 2));

await page.locator('div.fixed.inset-0 button:has-text("A-0")').first().click();
await page.waitForTimeout(150);
const cancelColor = await page.evaluate(() => {
  const el = Array.from(document.querySelectorAll('div.fixed.inset-0 button')).find(b => b.textContent.trim() === 'Cancel');
  return el ? getComputedStyle(el).color : "NOT FOUND";
});
console.log("cancelColor", cancelColor);

await page.locator('button:has-text("New booking")').click();
await page.waitForTimeout(300);
const acceptBg = await page.evaluate(() => {
  const el = Array.from(document.querySelectorAll('div.fixed.inset-0 button')).find(b => b.textContent.trim() === 'Accept');
  return el ? getComputedStyle(el).backgroundColor : "NOT FOUND";
});
console.log("acceptBg", acceptBg);

await browser.close();
