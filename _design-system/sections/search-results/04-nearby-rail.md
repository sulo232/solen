# In der Nähe rail , section spec

**Reference:** `_design-system/sections/_measured/search-results.json`, bands 4 and 5. Band 5 is the heading row wrapper (`div.mb-[14px] flex items-center justify-between gap-4`), contained in band 4 and carrying the same heading, so it is folded in here.
**Component:** `app/[locale]/_components/search/CategoryMobileRails.tsx` (the second `Rail`), title from `CategoryBrowseRails.tsx` `TITLES.nearby`
**Layer:** identical to section 03. Same `Rail`, same `SalonCard`, same `ScrollRow`.

## Layout

Identical anatomy to `03-top-category-rail.md`, stacked 24px below it (`mb-6` on the preceding section).

```
y 493  ┌ In der Nähe ───────────────────────── (32) → ┐   heading row, 366 x 32
       │  ╭─────────────╮ ╭─────────────╮ ╭──────     │   same card, same 231 x 185
       │   Muse Beauty Studio      ★ 4.2              │
y 796  └──────────────────────────────────────────────┘
```

## Measured

Band 4 box: top **493**, left **12**, width **366**, height **303**. Surface `rgba(0, 0, 0, 0)`, padding `0px`, radius `0px`. Band 5 (heading row): top **493**, left **12**, width **366**, height **32**.

The gap from band 2's bottom (166 + 303 = 469) to band 4's top (493) measures **24px**, which is the `mb-6` on the preceding `section`.

Text roles, band 4, verbatim:

| size | weight | family | colour | line-height | letter-spacing | count | sample |
|---|---|---|---|---|---|---|---|
| 18 | 600 | Inter Tight | `rgb(10, 10, 10)` | 22.5 | -0.18px | 1 | `In der Nähe` |
| 14 | 600 | Inter | `rgb(10, 10, 10)` | 17.5 | normal | 8 | `Muse Beauty Studio` |
| 12 | 400 | Inter | `rgb(107, 107, 107)` | 18 | normal | 8 | `4.2` |
| 12 | 400 | Inter | `rgb(107, 107, 107)` | 16.2 | normal | 24 | `Coiffeur` |
| 12 | 600 | Inter | `rgb(10, 10, 10)` | 16.2 | normal | 8 | `35 CHF` |

Card anatomy, band 4: radius **22px**, shadow `rgba(50, 47, 44, 0.09) 0px 2px 8px`, border **none**, background `rgb(244, 244, 245)`, padding `0px`, count **8**, example size **231x185**.

Imagery, band 4: **8** images, **340,477 px** total area, byte-identical to band 2.

## Chrome position

Not applicable to this section. The search pill's box is recorded in `02-search-band.md`.

## Tokens

Identical to section 03. No token in this band differs from the Top rail, which is confirmed by the two bands' text-role tables and card entries matching value for value.

## Interaction

Identical to section 03: card taps navigate through `next-view-transitions`, the row snap-scrolls, the 32px heading arrow is `aria-hidden` with no handler.

## Intentional deviations

- **The two rails render the same eight salons.** Both bands measure 8 cards and 340,477 px of imagery to the pixel. `RAIL_CAP` is 10 and both rails slice the same fetched array, so 8 against a cap of 10 means the fetch returned 8 rows and each rail renders every one of them. Top sorts by `average_rating` descending, so its first sample is `4.8`; Nearby's first sample is `4.2`, which is the fetch order.
- **"In der Nähe" is not sorted by distance on this measurement.** `CategoryMobileRails.tsx:181` sets `hasDistance = salons.some(s => s.distance_meters != null)` and falls back to the unsorted pool when it is false. The JSON records no geolocation state, so which arm ran on this run is **not measured**; the differing first sample (4.2 rather than 4.8) is consistent with the fallback arm and does not by itself prove it, because a distance sort could also reorder that way.
- **The section title claims proximity that the fallback arm does not deliver.** Recorded here as a fact about the code path, with no fix proposed. The component's own comment states the fallback is deliberate and matches `CategoryBrowseRails`.
- Same `CardName` weight-600 override and same `elevation-2` photo shadow as section 03; see that file.

## Empty state

Same `null` return at `salons.length < 2`. Nothing is drawn when the pool is thin. There is no thin-rail sub-state, which is what the design contract's sparse-but-real row (hierarchy-density-04) asks for on a below-floor section.

## Against the floors

- **F2 imagery 41.03% PASS against 33%.** This band supplies half of it: 366 visible px wide by 184.53 tall inside the viewport is 67,538 px, and the pair of rails is 135,076 px against the viewport's 329,160 px.
- **F6 display anchor 18px FAIL against 28.** This band carries an 18px `h2` identical to section 03's. The failure is booked against section 03 because that heading is the first one on the screen; this one is the same size and the same recipe.
- **F7a bold share 28.57% PASS against 30%.** This band contributes 17 of its own 49 text elements at weight 600 or more, 34.7% inside the band.
- **F7b anchor ratio 1.5x FAIL against 1.8.** This band supplies 40 of the screen's 12px elements, which is what holds the median body term at 12.
- **F7c four distinct sizes PASS.** Contributes 18, 14 and 12; no size that section 03 does not already use.
- **ELEVATION five levels PASS against a floor of 2.** Contributes `elevation-2`, the same value as section 03, so one distinct level between them and not two.

Against the owner's target ladder: identical to section 03. Anchor 18 against 30, body 12 against 14, ratio 1.5x against 2.14x, emphasis at 600 against 500.

## Provenance

- Owner 2026-08-01, the carousel replacement, same decision as section 03
- `CategoryBrowseRails.tsx:73` , `TITLES.nearby`, the four-locale title record this rail reuses rather than re-declaring
- `CategoryMobileRails.tsx:181-190` , the distance-or-pool fallback, copied from `CategoryBrowseRails`' own Nearby rail
- The `postalToCity` reuse note in the component header , each card derives its own city from its postal code instead of inheriting the page's
