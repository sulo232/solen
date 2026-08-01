<!-- exists-check (2026-08-01): `npm run exists PopularLooks` (0 hits before this turn's own
usePopularLooks.ts) and `npm run exists homepage` (33 existing homepage components, none matching;
Entdecken.tsx is the closest neighbour, same /api/discovery/feed source, left untouched per this
task's own no-touch list). Reused: Section/SectionFrame/SectionTitle (SectionHeader.tsx), Skeleton
(primitives/Skeleton.tsx), the SAME /api/discovery/feed?category=hair endpoint Entdecken.tsx pulls
from, the same self-hide-below-2 floor AvailableThisWeek/TopCategoryRails/CategoryBrowseRails use. -->

# PopularLooks

**File:** [app/[locale]/_components/homepage/PopularLooks.tsx](../../app/[locale]/_components/homepage/PopularLooks.tsx)
**Hook:** [app/[locale]/_components/homepage/usePopularLooks.ts](../../app/[locale]/_components/homepage/usePopularLooks.ts)
**Layer:** 1 chrome (composes locked homepage primitives, adds no new visual tokens)
**New:** 2026-08-01, task I5 (`_plans/HOME_V3_CATEGORY_MAP.md`): bring the home page's section list
in line with the approved mockup `public/_mockups/home-v3/search-a.html`.
**Source of truth:** `search-a.html`'s `serviceTileRow()` function, titled "Popular looks",
`.sa-tilerail` / `.sa-tilebox` / `.sa-tilename` / `.sa-tilemeta` CSS.

---

## Purpose

A 4-across square PHOTO tile row, real seeded discovery looks with a real title and a real starting
price under each. The mockup's own first draft used the category's 3D icon here (services carry no
photo of their own); this dispatch's task brief explicitly overrides that with real discovery
photographs , the owner rejected service icons on this row twice.

---

## Data

`usePopularLooks({ limit })` fetches `/api/discovery/feed?category=hair&limit=8`, the SAME endpoint
+ category `Entdecken.tsx`'s own inline effect already fetches (task instruction: "Source the
images and prices from the same place the Inspiration section on the home already pulls from").
Image resolution matches `Entdecken.tsx` / `useInspoLooks.ts` / `useForYouLooks.ts`: the
`/api/discovery/thumb/{id}` proxy for TikTok items (raw thumbnail URLs are signed and expire),
falling back to `image_url`/`tiktok_thumbnail_url` otherwise. A look with no resolvable
`price_min`, or no resolvable image, is dropped by the hook itself, never rendered with an invented
or omitted price/placeholder.

---

## Public API

```ts
export function usePopularLooks(opts?: { limit?: number }): {
  looks: { id: string; image: string; title: string; priceFromCHF: number }[];
  loading: boolean;
};

export default function PopularLooks(): JSX.Element | null;
```

Client component, no props (mirrors `Entdecken.tsx`'s own no-prop shape). Renders the `Skeleton`
primitive (`primitives/Skeleton.tsx`) shaped to the final 4-tile grid while `loading`, per this
project's design contract (`states | loading = <Skeleton>`), never a bare spinner or a silent gap.
Self-hides at < 2 resolved looks (same floor `AvailableThisWeek.tsx` / `TopCategoryRails.tsx` /
`CategoryBrowseRails.tsx`'s `Rail()` all use , a lonely tile is not a row).

---

## i18n

Title `"Beliebte Looks"` reuses existing German copy already present in this repo
(`app/[locale]/dev/search-fixes/page.tsx`, same "browse looks" concept), not new German. The
"Alle entdecken →" link label reuses `Entdecken.tsx`'s own existing link copy for the same
`/inspo` destination verbatim. No new German added (task hard constraint).

---

## Use for / Don't reuse for

**Use:** the homepage feed, directly after `TopCategoryRails`, before `WalkInBand`.

**Don't reuse for:** the `/inspo` route's own feed (that's `DiscoverPageContent`, untouched by this
task), a service-browsing surface with real per-service imagery (none exists yet).

---

## Related

- `homepage/Entdecken.tsx` , the neighbouring section this shares its data source with (same API,
  same category), untouched by this task.
- `homepage/useInspoLooks.ts` / `homepage/useForYouLooks.ts` , sibling hooks over the same feed
  endpoint; neither returns `price_min`, which is why this task added a third small hook rather than
  reusing one of them.
- `primitives/Skeleton.tsx` , the loading-state primitive used here.
- `homepage/SectionHeader.tsx` (Section/SectionFrame/SectionTitle) , the primitives composed here,
  unchanged.
