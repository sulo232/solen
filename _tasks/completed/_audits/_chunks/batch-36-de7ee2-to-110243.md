# Batch 36 — Audit Report

**Commits:** de7ee2 → 110243  
**Date range:** 2026-03-30 10:45 – 17:48  
**Branch:** claude/vigorous-spence-0e9aa7

---

## Commit Table

| # | sha | date | message | files | +/- | kind | lost? | alive? | drill? | notes |
|---|-----|------|---------|-------|-----|------|-------|--------|--------|-------|
| 1 | de7ee2 | 2026-03-30 10:45 | fix(search): mobile layout overlap and keyboard handling in bottom sheet | 1 | +20/-1 | bug-fix | NO | YES | NO | Adds visualViewport resize listener + min-h-0 flex fix + `id="gs-sheet"` to GuidedSearch bottom sheet; all are functional polish with no design token changes. |
| 2 | 1fffdab | 2026-03-30 10:48 | feat(search): replace 2-col category grid with vertical list layout | 1 | +28/-17 | rewrite | YES | YES | YES | GuidedSearch Step 1 replaced 2-column grid with vertical list; original grid pattern lost. Design direction shift toward single-column layout for category selection. |
| 3 | e4f904 | 2026-03-30 10:50 | feat(search): add smooth collapse/expand animations for completed steps | 1 | +57/-35 | add | NO | YES | YES | Wraps collapsed step rows in Framer Motion `AnimatePresence`+`motion.div` with height/opacity transitions (0.2s ease-out); no design token changes but motion pattern established. |
| 4 | 6e68b8 | 2026-03-30 10:56 | docs: update CLAUDE.md and INCOMPLETE_FEATURES for search flow polish | 2 | +12/-1 | docs-only | NO | YES | NO | Appends search polish items to INCOMPLETE_FEATURES and updates CLAUDE.md; no code changes. |
| 5 | ac709b | 2026-03-30 10:59 | feat(search): add inline calendar date picker to Step 3 (Wann) | 6 | +108/-7 | add | NO | YES | YES | Adds `inline` prop to SolenDatePicker enabling no-popover calendar; Step 3 gains `showCalendar` toggle + `specificDate` state; i18n key `steps.wann.specificDate` added to all 4 locales. |
| 6 | a20d49 | 2026-03-30 11:14 | fix(search): format specific date in pill + wrap SearchCriteriaChips in Suspense | 2 | +16/-3 | bug-fix | NO | YES | NO | Formats ISO date string for display pill and wraps SearchCriteriaChips in Suspense to prevent useSearchParams hydration warning. |
| 7 | 6c4d6b | 2026-03-30 11:19 | feat(nav): add Airbnb-style sticky category row in header with IntersectionObserver | 6 | +637/-2 | add | NO | YES | YES | New `CategoryStickyRow` component (131 lines) using custom category icons, IntersectionObserver via CustomEvent from HomePage; also creates large roadmap task file. Large addition, drill warranted. |
| 8 | 9b5056 | 2026-03-30 17:28 | phase: pass referral_code from localStorage into booking POST body | 1 | +5/-0 | add | NO | YES | NO | Small localStorage read of `solen_referral_code` injected into booking POST; cleared on success. Purely functional, no design impact. |
| 9 | 73b9ec | 2026-03-30 17:46 | fix: fix Impressum placeholder and DSGVO→nDSG in partner trust badges | 5 | +7/-10 | bug-fix | YES | YES | NO | Replaces `[ausstehend]` CHE placeholder + corrects EU DSGVO to Swiss nDSG across all 4 locales; old placeholder text lost (intentional). |
| 10 | 110243 | 2026-03-30 17:48 | feat: add auth-gated login sheet for saved/account tabs in BottomTabBar | 5 | +157/-43 | add | NO | YES | YES | BottomTabBar gains `requiresAuth` flag on tabs + Supabase session listener + contextual login bottom sheet with Google OAuth + email; significant rewrite of navigation component. |

---

## Summary

**Date range:** 2026-03-30 10:45 – 17:48 (single day, afternoon session)

**Defining theme:** GuidedSearch mobile UX refinement sprint + nav layer enhancements. The morning session was a tight incremental polish loop on `GuidedSearch.tsx` (5 commits in 34 minutes): mobile layout fixes, list layout swap, animations, inline calendar, date formatting. Afternoon pivoted to two independent features: sticky category header row and auth-gated BottomTabBar.

### Components introduced
- `components/layout/CategoryStickyRow.tsx` — new 131-line Airbnb-style sticky category icon row with IntersectionObserver/CustomEvent pattern

### Components rewritten / significantly modified
- `components/ui/GuidedSearch.tsx` — heavily evolved across 5 commits; 2-col grid replaced with vertical list, AnimatePresence step collapse, inline calendar picker added
- `components/layout/BottomTabBar.tsx` — auth-gating added (+157/-43), Supabase session listener, contextual login sheet embedded

### Components deleted
- None at HEAD level, but the 2-column category grid pattern within GuidedSearch was replaced

### Design tokens added/removed
- None directly; no changes to CSS variables, tailwind.config.js, or globals.css
- Motion timing convention established: `duration: 0.2, ease: [0.23, 1, 0.32, 1]` for search step transitions

### i18n changes
- `steps.wann.specificDate` key added to de/en/fr/it (commit 5)
- `partner.trust_gdpr` corrected from DSGVO/GDPR to nDSG/nLPD in all 4 locales (commit 9)

### Patterns adopted
- Framer Motion `AnimatePresence` + height/opacity for step collapse (GuidedSearch)
- `visualViewport` resize listener for soft keyboard handling in mobile sheets
- IntersectionObserver via CustomEvent bus for header/content sync (CategoryStickyRow)
- `requiresAuth` flag on nav tabs + inline login bottom sheet (vs. redirect to login wall)

### Patterns rejected
- 2-column category grid in search step 1 (replaced with vertical list)
- Hard redirect to login wall for auth-required tabs (replaced with contextual bottom sheet)

---

## Commits flagged for drill-down

| sha | reason |
|-----|--------|
| 1fffdab | Grid → vertical list rewrite in GuidedSearch; old grid pattern lost |
| e4f904 | AnimatePresence motion pattern; >200 lines changed effectively |
| ac709b | Inline calendar in date picker; new `inline` prop + 6 files |
| 6c4d6b | New 131-line component + 470-line roadmap task file created; large addition |
| 110243 | Major BottomTabBar rewrite; auth session lifecycle + embedded login sheet |
