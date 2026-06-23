// exists-check: net-new. Single source of truth for the search→book points weights
// (_tasks/SEARCH_BOOK_POINTS_SPEC.md). NOT a dup of lib/discovery-algorithm.ts (item-level
// popularity) or lib/loyalty/* (visit-frequency rank) — those score different things. This is the
// per-funnel-action weighting that the affinity + conversion rollups (phases 3-4) consume. Tune here.

// NOTE: the recompute_user_salon_affinity() SQL function holds the authoritative copy of these
// (Postgres can't import TS); keep the two in sync (same pattern as loyalty thresholds).
/** Weighted value of each action. Higher = stronger intent. Owner-tunable. */
export const POINTS = {
  // search funnel (dormant until /api/search/event is wired into the UI)
  search: 0.1, // a search_events row with no click (impression-level)
  click: 0.25, // a search_events row with a click (clicked_id set)
  bookViaSearch: 0.5, // a search_events row marked booked=true (extra credit on a search-driven booking)
  // already-captured engagement (live affinity data today)
  booking: 0.5, // a kept booking (completed/confirmed); repeat bookings compound = rebook reward
  favorite: 0.4, // favorited the salon
  review: 0.35, // left a visible review
  // discovery (deferred: current saves resolve to no salon — items have owner_salon_id = null)
  discoveryClick: 0.2,
  discoverySave: 0.3,
} as const;

export type PointsAction = keyof typeof POINTS;

/** How long after a search click a booking still counts as search-driven (last-touch window). */
export const ATTRIBUTION_WINDOW_MIN = 60;
