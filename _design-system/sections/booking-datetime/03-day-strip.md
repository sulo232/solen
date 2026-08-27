<!-- exists-check: extends _design-system/sections/booking-datetime/CORPUS.md sections 2 and 9, which
     specify the day strip from source and leave the rendered sizes to a measurement pass. The
     control itself is the shared DateTimePicker primitive (V3-D445, one date primitive, no bespoke
     date UI), so nothing new is proposed here. `npm run exists "date time step"` returns
     DateTimeStep.tsx. -->

# Day strip (Datum wählen) , section spec

**Reference:** `_design-system/sections/_measured/booking-datetime.json` band index 2 and `bandAnatomy.dayStrip` · `CORPUS.md` section 2 (45 of 72 use a strip) and section 9 items 3 and 4
**Component:** `app/[locale]/_components/primitives/DateTimePicker.tsx:276-346` (`DayStrip`), invoked with `dateLayout="strip"` and `selectedTone="accent"` from `components-legacy/booking/DateTimeStep.tsx:194-201`
**Layer:** 2 (the accent-blue selected fill, by the LOCKFILE booking carve-out)

## Layout

```
y=138  Datum wählen                                    18 / 700, mb 12
y=178  +------+ +------+ +------+ +------+ +------+ ...  14 tiles + 1
       |  Do  | |  Fr  | |  Sa  | |  So  | |  Mo  |      72 x 88 each
       |  27  | |  28  | |  29  | |  30  | |  31  |      22 / 700
       | Aug  | | Aug  | | Aug  | | Aug  | | Aug  |      12 / 400
       +------+ +------+ +------+ +------+ +------+
        30% ink   30% ink   ink      30% ink  BLUE
y=266  strip ends. Container is full bleed: x 0 to 402, via -mx-4
```

The strip scrolls horizontally and bleeds past the page gutter on both sides, so a tile is always cropped at the right edge. That crop is the scroll promise.

## Measured

| item | value |
|---|---|
| band (heading + strip) | [16, 138, 370, 132] |
| heading | 18px / 700 / Inter Tight / ink / line-height 28 / count 2 across the screen / "Datum wählen" |
| strip container | [0, 178, 402, 92], `gap 10px`, `overflow-x: auto` |
| tile | 72 x 88, radius 16, padding `12px 0px`. First at [16, 178], second at [98, 178], so the pitch is 82 = 72 + 10 |
| tile count | 14 day tiles plus 1 trailing "more dates" tile |
| enabled tile | background `rgb(255, 255, 255)`, border 1px `rgb(228, 228, 231)`, colour `rgb(10, 10, 10)`, cursor pointer, count 8 |
| disabled tile | background transparent, same border, colour `rgba(10, 10, 10, 0.3)`, cursor not-allowed, opacity 1, count 5 |
| selected tile | background `rgb(39, 110, 241)`, border 1px `rgb(39, 110, 241)`, colour white, count 1 |
| more-dates tile | 72 x 88, radius 16, white, border 1px `rgb(228, 228, 231)`, padding `0px`, count 1 |
| weekday | 12px / 500, `text-transform: capitalize` |
| day number | 22px / 700, tabular |
| month | 12px / 400, `text-transform: capitalize` |
| disabled days in this run | Do 27, Fr 28, So 30 Aug, Fr 4, So 6 Sep, for Jonas |

Band height 132 decomposes as 28 (heading) + 12 (`mb-3`) + 88 (tile) + 4 (`pb-1`), one derivation with its arithmetic. Measured 132.

## Tokens

- Tile: `shrink-0 w-[72px] rounded-2xl border py-3 flex flex-col items-center gap-0.5`, transition `[colors,transform] 150ms ease-snap`, `active:scale-[0.98]`
- Selected: `bg-s-accent border-s-accent text-white`. **This is the one place blue is legal as a large fill**, by the design contract's own named exception: "booking date/slot stays blue". Everything else on the screen obeys the sparse-blue rule.
- Disabled: `border-s-border text-s-ink/30 cursor-not-allowed`, and no background at all, so a dead day is a hollow outline rather than a grey block.
- Container: `-mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1 scrollbar-hide`
- Heading: `font-heading text-lg font-bold text-s-ink mb-3` (`DateTimePicker.tsx:257`). `text-lg` renders 18px.

