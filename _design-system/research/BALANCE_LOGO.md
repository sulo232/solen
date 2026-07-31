<!-- Exists-check: no BALANCE_LOGO.md existed. grep across _design-system/research/ for
     "logo" and "wordmark" returns only two incidental mentions, AXIS_FONT.md:117 and
     CHEAP_TYPE.md:108/136, and both treat the wordmark as a TEXT LEAF that pollutes a
     type-scale count. Nothing in the estate has ever measured the logo as a mark. That
     absence is itself a finding and is reported below. -->

# BALANCE_LOGO , can "the logo looks wrong" be measured?

**Question this file answers.** On 2026-07-31 the owner looked at
`public/_mockups/home-v3/index.html` and said *"this logo, I don't know what the fuck this
logo is."* I had previously told him that complaints like this need human taste. He said that
was a hedge and told me to actually measure. This file is the attempt, the numbers, and the
verdict.

**Sample.** Two of ours (the live `/de` header at 390x844, and the rejected mockup's only
logo-bearing variant, n2) against five live competitor headers measured the same way at
390x844: Fresha, Airbnb, Treatwell, Booksy, Planity. Every number below was computed from the
rendered DOM via `javascript_tool`. Uber was attempted and dropped: the open tab sat on a
`/business` page at 411x863 where the selector found no logo, and a guessed number is worse
than a missing one. Nothing here is recalled or estimated.

---

## 1. What the measure is, in plain words

A logo is supposed to be a picture of the brand's name, not the brand's name typed out. The
test has two halves.

**First half, is it a drawn thing or is it text?** Look at what the browser actually paints in
the logo slot. If it is a drawn shape (an `svg` or an `img`) it is a mark. If it is a live
piece of text, it is a word set in a font, and the browser will happily set it in whatever
font the rest of the page uses.

**Second half, if it is text, how different is that font from the page's own body font?** Draw
the word twice at a large size, once in the logo's font and once in the body font, forced to
the same capital-letter height and the same weight so neither size nor boldness can confuse
the answer. Overlay the two, letter by letter, each letter centred on its own ink so that
letter spacing does not leak in. Count the pixels where the two versions agree and the pixels
where either one has ink. Agreement divided by total gives a similarity; one minus that gives
a **shape distance**. Zero means the logo is literally the same typeface as the body text.
Around 0.10 means a different but interchangeable neutral font like Helvetica. Around 0.30
means a font with its own character. Around 0.42 means something as unlike it as Impact.

Everything else in this file, cap heights against the text beside it, optical versus
mechanical centring, ink weight against the neighbours, size against the nearest button, was
measured too, and none of it separated. Those negative results are section 4.

---

## 2. The code

Self-contained, returns JSON, runs as-is in `javascript_tool`. `logoMarkTest(selector)` is the
whole gate. `iconOptics()` is the secondary probe from section 5.

