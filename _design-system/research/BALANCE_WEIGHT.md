<!-- exists-check: EXTENDS gap-register item D1, it does not duplicate it.
     Prior art searched (`grep -rniE "centroid|optical cent|centre of mass|visual weight"` over
     _design-system/, _plans/, _rules/) and READ IN FULL before writing:
     (1) RATIONALE.md:859 , gap-register D1, "Visual-weight/balance centroid metric (answers
         'unbalanced' with a number: per-element bbox area x darkness x saturation, centroid
         offset)", marked Mechanizable: YES. D1 SPECIFIES this metric. It was never built or run.
         This file builds it, runs it on twelve screens, and reports what came out.
     (2) research/GEOMETRY_PRINCIPLES_2026-07-17.md:178 , already ASSERTS "It has no valid
         pass/fail threshold." That was a judgement with no measurement behind it. This file
         supplies the evidence (threshold sweep, permutation test, positive control) and CONFIRMS
         it. Same file's "Rejected as a gate candidate" paragraph already rejected the crude
         left/right ink ratio because "the 40/60 number is invented"; this file shows empirically
         that NO number works, which is the stronger form of that rejection.
     (3) Same file's quality note on `ngo-computational-balance-model` , the peer-reviewed balance
         math Solen's collapse test rests on was validated on five design students. Consistent with
         what is found here.
     (4) ~/.claude/skills/solen-taste-diagnosis , the live diagnosis walk, which measures weight
         centroid and explicitly disclaims symmetry and alignment.
     One CORRECTION to D1 is raised in section 6: D1 specifies a per-element bbox method, and that
     method is measured here against pixel truth and found unreliable on photo-first screens.
     Sibling convention: single-axis measured audit, like CHEAP_EDGE.md / CHEAP_SPACE.md.
     No new component, route, table, migration or gate is proposed. -->

# BALANCE, MEASURED AS VISUAL WEIGHT AND OPTICAL CENTRE

Lens: WEIGHT. Owner correction, 2026-07-31: balance is "the most easiest measure or not", so stop
hedging and go compute it. He is right that it is computable. This file computes it.

**Answer in one line: the centroid measure is real, correct, and does NOT separate the screens the
owner rejected from the screens he likes. A clear no, and the reason is the useful part.**

This is the measurement that gap-register **D1** asked for and never got.
`GEOMETRY_PRINCIPLES_2026-07-17.md:178` already asserted D1 "has no valid pass/fail threshold";
that was a judgement call with no numbers behind it. Below are the numbers, and they confirm it.

---

## 1. What the measure is, in plain words

Imagine printing the screen and cutting it out of card. The dark parts, the photos and the strong
colours are heavy; the empty white parts weigh nothing. Now find the point where that cut-out
balances on a fingertip. That point is the **centre of mass of the ink**. If the design is
balanced it sits at the middle of the screen. If everything heavy is stacked on one side, the
balance point slides that way and the screen should feel lopsided.

Concretely, every pixel gets a weight equal to how far it departs from the page's own background
colour, so black text on white is heavy, a photo is heavy, and white space is weightless. Average
the pixel positions using those weights and you get the balance point. Two numbers come out: how
far it sits from the true centre (as a percentage of screen width), and how the total ink splits
between the left half and the right half. A perfectly symmetric screen gives 50/50 and zero offset.

That is the whole idea. It is ordinary physics and it is not controversial. The finding here is not
that the arithmetic fails. It is that the quantity it measures is not the thing that was wrong.

---

## 2. The exact JavaScript

Two implementations exist and they do **not** agree well. Read section 6 before trusting the DOM one.

### 2a. The DOM version (runs in `javascript_tool`, as the brief requires)

This is D1 as specified: per-element box, weighted by area, darkness and saturation. Paste as-is;
it measures the first viewport only and returns JSON.

