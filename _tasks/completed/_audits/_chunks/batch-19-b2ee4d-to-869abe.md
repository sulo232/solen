# Audit Batch 19 — b2ee4d to 869abe

Date range: 2026-03-26 17:52 → 2026-03-26 19:55 (same day, ~2 hour sprint)

| # | sha | date | message | files | +/- | kind | lost? | alive? | drill? | notes |
|---|-----|------|---------|-------|-----|------|-------|--------|--------|-------|
| 1 | b2ee4d | 2026-03-26 17:52 | i18n(tier3): complete Phase 3 - wire remaining 9 components | 17 | +3070/-146 | add | NO | YES | YES | Wires i18n into 9 components (SalonCard, ChatWindow, BookingSuccess, CategoryHero, etc.); also bulk-adds 8 roadmap markdown docs in `_roadmaps/`. All translation keys confirmed pre-existing in de/en/fr/it.json. |
| 2 | 5632920 | 2026-03-26 18:21 | fix(api): fix salon creation 500 errors by removing non-existent columns and adding lat/lng fallbacks | 2 | +10/-6 | bug-fix | NO | YES | NO | Removes non-existent columns from salon INSERT in `app/api/salons/route.ts`; adds migration `20260326000001_add_missing_salon_columns.sql` to back-fill lat/lng. Surgical fix, no design impact. |
| 3 | 11de84 | 2026-03-26 18:25 | fix(api): remove phone_verified from salon insert to bypass schema cache error | 15 | +230/-60 | add | NO | YES | YES | Despite fix-scoped message, this commit is a broad addition: new Footer/Header i18n strings, StaffSection redesign, LanguageSwitcher enhancements, `lib/types.ts` expansion, next.config.mjs updates. The actual phone_verified fix is 1 line; the rest is unrelated Phase 3 work bundled together. |
| 4 | 1336d1 | 2026-03-26 18:58 | feat: Phase 3 landing page hero and search bar | 16 | +1887/-60 | add | NO | YES | YES | Introduces CityPage, CitySelector, GalleryManager, SalonAboutEditor, HomeSearchBar city-awareness, multi_city DB migration, and two new hooks. `CitySelector` was later deleted (not present at HEAD); `CityPage` and `HomeSearchBar` survive. Also adds `ts_errors.txt` artifact (debug file). |
| 5 | 4865a0 | 2026-03-26 19:11 | feat: Phase 3 Landing Page Redesign complete | 13 | +297/-50 | rewrite | YES | PARTIAL | YES | Replaces gradient-filled category cards with icon-based flat cards (6 new SVG category icon components). Introduces Discover Preview section in HomePage. Both the icon-grid pattern and the Discover section are **later killed** per DESIGN_SPEC §4 (DiscoverCarousel and old category grid removed from current HEAD). Category icons themselves survive at HEAD. Also commits build artifact files (`build_error.txt`, `temp_routes.txt`). |
| 6 | 6f5324 | 2026-03-26 19:15 | feat: Phase 4 & 5 - API City filtering and auto-detection | 4 | +46/-27 | add | NO | YES | NO | Adds city-param filtering to `/api/salons`, `/api/salons/trending`, and `/api/cities`. IP-based city auto-detection in `useCityDetection` hook added upstream. No design impact; backend plumbing only. |
| 7 | 3f0afcd | 2026-03-26 19:29 | fix: Registration city schema error and added City dropdown + UI: Added Discover Carousel | 9 | +158/-54 | add | NO | YES | YES | Adds `DiscoverCarousel` component (initial mock-data version) and City dropdown to onboarding form. Fixes lib/validations.ts for city field. Carousel is wired to HomePage. Also commits `lint_out.txt` artifact. |
| 8 | 9202fdd | 2026-03-26 19:37 | fix: Purge 'quartier' field from salon registry & UI completely | 5 | +25/-57 | cleanup | NO | PARTIAL | NO | Removes `quartier` from onboarding form, salon API insert, and validations. However, `quartier` is **not fully purged at HEAD** — it remains in `SalonCard.tsx`, `FeaturedSalonCarousel.tsx`, `CompareDrawer.tsx`, `app/[locale]/page.tsx` queries, and `lib/validations.ts` (quartierSubscribeSchema). The purge was incomplete. |
| 9 | 13da52 | 2026-03-26 19:42 | feat: DiscoverCarousel now uses real algorithmic Data and ItemCard dimensions | 2 | +63/-45 | rewrite | YES | NO | YES | Replaces mock static items in DiscoverCarousel with live `/api/discovery/feed` fetch + shuffle algorithm. ItemCard dimensions updated. Component survives to HEAD but **DiscoverCarousel is removed from HomePage** per DESIGN_SPEC §4 comment; the component file itself still exists at HEAD even though it's no longer imported in HomePage. |
| 10 | 869abe | 2026-03-26 19:55 | fix: Limit DiscoverCarousel to 5 items, remove tilt, fix tiktok loading & schema error | 2 | +10/-9 | bug-fix | NO | NO | NO | Caps carousel to 5 items, removes CSS tilt transform, fixes a schema error in salons API. Minor polish; the carousel's HomePage usage was subsequently killed by later design spec enforcement. |

