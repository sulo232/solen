# Backend improvement campaign , scaling, efficiency, dead code, ops health (2026-07-11)

Owner ask: "full plan for the backend, improving in every way, scaling, efficiency, unused code, and tell me what we should add." Approved plan: `~/.claude/plans/wiggly-waddling-scroll.md`.

**Extends, does not duplicate:** security+correctness are DONE ([BACKEND_AUDIT_INDEX.md](BACKEND_AUDIT_INDEX.md) 141 findings fixed; [BACKEND_SWEEP_2026-07-10.md](BACKEND_SWEEP_2026-07-10.md) 16 rings, substantially complete). This campaign = the dimensions never covered: perf/caching, cron efficiency, dead code, monitoring/alerting, testing/CI, migrations reproducibility, backups/DR, cost.

**Law:** measure-first (28 salons live; most scale rewrites are PREMATURE, parked behind numeric triggers). Cross-cutting guard: no route deletion or response-shape change without grepping `/Users/sulo/Documents/solen-mobile` for the route path.

**Owner defaults taken (dialog dismissed, flip with one word):** dead code = DEEP clean; monitoring = email-alerts-first (Sentry retry parked); kickoff = Ring 0 now.

---

## Ring 0 , measurement baseline (DONE 2026-07-11)
- [x] timings measured (in-browser fetch x3 on dev :3000; sandbox curl can't reach localhost , documented dev-noise caveat: run 1 includes Next compile; runs 2-3 are the comparable warm numbers)
- [x] EXPLAIN ANALYZE: next_available_date scan, availability/[salon_id] scan, dashboard/batch revenue query
- [x] Live table sizes + growth snapshot
- [x] Response-header audit of the 3 `revalidate` routes (INCONCLUSIVE in dev , see results)
- [x] generate-slots baseline: static analysis (live trigger skipped , WRITES slots to the live DB; wall-time comes from Ring 3 instrumentation)
- [x] OWNER ASK recorded (see "Open owner asks" below)
- [x] OWNER ASK recorded (Netlify runtime)

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

### Open owner asks (Ring 0)
- [ ] OWNER: check Netlify prod env has UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN, CRON_SECRET, STRIPE_WEBHOOK_SECRET, RESEND_API_KEY, ADMIN_EMAIL (Site settings -> Environment variables, or `netlify env:list`). If the two UPSTASH vars are missing, EVERY rate limit is silently OFF in prod today (lib/ratelimit.ts fails open).
- [ ] OWNER: confirm which runtime Netlify gives routes declaring `runtime="edge"` (deploy log or Netlify functions tab) , decides the Ring 2 Stripe-on-edge item.

---

## Ring 1 , fail-closed guardrails + alerting spine (QUEUED, next)
- [ ] lib/env.ts prod-required assertion (gate on Netlify CONTEXT=production; never break previews)
- [ ] lib/ratelimit.ts: fail-CLOSED on auth/payment/abuse classes when Redis unconfigured in prod; fail-open + throttled alertAdmin elsewhere
- [ ] Cron failure alerting: structured {ok, processed, errors} from every cron; ping-cron asserts 2xx AND ok:true, hard-fails (GitHub emails owner for free)
- [ ] lib/error-report.ts -> throttled alertAdmin email; remove placeholder Sentry configs (Sentry retry = parked owner option)
- [ ] /api/health -> dependency probe (DB SELECT 1, Redis ping, env-completeness) 200/503; uptime-monitor signup = owner-gated
- [ ] Founder daily digest email (yesterday's bookings, cron statuses, error count)
- [ ] Close kill-tests: Upstash-unset prod boot fails/alerts; cron->500 = red workflow + email; broken DB = health 503; thrown route error reaches inbox; digest received

## Ring 2 , hot-path request cost (QUEUED)
- [ ] Feature-flag caching (lib/feature-flags.ts): request-memo + 30-60s TTL flags; ban checks <=10s TTL; discriminate proof (toggle flag, ban test user)
- [ ] Fix 2 dead revalidate exports (salons/trending, analytics/platform , cookie client defeats ISR)
- [ ] CDN s-maxage+SWR on anon variants of /api/salons, /api/discovery/feed, /api/salons/[slug] (headers only, NO Redis layer)
- [ ] next_available_date -> MIN()/DISTINCT ON RPC (reclassified by Ring 0: correctness fix , 1,470 rows fetched to keep 6, silent drop past the PostgREST 1000-row cap; query itself is 0.73 ms)
- [ ] dashboard/today 4 serial awaits -> Promise.all (Ring 0 before-number: ~900 ms warm)
- [ ] dashboard/batch revenue -> DB SUM RPC (deprioritized to hygiene by Ring 0: query is 2.7 ms at 956 bookings; self-verify vs JS sum before switchover)
- [ ] bookings-list select("*") -> allowlist
- [ ] NEW (Ring 0 discovery): availability/[salon_id] payload trim , 458 KB per date-picker load (repeats joined service/staff fields on all 957 slot rows); dedupe joins into a lookup map or slim the per-slot shape. Before-number: 458,447 B
- [x] availability/[salon_id] second scan , ALREADY FIXED (verified Ring 0: single all-status scan, route.ts:19), no work
- [ ] Stripe-on-edge resolved per Ring 0 Netlify-runtime finding (owner ask open)
- [ ] Close: before->after vs Ring 0 numbers per item; solen-mobile grep = no consumed shape changed

## Ring 3 , cron efficiency (QUEUED)
- [ ] process-deletions batched (FK order preserved)
- [ ] ~12 per-row-loop crons batched (.insert(rows[]), IN-list selects, email concurrency cap ~5)
- [ ] generate-slots: instrumentation + O(n²) JS overlap-scan fix in place ONLY (SQL rewrite PARKED, owner-gated, trigger >=150 salons or runtime threshold)
- [ ] availability_slots purge: dry-run SELECT count + owner decision memo (DELETE = owner-only)
- [ ] Close: per-cron before->after wall time + query count; old-vs-new output diff on same dev dataset; one clean nightly soak per rewritten cron

## Ring 4 , dead-code demolition (QUEUED; deep clean; parallelizable with 2-3; git-reversible)
One commit per category, caller-grep evidence (app/ + components-legacy/ + solen-mobile) in the message:
- [ ] src/ retired Vite tree + sole dependent /api/salons/last-minute
- [ ] 11 orphaned routes (gift-cards/purchase + redeem-stub, discover/nails, notifications/off-peak, conversations/[id]/messages + price-offer, persona/hair-dna, chat/suggest, chat-templates, nail-inspo/boards, salons/last-minute)
- [ ] 10 orphan lib files (booking-email, commission-calculator, demo-data, discovery-algorithm, discovery-moderation, guest-saves, ics-generator, motion, registration-validation, tiktok-embed)
- [ ] 7 unused npm deps (@reduxjs/toolkit, @fal-ai/client, swr, react-day-picker, react-use-measure, @vitejs/plugin-react, picocolors) + vite toolchain + @supabase/auth-helpers-nextjs (grep-gated)
- [ ] 7 supabase/functions SOURCE dirs (deployed deletion = owner-gated memo)
- [ ] components-legacy: confirmed-orphan chat/* + nail/InspoBoard leaves (~7 files) + full 272-file census manifest (bulk delete = later campaign)
- [ ] ~8 stale one-off scripts
- [ ] REMOVED.md graveyard line per deleted feature surface
- [ ] 4 dead RPCs (redeem_voucher/credits + restores): DO NOT DROP , unbuilt voucher-spend seam, into Ring 6 memo
- [ ] Close: build+lint green, typecheck error-count same-or-lower, 2 Playwright specs pass, deploy-preview smoke, deletion manifest complete

## Ring 5 , test & CI floor (QUEUED)
- [ ] CI: tsc --noEmit error-count RATCHET vs baseline, lint, 2 Playwright specs
- [ ] Unit tests for money paths ONLY (charge-fee, issue-refund, dispute-engine, off-session-charge, purchase-refund, cancellation policy, booking state transitions)
- [ ] API smoke harness: top ~10 endpoints, status + zod shape (doubles as mobile-contract tripwire)
- [ ] Backfill 42 remote-only migrations into supabase/migrations/ files (remote marking = owner-gated)
- [ ] Regenerate lib/database.types.ts from live + commit (ADOPTION parked, ~2000 errors = dedicated sprint)
- [ ] Close: broken-type PR goes red; mutated money-path fails its test; harness green; backfilled files apply on a Supabase branch

## Ring 6 , ops runbook + parked-item resolution (QUEUED)
- [ ] Backup/DR: PITR status confirmed (owner/dashboard), restore runbook + RPO/RTO; nFADP retention note
- [ ] Re-verify thumb-proxy prod outage claim; fix or close
- [ ] pending_approval referral completion gap: implement
- [ ] Voucher/credits owner memo: build spend path vs drop 4 RPCs
- [ ] Cost snapshot page (Supabase, Netlify, Upstash, Resend, Actions minutes), monthly refresh
- [ ] Security maintenance note: keep gates, get_advisors after schema changes, no new sweeps

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
