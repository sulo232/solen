import { chromium } from 'playwright';
import fs from 'fs';
const OUT = '/private/tmp/claude-501/-Users-sulo-Documents-solen--claude-worktrees-design-system-consolidation-10167f/68d78dad-21dd-4632-a5a9-f1861516a718/scratchpad';
const log = (...a) => console.log(...a);
const HOME = 'http://127.0.0.1:3000/de';

async function boot(ctx) {
  const page = await ctx.newPage();
  await page.goto(HOME, { waitUntil: 'domcontentloaded', timeout: 180000 });
  await page.waitForSelector('main', { timeout: 180000 });
  await page.waitForTimeout(2500);
  try { await page.getByRole('button', { name: /notwendige/i }).first().click({ timeout: 12000 }); } catch {}
  await page.waitForTimeout(1200);
  return page;
}

async function describe(page) {
  await page.waitForTimeout(2500);
  return await page.evaluate(() => {
    const main = document.querySelector('main');
    const t = (main ? main.innerText : document.body.innerText).replace(/\s+/g, ' ').trim();
    return {
      url: location.pathname + location.search,
      title: document.title.slice(0, 70),
      h1: Array.from(document.querySelectorAll('h1,h2')).slice(0, 3).map(h => h.textContent.trim().replace(/\s+/g, ' ').slice(0, 45)),
      mainTextLen: t.length,
      preview: t.slice(0, 200),
      links: document.querySelectorAll('main a').length,
      imgs: document.querySelectorAll('main img').length,
      docH: document.documentElement.scrollHeight,
      notFound: /404|nicht gefunden|not found|Seite nicht/i.test(t.slice(0, 400)),
    };
  });
}

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'de-CH' });

  // ================= A. DOES THE BAR BLOCK CLICKS =================
  {
    const page = await boot(ctx);
    log('=== A. DOES THE FLOATING BAR ACTUALLY BLOCK WHAT IT COVERS ===');
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(1200);
    const probe = await page.evaluate(() => {
      const out = [];
      const navs = Array.from(document.querySelectorAll('nav')).filter(n => getComputedStyle(n).position === 'fixed');
      const bar = navs[0];
      const br = bar.getBoundingClientRect();
      const targets = Array.from(document.querySelectorAll('button[aria-label="Speichern"], a[aria-label*="Alle "], button[aria-label="Sprache"]'));
      for (const t of targets) {
        const r = t.getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight) continue;
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        const hit = document.elementFromPoint(cx, cy);
        out.push({
          label: t.getAttribute('aria-label'),
          rect: { t: Math.round(r.top), b: Math.round(r.bottom), l: Math.round(r.left), r: Math.round(r.right) },
          barRect: { t: Math.round(br.top), b: Math.round(br.bottom), l: Math.round(br.left), r: Math.round(br.right) },
          hitTag: hit ? hit.tagName : null,
          hitInBar: hit ? bar.contains(hit) : null,
          hitIsTarget: hit ? (t === hit || t.contains(hit)) : null,
        });
      }
      return out;
    });
    probe.forEach(p => log(`   target "${p.label}" rect ${JSON.stringify(p.rect)} | bar ${JSON.stringify(p.barRect)} | elementFromPoint(center) -> <${p.hitTag}> inBar=${p.hitInBar} isTarget=${p.hitIsTarget}`));

    // real click attempt on the covered save button
    const saveRes = await page.evaluate(() => {
      const navs = Array.from(document.querySelectorAll('nav')).filter(n => getComputedStyle(n).position === 'fixed');
      const bar = navs[0];
      const btns = Array.from(document.querySelectorAll('button[aria-label="Speichern"]'));
      const vis = btns.filter(b => { const r = b.getBoundingClientRect(); return r.top > 0 && r.bottom < innerHeight; });
      return vis.map(b => {
        const r = b.getBoundingClientRect();
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        const hit = document.elementFromPoint(cx, cy);
        const barR = bar.getBoundingClientRect();
        const overlapTop = Math.max(r.top, barR.top), overlapBot = Math.min(r.bottom, barR.bottom);
        const overlapPx = Math.max(0, overlapBot - overlapTop);
        const overlapPct = Math.round((overlapPx / r.height) * 100);
        return { rect: { t: Math.round(r.top), b: Math.round(r.bottom), l: Math.round(r.left), r: Math.round(r.right) }, h: Math.round(r.height), overlapPx: Math.round(overlapPx), overlapPct, hitInBar: bar.contains(hit), hitTag: hit?.tagName, hitAria: hit?.getAttribute?.('aria-label') };
      });
    });
    log('   visible "Speichern" heart buttons in first viewport:');
    saveRes.forEach(s => log(`      rect=${JSON.stringify(s.rect)} h=${s.h} coveredBy bar=${s.overlapPx}px (${s.overlapPct}% of its height) centerHitsBar=${s.hitInBar} hit=<${s.hitTag} aria="${s.hitAria}">`));

    // bottom of page: language button
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(1500);
    const langRes = await page.evaluate(() => {
      const navs = Array.from(document.querySelectorAll('nav')).filter(n => getComputedStyle(n).position === 'fixed');
      const bar = navs[0]; const barR = bar.getBoundingClientRect();
      const out = [];
      for (const el of document.querySelectorAll('button, a')) {
        const r = el.getBoundingClientRect();
        if (r.height === 0 || r.bottom < 0 || r.top > innerHeight) continue;
        const ot = Math.max(r.top, barR.top), ob = Math.min(r.bottom, barR.bottom);
        const ov = Math.max(0, ob - ot);
        if (ov <= 0) continue;
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        const hit = document.elementFromPoint(Math.min(389, cx), Math.min(843, cy));
        out.push({ tag: el.tagName, text: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 30), aria: el.getAttribute('aria-label') || '', rect: { t: Math.round(r.top), b: Math.round(r.bottom), l: Math.round(r.left), r: Math.round(r.right) }, h: Math.round(r.height), overlapPx: Math.round(ov), overlapPct: Math.round(ov / r.height * 100), centerHitsBar: bar.contains(hit), hitTag: hit?.tagName });
      }
      return { barR: { t: Math.round(barR.top), b: Math.round(barR.bottom), l: Math.round(barR.left), r: Math.round(barR.right) }, out, scrollY: Math.round(scrollY), docH: document.documentElement.scrollHeight };
    });
    log(`   AT PAGE BOTTOM (scrollY=${langRes.scrollY}, docH=${langRes.docH}) bar=${JSON.stringify(langRes.barR)}`);
    langRes.out.forEach(o => log(`      OVERLAPS <${o.tag}> "${o.text}" aria="${o.aria}" rect=${JSON.stringify(o.rect)} h=${o.h} overlap=${o.overlapPx}px (${o.overlapPct}%) centerHitsBar=${o.centerHitsBar} hit=<${o.hitTag}>`));
    await page.screenshot({ path: `${OUT}/bar-bottom.png` });
    await page.close();
  }

  // ================= B. GAP MEDIAN =================
  {
    const page = await boot(ctx);
    await page.evaluate(async () => { const s = ms => new Promise(r => setTimeout(r, ms)); for (let y = 0; y < document.documentElement.scrollHeight; y += 500) { window.scrollTo(0, y); await s(90); } window.scrollTo(0, 0); await s(400); });
    await page.waitForTimeout(1500);
    const g = await page.evaluate(() => {
      const feedSections = Array.from(document.querySelectorAll('main section')).filter(s => s.getBoundingClientRect().height > 0);
      const boxes = feedSections.map(s => { const r = s.getBoundingClientRect(); return { top: Math.round(r.top + scrollY), bottom: Math.round(r.bottom + scrollY), h: Math.round(r.height), label: (s.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 34) } });
      boxes.sort((a, b) => a.top - b.top);
      const top = [];
      for (const b of boxes) { if (!top.length || b.top >= top[top.length - 1].bottom) top.push(b); }
      const gaps = [];
      for (let i = 1; i < top.length; i++) gaps.push({ gap: top[i].top - top[i - 1].bottom, after: top[i - 1].label, before: top[i].label, at: top[i - 1].bottom });
      // painted holes
      const rows = [];
      for (const c of document.querySelectorAll('main *')) {
        const r = c.getBoundingClientRect();
        if (r.height <= 0 || r.width <= 0) continue;
        const cs = getComputedStyle(c);
        if (cs.visibility === 'hidden' || cs.opacity === '0') continue;
        const hasText = Array.from(c.childNodes).some(n => n.nodeType === 3 && n.textContent.trim().length);
        const isImg = ['IMG', 'SVG', 'VIDEO', 'CANVAS'].includes(c.tagName);
        const bg = cs.backgroundColor;
        const hasBg = cs.backgroundImage !== 'none' || (bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent' && bg !== 'rgb(255, 255, 255)');
        const hasBorder = parseFloat(cs.borderTopWidth) > 0 || parseFloat(cs.borderBottomWidth) > 0;
        if (hasText || isImg || hasBg || hasBorder) rows.push({ top: r.top + scrollY, bottom: r.bottom + scrollY });
      }
      rows.sort((a, b) => a.top - b.top);
      const merged = [];
      for (const r of rows) { if (!merged.length || r.top > merged[merged.length - 1].bottom) merged.push({ ...r }); else merged[merged.length - 1].bottom = Math.max(merged[merged.length - 1].bottom, r.bottom); }
      const holes = [];
      for (let i = 1; i < merged.length; i++) holes.push({ gap: Math.round(merged[i].top - merged[i - 1].bottom), from: Math.round(merged[i - 1].bottom), to: Math.round(merged[i].top) });
      return { top, gaps, holes };
    });
    const med = arr => { const s = [...arr].sort((a, b) => a - b); return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2; };
    log('=== B. SECTION GAPS ===');
    log('   top-level sections:', g.top.length);
    g.top.forEach(t => log(`      ${String(t.top).padStart(5)}..${String(t.bottom).padStart(5)} h=${String(t.h).padStart(4)} "${t.label}"`));
    const gv = g.gaps.map(x => x.gap);
    log('   section-box gaps:', JSON.stringify(gv), 'median=', med(gv));
    g.gaps.filter(x => x.gap > 2 * med(gv)).forEach(x => log(`      OUTLIER gap=${x.gap} (median ${med(gv)}) at y=${x.at} after "${x.after}"`));
    const hv = g.holes.map(x => x.gap).filter(x => x > 0);
    const hm = med(hv);
    log('   painted-content holes median=', hm, 'count=', hv.length);
    g.holes.filter(x => x.gap > 2 * hm).sort((a, b) => b.gap - a.gap).forEach(x => log(`      HOLE gap=${x.gap}px (>2x median ${hm}) from y=${x.from} to y=${x.to}`));
    await page.close();
  }

  // ================= C. BOTTOM BAR ITEMS =================
  {
    log('=== C. BOTTOM BAR ITEMS ===');
    const page = await boot(ctx);
    const items = await page.evaluate(() => {
      const navs = Array.from(document.querySelectorAll('nav')).filter(n => getComputedStyle(n).position === 'fixed');
      return Array.from(navs[0].querySelectorAll('a')).map(a => { const r = a.getBoundingClientRect(); return { text: a.textContent.trim(), href: a.getAttribute('href'), cx: Math.round(r.left + r.width / 2), cy: Math.round(r.top + r.height / 2), w: Math.round(r.width), h: Math.round(r.height) }; });
    });
    log('   items:', JSON.stringify(items));
    await page.close();
    for (const it of items) {
      const p = await boot(ctx);
      await p.evaluate(() => window.scrollTo(0, 0));
      await p.waitForTimeout(600);
      try {
        await p.mouse.click(it.cx, it.cy);
        await p.waitForLoadState('domcontentloaded', { timeout: 90000 }).catch(() => {});
        await p.waitForTimeout(4000);
      } catch (e) { log('   click err', String(e).slice(0, 80)); }
      const d = await describe(p);
      log(`   TAP "${it.text}" (href=${it.href}) at (${it.cx},${it.cy}) ${it.w}x${it.h}`);
      log(`      -> ${d.url} | title="${d.title}" | h="${d.h1.join(' / ')}" | mainText=${d.mainTextLen}ch links=${d.links} imgs=${d.imgs} docH=${d.docH} notFound=${d.notFound}`);
      log(`      preview: ${d.preview.slice(0, 160)}`);
      await p.screenshot({ path: `${OUT}/tab-${it.text.replace(/\W/g, '') || 'x'}.png` });
      await p.close();
    }
  }

  // ================= D. CATEGORY PILLS =================
  {
    log('=== D. CATEGORY PILL ROW ===');
    const page = await boot(ctx);
    const pills = await page.evaluate(() => {
      const row = document.querySelector('[role="tablist"][aria-label="Kategorien"]');
      return Array.from(row.querySelectorAll('a[role="tab"]')).map(a => ({ label: a.textContent.trim(), href: a.getAttribute('href'), selected: a.getAttribute('aria-selected') }));
    });
    log('   pills:', JSON.stringify(pills));
    await page.close();
    for (const pill of pills) {
      const p = await boot(ctx);
      await p.evaluate(async (label) => {
        const row = document.querySelector('[role="tablist"][aria-label="Kategorien"]');
        const a = Array.from(row.querySelectorAll('a[role="tab"]')).find(x => x.textContent.trim() === label);
        a.scrollIntoView({ block: 'center', inline: 'center' });
      }, pill.label);
      await p.waitForTimeout(700);
      const before = await p.evaluate(() => ({ url: location.pathname + location.search, sel: Array.from(document.querySelectorAll('[role="tab"]')).map(a => a.getAttribute('aria-selected')).join(','), h2: Array.from(document.querySelectorAll('main h2')).slice(0, 2).map(h => h.textContent.trim().slice(0, 30)) }));
      try {
        await p.evaluate(async (label) => {
          const row = document.querySelector('[role="tablist"][aria-label="Kategorien"]');
          const a = Array.from(row.querySelectorAll('a[role="tab"]')).find(x => x.textContent.trim() === label);
          const r = a.getBoundingClientRect();
          const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
          window.__hit = { tag: hit?.tagName, inPill: a.contains(hit) };
          a.click();
        }, pill.label);
        await p.waitForLoadState('domcontentloaded', { timeout: 90000 }).catch(() => {});
        await p.waitForTimeout(4500);
      } catch (e) { log('   pill click err', String(e).slice(0, 100)); }
      const d = await describe(p);
      const after = await p.evaluate(() => ({ sel: Array.from(document.querySelectorAll('[role="tab"]')).map(a => a.textContent.trim() + '=' + a.getAttribute('aria-selected')).join(' '), hit: window.__hit, cards: document.querySelectorAll('main a[href*="/salon/"]').length }));
      log(`   TAP pill "${pill.label}" href=${pill.href}`);
      log(`      before ${before.url} h2=${JSON.stringify(before.h2)}`);
      log(`      after  ${d.url} | title="${d.title}" | mainText=${d.mainTextLen}ch links=${d.links} imgs=${d.imgs} docH=${d.docH} notFound=${d.notFound} salonLinks=${after.cards}`);
      log(`      tabs now: ${after.sel}`);
      log(`      preview: ${d.preview.slice(0, 150)}`);
      await p.screenshot({ path: `${OUT}/pill-${pill.label.replace(/\W/g, '')}.png` });
      await p.close();
    }
  }

  // ================= E. THE BASEL MAP BOX =================
  {
    log('=== E. BASEL MAP BOX ===');
    const p = await boot(ctx);
    const box = await p.evaluate(() => {
      const a = Array.from(document.querySelectorAll('main a')).find(x => /Basel/.test(x.textContent) && /Stores|Karte/.test(x.textContent));
      if (!a) return null;
      const r = a.getBoundingClientRect();
      a.scrollIntoView({ block: 'center' });
      const r2 = a.getBoundingClientRect();
      return { text: a.textContent.trim().replace(/\s+/g, ' '), href: a.getAttribute('href'), aria: a.getAttribute('aria-label'), w: Math.round(r.width), h: Math.round(r.height), cx: Math.round(r2.left + r2.width / 2), cy: Math.round(r2.top + r2.height / 2) };
    });
    log('   box:', JSON.stringify(box));
    if (box) {
      await p.waitForTimeout(800);
      await p.screenshot({ path: `${OUT}/mapbox.png` });
      await p.mouse.click(box.cx, box.cy);
      await p.waitForLoadState('domcontentloaded', { timeout: 90000 }).catch(() => {});
      await p.waitForTimeout(7000);
      const d = await describe(p);
      log(`   -> ${d.url} title="${d.title}" mainText=${d.mainTextLen}ch links=${d.links} docH=${d.docH} notFound=${d.notFound}`);
      log(`   preview: ${d.preview.slice(0, 220)}`);
      const counts = await p.evaluate(async () => {
        const s = ms => new Promise(r => setTimeout(r, ms));
        for (let y = 0; y < document.documentElement.scrollHeight; y += 600) { scrollTo(0, y); await s(200); }
        scrollTo(0, 0); await s(500);
        const txt = document.body.innerText;
        const m = txt.match(/(\d+)\s*(Stores|Ergebnisse|Salons|Treffer)/i);
        return {
          headerMatch: m ? m[0] : null,
          salonLinks: new Set(Array.from(document.querySelectorAll('a[href*="/salon/"]')).map(a => a.getAttribute('href'))).size,
          firstText: txt.replace(/\s+/g, ' ').slice(0, 300),
        };
      });
      log('   result page:', JSON.stringify(counts, null, 1).slice(0, 900));
      await p.screenshot({ path: `${OUT}/mapbox-dest.png`, fullPage: false });
    }
    await p.close();
  }

  await browser.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
