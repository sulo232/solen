# Batch 25 Audit — Commits 2e7d00 to dc9a24

## Commit Table

| # | sha | date | message | files | +/- | kind | lost? | alive? | drill? | notes |
|---|-----|------|---------|-------|-----|------|-------|--------|--------|-------|
| 1 | 2e7d00e | 2026-03-28 16:30 | fix: coiffeur formula-photo API and ColourCycleConfig HTTP method | 3 | +101/-3 | bug-fix | NO | YES | NO | Creates missing formula-photo upload API route; fixes PUT→PATCH on ColourCycleConfig. No design token changes. |
| 2 | 6792ab1 | 2026-03-28 16:32 | fix(coiffeur): audit fixes — API gaps, error handling, design tokens, i18n | 10 | +406/-124 | bug-fix | NO | YES | YES | Replaces hardcoded red-* Tailwind with s-error design tokens in AllergyAlert; extracts 59 i18n keys per locale; adds .ok guards to fetches. Large diff warrants drill. |
| 3 | 2472f1a | 2026-03-28 16:36 | Fix marketing page useState→useEffect bug and add notifications API route | 6 | +374/-35 | bug-fix | NO | YES | NO | Fixes critical null salonId bug via useEffect; creates /api/notifications route; adds marketing i18n namespace across 4 locales. No design token impact. |
| 4 | 219c3f5 | 2026-03-28 16:38 | fix: add backend persistence to ZonePackages — replace hardcoded client state with API + Supabase | 6 | +201/-45 | add | NO | YES | NO | Adds /api/salon/waxing-zone-packages with auth+rate-limit; rewrites ZonePackages.tsx with optimistic delete and loading states. Functional uplift. |
| 5 | ef99423 | 2026-03-28 16:40 | Fix critical dashboard bugs: marketing useState→useEffect, null crashes, missing APIs | 14 | +96/-64 | bug-fix | NO | YES | NO | Broad null-safety pass (charAt guards, allSettled, NaN guard); overlaps with commits 3+4 but adds barber component fixes. No design tokens changed. |
| 6 | bf0c1d7 | 2026-03-28 16:50 | fix(nail): audit fixes — API gaps, i18n, dark mode, a11y | 12 | +415/-121 | bug-fix | NO | YES | YES | Creates /api/nail/retail/checkout; bg-white→bg-[--raised] across nail components for dark mode; full i18n overhaul of NailsSections (31 keys per locale). Large scope warrants drill. |
| 7 | fcddc6f | 2026-03-28 17:37 | makeup subsite: i18n, dark mode, a11y, error handling fixes | 7 | +38/-12 | bug-fix | NO | YES | NO | bg-white→bg-[--raised] in KitInventory and BridalPlanner; adds role="dialog" aria-modal to checkout modal; minimal makeup i18n namespace (4 keys). |
| 8 | be0ef83 | 2026-03-28 17:42 | spa subsite: useEffect cleanup guards, bg-white tokens, a11y fixes | 7 | +71/-29 | bug-fix | NO | YES | NO | Cancellation guards in 3 spa components; bg-white→bg-[--raised] throughout; aria-label+aria-pressed on interactive toggles. Adds 2 dashboardSpa i18n keys. |
| 9 | c2816fd | 2026-03-28 17:47 | waxing subsite: useEffect cleanup guards, bg-white tokens, locale fix, duration fix | 7 | +108/-60 | bug-fix | NO | YES | NO | Cancellation guards in all 6 waxing dashboard components; fixes hardcoded /de/ locale path; bg-white→bg-[--raised] across; PUT→PATCH on RegrowthConfig. |
| 10 | dc9a242 | 2026-03-28 18:38 | discovery: fix cancellation guards and bg-white tokens in remaining components | 4 | +28/-19 | bug-fix | NO | YES | NO | Final sweep of cancellation guards and bg-white→bg-[--raised] in 4 discovery components (ForYouSection, PickStylistFlow, RelatedTikToks, SimilarStyles). |

---

## Summary

**Date range:** 2026-03-28 16:30 – 2026-03-28 18:38 (single session, ~2 hours)

**Defining theme:** Systematic audit pass across all subsites — filling API 404 gaps, replacing hardcoded `bg-white` with `bg-[--raised]` design token for dark-mode compliance, adding useEffect cancellation guards, fixing PUT→PATCH HTTP method errors, and extracting hardcoded German strings to i18n namespaces.

### Components introduced
- `app/api/dashboard/coiffeur/formula-photo/route.ts` — new upload endpoint
- `app/api/notifications/route.ts` — new aggregated notifications endpoint
- `app/api/nail/retail/checkout/route.ts` — new nail retail checkout endpoint
- `app/api/salon/waxing-zone-packages/route.ts` — new waxing zone packages CRUD endpoint

### Components rewritten
- `components/nail/HandChart.tsx` — i18n + dark mode + a11y overhaul
- `components/nail/NailsSections.tsx` — full i18n overhaul (was 100% hardcoded German)
- `components/coiffeur/AiMatcherModal.tsx` — i18n extraction
- `components/coiffeur/CoiffeurSections.tsx` — i18n extraction
- `components/dashboard/waxing/ZonePackages.tsx` — replaced client-only state with API persistence

### Components deleted
None.

### Design tokens added
- `bg-[--raised]` pattern applied systematically across nail, makeup, spa, waxing, and discovery components as replacement for hardcoded `bg-white` (dark-mode compliance sweep).
- `s-error` token applied in `AllergyAlert.tsx` replacing red-* Tailwind utility classes.

### Design tokens removed
- `bg-white` removed from ~20+ component locations across subsites (replaced with `bg-[--raised]`).

### Patterns adopted
- `useEffect` cleanup with cancellation flag (`let cancelled = false; return () => { cancelled = true; }`) standardized across spa, waxing, and discovery components.
- HTTP method correction: PUT→PATCH on multiple service-update calls (`ColourCycleConfig`, `InfillReminderConfig`, `RegrowthConfig`).
- `.ok` check pattern added to fetch calls in several components.

### Patterns rejected
- Hardcoded locale path `/de/` replaced with `useLocale()` hook.
- `Promise.all` replaced with `Promise.allSettled` for non-fatal parallel fetches.

---

## Commits flagged for drill-down

| sha | reason |
|-----|--------|
| 6792ab1 | 406 lines changed across 10 files; design token swap (red-* → s-error) + mass i18n extraction; verify AllergyAlert token mapping is correct |
| bf0c1d7 | 415 lines changed across 12 files; HandChart.tsx full rewrite with i18n + a11y; verify 31-key nails namespace completeness and bg-[--raised] coverage |
