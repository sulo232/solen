<!-- exists-check: extends _design-system/sections/checkout-pay/CORPUS.md section 1 (44 of 52 screens
     show a multi-line ladder), section 4 ("only the Total row steps up") and section 7 item 10 (the
     open display-anchor collision, which recommends promoting the Total). `npm run exists "pay
     confirm"` returns PayConfirmStep.tsx and one graveyard entry. -->

# Price ladder card (line items, VAT, Total) , section spec

**Reference:** `_design-system/sections/_measured/checkout-pay.json`, `bandAnatomy.priceCard` and `trustFloor.a_priceBreakdown` · `CORPUS.md` sections 1, 4 and 7 item 10
**Component:** `components-legacy/booking/PayConfirmStep.tsx:461-504`
**Layer:** 1 (chrome). The only chromatic thing this card can render is a green savings line, and it did not render here.

## Layout

```
y=370 +-----------------------------------------------------+  370 x 109
      | Herrenschnitt                             CHF 45    |  14 / 400
      | (VAT line, only when the salon is registered)       |  13px ink-2
      | (voucher / credit lines, only after the intent)     |  13px success
      +--------------------- hairline ----------------------+
      | Total                                     CHF 45    |  15 / 600  |  22 / 700
      +-----------------------------------------------------+
y=479
```

Right-aligned value column, one rule above the total, nothing else.

## Measured

| item | value |
|---|---|
| card | [16, 370, 370, 109], radius 16, border 1px `rgb(228, 228, 231)`, background white, padding 16, shadow `rgba(50,47,44,0.04) 0 1px 3px` + `rgba(50,47,44,0.03) 0 1px 2px` |
| line item label | 14px / 400 / Inter / ink / "Herrenschnitt" |
| line item amount | [318, 387, 51, 21], 14px / 400, tabular |
| total row | [33, 418, 336, 44], border-top 1px `rgb(228, 228, 231)`, padding-top 10, margin-top 10 |
| total label | 15px / 600 / Inter Tight / ink / "Total" |
| total amount | [294, 429, 75, 33], **22px / 700** / Inter Tight / `rgb(10, 10, 10)`, tabular, letter-spacing -0.22px |

**Card height 109 decomposes as** 16 (`p-4`) + 21 (line item) + 10 (`mt-2.5`) + 1 (rule) + 10 (`pt-2.5`) + 33 (total) + 16 = 107, two pixels short of the measured 109; the residue is the `space-y-1.5` and the line-height rounding on the two rows. Recorded as an approximate reconciliation rather than an exact one.

## Tokens

- Card: `rounded-card border border-s-border bg-white p-4 shadow-elevation-1`, identical to the summary card above it
- Line items: `flex items-baseline justify-between gap-3 text-[14px]`, label truncates, amount `shrink-0 tabular-nums`
- Total row: `mt-2.5 flex items-baseline justify-between gap-3 border-t border-s-border pt-2.5`
- Total label: `font-heading text-[15px] font-semibold text-s-ink`
- Total amount: `font-heading text-[22px] font-bold tabular-nums tracking-[-0.01em] text-s-ink`
- Savings lines (voucher, credit): the same 13px row as the VAT line with `text-s-success` swapped in, an exact reuse rather than a new treatment (`:475-491`)

**One stale comment, corrected here rather than in code.** The source comment above this card (`:460`) describes it as ending in a "blue total", and the same phrase appears in the summary card's comment (`:373`). The rendered total is ink `rgb(10, 10, 10)`. The comment is stale; the render is correct against the locked palette, which keeps blue off prices.

## Interaction

None. Every element of this card is static text. The only thing that changes it is a voucher applied in `05`'s neighbour block, which rewrites the total from `payIntentSummary` after the server responds, never from a client guess.

## Against the floors

- **Trust floor condition (a), the total price is broken down: PASS.** Checked against the rendered DOM. Two money rows exist in the document, not only in an i18n object: the line item "Herrenschnitt / CHF 45" at doc y 387, and the total "Total / CHF 45" at y 418 after a rule. The rendered total equals the rendered line item, so nothing is added after the fact and the PBV total-price rule is satisfied.
- **VAT: correctly absent, and its rendering is unproven.** The floor says "VAT where applicable". The row is gated on `salonVatRegistered` (`:469`), which reads `salons.vat_registered`; `cuts-and-culture` has it false with a null `vat_number`, so no VAT is applicable and no row is due. A search of the rendered body for MWST, Mehrwertsteuer, VAT, "inkl." and "exkl." returned nothing, which matches. **The render site is real JSX and 0 of the 28 seeded salons has `vat_registered = true`, so this run is not evidence that the VAT row renders correctly for a registered salon.** Proving that needs a seeded VAT-registered salon, and the measurement pass was read only.
- **Surcharge: none due and none rendered.** One service at list price. Not evidence about how a surcharge would render.
- **Display anchor (FLOORS LAW 6, >= 28px): FAIL by 6px, and this band holds the screen's largest type.** The total is 22px. `CORPUS.md` section 7 item 10 names this as an open collision and recommends promoting the total to the anchor rather than inventing a headline, on the grounds that only 2 of 52 field checkouts carry a display number at all. **The recommendation is still unactioned:** measured at 22px on 2026-08-27, unchanged from the source reading the corpus took on 2026-07-29.
- **Anchor ratio (EMPHASIS BUDGET b, >= 1.8x): FAIL at 1.57x** (22 / 14).
- **The total does step up, which the corpus asks for: PASS.** Label 15px / 600 against an amount at 22px / 700, so the total gains both size and weight over the 14px / 400 line items. The corpus records that in the 44 ladder screens label and value share a size and only the total steps, which is exactly what is measured here.
- **Tabular figures: PASS**, on both the line item and the total.
- **Locked radius and shadow: PASS**, 16 and the two-layer whisper, same as `02`.
- **Edge visibility: PASS by option (c).**
- **Right-aligned, non-wrapping value column: PASS.** All 44 corpus ladder screens do this; measured amount boxes are `shrink-0` and sit at x 318 and 294.

## Intentional deviations

- **22px rather than 28px, and the corpus supports the build over the floor.** `CORPUS.md` section 7 item 5 files the 22px total as convergence rather than laziness, because only 2 of 52 field checkouts carry a display anchor. Item 10 then names the collision honestly and leaves the call to the owner: promote the total, or write a checkout exemption into FLOORS LAW the way imagery already exempts "forms, checkout payment step, legal, receipts". **No decision is made here.** The measured fail is recorded raw.
- **No promo entry point in this card.** A voucher field exists on this screen but lives outside the card, is gated on the salon having a redeemable voucher, and did not render. See `05`.

## Empty state

The card cannot be empty: it is only reachable with at least one service in the cart. Three rows that exist and did not render:

- **VAT line** (`:469-473`), needs `vat_registered` true and a non-zero rate. No seeded salon qualifies.
- **Voucher line** (`:480-485`) and **credit line** (`:486-491`), both need a `payIntentSummary` returned by the server with a non-zero applied amount, which only exists after the pay intent is created. Neither is a client-side preview, deliberately.
- **Deposit and prepay ladders** are a different component path entirely (`:630-659`), not this card. See `05`.

## Provenance

- Mockup `booking-pay-step`, owner-approved 2026-06-11 , the walk-in-pay price-card pattern
- Voucher and credit lines, 2026-07-18 (#19/#50/#52) , an exact reuse of the VAT row, no new size or colour
- hierarchy-density-05 / LOCKFILE §17.6 , the trust floor, whose condition (a) this card answers
- PBV total-price rule , statutory tier 2 in the precedence chain, above any taste axis
