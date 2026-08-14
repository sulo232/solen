# Phase 2 , Backend Scalability Audit (Solen.ch) , FULL

Generated 2026-07-07 by the Fable-orchestrated / Sonnet-executed scalability audit (`wf_936e6a7c-151`, full re-run wdxbqndhd), measure-first, every finding live-verified against prod DB with EXPLAIN/row counts.
18 sections, 100 findings. **Counts:** 9 critical / 28 high / 31 medium / 32 low.

## Executive summary

Phase-2 scalability audit of Solen.ch (Next.js + Supabase + Stripe on Netlify): 18 sections audited, 100 merged findings (9 critical, 28 high, 31 medium, 32 low), every one live-verified against production DB tocfnsmxmdxkrcmjzzdw with EXPLAIN/row counts, not vibes. Six systemic patterns dominate. (1) SILENT NO-OPS, the project's own documented #1 failure mode, confirmed live four times: release-deposits and birthday-messages crons select phantom columns and have processed zero rows since deployment; rebooking-nudge's intended RPC does not exist so its unbounded fallback is the only path ever run; and the discovery thumb proxy is unreachable in production, so every TikTok-sourced Inspo card on the live homepage renders a gradient instead of its image, right now. (2) BOOKING WRITE PATH LACKS TRANSACTIONALITY: three routes (create, express-rebook, reschedule) claim slots via an unguarded UPDATE with no status check; a real double-booking already exists in production data (same slot_id, two confirmed bookings 27 minutes apart), while the sibling recurring route proves the correct pattern is already known in-codebase. (3) N+1 / SERIAL-AWAIT EPIDEMIC: ~25 routes and crons loop serial per-row DB/Auth-Admin/Stripe/Resend/SMS calls; the codebase contains zero waitUntil/outbox, and Netlify's non-configurable 60s function ceiling (maxDuration is a no-op there) makes discovery-deadcheck (934 sequential external fetches) already un-completable and review-prompt/sms-reminders/abandon-sweep time bombs at 5-10x booking volume; a search with with_slots=1 (the default) fans out up to 150 concurrent slot queries per request. (4) UNBOUNDED QUERIES: 232 of 359 route files have no .limit()/.range() anywhere; availability_slots is append-only at 164,576 rows (83.7% already past) with no purge cron; several admin/dashboard endpoints ship a salon's entire lifetime booking history to JS to compute one number. (5) CACHING IS STRUCTURALLY BROKEN: 3 of 4 revalidate exports are silenced by cookies() (curl-proven no-cache in prod), netlify.toml's /api/* cache header is inert for route handlers, all existing caches are per-instance module variables, /api/cities is fetched 3-5x per page load uncached, and Gemini embeddings + Mapbox geocode pay a fresh external call per request. (6) MISSING INDEXES ON HOT PREDICATES: no GIN on salons.categories (the busiest filter), no index on discovery_items(status,is_active,category), no spatial index for nearby, and 6 crons' time-range scans can't use any existing salon_id-leading index; conversely the 136 advisor-flagged "unused" indexes are the deliberate 2026-06-24 FK hardening and must NOT be dropped. RLS is largely clean post-hardening: 12 of 13 permissive-policy warnings concentrate in two service_bundles tables with an uncorrelated IN-subquery fixable in one migration.

## Ranked findings


### CRITICAL

**1. Slot-claim race in booking create: unguarded UPDATE, double-booking proven live**  
`hot-path` · `app/api/bookings/route.ts:471` · effort **M** · risk **risky**  
- Impact: The slot UPDATE has no .eq('status','available') guard, no affected-row check, and no DB unique constraint on bookings.slot_id. A live double-booking already exists in production (slot 57a1886b..., two confirmed bookings 27 min apart, out of 956 total). Every concurrency increase raises the collision rate on the single highest-value write path. Sibling recurring/route.ts:94-104 already implements the correct guard.
- Fix: Add .eq('status','available') + returned-row-count check mirroring recurring/route.ts; on zero rows delete the just-inserted booking and return 409 SLOT_TAKEN. Hard guarantee: move insert+claim into one RPC with SELECT ... FOR UPDATE (create_group_booking pattern).

**2. Thumb proxy unreachable in production: every TikTok Inspo/Entdecken card silently renders a gradient**  
`production-outage` · `app/api/discovery/thumb/[id]/route.ts:66` · effort **M** · risk **safe**  
- Impact: Live curl of a verified real item returns Next's app-shell 404 HTML, not the route's own plain-text 404, proving requests never reach the handler. The route is live-wired into the current homepage (useInspoLooks.ts:51, useForYouLooks.ts:40, Entdecken.tsx:131); CSS gradient fallback masks the failure from users, so all TikTok-sourced discovery thumbnails are broken in prod today with zero error signal.
- Fix: Root-cause before any caching work: check the live Netlify function list/deploy log for api/discovery/thumb/[id], redeploy, re-curl a known item and confirm the response body matches the route's own logic (image bytes or its literal 'not found' text).

**3. discovery_feed_for_you rescores the entire catalog with a per-row correlated affinity subplan on every request, uncached**  
`hot-path` · `supabase/migrations/20260623124500_user_style_affinity.sql:104` · effort **M** · risk **risky**  
- Impact: Live EXPLAIN: Seq Scan over all 1,070 published items with a correlated SubPlan over user_style_affinity re-executed per row (loops=1070, ~47k row comparisons, 29ms today). Cost is O(items x affinity_rows_per_user); offset=300 reads the identical 1,371 buffers as offset=0, so every scroll page repays the full scan. Linear projection to the 100k-item content target: ~2.7s DB time per request, per user, per scroll page. Default path for every signed-in Inspo mount (feed/route.ts:83-99).
- Fix: Precompute a per-user ranked candidate list on the existing daily style-affinity-recompute cron (or cache the ranked ID list 5-15 min, safe under the 60-day decay), plus the discovery_items feed index and restructuring the OR-chain so scoring is not O(items x affinity).

**4. availability_slots is append-only forever: 164,576 rows, 83.7% already past, no purge cron**  
`unbounded-growth` · `app/api/cron/generate-slots/route.ts:24` · effort **M** · risk **safe**  
- Impact: Live counts: 137,746 past rows vs 26,830 future; monthly inserts jumped Mar 238 -> Jun 100,951. No DELETE exists in any of the 12 cron jobs. Backlog compounds linearly with salon count forever, inflating the table's 10 indexes, autovacuum cost (14.2% dead tuples already), and backup size.
- Fix: Add a daily purge cron deleting past available/blocked rows only (never booked rows until bookings.* is confirmed the historical source of truth); register next to generate-slots in cron-jobs.yml.

**5. generate-slots cron: one serial SELECT-then-INSERT round trip per slot-time, redundant against an existing unique index**  
`n+1` · `app/api/cron/generate-slots/route.ts:170` · effort **M** · risk **safe**  
- Impact: Four nested loops (salons > staff > 30 days > slot-times) with a per-slot existence SELECT + conditional INSERT, all serially awaited. The UNIQUE index availability_slots_dedup_uniq already guarantees dedup at the DB layer, making every SELECT pure waste. 67 active staff x 4.1 mapped services today; runtime scales linearly with staff count with no batching path.
- Fix: One set-based bulk upsert per staff member using onConflict against the existing unique index; parallelize across staff with a bounded batch size.

**6. release-deposits cron selects a nonexistent column: the 72h stale-deposit safety net has never fired**  
`correctness` · `app/api/cron/release-deposits/route.ts:25` · effort **S** · risk **safe**  
- Impact: bookings has payment_intent_id, not stripe_payment_intent_id (live schema check). The error is discarded, so every run silently processes zero rows and reports ok:true. Stuck pending deposit holds accumulate in direct proportion to booking volume, invisible to monitoring.
- Fix: Rename to payment_intent_id (matching the already-fixed no-show cron), check the select error, alert-admin on error, add a regression test seeding one expired pending booking asserting released:1.

