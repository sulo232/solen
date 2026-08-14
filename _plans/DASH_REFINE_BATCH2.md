# DASH_REFINE_BATCH2 , owner greenlight batch (2026-07-04)

> Owner message (verbatim): "show me variations for design system directions and i wanna see whats gnna look like if we bring customer facing design system into dashboard and also D4 go do it D5 check how othr platform does it and go w it and D1 show me direction D2 fix that D6 do that aftr ur done w evrth D7 hmm idk u can choose but no short cuts"

## Atomized asks

### VISUAL , mockups first (the headline; mockup-first, no code-apply before approval)
- [~] V1. Show 3+ DESIGN-SYSTEM variations applied to a REAL dashboard surface (copy-of-real-page, treatment-only, side-by-side, clickable, tunnel link). Lead with a recommendation.
  - [x] V1a. Variation "Aurora" = the rich operator skin (D1: "show me direction") , recover its treatment from branch claude/bold-hellman-b31513 (tinted field, shadow-aurora, azure, glows).
  - [x] V1b. Variation "Customer DS in dashboard" = bring the customer-facing B&W restraint DS into the dashboard (white + cool sunken #F4F4F5, ink #0A0A0A, sparse blue #276EF1, ink CTA, hairlines). Owner explicitly asked to SEE this.
  - [x] V1c. Variation 3 = a distinct third direction (e.g. hybrid: customer-DS surfaces + one operator accent for data density). Genuinely different, not a tweak.
  - [x] V1d. Ground every token in a real source (LOCKFILE customer DS + the Aurora branch tokens); no invented hex/sizes.
  - [~] V1e. Delivered: served + cloudflare tunnel, rendered+measured+screenshot-verified. PARKED for owner pick (A/B/C). Tunnel: sail-surf-pontiac-parliamentary.trycloudflare.com

### BACKEND / FIX (greenlit, "no shortcuts")
- [~] D4. RUNNING (w5p5o6lcc). Traced: create dormant, confirm dead, validate called from checkout + has .ilike wildcard-injection too. Add session auth to /api/vouchers/create|confirm|validate; verify customerId == session user (trace caller first to not break a legit pre-auth flow). Layered loop + council.
- [ ] D5. Suspend user (is_suspended no-op) , RESEARCH how other platforms (Fresha/Square/Booksy/Stripe) do suspend/ban, pick that approach, implement. Wire suspend to real enforcement (banned_at) per the researched pattern. Layered loop.
- [ ] D2. Walk-in queue policy settings , FIX (build the surface). Backend settings + a dashboard UI to set queue-busy threshold / accept-pause / no-show + cancellation policy (currently hardcoded defaults). UI part = mockup-first.
- [~] D7. Home fetch perf , RUNNING. FINDING: /api/dashboard/batch is MISMATCHED (returns bookings_today-count/revenue_month/reviews_pending/walkin_queue/activity_feed; the Aurora home needs analytics/salon-week + staff-comparison + conversations-unread + bookings-list). Can't wire it. No reusable lib query fns exist. CHOICE (no-shortcut, proportionate): server-seeds-client , new lib/dashboard/home-data.ts fetches the 5 things server-side (parallel), page.tsx becomes a thin server component passing initialData to a DashboardHomeClient island that seeds state from props (kills the JS-download->hydrate->mount-fetch client waterfall) while keeping ALL interactivity + Aurora. Measured baseline ~1.1s (already 1-seq+4-parallel, NOT the auditor's claimed 5-way waterfall).
- [ ] D6. requireAdmin() 49-file dedup + requireSalonOwnerOrAdmin helper (fold F6's inline checks) , DO LAST ("aftr ur done w evrth"). Careful batched refactor, behavior-preserving.

## Sequencing (one phase per iteration, machine-perf; no shortcuts)
1. V1 mockups FIRST (headline + mockup-first blocks dashboard skin code). Build, verify, tunnel link, PARK for pick.
2. D4 vouchers (backend, independent, greenlit).
3. D5 suspend (research -> implement).
4. D2 walk-in settings (backend + mockup-first UI).
5. D7 home perf (after DS direction picked, since page.tsx skin may change).
6. D6 requireAdmin refactor LAST.

## Live context
- 2026-07-04 b2-iter1: V1 DELIVERED , 3-skin dashboard mockup (Aurora/Customer-DS/Hybrid, rec C) built on the real dashboard structure (measured live first: rail 64, CTA ink pill), served + cloudflare tunnel (sail-surf-pontiac-parliamentary.trycloudflare.com/_mockups/dash-ds-variations/), commit 87d18b92c. PARKED for owner pick A/B/C. D4 vouchers dispatched (w5p5o6lcc) with per-route brief (create=auth+session-customerId, validate=.ilike->exact + ratelimit, confirm=gate dead route).
- 2026-07-04 b2-iter5: AURORA SKIN COMPLETE , all 32 dashboard pages ported forward (AUR-1..7), s-coral fully swept (0 remain), SetupBanner azure, live-verified (home/earnings/settings match mockup A). Fixed a pre-existing 500 (salon-detail review_replies non-array, 5f88ed1a1) that broke settings+PDP. D8 (blue-vs-gray selected states) + D9 (home KPI font-display) parked for owner. NEXT: D7 home-perf (my choice, no shortcuts), D5 suspend (research+implement), D2 walk-in settings, D6 requireAdmin LAST.
- 2026-07-04 b2-iter4: AUR-4 + AUR-5 committed + spot-verified (SetupBanner azure bar confirmed; earnings page Aurora confirmed). 16 dashboard surfaces done. AUR-6 (final 16 pages) dispatched (w6ggs83bw). Reviewer note: home KPI tiles lack font-display vs other pages (AUR-3 bespoke tile) , consider aligning at AUR-close. After AUR-6: AUR-close (drift-check + design-verify + refreshed tunnel), then D5/D2/D7/D6.
- 2026-07-04 b2-iter3: AUR-2/3 committed + LIVE-VERIFIED (my screenshot: field #F5F7FA, azure nav+CTA, 4 semantic KPI discs, gradient chart , matches mockup A). Live Aurora dashboard tunnel: quad-gras-villas-soccer.trycloudflare.com/api/dev/login?to=/de/dashboard (worktree served on 3030, symlinks present). AUR-4 dispatched (wg6ndx02t): SetupBanner (black bar->azure, caps->sentence, s-coral cleanup) + calendar/bookings/clients/services/staff. All 6 = main==MB clean ports.
- 2026-07-04 b2-iter2: owner picked AURORA. Chose PORT-FORWARD not merge (branch bundles onboarding-v2 + migration + stale routes that would revert F6-F10). AUR-1 foundation ported clean (tailwind+DashboardUI, main==merge-base, tsc clean, commit 7721dbeaf). D4 vouchers PASSED+committed (2d5b06dc3). AUR-2 shell + AUR-3 home dispatched (wbw1ww6ey) , forward-port preserving motion/react + main nav, active-nav=light azure tint per mockup A. NEXT: verify+commit AUR-2/3, SET UP SERVING (symlink node_modules+.env.local from /Users/sulo/Documents/solen) to render + design-verify Aurora home vs mockup variant A, then AUR-4+ (31 remaining page surfaces, batched), then D5/D2/D7/D6.
- OLD NEXT: D4 verify+commit -> D5 (research suspend/ban across platforms, then implement) -> D2 (walk-in settings: backend + mockup-first UI) -> D7 (home perf, my choice, AFTER owner picks skin since page.tsx skin changes) -> D6 (requireAdmin refactor LAST). Owner pick of A/B/C gates the actual dashboard skin build + D7.

## AURORA BUILD (owner picked A , "continue w aurora", 2026-07-04)
Decision: PORT the Aurora skin FORWARD onto current main. NOT a branch merge , the branch `claude/bold-hellman-b31513` bundles Aurora + an unrelated onboarding-v2 feature (+ a DB migration) + stale route files that would revert my F6-F10 security fixes. Port-forward = no regressions, no unrequested scope, no migration.
Key facts (verified 2026-07-04): main is UNCHANGED since merge-base on tailwind.config.js AND DashboardUI.tsx -> those port CLEANLY. globals.css needs nothing (V2 uses tokens). DashboardLayout = manual (keep main nav + add field shell). 32 dashboard page.tsx each have a branch diff = the exact Aurora spec to apply forward.
- [x] AUR-1 foundation DONE (commit 7721dbeaf, tsc clean): port tailwind Aurora tokens (s-dash-field #F5F7FA, rounded-aurora 18px, shadow-aurora, KPI chip colors) + DashboardUI.tsx (shadow-aurora panels, gradient charts) from the branch (clean). Verify tsc + home renders Aurora.
- [x] AUR-2 shell DONE + live-verified (commit 447dc5133): DashboardLayout field-tint (bg-s-dash-field on content shell), MANUAL, keep main's RAIL_NAV. Verify.
- [x] AUR-3 home DONE + live-verified (field/nav/CTA/chips/chart match mockup A). AUR-4+ remaining surfaces: port each of the 32 dashboard page Aurora diffs forward in batches (home, category tools, money, admin), layered loop, design-verify each against mockup variant A.
- [x] AUR-4 DONE + live-verified (commit d50a54490): SetupBanner black bar -> AZURE (confirmed #276EF1) + caps -> sentence + s-coral cleanup; calendar/bookings/clients/services/staff Aurora surfaces. calendar s-coral also swept.
- [x] AUR-5 DONE + spot-verified (commit 984180fc4, earnings page live-checked): barber-ops/coiffeur-crm/nail-admin/spa-admin/earnings/revenue/refunds/upcharge/marketing/loyalty + home eyebrow de-cap (SAMSTAG,4.JULI -> sentence).
- [x] AUR-6 DONE (commit 0173d7ba2): final 16 pages; coder reverted branch's broken bundled GoalsStep import in setup. FULL 32-page dashboard skin ported.
- [x] AUR-7 s-coral sweep DONE + verified (commit 7fde0fd2e, r2): 83 retired-token occurrences swept across 10 files -> context-aware (links->azure, headings->ink, tints->azure-tint, focus->ink). Reviewer r1 caught 4 selected-states wrongly->azure, fixed to gray-sunken; warning banner->s-warning. ZERO s-coral remains dashboard-wide.
- [x] AUR-close DONE: Aurora skin COMPLETE across 32 pages + live-verified (home/earnings/settings/SetupBanner screenshots match mockup A). Found + fixed a PRE-EXISTING 500 (salon-detail review_replies non-array, commit 5f88ed1a1) that broke settings + PDP. Live tunnel: quad-gras-villas-soccer.trycloudflare.com/api/dev/login?to=/de/dashboard.
  - PARKED D8: 16 PRE-EXISTING blue selected-states (category chips, day toggles) violate the gray-sunken contract, BUT the Aurora branch itself used blue selected in places -> taste fork for owner: all gray-sunken (contract) or keep Aurora-blue selected?
  - PARKED D9: home KPI tiles lack font-display vs other Aurora pages (AUR-3 bespoke tile) -> align for consistency? (small)
Reference per page: `git diff $(git merge-base HEAD claude/bold-hellman-b31513) claude/bold-hellman-b31513 -- <page>`.
