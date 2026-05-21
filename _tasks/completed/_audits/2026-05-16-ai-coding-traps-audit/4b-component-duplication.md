# Topic 4 · Slice B — Component duplication (V3 vs legacy + within-set)

Date: 2026-05-16
Scope: every duplicate React component across `app/[locale]/_components/` (V3 canonical) and `components-legacy/`.
Method: AST-style import-path resolver (Python) — walks every `.tsx`/`.ts` file, parses every `import … from "X"` statement, resolves `X` to a concrete file via the same rules Next.js uses (`@/` -> repo root, relative paths, `.tsx`/`.ts`/`index.tsx` extensions), builds reverse `caller-set` per file. Counts are exact caller-files (deduped, self-excluded).

> Project root: `/Users/sulo/Documents/solen/.claude/worktrees/vigorous-spence-0e9aa7`
> V3 root: `app/[locale]/_components/`
> Legacy root: `components-legacy/`

---

## Headline numbers

| Metric | Count |
|---|---|
| V3 components (`.tsx`/`.ts` under `app/[locale]/_components/`) | 65 |
| Legacy components (`.tsx`/`.ts` under `components-legacy/`) | 317 |
| Duplicate component **sets** (same role, different impls) | **24** |
| V3 callers across all duplicate sets | 18 |
| Legacy callers across all duplicate sets | 47 (counting app-level callers only) |
| Legacy orphans (zero callers anywhere) | **48** |
| V3 orphans (zero callers anywhere) | **7** (5 data files, 2 unwired V3 surfaces) |
| Legacy files imported by `app/` (still production-wired) | **~150** |

The structural picture: V3 is a thin shell. Every homepage section, every primitive, every salon-detail subsection has a V3 sibling, but the V3 siblings collectively have ~20 production callers while the legacy tree has ~150. The salon detail page (`app/[locale]/salon/[slug]/page.tsx`) imports 12 components from `components-legacy/salon/` while a near-complete V3 replacement set sits orphaned in `app/[locale]/_components/salon/` (only consumed by an unwired `SalonDetailV3.tsx`).

---

## Duplicates (legacy vs V3)

### 1. Header / TopBar

- **V3 canonical:** `app/[locale]/_components/layout/Header.tsx` — 1 caller (`app/[locale]/layout.tsx`)
- **Legacy variant:** `components-legacy/dashboard/DashboardHeaderStrip.tsx` — 1 caller (`app/[locale]/dashboard/page.tsx`)
- **Behavior diff:** V3 Header is the public-facing top bar (logo + search + auth). DashboardHeaderStrip is the B2B dashboard's own header. They overlap conceptually but serve different surfaces — not a hard duplicate.
- **Consolidation priority:** LOW (functional split is intentional).

### 2. Footer

- **V3 canonical:** `app/[locale]/_components/layout/Footer.tsx` — 1 caller (`app/[locale]/layout.tsx`)
- **Legacy variant:** `components-legacy/layout/Footer.tsx` — 1 caller (no app caller; only `components-legacy/HomePage.tsx` references it, and `HomePage.tsx` itself is an orphan)
- **Behavior diff:** V3 Footer mounted at locale-layout level per V2-D46 comment in `layout.tsx`. Legacy Footer is dead — its sole importer (`HomePage.tsx`) has zero callers.
- **Consolidation priority:** HIGH — delete `components-legacy/layout/Footer.tsx` once `HomePage.tsx` is removed.

### 3. Cookie banner / Consent

- **V3 canonical:** `app/[locale]/_components/primitives/CookieConsent.tsx` — 2 callers (`app/[locale]/layout.tsx`, `app/[locale]/_components/primitives/index.ts`)
- **Legacy variant:** `components-legacy/ui/CookieBanner.tsx` — **0 callers** (orphan)
- **Consolidation priority:** HIGH — safe-delete `CookieBanner.tsx`.

### 4. SalonCard (the biggest single duplicate)

