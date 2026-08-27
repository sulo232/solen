<!-- exists-check: extends _design-system/sections/checkout-pay/CORPUS.md section 1 (46 of 52 screens
     put the commit at the bottom edge) and section 7 item 8, which recorded that "the production
     pay button is not sticky" and is scoped to walk-in-pay, not to this step. `npm run exists "pay
     confirm"` returns PayConfirmStep.tsx and one graveyard entry. -->

# Commit bar (Buchung bestätigen) , section spec

**Reference:** `_design-system/sections/_measured/checkout-pay.json`, `bandAnatomy.stickyBar`, `trustFloor.commitButton` and `trustFloor.adjacentDefectFound`
**Component:** `components-legacy/booking/PayConfirmStep.tsx:716-732`, with `handleConfirm` at `:200-359`
**Layer:** 1 (chrome)

## Layout

```
                                                        viewport y = 760
+---------------------------------------------------------------+  h = 84
|      [           Buchung bestätigen           ]                |
|              338 x 52, ink pill, 15 / 600                      |
+---------------------------------------------------------------+  y = 844
```

Full width inside a double inset: the bar's own `p-4` plus the inner column's `px-4`.

## Measured

| item | value |
|---|---|
| button | [32, 776, 338, 52], min-height 52, radius 9999, background `rgb(10, 10, 10)`, padding `0px 20px` |
| label | 15px / 600 / Inter / white / count 1 / "Buchung bestätigen" |
| bar | `fixed bottom-0 left-0 right-0 border-t border-s-border bg-white p-4 z-20`, so it is pinned at every scroll position |

Two derivations, with the arithmetic. **Button width 338** is 402 minus the bar's `p-4` (32) minus the inner column's `px-4` (32). **Bar height 84** is 52 plus two 16px paddings, which puts its top edge at viewport y 760.

## Tokens

- Bar: `fixed bottom-0 left-0 right-0 border-t border-s-border bg-white p-4 z-20`
- Inner: `max-w-2xl mx-auto px-4`
- Button: `w-full inline-flex items-center justify-center gap-2 min-h-[52px] px-5 rounded-full bg-s-ink text-white font-body text-[15px] font-semibold`, hover `brightness-[1.06]`, active `scale-[0.97]`, disabled `opacity-50 cursor-not-allowed`
- A `Spinner size="sm" invert` renders inside while `isSubmitting`, which is a real state here: the handler awaits a network round trip.

## Interaction

`handleConfirm` in order (`:200-359`):

1. Refuses with `selectPaymentMethod` if no method, with `fillRequiredFields` if date, time or services are missing.
2. For a guest, force-validates `GuestBookingForm` through its ref so field errors surface on press, and refuses if it fails.
3. **Guards a double create** with `chargeRef`, so a re-render or a double tap cannot post twice.
4. Refuses with `fillRequiredFields` if a logged-in user has no name or fewer than 9 phone digits.
5. Best-effort `PATCH /api/profile` with the contact, then `POST /api/bookings`. No client price is trusted: the server recomputes, and `bundle_id` only selects which bundle to price against.
6. **In person:** `resetForm()` then `router.replace` to `/{locale}/confirmation?booking_id=...`. `replace`, not `push`, so browser back cannot re-enter an armed flow and book again. That is a dated owner fix, 2026-06-12, "they can just click back and book as many times as they want", with a server-side `DUPLICATE_BOOKING` guard as the backstop.
7. **Online:** creates a `PaymentIntent` for that booking and switches this same screen to `phase: 'pay'`, which replaces everything from the contact block down with the Stripe card form. The booking already exists at that point, as `pending` with `payment_status: 'none'`, and an abandon-sweep cron cancels it if the card step is never completed.

**Nothing was pressed in the measurement run.** The record stops at step 12 of `reachedBy`: no booking was created and nothing was written.

## Against the floors

- **Sticky CTA (FLOORS LAW 3b): PASS.** `fixed bottom-0`, on screen at every scroll position from first paint. **`CORPUS.md` section 7 item 8 says the opposite** ("the production pay button is not sticky, only the `?demo` path gets the bottom-anchored CTA"), and that claim is scoped to `app/[locale]/walk-in-pay/page.tsx`, which is a different route. On the booking pay step the button is sticky, measured. The corpus item is not wrong, it is about the other surface.
- **Touch target: PASS.** 338 x 52.
- **Locked radius: PASS**, a pill commit.
- **Locked CTA colour: PASS.** `bg-s-ink`, the one primary commit per screen. `CORPUS.md` section 7 item 1 backs it from the field: Fresha's Confirm is black on both platforms, Uber's is black, Etsy's near black.
- **Contrast: PASS.** White on `#0A0A0A`.
- **Overlap at rest: the bar covers the lower half of the second payment option** and sits 26px below the cancellation term at scrollY 0. Measured, recorded in `05` and `06`.
- **Trust floor: this button is what the three conditions are measured against.** (a) PASS, (b) PASS on the letter with two caveats, (c) PASS. Full evidence in `03`, `06` and `02`.

## The label defect, measured on this screen

**The commit label never says money is about to be taken, and it does not change when the customer changes how they pay.** It reads "Buchung bestätigen" with "Jetzt online bezahlen" selected, and it still reads "Buchung bestätigen" after tapping "Zahlung im Salon". Verified by reading the label before and after the tap, in the same session.

The cause is one line of routing (`:725-731`):

```
paymentMode === 'at_salon' ? tp('confirmBooking')
  : paymentMode === 'deposit' ? `${tp('payDeposit')} ${amount}`
  : `${t('payment.continueToPayment')} ${amount}`
```

The label keys on **`paymentMode`**, which `:161-162` derives from `salons.payment_mode`. The customer's own choice lives in a different variable, **`payChoice`**, which `:179` folds into `paymentMethod`. The label never reads `payChoice`, so on any `at_salon` salon the "Weiter zur Zahlung CHF 45" branch is unreachable, including for the customer who just chose to pay online and will be sent to a card form by the very next tap.

This is not one of the three trust-floor conditions. It is recorded here because it was measured on the same screen and it is a trust problem of the same family: the button under a price does not say what pressing it does.

## Intentional deviations

- **One commit control, ink, no secondary beside it.** 16 of 52 corpus screens carry a filled primary at all and only 4 of those are ink; Solen is with Airbnb, which uses black for exactly this post-decision moment.
- **`replace` rather than `push` on success**, a dated owner fix rather than a routing preference.

## Empty state

None. The button always renders in `phase: 'select'` and is never disabled except while submitting. Every refusal is a validation message in the shared error line above it, not a disabled state, which is a deliberate difference from the other three steps of this flow: there, `Weiter` greys out until its inputs are satisfied.

## Provenance

- Mockup 24d, owner-approved 2026-06-12 , the sticky ink commit at the bottom edge
- Owner 2026-06-12 , `resetForm` plus `replace` so browser back cannot re-book
- Owner 2026-07-02 , `replace` not `push`, "after you book, click back it jumps you into the search version"
- C1 , the `chargeRef` double-create guard
- Taste rule 3 and V3-D192-fix , the one primary commit stays ink
