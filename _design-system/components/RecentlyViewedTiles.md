<!-- exists-check (2026-08-01): `npm run exists RecentlyViewedTiles` (0 hits, genuinely new) and
`npm run exists "recently viewed"` (9 hits: RecentlyViewed.tsx, useRecentlyViewed.ts, the
/recently-viewed route, all EXISTING, all left untouched per this task's own no-touch list). Reused:
Section/SectionFrame/SectionTitle (SectionHeader.tsx), CATEGORY_LABEL (search/SalonResultCard.tsx),
the SAME `solen.recently-viewed` localStorage key RecentlyViewed.tsx and useRecentlyViewed.ts read. -->

# RecentlyViewedTiles

**File:** [app/[locale]/_components/homepage/RecentlyViewedTiles.tsx](../../app/[locale]/_components/homepage/RecentlyViewedTiles.tsx)
**Layer:** 1 chrome (composes locked homepage primitives, adds no new visual tokens)
**New:** 2026-08-01, task I4 (`_plans/HOME_V3_CATEGORY_MAP.md`): bring the home page's section list
in line with the approved mockup `public/_mockups/home-v3/search-a.html`.
**Source of truth:** `search-a.html`'s `recentlyViewed()` function, `.sa-rec` / `.sa-recimg` /
`.sa-rectext` / `.sa-recname` / `.sa-recmeta` CSS.

---

## Purpose

A 4-across square-tile grid directly above the existing `RecentlyViewed.tsx` rail: up to 3 real
salons the visitor actually opened, plus a trailing "Basel, N Salons" city cell. Deliberately a
DIFFERENT anatomy from `RecentlyViewed.tsx`'s SalonCard rail (no rating, no price, no border), per
the mockup, not a duplicate SalonCard.

---

## The bug found and fixed this same turn

`trackSalonView` (`components-legacy/RecentlyViewed.tsx`, the only real write site, called from
`SalonDetailV3.tsx` on every `/salon/[slug]` mount) was writing to `"solen_recently_viewed"`
(underscore) with a `{ categories: string[], cover_photo_url }` shape. **Every real reader**
(`RecentlyViewed.tsx`, `useRecentlyViewed.ts`) reads `"solen.recently-viewed"` (dot + hyphen) and
expects `{ category: string, photoUrl }`. Neither the key nor the field names matched, so a real
visit's write was silently invisible to every reader, always , the homepage "Zuletzt angesehen"
branch could never fire, it always fell back to "Top auf Solen" regardless of real view history.
Fixed by changing `STORAGE_KEY` and adding the two correctly-named fields (via `safeCategory`,
`salon/_shared.ts`) to the entry `trackSalonView` writes. This file's own `readStorage()` is the
first real consumer of the fixed data.

---

## Data

Real localStorage view history ONLY, read directly (own small `readStorage()`/`isValidEntry()`,
NOT `useRecentlyViewed.ts` , that hook ships a dev-only DEMO fallback for `SearchOverlay`'s cosmetic
resting state, which would fabricate a viewing history here, banned by this task's own instruction).
Zero real entries = the component renders `null`, never a curated/"Top auf Solen" substitute (that
fallback is `RecentlyViewed.tsx`'s separate, already-shipped job).

The trailing city cell's count comes from `getBaselShopCount()` (`salonCardData.ts`), a real
active-salon count (`postal_code LIKE '4%'`, the same prefix heuristic `postalToCity()` already uses
site-wide), server-fetched in `page.tsx` and passed down as `baselShopCount`. `null` omits the count
line rather than showing a fabricated number. The city cell only renders alongside real salon
history, never on its own.

---

## Public API

```ts
export default function RecentlyViewedTiles({
  entriesOverride, baselShopCount,
}: {
  entriesOverride?: StoredEntry[] | null; // test seam, dev previews
  baselShopCount?: number | null; // getBaselShopCount() result, server-fetched in page.tsx
}): JSX.Element | null;
```

Client component. Reads `localStorage` in a mount effect (no SSR flash , server + first client
paint both render `null`, matching the identical pattern `RecentlyViewed.tsx` already uses).

---

## i18n

Title `"Zuletzt angesehen"` reuses the EXACT existing string `RecentlyViewed.tsx` already ships for
its own real-history branch, not new copy. Category meta line reuses `CATEGORY_LABEL`
(`search/SalonResultCard.tsx`, already exported + reused by `MapSalonDetail.tsx` /
`SalonDetailV3.tsx`). City meta line reuses the word "Salons", the same word `Nearby.tsx` already
renders (`"${nearbyCount} Salons in der Nähe"`). No new German added (task hard constraint).

---

## Use for / Don't reuse for

**Use:** the homepage feed, directly before `RecentlyViewed.tsx`.

**Don't reuse for:** a curated/fallback rail (that's `RecentlyViewed.tsx`), any surface that isn't
real personal view history.

---

## Related

- `homepage/RecentlyViewed.tsx` , the neighbouring SalonCard rail this sits directly above; reads
  the SAME storage key, untouched by this task.
- `homepage/useRecentlyViewed.ts` , a sibling reader with a dev-only DEMO fallback, deliberately NOT
  reused here (would fabricate data).
- `components-legacy/RecentlyViewed.tsx` , the write site (`trackSalonView`), fixed this turn.
- `homepage/salonCardData.ts` , `getBaselShopCount()`, added this turn.
- `search/SalonResultCard.tsx` , `CATEGORY_LABEL`, reused for the tile meta line.
