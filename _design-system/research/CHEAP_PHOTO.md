<!-- exists-check: `npm run exists photo` and `npm run exists imagery` both run 2026-07-30.
     Two graveyard hits, both binding on section 5 and neither re-proposed here:
     (1) "home hero image / homepage hero photo / decorative static image baked in", owner's THIRD
     rejection 2026-07-25, gate `no-decorative-image-gate.py`. Nothing in this file proposes adding a
     photograph that is not a real salon's or a real look's. Named again in section 5.
     (2) "stock photo badge / StockPhotoMarker", owner 2026-07-27: "i dont want any badge bro i know
     if its stock or not". Section 4 item 8 reports the stock-photo reuse number as a fact and does
     NOT propose marking it in the UI.
     Existing code this measures rather than duplicates: `lib/category-photos.ts`,
     `lib/stock-photos.ts`, `_components/homepage/SalonCard.tsx`.
     Sibling convention: research/AXIS_GRID.md, AXIS_FONT.md, WHY_DENSITY.md. This is the PHOTO probe
     of the 2026-07-30 "why does it look cheap" sweep. It does not re-count home-feed/CORPUS.md; it
     supplies the rendered pixel numbers CORPUS.md section 7 and WHY_DENSITY section 5 item 2 both
     flagged as un-measured. No new component, route, table or migration is proposed. -->

# CHEAP: THE PHOTO AXIS

**Date:** 2026-07-30
**Route:** `http://localhost:50723/de` (home), German locale, seeded data, dev server.
**Instrument:** Claude_Browser `getBoundingClientRect` / `getComputedStyle` on the RENDERED page for
every Solen number. Python PIL edge and texture detection on downloaded Mobbin captures for every
reference number.

---

## 1. Method

### What I measured on Solen

At three viewports, `390x844`, `1280x800` and `1512x950`, all on `/de`:

1. **Photographic area of the first viewport at `scrollY = 0`.** Every element on the page was
   walked; an element counts as photographic if it is an `<img>` whose resolved `currentSrc` matches
   `images.unsplash.com` or `/api/discovery/thumb/`, **or** a `<div>` whose computed
   `background-image` resolves to one of those. Each element's rect was clipped to the viewport
   before its area was summed, so an off-screen half of a card contributes nothing.
2. **The same measurement at every section boundary**, plus a 100px-step sweep of the whole document
   to find the single best photographic window on the page.
3. **Per-card geometry:** card rect, photo rect, computed aspect ratio, photo height as a share of
   card height, and the ranked area of every element inside a card.
4. **Aspect consistency:** every photo rect on the page bucketed by `WxH` and by `w/h` to three
   decimals, per rail.
5. **Photo supply:** every salon photo URL on the page reduced to its Unsplash photo id, counted for
   reuse, and cross-referenced against the salon name in its `alt` attribute.

### What I excluded, and why the number would change if you put it back

- **The Leaflet map `<canvas>`** in the "In der Nähe" section (1222x154 desktop, 356x154 mobile). It
  is a vector street map, not photography. At `1512x950` it adds **8.31%** of the first viewport. If
  your definition of "photographic area" includes it, add that to every desktop figure below.
- **The six category PNGs** in the mobile "Für dich" grid (`/icons/categories/*.png`, 49x49). They
  are 3D illustrated icons, not photographs. They total **4.41%** of the mobile first viewport.
- **SVG icons, logos, gradients and the black/white overlay scrims** on Inspo cards.
- **Duplicate rects.** The Inspo card paints its photo as a CSS `background-image` on a div that also
  contains a `class="hidden"` `<img>` with the same src. Counting both would double that section.
  Rects were de-duplicated by geometry.

### Honest limits

- **One route, one locale.** Only `/de` home. I did not measure `/inspo`, the PDP, or search.
- **Mobbin serves downscaled images** (iOS 299px wide, web 768px wide). **No absolute pixel value
  below is claimed for a competitor.** Every reference number is a ratio or a percentage of its own
  capture width, both of which survive scaling.
- **Reference card heights on iOS were read to the nearest pixel at 299px render**, so a
  photo-share figure of 52.5% should be read as "about 52 to 53%", not 52.5 exactly.
- I did not verify whether the seeded photo assignment matches what production would serve.

---

## 2. Our numbers

### 2a. Photographic share of the FIRST viewport, `scrollY = 0`

