<!-- exists-check: `npm run exists rails` and `npm run exists category` both surface CategoryBrowseRails.tsx
(6 rails: Top auf Solen / Angebote / In der Nähe / Bald frei / Für Männer / Coloration, dormant behind
BROWSE_RAILS) as the closest existing surface. Read it in full before building this file. Reused from it:
homepage `SalonCard` (the card anatomy, byte-identical to the mockup's railCard, so nothing is redrawn),
`ScrollRow` (the bleed mechanic), and the exported `TITLES`/`pick` locale copy for the Nearby / Available
this week rail titles (no new German strings). NOT reused: `Section`/`SectionFrame` (their own padding
would double up against the ancestor `px-3` this component sits inside in SearchTemplate.tsx) and
`SectionTitle` (its arrow renders bare INSIDE the h2 by a dated 2026-05-15/16 decision, not the mockup's
32px circular arrow pinned to the row's right edge) — both intentional deviations, not oversights. Also
checked: SectionHeader.md, SalonCard.md (homepage) — neither covers a 3-rail mobile-only category set. -->

# CategoryMobileRails

**File:** [app/[locale]/_components/search/CategoryMobileRails.tsx](../../app/[locale]/_components/search/CategoryMobileRails.tsx)
**Layer:** 1 chrome (composes locked homepage rail primitives — adds no new visual tokens)
**New:** 2026-08-01, owner: "remove cz we made it carousel right did u forget" (the filter row comes off
mobile category pages because they are carousels now, not a flat filterable list).
**Source of truth:** `public/_mockups/home-v3/search-a.html`, `categorySections()` / `railCard()` /
`sectionFrame()` — first three sections only (Top / Nearby / Available this week). The mockup also builds
a walk-in band, a reviews rail and an Inspo section for a category page; those are a separate, not-yet-
scoped ask and are NOT built here.

---

## Purpose

Replaces the mobile-only flat `SalonResultCard` feed on a category route (`/coiffeur`, `/barbershop`,
`/nails`, `/spa`) with three horizontal rails, matching the approved mockup. Desktop is untouched (it
already renders the 2-4 col `SalonResultCard` grid, unaffected by this component).

---

## The three rails (in render order)

Each rail is a filtered/sorted **view of the same `salons` array** SearchTemplate already fetched — no
extra network. A `<Rail>` sub-component self-hides any slice with **< 2 salons** (same floor
`CategoryBrowseRails` uses), so an empty rail never renders. If the Top rail itself can't populate (< 2
rated salons), the whole component returns null.

| # | Title | Slice logic |
|---|---|---|
| 1 | `Top ${categoryLabel}` (e.g. "Top Coiffeur") | `average_rating != null`, sorted desc, top 10. **Outer gate:** if this has < 2, the whole component returns null. |
| 2 | Nearby (`TITLES.nearby`, imported) | sorted by `distance_meters` asc **when present**; otherwise the same city/category-scoped pool already fetched (no-geo fallback, identical to `CategoryBrowseRails`' own "In der Nähe" rail). |
| 3 | Available this week (`TITLES.soon`, imported — the closest existing shipped copy; see i18n note below) | salons with a real upcoming slot (`services[].slots`) inside the next 7 days, sorted by soonest. Bounded to 7 days, unlike `CategoryBrowseRails`' unbounded "Bald frei", so the section's own claim stays true. |

Per-card fields passed to the real `SalonCard`: `rating`, `reviewCount`, `photoUrl`, `priceFromCHF` =
`min_price` (not `avg_price` — PBV Art. 13, same rule the rest of the app already follows),
`postalCode` = `s.postal_code` (real column, `lib/salons/public-columns.ts` — was already returned by
`/api/salons` but missing from `SearchTemplate.tsx`'s local `Salon` type; added there in the same change),
`city` = the page's already-computed `cityName`, `isSaved` = the page's already-fetched `favoriteIds`.

---

## Public API

```ts
export function CategoryMobileRails({
  salons, locale, category, categoryLabel, cityName, favoriteIds,
}: {
  salons: MobileRailSalon[];
  locale: string;
  category: SalonCardProps["category"];
  categoryLabel: string; // e.g. "Coiffeur" (SearchTemplate's CATEGORY_PILLS label)
  cityName: string;
  favoriteIds: Set<string>;
}): JSX.Element | null;
```

Client component. `MobileRailSalon` is a structural subset of SearchTemplate's `Salon` type (`Salon[]` is
assignable), the same pattern `CategoryBrowseRails.tsx`'s own `RailSalon` type already uses.

---

## Heading anatomy (why it is NOT `SectionTitle`)

The mockup's `sectionFrame()` pins a **32px circular arrow to the right edge** of the heading row
(`.sa-secheadrow` / `.sa-h2arrow`, `bg-s-bg-sunken` fill, `margin-bottom: 14px`), and the arrow is
**decorative** in the mockup itself (`a.setAttribute("aria-hidden", "true")`, no href, no click handler).
The shared `SectionTitle` (`homepage/SectionHeader.tsx`) renders a *bare* chevron **inside** the h2 with no
circle background — a dated, deliberate 2026-05-15/16 decision (V2-D66 / V3-D140, "make them jst normal
black arrow", circle bg stripped). Reusing `SectionTitle` here would silently ship the wrong arrow
treatment. This file draws its own `RailHeading` (title left, ArrowRight in a 32px `bg-s-bg-sunken`
circle, `mb-[14px]`) instead, matching the mockup literally. The arrow has no destination today (none was
specified) — flagged as a park-able follow-up, not invented.

---

## Padding (why no `Section`/`SectionFrame` wrap)

This component is mounted directly inside SearchTemplate's existing `px-3 ... md:px-6` "Result grid"
wrapper (mobile only). `Section` (own `px-1`) + `SectionFrame` (own `px-3 ... md:px-4`) would stack a
SECOND layer of horizontal padding on top of that ancestor's, breaking the mockup's edge-to-edge rail
bleed (the next card must crop at the true viewport edge, not at 16-20px in from it). `ScrollRow`'s own
`-mx-3 px-3` bleed math exactly cancels the ancestor's `px-3` (12px), so this file uses `ScrollRow` bare,
without its usual `Section`/`SectionFrame` escort.

---

## Gating (in SearchTemplate)

Mounted inside the existing mobile-only (`md:hidden`) result block, in place of the flat
`SalonResultCard` map, only for the default case (not `walk_in`, not the `?layout=list`/`?layout=grid`
escape hatches — those keep their prior mobile behavior unchanged) and only when `activeCategory` is set
(so `/search`, which has no category, keeps the flat feed).

---

## Data dependency

- **Top** needs ≥ 2 salons with a real `average_rating`.
- **Nearby**'s real-distance sort needs browser geolocation (`coords` state in SearchTemplate); without
  it, falls back to the already-fetched pool, same as `CategoryBrowseRails`.
- **Available this week** needs `availability_slots` rows with `service_id` (same dependency
  `CategoryBrowseRails`' "Bald frei" already documents) landing inside the next 7 days.

---

## i18n

"Nearby" and "Available this week" reuse `TITLES.nearby` / `TITLES.soon` **exported from
`CategoryBrowseRails.tsx`** (de/en/fr/it, already shipped) rather than declaring new copy. "Available this
week" is display-labeled with the existing "Bald frei"/"Available soon"/"Bientôt dispo"/"Presto liberi"
copy — the closest already-shipped string — while the underlying data is bounded to 7 days; this is a
named substitution, not a literal translation of "this week", because no new German UI copy was
authorized beyond existing i18n keys. "Top `${categoryLabel}`" composes the existing, locale-invariant
`CATEGORY_PILLS` label (already used unlocalized in the filter pills / header pills) with the word "Top",
itself already used unlocalized across all 4 locales in `CategoryBrowseRails.tsx`'s own `TITLES.top`
entries ("Top auf Solen" / "Top on Solen" / "Top sur Solen" / "Top su Solen").

---

## Use for / Don't reuse for

**Use:** the mobile default result view on a category route only.

**Don't reuse for:**
- Desktop (untouched, still the grid).
- `/search` "Alle" (no `activeCategory`) — the flat feed stays.
- Homepage feeds (use `SalonCard` / `homepage/Nearby.tsx` directly).
- Salon detail / B2B pages.

---

## Related

- `search/CategoryBrowseRails` — the 6-rail sibling this reuses `TITLES`/`pick`/`SalonCard`/`ScrollRow`
  from; still dormant behind `BROWSE_RAILS`, not replaced by this file.
- `homepage/SalonCard` — the card reused here (Layer 1, locked).
- `homepage/SectionHeader` — `ScrollRow` reused; `Section`/`SectionFrame`/`SectionTitle` deliberately not.
- `search/SearchTemplate` — the host that gates + feeds the rails, and owns the filter-row mobile-hide
  (`CHANGE 1`) this component's `CHANGE 2` pairs with.
