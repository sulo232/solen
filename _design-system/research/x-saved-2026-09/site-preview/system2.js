// The 6 rules from the X-saves comparison (public/_research/x-components), applied live to the real site.
// 1 white page everywhere; boxes float on one soft shadow, no outline.
// 2 three corners: 20 boxes/photos/sheets, 12 inside a box, fully round for anything tappable.
// 3 ink = main action or selected; grey = every other control; blue only for link text.
// 4 hairlines only inside a box.  5 one circle button (grey; glass on photos).  6 colour only with meaning.
// Idempotent: every run first removes what the last run set, then recomputes from the page's own styles.
(() => {
  if (window.__sysInstalled) return; window.__sysInstalled = true;
  const INK = '#0A0A0A', GREY = '#F4F4F5', WHITE = '#FFFFFF', LINE = '#E4E4E7';
  const SHADOW = 'rgba(0,0,0,.04) 0 0 0 1px, rgba(0,0,0,.06) 0 2px 10px';
  const touched = new Set();
  const set = (e, o) => { e.__sys = e.__sys || new Set(); for (const [k, v] of Object.entries(o)) { e.style.setProperty(k, v, 'important'); e.__sys.add(k); } touched.add(e); };
  const reset = () => { for (const e of touched) { for (const k of e.__sys || []) e.style.removeProperty(k); e.__sys = null; e.removeAttribute('data-sys-box'); } touched.clear(); };
  const px = (v) => parseFloat(v) || 0;
  const rgb = (c) => (c.match(/[\d.]+/g) || []).map(Number);
  const isClear = (c) => { const a = rgb(c); return a.length === 4 && a[3] < 0.05; };
  const isWhite = (c) => { const a = rgb(c); return a[0] > 250 && a[1] > 250 && a[2] > 250 && (a.length < 4 || a[3] > 0.9); };
  const isGrey = (c) => { const a = rgb(c); return a[0] >= 236 && a[0] <= 249 && Math.abs(a[0] - a[2]) < 6 && (a.length < 4 || a[3] > 0.9); };
  const isInk = (c) => { const a = rgb(c); return a[0] < 45 && a[1] < 45 && a[2] < 45 && (a.length < 4 || a[3] > 0.9); };
  const isBlue = (c) => { const a = rgb(c); return a[0] === 39 && a[1] === 110 && a[2] === 241; };
  const vis = (e, r) => { if (r.width < 4 || r.height < 4) return false; const s = getComputedStyle(e); return s.visibility !== 'hidden' && s.display !== 'none'; };
  const txt = (e) => (e.innerText || '').replace(/\s+/g, ' ').trim();
  const textKids = (e) => [e, ...e.querySelectorAll('*')].filter((c) => [...c.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()));
  const onPhoto = (e) => { let n = e.parentElement; for (let i = 0; i < 5 && n; i++, n = n.parentElement) if (n.querySelector(':scope > img, :scope > picture, :scope > video, :scope > span > img')) return true; return false; };
  const DAY = /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun|Mo|Di|Mi|Do|Fr|Sa|So)\.? ?\d{1,2}\.?( [A-Za-zäé]{3,5}\.?)?$/;
  const SLOT = /^\d{1,2}:\d{2}$/;
  const COMMIT = /continue|weiter|book|buchen|add|new|save|speichern|pay|confirm|find|subscribe|slot|sign|log/i;

  const isCard = (a) => a && a.querySelector('img') && a.getBoundingClientRect().width <= 400;
  const keepAsIs = (e) => !!e.closest('.mapboxgl-map') || !!e.closest('article') || isCard(e.closest('a[href*="/salon/"]')) || [...e.children].some((c) => c.matches('article') || (c.matches('a[href*="/salon/"]') && isCard(c)));
  function apply() {
    reset();
    if (!document.getElementById('sys-css')) { const st = document.createElement('style'); st.id = 'sys-css'; st.textContent = '[class*="before:bg-gradient-to-t"]::before{display:none!important} .sys-dot{width:auto!important;color:#71717A}.sys-dot::before{content:"\\00B7"}'; document.head.appendChild(st); }
    // 1. white page: any full-width grey surface becomes white
    for (const e of [document.body, ...document.querySelectorAll('body > div, main, main > div, [class*="min-h-screen"], [class*="bg-s-bg"]')]) {
      const r = e.getBoundingClientRect(); if (r.width < 380) continue;
      if (isGrey(getComputedStyle(e).backgroundColor)) set(e, { 'background-color': WHITE });
    }
    const ctrls = [...document.querySelectorAll('button, a, [role=button], [role=tab], [role=switch], select, label')]
      .map((e) => ({ e, r: e.getBoundingClientRect(), s: getComputedStyle(e) })).filter(({ e, r }) => vis(e, r) && r.height <= 90 && r.width <= 420);
    // switches: on = ink, never blue
    for (const { e, s } of ctrls) if (e.getAttribute('role') === 'switch' || (isBlue(s.backgroundColor) && e.getBoundingClientRect().height < 34 && !txt(e))) {
      if (isBlue(s.backgroundColor) || e.getAttribute('aria-checked') === 'true') set(e, { 'background-color': INK, 'border-color': INK });
    }
    // chip groups: parent with 2+ pill-ish text controls
    const chipLike = ({ e, r, s }) => { const t = txt(e); return t && t.length < 28 && !SLOT.test(t) && r.height >= 28 && r.height <= 60 && r.width < 240 && (px(s.borderTopLeftRadius) >= 10 || e.getAttribute('role') === 'tab') && (!isClear(s.backgroundColor) || px(s.borderTopWidth) > 0 || e.getAttribute('role') === 'tab' || e.parentElement?.getAttribute('role') === 'tablist') && !COMMIT.test(t) && e.getAttribute('role') !== 'switch'; };
    const groups = new Map();
    for (const c of ctrls) if (chipLike(c)) { const p = c.e.parentElement; if (!p) continue; (groups.get(p) || groups.set(p, []).get(p)).push(c); }
    const chipEls = new Set();
    for (const [, list] of groups) {
      if (list.length < 2) continue;
      if (list.some((c) => c.e.querySelector('img'))) continue; // owner-protected category pill row (icon images) stays as is
      const bgs = list.map((c) => c.s.backgroundColor); const common = bgs.sort((a, b) => bgs.filter((x) => x === a).length - bgs.filter((x) => x === b).length).pop();
      const strong = (c) => ['aria-pressed', 'aria-selected', 'aria-checked'].some((a) => c.e.getAttribute(a) === 'true') || !!c.e.getAttribute('aria-current') || c.e.getAttribute('data-state') === 'active' || isInk(c.s.backgroundColor) || isBlue(c.s.backgroundColor) || /39, 110, 241, 0\.1/.test(c.s.backgroundColor);
      const anyStrong = list.some(strong);
      const ariaDriven = list.some((c) => c.e.hasAttribute('aria-pressed') || c.e.hasAttribute('aria-selected'));
      for (const c of list) {
        const { e, s } = c; chipEls.add(e);
        const aria = e.getAttribute('aria-pressed') === 'true' || e.getAttribute('aria-selected') === 'true' || !!e.getAttribute('aria-current') || e.getAttribute('data-state') === 'active' || e.getAttribute('aria-checked') === 'true';
        const on = ariaDriven ? aria : (aria || isInk(s.backgroundColor) || isBlue(s.backgroundColor) || /39, 110, 241, 0\.1/.test(s.backgroundColor) || (!anyStrong && s.backgroundColor !== common && !isClear(s.backgroundColor) && list.length > 2));
        const day = DAY.test(txt(e));
        set(e, { 'border-radius': '9999px', border: '0', 'box-shadow': 'none', 'min-height': '44px', ...(day ? {} : { height: '44px', 'padding-left': '16px', 'padding-right': '16px', 'min-width': '64px', 'justify-content': 'center' }), 'background-color': on ? INK : GREY, color: on ? '#fff' : INK });
        for (const t of textKids(e)) set(t, { color: on ? '#fff' : INK, ...(day ? {} : { 'font-size': '14px', 'font-weight': '500' }) });
      }
    }
    for (const tl of document.querySelectorAll('[role=tablist]')) if (px(getComputedStyle(tl).borderTopWidth) > 0) set(tl, { border: '0' });
    // segmented controls (capsule track + sliding indicator): grey track, ink indicator, white selected label
    for (const tr of document.querySelectorAll('main div, main [role=tablist]')) {
      const ts = getComputedStyle(tr); const btns = [...tr.children].filter((c) => c.tagName === 'BUTTON' && txt(c));
      if (btns.length < 2 || btns.length > 5 || px(ts.borderTopLeftRadius) < 16 || tr.getBoundingClientRect().height > 60) continue;
      const ind = [...tr.querySelectorAll(':scope > *, :scope > button > *')].find((c) => c.tagName !== 'BUTTON' && !txt(c) && getComputedStyle(c).position === 'absolute' && !isClear(getComputedStyle(c).backgroundColor));
      if (!ind) {
        const filled = btns.filter((bt) => !isClear(getComputedStyle(bt).backgroundColor));
        if (filled.length !== 1 || px(ts.borderTopWidth) === 0) continue;
        set(tr, { border: '0', 'background-color': GREY, overflow: 'hidden' });
        for (const bt of btns) { const on = bt === filled[0]; chipEls.add(bt); set(bt, { 'background-color': on ? INK : 'transparent', 'border-radius': '9999px' }); for (const k of textKids(bt)) set(k, { color: on ? '#fff' : INK }); }
        continue;
      }
      set(tr, { border: '0', 'background-color': GREY }); set(ind, { 'background-color': INK, 'box-shadow': 'none', 'border-radius': '9999px' });
      const ir = ind.getBoundingClientRect();
      for (const bt of btns) { const br = bt.getBoundingClientRect(); const on = Math.abs(br.left + br.width / 2 - (ir.left + ir.width / 2)) < br.width / 2; chipEls.add(bt); for (const k of textKids(bt)) set(k, { color: on ? '#fff' : INK }); }
    }
    // time slots and booking dates: selected ink, rest grey capsule
    for (const { e, s } of ctrls) {
      const t = txt(e); if (!SLOT.test(t) && !DAY.test(t)) continue; if (chipEls.has(e)) continue;
      const on = isBlue(s.backgroundColor) || isInk(s.backgroundColor) || e.getAttribute('aria-pressed') === 'true' || e.getAttribute('aria-selected') === 'true' || e.getAttribute('aria-checked') === 'true';
      const off = e.disabled || e.getAttribute('aria-disabled') === 'true' || (!on && textKids(e).some((k) => { const c = rgb(getComputedStyle(k).color); return c[0] > 140; }));
      set(e, { 'border-radius': e.getBoundingClientRect().height > 60 ? '20px' : '9999px', border: '0', 'background-color': on ? INK : GREY, color: on ? '#fff' : off ? '#A1A1AA' : INK });
      for (const k of textKids(e)) set(k, { color: on ? '#fff' : off ? '#A1A1AA' : INK });
    }
    for (const { e, r, s } of ctrls) {
      if (chipEls.has(e) || e.__sys || e.closest('.mapboxgl-map')) continue;
      const t = txt(e); const bg = s.backgroundColor; const bd = px(s.borderTopWidth) > 0;
      if (e.getAttribute('role') === 'switch' || SLOT.test(t) || DAY.test(t)) continue;
      // 5. circle buttons
      if (!t || (t.length <= 2 && r.width <= 48)) {
        if (r.height < 30 || r.height > 56 || Math.abs(r.width - r.height) > 8) continue;
        if (onPhoto(e)) continue; // glass on photos stays
        const label = (e.getAttribute('aria-label') || '').toLowerCase();
        if (/close|schlie|cancel|abbrechen|fermer|chiudi/.test(label)) { set(e, { width: '38px', height: '38px', 'min-width': '38px', 'border-radius': '9999px', 'background-color': GREY, border: '0', 'box-shadow': 'none' }); continue; }
        if (isInk(bg)) { set(e, { 'border-radius': '9999px' }); continue; }
        if (e.closest('nav') && e.closest('nav').getBoundingClientRect().height > 300) continue; // dashboard rail keeps its rounded squares
        if (!isClear(bg) || bd || e.closest('header')) set(e, { width: '44px', height: '44px', 'min-width': '44px', 'border-radius': '9999px', 'background-color': GREY, border: '0', 'box-shadow': 'none' });
        continue;
      }
      if (r.height < 34 || r.height > 64) continue;
      if (e.closest('nav') && r.width > 300) continue;
      // 3. primary
      if (isInk(bg) || isBlue(bg)) {
        const big = r.width > 250;
        set(e, { 'background-color': INK, 'border-color': INK, 'border-radius': '9999px', height: big ? '52px' : '44px', 'min-height': big ? '52px' : '44px', 'padding-left': '20px', 'padding-right': '20px' });
        for (const k of textKids(e)) set(k, { 'font-size': '15px', 'font-weight': '500', color: '#fff' });
        continue;
      }
      // 3. secondary: grey capsule, no outline
      if ((isWhite(bg) || isClear(bg) || isGrey(bg)) && (bd || isGrey(bg)) && r.width < 400 && !e.querySelector('svg.lucide-search')) {
        set(e, { 'background-color': GREY, border: '0', 'box-shadow': 'none', 'border-radius': '9999px', height: '44px', 'min-height': '44px', 'padding-left': '18px', 'padding-right': '18px', color: INK });
        for (const k of textKids(e)) set(k, { 'font-size': '15px', 'font-weight': '500', color: INK });
      }
    }
    // inputs: one grey pill, no outline
    for (const inp of document.querySelectorAll('input:not([type=checkbox]):not([type=radio]):not([type=hidden]):not([type=range]), select')) {
      const r0 = inp.getBoundingClientRect(); if (!vis(inp, r0)) continue;
      let box = inp; for (let i = 0; i < 3; i++) { const p = box.parentElement; if (!p) break; const pr = p.getBoundingClientRect(); const ps = getComputedStyle(p); if (pr.height > 72) break; box = p; if (px(ps.borderTopWidth) > 0 || !isClear(ps.backgroundColor)) break; }
      const br = box.getBoundingClientRect(); if (br.height < 30 || br.height > 72) continue;
      if (onPhoto(box)) continue;
      const bs = getComputedStyle(box); if (px(bs.borderTopWidth) === 0 && isClear(bs.backgroundColor) && box === inp) continue;
      set(box, { 'background-color': GREY, border: '0', 'box-shadow': 'none', 'border-radius': br.height > 60 ? '20px' : '9999px' });
      if (box !== inp) set(inp, { 'background-color': 'transparent', border: '0' });
    }
    // 1+2. boxes: white, 20, shadow, no outline; nested boxes 12
    const inMain = document.querySelector('main') || document.body;
    for (const e of inMain.querySelectorAll('div, article, section, a, li, ul, ol, form, aside')) {
      if (e.__sys || keepAsIs(e)) continue;
      const r = e.getBoundingClientRect(); if (!vis(e, r) || r.width < 120 || r.height < (r.width >= 300 ? 40 : 56)) continue;
      const s = getComputedStyle(e); const rad = px(s.borderTopLeftRadius);
      if (rad < 6 || rad > 44) continue;
      const bordered = px(s.borderTopWidth) > 0 && !isClear(s.borderTopColor);
      const bg = s.backgroundColor;
      const photoTile = !!e.querySelector(':scope > img, :scope > picture, :scope > span > img') || (isGrey(bg) && e.querySelector('img') && !txt(e));
      if (photoTile) { set(e, { 'border-radius': (e.closest('[data-sys-box]') ? 12 : 20) + 'px' }); continue; }
      if (!bordered && !isGrey(bg) && !isWhite(bg)) continue;
      if (isClear(bg) && !bordered) continue;
      if (e.parentElement && e.parentElement.closest('[data-sys-box]')) { set(e, { 'border-radius': '12px', ...(bordered ? { border: '0', 'background-color': GREY } : {}) }); continue; }
      if (r.width >= 390 && r.height > 500) continue; // full-width page panels and sheets
      e.setAttribute('data-sys-box', '1');
      set(e, { 'border-radius': '20px', border: '0', 'box-shadow': SHADOW, 'background-color': WHITE });
    }
    for (const sc of inMain.querySelectorAll('div, ul')) {
      const ss = getComputedStyle(sc); if (!/auto|scroll/.test(ss.overflowX) || !sc.querySelector(':scope > [data-sys-box], :scope > * > [data-sys-box]')) continue;
      set(sc, { 'padding-top': (px(ss.paddingTop) + 6) + 'px', 'margin-top': (px(ss.marginTop) - 6) + 'px', 'padding-bottom': (px(ss.paddingBottom) + 14) + 'px', 'margin-bottom': (px(ss.marginBottom) - 14) + 'px' });
    }
    // salon header: short open state with a clock (owner reference: Fresha, "Closed" only), grey review count
    for (const c of inMain.querySelectorAll('.text-s-closed, .text-s-open, [class*="text-s-success"]')) {
      const wrap = c.parentElement; if (!wrap || !/Opens|Closes|Öffnet|Schliesst/.test(wrap.textContent)) continue;
      for (const k of wrap.children) if (k !== c) set(k, { display: 'none' });
      if (!wrap.querySelector('.sys-clock')) { const ns = 'http://www.w3.org/2000/svg'; const sv = document.createElementNS(ns, 'svg'); sv.setAttribute('class', 'sys-clock'); sv.setAttribute('width', '15'); sv.setAttribute('height', '15'); sv.setAttribute('viewBox', '0 0 24 24'); sv.setAttribute('fill', 'none'); sv.setAttribute('stroke', 'currentColor'); sv.setAttribute('stroke-width', '2'); sv.setAttribute('stroke-linecap', 'round'); sv.innerHTML = '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>'; sv.style.cssText = 'display:inline-block;vertical-align:-2px;margin-right:5px'; c.prepend(sv); }
    }
    for (const e of document.body.querySelectorAll('span, button, a')) { if (e.children.length || !/^\(\d[\d',.]*\)$/.test(e.textContent.trim())) continue; if (isBlue(getComputedStyle(e).color) || /\btext-s-accent\b/.test(e.className)) set(e, { color: '#71717A' }); }
    // salon header address: grey 12px box with a filled pin (owner reference: Fresha salon header)
    for (const loc of document.querySelectorAll('button[aria-label="Show location"]')) {
      const sp = loc.previousElementSibling && loc.previousElementSibling.querySelector('span.inline-block.w-\\[14px\\]'); if (sp) sp.classList.add('sys-dot');
      set(loc, { background: '#F4F4F5', padding: '10px 12px', 'border-radius': '12px', color: '#0A0A0A', gap: '6px', 'margin-top': '12px' });
      const pin = loc.querySelector('svg'); if (pin) set(pin, { fill: '#0A0A0A', stroke: '#F4F4F5', color: '#F4F4F5', width: '16px', height: '16px' });
    }
    // ?flat=1 (buttons comparison only): every icon control and floating button drops shadow, outline and blur,
    // taking the flat grey circle the owner pointed at (the 38px close)
    if (/[?&]flat=1/.test(location.search)) {
      for (const b of document.querySelectorAll('button[aria-label], a[aria-label]')) {
        if (!/^(save|saved|share|share profile|remove from saved|add|added|back|close)$/i.test(b.getAttribute('aria-label'))) continue;
        for (const t of [b, ...b.querySelectorAll('span')]) {
          const cs = getComputedStyle(t); if (cs.borderTopLeftRadius === '0px') continue;
          if (isClear(cs.backgroundColor) && cs.borderTopWidth === '0px' && cs.boxShadow === 'none' && cs.backdropFilter === 'none') continue;
          set(t, { 'box-shadow': 'none', 'border-color': 'transparent', 'backdrop-filter': 'none', '-webkit-backdrop-filter': 'none', background: '#F4F4F5' });
        }
      }
      for (const b of document.querySelectorAll('button, a')) if (/^Map$/.test((b.innerText || '').trim())) set(b, { 'box-shadow': 'none' });
      // the image category chips (white with a shadow today) take the grey chip; selected is ink (owner, 2026-10-04)
      if (!document.getElementById('sys-flat-css')) { const st = document.createElement('style'); st.id = 'sys-flat-css'; st.textContent = '.sys-flatchip::before,.sys-flatchip::after,.sys-flatchip *::before,.sys-flatchip *::after{box-shadow:none!important;background:transparent!important;border-color:transparent!important}'; document.head.appendChild(st); }
      for (const a of document.querySelectorAll('a[aria-selected], button[aria-selected]')) {
        if (!a.querySelector('img, svg') || a.getBoundingClientRect().height > 56) continue;
        const sel = a.getAttribute('aria-selected') === 'true'; a.classList.add('sys-flatchip');
        set(a, { background: sel ? '#0A0A0A' : '#F4F4F5', color: sel ? '#FFFFFF' : '#0A0A0A', 'box-shadow': 'none', border: '0' });
        for (const k of a.querySelectorAll('span, div')) { if (k.querySelector('img') || k.matches('img')) continue; const c = getComputedStyle(k); if (c.boxShadow !== 'none' || !isClear(c.backgroundColor)) set(k, { 'box-shadow': 'none', background: 'transparent', 'border-color': 'transparent' }); if (sel) set(k, { color: '#FFFFFF' }); }
        if (sel) for (const ic of a.querySelectorAll('svg')) set(ic, { color: '#FFFFFF', stroke: '#FFFFFF' });
      }
    }
    // headings: LOCKFILE roles, four sizes
    for (const e of inMain.querySelectorAll('h1, h2, h3, h4, p, span, div')) {
      if (e.children.length) continue; const t = e.textContent.trim(); if (!t || t.length > 40 || e.closest('button, a[class*=rounded-full]')) continue;
      const s = getComputedStyle(e); const f = px(s.fontSize); const w = parseInt(s.fontWeight); if (f < 16 || w < 500 || s.textTransform === 'uppercase') continue;
      const disp = "'Inter Tight', Inter, system-ui, sans-serif";
      if (f >= 28) set(e, { 'font-size': '30px', 'font-weight': '600', 'letter-spacing': '-0.02em', 'font-family': disp });
      else if (f >= 20) set(e, { 'font-size': '22px', 'font-weight': '600', 'letter-spacing': '-0.015em', 'font-family': disp });
      else if (f >= 17) set(e, { 'font-size': '18px', 'font-weight': '600', 'letter-spacing': '-0.01em', 'font-family': disp });
      else set(e, { 'font-size': '16px', 'font-weight': '600' });
    }
    // uppercase labels: normal case 13/600
    for (const e of inMain.querySelectorAll('p, span, div, h2, h3, h4, label')) { if (e.children.length) continue; const s = getComputedStyle(e); const t = e.textContent.trim(); if (s.textTransform === 'uppercase' && t.length > 3 && !/^[A-Z]{2,3}$/.test(t)) set(e, { 'text-transform': 'none', 'letter-spacing': '0', 'font-size': '13px', 'font-weight': '600' }); }
    return true;
  }
  let timer = null, busy = false;
  const schedule = (ms = 120) => { clearTimeout(timer); timer = setTimeout(() => { if (busy) return; busy = true; try { apply(); } catch (err) { console.error('[system2] apply failed', err); } busy = false; }, ms); };
  window.__applySystem = () => { apply(); return true; };
  const start = () => {
    schedule(50);
    new MutationObserver((m) => { if (m.some((x) => x.type === 'childList' && (x.addedNodes.length || x.removedNodes.length))) schedule(); }).observe(document.body, { childList: true, subtree: true });
    new MutationObserver(() => schedule(150)).observe(document.body, { attributes: true, subtree: true, attributeFilter: ['class', 'aria-selected', 'aria-pressed', 'aria-checked', 'data-state'] });
    document.addEventListener('click', () => { schedule(60); schedule(400); }, true);
    addEventListener('resize', () => schedule(200));
    addEventListener('scroll', () => schedule(250), { passive: true });
  };
  if (document.body) start(); else addEventListener('DOMContentLoaded', start);
})();
