<!-- exists-check: `npm run exists spacing` and `npm run exists gutter` run 2026-07-30, ZERO hits
     each, so nothing in the estate owns this axis by name and no graveyard entry is touched. Prior
     art READ IN FULL before writing, and this file EXTENDS rather than restates:
     (1) research/TASTE_GROUPING.md , external-source Gestalt law. Its diagnostic checklist item 6
     ("compare the whitespace gap above the field to the gap inside its own item; if equal or
     larger, proximity is grouping the wrong things") is EXACTLY the defect measured in section 5.
     That file states the law; this one supplies the measurement on our page.
     (2) research/AXIS_GRID.md , the competitive corpus for gutters and container widths, plus the
     "same width, or at least ~1.3x apart" rule reused in section 4 item 2.
     (3) research/WHY_DENSITY.md , card counts. Section 4 item 7 CONFIRMS its 4b prediction on the
     render and CORRECTS the cause.
     (4) research/AXIS_FONT.md , cited only for the render-scale constant.
     (5) sections/home-feed/CORPUS.md.
     Sibling convention: this is a CHEAP_* file (CHEAP_EDGE.md is the other): a single-axis measured
     audit of the shipped page, not a corpus. No new component, route, table or migration proposed.
     No rule change is applied here; section 6 states what a fix would cost and names the settled
     owner decision it collides with. -->

# CHEAP: SPACE

**Date:** 2026-07-30
**Probe:** SPACE. Vertical rhythm, in-rail gaps, card padding and page gutters on the home feed.
**Verdict in one line:** the between-section rhythm and the card-to-card gutter are **fine** and sit
inside the reference band, but **three relationships that mean three different things all render at
exactly 8px** , a photo and its own caption, a section heading and the rail it labels, and two
unrelated content blocks , which is a 1.00x proximity ratio against a 2x floor.

---

## 1. Method

**Route:** `http://localhost:50723/de`, the live dev render, logged in as the seed QA user
("Hallo, QA Test").

**Viewports:** every number was taken twice, at **1512 x 950** and **390 x 844**, and each row below
says which. Where a defect exists at only one width, it says so explicitly.

**Instrument:** `Claude_Browser` `javascript_tool`, `getBoundingClientRect` and `getComputedStyle` on
the rendered DOM. **No number in section 2 or 3 is read from source.** Source is cited only in
section 6, to name the file that owns a rendered number.

**What "a gap" means here.** Box-to-box: the distance from one element's rendered `bottom` (or
`right`) to the next element's rendered `top` (or `left`). Text boxes include their half-leading, so
a text-to-text gap reads ~2 to 3px tighter optically than the number given. **Both sides of every
ratio in this file are measured the same way**, so the ratios are apples-to-apples even though the
absolute numbers are box figures.

**What I excluded, and why.**
- Elements with zero width or height, `display:none`, `visibility:hidden`.
- Mapbox marker DOM inside the "In der Nähe" map. A first painted-bounds scan reported
  `paintLeft: -64.6` because off-canvas map pins are real DOM with real rects. Every bounds figure
  below is restricted to elements whose rect intersects the viewport horizontally.
- The `Für Salons` band's `h2` as a section-gap marker: it sits in the **right** column of a
  2-column grid, so its `top` is mid-section and produced a nonsense 326px gap. That row uses the
  section's content-box top instead, and says so.

**One instrument hazard, stated because it nearly corrupted the data.** Another agent shares this
browser tab and resized it mid-run. Two early calls returned 390-width numbers while I believed I
was at 1512. Every measurement below was re-taken with `innerWidth` reported **inside the same
synchronous script as the measurement**, so each row is self-certifying. Two figures produced before
that guard was added were discarded and re-measured, not reused.

**Reference instrument:** Mobbin MCP, 24 screens returned across two searches, of which **5 were
pixel-measured with Python PIL**, not eyeballed. Mobbin serves iOS captures at **299 px wide** for a
~390pt device, so **1 render px = 1.304 pt** (constant established in `AXIS_GRID.md` section 0).
**No absolute pixel value is claimed for any competitor.** Section 3 gives ratios, which survive
downscaling, plus the raw render-px so the arithmetic is checkable.

---

## 2. OUR NUMBERS

### 2a. Page gutter , distance from the viewport edge to the content edge

