<!-- exists-check (2026-08-01): `npm run exists "available this week"` / `npm run exists slots` surface
CategoryMobileRails.tsx's own 7-day-bounded "soon" rail as the closest existing surface (already shipping
on /de/coiffeur etc.). Reused from it: the getAvailableThisWeekSalonIds() 7-day RPC bound (mirrored in
salonCardData.ts, scoped across categories instead of one route) and TITLES.soon/pick (CategoryBrowseRails.tsx)
for the title copy. Reused from the homepage's own neighbouring sections (RecentlyViewed.tsx, Nearby.tsx):
Section/SectionFrame/SectionTitle/ScrollRow/SalonCard, unchanged — no new card, no new rail primitive. -->

# AvailableThisWeek

> **UNMOUNTED 2026-08-05 (owner A6, "remove the Bald frei section entirely").** This rail no longer
> renders anywhere. The import and the `<AvailableThisWeek />` line in `app/[locale]/page.tsx` are
> commented out, and its `getAvailableThisWeekSalonIds` server fetch left the home page's parallel
> batch with it, so no `salons_with_slot_in_hours` RPC runs for it any more. Measured before removal:
> 9 real salon cards, section 304.1px tall at 375x812 and 318.5px at 402x874, between "In der Naehe"
> and "Top Coiffeur". File, data function and this doc are kept on disk for revert (the same
> convention every earlier homepage removal used). Graveyard line: `_design-system/REMOVED.md`.
> Everything below describes the component AS BUILT, not as shipped. Do not re-mount without an
> explicit owner yes.

**File:** [app/[locale]/_components/homepage/AvailableThisWeek.tsx](../../app/[locale]/_components/homepage/AvailableThisWeek.tsx)
**Layer:** 1 chrome (composes locked homepage rail primitives, adds no new visual tokens)
**New:** 2026-08-01, task I3 (`_plans/HOME_V3_CATEGORY_MAP.md`): bring the home page's section list in
line with the approved mockup `public/_mockups/home-v3/search-a.html`.
**Source of truth:** `search-a.html`'s `RAILS` array, index 2, title `"Available this week"`.

---

## Purpose

Homepage rail between Nearby and the four Top-Category rails. Shows real salons with a live,
`status='available'` booking slot inside the next 7 days, so a rail titled "available soon" never
lists a salon with nothing bookable.

---

## Data

`getAvailableThisWeekSalonIds(limit)` (`salonCardData.ts`) calls the existing
`salons_with_slot_in_hours` RPC (migration `20260607182403_add_salons_with_slot_in_hours_rpc.sql`,
already granted to anon/authenticated/service_role, already used by `app/api/salons/route.ts`'s
date-filter path and by `CategoryMobileRails.tsx`'s own per-category "soon" rail) with a
`[now, now+7d]` window, then orders the resulting salon ids by `average_rating` desc. The ids are
merged into the homepage's single `getSalonCardDataMap` batch fetch in `page.tsx` (no second round
trip). An id with no matching (or incomplete: missing name/slug/category) `salonData` entry is
skipped, never rendered with an invented name/photo.

---

## Public API

```ts
export default function AvailableThisWeek({
  salonData, salonIds,
}: {
  salonData?: SalonCardDataMap;
  salonIds?: string[]; // getAvailableThisWeekSalonIds() result, server-fetched in page.tsx
}): JSX.Element | null;
```

Client component (`useLocale()` for the title's locale pick, matching `Nearby.tsx`/`RecentlyViewed.tsx`).
Self-hides at < 2 resolvable salons — same floor `CategoryMobileRails.tsx`/`CategoryBrowseRails.tsx`
already use (a 1-card rail is not a rail).

---

## i18n

Title reuses `TITLES.soon` / `pick`, **imported from `search/CategoryBrowseRails.tsx`**, not a new
string: `CategoryMobileRails.tsx`'s own real 7-day-bounded rail already titles itself with this exact
key ("Bald frei" / "Available soon" / "Bientôt dispo" / "Presto liberi"), so this rail matches the
already-shipped copy for the identical real-data concept rather than adding the mockup's literal
"Available this week" as new German/English/French/Italian strings (task hard constraint: "No German
added beyond existing i18n keys").

---

## Use for / Don't reuse for

**Use:** the homepage feed, directly after `Nearby`.

**Don't reuse for:** category routes (`CategoryMobileRails`/`CategoryBrowseRails` already cover
those), PDP, search results.

---

## Related

- `search/CategoryMobileRails` , the per-category sibling this reuses the RPC bound + `TITLES.soon`
  copy from (via `salonCardData.ts`'s mirrored query, not a direct import).
- `homepage/SalonCard`, `homepage/SectionHeader` (Section/SectionFrame/SectionTitle/ScrollRow) , the
  primitives composed here, unchanged.
- `homepage/Nearby.tsx` / `homepage/RecentlyViewed.tsx` , the immediate neighbouring sections whose
  exact anatomy (imports, self-hide contract, `salonData` lookup pattern) this file mirrors.