**7. birthday-messages cron selects a nonexistent column: permanent silent no-op, zero emails ever sent**  
`correctness` · `app/api/cron/birthday-messages/route.ts:27` · effort **S** · risk **safe**  
- Impact: Live schema: profiles has date_of_birth, not birthday; select count(birthday) throws 42703. The destructure never checks error, so profiles ?? [] silently filters to empty and the cron reports sent:0 daily, forever. Also fetches the whole profiles table client-side even when fixed.
- Fix: Fix the column to date_of_birth, check the query error, and push the month/day match into SQL (EXTRACT(MONTH/DAY FROM date_of_birth)).

**8. rebooking-nudge: intended RPC does not exist live, so the unbounded full-scan fallback is the only path that has ever run**  
`unbounded-query` · `app/api/cron/rebooking-nudge/route.ts:28` · effort **M** · risk **safe**  
- Impact: pg_proc has zero rows for get_rebooking_candidates, so the try/catch always falls to the no-limit fallback: a Seq Scan matching 721 of 956 bookings today (a '< cutoff' predicate never ages rows out, so membership grows monotonically forever), followed by 4 serial round trips per user. Silent PostgREST row-cap truncation is the next failure once the scan crosses the default cap.
- Fix: Implement get_rebooking_candidates as a real dedup-in-SQL RPC (DISTINCT ON (user_id)), or add .limit(200) + an index on bookings(status, starts_at), and bulk-.in() the per-user lookups.

**9. discovery-deadcheck: 934 sequential external oEmbed calls vs Netlify's hard 60s ceiling, killed mid-loop every run**  
`cron-inefficiency` · `app/api/cron/discovery-deadcheck/route.ts:38` · effort **M** · risk **safe**  
- Impact: 934 matching rows (live count), unbounded query, fully serial fetch loop with a 12s per-call timeout. Netlify's synchronous-function cap is a documented, non-configurable 60s; even optimistic 150ms/call needs ~140s. Only the unordered head of the scan is ever checked; the rest of the growing catalog is never dead-checked, and the GitHub Actions caller swallows the failure.
- Fix: Add a last_checked_at cursor (ORDER BY ... LIMIT 150) so runs rotate through the catalog, batch probes with bounded concurrency (~10), or convert to a Netlify Background Function (15 min budget).


### HIGH

**10. with_slots fan-out fires up to 150 concurrent Supabase queries per single search request**  
`n+1` · `app/api/salons/route.ts:547` · effort **M** · risk **safe**  
- Impact: 3 top services x 50 salons = up to 150 concurrent availability_slots queries per search; SearchTemplate.tsx:870 sends with_slots=1 unconditionally, so this is the default search path. 50 concurrent full-page searches = up to 7,500 simultaneous outbound requests, a concurrency-shaped failure independent of row growth. Already flagged in SWEEP_BACKLOG.md with the fix proposed, never implemented.
- Fix: Replace the per-service Promise.all with one window-function RPC (ROW_NUMBER() OVER (PARTITION BY service_id ORDER BY starts_at) <= 3), exactly as SWEEP_BACKLOG.md:90 proposes.

**11. Salon PDP is fully dynamic (unconditional cookies()) with zero caching on the busiest read path**  
`no-cache` · `lib/salon-detail.ts:43` · effort **L** · risk **risky**  
- Impact: cookies() called unconditionally forces per-request lambda rendering; no revalidate/unstable_cache anywhere in the PDP path (grep-confirmed). Per-query cost is trivial (0.113ms slug lookup) so cost = invocation count x round-trip count, scaling linearly with every visit to the highest-traffic customer page.
- Fix: Split owner-conditional fields out of the hot path; cache the public salon+services+staff+reviews payload (unstable_cache or revalidate 60-300s keyed by slug, invalidated on writes); hit the cookie-gated path only for the rare authenticated-owner view.

**12. No GIN index on salons.categories, the single most common predicate on the busiest read path**  
`missing-index` · `app/api/salons/route.ts:155` · effort **S** · risk **safe**  
- Impact: Live EXPLAIN: category filter runs as a post-index Filter on an unrelated index. As active salons grow into the hundreds/thousands (the core growth axis), every bare category browse degrades to Filter+Sort over all active rows, and count:exact pagination pays the same scan twice.
- Fix: CREATE INDEX idx_salons_categories_gin ON salons USING gin(categories); additive, no code change.

**13. Nearby endpoint sorts by distance over an unordered candidate set: true-nearest salons silently dropped past ~24 active salons**  
`correctness` · `app/api/salons/nearby/route.ts:63` · effort **M** · risk **safe**  
- Impact: limit*4 rows fetched with no .order() before the in-memory Haversine sort. Today's 20 active+listed salons fit inside the 24-row window by coincidence; the moment a city exceeds ~24, 'nearby' returns an arbitrary non-geographic slice with no error, the codebase's stated #1 silent-failure shape.
- Fix: Prefilter with a lat/lng bounding box in WHERE before the limit, or use earthdistance for a real ORDER BY earth_distance(...) LIMIT.

**14. discovery_items has no index covering (status, is_active, category), the predicate of every feed/search/meta query**  
`missing-index` · `app/api/discovery/feed/route.ts:112` · effort **S** · risk **safe**  
- Impact: Live EXPLAIN: Seq Scan (563 rows removed by filter) feeding a WindowAgg count(*) over() BEFORE Sort+Limit, so the full filtered subset is scanned + aggregated on every request including every infinite-scroll page. At the 100k-row content target this is tens of thousands of rows per request per category tab.
- Fix: CREATE INDEX idx_discovery_items_feed ON discovery_items (category, status, is_active, sort_order, created_at DESC) WHERE status='published' AND is_active; derive has_more from rows==limit on pages beyond 1.

**15. Query embeddings never cached: every full search pays a fresh Gemini API round trip**  
`no-cache` · `lib/search/embeddings.ts:16` · effort **S** · risk **safe**  
- Impact: All 3 call sites (smart search, salons/search, no-results) call generateEmbedding() with zero memoization; the code's own comment already proposes caching. Cost scales linearly with query volume with no discount for repeated popular queries, on an external paid API in the search hot path.
- Fix: Cache by normalized query + model + taskType in the already-wired Upstash Redis, multi-hour TTL (embeddings are stable).

**16. Geocode fires one external Mapbox call per served city per debounced keystroke, no result cache**  
`hot-path` · `app/api/search/geocode/route.ts:222` · effort **M** · risk **safe**  
- Impact: Promise.all(served.map(fetchFeatures)) by design; 1 active city today, but city rollout (explicit roadmap) multiplies paid, rate-limited Mapbox volume per keystroke (250ms debounce) with zero shared cache for repeat queries like common street names.
- Fix: Short-TTL Redis cache keyed on normalized query; consider one wider-bbox Mapbox call + server-side city matching, reserving per-city fan-out for genuine ambiguity.

**17. Booking create blocks the customer response on 6-12+ serial round trips including two Resend email sends; zero waitUntil in the codebase**  
`serial-await` · `app/api/bookings/route.ts:497` · effort **L** · risk **risky**  
- Impact: Customer email (497-522) then owner chain (profiles select + getUserById + sendEmail, 531-552) are all awaited before the 201, on top of 6+ serial DB reads earlier in the handler and up to 6 more referral awaits. Fires on every non-online-pay booking create; latency scales with Resend tail latency and booking volume on the single highest-value conversion action. Repo-wide grep confirms no background-execution mechanism exists.
- Fix: Promise.all the independent reads and the two email sends now (same semantics); proper fix is a notification_outbox table drained by an existing frequent cron, since bare un-awaited promises can be frozen mid-flight on Netlify.

**18. Same unguarded slot-claim race repeated in express-rebook/confirm**  
`hot-path` · `app/api/bookings/express-rebook/confirm/route.ts:69` · effort **S** · risk **risky**  
- Impact: UPDATE availability_slots SET status='booked' with no status guard and no affected-row check: identical mechanism to the race already proven live in the create path, reproduced on the express-rebook flow.
- Fix: Apply the BWP-1 fix: .eq('status','available') on the UPDATE, check affected rows, roll back the insert on zero rows.

