# Backend improvement campaign , scaling, efficiency, dead code, ops health (2026-07-11)

Owner ask: "full plan for the backend, improving in every way, scaling, efficiency, unused code, and tell me what we should add." Approved plan: `~/.claude/plans/wiggly-waddling-scroll.md`.
**Owner amendment 2026-07-11 (mid-turn): "add bunch more, i want this to be like a 10h plus loop for full backend fix."** Campaign expanded to 11 execution rings (~14-16h of agent-loop work) + the Loop protocol section below. This is THE fix-everything backend loop; it runs ring by ring on the owner's go.

**Extends, does not duplicate:** security+correctness are DONE ([BACKEND_AUDIT_INDEX.md](BACKEND_AUDIT_INDEX.md) 141 findings fixed; [BACKEND_SWEEP_2026-07-10.md](BACKEND_SWEEP_2026-07-10.md) 16 rings, substantially complete). This campaign = the dimensions never covered: perf/caching, cron efficiency, dead code, monitoring/alerting, testing/CI, migrations reproducibility, backups/DR, cost.

**Law:** measure-first (28 salons live; most scale rewrites are PREMATURE, parked behind numeric triggers). Cross-cutting guard: no route deletion or response-shape change without grepping `/Users/sulo/Documents/solen-mobile` for the route path.

**Owner defaults taken (dialog dismissed, flip with one word):** dead code = DEEP clean; monitoring = email-alerts-first (Sentry retry parked); kickoff = Ring 0 now.

---

## Readback mapping (owner's original asks -> where each lives in this plan)
- [x] Full backend improvement PLAN covering everything , this file; `verified:` commit 16636e692
- [x] Scaling / capacity readiness , Ring 0 measured baseline (table sizes, EXPLAIN) + the DO-NOT-DO trigger table (scale rewrites parked behind numeric triggers, unparked on evidence); `verified:` Ring 0 results section + trigger table below, commit f2d99ffa4
- [x] Efficiency / performance , Rings 2 (hot-path, before-numbers attached) + 3 (cron N+1); `verified:` ring sections below, commit 16636e692
- [x] Unused code / dead weight , Ring 4 deep-clean (grep-verified inventory, one commit per category); `verified:` Ring 4 section below
- [x] "What should we add" recommendations , Checklist-additions section (webhook resilience, email-failure alerting, mobile contract, error envelope, nFADP retention, cost, DR runbook, founder digest); `verified:` section below

