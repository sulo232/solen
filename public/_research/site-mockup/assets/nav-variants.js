// Bottom-bar options for the owner's comparison, applied to the frozen page with ?nav=b|c|d (today without).
// b: solid white floating pill, icons only, active icon on a grey circle (his saved posts 616, 639, 676, 704, 203)
// c: ink floating dock hugging its icons, active icon on a white circle (his saved post 512)
// d: solid white floating pill, active item is a grey capsule with icon and label, others icon only (posts 255, 203)
(() => {
  const v = (location.search.match(/[?&]nav=([bcd])/) || [])[1];
  if (!v) return;
  const nav = [...document.querySelectorAll('nav')].find((n) => getComputedStyle(n).position === 'fixed' && n.querySelector('ul'));
  if (!nav) return;
  const INK = '#0A0A0A', GREY = '#F4F4F5', MUTED = '#71717A';
  const css = document.createElement('style');
  css.textContent = '.nv-sr{position:absolute!important;width:1px!important;height:1px!important;overflow:hidden!important;clip:rect(0 0 0 0)!important;white-space:nowrap!important}' +
    '.nv a{transition:background-color 200ms ease,color 200ms ease}.nv a:active{transform:scale(.94)}';
  document.head.appendChild(css);
  nav.classList.add('nv');
  const S = (e, o) => { for (const [k, val] of Object.entries(o)) e.style.setProperty(k, val, 'important'); };
  S(nav, { 'backdrop-filter': 'none', '-webkit-backdrop-filter': 'none' });
  const ul = nav.querySelector('ul'); const items = [...ul.querySelectorAll('a')];
  if (v === 'b' || v === 'd') {
    S(nav, { background: '#FFFFFF', 'box-shadow': 'rgba(0,0,0,.04) 0 0 0 1px, rgba(0,0,0,.08) 0 4px 16px' });
    S(ul, { height: '60px', 'align-items': 'center', padding: '0 8px' });
  }
  if (v === 'c') {
    S(nav, { background: INK, 'box-shadow': 'rgba(0,0,0,.12) 0 4px 16px', left: '50%', right: 'auto', width: 'auto', transform: 'translateX(-50%)', margin: '0 0 12px 0' });
    S(ul, { height: '60px', 'align-items': 'center', gap: '4px', padding: '0 8px' });
  }
  const paint = () => { for (const a of items) {
    const on = a.getAttribute('aria-current') === 'page';
    const label = a.querySelector('span'); const icon = a.querySelector('svg');
    const li = a.parentElement;
    S(a, { height: '44px', 'flex-direction': 'row', gap: '8px', 'border-radius': '9999px', 'justify-content': 'center' });
    if (icon) S(icon, { width: '24px', height: '24px' });
    if (v === 'b') {
      S(a, { width: '44px', margin: '0 auto', background: on ? GREY : 'transparent', color: on ? INK : MUTED });
      if (label) label.classList.add('nv-sr');
    } else if (v === 'c') {
      S(li, { flex: '0 0 auto' });
      S(a, { width: '44px', background: on ? '#FFFFFF' : 'transparent', color: on ? INK : '#A1A1AA' });
      if (label) label.classList.add('nv-sr');
    } else {
      S(li, { flex: on ? '0 0 auto' : '1 1 0' });
      S(a, { padding: on ? '0 16px' : '0', background: on ? GREY : 'transparent', color: on ? INK : MUTED });
      if (label) { label.classList.toggle('nv-sr', !on); if (on) S(label, { 'font-size': '14px', 'font-weight': '600', 'max-height': 'none', opacity: '1' }); }
    }
  } };
  paint();
  // tapping a tab moves the active state (simulated: the page itself does not change)
  for (const a of items) a.addEventListener('click', (ev) => { ev.preventDefault(); items.forEach((x) => x.removeAttribute('aria-current')); a.setAttribute('aria-current', 'page'); paint(); });
})();
