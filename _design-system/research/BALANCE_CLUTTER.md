<!-- exists-check: net-new vs TASTE_DIAGNOSIS_FRAMEWORKS.md, TASTE_GROUPING.md,
     RESEARCH_METHOD.md, FRONTEND_AUDIT_2026-07-08.md, because every one of those is either
     qualitative or is about method. TASTE_DIAGNOSIS_FRAMEWORKS.md is the closest neighbour and
     this EXTENDS its checklist item 8 ("it's noisy, everything stands out") which today
     prescribes a subjective contrast check and gives it a computed number instead.
     TASTE_GROUPING.md cites NN/g and Material on borders producing "visual clutter" but states
     no measurement. RESEARCH_METHOD.md governs how research is run and tiered, and its R5
     provenance discipline is applied by name in section 6 below. No existing file computes a
     clutter measure from a rendered page. -->

# BALANCE_CLUTTER.md

Research date 2026-07-31. Lens: **CLUTTER, counted.**

The question this answers: the owner said *"there's just so much clutter"* and I had previously
claimed that kind of complaint is not measurable. This file tests whether it is. It tests four
candidate measures against thirteen rendered screens and reports which ones separate the screens
he rejected from the screens he likes.

**Headline: three of the four candidate measures FAIL. One works, in a corrected form.**
Counting things on a screen does not detect clutter, because the screens he likes contain
*more* things than the screen he rejected. What does separate is how much of the screen's
*area* is spent on controls rather than on content.

---

## 0. Sample and method, stated before any number

**Sample: 13 first viewports.** Seven ours, six references.

| group | screens |
|---|---|
| the rejected mockup | `public/_mockups/home-v3/index.html` and its three variants `n1.html`, `n2.html`, `n3.html` |
| our live product | `/de`, `/de/search`, `/de/salon/old-town-barbers` |
| references | fresha.com home, fresha.com search, airbnb.ch, treatwell.ch, uber.com/ch/de, booking.com |

**Which references count as "likes".** Fresha is the locked structural source of truth and
Airbnb and Uber are named reference axes in the project CLAUDE.md, so those four screens are the
"likes". Treatwell and Booking are competitors nobody has endorsed. They are in the sample as
extra spread, not as targets, and they are the two that sit closest to our numbers. I say this
up front because if I had quietly counted them as "likes" the separation below would look better
than it is.

**Rig.** Playwright Chromium, headless, viewport 390x844, `deviceScaleFactor: 2`, mobile user
agent, `isMobile` and `hasTouch` on, locale `de-CH`, `reducedMotion: reduce`. Scrolled to top,
first viewport only. Local pages served from the dev server on port 50723. Every number below was
computed by running code against the live rendered DOM. Nothing here is recalled or estimated.

**Four honest notes about the rig.**

1. **Consent banners were hidden, never accepted.** Any fixed or sticky element covering more
   than 6% of the viewport whose text matches cookie/consent vocabulary was set to
   `display:none` locally before measuring. Nothing was clicked and no consent was given. This
   fired on Treatwell, Uber, Booking and our own `/de`. Without it the banner would have been
   measured as chrome and every one of those numbers would be inflated.
2. **`n1.html` and `n3.html` ship no viewport meta tag,** so Chrome laid them out at 980px. I
   injected `width=device-width` into the served HTML. They still settle at 398x862 rather than
   390x844, roughly 2% wide. All figures are percentages of the viewport, so they remain
   comparable, but their absolute pixel counts are not directly comparable to the rest.
3. **Two bugs in my own first two classifiers, both found by disbelieving a number.** The first
   version used `document.elementFromPoint`, which skips anything with `pointer-events:none`.
   That is how Airbnb renders its card photos, so it reported **0% photo on a screen full of
   photos**. The second version painted elements in a flat sorted order, which let positioned
   ancestors overwrite their own children. The third and final version is a recursive painter and
   was validated against a hand-computed ground truth (see section 3.1).