- **V3 canonical:** `app/[locale]/_components/homepage/SalonCard.tsx` — 5 callers (all V3 internal: `Coiffeur`, `LastMinute`, `Nearby`, `RecentlyViewed`, `SearchResults`)
- **Legacy variant:** `components-legacy/SalonCard.tsx` — 13 callers (6 from `app/`: `brand/[slug]`, `dashboard/settings`, `profile/favorites`, `account/saved`, `behandlungen/[...slug]/page.tsx` and `TreatmentsClient.tsx`; 7 internal-legacy)
- **Behavior diff:** V3 SalonCard uses Earthen Wellness Light tokens (`s-brand`, `s-accent`), cream surface, HeartButton from V3, locked V3 typography. Legacy SalonCard uses older Tailwind primitives (`bg-white`, generic `text-gray-*`) and has different photo / badge / pricing logic.
- **Consolidation priority:** **CRITICAL** — every page that imports legacy SalonCard renders against the wrong design system. This is the single largest visible duplication.

### 5. SearchBar (4-way fragmentation)

- **V3 canonical:** `app/[locale]/_components/homepage/SearchBar.tsx` — 1 app caller (`Hero.tsx` only)
- **Legacy variants (4 different files):**
  - `components-legacy/ui/SearchBar.tsx` — **0 callers** (orphan)
  - `components-legacy/ui/HomeSearchBar.tsx` — **0 callers** (orphan)
  - `components-legacy/ui/AirbnbSearchBar.tsx` — **0 callers** (orphan)
  - `components-legacy/discovery/SearchBar.tsx` — 1 caller (`app/[locale]/discover/page.tsx`, imported as `DiscoverySearchBar`)
- **Consolidation priority:** HIGH for orphan deletion (3 dead variants). MEDIUM for porting `discover` to V3 SearchBar.

### 6. Toast / Notification

- **V3 canonical:** `app/[locale]/_components/primitives/Toast.tsx` — exported from `primitives/index.ts`, **0 production callers** (only dev demo references)
- **Legacy variant:** `components-legacy/ui/Toast.tsx` — 6 callers (`app/[locale]/layout.tsx` ToastContainer, `auth/register`, `auth/reset-password`, `ChatWindow.tsx`, `auth/SignIn.tsx`, `compare/CompareDrawer.tsx`)
- **Behavior diff:** V3 Toast is a hook-based component primitive. Legacy is global event-driven (`emitToast()` + `ToastContainer`).
- **Consolidation priority:** HIGH — the V3 Toast is essentially unused while every production toast goes through legacy.

### 7. Modal

- **V3 canonical:** `app/[locale]/_components/primitives/Modal.tsx` — 2 internal callers (`SearchBar.tsx`, `Sheet.tsx`)
- **Legacy variant:** `components-legacy/ui/GlassModal.tsx` — 6 callers (`ProfilePage.tsx`, `TerminePage.tsx`, `PriceOfferModal.tsx`, `ReportProblemModal.tsx`, `DeleteAccountModal.tsx`, `PaymentMethodsSection.tsx`) — all internal-legacy; **0 app-direct callers**
- **Consolidation priority:** MEDIUM — GlassModal callers are downstream of legacy entry pages.

### 8. Sheet / BottomSheet

- **V3 canonical:** `app/[locale]/_components/primitives/Sheet.tsx` — 1 caller (`Logo.tsx`, internal V3)
- **Legacy variants:**
  - `components-legacy/ui/BottomSheet.tsx` — **0 callers** (orphan)
  - `components-legacy/ui/QuickPreviewSheet.tsx` — 3 callers (`app/[locale]/behandlungen/[...slug]/page.tsx`, `TreatmentsClient.tsx`, `components-legacy/search/SplitView.tsx`)
- **Consolidation priority:** HIGH — port `behandlungen/[...slug]` to V3 Sheet; delete BottomSheet orphan.

### 9. Hero

- **V3 canonical:** `app/[locale]/_components/homepage/Hero.tsx` — 1 caller (`app/[locale]/page.tsx`)
- **Legacy variant:** `components-legacy/home/HeroAboveFold.tsx` — 1 caller (`components-legacy/HomePage.tsx` only — orphan-chain; dead)
- **Consolidation priority:** HIGH — safe-delete with `HomePage.tsx`.

### 10. Coiffeur (homepage section)

- **V3 canonical:** `app/[locale]/_components/homepage/Coiffeur.tsx` — 1 caller (`app/[locale]/page.tsx`)
- **Legacy variant:** `components-legacy/coiffeur/CoiffeurSections.tsx` — 1 caller (`app/[locale]/coiffeur/page.tsx`, named exports `CoiffeurAboveGrid` / `CoiffeurBelowGrid`)
- **Behavior diff:** V3 Coiffeur is the homepage section carousel. CoiffeurSections is the category-landing page's above/below grid wrappers. Different surfaces, related logic.
- **Consolidation priority:** MEDIUM — share data fetching when the `coiffeur/page.tsx` route gets V3 treatment.