| Band | 1512 x 950 | 390 x 844 |
|---|---|---|
| Header (logo left edge) | **148** | 16 |
| Hero H1 + search bar | **148** | 16 |
| `Für dich` category row (mobile only) | n/a (`md:hidden`) | **24** |
| `Top auf Solen` heading + first card | **144** | 16 |
| `In der Nähe` heading, map, first card | **144** | 16 |
| `Walk-in` band | **140** | 16 |
| `Finde deine Inspiration.` | **144** | 16 |
| `Bewertungen` | **144** | 16 |
| `Für Salons` | **148** | 16 |
| SalonCard's own text stack (2px inset from its photo) | **146** | 18 |
| **Distinct content left edges on the page** | **140 / 144 / 146 / 148** | **16 / 18 / 24** |

Right edges track the same split at 1512: header, hero and `Für Salons` end at **1364**; every feed
rail's last full card ends at **1368**. The 4px offset is present on **both** sides.

### 2b. Card-to-card gap inside a rail, and card geometry

Measured card-to-card, not read from the `gap` property (both agree).

| Rail | gap 1512 | gap 390 | card w 1512 | card w 390 | card padding |
|---|---|---|---|---|---|
| `Top auf Solen` (SalonCard) | 12 | 12 | 194 | 230.7 | **0** (text inset 2) |
| `In der Nähe` (SalonCard) | 12 | 12 | 194 | 230.7 | **0** |
| `Walk-in` (promo card) | 12 | 12 | 527.5 | 157.1 | **12** |
| `Finde deine Inspiration.` (tile) | **16** | **16** | 200 | 171.6 | **0** |
| `Bewertungen` (review card) | 12 | 12 | 280 | 260 | **16** |

Rail vertical padding: **4** top and bottom on the three SalonCard rails and on `Bewertungen`;
**8** on `Inspiration`.

### 2c. Vertical relationships , the load-bearing table

| Relationship | 1512 x 950 | 390 x 844 |
|---|---|---|
| **In-group:** SalonCard photo → its own name/rating/price stack | **8** | **8** |
| **In-group:** text row → text row inside that stack | 2 | 2 |
| Section heading → its rail (`Top auf Solen`) | 12.5 | **8** |
| Section heading → its rail (`Bewertungen`) | 12.5 | **8** |
| Section heading → the map (`In der Nähe`) | 8.5 | **4** |
| **Between-block:** the map → the salon rail below it (`In der Nähe`) | **8** | **8** |
| Section heading → its tiles (`Finde deine Inspiration.`) | 24.5 | 20 |
| **Between-section:** hero → `Top auf Solen` | 75.5 | 65 |
| **Between-section:** `Top auf Solen` → `In der Nähe` | 70.5 | 48 |
| **Between-section:** `In der Nähe` → `Walk-in` | 56.0 | 44 |
| **Between-section:** `Walk-in` → `Inspiration` | **121.5** | **103** |
| **Between-section:** `Inspiration` → `Bewertungen` | 74.5 | 52 |
| **Between-section:** `Bewertungen` → `Für Salons` (content-box top) | 124.0 | 84 |
| **Spread across between-section gaps** (max ÷ min, excl. hero) | **2.17x** | **2.34x** |

### 2d. Does the 4pt scale hold? Census of every rendered spacing declaration in `<main>`

`rowGap`, `columnGap`, `marginTop/Bottom`, `paddingTop/Bottom/Left/Right`, non-zero, ≤ 200px.

| | 1512 x 950 | 390 x 844 |
|---|---|---|
| Rendered elements measured | 971 | 977 |
| Non-zero spacing declarations | 768 | 785 |
| Distinct values | **21** | **16** |
| Values **off** the 4pt scale | **10** | **6** |
| Declarations off the 4pt scale | **303 (39.5%)** | **295 (37.6%)** |
| The off-scale values | 1, 2, 3, 5, 6, 7, 10, 11, 14, 22 | 1, 2, 3, 6, 10, 14 |
| Distinct values in the 1–16px band | **12** | **10** |

Highest-count off-scale values are `3px` (102 declarations) and `2px` (98), then `10px` (49) and
`6px` (22). The design contract's spacing row reads **"4-pt scale only"**.

### 2e. The feed has no section-rhythm token

Every vertical spacing declaration (`rowGap`, `margin`, `padding` top/bottom) inside the five feed
sections, at **both** viewports, is one of:

`1, 2, 3, 4, 6, 8, 10, 12, 14, 16, 24`

