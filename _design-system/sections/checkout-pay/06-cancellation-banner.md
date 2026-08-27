<!-- exists-check: extends _design-system/sections/checkout-pay/CORPUS.md section 1 (22 of 34 booking
     screens render a cancellation term on the checkout surface) and section 6. This band is the
     one the trust floor's condition (b) turns on, and the named prior failure it exists to prevent
     is app/[locale]/walk-in-pay/page.tsx, which defined cancelPolicy in four locales with zero JSX
     render sites (fixed 2026-07-27). -->

# Cancellation term banner , section spec

**Reference:** `_design-system/sections/_measured/checkout-pay.json`, `bandAnatomy.cancellationBanner` and `trustFloor.b_cancellationTermAboveCommit` · `CORPUS.md` section 1, booking-domain frequencies
**Component:** `components-legacy/booking/PayConfirmStep.tsx:706-711`
**Layer:** 3 (semantic green on the glyph), on layer 1 text

## Layout

```
y=870   (shield)  Kostenlos bis 24h vorher stornieren.
         14px       12.5 / 400 ink-2, line-height 1.5
         green
```

No card, no fill, no rule. Two elements on a bare surface, inset 4px from the gutter by `px-1`.

## Measured

| item | value |
|---|---|
| icon | [20, 872, 14, 14], `rgb(22, 163, 74)`, Lucide `ShieldCheck` size 14 `strokeWidth 1.6` |
| text | [42, 870, 214, 19], value "Kostenlos bis 24h vorher stornieren.", 12.5px, line-height 1.5, `rgb(107, 107, 107)` |
| position vs the commit button | doc y 870 against a commit button pinned at viewport y 776 |

The rendered `rgb(22, 163, 74)` is `#16A34A`, the locked normal-green success token, not the rejected deep `#15803D`.

The "24h" in the string is data: `cancellationHours = salon.cancellation_window_hours ?? 24` (`:141`), interpolated into `tp('cancellationPolicy', { hours })`. The measured salon stores 24, so the rendered number is the salon's own value and not a hardcoded default.

## Tokens

- Wrapper: `flex items-start gap-2 px-1`
- Icon: `mt-[2px] shrink-0 text-s-success`, `ShieldCheck size={14} strokeWidth={1.6}`
- Text: `font-body text-[12.5px] leading-[1.5] text-s-ink-2`

## Interaction

None. It is static text. Nothing expands, links, or opens a policy sheet.

## Against the floors

**Trust floor condition (b), the cancellation or refund term renders in the DOM above the commit button: PASS on the letter, with two caveats worth acting on.** Checked against the rendered DOM, not against source strings.

- **The evidence for the pass.** The term is real JSX with live text in it. In the rendered document the text node reads "Kostenlos bis 24h vorher stornieren." at doc y 870, and `compareDocumentPosition` puts it BEFORE the commit button in DOM order. **This is not the `walk-in-pay` failure**: that file defined `cancelPolicy` in all four locale objects with zero JSX render sites, and this one has a render site with live text in it.
- **Caveat 1, it is below the fold while the button is not.** At 402x844 and scrollY 0 the term sits at doc y 870, which is 26px past the 844px fold, while the commit button is pinned on screen at viewport y 776 at every scroll position. **The button is reachable before the term has ever been on screen.** The document is 1081 tall, so 237px of scroll exists and the term does come into view at full scroll (viewport y 633, clear of the bar). The floor's words are "renders in the DOM above the commit button", and it does: the ordering is right and the visibility is not.
- **Caveat 2, the rendered term states only the free half of the policy.** The salon row carries `late_cancel_fee_percent = 50`, so cancelling inside the 24 hours costs half the price, and **no rendered string on this screen says so.** `cancellation_fee_type` is `'free'` and `free_cancel_hours` is 24 on this salon, both read from the live database. A customer reads a sentence that is true and incomplete: it names the window and not the consequence of missing it. The corpus is direct about this, and it is the sharper half of its finding: every app in the 15 that takes real money with a real penalty names the penalty, Resy to the franc, Marriott to the fee and the deadline, Airbnb to the date and the non-refundable consequence.

Other floors:

- **Semantic colour (FLOORS LAW 1 item d): PASS, and this is the screen's only success-hued element.** `#16A34A` at 3.30:1 on white is legal as an icon and illegal as body text, which is exactly how it is used: the glyph is green and the sentence is `s-ink-2`.
- **Contrast: PASS.** The text is `#6B6B6B` at 5.33:1 on white. At 12.5px it is small text and it clears the 4.5:1 body floor.
- **Copy economy: PASS on length, FAIL on completeness.** One line, no padding. See caveat 2.
- **No decorative artifact: PASS.** The shield carries meaning, and there is no separator dot beside it.

## Intentional deviations

- **Below the payment options rather than above them**, by mockup 24c/24d, owner-approved 2026-06-12. That placement is what puts it below the fold on a 844px viewport. The dated call is about order, not about visibility, and the two came apart once the screen grew to 1081px.
- **No card, no tint.** The corpus's Tock renders the same content as a full paragraph in a tinted block. Solen's is one quiet line, which is consistent with the rest of this screen and with the copy rules.

## Empty state

None reachable. `cancellationHours` falls back to 24 when the salon stores nothing, so the line always renders with a number. There is no branch in which this band is absent, which is the correct behaviour for a trust-floor element.

## Provenance

- Mockup 24c/24d, owner-approved 2026-06-12 , the cancellation mini-banner sits below the payment block
- hierarchy-density-05 / LOCKFILE §17.6 , the trust floor, whose condition (b) this band answers
- The 2026-07-27 `walk-in-pay` fix , the named prior failure this band is the counter-example to
- Design contract, semantic colour , normal green `#16A34A`, never the rejected deep `#15803D`
