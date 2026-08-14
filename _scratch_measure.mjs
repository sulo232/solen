import { chromium } from 'playwright';

const OUT = '/private/tmp/claude-501/-Users-sulo-Documents-solen--claude-worktrees-design-system-consolidation-10167f/68d78dad-21dd-4632-a5a9-f1861516a718/scratchpad/shots';

function parseColor(c) {
  const m = c.match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const parts = m[1].split(',').map(s => parseFloat(s.trim()));
  return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1 };
}
function relLum({ r, g, b }) {
  const srgb = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}
function contrast(c1, c2) {
  const l1 = relLum(c1), l2 = relLum(c2);
  const lighter = Math.max(l1, l2), darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

async function measureState(page, label) {
  await page.screenshot({ path: `${OUT}/${label}.png` });
  const data = await page.evaluate(() => {
    function effectiveOpacity(el) {
      let node = el, op = 1;
      while (node && node !== document.body) {
        const cs = getComputedStyle(node);
        op *= parseFloat(cs.opacity || '1');
        node = node.parentElement;
      }
      return op;
    }
    function isInert(el) {
      let node = el;
      while (node) {
        if (node.inert) return true;
        if (node.getAttribute && node.getAttribute('aria-hidden') === 'true') return true;
        node = node.parentElement;
      }
      return false;
    }
    function isVisible(el) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return false;
      if (r.bottom < 0 || r.top > window.innerHeight) return false;
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none') return false;
      if (effectiveOpacity(el) < 0.4) return false;
      if (isInert(el)) return false;
      return true;
    }
    function bgColorOf(el) {
      let node = el;
      while (node) {
        const cs = getComputedStyle(node);
        const bg = cs.backgroundColor;
        if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') return bg;
        node = node.parentElement;
      }
      return 'rgb(255,255,255)';
    }
    const results = [];
    const sheetRoot = document.querySelector('[class*="z-[101]"]');
    const closeX = document.querySelector('[class*="z-[102]"]');
    const scope = sheetRoot ? [sheetRoot, ...(closeX ? [closeX] : [])] : [document.body];
    const all = [];
    for (const root of scope) {
      all.push(root, ...root.querySelectorAll('*'));
    }
    for (const el of all) {
      if (!isVisible(el)) continue;
      // <input>/<textarea> value/placeholder text is rendered by the browser's internal shadow
      // DOM, never exposed as a childNode, so it needs its own explicit path.
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        const shown = (el.value && el.value.length > 0) ? el.value : el.placeholder;
        if (!shown) continue;
        const cs = getComputedStyle(el);
        const csPlaceholder = getComputedStyle(el, '::placeholder');
        const r = el.getBoundingClientRect();
        results.push({
          text: shown.slice(0, 40) + (el.value ? ' [typed value]' : ' [placeholder]'),
          tag: el.tagName,
          fontSize: parseFloat(cs.fontSize),
          fontWeight: cs.fontWeight,
          color: el.value ? cs.color : csPlaceholder.color,
          bg: bgColorOf(el),
          rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
        });
        continue;
      }
      // only leaf-ish text nodes: element has direct text content
      let hasDirectText = false;
      for (const child of el.childNodes) {
        if (child.nodeType === 3 && child.textContent.trim().length > 0) { hasDirectText = true; break; }
      }
      if (!hasDirectText) continue;
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      results.push({
        text: el.textContent.trim().slice(0, 40),
        tag: el.tagName,
        fontSize: parseFloat(cs.fontSize),
        fontWeight: cs.fontWeight,
        color: cs.color,
        bg: bgColorOf(el),
        rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
      });
    }
    // interactive/tappable rows: buttons, [role=button], a, li with onclick-ish, elements with cursor pointer
    const tappables = [];
    const cands = [];
    for (const root of scope) {
      cands.push(...root.querySelectorAll('button, a, [role="button"], [tabindex]'));
      if (root.matches && root.matches('button, a, [role="button"], [tabindex]')) cands.push(root);
    }
    for (const el of cands) {
      if (!isVisible(el)) continue;
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      tappables.push({
        text: (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 40),
        tag: el.tagName,
        rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
      });
    }
    // extra targeted measurements
    const skeletonEls = document.querySelectorAll('[class*="animate-pulse"]');
    const clearXBtn = Array.from(document.querySelectorAll('button[aria-label="Eingabe loeschen"]'))[0];
    const capsule = document.querySelector('[data-bare-input]')?.closest('div[class*="rounded-"]');
    const msgEl = Array.from(document.querySelectorAll('p')).find(p => p.textContent.includes('Keine Treffer') || p.textContent.includes('konnten nichts'));
    const fieldWrap = document.querySelector('[data-bare-input]')?.closest('div[class*="h-1"]') || capsule;
    const sheetRootRect = sheetRoot ? (() => { const r = sheetRoot.getBoundingClientRect(); return {x:r.x,y:r.y,w:r.width,h:r.height}; })() : null;
    const shimmerEls = document.querySelectorAll('[class*="animate-shimmer"]');
    const extra = {
      skeletonCount: skeletonEls.length,
      shimmerCount: shimmerEls.length,
      sheetRect: sheetRootRect,
      clearXRect: clearXBtn ? (() => { const r = clearXBtn.getBoundingClientRect(); return {x:r.x,y:r.y,w:r.width,h:r.height}; })() : null,
      capsuleRect: capsule ? (() => { const r = capsule.getBoundingClientRect(); return {x:r.x,y:r.y,w:r.width,h:r.height}; })() : null,
      messageRect: msgEl ? (() => { const r = msgEl.getBoundingClientRect(); return {x:r.x,y:r.y,w:r.width,h:r.height, text: msgEl.textContent}; })() : null,
      viewportH: window.innerHeight,
      viewportW: window.innerWidth,
    };
    return { textNodes: results, tappables, extra };
  });

  // compute contrast for each
  const withContrast = data.textNodes.map(n => {
    const fg = parseColor(n.color);
    const bg = parseColor(n.bg);
    let ratio = null;
    if (fg && bg) {
      // flatten fg alpha over bg (assume bg opaque-ish)
      ratio = contrast(fg, bg);
    }
    return { ...n, contrastRatio: ratio ? Math.round(ratio * 100) / 100 : null };
  });

  return { ...data, textNodes: withContrast };
}

