// Freeze the 12 preview pages (proxy :3491 with system2.js) into standalone static HTML mockups.
// Output: public/_research/site-mockup/<name>/index.html + shared assets/. No scripts, nothing live.
import { chromium } from '/Users/sulo/Documents/solen/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import crypto from 'node:crypto';
const OUT = '/Users/sulo/Documents/solen/public/_research/site-mockup';
const ORIGIN = 'http://localhost:3493';
const only = process.argv[2];
const PAGES = [
  ['u-home', '/en'], ['u-search', '/en/search'], ['u-salon', '/en/salon/atelier-haarwerk'], ['u-booking-services', '/en/salon/atelier-haarwerk/booking'],
  ['u-profile', '/en/profile'], ['u-rewards', '/en/rewards'],
  ['dash-home', '/en/dashboard'], ['dash-calendar', '/en/dashboard/calendar', 'cal'], ['dash-services', '/en/dashboard/services'], ['dash-settings', '/en/dashboard/settings'], ['dash-clients', '/en/dashboard/clients'],
];
const LINKS = Object.fromEntries(PAGES.filter((p) => true).map(([n, p]) => [p, n]));
fs.mkdirSync(`${OUT}/assets`, { recursive: true });
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 402, height: 874 }, deviceScaleFactor: 2 });
await ctx.addCookies([{ name: 'solen_active_salon', value: '9f078a3f-071d-4797-a0cf-e5ab6f3c1d2f', domain: 'localhost', path: '/' }]);
const lp = await ctx.newPage(); await lp.goto(`${ORIGIN}/api/dev/login?to=/en`, { waitUntil: 'load', timeout: 180000 }); await lp.close();
const saved = new Map();
async function asset(url, base = ORIGIN) {
  const abs = new URL(url, base).href; if (saved.has(abs)) return saved.get(abs);
  let name = null;
  try {
    const r = await ctx.request.get(abs, { timeout: 60000 }); if (!r.ok()) throw new Error(`HTTP ${r.status()}`);
    const type = r.headers()['content-type'] || ''; if (/text\/html/.test(type)) throw new Error('got HTML, not an asset'); const ext = /woff2/.test(type) || abs.endsWith('.woff2') ? 'woff2' : /png/.test(type) ? 'png' : /webp/.test(type) ? 'webp' : /svg/.test(type) ? 'svg' : /avif/.test(type) ? 'avif' : 'jpg';
    name = crypto.createHash('sha1').update(abs).digest('hex').slice(0, 16) + '.' + ext;
    fs.writeFileSync(`${OUT}/assets/${name}`, await r.body());
  } catch (err) { console.log('[snapshot] asset failed', abs, err.message); }
  saved.set(abs, name); return name;
}
async function fixCssUrls(css, base = ORIGIN) {
  const urls = [...new Set([...css.matchAll(/url\((&quot;|['"]?)([^'")&]+)\1\)/g)].map((m) => m[2]).filter((u) => !u.startsWith('data:') && !u.startsWith('#') && !u.startsWith('../assets/')))];
  for (const u of urls) { const n = await asset(u, base); if (n) css = css.split(u).join(`../assets/${n}`); }
  return css;
}
for (const [name, path, flow] of PAGES.filter((p) => p[0].startsWith('u-') && (!only || only.split(',').includes(p[0])))) {
  const p = await ctx.newPage(); await p.goto(`${ORIGIN}${path}`, { waitUntil: 'load', timeout: 180000 });
  for (let i = 0; i < 2; i++) { const nb = p.getByRole('button', { name: 'Necessary only' }); if (await nb.count() && await nb.first().isVisible()) await nb.first().click().catch(() => {}); await p.waitForTimeout(1500); }
  await p.waitForTimeout(name.startsWith('dash') ? 20000 : 5000);
  try {
    if (flow === 'time') {
      await (await p.getByRole('button', { name: /add/i }).all())[0].click(); await p.waitForTimeout(600);
      await p.getByRole('button', { name: /continue/i }).last().click(); await p.waitForTimeout(1500);
      await p.getByRole('button', { name: /continue/i }).last().click(); await p.waitForTimeout(2500);
      // a weekday two days out (fixed dates drift as the strip starts today), then 10:30 or the third free slot
      await p.locator('main button', { hasText: /^(Mon|Tue|Wed|Thu|Fri)\s*\d{1,2}\s*[A-Z][a-z]{2}$/ }).nth(1).click(); await p.locator('main button', { hasText: /^\d{1,2}:\d{2}$/ }).first().waitFor({ timeout: 30000 }); await p.waitForTimeout(1500);
      const s1030 = p.locator('main button:not([disabled])', { hasText: /^10:30$/ });
      await ((await s1030.count()) ? s1030.first() : p.locator('main button:not([disabled])', { hasText: /^\d{1,2}:\d{2}$/ }).nth(2)).click(); await p.waitForTimeout(6000);
    } else if (flow === 'cal') {
      const prev = p.getByRole('button', { name: /previous/i }).filter({ visible: true }).first();
      for (let i = 0; i < 38; i++) { await prev.click(); await p.waitForTimeout(150); } await p.waitForTimeout(9000);
    } else {
      await p.mouse.move(200, 400); for (let i = 0; i < 25; i++) { await p.mouse.wheel(0, 150); await p.waitForTimeout(80); } await p.waitForTimeout(2500);
      await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(1500);
    }
  } catch (err) { console.log(name, 'flow error', err.message.split('\n')[0]); }
  // maps: the canvas does not survive serialising, so each map becomes a screenshot of itself
  const mapShots = []; const maps = p.locator('.mapboxgl-map');
  // hide whatever overlaps a map (dev badge, sticky bars, the map's own overlay chips) so only map tiles and markers are captured
  const hideOverlays = (on) => p.evaluate((on) => {
    if (!on) { for (const e of document.querySelectorAll('[data-snap-hid]')) { e.style.visibility = ''; e.removeAttribute('data-snap-hid'); } return; }
    for (const pt of document.querySelectorAll('nextjs-portal')) { pt.setAttribute('data-snap-hid', '1'); pt.style.visibility = 'hidden'; }
    const maps = [...document.querySelectorAll('.mapboxgl-map')];
    for (const e of document.querySelectorAll('body *')) {
      if (e.closest('.mapboxgl-map') || maps.some((m) => e.contains(m))) continue;
      const pos = getComputedStyle(e).position; if (pos === 'static' || pos === 'relative') continue;
      if (e.parentElement && e.parentElement.closest('[data-snap-hid]')) continue;
      e.setAttribute('data-snap-hid', '1'); e.style.visibility = 'hidden';
    }
  }, on);
  if (await maps.count()) await hideOverlays(true);
  for (let i = 0; i < await maps.count(); i++) {
    try { const m = maps.nth(i); await m.scrollIntoViewIfNeeded(); await p.waitForTimeout(3000); const nm = `map-${name}-${i}.png`; await m.screenshot({ path: `${OUT}/assets/${nm}` }); mapShots.push(nm); }
    catch (err) { console.log(name, 'map shot failed', err.message.split('\n')[0]); mapShots.push(null); }
  }
  if (mapShots.length) { await hideOverlays(false); await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(800); }
  await p.waitForTimeout(1500); await p.evaluate(() => window.__applySystem && window.__applySystem()); // final pass after any late re-render
  // freeze: stylesheets inline, images resolved, scripts and dev chrome removed
  const data = await p.evaluate(async ([LINKS, mapShots]) => {
    window.__applySystem && window.__applySystem(); // final pass in the same task as the serialisation, so no re-render slips in between
    window.setTimeout = () => 0; // stop the rules re-applying while the DOM is edited below
    const sheets = []; const links = [...document.querySelectorAll('link[rel=stylesheet]')];
    for (const l of links) { try { sheets.push([l.href, await (await fetch(l.href)).text()]); } catch (err) { console.error('[snapshot] css fetch failed', l.href, err); } }
    links.forEach((l) => l.remove());
    for (const e of document.querySelectorAll('script, noscript, nextjs-portal, next-route-announcer, link[rel=preload], link[rel=modulepreload], iframe')) e.remove();
    const imgs = [];
    document.querySelectorAll('img').forEach((img, i) => { const src = img.currentSrc || img.src; if (src && !src.startsWith('data:')) { img.setAttribute('data-snap', i); imgs.push([i, src]); } img.removeAttribute('srcset'); img.removeAttribute('sizes'); img.setAttribute('loading', 'eager'); });
    for (const a of document.querySelectorAll('a[href]')) { const u = new URL(a.href, location.href); const hit = LINKS[u.pathname]; a.setAttribute('href', hit ? `../${hit}/index.html` : '#'); a.removeAttribute('target'); }
    document.querySelectorAll('.mapboxgl-map').forEach((m, i) => { if (mapShots[i]) m.innerHTML = `<img src="../assets/${mapShots[i]}" alt="" style="width:100%;height:100%;object-fit:cover;display:block">`; });
    for (const f of document.querySelectorAll('form')) { f.setAttribute('onsubmit', 'return false'); f.removeAttribute('action'); }
    for (const i of document.querySelectorAll('input')) if (i.value) i.setAttribute('value', i.value);
    return { sheets, imgs, html: '<!doctype html>\n' + document.documentElement.outerHTML };
  }, [LINKS, mapShots]);
  let html = data.html;
  let css = ''; for (const [href, text] of data.sheets) css += (await fixCssUrls(text, href)) + '\n';
  html = html.replace('</head>', `<style>${css}</style></head>`);
  html = await fixCssUrls(html); // inline style="background-image:url(...)" and <style> tags
  for (const [i, src] of data.imgs) { const n = await asset(src); html = html.replace(new RegExp(`(<img[^>]*?)src="[^"]*"([^>]*?data-snap="${i}")`), `$1src="${n ? `../assets/${n}` : ''}"$2`).replace(new RegExp(`(<img[^>]*?data-snap="${i}"[^>]*?)src="[^"]*"`), `$1src="${n ? `../assets/${n}` : ''}"`); }
  html = html.replace('</body>', () => `<script>${fs.readFileSync(new URL('./mock-interact3.js', import.meta.url), 'utf8')}</script></body>`);
  html = html.replace(/<head>/, '<head><meta name="robots" content="noindex">');
  fs.mkdirSync(`${OUT}/${name}`, { recursive: true }); fs.writeFileSync(`${OUT}/${name}/index.html`, html);
  console.log(name, (html.length / 1024).toFixed(0) + 'KB', data.imgs.length, 'imgs', data.sheets.length, 'sheets');
  await p.close();
}
await b.close();
