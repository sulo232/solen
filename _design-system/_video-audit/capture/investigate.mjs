// Punch-list investigation: full-page captures + measurements of the REAL surfaces
// that were rejected for being simplified. Output: /tmp/inv/
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE = 'http://localhost:3000';
const OUT = '/tmp/inv';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: 'de-CH' });
const page = await ctx.newPage();
const report = {};

async function settle(ms = 2200) {
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(ms);
}

// login session
await page.goto(`${BASE}/api/dev/login?to=/de`);
await settle(2500);
await page.screenshot({ path: `${OUT}/home-full.png`, fullPage: true });

// search: full + widget rects
await page.goto(`${BASE}/de/search?category=barbershop&city=Basel`);
await settle(2500);
await page.screenshot({ path: `${OUT}/search-full.png`, fullPage: true });
report.search = await page.evaluate(() => {
  const r = (el) => el ? { w: Math.round(el.getBoundingClientRect().width), h: Math.round(el.getBoundingClientRect().height) } : null;
  const out = {};
  const imgs = Array.from(document.querySelectorAll('img')).filter(i => i.getBoundingClientRect().height > 150);
  out.heroCard = imgs[0] ? r(imgs[0].closest('a') || imgs[0].parentElement) : null;
  out.firstChip = r(document.querySelector('button[class*="rounded-full"], a[class*="rounded-full"]'));
  const h2 = Array.from(document.querySelectorAll('h2,h3')).map(x => x.textContent.trim()).slice(0, 10);
  out.heads = h2;
  return out;
});

// PDP: full + section inventory
await page.goto(`${BASE}/de/salon/old-town-barbers`);
await settle(3000);
await page.screenshot({ path: `${OUT}/pdp-full.png`, fullPage: true });
report.pdp = await page.evaluate(() => ({
  sections: Array.from(document.querySelectorAll('h2,h3')).map(x => x.tagName + ': ' + x.textContent.trim()),
  height: document.documentElement.scrollHeight,
}));

// booking step 1 + step 2
await page.goto(`${BASE}/de/salon/old-town-barbers/booking`);
await settle(3000);
await page.screenshot({ path: `${OUT}/booking-step1.png`, fullPage: true });
// add first service then continue
const addBtn = page.locator('button:has(svg.lucide-plus)').first();
if (await addBtn.count()) { await addBtn.click(); await page.waitForTimeout(600); }
const cont = page.locator('button', { hasText: /Weiter|Continue/ }).last();
if (await cont.count()) { await cont.click(); await settle(2500); }
await page.screenshot({ path: `${OUT}/booking-step2.png`, fullPage: true });
report.bookingStep2 = await page.evaluate(() => ({
  texts: Array.from(document.querySelectorAll('h2,h3,p')).slice(0, 24).map(x => x.textContent.trim().slice(0, 60)),
}));

// walk-in-pay demo
await page.goto(`${BASE}/de/walk-in-pay?demo=1`);
await settle(2500);
await page.screenshot({ path: `${OUT}/walkinpay-full.png`, fullPage: true });

// queue tracker (seed token)
await page.goto(`${BASE}/de/queue/seed-demo-1`);
await settle(2500);
await page.screenshot({ path: `${OUT}/queue-full.png`, fullPage: true });

writeFileSync(`${OUT}/report.json`, JSON.stringify(report, null, 2));
await browser.close();
console.log(JSON.stringify(report).slice(0, 400));
console.log('inv done');