```js
(() => {
  const VW = window.innerWidth, VH = window.innerHeight;
  const X0 = 0, Y0 = 0, X1 = VW, Y1 = VH;
  const lum = (c) => {
    const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null;
    const p = m[1].split(',').map(parseFloat);
    const a = p.length > 3 ? p[3] : 1;
    if (a === 0) return null;
    return { L: 0.2126*p[0] + 0.7152*p[1] + 0.0722*p[2], a,
             C: (Math.max(p[0],p[1],p[2]) - Math.min(p[0],p[1],p[2])) };
  };
  const bgOf = (el) => {                       // effective background behind an element
    let n = el;
    while (n && n !== document.documentElement) {
      const v = lum(getComputedStyle(n).backgroundColor);
      if (v && v.a > 0.05) return v.L;
      n = n.parentElement;
    }
    const v = lum(getComputedStyle(document.body).backgroundColor);
    return v ? v.L : 255;
  };
  const clip = (r) => {
    const x = Math.max(r.left, X0), y = Math.max(r.top, Y0);
    const w = Math.min(r.right, X1) - x, h = Math.min(r.bottom, Y1) - y;
    return (w > 0 && h > 0) ? { x, y, w, h } : null;
  };
  const parts = [];
  const push = (r, m, kind) => { if (r && m > 0) parts.push({ ...r, mass: m, kind }); };

  for (const el of document.querySelectorAll('*')) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) continue;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) continue;
    if (rect.bottom < Y0 || rect.top > Y1) continue;
    const op = parseFloat(cs.opacity) || 1;
    const bgL = bgOf(el.parentElement || document.body);
    const isImg = ['IMG','VIDEO','SVG','CANVAS'].includes(el.tagName);
    const hasBgImg = cs.backgroundImage && cs.backgroundImage !== 'none';
    if (isImg || hasBgImg) {                                    // photographic mass
      const c = clip(rect); push(c, c ? c.w*c.h*0.75*op : 0, 'image');
    } else {                                                    // fill, weighted by contrast
      const own = lum(cs.backgroundColor);
      if (own && own.a > 0.03) {
        const d = Math.abs(own.L - bgL)/255, chroma = own.C/255;
        const k = Math.min(1, d + 0.6*chroma);
        const c = clip(rect); push(c, c ? c.w*c.h*k*own.a*op : 0, 'fill');
      }
    }
    for (const side of ['Top','Right','Bottom','Left']) {        // borders and hairlines
      const bw = parseFloat(cs['border'+side+'Width']) || 0;
      if (bw <= 0 || cs['border'+side+'Style'] === 'none') continue;
      const bc = lum(cs['border'+side+'Color']);
      if (!bc || bc.a < 0.03) continue;
      const d = Math.abs(bc.L - bgL)/255; if (d < 0.01) continue;
      const horiz = side === 'Top' || side === 'Bottom';
      let r = { left: rect.left, right: rect.right,
                top: side==='Bottom'?rect.bottom-bw:rect.top,
                bottom: side==='Top'?rect.top+bw:rect.bottom };
      if (!horiz) { const L2 = side==='Right'?rect.right-bw:rect.left;
                    r = { left:L2, right:L2+bw, top:rect.top, bottom:rect.bottom }; }
      const c = clip(r); push(c, c ? c.w*c.h*d*bc.a*op : 0, 'border');
    }
  }
  // text measured from real text-node rects, not block boxes
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let tn;
  while ((tn = walker.nextNode())) {
    const s = tn.nodeValue; if (!s || !s.trim()) continue;
    const pe = tn.parentElement; if (!pe) continue;
    const cs = getComputedStyle(pe);
    if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) continue;
    const col = lum(cs.color); if (!col) continue;
    const contrast = Math.abs(col.L - bgOf(pe))/255; if (contrast < 0.02) continue;
    const wgt = parseFloat(cs.fontWeight) || 400;
    const kText = 0.18 * Math.pow(wgt/400, 0.6);   // glyph ink covers a fraction of the line box
    const rng = document.createRange(); rng.selectNodeContents(tn);
    for (const r of rng.getClientRects()) {
      if (r.width <= 0 || r.height <= 0) continue;
      const c = clip(r); push(c, c ? c.w*c.h*kText*contrast*(parseFloat(cs.opacity)||1) : 0, 'text');
    }
  }

  let M=0,mx=0,my=0,left=0,right=0,top=0,bot=0; const byKind={};
  const midX = VW/2, midY = VH/2;
  for (const p of parts) {
    M += p.mass; mx += (p.x+p.w/2)*p.mass; my += (p.y+p.h/2)*p.mass;
    byKind[p.kind] = (byKind[p.kind]||0) + p.mass;
    const lw = Math.max(0, Math.min(p.x+p.w, midX) - p.x);
    left += p.mass*(lw/p.w); right += p.mass*(1-lw/p.w);
    const th = Math.max(0, Math.min(p.y+p.h, midY) - p.y);
    top += p.mass*(th/p.h); bot += p.mass*(1-th/p.h);
  }
  if (M === 0) return JSON.stringify({error:'no mass'});
  const cx=mx/M, cy=my/M, r2=(v)=>Math.round(v*100)/100;
  return JSON.stringify({
    ink_density_pct: r2(M/(VW*VH)*100),
    x_offset_from_centre_pct: r2((cx-VW/2)/VW*100),
    y_offset_from_centre_pct: r2((cy-VH/2)/VH*100),
    left_share_pct: r2(left/(left+right)*100),
    right_share_pct: r2(right/(left+right)*100),
    lr_imbalance_pct_pts: r2(Math.abs(left-right)/(left+right)*100),
    mass_by_kind_pct: Object.fromEntries(Object.entries(byKind).map(([k,v])=>[k, r2(v/M*100)])),
    parts: parts.length
  }, null, 1);
})()
```

