// exists-check: net-new vs supabase/migrations/077_geospatial_search.sql's
// get_nearby_salon_ids() RPC (that's a real PostGIS proximity query, unrelated
// here). This file holds the curated id list for the homepage "In der Nähe"
// row: a plain value module (no server-only imports) so BOTH page.tsx (a
// Server Component, for the batch salonCardData fetch) and Nearby.tsx
// ("use client") can import it directly.
//
// live-data-ok: consumed by salonCardData.ts to fetch real rating/address/
// price for these salons, no fabricated data added by this file itself.
//
// 2026-07-16: this list is now the SOURCE OF TRUTH for which salons the
// Nearby row shows (Nearby.tsx maps it through live salonData, no more demo
// array to keep it in sync with). Add/remove a salon here to change the row.
export const NEARBY_SALON_IDS: string[] = [
  "0ed041f9-149b-4241-a09e-d41351be7097",
  "e34402f4-2986-4f63-8487-b09645395c65",
  "ca037638-362a-491b-ada2-238e20d9d4a9",
  "40c96be2-198c-471e-82d8-3ada6f7de0de",
  "599bb853-c713-4dae-a3c4-96c6216139c4",
  "9f078a3f-071d-4797-a0cf-e5ab6f3c1d2f",
  "d46e4ae5-8410-4fc9-a2da-43c978bc9477",
  "08760993-cdfd-4cc7-ac69-6a2bf8aed383",
  "1c217cdc-f342-4790-91ec-c87709468666",
  "f4f9bdc6-96e9-4bbb-819d-3a2931897e57",
  "6aedd8a4-30fd-4390-949c-4d1fa06e1ff1",
  "9956212b-166f-4a51-a880-6e99e329267a",
  "ff2abacd-661a-4e7a-9c00-2dda7ce29133",
  "63e581dd-2b0e-4910-b4a5-543bc1e157f6",
  "dd4a3e35-8b9c-4ee6-a52e-1fb71ce04f89",
];
