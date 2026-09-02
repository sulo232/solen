<!-- exists-check: extends _design-system/sections/confirmation/CORPUS.md dominant-anatomy slot 7
     (money), type note 4 (money is right-aligned and column-aligned in every screen that shows a
     breakdown) and Solen-gap item 2, which reads the 29px total from source and could not confirm
     it paints. `npm run exists confirmation` returns 10 hits. -->

# Money card (Gesamtpreis) , section spec

**Reference:** `_design-system/sections/_measured/confirmation.json` band index 3 and `bandAnatomy.priceCard` · `CORPUS.md` slot 7, type note 4, Solen-gap item 2
**Component:** `components-legacy/booking/BookingConfirmation.tsx:530-568`
**Layer:** 1 chrome in the measured state. Layer 3 semantic in the paid branch.

## Layout

```
y=709  +-------------------------------------------------+  362 x 77, radius 16
       | Gesamtpreis                                     |  13 ink-2
       | Im Salon bezahlen                    CHF 28     |  13 ink-2  |  29 / 700
       +-------------------------------------------------+
y=786
```

Two-line label column on the left, one large number on the right, baselines aligned to the bottom (`items-end`).

## Measured

| item | value |
|---|---|
| card | [20, 709, 362, 77], radius 16, border 1px `rgb(228, 228, 231)`, background white, padding 16, shadow `rgba(50, 47, 44, 0.09) 0px 2px 8px` |
| label | "Gesamtpreis", 13px / 400 / Inter / `rgb(107, 107, 107)` |
| sub-label | "Im Salon bezahlen", 13px / 400 / `rgb(107, 107, 107)` |
| amount | **29px / 700** / Inter Tight / `rgb(10, 10, 10)`, letter-spacing -0.58px, line-height 29, `font-variant-numeric: tabular-nums` |

**29px is the largest text on this screen and the largest in this whole four-screen pass.** It clears the 28px display-anchor floor by one pixel. `CORPUS.md` Solen-gap item 2 read `text-[29px]` from source and said "I did not render the page, so I have not confirmed these declared sizes paint as declared". Confirmed: they do.

## Tokens

- Card: `celebrate-rise mt-4 rounded-card border border-s-border bg-white p-4 shadow-elevation-2`
- Label and sub-label: `text-[13px] text-s-ink-2`
- Amount: `shrink-0 font-display text-[29px] font-bold leading-none tracking-[-0.02em] tabular-nums text-s-ink`
- Paid pill, not rendered here: `mt-1 inline-flex items-center gap-1.5 rounded-pill bg-s-success-bg px-2.5 py-[3px] text-[13px] font-semibold text-s-success` with `Check size={13} strokeWidth={2.6}`
- The label switches between `totalInclVat` and `total` on `showVat`, which is `isPaid && vatRate > 0` (`:187`)

## Interaction

None. Static.

## Against the floors

- **Display anchor (FLOORS LAW 6, >= 28px): PASS at 29px.** The only band in this four-screen pass that clears it, by one pixel.
- **Anchor ratio (EMPHASIS BUDGET b, >= 1.8x): PASS at 2.0x** against the detail card's 14.5px primary line, and 2.23x against the 13px labels.
- **Locked radius: PASS**, 16.
- **Elevation: same note as `04`.** `shadow-elevation-2` plus a hairline is one signature more than the contract's surface table allows, in the direction the Edge-Visibility floor prefers.
- **Tabular figures: PASS**, measured on the computed style rather than assumed.
- **Right-aligned money: PASS.** `CORPUS.md` type note 4 records that money is right-aligned in every corpus screen with a breakdown.
- **The largest number on the screen is the price, which the corpus says is unusual.** A price is the anchor in 1 of 49 corpus apps (American Airlines). The corpus's recommendation is that on a booking confirmation the date and time deserve the anchor instead, since the one thing the customer must retain is when to show up, and 4 of 49 apps do that including Fresha. Measured, Solen's ladder is price 29, headline 24, salon 17, when 14.5. **The date and time is the fourth tier.** Recorded as a live corpus recommendation, not adopted, and not decided here.
- **No fabricated data: PASS.** Every figure is `props.priceLabel` and `props.paidNowLabel`, computed server-side in `app/[locale]/confirmation/page.tsx`.

## Intentional deviations

- **White card, never the sunken token**, named in the source (`:529`): the amount owed is the hero number of this card, and sunken is the selected-state colour elsewhere.
- **One number, no ladder.** The pay step one screen earlier renders a line item, an optional VAT row and a total; this screen renders a single total and a status sub-label. That is defensible on a receipt whose ladder the customer has already seen and approved, and it means a customer who arrives at this URL later, from an email, never sees the breakdown at all.

## Empty state

Three branches, one measured, and the two unmeasured ones are both gated on data no seeded row carries.

- **Unpaid, MEASURED:** label "Gesamtpreis", sub-label `paidInPerson`, one 29px amount.
- **Paid: NOT MEASURED.** `payment_status` is `'none'` here and only 11 of 998 seeded bookings carry a `payment_intent_id`. The green `bg-s-success-bg` pill with its check, the `totalInclVat` label variant and the green headline in `03` all belong to this branch and none of them rendered.
- **Split payment (deposit online plus a remainder at the salon): NOT MEASURED.** The branch at `:531` needs `remainingAtSalonLabel`, and **exactly 1 of 998 rows has `remaining_at_salon` set.** It renders a different shape entirely: a small "paid online now" row, a rule, then "rest at salon" with the 29px number attached to the REMAINDER rather than to the total.
- **VAT label variant: NOT MEASURED.** `showVat` needs `isPaid` and a non-zero rate; this booking's `vat_rate` is null and 0 of 28 salons is VAT registered.
- **Confirming (an online payment still settling):** a third sub-label, `paymentConfirming`. Not measured.

## Provenance

- `CORPUS.md` slot 7 and type note 4 , money position and alignment
- `CORPUS.md` Solen-gap item 2 , the 29px total confirmed to paint as declared, and the date-as-anchor recommendation left open
- Source note `:501-502` , the service row shows the service price and this card shows the paid figures, never mixed
