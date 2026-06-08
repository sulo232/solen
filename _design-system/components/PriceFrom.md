# PriceFrom — "{label} {amount} CHF" (CONTRADICTIONS.md §4, 2026-06-08)

**File:** `app/[locale]/_components/primitives/PriceFrom.tsx`
**Layer:** 1 (neutral price text — renders in **inherited ink** so it adopts the caller's meta-text colour; the optional label is `text-s-ink-2`).

## Why this exists
"ab X CHF" was spelled **3 different ways inside `SalonResultCard.tsx` alone** (lines 235/305/389) plus `SalonServices.tsx`. This collapses them to one. Swiss format is **`{amount} CHF`** (number first) — matches the shipped `SalonResultCard` render. The label (i18n "ab") is passed by the caller, not baked in, so it localises per route.

## API (props)
`amount: number` (CHF) · `label?: string` (localised prefix, e.g. `t("from")` → "ab"; omit for a bare price) · `emphasis?: boolean` (bold the amount — focal on result cards; default **false** = amount inherits weight, so service rows that recede per LOCKFILE A13 stay grey-normal) · `className?`.

Renders `inline-flex items-baseline gap-1 tabular-nums`; label (when present) in `text-s-ink-2`, then `{amount} CHF`.

## Use for
Any "from / ab" price on cards + service rows (search results, salon services, PDP). Pass `label` for the "ab"-prefixed form, omit it for a bare `{amount} CHF`.

## Don't reuse for
Currency formatting beyond the Swiss "{amount} CHF" pattern (decimals, other currencies, ranges "X–Y CHF") — not built; extend here, don't fork. Semantic price colouring (a discount/strike price needs its own treatment, not this neutral text).

## Status
new, 2026-06-08. Migrated: SalonResultCard (4 spots, `emphasis`) + SalonServices (plain — amount inherits the receding A13 service-row style).
