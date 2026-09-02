<!-- exists-check: extends _design-system/sections/checkout-pay/CORPUS.md section 1 slot 4 (the payment
     row), section 2 and section 7 item 6 (the promo gap), and answers the last with a rendered
     check. `npm run exists "pay confirm"` returns PayConfirmStep.tsx and one graveyard entry
     (app/[locale]/checkout, removed 2026-07-18 as an unreachable duplicate of this step). -->

# Payment choice (and the voucher field beside it) , section spec

**Reference:** `_design-system/sections/_measured/checkout-pay.json`, `bandAnatomy.paymentOptions` and `.overlapAtRest` · `CORPUS.md` sections 1, 2 and 7 item 6
**Component:** `components-legacy/booking/PayConfirmStep.tsx:585-660` (the three payment-mode branches) and `:673-703` (the voucher field)
**Layer:** 1 chrome, with one layer 2 accent disc

## Layout

The salon's `payment_mode` picks the branch. Only `at_salon` was measured.

```
AT_SALON, MEASURED, the customer chooses:

y=673  <payment eyebrow>                                    13 / 600 ink
y=686  +-------------------------------------------------+  370 x 78
       | (card)  Jetzt online bezahlen                   |  14 / 600, 2px INK border
       |  blue   Karte oder TWINT, sicher per Stripe     |  12.5 / 400 ink-2
       +-------------------------------------------------+
y=774  +-------------------------------------------------+  370 x 76
       | (store) Zahlung im Salon                        |  1px hairline
       |  sunken CHF 45 direkt vor Ort                   |
       +-------------------------------------------------+
y=850

DEPOSIT: a three-row bordered table, deposit now (22 / 700) over rest at salon over grand total
PREPAY: a centred block, label over a 28px amount over a sublabel
```

## Measured

