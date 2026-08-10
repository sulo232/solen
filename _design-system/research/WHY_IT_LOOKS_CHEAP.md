<!-- exists-check: this file SYNTHESISES four probes written the same day and adds no new axis.
     Read in full before writing: research/CHEAP_TYPE.md, CHEAP_SPACE.md, CHEAP_PHOTO.md,
     CHEAP_EDGE.md (the four probes), plus research/WHY_DENSITY.md, AXIS_FONT.md, AXIS_GRID.md and
     sections/home-feed/CORPUS.md (the prior corpus). What this file adds and they do not: one
     ranked list across all four axes, the structural-versus-surface split the owner asked for,
     and an independent re-measurement of the six headline numbers (section 0).
     No new component, route, table, migration or rule is proposed. Three stale-doc conflicts are
     SURFACED in section 6 per rule 18, not edited. -->

# WHY IT LOOKS CHEAP

**Date:** 2026-07-30
**Route:** `http://localhost:50723/de` (home, German, seed data, dev server)
**Viewports:** every number below states whether it is **1512 x 950** or **390 x 844**.
**Sources:** the four probes of 2026-07-30 (`CHEAP_TYPE`, `CHEAP_SPACE`, `CHEAP_PHOTO`, `CHEAP_EDGE`),
plus my own re-measurement of the six headline numbers, section 0.

---

## 0. What I re-measured myself before writing any of this

The brief warned that eight screens were once built to fix a defect that did not exist. So the six
numbers this document ranks highest were re-taken by me on the live render, in scripts that assert
`innerWidth` inside the same call that measures. All six reproduced.

