# Search + Map overhaul (owner 2026-07-02, big batch) , PLAN FIRST, council + mockups, orchestrator

> Owner: "make a plan first, research as the LLM council, write it down, you're the orchestrator (not the coder)." Ultracode ON. Each design item -> council + MULTIPLE mockups. Functional items -> investigate + fix. Nothing implemented before the plan + council.

## A. DESIGN , need COUNCIL + MOCKUPS (multiple directions each)
- [ ] A1. FILTER MENUS (inside FilterSheet): all the filter sections "look ass", renew everything. Council on the redesign; mockups for EACH menu (Sort / Availability / Rating / Price / For-whom / Amenities / Deals). 3+ directions.
- [ ] A2. CATEGORY SYSTEM: owner still doesn't understand how categories work (recurring). VISUALIZE how it should work + the options (ways to do it). Council + mockups. (relates to search flow /dev/search-flow.)
- [ ] A3. STORE CARD ASPECT RATIO: ditch SQUARE. Council/mockup on the photo aspect ratio for the store cards (and where squares still exist , homepage SalonCard?). Mockup + change.
- [ ] A4. SPECIALIZATION CHIP SYSTEM: a chip ON the card PHOTO (frosted / liquid glass) marking "specialized for X" (e.g. black hair, a specialist). Design the SYSTEM + how to integrate (data -> chip). Council + mockup.
- [ ] A5. BUNDLES / PRODUCTS (Fresha-style): products + bundle/price-up per store. Big: backend + dashboard + card surface. Research Fresha pattern + Solen backend scope. Council + plan + (owner decides if in-scope now). Be thorough.

## B. FUNCTIONAL , investigate + fix (some may need a small mockup)
- [ ] B1. COUNT copy too long (de + en): "N Orte in diesem Bereich" -> shorter (e.g. "N Orte"/"N places"). And REMOVE the separation line near the count (the count alone is enough).
- [ ] B2. CITY-SEARCH LOCK: after searching a city, the map is "locked" , can't zoom out past it / explore beyond. Don't lock the viewport to the city; allow free zoom/pan (this pairs with the new auto-update).
- [ ] B3. AUTO-SELECT CITY from a street/place search: searching a street -> auto-select its city.
- [ ] B4. PERF: everything feels slow (maybe cloudflare tunnel, maybe real). Investigate (local vs tunnel; bundle; re-renders).
- [ ] B5. FOCUS RINGS (RECURRING, owner FURIOUS): rings on HOVER on the homepage + the map icon in the search bar. Eliminate ALL; replace with something else. INVESTIGATE the source (the no-focus-ring-gate blocks NEW rings but these persist , find where they render). HARDEN.
- [ ] B6. SCROLL MORPH (category pages, normal search): the search bar "goes up / disappears" on scroll-down then "snaps" on scroll-up , weird, not a real morph. Improve the morphing BOTH directions (smooth disappear + smooth return, not a snap).

## C. META / HARDEN
- [ ] C1. HOOK: ALWAYS make a plan first for BIG tasks (not small). Owner: "make a hook about that, maybe you have it." -> CHECK plan-first-gate/plan-first-stamp; confirm/strengthen; report.
- [ ] C2. Orchestrator, not coder (standing). Use Workflow (ultracode).

## Sequencing (orchestrator)
1. PLAN (this doc). 2. Confirm C1 hook. 3. COUNCIL WORKFLOW: research A1-A5 + investigate B1-B6 in parallel -> structured directions + fix diagnoses. 4. Build MOCKUPS (multiple) for A1-A4 + B1/B6 from the synthesis. 5. Apply clear functional fixes (B1, B5 focus rings, B2/B3) with verification. 6. A5 bundles = plan + owner decision.

## COUNCIL SYNTHESIS (workflow w0bavxo93, 12 agents) , directions locked
WAVE 1 (functional, no mockup): B5 focus rings (35 tsx files carry focus-visible:outline-* utilities that out-spec the global outline:none; sweep + non-ring cue + harden gate to DETECT) ; B1 count (shorten + delete the hairline) ; B2 city-lock (RE-DIAGNOSE: research stale, my auto-update already landed) ; B3 auto-city (bug half = SearchOverlay city display-name vs slug mismatch, quick; street->city resolver = net-new, defer).
WAVE 2: B4 perf (REAL not tunnel: generateEmbedding blocks every text search +0.4-1.3s @ api/salons/route.ts; with_slots 3rd wave , race embedding w/ 400-600ms timeout + defer with_slots) ; B6 scroll morph (boolean `scrolled` + max-height transition = layout thrash/snap; -> continuous scrollY-bound transform+opacity, one listener; needs before/after mockup).
WAVE 3 (mockups, owner approves): A1 /dev/filter-sheet (Direction A: control-language-per-filter-type , segmented for single-select, checklist rows for amenities, Switch for Deals, keep gray-sunken locked); A2 /dev/category-flow (Model B: segmented category param decoupled from free-text ?q=; 3 frames TODAY/B/C); A3 /dev/card-ratio (3/2 for large cards incl homepage SalonCard, keep list/suggest thumbs square; before/after); A4 /dev/spec-chip (frosted match chip on photo, client-side match vs services+staff.specialties, never fabricated; AFTER A3).
WAVE 4: A5 bundles/products = OWNER DECISION (packages GRAVEYARD; retail_products backend already exists; ask: retail vs service-tiers? tab vs inline card? un-kill packages?). Do NOT start on a guess.