4. **One sub-measure was junk and is reported as junk.** My first "count the search-looking
   elements" detector matched any *ancestor* containing a search icon, so the outermost `div`
   always matched and the count was always 1. It was measuring "does this page contain a search
   icon", not "how many". Section 4.2 uses a rewritten leaf-level detector.

---

## 1. The measure, in one paragraph

**Chrome share: what fraction of the first screenful is spent on buttons rather than on the
thing the user came for.** Take the phone screen exactly as it renders. Go over it pixel by pixel
and put every pixel in one of six buckets: photo, text, icon, control (the fill, border and
background of anything tappable), plain surface (a card or panel that is just background), or
empty page. Then ask what percentage landed in "control" plus "icon". That percentage is the
share of the user's first screen taken up by the machinery of the interface instead of by salons,
prices, names and pictures. A screen that spends a third of itself on input boxes and buttons
feels cluttered even when it contains very few of them, and a screen that spends 7% on controls
feels calm even when it contains three times as many tappable things. That second half is the
finding: **clutter is an area problem, not a counting problem.**

---

## 2. The exact JavaScript

Runs as-is in `javascript_tool` against any rendered page. Verified in `javascript_tool` on the
live `/de` at 390x844 on 2026-07-31: returned `chromePct: 36.3`, `VERDICT: FAIL`.

```js
(function(){
var VW=innerWidth, VH=innerHeight, STEP=5;
var ISEL='a[href],button,input:not([type=hidden]),select,textarea,summary,[role=button],[role=link],[role=tab],[role=checkbox],[role=switch],[role=menuitem],[role=option],[role=searchbox],[role=combobox],[tabindex]:not([tabindex="-1"])';
var COLS=Math.ceil(VW/STEP), ROWS=Math.ceil(VH/STEP), grid=new Uint8Array(COLS*ROWS);
function css(e){return getComputedStyle(e);}
function fill(r,v){
  var x0=Math.max(0,Math.floor(r.left/STEP)), x1=Math.min(COLS,Math.ceil(r.right/STEP));
  var y0=Math.max(0,Math.floor(r.top/STEP)),  y1=Math.min(ROWS,Math.ceil(r.bottom/STEP));
  for(var y=y0;y<y1;y++){var b=y*COLS; for(var x=x0;x<x1;x++) grid[b+x]=v;}
}
function ix(a,b){return {left:Math.max(a.left,b.left),right:Math.min(a.right,b.right),
                         top:Math.max(a.top,b.top),bottom:Math.min(a.bottom,b.bottom)};}
function mt(r){return r.right<=r.left||r.bottom<=r.top;}
function inControl(e){var p=e;while(p&&p!==document.body){if(p.matches&&p.matches(ISEL))return true;p=p.parentElement;}return false;}
function paint(el,clip){
  var c=css(el);
  // Direct style checks, NOT checkVisibility(): that reports display:contents
  // wrappers as invisible and would prune their on-screen children.
  if(c.display==='none'||c.visibility==='hidden'||parseFloat(c.opacity)===0) return;
  var r=el.getBoundingClientRect(), own=ix(r,clip);
  var clipped=(c.overflow!=='visible'||c.overflowX!=='visible'||c.overflowY!=='visible');
  if(clipped&&mt(own)) return;
  if(!mt(own)&&el!==document.body){
    var a=r.width*r.height, bgi=c.backgroundImage||'none';
    var m=(c.backgroundColor||'').match(/rgba?\(([^)]+)\)/);
    var al=m?(m[1].split(',').length>3?parseFloat(m[1].split(',')[3]):1):0;
    var bw=parseFloat(c.borderTopWidth)+parseFloat(c.borderRightWidth)+
           parseFloat(c.borderBottomWidth)+parseFloat(c.borderLeftWidth);
    var raster=/url\(["']?[^)]*\.(jpg|jpeg|png|webp|avif|gif)/i.test(bgi)||/url\(["']?data:image\//i.test(bgi);
    var media=(el.tagName==='IMG'||el.tagName==='VIDEO'||el.tagName==='CANVAS');
    if((media||raster)&&a>=2500) fill(own,3);                                     // photo
    else if(el.tagName==='svg'||el.ownerSVGElement||(media&&a<2500)) fill(own,4); // icon
    else if(al>0||bgi!=='none'||bw>0) fill(own,inControl(el)?2:1);                // control / surface
  }
  var cc=clipped?ix(clip,r):clip;
  // Children after parents, siblings by (z-index, positioned, document order).
  [].slice.call(el.children).map(function(k,i){
    var kc=css(k);
    return {k:k,z:(kc.position!=='static'&&kc.zIndex!=='auto')?(parseInt(kc.zIndex,10)||0):0,
            p:(kc.position!=='static')?1:0,i:i};
  }).sort(function(a,b){return (a.z-b.z)||(a.p-b.p)||(a.i-b.i);})
    .forEach(function(o){paint(o.k,cc);});
}
paint(document.body,{left:0,top:0,right:VW,bottom:VH});
// Text paints last, trimmed to the font size so line-height does not inflate it.
var w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT,null), n;
while(n=w.nextNode()){
  if(!n.nodeValue||!n.nodeValue.trim()) continue;
  var p=n.parentElement; if(!p) continue;
  var pc=css(p); if(pc.visibility!=='visible'||pc.display==='none') continue;
  var fs=parseFloat(pc.fontSize)||14, rg=document.createRange(); rg.selectNodeContents(n);
  var rs=rg.getClientRects();
  for(var i=0;i<rs.length;i++){
    var q=rs[i]; if(q.width<=0||q.bottom<0||q.top>VH) continue;
    var h=Math.min(q.height,fs), cy=(q.top+q.bottom)/2;
    fill({left:q.left,right:q.right,top:cy-h/2,bottom:cy+h/2},5);
  }
}
var k=[0,0,0,0,0,0]; for(var g=0;g<grid.length;g++) k[grid[g]]++;
var t=grid.length, P=function(v){return Math.round(v/t*1000)/10;};
var chrome=P(k[2]+k[4]);
return {viewport:VW+'x'+VH, chromePct:chrome, controlPct:P(k[2]), iconPct:P(k[4]),
        photoPct:P(k[3]), textPct:P(k[5]), surfacePct:P(k[1]), emptyPct:P(k[0]),
        VERDICT:chrome>25?'FAIL: control chrome over 25% of the first viewport':'PASS'};
})()
```