```js
(function () {
  var CAP = 96, PAD = 10;                       // normalise every glyph to a 96px cap height
  function ctx() { return document.createElement("canvas").getContext("2d"); }
  function fontOf(cs, px) {
    return cs.fontStyle + " " + cs.fontWeight + " " + (px || parseFloat(cs.fontSize)) + "px " + cs.fontFamily;
  }

  /* ---- ink boxes: what is actually PAINTED, not the layout box ---- */
  function svgInk(el) {
    var svgs = el.matches("svg") ? [el] : el.querySelectorAll("svg");
    var t = null, b = null, l = null, r = null, n = 0;
    svgs.forEach(function (s) {
      s.querySelectorAll("path,rect,circle,ellipse,polygon,polyline,line,text,use,image").forEach(function (g) {
        var q = g.getBoundingClientRect(); if (!q.width && !q.height) return; n++;
        t = t === null ? q.top : Math.min(t, q.top);   b = b === null ? q.bottom : Math.max(b, q.bottom);
        l = l === null ? q.left : Math.min(l, q.left); r = r === null ? q.right : Math.max(r, q.right);
      });
    });
    return n ? { kind: "svg", inkH: b - t, inkW: r - l, top: t, bottom: b } : null;
  }
  function imgInk(el) {
    var img = el.matches("img") ? el : el.querySelector("img"); if (!img) return null;
    var q = img.getBoundingClientRect();
    try {                                        // alpha-trim so padding in the asset does not count
      var W = Math.max(1, Math.round(q.width)), H = Math.max(1, Math.round(q.height));
      var cv = document.createElement("canvas"); cv.width = W; cv.height = H;
      var g = cv.getContext("2d"); g.drawImage(img, 0, 0, W, H);
      var d = g.getImageData(0, 0, W, H).data, minY = H, maxY = -1, minX = W, maxX = -1;
      for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3] > 24) {
        if (y < minY) minY = y; if (y > maxY) maxY = y; if (x < minX) minX = x; if (x > maxX) maxX = x; }
      if (maxY < 0) return { kind: "img-blank", inkH: q.height, inkW: q.width, top: q.top, bottom: q.bottom };
      var sy = q.height / H;
      return { kind: "img", inkH: (maxY - minY + 1) * sy, inkW: (maxX - minX + 1) * (q.width / W),
               top: q.top + minY * sy, bottom: q.top + (maxY + 1) * sy };
    } catch (e) { return { kind: "img-crossorigin", inkH: q.height, inkW: q.width, top: q.top, bottom: q.bottom }; }
  }
  function textInk(el) {
    var cs = getComputedStyle(el), txt = (el.textContent || "").trim(); if (!txt) return null;
    var c = ctx(); c.font = fontOf(cs);
    var m = c.measureText(txt); if (m.actualBoundingBoxAscent == null) return null;
    var capChar = (txt.match(/[A-Z]/) || txt.match(/[A-Za-z]/) || ["H"])[0].toUpperCase();
    var capH = c.measureText(capChar).actualBoundingBoxAscent;
    // Baseline WITHOUT mutating the DOM. A probe span perturbs a baseline-aligned flex line
    // and shifted this number by 4px in testing, so use a Range rect plus font metrics.
    var tn = null;
    (function walk(n) { for (var i = 0; i < n.childNodes.length; i++) { var k = n.childNodes[i];
      if (k.nodeType === 3 && k.nodeValue.trim()) { tn = k; return; } if (k.nodeType === 1) walk(k); if (tn) return; } })(el);
    var base = null;
    if (tn) { var rg = document.createRange(); rg.selectNodeContents(tn);
              var rr = rg.getBoundingClientRect(); if (rr.height > 0) base = rr.top + m.fontBoundingBoxAscent; }
    return { kind: "text", inkH: m.actualBoundingBoxAscent + m.actualBoundingBoxDescent,
      inkW: (m.actualBoundingBoxLeft || 0) + (m.actualBoundingBoxRight || 0), capH: capH,
      top: base == null ? null : base - m.actualBoundingBoxAscent,
      bottom: base == null ? null : base + m.actualBoundingBoxDescent };
  }
  function ink(el) { return svgInk(el) || imgInk(el) || textInk(el); }

  /* ---- shape distance: per-glyph, cap-normalised, each glyph centred on its own ink ---- */
  function scaleFor(txt, style) {
    var c = ctx(); c.font = style.replace(/([\d.]+)px/, "200px");
    var cc = (txt.match(/[A-Z]/) || txt.match(/[A-Za-z]/) || ["H"])[0].toUpperCase();
    var cap = c.measureText(cc).actualBoundingBoxAscent;
    return cap ? 200 * (CAP / cap) : null;
  }
  function glyphMask(ch, style, px) {
    var c = ctx(); c.font = style.replace(/([\d.]+)px/, px.toFixed(2) + "px");
    var m = c.measureText(ch);
    var W = Math.ceil((m.actualBoundingBoxLeft || 0) + (m.actualBoundingBoxRight || 0)) + PAD * 2;
    var H = Math.ceil(m.actualBoundingBoxAscent + m.actualBoundingBoxDescent) + PAD * 2;
    if (W < 3 || H < 3) return null;
    var cv = document.createElement("canvas"); cv.width = W; cv.height = H;
    var g = cv.getContext("2d"); g.font = c.font; g.fillStyle = "#000"; g.textBaseline = "alphabetic";
    g.fillText(ch, (m.actualBoundingBoxLeft || 0) + PAD, m.actualBoundingBoxAscent + PAD);
    var d = g.getImageData(0, 0, W, H).data, mask = new Uint8Array(W * H), on = 0,
        minX = W, maxX = -1, minY = H, maxY = -1;
    for (var i = 0; i < W * H; i++) if (d[i * 4 + 3] > 127) { mask[i] = 1; on++;
      var x = i % W, y = (i / W) | 0;
      if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
    if (!on) return null;
    return { mask: mask, W: W, H: H, on: on, cx: (minX + maxX) / 2, cy: (minY + maxY) / 2,
             bw: maxX - minX + 1, bh: maxY - minY + 1 };
  }
  function centredIoU(a, b) {
    if (!a || !b) return null;
    var Rx = Math.ceil(Math.max(a.bw, b.bw) / 2) + 4, Ry = Math.ceil(Math.max(a.bh, b.bh) / 2) + 4;
    var inter = 0, uni = 0;
    for (var dy = -Ry; dy <= Ry; dy++) for (var dx = -Rx; dx <= Rx; dx++) {
      var ax = Math.round(a.cx + dx), ay = Math.round(a.cy + dy);
      var bx = Math.round(b.cx + dx), by = Math.round(b.cy + dy);
      var pa = (ax >= 0 && ax < a.W && ay >= 0 && ay < a.H) ? a.mask[ay * a.W + ax] : 0;
      var pb = (bx >= 0 && bx < b.W && by >= 0 && by < b.H) ? b.mask[by * b.W + bx] : 0;
      if (pa && pb) inter++; if (pa || pb) uni++;
    }
    return uni ? inter / uni : null;
  }
  function shapeDist(txt, styleA, styleB) {
    var pa = scaleFor(txt, styleA), pb = scaleFor(txt, styleB);
    if (!pa || !pb) return null;
    var num = 0, den = 0, per = {};
    txt.split("").forEach(function (ch) {
      if (!ch.trim()) return;
      var ma = glyphMask(ch, styleA, pa), mb = glyphMask(ch, styleB, pb);
      var j = centredIoU(ma, mb); if (j == null) return;
      var w = (ma.on + mb.on) / 2; num += j * w; den += w; per[ch] = +j.toFixed(3);
    });
    return den ? { D_shape: +(1 - num / den).toFixed(4), perGlyph: per } : null;
  }

  /* ================= THE GATE ================= */
  function logoMarkTest(sel) {
    var logo = typeof sel === "string" ? document.querySelector(sel) : sel;
    if (!logo) return { error: "logo not found: " + sel };
    // Step 2 keys on STRUCTURE, not on measured ink. Self-testing caught the bug: a hidden or
    // zero-geometry svg made ink() fall through to the text branch and the gate errored instead
    // of passing. Whether a drawn mark is present does not depend on it being measurable.
    var drawn = logo.matches("svg,img") ? logo : logo.querySelector("svg,img");
    if (drawn) {
      var DI = ink(logo);
      return { verdict: "PASS", reason: "drawn mark (" + drawn.tagName.toLowerCase() + ")",
               markType: drawn.tagName.toLowerCase(),
               inkW: DI ? +DI.inkW.toFixed(2) : null, inkH: DI ? +DI.inkH.toFixed(2) : null };
    }
    var I = ink(logo); if (!I) return { error: "nothing painted in the logo slot" };
    var lcs = getComputedStyle(logo), bcs = getComputedStyle(document.body);
    var txt = (logo.textContent || "").trim();
    // weight matched on purpose: a weight step alone scores ~0.25 and would mask a same-font logo
    var sd = shapeDist(txt, fontOf(lcs, 200), "normal " + lcs.fontWeight + " 200px " + bcs.fontFamily);
    var D = sd ? sd.D_shape : null;
    return {
      verdict: (D != null && D >= 0.20) ? "PASS" : "FAIL",
      reason: "live text; letterform distance from body font = " + D + " (floor 0.20)",
      markType: "text", text: txt,
      logoFont: lcs.fontFamily.split(",")[0].replace(/"/g, "") + " " + lcs.fontWeight + " " + lcs.fontSize,
      bodyFont: bcs.fontFamily.split(",")[0].replace(/"/g, "") + " " + bcs.fontWeight + " " + bcs.fontSize,
      D_shape: D, perGlyph: sd && sd.perGlyph,
      inkW: +I.inkW.toFixed(2), inkH: +I.inkH.toFixed(2), capH: +I.capH.toFixed(2)
    };
  }

  /* ---- secondary probe: declared icon size vs the size the eye actually sees ---- */
  function iconOptics(rootSel, maxTop) {
    var root = rootSel ? document.querySelector(rootSel) : document;
    var rows = [];
    root.querySelectorAll("svg").forEach(function (s) {
      var q = s.getBoundingClientRect();
      if (q.width < 8 || q.width > 64) return;
      if (maxTop != null && q.top > maxTop) return;
      var I = svgInk(s); if (!I || I.inkH < 1) return;
      var cls = String(s.getAttribute("class") || "");
      rows.push({ name: (cls.match(/lucide-([a-z0-9-]+)/) || [, "?"])[1],
        declared: +q.height.toFixed(1), inkH: +I.inkH.toFixed(2), fill: +(I.inkH / q.height).toFixed(3) });
    });
    var ih = rows.map(function (r) { return r.inkH; });
    return { n: rows.length,
      inkH_spread_x: ih.length ? +(Math.max.apply(null, ih) / Math.min.apply(null, ih)).toFixed(2) : null,
      rows: rows };
  }

  window.__LOGOFIT = { logoMarkTest: logoMarkTest, iconOptics: iconOptics, ink: ink, shapeDist: shapeDist };
  return "ready. call __LOGOFIT.logoMarkTest('header span.font-display')";
})()
```

