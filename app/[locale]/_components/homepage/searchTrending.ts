/**
 * Trending services for the search-hub empty state (V2-D51 Phase 6). DEV
 * PREVIEW ONLY: the sole importer is app/[locale]/dev/search-morph/page.tsx
 * (confirmed via grep 2026-07-16), not any customer-facing surface.
 *
 * V1 ships hardcoded curated list. Each entry has:
 *   - `query` - what we send to /search?q=X. Per plan D2, trending click
 *     bypasses the segment composer and submits free-text directly.
 *
 * IDENTITY-ONLY (2026-07-16): `meta` used to carry fabricated booking-count,
 * trend-percent and rating trust signals that were never wired to a real
 * number. Nothing rendered `meta` anyway (the dev preview only reads
 * `label`/`query`), so it is dropped rather than
 * replaced with another invented value. Porting this list back into
 * SearchOverlay (the real, customer-facing overlay) must wire the real
 * bookings aggregate below FIRST; never resurrect a hardcoded trust string.
 *
 * V2 upgrade: replace this constant with `/api/search/trending` route that
 * aggregates the bookings table over the last 7 days:
 *   select s.name_de as label,
 *          count(*)::text || ' Buchungen diese Woche' as meta,
 *          s.name_de as query
 *   from bookings b
 *   join services s on s.id = b.service_id
 *   where b.created_at > now() - interval '7 days'
 *   group by s.id, s.name_de
 *   order by count(*) desc
 *   limit 4;
 */

export type TrendingItem = {
  rank: number;
  label: string;
  query: string;
};

export const TRENDING: TrendingItem[] = [
  { rank: 1, label: "Balayage",          query: "balayage" },
  { rank: 2, label: "Buzz Cut",          query: "buzz cut" },
  { rank: 3, label: "Gel-Maniküre",      query: "gel maniküre" },
  { rank: 4, label: "Hot Stone Massage", query: "hot stone massage" },
];
