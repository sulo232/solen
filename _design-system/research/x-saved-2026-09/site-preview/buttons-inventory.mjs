// Inventory every visible button look on the 12 frozen mockup pages (served on :3492).
// Groups buttons by their visual treatment (fill, outline, shadow, shape) and saves one crop per look.
import { chromium } from '/Users/sulo/Documents/solen/node_modules/playwright/index.mjs';
import fs from 'node:fs';
const OUT = new URL('./buttons-out/', import.meta.url).pathname; fs.mkdirSync(OUT, { recursive: true });
const PAGES = ['home', 'search', 'salon', 'booking-services', 'booking-time', 'profile', 'rewards', 'dash-home', 'dash-services', 'dash-settings', 'dash-clients'];
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 402, height: 874 }, deviceScaleFactor: 2 });
const looks = new Map();
for (const name of PAGES) {
  await p.goto(`http://127.0.0.1:3492/${name}/index.html`, { waitUntil: 'load' }); await p.waitForTimeout(1200);
  const found = await p.evaluate(() => {
    const rgb = (c) => (c.match(/[\d.]+/g) || []).map(Number);
    const clear = (c) => { const a = rgb(c); return a.length === 4 && a[3] < 0.05; };
    const name = (c) => { if (clear(c)) return 'none'; const [r, g, b] = rgb(c); if (r < 45 && g < 45 && b < 45) return 'ink'; if (r > 250 && g > 250 && b > 250) return 'white'; if (b > 200 && r < 80) return 'blue'; if (r > 225 && g > 225 && b > 225) return 'grey'; return 'other'; };
    const out = [];
    for (const e of document.querySelectorAll('button, a, [role=button]')) {
      const r = e.getBoundingClientRect(); if (r.width < 20 || r.height < 20 || r.width > 380) continue;
      // the visible shape can be the element or its only painted child (icon circles inside a 44px hit area)
      let v = e; const cs0 = getComputedStyle(e);
      if (clear(cs0.backgroundColor) && cs0.borderTopWidth === '0px' && cs0.boxShadow === 'none') { const k = [...e.querySelectorAll('span, div')].find((x) => { const s = getComputedStyle(x); return !clear(s.backgroundColor) || s.borderTopWidth !== '0px' || s.boxShadow !== 'none'; }); if (k) v = k; }
      const cs = getComputedStyle(v); const vr = v.getBoundingClientRect();
      const fill = name(cs.backgroundColor); const outline = cs.borderTopWidth !== '0px' && !clear(cs.borderTopColor) && cs.borderTopStyle !== 'none';
      const shadow = cs.boxShadow !== 'none'; const round = parseFloat(cs.borderTopLeftRadius) >= vr.height / 2 - 1 ? 'round' : parseFloat(cs.borderTopLeftRadius) + 'px';
      if (fill === 'none' && !outline && !shadow) continue; // plain text or icon link
      if (e.querySelector('img') && vr.height > 80) continue; // photo cards
      const label = (e.getAttribute('aria-label') || e.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 28);
      out.push({ key: `${fill}${outline ? '+outline' : ''}${shadow ? '+shadow' : ''} ${round}`, label, x: vr.left + scrollX, y: vr.top + scrollY, w: vr.width, h: vr.height, shadowCss: cs.boxShadow, bg: cs.backgroundColor });
    }
    return out;
  });
  for (const f of found) {
    const L = looks.get(f.key) || { key: f.key, count: 0, pages: new Set(), samples: [] };
    L.count++; L.pages.add(name);
    if (L.samples.length < 4 && !L.samples.some((s) => s.label === f.label)) {
      const file = `${f.key.replace(/[^a-z0-9]+/gi, '_')}_${L.samples.length}.png`;
      try { await p.screenshot({ path: OUT + file, clip: { x: Math.max(0, f.x - 8), y: Math.max(0, f.y - 8), width: Math.min(402, f.w + 16), height: f.h + 16 }, fullPage: true }); L.samples.push({ ...f, page: name, file }); }
      catch (err) { console.log('crop failed', name, f.label, err.message.split('\n')[0]); }
    }
    looks.set(f.key, L);
  }
}
await b.close();
const res = [...looks.values()].sort((a, c) => c.count - a.count).map((L) => ({ ...L, pages: [...L.pages] }));
fs.writeFileSync(OUT + 'looks.json', JSON.stringify(res, null, 1));
for (const L of res) console.log(String(L.count).padStart(4), L.key.padEnd(34), L.pages.join(','), '|', L.samples.map((s) => s.label).join(' / '));
