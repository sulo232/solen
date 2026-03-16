# Task: Dev 2 — Customer-Facing Frontend
- **Agent**: feature-agent
- **Started**: 2026-03-16
- **Status**: in-progress
- **Files touched**:
  - `tailwind.config.js`
  - `app/[locale]/layout.tsx`
  - `app/[locale]/coiffeur/page.tsx`
  - `app/[locale]/barbershop/page.tsx`
  - `app/[locale]/nails/page.tsx`
  - `app/[locale]/spa/page.tsx`
  - `app/[locale]/makeup/page.tsx`
  - `app/[locale]/waxing/page.tsx`
  - `app/[locale]/last-minute/page.tsx`
  - `components/` (all new files)

## What was done (Phase 1 + Phase 3)

### Phase 1.1 — Tailwind Config
- Added `teal`, `coral`, `dark` color tokens
- Added `heading` (Syne), `body` (DM Sans), `data` (Space Grotesk) font families via CSS vars
- Added `card`, `pill`, `button` border radii
- Added `card` and `coral-glow` box shadows
- Expanded `content` glob to cover `app/` and `components/`

### Phase 1.2 — Fonts
- Self-hosted via `next/font/google`: Syne, DM Sans, Space Grotesk
- Applied as `--font-syne`, `--font-dm-sans`, `--font-space-grotesk` CSS variables on `<html>`
- Removed `overflow: hidden` from body (was blocking scroll on sub-pages)

### Phase 1.3 — Component Library
Created the following in `components/`:
- `ui/Spinner.tsx` — CSS-only, props: size, invert, className
- `ui/PriceSlider.tsx` — Native range fallback (TODO: swap to @radix-ui/react-slider)
- `ui/ExpandableTabs.tsx` — CSS transitions only, no framer-motion
- `layout/Header.tsx` — Glass nav, shrinks on scroll >10px, unread coral dot, mobile hamburger
- `SalonCard.tsx` — default + compact variants, used by Dev 3
- `QuartierTile.tsx` — 160×100px, visited badge, coral heart
- `ServiceTile.tsx` — 6 tiles with Lucide icons, "Favorit" badge
- `LastMinuteCard.tsx` — coral left-border, live 60s countdown
- `FilterBar.tsx` — sticky pills (quartier, price, availability, rating, sort) → URL params
- `CategoryPage.tsx` — template for all 6 category pages, list/map toggle, load more, map sync
- `MapView.tsx` — stub (TODO: install mapbox-gl)
- `BookingCalendar.tsx` — Phase 4 stub
- `ChatWindow.tsx` — Phase 6 stub (Dev 3 reuses)
- `index.ts` — barrel re-exports

### Phase 3 — Category + Last-Minute Pages
- All 6 category pages now render `<CategoryPage category="..." />`
- `app/[locale]/last-minute/page.tsx` — full grid, FilterBar, Supabase Realtime slot fade-out, empty state

## Blocked / Pending

- **`package.json` is locked by `bug-agent`** — the following packages are not yet installed:
  - `@radix-ui/react-slider` (PriceSlider uses native range fallback)
  - `mapbox-gl` + `@types/mapbox-gl` (MapView is a stub)
  - `driver.js` (Phase 8 tutorial — not started)
  - Run: `npm install @radix-ui/react-slider mapbox-gl driver.js && npm install -D @types/mapbox-gl`

## Remaining Phases
- Phase 2 — Homepage (replace iframe)
- Phase 4 — Salon Profile + BookingCalendar
- Phase 5 — Auth UI
- Phase 6 — Messaging UI (ChatWindow)
- Phase 7 — Customer Account
- Phase 8 — Tutorial (driver.js)

## Risks / Side Effects
- `layout.tsx` body no longer has `overflow: hidden` — the iframe homepage at `/` still works but body can now scroll. This is intentional for sub-pages.
- `tailwind.config.js` was previously Vite-only; now includes `app/` and `components/` in content. Should not break existing build.
- `components/index.ts` is the Dev 3 contract — do not rename or move exported names.
