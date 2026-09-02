<!-- exists-check: net-new vs _design-system/sections/home-feed/CORPUS.md (extended, not edited),
     scripts/measure-sections.mjs and the _plans/ roadmaps. Full note in 01-search-and-categories.md.
     Structure follows _design-system/sections/salon-detail/. -->

# RecentlyViewed ("Top auf Solen" / "Zuletzt angesehen"): section spec

**Reference:** `_measured/home-feed.json` band index 2 · `CORPUS.md` section 1 row 4 (titled horizontal carousels: 26 of 34) and section 2 row 7 (a see-all affordance on every section header: 20 of 25)
**Component:** `app/[locale]/_components/homepage/RecentlyViewed.tsx`
**Layer:** 1 (chrome) + Layer 3 child (star `s-star`, `HeartButton`)

## Layout

```
Top auf Solen                                          (->)   <- h2 18/600 + see-all circle 32 in a 44 cell
+-------------+ +-------------+ +----------
|   photo     | |   photo     | |   photo               231 x 185, radius 22
+-------------+ +-------------+ +----------
 Name      * 4.8  Name     * 4.8  Name                  14/600 ink + 12/400 ink-2
 Barbershop       Coiffeur        Nails                 12/400 ink-2
 4051 Basel  15 CHF   ...                               12/400 ink-2 + 12/600 ink
```

Three card rows here, against band 02's two, because this caller passes `priceFromCHF`, `postalCode`
and `city` from the server batch.

## Measured

Band index 2. Box top 473, left 0, width 390, height 333. Surface transparent, padding 0, radius 0.

| Role | Size / weight | Family | Colour | Line-height | Count | Sample |
|---|---|---|---|---|---|---|
| Section title | 18 / 600 | Inter Tight | `rgb(10,10,10)` | 22.5 | 1 | "Top auf Solen" |
| Card name | 14 / 600 | Inter | `rgb(10,10,10)` | 17.5 | 4 | "Cuts & Culture" |
| Rating value | 12 / 400 | Inter | `rgb(107,107,107)` | 18 | 4 | "4.8" |
| Category, address, price label | 12 / 400 | Inter | `rgb(107,107,107)` | 16.2 | 12 | "Barbershop" |
| Price amount | 12 / 600 | Inter | `rgb(10,10,10)` | 16.2 | 4 | "15 CHF" |

- Card photo: radius 22, shadow `rgba(50, 47, 44, 0.09) 0px 2px 8px 0px`, no border,
  background `rgb(244, 244, 245)`, padding 0, example 231 x 185, count 4.
- Imagery: 4 images, 170 239 px2, 42 560 px2 each.
- Text elements 25, of which 9 are weight >= 600.
- The 12-count meta role is 3 leaves per card, derived: `SalonCard` row 2 is the category, row 3 is the
  address plus `PriceFrom`, and `PriceFrom` renders its "ab <service>" label as its own `s-ink-2` span
  before the emphasised amount (`PriceFrom.tsx:29-32`). 4 cards x 3 = 12.
- Height delta against band 02, derived: 333 minus 293 = 40, from the see-all circle sitting in a 44px
  cell against a bare 22.5px heading line, plus the third card row.
- Box-to-box gaps: 16px above (from band 02) and 16px below (to band 04). Section's own `py-2`
  is inside the box, so the visible gap is 8 + 16 + 8 = 32 (`SectionHeader.tsx` Section comment).

## Tokens

Identical to band 02, plus:

- See-all circle: 32px, `s-bg-sunken` fill, no border, ink `ArrowRight` at size 20 / strokeWidth 2,
  in a 44px hit cell. Copied verbatim from `RailHeading` in `search/CategoryMobileRails.tsx:82-98`
  rather than built a second time (`SectionHeader.tsx` `SeeAllCircle` docblock).
- Price amount `s-ink` at weight 600; the "ab" label stays `s-ink-2` at 400.

## Interaction

- Tap a card: `/{locale}/salon/{slug}`.
- Tap the see-all circle: `/{locale}/recently-viewed` when real history exists, `/{locale}/search` for
  the curated fallback (`RecentlyViewed.tsx:137-139`).
- Desktop only: a scroll-circle pair appears at `md:` because this caller passes `scrollRef`; both
  buttons track `canScrollLeft` / `canScrollRight` off a passive scroll listener.

## Intentional deviations

- The heading flips between two strings on one component: `ui.recentlyViewed.title` with real history,
  `topTitle` ("Top auf Solen") without. The measurement caught the fallback, so the capture had an empty
  `solen.recently-viewed` localStorage key.
- `CORPUS.md` section 6 records this card's rating at 13px. The measured value is 12px; the size merge
  is recorded in `SalonCard.tsx:521-523` (owner-approved `type-scale.html`, 8 sizes down to 4). The
  corpus line is stale on that number.

## Empty state

Section returns `null` when there is no history and the `topSalonIds` fallback also resolves to zero
complete rows (`RecentlyViewed.tsx:141`). An id whose `salonData` entry lacks name, slug or category is
skipped rather than rendered with an invented value.

## Provenance

- V3-D106 (2026-05-23): the pre-mount state renders the fallback, so a first-time visitor always sees a
  populated row instead of a flash.
- V3-D348: the fallback order bends toward the customer's onboarding category picks.
- 2026-08-15: `RecentlyViewedTiles` was removed from above this row after it rendered a second heading
  over the same salons in 86 x 86 square tiles, which is one entity in two shapes on one screen.

## Against the floors

- **Display anchor >= 28px: FAIL. This band shares the failure with band 02.** Largest text 18px.
- **Anchor at least 1.8x body: FAIL at 1.5x** (18 / 12).
- **At most ~30% of text at weight >= 600: FAIL at 36.00%** (9 of 25: the title, 4 names, 4 prices).
- **At most 4 sizes and 2 weights: PASS within this band** (3 sizes, 2 weights).
- **Two-anchor card rule (V3-D442): PASS.** Name 14 / 600 ink and price 12 / 600 ink, with the name
  larger, so size marks the anchor rather than colour.
- **Density floor, list first viewport >= 4 units plus a cropped next item: PASS on count** (4 cards
  in the row). Whether the 4th is inside the first viewport is horizontal, and the JSON carries no
  per-card x positions, so that half is **not measured**.
- **Locked shadow: FAIL against the contract row** for the same reason as band 02: measured
  `elevation-2`, contract says `whisper`.
- **Locked radius: photo at 22, off the locked ladder** (later dated approval, CARD_REDESIGN_2026-07-13).
- **Edge visibility (FLOORS LAW 4): PASS by route (b).** The photo is a flush filled edge against the
  white page; the card carries no border, and the contract forbids carrying both.
