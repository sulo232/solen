// Mockup-only interactions for the frozen site pages: press feedback, single-select chips, slots and
// day tiles, segmented controls, switches, add-service with a live total, back buttons.
// Simulated: nothing is booked or saved.
(() => {
  const INK = '#0A0A0A', GREY = '#F4F4F5', WHITE = '#fff';
  const css = document.createElement('style');
  css.textContent = 'button,a,[role=button],[role=switch]{cursor:pointer;-webkit-tap-highlight-color:transparent}' +
    'button:active,a:active,[role=button]:active,[role=switch]:active{transform:scale(.97);transition:transform 80ms ease}';
  document.head.appendChild(css);
  const txt = (e) => (e.innerText || '').replace(/\s+/g, ' ').trim();
  const bgOf = (e) => getComputedStyle(e).backgroundColor;
  const isInk = (c) => /^rgb\((\d+), (\d+), (\d+)\)$/.test(c) && c.match(/\d+/g).slice(0, 3).every((n) => +n < 45);
  const paint = (e, on) => {
    e.style.setProperty('background-color', on ? INK : GREY, 'important');
    e.style.setProperty('color', on ? WHITE : INK, 'important');
    for (const k of e.querySelectorAll('*')) if ([...k.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) k.style.setProperty('color', on ? WHITE : INK, 'important');
    e.setAttribute('aria-pressed', on ? 'true' : 'false');
  };
  const SLOT = /^\d{1,2}:\d{2}$/;
  const DAY = /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\.? ?\d{1,2}( [A-Za-z]{3})?$/;
  let total = 0, items = 0, mins = 0;
  // a disabled button swallows clicks, so Continue is re-enabled and only looks disabled until a service is added
  const cont = [...document.querySelectorAll('button')].find((b) => /^continue/i.test(txt(b)) && b.disabled);
  if (cont) { cont.disabled = false; cont.removeAttribute('disabled'); cont.style.setProperty('opacity', '.5', 'important'); cont.style.setProperty('cursor', 'not-allowed', 'important'); }

  document.addEventListener('click', (ev) => {
    const el = ev.target.closest('button, [role=button], [role=switch], a');
    if (!el) return;
    const label = (el.getAttribute('aria-label') || '').toLowerCase();
    const t = txt(el);
    // back
    if (/^(back|zurück)$/.test(label) || /go back/.test(label)) { ev.preventDefault(); history.back(); return; }
    // switch
    if (el.getAttribute('role') === 'switch') {
      ev.preventDefault();
      const on = el.getAttribute('aria-checked') !== 'true';
      el.setAttribute('aria-checked', on ? 'true' : 'false');
      el.style.setProperty('background-color', on ? INK : '#D4D4D8', 'important');
      const knob = el.firstElementChild; if (knob) { knob.style.transition = 'transform 150ms ease'; knob.style.transform = on ? '' : 'translateX(-20px)'; }
      return;
    }
    // add a service (booking step 1): toggle with a check, update the bottom total, enable Continue
    if (label === 'add' || label === 'added' || /hinzufügen/.test(label)) {
      ev.preventDefault();
      let row = el.parentElement; while (row && !/\d+\s*CHF/.test(row.innerText)) row = row.parentElement;
      const price = +((row && row.innerText.match(/(\d+)\s*CHF/) || [])[1] || 0);
      const dur = +((row && row.innerText.match(/(\d+)\s*min/) || [])[1] || 0);
      const on = el.getAttribute('aria-pressed') !== 'true';
      const circle = el.querySelector('span.rounded-full') || el; el.setAttribute('aria-pressed', on ? 'true' : 'false'); el.setAttribute('aria-label', on ? 'Added' : 'Add');
      circle.style.transition = 'background-color 150ms ease, border-color 150ms ease, color 150ms ease';
      circle.style.setProperty('background-color', on ? INK : 'transparent', 'important'); circle.style.setProperty('border-color', on ? INK : '', 'important'); circle.style.setProperty('color', on ? WHITE : '', 'important');
      const [plus, check] = circle.children; // the real component cross-fades plus to check with a blur
      for (const [k, show] of [[plus, !on], [check, on]]) if (k) { k.style.transition = 'opacity 180ms ease, filter 180ms ease, transform 180ms ease'; k.style.opacity = show ? '1' : '0'; k.style.filter = show ? 'blur(0px)' : 'blur(6px)'; k.style.transform = show ? 'none' : 'scale(0.6)'; }
      total += on ? price : -price; items += on ? 1 : -1; mins += on ? dur : -dur;
      const cart = document.querySelector('[data-cart-anchor]');
      if (cart) {
        const [pt, pm] = cart.querySelectorAll('p'); const ts = pt && pt.querySelector('span'); if (ts) ts.textContent = total;
        if (pm) { const svg = pm.querySelector('svg'); pm.textContent = ''; if (svg) pm.appendChild(svg); pm.append(`${items} ${items === 1 ? 'item' : 'items'} `); const ms = document.createElement('span'); ms.textContent = mins; pm.append(ms, ' min'); }
      }
      if (cont) { cont.style.setProperty('opacity', items ? '1' : '.5', 'important'); cont.style.setProperty('cursor', items ? 'pointer' : 'not-allowed', 'important'); }
      return;
    }
    // continue on booking step 1 goes to the date and time step
    if (/^continue/i.test(t) && /booking-services/.test(location.pathname)) { ev.preventDefault(); if (items) location.href = '../booking-time/index.html'; return; }
    // time slots and day tiles: single select across the page
    if (SLOT.test(t) || DAY.test(t)) {
      ev.preventDefault();
      const re = SLOT.test(t) ? SLOT : DAY;
      for (const b of document.querySelectorAll('button')) if (re.test(txt(b)) && !b.disabled) paint(b, b === el);
      return;
    }
    // chips and segmented controls: single select among sibling buttons
    const sibs = el.parentElement ? [...el.parentElement.children].filter((c) => c.tagName === el.tagName && txt(c)) : [];
    if (el.tagName === 'BUTTON' && sibs.length >= 2 && !el.closest('nav')) {
      const r = el.getBoundingClientRect();
      if (r.height <= 60 && sibs.some((c) => isInk(bgOf(c)) || c.getAttribute('aria-pressed') === 'true' || c.getAttribute('aria-selected') === 'true')) {
        ev.preventDefault();
        for (const c of sibs) paint(c, c === el);
        return;
      }
    }
    // dead links stay put instead of jumping to the top
    if (el.tagName === 'A' && el.getAttribute('href') === '#') ev.preventDefault();
  }, true);
})();
