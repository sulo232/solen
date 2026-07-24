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

## STEP 2 — Hero tap → portfolio
- [ ] 2a. Decide the target: hero tap should open the portfolio/gallery (`onOpenGallery` → `SalonImageGallery`) instead of the bare `Lightbox` (confirm with owner which surface = "portfolio").
- [ ] 2b. Mockup/flow the tap → portfolio open. Approve.
- [ ] 2c. Wire `onClick` → gallery; verify tap opens the categorized portfolio (depends on Step 3 categories).

## STEP 3 — Portfolio: categories + salon upload + dashboard system
- [ ] 3a. Investigate the CURRENT portfolio system end-to-end (staff_portfolio_images, gallery_urls, GalleryManager, the 3 portfolio APIs) — write what exists vs what's missing for categories.
- [ ] 3b. Design the category model (men's cut / women's cut / ... ) — DB: does a category column/table exist? propose the additive schema (extend `staff_portfolio_images` or `gallery`), owner-approve.
- [ ] 3c. Dashboard: upload + assign-category UI (extend `GalleryManager`), owner-approve mockup.
- [ ] 3d. PDP display: categorized portfolio (tabs/filter by category), owner-approve mockup.
- [ ] 3e. Build backend (migration + API), build dashboard, build PDP display; verify data path (curl on/off) end-to-end.

## STEP 4 — Reviews section renew
- [ ] 4a. Run solen-taste-diagnosis on the live Reviews section (named violations: grouping, hierarchy, "4.8" flatness).
- [ ] 4b. Mockup-first: regrouped/clearer reviews (leverage existing `layout` variants + diagnosis). 3+ directions if it's a taste fork. Approve.
- [ ] 4c. Build approved direction; verify.

## STEP 5 — Nearby cards bigger
- [ ] 5a. Mockup-first: card width ~80% (`w-[calc(80%-...)]`) so ~1.25 cards show (quarter of 2nd peeking). Approve.
- [ ] 5b. Apply to `SalonVenuesNearby`; measure ~1.25 cards at 375; commit.

## STEP 6 — Nearby matches homepage
- [ ] 6a. Diff PDP `SalonVenuesNearby` card grammar vs homepage `SalonCard`/`Nearby.tsx` — list every inconsistency (photo ratio, meta, rating, category rows).
- [ ] 6b. Decide: reuse the homepage `SalonCard` in the PDP rail (dedup) vs align grammar. Owner-approve mockup.
- [ ] 6c. Apply; verify PDP nearby == homepage card grammar.

## STEP 7 — The black "Termin buchen" card (SalonAppCta)
- [ ] 7a. Investigate: what SalonAppCta is (mid-page Book CTA repeat + SEO cross-links), why it reads confusing, whether it duplicates the sticky bar + sidebar CTA.
- [ ] 7b. Recommend: keep/reshape/remove (owner decides). Mockup the recommendation. Approve.
- [ ] 7c. Apply approved outcome (feed REMOVED.md if removed).

---

## Notes / parked
- Prior WIP already exists for reviews (A/B/C), cta (hero/twoTier/minimal), portfolio directions under `app/[locale]/dev/pdp/*` — reuse, don't restart.
- Owner order is literal: 1→2→3, then 4, then 5→6, then 7. Do NOT reorder.