---

## Summary

**Date range:** 2026-03-26 17:52 – 2026-03-26 19:55 (single afternoon sprint)

**Defining theme:** Multi-city Phase 3/4/5 execution — city-aware routing, landing page redesign with icon-based category grid, and DiscoverCarousel from mock to live data, all within ~2 hours of rapid iteration.

### Components introduced
- `components/CityPage.tsx` — alive
- `components/ui/CitySelector.tsx` — **deleted** (not at HEAD)
- `components/ui/DiscoverCarousel.tsx` — alive as file but removed from HomePage per DESIGN_SPEC §4
- `components/ui/HomeSearchBar.tsx` (city-aware rewrite) — alive
- `components/dashboard/GalleryManager.tsx` — alive
- `components/dashboard/SalonAboutEditor.tsx` — alive
- `components/icons/category/` (6 SVG icons: Coiffeur, Barber, Nails, Spa, Makeup, Waxing) — all alive
- `components/ui/SocialProofStrip.tsx` (minor touch) — alive
- `hooks/useCityDetection.ts` — alive
- `hooks/useSectionObserver.ts` — alive

### Components rewritten
- `components/HomePage.tsx` — icon-based category grid and Discover Preview section both later killed per DESIGN_SPEC §4; current HEAD uses entirely different homepage structure

### Components deleted
- `components/ui/CitySelector.tsx` — added in commit 4, deleted before HEAD

### Design tokens/patterns added
- Icon-based flat category cards (white bg + icon + token color) — **rejected/killed** by later design enforcement
- Discover Preview "tilt cards" section in HomePage — **rejected/killed** by later design enforcement
- `text-s-coral`, `text-s-amber`, `text-s-ink` token usage in category grid — pattern survived in other contexts

### Design tokens/patterns removed / rejected
- Gradient-filled category cards (`linear-gradient(145deg,...)`) replaced in commit 5, then entire pattern abandoned
- `quartier` field: partial purge (commit 8) but **not fully completed** — field remains in 4+ files at HEAD

### Artifacts committed (should not be in repo)
- `ts_errors.txt`, `build_error.txt`, `full_build_error.txt`, `temp_routes.txt`, `build_output.txt`, `build_trace.txt`, `lint_out.txt` — all debug artifacts committed across commits 4, 5, 7

### Incomplete operations
- `quartier` purge (commit 8) claims to be complete but field persists in `SalonCard.tsx`, `FeaturedSalonCarousel.tsx`, `CompareDrawer.tsx`, `app/[locale]/page.tsx`, and `lib/validations.ts` (quartierSubscribeSchema)

---

## Commits flagged for drill-down

| sha | reason |
|-----|--------|
| b2ee4d | >200 lines delta; bulk roadmap docs added alongside i18n wiring |
| 11de84 | commit message scope (1-line fix) vs actual breadth (Footer/Header/StaffSection/types/next.config) |
| 1336d1 | >200 lines; CitySelector introduced then later deleted; ts_errors.txt artifact |
| 4865a0 | design pivot: gradient→icon category grid; Discover section; all later killed; build artifacts |
| 3f0afcd | DiscoverCarousel initial add with lint_out.txt artifact |
| 13da52 | DiscoverCarousel rewrite to live data; component orphaned from HomePage at HEAD |
