<!-- exists-check: net-new vs _design-system/sections/home-feed/CORPUS.md (the cross-app half of this
     screen's research, read in full and EXTENDED here, never edited), scripts/measure-sections.mjs (the
     instrument behind every number below) and the _plans/ roadmaps, none of which carry a per-section
     spec. Full exists-check note in 01-search-and-categories.md. Structure follows
     _design-system/sections/salon-detail/. -->

# ForYouAffinityRow ("Fuer dich empfohlen"): section spec

**Reference:** `_measured/home-feed.json` band index 1 · `CORPUS.md` section 1 row 4 (titled horizontal carousels: 26 of 34) and row 5 (photo above, text below: 16 of 19)
**Component:** `app/[locale]/_components/homepage/ForYouAffinityRow.tsx`, composing `Section` / `SectionFrame` / `SectionTitle` / `ScrollRow` from `SectionHeader.tsx` and `SalonCard` from `SalonCard.tsx`
**Layer:** 1 (chrome) + Layer 3 child (star `s-star`, `HeartButton`)

## Layout

```
Fuer dich empfohlen                              <- h2 18px/600, NO see-all circle
+-------------+ +-------------+ +----------
|   photo     | |   photo     | |   photo      231 x 185, radius 22
|             | |             | |
+-------------+ +-------------+ +----------
 Name      * 4.8  Name     * 4.8   Name          14/600 ink  +  12/400 ink-2
 Barbershop       Coiffeur         Nails         12/400 ink-2
```

Two rows of card text only. This row passes no `priceFromCHF`, `postalCode` or `city`, so
`SalonCard` row 3 (address + price) does not render.

## Measured

Band index 1. Box top 164, left 0, width 390, height 293. Surface transparent, padding 0, radius 0.

| Role | Size / weight | Family | Colour | Line-height | Count | Sample |
|---|---|---|---|---|---|---|
| Section title | 18 / 600 | Inter Tight | `rgb(10,10,10)` | 22.5 | 1 | "Fuer dich empfohlen" |
| Card name | 14 / 600 | Inter | `rgb(10,10,10)` | 17.5 | 3 | "Cuts & Culture" |
| Rating value | 12 / 400 | Inter | `rgb(107,107,107)` | 18 | 3 | "4.8" |
| Category row | 12 / 400 | Inter | `rgb(107,107,107)` | 16.2 | 3 | "Barbershop" |

- Card photo: radius 22, shadow `rgba(50, 47, 44, 0.09) 0px 2px 8px 0px`, no border,
  background `rgb(244, 244, 245)`, padding 0, example 231 x 185, count 3.
- Imagery: 3 images, 127 679 px2 total, 42 560 px2 each (derived: total / count).
- Text elements 10, of which 4 are weight >= 600 (derived from the role counts above).
- Letter-spacing: title `-0.18px`, every card role `normal`.
- Non-photo share of the band, derived: 293 height minus 185 photo height leaves 108px (36.9%)
  for the heading, the gaps and the two-row text stack.
- Box-to-box gap to band 03: 16px (this band ends 457, band 03 starts 473).

## Tokens

- Ink `s-ink` `#0A0A0A`, meta `s-ink-2` `#6B6B6B`, photo fallback `s-bg-sunken` `#F4F4F5`. All three
  match the measured rgb values exactly.
- Photo shadow is `shadow-elevation-2` = `0 2px 8px rgba(50,47,44,0.09)` (`tailwind.config.js:279`).
- Star `s-star` `#FFC32B` via `RatingStars` compact `size="sm"` (star box 12px, `COMPACT_STAR_PX`).
- No review count renders: `SalonCard` calls `RatingStars` without a `count`, and the blue `(N)` span
  only exists when that prop is passed (`RatingStars.tsx:229`).

## Interaction

- Tap a card: `/{locale}/salon/{slug}`. Press feedback `active:scale-[0.97]`, 80ms, `ease-glide`.
- Tap the heart: `HeartButton`, top-right on the photo.
- The row is a native scroll-snap carousel (`ScrollRow`, `scroll-snap-type: x mandatory`).
- No see-all control and no desktop scroll circles: this caller passes neither `link` nor `scrollRef`.

## Intentional deviations

- Every other rail on this screen carries a see-all circle. This one does not, and that is the
  measured 40px height difference against band 03 (293 vs 333), together with the missing third card row.
- `CORPUS.md` section 2 row 4 records the dominant rating pattern as star + value + count in parentheses
  (11 of 16), and names Airbnb as the dissent that shows the value with no count on home cards. This row
  follows the Airbnb side, by way of the dated CARD_REDESIGN_2026-07-13 C11 decision that dropped the
  count from card row 1.

## Empty state

Returns `null`. The row renders only when `/api/salons/recommendations` answers with
`source: "affinity"` or `source: "engagement"` and a non-empty `salons` array, and it short-circuits on
`getSession()` for a signed-out visitor (`ForYouAffinityRow.tsx:37-59, 76`).

**This band's presence in the measurement is the evidence that the capture was signed in.** The row
cannot render without a session, and `scripts/measure-sections.mjs` signs in once into a shared browser
context whenever any target in the run needs auth. The JSON records no session field.

## Provenance

- Owner switched the row on 2026-08-14.
- 2026-08-15 i18n fix: the title was a hardcoded German literal and now reads `home.featured.forYou`.
- CARD_REDESIGN_2026-07-13 C1 and C11: photo `aspect-[5/4]` at radius 22, three-row info stack.

## Against the floors

- **Display anchor >= 28px: FAIL. This band owns the failure jointly with band 03.** Its largest text
  is the 18px section title, and bands 01, 02 and 03 are the whole of the first viewport, so 18px is
  the largest text a first-time visitor sees. The target ladder is 30px.
- **Anchor at least 1.8x body: FAIL at 1.5x.** 18 / 12 = 1.50 against a floor of 1.8 and a salon-detail
  target of 2.14. Measured against the 14px card name instead, the step is 18 / 14 = 1.29.
- **At most ~30% of text at weight >= 600: FAIL at 40.00%** (4 of 10). The four are the title and the
  three card names.
- **At most 4 sizes and 2 weights: PASS within this band** (3 sizes: 18, 14, 12; 2 weights: 400, 600).
- **Imagery: this band is the screen's densest photographic band per unit height.** 3 photos at
  42 560 px2 each. No viewport percentage is derivable, because `imageAreaPx` sums every visible `img`
  rect including the cards scrolled off the right edge of the rail.
- **Photo is the largest element of the card: PASS.** 231 x 185 against a two-row text stack.
- **Locked shadow: FAIL against the letter of the contract.** The design-contract shadow row reads
  "SalonCard = photo + `shadow-whisper` + NO border". The measured value is `elevation-2`
  (`0 2px 8px rgba(50,47,44,0.09)`), not `whisper`
  (`0 1px 3px rgba(10,10,10,0.04), 0 10px 28px -14px rgba(10,10,10,0.10)`). The "no border" half PASSES.
  This applies identically to bands 03, 05, 06, 07 and 08, which render the same component.
- **Locked radius: the photo is 22.** The locked ladder rungs are 16 (card), 24 (grouped list card),
  12 (input), 28 (sheet). 22 is off the ladder and comes from the dated CARD_REDESIGN_2026-07-13 C1
  approval, which is a later dated owner decision than the contract row.
- **Tertiary grey ban (FLOORS LAW 6): PASS.** Every grey measured here is `#6B6B6B` (`s-ink-2`), not
  `#9CA3AF` (`s-chart-2`).
