// Phase-4 every-state capture: HOME. Drives the REAL app, patches REAL components
// (treatment-only DS rules), screenshots real pixels. Output: public/_mockups/everystate/shots/home/
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = 'http://localhost:3000';
const OUT = 'public/_mockups/everystate/shots/home';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();

async function newPage(ctxOpts = {}) {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    locale: 'de-CH',
    ...ctxOpts,
  });
  return { ctx, page: await ctx.newPage() };
}

async function settle(page, ms = 1500) {
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(ms);
}

// ----- DS treatment patch (LOCKFILE rules applied to the real DOM) -----
async function applyDsPatch(page) {
  await page.addStyleTag({ content: `
    /* DS-5: one section rhythm, 32px between home sections */
    main section { margin-top: 32px !important; }
  `});
  await page.evaluate(() => {
    // Banned tracked-uppercase eyebrows (CLAUDE.md ban + LOCKFILE A12 scope)
    document.querySelectorAll('p,span,div').forEach(el => {
      const c = el.className && el.className.toString();
      if (c && c.includes('uppercase') && c.includes('tracking-') && el.textContent.trim().length < 24 && el.children.length === 0) {
        el.remove();
      }
    });
    // DS-7: card meta "14:30  CHF 80" -> icon-led details row (real cards only).
    // Built with DOM methods; all content is static or read from the card itself.
    const NS = 'http://www.w3.org/2000/svg';
    const calIcon = () => {
      const svg = document.createElementNS(NS, 'svg');
      svg.setAttribute('width', '12'); svg.setAttribute('height', '12');
      svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('fill', 'none');
      svg.setAttribute('stroke', 'currentColor'); svg.setAttribute('stroke-width', '2');
      svg.setAttribute('stroke-linecap', 'round'); svg.setAttribute('stroke-linejoin', 'round');
      svg.style.cssText = 'display:inline-block;vertical-align:-1.5px';
      [['path', 'M8 2v4'], ['path', 'M16 2v4'], ['rect', null], ['path', 'M3 10h18']].forEach(([tag, d]) => {
        const el = document.createElementNS(NS, tag);
        if (tag === 'rect') {
          el.setAttribute('width', '18'); el.setAttribute('height', '18');
          el.setAttribute('x', '3'); el.setAttribute('y', '4'); el.setAttribute('rx', '2');
        } else el.setAttribute('d', d);
        svg.appendChild(el);
      });
      return svg;
    };
    const bold = (txt) => {
      const b = document.createElement('b');
      b.style.cssText = 'color:#0A0A0A;font-weight:600';
      b.textContent = txt;
      return b;
    };
    document.querySelectorAll('a[href*="/salon/"] div.truncate:last-child').forEach(row => {
      const spans = row.querySelectorAll('span');
      if (spans.length < 2) return;
      const time = spans[0].textContent.trim();
      const priceMatch = row.textContent.match(/CHF\s?\d+/);
      if (!/^\d{1,2}:\d{2}$/.test(time) || !priceMatch) return;
      row.textContent = '';
      const left = document.createElement('span');
      left.style.cssText = 'display:inline-flex;align-items:center;gap:4px;color:#6B6B6B';
      left.appendChild(calIcon());
      left.appendChild(document.createTextNode(' heute '));
      left.appendChild(bold(time));
      const right = document.createElement('span');
      right.style.cssText = 'margin-left:12px;color:#6B6B6B';
      right.appendChild(document.createTextNode('ab '));
      right.appendChild(bold(priceMatch[0]));
      row.append(left, right);
    });
  });
}

// 1) BEFORE: logged in, as shipped
{
  const { ctx, page } = await newPage();
  await page.goto(`${BASE}/api/dev/login?to=/de`);
  await settle(page, 2500);
  await page.screenshot({ path: `${OUT}/1-before-default.png`, fullPage: true });

  // 2) AFTER: same real page + DS patch
  await applyDsPatch(page);
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/2-after-ds.png`, fullPage: true });
  await ctx.close();
}

// 3) LOADING: real skeletons, captured mid-hydration
{
  const { ctx, page } = await newPage();
  await page.goto(`${BASE}/api/dev/login?to=/profile`); // prime session
  await settle(page, 800);
  await page.goto(`${BASE}/de`, { waitUntil: 'commit' });
  await page.waitForTimeout(350);
  await page.screenshot({ path: `${OUT}/3-loading.png` });
  await ctx.close();
}

// 4) LOGGED OUT: fresh context, no session
{
  const { ctx, page } = await newPage();
  await page.goto(`${BASE}/de`);
  await settle(page, 2500);
  await page.screenshot({ path: `${OUT}/4-logged-out.png`, fullPage: true });
  await ctx.close();
}

await browser.close();
console.log('home captures done');
