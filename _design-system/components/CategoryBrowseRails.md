# CategoryBrowseRails

**File:** [app/[locale]/_components/search/CategoryBrowseRails.tsx](../../app/[locale]/_components/search/CategoryBrowseRails.tsx)
**Layer:** 1 chrome (composes locked homepage rail primitives — adds no new visual tokens)
**Locked since:** V3-D366 (2026-05-29). Trimmed to 1 rail V3-D367, re-expanded to 6 rails V3-D368 (same day, per user direction).
**LOCKFILE links:** §10.5 dual-axis conflict resolution (no Fresha equivalent → Solen precedent), V3-D205 universal-components rule, reuses homepage `SalonCard` + `Section`/`ScrollRow` (already locked).

---

## Purpose

Homepage-style horizontal **browse rails** shown ABOVE the flat results grid on a category route, in **browse mode only** (no search query AND no active filter). Reuses the homepage `SalonCard` so cards are visually identical to the homepage.

Originated from the founder's Airbnb-style "browse rails by default" idea. History: built with 6 rails (V3-D366) → trimmed to only "Top auf Solen" (V3-D367, _"the rest is a no"_) → re-expanded to 6 rails (V3-D368, _"ok make angebote in der nahe bald frei manner and color"_).

---

## The six rails (in render order)

Each rail is a filtered + sorted **view of the same `salons` array** SearchTemplate already fetched — no extra network. A `<Rail>` sub-component self-hides any slice with **< 2 salons**, so empty rails never render.

| # | Title (de) | Slice logic |
|---|---|---|
| 1 | Top auf Solen | `average_rating != null`, sorted desc, top 10. **Outer gate:** if this has < 2, the whole section returns null. |
| 2 | Angebote | `last_minute_discount_percent > 0`, sorted desc. |
| 3 | In der Nähe | sorted by `distance_meters` asc **when present**; otherwise the city-scoped pool (no-geo fallback — the route is already city/category scoped). |
| 4 | Bald frei | salons with a future slot (`services[].slots`), sorted by soonest. |
| 5 | Für Männer | services match `/herren\|männer\|maenner\|mann\|men\|barber\|bart\|beard/i`. |
| 6 | Coloration | services match `/färb\|faerb\|farb\|colo\|tönung\|strähn\|balayage\|highlight\|mèche/i`. |

Per-card derived fields (same as the homepage availability card): `nextSlotLabel` (earliest future slot → `HH:MM` today / `<WD> HH:MM` later), `priceFromCHF` = `avg_price`, `city` = `cap(quartier) || city`.

---

## Public API

```ts
export type RailSalon = {
  id: string; name: string; slug: string;
  average_rating: number | null;
  cover_photo_url: string | null;
  address?: string; city?: string; quartier?: string | null;
  avg_price?: number | null;
  distance_meters?: number | null;
  last_minute_discount_percent?: number | null;
  services?: { name_de?: string | null; name_en?: string | null; price?: number | null; slots?: string[] | null }[];
};

export function CategoryBrowseRails({ salons, locale, category }: {
  salons: RailSalon[]; locale: string; category: string;
}): JSX.Element | null;
```

Client component. `RailSalon` is a structural subset of SearchTemplate's `Salon` type (`Salon[]` is assignable; `slots?: string[] | null` matches the API exactly).

---

## Gating (in SearchTemplate)

```tsx
const BROWSE_RAILS = true; // flip to false → grid-only category page (full revert)

{BROWSE_RAILS && activeCategory && activeFilterCount === 0 && q.length === 0 && (
  <CategoryBrowseRails salons={salons} locale={locale} category={activeCategory} />
)}
```

Three conditions must ALL hold: flag on · a category route (not `/search` "Alle") · true browse mode (no filter, no query). The instant a filter chip toggles or the user searches, the whole rail block disappears and only the (filtered) grid remains — this deliberately avoids the "rails silently emptying under a filter" failure mode. Rails are browse-only, not filter-reactive.

---

## Data dependency (important for populating the rails)

The rails are only as rich as the underlying salons. On a thin category seed the rails self-hide:

- **Angebote** needs `last_minute_discount_percent > 0` on ≥ 2 salons.
- **Bald frei** + `nextSlotLabel` need `availability_slots` rows that carry **`service_id`** (the API attaches slots to services via `.in("service_id", …)` — slots with only `salon_id` never surface).
- **Für Männer / Coloration** need ≥ 2 salons whose top-3 services name-match.
- **In der Nähe** sorts by real distance only when the browser sent geolocation; else it's the pool.

Demo data for `/coiffeur` was seeded via [`scripts/seed-coiffeur-rails.ts`](../../scripts/seed-coiffeur-rails.ts) (9 Basel coiffeur salons, varied discounts/services/slots, `is_test=false` so the API's `is_test=false` filter lets them through, slug-prefixed `srail-` for clean removal: `npx tsx scripts/seed-coiffeur-rails.ts --clean`).

---

## Dual-axis (§10.0)

- **STRUCTURE** — Solen precedent, not Fresha. Fresha has no rails-on-a-category-page (their category surface is a flat list). This is the founder's Airbnb borrow, scoped above the still-present Fresha-style grid. Per §10.5, when Fresha has no equivalent, Solen precedent (the homepage rail composition) is the source.
- **AESTHETIC** — inherited, zero new tokens. Composes the locked `Section` / `SectionFrame` / `SectionTitle` / `ScrollRow` and the homepage `SalonCard`. LOCKFILE compliance is transitive.

---

## Universal-components (V3-D205)

Single component, `category` forwarded as a prop to every `SalonCard`. No `if (category === 'X')` branches. Renders for any category route.

---

## i18n

Rail titles are a per-locale **inline-record** (`TITLES`, de/en/fr/it), mirroring `Header.tsx`'s `SEARCH_PLACEHOLDER`. All four locales present; German umlauts used to match the homepage ("In der Nähe", "Für Männer"); no `ß`, no em-dash.

**Known micro-deviation:** titles live inline rather than in `messages/{de,en,fr,it}.json`. Still fully multilingual (no single hardcoded locale). Migration path if a rule later requires next-intl: move to `categoryBrowseRails.<rail>` keys read via `useTranslations`. Flagged, not silently left.

---

## Use for / Don't reuse for

**Use:** the browse-mode rail block on category routes, via SearchTemplate's `BROWSE_RAILS` gate.

**Don't reuse for:**
- Homepage feeds (use `SalonCard` inside `Section`/`ScrollRow` directly — this hard-codes the 6 slices + gating).
- `/search` "Alle" (no `activeCategory`) — gate excludes it.
- Filtered/searched result states (the grid owns those).
- Salon detail / B2B pages.

---

## Revert

Flip `const BROWSE_RAILS = false;` in `SearchTemplate.tsx` → category pages return to grid-only. The component file can stay dormant for a later re-enable.

---

## Related

- `homepage/SalonCard` — the card reused here (Layer 1, locked).
- `homepage/SectionHeader` — `Section` / `SectionFrame` / `SectionTitle` / `ScrollRow`.
- `homepage/Nearby` + `homepage/LastMinute` — the homepage's own curated rails (static demo arrays; this component is the live-data analogue for category routes).
- `search/SalonResultCard` — the grid card below the rails.
- `search/SearchTemplate` — the host that gates + feeds the rails.
- `scripts/seed-coiffeur-rails.ts` — demo-data seed that populates all six rails on `/coiffeur`.