### 2b. The pixel version (ground truth, and where the numbers below come from)

The DOM cannot see inside a photograph. It spreads an image's mass evenly across its rectangle, so
a full-width photo always contributes exactly 50/50 no matter what is in it. On a photo-first
product that is most of the page. The pixel version rasterises and weighs actual pixels, which is
what "visual weight" means. Python over a Playwright screenshot:

```python
from PIL import Image; import numpy as np
def balance(path):
    a = np.asarray(Image.open(path).convert('RGB')).astype(np.float32)
    H, W, _ = a.shape
    L = 0.2126*a[:,:,0] + 0.7152*a[:,:,1] + 0.0722*a[:,:,2]
    q = (a//32).astype(np.int32); codes = q[:,:,0]*64 + q[:,:,1]*8 + q[:,:,2]
    v, c = np.unique(codes, return_counts=True)
    Lbg = L[codes == v[np.argmax(c)]].mean()          # the page's own background
    ink = np.abs(L - Lbg) / 255.0                     # departure from background = weight
    cx = (ink * np.arange(W)[None, :]).sum() / ink.sum()
    l, r = ink[:, :W//2].sum(), ink[:, W-W//2:].sum()
    return {'x_offset_pct': (cx/W - 0.5)*100,
            'lr_imbalance_pct_pts': abs(l-r)/(l+r)*100,
            'ink_density_pct': ink.sum()/(W*H)*100}
```

---

## 3. Sample and method, stated so the numbers can be checked

**Method.** Chromium via Playwright 1.59.1, viewport exactly 390x844, deviceScaleFactor 2, mobile
Safari user agent, locale de-CH. First viewport only, clipped to 390x844, no scrolling. Animations
and transitions frozen to zero duration so the raster is deterministic.

**Three capture bugs I had to fix, each of which had already produced a wrong number.** Naming them
because any future attempt at this will hit the same three.

1. `n1.html` and `n3.html` carry **no `<meta name="viewport">`**. Under mobile emulation Chromium
   laid them out at the 980px default and scaled down, so the first captures measured a narrow
   centred column. Fixed by injecting the meta before load and using a true 390px layout viewport.