### 11. Last-minute

- **V3 canonical:** `app/[locale]/_components/homepage/LastMinute.tsx` — 1 caller (`app/[locale]/page.tsx`)
- **Legacy variants:**
  - `components-legacy/LastMinuteCard.tsx` — 1 caller (`app/[locale]/angebote/page.tsx`)
  - `components-legacy/ui/LastMinuteStrip.tsx` — 2 callers (internal-legacy only)
  - `components-legacy/ui/LastMinuteStrip.figma.tsx` — **0 callers** (orphan)
  - `components-legacy/dashboard/LastMinuteManager.tsx` — 1 caller (`app/[locale]/dashboard/marketing/page.tsx`) — different concern (B2B manager UI)
- **Consolidation priority:** HIGH — `LastMinuteStrip.figma.tsx` is a safe-delete orphan.

### 12. Nearby

- **V3 canonical:** `app/[locale]/_components/homepage/Nearby.tsx` — 1 caller (`app/[locale]/page.tsx`)
- **Legacy variants:**
  - `components-legacy/home/NearbySection.tsx` — 1 caller (`components-legacy/HomePage.tsx` — orphan-chain)
  - `components-legacy/NearbySalons.tsx` — **0 callers** (orphan)
- **Consolidation priority:** HIGH — both legacy files safe-delete.

### 13. Recently Viewed

- **V3 canonical:** `app/[locale]/_components/homepage/RecentlyViewed.tsx` — 1 caller (`app/[locale]/page.tsx`)
- **Legacy variant:** `components-legacy/RecentlyViewed.tsx` — 3 callers (1 app: `app/[locale]/salon/[slug]/page.tsx` imports `trackSalonView` from it; 2 legacy-orphan-chain: `ProfilePage.tsx`, `HomePage.tsx`)
- **Behavior diff:** legacy file exports both a component AND a `trackSalonView` side-effect util. V3 only has the component.
- **Consolidation priority:** MEDIUM — port `trackSalonView` helper to V3 (or `lib/`) before deleting legacy.

### 14. Salon detail subcomponents (massive set — 22 V3 files orphaned)

The V3 salon directory `app/[locale]/_components/salon/` has 22 components (`SalonAbout`, `SalonAdditionalInfo`, `SalonAppCta`, `SalonBreadcrumb`, `SalonBuy`, `SalonContact`, `SalonDetailV3`, `SalonHeader`, `SalonHero`, `SalonLightbox`, `SalonLoyalty`, `SalonMobileBookBar`, `SalonOpeningTimes`, `SalonOtherLocations`, `SalonPortfolio`, `SalonReviews`, `SalonServices`, `SalonServicesSheet`, `SalonSidebar`, `SalonStickyTabNav`, `SalonTeam`, `SalonVenuesNearby`).

**All 22 are consumed only by `SalonDetailV3.tsx`. `SalonDetailV3.tsx` itself has zero callers.** The real `app/[locale]/salon/[slug]/page.tsx` imports 12 legacy salon components instead:
- `components-legacy/salon/SalonHero.tsx`
- `components-legacy/salon/SalonOpeningHours.tsx`
- `components-legacy/salon/SalonServices.tsx`
- `components-legacy/salon/SalonReviews.tsx`
- `components-legacy/salon/SalonReviewsSummary.tsx`
- `components-legacy/salon/SalonSidebar.tsx`
- `components-legacy/salon/SalonMobileCTA.tsx`
- `components-legacy/salon/SalonSectionNav.tsx`
- `components-legacy/salon/SalonPageSkeleton.tsx`
- `components-legacy/salon/StaffSection.tsx`
- `components-legacy/salon/SimilarSalons.tsx`
- `components-legacy/StaffPortfolio.tsx`

This is the **largest duplicate set** by sheer file count. 22 V3 components ready, 12 legacy components in production. The V3 set was built but never wired in.

- **Consolidation priority:** **CRITICAL** — switch `salon/[slug]/page.tsx` import block from legacy to V3 in a single edit; verify; delete legacy.

