// Buttons comparison: the same real page region rendered with today's mockup look and with ?flat=1
// (shadow, outline and blur removed from icon controls). One variable per pair.
import { chromium } from '/Users/sulo/Documents/solen/node_modules/playwright/index.mjs';
import fs from 'node:fs';
const OUT = '/Users/sulo/Documents/solen/public/_research/site-mockup/buttons/img';
fs.mkdirSync(OUT, { recursive: true });
const ORIGIN = 'http://localhost:3491';
// each target: the element to centre, then a full-width band around it (viewport coordinates, measured after scrolling)
const PAIRS = [
  { id: 'chips', path: '/en', el: (p) => p.locator('a[aria-selected]').first(), above: 16, height: 76 },
  { id: 'card-heart', path: '/en', el: (p) => p.locator('a[class*="w-[calc"]').first(), above: 12, height: 250 },
  { id: 'salon-top', path: '/en/salon/atelier-haarwerk', el: (p) => p.locator('button[aria-label="Share profile"]').first(), above: 40, height: 110, top: true },
  { id: 'add', path: '/en/salon/atelier-haarwerk/booking', el: (p) => p.locator('main button[aria-label="Add"]').first(), above: 50, height: 150 },
  { id: 'map', path: '/en/search', el: (p) => p.getByRole('button', { name: /^map$/i }).or(p.getByRole('link', { name: /^map$/i })).first(), above: 50, height: 140 },
];
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 402, height: 874 }, deviceScaleFactor: 2 });
await ctx.addCookies([{ name: 'solen_active_salon', value: '9f078a3f-071d-4797-a0cf-e5ab6f3c1d2f', domain: 'localhost', path: '/' }]);
const lp = await ctx.newPage(); await lp.goto(`${ORIGIN}/api/dev/login?to=/en`, { waitUntil: 'load', timeout: 180000 }); await lp.close();
for (const pr of PAIRS) {
  for (const flat of [false, true]) {
    const p = await ctx.newPage(); await p.goto(`${ORIGIN}${pr.path}${flat ? '?flat=1' : ''}`, { waitUntil: 'load', timeout: 180000 });
    const nb = p.getByRole('button', { name: 'Necessary only' }); if (await nb.count() && await nb.first().isVisible()) await nb.first().click().catch(() => {});
    await p.waitForTimeout(6000); await p.evaluate(() => { document.querySelectorAll('nextjs-portal').forEach((e) => e.remove()); window.__applySystem && window.__applySystem(); }); await p.waitForTimeout(400);
    try {
      const el = pr.el(p); if (!pr.top) await el.evaluate((e) => e.scrollIntoView({ block: 'center' })); await p.waitForTimeout(900);
      const bb = await el.boundingBox(); const y = Math.max(0, bb.y - pr.above);
      await p.screenshot({ path: `${OUT}/${pr.id}-${flat ? 'flat' : 'today'}.png`, clip: { x: 0, y, width: 402, height: Math.min(pr.height, 874 - y) } });
      console.log(pr.id, flat ? 'flat' : 'today', 'ok', Math.round(bb.y));
    } catch (err) { console.log(pr.id, flat, 'failed', err.message.split('\n')[0]); }
    await p.close();
  }
}
await b.close();
