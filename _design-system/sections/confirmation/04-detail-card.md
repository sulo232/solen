<!-- exists-check: extends _design-system/sections/confirmation/CORPUS.md pattern 13 (icon + label +
     sublabel rows, 6 of 49, Fresha's four-row treatment) and its components table, which records
     that this card "is already this shape" and recommends reusing it for the action rows rather
     than stacking more buttons. `npm run exists confirmation` returns 10 hits. -->

# Detail card (when, what, who) , section spec

**Reference:** `_design-system/sections/_measured/confirmation.json` band index 2 and `bandAnatomy.detailCard` · `CORPUS.md` dominant anatomy slots 3 and 4, pattern 13
**Component:** `components-legacy/booking/BookingConfirmation.tsx:459-527`
**Layer:** 1 (chrome)

## Layout

```
y=466  +-------------------------------------------------+  362 x 228, radius 16
       | (cal 18)  Donnerstag, 27. August                |  14.5 / 600
       |           15:40   20 min                        |  12.5 ink-2
       +--------------------- hairline ------------------+
       | (sciss)   Bart trimmen                          |
       |           CHF 28                                |
       +--------------------- hairline ------------------+
       | (DY)      Deniz Yilmaz                          |
       |           Ihr:e Stylist:in                      |
       +-------------------------------------------------+
y=694
```

Three rows of 75px, two 1px dividers, no padding on the card and 16px on each row.

## Measured

| item | value |
|---|---|
| card | [20, 466, 362, 228], radius 16, border 1px `rgb(228, 228, 231)`, background white, padding 0, shadow `rgba(50, 47, 44, 0.09) 0px 2px 8px` |
| when row | [21, 467, 360, 75], padding 16, `Calendar` size 18 at [37, 495], `rgb(107, 107, 107)` |
| divider | [21, 541, 360, 1], border-top 1px `rgb(228, 228, 231)` |
| what row | [21, 542, 360, 75], `Scissors` size 18 at [37, 571] |
| divider | [21, 617, 360, 1] |
| who row | [21, 618, 360, 75], initials at [37, 641, 28, 28] |
| primary line | 14.5px / 600 / Inter Tight / ink, letter-spacing -0.145px, count 3 |
| secondary line | 12.5px / 400 / Inter / `rgb(107, 107, 107)`, count 4 in this card |
| initials | "DY", 12px / 600 / Inter Tight, **background `rgba(0, 0, 0, 0)`, border-radius 0px** |

**The stylist avatar has no disc.** The initials render with a transparent background and a 0px radius, so where the corpus and the rest of this product draw a circle with initials in it, this row shows two bare letters. Measured, not inferred: both properties were read off the rendered element. The row is the `Avatar` primitive at `size="xs"` with `src={null}`, so either that size variant drops the disc or something upstream overrides it. **The cause was not investigated** and no fix is proposed here.

Card height 228 checks out: 75 + 1 + 75 + 1 + 75 = 227, plus the 1px top border = 228.

## Tokens

- Card: `celebrate-rise mt-5 overflow-hidden rounded-card border border-s-border bg-white shadow-elevation-2`
- Rows: `flex items-center gap-3 p-4`
- Dividers: `<hr className="border-s-border" />`
- Primary: `font-display text-[14.5px] font-semibold tracking-[-0.01em] text-s-ink`, truncating on the service and stylist rows
- Secondary: `mt-0.5 text-[12.5px] text-s-ink-2`, and on the when row a `flex items-center gap-2.5` that puts time and duration side by side with no separator dot between them
- Icons: `Calendar` and `Scissors`, both `size={18} strokeWidth={1.9} text-s-ink-2`

## Interaction

- **The when row is a button when the booking can be rescheduled, and a plain div otherwise.** `canReschedule` needs `canManage`, not cancelled, more than 24 hours of lead time, and a status of confirmed or pending (`:267-271`). When true the row gains a chevron and opens `RescheduleSheet`; when false it renders as static text with no chevron.
- **In the measured state it is static**, because `hoursUntilBooking` is negative. See the empty state.
- The service row deliberately has no chevron and no edit path: there is no backend for changing the service from here, so an affordance would be a dead click.
- The stylist row is static too.

## Against the floors

- **Locked radius: PASS.** `rounded-card` measures 16.
- **Elevation: PASS as a token, and it is a step up from the pay step.** `shadow-elevation-2` measures `rgba(50,47,44,0.09) 0 2px 8px`, where the pay step's summary card uses `shadow-elevation-1`. Two screens, one tap apart, showing the same three facts at two elevation tiers.
- **Edge visibility (FLOORS LAW 4): PASS.** The card keeps its hairline and carries elevation. The contract says a card carrying elevation drops its border and never both; measured, this one has both. Against the Edge-Visibility floor that is the safe direction (a white card on a light body needs a perceivable boundary), and against the contract's surface table it is one signature too many.
- **Touch target: PASS when interactive.** The reschedule row is 75px tall.
- **Dead affordance: PASS.** The chevron appears only on the row that opens something, and the two rows with no destination carry none.
- **No decorative artifact: PASS.** "15:40" and "20 min" sit side by side with a gap and no separator dot, which is the rule the taste block states directly.
- **FLOORS LAW 8, the same thing looks the same everywhere: FAIL against the pay step.** The identical three facts, one tap earlier, render at 15px / 600 primary with 13px ink-2 secondary inside a `shadow-elevation-1` card with 44px icon slots. Here they are 14.5 / 600 with 12.5 ink-2 inside a `shadow-elevation-2` card with 18px icons. Same content, same order, same icons, two type ramps and two elevations.
- **CORPUS pattern 13: PARTIALLY ADOPTED.** The card already has the icon-plus-label-plus-sublabel anatomy the corpus recommends, which is what the corpus records. The half not adopted is using that same shape for the ACTIONS instead of stacking buttons, which is `06`.

## Intentional deviations

- **The service row shows the SERVICE price** (`services.price`), never the paid amount, which is the money card's figure (`:501-502`). A different number in this slot would be a mislabel, and the source names that risk in place.
- **No map row, no "getting there" row.** The corpus's Fresha reference carries four rows including a directions row with the address as its sublabel; Solen puts directions in a button in `06` instead. 5 of 49 corpus screens embed a map and the corpus rejects it for v1 on weight.

## Empty state

- **Reschedule affordance: NOT MEASURABLE in this database.** `canReschedule` needs `hoursUntilBooking > 24`, and **zero of the 998 seeded bookings has a `starts_at` in the future**, checked with a single query against now. So on every reachable confirmation the row renders as static text, and the button-with-chevron variant has no data that can produce it. The render site is real; the data is not there.
- **No stylist:** the third row and its divider are dropped together (`:510`), leaving a two-row card.
- **No `durationMinutes`:** the "20 min" span is dropped, leaving the time alone on the secondary line.

## Provenance

- `CORPUS.md` pattern 13 , icon, label and sublabel rows, Fresha's shape
- Dead-click contract , no chevron on a row with no destination
- The reschedule gate mirrors `RescheduleSheet`'s own `RESCHEDULE_MIN_LEAD_HOURS`, so the chevron never opens onto an already-passed sheet