| Viewport | Photographic area | Photos in view | Floor |
|---|---|---|---|
| **390 x 844** | **0.00%** (0 px² of 329,160) | **0** | ~33% |
| 1280 x 800 | 11.76% (120,420 px² of 1,024,000) | 4 | not stated at this width |
| 1512 x 950 | 8.38% (120,420 px² of 1,436,400) | 4 | not stated at this width |

At 390x844 the **first photograph on the page starts at y = 875**, which is **31 px below the fold**.
The mobile first viewport is: header 0 to 84 (10.0%), hero 84 to 509 (50.4%), gap (6.8%), category
icon grid 566 to 817 (29.7%), the "Top auf Solen" heading cropping in at 833 (1.3%). Not one of those
carries a photographic pixel.

### 2b. The best photographic window anywhere on the page

| Viewport | Best window | At scroll offset |
|---|---|---|
| 390 x 844 | **40.59%** | y = 700 |
| 1512 x 950 | **39.09%** | y = 1000 |

So the page **can** clear the one-third floor. It does not clear it where the floor is written, which
is the first viewport.

### 2c. Card and photo geometry

| Viewport | Card W x H | Photo W x H | Photo ratio | Photo % of card height | Card as % of viewport width |
|---|---|---|---|---|---|
| 390 x 844 | 231 x 249 | 231 x 185 | **1.250** | **74.3%** | **59.2%** |
| 1280 x 800 | 194 x 220 | 194 x 155 | **1.250** | **70.5%** | 15.2% |
| 1512 x 950 | 194 x 220 | 194 x 155 | **1.250** | **70.5%** | **12.8%** |

The desktop card is **194 px wide at every viewport width from 1280 up**, because `xl` fires at 1280
and the container is capped at `max-w-[1280px]`. At 1920 it would be 10.1% of the viewport.

Inspo card, same measurement:

| Viewport | Card W x H | Photo W x H | Photo ratio | Photo % of card height |
|---|---|---|---|---|
| 390 x 844 | 172 x 329 | 172 x 305 | **0.563** | **92.7%** |
| 1512 x 950 | 200 x 380 | 200 x 356 | **0.563** | 93.7% |

### 2d. Aspect consistency

| Rail | Photo slots | Distinct rendered ratios | Value |
|---|---|---|---|
| "Top auf Solen" | 4 | **1** | 1.250 |
| "In der Nähe" | 15 | **1** | 1.250 |
| "Finde deine Inspiration." | 8 | **1** | 0.563 |
| Whole page, salon photos | 19 | **1** | 1.250 (`aspect-[5/4]`) |
| Whole page, look photos | 8 | **1** | 0.563 (`aspect-[9/16]`) |

**Zero variance within any rail, and zero variance within an entity type across rails.** Two ratios
exist on the page, 1.250 for a salon and 0.563 for a look, and they are 2.22x apart, which reads as a
decision rather than a wobble.

### 2e. Is the photo the largest element of every card?

Ranked by area inside one `SalonCard` at 1512x950:

| Element | Area px² |
|---|---|
| photo container `aspect-[5/4]` | 30,105 |
| the `<img>` inside it | 30,105 |
| text block `mt-2 px-[2px] flex flex-col` | 10,988 |
| name + rating row | 3,847 |
| address row | 3,077 |

The photo is **2.74x** the next largest element. **Passes**, at both viewports.

### 2f. Photographic share per section (area clipped to the section box and the viewport width)

| Section | 390x844 | 1512x950 | Section height (mobile / desktop) |
|---|---|---|---|
| Hero "Termine, sofort bestätigt." | **0%** | **0%** | 425 / 335 |
| "Für dich" category grid | **0%** | n/a, `md:hidden`, height 0 | 251 / 0 |
| "Top auf Solen" | 54.9% | 25.5% | 312 / 312 |
| "In der Nähe" | 36.3% | 28.2% | 472 / 472 |
| **"Walk-in"** | **0%** | **0%** | 320 / 311 |
| "Finde deine Inspiration." | 65.9% | 61.4% | 408 / 488 |
| "Bewertungen" | **0%** | **0%** | 283 / 312 |
| "Solen für dein Geschäft." | **0%** | **0%** | 712 / 736 |

**Zero-photo sections account for 1,991 px of 3,183 px of total section height on mobile (62.6%) and
1,694 px of 2,966 px on desktop (57.1%).**

### 2g. The "Walk-in" section renders salons with no photograph at all

Measured at 1512x950, `section` at y = 1279. Four anchors, each **528 x 140**, white fill,
`border-s-border` hairline, `rounded-[13px]`, containing: a 20px bold green "70-98 Min", "bis frei",
the salon name at 14px, a review count, an address, "4 vor dir". **No image element, no
background-image, zero photographic pixels.**

