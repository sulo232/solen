import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.goto('http://127.0.0.1:3000/terminal', { waitUntil: 'networkidle', timeout: 25000 });
await page.waitForTimeout(400);
const info = await page.evaluate(() => {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node;
  const out = [];
  while ((node = walker.nextNode())) {
    const text = node.textContent.trim();
    if (!text) continue;
    const parent = node.parentElement;
    const cs = getComputedStyle(parent);
    if (cs.fontSize === '16px') out.push({ text: text.slice(0,40), tag: parent.tagName, cls: parent.className.toString().slice(0,80) });
  }
  return out;
});
console.log(JSON.stringify(info, null, 1));
await browser.close();
