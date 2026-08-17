import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.goto('http://127.0.0.1:3000/terminal', { waitUntil: 'networkidle', timeout: 25000 });
await page.waitForTimeout(400);
await page.click('button[aria-label="Replay the demo"]');
await page.waitForTimeout(300);
console.log('waiting for scripted arrival...');
await page.waitForTimeout(6800);
const hasDecline = await page.locator('button:has-text("Decline")').count();
console.log('decline button count:', hasDecline);
if (hasDecline > 0) {
  const before = await page.evaluate(() => document.body.innerText.slice(0,300));
  await page.click('button:has-text("Decline")');
  await page.waitForTimeout(300);
  const after = await page.evaluate(() => document.body.innerText.slice(0,300));
  console.log('BEFORE:', before);
  console.log('AFTER:', after);
  console.log('changed:', before !== after);
}
await browser.close();
