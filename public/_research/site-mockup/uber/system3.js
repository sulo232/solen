// Uber rules (owner, 2026-10-04), applied live to the real site. Spec: _design-system/references/uber--app-2026.md
// 1 flat white page; content boxes flat (1px #ECECEC hairline, radius 16), no shadow.
// 2 shadow only on things that float: hero search, bottom bar, sticky action bar, circles on photos, segmented selected tab.
// 3 ink #111111 = main action or selected; #F6F6F6 = every other control; primary buttons radius 8, 56 tall when wide.
// 4 meaning colour on pale tints: green proof, red promo, amber membership; blue text links become ink.
// 5 type by role (Inter fitted to Uber word widths): 26/21/18/16, secondary #525252.
// Idempotent: every run first removes what the last run set, then recomputes from the page's own styles.
(() => {
  if (window.__sysInstalled) return; window.__sysInstalled = true;
  const INK = '#111111', FILL = '#F6F6F6', TAG = '#F3F3F3', WHITE = '#FFFFFF', LINE = '#ECECEC', EDGE = '#E0E0E0', T2 = '#525252', T3 = '#6B6B6B';
  const FLOAT = 'rgba(0,0,0,.05) 0 0 0 1px, rgba(0,0,0,.08) 0 4px 16px';
  const FLOAT_SM = 'rgba(0,0,0,.14) 0 2px 8px';
  const BAR_UP = 'rgba(0,0,0,.06) 0 -4px 16px';
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
  const isPaleGreen = (c) => { const a = rgb(c); return a[1] > 200 && a[1] - a[0] > 8 && a[1] - a[2] > 4 && (a.length < 4 || a[3] > 0.5); };
  const isNeutralText = (c) => { const a = rgb(c); return Math.abs(a[0] - a[1]) < 10 && Math.abs(a[1] - a[2]) < 14 && a[0] >= 60 && a[0] <= 175; };
  const vis = (e, r) => { if (r.width < 4 || r.height < 4) return false; const s = getComputedStyle(e); return s.visibility !== 'hidden' && s.display !== 'none'; };
  const txt = (e) => (e.innerText || '').replace(/\s+/g, ' ').trim();
  const textKids = (e) => [e, ...e.querySelectorAll('*')].filter((c) => [...c.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()));
  const onPhoto = (e) => { let n = e.parentElement; for (let i = 0; i < 5 && n; i++, n = n.parentElement) if (n.querySelector(':scope > img, :scope > picture, :scope > video, :scope > span > img, :scope > div > img')) return true; return false; };
  const DAY = /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun|Mo|Di|Mi|Do|Fr|Sa|So)\.? ?\d{1,2}\.?( [A-Za-zäé]{3,5}\.?)?$/;
  const SLOT = /^\d{1,2}:\d{2}$/;
  const COMMIT = /continue|weiter|book|buchen|add|new|save|speichern|pay|confirm|find|subscribe|slot|sign|log/i;
  const isCard = (a) => a && a.querySelector('img') && a.getBoundingClientRect().width <= 400;
  const inListingCard = (e) => !!e.closest('article') || isCard(e.closest('a[href*="/salon/"]'));
  const keepAsIs = (e) => !!e.closest('.mapboxgl-map') || inListingCard(e) || [...e.children].some((c) => c.matches('article') || (c.matches('a[href*="/salon/"]') && isCard(c)));

  let bigImgs = [];
  const overImg = (e) => { const r = e.getBoundingClientRect(); const x = r.left + r.width / 2, y = r.top + r.height / 2; return bigImgs.some((b) => x > b.left && x < b.right && y > b.top && y < b.bottom); };
  function apply() {
    reset();
    bigImgs = [...document.images].map((i) => i.getBoundingClientRect()).filter((b) => b.width >= 300 && b.height >= 150);
    if (!document.getElementById('sys-css')) {
      const st = document.createElement('style'); st.id = 'sys-css';
      st.textContent = '[class*="before:bg-gradient-to-t"]::before{display:none!important} .sys-dot{width:auto!important;color:#6B6B6B}.sys-dot::before{content:"\\00B7"}' +
        '.sys-chip::before,.sys-chip::after,.sys-chip *::before,.sys-chip *::after{box-shadow:none!important;background:transparent!important;border-color:transparent!important}';
      document.head.appendChild(st);
    }
    const W = innerWidth;
    // 1. white page
    for (const e of [document.body, ...document.querySelectorAll('body > div, main, main > div, [class*="min-h-screen"], [class*="bg-s-bg"]')]) {
      const r = e.getBoundingClientRect(); if (r.width < 380) continue;
      if (isGrey(getComputedStyle(e).backgroundColor)) set(e, { 'background-color': WHITE });
    }
    // 2. fixed bars: bottom tab bar floats as a white pill; sticky action bars get a shadow above instead of a line
    for (const e of document.querySelectorAll('body *')) {
      const s = getComputedStyle(e); if (s.position !== 'fixed' && s.position !== 'sticky') continue;
      const r = e.getBoundingClientRect(); if (r.width < W - 2 || r.height > 140 || r.height < 40) continue;
      if (r.bottom < innerHeight - 4) {
        // top bars: flat, white, a hairline only
        if (r.top <= 1 && !isClear(s.backgroundColor)) set(e, { 'box-shadow': 'none', 'background-color': WHITE, 'backdrop-filter': 'none', '-webkit-backdrop-filter': 'none' });
        continue;
      }
      const tabs = e.matches('nav') || e.querySelector(':scope > nav, :scope > div > nav');
      const links = [...e.querySelectorAll('a, button')].filter((a) => a.getBoundingClientRect().width < W / 3);
      if (tabs && links.length >= 3 && !/book|buchen|continue|weiter|pay/i.test(txt(e))) {
        set(e, { left: '16px', right: '16px', width: 'auto', bottom: 'calc(10px + env(safe-area-inset-bottom))', 'border-radius': '9999px', 'background-color': WHITE, 'box-shadow': FLOAT, border: '0', 'border-top': '0', 'padding-bottom': '0', 'backdrop-filter': 'none', '-webkit-backdrop-filter': 'none' });
        for (const k of e.querySelectorAll('*')) { const ks = getComputedStyle(k); if (px(ks.borderTopWidth) > 0 && k.getBoundingClientRect().width > W / 2) set(k, { 'border-top-width': '0', 'padding-bottom': '0' }); if (!isClear(ks.backgroundColor) && k.getBoundingClientRect().width > W / 2) set(k, { 'background-color': 'transparent', 'box-shadow': 'none' }); }
        // active tab: grey capsule behind it
        for (const a of links) { const on = a.getAttribute('aria-current') === 'page' || /\bactive\b/.test(a.className); if (on) set(a, { 'background-color': FILL, 'border-radius': '9999px' }); }
        e.setAttribute('data-sys-box', '1');
      } else {
        set(e, { 'border-top': '0', 'box-shadow': BAR_UP, 'background-color': WHITE, 'backdrop-filter': 'none', '-webkit-backdrop-filter': 'none' });
      }
    }
    const ctrls = [...document.querySelectorAll('button, a, [role=button], [role=tab], [role=switch], select, label')]
      .map((e) => ({ e, r: e.getBoundingClientRect(), s: getComputedStyle(e) })).filter(({ e, r }) => vis(e, r) && r.height <= 90 && r.width <= 420);
    // switches: on = ink
    for (const { e, s } of ctrls) if (e.getAttribute('role') === 'switch' || (isBlue(s.backgroundColor) && e.getBoundingClientRect().height < 34 && !txt(e))) {
      if (isBlue(s.backgroundColor) || e.getAttribute('aria-checked') === 'true') set(e, { 'background-color': INK, 'border-color': INK });
    }
    // chip groups: grey capsules, selected ink (icon chips too, flat)
    const chipLike = ({ e, r, s }) => { const t = txt(e); return t && t.length < 28 && !SLOT.test(t) && r.height >= 28 && r.height <= 60 && r.width < 240 && (px(s.borderTopLeftRadius) >= 10 || e.getAttribute('role') === 'tab' || e.hasAttribute('aria-selected')) && (!isClear(s.backgroundColor) || px(s.borderTopWidth) > 0 || e.getAttribute('role') === 'tab' || e.parentElement?.getAttribute('role') === 'tablist' || s.boxShadow !== 'none' || e.hasAttribute('aria-selected')) && !COMMIT.test(t) && e.getAttribute('role') !== 'switch'; };
    const groups = new Map();
    for (const c of ctrls) if (chipLike(c)) { const p = c.e.parentElement; if (!p) continue; (groups.get(p) || groups.set(p, []).get(p)).push(c); }
    const chipEls = new Set();
    for (const [, list] of groups) {
      if (list.length < 2) continue;
      const bgs = list.map((c) => c.s.backgroundColor); const common = [...bgs].sort((a, b) => bgs.filter((x) => x === a).length - bgs.filter((x) => x === b).length).pop();
      const strong = (c) => ['aria-pressed', 'aria-selected', 'aria-checked'].some((a) => c.e.getAttribute(a) === 'true') || !!c.e.getAttribute('aria-current') || c.e.getAttribute('data-state') === 'active' || isInk(c.s.backgroundColor) || isBlue(c.s.backgroundColor);
      const anyStrong = list.some(strong);
      const ariaDriven = list.some((c) => c.e.hasAttribute('aria-pressed') || c.e.hasAttribute('aria-selected'));
      for (const c of list) {
        const { e, s } = c; chipEls.add(e); e.classList.add('sys-chip');
        const aria = e.getAttribute('aria-pressed') === 'true' || e.getAttribute('aria-selected') === 'true' || !!e.getAttribute('aria-current') || e.getAttribute('data-state') === 'active' || e.getAttribute('aria-checked') === 'true';
        const on = ariaDriven ? aria : (aria || isInk(s.backgroundColor) || isBlue(s.backgroundColor) || (!anyStrong && s.backgroundColor !== common && !isClear(s.backgroundColor) && list.length > 2));
        const day = DAY.test(txt(e));
        set(e, { 'border-radius': day ? '12px' : '9999px', border: '0', 'box-shadow': 'none', 'min-height': '40px', ...(day ? {} : { height: '40px', 'padding-left': '16px', 'padding-right': '16px', 'min-width': '64px', 'justify-content': 'center' }), 'background-color': on ? INK : FILL, color: on ? '#fff' : INK });
        for (const t of textKids(e)) set(t, { color: on ? '#fff' : INK, ...(day ? {} : { 'font-size': '15px', 'font-weight': '500' }) });
        for (const k of e.querySelectorAll('span, div')) { if (k.querySelector('img') || k.matches('img')) continue; const ks = getComputedStyle(k); if (ks.boxShadow !== 'none' || (!isClear(ks.backgroundColor) && !textKids(k).length)) set(k, { 'box-shadow': 'none', background: 'transparent', 'border-color': 'transparent' }); }
        for (const ic of e.querySelectorAll('svg')) set(ic, { color: on ? '#fff' : INK });
      }
    }
    for (const tl of document.querySelectorAll('[role=tablist]')) if (px(getComputedStyle(tl).borderTopWidth) > 0) set(tl, { border: '0' });
    // segmented controls: grey track, white selected tab lifted by a small shadow (Uber Delivery/Pickup)
    for (const tr of document.querySelectorAll('main div, main [role=tablist]')) {
      const ts = getComputedStyle(tr); const btns = [...tr.children].filter((c) => c.tagName === 'BUTTON' && txt(c));
      if (btns.length < 2 || btns.length > 5 || px(ts.borderTopLeftRadius) < 16 || tr.getBoundingClientRect().height > 60) continue;
      const ind = [...tr.querySelectorAll(':scope > *, :scope > button > *')].find((c) => c.tagName !== 'BUTTON' && !txt(c) && getComputedStyle(c).position === 'absolute' && !isClear(getComputedStyle(c).backgroundColor));
      if (!ind) {
        const filled = btns.filter((bt) => !isClear(getComputedStyle(bt).backgroundColor));
        if (filled.length !== 1 || px(ts.borderTopWidth) === 0) continue;
        set(tr, { border: '0', 'background-color': FILL, padding: '4px' });
        for (const bt of btns) { const on = bt === filled[0]; chipEls.add(bt); set(bt, { 'background-color': on ? WHITE : 'transparent', 'box-shadow': on ? FLOAT_SM : 'none', 'border-radius': '9999px' }); for (const k of textKids(bt)) set(k, { color: on ? INK : T2 }); }
        continue;
      }
      set(tr, { border: '0', 'background-color': FILL }); set(ind, { 'background-color': WHITE, 'box-shadow': FLOAT_SM, 'border-radius': '9999px' });
      const ir = ind.getBoundingClientRect();
      for (const bt of btns) { const br = bt.getBoundingClientRect(); const on = Math.abs(br.left + br.width / 2 - (ir.left + ir.width / 2)) < br.width / 2; chipEls.add(bt); for (const k of textKids(bt)) set(k, { color: on ? INK : T2 }); }
    }
    // time slots and booking dates: selected ink, rest grey
    for (const { e, s } of ctrls) {
      const t = txt(e); if (!SLOT.test(t) && !DAY.test(t)) continue; if (chipEls.has(e)) continue;
      const on = isBlue(s.backgroundColor) || isInk(s.backgroundColor) || e.getAttribute('aria-pressed') === 'true' || e.getAttribute('aria-selected') === 'true' || e.getAttribute('aria-checked') === 'true';
      const off = e.disabled || e.getAttribute('aria-disabled') === 'true' || (!on && textKids(e).some((k) => { const c = rgb(getComputedStyle(k).color); return c[0] > 140; }));
      set(e, { 'border-radius': e.getBoundingClientRect().height > 60 ? '12px' : '9999px', border: '0', 'box-shadow': 'none', 'background-color': on ? INK : FILL, color: on ? '#fff' : off ? '#A6A6A6' : INK });
      for (const k of textKids(e)) set(k, { color: on ? '#fff' : off ? '#A6A6A6' : INK });
    }
    for (const { e, r, s } of ctrls) {
      if (chipEls.has(e) || e.__sys || e.closest('.mapboxgl-map')) continue;
      const t = txt(e); const bg = s.backgroundColor; const bd = px(s.borderTopWidth) > 0 && px(s.borderLeftWidth) > 0; // a row with only a divider line is not an outlined button
      if (e.getAttribute('role') === 'switch' || SLOT.test(t) || DAY.test(t)) continue;
      // circle buttons: grey on white; white with a small shadow on a photo (Uber item sheet). The listing-card heart keeps today's look (owner question).
      if (!t || (t.length <= 2 && r.width <= 48)) {
        if (r.height < 24 || r.height > 56 || Math.abs(r.width - r.height) > 8) continue;
        if (inListingCard(e)) continue;
        const label = (e.getAttribute('aria-label') || '').toLowerCase();
        if (onPhoto(e) || overImg(e)) {
          set(e, { 'border-radius': '9999px', 'background-color': WHITE, border: '0', 'box-shadow': FLOAT_SM, 'backdrop-filter': 'none', '-webkit-backdrop-filter': 'none', color: INK });
          for (const k of e.querySelectorAll('span, div')) { const ks = getComputedStyle(k); if (!isClear(ks.backgroundColor) || ks.backdropFilter !== 'none') set(k, { background: 'transparent', 'backdrop-filter': 'none', '-webkit-backdrop-filter': 'none', 'box-shadow': 'none', border: '0' }); }
          for (const ic of e.querySelectorAll('svg')) set(ic, { color: INK, stroke: INK });
          continue;
        }
        if (/close|schlie|cancel|abbrechen|fermer|chiudi/.test(label)) { set(e, { width: '38px', height: '38px', 'min-width': '38px', 'border-radius': '9999px', 'background-color': FILL, border: '0', 'box-shadow': 'none' }); continue; }
        if (isInk(bg)) { set(e, { 'border-radius': '9999px', 'background-color': INK }); continue; }
        if (e.closest('nav') && e.closest('nav').getBoundingClientRect().height > 300) continue; // dashboard rail
        const inner = e.children.length === 1 && e.firstElementChild.matches('span, div') ? e.firstElementChild : null;
        if (inner && isClear(bg) && !bd) { const is = getComputedStyle(inner); if (px(is.borderTopWidth) > 0 || !isClear(is.backgroundColor)) { set(inner, { 'background-color': isInk(is.backgroundColor) ? INK : FILL, border: '0', 'box-shadow': 'none' }); continue; } }
        if (!isClear(bg) || bd || e.closest('header')) set(e, { width: '40px', height: '40px', 'min-width': '40px', 'border-radius': '9999px', 'background-color': FILL, border: '0', 'box-shadow': 'none' });
        continue;
      }
      if (r.height < 30 || r.height > 64) continue;
      if (e.closest('nav') && r.width > 300) continue;
      // primary: ink, radius 8; 56 tall when it spans the screen
      if (isInk(bg) || isBlue(bg)) {
        const big = r.width > 250;
        set(e, { 'background-color': INK, 'border-color': INK, 'border-radius': '8px', 'box-shadow': 'none', height: big ? '56px' : '40px', 'min-height': big ? '56px' : '40px', 'padding-left': big ? '20px' : '16px', 'padding-right': big ? '20px' : '16px' });
        for (const k of textKids(e)) set(k, { 'font-size': big ? '17px' : '15px', 'font-weight': '500', color: '#fff' });
        continue;
      }
      // secondary: grey capsule, no outline
      if ((isWhite(bg) || isClear(bg) || isGrey(bg)) && (bd || isGrey(bg) || s.boxShadow !== 'none') && r.width < 400 && !e.querySelector('svg.lucide-search')) {
        set(e, { 'background-color': FILL, border: '0', 'box-shadow': 'none', 'border-radius': '9999px', height: '40px', 'min-height': '40px', 'padding-left': '16px', 'padding-right': '16px', color: INK });
        for (const k of textKids(e)) set(k, { 'font-size': '15px', 'font-weight': '500', color: INK });
      }
    }
    // inputs: grey capsule; the main search bar floats white with an edge and a soft shadow
    for (const inp of document.querySelectorAll('input:not([type=checkbox]):not([type=radio]):not([type=hidden]):not([type=range]), select')) {
      const r0 = inp.getBoundingClientRect(); if (!vis(inp, r0)) continue;
      let box = inp; for (let i = 0; i < 3; i++) { const p = box.parentElement; if (!p) break; const pr = p.getBoundingClientRect(); const ps = getComputedStyle(p); if (pr.height > 72) break; box = p; if (px(ps.borderTopWidth) > 0 || !isClear(ps.backgroundColor) || ps.boxShadow !== 'none') break; }
      const br = box.getBoundingClientRect(); if (br.height < 30 || br.height > 72) continue;
      if (onPhoto(box)) continue;
      const bs = getComputedStyle(box); if (px(bs.borderTopWidth) === 0 && isClear(bs.backgroundColor) && bs.boxShadow === 'none' && box === inp) continue;
      const hero = !!box.querySelector('svg.lucide-search') && br.width > 300 && br.top < 400;
      set(box, hero ? { 'background-color': WHITE, border: `1px solid ${EDGE}`, 'box-shadow': FLOAT, 'border-radius': '9999px' } : { 'background-color': FILL, border: '0', 'box-shadow': 'none', 'border-radius': br.height > 60 ? '12px' : '9999px' });
      if (box !== inp) set(inp, { 'background-color': 'transparent', border: '0' });
      box.setAttribute('data-sys-box', '1');
    }
    // the search bar as a button (home): same floating white pill
    for (const b of document.querySelectorAll('button, a, div[role=button]')) {
      if (!b.querySelector('svg.lucide-search')) continue; const r = b.getBoundingClientRect(); if (r.width < 300 || r.height < 40 || r.height > 72 || r.top > 400) continue;
      const bs = getComputedStyle(b); if (isClear(bs.backgroundColor) && px(bs.borderTopWidth) === 0 && bs.boxShadow === 'none') continue;
      set(b, { 'background-color': WHITE, border: `1px solid ${EDGE}`, 'box-shadow': FLOAT, 'border-radius': '9999px' }); b.setAttribute('data-sys-box', '1');
    }
    // boxes: flat, white, 1px hairline, radius 16; boxes inside a box are grey fill, radius 12
    const inMain = document.querySelector('main') || document.body;
    for (const e of inMain.querySelectorAll('div, article, section, a, li, ul, ol, form, aside')) {
      if (e.__sys || keepAsIs(e) || e.getAttribute('data-sys-box')) continue;
      const r = e.getBoundingClientRect(); if (e.querySelector('svg.lucide-search') && r.height < 80) continue; // the search bar keeps its pill
      if (!vis(e, r) || r.width < 120 || r.height < (r.width >= 300 ? 40 : 56)) continue;
      const s = getComputedStyle(e); const rad = px(s.borderTopLeftRadius);
      if (rad < 6 || rad > 44) continue;
      const bordered = px(s.borderTopWidth) > 0 && !isClear(s.borderTopColor);
      const shadowed = s.boxShadow !== 'none';
      const bg = s.backgroundColor;
      const photoTile = !!e.querySelector(':scope > img, :scope > picture, :scope > span > img') || (isGrey(bg) && e.querySelector('img') && !txt(e));
      if (photoTile) { set(e, { 'border-radius': (e.closest('[data-sys-box]') ? 12 : 16) + 'px', 'box-shadow': 'none' }); continue; }
      if (!bordered && !shadowed && !isGrey(bg) && !isWhite(bg)) {
        // a pale green tag or banner: Uber's proof tint
        if (isPaleGreen(bg) && r.height < 120) { set(e, { 'background-color': '#EAF6ED', border: '0' }); for (const k of textKids(e)) set(k, { color: '#166C3B' }); }
        continue;
      }
      if (isClear(bg) && !bordered && !shadowed) continue;
      if (e.parentElement && e.parentElement.closest('[data-sys-box]')) { set(e, { 'border-radius': '12px', 'box-shadow': 'none', ...(bordered || shadowed ? { border: '0', 'background-color': FILL } : {}) }); continue; }
      if (r.width >= 390 && r.height > 500) continue; // full-width page panels and sheets
      e.setAttribute('data-sys-box', '1');
      set(e, { 'border-radius': '16px', border: `1px solid ${LINE}`, 'box-shadow': 'none', 'background-color': WHITE });
    }
    // meaning colour: discounts red, small grey tags squared to 4
    for (const e of document.body.querySelectorAll('span, div, p')) {
      const t = txt(e); if (!t || t.length > 24 || e.closest('button.sys-chip')) continue;
      const r = e.getBoundingClientRect(); if (r.height > 30 || r.height < 14 || r.width > 200) continue;
      const s = getComputedStyle(e); if (isClear(s.backgroundColor)) continue;
      if (/^[-−–]\s?\d{1,2}\s?%$/.test(t)) { set(e, { 'background-color': '#D13B20', color: '#fff', 'border-radius': '4px', border: '0' }); for (const k of textKids(e)) set(k, { color: '#fff' }); continue; }
      if (isGrey(s.backgroundColor) && px(s.borderTopLeftRadius) >= 4 && !e.querySelector('svg') && e.children.length <= 1) { set(e, { 'background-color': TAG, 'border-radius': '4px', color: '#5E5E5E' }); for (const k of textKids(e)) set(k, { color: '#5E5E5E' }); }
    }
    // links: blue text becomes ink, underlined (Uber keeps blue for the live-location dot only)
    for (const e of document.body.querySelectorAll('a, button, span')) {
      if (e.closest('.mapboxgl-map')) continue; const s = getComputedStyle(e); if (!isBlue(s.color)) continue;
      if (/^\(\d[\d',.]*\)$/.test(e.textContent.trim())) { set(e, { color: T3 }); continue; }
      set(e, { color: INK, 'text-decoration': 'underline', 'text-underline-offset': '3px', 'font-weight': '500' });
    }
    // salon header: short open state with a clock, address in a grey box with a filled pin (owner's Fresha reference, kept)
    for (const c of inMain.querySelectorAll('.text-s-closed, .text-s-open, [class*="text-s-success"]')) {
      const wrap = c.parentElement; if (!wrap || !/Opens|Closes|Öffnet|Schliesst/.test(wrap.textContent)) continue;
      for (const k of wrap.children) if (k !== c) set(k, { display: 'none' });
      if (!wrap.querySelector('.sys-clock')) { const ns = 'http://www.w3.org/2000/svg'; const sv = document.createElementNS(ns, 'svg'); sv.setAttribute('class', 'sys-clock'); sv.setAttribute('width', '15'); sv.setAttribute('height', '15'); sv.setAttribute('viewBox', '0 0 24 24'); sv.setAttribute('fill', 'none'); sv.setAttribute('stroke', 'currentColor'); sv.setAttribute('stroke-width', '2'); sv.setAttribute('stroke-linecap', 'round'); sv.innerHTML = '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>'; sv.style.cssText = 'display:inline-block;vertical-align:-2px;margin-right:5px'; c.prepend(sv); }
    }
    for (const c of inMain.querySelectorAll('.text-s-open, [class*="text-s-success"]')) set(c, { color: '#166C3B' });
    for (const loc of document.querySelectorAll('button[aria-label="Show location"]')) {
      const sp = loc.previousElementSibling && loc.previousElementSibling.querySelector('span.inline-block.w-\\[14px\\]'); if (sp) sp.classList.add('sys-dot');
      set(loc, { background: FILL, padding: '10px 12px', 'border-radius': '12px', color: INK, gap: '6px', 'margin-top': '12px' });
      const pin = loc.querySelector('svg'); if (pin) set(pin, { fill: INK, stroke: FILL, color: FILL, width: '16px', height: '16px' });
    }
    // floating map button keeps a float shadow (it sits over the list)
    for (const b of document.querySelectorAll('button, a')) if (/^Map$/.test((b.innerText || '').trim())) { set(b, { 'background-color': INK, color: '#fff', 'box-shadow': FLOAT, 'border-radius': '9999px', border: '0' }); for (const k of textKids(b)) set(k, { color: '#fff' }); for (const ic of b.querySelectorAll('svg')) set(ic, { color: '#fff' }); }
    // headings by role
    for (const e of inMain.querySelectorAll('h1, h2, h3, h4, p, span, div')) {
      if (e.children.length) continue; const t = e.textContent.trim(); if (!t || t.length > 40 || e.closest('button, a[class*=rounded-full]')) continue;
      const s = getComputedStyle(e); const f = px(s.fontSize); const w = parseInt(s.fontWeight); if (f < 16 || w < 500 || s.textTransform === 'uppercase') continue;
      const disp = "'Inter Tight', Inter, system-ui, sans-serif";
      const c0 = rgb(s.color); const coloured = Math.max(c0[0], c0[1], c0[2]) - Math.min(c0[0], c0[1], c0[2]) > 30; // keep a meaning colour (green "Free now")
      const INKC = coloured ? s.color : INK;
      if (f >= 24) set(e, { 'font-size': '26px', 'font-weight': '700', 'letter-spacing': '-0.02em', 'font-family': disp, color: INKC });
      else if (f >= 19 || (f >= 17 && /^H[1-3]$/.test(e.tagName))) set(e, { 'font-size': '21px', 'font-weight': '700', 'letter-spacing': '-0.015em', 'font-family': disp, color: INKC });
      else if (f >= 17) set(e, { 'font-size': '18px', 'font-weight': '600', 'letter-spacing': '-0.01em', 'font-family': disp, color: INKC });
      else set(e, { 'font-size': '16px', 'font-weight': '500', color: INKC });
    }
    // uppercase labels: normal case 13/600
    for (const e of inMain.querySelectorAll('p, span, div, h2, h3, h4, label')) { if (e.children.length) continue; const s = getComputedStyle(e); const t = e.textContent.trim(); if (s.textTransform === 'uppercase' && t.length > 3 && !/^[A-Z]{2,3}$/.test(t)) set(e, { 'text-transform': 'none', 'letter-spacing': '0', 'font-size': '13px', 'font-weight': '600' }); }
    // text greys: one secondary (#525252) and one tertiary (#6B6B6B)
    for (const e of document.body.querySelectorAll('p, span, div, dt, dd, small, li, time, label')) {
      if (e.__sys && e.__sys.has('color')) continue; if (![...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
      const c = getComputedStyle(e).color; if (!isNeutralText(c)) continue;
      set(e, { color: rgb(c)[0] < 120 ? T2 : T3 });
    }
    // ink: near-black text unified
    for (const e of document.body.querySelectorAll('h1, h2, h3, h4, p, span, a, button, div')) {
      if (e.__sys && e.__sys.has('color')) continue; if (![...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
      if (isInk(getComputedStyle(e).color)) set(e, { color: INK });
    }
    // notification counts: Uber's red dot, not blue
    for (const e of document.body.querySelectorAll('span, div')) { const r = e.getBoundingClientRect(); if (r.width > 24 || r.height > 24 || r.width < 6) continue; if (isBlue(getComputedStyle(e).backgroundColor)) set(e, { 'background-color': '#DE1135' }); }
    // membership (Solen Status): Uber One's cream tint, amber accents
    const AMBER = '#9F6402', CREAM = '#FDF2DC';
    for (const lab of inMain.querySelectorAll('p, span, div, h2, h3')) {
      if (lab.children.length || !/^(your status|dein status|ton statut|il tuo stato|solen status)$/i.test(lab.textContent.trim())) continue;
      const card = lab.closest('[data-sys-box]'); if (!card) continue;
      set(card, { 'background-color': CREAM, border: '1px solid #E9DFCA' });
      for (const k of card.querySelectorAll('*')) {
        const ks = getComputedStyle(k); const kr = k.getBoundingClientRect();
        if ((isInk(ks.backgroundColor) || /gradient/.test(ks.backgroundImage)) && kr.height <= 30) set(k, { 'background-color': AMBER, 'background-image': 'none', 'border-color': AMBER });
        else if (!isClear(ks.backgroundColor) && (isGrey(ks.backgroundColor) || isWhite(ks.backgroundColor)) && kr.height <= 12) set(k, { 'background-color': '#F3E3C1' });
        else if (isWhite(ks.backgroundColor) && k !== card && kr.height > 12) set(k, { 'background-color': 'transparent' });
      }
    }
    for (const e of inMain.querySelectorAll('span, div, p')) { if (e.children.length > 1) continue; const t = e.textContent.trim(); if (!/^(Gold|Platinum)$/.test(t)) continue; const box = e.closest('[data-sys-box]'); if (!box || /your status|dein status|solen status/i.test(box.textContent)) continue; set(e, { color: AMBER, 'font-weight': '600' }); for (const ic of (e.parentElement || e).querySelectorAll('svg')) set(ic, { color: AMBER }); }
    // full-bleed separators between sections: Uber's 4pt grey band
    for (const e of inMain.querySelectorAll('hr, div')) {
      const r = e.getBoundingClientRect(); if (r.width < W - 2 || r.height > 2 || r.height < 0.5) continue;
      if (e.children.length || txt(e)) continue;
      set(e, { height: '4px', 'background-color': TAG, border: '0' });
    }
    return true;
  }
  let timer = null, busy = false;
  const schedule = (ms = 120) => { clearTimeout(timer); timer = setTimeout(() => { if (busy) return; busy = true; try { apply(); } catch (err) { console.error('[system3] apply failed', err); } busy = false; }, ms); };
  window.__applySystem = () => { apply(); return true; };
  const start = () => {
    schedule(50);
    new MutationObserver((m) => { if (m.some((x) => x.type === 'childList' && (x.addedNodes.length || x.removedNodes.length) && ![...x.addedNodes].every((n) => n.id === 'sys-css'))) schedule(); }).observe(document.body, { childList: true, subtree: true });
    new MutationObserver(() => schedule(150)).observe(document.body, { attributes: true, subtree: true, attributeFilter: ['aria-selected', 'aria-pressed', 'aria-checked', 'data-state'] });
    document.addEventListener('click', () => { schedule(60); schedule(400); }, true);
    addEventListener('resize', () => schedule(200));
    addEventListener('scroll', () => schedule(250), { passive: true });
  };
  if (document.body) start(); else addEventListener('DOMContentLoaded', start);
})();
