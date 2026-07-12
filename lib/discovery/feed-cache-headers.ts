// Ring 5b: CDN response caching decision for GET /api/discovery/feed. Lives in lib/
// (not the route file) because Next.js's route-module type contract only allows HTTP
// method exports (GET, POST, ...) plus a fixed config-export allowlist (dynamic,
// runtime, ...) from a route.ts; re-exporting these constants/helper straight out of
// the route broke the generated .next/types/.../route.ts constraint check. Moved out
// here (same fix pattern used for lib/discovery/public-columns.ts).
//
// netlify.toml's "/api/*" block (lines 31-35) is a static/CDN header-injection rule and
// does NOT apply to this route's own function response (identical Netlify precedence
// note as app/api/salons/route.ts); the headers set below are what actually ships.
//
// This endpoint personalizes on the SAME url for a logged-in visitor: the pure-browse
// "for you" ranking (discovery_feed_for_you), and the disc_gender soft-bias applied
// inside the general discovery_feed branch, both change the RESPONSE for an otherwise-
// identical URL depending on whether a session cookie is present. Netlify's CDN cache
// key is the URL alone (no cookie in the key by default), so caching one of those
// personalized responses would risk it being replayed to a different visitor hitting
// the identical URL within the TTL window ("cache poisoning"). The `filters.search`
// branch is the one proven exception: it never reads userId/disc_gender for its
// results (userId is only used for the fire-and-forget search-event log), so its
// response is identical for every caller regardless of auth state and is always safe
// to cache.
//
// We deliberately do NOT ship a Netlify-Vary(cookie=...) split for the two ambiguous
// branches: the Supabase SSR auth cookie name is project-ref-specific and can be
// chunked (sb-<ref>-auth-token / .0 / .1), and this ring has no live-docs access to
// verify Netlify-Vary's exact cookie-name-matching semantics against the CURRENT
// Netlify platform behavior (rule 15: don't ship an unverified header rule that could
// silently no-op, this codebase's #1 failure mode is a control that looks wired but
// does nothing). Per the task's own tie-break ("correctness beats caching"), the
// for-you and general-feed branches are only marked cacheable when `userId` is
// positively null (no auth cookie was even present, so the response could not have
// been personalized); any request that resolved a session always gets an explicit
// no-store, so a personalized payload can never be written into the shared cache slot.
export const FEED_CACHE_HEADERS = {
  "Netlify-CDN-Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
  "Cache-Control": "public, max-age=0, must-revalidate",
};
export const FEED_NO_STORE_HEADERS = {
  "Netlify-CDN-Cache-Control": "private, no-store",
  "Cache-Control": "no-store, no-cache, must-revalidate",
};

/**
 * Pure branch decision extracted so ring5b-kill-test.ts can exercise it directly: the
 * real userId resolution in the route routes through next/headers' cookies(), which
 * only works inside a live Next.js request and can't be simulated from a standalone
 * script (see the identical constraint noted in lib/salon-detail.ts), so the
 * personalized variant is tested by calling this exact function with a synthetic
 * userId instead of faking a browser session.
 */
export function feedCacheHeaders(opts: { isSearchBranch: boolean; userId: string | null }) {
  if (opts.isSearchBranch) return FEED_CACHE_HEADERS;
  return opts.userId ? FEED_NO_STORE_HEADERS : FEED_CACHE_HEADERS;
}
