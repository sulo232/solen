// Ring 5b: CDN response caching for GET /api/salons. Lives in lib/ (not the route file)
// because Next.js's route-module type contract only allows HTTP method exports (GET,
// POST, ...) plus a fixed config-export allowlist (dynamic, runtime, ...) from a
// route.ts; re-exporting this constant straight out of the route broke the generated
// .next/types/app/api/salons/route.ts constraint check (TS2344). Moved out here, same
// fix pattern already used for lib/discovery/feed-cache-headers.ts.
//
// This GET handler never reads a cookie or calls auth.getUser() anywhere (confirmed by
// ring5b-kill-test.ts source-grep), and every row is always filtered to is_active=true /
// listed_on_marketplace=true / is_test=false, so there is no owner-preview or
// per-visitor branch: every success response is public, non-personalized data, safe to
// edge-cache for ALL callers.
//
// netlify.toml's "/api/*" block (lines 31-35) sets a blanket `Cache-Control:
// no-store, no-cache, must-revalidate`, but that block is a static/CDN header-injection
// rule for assets served straight from the CDN's publish directory; it does NOT apply
// to this route's own function response. app/api/salons/route.ts exports
// `runtime = "edge"`, so it compiles to a Netlify Edge Function, and per Netlify's
// docs, header rules configured in netlify.toml/_headers are not applied to
// Function/Edge Function responses (only the function's own response headers ship). So
// ANON_CACHE_HEADERS below is authoritative and is not stripped by the /api/* no-store
// rule.
//
// `Netlify-CDN-Cache-Control` is the header Netlify's edge actually honors for CDN
// caching (durable s-maxage/stale-while-revalidate support, separate from the
// browser-facing `Cache-Control`); 60s is a conservative TTL for browse data.
// Query-string variants are distinct cache keys on Netlify by default (no
// normalization/canonicalization), so ?category=coiffeur and
// ?category=coiffeur&page=2 cache independently, which is exactly what this endpoint's
// per-filter-combination responses need.
export const ANON_CACHE_HEADERS = {
  "Netlify-CDN-Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
  "Cache-Control": "public, max-age=0, must-revalidate",
};
