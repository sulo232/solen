import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.goto('http://127.0.0.1:3000/terminal', { waitUntil: 'networkidle', timeout: 25000 });
await page.waitForTimeout(400);
const info = await page.evaluate(() => {
  const scroller = document.querySelector('.overflow-x-auto');
  const inner = scroller ? scroller.firstElementChild : null;
  const chips = inner ? [...inner.children] : [];
  return {
    scrollerRect: scroller ? scroller.getBoundingClientRect() : null,
    scrollerScrollWidth: scroller ? scroller.scrollWidth : null,
    scrollerClientWidth: scroller ? scroller.clientWidth : null,
    innerRect: inner ? inner.getBoundingClientRect() : null,
    innerCs: inner ? { gap: getComputedStyle(inner).gap, paddingLeft: getComputedStyle(inner).paddingLeft, paddingRight: getComputedStyle(inner).paddingRight } : null,
    chipCount: chips.length,
    chipRects: chips.map(c => c.getBoundingClientRect()),
  };
});
console.log(JSON.stringify(info, null, 1));
await browser.close();
