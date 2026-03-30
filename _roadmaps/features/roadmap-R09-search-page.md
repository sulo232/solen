# R09: Split-View Search Page (`/search`)

> **Wave 2** — Depends on Wave 1 completion + Manual Step 5 (Map provider API key).
> **Note**: This roadmap follows `ROADMAP_RULES.md` strict formatting.

## R1: BREAKAGE RISK ASSESSMENT

| Phase | Risk Level | Could Break | How to Prevent |
|---|---|---|---|
| Phase 1: Page + Components | 🟡 MEDIUM | New page might fail SSR if map lib isn't client-only | Wrap map component in `"use client"` + dynamic import with `ssr: false`. |
| Phase 2: Filter Integration | 🟡 MEDIUM | URL state hydration mismatch | Use `useSearchParams` inside `<Suspense>` boundary. |
| Phase 3: Map Features | 🔴 HIGH | Map provider SDK loading | Lazy-load map SDK. Provide fallback UI while loading. |
| Phase 4: Mobile Toggle | 🟢 SAFE | Visual-only | Standard FAB component. |

---

## R2: SEPARATE MANUAL VS CODE PHASES

**🧑 MANUAL PHASES**
- Manual Step 5 completed: Mapbox API key set in Vercel env vars as `MAPBOX_API`.

**🤖 CLAUDE CODE PHASES**
- Phase 1: Page scaffold + SplitView layout
- Phase 2: Search results grid + filter integration
- Phase 3: Map integration (pins, geolocation, clustering)
- Phase 4: Mobile view toggle FAB
- Phase 5: Post-Execution Smoke Test

---

## Phase 1: Page Scaffold + Split-View Layout

#### Files
- `[NEW]` `app/[locale]/search/page.tsx`
- `[NEW]` `components/search/SplitView.tsx`

#### Instructions
1. Create `app/[locale]/search/page.tsx` as a server component that reads `searchParams` (category, query, lat, lng, date).
2. Create `SplitView.tsx` as a `"use client"` component with a CSS grid: `grid-cols-2` on desktop (50% map / 50% results), `grid-cols-1` on mobile (toggle between views).
3. **Zone 2** design rules apply: `--bg` + max 1 carpet blob at 50% opacity. No grain. Syne + DM Sans only.
4. Page must NOT import Header or BottomNav (already in layout.tsx — Rule 27).

#### DO / DON'T Examples
✅ **DO**
```tsx
// app/[locale]/search/page.tsx
export default async function SearchPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  return (
    <main className="min-h-screen bg-s-bg-base dark:bg-s-dm-bg">
      <SplitView locale={locale} initialFilters={sp} />
    </main>
  );
}
```

❌ **DON'T**
```tsx
// BANNED — Rule 27: no layout duplicates
import { Header } from '@/components/layout/Header';
```

---

## Phase 2: Search Results Grid + Filter Integration

#### Files
- `[NEW]` `components/search/SearchResultGrid.tsx`
- `[MODIFY]` `components/search/SplitView.tsx`

#### Instructions
1. `SearchResultGrid.tsx`: grid of existing `<SalonCard>` components. Import from `@/components/SalonCard`.
2. Integrate with existing `/api/salons/` or `/api/search/` API endpoint for fetching results.
3. Add URL-driven filters using `useSearchParams`:
   - `?category=coiffeur` — category filter
   - `?q=balayage` — text/AI search
   - `?date=2026-04-01` — availability filter
   - `?priceMin=30&priceMax=150` — price range
4. Use existing `FilterBar.tsx` component for the filter row above results.
5. Loading state: use `<Skeleton variant="card" />` grid.

#### DO / DON'T Examples
✅ **DO**
```tsx
import SalonCard from '@/components/SalonCard';
import { FilterBar } from '@/components/FilterBar';
import { Skeleton } from '@/components/ui/Skeleton';
```

❌ **DON'T**
```tsx
// BANNED — Rule 8: don't rebuild existing components
const CustomSalonCard = () => { ... }  // Use the existing SalonCard!
```

> ⚠️ **BE CAREFUL**: Wrap `useSearchParams` usage in a `<Suspense>` boundary to prevent de-optimizing the route from static rendering.

---

## Phase 3: Map Integration

#### Files
- `[NEW]` `components/search/SearchMapView.tsx`
- `[MODIFY]` `components/search/SplitView.tsx`

#### Instructions
1. Create `SearchMapView.tsx` with `"use client"` directive.
2. Dynamic import the map library with `ssr: false`:
```tsx
const Map = dynamic(() => import('./MapInner'), { ssr: false });
```
3. Show salon pins on the map using coordinates from `salons.latitude` / `salons.longitude`.
4. Pin click → open existing `<QuickPreviewSheet>` from `components/ui/QuickPreviewSheet.tsx`.
5. Geolocation: use `navigator.geolocation.getCurrentPosition()` to center map on user. Show "Meinen Standort verwenden" button.
6. Pin clustering: group nearby pins into count bubbles at low zoom levels.
7. Map pins use `bg-s-coral` color for consistency.
8. **Performance**: Only render visible pins (viewport query).

> ⚠️ **BE CAREFUL**: Map SDK must load client-side only. SSR will crash. Always use dynamic import.

---

## Phase 4: Mobile View Toggle

#### Files
- `[NEW]` `components/search/MobileViewToggle.tsx`
- `[MODIFY]` `components/search/SplitView.tsx`

#### Instructions
1. On mobile (`< 768px`), show only ONE view at a time (grid OR map).
2. Add a floating "coin-flip" FAB in the bottom-right corner.
3. FAB toggles between 🗺️ and 📋 icons (use `Map` and `LayoutGrid` from `lucide-react`).
4. FAB design: `rounded-btn` (pill), `bg-s-coral`, `shadow-coral-glow`, `z-overlay` (40).
5. Animate view swap: `opacity` + `translateY` transition, 300ms `--ease`.

#### DO / DON'T Examples
✅ **DO**
```tsx
<button
  onClick={() => setView(v => v === 'grid' ? 'map' : 'grid')}
  className="fixed bottom-24 right-4 z-40 bg-s-coral text-white p-4 rounded-btn shadow-coral-glow hover:shadow-coral-glow-hover transition-all"
>
  {view === 'grid' ? <Map size={20} /> : <LayoutGrid size={20} />}
</button>
```

---

## Phase 5: Smoke Test

#### Verification
```bash
npm run build
npx tsc --noEmit
# Browser tests:
# 1. Navigate to /de/search — split view renders (desktop)
# 2. Click a salon pin — QuickPreviewSheet opens
# 3. Mobile viewport — FAB visible, toggles between views
# 4. Filter by category — results update, URL updates
# 5. Search query — results filter by text
```

---

## R6: DEPENDENCY ORDERING TABLE

| Step | Type | What | Depends On |
|---|---|---|---|
| Phase 1 | 🤖 | Page scaffold + SplitView | Manual Step 5 (map key) |
| Phase 2 | 🤖 | Results grid + filters | Phase 1 |
| Phase 3 | 🤖 | Map integration | Phase 1 |
| Phase 4 | 🤖 | Mobile toggle | Phase 2 + Phase 3 |
| Phase 5 | 🤖 | Smoke Test | All phases |
