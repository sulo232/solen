<!-- exists-check: net-new vs _design-system/sections/home-feed/CORPUS.md, which sits in this same folder
     and is the cross-app research half of this screen. It was read in full before any of these files
     were written, it is EXTENDED and cited here, and it is not edited or replaced. Also checked and
     not covering this: scripts/measure-sections.mjs (the instrument), scripts/check-geometry.mjs
     (six whole-page numbers, no section tree), _docs/category-system-map.md,
     app/api/homepage-sections/route.ts, and the _plans/ roadmaps. Structure follows
     _design-system/sections/salon-detail/. -->

# /de section docs

Per-section specs for the home feed. Each section .md file follows the same shape as
`_design-system/sections/salon-detail/`:

- **Reference:** the measured band in `_measured/home-feed.json`, plus the `CORPUS.md` rows it answers to
- **Component:** file path of the React component
- **Layer:** the V3-D197 three-layer role (1 chrome / 2 brand accent / 3 semantic UI)
- **Layout:** the visual and structural target as an ASCII sketch
- **Measured:** numbers read off the JSON, never eyeballed; anything computed from those numbers is
  labelled derived, and anything the JSON does not hold is labelled **not measured**
- **Tokens:** the colour, font, radius and shadow tokens, with the measured rgb beside them
- **Interaction:** what each tap does
- **Intentional deviations:** where this screen departs from the corpus or from a sibling section
- **Empty state:** what renders with no data
- **Provenance:** the dated decisions that produced the section
- **Against the floors:** the block salon-detail does not carry. Which floors this section's measured
  numbers PASS and which they FAIL, with the number.

## Sections (document order)

| # | File | Section | Component | JSON band |
|---|---|---|---|---|
| 1 | `01-search-and-categories.md` | Sticky search pill + category pills | `homepage/HomeSearchPill.tsx` + `layout/CategoryPillRow.tsx` | none, see below |
| 2 | `02-for-you.md` | "Fuer dich empfohlen" salon rail | `homepage/ForYouAffinityRow.tsx` | 1 |
| 3 | `03-top-auf-solen.md` | "Top auf Solen" salon rail | `homepage/RecentlyViewed.tsx` | 2 |
| 4 | `04-nearby-map.md` | Map teaser, no heading | `homepage/Nearby.tsx` + `NearbyMap.tsx` | 4 |
| 5 | `05-top-coiffeur.md` | "Top Coiffeur" rail | `homepage/TopCategoryRails.tsx` | 5 |
| 6 | `06-top-barber.md` | "Top Barber" rail | `homepage/TopCategoryRails.tsx` | 6 |
| 7 | `07-top-nails.md` | "Top Nails" rail | `homepage/TopCategoryRails.tsx` | 7 |
| 8 | `08-top-spa.md` | "Top Spa" rail | `homepage/TopCategoryRails.tsx` | 8 |
| 9 | `09-popular-looks.md` | "Beliebte Looks" 9:16 look rail | `homepage/PopularLooks.tsx` | 9 |
| 10 | `10-walk-in.md` | "Walk-in" live band | `homepage/WalkInBand.tsx` | 10 (+11) |
| 11 | `11-reviews.md` | "Bewertungen" review rail | `homepage/Reviews.tsx` | 12 |
| 12 | `12-footer.md` | Newsletter strip + footer | `layout/Footer.tsx` | 13 (+14, +15) |
| 13 | `13-bottom-nav.md` | Floating bottom tab bar | `layout/BottomNav.tsx` | 3 |

**16 bands in the JSON, 13 files.** Five bands were folded rather than given a file, and one file has no
band:

- **Band 0 (`main`)** is the element containing everything. Its aggregate roles and cards are used in
  file 01 and in the screen totals below, and it gets no file of its own.
- **Band 11** is an unclassed `div` inside Walk-in holding the heading, the sub-line and the Live label.
  Folded into file 10.
- **Band 14** is an unclassed `div` inside the footer holding the newsletter heading and sub-line.
  Folded into file 12.
- **Band 15** is the newsletter `<form>`. It is a landmark tag, which is why the extractor emitted it,
  but it is not a section of the screen. Folded into file 12.
- **Band 3 (the bottom nav)** is `position: fixed` and the page was captured at scroll 0, so its box
  lands at measured top 774, third in the JSON's top-sorted order. It is not the third thing in the
  document. It is filed last, matching how `salon-detail` files its own fixed `17-mobile-book-bar.md`
  after the content sections.
