// THE ONE PLACE for every shared look decision in the Uber-renewal mockups (owner 2026-10-04).
// Every mockup page loads this file, so changing a value here changes it on every page at once.
// Each key has a row in _plans/UBER_RENEWAL_2026-10-04.md (the decision ledger): check that row before changing a value.
window.SOLEN_UI = {
  // colours
  ink: '#111111', fill: '#F6F6F6', tag: '#F3F3F3', tagText: '#5E5E5E', line: '#ECECEC', edge: '#E0E0E0', text2: '#525252', text3: '#6B6B6B', disabledText: '#A6A6A6',
  proofBg: '#EAF6ED', proofText: '#166C3B', promo: '#D13B20', notify: '#DE1135', amber: '#9F6402', cream: '#FDF2DC', creamEdge: '#E9DFCA', amberTrack: '#F3E3C1',
  // shadows: only on things that float
  shadowFloat: 'rgba(0,0,0,.05) 0 0 0 1px, rgba(0,0,0,.08) 0 4px 16px', shadowSmall: 'rgba(0,0,0,.14) 0 2px 8px', shadowBarUp: 'rgba(0,0,0,.06) 0 -4px 16px',
  // corners
  buttonRadius: '8px', chipRadius: '9999px', boxRadius: '16px', innerRadius: '12px', photoRadius: '16px', tagRadius: '4px', dayRadius: '12px',
  // sizes
  buttonBig: '56px', buttonSmall: '40px', buttonLabelBig: '17px', buttonLabel: '15px', chipHeight: '40px', circle: '40px', close: '38px', band: '4px',
  // type
  titleSize: '26px', sectionSize: '21px', subSize: '18px', rowSize: '16px',
  // behaviours
  backOnPhoto: 'white-shadow',   // 'white-shadow' (Uber) | 'flat-grey'
  heartOnCard: 'today',          // 'today' | 'flat-grey' | 'white-shadow'  (owner question open)
  bottomBar: 'float',            // 'float' (white pill with shadow) | 'today'
};