The first of those four is `href="/de/salon/cuts-and-culture"`, the same entity that renders 751 px
higher up as a **194 x 220 photo card** with `alt="Cuts & Culture, Barbershop"`. One salon, two card
anatomies, one screen, one of them with no photograph.

### 2h. Photo supply: 19 slots, 11 photographs

| Measure | Value |
|---|---|
| Salon photo slots on the page | **19** |
| Distinct photographs behind them | **11** |
| Reuse rate | **42.1%** |
| Distinct salons that share a photograph with a different salon | **8 of 16** |

The four collisions, each visible on the same page:

| Photograph | Salons it stands in for |
|---|---|
| `photo-1512290923902` | Glow Lab Basel, Velvet Face, **Rouge Studio** |
| `photo-1487412947147` | Haarsalon Margot, **Muse Beauty Studio** |
| `photo-1604654894610` | Nail Studio Bliss, **Pink Petal Nails** |
| `photo-1570172619644` | Smooth Skin Studio, **Wax & Glow Basel** |

Every salon photo on the page resolves to `images.unsplash.com`. Inspo is clean: 8 slots, 8 distinct
photographs, no reuse.

### 2i. The mobile category grid is illustrated, not photographic

| Measure | Value |
|---|---|
| Tile | 106 x 92, ratio 1.15, transparent background |
| Content | one 49 x 49 PNG from `/icons/categories/` |
| Icon as share of tile area | 24.8% |
| Photographic area | **0%** |
| Tiles | 6 (Coiffeur, Barber, Nails, Karte, Walk-in, Spa) |
| Desktop | the whole section is `md:hidden`, so desktop has no category index at all |

---

## 3. The reference numbers

All figures are ratios or percentages of the capture's own width. **No absolute competitor pixel
value is claimed.** Each image was downloaded and measured with PIL, not eyeballed.

### 3a. Photo aspect ratio and photo-to-card-height share

