# Search + Map overhaul (owner 2026-07-02, big batch) , PLAN FIRST, council + mockups, orchestrator

> Owner: "make a plan first, research as the LLM council, write it down, you're the orchestrator (not the coder)." Ultracode ON. Each design item -> council + MULTIPLE mockups. Functional items -> investigate + fix. Nothing implemented before the plan + council.

## FINAL STATUS (2026-07-03) , honest close-out
DONE+committed: A1 (impl+PASS), A3 (V2), A4 (chip live), A5 (bundles+products full), B1 (count), B4-backend (embedding race + N+1 RPC + 9 wins), B5 (focus rings), C1/C2 + hooks.
- [x] B2 city-lock: NO lock code (0 maxBounds/minZoom in MapView) + auto-update landed -> RESOLVED.
- [ ] B6 scroll morph: CONFIRMED still boolean-snap (SearchTemplate.tsx:773 `scrolled` bool + hysteresis). FIXING now (continuous scrollY morph, coder a-pending).
- [ ] B3 geocoder: EXPLAINED to owner (Mapbox Geocoding, we already use Mapbox GL). Awaiting go/no-go. Net-new (default: keep the city-name resolver that's done; add a geocoder later). Owner-optional.
- [ ] B4 frontend load-time audit: owner said YES. Runs after B6+A2 (prod build clobbers .next / the dev server they verify against). Needs a prod build to measure honestly (backend perf done).
- [ ] A2: owner said MAKE MOCKUP (interactive Model B, real bar). Coder dispatches after B6 (frontend serialization). , keep current search bar OR rebuild to segmented-category + separate text field. Backend ambiguity bug already fixed. No safe default (whole-search restructure) -> owner decides.

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

## ROUND 3 (owner voice 2026-07-03) , atomic asks
- [x] R3-A1.sort: KEEP layout, ADD morph/slide animation of the white pill between options (motion, EASE 0.32/0.72/0/1). (Segmented: motion.span layoutId=sortPill-<id>, filter-menus/page.tsx.)
- [x] R3-A1.availability: NOT a sheet , just an inline "Open now" toggle chip (matches real app TOGGLE_PILLS). (InlinePills section, filter-menus/page.tsx.)
- [x] R3-A1.rating: swipeable BAR (discrete slider Any-3.0-3.5-4.0-4.5), not chips. (RatingSheet range over RATING_STOPS, filter-menus/page.tsx.)
- [x] R3-A1.price: APPROVED as-is.
- [x] R3-A1.forwhom: APPROVED as-is.
- [x] R3-A1.amenities: APPROVED as-is.
- [x] R3-A1.deals: NOT a sheet , inline "Deals" toggle button/chip. (InlinePills section, filter-menus/page.tsx.)
- [x] R3-A2: Model B shown IN A FULL-PAGE mockup of the real search page (new /dev route) so it reads in context. (/dev/search-model-b/page.tsx.)
- [x] R3-A4: chip "still not figured out" , root cause: shown on HALF-size 2-col cards. Show on FULL-WIDTH feed card at real size + 3 size variants (S/M/L) to pick. (spec-chip/page.tsx, full-width FeedCard + SizeStrip S/M/L, rec M.)
- [x] R3-A3: homepage stores TOO SMALL after 3/2 , mockup with 3 real-size rail variants: square@current (rollback) / 3/2@bigger / square@bigger. Owner picks; real SalonCard untouched until then. (card-ratio/page.tsx, 3 RailStrips 167sq/250x167/200sq, rec V2.)
- [ ] R3-harden: real-size mockup gate (feed-grammar card inside a 2-col grid = deny) , build, self-test, wire.
- [x] R3-A5: owner wants a MOCKUP instead of a text pick , /dev/bundles-products showing all 3 scopes ON the real PDP anatomy: (A) "Products" section (retail cards, CHF, pick-up-at-visit), (B) "Bundles" section (>=2 services grouped, save-%, Fresha mechanics; FLAG: service_packages graveyarded 2026-06-11, owner-driven exploration only), (C) what already ships (variants + add-ons in booking). Full-width real-size, service-row grammar from SalonServices.tsx. Recommend A (backend mostly exists). DISPATCH SERIALIZED after the round-3 coder (one-coherent-pass rule, no parallel frontend agents). (app/[locale]/dev/bundles-products/page.tsx , 3 options as PDP sections, gray-selected variants, pale −% bundle pill, rec A.)

## ROUND 4 , DONE + design-verifier PASS (agent a64070ce, round 1)
> Committed 0c346e3e4. Verifier measured: sort pill morph (mid-transition captured), rating bar -> ?min_rating=3.5, Apply outline rgb(255,255,255)/border #E4E4E7, cards 245.33x163.55 (1.5005 = 3:2), heart 44x44, chip = FROST_GLASS 12px text-only on exactly the matching salon (0 chips without ?q), compare page structurally identical to live /de/coiffeur. No focus rings (17 controls tabbed), no i18n leaks.

## ROUND 4 (owner voice 2026-07-03 #2) , IMPLEMENT approved, fix inventions
> DONE (coder, 2026-07-03): R4-1..R4-6 all landed + Playwright-verified live (screenshots in
> scratchpad: r4_sheet_sort_before/r4_sheet_sort.png morph proof, r4_sheet_rating.png +
> min_rating=3.5 URL commit proof, r4_sheet_price.png, r4_home_cards.png 245x163.5 (ratio
> 1.500), r4_chip_live.png "Spezialist für Balayage" live on Atelier Haarwerk). staff_members
> specialties embed PROVEN by curl (not services-only fallback). tsc: 0 new errors (4
> pre-existing discovery-backfill errors unchanged).
- [x] R4-1 FILTER SHEETS: APPROVED , IMPLEMENT in the real FilterSheet.tsx (no more mockups).
    - [x] R4-1a sort = segmented track + MORPHING white pill (motion layoutId, no snap).
    - [x] R4-1b rating = swipeable bar (Any-3.0-3.5-4.0-4.5) replacing chips.
    - [x] R4-1c ALL bars/controls morph SMOOTHLY (animated thumb/fill, "don't snap").
    - [x] R4-1d Apply = neutral outline (owner de-blacked; LOCKFILE ink-CTA row amended by owner for filter sheets , logged in TASTE_LOG).
    - [x] R4-1e selected = GRAY in sheets (owner supersedes V3-D450 blue-border here , logged in TASTE_LOG; SheetChip already gray, confirmed unchanged).
    - [x] R4-1f price/for-whom/amenities keep approved treatments (slider / chips / chips, untouched).
- [x] R4-2 CARD SIZE: implement V2 (3/2 at ~250px) in the REAL homepage SalonCard rail ("V2, not V3"). Formula (100vw-44px)/1.5, at 412 = 245.3px card, height 163.5px, ratio 1.500 (3:2). Playwright-verified live on /de (getBoundingClientRect).
- [x] R4-3 SPEC CHIP: M approved, NO CHECK MARK , frosted TEXT-ONLY 12px chip. IMPLEMENT: SalonResultCard feed chip + client-side match vs services + staff_members.specialties (API embed CURL-PROVEN 2026-07-03, e.g. Atelier Haarwerk staff specialty "Balayage"). i18n keys matchChipTerm de/en/fr/it added. BadgeCheck icon variant already graveyarded (REMOVED.md).
- [x] R4-4 A2 COMPARE: rework /dev/search-model-b into CURRENT vs MODEL B compare. Two stacked phone frames (Today / Model B) built from Header.tsx + SearchTemplate.tsx real classes, near-verbatim, no invented bar/segmented control. Curl 200.
- [x] R4-5 SEARCH BAR INVENTED (owner: "not what we have"): the real /de/coiffeur bar was screenshotted + viewed BEFORE writing (scratchpad real_category_top.png) and the compare mockup's regions (home button/city chip/burger/category pills/search bar/filter pills/count+sort) copy Header.tsx + SearchTemplate.tsx exact classes, no invented search bar.
- [x] R4-6 A5 mockup built (/dev/bundles-products, rec A) , commit + link, owner picks scope.

## REWORK STATUS (2026-07-03) , all A1-A4 done via coder, committed, linked
- A1 per-filter sheets DONE (535143aba) , 7 sheets, amenities chips, slider, outline (non-black) Apply, gray selected.
- A2 Model B refined + non-black Search button DONE (e3c2793ab).
- A3 homepage SalonCard -> aspect-[3/2] DONE (e3c2793ab), design-verifier PASS (agent a259ab77: exact 1-line diff, live 157x105 = 3/2, no dropped decisions).
- A4 spec-chip pill shrunk to 11px, style A DONE (e3c2793ab).
- HOOKS hardened + tested: orchestration-gate v2 (main-agent blocked from app source + /dev; coders exempt via agent_type), link-gate v3 (catches coder-dispatched mockup turns).
- A5 = OWNER DECISION PENDING (A retail products / B un-kill bundles / C nothing net-new). Research done.

## REWORK BATCH (owner 2026-07-02, after mockup review) , ORCHESTRATE via coder, NOT hand-code
> Owner FURIOUS about orchestrator-not-coder. FIXED the enforcement hook (orchestration-gate v2, tested):
> main agent blocked from editing app source + /dev mockups; coder subagents exempt (agent_type distinguisher).
> From here every A-build goes through the `coder` subagent.
- [ ] A1.1 EACH filter = its OWN sheet (small per-filter sheet), NOT one big combined FilterSheet. Redo.
- [ ] A1.2 amenities = CHIP-like (keep current chips), NOT the checklist I proposed.
- [ ] A1.3 keep the price SLIDER.
- [ ] A1.4 buttons NOT black (owner dislikes black buttons) , alternative treatment (investigate DS non-ink option).
- [ ] A2.1 refine Model B (chosen direction) , cleaner + more complete.
- [ ] A3.1 check: is my proposed card ratio the SAME as the SEARCH result cards' ratio?
- [ ] A3.2 if same -> implement; if different -> implement SAME as search. (real code: SalonResultCard grid + SalonCard)
- [x] A4.1 style A confirmed (frosted + badge icon).
- [ ] A4.2 make the A4 pill SMALLER (owner: "the pill is too big").
- [x] A5.1 research Fresha bundles/products , DONE. Fresha: BUNDLE = group of >=2 services, 4 pricing modes (sum/custom/%off/free), booked in sequence or parallel. MEMBERSHIP = prepaid or recurring session pool. PRODUCTS = separate online store + inventory (SKU, stock auto-decrement). ADD-ONS = optional per-service extras (name+price+duration). VARIANTS/OPTIONS = mutually-exclusive service tiers (short/med/long hair).
- [x] A5.2 Solen backend mapped. service_options (VARIANTS) = WIRED in booking. service_addons (ADD-ONS) = WIRED in booking. service_packages (BUNDLES) = GRAVEYARDED (owner killed 2026-06-11, "never rebuild"), only legacy refund plumbing. Retail = nail_retail_products (nail-only, dashboard CRUD wired behind nail_features flag) + retail_purchases (Stripe path BUILT, NO customer UI) + retail_sales (drift, nothing writes it). SCOPE OPTIONS for owner:
      - A: RETAIL PRODUCTS customer store , generalize nail_retail_products to all salons + build the customer PDP store + cart (backend mostly exists; net-new = generalize table + customer UI + wire the built Stripe path). MED-LARGE.
      - B: SERVICE BUNDLES (Fresha "bundle") , service_packages is GRAVEYARDED. Needs an explicit owner UN-KILL + a bundle builder + display. FLAG: owner said "never rebuild".
      - C: NOTHING NET-NEW , variants (service_options) + add-ons (service_addons) already shipped + wired in booking. If "bundle" meant tiers/add-ons, it's DONE.
    -> DECISION for owner (A / B / C / mix). "mean 2" still ambiguous , point at an option.
- [ ] LATEST-MSG (post-interrupt): system flagged 3 asks + a MEASUREMENT complaint, but the message TEXT did not reach me. BLOCKED on owner resend.

## PROGRESS (this session)
- A1-A4 MOCKUPS built + committed + phone-verified (screenshots): A1 /dev/filter-menus (b432c7e06), A2 /dev/category-flow (239f010ab, phone-stack + canonical icons ce9d61463), A3 /dev/card-ratio (d9aea8d36), A4 /dev/spec-chip (6c0315132). AWAITING owner pick per item, then wire real code.
- B5 FOCUS RINGS , DIAGNOSED + partially fixed (owner named 2 surfaces):
  - Homepage tiles: MEASURED on :3000 , focus-visible TRUE but outlineStyle=none, boxShadow=none = NO ring (desktop + touch). Already killed by the globals.css work (2026-07-01/02, base `outline:none` on :focus AND :focus-visible, chrome-wide + a touch @media). The 104 `focus-visible:outline-2` UTILITIES are DEAD/invisible on MAIN (they set width/color, never `outline-style`, so base's style:none wins). No sweep needed for correctness; optional dead-code cleanup only.
  - Map icon (search bar): the "ring on hover" is NOT a focus ring , it is `hover:border-s-ink` darkening the circular border to full ink (and iOS keeps :hover after a tap = a STUCK ink ring). Violates locked V3-D450 (never hover:border-s-ink). FIX: -> `hover:bg-s-bg-sunken` (sink, non-ring). SearchTemplate.tsx map-icon span.
  - SPREAD: `hover:border-s-ink` in 46 files. Only CIRCULAR/PILL bordered controls read as a ring; rectangular cards read as border-emphasis (fine). Proposed scoped sweep (rings only) = report to owner.
- B1 COUNT , DONE (prior session, verified): salonsInArea = "{count} Orte / places / lieux / luoghi" (all 4 locales, no "in diesem Bereich"); hairline separation line removed (SearchTemplate ~1820). No action.
- B2 CITY-LOCK , VERIFIED RESOLVED: no maxBounds/minZoom on the map; fitBounds guarded by !userMovedRef (no snap-back); API drops the city filter when bounds present (route.ts:209 `if (!city || hasBounds) return skip`); client auto-searches bounds on user move (areaBounds). Curl proof: narrow box = 0, wide box = 20, city+wide = wide (not narrowed). CAVEAT: seed data is ~20 salons all near Basel, so "zoom out shows more" can't be DEMONSTRATED (nothing exists outside Basel), only the mechanism verified. The lock was the pre-auto-update behavior.
- B3 CITY RESOLUTION , city-name half DONE: cityTask resolves by slug OR name_de/en/fr/it, case-insensitive (route.ts:210-221), so the search-overlay display-name vs slug mismatch is handled. Street/place -> city geocoding auto-select = NET-NEW (needs a geocoder), DEFERRED.
- B4 PERF , FIX IN PROGRESS (coder a97e42a5, background): measured cold text search q=balayage = 2.11s vs 0.53s plain. Cause: `await generateEmbedding(q)` blocks (Gemini round-trip, route.ts:105). Fix = race embedding vs 500ms timeout -> lexical fallback (RPC accepts null embedding). Verify latency <0.9s + still returns items.
- B6 SCROLL MORPH , PENDING: needs an interactive/video mockup (scroll-linked transform, not a static png). Council fix = continuous scrollY-bound transform+opacity, one listener (replaces the boolean `scrolled` + max-height that thrashes/snaps). Build next.

## COUNCIL SYNTHESIS (workflow w0bavxo93, 12 agents) , directions locked
WAVE 1 (functional, no mockup): B5 focus rings (35 tsx files carry focus-visible:outline-* utilities that out-spec the global outline:none; sweep + non-ring cue + harden gate to DETECT) ; B1 count (shorten + delete the hairline) ; B2 city-lock (RE-DIAGNOSE: research stale, my auto-update already landed) ; B3 auto-city (bug half = SearchOverlay city display-name vs slug mismatch, quick; street->city resolver = net-new, defer).
WAVE 2: B4 perf (REAL not tunnel: generateEmbedding blocks every text search +0.4-1.3s @ api/salons/route.ts; with_slots 3rd wave , race embedding w/ 400-600ms timeout + defer with_slots) ; B6 scroll morph (boolean `scrolled` + max-height transition = layout thrash/snap; -> continuous scrollY-bound transform+opacity, one listener; needs before/after mockup).
WAVE 3 (mockups, owner approves): A1 /dev/filter-sheet (Direction A: control-language-per-filter-type , segmented for single-select, checklist rows for amenities, Switch for Deals, keep gray-sunken locked); A2 /dev/category-flow (Model B: segmented category param decoupled from free-text ?q=; 3 frames TODAY/B/C); A3 /dev/card-ratio (3/2 for large cards incl homepage SalonCard, keep list/suggest thumbs square; before/after); A4 /dev/spec-chip (frosted match chip on photo, client-side match vs services+staff.specialties, never fabricated; AFTER A3).
WAVE 4: A5 bundles/products = OWNER DECISION (packages GRAVEYARD; retail_products backend already exists; ask: retail vs service-tiers? tab vs inline card? un-kill packages?). Do NOT start on a guess.