---

## 3. The numbers

All at 390x844. `ink` means the painted extent, not the layout box.

### 3.1 The primary measure

| surface | what is painted | ink W x H | letterform distance from that page's own body font |
|---|---|---|---|
| **Solen `/de`, live** | **live text**, Inter Tight 600 28px | 68.83 x 20.96 | **0.0144** |
| **Solen mockup n2, rejected** | **live text**, InterTightVar 600 28px + a 6x6 dot | 68.83 x 20.96 | **0.0596** |
| Fresha | drawn `svg` | 75.07 x 22.00 | not applicable |
| Airbnb | drawn `svg` | 29.79 x 31.95 | not applicable |
| Treatwell | drawn `svg` | 102.98 x 18.94 | not applicable |
| Booksy | drawn `svg` | 96.21 x 21.93 | not applicable |
| Planity | drawn `svg` | 120.00 x 12.63 | not applicable |

Five references, five drawn marks, zero live-text logos. Both of ours are live text.

Planity is the sharpest single comparison in the set: **its body font is Inter, the same
superfamily we use, and it still does not set its logo in it.**

### 3.2 What 0.0144 means, calibrated

Same string, same weight (600), same cap height, measured against our logo's Inter Tight:

| compared against | distance | reading |
|---|---|---|
| **Inter, our own body font** | **0.0144** | the same typeface |
| Helvetica | 0.1059 | an interchangeable neutral |
| Arial | 0.1182 | an interchangeable neutral |
| Avenir Next | 0.2119 | has its own character |
| Gill Sans | 0.2142 | has its own character |
| Verdana | 0.2735 | has its own character |
| Optima | 0.2894 | has its own character |
| Futura | 0.2923 | has its own character |
| Courier New | 0.3133 | different genre |
| Georgia | 0.3246 | different genre |
| Times New Roman | 0.3844 | different genre |
| Impact | 0.4150 | different genre |
| Papyrus | 0.4588 | different genre |