| item | value |
|---|---|
| eyebrow | 13px / 600 / Inter / ink (this role's count of 2 is shared with the rating value in `02`) |
| selected option | [16, 686, 370, 78], radius 12, border **2px** `rgb(10, 10, 10)`, background white, padding 16 |
| unselected option | [16, 774, 370, 76], radius 12, border **1px** `rgb(228, 228, 231)`, background white, padding 16 |
| option title | 14px / 600 / Inter / ink / count 2 |
| option subline | 12.5px / 400 / Inter / `rgb(107, 107, 107)` / count 3 across the screen |
| gap between options | 10px (`gap-2.5`), measured 774 minus 764 |

**The selected card is 2px taller than the unselected one**, 78 against 76, because selection swaps a 1px border for a 2px one on all four sides. Derived and measured: 76 + 2 = 78. Selecting the lower option therefore shifts the layout by 2px. Small, and it is a real reflow on every tap.

**The fixed commit bar covers the lower half of the second option at rest.** The second option starts at doc y 774 and the bar's top edge sits at about viewport y 760 (the bar is 84 tall, ending at 844). The scroll container carries `pb-28`, so the content clears the bar once scrolled, and 237px of scroll is available. Recorded as measured, not judged.

## Tokens

- Option: `flex w-full items-center gap-3 rounded-[12px] bg-white px-4 py-4 text-left`, selected `border-2 border-s-ink`, unselected `border border-s-border`
- Icon discs: `h-10 w-10 rounded-full bg-s-accent-pale` with `CreditCard` in `text-s-accent` for online, `bg-s-bg-sunken` with `Store` in `text-s-ink` for in-salon. Both under the measurement script's 60px card filter, so their boxes are source values.
- Title `font-body text-[14px] font-semibold`, subline `font-body text-[12.5px] text-s-ink-2`
- Eyebrow: `mb-2 text-[13px] font-semibold text-s-ink`, normal case. No tracked uppercase anywhere, which the corpus counts in 7 apps and the copy rules ban by name.
- Voucher block, not rendered here: `rounded-input border border-s-border bg-s-bg-surface p-4` with a bare global input and a neutral-outline `h-11 rounded-full border` apply button, all three lifted verbatim from blocks already on this screen.

## Interaction

- Tapping an option sets `payChoice`. `aria-pressed` carries it. No radio dots, by mockup 24d.
- **The choice only exists when the salon's `payment_mode` is `at_salon`.** For `deposit` and `prepay` the screen renders a fixed ladder instead and `paymentMethod` is forced to `'online'` (`:179`). This is a Phase D decision: the pay step is driven by what the salon can actually take, after a repro on 2026-06-12 where the chooser offered online and the server then refused.
- **The online option is itself conditional** on `accepts_online_payment` (`:593`). A salon that cannot take money online shows one option, and the "choice" degrades to a statement.
- Choosing online routes the commit through a Stripe `PaymentIntent` and a second phase on the same screen; choosing in-salon creates the booking with no charge and goes straight to the confirmation. See `07`.

## Against the floors

- **Touch target: PASS.** 78 and 76 tall.
- **Selected state: DIVERGES from the locked contract, by a dated owner call.** The contract's locked row is a calm gray fill plus ink text plus semibold, and it names four exceptions, none of which is this. What renders is a 2px ink wrap on a white fill. The source records the decision in place: mockup 24d, ink, owner 2026-06-12, "selected = 2px ink wrap (no radio dots)". Precedence tier 1 over tier 5, so it stands. Two things are worth keeping visible: the `no-black-selected` rule targets an ink FILL and this is a border, so the gate is not being evaded; and this is now a third selected-state vocabulary in one product, after the gray fill and the blue booking date.
- **Locked radius: FAIL against the card literal.** The options measure 12 where the three cards above them measure 16. On one screen that gives 16, 16, 16, 12, 12, 9999. Nothing in the contract authorises 12 for a selectable card; 12 is the input radius.
- **Edge visibility: PASS by option (c).**
- **Sparse blue: PASS.** The one accent element here is a 40px icon disc in `s-accent-pale` with an accent glyph, which is a small non-text mark, not a fill on a control.
- **Copy economy: PASS.** Each option carries one line of consequence: what will happen, and with what instrument.
- **CORPUS section 7 item 6, the promo gap: CONFIRMED for promo, PARTLY CLOSED for vouchers, and both halves are worth stating.**
  - **There is no promo entry point on this screen.** `formData.promoCode` is initialised to `''` in `lib/booking-context.tsx:32` and read exactly once, at `PayConfirmStep.tsx:263`, where it is posted to `/api/bookings`. **No file in the booking flow ever writes it**, so it is always null on the wire. A parameter the server accepts and the UI can never set is the shape the NO DECORATION rule names: it looks wired and is not.
  - **There is a voucher entry point**, added 2026-07-18 (#19/#50), gated on `paymentMethod === 'online' && salonHasRedeemableVoucher`. It did not render in this run. Since the measured `paymentMethod` was online, the clause that failed is `salonHasRedeemableVoucher`, which was therefore false for this salon. Owner 2026-08-21 made that gate deliberate: the field is hidden where it could never work, which is the correct treatment of a dead affordance.

## Intentional deviations

- **Online is listed above in-salon and preselected**, mockup 24d, owner-approved 2026-06-12.
- **No saved-card row**, which `CORPUS.md` section 7 item 7 files as a genuine gap: Stripe's `PaymentElement` re-presents a full form to a returning payer where the corpus shows one line and a chevron. Unchanged, and out of scope for a measurement pass.
- **No fee-explanation affordance.** 12 corpus apps put an information glyph on tax and fee lines. Solen states the VAT, when there is one, and stops.

## Empty state

- **`deposit` and `prepay` branches: NOT MEASURED.** `cuts-and-culture` is `at_salon`. The deposit branch renders a 22px deposit figure and a green `ShieldCheck` line; the prepay branch renders a **28px** amount, which would be the only element in the whole booking flow that clears the 28px display-anchor floor. Neither was rendered, so neither is measured, and the 28px is a source value.
- **`accepts_online_payment` false:** one option renders instead of two.
- **Voucher field:** did not render. Its error state (`text-[12.5px] text-s-error`) and its applied state (a green savings line in `03`) are both unmeasured.

## Provenance

- Mockup 24d, owner-approved 2026-06-12 , online above salon, 2px ink wrap, no radio dots, icon discs
- Phase D , the salon's `payment_mode` drives the step rather than a free customer choice
- Owner repro 2026-06-12 , online is only offered when the salon can actually take it, with the pay-intent route as the fail-closed backstop
- Owner 2026-08-21 , the voucher field is hidden where the salon has no redeemable voucher