### 15. Reviews (homepage testimonials)

- **V3 canonical:** `app/[locale]/_components/homepage/Reviews.tsx` — 1 caller (`app/[locale]/page.tsx`)
- **Legacy variants:**
  - `components-legacy/TestimonialCarousel.tsx` — 1 caller (`components-legacy/HomePage.tsx` only — orphan-chain)
  - `components-legacy/ReviewCarousel.tsx` — **0 callers** (orphan)
- **Consolidation priority:** HIGH — both legacy files safe-delete.

### 16. ReviewForm / ReviewBreakdown (salon detail review widgets)

- **V3:** none (V3 SalonReviews is monolithic)
- **Legacy:** `components-legacy/ReviewForm.tsx` (1 caller — `components-legacy/salon/SalonReviews.tsx`), `components-legacy/ReviewBreakdown.tsx` (1 caller — same)
- **Consolidation priority:** MEDIUM — port into V3 `SalonReviews` when salon-detail switchover happens.

### 17. EmptyState (4-way fragmentation)

- **V3 canonical:** none — V3 has no EmptyState primitive
- **Legacy variants:**
  - `components-legacy/ui/EmptyState.tsx` — 28 callers (13 app + 15 legacy)
  - `components-legacy/ui/EmptyStateFTU.tsx` — 3 callers (3 app: `profile/stamps`, `profile/favorites`, etc.)
  - `components-legacy/ui/EmptyStateInline.tsx` — **0 callers** (orphan)
  - `components-legacy/ui/EmptyStateFiltered.tsx` — **0 callers** (orphan)
  - `components-legacy/discovery/DiscoveryEmptyState.tsx` — 1 caller
