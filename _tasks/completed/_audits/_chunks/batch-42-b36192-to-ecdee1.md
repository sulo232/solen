# Batch 42 — Audit Report

**Commits:** b36192 → ecdee1  
**Date range:** 2026-03-31 17:10 → 2026-04-01 17:04  
**Branch:** claude/vigorous-spence-0e9aa7

---

## Commit Table

| # | sha | date | message | files | +/- | kind | lost? | alive? | drill? | notes |
|---|-----|------|---------|-------|-----|------|-------|--------|--------|-------|
| 1 | b36192 | 2026-03-31 17:10 | feat: show demo discover items when feed is empty | 1 | +35/-6 | add | NO | YES | YES | Adds DEMO_DISCOVER_ITEMS fallback to DiscoverCarousel when feed is empty; switches card sizing from fixed px to `44vw max-w-[200px] aspect-[9/16]` (responsive). Uses `<img>` not next/image — fixed in commit 2. |
| 2 | 8c7ac3 | 2026-03-31 17:23 | fix: DiscoverCarousel demo fallback — relative positioning, next/image, aria-hidden, CTA index | 2 | +18/-18 | bug-fix | NO | YES | NO | Corrects positioning bug in demo fallback cards introduced in C1; replaces raw `<img>` with proper next/image, adds aria-hidden on decorative cards. Quick follow-up fix. |
| 3 | 62d80c | 2026-03-31 17:25 | feat: 180px compact carousel cards with demo fallback | 1 | +146/-163 | rewrite | NO | YES | YES | Major rewrite of FeaturedSalonCarousel (309-line file): adds DEMO_SALONS fallback, inline favorites toggle via API, Heart/Award icons, section `<h2>` heading replacing uppercase label, `title` prop. Old skeleton-only fallback replaced with real demo data. |
| 4 | ea980b | 2026-03-31 17:27 | design: white header bg, larger emoji icons, strip separator border | 1 | +143/-167 | rewrite | NO | YES | YES | Large Header.tsx rewrite: switches from glass-pill scrolled header to white bg header; imports ThemeToggle and AirbnbSearchBar; removes glass-frost on scroll for pure white. ~310 lines touched. |
| 5 | 389e9e | 2026-03-31 17:29 | design: homepage Phase 1 — demo carousels, 180px cards, CTA polish (P0+P1) | 1 | +108/-184 | rewrite | YES | YES | YES | HomePage.tsx Phase 1 redesign: removes SalonCard/Skeleton/EmptyState/LastMinuteCard/WeatherBanner/BlobBackground imports; adds ArrowRight CTA; refactors visits logic to recentCats/visitCategory/bubbleRank. gridContainerVariants motion imports removed — potentially lost animation logic. |
| 6 | 48c549 | 2026-03-31 17:32 | design: footer multi-column layout with platform/salons/legal columns | 5 | +122/-48 | add | NO | YES | YES | Footer restructured from simple footer to 3-column layout (Platform/Salons/Legal); adds i18n keys for all 4 locales (de/en/fr/it). New navigation links added to messages. |
| 7 | 8efdb9 | 2026-03-31 17:35 | design: Phase 2 polish — language switcher text-only, filled moon dark toggle | 2 | +10/-6 | cleanup | NO | YES | NO | Minimal polish: LanguageSwitcher switches to text-only display (no flag icons), ThemeToggle gets filled moon icon. Small 2-file change, lower risk. |
| 8 | 0644be | 2026-04-01 16:37 | design: roadmap 07 — design system & global polish | 15 | +973/-423 | rewrite | NO | YES | YES | Largest commit in batch: 15 files touched. globals.css gains typography scale CSS vars (`--text-xs` through `--text-3xl`), text color tokens (`--color-heading/#222222`, `--color-body/#484848`, `--color-muted`, `--color-border/#EBEBEB`), background reverted from warm cream (`34 44% 95%`) to white (`0 0% 100%`), glass utilities updated to pure white base. Button.tsx gets loading spinner + fullWidth + min-h-[44px]. Border color standardized to #EBEBEB system-wide. All `<img>` → next/image in 6 files. |
| 9 | c851be | 2026-04-01 16:38 | seo: roadmap 09 — meta tags, JSON-LD, hreflang across all pages | 9 | +621/-144 | add | NO | YES | YES | SEO-only commit: generateMetadata + JSON-LD BreadcrumbList/FAQPage injected across all 6 category pages, homepage, and salon layout. lib/seo.ts gains generateBreadcrumbSchema, generateFaqSchema, CATEGORY_FAQS (30 Q&As), x-default hreflang. No design token changes. |
| 10 | ecdee1 | 2026-04-01 17:04 | feat: roadmap 02 — salon cards (carousel, badges, metadata, grid) | 7 | +230/-89 | add | NO | YES | YES | Introduces SalonBadge.tsx (new 100-line component) with 5-tier priority badge system (Top/Sofort/Angebot/Neu/Walk-in). SalonCard switches to aspect-[4/3]. CategoryPage grid upgraded to grid-cols-1/2/3/4. DB migrations add walk_in_available + salon_min_prices. |