| Claim | Probe said | I measured | Viewport |
|---|---|---|---|
| The grey image placeholder is real and on the live page | 576x576, 23.1% of viewport | `aria-label="Bild-Platzhalter [em-dash] Solon-Hero wird ersetzt"`, **576x576**, `rgb(244,244,245)`, radius 20, **23.1%** | 1512 x 950 |
| Same, on a phone | 358x358, 38.9% | **358x358, 38.9%** | 390 x 844 |
| SalonCard price is styled identically to the postcode | 12px / 400 / `#6B6B6B` | name 14/500/`#0A0A0A`, rating 13/400/`#6B6B6B`, category 12/400/`#6B6B6B`, address 12/400/`#6B6B6B`, **price 12/400/`#6B6B6B`** | 1512 x 950 |
| Three different relationships all render at 8px | 8 / 8 / 8 | heading bottom 867 to first card top 875 = **8**; map bottom 1355 to rail first card 1363 = **8**; photo bottom 1060 to its own caption 1068 = **8** | 390 x 844 |
| Mobile first viewport carries no photography | 0.00%, first photo at y=875 | **0.00%**, first photo at doc **y = 875**, fold at 844 | 390 x 844 |
| Salon photographs are reused across salons | 19 slots / 11 photos | **17 img slots / 9 distinct photographs**, and the **same four collisions with the same salon sets** | 390 x 844 |
| A second typeface renders | 26 of 254 elements | **30 of 282** elements compute `Helvetica Neue` | 1512 x 950 |
| Four salon cards are in the desktop first viewport | (the brief's corrected fact) | **4**, first card top y = 654 | 1512 x 950 |

The one number I could not reproduce exactly is the salon-photo slot count (17 versus 19) and the
distinct-photo count (9 versus 11), because I counted `<img>` inside salon links at 390 and the probe
counted every photographic rect at 1512, where the map rail renders more cards. The **conclusion is
identical and the four collisions are byte-identical**, so the difference is a counting scope, not a
disagreement.

---

## 1. The answer, in three sentences

**Two literal placeholders are shipped on this page: a 576x576 grey box carrying the universal
"image failed to load" icon (38.9% of a phone viewport, live since 2026-05-26), and nineteen salon
photo slots filled by eleven photographs, so the same interior appears under three different business
names on one screen.**

**Everything else that reads cheap is one defect repeated on four different axes: the page never
spends a step to say that two things are different.** The card's price, address and category render at
identical size, weight and colour; the gap that binds a photo to its own caption is the same 8px as
the gap that separates two unrelated blocks; and the largest, boldest, only saturated piece of text in
the entire feed is a wait estimate, not a salon name.

**The layout itself is mostly right and the owner's read is mostly right with it: photo ratio, photo
share of card, card gutter, section gap size, hero anchor ratio and a 17-value palette all sit inside
or above the measured reference band, so 8 of the 13 defects below are pure surface, but two of them
are content supply that no design change touches, and three genuinely need layout to move.**

---

## 2. Ranked defects, most visible first

"Most visible" means: what a person scrolling this page notices, in order. It is not the same as
severity by our floors, and where the two disagree the row says so.

---

### 1. A grey image placeholder is shipped on the live page

**Plain English.** The "Solen für dein Geschäft" section holds a square grey box with a
picture-frame outline icon in the middle. That is the universal browser and operating-system signal
for *this image failed to load*. It is not a neutral empty slot, it is an active claim that the page
is broken, and it is the single largest non-photographic element on the page.

**Our number.** 576 x 576 = 331,776 px = **23.1% of a 1512 x 950 viewport**; 358 x 358 = **38.9% of a
390 x 844 viewport**. Fill `#F4F4F5` at **1.10:1** against the page white, so its own edge is barely
perceivable and it reads as a hole rather than a card. Icon 56px `#6B6B6B`. The in-file comment dates
it: V3-D166, 2026-05-26, "placeholder while a replacement is in flight". **That is 65 days.**

**Floor or reference.** **Floor break, three at once.** Finished-screen pass item (e), no dead-grey
zone. NEVER-AGAIN floor 4, no muted focal (this is exactly the gray-disc blob that floor was written
about, at roughly 12x the area). FLOORS LAW 2, "a photo-first surface NEVER renders a bare grey box".

**File.** `app/[locale]/_components/homepage/BusinessTeaser.tsx:40-53` (the `role="img"` div is line
43-49; the class string is line 45).

**Rider defects in the same three lines, fix them in the same edit.** The `aria-label` contains an
em-dash, banned in all shipped copy, and it says **"Solon"**, a typo for Solen, announced to every
screen reader that reaches it.

**Note on the fix, because the obvious one is illegal.** `npm run exists imagery` returns the owner's
third rejection of a baked-in hero photograph (2026-07-25), enforced by `no-decorative-image-gate.py`,
and FLOORS LAW 2 was rewritten the same day to say the imagery floor is met by content and never by
decoration. So restoring `business-hero-square.png` is a revert to something already rejected once.
The two legal answers are a data-driven photo of a real partner salon in the existing square slot, or
cutting the square and letting the text block run full width.

---

### 2. Nineteen salon photo slots are filled by eleven photographs

**Plain English.** Scroll the home page and the identical salon interior appears under "Glow Lab
Basel", then "Velvet Face", then "Rouge Studio". Four photographs each stand in for two or three
differently named businesses, and all four collisions are visible on the same page. This is the
brief's own bullet, "content that is real but arranged as though it were placeholder", occurring
literally, and it is the most recognisable tell of a marketplace with no supply.

**Our number.** 19 slots, **11 distinct photographs**, 42.1% reuse; 8 of 16 distinct salons share a
photograph with another salon (1512 x 950). Independently at 390 x 844: 17 `<img>` slots, **9
distinct**, the same four collisions:

| Photograph | Stands in for |
|---|---|
| `photo-1512290923902` | glow-lab-basel, velvet-face, rouge-studio |
| `photo-1487412947147` | haarsalon-margot, muse-beauty-studio |
| `photo-1604654894610` | nail-studio-bliss, pink-petal-nails |
| `photo-1570172619644` | smooth-skin-studio, wax-and-glow-basel |

Inspo is clean by contrast: 8 slots, 8 distinct photographs, zero reuse.

**Floor or reference.** **Taste gap, and it is a missing floor.** No rule in this system counts
distinct photographs per slot. On this evidence that looks like an omission, but writing the floor is
the owner's call, not a probe's.

**File.** Not a design file. `lib/stock-photos.ts` / `lib/category-photos.ts` and the seed data behind
them. The fix is eleven more photographs, not a layout change. Ranked #2 because no other defect on
this list is this visible to a person who is not looking for defects.

---

### 3. The salon card's five fields render as one grey block

**Plain English.** On the card the user actually decides from, the price is set exactly like the
postcode next to it: same size, same weight, same colour. Four of the five fields are grey 400. The
one thing the card is for, "what does this cost", carries no emphasis at all.

**Our number** (1512 x 950, measured by me, `getComputedStyle` per leaf):

| field | size | weight | colour |
|---|---|---|---|
| name "Cuts & Culture" | 14 | **500** | `#0A0A0A` |
| rating "4.8" | 13 | 400 | `#6B6B6B` |
| category "Barbershop" | 12 | 400 | `#6B6B6B` |
| address "4056 Basel" | 12 | 400 | `#6B6B6B` |
| **price "ab CHF 15"** | **12** | **400** | **`#6B6B6B`** |

Three of five are pixel-identical in all three properties. The card's whole size range is **1.17x**.

**Floor or reference.** **Floor break** on LOCKFILE §17.4, which requires two ink anchors, name at
600 and price at 600 tabular; the card ships one anchor at 500. And the reference says the same thing
from the other direction: OpenTable's card is **also** 1.17x internally and Airtasker's is ~1.0x, so
flat sizing is normal, but **both buy the hierarchy back with a real weight step plus a colour step on
the deciding field**. We buy nothing back. This is the defect that repeats 19 times per page in the
band carrying 29% of all page text.

**File.** `app/[locale]/_components/homepage/SalonCard.tsx:505` (name, `<CardName>`) and `:534`
(price, `<CardMeta>`); `app/[locale]/_components/primitives/CardText.tsx:39-49` (the primitives that
bake the weights).

**Root cause, and it blocks the fix: two live rules contradict each other and the card obeys the
older one.** Verified in the LOCKFILE today:

- `_design-system/LOCKFILE.md:479`, rule A13 (V3-D346, **2026-05-28**): "there is **exactly ONE ink
  anchor**: the entity NAME ... Every other value recedes: all meta = `text-s-ink-2 font-normal` ...
  Meta = rating value + star, distance, next-slot time, **price** ..." Its FORBIDDEN table sweeps away
  `font-medium text-s-ink` on a price.
- `_design-system/LOCKFILE.md:1921`, §17.4 (V3-D442, **2026-06-07**): "**Card two-anchor rule (adopted
  as THE card-emphasis law):** TWO ink anchors per card, name (larger, 600) + **price (600,
  tabular)**."

