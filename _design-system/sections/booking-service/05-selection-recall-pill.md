<!-- exists-check: extends _design-system/sections/booking-service/CORPUS.md section 7 (read first),
     which lists this pill under the running-total row. Net-new as a per-section spec; `npm run exists
     "booking service"` returns no component and no spec for it, and it is inline in
     ServicesStaffStep.tsx rather than a registry component. Not to be confused with the graveyard hit
     SalonServicesSheet (removed 2026-07-19), which is a different surface. -->

# Selection recall pill , section spec

**Reference:** not in `_design-system/sections/_measured/booking-service.json`. Its mount condition was false at measurement, so every number below is read from source and labelled as such · `CORPUS.md` section 7
**Component:** `components-legacy/booking/ServicesStaffStep.tsx:538-558`
**Layer:** 1 chrome (a scroll affordance, not a control that changes the cart)

## Layout

```
          +---------------------+
          |  3 ausgewaehlt  ^   |   <- centred, floating, white + hairline + elevation-2
          +---------------------+
 ------------------------------------  <- the running total bar (04) sits below it
```

`fixed left-0 right-0 bottom-[80px] z-40 flex justify-center px-4 pointer-events-none`, with `pointer-events-auto` restored on the button itself, so the strip never eats taps beside the pill.

## Measured

**Nothing here was measured.** The pill mounts only when `hasSelectedServices && selectionOffscreen` (`ServicesStaffStep.tsx:539`), and the cart was empty at measurement (band 0's meta line reads "0 Artikel"), so it never entered the DOM. Values below are from source.

| item | value | source |
|---|---|---|
| position | `fixed`, 80px above the viewport bottom, `z-40` | source `:546` |
| shell | `rounded-full bg-white border border-s-border shadow-elevation-2` | source `:551` |
| padding | `pl-4 pr-3.5 py-2`, `gap-2` | source `:551` |
| label | 13px, `font-heading` (Inter Tight), 600, `text-s-ink` | source `:551` |
| glyph | `ArrowUp` 15px, `strokeWidth 1.9` | source `:556` |
| `shadow-elevation-2` | `0 2px 8px rgba(50,47,44,0.09)` | `tailwind.config.js:279` |

Derived, arithmetic shown: the bar in `04` is about 68px tall, so at `bottom-[80px]` the pill floats roughly 11 to 12px above the bar's top hairline.

Height is not measured. `py-2` puts 8px above and below a 13px label with no line-height class of its own, so the control clears 44px only if the inherited line-height is 28px or more, which nothing on this screen sets.

## Tokens

- `bg-white` + `border-s-border` + `shadow-elevation-2`, explicitly a calm design-system pill rather than the ink fill it used to carry (`ServicesStaffStep.tsx:549-550`)
- The count digit carries `animate-count-bump`, keyed on the cart length so it replays on every change (`:555`)
- Enter and exit run the shared ENTER RECIPE through `useEnterMotion` (`:542-545`)
- Arrow lifts 2px on hover over 200ms `ease-glide`; press is `active:scale-[0.97]`

## Interaction

- Tap: `window.scrollTo({ top: 0, behavior: 'smooth' })` (`:548`). It does not open a list and it does not change the cart.
- **Mount condition, and this is the whole point of the component:** it appears only when at least one service is selected AND none of the currently selected rows is on screen. A single `IntersectionObserver` watches only the selected rows, following the cart in and out (`ServicesStaffStep.tsx:336-390`). It is not a "you have scrolled" indicator.

## Against the floors

- **Nothing here can be graded against a measured number.** The state did not render at measurement. Listed in the README under "Not yet measured".
- **Dead affordance: PASS.** It scrolls, and it only exists when there is something to scroll back to.
- **FLOORS LAW 10, every element must belong to the screen's job: PASS, and it is the one element on this screen that was fixed twice to earn it.** The owner rejected an always-visible version on 2026-07-09 and again on 2026-07-19 ("still always there"), and the mount condition was rewritten from a 120px scroll threshold to real visibility of the selected rows (`ServicesStaffStep.tsx:99-109`).
- **Elevation:** this is the screen's only `elevation-2` and its second elevation level, against a target ladder that carries three. The LOCKFILE ban on elevation-2 for a grouped LIST card does not reach it: this is a floating pill over content, which the locked shadow table puts in the overlay family.
- **Text size on a button:** 13px, the same boundary as the category pills in `02` against "CTA 15 (never <= 13 on a button)".
- **Touch target:** not measured, and the source arithmetic above does not reach 44px.

## Intentional deviations

- **White pill, not ink.** It was an ink fill matching the selection language until the owner's live fix on 2026-07-18; the comment on the line says the ink version read as a grey-haze shadow on a calm surface (`ServicesStaffStep.tsx:549-550`).
- **It scrolls to the top instead of showing what is selected.** `CORPUS.md` section 6 records that the sampled apps put the line-item list behind the total instead. Recorded as current behaviour, not as a proposal.

## Empty state

Not applicable in the usual sense: the empty state of this component is its absence, which is also its resting state. It never renders with a count of zero (`ServicesStaffStep.tsx:539`).

## Provenance

- B2, owner 2026-07-09 , the pill used to pop in with no entrance; now runs the shared ENTER RECIPE
- B17, owner 2026-07-09 then 2026-07-19 , the mount condition rewritten twice, from a fixed scroll threshold to selected-row visibility
- Owner 2026-07-18 live fix plus `liftup-booking-services-tiered` , white + hairline + elevation-2 instead of the ink fill