For scale, a plain weight step inside one family (Inter 400 against Inter 600) scores 0.2497,
which is why the gate matches weight before comparing. Our logo scores **0.0144**, seventeen
times smaller than a weight change. It is not a related typeface. It is the typeface.

### 3.3 Four supporting facts, all checked in the code and in the DOM

**a. The shipped logo has no dot.** `app/[locale]/_components/primitives/Logo.tsx:97-108`
renders exactly `<span aria-label="Solen" role="img"><span aria-hidden="true">Solen</span></span>`.
Confirmed against the live DOM: one child, no dot element. The file's own comment records why:
V3-D146, 2026-05-25, *"drop the dot entirely, just 'Solen'"*, an owner decision. So this is not
a bug. It is the decision, and its consequence is that the mark now contains zero
non-typographic content. The header comment two lines above still describes a "Cooper-style
wordmark + brand-teal dot accent", which is stale.

**b. The rejected mockup shows a dot the product does not have.** `.dn2-dot` renders 6x6 px,
and the mockup's own provenance comment claims it depicts `Logo.tsx` size md *"plus the 6px ink
dot"*. That claim is false against the shipped component. Measured, the dot is **4.21%** of the
mark's total ink area (28.3 px2 of dot against 643 px2 of letters). So the mockup showed him a
logo that is neither the product's logo nor meaningfully different from it.

