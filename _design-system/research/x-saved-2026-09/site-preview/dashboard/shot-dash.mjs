// Screenshot the dashboard redo pages at phone and desktop width from the static server.
import { chromium } from '/Users/sulo/Documents/solen/node_modules/playwright/index.mjs';
const OUT = process.argv[2]; const pages = (process.argv[3] || 'home,services,clients,settings').split(',');
const b = await chromium.launch(); const errs = [];
for (const [w, h, n, s] of [[402, 874, 'm', 2], [1280, 900, 'd', 1]]) {
  const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: s });
  p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
  for (const pg of pages) { await p.goto(`http://127.0.0.1:3492/dashboard-new/${pg}.html`, { waitUntil: 'load' }); await p.waitForTimeout(500); await p.screenshot({ path: `${OUT}/${pg}-${n}.png`, fullPage: true }); }
}
console.log('errors:', errs.length ? errs : 'none'); await b.close();
