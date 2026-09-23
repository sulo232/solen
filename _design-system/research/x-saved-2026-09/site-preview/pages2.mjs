// Whole pages, today (localhost:3000) vs new (proxy :3491 with system2.js), same state, 402px.
import { chromium } from '/Users/sulo/Documents/solen/node_modules/playwright/index.mjs';
const only = process.argv[2];
const PAGES = [
  ['home', '/en'], ['search', '/en/search'], ['salon', '/en/salon/atelier-haarwerk'], ['booking-services', '/en/salon/atelier-haarwerk/booking'],
  ['booking-time', '/en/salon/muse-beauty-studio/booking', 'time'], ['profile', '/en/profile'], ['rewards', '/en/rewards'],
  ['dash-home', '/en/dashboard'], ['dash-calendar', '/en/dashboard/calendar', 'cal'], ['dash-services', '/en/dashboard/services'], ['dash-settings', '/en/dashboard/settings'], ['dash-clients', '/en/dashboard/clients'],
].filter((p) => !only || only.split(',').includes(p[0]));
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 402, height: 874 }, deviceScaleFactor: 2 });
await ctx.addCookies([{ name: 'solen_active_salon', value: '9f078a3f-071d-4797-a0cf-e5ab6f3c1d2f', domain: 'localhost', path: '/' }]);
const lp = await ctx.newPage(); await lp.goto('http://localhost:3000/api/dev/login?to=/en', { waitUntil: 'load', timeout: 180000 }); await lp.close();
for (const [name, path, flow] of PAGES) for (const [side, port] of [['a', 3000], ['b', 3491]]) {
  const p = await ctx.newPage(); await p.goto(`http://localhost:${port}${path}`, { waitUntil: 'load', timeout: 180000 });
  for (let i = 0; i < 2; i++) { const nb = p.getByRole('button', { name: 'Necessary only' }); if (await nb.count() && await nb.first().isVisible()) await nb.first().click().catch(() => {}); await p.waitForTimeout(1500); }
  await p.addStyleTag({ content: 'nextjs-portal{display:none!important}' });
  await p.waitForTimeout(name.startsWith('dash') ? 20000 : 5000);
  try {
    if (flow === 'time') {
      await (await p.getByRole('button', { name: /add/i }).all())[0].click(); await p.waitForTimeout(600);
      await p.getByRole('button', { name: /continue/i }).last().click(); await p.waitForTimeout(1500);
      await p.getByRole('button', { name: /continue/i }).last().click(); await p.waitForTimeout(2500);
      await p.getByText('24', { exact: true }).first().click(); await p.locator('main button', { hasText: /^10:30$/ }).first().waitFor({ timeout: 30000 }); await p.waitForTimeout(1500);
      await p.locator('main button', { hasText: /^10:30$/ }).first().click(); await p.waitForTimeout(1200);
    } else if (flow === 'cal') {
      const prev = p.getByRole('button', { name: /previous/i }).filter({ visible: true }).first();
      for (let i = 0; i < 38; i++) { await prev.click(); await p.waitForTimeout(150); } await p.waitForTimeout(9000);
    } else {
      await p.mouse.move(200, 400); for (let i = 0; i < 25; i++) { await p.mouse.wheel(0, 150); await p.waitForTimeout(80); } await p.waitForTimeout(2500);
      await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(1200);
    }
  } catch (err) { console.log(name, side, 'flow error', err.message.split('\n')[0]); }
  const H = Math.min(await p.evaluate(() => document.documentElement.scrollHeight), 874 * 3);
  await p.screenshot({ path: `site/${name}-${side}.png`, clip: { x: 0, y: 0, width: 402, height: H }, fullPage: true });
  console.log(name, side, p.url().replace(/http:\/\/localhost:\d+/, ''), H, side === 'b' ? await p.evaluate(() => !!window.__sysInstalled) : '');
  await p.close();
}
await b.close();
