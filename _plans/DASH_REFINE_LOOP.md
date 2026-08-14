# DASH_REFINE_LOOP , dashboard + design system refine + full backend sweep (owner 2026-07-04)

> Owner ask (voice, verbatim gist): orchestrate as a LOOP, phase by phase (NOT all at once, machine perf degrades). Sweep the dashboard + design system; think HOW to refine them so the store (salon owner) instantly gets it; keep the dashboard SIMPLE, not complicated; make mockups. Gap-analyze: what we need, what already exists, what features to add or NOT. Frontend direction via LLM council + subagent council. Sweep backends for security flaws, bugs, gaps, hardcoded stuff. Overall performance/speed. Harden the context/compaction hook ("when you compress the context you forget everything").

## Relation to existing workstreams (exists-check, rule 12)
- **EXTENDS [SWEEP.md](SWEEP.md)** (customer-facing sweep, same triage rules). SWEEP explicitly EXCLUDED dashboard/admin/onboarding; this loop covers that complement. Reuse its triage rules verbatim: auto-fix backend/logic in council-reviewed loop; mockup+PARK all frontend visual; park directional decisions.
- **FOLDS IN [BUG_HUNT.md](BUG_HUNT.md)** unstarted passes (onboarding + admin) into Phase 3.
- Dashboard design law already exists: Aurora skin (project_dashboard_aurora_design), sidebar hybrid rail (project_dashboard_sidebar_hybrid), category dashboards built (DASHBOARD_NEXT_PLAN.md), rebuild spec (DASHBOARD_REBUILD_DECISIONS.md). Ground Phase 1+2 in those, do NOT re-mock settled surfaces.

## Loop mechanics
- ONE phase per loop iteration (owner: machine performance). Workflow fan-out capped ~5 agents, sonnet/haiku tiers only (no opus, gate-enforced).
- Each phase ends: findings/commits + update this file's Live context + ScheduleWakeup fallback.
- Stop condition: all phases closed, or 2 consecutive re-sweep passes add 0 new items (SWEEP convention).

## Phase 0 , meta: plan + context-hook hardening (THIS TURN)
- [x] P0.1 plan file created + ACTIVE.md index row added
- [x] P0.2 PreCompact snapshot hook built (`~/.claude/hooks/pre-compact-context-snapshot.py`): auto-writes `_plans/CONTEXT_SNAPSHOT.md` (git state + ACTIVE rows + open boxes + Live context sections) BEFORE compaction
- [x] P0.3 `plan-active-sessionstart.py` extended: injects the fresh snapshot alongside ACTIVE.md after compaction/startup
- [x] P0.4 both hooks self-tested (one should-fire case + one should-not-fire case each, rule 12.5)
- [x] P0.5 wired into global settings.json (PreCompact event)
- [x] P0.6 committed (plans in project repo; hooks in ~/.claude repo if it is one)

## Phase 1 , discovery: dashboard + design system (read-only, parallel OK)
- [x] P1.1 dashboard surface inventory DELIVERED (re-run wf_506d5ef3-eac, 50 findings)
  - [x] P1.1a all 45 pages enumerated with purpose/audience/state (9 built pages nav-invisible incl earnings + reviews; nail-admin wrongly admin-gated in middleware)
  - [x] P1.1b live NAV MAP (RAIL_NAV 14 + ADMIN_NAV 15; OWNER_NAV_GROUPS + categoryNavGroups computed-but-dead; STAFF_NAV mobile-only)
  - [x] P1.1c API orphans (9 dead endpoints: dashboard/batch, dashboard/today + 7 admin APIs with no UI)
