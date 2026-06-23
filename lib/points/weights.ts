// exists-check: net-new. Single source of truth for the search→book points weights
// (_tasks/SEARCH_BOOK_POINTS_SPEC.md). NOT a dup of lib/discovery-algorithm.ts (item-level
// popularity) or lib/loyalty/* (visit-frequency rank) — those score different things. This is the
// per-funnel-action weighting that the affinity + conversion rollups (phases 3-4) consume. Tune here.

/** Weighted value of each funnel action. Higher = stronger intent. Owner-tunable in ONE place. */
export const POINTS = {
  search: 0.1, // a search_events row with no click (impression-level)
  click: 0.25, // a search_events row with a click (clicked_id set)
  bookViaSearch: 0.5, // a search_events row marked booked=true (attributed booking)
  discoveryClick: 0.2, // discovery_interactions action='click'
  discoverySave: 0.3, // a saved discovery item (reuses the existing save signal)
} as const;

export type PointsAction = keyof typeof POINTS;

/** How long after a search click a booking still counts as search-driven (last-touch window). */
export const ATTRIBUTION_WINDOW_MIN = 60;
