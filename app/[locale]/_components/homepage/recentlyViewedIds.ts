// exists-check: net-new vs nearbySalonIds.ts (that file is Nearby.tsx's own id
// list; this one is RecentlyViewed.tsx's) and vs RecentlyViewed.tsx's own
// DEMO_SALONS array (that stays "use client" and keeps its full entries incl.
// availabilityRow/photo). This file holds ONLY the id list, extracted so
// page.tsx (a Server Component) can batch-fetch real card fields for them
// without crossing the RSC client boundary: RecentlyViewed.tsx has "use client"
// at the top, so a Server Component can't import a plain value out of it (only
// pass props into it). Same pattern as nearbySalonIds.ts.
//
// live-data-ok: consumed by salonCardData.ts to fetch real rating/address/
// price for these salons, no fabricated data added by this file itself.
//
// Keep this list in sync with the `id` fields of RecentlyViewed.tsx's
// DEMO_SALONS array (the "Top auf Solen" fallback shown to first-time
// visitors with no real view history yet).
export const RECENTLY_VIEWED_DEMO_IDS: string[] = [
  "0ed041f9-149b-4241-a09e-d41351be7097",
  "599bb853-c713-4dae-a3c4-96c6216139c4",
  "ca037638-362a-491b-ada2-238e20d9d4a9",
  "40c96be2-198c-471e-82d8-3ada6f7de0de",
];