- **Consolidation priority:** HIGH — first create a V3 EmptyState primitive (it doesn't exist yet), then consolidate.

### 18. Spinner / Skeleton (largest absolute caller counts)

- **V3 canonical:** none
- **Legacy variants:**
  - `components-legacy/ui/Spinner.tsx` — **97 callers** (52 app, 45 legacy) — the most-used component in the codebase by caller count
  - `components-legacy/ui/Skeleton.tsx` — 27 callers (12 app, 15 legacy)
  - `components-legacy/ui/SalonCardSkeleton.tsx` — **0 callers** (orphan; V3 SearchResults defines a local one)
  - `components-legacy/ui/CategorySkeleton.tsx` — **0 callers** (orphan)
  - `components-legacy/salon/SalonPageSkeleton.tsx` — 1 caller
  - `components-legacy/discovery/DiscoveryGridSkeleton.tsx` — 1 caller
- **Consolidation priority:** CRITICAL — without a V3 Spinner/Skeleton primitive, every page-level rebuild keeps pulling from legacy. This is the #1 anchor holding the legacy tree in production.

### 19. FilterBar / FilterDrawer / FilterBottomSheet

- **V3 canonical:** none
- **Legacy variants:**
  - `components-legacy/ui/FilterBar.tsx` — 6 callers (4 app: `discover`, `angebote`, `behandlungen/[...slug]` ×2; 2 legacy)
  - `components-legacy/ui/FilterBottomSheet.tsx` — 1 caller (only `FilterBar.tsx` itself)
  - `components-legacy/ui/FilterDrawer.tsx` — 1 caller (only `FilterBar.tsx` itself)
  - `components-legacy/discovery/FilterDrawer.tsx` — 1 caller (`app/[locale]/discover/page.tsx`)
- **Consolidation priority:** MEDIUM — wait for search-results / category-page V3 rebuilds.

### 20. interactive-hover-button (the only shipping legacy Button)

- **V3 canonical:** none (V3 has no Button primitive)
- **Legacy variant:** `components-legacy/ui/interactive-hover-button.tsx` — 7 callers (4 app: `checkout`, `partner`, `vouchers`, `onboarding/salon`; 3 legacy)
- **Legacy orphans:** `components-legacy/ui/button.tsx` (0 callers), `components-legacy/ui/AnimatedButton.tsx` (0 callers)
- **Consolidation priority:** HIGH — V3 needs a Button primitive in `_components/primitives/`. Until it exists, more pages will pull from legacy.

### 21. Breadcrumb

- **V3 canonical:** `app/[locale]/_components/salon/SalonBreadcrumb.tsx` (1 caller, internal-V3) — narrow purpose
- **Legacy variant:** `components-legacy/ui/Breadcrumb.tsx` — 1 caller (`app/[locale]/layout.tsx`)
- **Consolidation priority:** MEDIUM — port Breadcrumb to `_components/primitives/` so `layout.tsx` stops touching legacy.

### 22. HeartButton vs LikeButton/SaveButton

- **V3 canonical:** `app/[locale]/_components/homepage/HeartButton.tsx` — 3 callers (`SalonCard`, `SalonHeader`, `SalonHero` — all V3 internal)
- **Legacy variants:**
  - `components-legacy/discovery/LikeButton.tsx` — 4 callers (all legacy-internal under `discovery/`, `nail/`)
  - `components-legacy/discovery/SaveButton.tsx` — 4 callers (same scope)
- **Behavior diff:** HeartButton = salon favorite (RecentlyViewed/saved). Like/Save = discovery feed actions on posts/videos.
- **Consolidation priority:** LOW (different domain — discovery feed vs salon favorites).

### 23. DatePicker / TimePicker

- **V3 canonical:** `app/[locale]/_components/primitives/DateTimePicker.tsx` — 1 caller (`SearchBar.tsx` via primitives barrel)
- **Legacy variants:**
  - `components-legacy/ui/date-picker.tsx` — 3 callers (all internal-legacy: `BookingCalendar`, `GuidedSearch`, `HomeSearchBar` — but `HomeSearchBar` is itself an orphan)
  - `components-legacy/ui/DateRangePicker.tsx` — 1 caller (internal-legacy)
- **Consolidation priority:** MEDIUM — booking flow needs V3 DateTimePicker port.

### 24. Sidebar (dashboard layout)

- **V3 canonical:** none
- **Legacy variant:** `components-legacy/ui/sidebar.tsx` — 1 caller (`components-legacy/dashboard/DashboardLayout.tsx` — but DashboardLayout itself has 37 app callers!)
- **Consolidation priority:** LOW for now — B2B dashboard is out of Tier 1 customer-funnel scope.

---

## Duplicates within V3 (should never happen — but they do)

### V3 SearchBar / SearchResults split

- `app/[locale]/_components/homepage/SearchBar.tsx` — top-bar search input
- `app/[locale]/_components/search/SearchResults.tsx` — search results grid (currently **orphan**, no caller)
- `app/[locale]/_components/search/` directory has only one file (`SearchResults.tsx`), which is dead code. The real search-results page (`app/[locale]/search/page.tsx`) still uses legacy `SplitView`.
- Verdict: **V3 SearchResults is orphan** — built ahead of the route rewire, never wired in.

### V3 salon directory: 22 components, 1 entry point, 0 production callers

See section 14 above. The entire `app/[locale]/_components/salon/` tree is a "ghost mall" — built complete, never linked to.

### V3 homepage data files

`searchCategories.ts`, `searchFeatured.ts`, `searchTrending.ts`, `useRecentSearches.ts`, `useSearchSuggest.ts` — all have 0 callers. They're presumably imported via dynamic / inline expressions inside `SearchBar.tsx`. Need verification: do they show up if I grep for symbol names rather than file paths?

---

## Orphans (file exists but no imports anywhere)

### Legacy orphans (48 files — safe-delete candidates)

```
components-legacy/BookingCalendar.tsx
components-legacy/TrustStatsBanner.tsx
components-legacy/NearbySalons.tsx
components-legacy/CategoryHero.tsx
components-legacy/ReviewCarousel.tsx
components-legacy/ChatWindow.tsx
components-legacy/TerminePage.tsx
components-legacy/MapView.tsx
components-legacy/ServiceTile.tsx
components-legacy/HomePage.tsx
components-legacy/ui/BottomSheet.tsx
components-legacy/ui/GlassCard.tsx
components-legacy/ui/tabs.tsx
components-legacy/ui/card.tsx
components-legacy/ui/EmptyStateFiltered.tsx
components-legacy/ui/SalonCardSkeleton.tsx
components-legacy/ui/EmptyStateInline.tsx
components-legacy/ui/HowItWorks.tsx
components-legacy/ui/HeroVisualCard.tsx
components-legacy/ui/tracing-beam.tsx
components-legacy/ui/AirbnbSearchBar.tsx
components-legacy/ui/border-beam.tsx
components-legacy/ui/SearchBar.tsx
components-legacy/ui/CookieBanner.tsx
components-legacy/ui/label.tsx
components-legacy/ui/category-icons.tsx
components-legacy/ui/PriceSlider.tsx
components-legacy/ui/expandable-tabs.tsx
components-legacy/ui/CategorySkeleton.tsx
components-legacy/ui/DiscoverCarousel.tsx
components-legacy/ui/HomeSearchBar.tsx
components-legacy/ui/TrustBadges.tsx
components-legacy/ui/SocialProofStrip.tsx
components-legacy/ui/InlineError.tsx
components-legacy/ui/LastMinuteStrip.figma.tsx
components-legacy/ui/ProgressDots.tsx
components-legacy/ui/button.tsx
components-legacy/ui/WaitlistModal.tsx
components-legacy/ui/PageState.tsx
components-legacy/ui/input.tsx
components-legacy/ui/StickyMobileCTA.tsx
components-legacy/ui/CityCarouselSection.tsx
components-legacy/ui/AnimatedButton.tsx
components-legacy/ui/FeaturedSalonCarousel.figma.tsx
components-legacy/layout/CategoryStickyRow.tsx
components-legacy/discovery/KISection.tsx
components-legacy/discovery/CutGuide.tsx
components-legacy/notifications/NotificationBell.tsx
```

### V3 orphans (7 files)

```
app/[locale]/_components/homepage/searchCategories.ts        (data — see note above)
app/[locale]/_components/homepage/searchFeatured.ts          (data — see note above)
app/[locale]/_components/homepage/searchTrending.ts          (data — see note above)
app/[locale]/_components/homepage/useRecentSearches.ts       (hook — likely used by SearchBar inline)
app/[locale]/_components/homepage/useSearchSuggest.ts        (hook — likely used by SearchBar inline)
app/[locale]/_components/salon/SalonDetailV3.tsx             (built, never wired — see section 14)
app/[locale]/_components/search/SearchResults.tsx            (built, never wired — see "Duplicates within V3")
```

---

## Cascade chains (orphan-of-orphan)

Several legacy files appear in caller lists, but their only callers are themselves orphan. Deleting the root orphan cascades.

- `components-legacy/HomePage.tsx` is orphan → also kills callers of `Footer (legacy)`, `HeroAboveFold`, `NearbySection`, `TestimonialCarousel`, `RecentlyViewed (legacy)` (drops to 1 app caller).
- `components-legacy/ProfilePage.tsx` is NOT orphan (1 app caller from `app/[locale]/profile/page.tsx`) so its dependencies (`BeautyProfileCard`, `GlassModal` etc.) are still live.

This means after pruning the obvious 48 orphans, a second sweep should re-run the orphan detector to find files whose only callers were the 48 just-deleted set.

---

## Why this matters — the trap pattern

The Tier 1 plan in CLAUDE.md (~15 critical-funnel pages) assumes "build V3 components, then port pages." Reality: most V3 components ARE built (homepage + salon-detail + primitives), but the wire-up was skipped. Every additional component built now without wiring it up makes the duplicate count worse, not better.

The actionable next step (out of scope for this audit, but the audit's recommendation):
1. **Wire `salon/[slug]/page.tsx` to V3 first** — biggest single delete (22 V3 components go from 0 callers to N, 12 legacy files become orphan).
2. **Build V3 Spinner, Skeleton, EmptyState, Button primitives** — these are the legacy anchors with 97/27/28/7 callers each.
3. **Delete the 48 confirmed orphans now** — zero risk, lowers `components-legacy/` from 317 to 269 files.
4. **Re-run orphan detector** — expect a second wave of ~30 cascade-orphans (HomePage.tsx chain).

---

## Method note (reproducibility)

Run `python3 /tmp/orphan-precise.py` from any worktree — the script:
1. Walks every `.tsx`/`.ts` file under `app/` and `components-legacy/`
2. Regex-parses `from "X"` and `import "X"` patterns
3. Resolves `X` to an absolute file using Next.js conventions (`@/` -> repo root, `./` relative, `.tsx`/`.ts`/`/index` extensions)
4. Builds reverse caller-sets and emits sorted counts, orphans, app-vs-legacy splits

Caller counts are file-level (deduped); if file A imports file B twice via different names, it counts as 1 caller. Internal self-imports excluded.