**The maximum is 24px**, it occurs 6 times, and every occurrence is either a `gap-6` on the section
header's baseline flex row (a horizontal gap between the title and the arrow buttons, which also
sets `rowGap`) or one Inspiration tile's internal `py-6`. **The largest declaration that actually
separates anything vertically is 16px** (`mb-4` on the section wrapper).

So the between-section gaps in 2c , 44 to 124px , are never declared. They are sums. Decomposed
live, `Top auf Solen` → `In der Nähe`:

| viewport | 4pt rail `py` | header wrapper `pb` | section inner `pb` | section `mb` | next section inner `pt` | next header wrapper `pt` | h2 half-leading | **total** |
|---|---|---|---|---|---|---|---|---|
| 1512 | 4 | 12 | 12 | 16 | 12 | 8 | 6.5 | **70.5** |
| 390 | 4 | 8 | 8 | 16 | 8 | 4 | 0 | **48.0** |

Six declarations, none larger than 16, produce one visual gap. Nothing in the system says how far
apart two sections should be.

### 2f. One horizontal void, 1512 only

`Top auf Solen` holds **4** cards. The last one ends at **x = 956**. The container's content edge is
**1368**, and the section's own "scroll right" arrow button sits at **1324–1368**. That leaves
**412px , 27% of the viewport width , of empty page between the last card and an arrow pointing at
it**. Every other rail overflows the viewport and crops correctly. Not reproducible at 390, where
the same rail shows 1 full card plus a 131px peek.

---

## 3. THE REFERENCE NUMBERS, as ratios

Five screens pixel-measured with PIL at 299px render. Raw render-px is given so the ratios are
checkable; **the ratios, not the pixels, are the claim.**

### 3a. Raw measurements (render px at 299 wide; ×1.304 for pt)

