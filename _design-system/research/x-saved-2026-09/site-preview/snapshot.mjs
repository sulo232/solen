// Freeze the 12 preview pages (proxy :3491 with system2.js) into standalone static HTML mockups.
// Output: public/_research/site-mockup/<name>/index.html + shared assets/. No scripts, nothing live.
import { chromium } from '/Users/sulo/Documents/solen/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import crypto from 'node:crypto';
const OUT = '/Users/sulo/Documents/solen/public/_research/site-mockup';
const ORIGIN = 'http://localhost:3491';
const only = process.argv[2];
const PAGES = [
  ['home', '/en'], ['search', '/en/search'], ['salon', '/en/salon/atelier-haarwerk'], ['booking-services', '/en/salon/atelier-haarwerk/booking'],
  ['booking-time', '/en/salon/muse-beauty-studio/booking', 'time'], ['profile', '/en/profile'], ['rewards', '/en/rewards'],
  ['dash-home', '/en/dashboard'], ['dash-calendar', '/en/dashboard/calendar', 'cal'], ['dash-services', '/en/dashboard/services'], ['dash-settings', '/en/dashboard/settings'], ['dash-clients', '/en/dashboard/clients'],
];
const LINKS = Object.fromEntries(PAGES.filter((p) => p[0] !== 'booking-time').map(([n, p]) => [p, n]));
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
for (const [name, path, flow] of PAGES.filter((p) => !only || only.split(',').includes(p[0]))) {
  const p = await ctx.newPage(); await p.goto(`${ORIGIN}${path}`, { waitUntil: 'load', timeout: 180000 });
  for (let i = 0; i < 2; i++) { const nb = p.getByRole('button', { name: 'Necessary only' }); if (await nb.count() && await nb.first().isVisible()) await nb.first().click().catch(() => {}); await p.waitForTimeout(1500); }
  await p.waitForTimeout(name.startsWith('dash') ? 20000 : 5000);
  try {
    if (flow === 'time') {
      await (await p.getByRole('button', { name: /add/i }).all())[0].click(); await p.waitForTimeout(600);
      await p.getByRole('button', { name: /continue/i }).last().click(); await p.waitForTimeout(1500);
      await p.getByRole('button', { name: /continue/i }).last().click(); await p.waitForTimeout(2500);
      await p.getByText('24', { exact: true }).first().click(); await p.locator('main button', { hasText: /^10:30$/ }).first().waitFor({ timeout: 30000 }); await p.waitForTimeout(1500);
      await p.locator('main button', { hasText: /^10:30$/ }).first().click(); await p.waitForTimeout(6000);
    } else if (flow === 'cal') {
      const prev = p.getByRole('button', { name: /previous/i }).filter({ visible: true }).first();
      for (let i = 0; i < 38; i++) { await prev.click(); await p.waitForTimeout(150); } await p.waitForTimeout(9000);
    } else {
      await p.mouse.move(200, 400); for (let i = 0; i < 25; i++) { await p.mouse.wheel(0, 150); await p.waitForTimeout(80); } await p.waitForTimeout(2500);
      await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(1500);
    }
  } catch (err) { console.log(name, 'flow error', err.message.split('\n')[0]); }
  // freeze: stylesheets inline, images resolved, scripts and dev chrome removed
  const data = await p.evaluate(async (LINKS) => {
    window.setTimeout = () => 0; // stop system2 re-applying while the DOM is edited below
    const sheets = []; const links = [...document.querySelectorAll('link[rel=stylesheet]')];
    for (const l of links) { try { sheets.push([l.href, await (await fetch(l.href)).text()]); } catch (err) { console.error('[snapshot] css fetch failed', l.href, err); } }
    links.forEach((l) => l.remove());
    for (const e of document.querySelectorAll('script, noscript, nextjs-portal, next-route-announcer, link[rel=preload], link[rel=modulepreload], iframe')) e.remove();
    const imgs = [];
    document.querySelectorAll('img').forEach((img, i) => { const src = img.currentSrc || img.src; if (src && !src.startsWith('data:')) { img.setAttribute('data-snap', i); imgs.push([i, src]); } img.removeAttribute('srcset'); img.removeAttribute('sizes'); img.setAttribute('loading', 'eager'); });
    for (const a of document.querySelectorAll('a[href]')) { const u = new URL(a.href, location.href); const hit = LINKS[u.pathname]; a.setAttribute('href', hit ? `../${hit}/index.html` : '#'); a.removeAttribute('target'); }
    for (const f of document.querySelectorAll('form')) { f.setAttribute('onsubmit', 'return false'); f.removeAttribute('action'); }
    for (const i of document.querySelectorAll('input')) if (i.value) i.setAttribute('value', i.value);
    return { sheets, imgs, html: '<!doctype html>\n' + document.documentElement.outerHTML };
  }, LINKS);
  let html = data.html;
  let css = ''; for (const [href, text] of data.sheets) css += (await fixCssUrls(text, href)) + '\n';
  html = html.replace('</head>', `<style>${css}</style></head>`);
  html = await fixCssUrls(html); // inline style="background-image:url(...)" and <style> tags
  for (const [i, src] of data.imgs) { const n = await asset(src); html = html.replace(new RegExp(`(<img[^>]*?)src="[^"]*"([^>]*?data-snap="${i}")`), `$1src="${n ? `../assets/${n}` : ''}"$2`).replace(new RegExp(`(<img[^>]*?data-snap="${i}"[^>]*?)src="[^"]*"`), `$1src="${n ? `../assets/${n}` : ''}"`); }
  html = html.replace(/<head>/, '<head><meta name="robots" content="noindex">');
  fs.mkdirSync(`${OUT}/${name}`, { recursive: true }); fs.writeFileSync(`${OUT}/${name}/index.html`, html);
  console.log(name, (html.length / 1024).toFixed(0) + 'KB', data.imgs.length, 'imgs', data.sheets.length, 'sheets');
  await p.close();
}
await b.close();
