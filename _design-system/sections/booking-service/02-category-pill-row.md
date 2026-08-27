<!-- exists-check: extends _design-system/sections/booking-service/CORPUS.md section 7 (read first),
     which already names this row as the screen's FLOORS LAW 9 gap. Net-new as a per-section spec vs
     _design-system/sections/salon-detail/04-services.md (the PDP chip row, a different component),
     _design-system/COMPONENT_REGISTRY.md row TabPill (the primitive, not this call-site) and
     _plans/MOBILE_DESIGN_SYSTEM.md (tokens, no bands). `npm run exists "booking service"` returns no
     per-section spec for this row. -->

# Category scroll-spy pill row , section spec

**Reference:** `_design-system/sections/_measured/booking-service.json` band index 0 (`main`), text roles at 13px and card group 2 · `CORPUS.md` section 7, row "Category navigation"
**Component:** `components-legacy/booking/ServicesStaffStep.tsx:482-503`
**Layer:** 1 (chrome: navigation affordance)

## Layout

```
 y = 64   +=============================================================+  full bleed 390
          | [ Bart ] [ Extras ] [ Haarschnitt ] [ Kombi ]  ->           |  h = 65
          +=============================================================+
 y = 129   ^ ink fill   ^ white + hairline, horizontal scroll, no wrap
                        (border-b hairline is the last 1px of the 65)
 y = 145  first group heading ("Bart"), after the groups container pt-4
```

`sticky top-0 z-30`, pulled full bleed with `-mx-4` and re-padded `px-4`. The pills SCROLL to a group, they never filter: every category renders below at once (`ServicesStaffStep.tsx:302-309`).

## Measured

This row is not one of the JSON's six bands. The measurement script keeps only landmark tags (`header, nav, main, footer, section, aside, form`) and elements whose direct child is an `h1`, `h2` or `h3` (`scripts/measure-sections.mjs:193-194, 213-223`); this row is a `div` with neither, so it is folded into band index 0 (`main`). Its type and card anatomy are therefore read out of band 0, and its box is derived from the two bands that bracket it.

| item | value | source |
|---|---|---|
| box top | 64 | derived: band 1 top 12 + band 1 height 52 |
| box bottom | 129 | derived: band 2 (Bart) top 145 minus the groups container's `pt-4` = 16 (`ServicesStaffStep.tsx:507`) |
| box height | **65** | derived: 129 - 64. Source decomposes it as `py-2.5` (10 + 10) + `h-11` (44) + `border-b` 1 = 65, which agrees exactly |
| box width | 390 | derived: `-mx-4` on the measured 358 container, 358 + 32 = 390 (full bleed at this viewport) |
| active pill label | 13px / 600 / Inter / `rgb(255, 255, 255)` / capitalize / line-height 19.5 / count 1 / sample "Bart" | measured, band 0 |
| inactive pill label | 13px / 600 / Inter / `rgb(107, 107, 107)` / capitalize / line-height 19.5 / count 3 / sample "Extras" | measured, band 0 |
| inactive pill box | radius 9999, shadow `none`, border `1px solid rgb(228, 228, 231)`, background `rgb(255, 255, 255)`, padding `0px 12px`, count 3, example 66x44 | measured, band 0 card group 2 |
| active pill box | **not in the JSON** | see below |
| pill count | 4 (1 active + 3 inactive text roles) | measured, band 0 |

**Why the active pill has no card entry.** `cardAnatomy` skips any box under 60px wide (`scripts/measure-sections.mjs:280`). "Bart" is the shortest of the four labels, and the three that were captured measure 66px wide, so the active pill falls under the cut. This is an inference from the script's filter, not a second measurement.

Both the pill labels and the group headings (`03`) carry `textTransform: capitalize` in the measurement, so the string in the DOM is the raw taxonomy key from the data, not a display label.

## Tokens

- Row: `sticky top-0 z-30 -mx-4 bg-white/90 backdrop-blur border-b border-s-border px-4 py-2.5`
- Track: `flex gap-2 overflow-x-auto scrollbar-hide`
- Pill, both states: `h-11 shrink-0 whitespace-nowrap rounded-full px-3 text-[13px] font-semibold capitalize transition-colors`
- Active: `bg-s-ink text-white` (measured `rgb(255, 255, 255)` on ink)
- Inactive: `bg-white border border-s-border text-s-ink-2`, `hover:text-s-ink`
- `s-border` `#E4E4E7` = measured `rgb(228, 228, 231)`; `s-ink-2` `#6B6B6B` = measured `rgb(107, 107, 107)`

