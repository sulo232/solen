<!-- exists-check: net-new vs _design-system/sections/home-feed/CORPUS.md (extended, not edited),
     scripts/measure-sections.mjs and the _plans/ roadmaps. Full note in 01-search-and-categories.md.
     Structure follows _design-system/sections/salon-detail/. -->

# TopCategoryRails, rail 1 of 4 ("Top Coiffeur"): section spec

**Reference:** `_measured/home-feed.json` band index 5 · `CORPUS.md` section 1 row 4 (titled horizontal carousels: 26 of 34) and section 3 (mobile carousels show 1.7 to 2.1 cards with the next one cropped)
**Component:** `app/[locale]/_components/homepage/TopCategoryRails.tsx`, inner `CategoryRail`
**Layer:** 1 (chrome) + Layer 3 child (star `s-star`, `HeartButton`)

## Layout

```
Top Coiffeur                                           (->)
+-------------+ +-------------+ +----------
|   photo     | |   photo     | |   photo               231 x 185, radius 22
+-------------+ +-------------+ +----------
 Haarsalon Margot  * 4.8   Name    * 4.7   ...          14/600 ink + 12/400 ink-2
 Coiffeur          Coiffeur                             12/400 ink-2
 4051 Basel  35 CHF   ...                               12/400 ink-2 + 12/600 ink
```

Bands 05 to 08 are four instances of one `CategoryRail`, one per category slug, in the order
`SALON_CATEGORY_SLUGS` gives (`lib/validations.ts`). This file carries rail 1; 06, 07 and 08 carry
their own measured numbers and refer back here for the shared anatomy.

## Measured

Band index 5. Box top 1026, left 0, width 390, height 333. Surface transparent, padding 0, radius 0.

| Role | Size / weight | Family | Colour | Line-height | Count | Sample |
|---|---|---|---|---|---|---|
| Section title | 18 / 600 | Inter Tight | `rgb(10,10,10)` | 22.5 | 1 | "Top Coiffeur" |
| Card name | 14 / 600 | Inter | `rgb(10,10,10)` | 17.5 | 8 | "Haarsalon Margot" |
| Rating value | 12 / 400 | Inter | `rgb(107,107,107)` | 18 | 8 | "4.8" |
| Category, address, price label | 12 / 400 | Inter | `rgb(107,107,107)` | 16.2 | 24 | "Coiffeur" |
| Price amount | 12 / 600 | Inter | `rgb(10,10,10)` | 16.2 | 8 | "35 CHF" |

- Card photo: radius 22, shadow `rgba(50, 47, 44, 0.09) 0px 2px 8px 0px`, no border,
  background `rgb(244, 244, 245)`, padding 0, example 231 x 185, count 8.
- Imagery: 8 images, 340 477 px2, 42 560 px2 each.
- Text elements 49, of which 17 are weight >= 600. This is the densest rail on the screen: it carries
  8 cards where 06, 07 and 08 carry 4 each, and its height is identical to theirs at 333, because the
  extra cards extend the row horizontally rather than vertically.
- Box-to-box gaps: 16px above (band 04 ends 1010) and 16px below (band 06 starts 1375).

## Tokens

- Same set as band 03: `s-ink`, `s-ink-2`, `s-bg-sunken`, `s-star`, `shadow-elevation-2`, radius 22.
- See-all circle: 32px `s-bg-sunken` fill in a 44px cell, ink `ArrowRight` 20 / strokeWidth 2.

## Interaction

- Tap a card: `/{locale}/salon/{slug}`.
- Tap the see-all circle: `/{locale}/coiffeur`; the label is `Alle Coiffeur-Salons`, reusing the string
  template `ForYouSalonRows` already ships.
- Desktop only: a scroll-circle pair at `md:`, wired to `scrollRef`.

## Intentional deviations

- The rail self-hides below 2 salons rather than rendering a lonely single card
  (`TopCategoryRails.tsx:70`), matching the same floor `CategoryMobileRails` and `CategoryBrowseRails`
  already use.
- `CATEGORY_ROUTE` is a local route-plus-label lookup, byte-identical to `HEADER_CATEGORIES` and
  `CATEGORY_PILLS`, and the file's own header comment records why it is a copy rather than a
  cross-import.

## Empty state

`CategoryRail` returns `null` at fewer than 2 resolvable salons; `TopCategoryRails` returns `null` when
`idsByCategory` is absent. An id with no matching `salonData` name or slug is dropped, never rendered
with an invented value.

## Provenance

- I3 (2026-08-01): the four per-category rails, reconciled against
  `public/_mockups/home-v3/search-a.html` RAILS[3..6].
- A6 (owner 2026-08-05): the "Bald frei" rail that used to lead this pair is unmounted, and its server
  fetch went with it.

## Against the floors

- **Display anchor >= 28px: FAIL.** Largest text 18px.
- **Anchor at least 1.8x body: FAIL at 1.5x** (18 / 12).
- **At most ~30% of text at weight >= 600: FAIL at 34.69%** (17 of 49). This is the lowest bold share of
  any rail on the screen, and it is lower only because the extra 4 cards add proportionally more 400
  weight meta than 600 weight anchors.
- **At most 4 sizes and 2 weights: PASS within this band** (3 sizes, 2 weights).
- **Density floor, populated list first viewport >= 4 units plus a cropped next item: PASS on count**
  with 8 cards. Horizontal positions are **not measured**, so the crop itself is not verified here.
- **Rich-data ceiling: PASS.** 8 cards is well under the 3x-floor grouping threshold.
- **Locked shadow: FAIL against the contract row** (`elevation-2` measured, `whisper` specified),
  identical to bands 02, 03, 06, 07 and 08.
- **Locked radius: photo at 22, off the locked ladder** (CARD_REDESIGN_2026-07-13 C1).
- **Same thing looks the same everywhere (FLOORS LAW 8): PASS across 05 to 08.** All four rails render
  the identical `SalonCard` at identical measured geometry; only the heading, the count and the sample
  strings differ.