**c. The logo is typographically identical to a section heading.** On `/de` there are 29
distinct text styles. The logo's exact family and weight, Inter Tight 600, is carried by seven
other elements: five section headings at 18px, one promo heading at 25px, one at 17px. The only
thing separating the brand mark from a section heading is 3px of font size.

**d. The brand ships two wordmarks that do not match.** `public/logo.svg`, used for metadata,
og:image and favicon, is an SVG `<text>` element with
`font-family="'Peace Sans', Impact, 'Arial Narrow Bold', sans-serif"`. Rendered, it is
byte-identical to Impact: the shape comparison between the file's font stack and plain Impact
900 returns an overlap of exactly 1.0000. Normalised to a common cap height, the header
wordmark is **17% wider** than it (337 against 288) and the metadata logo is **44% denser**
(ink coverage 0.5264 against 0.3658). Their letterform distance from each other is **0.5625**,
further apart than Inter Tight is from Impact. Two different-looking wordmarks, one brand.

---

## 4. The four ratios the brief asked about, and why each one fails

This is the part I would have been tempted to dress up. None of these separate.

| measure | Solen `/de` | Solen mockup | Fresha | Airbnb | Treatwell | Planity | separates? |
|---|---|---|---|---|---|---|---|
| cap height vs nearest text in the same band | 2.838 | none in band | none in band | 3.215 | 2.133 | none in band | **no** |
| optical centre error, px | -1.42 | -0.17 | 0.00 | 0.00 | -1.79 | 0.00 | **no** |
| same, as a fraction of ink height | -6.8% | -0.8% | +0.01% | 0.0% | -9.5% | 0.0% | **no** |
| ink height / nearest tap target height | 0.524 (40px) | 0.476 (44px) | 0.688 (32px) | 1.775 (18px) | 0.677 (28px) | 0.263 (48px) | **no** |
| ink coverage of the mark's own ink box | 0.4452 | 0.4452 | 0.4043 | n/a | n/a | 0.2501 | **no** |

**Cap height against the text beside it.** Undefined on three of five references and on our own
mockup, because a mobile header usually has no text next to the logo. Where it exists, the
references span 2.13 to 3.22 and we sit at 2.84, inside the range. Worse, our 2.84 is measured
against a 10px notification badge reading "3" sitting 211px away, so the number is noise
dressed as a ratio.