Before running it on a live site, hide consent overlays without clicking them:

```js
[...document.querySelectorAll('body *')].forEach(function(el){
  var s=getComputedStyle(el);
  if((s.position==='fixed'||s.position==='sticky')&&
     /cookie|consent|akzeptier|notwendige|datenschutz|privacy/i.test((el.innerText||'').slice(0,500)))
    el.style.setProperty('display','none','important');
});
```

### 2.1 Definitions, so the numbers can be checked

- **control** is any painted pixel belonging to an element that is itself tappable or sits inside
  something tappable: the white fill of a search input, the black fill of a submit button, the
  background of a category tile.
- **icon** is any `svg` or any image under 2500px². Counted with control because an icon is
  interface machinery, not content.
- **photo** is `img`, `video`, `canvas` or a raster `background-image`, at 2500px² or larger.
- **text** is measured from `Range.getClientRects()`, then shrunk vertically to the font size so
  that a generous line-height does not count as text area.
- A button's **label** counts as text, not as control. Applied identically to all 13 screens.

---

## 3. The numbers

All figures are percent of the 390x844 first viewport. Measured 2026-07-31.

| screen | **chrome%** | control% | icon% | photo% | text% | empty% | tap targets | kinds | treatments | radii |
|---|---|---|---|---|---|---|---|---|---|---|
| **`/de` (live, ours)** | **38.4** | 32.2 | 6.2 | 0.6 | 12.6 | 7.3 | 15 | 7 | 9 | **7** |
| treatwell.ch | 21.2 | 18.4 | 2.8 | 28.9 | 9.8 | 12.7 | 17 | 10 | 11 | 4 |
| `/de/search` (ours) | 19.4 | 17.4 | 2.0 | 46.1 | 9.1 | 7.3 | 14 | 9 | 7 | 3 |
| uber.com/ch/de | 16.0 | 15.4 | 0.6 | 2.4 | 19.8 | 0 | 16 | 11 | 8 | 4 |
| PDP (ours) | 11.3 | 10.2 | 1.1 | 21.7 | 10.1 | 0 | 16 | 11 | 12 | 4 |
| mockup `n1.html` | 10.8 | 9.9 | 0.9 | 0 | 2.8 | 1.8 | 5 | 3 | 5 | 3 |
| booking.com | 10.7 | 9.0 | 1.7 | 3.2 | 20.6 | 0 | 16 | 11 | 11 | 4 |
| **rejected `index.html`** | **10.2** | 9.2 | 1.0 | 0 | 16.8 | 22.1 | 5 | 3 | 6 | 4 |
| mockup `n3.html` | 8.4 | 6.1 | 2.3 | 0 | 6.4 | 1.8 | 8 | 3 | 6 | 3 |
| mockup `n2.html` | 7.4 | 5.9 | 1.5 | 60.1 | 6.3 | 0 | 8 | 5 | 4 | 3 |
| airbnb.ch | 7.1 | 5.8 | 1.3 | 33.1 | 25.9 | 18.9 | 21 | 9 | 10 | 4 |
| fresha.com home | 6.4 | 4.6 | 1.8 | 0 | 21.6 | 0 | 7 | 5 | 8 | 5 |
| fresha.com search | 5.9 | 4.3 | 1.6 | 45.6 | 11.5 | 23.0 | 16 | 9 | 10 | 2 |

