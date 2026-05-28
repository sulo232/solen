# Category routes (search + 4 service-filtered) Rebuild Spec — 2026-05-26

> Audit + shared-template rebuild spec for `/search`, `/coiffeur`, `/barbershop`, `/nails`, `/spa`.
> Targets V3-D193 / SOURCE.md alignment. All 5 routes currently duplicate the same IA from two
> different stale implementations — one shared `SearchTemplate` resolves it.

---

## Current state — drift summary

### Shared-template status: **PARTIAL — two parallel implementations, neither V3-locked**

The 5 routes do NOT share a single template today. They split into two stacks:

| Route | Page wrapper | Render component | Era | Lines |
|---|---|---|---|---|
| `/search` | `app/[locale]/search/page.tsx` | `components-legacy/search/SplitView.tsx` | V2-D70 (warm-minimal, glass) | 254 |
| `/coiffeur` | `app/[locale]/coiffeur/page.tsx` | `components-legacy/CategoryPage.tsx` (category="coiffeur") | V2-D49 era | 669 |
| `/barbershop` | `app/[locale]/barbershop/page.tsx` | same `CategoryPage` (category="barbershop") | same | — |
| `/nails` | `app/[locale]/nails/page.tsx` | same `CategoryPage` (category="nails") | same | — |
| `/spa` | `app/[locale]/spa/page.tsx` | NO `CategoryPage` — only `<SpaBelowGrid>` | half-built | 77 |

Plus a **third unused implementation** at `app/[locale]/_components/search/SearchResults.tsx` (414 lines) that no route imports today — looks like an abandoned V3-D52 rebuild attempt.

**Verdict: the 4 category routes already share `CategoryPage` (good). `/search` uses a different legacy `SplitView` (bad). `/spa` is broken (no list, just `SpaBelowGrid` stub). Three implementations exist; all three are V2-era drift.**

### Drift by route

**`/search` → `SplitView`** ([components-legacy/search/SplitView.tsx](../../components-legacy/search/SplitView.tsx))
- Legacy 2-column desktop layout: left scroll = results, right sticky = map. Mobile = toggle FAB between grid + map. The map split is **intentional + good IA**, but the chrome around it is V2-era.
- Uses `border-s-ink/[0.06]` retired hairline (should be `border-s-border`).
- `FilterBar` import from legacy (`components-legacy/ui/FilterBar`) — old chip primitive, not V3 spec.
- Uses legacy `SalonCard` (`components-legacy/SalonCard`) NOT the V3 `app/[locale]/_components/homepage/SalonCard.tsx`.
- `s-coral` ring on selected card (line 110-112). `s-coral` family RETIRED V3-D139 — should be `outline-s-ink` per §16.2.
- No skeleton loader, no V3 empty state. Spinner-only via legacy `Spinner`.
- Hardcoded German `"Ergebnisse"` outside i18n.

**`/coiffeur`, `/barbershop`, `/nails` → `CategoryPage`** ([components-legacy/CategoryPage.tsx](../../components-legacy/CategoryPage.tsx))
- 669 lines. Massive drift surface.
- **Hardcoded hex in inline styles**: `#1A1209` (line 409), `#C05038` (lines 428-430, 484-489), `rgba(26,18,9,…)` everywhere. These are V2-D49 warm-minimal cream/terracotta values — fully retired post-B&W pivot.
- **Retired tokens**: `s-coral` (lines 99, 105, 371, 379, 381, 541), `s-amber` (line 89), `glass-toolbar` CSS class (line 396), `glass-bg-card` CSS var, `--raised` CSS var.
- **Hero**: terracotta H1 (`text-s-coral` line 379), `font-display text-4xl md:text-6xl` outside SOURCE.md §3 role table.
- **Breadcrumb**: uses `font-heading` (old alias) + uppercase tracking-[.12em] (drift from §3 — only BusinessTeaser eyebrow uses uppercase).
- **City selector pills**: hardcoded inline styles + retired colors.
- **Filter UI**: legacy `FilterBar`, `SubCategoryChips`, `SortDropdown` — none use V3 tokens.
- **Salon card**: legacy `<SalonCard>` from `components-legacy/SalonCard.tsx`, NOT the V3 one with `variant="service"` + Row 1 star + AvailabilityPill retirement.
- **Directory entries**: dashed-border DirectoryCard for non-bookable Google listings (lines 59-113). Mixes brand-chrome bookable cards with off-brand directory cards in the SAME grid — violates §8 card grammar (no consistent hover behavior across same row).
- **Animation**: framer-motion `containerVariants` / `itemVariants` instead of `salon-card-stagger` global class per §6.3.
- **Load-more button**: glass-blur with `backdropFilter` on the button itself (perf cost per §13.1). Copy is German hardcoded `"weitere Salons"` outside i18n.
- **Inline mini-map on mobile** (lines 521-546): nice idea but the dark overlay `bg-gradient-to-t from-s-ink/40` overlays content — `s-ink` was meant to be a TEXT color, not an overlay tint. And the prompt pill says `text-s-coral`.