**Optical versus mechanical centring.** Ours is off by 1.42px on `/de` and 0.17px in the
mockup. Treatwell, a shipped competitor, is off by 1.79px, worse than both of ours. Three
references score exactly 0.00, and the reason matters: **a drawn mark's ink box is its layout
box, so centring the box centres the ink for free.** A text wordmark is the only case where
this can go wrong at all. The metric is therefore not independent of the first half of the
test, and on its own it does not fire. It also needs a well-defined row container, and Booksy
has none: its logo's nearest ancestors are 120px and then 336px tall, so the number is
undefined there.

**Weight against neighbours.** Ink coverage of the mark's own bounding box: ours 0.4452, Fresha
0.4043, Planity 0.2501. Ours is the heaviest of the three, not the lightest. Nothing to flag.
Reference n for this metric is 2, and the Airbnb attempt failed on a canvas error rather than
returning a number, which I am recording rather than filling in.

**Size against the nearest interactive target.** Ours is 0.476 to 0.524. Planity is 0.263,
half our ratio, and its header reads fine. Airbnb is 1.775. We sit in the middle of a range
spanning 6.7x. The complaint cannot be that the logo is the wrong size relative to the controls
around it, because the references do not agree on a size relative to the controls around them.

---

## 5. A secondary finding, honestly bounded

The owner's full sentence was *"the sizes doesn't match between a search bar, logo, icons,
everything."* One measurable thing sits underneath the icon half of that, and it is the same
principle as the logo test: **the size an icon is declared at is not the size it looks.**

Lucide glyphs are drawn on a 24 grid but they do not fill it equally. Measured ink height
divided by declared box height, on our own surfaces:

- **`/de` header, three icons declared 21, 22 and 21.8px** render **17.5, 12.83 and 10.89px**
  of ink. A **1.61x optical spread** among three controls the code says are the same size.
- Across all of `/de`, 22 distinct icon instances span fill ratios of 0.25 (`chevron-down`) to
  1.00, a 4x spread.
- In the rejected mockup's n2 header, a `menu` declared at **22px** renders 12.83px of ink
  while a `search` declared at **18px** renders 13.5px. The one declared 22% bigger renders 5%
  smaller. The stated hierarchy is inverted at render.

**Where this stops.** Fresha's header carries three icons all declared 20px, rendering 13.35,
15.63 and 16.88px of ink, a **1.26x** spread. So the references do not hold this at 1.0 either.
Our 1.61x against their 1.26x points the right way, but both samples are three icons. **That is
far too small to set a threshold from, and I am not proposing one.** It is a real, repeatable
measurement and a candidate for a proper sweep, not a gate today.

---

## 6. VERDICT

**On the four ratios the brief named: no.** Cap-height ratio, optical centring, relative ink
weight, and size against the nearest tap target all put our rejected logo comfortably inside
the range the references occupy, and on two of them a shipped competitor scores worse than we
do. Any gate built on them would fire on Treatwell and Planity and would not have caught this.
I am reporting that as a clean negative rather than picking whichever of the four looked
closest.

**On one thing that is not a ratio: yes, and it is decisive.** Our logo is not a mark. It is
the word "Solen" typed in the interface font, with a letterform distance of **0.0144** from our
own body text, against a floor where even Helvetica against Inter scores 0.106. Five of five
references paint a drawn shape. Neither of ours does. Planity, whose body font is Inter like
ours, still draws its logo.

So "I don't know what the fuck this logo is" is a literally accurate description of a
measurable state: there is nothing there to recognise. The dot that was the only
non-typographic element was removed by owner decision on 2026-05-25, the metadata logo renders
in Impact and looks like a different brand, and on the live page the mark is separated from a
section heading by three pixels of font size. This is measurable, it was never measured, and
the reason it was never measured is that every existing tool in this estate counts the logo as
a text leaf, which is exactly what it is.

**Scope limit, stated plainly.** This closes the logo third of his sentence. It does not
measure "it isn't aligned" or "so much clutter", and the icon work in section 5 is a lead, not
a result.

---

