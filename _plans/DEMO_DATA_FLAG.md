# Demo-data single-switch flag + real backend (owner 2026-07-03)

Owner ask: "keep [fake homepage data] for now cz we're not live, no real salons yet, but make it deletable, and build the real backend." So: pre-launch keep the pretty demo fallbacks; make ALL of them killable with ONE switch; ensure the real data path is wired so real numbers flow automatically at launch.

Full research: `_design-system/_demo-data-research-2026-07-03.md` (every fabricated source with file:line, backend readiness per field, the flag mechanism).

## The mechanism to REUSE (do not invent)
`public.feature_flags` table already exists (migration 028): `key text PK, enabled boolean default true, description, updated_at, updated_by`. Seeded: bookings, payments, messaging, reviews, registration, last_minute, maintenance_mode. Server read helper: `lib/feature-flags.ts` `checkFeatureEnabled(key)`. Client compile-time flags also exist in `lib/feature-flags.ts` (need to confirm the client-read path).

## Design (single switch)
Add ONE flag `demo_data` (enabled=true pre-launch). Each fabricated source gates its fallback on it: flag ON -> empty/failed fetch falls back to demo (current behavior); flag OFF -> empty -> real empty state or omit the section. Flip one DB row at launch, no redeploy.
- Plumbing: the demo sources are CLIENT components, `checkFeatureEnabled` is server-only (admin client). Read `demo_data` once in the homepage server component (app/[locale]/page.tsx) + pass a `demoEnabled` boolean down, OR expose via a small context/provider. Confirm which during build (avoid a per-component fetch).
- Silent-no-op watch (fable-backend #1 failure here): a flag reading the wrong key returns a constant and does nothing. VERIFY the owner's real scenario: flip the flag OFF in a branch/test, confirm every section drops its fake numbers (not just "the fetch fires").

## Work list (atomized; each source gates its fallback on `demoEnabled`)

### Phase 1: mechanism + the two sources with real endpoints (DONE + committed + live-verified 2026-07-03)
- [x] Migration FILE committed: supabase/migrations/20260703210000_demo_data_flag.sql (idempotent additive INSERT). Applies via the normal deploy pipeline (same as 028_feature_flags.sql), NOT an out-of-band MCP write. Code defaults demo-ON when the row is absent, so the switch works pre-migration; the row makes it flippable (owner sets enabled=false at launch).
- [x] Flag plumbing: read `demo_data` server-side in app/[locale]/page.tsx via lib/feature-flags.ts `isDemoDataEnabled()`, thread `demoEnabled` boolean prop to Reviews + Entdecken
- [x] Reviews.tsx: gate the REVIEWS fallback on demoEnabled (real path /api/reviews/featured EXISTS -> when off, empty/failed fetch omits the whole section)
- [x] Entdecken.tsx: gate the DEMO fallback on demoEnabled (real path /api/discovery/feed EXISTS -> when off, empty/failed fetch omits the whole section)
- [x] Self-test the SWITCH: forced demoEnabled=false in page.tsx, curled real dev server (:56960), confirmed rendered HTML has zero Reviews/Entdecken demo content (quotes/names/looks all absent, both sections correctly return null); forced back to real flag read (demoEnabled=true, since DB row absent -> default true), confirmed demo content returns. Reverted the forced value.

### Phase 2: the localStorage + hardcoded-constant sources (DONE + committed + live-verified 2026-07-03; threaded via page.tsx + Hero->SearchBar->SearchOverlay chain)
- [x] RecentlyViewed.tsx: gate DEMO_SALONS :51
- [x] RecentlyViewed.tsx: gate CAT_PRICE :96
- [x] RecentlyViewed.tsx: gate RV_ADDRESSES :101
- [x] useRecentlyViewed.ts: gate DEMO :27
- [x] Nearby.tsx: gate DEMO array :49
- [x] Nearby.tsx: gate CATEGORY_DEFAULT_PRICE :87
- [x] Nearby.tsx: gate NEARBY_ADDRESSES :92
- [x] Nearby.tsx: gate the map-pill hardcoded count :184
- [x] BusinessTeaser.tsx: gate or drop the static "1'200 Salons" sentence :73
- [x] forYouSalons.ts: gate FORYOU_SALONS :43 (ids/slugs already real, only name/rating/photo faked)
- [x] forYouSalons.ts: gate FORYOU_DEALS :71
- [x] searchCategories.ts: gate the hardcoded counts :41
- [x] SearchOverlay.tsx: gate the nearby map count :184
- [x] searchFeatured.ts: gate FEATURED_SALONS :30 (ids/slugs real, ratings/badges faked; real SQL in comment)

### Phase 3: real-backend wiring , DISPOSITIONED 2026-07-03 (concrete, not parked)
- [x] Prices: ALREADY EXISTS. /api/salons already aggregates real `prices` (priceQ/priceRes/prices in the route). The homepage demo sections that show fake prices (RecentlyViewed/Nearby) have ZERO fetch , they are pure localStorage/geolocation, so their real price path is DOWNSTREAM of geolocation, not a separate build. Search cards already get real prices.
- [x] Addresses: same shape. /api/salons returns salon rows; the homepage demo sections are geolocation-gated (no fetch), so real addresses arrive with the geolocation path, not as independent wiring.
- [x] FeaturedStylists.tsx: DECISION = leave dead (V3-D436, already fully commented out in page.tsx, import removed). No code needed. Applied the recommended default.
- [ ] BLOCKED (concrete dependency): Distance + live counts + the RecentlyViewed/Nearby real data path all need GEOLOCATION + real seeded salons, both deferred (research "Phase 2 deferred"; no real salons pre-launch). Cannot build or test the OFF-with-real-data state until geolocation lands + real salons exist. This is the ONLY genuinely-blocked remainder.

## WORKSTREAM CORE: DONE + VERIFIED 2026-07-03
The owner ask , "keep the fake data now but make it ONE-switch deletable + wire real backend" , is delivered:
- Deletable switch: DONE. One `demo_data` flag (feature_flags table) gates EVERY fabricated homepage/search source (phases 1+2, ~13 sources across 12 files). Live-verified both phases: flag ON -> demo present, forced OFF -> every fabricated string drops to 0. Flip one DB row at launch.
- Real backend: the sources that CAN have real data now already use real endpoints (/api/reviews/featured, /api/discovery/feed, /api/salons with real ratings+prices). The rest are geolocation-blocked (no real path exists pre-launch anyway).
Migration file committed (applies via deploy). Nothing doable is parked; the only open item is geolocation-blocked.

## Backend readiness (from research)
- Ratings: REAL path fully functional (salons.average_rating + /api/salons, /api/reviews/featured, /api/staff/featured). Flag-gate only.
- Prices: services.price exists, needs runtime aggregation (min/avg per salon). Real path needs the aggregation query.
- Reviews: /api/reviews/featured EXISTS + returns real fields. Flag-gate only.
- Discovery feed: /api/discovery/feed EXISTS. Flag-gate only.
- Addresses: salons has address columns; components just don't fetch them at the card stage. Wire the select.
- Distance/counts: need geolocation (deferred Phase 2) + a live count query. These stay demo-or-omit until geolocation lands.

## Status
RESEARCH DONE 2026-07-03. Build NOT started (substantial new system; deserves a fresh careful pass + confirm the client flag-read path). This is the next build when resumed. Owner wants it done; not blocking any other workstream.
