<!-- exists-check: extends _design-system/sections/checkout-pay/CORPUS.md (read in full first) and
     _design-system/sections/booking-service/01-step-chrome.md, which owns the shared anatomy of this
     same component. Only this step's own numbers and back target are recorded here. `npm run exists
     "pay confirm"` returns PayConfirmStep.tsx plus one graveyard entry (app/[locale]/checkout, a
     748-line standalone Stripe page removed 2026-07-18 as an unreachable duplicate of this step). -->

# Booking step chrome on the pay step (back, title, exit) , section spec

**Reference:** `_design-system/sections/_measured/checkout-pay.json` band index 1, measured live at 402x844, settled, HTTP 200 · `CORPUS.md` section 1 slot 1 ("Title bar, back left, X right")
**Component:** `components-legacy/booking/BookingWizard.tsx:186-218` · `components-legacy/booking/BookingExitButton.tsx`
**Layer:** 1 (chrome)
**Owning spec:** `_design-system/sections/booking-service/01-step-chrome.md`

## Layout

```
+---------------------------------------------------------------+   y = 12
|  ( <- )          Bestätigen & Zahlen                  ( X )   |   h = 52
+---------------------------------------------------------------+   y = 64
   44x44          16.5px / 600 centred                 44x44
```

## Measured

| item | value |
|---|---|
| band box | top 12, left 16, width 370, height 52 |
| surface | background `rgba(0, 0, 0, 0)`, padding `4px 0px`, radius 0 |
| title | 16.5px / 600 / Inter Tight / `rgb(10, 10, 10)` / line-height 24.75 / letter-spacing -0.165px / count 1 / "Bestätigen & Zahlen" |
| title box | [60, 26, 282, 25] |

The title is the only element of this band and it is 282px wide in a 370px row, so the two 44px controls plus their gaps take the remaining 88.

## Tokens

`font-heading text-[16.5px] font-semibold tracking-[-0.01em] text-s-ink`, `min-w-0 flex-1 truncate text-center`. Controls as in the owning spec.

## Interaction

- Back steps to the previous entry in `STEPS`. On the measured salon that is the hair step ("Ihre Haare"), not the date step, because every service at `cuts-and-culture` is category `barbershop` and `HAIR_CATEGORIES` inserts a fifth step. On a salon with no hair services it is the date step.
- **The X is the only control on this screen that can lose a filled cart**, and it raises a full-screen confirm before doing so (`BookingExitButton.tsx:76-79`). Browser back and tab close get the same guard.
- The summary card below has its own three "Ändern" links, which jump back to specific steps without leaving the flow. See `02`.

## Against the floors

- **Display anchor (FLOORS LAW 6, >= 28px): FAIL.** 16.5px, 11.5px under. The largest text on this screen is the 22px total in `03`.
- **Anchor ratio (EMPHASIS BUDGET b): FAIL for this band.** 16.5 / 14 = 1.18x.
- **Touch target: PASS**, both controls 44 x 44.
- **CORPUS section 1 matched.** The corpus's dominant mobile order opens with a title bar carrying back on the left and X on the right. Solen matches slot 1 exactly.

## Intentional deviations

- 16.5px by dated owner call (mockup 26, 2026-06-12), tier 1 over the tier-5 floor. See the owning spec.
- **No step counter on a paid step.** The corpus does not require one either; only the title names where the user is.

## Empty state

None.

## Provenance

- Mockup 20, owner-approved 2026-06-11 · Mockup 26, owner-approved 2026-06-12 · 2026-08-10 back-control match
