<!-- exists-check: extends _design-system/sections/booking-datetime/CORPUS.md (read in full first) and
     _design-system/sections/booking-service/01-step-chrome.md, which owns the shared anatomy of this
     same component on step 1. Only this step's own numbers and its own back target are recorded
     here. `npm run exists "date time step"` returns one hit, DateTimeStep.tsx. -->

# Booking step chrome on the date step (back, title, exit) , section spec

**Reference:** `_design-system/sections/_measured/booking-datetime.json` band index 1, measured live at 402x844, settled, HTTP 200 · `CORPUS.md` section 6, first bullet
**Component:** `components-legacy/booking/BookingWizard.tsx:186-218` · `components-legacy/booking/BookingExitButton.tsx`
**Layer:** 1 (chrome)
**Owning spec:** `_design-system/sections/booking-service/01-step-chrome.md`

## Layout

```
+---------------------------------------------------------------+   y = 12
|  ( <- )              Datum & Zeit                     ( X )   |   h = 52
+---------------------------------------------------------------+   y = 64
   44x44          16.5px / 600 centred                 44x44
```

## Measured

| item | value |
|---|---|
| band box | top 12, left 16, width 370, height 52 |
| surface | background `rgba(0, 0, 0, 0)`, padding `4px 0px`, radius 0 |
| title | 16.5px / 600 / Inter Tight / `rgb(10, 10, 10)` / line-height 24.75 / letter-spacing -0.165px / count 1 / "Datum & Zeit" |
| title box | [60, 26, 282, 25] |

## Tokens

`font-heading text-[16.5px] font-semibold tracking-[-0.01em] text-s-ink`, `min-w-0 flex-1 truncate text-center`. Controls as in the owning spec.

## Interaction

- Back steps to the previous step in the `STEPS` array (`BookingWizard.tsx:156-158`). On a salon with more than one stylist that is the staff step; on a salon with one or none it is the service step, because `'staff'` is only in the array when `staffList.length > 1`.
- **There is a second, separate control on this screen that also returns to the staff step**, the stylist pill in `02`. Two affordances, one destination, on one screen.

## Against the floors

- **Display anchor (FLOORS LAW 6, >= 28px): FAIL.** 16.5px `h1`, 11.5px under.
- **Anchor ratio (EMPHASIS BUDGET b): FAIL for this band.** 16.5 / 14 = 1.18x.
- **Touch target: PASS**, both controls 44 x 44.
- **CORPUS section 6 answered.** The corpus found the step title to be "visibly the largest text on the screen by a wide margin" in Fresha, Airbnb and Careem, and named that as the shape Solen's floors ask for. Measured here: the title is the fourth largest thing on the screen, behind the 22px day number, the 18px section headings and nothing else. The corpus's expectation and the build disagree.

## Intentional deviations

- 16.5px by dated owner call (mockup 26, 2026-06-12). Precedence tier 1 over FLOORS LAW at tier 5. See the owning spec.

## Empty state

None.

## Provenance

- Mockup 20, owner-approved 2026-06-11 · Mockup 26, owner-approved 2026-06-12 · 2026-08-10 back-control match