- [x] P1.2 simplicity audit DELIVERED (9 findings: 4 dead nav definitions, 5 unreachable built pages, 13-tab settings monolith, jargon labels, middleware allowlist holes)
- [x] P1.3 design system state audit DELIVERED (10 findings)
  - [x] P1.3a drift vs LOCKFILE section 12 (real law; "Aurora" absent from main , see finding #0: stranded branch)
  - [x] P1.3b registry-state adoption measured (11/45 pages primitives; 20/25 empty + 21/45 loading hand-rolled)
  - [x] P1.3c cross-page consistency (radius 12 vs locked 20; AV_GRADS copy-pasted 4x; 3 loading idioms)
- [x] P1.4 feature gap analysis DELIVERED (12 findings + critic's 8: walk-in policy settings missing, staff perms write-only, calendar unusable on phone, locale-hardcoded signup redirect; do-NOT-add list from REMOVED.md)
- [x] P1.5 synthesized into `_plans/DASH_REFINE_FINDINGS.md` (39 findings ranked + finding #0)
  - [x] P1.5b inventory re-run merged into findings doc (now 89 findings total) , PHASE 1 CLOSED

## Phase 3 (PULLED FORWARD , P2 blocked on D1) , backend sweep: dashboard/admin/onboarding APIs + cross-cutting , DONE (wf_ec6c6a75-61d)
- [x] P3.1 security sweep DELIVERED (12 security findings; 6 critical authz/redirect, verified: 5 real + vouchers out-of-scope; 1 RLS claim was a false positive)
- [x] P3.2 bug sweep DELIVERED
  - [x] P3.2a dashboard/admin API bugs (commission salon_id 400, is_suspended no-op, last-minute-settings phantom salons.user_id)
  - [x] P3.2b onboarding pass folded in (auth/callback redirect, verify-phone brute-force, signup locale, cron auth)
  - [x] P3.2c admin pass folded in (badge routes no audit/ratelimit, notify-new-salon unauth, requireAdmin bypassed by 49/50 routes)
- [x] P3.3 hardcode sweep DELIVERED (go-live German errors, seed-salon hardcoded coords/URLs, partial API-key leak in check-ai)
- [x] P3.4 gaps sweep DELIVERED (19 gap findings: SSRF guard missing systemically, rate-limit/audit coverage holes, storage bucket no policy)
- [x] P3.5 triaged into fix batches F3/F4/F6/F7/F8 below; 2 decisions parked (D4 vouchers, D5 is_suspended)

## Phase 2 , design refinement direction + mockups (single-threaded frontend; BLOCKED on decision D1)
- [~] P2.1 LLM council (external models) , DEFERRED on D1 (external LLM council belongs with the pixel mockups, built on the real skin)
- [x] P2.2 SUBAGENT council DONE , `_plans/DASH_REFINE_DIRECTION.md` (3 directions: The Six / Consolidate / Task-Day-First; rec = Task/Day-First C>B>A). wf wtytpqfi5.
- [~] P2.3 pixel mockups (3+ variations, copy-of-real-page) , DEFERRED on D1 (must be built on the real skin; targets named per direction in DASH_REFINE_DIRECTION.md)
- [~] P2.4 PARK for owner , DIRECTION parked (pick C/B/A + answer D1); mockups follow once D1 + direction are chosen

## Phase 4 , performance/speed (measure-first)
- [x] P4.1 baseline numbers DELIVERED (dev :3000, test salon 97c04291-fe61...)
  - [x] P4.1a page + API warm timings captured (p4-measure.sh)
  - [x] P4.1b payload sizes captured; home = 5-fetch waterfall identified
- [x] P4.2 ranked -> F10 fix batch (home waterfall HIGH, analytics-salon MED, dead today-route, bookings date-validation LOW)

## Phase 5 , fix loop + close
- [ ] P5.1 work the fix queue via layered loop
  - [x] P5.1a coder dispatched per batch F6/F7/F8/F9/F10+F2 (never hand-coded, except 1 reviewer-caught 2-line introduced-bug fix)
  - [x] P5.1b loop-reviewer PASS on every batch (F6 r1, F7+F8 r1, F9 r2, F10+F2 r1)
  - [x] P5.1c each verified chunk committed (34167aa44, f8f39e37c, c3d6db133, aa4631e8f, 17f446712); backend fixes reviewer-graded
- [x] P5.2 regression check: final full-repo tsc = only 2 pre-existing discovery errors (none from F6-F10); each batch reviewer-PASS + committed. (Live E2E of worktree fixes needs a dedicated server , noted.)
- [x] P5.3 CLOSE , re-read owner original; DONE = P0/P1/P3/P4 + F6-F10 committed + direction council; DEFERRED-on-D1 = pixel mockups + external LLM council + F1 nav + D7 home-perf + F5 DS-drift; decisions D1-D7 surfaced.

## P5 security fix batches (from P3, dispatched security-first , live exposure jumps the perf phase)
- **F6 [DONE, commit 34167aa44] , IDOR authz (CRITICAL):** add the ownership/admin check (copy the sibling handler's block) to: dashboard/barber-leaderboard GET, dashboard/walkin-analytics GET, dashboard/clients/[id]/notes GET, dashboard/clients/[id]/tags GET, dashboard/spa/treatment-outcomes POST (+ zod), dashboard/nail/ai-history PATCH. Verify via discriminate: caller with a salon they DON'T own -> 403.
- **F7 [DONE, commit f8f39e37c] , auth hardening:** auth/callback , also reject backslash + normalize before the `//` check; verify-phone send+check , add zod + per-phone lockout + fail-CLOSED when Redis down; notify-new-salon , add admin gate or delete (orphan).
- **F8 [DONE, commit f8f39e37c] , money/bug fixes:** commission PUT , drop vestigial salon_id from schema (unbreaks save); last-minute-settings , fix phantom salons.user_id -> owner_id; badge routes , add applyRateLimit + audit.
- **F9 [SSRF DONE c3d6db133; F10 cleanup DONE aa4631e8f] , SSRF guard util + wire into ai-vision/tiktok-embed/discovery-thumb/nail-generate; requireAdmin() adoption across 49 hand-rolled admin routes.

## Parked / decisions for owner
- **D4 (security, needs scope call): vouchers/create|confirm|validate have ZERO auth** , POST creates a Stripe coupon + PaymentIntent with customerId from the body. Real + live (vouchers ON per memory). OUT of my declared P3 scope (customer money route). Fix = add session auth + verify customerId == session user. Confirm you want me to patch it (adding auth could reject an intentionally pre-auth purchase flow , I need to trace the caller first).
- **D5 (behavior call): admin "suspend user" is a silent no-op** , writes is_suspended (read by nothing); the enforced ban field is banned_at. Fixing it to write banned_at makes "suspend" actually ban users (a real behavior change). Want suspend wired to real enforcement, or is the button vestigial and should be removed?
- **D1 (BLOCKS P2): recover Aurora V2?** The approved dashboard skin (32 commits, Phases 1-7) is stranded on `claude/bold-hellman-b31513`, never merged; main moved 252 commits since. My rec: merge it (~4 real code conflicts, dry-run verified), then re-audit drift + build P2 mockups on that baseline. Alternative: stay on main-state and re-skin fresh (wasteful). Full evidence: DASH_REFINE_FINDINGS.md finding #0. `claude/crazy-bose-57e405` (older blue sweep) also stranded but superseded.
- D2: walk-in queue policy settings surface (add in P5 or design in P2?) , customer-facing behavior currently driven by hardcoded defaults.
- D3: 13-tab Settings monolith split , needs a structure mockup (P2), flagging early since it is the biggest simplicity lever the sweep found.
- **D6 (cleanup, risky): dedup 49 hand-rolled admin auth checks onto lib/auth/require.ts requireAdmin()?** Behavior already correct; a 49-auth-critical-file refactor is high risk, low urgency. Do it (carefully, batched) or leave as debt? Also fold F6's 6 inline owner-checks into a new requireSalonOwnerOrAdmin helper. PARKED (not auto-doing a risky refactor of correct code).
- **D7 (perf, tied to D1): dashboard home fetch refactor.** CORRECTED: home is 1 sequential (profile) + 4 PARALLEL (Promise.all), ~1.1s , NOT the auditor's claimed 5-way ~2s waterfall. Modest remaining win: server-component SSR or wire /api/dashboard/batch. DEFERRED because page.tsx is a D1 merge-conflict file , do it on the merged baseline, not now.

## Live context (updated every phase; PreCompact snapshot carries this across compaction)
- 2026-07-04 iter 1: Phase 0 DONE (PreCompact snapshot hook + SessionStart injection, self-tested, wired; commit aa64a5ac6).
- 2026-07-04 iter 2: Phase 1 findings landed , 39 findings in `_plans/DASH_REFINE_FINDINGS.md` (wf_e31e8fcd-59b; inventory lens returned junk, re-run wf_506d5ef3-eac IN FLIGHT , merge its results on return, tick P1.1/P1.5b). **Finding #0 verified by me: Aurora V2 skin stranded on `claude/bold-hellman-b31513` (32 commits, never merged, main +252 since; merge dry-run = 4 real code conflicts). Owner decision D1 parked; P2 blocked on it; P3 (backend sweep) pulled forward as the next iteration.**
- 2026-07-04 iter 3: Phase 1 CLOSED , inventory re-run merged (89 findings total, commit c7510bcfd). **P3 backend sweep LAUNCHED: wf_ec6c6a75-61d, 6 read-only sonnet shards (money / admin-moderation / admin-content / dashboard-api / salon-api / auth-onboarding) over 99 route.ts files + middleware, each doing security+bug+hardcode+gap, then a cross-cutting service-role/ratelimit/i18n critic.** On return: triage into fix queue (`_plans/DASH_REFINE_FINDINGS.md` P3 section), tick P3.*, then P4 perf.
- Next iteration: triage P3 findings; any CRITICAL security (service-role IDOR, self-assign role, unauth cron/refund) = surface to owner with repro BEFORE patching (fable-backend section 4), do not auto-fix silently. Then P4 performance measure-first.
- 2026-07-04 iter 4 (owner "ok"): P3 confirmed live + nearly done (6 shards posted results, critic running 11:55). Did single-threaded prep during the wait (no machine load, respects one-phase-at-a-time): (1) P1 verification log , dropped 1 false positive (nav.gallery present in all 4 locales), confirmed 3 (Produkte h1, dead nav arrays, nail-admin middleware mis-gate), deferred 1 (revenue phantom column , locate in P3); (2) P5 fix-batch draft (F1-F5) in findings doc; (3) P4 harness `_plans/scripts/p4-measure.sh` (endpoints match home's real fetches). Commits 9d82da3ea, e7260beed.
- 2026-07-04 iter 5: P3 LANDED (45 findings, 9 critical). Verified criticals myself: 5 real (barber-leaderboard/walkin-analytics/clients-notes/spa-outcomes IDOR + auth/callback redirect), 1 real-but-out-of-scope (vouchers zero-auth -> D4), 2 real bugs (commission 400, is_suspended no-op -> D5), 1 FALSE POSITIVE (bookings RLS is correct , confirmed via live pg_policies). Findings + verification table in DASH_REFINE_FINDINGS.md. Batches F6/F7/F8/F9 defined. NOW dispatching F6+F7+F8 security fixes via layered loop (security jumps ahead of P4 perf , live exposure). D4/D5 parked for owner (scope/behavior calls).
- 2026-07-04 iter 6 (owner "shell failed or not" = status check): F6 PASSED r1 + tsc clean + COMMITTED (34167aa44), all 6 IDOR closed. Reviewer noted dup debt vs lib/auth/require.ts -> folded into F9. NOW F7+F8 dispatched (w8ej2wkew): auth/callback backslash redirect, verify-phone zod+fail-closed, notify-new-salon admin gate, commission salon_id->optional, last-minute-settings user_id->owner_id, badge routes ratelimit+audit. All 6 fixes confirmed real against live snapshot/pg_policies before dispatch.
- 2026-07-04 iter 7: F7+F8 PASSED r1 + COMMITTED (f8f39e37c), incl a reviewer-caught INTRODUCED bug I hand-fixed (auto-assign cron actorId string 'cron' -> null; audit_log.actor_id is a uuid FK, string failed every cron insert + paged admin). P4 perf DONE + committed (c1a94fac4): dashboard home 5-fetch waterfall = top win (the orphan /api/dashboard/batch was built to fix exactly this), analytics-salon 0.6s warm, bookings 500-on-bad-date LOW bug. NOW F9-SSRF dispatched (wth34k88b): new lib/net/ssrf.ts guard (self-test before wiring per rule 12.5) wired into ai-vision + tiktok-embed. Parked D6 (49-file requireAdmin refactor).
- 2026-07-04 iter 8: F9-SSRF PASSED r2 (reviewer caught IPv6 :: gap r1, fixed r2) + COMMITTED (c3d6db133); lib/net/ssrf.ts wired into ai-vision + tiktok-embed. INVESTIGATED the P4 "home waterfall" claim before fixing (rule 11): it is FALSE , home is 1 seq + 4 parallel (~1.1s), not 5-sequential. Corrected the finding, deferred the home refactor to D7 (page.tsx is a D1 conflict file). KEY SEQUENCING: F1 (dead nav) + home refactor both touch DashboardLayout.tsx/page.tsx = D1 merge-conflict files -> deferred to post-D1 to avoid wasted/conflicting work. NOW dispatched the D1-INDEPENDENT cleanup (w7qeua44l): delete dead today-route+TodayLiveCard+DashboardHeaderStrip (+REMOVED line), bookings date->400 validation, Produkte h1 i18n.
- 2026-07-04 iter 9: F10+F2 cleanup PASSED r1 + COMMITTED (aa4631e8f); inventory regen committed (17f446712); final full-repo tsc = only 2 pre-existing discovery errors (untouched). P5.1 fix-loop CLOSED (F6/F7/F8/F9/F10+F2 all reviewer-PASS + committed). Backend security/bug/hardcode/gap sweep + perf = COMPLETE. NOW running the SUBAGENT COUNCIL on dashboard-simplification DIRECTION (wtytpqfi5): 3 directions (aggressive-cut / consolidate-merge / task-first) + synthesis, grounded in P1 findings. This serves the owner ask "think how to refine + subagent council" WITHOUT building skin-dependent mockups (those + the external LLM council stay deferred to post-D1). On return: write _plans/DASH_REFINE_DIRECTION.md, then P5.3 CLOSE.
- 2026-07-04 iter 10 CLOSE: subagent simplification council DONE -> _plans/DASH_REFINE_DIRECTION.md (3 directions, rec Task/Day-First C>B>A). All autonomous phases closed (P0/P1/P3/P4 + F6-F10 committed + P2 subagent council). LOOP STOPS HERE , genuine convergence on owner decision D1. Remaining work (pixel mockups, external LLM council, F1 nav, D7 home-perf, F5 DS-drift) is all D1-gated. Commits this run: aa64a5ac6 c7510bcfd afba4d23c 34167aa44 f8f39e37c c3d6db133 aa4631e8f 17f446712 2fdba4490 (+ plan commits).
- CONVERGENCE: after this cleanup batch, the remaining substantial work (P2 mockups, F1 nav cleanup, D7 home perf, F5 DS drift) is ALL gated on owner decision D1 (merge stranded Aurora branch). Backend security/bug/perf sweep is essentially COMPLETE. Close approaching , will surface the D1-blocked remainder + all parked decisions (D1-D7) at P5.3.
- REMAINING after F9: F10 (wire home to /api/dashboard/batch to kill the waterfall + delete dead today-route & 2 unmounted components + bookings date zod), F1 (remove dead nav arrays OWNER_NAV_GROUPS/categoryNavGroups), F2 (Produkte h1 i18n). Then re-sweep 2 clean passes -> P5.3 close vs owner's original message. P2 (mockups) still blocked on D1.
- Scale facts: dashboard = 45 pages, 74 dashboard/admin routes. Stale memory pointers corrected: DASHBOARD_NEXT_PLAN.md, AURORA_DIFFERENTIATION_SYSTEM.md etc. gone; live refs = _design-system/_dashboard-triage.md, _tasks/DASHBOARD_CARE_AUDIT.md, LOCKFILE.md section 12 (real dashboard skin law on main).
