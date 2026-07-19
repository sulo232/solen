<!-- batch: full frontend sweep , audit every surface vs the new design system, mockup improvements (multi-direction), fix gaps/inconsistencies. Owner 2026-07-19, LOOP till done. -->
# Frontend sweep , every surface vs the design system (LOOP)

Owner 2026-07-19: "go look into every frontend in solen and see improvements cz of all the new principles n design system. if we can have multiple direction make few mockups too for that page. every gap and inconsistency we need to fix it." LOOP till done.

## Process per surface (the loop body)
1. AUDIT , score the surface vs LOCKFILE + TASTE_LOG + RATIONALE + the 10 taste rules + COMPONENT_REGISTRY. List: token drift, missing/hand-rolled states, cross-surface inconsistency, copy issues, real improvement opportunities. (code-level via workflow agents; visual via my own render)
2. FIX-NOW , clear mechanical inconsistencies (token drift, wrong radius/shadow family, retired tokens, hand-rolled where a primitive exists, missing states) get fixed directly (no mockup needed , they're objective).
3. MOCKUP , genuine design/taste improvements get a copy-of-real-page mockup; where multiple directions are viable, 2-3 side by side. Delivered as a served page (gallery index). Owner approves per surface, THEN apply.
4. VERIFY , render + measure; commit each surface.

## Tiering (132 customer routes; dashboards are a separate DS = last)
- **Tier 1 , core customer journey (auditing now):** homepage `[city]` · search results `[city]/[category]` + `/search` · salon PDP `salon/[slug]` · booking flow (ServicesStaffStep/StaffStep/DateTimeStep/HairStep/PayConfirmStep) · inspo feed `/inspo` (+ `/inspo/nails`) · profile hub `/profile` (+ `/profile/haarprofil`) · walk-in `/walk-in-join`+`/walk-in-pay`+`/queue/[token]` · reviews `salon/[slug]/reviews` · confirmation · auth `/auth/*` · onboarding.
- **Tier 2 , secondary customer:** account, notifications, termine, vouchers/gift-cards, rewards/loyalty, referral, favorites, looks, recently-viewed, nail-tech, brand, behandlungen, tip, booking-lookup.
- **Tier 3 , marketing/legal/info:** fuer-salons, warum-solen, ueber-uns, business, blog, help(+slug), karriere, presse, kontakt, agb/impressum/datenschutz/privacy/terms/sicherheit, coming-soon.
- **Tier 4 , dashboard/admin (owner-facing, LOCKFILE §12 DS):** ~55 dashboard/* routes , last, and only against the dashboard DS.

## Status
- [ ] Tier 1 audit , RUNNING (workflow, 2026-07-19).
- [ ] Tier 1 fix-now + mockups
- [ ] Tier 2 / 3 / 4

## Tier-1 audit RESULT (2026-07-19, workflow w7nnini3r , 105 findings: 30 high/44 med/31 low; 100 mechanical + 5 mockup)
Full backlog: task output w7nnini3r. Per-surface verdict: homepage/booking/inspo/walkin/reviews/auth-onboarding = NEEDS-WORK; search/salon-pdp/profile/confirmation = MINOR.

### LANDMINES (do NOT blindly apply , vet against settled decisions)
- **Booking category pills = owner-approved BLACK/ink** (TASTE_LOG 2026-07-19, `selected-ok:`). The audit WRONGLY flagged `ServicesStaffStep.tsx:366` as a selected-state violation. DO NOT change it. (HairStep pills + inspo/profile/reviews selected states ARE genuine violations , the override was scoped to the booking category pills only.)
- **Fabricated data = SEED via real routes, NOT hide/delete** (owner GAP_FIXES WS30 + prelaunch memory). Homepage 5 sections (Nearby/RecentlyViewed/forYouSalons/Reviews/BusinessTeaser fake ratings/testimonials), onboarding claim, confirmation `SOL-•••••` -> route to WS30, don't naive-delete. EXCEPTION: pure marketing-copy fabrications with no data path (BusinessTeaser "1'200 Salons" stat, WIP placeholder image) can just be removed/restored now.

### FIX-NOW sweeps (mechanical, cross-surface , the owner's "fix every inconsistency")
- [ ] SELECTED-STATE -> gray `bg-s-bg-sunken` (EXCLUDE booking category pills): HairStep:43, PostFromDiscover:199/206/242/258, HaarprofilForm:30 (HIGH, unfixed since 2026-07-08), SalonReviews filter checkbox:251, dead CategoryTabBar (delete).
- [ ] INPUT FOCUS RING -> global ink-edge (remove `focus:ring/border-s-accent`): all auth/onboarding inputs (SignIn:209, register, OnboardingFlow, reset, salon), reviews textarea:382; confirmation box-shadow rings :281/291/315.
- [ ] "MEHR LESEN" -> `text-s-accent`: SalonReviews:213, MarketplaceReviewsList:67.
- [ ] TOUCH TARGETS -> h-11 w-11: SalonHeader Share:144, SalonReviews flag:334, inspo (DetailPage 255/265/285, FilterDrawer:62, back buttons), confirmation copy:314, walk-in info:503, search clear:1336.
- [ ] STATES -> registry Skeleton/EmptyState/ErrorState: search:249/2319, SalonProducts/Bundles shimmer+error, reviews page:99, onboarding/salon:536, SalonReviews in-flight, + add confirmation/profile loading.tsx.
- [ ] HAIRLINE -> `border-s-border` (kill `border-s-ink/[0.0x]`): booking (PayConfirmStep, ServicesStaffStep:600, ServiceDetailSheet), walk-in-pay (many), onboarding/salon (many).
- [ ] SHADOW -> `shadow-elevation-1/2` (kill one-off + shadow-float): walk-in-pay, confirmation, queue.
- [ ] BIG CTA color -> ink primary / blue-ghost secondary (never blue-fill): queue Directions:534, walkin Feedback:277 (mockup , see below).
- [ ] WEIGHT -> font-extrabold(800)->bold, H2->semibold: ServicesStaffStep:546/400, StaffStep:183, ServiceDetailSheet:231.
- [ ] EM-DASH sweep: salon, reviews, confirmation comments+copy, profile toasts (de.json:30/31), inspo modal, onboarding, search metadata titles.
- [ ] DEAD/ORPHAN delete: SearchResults.tsx, CategoryHeroCarousel.tsx, inspo board/[id]+saved/[id] (killed Kollektion), CategoryTabBar, forYouSalons FORYOU_DEALS.
- [ ] SalonCard superseded redesign (aspect 3/2->5/4, drop blue review count, drop next-slot row) , CARD_REDESIGN_2026-07-13; vet vs the STRANDED branch first.
- [ ] FUNCTIONAL: search Retry no-op (SearchTemplate:1524, re-run fetch not router.refresh); nearby=true no-op link (Nearby:159); PDP two ink CTAs (SalonProducts:230 -> neutral); DateTimeStep:201 selectedTone ink->accent (locked blue slot).
- [ ] Pre-migration surfaces: reset-password/page.tsx + onboarding/salon/page.tsx (uppercase-tracked, ad-hoc shadows, banned Zap/Sparkles).

### MOCKUP (multi-direction, owner picks):
1. Homepage MobileCategoriesRow selected photo-tile (gray-fill vs border+check) , 2 dir.
2. search cause-aware empty chip family (error vs empty radius) , 2 dir.
3. walkin queue Feedback CTA (ink commit vs blue-ghost) , 2 dir.
4. walkin loading skeletons (tracker-shaped) , 1-2 dir.
5. reviews+buy floating-card wrapper (wrap-all / unwrap-these / keep) , PDP rhythm, 3 dir.

## Log
- 2026-07-19: sweep started. Tiered 132 routes. Tier-1 audit DONE (105 findings). Executing fix-now sweeps (vetting each vs settled decisions); fabricated-data -> WS30; 5 mockups queued.
- 2026-07-19 (cont.): DONE + committed , [x] SELECTED-STATE sweep (PostFromDiscover toggles/category/gender pills + SalonReviews rating-filter -> gray; dropped 2 all-caps labels; HairStep + Haarprofil pill fills were already gray) 4dce499dc; [x] TOUCH-TARGET sweep (SalonHeader Share, SalonReviews flag, BookingConfirmation copy -> h-11; search already h-11) 0d67e896a. Also fixed a BROKEN HEAD: the dedup commit 9255c966b dropped the SalonServices rewire (a git-add abort on the already-rm'd sheet path), leaving a dangling import; re-committed 0f85a1d84.
- **AUDIT RELIABILITY CAVEAT (critical): the Tier-1 audit has FALSE POSITIVES + wrong line numbers/classes. VERIFY every finding against the ACTUAL code (grep) before fixing , treat the fix-now list as LEADS, not truth.** Confirmed false positives: [SKIP] INPUT FOCUS RING (SignIn/OnboardingFlow already `focus:outline-none` + global ink-edge; blue rings removed 2026-07-17); search clear-all already h-11; HairStep + Haarprofil pills already gray.
- NEXT (verify-then-fix, real ones only): "Mehr lesen"->accent, STATES->registry, HAIRLINE->s-border, SHADOW->elevation, WEIGHT extrabold->bold, EM-DASH sweep, DEAD-file deletes, SalonCard superseded-redesign (vet vs stranded branch), FUNCTIONAL (search Retry no-op, nearby no-op, PDP two ink CTAs, DateTimeStep tone), pre-migration surfaces. Then the 5 mockups. Then Tier 2/3/4.
