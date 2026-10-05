// Proof the shared tokens drive every page: read the main button radius and the back-on-photo look on several pages.
import { chromium } from '/Users/sulo/Documents/solen/node_modules/playwright/index.mjs';
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 402, height: 874 } }); const errs = [];
p.on('pageerror', (e) => errs.push(e.message));
const out = {};
for (const pg of ['u-salon/index.html', 'u-booking-time/index.html', 'u-booking-services/index.html', 'dashboard-uber/home.html']) {
  await p.goto(`http://127.0.0.1:3492/${pg}`, { waitUntil: 'load' }); await p.waitForTimeout(1200);
  out[pg] = await p.evaluate(() => {
    const big = [...document.querySelectorAll('a,button')].find((e) => { const r = e.getBoundingClientRect(); return r.width > 250 && r.height >= 40 && /Book appointment|Continue/.test(e.innerText); })
      || document.querySelector('.pill.ink');
    const back = [...document.querySelectorAll('button[aria-label="Back"]')].find((e) => e.getBoundingClientRect().width > 30);
    return { cta: big ? getComputedStyle(big).borderRadius : 'none', back: back ? getComputedStyle(back).backgroundColor : '-', hidden: !!document.getElementById('u-hide') };
  });
}
console.log(JSON.stringify(out), 'errors:', errs.length ? errs : 'none'); await b.close();
