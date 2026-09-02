<!-- exists-check: extends _design-system/sections/booking-datetime/CORPUS.md section 4 (the commit
     row) and the same bottom-bar drift table recorded in
     _design-system/sections/booking-staff/03-continue-bar.md, which this file's measurement
     completes. `npm run exists "date time step"` returns DateTimeStep.tsx. -->

# Weiter (fixed bottom bar) , section spec

**Reference:** `_design-system/sections/_measured/booking-datetime.json`, `bandAnatomy.stickyBar` and `.continueCta`, plus `.slotPillSelected.continueCtaAfterSlotPick`
**Component:** `components-legacy/booking/DateTimeStep.tsx:266-277`
**Layer:** 1 (chrome)

## Layout

```
                                                        viewport y = 771
+---------------------------------------------------------------+  h = 73
|  [                     Weiter                     ]            |
|                   370 x 48, full width, ink pill               |
+---------------------------------------------------------------+  y = 844
```

Full width, no running total beside it. The staff step one step earlier puts a 113px button on the right with a price on the left.

## Measured

| item | value |
|---|---|
| bar | [0, 771, 402, 73], background `rgba(255, 255, 255, 0.95)`, border-top 1px `rgb(228, 228, 231)` |
| CTA | [16, 784, 370, 48], radius 99, background `rgb(10, 10, 10)`, padding `14px 0px` |
| CTA label | 14px / 600 / Inter Tight / white / count 1 / "Weiter" |
| disabled | opacity 0.5, until a time slot is picked |
| enabled | opacity 1, measured immediately after the 10:00 pill was tapped |

The disabled and enabled readings are both measured, in the same session, before and after one tap. The gate is `!selectedDate || !selectedTime || isChecking` (`:270`), so picking a day alone does not enable it.

## Tokens

- Bar: `fixed bottom-0 left-0 right-0 z-40 border-t border-s-border bg-[--raised]`
- Inner: `max-w-2xl mx-auto px-4 py-3`
- CTA: `flex w-full items-center justify-center gap-2 rounded-btn bg-s-ink py-3.5 font-heading text-sm font-semibold text-white`, hover `brightness-[1.06]`, active `scale-[0.98]`, disabled `opacity-50 cursor-not-allowed`
- A `Spinner size="sm" invert` renders inside the button while `isChecking`. That flag is set and cleared inside one synchronous `handleContinue`, so the spinner has no reachable rendered state.

## Interaction

- `handleContinue` validates in order: no date sets the error `tDate('selectDate')`, no time sets `tTime('selectTime')`, then `goToStep(nextStep)`. Both errors render in the shared inline error line above the bar, not in the bar.
- **`nextStep` is not always the pay step.** The wizard passes `'hair'` when any cart service is in `HAIR_CATEGORIES` (coiffeur, barbershop) and `'confirm'` otherwise (`BookingWizard.tsx:167`). On the measured salon every service is `barbershop`, so `Weiter` here lands on "Ihre Haare" and the pay step is one more tap away. The button label says nothing about that.
- No fetch, no URL change.

## Against the floors

- **Sticky CTA (FLOORS LAW 3b): PASS.** `fixed bottom-0`, on screen from first paint.
- **Touch target: PASS.** 370 x 48.
- **Locked radius: PASS.** `rounded-btn` measures 99.
- **Disabled state (locked): PASS.** `opacity-50 cursor-not-allowed`, exactly the contract's literal.
- **FLOORS LAW 8, the same thing looks the same everywhere: FAIL, and this band is one of the four copies.** Measured differences against the staff step's bar, one step earlier in the same flow: 73px tall against 69, a 370 x 48 full-width button against a 113 x 44 right-aligned one, `bg-[--raised]` rendering `rgba(255, 255, 255, 0.95)` against an opaque `rgb(255, 255, 255)`, and no running total at all where the previous step showed one. The full table of all four bars is in `booking-staff/03-continue-bar.md`.
- **The running total disappears at exactly the step where the price could change.** The staff step shows "CHF 45 / 1 Artikel / 30 Min" in its bar; this step shows nothing, then the pay step shows the total again inside a card. Recorded as measured, not judged.

## Intentional deviations

- **No count-up total on this step.** Nothing in the dated decisions asks for the total to be dropped here; it is a difference between two hand-built bars rather than a decision recorded anywhere in the source.

## Empty state

None. The bar renders in every state of the step, disabled until a slot is picked.

## Provenance

- hierarchy-density-06 / FLOORS LAW 3b , the sticky-CTA floor
- Design contract, disabled , `opacity-50 cursor-not-allowed`
