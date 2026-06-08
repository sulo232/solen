# RatingStars — the ONE rating display (CONTRADICTIONS.md §4, 2026-06-08)

**File:** `app/[locale]/_components/primitives/RatingStars.tsx`
**Layer:** 3 (semantic — the star is yellow `s-star #FFC32B` because **rating IS the message**, per the universal-colour table; NOT part of the 3% accent budget).

## Why this exists
Rating was hand-rolled **~14×** as a single `<Star className="fill-s-star" /> {value}` block + **5×** as a raw `<svg><polygon>` five-star render (two of those raw SVG). Sites incl. `homepage/SalonCard.tsx`, `search/SalonResultCard.tsx`, `salon/SalonHeader.tsx`, `salon/SalonReviews.tsx`, `booking/StaffPicker.tsx`. This collapses all of them. **Do NOT hand-roll a star again. Use this.**

## Two modes (cover every site)
- **`mode="compact"`** (default) — one star + the decimal value, optional `(count)` in muted ink. Salon cards, PDP header, search result rows.
- **`mode="five"`** — `max` stars (default 5) filled to `round(value)`: filled = `fill-s-star`, empty = `fill-s-border`. An individual review row's star strip.

## API (props)
`value: number` (e.g. 4.8) · `count?: number` (rendered "(16)" in `text-s-ink-2`, compact only) · `mode?: "compact" | "five"` (default `compact`) · `size?: "sm" | "md" | "lg"` (default `md`; star 11/13/16px, text 12.5/13/15px) · `max?: number` (five mode, default 5) · `className?`.

a11y: compact `aria-label` = `"{value}, {count} reviews"` (or just value); five `aria-label` = `"{value} / {max}"`; stars `aria-hidden`. Value renders `tabular-nums` + `toFixed(1)` in compact.

## Use for
Any rating readout: salon cards, PDP header, search results, staff/barber pickers, review rows (five-star strip).

## Don't reuse for
Non-rating star iconography (favourite/save → `HeartButton`; pinned/featured → its own pill). Editable star *input* (collecting a review score) — not built; add an `interactive`/`onChange` variant here when needed, don't fork.

## Status
new, 2026-06-08, not yet migrated into call-sites.
