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

## Ring 1 , fail-closed guardrails + alerting spine (QUEUED, first in loop; est ~1.5h)
- [ ] lib/env.ts prod-required assertion
  - [ ] assert UPSTASH_*, CRON_SECRET, Stripe keys + webhook secret, RESEND_API_KEY, ADMIN_EMAIL when Netlify CONTEXT=production
  - [ ] preview/branch builds unaffected (kill-test both contexts locally via env override)
- [ ] lib/ratelimit.ts fail-mode split
  - [ ] classify limiters: auth/payment/abuse-prone = fail-CLOSED when Redis unconfigured in prod
  - [ ] all other limiters = fail-open + alertAdmin, throttled to once per boot
  - [ ] kill-test: Upstash unset in prod-mode = auth route blocked, browse route still serves, alert email fires
- [ ] cron failure alerting
  - [ ] every app/api/cron/* returns structured {ok, processed, errors}
  - [ ] .github/actions/ping-cron asserts HTTP 2xx AND ok:true, hard-fails the job (GitHub then emails the owner for free)
  - [ ] kill-test: one cron pointed at a forced 500 on a branch run = red workflow + email received
- [ ] lib/error-report.ts: reportError() -> throttled alertAdmin email; wired into top-level catch of money/cron/webhook routes; remove the 3 placeholder Sentry config files (Sentry retry = parked owner option)
- [ ] /api/health dependency probe: DB SELECT 1 + Redis ping + env-completeness, 200/503 with per-dep JSON; kill-test: broken DB creds locally = 503 (uptime-monitor signup = owner-gated memo)
- [ ] founder daily digest email: yesterday's bookings, cron statuses, error count (Resend, reuse lib/alert-admin.ts plumbing); kill-test: digest received on dev trigger

## Ring 2 , hot-path request cost (QUEUED; est ~2h)
- [ ] feature-flag caching (lib/feature-flags.ts)
  - [ ] request-scoped memo for checkFeatureEnabled + checkUserBanned
  - [ ] cross-request TTL cache 30-60s for flags
  - [ ] ban checks: <=10s TTL or request-memo only (security-relevant; reviewer signs the freshness window)
  - [ ] discriminate proof: toggle a real flag, responses differ within TTL; ban a test user, gating holds
- [ ] fix 2 dead revalidate exports (salons/trending, analytics/platform , cookie client defeats ISR); prove via warm-hit timing + live-site response headers
- [ ] CDN caching headers, s-maxage+SWR, anon variants only, NO Redis layer
  - [ ] FIRST resolve the netlify.toml conflict (found Ring 0-adjacent, 2026-07-11): `[[headers]] for="/api/*"` forces Cache-Control no-store; confirm precedence vs function-set headers on Netlify (function headers usually win, but prove it) and carve out the cacheable routes from that blanket rule if needed
  - [ ] /api/salons
  - [ ] /api/discovery/feed
  - [ ] /api/salons/[slug]
- [ ] next_available_date -> MIN()/DISTINCT ON RPC (reclassified by Ring 0: correctness fix , 1,470 rows fetched to keep 6, silent drop past the PostgREST 1000-row cap; query itself is 0.73 ms)
- [ ] dashboard/today 4 serial awaits -> Promise.all (Ring 0 before-number: ~900 ms warm)
- [ ] dashboard/batch revenue -> DB SUM RPC (deprioritized to hygiene by Ring 0: query is 2.7 ms at 956 bookings; self-verify vs JS sum before switchover)
- [ ] bookings-list select("*") -> allowlist
- [ ] NEW (Ring 0 discovery): availability/[salon_id] payload trim , 458 KB per date-picker load (repeats joined service/staff fields on all 957 slot rows); dedupe joins into a lookup map or slim the per-slot shape. Before-number: 458,447 B
- [x] availability/[salon_id] second scan , ALREADY FIXED (verified Ring 0: single all-status scan, route.ts:19), no work
- [ ] discovery/feed payload check: 59 KB for 20 items (Ring 0 number); verify per-item shape carries no unused heavy fields, trim if so
- [ ] reviews sub-page unbounded load (SWEEP_BACKLOG leftover): app/[locale]/salon/[slug]/reviews/page.tsx selects ALL reviews + 3 joins -> .range(0,19) + paginate via the existing /api/reviews/salon/[salon_id] endpoint
- [ ] walk-in availability call fired on every search page regardless of relevance (SWEEP_BACKLOG leftover, SearchTemplate -> /api/walkin/availability) -> gate on the page payload's walkin_enabled
- [ ] Stripe-on-edge resolved per Ring 0 Netlify-runtime finding (owner ask open)
- [ ] Close: before->after vs Ring 0 numbers per item; solen-mobile grep = no consumed shape changed

## Ring 3 , cron efficiency (QUEUED; est ~2h)
- [ ] instrument all 24 crons: one wall-time + query-count log line per run (feeds every before->after below)
- [ ] process-deletions batched: IN-list deletes, Promise.all where order-independent, FK order preserved
- [ ] the ~12 per-row-loop crons batched, one commit each: .insert(rows[]) batches, IN-list selects, email concurrency cap ~5 (never unbounded parallel email)
- [ ] email failure handling sweep (checklist addition): every sendEmail call site logs failure with context; money-path sends alertAdmin on failure
- [ ] generate-slots (SQL rewrite stays PARKED, owner-gated, trigger >=150 salons or runtime threshold)
  - [ ] per-run timing + query-count instrumentation
  - [ ] O(n²) JS overlap scan -> sort + sweep, write semantics untouched
- [ ] availability_slots purge memo
  - [x] dry-run SELECT count of dead rows; `verified:` live SQL 2026-07-11: 156,296 PAST status='available' rows + 826 past booked, of 164,063 total (95% of the table is dead history; live future inventory = only 6,941 rows / few MB)
  - [ ] OWNER DECISION: purge past status='available' rows only (never booked ones , bookings reference their slots; keep booked history). Recommendation: yes, with a weekly purge cron thereafter. DELETE on prod = owner-only, never agent-executed.
- [ ] close, per rewritten cron
  - [ ] before->after wall time + query count from the new instrumentation
  - [ ] old-vs-new output diff on the same dev dataset (empty diff = pass)
  - [ ] one clean nightly soak

## Ring 4 , dead-code demolition (QUEUED; deep clean; parallelizable with 2-3; git-reversible)
One commit per category, caller-grep evidence (app/ + components-legacy/ + solen-mobile) in the message:
- [ ] src/ retired Vite tree + sole dependent /api/salons/last-minute
- [ ] 11 orphaned routes (gift-cards/purchase + redeem-stub, discover/nails, notifications/off-peak, conversations/[id]/messages + price-offer, persona/hair-dna, chat/suggest, chat-templates, nail-inspo/boards, salons/last-minute)
- [ ] 10 orphan lib files (booking-email, commission-calculator, demo-data, discovery-algorithm, discovery-moderation, guest-saves, ics-generator, motion, registration-validation, tiktok-embed)
- [ ] 7 unused npm deps (@reduxjs/toolkit, @fal-ai/client, swr, react-day-picker, react-use-measure, @vitejs/plugin-react, picocolors) + vite toolchain + @supabase/auth-helpers-nextjs (grep-gated)
- [ ] 7 supabase/functions SOURCE dirs (deployed deletion = owner-gated memo)
- [ ] components-legacy, two concrete steps (bulk delete = later campaign, 111 live importers)
  - [ ] delete the 7 confirmed-orphan leaves: ChatWindow.tsx, chat/AISuggestion.tsx, chat/QuickReplyChips.tsx, chat/BookingBubble.tsx, chat/ClientTags.tsx, chat/PhotoGallery.tsx, nail/InspoBoard.tsx (each re-grepped incl. solen-mobile first)
  - [ ] generate the full 272-file census manifest (importer count per file, grep script) -> _plans/LEGACY_CENSUS.md
- [ ] ~8 stale one-off scripts
- [ ] REMOVED.md graveyard line per deleted feature surface
- [ ] 4 dead RPCs (redeem_voucher/credits + restores): DO NOT DROP , unbuilt voucher-spend seam, into Ring 6 memo
- [ ] Close: build+lint green, typecheck error-count same-or-lower, 2 Playwright specs pass, deploy-preview smoke, deletion manifest complete

## Ring 5 , test & CI floor (QUEUED; runs after Ring 11 in loop order; est ~2.5h)
- [ ] vitest setup (node env; lib tests need no browser)
- [ ] money-path unit tests, one file each
  - [ ] lib/bookings/charge-fee.ts
  - [ ] lib/bookings/issue-refund.ts
  - [ ] lib/bookings/dispute-engine.ts
  - [ ] lib/bookings/off-session-charge.ts
  - [ ] lib/purchases/issue-purchase-refund.ts
  - [ ] customer-cancel money math (customer-cancel-money.ts)
  - [ ] booking status-transition guards
- [ ] API smoke harness: top ~10 endpoints, status + zod shape asserts (mobile-contract tripwire + future rings' re-verification tool)
- [ ] CI wiring
  - [ ] tsc --noEmit error-count RATCHET vs today's baseline
  - [ ] lint
  - [ ] the 2 Playwright visual specs
- [ ] Close: a deliberately broken-type branch goes red in CI; one mutated money-path fails its test; harness green

## Ring 6 , ops runbook + parked-item resolution (QUEUED, LAST in loop; est ~1h)
- [ ] backup/DR
  - [ ] PITR status confirmed (owner dashboard or read-only get_project)
  - [ ] restore runbook + RPO/RTO written into the ops doc
  - [ ] nFADP retention note (audit-log growth, PII in logs, retention windows)
- [x] re-verify thumb-proxy prod outage claim; `verified:` 2026-07-11 curls: live site HTML-404s /api/discovery/thumb/[id] for BOTH real and garbage ids (Next 404 page, so the route is absent from the live build), while dev serves the same ids 200 image/jpeg X-Cache:STORAGE. Discriminators: live serves /api/discovery/category-meta (2026-06-30 code) but git ls-tree shows origin/main (2026-05-21) lacks BOTH , so the live build comes from neither current local main nor origin/main. ROOT CAUSE: the live code state lacks the route; NOT a code bug, nothing to fix in-repo. OWNER ACTION: bring the live site up to current main via your usual manual `sync`; that also takes the entire security-sweep fix set live (it is NOT live today).
- [ ] migration backfill VERIFY: backfilled files (Ring 11) apply cleanly on a Supabase branch (branch = cost-confirmed op)
- [ ] voucher/credits owner memo: build the spend path vs drop the 4 never-wired RPCs (redeem_voucher, redeem_user_credits, restore_voucher, restore_user_credits)
- [ ] cost snapshot page (Supabase get_cost, Netlify, Upstash, Resend, Actions minutes), monthly refresh note
- [ ] security maintenance note: keep gates, get_advisors after schema changes, no new sweeps
- [ ] campaign close: re-read the owner's ORIGINAL ask + this file top-to-bottom; every box ticked with evidence or owner-gated with its memo linked

## Ring 7 , API consistency + validation floor (NEW per owner "add bunch more"; est ~2h)
- [ ] zod validation census: every POST/PATCH/PUT/DELETE route parses its body via lib/validations or inline zod; list the gaps, fix each (precedent: spa/treatment-outcomes was missing until sweep ring 11)
- [ ] error envelope consistency: machine-readable {error, code} shape swept across routes; user-facing strings resolved client-side per locale (4 locales); fix the worst offenders first
- [ ] empty-catch sweep: zero `.catch(() => {})` / bare `catch {}` in app/api + lib (project rule: console.error("[Component] desc:", err))
- [ ] HTTP semantics pass
  - [ ] CAS losers return 409, incl. the parked sweep-ring-16 item: map the staff_daily_limit_reached trigger exception to a friendly 409 in bookings/route.ts
  - [ ] ownership failures return 404 per the established security convention
- [ ] select("*") long-tail: after Ring 2 covers bookings/salons, sweep the remaining ~90 sites on small tables (mechanical, low blast radius)

## Ring 8 , webhook + email resilience (money-adjacent; est ~1.5h)
- [ ] webhook idempotency audit: all 5 stripe/webhook handler files re-read under the retry lens (processed_webhook_events claim + release-on-error); gaps listed with file:line
- [ ] implement promo-increment idempotency (parked sweep item, fails-safe today): promo_counted CAS flag via additive column, webhook retry no longer over-counts current_uses
- [ ] reconcile coverage map: which missed-webhook classes does cron/reconcile catch vs miss; close the biggest miss
- [ ] vouchers/confirm retire-or-keep memo (0 live callers since the salon-voucher webhook took over finalization)
- [ ] pending_approval referral completion gap (parked): wire referral completion into the booking-approve transition

## Ring 9 , abuse-coverage census (est ~0.5h)
- [ ] rate-limiter census: every mutation route carries an appropriate tier limiter; gaps fixed
- [ ] vouchers/validate responses collapsed to one generic error (parked code-existence-oracle item)
- [ ] coiffeur/formula-photo: Storage write moved AFTER the clientBelongsToSalon gate (parked storage-path IDOR residual)
- [ ] notes/tags DELETE handlers get clientBelongsToSalon for parity (parked; already triple-scoped, no live IDOR)

## Ring 10 , dead-code deep census (extends Ring 4; est ~1.5h)
- [ ] lib/ SUBDIRECTORY orphan sweep (Ring 4's inventory covered top-level lib/*.ts only)
- [ ] unused-exports sweep over lib/ (grep-based ts-prune equivalent); dead exports deleted
- [ ] DB estate census, MEMO ONLY, no drops
  - [ ] all public tables (132) vs code references -> dead-table list
  - [ ] all DB functions vs call sites -> dead-RPC list
  - [ ] storage buckets vs code references
- [ ] components-legacy census follow-through: delete every 0-importer file _plans/LEGACY_CENSUS.md proves dead (re-grep each incl. solen-mobile before delete)

## Ring 11 , migrations + types reproducibility (est ~1.5h)
- [ ] backfill the 42 remote-only migrations into supabase/migrations/*.sql files (from the remote migrations log + live schema; FILES only, marking them applied remotely = owner-gated)
- [ ] reconcile the booking_disputes_status_check drift (parked: live allows resolved/dismissed, tracked files don't)
- [ ] regenerate lib/database.types.ts from live + commit (ADOPTION stays parked, ~2000 errors = dedicated sprint)
- [ ] document the additive-idempotent apply_migration law + the backfill procedure in _rules/DB_SCHEMA.md

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
