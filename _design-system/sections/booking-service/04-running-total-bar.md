<!-- exists-check: extends _design-system/sections/booking-service/CORPUS.md sections 6 and 7 (read
     first), which name the running total as an extraction candidate and the Careem line-item caret as
     the gap. Net-new as a per-section spec vs _design-system/sections/salon-detail/17-mobile-book-bar.md
     (the PDP's Buchen bar, a different component that this route hides) and _design-system/
     COMPONENT_REGISTRY.md row BottomNav (the global nav that yields to this bar). `npm run exists
     "booking service"` returns no spec for this band. -->

# Running total bar (the commit action) , section spec

**Reference:** `_design-system/sections/_measured/booking-service.json` band index 0 (`main`), text roles at 20px, 14px and 12px, and card group 3 · `CORPUS.md` section 6, the Careem row
**Component:** `components-legacy/booking/ServicesStaffStep.tsx:561-608`
**Layer:** 1 chrome + Layer 2 (the one ink commit control)

## Layout

```
 --------------------------------------------------------------  <- border-t hairline
 |  CHF 0                                       [ Weiter -> ]  |  fixed bottom-0, z-40
 |  (cart) 0 Artikel   0 Min                                   |  113 x 44 ink pill
 --------------------------------------------------------------
    20px/700 tabular             14px/600 white, radius 99
    12px/400 grey meta
```

`fixed bottom-0 left-0 right-0`, white, one hairline on top, no shadow. The inner row is `max-w-2xl mx-auto px-4 py-3 flex justify-between items-center`, so on a wide viewport the bar spans the window while its contents stay inside the same 672px column the page uses.

## Measured

The bar is not one of the JSON's six bands: it is a `div` with no heading child and no landmark tag, so the script folds it into band 0 (`scripts/measure-sections.mjs:193-194, 213-223`). Its type and its CTA box are read out of band 0.

| item | value | source |
|---|---|---|
| total | 20px / 700 / Inter / `rgb(10, 10, 10)` / line-height 20 / count 2 / sample "CHF" | measured |
| meta line | 12px / 400 / Inter / `rgb(107, 107, 107)` / line-height 16 / count 2 / sample "0 Artikel Min" | measured |
| CTA label | 14px / 600 / Inter Tight / `rgb(255, 255, 255)` / line-height 20 / count 1 / sample "Weiter" | measured |
| CTA box | radius 99, box-shadow `none`, border `none`, background `rgb(10, 10, 10)`, padding `12px 24px`, count 1, 113x44 | measured, band 0 card group 3 |
| bar height | **not measured** | derived below |
| bar box-shadow | none, and no radius >= 8 | inferred from the JSON, see below |

- **The bar carries no shadow and no radius.** `cardAnatomy` records any element with a radius of 8 or more OR any shadow at all (`scripts/measure-sections.mjs:277`). No entry for a 390-wide box appears in band 0, so the bar failed both tests. The locked shadow table's "sticky bar = gradient fade" is therefore not present here.
- **Bar height is about 68px, derived, not measured.** `py-3` (12 + 12) plus the 44px control measured above. The left block is shorter: 20 (total, `leading-none`) + 6 (`mt-1.5`) + 16 (meta line-height) = 42, so the button sets the height. Add 1px for the top hairline.
- **The document height is fully accounted for.** Last card bottom 1698 (band 5: 1423 + 275), plus the step container's `pb-32` = 128 (`ServicesStaffStep.tsx:476`), plus the page's `pb-6` = 24 (`page.tsx:261`), plus the layout `main`'s measured `0px 0px 56px` bottom padding, equals 1906, which is the measured `documentHeight` exactly.
- **That 56px reservation is not for this bar.** It is the layout's clearance for the global `BottomNav` (`app/[locale]/layout.tsx:117-123`), which `HideInBooking` removes on this route (`layout.tsx:169-171`, `HideInBooking.tsx:66`). The 128px `pb-32` on the step container is what actually clears this bar.

**The measured state is the empty cart.** The samples say "CHF" with a 0, and "0 Artikel". So the CTA was rendered disabled (`disabled={formData.services.length === 0}` with `disabled:opacity-50`, `ServicesStaffStep.tsx:596-598`). The script reads `backgroundColor`, not the element's opacity, so the measured `rgb(10, 10, 10)` is the token, and the pixels on screen at that moment were half-strength.

## Tokens

- Bar: `fixed bottom-0 left-0 right-0 border-t border-s-border bg-white z-40`
- Total: `font-body font-bold text-xl text-s-ink tabular-nums leading-none` (`text-xl` = 20px, which is the measured size and line-height)
- Meta: `text-xs text-s-ink-2 mt-1.5 tabular-nums` with a `ShoppingCart` 13px icon
- CTA: `px-6 py-3 rounded-btn bg-s-ink text-white font-heading text-sm font-semibold`, `hover:brightness-[1.06]`, `active:scale-[0.97]`, `disabled:opacity-50 disabled:cursor-not-allowed`. `rounded-btn` = 99px (`tailwind.config.js:254`), which is the measured radius.
- The CTA's trailing glyph is a chevron head that draws its shaft in on hover or press over 300ms on `ease-glide` (`ServicesStaffStep.tsx:601-604`).

## Interaction

- **Weiter:** validates that at least one service is selected, sets `isChecking`, then `goToStep(nextStep)` where `nextStep` is `'staff'` when the salon has more than one staff member and `'datetime'` otherwise (`ServicesStaffStep.tsx:169-177`, `BookingWizard.tsx:163`). No URL change.
- **Disabled** whenever the cart is empty or a check is in flight; a `Spinner` renders inside the same button while checking.
- **The total animates, the currency label does not.** `CountUpNumber` runs the number only; for French the label moves after the number because `fr-CH` is a suffix locale (`ServicesStaffStep.tsx:566-588`). Swiss thousands grouping and the two-decimal rule mirror `lib/format-currency.ts` (`ServicesStaffStep.tsx:76-85`).
- **Empty-cart error:** tapping Weiter with nothing selected sets an inline message rendered above the bar as `text-sm text-s-error text-center mt-4` (`ServicesStaffStep.tsx:169-172, 525-527`). Not measured, no error state existed at measurement.
- **The total is not tappable and does not open the line-item list.** `CORPUS.md` section 6 names that as the one motion idea worth stealing from the sample; recorded here as the current behaviour, not as a proposal.

## Against the floors

- **FLOORS LAW 3b, the sticky CTA floor: PASS.** The commit control lives in a `fixed bottom-0` bar (`ServicesStaffStep.tsx:562`), present at every scroll position from first paint, so it is reachable with zero scroll regardless of how many service rows precede it. CLAUDE.md names "the booking running-summary bar" as the existing implementation of this floor, and this is that bar.
- **Two fixed bars: not stacked.** `HideInBooking` removes the global `BottomNav` on this route, and the comment in `BottomNav.tsx:45-50` gives the sticky-CTA floor as the reason: the commit action owns the bottom slot.
- **Display anchor (FLOORS LAW 6, >= 28px): FAIL.** This band holds the largest type on the whole screen at 20px, 8px under the floor.
- **Anchor ratio (EMPHASIS BUDGET b, >= 1.8x body): FAIL.** 20 / 14 = 1.43x. Against the 15px row name it is 1.33x.
- **Bold share (EMPHASIS BUDGET a, <= ~30%): FAIL.** 3 of the 5 text nodes in this band are weight >= 600 (60%).
- **CTA text size:** measured 14px against the locked text-size row "CTA 15 (never <= 13 on a button)". 1px under the locked value and above the hard floor.
- **Button radius: PASS.** Measured 99 is `rounded-btn`.
- **Touch target: PASS.** Measured 44px high.
- **One ink commit per screen: PASS.** This is the only ink-filled control in the document flow (the ink category pill in `02` is a selection state, covered by its own dated override).
- **Trust floor (hierarchy-density-05): does not bind here.** It fires on a screen carrying a paid commit action. "Weiter" advances a step and takes no money; the paid commit lives on the pay step, which is a different folder.
- **No fabricated data: PASS.** The total, the item count and the duration are all reduced from `formData.services`.
- **FLOORS LAW 6, `s-ink-2` on load-bearing copy: FAIL.** The item count and total duration are 12px `#6B6B6B`, and both are load-bearing on a commit bar.
- **FLOORS LAW 1 item (b), exactly one element is clearly the biggest:** the 20px role has a count of 2, which is the "CHF" label plus the count-up number, one price read as one unit. The biggest thing on the screen is therefore chrome in a fixed bar, not content in the document.
- **FLOORS LAW 9, composed from the registry: not satisfied, and not yet a registry question.** The bar is inline (`ServicesStaffStep.tsx:561-608`) and no registry component owns this shape, so there is nothing to compose it from today. `CORPUS.md` section 7 lists it as an extraction candidate.

## Intentional deviations

- **`text-xl` (20px) rather than a display anchor.** The bar's number is deliberately the largest thing on a screen whose title was deliberately shrunk to 16.5px (mockup 26, owner-approved 2026-06-12). The two decisions together are why this screen has no 28px anchor anywhere in its document flow.
- **Count-up on the number only** (owner-approved 2026-07-18, comparison lab `public/_mockups/liftup-services-motion`): the CHF label stays static so nothing but the value moves.
- **No gradient fade above the bar,** which the locked shadow table lists for sticky bars. Confirmed absent by the measurement (no shadow, no radius). I did not find a dated decision removing it and I did not check the git history.

## Empty state

The bar renders in the empty-cart state, which is exactly what was measured: CHF 0, "0 Artikel", 0 Min, and the CTA disabled at half opacity. It is not hidden and it is not collapsed. That is the screen's resting state on arrival unless a `?service` or `?services` parameter seeded the cart (`lib/booking-context.tsx:97-110`).

## Provenance

- Mockup 20, owner-approved 2026-06-11 , the bottom summary bar as the flow's commit slot
- Owner 2026-07-18, `liftup-booking-services-tiered` and `liftup-services-motion` , the count-up, the draw-in arrow
- hierarchy-density-06 / FLOORS LAW 3b , the sticky-CTA floor this bar is the reference implementation of
- `BottomNav.tsx:45-50` , the global nav yields the bottom slot to this bar