2. Treatwell and Airbnb first captured with their **cookie modals covering the screen**. They scored
   0.48 and 0.03 imbalance, near perfect, purely because a centred white modal pins the centroid to
   the middle. Those numbers were discarded. Consent overlays, scrims and app-install interstitials
   are now removed from the DOM before capture. **Nothing was accepted or clicked**; elements are
   deleted for measurement only.
3. `waitUntil: 'load'` never fires against the Next dev server (HMR holds the connection open), so
   captures hung at two minutes. Switched to `commit` plus a fixed settle.

**Sample, twelve screens.**

| group | screens |
|---|---|
| The rejected artifact | `public/_mockups/home-v3/` `index.html` (the comparison shell the owner actually looked at) plus its three variants `n1.html`, `n2.html`, `n3.html` |
| Ours, live | `/de` on `localhost:50723` |
| References, live sites captured the same day | Fresha, Treatwell, Planity, Doctolib, Airbnb, Booking, Uber Eats |

**Two honest caveats on the sample.** `n1` and `n3` are header-only fragments whose feed is
deliberately grey placeholder blocks, so their low ink density is by design and not a defect. And
the references are live web home screens, not the owner's own "I like this" set; they stand in for
competent professional work, which is the comparison that matters.

---

## 4. The numbers

Pixel measure, first viewport at 390x844. `dx` is how far the balance point sits from the
horizontal centre as a percentage of width, negative is left. `|L-R|` is the gap between the left
half's ink share and the right half's, in percentage points, where 0 is perfectly even.

| screen | ink % | dx % | dy % | left % | right % | **\|L-R\|** |
|---|---|---|---|---|---|---|
| REF Airbnb | 17.81 | +5.45 | +9.40 | 39.44 | 60.56 | **21.13** |
| our `index.html` (rejected) | 3.47 | -6.54 | -19.17 | 60.49 | 39.51 | **20.97** |
| REF Fresha | 13.72 | -4.96 | -1.04 | 57.72 | 42.28 | **15.44** |
| our live `/de` | 9.76 | +0.85 | +7.74 | 45.45 | 54.55 | **9.10** |
| our `n3` (rejected) | 2.55 | -2.94 | -13.77 | 54.17 | 45.83 | **8.35** |
| REF Doctolib | 22.65 | +2.27 | -23.43 | 46.45 | 53.55 | **7.09** |
| our `n2` (rejected) | 25.03 | +1.55 | +11.38 | 47.08 | 52.92 | **5.84** |
| our `n1` (rejected) | 2.13 | -2.28 | -11.08 | 52.85 | 47.15 | **5.71** |
| REF Planity | 32.74 | +2.09 | -12.69 | 47.23 | 52.77 | **5.55** |
| REF Uber Eats | 18.48 | +0.34 | +4.33 | 47.78 | 52.22 | **4.43** |
| REF Treatwell | 17.47 | -0.88 | +2.44 | 51.70 | 48.30 | **3.40** |
| REF Booking | 21.88 | -1.17 | -14.19 | 51.67 | 48.33 | **3.34** |

Sorted by imbalance, because the ordering **is** the finding. **Airbnb is the most horizontally
unbalanced screen in the whole sample.** The three rejected variants sit at 5.71, 5.84 and 8.35,
in the middle of the reference range, below Fresha and below Airbnb.

**Robustness, ink defined a second way.** Re-running with chroma added to the weight (a saturated
mid-luminance colour counts as heavy) gives Airbnb 19.41, Fresha 14.28, our n1 4.80, n2 5.10,
n3 7.78, index 19.53. The middle of the ordering shuffles but the conclusion is identical, so it
does not depend on how I chose to define ink.

**Robustness, is Airbnb's number an artifact of the app banner left at the top?** No. Cropping the
banner away makes it worse, not better.