const results = {};

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.setDefaultTimeout(60000);

  console.log('Navigating to /de...');
  await page.goto('http://localhost:3000/de', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(3000);

  // dismiss cookie banner
  try {
    const btn = page.getByRole('button', { name: /Nur notwendige/i });
    await btn.waitFor({ timeout: 8000 });
    await btn.click();
    console.log('Dismissed cookie banner');
  } catch (e) {
    console.log('No cookie banner found or already dismissed:', e.message);
  }
  await page.waitForTimeout(500);

  // click left edge of search pill
  await page.evaluate(() => {
    const sp = document.querySelector('[aria-label="Suche bearbeiten"]');
    const r = sp.closest('div[class*="rounded-"]').getBoundingClientRect();
    document.elementFromPoint(Math.round(r.left) + 4, Math.round(r.top + r.height / 2)).click();
  });

  await page.waitForTimeout(900); // let open animation settle (OPEN_MS ~500ms + buffer)

  console.log('=== STATE A: panel just opened ===');
  results.A = await measureState(page, 'A_opened');

  // focus the bare input and type 3 letters, screenshot quickly
  const input = page.getByRole('textbox', { name: 'Service, Salon oder Stylist:in' });
  await input.waitFor({ timeout: 10000 });
  await input.click();
  await page.waitForTimeout(200);
  await input.type('abc', { delay: 30 });
  await page.waitForTimeout(150); // catch mid-loading state, ~400ms total budget
  console.log('=== STATE B: mid-query loading ===');
  results.B = await measureState(page, 'B_loading');

  // clear and type the no-match query
  await input.fill('');
  await page.waitForTimeout(200);
  await input.type('zzzqqqxxx', { delay: 30 });
  await page.waitForTimeout(12000);
  console.log('=== STATE C: no results ===');
  results.C = await measureState(page, 'C_noresults');

  // tap back chevron - find small button under 40px near top left
  const backInfo = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const candidates = btns.filter(b => {
      const r = b.getBoundingClientRect();
      return r.width > 0 && r.width < 44 && r.height < 44 && r.top < 150 && r.left < 100;
    }).map(b => {
      const r = b.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height, aria: b.getAttribute('aria-label'), html: b.outerHTML.slice(0, 200) };
    });
    return candidates;
  });
  console.log('Back button candidates:', JSON.stringify(backInfo, null, 2));

  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const cand = btns.find(b => {
      const r = b.getBoundingClientRect();
      return r.width > 0 && r.width < 44 && r.height < 44 && r.top < 150 && r.left < 100;
    });
    if (cand) cand.click();
  });
  await page.waitForTimeout(600);
  console.log('=== STATE D: after back tap ===');
  results.D = await measureState(page, 'D_afterback');

  // also grab query input value to confirm cleared
  const qval = await input.inputValue().catch(() => 'N/A');
  console.log('Query value after back tap:', JSON.stringify(qval));

  await browser.close();

  const fs = await import('fs');
  fs.writeFileSync(`${OUT}/results.json`, JSON.stringify(results, null, 2));
  console.log('DONE. Results written to results.json');
})().catch(e => { console.error('ERROR:', e); process.exit(1); });
