# DateTimePicker: the ONE date/time component (V3-D445, 2026-06-08)

**File:** `app/[locale]/_components/primitives/DateTimePicker.tsx`
**Layer:** 1 (chrome: calendar/strip + slots are B&W) with the **selected pick** drawn in the Layer-2 accent (royal blue `#276EF1`) via `selectedTone="accent"`, or ink via `selectedTone="ink"`. Selected = blue is the locked convention (matches the search overlay + the contract's "selected = blue").

## Why this exists
Before V3-D445 there were **two** date pickers: this canonical primitive (used by search) and a **bespoke 14-day strip + month-popup in `components-legacy/booking/DateTimeStep.tsx`** that never adopted it. The merge folded the strip into this primitive so there is now **one** component for every date surface. **Do NOT build another date/time picker. Extend this one.**

## Two layouts (the merge)
- **`dateLayout="calendar"`** (default): always-on month grid. Used by **search** (`SearchOverlay`, `variant="single-date"`) and any browse/filter "available on date X" surface.
- **`dateLayout="strip"`**: horizontal next-`stripDays` (default 14) day cards + a trailing "more dates" pill that opens the full month grid in a `Sheet`. Used by the **booking flow** (fast near-term picking). Slots render below in grouped pills (Vormittag/Nachmittag/Abend).

## API (props)
`value: {date: CalendarDate|null, time: string|null}` · `onChange` · `slots?: {time, available}[]` · `isLoadingSlots?` · `minDate?` · `maxDate?` · `isDateDisabled?(CalendarDate)` · `variant?: "date-and-time"|"single-date"` · `selectedTone?: "ink"|"accent"` · `dateLayout?: "calendar"|"strip"` · `stripDays?` · `labels?: Partial<DateTimeLabels>` (i18n: defaults German; booking passes next-intl strings) · `emptySlotContent?: ReactNode` (override the no-slots state, e.g. booking's waitlist CTA) · `dateLabel?` / `timeLabel?` (section headings, strip layout).

Built-in states: loading (shimmer), empty (pickDay / noSlots, or `emptySlotContent`), disabled days, focus rings, Swiss Monday-first week. a11y via `react-aria-components` Calendar.

## Use for
Any date and/or time selection: booking, search "Zeit", B2B closed-day toggles, waitlist preferred-date.

## Don't reuse for
Static date *display* (use a formatted string, not this). Range picking (vacation blocks), not yet built; add a `range` variant here when needed, don't fork.

## Consumers (re-verified 2026-07-12, A3 registry audit)
- `app/[locale]/_components/homepage/SearchBar.tsx:542`: real call-site.
- `components-legacy/booking/DateTimeStep.tsx:194`: strip, date-and-time, accent, i18n labels + waitlist empty-state.
- `app/[locale]/dev/primitives`: live demo of both layouts (dev showcase, not production).

**Correction 2026-07-12:** this list previously named `search/SearchOverlay.tsx` as a
consumer. That was false: `SearchOverlay.tsx` has zero references to
`DateTimePicker` and hand-builds its own inline calendar instead (a live V3-D445
violation, see `COMPONENT_REGISTRY.md`'s SearchOverlay row and `SearchOverlay.md`).
Removed from this list; not fixed here (doc-only change-set), code fix queued.