- **File 01 has no band.** The extractor keeps a node only when it is a landmark tag or carries a
  direct-child heading; the sticky search wrapper is a plain `div` with neither. Its contents are
  visible in band 0's aggregate only, and its box is derived from `main` top 0 against band 1 top 164.

**Four bands rendered by one component.** Files 05 to 08 are four instances of `CategoryRail` inside
`TopCategoryRails.tsx`, one per category slug. They get four files because they are four real,
separately measured bands. The cost of that choice is named here rather than hidden: 06, 07 and 08 are
close to identical to 05 apart from their heading, their card count and their sample strings, and 05
carries the shared anatomy they refer back to.

## Reference set

- `_design-system/sections/_measured/home-feed.json`, the single settled measurement every number in
  these files is read from. Produced by `scripts/measure-sections.mjs` at 390 x 844,
  `deviceScaleFactor: 3`, `isMobile: true`, against the running dev server, after a settle wait that
  polls a text-count / max-font / image-area signature until it stops changing. Recorded state:
  `httpStatus: 200`, `settled: true`, `redirectedAway: false`, `documentHeight: 4517`.
- `_design-system/sections/home-feed/CORPUS.md`, the 44-app Mobbin sweep of this archetype
  (2026-07-29). Cited per section; never edited by this work.
- The component sources under `app/[locale]/_components/homepage/` and
  `app/[locale]/_components/layout/`, read for every `Component:` and `Interaction:` line.

## Screen totals, as measured

| Measure | /de measured | Floor or ceiling | Target ladder (salon-detail) |
|---|---|---|---|
| Distinct text sizes | 9 (22, 20, 18, 17, 16, 15, 14, 13, 12) | at most 4 | 5 |
| Distinct weights | 4 (400, 500, 600, 700) | at most 2 | emphasis carried at 500 |
| Text elements | 330 | n/a | n/a |
| Weight >= 600 | 139, which is **42.12%** | at most ~30% | 30% |
| Largest text, whole document | 22px (footer wordmark) | anchor >= 28px | 30px |
| Largest text, first viewport | 18px (section titles) | anchor >= 28px | 30px |
| Anchor ratio | 18 / 12 = **1.50x** | at least 1.8x | 2.14x |
| Distinct card radii | 6 (12, 13, 16, 22, 40, 9999) | the locked ladder has 12, 16, 24, 28, pill | n/a |
| Distinct shadow recipes | 5 | the locked surface table names one per surface class | 3 elevation levels |
| Document height | 4517px | n/a | n/a |

**Two numbers in this table differ from the brief that commissioned these files, and both are stated
here rather than smoothed over.**

1. The brief gives the bold share as 37.14%. `home-feed.json`'s own `screen` block gives 139 of 330,
   which is 42.12%. The two come from different instruments counting different element sets. Every
   per-section percentage in these files is computed from this file's role counts, so they add up to
   42.12% and not to 37.14%.
2. The brief gives the largest text on the screen as 18px. That is true of the first viewport, and it
   is the number that matters for the anchor floor. Across the whole document this file records 20px
   (file 10's green wait figure) and 22px (file 12's footer wordmark). Both sit below the fold.

## Which section owns each failing floor

- **Anchor 18px against the 28px floor.** Nothing on the screen reaches 28. In the first viewport the
  only bands are file 01 (largest text 14px), file 02 (18px), file 03 (18px) and file 13 (12px), so
  **files 02 and 03 own the 18px ceiling** and **file 01 owns the 164px of top chrome that carries no
  anchor at all**. Below the fold, **file 10 holds the largest body text at 20px** and **file 12 holds
  the screen maximum at 22px**, and that 22 is a footer wordmark, which is chrome rather than a
  customer-screen anchor.
- **Anchor ratio 1.50x against 1.8x.** The same 18 / 12 in **files 02, 03, 05, 06, 07, 08, 09 and 11**.
  The weakest single step is **file 11 at 1.29x** against its own 14px body. The strongest is
  **file 10 at 1.67x** (20 / 12), still under the floor.
- **Bold share against the 30% ceiling.** Worst first: **file 09 at 68.00%** and **file 10 at 67.86%**,
  then **file 04 at 50.00%**, **file 11 at 41.18%**, **file 02 at 40.00%**, **files 03, 06, 07 and 08 at
  36.00%**, **file 05 at 34.69%**. Under the ceiling: **file 12 at 30.43%**, **file 13 at 25.00%**,
  **file 01 at 0%**.
