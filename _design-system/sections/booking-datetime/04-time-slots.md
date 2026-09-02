<!-- exists-check: extends _design-system/sections/booking-datetime/CORPUS.md section 3 (the slot
     region, 72 screens) and section 9 items 1, 2 and 4, all three of which are source-derived and
     name a rendered measurement as the confirming step. This file supplies it. The control is the
     shared DateTimePicker primitive; nothing new is proposed. -->

# Time slots (Wählen Sie eine Uhrzeit) , section spec

**Reference:** `_design-system/sections/_measured/booking-datetime.json` band index 3, `bandAnatomy.slotPanel`, `.slotPillSelected` and `.landingStateBeforeADateIsPicked` · `CORPUS.md` sections 3, 6 and 9
**Component:** `app/[locale]/_components/primitives/DateTimePicker.tsx:508-598` (`TimeSlotList`), with the empty content supplied by `components-legacy/booking/DateTimeStep.tsx:215-224`
**Layer:** 2 (the accent-blue selected pill, by the LOCKFILE booking carve-out)

## Layout

```
y=298  Wählen Sie eine Uhrzeit                         18 / 700
y=338  +--------------------------------------------+  360 x 337, radius 12
       | Morgens                                     |  12.5 / 600 ink-2
       | [09:00][09:30][10:00][10:30]                |  4 columns, 77 x 43
       | [11:00][11:30]                              |  gap 6
       |                                             |
       | Nachmittags                                 |
       | [12:00][12:30][13:00][13:30]                |
       | ... 12 slots                                |
       +--------------------------------------------+
y=675  card ends
```

The card is 360 wide inside a 370 band, centred, so its left edge sits at x 21 while the day tiles above it start at x 16 and the commit button below it starts at x 16.

## Measured

| item | value |
|---|---|
| band | [16, 298, 370, 377] |
| heading | 18px / 700 / Inter Tight / ink / count 2 across the screen |
| card | [21, 338, 360, 337], radius 12, background `rgb(255, 255, 255)`, border 1px `rgb(228, 228, 231)`, padding 16, shadow none |
| group label | 12.5px / 600 / Inter / `rgb(107, 107, 107)` / count 2 / "Morgens" and "Nachmittags" |
| slots | 18 pills, 6 under Morgens, 12 under Nachmittags |
| slot pill | 77 x 43, radius 9999, background `rgb(255, 255, 255)`, border 1px `rgb(228, 228, 231)`, padding `10px 14px` |
| slot label | 14px / 600 / Inter / ink / count 18 |
| selected pill | background `rgb(39, 110, 241)`, border 1px `rgb(39, 110, 241)`, white text, same 77 x 43 |

The selected reading was taken after this record's extract, when 10:00 was tapped to advance, and the 11:00 pill was read in the same frame so the unselected values come from the same paint rather than from memory.

**Two derivations, with the arithmetic:**

- **Pill width 77.** Card 360 minus `p-4` (32) is 328 of inner width; `grid-cols-4` with three `gap-1.5` (6px) gaps leaves 310 across four columns = 77.5. Measured 77.
- **Pill height 43.** `py-2.5` (10 + 10) plus a 14px label at the inherited 1.5 line-height (21) plus 2px of border = 43. Measured 43. **This is the number `CORPUS.md` section 9 item 1 computed from the class list and could not confirm.** It is confirmed: 43, exactly 1px under the 44px touch floor.

## Tokens

- Card: `flex-1 min-w-[240px] max-w-[360px] bg-s-bg-base border border-s-border rounded-[12px] p-4`
- Grid: `slot-cascade grid grid-cols-4 gap-1.5`
- Pill, unselected available: `bg-s-bg-base text-s-ink border-s-border`, hover `bg-s-bg-active hover:border-s-ink/25`
- Pill, selected: `bg-s-accent text-white border-s-accent` (`selectedTone="accent"`)
- Pill, unavailable: `opacity-40 cursor-not-allowed`, same fill and border
- Label: `font-body font-semibold text-[14px] tabular-nums`
- Group label: `font-body font-semibold text-[12.5px] text-s-ink-2 mb-2`

## Interaction

- A slot is a `role="option"` inside a `role="listbox"` labelled "Verfügbare Zeiten". `aria-selected` carries the state and `aria-label` reads "HH:MM Uhr verfügbar" or "nicht verfügbar".
- Tapping a slot enables the commit button in `06`. Measured: `disabledOpacity 0.5` before, `opacity 1` after.
- Unavailable slots are `disabled` and stay in place at 40% opacity.
- Slots come from `GET /api/availability/time-slots` keyed on salon, date, staff, service ids and total duration (`DateTimeStep.tsx:92-121`). Changing the date refetches; changing the stylist refetches the unavailable days and then the slots.
- Grouping into Morgens, Nachmittags and Abends is done by `groupByPeriod` inside the primitive, not by the API.