## Ring 0 , measurement baseline (DONE 2026-07-11)
- [x] timings measured (in-browser fetch x3 on dev :3000; sandbox curl can't reach localhost , dev-noise caveat: run 1 includes Next compile; runs 2-3 are the comparable warm numbers); `verified:` full timings table in Ring 0 results below, commit f2d99ffa4
- [x] EXPLAIN ANALYZE: next_available_date scan, availability/[salon_id] scan, dashboard/batch revenue query; `verified:` plans quoted with ms/rows/buffers in Ring 0 results (0.73 ms/1470 rows; 88 ms/957 rows; 2.7 ms), run live via read-only execute_sql this session
- [x] Live table sizes + growth snapshot; `verified:` pg_stat_user_tables output in Ring 0 results (availability_slots 164,063 / 76 MB)
- [x] Response-header audit of the 3 `revalidate` routes; `verified:` all 3 returned cache-control=null on dev (recorded in results) , INCONCLUSIVE for ISR by nature of dev mode, re-check on the live site queued in Ring 2
- [x] generate-slots baseline: static analysis only; `verified:` shape paragraph in Ring 0 results (4-level nesting, per-slot SELECT+INSERT, O(n²) passes , from reading app/api/cron/generate-slots/route.ts); live trigger deliberately skipped (it WRITES slots to the live DB); wall-time comes from Ring 3 instrumentation
- [x] OWNER ASK recorded (Netlify env presence); `verified:` "Open owner asks" boxes below
- [x] OWNER ASK recorded (Netlify runtime for edge routes); `verified:` "Open owner asks" boxes below

### Ring 0 results (measured 2026-07-11, dev server, live Supabase DB)
**Timings (ms, 3 runs, warm = runs 2-3):**
| endpoint | runs | payload |
|---|---|---|
| /api/health | 409 / 119 / 11 | 49 B |
| /api/salons (no filters) | 1054 / 229 / 98 | 22.7 KB |
| /api/salons?category+city | 208 / 219 / 205 | 9.2 KB |
| /api/salons?category+city&with_slots=1 | 514 / 332 / 306 | 14.0 KB |
| /api/discovery/feed?category=all&limit=20 | 317 / 255 / 240 | 59.1 KB |
| /api/salons/pink-petal-nails (PDP) | 702 / 324 / 246 | 11.9 KB |
| /api/availability/[salon_id] (busiest salon) | 473 / 289 / 192 | **458 KB (!)** |
| /api/dashboard/today (dev-login owner) | 1437 / 1041 / **896 warm** | 112 B |
| /api/dashboard/batch POST (3 keys) | 1851 / 803 / 545 | 106 B |

**EXPLAIN ANALYZE (live DB):**
- next_available_date scan (salons/route.ts:477): 0.73 ms, index-served, BUT returns **1,470 rows to keep 6** (earliest per salon). NOT a perf problem , a CORRECTNESS risk: PostgREST caps at 1000 rows, so with more unavailable salons later salons' next-date silently drops. Reclassified: fix = MIN()/DISTINCT ON RPC, correctness-motivated.
- availability 14-day scan: 88 ms first-run, 957 rows, index scan , healthy. The previously-claimed "second full-range scan" is **ALREADY FIXED** (single all-status scan, route.ts:19 comment). Real cost = the 458 KB payload (repeats joined service/staff names on every slot row) , new Ring 2 item.
- dashboard/batch revenue query: 2.7 ms, index-served, 956 total bookings. SUM-RPC fix = hygiene, deprioritized.

**Table sizes (live):** availability_slots 164,063 rows / 76 MB (the ONLY real table); discovery_items 1,071 / 14 MB; bookings 956; everything else < 500 rows. Confirms the DO-NOT-DO trigger table.

**Header audit:** all 3 revalidate routes return no cache-control in dev , dev doesn't exercise ISR, so INCONCLUSIVE here; the code-level finding stands (salons/trending + analytics/platform use the cookie-reading client => revalidate defeated; metrics/global uses admin client => works). Needs a prod-response check (deploy preview or owner curl) in Ring 2.

**generate-slots static shape (Ring 3 input):** 4-level nesting (salon -> staff -> day -> slot) with an awaited SELECT + awaited INSERT per slot, then 2 per-salon passes with O(n²) JS overlap scans + per-blocked-slot awaited UPDATEs. At ~20 active salons x staff x ~26 days x ~16 slots/day the nightly run issues on the order of tens of thousands of sequential awaits. Instrument first, carve out the O(n²) scan; SQL rewrite stays parked.

**Biggest user-visible targets (warm numbers):** dashboard/today ~900 ms (4 serial round-trips), dashboard/batch ~550-800 ms, availability payload 458 KB, PDP ~250 ms, salons+with_slots ~300 ms.

### Open owner asks (Ring 0) , BLOCKED on a concrete dependency: the owner's Netlify dashboard (account/credential surface, owner-only; unreachable from this sandbox)
- [ ] OWNER: Netlify prod env presence check (Site settings -> Environment variables, or `netlify env:list`)
  - [ ] UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN present? (if missing, EVERY rate limit is silently OFF in prod today , lib/ratelimit.ts fails open)
  - [ ] CRON_SECRET present?
  - [ ] STRIPE_WEBHOOK_SECRET present?
  - [ ] RESEND_API_KEY + ADMIN_EMAIL present?
  - [ ] answers recorded back into this file
- [ ] OWNER: which runtime Netlify actually gives routes declaring `runtime="edge"` (Netlify functions tab / build log) , decides the Ring 2 Stripe-on-edge item

---

## Ring 1 , fail-closed guardrails + alerting spine (DONE 2026-07-11: commits bf37a7da3 + 7f057ede3 + 0deceb213; kill-tests 6/6 + live-DB PASS + 7/7; digest email lands at the first real 05:15 UTC run once live)
- [x] lib/env.ts prod-required assertion; `verified:` commit bf37a7da3, /refine PASS round 2
  - [x] assert UPSTASH_*, CRON_SECRET, Stripe keys + webhook secret, RESEND_API_KEY, ADMIN_EMAIL when Netlify CONTEXT=production; `verified:` assertProdRequiredEnv lib/env.ts:215-246, wired via instrumentation.ts register()
  - [x] preview/branch builds unaffected; `verified:` gate = CONTEXT AND NODE_ENV both 'production'; dev-context kill-test scenario no-ops
- [x] lib/ratelimit.ts fail-mode split; `verified:` commit bf37a7da3, /refine PASS round 2 (round 1 caught 2 missing abuse-prone limiters: referralValidateLimiter + resendAccessLimiter, both added)
  - [x] classify limiters: 7 abuse-prone (auth, payment, booking, guest-lookup, referral-validate, resend-access, referral-complete) fail CLOSED when Redis unconfigured in prod; `verified:` ABUSE_PRONE_LIMITERS set, lib/ratelimit.ts:114-122
  - [x] all other limiters fail-open + alertAdmin once per process; `verified:` lib/ratelimit.ts:125-146
  - [x] kill-test; `verified:` scripts/ring1-kill-tests.mjs 6/6 (prod-unset-auth blocked, prod-unset-general allowed, dev-unset allowed, prod-set passthrough, referral-validate + resend-access blocked), reviewer re-ran independently
- [x] cron failure alerting (RING 1b); `verified:` lib/cron-run.ts withCronRun wraps all 23 non-deprecated app/api/cron/* routes (reminders/route.ts left untouched, 410 deprecated no-op)
  - [x] every app/api/cron/* returns structured {ok, processed, errors}; `verified:` lib/cron-run.ts:32-90 merges the handler result with computed ok/processed/errors; every route under app/api/cron/ (23 files) wrapped, auth/CRON_SECRET guard kept OUTSIDE the wrapper, existing response fields preserved
  - [x] .github/actions/ping-cron asserts HTTP 2xx AND ok:true, hard-fails the job (GitHub then emails the owner for free); `verified:` .github/actions/ping-cron/action.yml hard asserts (jq -e '.ok == true', grep fallback if jq missing), exit 1 on any failing endpoint (was soft-fail exit 0)
  - [x] kill-test: one cron pointed at a forced 500 on a branch run = red workflow + email received; `verified:` scripts/ring1b-kill-test.ts 2/2 (handler succeeds -> ok:true/200 + cron_runs row; handler throws -> ok:false/500 + cron_runs row with the error message), plus the action's assert logic simulated locally against a canned ok:false body -> exits 1. DEVIATION: sandbox blocks outbound localhost connections (curl to :3000 = "Operation not permitted"), so this exercises the real withCronRun/action-assert logic directly rather than an actual GitHub Actions branch run or a live curl; no literal CI run was triggered (coder does not push)
- [x] lib/error-report.ts: reportError() -> throttled alertAdmin email; wired into top-level catch of money/cron/webhook routes; remove the 3 placeholder Sentry config files (Sentry retry = parked owner option); `verified:` cron (lib/cron-run.ts:62) + webhook (app/api/stripe/webhook/route.ts:775) wired first round; money routes wired on reviewer punch list (app/api/bookings/[id]/refund/route.ts:83, app/api/bookings/[id]/dispute/route.ts:341, app/api/salon/retail/[id]/refund/route.ts:81, app/api/admin/purchase-refund/route.ts:103); sentry.edge.config.ts / sentry.server.config.ts / instrumentation-client.ts deleted, zero remaining imports (grep-confirmed), next.config.mjs has no reference
- [x] /api/health dependency probe: DB SELECT 1 + Redis ping + env-completeness, 200/503 with per-dep JSON; kill-test: broken DB creds locally = 503 (uptime-monitor signup = owner-gated memo); `verified:` app/api/health/route.ts (nodejs runtime) delegates to lib/health.ts (probeDb/probeRedis/probeEnv/runHealthProbes); scripts/ring1c-kill-test.ts 7/7 PASS (throttle x3, probeDb broken-host fail, runHealthProbes ok:false/503-equivalent, probeRedis unconfigured, probeEnv ok outside real prod boot)
- [x] founder daily digest email: yesterday's bookings, cron statuses, error count (Resend, reuse lib/alert-admin.ts plumbing); kill-test: digest received on dev trigger; `verified:` app/api/cron/daily-digest/route.ts (CRON_SECRET-gated, node runtime, withCronRun-wrapped), composes yesterday's Europe/Zurich window (bookings created + completed counts), cron_runs failures in the last 24h, pending reviews (salon_response is null); all 4 queries live-tested against the DB with no phantom-column errors. DEVIATION: ADMIN_EMAIL is unset in this worktree's .env.local, so the actual send could not be triggered/confirmed end-to-end in dev; the route fails open on that case (skipped:true, reason:no_admin_email, ok:true) rather than fabricating a sent email

## Ring 2 , hot-path request cost (QUEUED; est ~2h)
- [x] feature-flag caching (lib/feature-flags.ts); `verified:` commit 0ae066cf1, /refine PASS round 1
  - [x] TTL cache 30s for flags, maintenance+key collapsed to ONE .in() query (2 round-trips -> 1 uncached / 0 cached)
  - [x] ban checks: 10s TTL keyed by userId, error path never cached (fail-closed 503 preserved), window commented
  - [x] discriminate proof; `verified:` scripts/ring2a-kill-test.ts 7/7 vs live DB (query-COUNT assertions, TTL flip honored via temp flag row, cleaned up), reviewer re-ran independently
  - [ ] follow-up (reviewer): banCache has no max-size eviction (slow leak on long-lived instances) , add LRU cap when next touching the file; also re-measure the stale "116 call sites" comment (live grep ~139)
- [x] fix 2 dead revalidate exports (salons/trending, analytics/platform); `verified:` commit d334fe9e6, /refine PASS r1, admin client (metrics/global precedent), kill-test 6/6 live, behavior delta named. ISR effect itself needs a live-site header check post-`sync`
- [ ] CDN caching headers, s-maxage+SWR, anon variants only, NO Redis layer
  - [ ] FIRST resolve the netlify.toml conflict (found Ring 0-adjacent, 2026-07-11): `[[headers]] for="/api/*"` forces Cache-Control no-store; confirm precedence vs function-set headers on Netlify (function headers usually win, but prove it) and carve out the cacheable routes from that blanket rule if needed
  - [ ] /api/salons
  - [ ] /api/discovery/feed
  - [ ] /api/salons/[slug]
- [x] next_available_date -> MIN()/DISTINCT ON RPC (reclassified by Ring 0: correctness fix , 1,470 rows fetched to keep 6, silent drop past the PostgREST 1000-row cap; query itself is 0.73 ms); `built:` app/api/salons/route.ts:476-498 now calls the live `next_available_dates` RPC instead of the unbounded per-slot fetch; convention change to Zurich-bucketed dates (was raw UTC slice) , intentional, matches unavailable-dates/time-slots; `verified:` scripts/ring2b-kill-test.ts (RPC <=1 row/salon + matches manual MIN(starts_at) per salon, live DB, 6 busiest salons), coder round 1, pending reviewer
- [x] dashboard/today 4 serial awaits -> 2 Promise.all stages; `verified:` commit 0ae066cf1; before ~900 ms warm -> after ~300-320 ms warm (measured in-browser 2026-07-11 post-change, fresh server boot); response shape byte-identical per reviewer diff read. NOTE: a post-change 500 on discovery/feed was diagnosed as dev-server hot-reload staleness from the deleted instrumentation-client.ts (fresh boot = 200, 271-331 ms warm, baseline unchanged) , not a code regression
- [ ] dashboard/batch revenue -> DB SUM RPC , DEPRIORITIZED to hygiene (Ring 0: query is 2.7 ms at 956 bookings); do opportunistically when next touching dashboard/batch, not loop-blocking
- [x] bookings-list select("*") -> explicit columns (dashboard list + recurring); `verified:` commit 63b0be639, consumer field-union grep-proven (web+mobile), kill-test 8/8. Follow-up logged: the customer 'my bookings' branch (bookings/route.ts:90) still selects * , same-user data, payload-only, queued in Ring 10 hygiene
- [x] NEW (Ring 0 discovery): availability/[salon_id] payload trim , 458 KB per date-picker load (repeats joined service/staff fields on all 957 slot rows); dedupe joins into a lookup map or slim the per-slot shape. Before-number: 458,447 B; `built:` app/api/availability/[salon_id]/route.ts , slot select dropped the services(...)/staff_members(...) embeds, salon's services+staff fetched once each, returned as top-level `services`/`staff` lookup maps; zero web or solen-mobile consumers found (grep-exhaustive), so no consumer shape update was needed; `verified:` scripts/ring2b-kill-test.ts measures the new shape for the Ring 0 baseline salon (08760993-...): 262,225 B vs 458,447 B baseline (-42.8%), coder round 1, pending reviewer
- [x] availability/[salon_id] second scan , ALREADY FIXED (verified Ring 0: single all-status scan, route.ts:19), no work
- [x] discovery/feed payload check; `verified:` commit 63b0be639 , tiktok_embed_html blob dropped at all 3 mapping sites (grid consumer only truthy-checks it, proven no isVideo flip on live data; detail page uses its own select)
- [x] reviews sub-page load correction (SWEEP_BACKLOG leftover, CORRECTED round 2): app/[locale]/salon/[slug]/reviews/page.tsx was NOT unbounded , commit bfa385699 (2026-06-30) already bounded it to .limit(50) + 3 joins. This ring narrows .limit(50) -> .range(0,19) (20 rows) + paginate via the existing /api/reviews/salon/[salon_id] endpoint; `built:` page.tsx narrowed to .range(0,19); components-legacy/salon/SalonReviews.tsx "Mehr laden" now fetches further pages from /api/reviews/salon/[salon_id] (page/sort params) once the already-loaded set is exhausted, appends into local state; known trade-off , that endpoint doesn't select review_photos, so photos only render on the first (server) page, coder round 2, pending reviewer
- [x] walk-in availability call fired on every search page regardless of relevance (SWEEP_BACKLOG leftover, SearchTemplate -> /api/walkin/availability) -> gate on the page payload's walkin_enabled; `built:` walkin_enabled already in SALON_PUBLIC_COLS; SearchTemplate.tsx salonIdsKey now requires `walkIn && salons.some(s => s.walkin_enabled)` (was `walkIn` alone) , direct payload check, kept the walkIn requirement too so no unapproved visual change (badges staying gated to walk-in mode), coder round 1, pending reviewer
- [x] REUSE win: with_slots swapped onto the existing earliest_slots_by_service RPC; `verified:` commit 63b0be639, output byte-identical on 77 services (kill-test) + reviewer's own anon-client parity check. Follow-up logged: RPC is now a single point of failure for all services' slots on the error path (was per-service isolation) , acceptable, noted
- [ ] Stripe-on-edge resolved per Ring 0 Netlify-runtime finding (owner ask open)
- [x] Close: dashboard/today ~900 -> ~300ms warm, availability 458KB -> 261KB, flags 2 queries -> 1/0 (all measured); solen-mobile grepped on every shape change (availability, bookings, next-date). Remaining Ring 2 items are owner-blocked (CDN headers need the Netlify runtime answer; SUM RPC deprioritized with reason)

## Ring 3 , cron efficiency (QUEUED; est ~2h)
- [x] instrument all crons: DONE as a Ring 1b byproduct , withCronRun logs duration_ms + processed + ok + errors to cron_runs for every run of all 23 wrapped crons; `verified:` commit 7f057ede3, live cron_runs rows shown in the 1b kill-test (query-count logging per cron deliberately not added , duration + row counts suffice for the before->after gates)
- [x] process-deletions batched: IN-list deletes, Promise.all where order-independent, FK order preserved; `verified:` RING 3a (coder round 1, uncommitted), scripts/ring3a-kill-test.ts prints the full before/after op-equivalence table, `npx tsc --noEmit` shows zero new errors. Not run live (GDPR-critical, off-limits per the ring brief).
- [x] the ~12 per-row-loop crons batched, one commit each: .insert(rows[]) batches, IN-list selects, email concurrency cap ~5 (never unbounded parallel email); `verified:` RING 3a (coder round 1, uncommitted): welcome-series, salon-onboarding, barber-smart-reminders, birthday-messages, rebooking-nudge, review-prompt, nail-infill-reminders batched (lib/concurrency.ts pool helper, cap 5, kill-tested in scripts/ring3a-kill-test.ts). NOT executed live (money/email crons off-limits per the ring brief) , code-level + kill-test verified only, still needs a live-DB / staging pass before the "close, per rewritten cron" sub-items below can tick.
- [x] ring-1b reviewer follow-up: 6 crons (abandon-sweep, discovery-deadcheck, rebooking-nudge, release-deposits, salon-onboarding, sms-reminders) report a numeric per-item error COUNT that withCronRun ignores (array-only), so per-item failures still show ok:true; when batching each of these, convert to the errors[] array shape (or set ok:false on count>0); `verified:` RING 3a (coder round 1, uncommitted), all 6 now build `errors: string[]` (capped at 20 + "...and N more") instead of a count, so a real per-item failure flips ok:false via withCronRun.
- [x] ring-1b reviewer follow-up (low): review-prompt + sms-reminders no-api-key early-return sits before withCronRun, so that skip path never logs to cron_runs; fold it inside the wrapper when touching these files; `verified:` RING 3a (coder round 1, uncommitted), both early returns moved inside the withCronRun handler (still return before any DB/API work, now as a handler result so the skip lands a cron_runs row).
- [ ] email failure handling sweep (checklist addition): every sendEmail call site logs failure with context; money-path sends alertAdmin on failure , PARTIAL this ring: every sendEmail call site inside app/api/cron/* now catches per-recipient and records into errors[] (RING 3a). The broader box (non-cron sendEmail call sites app-wide, plus alertAdmin on money-path failure) is OUT OF SCOPE for this ring (task brief restricted edits to the named cron route files only) and needs its own pass.
- [x] generate-slots carve-out (SQL rewrite stays PARKED, owner-gated, trigger >=150 salons or runtime threshold); `verified:` commit 696ba6f0d, /refine PASS r1
  - [x] per-stage timing + counts in the route response (duration already in cron_runs via withCronRun)
  - [x] O(n²) overlap scans -> O(n log n) sort+sweep (lib/slots/overlap.ts); old logic verbatim in scripts/ring3b-kill-test.ts, identical blocked-sets on 5 crafted + 20x200 seeded sets; UPDATE payloads byte-identical
- [x] availability_slots purge memo (dry-run done, owner decision box below + OPS_RUNBOOK.md item 3)
  - [x] dry-run SELECT count of dead rows; `verified:` live SQL 2026-07-11: 156,296 PAST status='available' rows + 826 past booked, of 164,063 total (95% of the table is dead history; live future inventory = only 6,941 rows / few MB)
  - [ ] OWNER DECISION: purge past status='available' rows only (never booked ones , bookings reference their slots; keep booked history). EXISTS-CHECK WIN (2026-07-11): the RPC `purge_past_available_slots(p_days, p_limit)` ALREADY EXISTS live but is scheduled by NOTHING (pg_cron has only search-popularity-refresh + search-events-retention; no code caller). So the decision is only: schedule the existing RPC (weekly pg_cron or a GH-cron route) , yes/no. No new SQL needed. DELETE on prod = owner-only.
- [ ] close, per rewritten cron (SOAK GATE , ticks after the next nightly cycles run live)
  - [ ] before->after wall time from cron_runs rows (needs >=1 nightly run of the batched crons)
  - [x] equivalence at build time: op-table (process-deletions) + verbatim-old-logic diffs (overlap) + preserved sent-once guards, reviewer-verified per ring
  - [ ] one clean nightly soak (check cron_runs ok=true across the board after the next scheduled runs)

## Ring 4 , dead-code demolition (QUEUED; deep clean; parallelizable with 2-3; git-reversible)
One commit per category, caller-grep evidence (app/ + components-legacy/ + solen-mobile) in the message:
- [x] src/ retired Vite tree + sole dependent /api/salons/last-minute , deleted via `git rm -r` (56 src/ files + route.ts + vite.config.ts/js), `build:vite` script line removed from package.json, graveyarded in REMOVED.md; caller-grep evidence: zero hits for `salons/last-minute` or `from .../src/` in app/, components/, components-legacy/, hooks/, lib/, middleware.ts, next.config.mjs, or solen-mobile/; tsc baseline 7 errors before, unrelated-to-this-change afterward (see coder notes 2026-07-11)
- [x] orphaned routes: 10 of 11 DELETED; `verified:` commits 9623c6da1 (salons/last-minute) + 89ee34e64 (9 more), per-item re-grep incl. solen-mobile, graveyard lines added. CORRECTION: nail-inspo/boards SKIPPED , it is LIVE via components-legacy/nail/NailBookingSteps.tsx (inventory was wrong); re-check NailBookingSteps liveness in Ring 10 before re-proposing. RING 10 RE-CHECK: the ring-4a claim was wrong then too, not just stale , NailBookingSteps.tsx has ZERO importers anywhere (confirmed by fresh grep, the two code hits for its name are comments, not imports); deleted this ring + REMOVED.md line added. `/api/nail-inspo/boards` itself was left untouched (API routes out of Ring 10's touch list) but is now a strong dead-route candidate for the next API sweep, noted in _plans/LEGACY_CENSUS.md
- [x] 10 orphan lib files deleted; `verified:` commit 89ee34e64, zero-importer greps quoted in the ring log
- [x] 10 unused npm deps removed (the 7 + vite + @vitejs/plugin-react-swc + @supabase/auth-helpers-nextjs), package.json + lock via --package-lock-only (shared node_modules untouched); `verified:` commit 71d1c2522, per-dep zero-reference greps
- [x] 7 supabase/functions SOURCE dirs deleted; `verified:` commit 71d1c2522 + REMOVED.md line (deployed-artifact deletion stays the owner memo in Ring 6)
- [x] components-legacy leaves: 5 of 7 deleted (ChatWindow, AISuggestion, QuickReplyChips, BookingBubble, PhotoGallery); `verified:` commit 89ee34e64. CORRECTION: ClientTags.tsx (live import in dashboard/bookings page) + nail/InspoBoard.tsx (live via NailBookingSteps) SKIPPED , inventory corrected
- [x] full census manifest generated: [_plans/LEGACY_CENSUS.md](LEGACY_CENSUS.md) , 267 files: 116 LIVE / 78 DEAD / 73 LEAF-CHECK; `verified:` commit 71d1c2522, deterministic re-run byte-identical. The 78 DEAD deletions = Ring 10 follow-through
- [x] stale one-off scripts: 6 deleted (send-outreach-emails, seed-coiffeur-rails, enrich-coiffeur-demo, collect-basel-salons, backfill-discovery-thumbs, backfill-embeddings); `verified:` commit 89ee34e64. audit-i18n.js + generate-icons.js deliberately KEPT (generic utilities the owner may run by hand)
- [x] REMOVED.md graveyard lines per deleted feature surface; `verified:` 6 lines in 89ee34e64 + 2 in 9623c6da1 + 1 in 71d1c2522
- [x] ring-4c reviewer follow-up: tsconfig.node.json + tsconfig.app.json are dead Vite leftovers (unreferenced by tsconfig.json, reference the deleted vite.config) , delete in Ring 10; `verified:` re-grepped, still zero references anywhere except doc mentions and tsconfig.json's own lack of a `references` field; both `git rm`'d
- [x] 4 dead RPCs: NOT dropped, owner decision memo written in [_plans/OPS_RUNBOOK.md](OPS_RUNBOOK.md) (recommendation: build the spend path when prioritized)
- [x] Close (amended to what is provable locally): lint RUNS again + ratcheted in CI (was crashing), tsc stable at 5 pre-existing errors across all deletion rings, dev server serves all key surfaces 200 post-deletion (verified in-browser 2026-07-11), census LIVE count unchanged, deletion manifests complete. Playwright visual specs = manual gate (CI wiring memo'd in Ring 5)

## Ring 5 , test & CI floor (BUILT 2026-07-11, coder round 1, pending reviewer)
- [x] vitest setup (node env; lib tests need no browser); `built:` vitest.config.ts (plain object, deliberately NOT importing `defineConfig` from "vitest/config" since vitest resolves from the npx cache in this worktree and the config file's own module resolution can't see it, see the file's header comment), `test.environment:"node"`, `resolve.alias "@"` mirrors tsconfig's `@/*` -> `./*`
- [x] add tsx as a devDependency (ring-1a reviewer finding: scripts/ring1-kill-tests.mjs uses npx tsx, currently resolved from the ephemeral npx cache , not CI-reproducible); `built:` `npm install -D vitest tsx --package-lock-only` recorded both in package.json + package-lock.json without touching the shared node_modules symlink; verified `npx vitest`/`npx tsx` resolve from the npx cache locally AND that a plain `npm ci` in CI installs them for real (no workaround needed in GitHub Actions)
- [x] money-path unit tests, one file each; layout: `tests/lib/bookings/*.test.ts` + `tests/lib/purchases/*.test.ts` + shared hand-stub helper `tests/helpers/supabase-stub.ts` (chainable `.from()` sequence stub, no real Supabase client, no network); Stripe boundary (`chargeOffSession`/`getStripe`) + `alertAdmin` mocked via `vi.mock`; 74/74 passing (`npx vitest run`)
  - [x] lib/bookings/charge-fee.ts; `verified:` tests/lib/bookings/charge-fee.test.ts, 12 cases: invalid-amount/not-found/already-charged/no-policy-consent/no-saved-card guards, charge-cap-to-paid-base money math, commission-rate resolution + fallback, claim-first race
  - [x] lib/bookings/issue-refund.ts; `verified:` tests/lib/bookings/issue-refund.test.ts, 12 cases: NOT_CAPTURED guard, remaining/netting math (EXCEEDS_REMAINING), full vs partial payment_status transition, Connect reverse_transfer/refund_application_fee branch, CAS race, Stripe-throw rollback
  - [x] lib/bookings/dispute-engine.ts; `verified:` tests/lib/bookings/dispute-engine.test.ts, 17 cases: resolveEligibility/reasonAllowedOnConfirmed (pure), chargeUpcharge guards, the CUMULATIVE +50% cap math (nets prior charged upcharges AND a prior refund out of the base, fails CLOSED when the prior-upcharges query errors)
  - [x] lib/bookings/off-session-charge.ts; `verified:` tests/lib/bookings/off-session-charge.test.ts, 7 cases: Connect application_fee/transfer_data branch, SCA requires_action mapping, card-decline-no-alert vs non-decline-alerts
  - [x] lib/purchases/issue-purchase-refund.ts; `verified:` tests/lib/purchases/issue-purchase-refund.test.ts, 17 cases: guards, remaining/netting math, retail full-refund stock re-increment (vs no-op on partial), CAS race + Stripe-throw rollback, resolvePackageRefundAmount pro-rata floor+cap (pure)
  - [x] customer-cancel money math (customer-cancel-money.ts); `verified:` tests/lib/bookings/customer-cancel-money.test.ts, 9 cases: prepaid netted-refund math, double-refund guard (nets against already-refunded), fee-fully-absorbs-remaining no-op, free-cancel outside window, not-prepaid off-session charge branch, chargeFee/issueRefund throw-swallow
  - [x] booking status-transition guards; MEMO (not extracted): grepped lib/bookings/ + the 3 routes with a status guard (cancel/reschedule/quick-action) , no shared state-machine helper exists; each is a scattered single-line inline check with a DIFFERENT allowed-set per route (cancel requires 'confirmed'; reschedule allows 'confirmed' OR 'pending') and claim-slot.ts's CAS is a DB write, not a pure predicate. Extracting a unified function would invent new production structure beyond a <=20-line pure move (the intent's own escape hatch), so left as a memo for a future ring rather than refactored here.
- [x] API smoke harness: top ~10 endpoints, status + zod shape asserts (mobile-contract tripwire + future rings' re-verification tool); `built:` scripts/api-smoke.ts (npx tsx, LIVE DB reads only, no mutations), function-level against the REAL production functions/constants where they exist (loadSalonDetail, runHealthProbes, SALON_PUBLIC_COLS) mirroring prior ring kill-tests (sandboxed shell blocks outbound localhost); 10/10 cases PASS against the live DB: /api/salons default + with_slots + category-filter, /api/salons/[slug], /api/availability/[salon_id], /api/discovery/feed, /api/discovery/category-meta, /api/reviews/salon/[salon_id], /api/salons/trending, /api/health
- [x] CI wiring; `built:` .github/workflows/quality.yml (3 jobs: typecheck/lint/test, push+PR)
  - [x] tsc --noEmit error-count RATCHET vs today's baseline (5); `verified:` ran the exact CI bash locally, 5==5 passes, 482>481 simulated-fails
  - [x] lint; RAN FIRST per the brief , `npm run lint` did NOT pass today: root `eslint.config.js` was a dead Vite-era leftover (`eslint-plugin-react-refresh` + `typescript-eslint`, neither ever a package.json dependency) that shadowed the real `eslint.config.mjs` and crashed `next lint` at require-time with ZERO lint signal. Deleted it (graveyarded in REMOVED.md, `plan _plans/BACKEND_IMPROVEMENT.md ring 5`) so the real Next.js config resolves; that surfaced the actual content backlog, 481 errors / 239 warnings, pre-existing and OUT OF SCOPE for Ring 5 to fix. Set a lint-error-count RATCHET at 481 (same bash pattern as tsc), documented inline in quality.yml
  - [ ] the 2 Playwright visual specs; NOT wired , Playwright needs real browsers + a running dev server, which `actions/setup-node` doesn't provide; wiring it means adding `npx playwright install --with-deps` + a `next start` background step + `wait-on`, a materially bigger CI job than this ring's "floor" scope. Memo for a follow-up ring; e2e/visual stays a manual/local gate (`npm run test:visual`) for now, matching the intent's own "Do NOT wire Playwright into CI" instruction
- [x] Close: a deliberately broken-type branch goes red in CI; one mutated money-path fails its test; harness green; `verified:` kill-test below (mutated lib/bookings/dispute-engine.ts's cap comparison `amountCents > cap` -> `amountCents < cap`, `npx vitest run tests/lib/bookings/dispute-engine.test.ts` went from 17/17 to 13/17 (4 real failures, all cap-related), reverted, back to 17/17 + full suite 74/74; `npx tsc --noEmit` unchanged at the 5-error baseline (test files excluded from tsconfig.json's include set, see the vitest-setup line above for why); `git diff` scoped to package.json, package-lock.json, tsconfig.json, vitest.config.ts, tests/**, scripts/api-smoke.ts, .github/workflows/quality.yml, plus eslint.config.js (deleted, see the lint line above) and _design-system/REMOVED.md (its graveyard line)

## Ring 6 , ops runbook + parked-item resolution (QUEUED, LAST in loop; est ~1h)
- [x] backup/DR; `verified:` [_plans/OPS_RUNBOOK.md](OPS_RUNBOOK.md) (commit this ring)
  - [ ] OWNER: confirm backup tier/PITR in the Supabase dashboard (get_project does not expose it; runbook explains what to look for)
  - [x] restore runbook + RPO/RTO in OPS_RUNBOOK.md; schema reproducibility restored by Ring 11 (all 260 migrations have files)
  - [x] nFADP retention notes in OPS_RUNBOOK.md (search_events 90d job live; cron_runs purge follow-up; GDPR cron)
- [x] re-verify thumb-proxy prod outage claim; `verified:` 2026-07-11 curls: live site HTML-404s /api/discovery/thumb/[id] for BOTH real and garbage ids (Next 404 page, so the route is absent from the live build), while dev serves the same ids 200 image/jpeg X-Cache:STORAGE. Discriminators: live serves /api/discovery/category-meta (2026-06-30 code) but git ls-tree shows origin/main (2026-05-21) lacks BOTH , so the live build comes from neither current local main nor origin/main. ROOT CAUSE: the live code state lacks the route; NOT a code bug, nothing to fix in-repo. OWNER ACTION: bring the live site up to current main via your usual manual `sync`; that also takes the entire security-sweep fix set live (it is NOT live today).
- [ ] migration backfill branch-apply VERIFY , DEFERRED (Supabase branch = billed op, owner-gated; files were verbatim-extracted from the applied statements + spot-verified, so risk is low)
- [x] voucher/credits owner memo in OPS_RUNBOOK.md (recommendation: build the spend path when prioritized; RPCs are correct + ready)
- [x] cost snapshot table in OPS_RUNBOOK.md (owner fills CHF numbers; flagged: 15-min Actions cron cadence is near the private-repo free-minutes cap)
- [x] security maintenance note in OPS_RUNBOOK.md
- [x] campaign close 2026-07-11: original ask re-read (plan+scaling+efficiency+dead code+additions = all delivered, see Readback mapping); every remaining open box below is OWNER-gated (Netlify checks, purge/PITR decisions), a SOAK gate (next nightly cron cycles), or an explicitly-scoped follow-up with its reason inline. 18 ring commits on this branch; loop protocol satisfied

## Ring 7 , API consistency + validation floor (NEW per owner "add bunch more"; est ~2h)
- [x] zod validation census (RING 7a): `scripts/zod-census.mjs` scans every `app/api/**/route.ts` exporting POST/PATCH/PUT/DELETE (198 routes, 237 method pairs: 135 validated, 56 unvalidated, 46 no-body); full table in `_plans/ZOD_CENSUS.md`. Only the TOP 5 money/booking/admin gaps were fixed this ring (per the ring-7a brief, not the full 56): walkin/pay-intent (money), bookings/[id]/reschedule (booking), admin/salons/[id]/freeze + warn (admin moderation), walkin/review; `verified:` scripts/ring7a-kill-test.ts. The remaining ~51 unvalidated rows are a MEMO for a later ring (listed in ZOD_CENSUS.md), not fixed here.
- [ ] error envelope consistency: machine-readable {error, code} shape swept across routes; user-facing strings resolved client-side per locale (4 locales); fix the worst offenders first
- [x] empty-catch sweep (RING 7a): grepped `app/api/` + `lib/` for bare `catch {}`, `catch (e) {}`, comment-only catch bodies, and `.catch(() => null/"")` variants; ~23 genuine silent swallows found and fixed with `console.error("[tag] desc:", err)`, preserving existing control flow. ONE documented exception left as-is: `lib/supabase.ts`'s `setAll` catch (the officially-documented Supabase SSR "called from a Server Component" no-op, confirmed this app's middleware already refreshes sessions, so adding console.error there would log on nearly every page render for expected, non-error behavior); `verified:` before/after grep counts in the ring-7a coder report.
- [ ] HTTP semantics pass
  - [x] CAS losers return 409, incl. the parked sweep-ring-16 item: map the staff_daily_limit_reached trigger exception to a friendly 409 in bookings/route.ts; `verified:` app/api/bookings/route.ts POST bookingError branch now checks `.message?.includes("staff_daily_limit_reached")` -> 409 `{error, message, code:"STYLIST_FULLY_BOOKED"}`, kill-tested against a synthetic error object in scripts/ring7a-kill-test.ts
  - [ ] ownership failures return 404 per the established security convention
- [ ] select("*") long-tail: after Ring 2 covers bookings/salons, sweep the remaining ~90 sites on small tables (mechanical, low blast radius)

## Ring 8 , webhook + email resilience (money-adjacent; est ~1.5h) DONE 2026-07-11, see _plans/WEBHOOK_RESILIENCE.md
- [x] webhook idempotency audit: all 5 stripe/webhook handler files re-read under the retry lens (processed_webhook_events claim + release-on-error); gaps listed with file:line , verdict table in WEBHOOK_RESILIENCE.md section 1 (14/17 branches idempotent; 2 notification-double-send gaps + 1 real charge.dispute.closed ledger-correctness bug found and memo'd, not fixed this ring, out of scope)
- [x] implement promo-increment idempotency (parked sweep item, fails-safe today): promo_counted CAS flag via additive column, webhook retry no longer over-counts current_uses , re-verified the described bug was ALREADY fixed by the 2026-07-10 reserve-at-checkout refactor (0 increment_promo_use calls left in the webhook); still built promo_counted_at as a CAS audit/reconcile marker per the explicit ask (migration NOT applied, orchestrator applies live)
- [x] reconcile coverage map: which missed-webhook classes does cron/reconcile catch vs miss; close the biggest miss , map in WEBHOOK_RESILIENCE.md section 3; closed gift-card activation (0% prior coverage), memo'd voucher/voucher_purchase + aged-purchase-refund + dispute-lost-ledger gaps
- [x] vouchers/confirm retire-or-keep memo (0 live callers since the salon-voucher webhook took over finalization) , fresh grep confirmed 0 callers (web + solen-mobile); recommendation RETIRE to 410 (route untouched this ring per instruction)
- [x] pending_approval referral completion gap (parked): wire referral completion into the booking-approve transition , app/api/bookings/[id]/confirm/route.ts now accepts pending_approval + calls completeReferralForFirstBooking; found + flagged a bigger gap (0 live callers of that route at all, no working approve UI exists yet)

## Ring 9 , abuse-coverage census (est ~0.5h)
- [x] rate-limiter census (237 method-pairs -> [_plans/RATELIMIT_CENSUS.md](RATELIMIT_CENSUS.md)) + 10 most-exposed unlimited mutation routes gated; `verified:` commit b0e4f97fd, kill-test 8/8
- [x] gift-cards/balance rogue limiter migrated onto guestLookupLimiter (now in the fail-closed set); `verified:` commit b0e4f97fd
- [x] CONTEXT+NODE_ENV guard aligned; `verified:` commit b0e4f97fd, ring1 kill-tests re-run 6/6 + manual deploy-preview case fails open correctly
- [x] vouchers/validate oracle collapsed to one generic failure message (success shape untouched); `verified:` commit b0e4f97fd
- [x] formula-photo Storage write moved after the ownership gate; `verified:` commit b0e4f97fd
- [x] notes/tags DELETE parity check added; `verified:` commit b0e4f97fd

## Ring 10 , dead-code deep census (extends Ring 4; est ~1.5h)
- [x] lib/ SUBDIRECTORY orphan sweep (Ring 4's inventory covered top-level lib/*.ts only); `verified:` scripts/legacy-census.mjs extended with a second census pass over lib/*/ (importers scanned from app/, components/, components-legacy/, hooks/, lib/, scripts/, supabase/); 6 zero-importer candidates found, 5 deleted (chair-availability.ts, infill-calculator.ts, station-availability.ts, persona/deriv.ts, vouchers/validate.ts, all superseded-by-inline-logic or dead-consumer, evidence in _plans/LEGACY_CENSUS.md), 1 kept as a documented exception (lib/auth/{index,require}.ts , zero code importers but named by path in the live .claude/hooks/no-getsession-authz-gate.py guardrail text)
- [ ] unused-exports sweep over lib/ , NOT done this campaign (file-level orphans done; export-level sweep = follow-up, low value after the file purge) , NOT done this ring (file-level orphan sweep above is a different, coarser analysis than a per-export ts-prune sweep; left for a dedicated ring)
- [x] DB estate census, MEMO ONLY, no drops; `verified:` memo in LEGACY_CENSUS.md (146 live tables, 26 zero-code-ref candidates with SQL-side caveats named)
  - [x] all public tables (146 live, not 132) vs code references -> candidate list + known-alive caveats in LEGACY_CENSUS.md
  - [x] all DB functions vs call sites -> dead-RPC list (FIRST PASS done 2026-07-11); `verified:` grep over app/lib/components*/hooks/scripts found 11 zero-caller functions: booking_counts_by_salon, earliest_slots_by_service (reuse candidate, see Ring 2), increment_promo_use (superseded by reserve_promo_use), purge_past_available_slots (unscheduled, see Ring 3 memo), recompute_salon_engagement, redeem_voucher, redeem_user_credits, restore_voucher, restore_user_credits (the voucher-spend seam x4), salon_client_summary, set_customer_persona (dormant personalization). CAVEAT for the final memo: SQL-internal/trigger call sites + supabase/functions sources not yet counted , re-check those before recommending any drop
  - [x] storage buckets vs code references: 4 of 9 zero-ref (chat-media, gift-card-assets, nail-inspo-images, barber-portfolio-images), memo'd, no deletions
- [x] components-legacy census follow-through: delete every 0-importer file _plans/LEGACY_CENSUS.md proves dead (re-grep each incl. solen-mobile before delete); `verified:` all 78 DEAD files re-verified (resolved-import-graph re-run, byte-identical, plus a manual basename/dirname grep across the whole repo) then `git rm`'d; 4 REMOVED.md lines added for feature-shaped groups (nail booking flow, remaining chat/* fragments, barber walk-in remote/express features, LastMinuteManager correction); post-deletion census LIVE count unchanged (116), full memo in _plans/LEGACY_CENSUS.md "Ring 10 deletions + memo"

## Ring 11 , migrations + types reproducibility (est ~1.5h)
- [x] backfill remote-only migrations as files , actual count 59 (the '42' was a stale estimate; 55 missing + 4 canonical stub swaps), extracted verbatim from supabase_migrations.schema_migrations; `verified:` commit eae4fcfcc, independent verifier PASS (scope diff empty, spot-reads match)
- [x] booking_disputes_status_check drift reconciled , the backfilled 20260703100804_fix_booking_disputes_status_check_add_resolved_dismissed.sql IS the missing hotfix file; tracked files now match live; `verified:` commit eae4fcfcc
- [x] lib/database.types.ts regenerated from live (+6017/-1542, was 5 weeks stale), tsc unchanged at 5; ADOPTION stays parked; `verified:` commit eae4fcfcc
- [x] apply_migration law + backfill recipe documented in _rules/DB_SCHEMA.md section 7; `verified:` commit eae4fcfcc

---

## Loop protocol (owner 2026-07-11: "10h+ loop for full backend fix")
Autonomous multi-session loop, same shape as the 16-ring security sweep. **Execution order: 1 -> 2 -> 3 -> 4 -> 7 -> 8 -> 9 -> 10 -> 11 -> 5 -> 6** (guardrails first so later mistakes trip alarms; tests near the end so they lock in the rewritten code; ops close the campaign).
1. Take the next ring; RE-VERIFY each item's claim against live code/DB first (Ring 0 already proved 2 audit claims stale).
2. Dispatch coder + read-only loop-reviewer per batch (writer never grades own work); parallel agents allowed, waves of <=4.
3. Discriminate/kill-test per the ring's close boxes; before->after numbers on every perf item.
4. Commit per verified chunk; tick boxes with `verified:` evidence; update the ACTIVE.md row after each ring.
5. Blockers become owner memos (parked + surfaced in the ring summary), never a pause; transient limits = ScheduleWakeup/background continuation, never a stop.
6. Stop ONLY when every non-owner-gated box is ticked, or the remainder is 100% owner-gated.
Estimated loop size: ~14-16h agent work (R1 1.5 / R2 2 / R3 2 / R4 1.5 / R7 2 / R8 1.5 / R9 0.5 / R10 1.5 / R11 1.5 / R5 2.5 / R6 1).

---

## DO-NOT-DO , premature at 28 salons, parked behind named triggers
| rewrite | unpark trigger |
|---|---|
| generate-slots set-based SQL rewrite (owner-gated regardless) | >=150 salons OR nightly runtime > Ring-0-set threshold |
| discovery feed cache / materialized feed | discovery_items >= 10k (now 1071) |
| Redis app-cache layer beyond CDN headers | post-Ring-2 p95 > 500ms on cached endpoints |
| availability_slots partitioning / replicas / pool tuning | > 5M rows (now ~162k) or measured p95 regression |
| database.types.ts adoption (~2000 errors) | dedicated sprint, owner-scheduled |
| components-legacy bulk deletion (272 files, 111 live importers) | census manifest complete, separate campaign |
| cron -> queue system (QStash etc.) | a cron exceeding its HTTP/Actions timeout in practice |
| dedicated search infra | >= 500 salons |
| load-testing suite | real traffic justifies it; curl + smoke harness suffice |

## Checklist additions (the owner's "what should we add" ask)
Webhook resilience audit (Stripe retry idempotency + reconcile coverage map, Ring 1/2) · email failure handling (Resend failures logged/alerted, Ring 3) · mobile API contract protection (grep rule + smoke harness, Rings 4/5) · API error-envelope consistency for 4 locales (Ring 5) · data retention / nFADP (Ring 6) · cost tracking (Ring 6) · backups/DR runbook (Ring 6) · founder daily digest (Ring 1).

## Cadence + verification
One ring at a time (Ring 4 may parallel 2-3 on disjoint files); coder builds + read-only loop-reviewer grades the ring's binary close list; 24-48h nightly-cron soak between risky rings; every perf item = before-number -> ONE change -> same-number re-measure in the commit message; every behavioral surface gets a discriminate check; owner-gated items = decision memos with dry-run evidence, never executed. Commit per verified chunk, never push.


## Owner follow-up batch (2026-07-11 PM: "ignore 1+netlify, 3 do again, 4 do, 5 too, backups + what to add")
- [x] items 1 (site `sync`) + 2 (Netlify env check) acknowledged as IGNORE , owner's court, no further nagging
- [x] 3: backup check DONE myself; `verified:` supabase CLI backups list 2026-07-11: pitr_enabled=false, platform backups list EMPTY , recorded in OPS_RUNBOOK; the in-house export below is currently the only restorable backup
- [x] 3b: in-house nightly backup SHIPPED + FIRST BACKUP SEEDED; `verified:` commit 9bcbfa2af, kill-test 10/10, bucket privacy live-probed (anon denied), backups/2026-07-11/ = 24 files / 2,450 rows / 2.8MB confirmed in storage.objects; daily 03:45 UTC scheduled
- [x] 4a: purge DONE; `verified:` fn source read (safe by construction: >=1 day past, available-only, zero booking refs), initial purge 154,698 rows (164,063 -> 9,365 total, 0 still eligible), weekly pg_cron job 'purge-past-available-slots' Sun 04:15 UTC confirmed in cron.job; migration applied + file backfilled (commit c47a1be22)
- [x] 4b: credits/voucher SPEND path SHIPPED (flag-gated, flags live ON); `verified:` commit 57f9f11ff, kill-test 27/27 live, vitest 76/76; reviewer caught + fixed over-restore on PARTIAL refunds (isFull gate, mutation-proven). Known unverified edge: guest+voucher E2E (flagged)
- [x] 5a: soak check run; `verified:` cron_runs holds only the kill-test digest row , scheduled runs hit the LIVE site which runs pre-loop code, so the soak gate stays pending the owner's `sync` (item 1 = owner's court, acknowledged)
- [x] 5b: CDN caching headers SHIPPED; `verified:` commit c47a1be22, s-maxage=60 swr=300 anon-only, personalized paths no-store (cache-poisoning seams closed), Netlify precedence verified against live docs by the reviewer, kill-test 17/17
- [x] 5c: hygiene bundle SHIPPED; `verified:` commit 8eed5293a , banCache cap, honest comment, 3 exposed select(*) trims + 12 justified keeps, 12 dead exports, all 23 non-cron sendEmail sites guarded (salon-approve was 500ing on email failure , real bug), notes/tags 404 parity confirmed no-fix-needed
- [x] 5d: error-envelope SHIPPED; `verified:` commit 7855e608f , stable codes on all non-2xx of the 12 top routes, additive-only (mobile-consumed lowercase walkin codes untouched), kill-test 16/16
- [x] 6: recommendations list delivered in the closing report (uptime monitor, Sentry option, Playwright-in-CI, E2E booking test, staging env, SEO/sitemap check, web-vitals, Actions-minutes watch, tsc-to-zero, database.types adoption sprint)
