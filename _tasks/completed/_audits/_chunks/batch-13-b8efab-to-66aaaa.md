# Batch 13 Audit — b8efab to 66aaaa
**Date range:** 2026-03-25 17:07 → 21:30  
**Branch:** claude/vigorous-spence-0e9aa7

## Commit Table

| # | sha | date | message | files | +/- | kind | lost? | alive? | drill? | notes |
|---|-----|------|---------|-------|-----|------|-------|--------|--------|-------|
| 1 | b8efab | 2026-03-25 17:07 | chore(cleanup): Execute Dead Code & Scope Cleanup (R08) | 9 | -345/+14 | cleanup | YES (temp) | NO (restored later) | YES | Deletes FeaturedBoards, LikeButton, AIProcessingIndicator, DiscoveryEmptyState, DiscoveryErrorState, DiscoveryGridSkeleton from components/discovery/. Also trims dead imports from makeup/spa/waxing pages. Components re-added as stubs in next commit. |
| 2 | 7a244c | 2026-03-25 20:51 | PREP: rename old FilterBar → SearchFilterBar to avoid naming collision | 127 | +24469/-210 | add | NO | YES | YES | Massive commit: renames FilterBar→SearchFilterBar, adds 40+ roadmap docs, adds CategoryTabBar, re-stubs deleted discovery components (1-line stubs each), updates CLAUDE.md, adds lint/tsc error output files, adds Supabase migrations. Not a design commit per se — bulk doc/planning dump bundled with code change. |
| 3 | cd51f2 | 2026-03-25 20:59 | feat(filter-pills): phase 5-6 — add i18n translations + export FilterBar components | 10 | +600/-1 | add | NO | YES | YES | Introduces FilterBar, FilterBottomSheet, FilterDrawer components (188/144/137 lines). Adds 'filters' i18n namespace across all 4 locales. Adds supabase migration 082_pricing_rules.sql. Filter UI components now available for use in discover/category pages. |
| 4 | 0693d7 | 2026-03-25 21:08 | NAV-MOBILE-P1: remove BottomNav from root layout — single nav architecture | 1 | +1/-3 | cleanup | YES | YES | NO | Removes BottomNav from root layout.tsx and strips phantom pb-16 md:pb-0 padding from main element. Establishes single-nav architecture prerequisite for hamburger migration. |
| 5 | 14de934 | 2026-03-25 21:15 | NAV-P1: replace text wordmark with SVG logo asset | 2 | +16/-4 | add | YES | YES | YES | Replaces inline text logo (font-display span) with /public/logo.svg. SVG uses Bebas Neue font, coral circle dot, warm ink text — matches design system. Note: dark:invert added for dark mode, but dark mode is retired per SOLEN_DESIGN.md. SVG embeds system font reference without @font-face guarantee. |
| 6 | ab9cb1 | 2026-03-25 21:16 | NAV-P2: increase nav bar min-height to 64px unscrolled, 56px scrolled | 1 | +2/-2 | add | NO | YES | NO | Adds min-h-[64px]/min-h-[56px] to Header scroll states. Surgical change to header sizing tokens. Maintains py-3/py-2 internal padding. |
| 7 | b8b2fc | 2026-03-25 21:21 | NAV-P4: PFP → logged-in dropdown menu, logged-out → login redirect | 5 | +105/-16 | add | YES | YES | YES | Replaces simple profile link with conditional auth-aware dropdown. Glassmorphic dropdown panel uses warm shadows. Adds handleSignOut with dynamic supabase import. Removes retired profileHref variable. Adds bookings/favorites i18n keys. 40px touch targets. Dropdown styling introduces glass pattern — must verify against SOLEN_DESIGN.md §6 glass-restriction rules. |
| 8 | a11305 | 2026-03-25 21:23 | NAV-P5: mobile hamburger — add migrated BottomNav items + Salon CTA | 5 | +47/-14 | add | NO | YES | YES | Expands mobile hamburger to include Discover/LastMinute/Bookings/Favorites/Messages items migrated from deleted BottomNav. Adds coral pill CTA for Salon Eintragen. Adds registerSalon i18n key. Active state styling with coral indicator. All items meet 44px touch targets. |
| 9 | 0dc0e9 | 2026-03-25 21:29 | phase 1: Sweep arbitrary leading classes and standardize placeholder line-height | 6 | +12/-12 | cleanup | NO | YES | NO | Removes leading-6 from OffPeakManager and leading-5 from DynamicPricingConfig. Standardizes ItemCard and VideoCard line-height. Purely typography token sweep — no visual regression risk. |
| 10 | 66aaaa | 2026-03-25 21:30 | phase 2: Remove banned scale animation from SalonCard image hover | 5 | +9/-9 | cleanup | NO | YES | NO | Removes group-hover:scale-[1.03] from SalonCard image. Hover effect preserved via parent motion.div whileHover. Also incidentally touches privacy/terms/warum-solen/badge-manager pages (minor class fixes). Design-system compliant — scale animation was banned per motion rules. |