| Airbnb region measured | \|L-R\| | dx % |
|---|---|---|
| full, 0 to 844 | 21.13 | +5.45 |
| below the app banner, 150 to 844 | 22.74 | +5.81 |
| between banner and bottom nav, 150 to 770 | 22.72 | +5.76 |
| feed only, 300 to 844 | 24.57 | +6.35 |

Applying that same 150-to-844 crop to our screens for a like-for-like read: n1 8.55, n2 7.01,
n3 8.32, index 18.75, `/de` 11.98. Airbnb at 22.74 is still worst by a wide margin.

**Why the two most imbalanced screens are two of the best designed.** The column ink profile says
it plainly. Airbnb's rightmost eighth carries 0.777 normalised ink against 0.487 on the left,
because its home is horizontal carousels with a **third card cropped at the right edge**. Fresha is
the mirror image, 0.664 left against 0.371 right, because of a **left-aligned hero headline with a
ragged right edge**. Both are deliberate and canonical, and one of them is a structure our own
FLOORS LAW 3 explicitly requires ("a visibly cropped next item, the scroll promise"). A gate on
horizontal balance would fight our own density floor.

### The measure is not broken: a positive control

Before concluding "no signal" I checked the instrument. Same page (`n2`), same content, known
horizontal displacements applied by CSS transform:

| control | dx % | \|L-R\| |
|---|---|---|
| as-is | +1.55 | 5.84 |
| shifted left 39px (10% of width) | -5.81 | 13.25 |
| shifted left 78px (20%) | -11.21 | 30.10 |
| shifted right 78px (20%) | +13.61 | 40.06 |
| squeezed into the left half | -22.82 | 94.29 |
| squeezed into the right half | +24.33 | 94.29 |

It responds monotonically and roughly proportionally, and saturates correctly at the extremes. A
39px nudge already moves the balance point 7.4 points and swings the split by 13.3 points.
**The instrument works. The defect it detects is simply absent from what he rejected.**

---

## 5. VERDICT: no. This does not separate what he rejected from what he likes

Stated as plainly as the brief demands: **a clear no.** This confirms, with evidence,
`GEOMETRY_PRINCIPLES_2026-07-17.md:178`'s previously unevidenced assertion.

**There is no threshold that works.** Sweeping every cut on `|L-R|`:

| threshold | references wrongly flagged | rejected screens caught | which references |
|---|---|---|---|
| 3 | 7 of 7 | 4 of 4 | all of them |
| 5 | 4 of 7 | 4 of 4 | Airbnb, Doctolib, Fresha, Planity |
| 6 | 3 of 7 | 2 of 4 | Airbnb, Doctolib, Fresha |
| 8 | 2 of 7 | 2 of 4 | Airbnb, Fresha |
| 10 | 2 of 7 | 1 of 4 | Airbnb, Fresha |
| 21 | 1 of 7 | 0 of 4 | Airbnb |

Every cut that catches even half the rejected set also flags Airbnb and Fresha, the two references
this design system is explicitly built on. The distributions overlap almost completely: references
span 3.34 to 21.13, rejected screens span 5.71 to 20.97.

**The separation is not statistically real either.** Ranking rejected screens against references
gives AUC 0.68 for `|L-R|`, 0.71 for `|x offset|`, 0.68 for `|y offset|`, where 0.50 is a coin flip.
Exact permutation over all 330 possible four-versus-seven splits gives p = 0.206, 0.158 and 0.206.
Nothing here would survive a second sample, and it should not.

**Why it fails, which is the part worth keeping.** A mobile screen at 390px is a vertical stack of
full-width rows with symmetric margins. Horizontal balance is therefore close to a *constant of the
medium* rather than a variable the designer controls, so it has almost no room to distinguish good
from bad. What variance does exist is dominated by deliberate, correct asymmetry: a left-aligned
headline, a cropped carousel card promising sideways scroll. So the measure does not merely fail to
correlate with quality. On this sample it leans mildly the wrong way.

**What it does not detect, checked one by one against his four complaints:**

