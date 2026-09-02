<!-- exists-check: extends _design-system/sections/confirmation/CORPUS.md pattern 1 (status as a
     mutating chip, 14 of 49), type note 3 (the green-headline contrast question) and Solen-gap items
     2, 3 and 4. `npm run exists "status chip"` returns one hit, a dev route
     (app/[locale]/dev/reports-view/_parts/Chips.tsx), so the chip the corpus recommends does not
     exist as a shared primitive and is NOT proposed here. -->

# Affirmation headline , section spec

**Reference:** `_design-system/sections/_measured/confirmation.json`, `bandAnatomy.headline`, `.noSuccessIcon` and `.entranceMotion` · `CORPUS.md` pattern 1, pattern 10, type note 3
**Component:** `components-legacy/booking/BookingConfirmation.tsx:449-456`
**Layer:** 1 chrome in the measured state. Layer 3 semantic in two of its three branches.

## Layout

```
y=418   Termin bestätigt!                    24 / 700 Inter Tight, ink
        left aligned, one line, no glyph beside it
y=446
```

## Measured

| item | value |
|---|---|
| headline | `h1`, [20, 418, 362, 28], 24px / 700 / Inter Tight, letter-spacing -0.48px, line-height 27.6 |
| colour | `rgb(10, 10, 10)`, ink |
| document title | "Termin bestätigt!", the same string, which is how the run confirmed it had the real screen and not the error state ("Diese Seite wurde abgeschnitten.") |
| glyph beside it | **none** |
| entrance | `confirm-rise`, 0.42s `cubic-bezier(0.16, 1, 0.3, 1)`, `animation-delay: 0.2s` |

**There is no success mark anywhere on this screen.** All 16 SVGs in the document were enumerated and every one is accounted for: 3 in the global header, 1 help widget, 2 in the salon row, 2 detail-row icons, 2 button icons, 1 chevron on the manage link, 4 in the bottom tab bar, 1 hidden X. No check, no green disc, no confetti. The confirmation is carried by this headline plus the hero photograph alone.

**The headline lands after the content below it.** Measured off the computed animation shorthand: the detail card and the price card carry `animation-delay: 0s`, the `h1` carries 0.2s, and the primary button carries 0.68s. So the two cards rise first, then the sentence that explains them, then the action.

## Tokens

- `celebrate-rise mt-6 font-display text-[24px] font-bold leading-[1.15] tracking-[-0.02em]`
- Colour is a three-way branch (`:451`): `text-s-error` when cancelled, `text-s-success` when paid, `text-s-ink` otherwise
- Copy branches on the same condition: `appointmentCancelled`, the booking-card `status.confirmed` string, or `title`
- `confirm-rise` is defined in `app/globals.css` alongside `confirm-pop`, `confirm-ring` and `confirm-draw`, with a `prefers-reduced-motion` block that lands on the final state. Only `celebrate-rise` is wired into this screen.

## Interaction

None. It is a heading.

## Against the floors

- **Display anchor (FLOORS LAW 6, >= 28px): FAIL for the headline at 24px, PASS for the screen.** The screen's anchor is the 29px price in `05`, which clears the floor. So this screen is not anchor-less, and it is the only one of the four in this pass that clears the floor at all. **`CORPUS.md` Solen-gap item 2 predicted exactly this from source and could not confirm it; measured, the declared 24px and 29px both paint as declared.**
- **Anchor ratio (EMPHASIS BUDGET b, >= 1.8x): PASS for the screen at 2.0x** (29 / 14.5, against the detail card's primary line). Against this headline alone it is 1.66x.
- **Contrast in the measured state: PASS.** Ink on white.
- **Contrast in the paid state: PASSES, with 0.30 of headroom, and that is the finding.** `text-s-success` is `#16A34A` at **3.30:1 on white**, below the 4.5:1 body floor. The headline is 24px bold, which clears WCAG's large-text threshold (>= 18.66px bold), so the applicable floor is 3:1 and it passes. It is legal today and it is one size change away from not being. **Not measured:** `payment_status` on every reachable booking is not `paid`, so the green headline never rendered.
- **Semantic colour used as text: this is the exception the contract warns about.** The design contract's own contrast block says success green is legal as an icon and never as body text. A 24px bold headline is not body text, so this is inside the letter of the rule and at the edge of it.
- **CORPUS pattern 10, the green check: DIVERGES, and the corpus supports the build.** 20 of 49 corpus screens carry a glyph and 17 of those are green or teal, but the four apps closest to Solen's aesthetic (Airbnb, Uber, Depop, Square Go) either skip it or draw it in ink. Solen skips it. Measured absent, and defensible.
- **CORPUS pattern 1, the mutating status chip: NOT ADOPTED.** Solen encodes state by recolouring the headline. The corpus recommends a chip in 14 of 49, notes that only 3 apps colour the headline itself while 46 keep it ink and put the colour on a glyph or a chip, and points out that a chip would free the headline to stay ink and remove the contrast dependency above. **`npm run exists "status chip"` returns one hit and it is a dev route**, so the chip does not exist as a shared primitive. Building one is a real proposal with a crowded naming neighbourhood (47 `badge` hits, 9 graveyard entries including an owner-rejected check-mark-inside-a-chip). Recorded, not proposed.

## Intentional deviations

- **One receipt position and size for every state**, with only colour and copy branching. That is the file's own stated intent (`:445-448`) and it is why a cancelled booking does not get a different layout.
- **`SuccessMark` exists, is animated, and is not used here.** `app/[locale]/_components/primitives/SuccessMark.tsx` is a green disc with a ring pulse and a drawn check. **Correction to the corpus, which claimed exactly one consumer:** grep on 2026-08-27 finds **two**, `app/[locale]/_components/tips/TipFlow.tsx:170` (a real customer surface) and `app/[locale]/dev/checkout-confirm/page.tsx`. So the primitive is not orphaned, and it is still not composed on the one screen whose whole job is confirming. Under FLOORS LAW 9 that is a live registry-versus-hand-built question rather than a dead component.

## Empty state

Three branches, one measured.

- **Confirmed and unpaid, MEASURED:** ink, `t('title')`, "Termin bestätigt!".
- **Paid: NOT MEASURED.** `payment_status` is `'none'` on this booking and only 11 of 998 seeded bookings carry a `payment_intent_id` at all. The green headline, and the `bg-s-success-bg` paid pill in `05` that goes with it, were never rendered.
- **Cancelled: NOT MEASURED.** `text-s-error` plus `appointmentCancelled`. Reachable two ways, a booking already cancelled server-side or a cancel that just succeeded on this page, and both read the same branch so the headline is never wrong either way.

## Provenance

- `CORPUS.md` type note 3 , the green-headline contrast question, computed and left legal
- `CORPUS.md` pattern 1 , the mutating status chip, recommended and not adopted
- `app/globals.css:510-525` , the `confirm-*` motion set with its reduced-motion fallback