## Against the floors

- **Touch target (>= 44px): FAIL by 1px.** 77 x 43, measured on the rendered page. `py-3` clears it. This is the corpus's own item 1, now confirmed rather than computed.
- **Column count: 4, the densest tier in the corpus.** `CORPUS.md` section 3 counted 20 of 72 screens using a chip grid and only 3 of those at four columns, all US volume-throughput apps and none a reference for this product. Measured: Solen is at four. Three columns would buy back the horizontal room the 44px fix needs.
- **Contrast, white on `#276EF1` at 14px semibold: PASS with 0.08 of headroom.** 14px is not large text under WCAG, so the 4.5:1 body floor applies and the accent measures 4.58:1 on white. It passes, and it passes by less than a tenth of a point. Any darkening of the label or lightening of the fill breaks it.
- **Locked radius: FAIL, and it is a small one.** The card measures 12. The locked table gives 16 for a form or summary card, 24 for a grouped list card and 16 for an individual entity card. 12 is the locked **input** radius. The slot panel is a card wearing an input's corner, and it sits directly under 16px day tiles, so the mismatch is visible in one glance.
- **Alignment: FAIL against the page gutter.** The card's left edge is 21, five pixels inside the 16px gutter every other band uses, because a `max-w-[360px]` control is centred inside a 370px column. The day strip above and the CTA below both start at 16.
- **Bold share: this band alone contributes 21 of the screen's 39 bold elements** (18 slot labels, 2 group labels, 1 heading). **The corpus is explicit that this is backwards:** section 6 records that slot times read regular or medium in every single-column app it could see, and that only the selected slot changes weight or colour, precisely because bolding 20 equal items is the flatness failure the EMPHASIS BUDGET names. Solen bolds all 18 at rest, so the selected state has no weight step left to make and has to carry the whole signal on the blue fill.
- **Edge visibility (FLOORS LAW 4): PASS by option (c).** A white card on a white body keeps its hairline.
- **FLOORS LAW 9: PASS.** The shared primitive, not a copy.

## Intentional deviations

- **Solen groups by day part and neither owner reference does.** 0 of 5 Fresha screens and 0 of 5 Airbnb screens group; 17 of 72 across the whole corpus do. This run had 18 slots, where two headers earn their place. On a thin day it would spend a header and a size step on two slots. The corpus recommendation is to gate the grouping on slot count rather than remove it; that is a proposal, not a decision, and it is not made here.
- **A wrapped chip grid rather than the corpus-majority single-column list** (35 of 72 are single column). The grid is what allows 18 slots to sit in one 337px card instead of a 900px scroll.

## Empty state

Three states, one of them measured.

- **No date picked yet, MEASURED.** This is what the step renders on arrival, before any tile is tapped, and it is the state a user actually sees first. The caller's `emptySlotContent` does not apply until a date exists (`DateTimePicker.tsx:538`), so the primitive's own block renders: headline "Wähle einen Tag", subline "Verfügbare Zeiten erscheinen hier." at 14px `rgb(107, 107, 107)`, box [49, 436, 294, 21]. **The container has no background, no border, no radius and no padding**, all four measured as zero or transparent, so at rest there is no card here at all: the panel that appears once a date is picked does not exist yet, and the page's first viewport is a strip of tiles above a large empty gap. The section heading "Wählen Sie eine Uhrzeit" is also absent, because it is gated on `value.date` (`DateTimePicker.tsx:205`).
- **Date picked, no slots free:** the caller's content wins, a 36px `Clock` glyph over `tTime('noSlotsAvailable')` (`DateTimeStep.tsx:219-223`), and the waitlist card in `05` expands to its full form. Not measured, this run's day had 18 slots.
- **Loading:** a shimmer skeleton of six pills in the same 4-column grid at `h-[38px]` (`DateTimePicker.tsx:513-532`). Matches the locked states rule that a skeleton takes the shape of its result. Not measured; the fetch resolved before settle. Note that the skeleton pill is 38px tall against a real pill of 43, so the layout moves 5px per row when it resolves.

## Provenance

- V3-D445 , one `DateTimePicker` primitive, booking and search share it
- Design contract , the booking date and slot are a named exception to the gray-selected lock
- `CORPUS.md` section 3 , 35 of 72 single column, 20 of 72 chip grid, 3 of those at four columns; section 6 , slot times are body weight in the reference set; section 9 items 1, 2 and 4 , the three source-derived findings this file confirms
