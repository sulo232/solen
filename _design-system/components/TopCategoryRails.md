<!-- exists-check (2026-08-01): `npm run exists "top category"` / `npm run exists rails` surface
CategoryMobileRails.tsx's `top` calc (average_rating != null, sorted desc, top N) as the closest existing
surface (already shipping as "Top <Category>" on /de/coiffeur etc.). Reused from it: the slice shape and
the "Top <Category>" title composition. Reused from the homepage's own neighbouring sections
(ForYouSalonRows.tsx, the closest precedent for "one component renders several category-scoped Section
rails"): Section/SectionFrame/SectionTitle/ScrollRow/SalonCard, unchanged, plus the per-row `useRef`
sub-component pattern. No new card, no new rail primitive. -->

# TopCategoryRails

**File:** [app/[locale]/_components/homepage/TopCategoryRails.tsx](../../app/[locale]/_components/homepage/TopCategoryRails.tsx)
**Layer:** 1 chrome (composes locked homepage rail primitives, adds no new visual tokens)
**New:** 2026-08-01, task I3 (`_plans/HOME_V3_CATEGORY_MAP.md`): bring the home page's section list in
line with the approved mockup `public/_mockups/home-v3/search-a.html`.
**Source of truth:** `search-a.html`'s `RAILS` array, indices 3-6: "Top hair salons" / "Top Barbershops"
/ "Top nail studios" / "Top Spas" (`byCat("coiffeur"|"barbershop"|"nails"|"spa")`).

---

## Purpose

Four homepage rails, one per real salon category, each showing that category's top-rated salons.
Renders after `AvailableThisWeek`, before the (untouched) Walk-in band.

---

## Data

`getTopSalonIdsByCategory(limit)` (`salonCardData.ts`) fetches active salons with a non-null
`average_rating`, ordered by rating desc, then groups them per category in JS (a salon carrying more
than one category, e.g. coiffeur + barbershop, can legally appear in more than one rail, same as the
real per-category rails on `/coiffeur` etc. already allow). One query for all four rails, mirroring
`CategoryMobileRails.tsx`'s own `top` slice logic (`average_rating != null`, sorted desc, no
review-count floor , a deliberately looser floor than `getTopSalonIds`' cross-category "Top auf Solen"
fallback, which requires ≥ 8 reviews). Ids are merged into the homepage's single
`getSalonCardDataMap` batch fetch in `page.tsx`.

---

## Public API

```ts
export default function TopCategoryRails({
  salonData, idsByCategory,
}: {
  salonData?: SalonCardDataMap;
  idsByCategory?: Record<SalonCardCategory, string[]>; // getTopSalonIdsByCategory() result
}): JSX.Element | null;
```

Client component. Internally renders one `<CategoryRail>` per category (own `useRef` for the desktop
scroll-arrow pair, same per-row-ref pattern `ForYouSalonRows.tsx`'s `ForYouRow` already uses for its
multiple category rows). Each rail self-hides at < 2 resolvable salons , same floor
`CategoryMobileRails.tsx`/`CategoryBrowseRails.tsx` already use.

---

## Category labels (why a local copy, not an import)

Rail titles are `Top ${label}` with `label` = "Coiffeur" / "Barber" / "Nails" / "Spa". These are the
SAME literal strings as `HEADER_CATEGORIES` (`layout/Header.tsx`, the category pill row directly above
these rails on the home page) and `CATEGORY_PILLS` (`search/SearchTemplate.tsx`, the source
`CategoryMobileRails.tsx` already threads through for the identical "Top `<Category>`" title on
`/coiffeur` etc.) , copied here as a small local record rather than cross-imported, because:

- `Header.tsx` is a locked no-touch surface for this task ("Do NOT touch the Header, the category pill
  row... All verified this session"), so it cannot gain a new `export` this turn.
- `SearchTemplate.tsx` is a large "use client" module that pulls in `SalonResultCard`, `MapSalonDetail`,
  `CategoryBrowseRails`, `CategoryMobileRails`, `motion/react` and Mapbox-adjacent dynamic imports at
  module scope; importing a single named constant from it would still statically link that whole module
  graph into the homepage's client bundle, and this task's constraints ("Do not run `npm run build`")
  rule out verifying that the regression doesn't happen.

If either source ever changes these four strings, this file's copy needs updating too , flagged here
rather than hidden.

---

## i18n

Link labels reuse the exact `Alle ${label}-Salons` template `ForYouSalonRows.tsx` already ships for
its own category-scoped rows (`Weil du X magst`), not a new string. The word "Top" is unlocalized
across all four locales already, matching `CategoryBrowseRails.tsx`'s own `TITLES.top` entries
("Top auf Solen" / "Top on Solen" / "Top sur Solen" / "Top su Solen") and `CategoryMobileRails.tsx`'s
`Top ${categoryLabel}` title.

---

## Use for / Don't reuse for

**Use:** the homepage feed, directly after `AvailableThisWeek`.

**Don't reuse for:** category routes (`CategoryMobileRails`/`CategoryBrowseRails` already cover
those), PDP, search results.

---

## Related

- `search/CategoryMobileRails` , the per-category sibling whose `top` slice shape this mirrors.
- `homepage/ForYouSalonRows` , the closest structural precedent (one component, several category-scoped
  `Section` rails, each with its own `scrollRef`).
- `homepage/SalonCard`, `homepage/SectionHeader` (Section/SectionFrame/SectionTitle/ScrollRow) , the
  primitives composed here, unchanged.
