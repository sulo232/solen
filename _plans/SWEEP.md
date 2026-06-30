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
- P2 RUNNING: fix loop batch 1 (6 disjoint groups: salons-route, pdp, inspo, dead-code, quick-singletons, availability). Promo/charge fix held for a careful separate pass (money path). Dedup refactors (shared share-block, date-formatter) = batch 2 (shared files).

## Backlog
Full categorized list: `_plans/SWEEP_BACKLOG.md` (40 fix, 30 mockup).

## Parked , frontend mockups (owner approval)
All 30 `mockup` items in `_plans/SWEEP_BACKLOG.md` (design + motion). Built one coherent pass in P3, NEVER auto-applied.

## Parked , decisions (owner)
- **Gender filter dead** (`/api/salons` suitable_gender): every active service is tagged BOTH genders, so "Fuer wen" never narrows results. Seed realistic per-service gender, or hide the control? (data, not code.)
- **Deals/Angebote always empty** (`/api/salons` last_minute_discount_percent): 0 salons have a discount, so the deals pill + rail + sort are permanently empty. Seed real discounts, or hide until data exists? (data, not code.)

## Folds in
ACTIVE.md customer bug items (onboarding + admin dropped per the customer-only scope).