| Screen | photo → its own caption | card → card | heading → its own body | last block → next heading |
|---|---|---|---|---|
| [GoHenry Offers](https://mobbin.com/screens/e53ce9e5-75be-4d11-ab48-a1b780d628d9) | 9 | 10 | 11 · 12 | 29 · 26 |
| [Fresha Trending](https://mobbin.com/screens/33f7d0bd-2edc-4768-a4a4-7de2b9b90489) | 10 | 9 | 13 | 53 |
| [Fresha Recommended](https://mobbin.com/screens/9eaedf92-a72f-4a04-8bc8-49e9ecf7ff58) | 9 | 9 | 16 | 53 |
| [eBay recently viewed](https://mobbin.com/screens/bb3c3e16-7a8a-4548-b696-e4455fad2d03) | 26 | 5 | 12 · 13 | 32 |
| [Afterpay Most popular](https://mobbin.com/screens/8035360a-72f6-4576-9af7-2bbcab4d8b03) | 6 | 5 | not measured | not measured |

### 3b. Ratio A , between-section gap ÷ heading-to-its-own-body

| Screen | ratio |
|---|---|
| GoHenry | **2.64x** and **2.17x** |
| Fresha Trending | **4.08x** |
| Fresha Recommended | **3.31x** |
| eBay | **2.67x** and **2.46x** |
| **Reference band** | **2.17x to 4.08x, median ≈ 2.65x** |
| **Solen 1512** | 5.64x (`Top auf Solen`), 6.60x (`In der Nähe`), 3.04x (`Inspiration`) |
| **Solen 390** | 6.00x, **11.00x**, 2.60x |

Solen clears this one everywhere, and on `In der Nähe` at 390 it clears it by **4x the reference
median**. That is not a compliment. It reads high because the **denominator** is abnormally small,
not because the numerator is generous , see 3d.

### 3c. Ratio B , heading-to-its-own-body ÷ photo-to-its-own-caption

The two in-group gaps, compared to each other. This is the one that separates Solen from the corpus.

| Screen | ratio |
|---|---|
| GoHenry | 1.22x |
| Fresha Trending | 1.30x |
| Fresha Recommended | 1.78x |
| eBay | 0.46x (eBay inverts it: a very loose 26px photo-to-title) |
| **Solen 1512** | 1.56x (`Top auf Solen`) · **1.06x** (`In der Nähe`, heading→map) |
| **Solen 390** | **1.00x** (`Top auf Solen`, `Bewertungen`) · **0.50x** (`In der Nähe`, heading→map) |

Three of the four references keep the heading gap **larger** than the intra-card gap. Solen at 390
makes them **identical**, and on `In der Nähe` makes the heading gap **half** the intra-card gap.

### 3d. Absolute check, converted to pt (the one place absolute matters)

Heading-to-its-own-body, references converted at 1.304 pt/px: GoHenry **14.3 to 15.6 pt**, eBay
**15.6 to 17.0 pt**, Fresha Trending **17.0 pt**, Fresha Recommended **20.9 pt**. Band: **14.3 to
20.9 pt**.

Solen at 390 (CSS px = pt): `Top auf Solen` **8**, `Bewertungen` **8**, `In der Nähe` **4**,
`Inspiration` **20**. **Three of four sections sit below the floor of a 4-screen reference band; one
is inside it.**

Between-section gap, same conversion: GoHenry **33.9 to 37.8 pt**, eBay **41.7 pt**, Fresha
**69.1 pt**. Band: **33.9 to 69.1 pt**. Solen at 390: **44, 48, 52** , inside the band. (`Walk-in` →
`Inspiration` at 103 is above it; see 4 item 5.)

### 3e. Card-to-card gutter

References: 5, 5, 9, 9, 10 render px = **6.5 to 13.0 pt**. `AXIS_GRID.md` section 1 independently
measured 9 rails across 6 apps at **10 to 14 pt**. Solen ships **12 pt**. Dead centre of both.

### 3f. What the references say that contradicts a rule we already have

FLOORS LAW 5 says the between-group gap must be **≥ 2x** the in-group gap. Applied to
*card-to-card versus photo-to-caption*, **every single reference fails it**: GoHenry 1.11x,
Fresha 0.90x and 1.00x, Afterpay 0.83x, eBay 0.19x. Solen at 1.50x is the **highest of the six**.

That is not five apps being wrong. In a columnar rail the grouping is done by **column alignment**
(and at Fresha by a **card border**), not by gap ratio, so the horizontal gutter and the vertical
caption gap are not a legitimate pair to compare. **The 2x floor is only meaningful between two
gaps on the same axis.** Section 5 uses it only that way.

---

## 4. VERDICT PER ITEM

**1. Card-to-card gap inside a rail , FINE.** 12pt against a reference band of 6.5 to 13.0 pt and
`AXIS_GRID`'s independent 10 to 14 pt. I went looking for a reason to change it and found none.
Minor note, not a verdict: `Inspiration` uses 16 while the other four rails use 12, and nothing
states why.

**2. Page gutter, 1512 , BELOW THE REFERENCE.** Four content left edges on one page: **140** (Walk-in),
**144** (all four feed rails), **146** (SalonCard text), **148** (header, hero, Für Salons). 144
versus 148 is a **2.8%** difference. `AXIS_GRID.md` section 4 already named this exact shape as the
worst case , "same width, or at least ~1.3x apart; a 5% difference costs consistency and buys no
hierarchy" , after finding OpenTable shipping a 5% card-width difference that read as two components
built separately. Ours is smaller than OpenTable's and therefore worse by that argument. Not a named
floor, so this is a consistency defect, not a floor break.

**3. Page gutter, 390 , FINE.** 16 on the header, the hero, all five feed sections and `Für Salons`.
The one outlier is the `Für dich` category row at **24** (`px-6`), which is `md:hidden` so it exists
only here. One outlier, 8px, on a mobile-only row.

**4. Between-section rhythm, absolute size , FINE.** 44/48/52 pt at 390 sits inside the measured
reference band of 33.9 to 69.1 pt. I expected to find this too tight and it is not.

**5. Between-section rhythm, consistency , BELOW THE REFERENCE.** Spread of **2.17x** at 1512 (56.0
to 121.5) and **2.34x** at 390 (44 to 103). The references hold theirs near-constant down one page:
GoHenry 29 then 26 (**1.12x** spread), Fresha 53 then 53 (**1.00x**). Our outlier is the `Walk-in`
band on both sides. Root cause in item 6.

**6. Section-rhythm token , BREAKS THE DESIGN CONTRACT (spacing row).** There isn't one. The largest
vertical separator declared anywhere in the five feed sections is **16px**, and every real gap (44 to
124px) is a sum of six declarations (2e). A value nobody wrote cannot be kept consistent, which is
precisely why item 5 measures a 2.34x spread. This is the mechanism; item 5 is the symptom.

**7. 4pt scale , BREAKS THE DESIGN CONTRACT.** The contract says "4-pt scale only". Measured:
**39.5% of declarations at 1512 and 37.6% at 390 are off it**, across 10 and 6 distinct off-scale
values. Fair caveat: 200 of the ~300 off-scale declarations are `2px` and `3px` icon/label gaps that
nobody will ever perceive. The ones that matter are **10px** (49 uses) and **6px** (22) and **14px**
(10 at 1512), which are real spacing decisions taken off the scale. Also worth naming: the 1–16px
band carries **12 distinct values** at 1512. That is the space version of EMPHASIS BUDGET item (c),
"size variety is not range" , a ladder with 12 rungs inside 15px cannot encode 12 different
relationships, so the values stop meaning anything.

**8. Card padding , FINE, with one note.** Four card types, three paddings: SalonCard 0 (its text is
inset 2px from the photo edge), Inspiration tile 0, Walk-in card 12, review card 16. All four are on
the 4pt scale and each matches its own content. The note: 0 padding means the SalonCard has **no
enclosure at all** , measured, its container is `background: rgba(0,0,0,0)`, `border: 0`,
`box-shadow: none`, and the only depth cue in the whole card is a `rgba(50,47,44,0.09) 0 2px 8px`
shadow on the **photo**, which the text sits outside of. Grouping is therefore **100% proximity**.
That makes item 9 not a nitpick.

**9. In-group versus between-group on the vertical axis , BREAKS A FLOOR.** See section 5.

**10. Horizontal void in `Top auf Solen` at 1512 , BREAKS A FLOOR** (FLOORS LAW 3: ≥ 6 desktop units
plus a cropped next item). 4 cards, 412px of empty page, no crop, and a next-arrow aimed at the void.
Reported here because it is a space hole, but **the density axis owns it**: `WHY_DENSITY.md` 4b
predicted "at `md` and `lg` the count is 4 and 5, below Solen's own floor" from source. Confirmed on
the render, and **the cause is different from the one named there**: 1512 is `xl`, where the ladder
asks for **6** columns. The rail underfills because the section only holds **4 salons**, not because
the breakpoint ladder is short. Same symptom, different fix.

---

## 5. THE SINGLE WORST THING ON THIS AXIS

**Three relationships that mean three entirely different things render at exactly 8px.**

At **390 x 844**, scrolling down the `In der Nähe` section:

| what the gap is between | what it means | measured |
|---|---|---|
| the `In der Nähe` heading and the map below it | *this heading labels this* | **4px** |
| the map block and the salon rail below it | *these are two separate blocks* | **8px** |
| a salon card's photo and its own name / rating / price | *this text belongs to this photo* | **8px** |

And on `Top auf Solen` and `Bewertungen`, the section heading sits **8px** above its cards , the same
8px that binds a photo to its own caption.

The between-block gap and the in-group gap are **identical: 1.00x**. FLOORS LAW 5 requires **≥ 2x**.
Both sides are vertical, both are box-to-box, both are in the same component. There is no cross-axis
hand-waving in this one, which is why it survives when the card-to-card version of the same test
(3f) does not. The heading-to-map case is worse than equal: at **0.50x**, a heading is bound to its
own section **half as tightly** as a photo is bound to its caption.

`TASTE_GROUPING.md`'s diagnostic checklist item 6 already states the law this breaks, sourced to
Wertheimer/Palmer/Rock via Principles of Grouping: *"compare the whitespace gap above the field to
the gap inside its own item; if equal or larger, proximity is grouping the wrong things."* Equal is
what we measured.

**Confirmed at 1512 too**, though only for the between-block case: map → rail **8**, photo → caption
**8**, still 1.00x. The heading case partially recovers on desktop (12.5 vs 8 = 1.56x) because
`md:pt-2 md:pb-3` are larger than their mobile counterparts.

**Why this is the one that makes it look cheap.** The SalonCard has no border, no background and no
shadow (verdict 8). Proximity is the *only* thing telling a reader that "Muse Beauty Studio · 4.2 ·
Coiffeur · 4056 Basel · ab CHF 15" belongs to the photo above it rather than being a caption for the
map, or a subtitle for the section heading. We set that one signal to the same value as the signal
for "these are unrelated". The result is a column of items that read as a stack of loose parts, which
is exactly the texture of a placeholder layout , and it is invisible in code review because every
individual number (4, 8, 8, 12, 16) is defensible on its own.

### What it would take to fix

**Every declaration involved lives in one file**, `app/[locale]/_components/homepage/SectionHeader.tsx`:
line **378** (`px-3 pt-1 pb-2 md:px-4 md:pt-2 md:pb-3`), line **409** (`mt-1 flex gap-3 ... py-1`),
line **474** (`mb-4 md:mb-4`), line **478** (`px-1 py-2 md:px-3 md:py-3`). No component needs to be
created and no card needs to change.

The shape of the fix, expressed as targets rather than classes, since the exact split between `pb`
and `mt` is a build decision:

- photo → its own caption: **stays 8**. It is the in-group unit and it is correct.
- section heading → its own body: **8 → 16** at 390 (the reference band is 14.3 to 20.9 pt; 16 is the
  4pt value inside it), and the `In der Nähe` heading → map **4 → 16** so it matches its siblings.
- block → block inside one section (the map → the rail): **8 → 24**, so the between-block gap is 3x
  the in-group gap, above the 2x floor and inside the reference's 2.17–4.08x band for a
  block-level separation.
- Everything else in section 2 stays as measured.

**Cost, stated honestly.** Roughly +8px per section heading and +16px on `In der Nähe` = about
**+56px of scroll at 390**, on a document that currently runs 4316px. That is +1.3%. It is cheap.

**The collision this walks into, named rather than stepped over.** The 8px is not an accident. The
in-file comment at line 374 records **V3-D132 (2026-05-25): `pb-4 → pb-2` (16 → 8) per user "gap too
big vs Airbnb"**, and line 408 records the same decision taking `mt-3 → mt-1`. Line 376 states the
intent: *"total mobile gap drops from ~50-108 toward Airbnb's ~27."* So the compression was aimed at
the **between-section** gap and the lever chosen was the **heading-to-body** padding.

Measured today, that trade did not land: the between-section gap is **48** at 390 (the comment's
target was ~27), while the heading-to-body gap went to **8**. Per rule 10's closing clause, this is
one line of later evidence on a settled call, not a request to reopen it: **the between-section gap
the owner asked to shrink is still 48 and, by the four references I measured, 48 is correct and ~27
would have been below all of them; the gap that actually shrank was the one holding a heading to its
own content.** Restoring 16px there does not undo the owner's decision , it moves the compression to
the number he was aiming at.

---

## 6. What I could not determine

1. **Whether any of this converts.** Mobbin is stills; every reference number is a description of a
   shipped screen, not evidence that spacing moves a metric.
2. **eBay's 26px photo-to-title gap.** It is a clean measurement (26 rows at ≥ 98.5% background
   across the full card width) but it is 2.6x every other reference, and I could not tell from a
   still whether that band holds an element my background test treated as empty. It is included with
   its ratio flagged as the outlier and it is not load-bearing for any verdict.
3. **The `Walk-in` band's internal composition.** Its 121.5px (1512) / 103px (390) trailing gap is
   the single largest between-section gap and 2.2x the smallest. I measured the gap; I did not
   decompose which element inside `WalkInBand.tsx` contributes the ~75px of slack below its rail.
4. **Airbnb's actual between-section gap**, which the V3-D132 comment cites as "~27". I did not
   measure Airbnb; the four references I did measure land at 33.9 to 69.1 pt, all above 27.
5. **Whether a German section heading changes any of these numbers.** Every gap here was measured on
   the `/de` render, so German is the live case, but I did not test the longest of the four locale
   strings against a heading row (copy-i18n-09).
6. **The 4pt-scale verdict's severity.** I can state that 37.6 to 39.5% of declarations are off the
   scale. I cannot state how many of those are perceptible, and my own read is that most of the 2px
   and 3px ones are not.

---

## Appendix: method

- Live DOM measured via `Claude_Browser` `javascript_tool`; every script reported `innerWidth` in its
  own return value so no figure is attributed to the wrong viewport.
- Reference images pulled from the `image_url` short links Mobbin returned and measured with Python
  PIL (`Pillow 11.3.0`). Two detectors: a **column-persistence detector** (a column is a gutter if a
  3–24px background run covers it on ≥ 85% of the rows in a band) locates rails and their gutters; a
  **row-profile detector** (a row is a gap if ≥ 98.5% of pixels in a given x-range match the page
  background within a tolerance of 12/255) locates vertical gaps. Both were run per screen with the
  page background sampled from the image, not assumed.
- Vestiaire Collective and Thrive Market were downloaded and attempted; their card rows are
  white-on-white with border-only separation and defeated the column-persistence detector at 299px.
  Not reported, rather than estimated.
- Every `mobbin.com/screens/...` link above was returned by a search in this session and its image
  was both examined and pixel-measured before being described.