---

## Summary

**Date range:** 2026-03-31 17:10 – 2026-04-01 17:04 (same-day + next morning sprint)

**Defining theme:** Homepage + core UI blitz toward a demo-ready state — all major consumer-facing components rewritten or heavily patched in ~2 hours on Mar 31, followed by a deep design-system polish pass (roadmap 07) and SEO infrastructure on Apr 1.

### Components Introduced
- `components/ui/SalonBadge.tsx` — new, 100 lines, 5-tier badge priority system using coral `#E8624A` directly
- `lib/seo.ts` additions: `generateBreadcrumbSchema`, `generateFaqSchema`, `CATEGORY_FAQS`
- `supabase/migrations/20260401_salon_min_prices.sql` + `20260401_walk_in_available.sql`

### Components Rewritten
- `components/ui/DiscoverCarousel.tsx` — responsive sizing + demo fallback (C1+C2)
- `components/ui/FeaturedSalonCarousel.tsx` — demo fallback, favorites toggle, new heading style (C3)
- `components/layout/Header.tsx` — glass-pill → white bg header (C4)
- `components/HomePage.tsx` — Phase 1 redesign, removes several imports (C5)
- `components/layout/Footer.tsx` — single → 3-column layout (C6)
- `components/SalonCard.tsx` — aspect-[4/3], gallery_urls, social proof (C10)
- `components/CategoryPage.tsx` — responsive grid, wider padding (C8+C10)

### Components Deleted / Lost
- `gridContainerVariants`, `gridItemVariants`, `headingVariants` from `lib/motion` removed from HomePage imports (C5) — animation motion presets no longer applied to homepage grid. Verify if motion lib itself still used elsewhere.
- `WeatherBanner` removed from homepage (C5) — likely intentional per comment in diff
- `AirbnbSearchBar` removed from HomePage (C5) — moved to Header (C4)

### Design Tokens Added (C8 — globals.css)
- `--text-xs` through `--text-3xl` typography scale
- `--color-heading: #222222`, `--color-body: #484848`, `--color-muted: #6A6A6A`
- `--color-border: #EBEBEB`, `--color-hover-bg: #F7F7F7`, `--color-error/success/warning`
- Background reverted from warm cream `hsl(34 44% 95%)` → pure white `hsl(0 0% 100%)`
- Glass utilities updated from warm-tinted `rgba(250,246,239,*)` → pure white `rgba(255,255,255,*)`

### Design Tokens Removed / Changed
- `--bg` and `--base` changed from `#F7F7F7` → `#FFFFFF`
- `--glass-bg` changed from warm cream base to pure white base
- Header glass-frost/shadow-warm-lg scroll effect replaced with flat white (C4)

### Patterns Adopted
- Demo data fallback pattern: show DEMO_DISCOVER_ITEMS / DEMO_SALONS when DB is empty (C1, C3)
- Responsive sizing: `vw` + `max-w` + `aspect-ratio` instead of fixed px heights
- CSS custom property token system for typography and color (C8)
- `next/image` enforced over raw `<img>` tags (C2, C8)
- 5-tier badge priority system on SalonCard (C10)
- Multi-locale i18n for footer links (C6)

### Patterns Rejected / Removed
- Glass-pill scrolled header (replaced with flat white)
- Fixed-height carousel cards (replaced with aspect-ratio responsive)
- Warm-tinted glass overlays (replaced with pure white)
- Motion animation variants on homepage grid (gridContainerVariants removed)
- WeatherBanner in homepage

---

## Commits Flagged for Drill-Down

| # | sha | reason |
|---|-----|--------|
| 3 | 62d80c | FeaturedSalonCarousel 309-line rewrite — inline favorites API calls introduce fetch-on-render pattern; old SSR-driven carousel logic replaced |
| 4 | ea980b | Header.tsx 310-line rewrite — glass header removed; AirbnbSearchBar import added but may duplicate search in header vs. homepage |
| 5 | 389e9e | HomePage.tsx Phase 1 — motion animation imports removed; AirbnbSearchBar moved to Header; recentCats/bubbleRank API change |
| 8 | 0644be | 15 files / +973 lines — largest commit; background cream→white conversion affects every glass surface; typography token system introduced |
| 9 | c851be | 9 files / +621 lines — SEO: CATEGORY_FAQS 30 Q&As hardcoded; verify locale correctness |
| 10 | ecdee1 | SalonBadge hardcodes `#E8624A` hex directly instead of using CSS token `--s-coral`; aspect-[4/3] on SalonCard conflicts with later Q16 lock to 1:1 square cards |
