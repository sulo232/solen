<!-- exists-check: extends _design-system/sections/booking-staff/CORPUS.md, whose Solen-gap item 4
     names this bar as the "third copy of the sticky commit bar" and calls it an extraction
     candidate. This file measures the copies and reports how far apart they actually are.
     `npm run exists "staff step"` returns StaffStep.tsx; no per-section spec existed. -->

# Running total and Weiter (fixed bottom bar) , section spec

**Reference:** `_design-system/sections/_measured/booking-staff.json`, `bandAnatomy.stickyBar` and `.continueCta`, plus band index 0's text roles · `CORPUS.md` Solen-gap item 4
**Component:** `components-legacy/booking/StaffStep.tsx:192-216`
**Layer:** 1 (chrome)

## Layout

```
                                                        viewport y = 775
+---------------------------------------------------------------+  h = 69
|  CHF 45                                    [  Weiter  -> ]     |
|  (cart) 1 Artikel 30 Min                     113 x 44 ink pill |
+---------------------------------------------------------------+  y = 844
   20px / 700 left column          CTA right, hugs its label
```

`position: fixed`, so it is on screen at every scroll position from first paint.

## Measured

| item | value |
|---|---|
| bar | [0, 775, 402, 69], background `rgb(255, 255, 255)`, border-top 1px `rgb(228, 228, 231)` |
| inner row | [0, 776, 402, 68], padding `12px 16px`, max-width 672 |
| price | 20px / 700 / Inter / ink / line-height 20 / count 1 / "CHF 45" |
| meta | 12px / 400 / Inter / `rgb(107, 107, 107)` / line-height 16 / count 1 / "1 Artikel 30 Min" |
| CTA | [273, 788, 113, 44], radius 99, background `rgb(10, 10, 10)`, 14px / 600, padding `12px 24px` |
| CTA label | 14px / 600 / Inter Tight / white / count 1 / "Weiter" |

**No overlap at rest.** The list ends at y 563 and the bar starts at 775, so nothing is covered on this step at any scroll position (the document is 900 tall against an 844 viewport, giving 56px of scroll, and `pb-32` on the step root reserves 128px).

**Document height 900 is set by a minimum, not by content**, and the arithmetic checks: `min-h-screen` on `page.tsx:260` is 844 at this viewport, plus the layout `main`'s 56px bottom padding = 900. The content itself stops at 771 (563 list bottom + 128 `pb-32` + 24 page `pb-6` + 56).

## Tokens

- Bar: `fixed bottom-0 left-0 right-0 z-40 border-t border-s-border bg-white`
- Inner: `mx-auto flex max-w-2xl items-center justify-between px-4 py-3`
- Price: `font-body text-xl font-bold leading-none tabular-nums text-s-ink`
- Meta: `text-xs text-s-ink-2` with `ShoppingCart size={13}`
- CTA: `rounded-btn bg-s-ink px-6 py-3 font-heading text-sm font-semibold text-white`, disabled `opacity-50 cursor-not-allowed`, plus `butterPress('cta')`
- The arrow is a two-path SVG whose shaft draws in on hover and press (`stroke-dashoffset` 14 to 0 over 300ms `ease-glide`), owner-approved in `liftup-booking-services-tiered` and unified across booking steps 2026-07-19. Not exercised in this measurement: the run drove the page with `HTMLElement.click()`, so no hover state ever existed.

## Interaction

- `Weiter` calls `goToStep('datetime')`. In page only, no URL change, no fetch.
- `disabled={!selected}` is effectively never true here, because `selectedStaffId` defaults to `'any'`. The disabled styling exists and has no reachable state on this step with seeded data.
- The price and the item line read `formData.totalPrice`, `.services.length` and `.totalDuration` straight from the booking context, so they restate the step-1 cart rather than computing anything new.

## Against the floors

- **Sticky CTA (FLOORS LAW 3b): PASS.** The commit sits in a `fixed bottom-0` bar, on screen at first paint, so no volume of content above it can bury it. The global `BottomNav` yields the slot on this route rather than stacking.
- **Touch target (>= 44px): PASS.** 113 x 44, measured exactly at the floor.
- **Display anchor (FLOORS LAW 6): FAIL, and this band holds the failure.** At 20px the price is the largest text on the whole screen, 8px under the 28px floor.
- **Anchor ratio (EMPHASIS BUDGET b, >= 1.8x): FAIL.** 20 / 15 = 1.33x against the row names, 20 / 13 = 1.54x against the subtitles. Either denominator fails.
- **Locked radius: PASS.** `rounded-btn` measures 99.
- **FLOORS LAW 8, the same thing looks the same everywhere: FAIL, measured across four files.** Every step of this one flow hand-builds its own bottom bar and no two agree:

  | step | class | measured bar | measured CTA |
  |---|---|---|---|
  | services | `fixed bottom-0 ... bg-white z-40` | about 68 (derived, sibling spec) | 113 x 44, right aligned |
  | **staff (this one)** | `fixed bottom-0 ... bg-white z-40` | **69** | **113 x 44, right aligned** |
  | date and time | `fixed bottom-0 ... bg-[--raised] z-40` | 73 | 370 x 48, full width |
  | pay | `fixed bottom-0 ... bg-white p-4 z-20` | 84 (derived: 52 + 2 x 16) | 338 x 52, full width |

  Three heights, three button widths, two z-indexes and two background tokens for one control, on four consecutive screens of one flow. This is the relationship failure FLOORS LAW 8 was written for, and it is exactly the "extraction candidate" the corpus filed as low priority. The measurement raises the severity: the copies have already drifted.

## Intentional deviations

- **The price is the biggest thing on the step, not the title.** That is a consequence of the 16.5px title decision (see `01`), not an independent call. Nothing in the design contract asks for a 20px price.
- The label reads `Weiter` on this step rather than naming the destination, consistent with the services step.

## Empty state

None reachable. The cart cannot be empty here: step 1 blocks `Weiter` until a service is selected, and this step is only reachable through it.

## Provenance

- Mockup 20, owner-approved 2026-06-11 , the running-total bar as the booking flow's commit pattern
- Owner 2026-07-19 , the draw-in arrow unified across booking steps
- hierarchy-density-06 / FLOORS LAW 3b , the sticky-CTA floor, whose named reference implementation is this flow's bottom bar
