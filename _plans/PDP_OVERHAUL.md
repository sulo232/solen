# PDP overhaul (salon vision page) — owner batch 2026-07-24

Owner dictation, in the owner's stated ORDER. Route: `/[locale]/salon/[slug]` → `SalonDetailV3` orchestrator.
Test salon: `cuts-and-culture`. Mockup-first binds every visual box (copy of the real page, treatment only, approve, then build).

## Readback (the 7 asks + the meta)
1. PDP hero photo doesn't reach the top of the phone — there's a gap above it. Make it full-bleed to the top.
2. Tapping the hero photo isn't connected to the portfolio — it should open the portfolio.
3. Portfolio should be CATEGORIZED (men's cut / women's cut / ...), salon-uploaded + salon-categorized, with a whole system behind it incl. a dashboard manage/upload section.
4. Renew the Reviews section — hard to distinguish between things, not grouped, "4.8 and everything" reads flat.
5. "In der Nähe" (Nearby) cards bigger — ~1.25 cards visible (a quarter of the 2nd card peeking).
6. "In der Nähe" categories/structure should MATCH the homepage (barbers / category rows) — kill the inconsistency.
7. The black card ("Termin buchen bei {salon}", currently `SalonAppCta`) — owner doesn't know what it is; investigate + fix.
8. META: write everything down + START with step 1.

---

## Grounding (real files, verified this turn)
- Orchestrator: `app/[locale]/_components/salon/SalonDetailV3.tsx` (section order lives here).
- Hero: `app/[locale]/_components/salon/SalonHero.tsx` — mobile carousel, tap → `onOpenLightbox` (NOT the gallery/portfolio).
- Gap source (hypothesis, to MEASURE): global `Header` (locale layout) + promo banner render ABOVE `<main>`; `<main class="... pt-2 ...">` + hero `<section class="... mt-3 ...">`. Header is `sticky top:0`, hides on deep scroll (V3-D215) but shows at initial paint.
- Portfolio display: `SalonPortfolio.tsx` (renders `salon.gallery_urls`, `onOpen` → `SalonImageGallery`). Existing system: `staff_portfolio_images` table (12 rows, RLS), `/api/staff/portfolio` [POST], `/api/salons/[slug]/gallery` [POST/DELETE/PATCH], `GalleryManager.tsx` (dashboard), `salons.gallery_urls`. EXTEND, do not rebuild.
- Reviews: `SalonReviews.tsx` — has `layout` prop (`stack`|`swipe`|`collapsed`, added 2026-07-23). Dev compare page: `app/[locale]/dev/pdp/reviews/page.tsx`.
- Nearby: `SalonVenuesNearby.tsx` — cards `w-[calc(66%-12px)]` mobile (~1.5 visible), hand-rolled card (NOT the homepage `SalonCard`). Data: `/api/salons/by-category`.
- Homepage canonical card: `app/[locale]/_components/homepage/SalonCard.tsx`; homepage nearby: `app/[locale]/_components/homepage/Nearby.tsx`.
- Black card: `SalonAppCta.tsx` — `bg-s-ink` hero card "Termin buchen bei {salonName}" + subline + SEO cross-links. Variants hero|twoTier|minimal. Dev page: `app/[locale]/dev/pdp/cta/page.tsx`. Reworked 2026-07-23.

## Exists-check
`npm run exists portfolio` + `gallery` ran this turn → portfolio/gallery systems ALREADY EXIST (extend, per rule 12). No graveyard blockers surfaced for these asks.

---

## STEP 1 — Hero full-bleed to top of phone  ← START HERE
- [x] 1a. MEASURED live PDP @390 via Playwright+tunnel: `verified:` hero `#section-photos` top=**20px**, heroImg top=20, header rect 0x0 (mobile header empty), backBtn top=36. (scratchpad/measure-hero.mjs output this turn.)
- [x] 1b. Root-caused: `verified:` gap = hero wrapper `mt-3` (12px, SalonDetailV3.tsx:234) + main `pt-2` (8px, SalonDetailV3.tsx:203) = 20px. NOT the header (0px on mobile).
- [x] 1c. Mockup built (uncommitted, mobile-only, treatment-only): `verified:` main `pt-2`→removed, hero `mt-3`→`mt-0 md:mt-3`; re-measured hero top=**0px** (scratchpad/pdp-top-after.png). Surgical 2-line diff, desktop unchanged (`md:pt-3` + `md:mt-3` preserved).
- [x] 1d. Delivered: live tunnel preview + measured before/after. `verified:` owner APPROVED 2026-07-24.
- [x] 1e. Committed: `verified:` sha **cdadc5881** ("PDP hero: full-bleed to top of phone").

## CORRECTION (owner 2026-07-24, verbatim intent): "dnt stop per step for changes, make mockup like i told u, brand new"
- Do NOT pause per-step for approval. Build ALL remaining mockups (2-7) as the brand-new redesign in one pass, present together, ONE batch approval.
- Mockup FORMAT = the locked one (DRIFT_LEDGER 2026-07-13): whole REAL page with the treatment applied, variant-switchable, chrome in ENGLISH. NOT from-scratch redraws, NOT isolated A/B panels. "Brand new" = the new LOOK on the real page.