## Interaction

- Tap a pill: `setActiveCat(cat)` then `document.getElementById(catId(cat)).scrollIntoView({ behavior: 'smooth', block: 'start' })` (`ServicesStaffStep.tsx:306-309`). The highlight is set immediately so it does not lag the smooth scroll.
- Scroll: a passive `scroll` listener walks the group sections and takes the last one whose `getBoundingClientRect().top <= 130` (`ServicesStaffStep.tsx:314-329`). The highlight follows the section in view.
- Each group section carries `scroll-mt-[120px]` (`ServicesStaffStep.tsx:509`). The pinned row measures 65px tall (derived above), so a pill tap parks the group heading 55px below the pinned row rather than against it.
- The row does not render at all when `categories.length === 0` (`ServicesStaffStep.tsx:481`).

## Against the floors

- **FLOORS LAW 9, screens are composed not drawn: FAIL.** This is a hand-built `<button>` (`ServicesStaffStep.tsx:485-500`) while `TabPill` is a locked registry primitive (`app/[locale]/_components/primitives/TabPill.tsx`, `_design-system/COMPONENT_REGISTRY.md` row TabPill). `CORPUS.md` section 7 named this already. Two facts it does not carry: TabPill ships two sizes, sm 32px and md 40px, and these pills are 44px, so composing it needs a size as well as an ink-active variant.
- **FLOORS LAW 8, the same thing looks the same everywhere: FAIL.** The same salon taxonomy renders through TabPill on the PDP (`SalonServices.tsx`, registry row SalonServices) and through this button here. One entity, two implementations.
- **Bold share (EMPHASIS BUDGET a, <= ~30% at weight >= 600): FAIL.** 4 of 4 labels in this band are 600.
- **Text size on a button:** measured 13px against the locked text-size row "CTA 15 (never <= 13 on a button)". 13 sits exactly at that boundary. The same 13px ships on the PDP filter chips (`salon-detail/04-services.md`, TabPill `size="sm"`: `h-8 px-3 text-[13px]`).
- **Touch target (>= 44px): PASS.** `h-11` = 44, measured 44 in the card group.
- **Hairline: PASS.** Measured `rgb(228, 228, 231)` is `s-border` `#E4E4E7`, the one locked divider token.
- **FLOORS LAW 6, `s-ink-2` on load-bearing copy: FAIL.** The inactive labels are `#6B6B6B`. CLAUDE.md floor 6 puts that at 5.33:1 on white, which clears WCAG AA, and restricts the token to non-load-bearing text (chevrons, placeholders, timestamps, hints). A category name inside a navigation control is load-bearing.
- **Locked selected-state row (calm gray fill, never black or ink):** overridden here, not failed. See below.

## Intentional deviations

- **Ink-filled selected pill, owner override, dated.** The locked design-contract row says selected is `bg-s-bg-sunken` + `text-s-ink` + semibold and the `no-black-selected` gate refuses an ink fill. CLAUDE.md names this exact exception: "the BOOKING services-step category pills are ink-fill (owner override 2026-07-19)". The code carries the `selected-ok:` marker with the same date and reason on the line (`ServicesStaffStep.tsx:493`).
- **Pills scroll, they do not filter** (owner change 2026-07-19, `ServicesStaffStep.tsx:477-480`). Every category renders at once below.
- **`backdrop-blur` is kept here** while the same treatment was deliberately dropped elsewhere on mobile-performance grounds: `salon-detail/01-hero.md` (V3-D202 A2) and `salon-detail/17-mobile-book-bar.md` (V3-D202 A20, `bg-white/95 backdrop-blur-md` to `bg-white`). This row still ships `bg-white/90 backdrop-blur`. I did not find a dated decision exempting it; I did not check the git history for one.

## Empty state

The row unmounts entirely when the service list yields no categories (`ServicesStaffStep.tsx:481`). At that point the salon has no bookable services at all, and the page-level branch (`07`) has already replaced the wizard, so this condition is unreachable through the normal route.

## Provenance

- Owner 2026-07-18, live fix plus the approved `public/_mockups/liftup-booking-services-tiered/index.html` mockup (`ServicesStaffStep.tsx:482`)
- Owner 2026-07-19 , group by the salon's own taxonomy, pills scroll instead of filter, ink-fill selected pill (`ServicesStaffStep.tsx:294-300, 477-480, 493`)
- `CORPUS.md` section 7 , the TabPill gap, named there first