By the precedence chain's own rule, latest dated decision wins, so §17.4 supersedes A13 on the price.
But **A13 is the one that is wired**: `CardText.tsx` bakes its weights into the primitives, and the
A13 drift rule would flag a §17.4-compliant card as drift forever. An enforcement path from a
superseded rule is holding the card flat, and nothing in the system can notice, because a rule cannot
see that another rule outranks it. **This needs one owner sentence before the two-line code change is
safe.** A13's rationale survives either way: the 2026-05-28 complaint was four competing anchors, and
§17.4 asks for two, not four.

---

### 4. Three relationships that mean three different things all render at 8px

**Plain English.** The gap that says "this text belongs to this photo" is the same size as the gap
that says "these are two unrelated blocks", which is the same size as the gap that says "this heading
labels this rail". Nothing in the vertical spacing tells the eye what groups with what, so a column of
real salons reads as a stack of loose parts.

**Our number** (390 x 844, re-measured by me):

| gap between | what it means | measured |
|---|---|---|
| "In der Nähe" heading and the map below it | *this heading labels this* | **4px** |
| the map block and the salon rail below it | *these are two separate blocks* | **8px** |
| a salon card's photo and its own name/rating/price | *this text belongs to this photo* | **8px** |

Between-group divided by in-group = **1.00x**. The heading case is **0.50x**, i.e. a heading is bound
to its own section half as tightly as a photo is bound to its caption. The map-to-rail 1.00x holds at
**both** viewports.

