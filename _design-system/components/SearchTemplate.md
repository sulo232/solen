# SearchTemplate

**File:** `app/[locale]/_components/search/SearchTemplate.tsx`
**Layer:** 1 (chrome — surface is white + ink. Hosts Layer 3 children via `SalonCard`.)
**Provenance:** V3-D230 (2026-05-26, overnight Wave 3 rebuild)

---

## Purpose

Single shared result-list template for ALL salon discovery routes:
- `/search` (no pre-applied filter)
- `/coiffeur`, `/barbershop`, `/nails`, `/spa` (pre-applied service filter)

Replaces two legacy drift implementations:
- `components-legacy/search/SplitView.tsx` (V2-D70 era — used by `/search`)
- `components-legacy/CategoryPage.tsx` (V2-D49 era — 669 lines, used by 3 category routes)

Also resolves the formerly-broken `/spa` route, which previously rendered only a `SpaBelowGrid` FAQ stub and had no salon list at all.

---

## Public API

```ts
interface SearchTemplateProps {
  locale: string;                                    // /de | /en | /fr | /it
  serviceFilter?: SalonCategory | null;              // pre-pinned chip on category routes
  cityFilter?: CitySlug | null;                      // pre-pinned chip on /[city]/X routes
  breadcrumb?: { label: string; href?: string }[];   // last item = current page
  hero?: { title: string; subtitle?: string } | null;// compact hero block (category routes; /search omits)
  aboveSlot?: React.ReactNode;                       // collapsible per-category content above grid
  belowSlot?: React.ReactNode;                       // per-category SEO content below grid
}
```

---

## Visual signature

```
┌─────────────────────────────────────────────────────────┐
│  Header  (sticky z-50)                                   │
│  ────────────────────────────────────────────────────────│
│  Breadcrumb · Solen › Spa                                │
│  H1: "Spa & Wellness in Basel" (Inter Tight 800)         │
│  SearchSummaryBar  (sticky z-40, "Spa · Schweizweit")    │
│  FilterChipStrip   (sticky z-30, scrolls X on mobile)    │
│      [Filter] [Spa & Wellness ×] [Beliebteste] [...]     │
│  ────────────────────────────────────────────────────────│
│  ResultCount: "23 Salons"   [Karte toggle ▾]            │
│  ────────────────────────────────────────────────────────│
│  Grid: 2-col mobile / 3-col tablet / 4-col desktop       │
│  (2-col on lg when map open)                              │
│    [SalonCard] [SalonCard] [SalonCard] ...                │
│  ────────────────────────────────────────────────────────│
│  [Load more] button                                       │
│  ────────────────────────────────────────────────────────│
│  belowSlot — e.g. CoiffeurBelowGrid SEO content           │
└─────────────────────────────────────────────────────────┘
```

Empty state per `LoadingStates.md`: SearchX icon, "Keine Salons gefunden.", reset-filters CTA + back-to-home link.

Loading state: skeleton grid (shimmer pattern per SOURCE.md §10).

---

## Motion details

- Grid items use `salon-card-stagger` global class (SOURCE.md §6.3, NOT framer-motion per-item).
- Map toggle: `next/dynamic` with `ssr: false`, skeleton placeholder while bundle loads.
- Filter chip active state: `transition-colors duration-200 ease-glide`.
- "Mehr laden" button: 200ms ease-glide hover.

---

## Do / Don't

✅ **Use** when building any filterable salon-result list (category, search, city).

❌ **Don't reuse** for:
- Salon-detail PDP (use `SalonDetailV3`).
- Discovery feeds / TikTok-style scroll (different IA — use Entdecken pattern).
- Per-staff or per-service listings (different cards, different filters).

❌ **Don't fork** to add category-specific behavior. Per V3-D205 universal-components rule — branch on **data**, not on `category === 'X'`. If a category needs unique copy (e.g. spa's wellness disclaimer), pass it as `belowSlot` content, NOT branched inside SearchTemplate.

---

## Edge cases

- Empty result: shows "Keine Salons gefunden." empty state per LoadingStates.md
- Network error: shows AlertCircle + reset filters CTA
- Loading: shimmer skeleton matches SalonCard grid layout
- Map toggle open: grid switches from 4-col to 2-col side-by-side with map; mobile uses FAB toggle to swap grid ↔ map fullscreen
- Pre-filtered category routes (e.g. `/coiffeur`) lock the service chip — user can clear with the X to convert to `/search?service=coiffeur`
- Heart save (favorite): state is local via `HeartButton` inside `SalonCard`; SearchTemplate doesn't manage favorites directly anymore (V3-D230-fix bug: removed `onClickCapture` toggleFavorite that was unintentionally removing the favorite on every click of a saved card)

---

## Provenance

- **V3-D230 (2026-05-26 overnight)** — initial build per `_tasks/rebuild-specs/category-routes.md`. Single shared template. 5 routes wired (/search + 4 categories). Universal-components rule enforced.
- **V3-D230-fix (2026-05-26 overnight, last action)** — agent caught and removed `onClickCapture` that was toggling favorite on every click of a saved card (unintended side-effect). Final state: HeartButton inside SalonCard manages save state internally.

---

## Related

- `_design-system/components/SalonCard.md` (children rendered by SearchTemplate)
- `_design-system/components/HeartButton.md` (live inside each SalonCard)
- `_design-system/components/LoadingStates.md` (shimmer + empty patterns referenced)
- `_tasks/rebuild-specs/category-routes.md` (original spec)
