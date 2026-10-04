// Loyalty refinement (mockup only), applied on a copy of the frozen /en/rewards page:
// 1. a detail page keeps only its back control (no bell, no menu), per the owner's top-bar rule
// 2. the five perk boxes become one box with lines inside; the grey icon tiles go, icons stand alone
(() => {
  const S = (e, o) => { for (const [k, v] of Object.entries(o)) e.style.setProperty(k, v, 'important'); };
  for (const b of document.querySelectorAll('header button[aria-label], header a[aria-label]')) {
    if (/^(Benachrichtigungen|Notifications|Open menu)/.test(b.getAttribute('aria-label'))) S(b, { display: 'none' });
  }
  const first = [...document.querySelectorAll('*')].find((e) => e.children.length === 0 && e.textContent.trim() === 'Early access to Angebote');
  if (!first) return;
  let card = first; while (card && !/rounded-\[14px\]/.test(card.className)) card = card.parentElement;
  const list = card.parentElement;
  S(list, { gap: '0', 'border-radius': '20px', 'box-shadow': 'rgba(0,0,0,.04) 0 0 0 1px, rgba(0,0,0,.06) 0 2px 10px', overflow: 'hidden', background: '#fff' });
  [...list.children].forEach((c, i) => {
    S(c, { border: '0', 'border-radius': '0', 'box-shadow': 'none', padding: '14px 16px', 'min-height': '64px', gap: '14px' });
    if (i) S(c, { 'border-top': '1px solid #E4E4E7' });
    const tile = c.querySelector('.rounded-\\[11px\\]');
    if (tile) S(tile, { background: 'transparent', width: '22px', height: '22px', color: '#71717A' });
    const svg = tile && tile.querySelector('svg'); if (svg) S(svg, { width: '22px', height: '22px' });
  });
})();