- **Photographic area against the 33% floor.** Seven of the thirteen sections carry no meaningful
  imagery: **file 01** (2 352 px2 in 164px of height), **file 04** (2 024 px2 in 188px, because live
  map tiles are not photography and do not register as images either), **file 10** (1 177 px2 in
  296px), **file 11** (0 in 304px), **file 12** (0 in 880px) and **file 13** (0 in 58px). All the
  photography on the screen is in **files 02, 03, 05, 06, 07, 08** (salon card photos, 42 560 px2 each)
  and **file 09** (look tiles, 52 344 px2 each). For the first viewport specifically, **files 01 and 13
  are the owners**: 222 of the first viewport's 844px is chrome carrying essentially none.

## Not yet measured

Everything below is absent from `home-feed.json`. It is listed instead of guessed.

1. **The 15px text role.** The screen's `distinctSizes` includes 15, and no band's `textRoles` contains
   it. Derived: 330 screen text elements minus 298 in `main`, 23 in the footer and 4 in the nav leaves
   5 elements outside all three landmarks, 3 of them at weight >= 600, and the 15px role is among them.
   A grep for `text-[15px]` returns candidates in `layout/Header.tsx:296`, `layout/MobileMenu.tsx` and
   `search/SearchOverlay.tsx`. I did not narrow it further and I did not re-render.
2. **File 01's box.** Its top, its height, and the split between the search pill, the pill row and the
   FeedZone padding beneath them. Only the 164px total is derivable.
3. **Horizontal positions.** No per-card x or scroll offset, so the "visibly cropped next item" half of
   the density floor is not verifiable from this file, for any rail.
4. **Any photographic percentage per viewport.** `imageAreaPx` sums the rect of every visible `img`,
   including cards scrolled off the right edge of a rail: band 5 reports 340 477 px2 for 8 cards at
   42 560 each, and only about 1.5 of those cards are on screen. So the brief's 28.56% cannot be
   recomputed here. The derivable statement is an upper bound: the first viewport contains at most two
   photo rows of 185px height each, so at most 390 x 185 x 2 = 144 300 px2 of the viewport's
   329 160 px2, which is **43.8% as an absolute ceiling**. That neither confirms nor contradicts
   28.56%; it does show how little headroom the layout has over the 33% floor.
5. **The selected category pill's fill layer.** `cardAnatomy` keeps the top 8 entries by count and the
   selected pill's sunken fill has a count of 1, so it fell outside the list.
6. **Anything smaller than 60 x 32.** The card detector skips it: the walk-in header's 52px icon tile,
   the map's 11px marker dot, the footer's 36px social buttons and its 36px submit button, the 40px
   review avatar.
7. **Why 3 of the 5 icon-bearing category pills registered as images** and the other 2 did not.
8. **Desktop.** One viewport only, 390 x 844. The `md:` behaviour (scroll-circle pairs, the 4-across
   grid, `BusinessTeaser`) is not in this file.
9. **Every non-resting state.** Hover, focus, press, the nav's scroll-condense, the skeletons, the
   error states: a single static capture cannot hold them.
10. **The session state of the capture.** The JSON records no auth field. File 02 renders only with a
    session (`ForYouAffinityRow` short-circuits on `getSession()`), and it is present in the
    measurement, so the capture was signed in. `scripts/measure-sections.mjs` signs in once into a
    shared browser context whenever any target in the run needs auth, which is how a route marked
    `auth: false` gets measured signed in.

## Locked decisions affecting this route

- **V3-D197** three-layer colour system (Chrome / Brand accent / Semantic UI), which the `Layer:` line
  in each file names.
- **V3-D204** accent `#276EF1`; **V3-D200** star `#FFC32B`; **V3-D138** `s-ink-2` `#6B6B6B`.
- **CARD_REDESIGN_2026-07-13 C1 and C11**: the salon card photo at `aspect-[5/4]` radius 22, the
  three-row info stack, and no review count on card row 1.
- **V3-D442** two-anchor card rule: name and price both ink, name larger.
- **Owner 2026-08-05 (A4) and 2026-08-10**: Nearby is the map alone, with no heading and no arrow.
- **Owner 2026-08-16, variant B**: the look name sits in an opaque white pill on the photo.
- **Owner 2026-06-29, variant B**: the review card is person-led, and the Walk-in band is a live board.
- **2026-07-17 rhythm decision**: `py-2` plus `mb-4` on `Section`, which is the measured 16px
  box-to-box gap between every content band and the 32px visible gap it produces.
- **FLOORS LAW 2 as clarified 2026-07-25**: the imagery floor is met by content, never by decoration.
  `CORPUS.md` section 8 confirms it independently: 0 of 34 home feeds in the tally set carry a
  decorative hero photograph.
