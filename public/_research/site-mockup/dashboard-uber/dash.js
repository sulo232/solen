// Mockup interactions: nothing is saved; every change lives only in this page.
(() => {
  // keyboard-only focus ring: Tab shows it, pointer hides it
  document.addEventListener('keydown', (e) => { if (e.key === 'Tab') document.documentElement.classList.add('kbd'); });
  document.addEventListener('pointerdown', () => document.documentElement.classList.remove('kbd'));
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  for (const a of $$('a[href="#"]')) a.addEventListener('click', (e) => e.preventDefault());
  // switches
  for (const t of $$('.tgl')) t.addEventListener('click', () => { const on = t.classList.toggle('on'); t.setAttribute('aria-checked', on); });
  // single-select chips and settings sections
  for (const c of $$('.chip')) c.addEventListener('click', () => { $$('.chip', c.parentElement).forEach((x) => { x.classList.toggle('on', x === c); x.setAttribute('aria-selected', x === c); }); });
  for (const b of $$('.sn')) b.addEventListener('click', () => {
    $$('.sn').forEach((x) => x.classList.toggle('on', x === b));
    $$('.sg').forEach((s) => s.classList.toggle('on', s.dataset.g === b.dataset.g));
  });
  // live search filter
  for (const inp of $$('input[data-filter]')) inp.addEventListener('input', () => {
    const q = inp.value.trim().toLowerCase();
    for (const r of $$(inp.dataset.filter)) r.hidden = q && !r.textContent.toLowerCase().includes(q);
  });
  // sheets
  const scrim = $('.scrim');
  let open = null;
  const show = (sh) => { open = sh; sh.hidden = false; scrim.hidden = false; requestAnimationFrame(() => { sh.classList.add('on'); scrim.classList.add('on'); }); sh.tabIndex = -1; sh.focus({ preventScroll: true }); };
  const hide = () => { if (!open) return; const sh = open; open = null; sh.classList.remove('on'); scrim.classList.remove('on'); setTimeout(() => { sh.hidden = true; scrim.hidden = true; }, 320); };
  scrim.addEventListener('click', hide);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') hide(); });
  for (const x of $$('.sheet .x, .sheet .cancel')) x.addEventListener('click', hide);
  // services edit
  const ss = $('#svc-sheet'); let row = null;
  for (const b of $$('.sv-open')) b.addEventListener('click', () => {
    row = b.closest('.svc'); const d = row.dataset;
    $('#sv-title').textContent = d.de; $('#f-de').value = d.de; $('#f-en').value = d.en; $('#f-d').value = d.d; $('#f-p').value = d.p; show(ss);
  });
  if (ss) $('.save', ss).addEventListener('click', () => {
    const de = $('#f-de').value, en = $('#f-en').value, dur = $('#f-d').value, pr = $('#f-p').value;
    Object.assign(row.dataset, { de, en, d: dur, p: pr });
    $('.sv-de', row).textContent = de; const enEl = $('.en', row); if (enEl) enEl.textContent = en;
    $$('.sv-d', row).forEach((x) => (x.textContent = dur)); $$('.sv-p', row).forEach((x) => (x.textContent = pr));
    hide();
  });
  // client detail
  const cs = $('#cli-sheet');
  for (const b of $$('.cli')) b.addEventListener('click', () => {
    const d = b.dataset; $('#c-ini').textContent = $('.ini', b).textContent; $('#c-name').textContent = d.n;
    $('#c-v').textContent = d.v; $('#c-s').textContent = `CHF ${d.s}`; $('#c-a').textContent = `CHF ${d.avg}`; $('#c-l').textContent = d.last; $('#c-c').textContent = d.c; $('#c-ns').textContent = d.ns;
    show(cs);
  });
})();
// home: show all appointments, tap a bar for its value
(() => {
  const more = document.querySelector('.more');
  if (more) more.addEventListener('click', () => { document.querySelectorAll('.day[hidden]').forEach((r) => (r.hidden = false)); more.remove(); });
  const bars = [...document.querySelectorAll('.bar')];
  for (const b of bars) b.addEventListener('click', () => { const on = !b.classList.contains('show'); bars.forEach((x) => x.classList.remove('show')); b.classList.toggle('show', on); });
})();