## IN FLIGHT (2026-07-24): steps 2-7 mockups are being BUILT by background workflow `wwl74a2jj`
Research (portfolio/nearby/appcta/reviews, read-only parallel) → single frontend build of the whole-page redesign mockup at `app/[locale]/dev/pdp/overhaul/page.tsx` (+ `_overhaul/` components) → design-verifier grade. On completion: screenshot via tunnel, fix punch list, deliver ONE batch link for approval (owner: don't stop per step). Steps 2-7 boxes below stay open until that mockup lands + is approved; NOT undisposed — actively building.

## ROUND 2 — owner reaction to the mockup (2026-07-24, verbatim intent)
Readback (header ask RETRACTED by owner "never mind forget about the header"):
- [x] R1. Portfolio 3x3=9 , `verified:` code (SalonPortfolioOverhaul.tsx, fills to <=9 from venue + staff_portfolio_images, honest "Showing N real photos" footnote if <9, no fabrication). Runtime look pending owner.
- [x] R2. Green unified , `verified:` StatusInlineOverhaul + SalonOpeningTimesOverhaul → single `s-success` #16A34A. **NEEDS OWNER SIGN-OFF**: collapses the LOCKFILE open/success 2-token split; research's #1F8900 failed the muted-color-gate. NOTE: SalonSidebar.tsx has the same drifted green, left untouched (real component).
- [x] R3. Nearby snap , `verified:` code (SalonVenuesNearbyOverhaul uses snap-x/mandatory, NO negative margin = the negative-margin-without-scroll-padding root cause is GONE). Runtime interaction NOT re-measured by me this turn (2 selector attempts failed on async load) → owner confirms the gesture on phone.
- [x] R4. -0% pill removed , `verified:` runtime DOM check `hasZeroPct:false` on the live overhaul route + SalonCardOverhaul gates pill on discount>0.
- [x] R5. Book bar parks , `verified:` SalonMobileBookBarOverhaul uses IntersectionObserver(footer) → fixed→absolute in a 72px reserved band; bottom screenshot shows NO overlap on the newsletter. Owner confirms scroll on phone.
- [x] R6. Reviews SECTION , `verified:` 3 distinct directions live at /dev/pdp/reviews-directions ?dir=1|2|3 (D1 Distribution histogram, D2 Featured hero, D3 Segmented tier-chips) + working switcher + recommendation = D1.
- [x] R7. "+N without comments" removed , `verified:` gone from SalonReviewsOverhaul (verify agent) + no German date leak (runtime `germanUm:false` after the formatReviewDateEn fix).
- [x] R8. Full reviews PAGE , `verified:` /dev/pdp/reviews-full live: Fresha distribution bars (runtime barish:21) + Google-Maps sort chips GRAY sunken #F4F4F5 selected (runtime, NOT blue) + keyword search present + working filter (verify agent).

## ROUND 3 — owner reaction 2026-07-24 (D3 approved + 4 fixes)
- [x] S1. D3 SEGMENTED approved ("I love this D3 segmented look"). `verified:` `SalonReviewsOverhaul.tsx` now a thin wrapper rendering `DirectionSegmented` (rating-tier TabPill filter + hairline-grouped list), still wired into `PdpOverhaul.tsx` unchanged call site. "See all" navigates to `/dev/pdp/reviews-full` via `seeAllHref` (no inline expand). No "+N without comments" line (DirectionSegmented never rendered it).
- [x] S2. Apply the same D3 segmented look to the FULL reviews page (/dev/pdp/reviews-full). `verified:` `ReviewsFullFilterList.tsx` gained a "Filter by rating" TabPill row (same tier-chip grammar as DirectionSegmented) ABOVE the existing "Sort by" TabPill row, each row labelled in English, both independently functional (AND-composed with keyword search). Rating distribution bars (RatingDistribution.tsx) and keyword search untouched. Per-row card swapped to the shared `ReviewCard` for one consistent card/divider treatment across section + full page.
- [x] S3. Portfolio = 3 columns x 2 rows = **6 images**. `verified:` `SalonPortfolioOverhaul.tsx` cap changed from 9 to `TILE_CAP = 6` (grid stays `grid-cols-3`, so 3x2); honest footnote logic (`showFootnote = totalReal < TILE_CAP`) preserved, no fabrication.
- [x] S4. Gallery had TWO stacked selector rows. `verified:` `SalonImageGalleryOverhaul.tsx` collapsed to ONE filter-pill row (Salon/Team toggle + hairline divider + category or stylist pills inline in the same row, never two rows); underline content-tab treatment deleted entirely; every pill uses the same neutral `Pill` component (`bg-s-bg-sunken` selected, white+hairline unselected).
- [x] S5. Sticky book bar snap removed. `verified:` `SalonMobileBookBarOverhaul.tsx` , IntersectionObserver + fixed/absolute toggle deleted, bar is permanently `fixed inset-x-0 bottom-0`, no transform/position animation. `PdpOverhaul.tsx` , 72px "reserved band" wrapper removed (fixed elements need no flow space); `<main>` bottom padding raised `pb-24`→`pb-32` as a scroll-clearance buffer; the newsletter itself is additionally protected because Footer.tsx's own post-newsletter content (link columns + legal bar, several hundred px, unedited/shipped) is far taller than the bar's ~76px footprint.

## STEP 2 — Hero tap → portfolio
- [x] 2a. Target decided = the full-screen categorized GALLERY. `verified:` SalonHeroOverhaul.tsx:72 `onClick={onOpenGallery}` (was onOpenLightbox(i)), sha da4433015.
- [x] 2b. Delivered in the /dev/pdp/overhaul mockup; owner reviewed it and gave round-2 + round-3 reactions (both applied). `verified:` sha da4433015.
- [x] 2c. `verified:` runtime , tapping the hero opens the gallery overlay showing header "Gallery / Cuts & Culture" + one pill row All(6)/Fades(2)/Haircuts(2)/Beard trims(2) + a 3-col photo grid (scratchpad/r3-gallery3.png, this session).

## STEP 3 — Portfolio: categories + salon upload + dashboard system
- [x] 3a. `verified:` mapped by the research pass: `salons.gallery_urls` (salon photos), `staff_portfolio_images` (per-stylist, RLS), APIs /api/salons/[slug]/gallery + /api/staff/portfolio + /api/barber/[slug]/portfolio, dashboard GalleryManager.tsx. GAP CONFIRMED: NO per-photo category column exists (live snapshot `staff_portfolio_images` has no category field).
- [ ] 3b. **BLOCKED ON OWNER (concrete fork):** the category MODEL must be picked before any migration. Options: (A) fixed taxonomy per salon category (barbershop = Fades/Haircuts/Beard trims...), (B) free-text tags the salon types, (C) derive from the salon's own service list. Mockup currently renders (A) as SAMPLE categories. Owner picks A/B/C, then 3c-3e unblock.
- [ ] 3c. BLOCKED on 3b (the dashboard UI shape depends on which category model wins).
- [x] 3d. `verified:` DELIVERED as the mockup's single filter-pill row + 3-col grid in SalonImageGalleryOverhaul (runtime-confirmed, r3-gallery3.png). Categories are SAMPLE until 3b is picked.
- [ ] 3e. BLOCKED on 3b. Atomized for when it unblocks: (i) additive migration adding the category column, (ii) API accepts+returns it, (iii) GalleryManager assign-category UI, (iv) PDP reads real categories, (v) curl on/off proves the filter discriminates.

## STEP 4 — Reviews section renew
- [x] 4a. `verified:` diagnosis ran in the research pass (named: bare 4.8 with no proof, loose gapped stack, 2-review preview below the density floor, weak dividers).
- [x] 4b. `verified:` THREE distinct directions built + live at /dev/pdp/reviews-directions ?dir=1|2|3 (D1 Distribution, D2 Featured, D3 Segmented). Owner APPROVED D3.
- [x] 4c. `verified:` D3 is now the PDP reviews section (runtime chips All(7)/5(13)/4(3), English dates, no +N line) AND the full page language, sha da4433015.

## STEP 5 — Nearby cards bigger
- [x] 5a. `verified:` SalonVenuesNearbyOverhaul.tsx:181 `w-[calc((100vw-44px)/1.25)]` = exactly 1.25 cards per viewport.
- [x] 5b. Applied in the MOCKUP + committed (sha da4433015). Porting to the SHIPPED SalonVenuesNearby happens on final owner sign-off of the whole overhaul (mockup-first law).

## STEP 6 — Nearby matches homepage
- [x] 6a. `verified:` diffed in the research pass (old PDP card: hand-rolled <img>, 4:3, no heart, no discount pill vs homepage SalonCard: 5:4, rounded-22, heart, discount pill, name+star row).
- [x] 6b. Decided = rebuild on the homepage SalonCard grammar. `verified:` SalonCardOverhaul.tsx (5:4 photo, rounded-[22px], heart, discount pill gated >0, name+star row).
- [x] 6c. `verified:` live on /dev/pdp/overhaul, sha da4433015. Ports to the shipped rail on final sign-off.

## STEP 7 — The black "Termin buchen" card (SalonAppCta)
- [x] 7a. `verified:` SalonAppCta = a mid-page black hero repeating the Book action + SEO cross-links. It DUPLICATES the booking action already carried by SalonMobileBookBar (sticky) and SalonSidebar (desktop) , that duplication is why it read as an unexplained black card.
- [x] 7b. Recommended + mocked = REMOVE the black book hero, keep only the quiet discovery cross-links as a peer section. `verified:` SalonAppCtaOverhaul.tsx live in the mockup.
- [x] 7c. Applied in the mockup (sha da4433015). REMOVED.md line lands when it ports to the shipped component on final sign-off (the shipped SalonAppCta is still untouched by law).

---

## Notes / parked
- Prior WIP already exists for reviews (A/B/C), cta (hero/twoTier/minimal), portfolio directions under `app/[locale]/dev/pdp/*` — reuse, don't restart.
- Owner order is literal: 1→2→3, then 4, then 5→6, then 7. Do NOT reorder.
