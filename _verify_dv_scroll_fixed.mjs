import { chromium } from 'playwright';
import fs from 'fs';
const OUT = '/private/tmp/claude-501/-Users-sulo-Documents-solen--claude-worktrees-quirky-ellis-ef5559/8ef73c47-3574-4223-9a33-b050c13a2faf/scratchpad';
const results = {};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.goto('http://127.0.0.1:3000/terminal', { waitUntil: 'networkidle', timeout: 25000 });
await page.waitForTimeout(400);

async function scrollAndMeasure() {
  return await page.evaluate(() => {
    const scroller = document.querySelector('.fixed.inset-0.z-\\[10000\\].overflow-y-auto');
    if (scroller) {
      scroller.scrollTop = scroller.scrollHeight;
    }
    const bars = [...document.querySelectorAll('div')].filter(d => {
      const cs = getComputedStyle(d);
      const r = d.getBoundingClientRect();
      return cs.position === 'fixed' && cs.bottom !== 'auto' && r.width > 100 && r.width < 390;
    });
    const bar = bars[bars.length-1];
    const barRect = bar ? bar.getBoundingClientRect() : null;
    const rows = [...document.querySelectorAll('li, p')].filter(el => el.getBoundingClientRect().height > 0);
    const last = rows[rows.length-1];
    const lastRect = last ? last.getBoundingClientRect() : null;
    return {
      scrollerFound: !!scroller,
      scrollTop: scroller ? scroller.scrollTop : null,
      scrollHeight: scroller ? scroller.scrollHeight : null,
      clientHeight: scroller ? scroller.clientHeight : null,
      barTop: barRect ? Math.round(barRect.top) : null,
      lastBottom: lastRect ? Math.round(lastRect.bottom) : null,
      lastText: last ? last.textContent.trim().slice(0,60) : null,
      viewportH: window.innerHeight,
    };
  });
}

const results2 = {};
const views = [
  { key: 'board', label: 'Board' },
  { key: 'staff', label: 'Chairs' },
  { key: 'clock', label: 'Log' },
  { key: 'profile', label: 'This screen' },
];
for (const v of views) {
  if (v.key !== 'board') {
    await page.click(`button[aria-label="${v.label}"]`);
    await page.waitForTimeout(200);
  }
  await page.waitForTimeout(150);
  results2[v.key] = await scrollAndMeasure();
}

fs.writeFileSync(OUT + '/results-scroll-fixed.json', JSON.stringify(results2, null, 2));
console.log('DONE');
await browser.close();