**`/spa` → fallback** ([app/[locale]/spa/page.tsx](../../app/[locale]/spa/page.tsx))
- **Critical**: route has no list at all. Renders only `<SpaBelowGrid>` (a static FAQ/SEO module) inside a centered flex container. **Spa salons are unreachable from this page.**
- Likely an in-flight migration that was halted. Either the route is broken or `/spa` traffic redirects to `/search?service=spa` somewhere — but the routing isn't documented.

**`SearchResults.tsx` (orphan)** ([app/[locale]/_components/search/SearchResults.tsx](../../app/[locale]/_components/search/SearchResults.tsx))
- 414 lines, uses V3 `SalonCard`, has skeletons + empty state.
- Routes don't import it. Was an attempt at the rebuild, never wired up.
- Drift inside it: `text-s-accent` used on H1 highlight + empty-state heart-color spot — but `s-accent` was royal blue (NEW V3-D192 lock). The file pre-dates the V3-D192 reactivation, so `text-s-accent` here is the OLD retired golden amber. Worth salvaging the empty-state pattern + skeleton; rest needs rewriting.

### Cross-route drift summary

| Drift | `/search` (SplitView) | `/coiffeur` `/barber` `/nails` (CategoryPage) | `/spa` |
|---|---|---|---|
| Hardcoded hex | minimal | extensive (`#1A1209`, `#C05038`, rgba's) | n/a (no list) |
| Retired `s-coral` token | yes (selected ring) | yes (hero, breadcrumb chip, mobile map) | n/a |
| Retired `s-amber` token | no | yes (directory star) | n/a |
| Legacy `SalonCard` (not V3) | yes | yes | n/a |
| Wrong skeleton primitive | no skeleton at all | legacy `Skeleton` (not §10.1 shimmer) | n/a |
| Empty state per §10.2 | basic, no CTA | basic, no CTA | n/a |
| Filter chip primitive | legacy `FilterBar` (drift) | legacy `FilterBar` (drift) | n/a |
| Map toggle | yes (good IA) | yes (good IA, mobile only) | no |
| Sort menu | inline | legacy `SortDropdown` | no |
| Hero per §3 | none (just count h1) | terracotta H1 outside §3 role table | none |
| `salon-card-stagger` per §6.3 | no | no (framer-motion) | n/a |
| `font-display` per §3 | inconsistent | inconsistent | n/a |

---

## Target IA — filterable result list

A unified IA cribbing Fresha's information architecture, restyled through Solen V3 chrome.

### Mobbin/Fresha references captured

**Mobbin (Fresha search results, iOS)**: 6 screens covering the canonical IA — sticky search summary header, filter chip strip (icons-only filter btn / Sort by / Max price / Venue type), `21 venues nearby` count line, big-photo cards with name + rating + neighborhood + service list + time-slot pills, bottom tab nav.

**Mobbin (Fresha filter sheet)**: 2 screens — bottom sheet with "Sort by" radio group + "Maximum price" slider + "Venue type" segmented chip toggle + Clear/Apply bottom pair. The visual register is the same B&W chrome we're targeting.

**Chrome live captures** (saved to `public/_pixel-refs/fresha/search/`):
- [`list-mobile-375.png`](../../public/_pixel-refs/fresha/search/list-mobile-375.png) — fullpage 375×14106
- [`list-desktop-1440.png`](../../public/_pixel-refs/fresha/search/list-desktop-1440.png) — viewport 1440×900

**Cross-marketplace references** (Mobbin: Marriott Bonvoy / IHG / Vrbo / Klook / ClassPass / Skyscanner): same fundamental IA — sticky chip header, dense list, sort+filter menu. Validates the pattern.

### Layout — the 7 components stacked

```
┌─────────────────────────────────────────────────────────────┐
│  Header (existing, sticky z-50)                              │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│  SearchSummaryBar (NEW, sticky z-40, full-bleed)             │
│  • Service · Stadt · Zeit summary chips (echo of SearchBar)  │
│  • Map toggle btn on right (desktop) or under (mobile)       │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│  FilterChipStrip (NEW, scrollable-x, sticky below summary)   │
│  • [icon] Filter  ·  Sort by  ·  Verfügbarkeit  ·  Bewertung │
│  • Active chip = `bg-s-ink text-white`                       │
│  • Tap "Filter" opens FilterSheet (mobile) / FilterMenu (dt) │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│  ResultCountRow                                              │
│  • "12 Salons in Basel" — body-secondary, font-body 13px     │
│  • Or just "12 Salons" if no city filter                     │
└─────────────────────────────────────────────────────────────┘
┌──────────────────────────┬──────────────────────────────────┐
│  ResultList              │  MapPanel (desktop only ≥md)     │
│  • Vertical column of    │  • Sticky, vh - 140              │
│    SalonCard             │  • Pins per salon                │
│  • Mobile: 1 col         │  • Click → preview sheet         │
│  • md: 2 cols            │  • Toggle hides this on dt       │
│  • lg: 2-3 cols (if no   │                                  │
│    map) / 2 (with map)   │  Mobile: replaced by FAB toggle  │
│                          │  to full-screen MapView          │
└──────────────────────────┴──────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│  Pagination (LoadMore button OR infinite scroll trigger)     │
│  • `bg-s-ink text-white` pill, "Weitere Salons laden"        │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│  PageBelowSlot — category-specific SEO content              │
│  • CoiffeurBelowGrid / BarbershopBelowGrid / etc.            │
│  • Optional. /search has nothing here.                       │
└─────────────────────────────────────────────────────────────┘
```

### Decisions

**Map default state**: List-only on mobile (FAB toggle to enter map mode); split 60/40 on desktop with map collapsible via Hide-map button. Matches Fresha. Map IS the navigation aid for hyper-local choice on a Swiss city, so it should be 1 tap away — but not the default visual focus.

**Filter chip strip vs filter sheet**: Both. Strip is for quick toggles (Sort, Verfügbarkeit, Bewertung). The leading "Filter" chip opens a sheet/menu with the full set (price range, walk-in, deals, open-now, instant-bookable). Matches Fresha's pattern.

**Categories on `/search`**: When `/search` is reached without a service filter, show ALL salons. Category filter happens via the FilterSheet "Service type" segmented chips (Coiffeur / Barbershop / Nails / Spa / Makeup / Waxing).

**Categories on `/coiffeur` etc.**: Pre-filtered by service. The service filter chip in the chip strip is locked-on (showing "Coiffeur ×" — tap × to navigate back to `/search`). Keeps the user oriented and gives a clear "back to all" affordance.

**Hero per route**: NO H1 hero on `/search` (it's an empty query state, count IS the hero). Category routes get a compact H2 + count line — H2 reuses Section H2 spec from §3 ("Coiffeur in Basel"). NO terracotta highlight. NO uppercase. Sentence case per §18.

**Breadcrumb**: Keep. Use Eyebrow style from §3 (Hanken 12px bold uppercase tracking-[0.16em] text-s-ink-3) — same as BusinessTeaser eyebrow. ONE allowed uppercase moment per §18.

**City selector pills**: Keep but rebuild. The current implementation has retired hex + inline styles. Use `FilterChip` primitive with same active/inactive states. Optional — `/search` has no city pre-filter, all category routes do.

---

## Per-section spec (against SOURCE.md V3-D193)

Each section explicitly maps to a SOURCE.md anchor + a per-component rule.

### S1 · Page wrapper (server component)

```tsx
<main className="min-h-screen bg-s-bg-base">
  <Suspense fallback={<CategoryRouteSkeleton />}>
    <SearchTemplate
      locale={locale}
      serviceFilter={null /* or "coiffeur" | "barbershop" | "nails" | "spa" */}
      initialSearchParams={sp}
      breadcrumb={["Solen", /* dynamic */ "Coiffeur"]}
      hero={null /* or { title, count } */}
      belowSlot={null /* or <CoiffeurBelowGrid /> */}
    />
  </Suspense>
</main>
```

- Server: render layout shell + metadata + JSON-LD. **Server fetches initial salon list** so the page is data-hydrated on first paint (matches `/coiffeur` current behavior; better SEO than client-only `/search`).
- Client: `<SearchTemplate>` is a client component (interactive filters, pagination, map).

### S2 · SearchSummaryBar (sticky, NEW)

References: SOURCE.md [§6.4 interaction patterns](../../_design-system/SOURCE.md#§6--motion-vocabulary), [§14 component authoring](../../_design-system/SOURCE.md#§14--component-authoring-contract), SearchBar.md collapsed mobile (h-12 rows pattern).

```
┌────────────────────────────────────────────────────────┐
│ Service · Stadt · Zeit                          [Karte]│  ← 56px tall, sticky top-[57px]
└────────────────────────────────────────────────────────┘
```

- Tappable: opens SearchBar in expanded morph mode (reuse the SearchBar primitive via prop `mode="summary"` — see §S8 component additions).
- Map toggle (right): `bg-s-ink text-white` when map active; `bg-white border-s-border text-s-ink` at rest. Lucide `Map` icon + label.
- Style: `bg-s-bg-base/95 backdrop-blur-md md:backdrop-blur-panel` (gated by `md:` per §13.1 mobile perf rule).
- Hairline: `border-b border-s-border`.

### S3 · FilterChipStrip (sticky, NEW)

References: Mobbin Fresha filter chips, SOURCE.md §6.4 (button motion), §17 i18n.

```
[≡ Filter (2)] · [Sortieren ▾] · [Heute frei] · [4.0+ ★] · [Preis ▾]
```

- Horizontal scroll-x on mobile. Hidden scrollbar.
- Each chip:
  - At rest: `bg-s-bg-base border border-s-border text-s-ink-2 px-3 py-1.5 rounded-pill text-[13px] font-medium`
  - Active: `bg-s-ink text-white border-s-ink`
  - Hover: `border-s-ink text-s-ink` over `150ms ease-glide`
  - Active scale: `active:scale-[0.97] active:duration-[80ms]` per §6.4
- Leading "Filter (N)" chip:
  - Lucide `SlidersHorizontal` icon + label + active-filter count badge
  - Tap → opens FilterSheet (mobile) / FilterMenu popover (desktop ≥md)
- Sort chip:
  - Chevron-down indicator
  - Tap → SortMenu popover
  - Active label = chosen sort ("Bestbewertet ▾")
- Per-pill remove behavior: tapping an active chip OFF the strip clears its filter (toggle semantics)
- Sticky `top-[57px+56px]=113px` on desktop (below Header + SummaryBar). Mobile sticky behavior same.

### S4 · ResultCountRow

References: SOURCE.md §3 body secondary spec, §10.1 loading.

```
12 Salons in Basel · Sortiert nach Bewertung
```

- Style: `font-body text-[13px] font-light text-s-ink-2 px-4 md:px-6 mt-3`
- Loading: skeleton bar `h-3 w-32 bg-s-bg-sunken rounded animate-shimmer`
- Empty (0 results): copy switches to empty-state language ("Keine Salons" — see S6 empty)

### S5 · ResultList — SalonCard column

References: [SalonCard.md](../../_design-system/components/SalonCard.md), SOURCE.md [§8 card grammar](../../_design-system/SOURCE.md#§8--card-grammar).

**Use the V3 `<SalonCard>`** from `app/[locale]/_components/homepage/SalonCard.tsx` (the only one). Pass `variant="service"`.

Grid:
- Mobile (`< md`): 1 column, `gap-y-6 px-4`
- md (`768-1023`): 2 columns, `gap-x-4 gap-y-6 px-6`, **with map**: only the left half = 2 narrower cards (`gap-x-3 gap-y-5`)
- lg-xl (`≥1024`): map open = 2 cols on the left half; map closed = 3-4 cols full-width

Card width: pass `className="!w-full"` (override SalonCard default formula meant for horizontal scroll carousels).

Card props per result:
```tsx
<SalonCard
  slug={salon.slug}
  name={salon.name}
  rating={salon.average_rating}
  category={safeCategory(salon.categories)}
  photoUrl={salon.cover_photo_url}
  variant="service"
  discountPercent={salon.last_minute_discount_percent}
  nextSlotLabel={formatNextSlot(salon.next_available_slot)}
  priceFromCHF={salon.lowest_price_chf}
  address={salon.address?.split(",")[0]}
  city={salon.city ?? cityFromParams}
  isSaved={favoriteIds.has(salon.id)}
  className="!w-full"
/>
```

Stagger entrance: wrap the grid in a `<div className="salon-card-stagger">` per §6.3 (NOT framer-motion — drop the legacy `motion.div` wrappers).

### S6 · Loading / empty / error states

References: [LoadingStates.md](../../_design-system/components/LoadingStates.md), SOURCE.md [§10](../../_design-system/SOURCE.md#§10--loading--empty--error--async-state-grammar).

**Loading**: 6 `<SalonCardSkeleton>` in the grid (matches LoadingStates.md Pattern 1).

```tsx
function SalonCardSkeleton() {
  return (
    <div className="flex w-full flex-col">
      <div className="aspect-square w-full rounded-[22px] bg-gradient-to-r from-s-bg-sunken via-white to-s-bg-sunken skeleton-shimmer" />
      <div className="mt-[10px] px-[2px] space-y-1.5">
        <div className="h-4 w-3/4 rounded bg-s-bg-sunken animate-shimmer" />
        <div className="h-3 w-1/2 rounded bg-s-bg-sunken animate-shimmer" />
        <div className="h-3 w-2/5 rounded bg-s-bg-sunken animate-shimmer" />
      </div>
    </div>
  );
}
```

**Empty** (per §10.2):
```
                ┌──────┐
                │  🔍   │      ← lucide SearchX, 36px, text-s-ink-3
                └──────┘

         Keine Salons in Basel.       ← font-display 18px bold ink
   Versuche eine andere Stadt oder lass die Filter weg.
                                       ← font-body 14px text-s-ink-2

         [    Alle Filter löschen   ]  ← bg-s-ink primary CTA
                              [ Andere Stadt → ]  ← secondary link
```

Centered min-h-[400px]. Two-action layout: primary "Filter löschen" + secondary "Andere Stadt".

**Error** (per §10.3):
```
[AlertCircle icon, text-s-ink-3]
Etwas ist schiefgelaufen.
Wir konnten die Salons nicht laden.
[ Nochmal versuchen ]
```

`console.error("[SearchTemplate] fetch failed:", err)` per CLAUDE.md error-handling rule.

### S7 · Pagination

Default to **LoadMore button** (current pattern in both legacy implementations). Infinite scroll deferred (Q-flag for later — see Risks).

```tsx
<div className="flex justify-center pt-8 pb-12">
  <button
    onClick={handleLoadMore}
    disabled={loadingMore}
    className="bg-s-ink text-white rounded-btn px-6 py-3 font-body text-[14px] font-bold active:scale-[0.97] active:duration-[80ms] disabled:opacity-50 transition-transform"
  >
    {loadingMore ? <Loader2 className="animate-spin" size={16} /> : `Weitere ${remaining} Salons`}
  </button>
</div>
```

Copy: pluralize via next-intl (§17.4): `"weitere"` always lowercase even after numerals per German rules.

### S8 · MapPanel (desktop split) + MapView (mobile full-screen)

References: existing legacy `MapView` (Mapbox embed, dynamic-imported), SOURCE.md [§21.3 Fresha mappings](../../_design-system/SOURCE.md#§21--fresha-translation-playbook): "Map = Mapbox embed; SolenMap component (TBD)".

**Desktop (`≥ md`, map open)**: Right column, sticky, `h-[calc(100vh-{header+summary+chips})]`, `rounded-card` corners visible, `border-l border-s-border` hairline.

**Mobile (`< md`)**: FAB toggle bottom-right `fixed bottom-4 right-4 z-50` that switches mobileView state from `"list"` ↔ `"map"`. When `"map"`: full-viewport MapView replaces list. Bottom card sheet shows the selected pin's salon (use the existing `QuickPreviewSheet` primitive, restyled to V3).

**Map pin styling**: dark `s-ink` pins (per §21.5 — drop Fresha purple/blue). Selected pin: larger, with rating badge inside (matches IHG/Klook patterns).

**This component should be a SEPARATE primitive** at `app/[locale]/_components/search/SearchMap.tsx` — keep map logic outside `SearchTemplate.tsx` so SSR isn't blocked. Use `dynamic(() => import(...), { ssr: false })`.

---

## New components needed

Three new shared primitives. Each needs a `.md` doc in `_design-system/components/` per §14.7.

### FilterChip — `_design-system/components/FilterChip.md`

```ts
export interface FilterChipProps {
  label: string;
  value?: string | number;             // Show "Sort by: Bewertung ▾"
  active?: boolean;                    // active=true → bg-s-ink text-white
  icon?: React.ComponentType<{ size?: number; strokeWidth?: number }>;  // lucide
  count?: number;                      // For "Filter (3)" badge
  hasDropdown?: boolean;               // Show chevron-down
  onClick: () => void;
  removable?: boolean;                 // Show × on active (toggle off)
  onRemove?: () => void;
  className?: string;
}
```

**Anatomy** (per Mobbin Fresha chips):
- Default: `rounded-pill bg-s-bg-base border border-s-border text-s-ink-2 px-3.5 py-1.5 text-[13px] font-medium`
- Active: `bg-s-ink text-white border-s-ink`
- Hover: `hover:border-s-ink hover:text-s-ink 150ms ease-glide`
- Press: `active:scale-[0.97] active:duration-[80ms]`
- Focus: `focus-visible:outline-2 focus-visible:outline-s-ink focus-visible:outline-offset-2`
- Min height 32px. 44×44 hit area via `min-h-[44px]` parent wrapper.

### FilterSheet — `_design-system/components/FilterSheet.md`

Bottom sheet (mobile) + popover (desktop) — composes the existing `Sheet` primitive.

```ts
export interface FilterSheetProps {
  open: boolean;
  onClose: () => void;
  filters: FilterDefinition[];          // pulled from search-filter-pills.ts
  active: ActiveFilterState;
  onApply: (state: ActiveFilterState) => void;
  onClear: () => void;
}
```

**Anatomy** (per Mobbin Fresha filter sheet, B&W chrome):
- Sheet container: `rounded-sheet bg-s-bg-base shadow-elevation-3`
- Header: "Filter" title + close X
- Sections:
  - Service type (segmented `FilterChip` row): Coiffeur / Barbershop / Nails / Spa / Makeup / Waxing
  - Sort by (radio list `Radio` primitive): Bestbewertet / Neueste / Last-Minute / Entfernung
  - Verfügbarkeit (chip row): Heute / Diese Woche / Custom-Datum
  - Bewertung (chip row): 4+ ★ / 4.5+ ★ / 4.8+ ★
  - Preis (range slider — defer; use Sort+max only in v1): Maximum CHF X
  - Toggles (Switch primitives): Walk-in / Sofort buchbar / Online bezahlen
- Footer: 2-button row — `[Zurücksetzen]` (secondary outline) + `[Anwenden]` (`bg-s-ink text-white`)
- Z-index: `z-sheet-bg` backdrop + `z-sheet` content per §12

### SortMenu — `_design-system/components/SortMenu.md`

Simpler popover for the Sort chip's dropdown only.

```ts
export interface SortMenuProps {
  open: boolean;
  value: SortValue;
  options: { value: SortValue; label: string }[];
  onChange: (v: SortValue) => void;
  onClose: () => void;
}
```

Anatomy: lifted from the existing inline `SortDropdown` in `SearchResults.tsx` (lines 311-368) — that one is the cleanest existing implementation. Just rename + extract + style with `bg-s-bg-raised border-s-border rounded-card shadow-elevation-3` per §5.

---

## Shared template strategy

**Recommendation: ONE template** at `app/[locale]/_components/search/SearchTemplate.tsx` that all 5 routes consume with a `serviceFilter` prop.

### API

```ts
// app/[locale]/_components/search/SearchTemplate.tsx
"use client";

export interface SearchTemplateProps {
  /** Locale string from page params */
  locale: string;
  /** Pre-applied service filter (`/coiffeur` etc.) — pins the service chip OR null for /search */
  serviceFilter: "coiffeur" | "barbershop" | "nails" | "spa" | null;
  /** SSR-fetched initial salon list (server-rendered) */
  initialSalons?: Salon[];
  /** SSR total count */
  initialTotal?: number;
  /** URL params from the page server-side */
  initialSearchParams: Record<string, string | string[] | undefined>;
  /** Breadcrumb chain — last item is the current page */
  breadcrumb?: { label: string; href?: string }[];
  /** Hero block (category routes get one, /search does not) */
  hero?: { title: string; subtitle?: string } | null;
  /** Slot for SEO content below the result list (e.g. CoiffeurBelowGrid) */
  belowSlot?: React.ReactNode;
  /** Optional slot for category-specific filters (e.g. CoiffeurAboveGrid) — collapsed by default */
  aboveSlot?: React.ReactNode;
}

export default function SearchTemplate(props: SearchTemplateProps): JSX.Element;
```

### Server-side caller pattern (all 5 routes)

```tsx
// app/[locale]/coiffeur/page.tsx
export default async function Page({ params }) {
  const { locale } = await params;
  const initialSalons = await fetchCategorySalons("coiffeur", { limit: 12 });

  return (
    <main className="min-h-screen bg-s-bg-base">
      <Suspense fallback={<SearchTemplateSkeleton />}>
        <SearchTemplate
          locale={locale}
          serviceFilter="coiffeur"
          initialSalons={initialSalons.items}
          initialTotal={initialSalons.total}
          initialSearchParams={{}}
          breadcrumb={[
            { label: "Solen", href: `/${locale}` },
            { label: "Coiffeur" },
          ]}
          hero={{ title: "Coiffeur in Basel", subtitle: `${initialSalons.total} Salons` }}
          aboveSlot={<CoiffeurAboveGrid />}
          belowSlot={<CoiffeurBelowGrid />}
        />
      </Suspense>
    </main>
  );
}
```

```tsx
// app/[locale]/search/page.tsx
export default async function Page({ params, searchParams }) {
  const { locale } = await params;
  const sp = await searchParams;

  return (
    <main className="min-h-screen bg-s-bg-base">
      <Suspense fallback={<SearchTemplateSkeleton />}>
        <SearchTemplate
          locale={locale}
          serviceFilter={null}
          initialSearchParams={sp}
          breadcrumb={[
            { label: "Solen", href: `/${locale}` },
            { label: "Suche" },
          ]}
          hero={null}        /* /search has no hero — count line IS the hero */
          aboveSlot={null}
          belowSlot={null}
        />
      </Suspense>
    </main>
  );
}
```

### Why this API shape

- **`serviceFilter` prop drives behavior**, not the URL. Category routes pre-pin the service chip (showing "Coiffeur ×" with × routing back to `/search`). `/search` lets the user pick service via FilterSheet.
- **`initialSalons` prop for SSR**: category routes can server-fetch (good SEO, fast LCP). `/search` typically can't (depends on query params) so it passes nothing and the template handles client fetch.
- **`hero` / `aboveSlot` / `belowSlot` are content slots**: each category has its own SEO content (FAQ / "About coiffeur in Basel" content). `/search` has none. The template stays content-neutral.
- **`breadcrumb` is explicit**: prevents the template from having to infer from `serviceFilter` (which couples concerns).

### Internal state model

```ts
// Inside SearchTemplate
type SearchTemplateState = {
  salons: Salon[];
  total: number;
  page: number;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  favoriteIds: Set<string>;
  // UI state
  mobileView: "list" | "map";
  mapOpen: boolean;          // desktop split toggle
  filterSheetOpen: boolean;
  sortMenuOpen: boolean;
  // Filters synced to URL
  activeFilters: ActiveFilterState;
  selectedSalonId: string | null;  // for map ↔ list sync
};
```

Filter state ↔ URL is debounced (300ms) so chip toggles don't spam history. Same as current SplitView's `router.replace` pattern.

---

## Sequence of mechanical edits

A 7-step plan, in dependency order:

1. **Build `FilterChip` primitive** + write `_design-system/components/FilterChip.md`. Smallest, no other dependencies.
2. **Build `SortMenu` primitive** + write `.md`. Just needs FilterChip for the trigger.
3. **Build `FilterSheet`** + write `.md`. Depends on FilterChip + existing Sheet primitive + Radio + Switch.
4. **Build `SearchMap` primitive** at `app/[locale]/_components/search/SearchMap.tsx` (extract Mapbox logic from legacy `MapView`, restyle pins, add ssr:false dynamic wrapper).
5. **Build `SearchTemplate`** at `app/[locale]/_components/search/SearchTemplate.tsx`. Compose all of the above. Wire URL sync. Server-fetch hook via prop. This is the big PR.
6. **Migrate the 5 routes one-by-one**:
   - `/search/page.tsx` — replace `<SplitView>` with `<SearchTemplate serviceFilter={null}>`. Delete `SplitView.tsx` after.
   - `/coiffeur/page.tsx` — replace `<CategoryPage>` with `<SearchTemplate serviceFilter="coiffeur">`. Keep CoiffeurAboveGrid + CoiffeurBelowGrid pass-through.
   - Same for `/barbershop`, `/nails`.
   - `/spa/page.tsx` — wire `<SearchTemplate serviceFilter="spa">`. Keep `<SpaBelowGrid>` as belowSlot. **This fixes the broken `/spa` route** as a bonus.
7. **Delete legacy** (after migration passes verifier): `components-legacy/CategoryPage.tsx`, `components-legacy/search/SplitView.tsx`, `components-legacy/search/SearchResultGrid.tsx`, `components-legacy/search/SearchCriteriaChips.tsx`, `components-legacy/search/MobileViewToggle.tsx`, `app/[locale]/_components/search/SearchResults.tsx` (orphan).

After each step: run `/solen-drift-check`. After step 6: add `app/[locale]/_components/search/SearchTemplate.tsx` to `_rebuilt_routes.json` `strict_globs`.

---

## Risks / open questions

Issues that need user/PM decision before / during implementation. Each should be flagged in `QUESTIONS.md` if it doesn't get resolved in this spec review.

1. **Pagination — LoadMore vs infinite scroll?** Current legacy uses LoadMore. Infinite scroll is faster but harder to handle deep-link + scroll-restoration. **Recommend: LoadMore for v1, revisit for v2.**
2. **Map default state on desktop?** Open by default (Fresha pattern) or closed by default (less visual noise; user opts in)? **Recommend: closed by default — Solen targets Swiss cities, geo-density is lower than Fresha's US/UK markets. Open it on toggle.**
3. **Directory cards (non-bookable Google listings)?** Legacy CategoryPage shows these inline after bookable salons. Keep? Drop entirely? Move to a separate "Auch in Basel" section below the bookable list? **Recommend: separate section below — mixing card grammars violates §8 (no consistent hover across same row). Renders inside `belowSlot` per category.**
4. **City pre-filter URL pattern?** Legacy supports `/coiffeur` + `/[city]/coiffeur`. SearchTemplate should respect the city slug param. Confirm route structure stays — this spec assumes yes.
5. **`/search` filter — service chip pinned via prop or via URL `?service=X`?** This spec pins via prop. If `/search?service=coiffeur` arrives, the template should redirect to `/coiffeur?…` for canonical URL. **Confirm OK.**
6. **Booking quick-time-slot pills under each card** (Fresha pattern: shows next 3 available times per service)? **Not in SalonCard.md spec today** — adding them would be a major SalonCard extension. **Recommend: defer to v2.** SalonCard's existing `nextSlotLabel` + `priceFromCHF` row stays the canonical single-slot affordance.
7. **City selector pill row position?** Current CategoryPage puts it inside the sticky toolbar. SearchTemplate could put it above filters OR replace it with a city chip in the FilterChipStrip ("Basel ×"). **Recommend: chip-strip — same primitive, less visual hierarchy.**
8. **Q11 follow-up (favorite backend wiring)**: today CategoryPage wires to `/api/profile/favorites`. SearchTemplate should keep that. The HeartButton inside SalonCard is local-state-only per HeartButton.md. **Need to thread `isSaved` from server + a real toggle handler from SearchTemplate down to SalonCard** — this requires a new prop on SalonCard (`onSaveToggle?`) OR a context provider. **Recommend: context provider** (`FavoritesContext`) — clean, doesn't bloat SalonCard's API for surfaces that don't need it.

---

## Locked decisions (do not re-litigate during implementation)

- Single shared `SearchTemplate` for all 5 routes. No per-route forks.
- Use V3 `<SalonCard>` from `app/[locale]/_components/homepage/SalonCard.tsx` — drop legacy.
- B&W chrome per §1. NO `s-coral`, NO `s-amber`. Map pins = `s-ink`. Active chips = `bg-s-ink text-white`.
- `s-accent #1638C4` (royal blue) appears ONLY on: section eyebrows, links inside copy ("Mehr lesen"), and the breadcrumb-eyebrow bullet. NOT on primary CTAs, NOT on filter chips. Per V3-D192-fix.
- Skeleton uses `skeleton-shimmer` keyframe per LoadingStates.md Pattern 1.
- Stagger entrance uses `salon-card-stagger` global class — NO framer-motion `containerVariants/itemVariants` (legacy artifact).
- Map = `dynamic(ssr: false)` import. Component lives separately. Mapbox stays.
- LoadMore button (no infinite scroll) for v1.
- `_design-system/components/<Name>.md` written in the SAME PR as each new component (per CLAUDE.md component rule).

---

*Spec ready for review. Implementation is a ~7-step sequence; ~3 new components + 1 template + 5 route migrations.*