**Reference band, chrome%:** 5.9, 6.4, 7.1, 10.7, 16.0, 21.2. Highest is Treatwell at 21.2.
Highest among the four he actually likes is Uber at 16.0.
**Our estate:** 7.4, 8.4, 10.2, 10.8, 11.3, 19.4, and then `/de` at **38.4**.

`/de` is the single outlier of the whole 13-screen sample. It is 1.8x the busiest reference and
2.4x the busiest liked reference.

### 3.1 Validating the raster before trusting it

I hand-computed the photo area of `n2.html` from its screenshot: two salon photos, roughly 549
CSS px of stacked height at 358 of 390 px width, which is about **59.7%** of the viewport. The
raster returns **60.1%**. Fresha's home returns **0% photo**, which matches its screenshot (a
lilac gradient, no photograph). Airbnb returns **33.1%**, consistent with two rows of listing
cards. Those three checks are why I believe the rest of the column.

### 3.2 Why `/de` is at 38%, named element by element

Measured directly, controls in the first viewport of `/de` with the cookie banner hidden:

| control | size | share of viewport |
|---|---|---|
| "Termine finden" submit | 326x48 | 4.8% |
| "Service" row | 326x46 | 4.6% |
| "Stadt" row | 326x46 | 4.6% |
| "Zeit" row | 326x46 | 4.6% |
| 6 category tiles (Coiffeur, Barber, Nails, Karte, Walk-in, Spa) | 106x92 each | 3.0% each, 18.0% total |

Those ten controls alone are **36.6%** of the screen. In the same viewport the photo share is
**0.6%**. The screen is a control panel with a feed underneath it, and the feed starts below the
fold.

---

## 4. What did NOT work, in detail

This section exists because a measure that sounds sophisticated and does not correlate is worse
than none.

### 4.1 Count of distinct interactive elements: FAILS

`/de` shows 15 tap targets. Airbnb shows **21**, Treatwell 17, Uber 16, Booking 16, Fresha search
16. Our rejected mockup shows **5**. A gate on "too many tappable things" would flag Airbnb first
and would clear the rejected mockup by a wide margin. The measure is not merely weak, it is close
to backwards.

### 4.2 Count of repeated affordances of the same kind: FAILS, and the premise did not reproduce