---

## Summary

**Date range:** 2026-03-25 17:07 → 2026-03-25 21:30 (single afternoon session)

**Defining theme:** Navigation architecture consolidation + UI infrastructure scaffolding. The batch spans a complete migration from dual-nav (BottomNav + Header) to single-nav (Header only), plus introduction of filter pill components and discovery dead-code removal.

### Components Introduced
- `components/ui/FilterBar.tsx` (188 lines)
- `components/ui/FilterBottomSheet.tsx` (144 lines)
- `components/ui/FilterDrawer.tsx` (137 lines)
- `components/discovery/CategoryTabBar.tsx` (60 lines)
- `/public/logo.svg` (SVG wordmark asset)

### Components Rewritten
- `components/layout/Header.tsx` — iteratively extended across 4 NAV-P commits: SVG logo, height tokens, auth-aware profile dropdown with glass panel, expanded mobile hamburger

### Components Deleted
- `components/discovery/FeaturedBoards.tsx` (deleted in b8efab, re-added as 1-line stub in 7a244c, later rebuilt)
- `components/discovery/LikeButton.tsx` (same pattern)
- `components/discovery/AIProcessingIndicator.tsx`, `DiscoveryEmptyState.tsx`, `DiscoveryErrorState.tsx`, `DiscoveryGridSkeleton.tsx` (same — deleted then stubbed)
- `components/BottomNav` removed from layout (not file-deleted, just detached)

### Design Tokens Added/Removed
- Added: `min-h-[64px]` / `min-h-[56px]` as nav height tokens
- Removed: `leading-6`, `leading-5` arbitrary line-height classes (typography sweep)
- Removed: `group-hover:scale-[1.03]` (banned scale animation from SalonCard)
- Added: coral `#E8624A` dot as SVG in logo.svg (matches palette)

### Patterns Adopted
- Single-nav architecture (hamburger absorbs BottomNav)
- Auth-conditional UI in Header (dropdown vs. login redirect)
- Dynamic Supabase client import in sign-out flow
- SVG logo over text-based wordmark

### Patterns Rejected/Flagged
- Glassmorphic dropdown in Header (NAV-P4) — needs verification against §6 restriction (glass allowed in 3 contexts only)
- `dark:invert` on logo.svg — dark mode is retired per SOLEN_DESIGN.md

### i18n Changes
- Added `filters` namespace (9 keys: filter/close/reset/apply/closeFilter/moreFilters/more/removeFilter/clearAll) across de/en/fr/it
- Added `bookings`, `favorites`, `registerSalon` keys across all 4 locales

### Infrastructure Notes
- Commit 7a244c is a bulk planning dump: 40+ roadmap docs added in same commit as FilterBar rename — unusual hygiene, hard to diff
- Lint output files (lint_err.txt, lint_err2.txt, tsc_err.txt) committed to repo root — should be gitignored

---

## Commits Flagged for Drill-Down

| sha | reason |
|-----|--------|
| b8efab | Deleted 6 discovery components — confirm all are properly restored/rebuilt at HEAD |
| 7a244c | 127 files in one commit including bulk roadmap docs + re-stubbed components + CLAUDE.md changes — review CLAUDE.md delta for design spec drift |
| cd51f2 | 3 new filter UI components (>200 lines combined) — verify design token compliance in FilterBar/FilterBottomSheet/FilterDrawer |
| 14de934 | SVG logo: dark:invert references retired dark mode; verify Bebas Neue font loads correctly in SVG context |
| b8b2fc | Glassmorphic dropdown — verify glass usage against §6 restriction (only 3 allowed contexts) |
| a11305 | Mobile hamburger expansion — verify active state uses correct coral token, not arbitrary hex |