| his complaint | does the centroid see it |
|---|---|
| "the sizes doesn't match between a search bar, logo, icons" | No. Swapping two elements' sizes while keeping the layout centred leaves the centroid unmoved. This is a ratio problem between siblings, not a distribution problem. |
| "it isn't aligned" | No, and this is the sharpest failure. In the rejected `index.html` the three screen roots are 390px wide inside a 358px cell, so every variant is clipped at the right edge, a real and visible defect. It moves `\|L-R\|` by less than the gap between two references. |
| "so much clutter" | No, and it is inverted. Clutter is element count and spacing, not mass. `index.html` has the **lowest** ink density in the sample at 3.47%, and `/de`, which he did not call cluttered, sits at 9.76%, below every reference. |
| "I don't know what the fuck this logo is" | No. A wordmark is a small fraction of one percent of page mass and cannot move a centroid measurably. |

**One thing that did separate, reported with its confound.** Ink density splits the rejected
fragments (2.13, 2.55, 3.47) from every reference (13.72 minimum). But `n1` and `n3` are header-only
files with placeholder feeds, so that gap is mostly an artifact of the file type, and the property
it measures (emptiness) is already governed by the FLOORS LAW density and imagery floors. It is not
a balance finding and I will not dress it up as one. The one genuinely new fact in that column is
that our live `/de` at 9.76% sits below all seven references, which belongs to the density lens.

---

## 6. A correction to D1 as specified: do not use the per-element method

D1 specifies "per-element bbox area x darkness x saturation". I built exactly that (section 2a) and
measured it against pixel truth on the same five pages at the same viewport. **It does not agree
well enough to report, let alone gate.**

| page | dx pixel | dx DOM | err | \|L-R\| pixel | \|L-R\| DOM | err | cy pixel | cy DOM | err |
|---|---|---|---|---|---|---|---|---|---|
| `index` | -6.54 | -1.37 | 5.17 | 20.97 | 6.63 | **14.34** | 30.83 | 53.86 | **23.03** |
| `n1` | -2.28 | +0.85 | 3.13 | 5.71 | 0.11 | 5.60 | 38.92 | 50.90 | 11.98 |
| `n2` | +1.55 | -0.29 | 1.84 | 5.84 | 0.81 | 5.03 | 61.38 | 61.49 | 0.11 |
| `n3` | -2.94 | -0.81 | 2.13 | 8.35 | 3.08 | 5.27 | 36.23 | 45.90 | 9.67 |
| `/de` | +0.85 | +4.26 | 3.41 | 9.10 | 17.48 | **8.38** | 57.74 | 62.25 | 4.51 |

The per-element error on `|L-R|` runs from 5.03 to 14.34 points, **larger than the entire spread
between our screens and the references**. The cause is structural, not a tuning problem: on `n2`
images are 84.93% of DOM-computed mass, and a bbox method assigns an image's mass uniformly across
its rectangle, so it is blind to what is actually inside the photograph. On a photo-first product
that blindness covers most of the page. **If D1 is ever built for real, it must be built on the
raster, not on bounding boxes.** That is a change to D1's stated method and it should be recorded
against it.

---

## 7. What I would do instead

Nothing from this lens should be wired into the floors gate, which is the same conclusion
`GEOMETRY_PRINCIPLES_2026-07-17.md` reached and this file now backs with data. D1 should stay a
human-read diagnostic, consistent with the note that the balance model it rests on was validated on
five design students.

Spend the gate budget on the lenses aimed at what he actually named: element-to-element size
ratios, shared edge alignment (gap-register D3), and element count per unit area. This file's
contribution is a negative result, a validated instrument, three named capture bugs, and one
correction to D1's method, so the next person does not re-derive any of it.

---

*Measured 2026-07-31. Twelve screens, first viewport, 390x844, Playwright plus PIL. Every number in
this file was computed from a capture taken that day; none is recalled or estimated. Raw JSON,
screenshots and the capture harness were written to the session scratchpad and are not checked in.*