## 7. The gate, and how the threshold was chosen

```
LOGO-IS-A-MARK
  1. Resolve the logo: the link to home in the top 160px of the viewport, or an element whose
     aria-label or alt matches the brand name.
  2. If what it paints is an inline <svg> or an <img>  ->  PASS.
  3. If what it paints is a live text node:
       D = shapeDist(text, logo font at its own weight, body font at THE SAME weight)
       PASS if D >= 0.20, otherwise FAIL.
```

**Why 0.20.** It is placed in the empty band in the calibration ladder of section 3.2. The
highest "you could mistake this for the UI font" score is Arial at 0.1182. The lowest "this
typeface has its own character" score is Avenir Next at 0.2119. Nothing was measured between
0.1182 and 0.2119, so 0.20 sits just below the distinct band. That placement is deliberately
conservative: it lets a genuinely different typeface through and stops a near-clone.

**Scores under this gate.** Solen `/de` 0.0144, FAIL. Solen mockup n2 0.0596, FAIL. Fresha,
Airbnb, Treatwell, Booksy, Planity all PASS at step 2 without reaching the numeric branch.

**Known false-fail.** A brand whose real logotype is a bespoke grotesque very close to its UI
font would score under 0.20 and fail correctly on the letter of the rule but wrongly on the
intent. The gate needs the same named-owner-decision override every other gate here has. The
weight-matching in step 3 is load-bearing and must not be dropped: without it, a same-font
wordmark simply set bolder scores 0.2497 and sails through.

**Not proposed as a gate.** The four ratios in section 4, on the evidence above. The icon
optical-spread measure in section 5, until it has a sample larger than three icons per header.

---

## 8. Self-test of the code in section 2

Run against the live `/de` at 390x844, both branches plus the failure modes. 7 of 7 as expected.

| # | input | expected | got |
|---|---|---|---|
| 1 | live `/de` logo | FAIL | FAIL, D = 0.0144 |
| 2 | a header `svg` with unmeasurable geometry | PASS | PASS, "drawn mark (svg)" |
| 3 | an `<a>` wrapping a visible `svg` | PASS | PASS, ink 47 x 18 |
| 4 | an `<a>` wrapping an `<img>` | PASS | PASS, ink 80 x 22 |
| 5 | synthetic wordmark in Georgia 600 | PASS | PASS, D = 0.33 |
| 6 | synthetic wordmark in Helvetica 600 | FAIL | FAIL, D = 0.1135 |
| 7 | an empty element | error, no crash | `{error: "nothing painted in the logo slot"}` |

**Bug this self-test caught, recorded because it would have shipped otherwise.** The first
version keyed step 2 on the measured ink box. Case 2 then errored instead of passing: the svg
had zero-geometry children, `ink()` fell through to the text branch, and the text branch found
no text. Step 2 now keys on structure, `logo.matches("svg,img") || logo.querySelector("svg,img")`,
and reports ink only for information. Whether a drawn mark exists does not depend on it being
measurable.

**Second bug caught earlier, in the ink measurement itself.** The first baseline finder appended
a full-height probe span to read the text baseline. Inside a `display:inline-flex` element with
`align-items:baseline`, which is exactly what `Logo.tsx` renders, that probe grows the flex line
and moves the thing being measured. It reported the optical centre error as +3.83px. The
non-mutating Range-plus-font-metrics method reports -0.17px, and a zero-height probe agrees with
it to 0.00px. Had I not cross-checked two methods I would have reported a 4px centring defect
that does not exist. Any future work on this file uses the Range method.

**Caveat the self-test exposes, and it bounds the gate.** Passing an ordinary page heading to
`logoMarkTest` also returns FAIL: the `/de` h1 "Termine, sofort bestätigt." scores **0.033**
against the same floor. The gate cannot distinguish the logo from a heading, which is the
finding restated, but it means **the logo-resolution step is load-bearing**. Wired carelessly
this would flag every heading on the site. It must run on one resolved element, not on a
document sweep.