Largest group of same-kind controls: `/de` 6 (the category tiles), Airbnb 5 (listing cards),
Treatwell 4. Repetition of one kind is **rhythm**, not clutter. Six identical tiles read as one
object. This measure cannot tell a tidy grid from a mess.

**On the "seven search-looking elements on one screen" figure I was handed: I could not reproduce
it, and I do not know the counting rule that produces it.** With a leaf-level detector (magnifier
glyphs, inputs whose placeholder or label says search, and short labels reading search), measured
on the rendered page:

| page | in first viewport | in the whole document |
|---|---|---|
| rejected `index.html` | 2 (one glyph, one "Search salons" label) | 6, being 3 pills x (glyph + label) |
| `/de` | 2 (one glyph, one "Suchen" button) | 2 |
| fresha.com | 1 | 4 |
| airbnb.ch | 1 | 1 |

`index.html` is **8.1 viewports tall** and is a comparison shell holding **three** header
variants, one per `.screen` block. Three search pills on a page whose stated job is to compare
three headers is one per variant, which is what a comparison page is. The number seven is not
something I can stand behind, so I am not building on it.

### 4.3 Number of distinct visual treatments: FAILS as specified, one component survives

Counting distinct combinations of (background, border, radius, shadow) among painted boxes: `/de`
9, Fresha 8 and 10, Airbnb 10, Uber 8, Treatwell 11, Booking 11. Ours sits mid-band. No
separation.

**But one component of it does separate: distinct corner radii.** `/de` renders **7** different
corner radii in one viewport (24, 6, 22, 0, 16, 28, and pill). Every reference sits at 2 to 5:
Fresha search 2, Fresha home 5, Airbnb 4, Uber 4, Treatwell 4, Booking 4. Our own other screens
sit at 3 and 4. `/de` is again the sample outlier. This is a genuine second signal and is
recorded here, but it is a weaker one: the gap to the top of the reference band is 7 against 5,
where chrome share has 38.4 against 21.2.

### 4.4 The ratio form of chrome-to-content: FAILS, use the share instead

I first computed chrome divided by content. It is unstable, because content can approach zero.
`n1.html` scores 3.83 on the ratio, worse than `/de`'s 2.91, purely because it is a header
fragment above grey placeholder blocks and therefore has almost no content in the denominator.
**Chrome as a share of the viewport has no denominator problem and is the form to use.**

### 4.5 Same-thing-different-size, as a general measure: FAILS

I grouped tap targets by a signature that excludes size and asked whether group members render at
the same height. Airbnb produces 3 mismatched groups and Treatwell 2, against 1 for `/de`. The
signature is too coarse to tell an `<a>` wrapping a card from an `<a>` in a nav bar. As a general
single-screen measure it does not work.

**It does work when you already know two elements are the same control.** Measured across the
three variants inside the rejected `index.html`:

| variant | search pill | hamburger glyph | distinct icon sizes in that cell |
|---|---|---|---|
| n1 | 358x64 | 18x18 | 2 (18, 22) |
| n2 | 358x64 | 22x22 | 3 (16, 18, 22) |
| n3 | **390x56** | 22x22 | **9** (16, 18, 22, 27, 28, 29, 32, 36, 37) |

That is the owner's sentence, measured: the same search pill at two different sizes, the same
hamburger at two different sizes, and nine different icon sizes in one variant. Counting UI
glyphs at 32px or under on a single screen, `n3` uses **7** distinct sizes where every reference
uses 3 or 4 and no other screen in the sample exceeds 5. So the icon-size vocabulary of `n3` is a
real, single-screen, measurable defect. It is the only measure in this file that flags any part of
what he was looking at.

---

## 5. VERDICT

**Yes for one measure, with a caveat I will not bury.**

**Chrome share separates cleanly, and it separates the disease.** `/de` at 38.4% against a
reference ceiling of 21.2% and a liked-reference ceiling of 16.0% is not a marginal call. It is
the single outlier in thirteen screens, it produces no false positives anywhere else in our own
estate, and section 3.2 shows the pixels are really there. On the underlying question the owner
asked, whether complaints like this are math, the answer for clutter is **yes, it is math, and I
was wrong to call it unmeasurable.**

