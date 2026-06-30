# SWEEP , customer-facing health + improvement loop (owner 2026-06-30)

> Autonomous program. Owner: "run full bug + frontend + code health + speed + storage + efficiency + overall improvements; more morphing + animation everywhere (find all, mockup); phase-by-phase plan, auto-loop; park only big directional/high decisions; PARK ALL FRONTEND." Then: "only customer facing side."

## Scope
CUSTOMER-FACING ONLY , the consumer app + the APIs it calls. **EXCLUDE** salon dashboard (`/dashboard/**`, `/api/dashboard|salon-owner`), admin (`/admin/**`, `/api/admin`), salon onboarding.
Customer surface = home, `/{city}/{category}` search, `/salon/{slug}` PDP + booking + reviews, `/inspo`, account/profile/favorites, `/notifications`, walk-in/queue, + their APIs (`/api/salons`, `/reviews`, `/bookings`, `/availability`, `/discovery`, `/notifications`, `/profile`, `/favorites`, `/walkin`, `/promo`, ...).

## Triage rules (what auto-fixes vs parks)
- **AUTO-FIX** in a council-reviewed loop, commit each chunk: functional/logic BUGS, code health (dead code, dup, swallowed errors, convention), perf/SPEED (N+1, missing parallelism, over-fetch, slow endpoints, caching), STORAGE / data-model EFFICIENCY (select-shape, redundant reads, pagination, indexes). Backend + frontend-LOGIC.
- **MOCKUP + PARK** (never auto-apply): ALL frontend VISUAL/design, + MORPHING, + animations/smoothness. One coherent pass, owner approves. (feedback_no_parallel_agents_frontend + mockup-first.)
- **PARK for owner**: big directional changes / high decisions.
- Council per backend fix. Loop a phase until clean. Stop the program when 2 consecutive full passes add 0 new items.

## Phases
- **P1 DISCOVERY** (parallel read-only audit, customer-facing) , lenses: (a) functional bugs, (b) code health, (c) perf/speed, (d) storage/data-efficiency, (e) design/visual issues [mockup], (f) morph + animation opportunities [mockup]. Output = categorized backlog: `{area, title, file:line, severity, type: fix|mockup|decision, detail}`.
- **P2 FIX LOOP** (auto) , work the `fix` items (coder + council, commit each), batched by area. Re-discover; loop until clean.
- **P3 MOCKUP BACKLOG** (frontend) , build mockups for `mockup` items (design + morph/animation), one coherent pass, PARK for owner approval. NEVER auto-apply.
- **P4 DECISIONS** , list parked directional items for owner.

## Status
- P0 done: review-form committed. P1 done: discovery , 40 fix / 30 mockup (`_plans/SWEEP_BACKLOG.md`).
- P2 batch 1 DONE + committed (6 groups, behavior-verified via tsc + curl): salons-route (col-trim no-leak + Promise.all + slot-RPC + with_slots cap), pdp (3x-fetch dedupe + is_hidden filter + col-trim), inspo (5 RPCs -> 1 /api/discovery/category-meta; DISCOVERY_CATEGORIES extracted to lib/discovery-categories so the route drops the client-import + edge), availability (single scan), quick (bookings/user pagination, express-rebook Zurich tz, profile/live-state real cols, reviews/eligibility 22P02, SalonResultCard memo), dead-code (4 deletions + REMOVED). Council true-review running on the data-logic files.
  - LESSON: the fix-workflow's loop-reviewers read the WORKTREE not MAIN -> false-negative verdicts; I verified MAIN myself (tsc + curl). Point batch-2 reviewers at MAIN abs paths.
  - batch 2 DONE + committed: promo charge fix (discount now applied to the Stripe charge; re-validated server-side, subtracted before fee, idempotent webhook increment via increment_promo_use RPC; migration bookings.promo_code + RPC APPLIED LIVE + verified col/rpc exist), share-dedup (lib/share.ts + 6 consumers), date-dedup (lib/format locale-aware + 3 consumers, fixes FR/IT German weekdays). Verified: tsc clean, home/PDP/search render 200, pay-intent 400-not-500. Money-path council running.
  - FOLLOW: refresh inventory snapshot for bookings.promo_code (live, snapshot stale).
  - MONEY-PATH COUNCIL applied: FIXED security (promo .ilike -> .eq(upper) in 3 routes + charset , kills LIKE-wildcard injection + secret-code redemption; verified real matches, wildcard does not) + remaining_at_salon discounted-gross. Committed.
  - **KEY FINDING , promo is DORMANT until a FE input exists**: the booking wizard has NO promo-code field (formData.promoCode always ''), so booking.promo_code is always null and the (now correct + secure) discount never runs. The promo INPUT is FRONTEND -> PARKED as a mockup. Backend is ready + secure; the feature goes live only once the FE input lands.
  - PARKED (backend follow): extract the duplicated promo-validation (booking-pay-intent + /api/promo/validate share 8 checks) into lib/promo/validate-code (dedup, council HIGH).
  - PARKED (i18n-copy, owner): German strings in booking-pay-intent error + lib/format time unit.
  - batch 3 DONE + committed: search-perf (favorites-prefetch guard + stable walk-in dep), parallelize (live-state Promise.allSettled, PDP-reviews bound+hidden-filter, unavailable-dates Zurich days), pdp-cleanup (lazy SalonVenuesNearby, CategoryBrowseRails dedup, formatPrice, dead StatusPill deleted). Verified pages 200 + tsc clean.
  - Cleanup: 36 macOS sync-junk route dirs removed (untracked).

