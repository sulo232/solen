import { chromium } from 'playwright';

const URL = 'https://card-albums-anne-mood.trycloudflare.com/_mockups/improve/category.html';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
await page.click('#tPro');
await page.waitForTimeout(500);

const data = await page.evaluate(() => {
  const out = [];
  document.querySelectorAll('#pPro *').forEach(el => {
    const hasDirectText = Array.from(el.childNodes).some(n => n.nodeType === 3 && n.textContent.trim().length > 0);
    if (hasDirectText) {
      const fs = getComputedStyle(el).fontSize;
      if (fs === '11px' || fs === '13px') {
        out.push({ fs, text: el.textContent.trim().slice(0, 40), cls: el.className });
      }
    }
  });
  return out;
});
console.log(JSON.stringify(data, null, 2));
await browser.close();
