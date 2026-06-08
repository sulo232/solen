// Solen homepage mockup — interactivity + variation explorer
(function () {
  var root = document.documentElement;

  // ----- variation explorer -----
  var PRESETS = {
    austere:      { icons: 'mono',  pop: 'austere',  hero: 'air',     layout: 'balanced' },
    balanced:     { icons: 'color', pop: 'semantic', hero: 'compact', layout: 'balanced' },
    warm:         { icons: 'color', pop: 'rich',     hero: 'compact', layout: 'balanced' },
    editorial:    { icons: 'photo', pop: 'semantic', hero: 'air',     layout: 'editorial' },
    availability: { icons: 'color', pop: 'rich',     hero: 'compact', layout: 'availability' }
  };
  function setAxis(axis, val) {
    root.dataset[axis] = val;
    document.querySelectorAll('.tw .opts button[data-axis="' + axis + '"]').forEach(function (b) {
      b.classList.toggle('on', b.dataset.val === val);
    });
  }
  function applyPreset(name) {
    var p = PRESETS[name]; if (!p) return;
    setAxis('icons', p.icons); setAxis('pop', p.pop); setAxis('hero', p.hero); setAxis('layout', p.layout);
    document.querySelectorAll('.presets button').forEach(function (b) {
      b.classList.toggle('on', b.dataset.preset === name);
    });
    try { history.replaceState(null, '', '?v=' + name + (root.classList.contains('barebody') ? '&bare=1' : '')); } catch (e) {}
  }
  document.querySelectorAll('.presets button').forEach(function (b) {
    b.addEventListener('click', function () { applyPreset(b.dataset.preset); });
  });
  document.querySelectorAll('.tw .opts button').forEach(function (b) {
    b.addEventListener('click', function () {
      setAxis(b.dataset.axis, b.dataset.val);
      document.querySelectorAll('.presets button').forEach(function (p) { p.classList.remove('on'); });
    });
  });
  var gear = document.querySelector('.gear');
  if (gear) gear.addEventListener('click', function () { document.querySelector('.tweaks').classList.toggle('open'); });

  // ----- search sheet -----
  var scrim = document.querySelector('.scrim'), sheet = document.querySelector('.sheet');
  function openSheet() { scrim.classList.add('open'); sheet.classList.add('open'); document.body.style.overflow = 'hidden'; }
  function closeSheet() { scrim.classList.remove('open'); sheet.classList.remove('open'); document.body.style.overflow = ''; }
  document.querySelectorAll('.js-open-search').forEach(function (el) { el.addEventListener('click', openSheet); });
  if (scrim) scrim.addEventListener('click', closeSheet);
  var xb = document.querySelector('.sheet .x'); if (xb) xb.addEventListener('click', closeSheet);
  document.querySelectorAll('.dchips button').forEach(function (b) {
    b.addEventListener('click', function () {
      b.parentNode.querySelectorAll('button').forEach(function (x) { x.classList.remove('on'); });
      b.classList.add('on');
    });
  });

  // ----- segmented rail swap -----
  document.querySelectorAll('.seg button').forEach(function (b) {
    b.addEventListener('click', function () {
      var set = b.dataset.set;
      b.parentNode.querySelectorAll('button').forEach(function (x) { x.classList.toggle('on', x === b); });
      document.querySelectorAll('.rail-group').forEach(function (g) {
        g.style.display = (g.dataset.set === set) ? 'flex' : 'none';
      });
    });
  });

  // ----- sticky nav + collapsed search stub -----
  var nav = document.querySelector('.nav'), hero = document.querySelector('.s-hero');
  function onScroll() {
    var y = window.scrollY || 0;
    nav.classList.toggle('scrolled', y > 8);
    var hb = hero ? hero.offsetTop + hero.offsetHeight - 60 : 9999;
    nav.classList.toggle('stub', y > hb);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ----- live-activity widget dots -----
  var lwRail = document.querySelector('.lw-rail');
  if (lwRail) {
    var lwDots = document.querySelectorAll('.lw-dots i');
    lwRail.addEventListener('scroll', function () {
      var i = Math.round(lwRail.scrollLeft / lwRail.clientWidth);
      lwDots.forEach(function (d, idx) { d.classList.toggle('on', idx === i); });
    }, { passive: true });
  }

  // ----- init from URL -----
  var qs = new URLSearchParams(location.search);
  if (qs.get('bare') === '1') { document.body.classList.add('bare'); root.classList.add('barebody'); }
  applyPreset(qs.get('v') || 'balanced');
})();