## Interaction

- Tapping an enabled tile writes the date to the booking context and triggers the slot fetch in `04`. `aria-pressed` carries the state.
- **Disabled days stay in place**, greyed to 30% ink, with `cursor: not-allowed`. They are never removed from the strip.
- The trailing tile opens a full month grid in a `Sheet` (`DateTimePicker.tsx:209-225`), which is the escape hatch out of the visible 14 days. Picking a date there closes the sheet and selects.
- Unavailability comes from `GET /api/availability/unavailable-dates` keyed on salon, staff and the selected services (`DateTimeStep.tsx:71-89`), so the strip re-greys when the stylist changes.

## Against the floors

- **Touch target: PASS.** 72 x 88.
- **Locked radius: PASS.** `rounded-2xl` measures 16, the card literal.
- **Selected state: PASS by the named exception.** The locked contract is a gray fill for pills and chips, with "booking date/slot stays blue" written into it as one of four exceptions. Measured `rgb(39, 110, 241)` = `#276EF1` = `s-accent`.
- **Contrast, white on `#276EF1`: PASS.** The accent measures 4.58:1 against white in the CLAUDE.md contrast table, and the day number is 22px bold, well past the large-text threshold.
- **Disabled-day contrast: FAIL as text, and it is deliberate.** `rgba(10, 10, 10, 0.3)` over white computes to roughly 1.9:1. WCAG exempts inactive controls from the contrast minimum (1.4.3), so this is legal, and it is worth naming because the 30% ink is doing real work: it is the only signal that separates a dead day from a live one.
- **Display anchor (FLOORS LAW 6): FAIL, and this band holds the screen's largest type.** The 22px day number is the biggest thing on the screen, 6px under the 28px floor. This answers `CORPUS.md` section 9 item 3, which read 22px from source and said "I did not render the page, so I cannot rule out something larger arriving from a sibling component". Nothing larger arrives. 22 is the rendered maximum.
- **Anchor ratio (EMPHASIS BUDGET b, >= 1.8x): FAIL at 1.57x** (22 / 14).
- **Bold share, this band's contribution: 16 of the screen's 39 bold elements are here** (14 day numbers plus 2 headings). The day numbers are bold by design and correct: the corpus records the number as the target and the weekday as the whisper, in 6 of 6 apps where it could be read.
- **FLOORS LAW 9, composed from the registry: PASS.** The strip is the shared `DateTimePicker` primitive, not a copy. V3-D445 locks it: one date primitive, no bespoke date UI, booking and search share it.

## Intentional deviations

- **Rounded rectangular tiles, not a filled circle around the number.** The corpus splits 19 filled-circle to 11 rectangular-card; Fresha and Airbnb are both in the circle group. Solen is with Warby Parker, Instacart and Headspace. Not a defect, and it is what lets the tile carry three lines.
- **Blue rather than ink for the selection**, `selectedTone="accent"`, against an ink default in the same primitive. That is the dated design-contract exception, and search uses the same primitive with the same tone.
- **The escape-hatch tile's label is the same string as the section heading.** `moreDates` is passed as `tDate('pickDate')` (`DateTimeStep.tsx:213`), so the pill reads "Datum wählen" while the primitive's own default for that slot is "Weitere Daten" (`DateTimePicker.tsx:88`). The heading above the strip and the last tile in it therefore say the same words. Measured: the 12px / 500 ink-2 role with line-height 15 and sample "Datum wählen". Recorded as a copy defect, not fixed here.

## Empty state

- **Every day disabled:** the strip still renders 14 hollow tiles and the slot panel stays in its "pick a day" state. Not measured; 8 of 14 were enabled in this run.
- **The strip cannot reach next month by scrolling.** It is exactly `stripDays` long, default 14. Beyond that the month sheet is the only route, which is why the trailing tile is load-bearing rather than convenience.

## Provenance

- V3-D445 , one `DateTimePicker` primitive for booking and search, no bespoke date UI
- Design contract, selected/active row , the booking date and slot are one of the four named exceptions to the gray-selected lock
- `CORPUS.md` section 2 , 45 of 72 corpus screens use a strip, 27 of 27 leave unavailable days in place, 15 of 45 offer an escape hatch and Fresha and Airbnb are both in that minority
