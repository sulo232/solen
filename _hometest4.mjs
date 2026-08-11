import { chromium } from 'playwright';
const log = (...a) => console.log(...a);
const OUT = '/private/tmp/claude-501/-Users-sulo-Documents-solen--claude-worktrees-design-system-consolidation-10167f/68d78dad-21dd-4632-a5a9-f1861516a718/scratchpad';

async function boot(ctx, url = 'http://127.0.0.1:3000/de') {
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 240000 });
  await page.waitForSelector('main', { timeout: 240000 });
  await page.waitForTimeout(3000);
  try { await page.getByRole('button', { name: /notwendige/i }).first().click({ timeout: 12000 }); } catch {}
  await page.waitForTimeout(1500);
  return page;
}

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'de-CH' });

  // ---------- 1. THE MAP TILE: what is at each point of it ----------
  log('=== 1. MAP TILE HIT MAP ===');
  {
    const p = await boot(ctx);
    const info = await p.evaluate(async () => {
      const a = Array.from(document.querySelectorAll('main a')).find(x => /Basel/.test(x.textContent) && /Stores/.test(x.textContent));
      a.scrollIntoView({ block: 'center' });
      await new Promise(r => setTimeout(r, 900));
      const r = a.getBoundingClientRect();
      const grid = [];
      for (let j = 1; j <= 5; j++) for (let i = 1; i <= 7; i++) {
        const x = r.left + (r.width * i) / 8, y = r.top + (r.height * j) / 6;
        const el = document.elementFromPoint(x, y);
        const link = el?.closest('a');
        grid.push({ i, j, x: Math.round(x), y: Math.round(y), tag: el?.tagName, href: link?.getAttribute('href') || null, isTile: link === a });
      }
      const markers = Array.from(a.querySelectorAll('a')).map(m => { const mr = m.getBoundingClientRect(); return { href: m.getAttribute('href'), text: m.textContent.trim().slice(0, 20), w: Math.round(mr.width), h: Math.round(mr.height) }; });
      const innerLinks = a.querySelectorAll('a').length;
      return { rect: { t: Math.round(r.top), b: Math.round(r.bottom), l: Math.round(r.left), r: Math.round(r.right), w: Math.round(r.width), h: Math.round(r.height) }, grid, innerLinks, markers: markers.slice(0, 25), tileHref: a.getAttribute('href'), label: a.textContent.match(/Basel\s*(\d+)\s*Stores/)?.[0] };
    });
    log('   tile rect', JSON.stringify(info.rect), 'href=', info.tileHref, 'label=', info.label);
    log('   nested <a> inside the tile:', info.innerLinks);
    info.markers.forEach(m => log(`      marker "${m.text}" -> ${m.href} (${m.w}x${m.h})`));
    const byHref = {};
    info.grid.forEach(g => { const k = g.isTile ? 'TILE(map)' : (g.href || 'none/' + g.tag); byHref[k] = (byHref[k] || 0) + 1; });
    log('   35-point hit grid over the tile:');
    Object.entries(byHref).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => log(`      ${v}/35 points -> ${k}`));
    const tileHits = info.grid.filter(g => g.isTile).length;
    log(`   >>> points landing on the map link itself: ${tileHits}/35 (${Math.round(tileHits / 35 * 100)}%)`);
    const center = info.grid.find(g => g.i === 4 && g.j === 3);
    log('   >>> centre point:', JSON.stringify(center));
    await p.close();
  }

  // ---------- 2. MAP DESTINATION + COUNT MATCH ----------
  log('=== 2. /de/search?view=map COUNT MATCH ===');
  {
    const p = await boot(ctx, 'http://127.0.0.1:3000/de/search?view=map');
    await p.waitForTimeout(9000);
    const d = await p.evaluate(async () => {
      const s = ms => new Promise(r => setTimeout(r, ms));
      for (let y = 0; y < document.documentElement.scrollHeight; y += 500) { scrollTo(0, y); await s(220); }
      scrollTo(0, 0); await s(700);
      const txt = document.body.innerText.replace(/\s+/g, ' ');
      return {
        url: location.pathname + location.search,
        counts: txt.match(/\d+\s*(Stores?|Ergebnisse?|Salons?|Treffer|gefunden)/gi) || [],
        salonHrefs: Array.from(new Set(Array.from(document.querySelectorAll('a[href*="/salon/"]')).map(a => a.getAttribute('href').split('?')[0]))),
        preview: txt.slice(0, 320),
        docH: document.documentElement.scrollHeight,
      };
    });
    log('   url:', d.url, 'docH:', d.docH);
    log('   count strings on page:', JSON.stringify(d.counts));
    log('   distinct salon links listed:', d.salonHrefs.length);
    log('   preview:', d.preview.slice(0, 260));
    await p.screenshot({ path: `${OUT}/searchmap.png` });
    await p.close();
  }

  // ---------- 3. COIFFEUR PILL, LONG WAIT ----------
  log('=== 3. /de/coiffeur RETEST (long wait) ===');
  {
    const p = await boot(ctx, 'http://127.0.0.1:3000/de/coiffeur');
    for (const w of [3000, 8000, 15000]) {
      await p.waitForTimeout(w);
      const d = await p.evaluate(() => {
        const m = document.querySelector('main');
        return { t: (m ? m.innerText : '').replace(/\s+/g, ' ').trim().length, links: document.querySelectorAll('main a').length, imgs: document.querySelectorAll('main img').length, docH: document.documentElement.scrollHeight, preview: (m ? m.innerText : '').replace(/\s+/g, ' ').trim().slice(0, 140), bodyLen: document.body.innerText.replace(/\s+/g, ' ').trim().length };
      });
      log(`   after +${w}ms: mainText=${d.t}ch bodyText=${d.bodyLen}ch links=${d.links} imgs=${d.imgs} docH=${d.docH} :: "${d.preview}"`);
    }
    await p.screenshot({ path: `${OUT}/coiffeur.png` });
    await p.close();
  }

  // ---------- 4. /de/inspo LONG WAIT ----------
  log('=== 4. /de/inspo RETEST (long wait) ===');
  {
    const p = await boot(ctx, 'http://127.0.0.1:3000/de/inspo');
    for (const w of [4000, 10000, 15000]) {
      await p.waitForTimeout(w);
      const d = await p.evaluate(() => {
        const m = document.querySelector('main');
        return { t: (m ? m.innerText : '').replace(/\s+/g, ' ').trim().length, links: document.querySelectorAll('main a').length, imgs: document.querySelectorAll('main img').length, broken: Array.from(document.querySelectorAll('main img')).filter(i => i.getBoundingClientRect().width > 0 && i.naturalWidth === 0).length, docH: document.documentElement.scrollHeight, preview: (m ? m.innerText : '').replace(/\s+/g, ' ').trim().slice(0, 150) };
      });
      log(`   after +${w}ms: mainText=${d.t}ch links=${d.links} imgs=${d.imgs} brokenImgs=${d.broken} docH=${d.docH} :: "${d.preview}"`);
    }
    await p.screenshot({ path: `${OUT}/inspo.png` });
    await p.close();
  }

  // ---------- 5. THE FOOTER LANGUAGE BUTTON UNDER THE BAR ----------
  log('=== 5. FOOTER CONTROLS AT MAX SCROLL ===');
  {
    const p = await boot(ctx);
    await p.evaluate(async () => { const s = ms => new Promise(r => setTimeout(r, ms)); for (let y = 0; y < document.documentElement.scrollHeight; y += 500) { scrollTo(0, y); await s(90); } });
    await p.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
    await p.waitForTimeout(2500);
    const st = await p.evaluate(() => ({ scrollY: Math.round(scrollY), maxScroll: document.documentElement.scrollHeight - innerHeight, docH: document.documentElement.scrollHeight }));
    log('   scrollY=', st.scrollY, 'maxScroll=', st.maxScroll, 'docH=', st.docH);
    const before = await p.evaluate(() => location.pathname);
    // real tap on the DE button centre
    const de = await p.evaluate(() => { const b = Array.from(document.querySelectorAll('button')).find(x => x.getAttribute('aria-label') === 'Sprache wählen'); const r = b.getBoundingClientRect(); return { cx: Math.round(r.left + r.width / 2), cy: Math.round(r.top + r.height / 2), rect: { t: Math.round(r.top), b: Math.round(r.bottom), l: Math.round(r.left), r: Math.round(r.right) } }; });
    log('   DE button rect', JSON.stringify(de.rect), 'tapping centre', de.cx, de.cy);
    await p.mouse.click(de.cx, de.cy);
    await p.waitForTimeout(3500);
    const after = await p.evaluate(() => ({ path: location.pathname, menuOpen: !!document.querySelector('[role="dialog"],[role="menu"],[data-state="open"]'), body: document.body.innerText.replace(/\s+/g, ' ').slice(0, 90) }));
    log(`   before=${before} after=${after.path} languageMenuOpened=${after.menuOpen}`);
    log(`   >>> ${after.path !== before ? 'THE TAP NAVIGATED AWAY (the nav bar swallowed it)' : 'stayed on page'}`);
    await p.screenshot({ path: `${OUT}/footer-de.png` });
    await p.close();
  }

  // ---------- 6. WHAT IS PERMANENTLY UNDER THE BAR AT MAX SCROLL ----------
  log('=== 6. CONTENT PERMANENTLY UNDER THE BAR AT MAX SCROLL ===');
  {
    const p = await boot(ctx);
    await p.evaluate(async () => { const s = ms => new Promise(r => setTimeout(r, ms)); for (let y = 0; y < document.documentElement.scrollHeight; y += 500) { scrollTo(0, y); await s(90); } scrollTo(0, document.documentElement.scrollHeight); await s(900); });
    await p.waitForTimeout(1500);
    const r = await p.evaluate(() => {
      const bar = Array.from(document.querySelectorAll('nav')).filter(n => getComputedStyle(n).position === 'fixed')[0];
      const br = bar.getBoundingClientRect();
      const out = [];
      for (const el of document.querySelectorAll('body *')) {
        if (bar.contains(el) || el.contains(bar)) continue;
        const rr = el.getBoundingClientRect();
        if (rr.height <= 0 || rr.width <= 0) continue;
        const hasOwnText = Array.from(el.childNodes).some(n => n.nodeType === 3 && n.textContent.trim().length);
        if (!hasOwnText) continue;
        const ot = Math.max(rr.top, br.top), ob = Math.min(rr.bottom, br.bottom);
        if (ob - ot <= 0) continue;
        out.push({ tag: el.tagName, text: el.textContent.trim().replace(/\s+/g, ' ').slice(0, 40), t: Math.round(rr.top), b: Math.round(rr.bottom), l: Math.round(rr.left), overlap: Math.round(ob - ot), pct: Math.round((ob - ot) / rr.height * 100) });
      }
      return { bar: { t: Math.round(br.top), b: Math.round(br.bottom) }, out, vh: innerHeight, docH: document.documentElement.scrollHeight, scrollY: Math.round(scrollY) };
    });
    log(`   bar t=${r.bar.t} b=${r.bar.b}, viewport ${r.vh}, at max scroll (${r.scrollY})`);
    r.out.forEach(o => log(`      <${o.tag}> "${o.text}" t=${o.t} b=${o.b} l=${o.l} overlap=${o.overlap}px (${o.pct}%)`));
    if (!r.out.length) log('      nothing with text overlaps');
    await p.close();
  }

  await browser.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
