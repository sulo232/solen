<!-- exists-check: extends _design-system/sections/booking-service/CORPUS.md sections 2, 5 and 7 (read
     first), which hold the cross-app anatomy and already name the name/price weight inversion. Net-new
     as a per-section spec vs _design-system/LOCKFILE.md lines 558 and 633-646 (the frozen grouped-list-
     card grammar this band is graded against, not a band spec), _design-system/sections/salon-detail/
     04-services.md (the PDP's own service list, a different component) and
     _design-system/components/ServiceDisclosureRow.md (the shared row primitive's own doc).
     `npm run exists "booking service"` returns ServicesStaffStep + ServiceDetailSheet as the only
     component hits and no spec for this band. -->

# Service group card (one per category) , section spec

**Reference:** `_design-system/sections/_measured/booking-service.json` band indexes 2, 3, 4 and 5 · `CORPUS.md` sections 2, 5 and 7
**Component:** `components-legacy/booking/ServicesStaffStep.tsx:507-521` (the group) and `:405-473` (the row) · `app/[locale]/_components/primitives/ServiceDisclosureRow.tsx` (the row body) · `components-legacy/booking/ToggleCircle.tsx` (the select control)
**Layer:** 1 chrome + Layer 3 child (ToggleCircle)

Four instances of ONE band, one per category the salon's own taxonomy produces. They are specified together because they are the same band with different row counts, not four sections.

## Layout

```
  Bart                                    <- h3, 16px/600, capitalize, mb-3 (36px block)
 +--------------------------------------+ <- rounded 24, hairline, whisper, overflow-hidden
 | Bart trimmen              v      (+) |    name 15/600 + chevron 18, ToggleCircle 36
 | 20 Min                               |    meta 14/400 grey
 | ab 28 CHF                            |    "ab" 15/700 grey + "28 CHF" 15/700 ink
 |--------------------------------------|    border-t hairline, first:border-t-0
 | Bart stylen                      (+) |
 | 20 Min                               |
 | ab 25 CHF                            |
 |--------------------------------------|
 | ...                                  |
 +--------------------------------------+
                                            32px gap to the next group
```

Row order inside the tap target is name, duration, description (collapsed), price (`ServiceDisclosureRow.tsx:53-89`). The chevron renders only when the service has a description, because a chevron that opens nothing is a dead click (`ServiceDisclosureRow.tsx:57`). The ToggleCircle is a separate sibling button and is the only control that selects.

## Measured

Per instance, all from the JSON's bands.

| # | band | heading | top | height | card box | rows |
|---|---|---|---|---|---|---|
| 1 | index 2 | Bart | 145 | 394 | 358 x 358 | 3 |
| 2 | index 3 | Extras | 571 | 275 | 358 x 239 | 2 |
| 3 | index 4 | Haarschnitt | 878 | 513 | 358 x 477 | 4 |
| 4 | index 5 | Kombi | 1423 | 275 | 358 x 239 | 2 |

Every band reports `surface.background: rgba(0, 0, 0, 0)`, `padding: 0px`, `borderRadius: 0px`, and `imagery: 0 images, 0 px`.

Derived from those numbers, arithmetic shown:

- **Group gap is 32px, three times over.** 571 - (145 + 394) = 32. 878 - (571 + 275) = 32. 1423 - (878 + 513) = 32. That is `space-y-8` (`ServicesStaffStep.tsx:507`).
- **The heading block is 36px, four times over.** Band height minus card height: 394 - 358, 275 - 239, 513 - 477, 275 - 239, all 36. That is the `h3` at line-height 24 plus `mb-3` (12).
- **Row height is about 119px.** 358 / 3 = 119.33, 239 / 2 = 119.5, 477 / 4 = 119.25, 239 / 2 = 119.5. Net of the 1px dividers: (358 - 2) / 3 = 118.67.
- **11 rows on the screen.** 3 + 2 + 4 + 2 = 11, which matches the measured count of 11 on the name role, the duration role and both price roles.

Card anatomy, identical in all four bands:

| property | measured |
|---|---|
| radius | 24 |
| border | `1px solid rgb(228, 228, 231)` |
| background | `rgb(255, 255, 255)` |
| padding | `0px` (the rows carry it) |
| box-shadow | `rgba(10, 10, 10, 0.04) 0px 1px 3px 0px, rgba(10, 10, 10, 0.1) 0px 10px 28px -14px` |

Type, identical in all four bands:

| role | measured |
|---|---|
| group heading | 16px / 600 / Inter Tight / `rgb(10, 10, 10)` / capitalize / line-height 24 / letter-spacing -0.16px |
| service name | 15px / 600 / Inter / `rgb(10, 10, 10)` / line-height 22.5 |
| duration meta | 14px / 400 / Inter / `rgb(107, 107, 107)` / line-height 21 |
| price qualifier "ab" | 15px / **700** / Inter / `rgb(107, 107, 107)` / line-height 22.5 |
| price amount | 15px / **700** / Inter / `rgb(10, 10, 10)` / line-height 22.5 |

Not present in the measurement: the row description. Every row is collapsed at rest (`ServiceDisclosureRow.tsx:44`, `isExpanded` starts false), so the 14px `leading-relaxed` `s-ink-2` description paragraph (`ServiceDisclosureRow.tsx:84`) never entered the DOM. The chevrons are SVG and the script skips the SVG namespace (`scripts/measure-sections.mjs:214`), so how many of the 11 rows carry one is not measured. The ToggleCircles are 36x36 and fall under the script's 60px card floor (`scripts/measure-sections.mjs:280`), so they carry no measured box either.

## Tokens

- Card: `overflow-hidden rounded-[24px] border border-s-border bg-white shadow-whisper` (`ServicesStaffStep.tsx:516`). `shadow-whisper` in `tailwind.config.js:275` is `0 1px 3px rgba(10,10,10,.04), 0 10px 28px -14px rgba(10,10,10,.10)`, which is the measured shadow string exactly.
- Row: `flex items-center gap-2.5 border-t border-s-border px-5 py-[18px] first:border-t-0`
- Selected row: adds `bg-s-bg-sunken/60` (`#F4F4F5` at 60 percent)
- Group heading: `font-heading text-[16px] font-semibold capitalize tracking-[-0.01em] text-s-ink mb-3`
- Name: `font-body text-[15px] font-semibold text-s-ink md:text-[16px]`
- Meta: `mt-1 text-[14px] text-s-ink-2 tabular-nums`
- Price: `mt-3 text-[15px] font-bold text-s-ink` wrapping `<PriceFrom amount label>`; PriceFrom puts the label in `text-s-ink-2` and lets the amount inherit, which is why both halves measure 700 and differ only in colour (`primitives/PriceFrom.tsx:27-33`)
- Select control: `ToggleCircle` `w-9 h-9 rounded-full`, unselected `border border-s-border text-s-ink-2` with a `Plus` 17px, selected `bg-s-ink text-white` with a `Check` 17px

## Interaction

- **Tap the left column:** toggles the description open in place, never selects (`ServiceDisclosureRow.tsx:96-108`). Height animates 0 to auto over 180ms on `GLIDE_EASE`; the chevron rotates 180 over 260ms. With no description the same block renders as a plain `div`, not a button.
- **Tap the ToggleCircle:** if the service has add-ons or options, the detail sheet opens (`06`), and a service with add-ons but no required option commits to the cart the moment the sheet opens. Otherwise it selects or deselects directly (`ServicesStaffStep.tsx:452-465`).
- **Deselecting also clears that service's add-ons** (`ServicesStaffStep.tsx:145-152`), so an add-on cannot survive in the total with no UI to remove it.
- **Selecting with a single-staff salon** also writes `selectedStaffId` (`ServicesStaffStep.tsx:163-165`), which is what lets the staff step be skipped.
- **Select feedback:** the circle plays a 90ms scale pop on the false to true edge only, and the glyph swap is a 150ms flip (`ToggleCircle.tsx:17-23`). Rows enter on the shared stagger container (`ServicesStaffStep.tsx:512-515`).
- **Row filtering by stylist:** when a specific stylist is already chosen, only that stylist's services render, falling back to all when the mapping is empty (`ServicesStaffStep.tsx:186-194`).
- **Grouping** is `subcategory ?? category ?? 'andere'`, sorted alphabetically (`ServicesStaffStep.tsx:297-298`). Nothing is hardcoded per category.

## Against the floors

- **Grouped list-card grammar (LOCKFILE lines 558 and 633-646): PASS on every frozen literal.** Radius 24, `1px solid #E4E4E7`, white, `shadow-whisper` byte for byte, rows at `px-5 py-[18px]` with `border-t first:border-t-0`. This also settles the CLAUDE.md shadow-table clause "a card carrying elevation DROPS its border, never both": the frozen literal for this card type is border and whisper together, it is gate-enforced (`.claude/hooks/card-radius-gate.py`, whisper-only), and LOCKFILE literals outrank the pinned block in the precedence chain.
- **Group header grammar: half missing.** LOCKFILE line 645 locks the header as "name + range baseline row (16px/600 + 13px ink-3 tabular)". The 16px/600 renders; there is no 13px range beside it. The `h3` renders `{cat}` and nothing else (`ServicesStaffStep.tsx:510`). The only 13px roles measured anywhere on this screen are the four category pill labels. I did not determine why the range half is absent; I did not check the git history for it.
- **Two-anchor card rule (taste rule 5, V3-D442): FAIL on both halves.** The rule is "name (larger, 600) + price (600, tabular)" and "a card may carry two ink elements only if the NAME is larger". Measured, name and price are the same 15px, and the price is the heavier of the two at 700 against the name's 600. Nothing marks the anchor by size. `CORPUS.md` section 5 named the weight half already and added that in 0 of 8 sampled apps is the price larger than the name.
- **Bold share (EMPHASIS BUDGET a, <= ~30% at weight >= 600): FAIL in every band.** Bart 10 of 13 = 76.9%. Extras 7 of 9 = 77.8%. Haarschnitt 13 of 17 = 76.5%. Kombi 7 of 9 = 77.8%.
- **Weight ceiling (<= 2 distinct weights per screen): FAIL inside this one band.** It carries 400, 600 and 700 on its own.
- **Size ceiling (<= 4 distinct sizes per screen):** this band contributes 3 of the screen's 7 (16, 15, 14).
- **Display anchor (>= 28px): FAIL.** The largest type in the band is the 16px group heading.
- **FLOORS LAW 4, edge visibility: PASS on the boundary, FAIL on the tray.** The card is white on white and keeps the hairline, which is option (c) of the floor. The same floor then says grouped list content on white with no photo anchor requires the sunken tray. There is none: every measured band reports a transparent background, and the substrate is `min-h-screen bg-white` (source, `app/[locale]/salon/[slug]/booking/page.tsx:260`). The comment four lines above that class calls the same element a "sunken body", which the class contradicts.
- **FLOORS LAW 1 finished-screen pass item (d), a semantic-colour moment: FAIL.** The only colours measured in these bands are `#0A0A0A` and `#6B6B6B`.
- **FLOORS LAW 6, `s-ink-2` on load-bearing copy: FAIL twice.** The duration (14px `#6B6B6B`) and the "ab" price qualifier (15px `#6B6B6B`) are both load-bearing on a booking screen. CLAUDE.md floor 6 puts the token at 5.33:1 on white, clearing WCAG AA, and restricts it to non-load-bearing text.
- **Touch target (>= 44px): FAIL on the select control.** `ToggleCircle` is `w-9 h-9` = 36px and its wrapping button adds only transition and press-scale classes, no padding (`ServicesStaffStep.tsx:466-468`, `primitives/motion.ts:157-159`). The hit area is 36x36, 8px under the a11y floor. The disclosure tap target beside it is the full row, about 119px tall, and passes.
- **FLOORS LAW 3 density floor (services >= 6): PASS.** 11 rows across 4 groups.
- **Richness ceiling (hierarchy-density-03, cap above roughly 3x the floor):** 11 rows is far under the 80-service threshold, so the uncapped inline render is legal here. Untested above that volume.
- **FLOORS LAW 8, one component per entity: PASS for the row.** The PDP renders the same `ServiceDisclosureRow` primitive (`SalonServices.tsx:179-193`) with its own type slots, and the primitive's doc records the split as deliberate: booking takes name 600 plus a bold price, the salon page takes name 500 plus `PriceFrom emphasis`. That is a documented variant of one component, which is what the floor asks for, and the opposite of the pill row in `02`.

## Intentional deviations

- **Grouping is the salon's own taxonomy, not a fixed duration tier** (owner change 2026-07-19, `ServicesStaffStep.tsx:294-298`), replacing an Express / Klassisch / Signature split.
- **The row's chevron and accordion moved into a shared primitive on 2026-08-09** so the PDP could render the same row instead of a second copy (owner decision 10). Nothing about the treatment changed in the move (`ServicesStaffStep.tsx:427-432`).
- **Emphasis here is weight, not size or colour.** The owner's target ladder carries emphasis at weight 500 with size and colour doing the work. This band carries 600 on the name and 700 on the price, at one size.
- **Duration is text only, no Clock icon**, deliberately matching `SalonServices.tsx` (`ServicesStaffStep.tsx:124-125`). `salon-detail/04-services.md` still specs a 12px Clock beside its duration, so the two documents disagree about the PDP; the booking side is text only either way.

## Empty state

There is no empty branch inside this band. A category only exists because at least one service produced it (`ServicesStaffStep.tsx:298`), so an empty group card cannot render. A salon with zero bookable services never reaches this component at all; the page swaps in `EmptyServicesState` first (`07`).

## Provenance

- Owner-approved 2026-06-11, Atelier service-grouping mockup , the grouped list-card grammar (LOCKFILE lines 633-646), applied to `ServicesStaffStep` on the same day
- Owner 2026-07-18, `public/_mockups/liftup-booking-services-tiered/index.html` , the tiered card row, the chevron, the accordion timing
- Owner 2026-07-19 , grouping by the salon's own category
- Owner decision 10, 2026-08-09 , the row extracted to `ServiceDisclosureRow` and shared with the PDP
- V3-D442 , the two-anchor card rule this band's type does not satisfy