## P2 FIX LOOP , COMPLETE (2026-06-30)
All customer-facing fix items shipped + verified + committed across batches 1-3 + 3 councils (bugs, perf, storage, code-health, money/promo, security). SKIPPED as marginal/auth-sensitive (parked): edge getSession() round-trip (auth-sensitive), PayConfirmStep `as any` (cosmetic), PhotoGallery empty-catch (chat is OFF). 2 DECISIONS parked (gender + deals = data). i18n-copy parked for owner.

## P3 , MOCKUPS (next, frontend , one coherent pass, mockup-first, owner approval)
Owner's emphasized ask: "more morphing + animation everywhere, find all, make mockups." Build from the 30 `mockup` items in SWEEP_BACKLOG.md + the MOTION lens inventory, PLUS the two functional-but-frontend pieces the fix loop surfaced: the **promo-code input** in the booking wizard (unlocks the live promo discount) + a **Load-more** on BookingsList. NEVER auto-applied , shown for approval.

## Backlog
Full categorized list: `_plans/SWEEP_BACKLOG.md` (40 fix, 30 mockup).

## Parked , frontend mockups (owner approval)
All 30 `mockup` items in `_plans/SWEEP_BACKLOG.md` (design + motion). Built one coherent pass in P3, NEVER auto-applied.

## Parked , decisions (owner)
- **Gender filter dead** (`/api/salons` suitable_gender): every active service is tagged BOTH genders, so "Fuer wen" never narrows results. Seed realistic per-service gender, or hide the control? (data, not code.)
- **Deals/Angebote always empty** (`/api/salons` last_minute_discount_percent): 0 salons have a discount, so the deals pill + rail + sort are permanently empty. Seed real discounts, or hide until data exists? (data, not code.)

## Batch-1 council (true review on MAIN) , triaged 2026-06-30
- FIXED (real regressions from batch 1): bookings/user , raised cap 20->100 (no silent history loss) + `page=` NaN guard (committed).
- PARKED mockup (frontend): "Load more" UI on BookingsList past/cancelled (wire the `hasMore` the API already returns).
- PARKED i18n-copy (owner): profile/live-state German response strings; express-rebook suggested-label LOCALE (the tz BUG is fixed; locale-polish deferred); PDP SEO metadata hardcodes "Basel" city + `solen.ch` domain (should use city_id lookup + an env URL).
- OUT-OF-SCOPE (salon onboarding, pre-existing , NOT this customer sweep): `app/api/salons` POST handler `[FIX]` hardcodes (quartier='grossbasel', Basel coord fallback, schema-bypass TODOs). Flag for an onboarding pass.

## Folds in
ACTIVE.md customer bug items (onboarding + admin dropped per the customer-only scope).
