# SalonBuy — section spec

**Reference:** (no Fresha screenshot for this exact pattern; Fresha shows "Buy → Memberships / Vouchers / Gift cards"; Solen-only gift card promo) · `_audits/screenshots/salon-detail/10-mobile-haarwerk-c2.png` (Solen — Gutscheine row)
**Component:** `app/[locale]/_components/salon/SalonBuy.tsx`
**Layer:** 1 (chrome)

## Layout

### Standalone variant (default)
```
┌────────────────────────────────────────┐
│ [Gift 24px]   Gutscheine               │
│               Verschenke einen Tag …   │
│                                    [>] │
└────────────────────────────────────────┘
```
- Wraps `<Link>` to `/{locale}/salon/{slug}/gift-card`
- `rounded-2xl border-s-border bg-white p-4 md:p-5`
- Icon container: `h-14 w-14 md:h-16 md:w-16 rounded-2xl bg-white grid place-items-center`
- Title: `15px md:16px font-bold tracking-tight text-s-ink`
- Subtitle: `13px md:14px text-s-ink-3`
- Chevron: `18px text-s-ink-3 group-hover:translate-x-1`

### Sidebar variant
- Compact 1-row layout w outline-pill "Kaufen" button
- Used inside SalonSidebar on desktop

## Tokens
- All chrome: `bg-white border-s-border text-s-ink` — Layer 1 pure chrome
- Icon: lucide `Gift` 24px `text-s-ink`
- Hover bg: `hover:bg-s-bg-sunken`

## Interaction
- Click anywhere on the card → navigate to gift-card page
- Sidebar "Kaufen" button: same navigation

## Intentional deviations
- Solen has gift-card only (memberships + vouchers deferred); Fresha shows all three. When memberships ship, extend this component with a `type` prop.
- Background is white (not cream — V3-D193 substrate revert)

## Edge cases
- Always renders (gift-card route is always available — no feature flag)

## Provenance
- V2-D53.3 — initial impl
- V3-D193 — substrate updated to pure white per atmosphere-revert (component already on-spec)
- V3-D202 (A11) — provenance docblock cleanup ("neutral cream" → "bg-white")