| Reference | Platform | Photo ratio (w/h) | Photo % of card height | Card as % of viewport width |
|---|---|---|---|---|
| [Fresha, "Recommended" home rail](https://mobbin.com/screens/9eaedf92-a72f-4a04-8bc8-49e9ecf7ff58) | iOS | **1.79** | **52.5%** | 56.2% |
| [Airtasker, home provider rail](https://mobbin.com/screens/ae12a89f-109e-4786-894b-5cec0a8a0c80) | iOS | **1.34** | **54.4%** | 44.8% (pitch) |
| [Instacart, "Popular restaurants"](https://mobbin.com/screens/fc7f91d4-dd8a-4c4b-9f8a-dc39f50513f6) | iOS | **1.17** | **55.1%** | 23.1% |
| [Tripadvisor, "Recommended for You"](https://mobbin.com/screens/fda7f454-a170-43d2-9bb7-38263e7be71a) | web | **1.07** | **56.8%** | 18.5% |
| [Airtasker web, "Home organisation"](https://mobbin.com/screens/756a4205-72b6-4e12-ac24-c7f31f921cfe) | web | **1.35** | **63.3%** | 16.7% |
| [Kiwi.com, "Our top deals for tonight"](https://mobbin.com/screens/c144fa19-0d09-4b5b-80b1-7862d47e75ee) | web | **1.61** | **50.0%** | 16.1% |
| **Solen mobile** | web@390 | **1.250** | **74.3%** | **59.2%** |
| **Solen desktop** | web@1512 | **1.250** | **70.5%** | **12.8%** |

Read that table three ways:

- **Aspect ratio: 1.07 to 1.79 across six references. Solen's 1.250 sits inside that band**, closer
  to the middle than to either edge. Nobody converges on a number here; Fresha and Tripadvisor are
  1.7x apart from each other.
- **Photo-to-card-height: the six references cluster tightly, 50.0% to 63.3%, median about 55%.
  Solen is 70.5% to 74.3%, above every one of them.** Solen's photo is a *larger* share of its card
  than any reference measured. There is no deficit here.
- **Card width as a share of viewport: Solen mobile at 59.2% is the widest of the three iOS
  references (Fresha 56.2%, Airtasker 44.8%, Instacart 23.1%). Solen desktop at 12.8% is below all
  three web references (16.1%, 16.7%, 18.5%).** Solen puts 6 cards in a row where those three put 4,
  5 and 4, so each photo is proportionally 21 to 31% narrower than the narrowest reference card.

### 3b. Within-rail consistency at the reference

Fresha's "Recommended" rail: card 1 photo and card 2 photo share an identical 94px height at 299px
render, with a 10px gutter and a 178px pitch. Instacart's "Popular restaurants" row measured 69, 69,
69 px across three visible tiles. Tripadvisor measured 139, 138, 138, 137. **Every reference is
internally consistent to within one render pixel, and so is Solen.** This is not a differentiator in
either direction.

### 3c. One structural contrast worth naming: the category index

[Fresha's iOS category grid](https://mobbin.com/screens/33f7d0bd-2edc-4768-a4a4-7de2b9b90489)
measures a tile of 130 x 61 at 299px render, ratio 2.13, with the label on the left and **a real
photograph of the service being performed** occupying roughly the right 43% of the tile area, full
bleed to the tile's top, right and bottom edges. Fourteen of those fit in one phone viewport
(counted in WHY_DENSITY section 2).

Solen's equivalent is 6 tiles of 106 x 92, each holding a 49 x 49 3D illustrated PNG at 24.8% of tile
area and 0% photographic, and the section does not exist on desktop.

**I am not calling this a defect and here is why.** WHY_DENSITY already established that beauty
booking's only two observable products split on exactly this: Fresha uses small real photos,
[Square Go](https://mobbin.com/screens/89ee891e-17ea-4c5a-b173-eccd95149a21) uses 3D illustrated
icons on grey tiles. A sample of two that splits one-one supports no verdict. What it does establish
is that Solen's choice is a real choice with a real cost, and the cost is 251 px of the mobile first
viewport carrying no photography.

---

## 4. Verdict per item

| # | Item | Number | Verdict |
|---|---|---|---|
| 1 | Photographic area, mobile first viewport | **0.00%** against a written floor of ~33% at exactly `390x844` | **BREAKS A FLOOR** |
| 2 | Photographic area, desktop first viewport | 8.38% at 1512x950, 11.76% at 1280x800 | **BELOW THE REFERENCE.** No Solen floor is written at a desktop width, so this is not a floor break. [Klook](https://mobbin.com/screens/49ac4d43-90b7-4dc0-a9fc-5ff5bb6141bc) puts a 39.7%-wide hero photo band plus a card row in its first viewport; [Kiwi.com](https://mobbin.com/screens/c144fa19-0d09-4b5b-80b1-7862d47e75ee) and [Airtasker web](https://mobbin.com/screens/756a4205-72b6-4e12-ac24-c7f31f921cfe) both open with a full card row above the fold. |
| 3 | Photo aspect ratio | 1.250, inside the reference band of 1.07 to 1.79 | **FINE** |
| 4 | Aspect consistency within one rail | 19 of 19 salon photos at 1.250, 8 of 8 looks at 0.563, zero variance | **FINE** |
| 5 | Photo is the largest element of every card | 2.74x the next element | **FINE** |
| 6 | Photo as a share of card height | 70.5% mobile, 74.3% desktop, against a reference cluster of 50 to 63% | **FINE**, and above the references. Do not "fix" this. |
| 7 | Card width as a share of viewport, mobile | 59.2%, the widest of three iOS references | **FINE** |
| 8 | Card width as a share of viewport, desktop | 12.8%, against 16.1 / 16.7 / 18.5% | **BELOW THE REFERENCE.** Caused by a 6-up ladder inside a 1280 cap. Sits with the GRID probe, not this one. |
| 9 | "Walk-in" renders salons with zero photography | 4 rows of 528 x 140, 0 photographic px, same entity that carries a photo card 751 px above | **BREAKS A FLOOR.** Two floors: the imagery floor on a customer browse section, and FLOORS LAW 8, one entity rendering through two anatomies. |
| 10 | Photo supply, distinct photographs per slot | 19 slots, **11 photographs**, 4 of them each standing in for 2 or 3 different named salons | **TASTE GAP**, and the deepest one on this axis. No written floor covers it. |
| 11 | Any bare grey box where a photo should be | 0 found. Every card that should carry a photo carries one. | **FINE** |
| 12 | Mobile category tiles are illustrated, not photographic | 0% photographic, 24.8% icon | **FINE as a choice**, costed in section 3c. The reference sample splits 1-1 and licenses no verdict. |
| 13 | Hairlines and shadows fighting on the photo card | `SalonCard` computes `box-shadow: none` and `border-width: 0px`. The card's boundary is the flush photo edge, route (b) of the Edge-Visibility floor. | **FINE.** No card carries both. |

---

## 5. The single worst thing on this axis, and what it would take to fix

### The worst thing, by the floor test

**At 390x844 the first viewport of the Solen home page contains zero photographic pixels. The floor
is written at that exact viewport and asks for roughly one third.** It is the only outright floor
break on this axis that is about photography rather than about one section.

**The size of the miss, stated precisely, because it is smaller than "0% versus 33%" makes it sound.**
The first photograph starts at y = 875, which is 31 px below an 844 fold. One small flick reveals it.
The failure is not that the page has no photography, it is that the page has **676 px of pre-feed
content on mobile** (hero 425 + category grid 251) and the fold lands 31 px short.

**What it would take, as arithmetic, not as a design decision.** A mobile card row is 231 wide with a
185 tall photo. A 390 viewport shows 1.69 cards, so one full photo band contributes
`390 x 185 = 72,150 px²`, which is **21.9%** of the 329,160 px viewport. **One card row is not
enough to reach 33%.** You need about 1.5 photo bands in view, roughly 278 px of photo height, which
means the first photo band has to start by **y ≈ 500**, a **375 px pull-up** from today's 875.

Three ways to buy 375 px, none of which I am picking for you:

1. Cut the hero. It is 425 px on mobile today (84 to 509). Halving it buys 212 px.
2. Move the "Für dich" category grid (251 px, 0% photographic) below the first salon rail. Buys 251
   px on its own, and combined with a modest hero trim clears the whole 375.
3. Grow the photo. Going from `aspect-[5/4]` to `aspect-[4/3]` adds 8 px of photo height per card and
   buys under 3% of the viewport. **This is the wrong lever** and is listed only so nobody reaches
   for it: the card geometry is already the best-performing thing on this axis (items 3 to 7 above).

**The constraint that rules out the obvious answer.** `npm run exists imagery` returns the owner's
THIRD rejection, 2026-07-25, of any hero photograph: *"no other company has just image hard coded
baked into a random area... what we need to do is SHOW OFF THE STORES THAT WE HAVE"*, enforced by
`no-decorative-image-gate.py`. FLOORS LAW 2 was rewritten the same day to say the imagery floor is
satisfied by **content and never by decoration**. So the legal fixes are all of the form "the real
feed starts earlier", and none of them is "put a photo in the hero".

### The worst thing, if the question is literally "why does it look cheap"

Different answer, and it is item 10. **Nineteen salon photo slots on the home page are filled by
eleven photographs. Four photographs each stand in for two or three differently named businesses,
and all four collisions are visible on the same page.** Scroll the mobile home and the identical
salon interior appears under "Glow Lab Basel", then "Velvet Face", then "Rouge Studio".

That is the brief's own bullet, *"content that is real but arranged as though it were placeholder"*,
occurring literally. It is the most recognizable tell of a marketplace with no supply, and no layout
change touches it. It is a **taste gap** rather than a floor break only because no rule in this
system counts distinct photographs per slot, which on this evidence looks like a missing floor.

The fix is not a design fix: it is one distinct photograph per salon in the seed set, and 11 more
photographs closes it. I am flagging this rather than proposing a rule, because "every salon renders
a distinct photograph" would be a new floor and that is the owner's call, not mine.

**Which of the two is worse, stated plainly.** The floor break is worse by the rules and the
duplicate-photo problem is worse to the eye. Fixing only the floor break makes the page show
duplicated stock photography 375 px sooner, which is not obviously an improvement. Fixing only the
duplicates leaves a phone visitor looking at a photograph-free first screen. They are independent and
both need doing.

---

## 6. What I could not verify

1. **Whether production serves the same photo assignment as the seed.** Every salon photo on `/de`
   today resolves to `images.unsplash.com`. Whether the 11-photograph pool is a seeding artefact or
   the shape of the real data path, I did not check.
2. **Any route other than `/de`.** No PDP, no search, no `/inspo`, no other locale. A German first
   viewport is 15 to 35% longer in copy than English per copy-i18n-09, so the 875 px first-photo
   offset may differ per locale and I did not measure the other three.
3. **Absolute reference pixel sizes.** Mobbin downscales. Every reference figure here is a ratio.
4. **Whether any of this converts.** Zero engagement data was observed. Everything above is a
   geometry argument.
5. **Whether the 33% floor is the right number.** It is the number written in the design contract and
   FLOORS LAW 2. I measured against it; I did not test it. The EMPHASIS BUDGET block in the project
   CLAUDE.md already documents what happens when a house number gets cited as evidence, and this
   number carries no external citation either.