**The caveat: this measure does not flag the file he was looking at.** He pointed at `index.html`
and said "so much clutter". `index.html` scores **10.2% chrome, which is inside the reference
band, below Booking and just under `n1`.** None of the four candidate measures flags it. What this
research found is that the *live* `/de` is genuinely and measurably cluttered, and that `n3` has a
genuinely and measurably inconsistent icon scale. Neither of those is the same claim as "the
measure catches what he rejected". Presenting a gate that fires on `/de` as though it validated
his complaint about `index.html` would be a bait and switch, so: it does not.

**Three of the four candidate measures are dead** and should not be built into anything: counting
interactive elements, counting repeated affordances of the same kind, and counting distinct visual
treatments. Each of them ranks Airbnb, Uber or Booking as more cluttered than the screen the
owner rejected.

**The one-line reason the counting measures fail.** Clutter is not a function of how many things
are on screen. Airbnb puts 21 tap targets in its first viewport and reads calm because they are
spent on 33% photography and 26% text with only 7% of the screen given to control chrome. `/de`
puts 15 tap targets on screen and reads busy because they consume 38% of it and leave 0.6% for
photography. **Density is what you show. Clutter is what the interface spends on itself.**

---

## 6. Proposed threshold

**Chrome share of the first viewport must not exceed 25% on a customer screen.**

**How the number was chosen, stated plainly.** The 13 measured screens fall into two groups with a
wide empty gap between them. Everything except `/de` lands between 5.9 and 21.2. `/de` lands at
38.4. There are no observations between 21.2 and 38.4. I put the line at 25 because it sits inside
that empty gap, roughly four points above the busiest screen anyone has endorsed or tolerated
(Treatwell at 21.2) so that a screen slightly busier than that still passes, and thirteen points
below the screen that is actually broken.

**Provenance, per RESEARCH_METHOD R5.** **25 is a house number fitted to a sample of 13, not a
law, and it has no external citation.** It is the same species of number as the 30% weight-600
ceiling in CLAUDE.md, and that block already carries a correction saying the threshold was
invented while a sibling claim had been debunked for having no study behind it. The same warning
applies here: use the gate, it does real work, but never cite "25%" as evidence of anything. The
defensible content of this section is the *ordering*, that our `/de` spends about twice as much of
itself on controls as any screen we have pointed at as good. The exact cut point is a judgement
call and the owner can move it.

**What a gate should and should not do.**

- Measure at 390x844, scroll position 0, consent overlays hidden, matching every other floor in
  this system which is already specified on the first viewport.
- Exempt by name the same surfaces FLOORS LAW 2 exempts: forms, the checkout payment step, legal
  and receipts. A payment form is supposed to be mostly controls. Without this exemption the gate
  would fire correctly and uselessly on every one of them.
- Report the six-bucket breakdown on failure, not just the verdict. "chrome 38.4%, photo 0.6%"
  tells you what to do. "FAIL" does not.
- Not be wired without the owner seeing these numbers first. On this sample it fires on exactly
  one live screen, `/de`, which is already the screen under active redesign.

**Second, weaker candidate, recorded but not proposed for wiring:** distinct corner radii in one
viewport, `/de` at 7 against a reference band of 2 to 5. The margin is one radius wide. It needs a
bigger sample before it is worth a gate.

---

## 7. Reproducing this

Section 2 is self-contained and is enough to reproduce every chrome-share number from scratch:
open the page at 390x844, hide consent overlays, run the script. The research harness that
produced the wider table (tap targets, kinds, treatments, radii, glyph sizes) lived in the session
scratchpad as `clutter.js` plus a Playwright driver `run.js`, with all 13 rows in
`results-t-final.json` and first-viewport screenshots in `shots/`. Those are scratch files, not
repo files, and the numbers they produced are all recorded above.