**19. Reschedule is a 3-step non-transactional saga with unchecked compensating writes and the same missing status guard**  
`hot-path` · `app/api/bookings/[id]/reschedule/route.ts:120` · effort **M** · risk **risky**  
- Impact: Free-old-slot, update-booking, claim-new-slot run as three independent writes; the new-slot claim has no status guard and the compensating rollbacks are fired unchecked. A crash/race mid-sequence leaves booking and slot rows silently inconsistent, worsening under concurrent reschedules of the same slot.
- Fix: One RPC/transaction with SELECT ... FOR UPDATE on both slots (create_group_booking pattern); at minimum add the status guard + row-count check on the new-slot claim.

**20. Rate limiting is a total, unlogged no-op when Upstash env vars are absent, on the booking/payment money paths**  
`hot-path` · `lib/ratelimit.ts:96` · effort **S** · risk **safe**  
- Impact: applyRateLimit and checkRateLimit both fail open silently on missing env vars (real Redis errors DO log, config absence doesn't). All 16 limiters including paymentLimiter (3/hr) and the guest reference_code enumeration defense become pass-throughs with zero deploy-log signal if a var is dropped or rotated on any target.
- Fix: One-time startup warn when redis resolves to null; flag to the owner whether booking/payment limiters should fail closed in production.

**21. 3 of 4 export-const-revalidate declarations are silent no-ops because their handlers call cookies()**  
`no-cache` · `app/api/salons/trending/route.ts:5` · effort **S** · risk **safe**  
- Impact: Live-curl proven on production: trending, analytics/platform, slots/last-minute all return cache-control: no-cache despite revalidate=86400/86400/60, because createServerSupabaseClient() calls cookies(). metrics/global (admin client, no cookies) shows a genuinely working 411-day-old cache, proving the fix pattern. analytics/platform has a live consumer (platform-analytics dashboard) paying full DB cost per visit today.
- Fix: Swap createServerSupabaseClient() for createAdminSupabaseClient() in analytics/platform and slots/last-minute (neither reads per-user state); re-verify with the same curl/cache-status check post-fix.

**22. /api/cities: force-dynamic, no cache, fetched 3-5x per page load by always-mounted nav components, plus an unbounded salons scan per hit**  
`no-cache` · `app/api/cities/route.ts:33` · effort **M** · risk **safe**  
- Impact: useActiveCities is a bare per-instance useEffect despite claiming to be 'the single shared fetch'; Header unconditionally mounts 3 consumers (5 on search pages), guaranteeing 3-5 duplicate requests per page load. Each hit scans every active salon with no limit and does an O(cities x salons) in-memory join. lib/cities.ts already has a cached getActiveCities() this route ignores.
- Fix: Single context/provider at the locale layout; route calls the existing getActiveCities(); compute per-city counts via one grouped query or add the s-maxage=300 pattern category-meta already uses.

**23. next-available lookup intermittently picks the GLOBAL (status,starts_at) index and discards other salons' rows; cost grows with tenant count**  
`hot-path` · `app/api/slots/next-available/route.ts:14` · effort **S** · risk **safe**  
- Impact: Reproduced exactly on live data: Index Scan on idx_slots_date_status with Filter salon_id, Rows Removed: 111; the planner picks the wrong index when a salon's earliest slot sorts late platform-wide ('rows ahead globally' already 412 at 20 salons). Verification caveat: a fresh ANALYZE did NOT flip the plan, so stats alone won't fix it.
- Fix: Covering-index tweak or query rewrite so the salon-scoped partial index always wins; do not assume fresher stats fix it (tested, they don't).

**24. Station/chair overlap post-processing in generate-slots is O(n^2) per salon, dormant only because config tables are empty**  
`hot-path` · `app/api/cron/generate-slots/route.ts:226` · effort **M** · risk **safe**  
- Impact: Both nail-station and barber-chair blocks run slots.filter() inside a loop over every future slot of the salon. Busiest live salon has ~7,300-9,900 future rows, so the first salon to configure a station/chair count triggers tens of millions of comparisons; the try/catch means the failure mode is a silent per-salon hang, not an error.
- Fix: Replace the double-filter with a sweep-line/sliding-window pass (sort once, track concurrent count), O(n log n), before any real salon configures these tables.

**25. analytics/salon/[id] live-recomputes everything from raw bookings on every dashboard-home mount; the salon_analytics rollup table is decorative**  
`hot-path` · `app/api/analytics/salon/[id]/route.ts:63` · effort **L** · risk **safe**  
- Impact: Fired unconditionally on every dashboard home load (dashboard/page.tsx:118). Only 2 fields are read from the pre-aggregated rollup; current + prior periods and an O(customers x visits) retention loop are recomputed live from raw bookings, cost growing with each salon's lifetime booking volume.
- Fix: Serve fully-past periods from the salon_analytics rollup; live-query only the partial current-period tail; extend the rollup cron to cover heatmap/retention/acquisition/daily series.

**26. Salon client-list endpoints pull every completed booking ever, no limit: silent truncation past the PostgREST row cap**  
`unbounded-query` · `app/api/dashboard/clients/route.ts:29` · effort **M** · risk **safe**  
- Impact: Both dashboard/clients and salon/clients select a salon's full lifetime booking history (no date bound, no range) and aggregate in Node. Busiest salon = 41 completed today, but the first salon to cross the PostgREST max-rows cap gets a silently truncated client list with no error.
- Fix: Aggregate in SQL (GROUP BY user_id with COUNT/MAX/SUM) or SELECT DISTINCT ON (user_id); at minimum add a bounded window + pagination.

**27. earnings/staff has no default time floor: omitted from/to scans the salon's entire booking history**  
`unbounded-query` · `app/api/earnings/staff/route.ts:40` · effort **S** · risk **safe**  
- Impact: from/to only conditionally applied; an omitted range scans every completed booking the salon ever had, joined to services(price), growing with salon tenure with no ceiling.
- Fix: Default from/to to a bounded window (current month or last 90 days) when the caller omits them.

**28. Admin users/salons pages fan out one Auth Admin API HTTP call per row (up to 500, unbounded for salons)**  
`n+1` · `app/api/admin/salons/route.ts:40` · effort **M** · risk **safe**  
- Impact: admin/users: Promise.all(getUserById) over up to 500 profiles per page view; admin/salons: same fan-out with NO limit on the salons query at all. These are external GoTrue HTTP calls, not DB reads, so no index helps; real rate-limit/timeout risk as counts grow past a few hundred. (Merges dash-01, dash-04, npo-03, UQ-4.)
- Fix: Denormalize email onto profiles/salons via auth trigger, or one listUsers({page,perPage}) call to build an id->email map; add .range() pagination to the salons query.

**29. admin/revenue pulls up to a year of platform-wide bookings unbounded, twice, then does an O(days x bookings) scan in Node**  
`unbounded-query` · `app/api/admin/revenue/route.ts:34` · effort **M** · risk **safe**  
- Impact: Current and prior periods both fetched with no limit (up to 365 days each); the daily breakdown re-filters the full array once per distinct day. 956 rows today is instant; at 10-100x volume this ships the entire row set over the wire twice and rescans it per day, per admin view.
- Fix: Push aggregation into Postgres (GROUP BY date_trunc('day', starts_at)) + a single SUM/COUNT head query; replace the filter-inside-map with a prebuilt Map keyed by day.

**30. Benchmarks endpoint runs a strictly serial booking-count query per active salon platform-wide**  
`n+1` · `app/api/analytics/benchmarks/route.ts:54` · effort **S** · risk **safe**  
- Impact: All active salons fetched unbounded, then one serial count query each (no Promise.all): ~21 sequential round trips today, degrading for every owner simultaneously as platform salon count grows.
- Fix: One grouped query (SELECT salon_id, count(*) ... GROUP BY salon_id) or an RPC; look up the caller's own count from the map.

**31. reconcile cron: per-charge/per-refund N+1 DB lookups (up to 1000 each) inside a shared 5-minute job budget whose timeout is silently swallowed**  
`n+1` · `app/api/cron/reconcile/route.ts:122` · effort **M** · risk **safe**  
- Impact: 4 code sites issue one unbatched .maybeSingle() per Stripe object; reconcile shares one timeout-minutes:5 GitHub Actions job with 3 other crons, and the ping-cron strict-exit path is commented out, so at 10-50x transaction volume the only Stripe<->DB financial reconciliation net gets silently truncated with no alert.
- Fix: Batch DB lookups per 100-row Stripe page with .in(); give reconcile its own job + timeout; make ping-cron exit non-zero for this endpoint.

**32. review-prompt cron: 7-9 serial network calls per booking row, hourly; times out under 5-10x booking growth leaving partial sends**  
`cron-inefficiency` · `app/api/cron/review-prompt/route.ts:79` · effort **M** · risk **safe**  
- Impact: Per row: getUserById, 2 review selects, up to 3 serial Resend calls, sendNotification, bookings.update, all sequential. Live volume today is 1-2 completed bookings/day so it currently fits, but ~8-10 qualifying rows exceed even Netlify's 26s Pro cap; a mid-run kill leaves review_prompt_sent inconsistent, causing duplicate sends next run. (Merges cron-6 + notif-1.)
- Fix: Batch the independent lookups with .in(), fire per-row emails via Promise.allSettled with a concurrency cap, stamp review_prompt_sent immediately after the primary send.

**33. loyalty-recompute RPC full-scans the entire bookings table monthly: the 12-month window lives in the aggregate FILTER, not the WHERE**  
`cron-inefficiency` · `app/api/cron/loyalty-recompute/route.ts:20` · effort **S** · risk **safe**  
- Impact: pg_get_functiondef confirms the CTE's WHERE is only user_id is not null; the time bound sits inside count(*) FILTER, so Postgres must read and group every historical booking every month. Free at 956 rows; a guaranteed full scan + hash aggregate at millions.
- Fix: Move the 12-month bound into the CTE's WHERE (with buffer) so an index range scan applies; add bookings(starts_at) index if EXPLAIN still seq-scans.

**34. barber-smart-reminders: unbounded nested loop, 7 serial queries per customer, no cursor**  
`n+1` · `app/api/cron/barber-smart-reminders/route.ts:29` · effort **L** · risk **safe**  
- Impact: Salons and customers both fetched unbounded; per customer 7 fully serial round trips (cuts, future-bookings, note, profile, insert, auth, SMS). O(salons x customers x 7) with no resume cursor if a run times out; invisible at today's 10 barber_cut_history rows, structural at scale.
- Fix: One GROUP BY cut-count query per salon, bulk .in() the notification/profile lookups, cap customers per run with a resumable cursor.

**35. welcome-series: unbounded daily-cohort select + 3 serial round trips per profile on edge runtime**  
`unbounded-query` · `app/api/cron/welcome-series/route.ts:31` · effort **M** · risk **safe**  
- Impact: No .limit() on the cohort select; per profile serial notification_preferences + getUserById + sendEmail. Scales directly with daily signup volume, the fastest-growing input in the cron set.
- Fix: Defensive .limit(500) + pagination; bulk .in() the preference and auth lookups ahead of the loop.

**36. off-peak notify: unbounded serial N+1 per favoriting user, and the documented 7-day rate cap is admittedly not implemented**  
`n+1` · `app/api/notifications/off-peak/route.ts:68` · effort **M** · risk **safe**  
- Impact: All favorites fetched with no limit; per user serial getUserById + profile select + Resend fetch, blocking the owner's PATCH response on edge runtime. The code comment admits the JSDoc's '1 email per salon per user per 7 days' cap does not exist, so repeated owner toggles re-spam every favoriter today, independent of scale. (Merges npo-09 + UQ-7 + notif-3.)
- Fix: Implement the promised 7-day sent-log check, batch the lookups with .in(), cap/queue the fan-out so the save action can't time out.

**37. discovery-ai-backfill's maxDuration=300 is a no-op on Netlify; the sequential 10-item Gemini loop reasons against a budget 5x larger than the real 60s cap**  
`cron-inefficiency` · `app/api/cron/discovery-ai-backfill/route.ts:7` · effort **S** · risk **safe**  
- Impact: Netlify enforces a non-configurable 60s ceiling regardless of maxDuration; 10 sequential gemini-2.5-flash calls generating 4-language structured output from vision input have no verified margin under it. Backlog is 7 items today but one bulk import (1,053 rows observed in a week) refills PER_RUN instantly.
- Fix: Measure real per-call latency for this exact prompt shape, size PER_RUN to sit well under 60s or parallelize 2-3 at a time; drop or annotate the misleading maxDuration.


### MEDIUM

**38. Systemic: 232 of 359 API route files have no .range()/.limit() anywhere**  
`no-pagination` · `app/api:1` · effort **L** · risk **safe**  
- Impact: Grep re-verified: 312 routes use .select(), 232 have zero bound anywhere in the file. Each becomes a one-off silent-truncation bug the day its query crosses the PostgREST row cap; availability_slots (164k rows) shows how fast a table gets there.
- Fix: Lint/CI gate (or shared query-builder wrapper) requiring an explicit bound or a documented 'bounded by X' comment on every .select() under app/api; prioritize routes reading fast-growing tables.

**39. get_nearby_salon_ids has no spatial index: every map-pan computes trig distance for every active salon nationwide**  
`missing-index` · `app/api/salons/route.ts:424` · effort **S** · risk **safe**  
- Impact: Live EXPLAIN confirms row-by-row earth_distance over all active rows (no GiST index, no city/category pruning) + full Sort. 1.29ms at 28 salons; grows linearly with zero pruning as the marketplace scales.
- Fix: CREATE INDEX ... USING gist(ll_to_earth(latitude, longitude)); rewrite the RPC to the KNN operator so ORDER BY is index-driven.

**40. salons_with_slot_in_hours RPC sorts all matching slot rows in memory to derive a few distinct salon ids**  
`missing-index` · `app/api/salons/route.ts:316` · effort **M** · risk **safe**  
- Impact: Live EXPLAIN: 12,468 actual rows through Sort+Unique in memory, 40ms, because extract(hour) is a post-index Filter. Used by up to 3 filters per search request; cost scales with slot volume (horizon x staff x salons), not matching-salon count.
- Fix: Functional index supporting extract(hour from starts_at), or rewrite SELECT DISTINCT as GROUP BY salon_id (hash aggregate).

**41. Computed sub-filters (service/gender/price) resolve unbounded id-sets via Seq Scans with a bypassed trigram index**  
`unbounded-query` · `app/api/salons/route.ts:264` · effort **M** · risk **safe**  
- Impact: Raw .ilike() cannot match the lower(f_unaccent()) expression idx_services_name_de_trgm covers (Seq Scan confirmed live); gender/price predicates also unindexed; resolved id-sets are serialized whole into .in() with no cap. Grows linearly with the services table, a direct growth axis.
- Fix: Match the trgm-indexed expression; add partial btree on services(is_active, price) + GIN on suitable_gender; cap id-sets or move to an EXISTS/RPC.

**42. Three salon-scoped slot read endpoints have no bound: payload scales with staff x services x slot density**  
`no-pagination` · `app/api/slots/route.ts:38` · effort **M** · risk **risky**  
- Impact: Zero .range()/.limit() across /api/slots, availability/[salon_id], availability/time-slots (grep-confirmed). Reproduced live: 7,260 rows / 251ms for one salon's 7-day window; row explosion driver (4.1 avg, max 12 services per staff) already measurable per-salon, independent of tenant count.
- Fix: Add .range() pagination or move the client-side grouping server-side, capping the raw fetch instead of returning every discrete slot row.

**43. Edge runtime on 109 join-heavy/payment routes despite a single-region DB, with a known edge cookie-parsing bug degrading to anonymous auth**  
`edge-runtime` · `lib/supabase.ts:19` · effort **M** · risk **risky**  
- Impact: 109/359 routes set runtime='edge' including bookings/user, salons list, and stripe/create-payment-intent; DB is single-region eu-west-2 so the fixed DB round trip dominates regardless of function placement. lib/supabase.ts:19-26 contains a try/catch for an edge-observed cookie-parse failure on long JWTs that silently degrades to anonymous, worst on payment/admin surfaces.
- Fix: Move join-heavy/admin/payment routes to nodejs; reserve edge for latency-sensitive, cookie-light, single-query routes.

**44. Payment-intent creation awaits three independent queries serially on the money path**  
`serial-await` · `app/api/stripe/create-payment-intent/route.ts:36` · effort **S** · risk **safe**  
- Impact: Salon, service, and commission fetches have no cross-dependency yet run sequentially: 3 round trips of latency per payment-intent creation, holding the function open longer under concurrent load, gating a Stripe call.
- Fix: Promise.all the three fetches; run the validation logic after all resolve.

**45. Smart search serially awaits two independent Gemini calls**  
`serial-await` · `app/api/search/smart/route.ts:25` · effort **S** · risk **safe**  
- Impact: generateEmbedding then RPC then detectCategory run serially with no data dependency, adding a full extra Gemini call of tail latency to every smart-search request and holding the nodejs function open longer per request.
- Fix: Promise.all the embedding+RPC chain and detectCategory(q).

**46. Treatments search pulls the entire matching services set into memory before paginating**  
`unbounded-query` · `app/api/search/treatments/route.ts:27` · effort **M** · risk **safe**  
- Impact: serviceQuery executes with no limit while the downstream salonQuery is correctly .range()-paginated; a broad term or level-1 category match fetches every matching service row into app memory, scaling linearly with catalog growth.
- Fix: Cap the services fetch (~2000) or push matching + salon resolution into one indexed RPC mirroring search_suggest.

**47. Treatments search's raw ILIKE cannot use the existing trigram indexes, forcing full table scans**  
`missing-index` · `app/api/search/treatments/route.ts:33` · effort **M** · risk **safe**  
- Impact: Live EXPLAIN: Seq Scan, 221 rows removed; idx_services_name_de/en_trgm exist but are built on lower(f_unaccent()), which the raw ILIKE bypasses. Same shape recurs at line 52. O(n) with the services table, unlike the sibling RPCs that hit the index.
- Fix: Route name matching through an RPC filtering on the indexed expression, or reuse search_suggest/search_salons_ranked.

**48. Duplicate salon-row fetch: layout.tsx and lib/salon-detail.ts each query salons by slug per PDP render**  
`no-cache` · `app/[locale]/salon/[slug]/layout.tsx:20` · effort **S** · risk **safe**  
- Impact: React cache() only dedupes identical function references; the two independent selects mean 2x queries for 1x data on every PDP request, pure waste scaling linearly with traffic.
- Fix: Wrap loadSalonDetail in React cache() and have layout.tsx read its fields from that single cached result.

**49. PDP services and staff_members selects have no bound or order, unlike the correctly capped reviews query beside them**  
`no-pagination` · `lib/salon-detail.ts:78` · effort **S** · risk **safe**  
- Impact: 263 services / 70 staff today so harmless, but chain/franchise catalogs ship unbounded to every PDP visitor; idx_services_sort already exists unused, so ordering is free.
- Fix: Add .limit(200) + .order('sort_order') to both, mirroring the reviews pattern.

**50. Every new review triggers a full reviews-per-salon scan to recompute the average**  
`unbounded-query` · `app/api/reviews/route.ts:125` · effort **S** · risk **safe**  
- Impact: POST fetches ALL rating rows for the salon (no limit) and reduces in JS; O(salon's total review history) per submission, forever. salons.average_rating/review_count already exist, so the incremental path is directly available. (Merges npo-05 + UQ-3.)
- Fix: Incremental update ((old_avg*count + new)/(count+1)) or a single SQL AVG/COUNT aggregate.

**51. current_user_tier() recomputed live on the booking-payment hot path, called twice when a tier-gated promo is used**  
`hot-path` · `lib/loyalty/perks.ts:195` · effort **S** · risk **safe**  
- Impact: Every logged-in booking on a Connect salon pays one live tier RPC; a tier-gated promo pays it twice for the identical value, on the highest-value hot path. Index-backed and sub-ms, so latency/round-trip cost, not scan cost.
- Fix: Resolve the tier once per request (memoized) and reuse for both the promo gate and resolveMemberDiscount.

**52. 6 cron time-range scans on bookings can't use any index: every time index leads with salon_id**  
`missing-index` · `app/api/cron/review-prompt/route.ts:41` · effort **M** · risk **safe**  
- Impact: Live EXPLAIN: Index Scan with Index Cond on starts_at alone inside a salon_id-leading index = full index walk. Mechanism scales with total table size, not window size; sub-1ms at 956 rows, a real recurring cost at 100k+ across crons running every 15-60 min.
- Fix: Targeted partial indexes per cron predicate (e.g. (starts_at) WHERE status='completed' AND review_prompt_sent=false), self-pruning and additive.

**53. pre-charge cron re-fetches the platform commission setting inside the per-booking loop**  
`n+1` · `app/api/cron/pre-charge/route.ts:43` · effort **S** · risk **safe**  
- Impact: Up to 50 redundant serial round trips per run to a single-row settings table, scaling with batch size, inside the same shared timeout budget flagged for reconcile.
- Fix: Hoist the platform_settings read above the loop; reuse one ratePercent for the batch.

**54. pre-charge and release-payments cap at limit(50) with no drain loop; release-payments' 'hourly' comment mismatches its real 6-hourly schedule**  
`no-pagination` · `app/api/cron/release-payments/route.ts:8` · effort **S** · risk **safe**  
- Impact: At 10-50x volume, more rows become due between runs than one 50-row pass clears; overflow waits for the next run, compounding backlog against Stripe's 7-day manual-capture expiry. The 6x cadence mismatch between the comment and cron-jobs.yml is confirmed.
- Fix: Fix the comment or move to the hourly job; replace limit(50) with a paging loop bounded by wall-clock budget.

**55. sms-reminders: up to 200 rows per run, fully serial external SMS calls, 1h window queued behind the 24h batch**  
`serial-await` · `app/api/cron/sms-reminders/route.ts:53` · effort **M** · risk **safe**  
- Impact: Both windows loop serially (external sendSMS + DB update per row); the time-critical 1h reminder always waits for the full 24h batch. Capped runs silently drop overflow reminders outside the 1h window with no backlog metric. Currently a no-op at live volume, breaks structurally with real bookings. (Merges cron-11 + notif-2.)
- Fix: Run the two windows concurrently; concurrency-capped Promise.allSettled within each; log when a run hits its cap.

**56. abandon-sweep: serial Stripe PI retrieve per row, first every-15-min cron likely to hit timeout as volume grows**  
`serial-await` · `app/api/cron/abandon-sweep/route.ts:61` · effort **M** · risk **safe**  
- Impact: Correctly bounded at limit(50), but 50 fully serial Stripe round trips (200-500ms each) plus 1-2 DB writes per row can approach the function timeout as abandoned-booking volume tracks booking volume.
- Fix: Batch PI checks with bounded concurrency (chunks of 5-10).

**57. nail-infill-reminders joins the entire lifetime history of completed nail bookings daily with no date bound**  
`unbounded-query` · `app/api/cron/nail-infill-reminders/route.ts:22` · effort **M** · risk **safe**  
- Impact: No SQL-level date bound or limit; Seq Scan on services (no category index) feeding the join; 3 more serial queries per matching row. Grows unbounded as nail bookings accumulate, with zero pruning of already-handled rows.
- Fix: SQL date bound sized to max reminder_cycle_days; index on services(category).

**58. style-affinity-recompute scans discovery_saves/likes/interactions with no created_at index**  
`missing-index` · `app/api/cron/style-affinity-recompute/route.ts:21` · effort **S** · risk **safe**  
- Impact: All 4 UNION branches filter created_at >= now()-365d, but the three event tables have zero created_at coverage (discovery_search_events already has one). Interactions is structurally the highest-volume event table; the daily recompute will seq-scan its full lifetime history for the trailing slice.
- Fix: Add created_at (or (user_id, created_at)) indexes on all three tables, mirroring idx_dse_time.

**59. solen-score recalculate: 3 per-salon queries per nightly run instead of set-based aggregates**  
`cron-inefficiency` · `app/api/admin/solen-score/recalculate/route.ts:75` · effort **M** · risk **safe**  
- Impact: Unbounded active-salons fetch, then 2 booking head-counts + 1 profile lookup per salon (chunked 20-wide). 15,000 extra round trips at 5,000 salons, risking cron timeout and platform-wide stale scores. (Merges dash-02 + npo-10.)
- Fix: One GROUP BY aggregate keyed by salon_id for the counts; one batched .in() for owner profiles.

**60. Badge auto-assign: fully serial per-salon existence check + insert inside a cron**  
`n+1` · `app/api/admin/badges/auto-assign/route.ts:52` · effort **S** · risk **safe**  
- Impact: Plain for-loop, 2 serial round trips per qualifying salon, O(badges x salons) multiplicative growth turning a sub-second cron into minutes at scale. (Merges dash-03 + npo-11 + UQ-5.)
- Fix: One set-based INSERT ... SELECT ... ON CONFLICT DO NOTHING over the whole qualifying set.

**61. dashboard/disputes pre-fetches ALL of a salon's bookings ever to enrich a handful of disputes**  
`unbounded-query` · `app/api/dashboard/disputes/route.ts:69` · effort **M** · risk **safe**  
- Impact: Join direction is backwards: the disputes query is correctly paginated but the booking lookup map is built from an unbounded all-time, all-status scan (3 disputes exist platform-wide today).
- Fix: Query disputes first, collect booking_ids, fetch only those via .in('id', ids).

**62. Discovery boards endpoint fires one trigram-search RPC per board just to derive cover thumbnails**  
`n+1` · `app/api/discovery/boards/route.ts:30` · effort **M** · risk **safe**  
- Impact: Promise.all over every board each running search_discovery (a fuzzy search, not a cheap select) for 3-4 thumbnails, feeding the Inspo mount; cost multiplies with editorial board catalogue growth.
- Fix: Precompute/cache cover thumbnails per board on a schedule, or batch all board style_names into one call.

**63. Barber reminders card issues 2 queries per unique customer instead of batching**  
`n+1` · `app/api/dashboard/barber-reminders/route.ts:60` · effort **S** · risk **safe**  
- Impact: Parallelized but per-customer: an active barbershop with dozens of reminder-due customers fires 40-100+ concurrent queries per dashboard card load; sibling dashboard/clients already shows the batched pattern.
- Fix: Batch both lookups with .in(customerIds) and group in memory, matching dashboard/clients.

**64. Thumb proxy has no in-flight request coalescing: concurrent viewers of an uncached item each redo oEmbed + CDN fetch + Storage upload**  
`hot-path` · `app/api/discovery/thumb/[id]/route.ts:66` · effort **S** · risk **safe**  
- Impact: 433 of 934 items are Storage-cached, so ~501 items still hit the full cold path per next view; no per-id lock or shared Promise map exists, and the in-memory Maps are per-instance by the file's own admission. Bites on the first concurrent-viewer burst once media-4 is fixed.
- Fix: In-process Map<string, Promise> de-dupe keyed by id; stronger: pre-warm Storage during import/backfill.

**65. /api/categories serves the static 67-row taxonomy force-dynamic on every SEO landing-page mount**  
`no-cache` · `app/api/categories/route.ts:6` · effort **S** · risk **safe**  
- Impact: Live curl confirms no-cache in prod; CategoryTree fetches it on every mount of behandlungen pages, so cost scales directly with the organic traffic those pages exist to attract, for an admin-edited lookup table.
- Fix: unstable_cache with 5-10 min TTL or revalidateTag fired on service_categories edits; clean candidate (no cookies dependency).

**66. Every existing cache is a bare module-level variable: not shared across instances, not surviving cold starts**  
`no-cache` · `lib/search/filter-availability.ts:39` · effort **M** · risk **safe**  
- Impact: Zero unstable_cache in the repo; cities and filter-availability TTL caches are per-instance variables that silently degrade as concurrency rises, while Netlify's durable cache layer (proven working for metrics/global) sits unused.
- Fix: Migrate the two TTL caches to unstable_cache + revalidateTag backed by the durable runtime cache.

**67. service_bundles/_items: 2 permissive SELECT policies each, uncorrelated IN-subquery re-derives the full active-salon set twice per PDP bundles read**  
`rls-perf` · `supabase/migrations/20260703090001_service_bundles_a5.sql:34` · effort **S** · risk **safe**  
- Impact: Live EXPLAIN as anon confirms two near-duplicate 3-level nested subplans (590 planning buffers for a 2-row table); 12 of the advisor's 13 multiple_permissive_policies rows are these two tables. O(active-salon-count) per request vs the O(1) correlated-EXISTS pattern the rest of the schema uses, on a confirmed PDP hot path.
- Fix: One SELECT policy per table using a correlated EXISTS keyed to the row's salon_id; restrict owner_manage to INSERT/UPDATE/DELETE. One additive migration.

**68. /api/recommendations(+/chips) are dead-UI routes paying real Gemini + DB cost per unauthenticated hit**  
`hot-path` · `app/api/recommendations/route.ts:191` · effort **S** · risk **safe**  
- Impact: Zero frontend callers (Inspo uses chip-terms instead); session optional, gated only by the same discovery flag as the live feed, so any bot/scraper hit up to the generic rate ceiling triggers a real Gemini 2.0 Flash call for a feature with no product surface, indefinitely.
- Fix: Wire into UI, gate behind a dedicated short-circuiting flag, or remove + log in _design-system/REMOVED.md.


### LOW

**69. open_now candidate fetch ignores the category/city predicates already resolved in the same request**  
`unbounded-query` · `app/api/salons/route.ts:342` · effort **M** · risk **safe**  
- Impact: A narrow city+category+open_now request still pulls id+opening_hours for every active salon nationwide before JS-filtering, decoupling fetch size from result size as salon count grows.
- Fix: Build openNowTask off a query that also applies category and city_id once cityOutcome resolves.

**70. 'Upcoming' bookings tab lacks the .range() cap and composite index its sibling tabs have**  
`unbounded-query` · `app/api/bookings/user/route.ts:68` · effort **S** · risk **safe**  
- Impact: Real consistency gap, not organic growth: confirmed+future membership is self-limiting and creation is rate-capped at 5/hr, so this is defense-in-depth, not a live scaling risk.
- Fix: Add the same PAGE_SIZE .range() and a bookings(user_id,status,starts_at) composite for parity.

**71. createAdminSupabaseClient() rebuilt per call at 307 sites despite zero per-request state**  
`connection-churn` · `lib/supabase.ts:70` · effort **S** · risk **safe**  
- Impact: Stateless (no-op cookie handlers, no session persistence) yet reconstructed per call; the browser client 15 lines below already uses the singleton pattern. Modest allocation/CPU cost scaling with request volume, 49 sites on edge where headroom is tight.
- Fix: Module-scope singleton with a let-guard, mirroring createBrowserSupabaseClient().

**72. Dashboard routes use networked auth.getUser() against the codebase's own documented fast path, then 2 more serial reads**  
`serial-await` · `app/api/dashboard/barber-leaderboard/route.ts:14` · effort **S** · risk **safe**  
- Impact: lib/supabase.ts explicitly documents getSessionUser() to avoid this network call; 6 call sites remain, and barber-leaderboard adds 2 independent serially-awaited checks before real work, on a polled dashboard route.
- Fix: Switch to getSessionUser(); Promise.all the owner-check + role-check.

**73. lat/lng nearby resolution excluded from the filters Promise.all: one avoidable sequential round trip per map view**  
`serial-await` · `app/api/salons/route.ts:423` · effort **S** · risk **safe**  
- Impact: Same independent-id-resolver shape as the 7 batched tasks but awaited after them; fixed +1 round trip per map request, does not compound with growth.
- Fix: Move get_nearby_salon_ids into the Promise.all alongside the other tasks.

**74. City lookup in /api/salons bypasses the cached getActiveCities() helper**  
`no-cache` · `app/api/salons/route.ts:238` · effort **S** · risk **safe**  
- Impact: Inline fresh cities query on every city-filtered search despite a working 5-min TTL helper one import away; scales with request volume (edge-runtime caveat on how much the module cache helps).
- Fix: Import getActiveCities(); verify the cache behaves under edge runtime.

**75. PDP reviews ordering has no composite (salon_id, created_at) index for future large per-salon volumes**  
`missing-index` · `lib/salon-detail.ts:96` · effort **S** · risk **safe**  
- Impact: Only single-column idx_reviews_salon_id exists; busiest salon has 25 reviews so trivial today, legitimate at the 2,000+ review scale.
- Fix: Composite (salon_id, is_hidden, created_at desc) when any salon's reviews reach thousands; not urgent.

**76. quartier-counts + quartier-featured: full active-salon scan, JS aggregation, no cache headers (counts route currently has zero callers)**  
`no-cache` · `app/api/salons/quartier-counts/route.ts:13` · effort **S** · risk **safe**  
- Impact: Unbounded scan + client-side GROUP BY, no Cache-Control, vs the sibling s-maxage=300 pattern; quartier-counts is dead code today (grep: no callers). (Merges pdp-05 + npo-16.)
- Fix: SQL GROUP BY + the s-maxage=300 pattern before/when these get wired; delete the uncalled route otherwise.

**77. lib/discovery-algorithm.ts is dead code; the 9-call Inspo mount fan-out was already fixed on this branch**  
`dead-code` · `lib/discovery-algorithm.ts:50` · effort **S** · risk **safe**  
- Impact: Live check: the Inspo mount now makes 5 calls (commit b437fee68 added category-meta); discovery-algorithm has zero import sites. Informational; SWEEP_BACKLOG.md:13 is stale.
- Fix: Delete with a REMOVED.md entry (or deliberately wire it up); update the stale backlog line.

**78. staff_members has no trigram/GIN coverage for the suggest RPC's name/specialties match, unlike services and salons**  
`missing-index` · `app/api/search/suggest/route.ts:37` · effort **S** · risk **safe**  
- Impact: The stf CTE filters via unindexed ILIKE/word_similarity/unnest while svc and sal hit their trgm indexes; per-row filter cost grows on both sides of the join as staff scales with salons.
- Fix: GIN trigram on lower(f_unaccent(name)) + GIN on specialties, mirroring idx_salons_name_trgm.

**79. credit_redemptions.booking_id FK has no covering index (Supabase Advisor unindexed_foreign_keys)**  
`missing-index` · `supabase/migrations:1` · effort **S** · risk **safe**  
- Impact: Only the pkey and composite UNIQUE(credit_id, booking_id) exist; scales linearly with redemption volume, surfacing first in admin/reporting joins.
- Fix: CREATE INDEX idx_credit_redemptions_booking_id ON credit_redemptions(booking_id).

**80. Cancel route's waitlist-notify loop: 3 serial calls per entry (auth lookup, email, update), bounded to 3**  
`n+1` · `app/api/bookings/[id]/cancel/route.ts:238` · effort **S** · risk **safe**  
- Impact: Hard-capped at limit(3) so ~9 serial round trips worst case today; the block below it already uses Promise.allSettled correctly. Bites only if the cap is raised. (Merges BWP-7 + notif-5.)
- Fix: Promise.allSettled the loop and bulk the email lookup, pre-empting a cap raise.

**81. Group booking route runs a dead salon-existence query whose result is never used**  
`n+1` · `app/api/bookings/group/route.ts:30` · effort **S** · risk **safe**  
- Impact: One unconditional useless round trip per group-booking POST; the predicate doesn't even check the right thing and the result is never branched on despite the 'Verify salon exists' comment.
- Fix: Remove it, or fix to .eq('id', body.salon_id) with a real 404 branch.

**82. release-payments due-booking query is a full-table Seq Scan growing with total bookings forever**  
`missing-index` · `app/api/cron/release-payments/route.ts:21` · effort **S** · risk **safe**  
- Impact: Live EXPLAIN: Seq Scan, 956 rows removed; no index covers payment_status/completed_at. Unlike its siblings this scan is proportional to total (never-purged) bookings, every 6h indefinitely.
- Fix: Partial index (completed_at) WHERE status='completed' AND payment_status='deposit_held'; additive only.

**83. Missing partial indexes for discovery_items predicates used by the deadcheck and ai-backfill crons**  
`missing-index` · `app/api/cron/discovery-deadcheck/route.ts:25` · effort **S** · risk **safe**  
- Impact: Both crons pay a full Seq Scan per invocation on the largest content table; trivial at 934 rows, linear growth thereafter.
- Fix: Partial indexes on (created_at) WHERE is_active AND status='published' AND tiktok_url IS NOT NULL, and the description_en IS NULL variant.

**84. Two independent workflow jobs share the identical */30 cron schedule with no stagger**  
`cron-inefficiency` · `.github/workflows/cron-jobs.yml:10` · effort **S** · risk **safe**  
- Impact: sms-reminders and discovery-ai-backfill (both independently heavy per findings above) fire on the same tick, competing for the same Netlify concurrency and Supabase connection pool twice an hour.
- Fix: Offset the AI-backfill job to 5,35 * * * *.

**85. GET /api/loyalty scans all active loyalty cards platform-wide, but the route has zero live UI callers**  
`unbounded-query` · `app/api/loyalty/route.ts:17` · effort **S** · risk **safe**  
- Impact: No salon/user scoping (correct scoping only client-side), but repo-wide search finds no frontend consumer and the route requires auth; dormant-code cleanup, not an active risk. (Merges npo-04 + RP-2.)
- Fix: If ever wired to UI: fetch the user's loyalty_stamps first, then .in() only those cards.

**86. admin/segments computes member counts with a fully serial per-segment query loop**  
`n+1` · `app/api/admin/segments/route.ts:20` · effort **S** · risk **safe**  
- Impact: One head-count query per segment, no parallelism; bounded by admin-defined segment count (5 today) so inherently small. (Merges npo-08 + UQ-8.)
- Fix: One GROUP BY segment_id count over customer_segment_members.

**87. PDP nearby-carousel fetches min service price per salon in a bounded (4x) but avoidable N+1**  
`n+1` · `app/api/salons/[slug]/nearby/route.ts:52` · effort **S** · risk **safe**  
- Impact: Hard-capped at 4 so cannot grow, but 5 queries where 1 suffices on a high-traffic customer page.
- Fix: One min(price) GROUP BY salon_id query over the 4 ids.

**88. Discovery collections list does 1-2 queries per saved collection**  
`n+1` · `app/api/discovery/collections/route.ts:37` · effort **S** · risk **safe**  
- Impact: Bounded by a single user's own collection count (max 2 in practice); avoidable fan-out on the saved-boards page, not platform-wide growth.
- Fix: Batch discovery_saves across collections, then one .in() lookup for all cover ids.

**89. Dashboard today-card awaits 3 independent queries serially on a polled edge route**  
`serial-await` · `app/api/dashboard/today/route.ts:74` · effort **S** · risk **safe**  
- Impact: Bookings, walk-in count, and inbox-unread are independent yet sequential; extra round trips of latency per poll across every active owner session. Already acknowledged in the file's own header as known debt. (Merges npo-14 + dash-10.)
- Fix: Promise.all once salon.id is known, matching dashboard/batch:87.

**90. staff/route.ts pulls every future booking for a salon to compute per-staff counts**  
`unbounded-query` · `app/api/staff/route.ts:44` · effort **S** · risk **safe**  
- Impact: No limit; bounded to future bookings so slower-growing, but a salon pre-generating months of slots grows this steadily.
- Fix: One GROUP BY staff_member_id count query.

**91. discovery_comments: overlapping permissive policies, and the live policy shape has drifted from every repo migration**  
`rls-perf` · `supabase/migrations/067_discovery.sql:163` · effort **S** · risk **safe**  
- Impact: The advisor's 13th permissive-policy row; table is 0 rows so no cost today. The live policies were hand-consolidated with names appearing in zero migration files, confirming schema drift against the project's own live-snapshot rule.
- Fix: Consolidate into one SELECT policy and land a real timestamped migration mirroring the live shape.

**92. review_attributes_insert_author: the last unwrapped auth.uid() policy project-wide, re-evaluated per row on multi-row attribute inserts**  
`rls-perf` · `supabase/migrations/20260630_review_attributes.sql:25` · effort **S** · risk **safe**  
- Impact: Advisor confirms it's the sole auth_rls_initplan finding left after the 2026-06-24 sweep; per-row cost scales with attributes-per-review on the review write path. 0 rows today.
- Fix: ALTER POLICY ... WITH CHECK using (SELECT auth.uid()) as a new additive migration.

**93. voucher/credit_redemptions FKs lack standalone user_id/booking_id indexes; tables are 0-row and their redemption RPCs are unwired dead code**  
`missing-index` · `supabase/migrations/050_user_credits.sql:1` · effort **S** · risk **safe**  
- Impact: EXPLAIN confirms booking_id lookups walk a composite index instead of seeking; both RPCs (redeem_voucher/redeem_user_credits) have zero call sites and drifted out of tracked migrations. Latent/preventive only.
- Fix: Add the 4 standalone indexes now (cheap, additive); separately flag to the owner: wire up or formally retire the redemption RPCs + backfill migration history.

**94. netlify.toml's blanket /api/* no-store header is inert for Next.js route handlers**  
`no-cache` · `netlify.toml:35` · effort **S** · risk **safe**  
- Impact: Curl-proven: no API response matches the declared header string; each shows its own Next-derived cache-control. The apparent safety net does not exist, and it does not block the F1-F3 fixes.
- Fix: Set Cache-Control explicitly inside each handler (or Netlify-CDN-Cache-Control); don't rely on netlify.toml for API cache policy.

**95. salons/trending, metrics/global, and public homepage-sections have zero production consumers: their caching bugs are free to fix now**  
`no-cache` · `app/api/homepage-sections/route.ts:1` · effort **S** · risk **safe**  
- Impact: Grep confirms no call sites; homepage-sections is force-dynamic/edge for a single-row settings lookup that only changes via the admin PUT.
- Fix: Delete the unused route or fix its caching (unstable_cache + revalidateTag from the admin PUT) before it gets wired to real traffic.

**96. sendNotification() serializes the DB insert and the email send, two independent operations**  
`serial-await` · `lib/notifications.ts:66` · effort **S** · risk **safe**  
- Impact: One fixed extra round trip per call site (booking confirm/cancel, Stripe webhook branches); constant per-call, aggregates with traffic only.
- Fix: Promise.allSettled the insert and the email dispatch, logging failures independently.

**97. Booking confirm: avoidable re-select plus two independently-awaited lookups, up to 6 serial round trips per click**  
`serial-await` · `app/api/bookings/[id]/confirm/route.ts:41` · effort **S** · risk **safe**  
- Impact: Update then separate re-select of the same row, then sequential profile + auth lookups with no dependency; fixed per-call latency on an owner action, no growth component.
- Fix: .update(...).select(...) in one call; Promise.all the profile and auth lookups.

**98. No purge/archive policy for the notifications table outside the review_prompt-specific TTL**  
`unbounded-query` · `app/api/cron/review-prompt/route.ts:56` · effort **S** · risk **safe**  
- Impact: ~21 other notification types have no retention; read path is correctly capped so this is pure unbounded storage growth (5 rows today), compounding with booking volume over years.
- Fix: Generic TTL sweep (read >90d or all >12mo) in an existing daily cron, mirroring the review_prompt pattern.

**99. getLoyaltyStatus runs two independent queries serially**  
`serial-await` · `lib/loyalty/status.ts:92` · effort **S** · risk **safe**  
- Impact: No data dependency between the bookings and loyalty_status selects; doubled round-trip latency on the live /rewards page. Latency-only, index-backed.
- Fix: Promise.all the two selects.

**100. user_salon_affinity + recompute RPC: fully orphaned derived-score system (121 frozen rows, no cron, no reader, migration missing from repo)**  
`cron-inefficiency` · `supabase/migrations/20260623124500_user_style_affinity.sql:1` · effort **S** · risk **safe**  
- Impact: No scaling cost today since nothing reads/writes it, but a stale-data correctness trap if later wired into ranking without restoring its cron; also confirmed schema drift.
- Fix: Restore migration + cron + consumer, or drop and log in REMOVED.md. Owner decision.

## Quick wins (high impact, low effort, safe)

- release-deposits cron selects a nonexistent column: the 72h stale-deposit safety net has never fired
- birthday-messages cron selects a nonexistent column: permanent silent no-op, zero emails ever sent
- No GIN index on salons.categories, the single most common predicate on the busiest read path
- discovery_items has no index covering (status, is_active, category), the predicate of every feed/search/meta query
- Query embeddings never cached: every full search pays a fresh Gemini API round trip
- Rate limiting is a total, unlogged no-op when Upstash env vars are absent, on the booking/payment money paths
- 3 of 4 export-const-revalidate declarations are silent no-ops because their handlers call cookies()
- next-available lookup intermittently picks the GLOBAL (status,starts_at) index and discards other salons' rows; cost grows with tenant count
- earnings/staff has no default time floor: omitted from/to scans the salon's entire booking history
- Benchmarks endpoint runs a strictly serial booking-count query per active salon platform-wide
- loyalty-recompute RPC full-scans the entire bookings table monthly: the 12-month window lives in the aggregate FILTER, not the WHERE
- discovery-ai-backfill's maxDuration=300 is a no-op on Netlify; the sequential 10-item Gemini loop reasons against a budget 5x larger than the real 60s cap
- get_nearby_salon_ids has no spatial index: every map-pan computes trig distance for every active salon nationwide
- service_bundles/_items: 2 permissive SELECT policies each, uncorrelated IN-subquery re-derives the full active-salon set twice per PDP bundles read

## Bigger bets (high impact, L-effort or risky)

- Slot-claim race in booking create: unguarded UPDATE, double-booking proven live
- discovery_feed_for_you rescores the entire catalog with a per-row correlated affinity subplan on every request, uncached
- Salon PDP is fully dynamic (unconditional cookies()) with zero caching on the busiest read path
- Booking create blocks the customer response on 6-12+ serial round trips including two Resend email sends; zero waitUntil in the codebase
- Reschedule is a 3-step non-transactional saga with unchecked compensating writes and the same missing status guard
- analytics/salon/[id] live-recomputes everything from raw bookings on every dashboard-home mount; the salon_analytics rollup table is decorative
- Edge runtime on 109 join-heavy/payment routes despite a single-region DB, with a known edge cookie-parsing bug degrading to anonymous auth
- Systemic: 232 of 359 API route files have no .range()/.limit() anywhere
- barber-smart-reminders: unbounded nested loop, 7 serial queries per customer, no cursor