**Floor or reference.** **Floor break.** FLOORS LAW 5 requires **>= 2x**, and
`research/TASTE_GROUPING.md` item 6 already states the law ("if equal or larger, proximity is grouping
the wrong things"). Reference band for heading-to-its-own-body: **14.3 to 20.9 pt** across four
PIL-measured screens; three of our four sections are **below the floor of that band**.

**Why it bites here specifically.** The SalonCard has **zero enclosure**: measured, its container is
`background: rgba(0,0,0,0)`, `border: 0`, `box-shadow: none`. The only depth cue is a 9%-alpha shadow
on the photo, and the text sits outside it. Proximity is therefore the **only** grouping signal on the
card, and we set it to the value that means "unrelated".

**File.** All four declarations are in one file:
`app/[locale]/_components/homepage/SectionHeader.tsx:378` (`px-3 pt-1 pb-2 md:px-4 md:pt-2 md:pb-3`),
`:409` (`mt-1 ... py-1`), `:474` (`mb-4`), `:478` (`px-1 py-2 md:px-3 md:py-3`). No component is
created and no card changes. Cost: roughly +56px of scroll at 390 on a 4316px document, **+1.3%**.

**The settled decision this touches, named rather than stepped over.** `SectionHeader.tsx:374` records
V3-D132 (2026-05-25): `pb-4 -> pb-2` per owner "gap too big vs Airbnb", intent "total mobile gap drops
toward Airbnb's ~27". Measured today the between-section gap is still **48** while the heading-to-body
gap fell to **8**. Per rule 10's closing clause, one line of later evidence and not a reopened
argument: **the gap the owner asked to shrink is still 48, and by the four references measured, 48 is
correct while ~27 would be below every one of them. The gap that actually shrank was the one holding a
heading to its own content.** Restoring 16 there moves the compression to the number he was aiming at.

---

### 5. The whole content column is one unbroken white field

**Plain English.** Nothing on the page ever changes background. Two full sections (Walk-in,
Bewertungen) are rails of white cards on a white page with no photograph in them and no tray under
them, so they have nothing to sit on and read as loose rows on a document.

**Our number.** **97.3% white at 1512 x 950 / 95.5% at 390 x 844**, sampled every 20px down the page
with fixed and sticky layers excluded. There are 3 background bands and **the only sunken one is in
the footer newsletter strip**. The content column is 3180px (desktop) / 3400px (mobile) of unbroken
white. Zero-photo sections account for **62.6% of total section height on mobile**.

**Floor or reference.** **Floor break.** FLOORS LAW 4: "grouped/list/panel content on white with no
photo anchor REQUIRES the sunken tray; alternate gray and white down a page for rhythm."
Reference: **8 of 10** review-card screens give the band its own ground (tinted band, filled card, or
a dark page); the 2 that keep white on white carry a hairline **and nothing else**.

**File.** `app/[locale]/_components/homepage/WalkInBand.tsx` and `Reviews.tsx`, wrap each section in
`bg-s-bg-sunken`. This is the highest ratio of floors-closed to lines-changed on the whole list: it
closes the tray break and the alternation break together.

---

### 6. The loudest text in the feed is a wait estimate, in success green

**Plain English.** The biggest, boldest, and only saturated-colour piece of text anywhere in the feed
band is "70-98 Min", a queue estimate. Every salon name on the same screen is 14px grey-ink at weight
500. And the green is applied to the slot rather than the state, so a 98-minute wait renders in
exactly the same success green as "Jetzt frei".

**Our number.** 20px / weight 700 / `#16A34A`, `font-display`. The feed band (desktop y 950 to 1900)
carries **74 of 254 text leaves, 29% of all page text, and its largest element is this**, at 1.67x its
own body. Measured live: two cards read "70-98 Min", two read "35-49 Min", all four in the identical
green. It is the **only decorative colour use on the entire page**, and there is exactly one.

**Floor or reference.** **Taste gap on emphasis, floor break on semantics, and explicitly NOT an
accessibility break.** Contrast computed independently: `#16A34A` luminance 0.2686, **3.30:1** on
white, which at 20px/700 qualifies as WCAG large text (floor 3:1) and **passes AA**. It breaks taste
rule 4 ("success is legal as an ICON, never as body text") and the token's own meaning. Both reference
apps reserve their loudest treatment for the entity name or the price, never for a derived estimate.

**File.** `app/[locale]/_components/homepage/WalkInBand.tsx:125`. Either make the colour conditional on
a real threshold so the token encodes something, or take it to ink.

---

### 7. A phone user's first screen contains no photograph at all

**Plain English.** On a phone, the entire first screen is a headline, a search bar and a grid of
illustrated category icons. The first photograph on the page starts 31px below the fold.

**Our number.** **0.00% photographic area** at 390 x 844 (0 px of 329,160), 0 photo elements; first
photo at doc **y = 875** against an 844 fold. The mobile first viewport is header 10.0%, hero 50.4%,
gap 6.8%, category icon grid 29.7%. Desktop is not a floor break (no floor is written at a desktop
width) but is below every web reference: **8.38% at 1512 x 950, 11.76% at 1280 x 800**, 4 photos in
view.

**Floor or reference.** **Floor break.** FLOORS LAW 2 and the design contract's imagery row both write
~1/3 at exactly 390 x 844. The page **can** clear it: the best photographic window on the page is
**40.59%** at y = 700. It just does not clear it where the floor is written.

**File.** Section order, not a style: `app/[locale]/page.tsx` composition plus
`_components/homepage/MobileCategoriesRow.tsx` (251px, 0% photographic, `md:hidden`) and the hero
(425px). **Arithmetic for the fix, so nobody guesses:** one mobile card row contributes 390 x 185 =
21.9% of the viewport, so 33% needs about 1.5 photo bands in view, so the first photo band must start
by **y ~= 500**, a **375px pull-up**. Moving the category grid below the first salon rail buys 251 of
those 375 on its own.

**Ranked 7th, not 1st, on purpose.** It is a hard floor break and it is nearly invisible to a person
scrolling, because one flick reveals the photography. Ranked by rules it would be near the top.

---

### 8. Two typefaces render where one is specified

**Plain English.** A salon's rating appears twice in one desktop viewport, in two different typefaces:
Inter in the card row, Helvetica Neue in the map pin 90px below it. A system fallback font is the
single most legible signal that a page is unfinished.

**Our number.** **30 of 282 text-bearing elements (10.6%) compute `"Helvetica Neue", Arial, Helvetica,
sans-serif`** at 1512 x 950 (my count; the type probe measured 26 of 254, same conclusion). Cause
confirmed on disk: `node_modules/mapbox-gl/dist/mapbox-gl.css:1` sets
`.mapboxgl-map{font:12px/20px Helvetica Neue,...}` and the marker carries no font class, so it
inherits. Same datum, two renders: card row 13px/400/Inter at y 655; map pin 12px/600/Helvetica Neue
at y 745.

**Floor or reference.** **Floor break**, FLOORS LAW 8, "the same thing looks the same everywhere". No
reference screen showed a fallback face.

**File.** `app/[locale]/_components/homepage/NearbyMap.tsx:56-57` (the `markerEl` class string). **Add
`font-body`. One class, 30 elements.** Cheapest real win on this entire document.

---

### 9. Eight to ten font sizes in one viewport, and 92.5% of the page inside a 3px band

**Plain English.** The page uses a lot of sizes and almost no range. Nearly everything is between 11px
and 14px, and the extra sizes are things like 12.5 versus 13, differences of 4%, which cost a size
tier and buy no hierarchy at all.

**Our number.** Desktop first viewport: **8 distinct sizes** by the type probe's hit-tested method,
**10** by mine with a looser exclusion set, against a ceiling of **4**. Whole page: **15 distinct
sizes** desktop / 14 mobile. **92.5% of all page text sits in the 11 to 14px band**; the modal size is
**12px**, carrying 52.8% of desktop text, while the design contract says body is 14. In source: **42
distinct arbitrary `text-[Npx]` values across 2,460 occurrences**, of which **267 are half-pixel steps**
(`text-[12.5px]` x140, `text-[13.5px]` x95). `text-[13px]` is the second-most-used size in the estate
and **13px appears nowhere in the design contract's text-size row**.

**Floor or reference.** **Floor break** on the <=4 ceiling and on EMPHASIS BUDGET clause (c), "size
variety is not range". Reference first-viewport tier counts: **Fresha 6, Airtasker 4, OpenTable 4**.

**File.** `tailwind.config.js` still extends no `fontSize` scale. Removing the half-steps alone takes
the page from 15 rendered tiers to roughly 11 without changing how anything looks.

**Explicit counter-finding, do not "fix" this one.** Our size **ratios** are fine and in places better
than the references: hero anchor 3.67 (Airtasker 3.2, OpenTable 2.8), section-header-to-body 1.67
(OpenTable 1.66), card-internal 1.17 (OpenTable 1.17). The count is the outlier, not the range.

---

### 10. One salon renders as two different objects on one screen

**Plain English.** `cuts-and-culture` appears twice on the home page: once as a 194x220 photo card,
and 751px lower as a 528x140 all-text row with no photograph. Two anatomies, one entity, one screen.

**Our number.** Walk-in band at 1512 x 950: 4 anchors, each **528 x 140**, white fill, `#E4E4E7`
hairline, radius 13, **zero photographic pixels**, containing a green wait figure, "bis frei", the
salon name at 14px, a review count, an address and "4 vor dir". Section photographic area **0%** at
both viewports.

**Floor or reference.** **Floor break, two.** FLOORS LAW 8 ("an entity that appears on more than one
screen renders through the SAME component ... a documented VARIANT of one component, never a second
implementation"), and the imagery floor on a customer browse section.

**File.** `app/[locale]/_components/homepage/WalkInBand.tsx:120-135`. This one is structural: it means
the walk-in row becomes a documented dense variant of `SalonCard`, not a second card.

---

### 11. The review cards carry a hairline and a shadow at the same time

**Plain English.** Six cards spend two depth mechanisms where every reference spends one.

**Our number.** 6 instances at both viewports: `border 1px #E4E4E7` **and**
`box-shadow 0 2px 8px rgba(50,47,44,.09)` on a white card on a white page. Reference: **0 of 10**
review-card screens stack both; **10 of 10 spend exactly one mechanism**.

**Floor or reference.** **Floor break.** LOCKFILE §17.2, "a card carrying elevation DROPS its border,
never both", and §637, "never stack fill + shadow + border at rest".

**File.** `app/[locale]/_components/homepage/Reviews.tsx:144-146`. Delete `"shadow-elevation-2"` from
line 146 and keep the hairline. One line. (§17.2 does not say which to drop; the reference is 10 of 10
for hairline-only.)

---

### 12. The desktop rail underfills and points an arrow at 432px of empty page

**Plain English.** "Top auf Solen" holds 4 cards in a grid built for 6, so the row ends a third of the
way from the right edge, with a scroll-right arrow aimed at nothing.

**Our number** (1512 x 950, re-measured by me): 4 cards, each **194 x 220**, first left edge 144, last
right edge **956**, rail right edge **1388**. **432px of empty page**, roughly **29% of the viewport
width**, with the section's own next-arrow sitting in it. Not reproducible at 390, where the rail shows
1 full card plus a 131px peek. Separately, the desktop card is **194px wide at every width from 1280
up**, **12.8% of a 1512 viewport**, against web references at **16.1 / 16.7 / 18.5%**.

**Floor or reference.** **Floor break.** FLOORS LAW 3, ">= 6 content units desktop plus a visibly
cropped next item". Cause corrected against `WHY_DENSITY.md` 4b: 1512 is `xl`, where the ladder already
asks for 6 columns, so **the rail underfills because the section only holds 4 salons**, not because the
breakpoint ladder is short. Same symptom, different fix.

**File.** The query behind the section, not the grid. `app/[locale]/page.tsx` / the home feed data
loader, plus the `max-w-[1280px]` cap if the card width is to move.

---

### 13. Four different content left edges on one desktop page, and no section-rhythm token

**Plain English.** Content starts at four slightly different distances from the left edge on the same
page, and the gaps between sections are never declared anywhere, they are accidental sums.

**Our number.** Left edges at 1512 x 950: **140** (Walk-in), **144** (all four feed rails), **146**
(SalonCard text), **148** (header, hero, Für Salons). 144 versus 148 is a **2.8%** difference. Mobile
is a clean 16 everywhere (one 24 outlier on a mobile-only row). Separately: **the largest vertical
separator declared anywhere in the five feed sections is 16px**, so every real between-section gap (44
to 124px) is a sum of six declarations; the resulting spread is **2.17x** desktop / **2.34x** mobile,
against references holding theirs to **1.00x to 1.12x** down one page. And **39.5% of all rendered
spacing declarations are off the 4pt scale** the contract mandates (though ~200 of the ~300 are 2px and
3px icon gaps nobody will perceive).

**Floor or reference.** Gutter: **consistency defect, not a named floor break.** `AXIS_GRID.md` section
4 already named this exact shape as the worst case: "a 5% difference costs consistency and buys no
hierarchy". Ours is 2.8%, i.e. smaller and therefore worse by that argument. Section rhythm and the 4pt
scale: **breaks the design contract's spacing row.**

**File.** `SectionHeader.tsx` + `Section` wrapper for the rhythm token; the per-section `px-*` classes
for the gutter.

---

## 3. What is already fine. Do not touch any of this.

Seventeen items, each measured and each verdicted FINE by a probe that was looking for a defect.

| # | Thing | Number | Why it is fine |
|---|---|---|---|
| 1 | **The segmented search bar** | outer container **1216 x 60**, radius 11; inner white pill **820 x 60**, `elevation-2`, no border; CTA "Termine finden" 150x48, 15px/700, `bg #0A0A0A` | The owner said he likes it and it ships. It is also correct: white-on-white with `elevation-2` and no border is precisely edge-visibility route (c), and the CTA matches the contract's 15px and its "never <= 13 on a button". Nothing in this document argues with this bar. |
| 2 | Photo aspect ratio | **1.250** | Inside the reference band of 1.07 (Tripadvisor) to 1.79 (Fresha), closer to the middle than either edge. |
| 3 | Aspect consistency | 19 of 19 salon photos at **1.250**, 8 of 8 Inspo at **0.563**, zero within-rail variance | Every reference is internally consistent to within one render pixel, and so are we. The two ratios are 2.22x apart, which reads as a decision. |
| 4 | Photo as a share of card height | **70.5% desktop / 74.3% mobile** | Reference cluster is **50.0 to 63.3%**. We are above every one of them. Growing the photo is the wrong lever and is named here so nobody reaches for it. |
| 5 | Photo is the card's focal | **2.74x** the next largest element | Passes at both viewports. |
| 6 | Mobile card width | **59.2%** of viewport | The widest of three iOS references (Fresha 56.2, Airtasker 44.8, Instacart 23.1). |
| 7 | Card-to-card gutter | **12pt** | Reference band 6.5 to 13.0 pt; `AXIS_GRID`'s independent 9-rail sample says 10 to 14 pt. Dead centre of both. |
| 8 | Between-section gap **size** | 44 / 48 / 52 pt at 390 | Reference band **33.9 to 69.1 pt**. Inside it. (Their *consistency* is defect 13; their size is not a defect.) |
| 9 | Mobile page gutter | **16** on header, hero, all five feed sections and the footer CTA | One outlier at 24 on a `md:hidden` row. |
| 10 | The colour palette | **17 distinct values**: 12 pure chrome, 3 semantic, **exactly one decorative use** | Better than the reference. Whatever makes this page read cheap, an undisciplined palette is not it, and no fix should touch the palette. |
| 11 | Hero anchor, absolute and ratio | 44px desktop / 31.2px mobile; **3.67x** / 2.60x over the modal body | Floor is 28px and 1.8x. Above both. Reference hero ratios: Airtasker 3.2, OpenTable 2.8, Fresha 5.8. |
| 12 | Weight discipline in the first viewport | **22.7% at weight >= 600** desktop, 28.6% mobile | Ceiling is ~30%. **The 86%-bold figure in FLATNESS_DIAGNOSIS is stale and must not be re-quoted as current.** |
| 13 | SalonCard photo shadow | `elevation-2`, no border, flush photo edge | Satisfies the edge floor twice over. References use the photo edge alone, so we spend one mechanism they do not, but at 9% alpha it is imperceptible. Leave it. |
| 14 | Over-photo controls | 27 heart buttons on `FROST_GLASS`, 13 rating pills at `rgba(0,0,0,.3)` | A heavier shadow over a photograph is correct, not drift: it has to be darker to be perceivable against image noise. |
| 15 | Inspo tiles and the map card | Tiles: flush photo edge, no border, no shadow. Map: sunken fill + hairline, no shadow | Tiles match 5 of 5 photo-card references exactly. |
| 16 | Blue accent usage | `#276EF1` on 4 text elements + 1 bg, every instance inside an `<a>`, **4.58:1** on white | Sparse, clickable-only, passes AA. Correct per the locked link row. |
| 17 | No bare grey boxes in card slots | 0 found; every card that should carry a photo carries one | The placeholder in defect 1 is in a marketing section, not a card slot. The card fallback path is not implicated. |

**And one thing to actively NOT build.** The "anchor >= 28px per screen" and "anchor >= 1.8x body"
floors break in every band below the first (desktop feed: largest 20, body 12, ratio 1.67). **Do not
fix that.** None of the three references carries an anchor in its card bands either (Airtasker 1.25x,
OpenTable 1.72x), so 1.67 is normal for a list band. Growing a heading in the feed manufactures an
element that serves no screen job, which FLOORS LAW 10 forbids. `AXIS_FONT` section 3 already asked for
an owner call to scope that floor to hero / PDP / confirmation surfaces; this is a second, independent
confirmation from a different surface.

---

## 4. Structural versus surface: do the numbers agree with the owner?

**Mostly yes, and the exceptions are specific.** Of 13 defects: **8 are pure surface** (type, spacing,
weight, colour, depth), **2 are content supply** (neither surface nor structure, no design change
touches them), and **3 need layout to move**.

| Defect | Class | What actually has to change |
|---|---|---|
| 1. Grey image placeholder | **Content** | An asset or a section decision. No layout moves either way. |
| 2. Eleven photographs for nineteen slots | **Content** | Eleven more photographs in the seed set. Zero code. |
| 3. Card is one grey block | **Surface** | Two lines: weight 500 -> 600 on the name, price off `<CardMeta>`. Blocked on the A13 vs §17.4 arbitration. |
| 4. Three relationships at 8px | **Surface** | Four padding values in one file. +1.3% scroll. |
| 5. Unbroken white column | **Surface** | Two `bg-s-bg-sunken` wrappers. |
| 6. Green wait estimate is the loudest text | **Surface** | One conditional, or one token swap. |
| 7. Zero photography in the mobile first screen | **STRUCTURAL** | Section order changes: the category grid moves below the first salon rail, and/or the hero shrinks. 375px has to come from somewhere. |
| 8. Two typefaces | **Surface** | One class on one element. |
| 9. Size count and half-steps | **Surface** | A `fontSize` scale in the Tailwind config plus a sweep. |
| 10. One salon, two anatomies | **STRUCTURAL** | The walk-in row becomes a documented variant of `SalonCard`. A component change, not a style. |
| 11. Review card border + shadow | **Surface** | One line. |
| 12. Rail underfills, 432px void | **STRUCTURAL** | More salons in the section's query, and/or the container cap. |
| 13. Gutter wobble + no rhythm token | **Surface** | Align four `px-*` values; declare one section-gap token. |

**So the honest verdict on the owner's two answers.** He said "nothing structural, it just looks
cheap" and also "the layout is still wrong". **Both are true and they are about different things.**

- The **"it just looks cheap"** half is right, and it is the bigger half: 8 of 13 defects are pure
  surface, and every one of them is the same failure repeated, which is that the page never spends a
  step to distinguish two things. That is a treatment problem, not a layout problem.
- The **"layout is still wrong"** half is right about exactly three things, and they are all about
  *what is on screen and in what order*, never about the grid: a phone's first screen carries no
  photography (7), one entity renders as two different objects (10), and a 6-column rail is fed 4
  salons (12). All three are "the wrong content is in the slot", not "the slots are in the wrong
  place".
- **The single most useful correction to both halves:** the two most visible defects on this page are
  neither surface nor layout. They are a shipped placeholder and a duplicated photo set. No amount of
  type, spacing or grid work makes a page stop looking cheap while it is showing a broken-image icon
  across 38.9% of a phone screen and the same salon interior under three business names.

---

## 5. Suggested order of work, by visible improvement divided by cost

Not a plan, and nothing here is approved. Ordered so the cheap wins land first.

1. **One class:** `font-body` on `NearbyMap.tsx:56`. Removes a fallback typeface from 30 elements.
2. **One line:** delete `shadow-elevation-2` from `Reviews.tsx:146`.
3. **Two wrappers:** `bg-s-bg-sunken` on Walk-in and Bewertungen. Closes two floors at once and gives
   the page its only background rhythm.
4. **Four padding values** in `SectionHeader.tsx`. Fixes the 8px collapse at +1.3% scroll.
5. **One owner sentence** arbitrating LOCKFILE A13 versus §17.4, then two lines in `SalonCard.tsx`.
6. **One owner decision** on `BusinessTeaser.tsx`: real salon photo in the square, or cut the square.
7. **Eleven photographs** into the seed set.
8. Then, and only then, the three structural items (7, 10, 12) and the type-scale sweep (9).

---

## 6. Stale or contradictory docs found while measuring. Surfaced, not edited. (rule 18)

1. **`LOCKFILE.md:479` (A13) and `LOCKFILE.md:1921` (§17.4) directly contradict each other on the card
   price.** A13 says price recedes to grey 400; §17.4 says price is a 600 tabular ink anchor. §17.4 is
   later and self-declares as THE card-emphasis law, but A13 is the one wired into `CardText.tsx` and
   into the drift checker. Needs one owner sentence. Detail in defect 3.
2. **`LOCKFILE.md:625` publishes the wrong `elevation-2` value.** It gives a two-layer shadow
   (`0 4px 12px rgba(50,47,44,0.08), 0 2px 4px rgba(50,47,44,0.04)`); both `tailwind.config.js:279` and
   the live `getComputedStyle` say single-layer `0 2px 8px rgba(50,47,44,0.09)`, with a dated reason in
   the config (2026-06-29, "the old two-layer read as a double line"). Anyone reading the LOCKFILE
   table today gets the wrong number.
3. **Memory `project_consistency_system.md` describes a live type-scale gate. It is not on disk in this
   worktree.** Checked: `package.json` scripts on this worktree and on `/Users/sulo/Documents/solen`
   for `consist` (none), `.claude/hooks` on both (no type or scale hook), and both hook dirs grepped
   for `type.scale|typeScale|font.size.scale` (one unrelated hit).
4. **`FLATNESS_DIAGNOSIS_2026-07-25.md`'s headline numbers are stale.** "86% of visible text at weight
   >= 600" and "largest text is 1.57x body" were re-measured on 2026-07-28 at 17.6% and 1.88x on the
   PDP, and the home page first viewport measures 22.7% today. The rule stays useful as a ceiling; the
   number must not be re-quoted as current.

---

## 7. What I could not measure

1. **Whether any of this changes behaviour.** Zero engagement or conversion data was observed anywhere
   in this sweep. Every finding is a geometry, typography or content argument.
2. **Whether any of it is what the owner means by "cheap".** Four probes measured four axes and
   returned one large finding each. That is evidence about the page, not about his eye.
3. **Reference weights and reference bold-share.** Mobbin serves web captures at ~768px and iOS at
   ~299px, so no absolute competitor pixel is claimed anywhere in this document and every reference
   figure is a ratio. Reference font weights are **observed** from the image, never measured; an
   ink-coverage proxy was tried and discarded as contaminated by scale-dependent anti-aliasing.
4. **Whether production serves the same photo assignment as the seed.** Every salon photo on `/de`
   today resolves to `images.unsplash.com`. Whether the 11-photograph pool is a seeding artefact or the
   shape of the real data path was not checked.
5. **Any route other than `/de`, and any locale other than German.** No PDP, no search, no `/inspo`.
   German is the live case here, but per copy-i18n-09 French and German both run 15 to 35% longer than
   English, so the 875px first-photo offset may differ per locale.
6. **Hover, loading and error states.** Rest state only. Known but unmeasured:
   `WalkInBand.tsx:105` stacks a border AND a shadow on its skeleton card, and six components declare
   `hover:shadow-elevation-3`.
7. **Whether the two house numbers this document grades against are the right numbers.** The ~33%
   imagery floor and the ~30% bold ceiling both carry **no external citation**; CLAUDE.md already says
   so of the 30%. They were measured against, not tested.
8. **The Walk-in band's internal composition.** Its 121.5px (1512) / 103px (390) trailing gap is the
   single largest between-section gap on the page. The gap was measured; which element inside
   `WalkInBand.tsx` contributes the ~75px of slack was not.
9. **Airbnb's actual between-section gap**, cited as "~27" in the V3-D132 comment that drove the 8px
   collapse. Not measured. The four references that were measured land at 33.9 to 69.1 pt, all above
   27.
10. **Whether the 22 arbitrary shadow literals in the homepage folder all render.** 9 recipes render on
    `/de`; the rest sit behind conditions not triggered. Several carry chromatic green and teal tints
    against a token system whose shadows are deliberately warm.
