/**
 * Trending services for the search-hub empty state (V2-D51 Phase 6).
 *
 * V1 ships hardcoded curated list. Each entry has:
 *   - `query` — what we send to /search?q=X. Per plan D2, trending click
 *     bypasses the segment composer and submits free-text directly.
 *   - `meta` — concrete trust signal ("127 Buchungen heute" beats "🔥 Hot").
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
  meta: string;
  query: string;
};

export const TRENDING: TrendingItem[] = [
  { rank: 1, label: "Balayage",          meta: "127 Buchungen heute",   query: "balayage" },
  { rank: 2, label: "Buzz Cut",          meta: "↑ 42% diese Woche",     query: "buzz cut" },
  { rank: 3, label: "Gel-Maniküre",      meta: "Top in Basel",          query: "gel maniküre" },
  { rank: 4, label: "Hot Stone Massage", meta: "★ 4.9 Durchschnitt",    query: "hot stone massage" },
];
