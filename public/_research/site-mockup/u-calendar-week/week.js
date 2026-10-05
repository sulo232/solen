// Week view mockup: renders window.WEEKS into each .wk container. Nothing is saved.
(() => {
  const STAFF = { Jonas: { lane: 0, tint: '#F7F0E4', bar: '#C29A5B', img: 'jonas.jpg' }, Mia: { lane: 1, tint: '#EEF4EC', bar: '#7FA37A', img: 'mia.jpg' }, Nina: { lane: 2, tint: '#F1EEF8', bar: '#9383C4', img: 'nina.jpg' } };
  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const WEEKS = Object.keys(window.WEEKS);
  const st = { w: '10', day: 6, hidden: new Set() };
  const mins = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const hhmm = (m) => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const chf = (n) => `CHF ${n.toLocaleString('de-CH')}`;
  const firstActive = (w) => Math.min(...window.WEEKS[w].map((b) => b[0]));

  // lanes per day: events that overlap in time share the column, others take the full width
  function lanes(evs) {
    const out = new Map(); const sorted = [...evs].sort((a, b) => mins(a[1]) - mins(b[1]));
    let cluster = [], end = -1;
    const flush = () => { const ends = []; for (const e of cluster) { const s0 = mins(e[1]); let l = ends.findIndex((x) => x <= s0); if (l < 0) { l = ends.length; ends.push(0); } ends[l] = s0 + e[2]; out.set(e, { l }); } for (const e of cluster) out.get(e).n = ends.length; cluster = []; };
    for (const e of sorted) { const s0 = mins(e[1]); if (cluster.length && s0 >= end) flush(); cluster.push(e); end = Math.max(end, s0 + e[2]); }
    if (cluster.length) flush();
    return out;
  }
  function render() {
    const list = window.WEEKS[st.w].filter((b) => !st.hidden.has(b[3]));
    const startH = Math.min(8, ...list.map((b) => Math.floor(mins(b[1]) / 60)));
    const endH = Math.max(19, ...list.map((b) => Math.ceil((mins(b[1]) + b[2]) / 60)));
    const has = new Set(window.WEEKS[st.w].map((b) => b[0]));
    for (const wk of document.querySelectorAll('.wk')) {
      const ph = wk.dataset.size === 'd' ? 56 : 44;
      const head = DAYS.map((d, i) => `<button class="wd${i === st.day ? ' on' : ''}" data-day="${i}" aria-pressed="${i === st.day}"><span>${d}</span><b>${+st.w + i}</b><i${has.has(i) ? '' : ' class="none"'}></i></button>`).join('');
      let body = '';
      for (let h = startH; h <= endH; h++) { const y = (h - startH) * ph; body += `<div class="wkhr" style="top:${y}px">${String(h % 24).padStart(2, '0')}:00</div><div class="wkln" style="top:${y}px"></div>`; }
      const cols = DAYS.map((_, i) => { const dayEvs = list.filter((b) => b[0] === i); const L = lanes(dayEvs); return `<div class="wkcol${i === st.day ? ' on' : ''}" data-day="${i}">` + dayEvs.map((b) => {
        const s = STAFF[b[3]]; const { l, n } = L.get(b); const top = (mins(b[1]) - startH * 60) / 60 * ph; const hgt = Math.max(b[2] / 60 * ph - 2, 10);
        const k = window.WEEKS[st.w].indexOf(b);
        return `<button class="wev" data-k="${k}" style="top:${top + 1}px;height:${hgt}px;left:calc(${l} * ${100 / n}% + 2px);width:calc(${100 / n}% - 4px);--tint:${s.tint};--bar:${s.bar}" aria-label="${esc(b[4])}, ${esc(b[5])}, ${DAYS[i]} ${b[1]}, ${b[3]}"><b>${esc(b[4].split(' ')[0])}</b><i>${b[1]}</i></button>`;
      }).join('') + '</div>'; }).join('');
      const empty = list.length ? '' : '<p class="wkempty">No appointments this week</p>';
      wk.innerHTML = `<div class="wkhead"><span></span>${head}</div><div class="wkgrid"><div class="wkbody" style="height:${(endH - startH) * ph + 8}px">${body}<div class="wkcols">${cols}</div></div>${empty}</div>`;
      // names only where a lane is wide enough to read them
      for (const ev of wk.querySelectorAll('.wev')) { const r = ev.getBoundingClientRect(); ev.classList.toggle('txt', r.width >= 56 && r.height >= 18); ev.classList.toggle('one', r.height < 36); }
    }
    const all = window.WEEKS[st.w].filter((b) => !st.hidden.has(b[3]));
    document.querySelectorAll('.rev').forEach((e) => (e.textContent = chf(all.reduce((a, b) => a + b[6], 0))));
    document.querySelectorAll('.rl').forEach((e) => (e.textContent = `${all.length} appointments this week`));
    const n = 3 - st.hidden.size;
    document.querySelectorAll('.pill.stack .cnt').forEach((e) => (e.textContent = n === 3 ? 'All' : `${n} of 3`));
  }

  // day select, event detail
  const scrim = Object.assign(document.createElement('div'), { className: 'wscrim', hidden: true });
  const sheet = Object.assign(document.createElement('div'), { className: 'wsheet', hidden: true });
  sheet.setAttribute('role', 'dialog'); sheet.setAttribute('aria-label', 'Appointment'); sheet.tabIndex = -1;
  document.body.append(scrim, sheet);
  let menu = null;
  const close = () => {
    if (menu) { const m = menu; menu = null; m.classList.remove('on'); setTimeout(() => m.remove(), 200); }
    if (!sheet.hidden) { sheet.classList.remove('on'); scrim.classList.remove('on'); document.querySelectorAll('.wev.sel').forEach((e) => e.classList.remove('sel')); setTimeout(() => { sheet.hidden = true; scrim.hidden = true; }, 320); }
  };
  scrim.addEventListener('click', close);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  document.addEventListener('click', (e) => {
    const d = e.target.closest('.wd');
    if (d) { st.day = +d.dataset.day; render(); return; }
    const ev = e.target.closest('.wev');
    if (ev) {
      const b = window.WEEKS[st.w][+ev.dataset.k]; const s = STAFF[b[3]];
      document.querySelectorAll(`.wev[data-k="${ev.dataset.k}"]`).forEach((x) => x.classList.add('sel'));
      sheet.innerHTML = `<div class="hd"><h2>${esc(b[4])}</h2><button class="x" aria-label="Close"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x" aria-hidden="true"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg></button></div><dl>
        <div><dt>Service</dt><dd>${esc(b[5])}</dd></div><div><dt>When</dt><dd>${DAYS[b[0]]} ${+st.w + b[0]} Aug, ${b[1]}–${hhmm(mins(b[1]) + b[2])}</dd></div>
        <div><dt>Staff</dt><dd><img src="${s.img}" alt="">${b[3]}</dd></div><div><dt>Price</dt><dd>${chf(b[6])}</dd></div></dl>`;
      sheet.querySelector('.x').addEventListener('click', close);
      sheet.hidden = false; scrim.hidden = false; requestAnimationFrame(() => { sheet.classList.add('on'); scrim.classList.add('on'); sheet.focus({ preventScroll: true }); });
      return;
    }
    const pill = e.target.closest('.pill.stack');
    if (pill) {
      if (menu) { close(); return; }
      const r = pill.getBoundingClientRect();
      menu = document.createElement('div'); menu.className = 'smenu'; menu.setAttribute('role', 'menu');
      const draw = () => { menu.innerHTML = Object.entries(STAFF).map(([n, s]) => `<button role="menuitemcheckbox" aria-checked="${!st.hidden.has(n)}" data-n="${n}"><img src="${s.img}" alt="">${n}<span class="ck${st.hidden.has(n) ? ' off' : ''}">✓</span></button>`).join(''); };
      draw();
      menu.style.top = `${r.bottom + 8}px`; menu.style.right = `${Math.max(16, innerWidth - r.right)}px`;
      menu.addEventListener('click', (ev2) => { ev2.stopPropagation(); const b = ev2.target.closest('button'); if (!b) return; const n = b.dataset.n; if (st.hidden.has(n)) st.hidden.delete(n); else if (st.hidden.size < 2) st.hidden.add(n); draw(); render(); });
      document.body.append(menu); requestAnimationFrame(() => menu && menu.classList.add('on'));
      return;
    }
    if (menu && !e.target.closest('.smenu')) close();
    const nav = e.target.closest('[aria-label="Previous week"],[aria-label="Next week"]');
    if (nav) {
      const i = WEEKS.indexOf(st.w) + (nav.getAttribute('aria-label') === 'Next week' ? 1 : -1);
      if (i < 0 || i >= WEEKS.length) return; // only the two weeks with real bookings
      st.w = WEEKS[i]; st.day = firstActive(st.w); render();
      document.querySelectorAll('[aria-label="Previous week"]').forEach((b) => (b.style.opacity = i === 0 ? '.4' : '1'));
      document.querySelectorAll('[aria-label="Next week"]').forEach((b) => (b.style.opacity = i === WEEKS.length - 1 ? '.4' : '1'));
    }
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Tab') document.documentElement.classList.add('kbd'); });
  document.addEventListener('pointerdown', () => document.documentElement.classList.remove('kbd'));
  addEventListener('resize', render);
  render();
  document.querySelectorAll('[aria-label="Previous week"]').forEach((b) => (b.style.opacity = '.4'));
})();
