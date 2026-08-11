import { chromium } from 'playwright';
import fs from 'fs';
const OUT = '/private/tmp/claude-501/-Users-sulo-Documents-solen--claude-worktrees-design-system-consolidation-10167f/68d78dad-21dd-4632-a5a9-f1861516a718/scratchpad';
const log = (...a) => console.log(...a);

async function boot(browser) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'de-CH' });
  const page = await ctx.newPage();
  await page.goto('http://127.0.0.1:3000/de', { waitUntil: 'domcontentloaded', timeout: 180000 });
  await page.waitForSelector('main', { timeout: 180000 });
  await page.waitForTimeout(3000);
  try { await page.getByRole('button', { name: /notwendige/i }).first().click({ timeout: 15000 }); } catch {}
  await page.waitForTimeout(1500);
  await page.evaluate(async () => { const s = ms => new Promise(r => setTimeout(r, ms)); for (let y = 0; y < document.documentElement.scrollHeight; y += 500) { window.scrollTo(0, y); await s(100); } window.scrollTo(0, 0); await s(500); });
  await page.waitForTimeout(1500);
  return page;
}

(async () => {
  const browser = await chromium.launch();
  const page = await boot(browser);

  const feed = await page.evaluate(() => {
    const main = document.querySelector('main');
    const root = main.querySelector('div.relative.overflow-hidden');
    const nodes = [];
    const push = (el, label) => {
      const r = el.getBoundingClientRect();
      if (r.height === 0) { nodes.push({ label, h: 0, top: null, empty: true, text: (el.textContent || '').trim().slice(0, 50) }); return; }
      nodes.push({ label, top: Math.round(r.top + window.scrollY), bottom: Math.round(r.bottom + window.scrollY), h: Math.round(r.height), w: Math.round(r.width), text: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 70) });
    };
    for (const c of root.children) {
      const tag = c.tagName;
      const cls = (typeof c.className === 'string' ? c.className : '');
      if (c.children.length > 4) {
        push(c, `WRAPPER<${tag}> ${cls.slice(0, 40)}`);
        for (const g of c.children) push(g, `  ${g.tagName}.${(typeof g.className === 'string' ? g.className : '').slice(0, 45)}`);
      } else push(c, `${tag}.${cls.slice(0, 45)}`);
    }
    return nodes;
  });
  log('=== FEED STRUCTURE ===');
  feed.forEach(n => log(n.empty ? `  [ZERO-HEIGHT] ${n.label} "${n.text}"` : `  top=${String(n.top).padStart(5)} h=${String(n.h).padStart(5)} w=${n.w} ${n.label} :: "${n.text}"`));

  const gaps = await page.evaluate(() => {
    const main = document.querySelector('main');
    const rows = [];
    for (const c of main.querySelectorAll('*')) {
      const r = c.getBoundingClientRect();
      if (r.height <= 0 || r.width <= 0) continue;
      const cs = getComputedStyle(c);
      if (cs.visibility === 'hidden' || cs.opacity === '0') continue;
      const hasText = Array.from(c.childNodes).some(n => n.nodeType === 3 && n.textContent.trim().length);
      const isImg = c.tagName === 'IMG' || c.tagName === 'SVG' || c.tagName === 'VIDEO';
      const cbg = cs.backgroundColor;
      const hasBg = cs.backgroundImage !== 'none' || (cbg !== 'rgba(0, 0, 0, 0)' && cbg !== 'transparent' && cbg !== 'rgb(255, 255, 255)');
      const hasBorder = parseFloat(cs.borderTopWidth) > 0 || parseFloat(cs.borderBottomWidth) > 0;
      if (hasText || isImg || hasBg || hasBorder) rows.push({ top: r.top + window.scrollY, bottom: r.bottom + window.scrollY });
    }
    rows.sort((a, b) => a.top - b.top);
    const merged = [];
    for (const r of rows) {
      if (!merged.length || r.top > merged[merged.length - 1].bottom) merged.push({ top: r.top, bottom: r.bottom });
      else merged[merged.length - 1].bottom = Math.max(merged[merged.length - 1].bottom, r.bottom);
    }
    const holes = [];
    for (let i = 1; i < merged.length; i++) holes.push({ from: Math.round(merged[i - 1].bottom), to: Math.round(merged[i].top), gap: Math.round(merged[i].top - merged[i - 1].bottom) });
    return { holes, mergedCount: merged.length, docH: document.documentElement.scrollHeight };
  });
  log('=== PAINTED-CONTENT HOLES ===');
  log('   docH=', gaps.docH, 'painted intervals=', gaps.mergedCount);
  gaps.holes.filter(h => h.gap > 0).sort((a, b) => b.gap - a.gap).slice(0, 12).forEach(h => log(`   gap=${h.gap}px  from y=${h.from} to y=${h.to}`));

  const headGaps = await page.evaluate(() => Array.from(document.querySelectorAll('main h2, main h3')).map(h => { const r = h.getBoundingClientRect(); return { text: (h.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 45), top: Math.round(r.top + window.scrollY), h: Math.round(r.height) }; }));
  log('=== SECTION HEADINGS ===');
  for (let i = 0; i < headGaps.length; i++) {
    const d = i ? headGaps[i].top - headGaps[i - 1].top : 0;
    log(`   y=${String(headGaps[i].top).padStart(5)}  (+${String(d).padStart(4)})  "${headGaps[i].text}"`);
  }

  const clipped = await page.evaluate(() => {
    const out = [];
    for (const el of document.querySelectorAll('main *')) {
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) continue;
      const txt = (el.textContent || '').trim();
      if (!txt) continue;
      if (el.querySelector('*')) continue;
      const overX = el.scrollWidth > el.clientWidth + 1;
      const overY = el.scrollHeight > el.clientHeight + 1;
      const hiddenX = /hidden|clip/.test(cs.overflowX);
      const hiddenY = /hidden|clip/.test(cs.overflowY);
      const ellipsis = cs.textOverflow === 'ellipsis';
      const clamp = cs.webkitLineClamp && cs.webkitLineClamp !== 'none';
      if (overX && hiddenX && !ellipsis) out.push({ kind: 'X-clip-no-ellipsis', txt: txt.slice(0, 60), sw: el.scrollWidth, cw: el.clientWidth, top: Math.round(r.top + window.scrollY), tag: el.tagName, cls: String(el.className).slice(0, 60) });
      else if (overY && hiddenY && !clamp) out.push({ kind: 'Y-clip-no-clamp', txt: txt.slice(0, 60), sh: el.scrollHeight, ch: el.clientHeight, top: Math.round(r.top + window.scrollY), tag: el.tagName, cls: String(el.className).slice(0, 60) });
    }
    return out;
  });
  log('=== TEXT CLIPPED WITHOUT ELLIPSIS OR CLAMP ===');
  clipped.forEach(c => log(`   [${c.kind}] top=${c.top} ${c.sw ? `sw=${c.sw}/cw=${c.cw}` : `sh=${c.sh}/ch=${c.ch}`} "${c.txt}" <${c.tag} class="${c.cls}">`));
  if (!clipped.length) log('   none');

  const pillBefore = await page.evaluate(() => {
    const row = document.querySelector('[role="tablist"][aria-label="Kategorien"]');
    return { sw: row.scrollWidth, cw: row.clientWidth, imgs: Array.from(row.querySelectorAll('img')).map(i => ({ src: i.src.slice(-60), nw: i.naturalWidth })) };
  });
  await page.evaluate(() => { const row = document.querySelector('[role="tablist"][aria-label="Kategorien"]'); row.scrollLeft = row.scrollWidth; });
  await page.waitForTimeout(2500);
  const pillAfter = await page.evaluate(() => {
    const row = document.querySelector('[role="tablist"][aria-label="Kategorien"]');
    return { scrollLeft: row.scrollLeft, imgs: Array.from(row.querySelectorAll('img')).map(i => ({ src: i.src.slice(-60), nw: i.naturalWidth })) };
  });
  log('=== CATEGORY PILL ROW ===');
  log('   row scrollWidth=', pillBefore.sw, 'clientWidth=', pillBefore.cw);
  log('   icons BEFORE h-scroll:', JSON.stringify(pillBefore.imgs));
  log('   icons AFTER  h-scroll (scrollLeft=' + pillAfter.scrollLeft + '):', JSON.stringify(pillAfter.imgs));

  await page.evaluate(() => { document.querySelector('[role="tablist"][aria-label="Kategorien"]').scrollLeft = 0; window.scrollTo(0, 0); });
  await page.waitForTimeout(800);
  const positions = [0, 600, 1400, 2200, 3000, 3800, 4600, 99999];
  const occl = [];
  for (const y of positions) {
    await page.evaluate(yy => window.scrollTo(0, yy), y);
    await page.waitForTimeout(900);
    const res = await page.evaluate(() => {
      const navs = Array.from(document.querySelectorAll('nav')).filter(n => getComputedStyle(n).position === 'fixed');
      const bar = navs[0];
      if (!bar) return { none: true };
      const r = bar.getBoundingClientRect();
      const cs = getComputedStyle(bar);
      const prevPE = bar.style.pointerEvents;
      bar.style.pointerEvents = 'none';
      const xs = [], ys = [];
      for (let i = 0; i <= 8; i++) xs.push(r.left + (r.width * i) / 8);
      for (let j = 0; j <= 3; j++) ys.push(r.top + (r.height * j) / 3);
      const seen = new Map();
      for (const x of xs) for (const yy of ys) {
        const el = document.elementFromPoint(Math.min(389, Math.max(1, x)), Math.min(843, Math.max(1, yy)));
        if (!el) continue;
        const inter = el.closest('a,button,input,select,textarea,[role="button"],[role="tab"],[tabindex]');
        if (inter && !bar.contains(inter)) {
          const ir = inter.getBoundingClientRect();
          const key = inter.tagName + '|' + (inter.textContent || '').trim().slice(0, 30) + '|' + Math.round(ir.top);
          if (!seen.has(key)) seen.set(key, { tag: inter.tagName, text: (inter.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 45), href: inter.getAttribute('href') || '', aria: inter.getAttribute('aria-label') || '', rect: { t: Math.round(ir.top), b: Math.round(ir.bottom), l: Math.round(ir.left), r: Math.round(ir.right) } });
        }
      }
      bar.style.pointerEvents = prevPE;
      return { scrollY: Math.round(window.scrollY), bar: { top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left), right: Math.round(r.right), h: Math.round(r.height), w: Math.round(r.width) }, display: cs.display, opacity: cs.opacity, covered: Array.from(seen.values()) };
    });
    occl.push({ y, res });
  }
  log('=== FLOATING BOTTOM BAR, WHAT IT COVERS ===');
  occl.forEach(({ y, res }) => {
    if (res.none) { log(`   scroll ${y}: NO FIXED NAV FOUND`); return; }
    log(`   scrollY=${res.scrollY} bar top=${res.bar.top} bottom=${res.bar.bottom} l=${res.bar.left} r=${res.bar.right} h=${res.bar.h} w=${res.bar.w} display=${res.display}`);
    if (!res.covered.length) log('      covers: (nothing interactive)');
    res.covered.forEach(c => log(`      COVERS <${c.tag}> "${c.text}" href=${c.href} aria="${c.aria}" rect t=${c.rect.t} b=${c.rect.b} l=${c.rect.l} r=${c.rect.r}`));
  });

  fs.writeFileSync(`${OUT}/pass2.json`, JSON.stringify({ feed, gaps, headGaps, clipped, pillBefore, pillAfter, occl }, null, 2));
  await browser.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
