# Batch 27 Audit — 0c3ff4 to 2f1d70

Date range: 2026-03-28 19:53 → 2026-03-28 22:33
All 10 commits fall on a single day (Saturday 2026-03-28), a focused hardening + V5 design push.

| # | sha | date | message | files | +/- | kind | lost? | alive? | drill? | notes |
|---|-----|------|---------|-------|-----|------|-------|--------|--------|-------|
| 1 | 0c3ff4c | 2026-03-28 19:53 | profile & auth: interaction consistency + state safety fixes | 6 | +29/-9 | bug-fix | NO | YES | NO | Escape-key handlers + cancellation guards added to profile/auth pages; no visual/design change. |
| 2 | db5b1b9 | 2026-03-28 19:58 | discovery: interaction consistency + state safety fixes | 10 | +24/-17 | bug-fix | NO | YES | NO | backdrop-blur tightened to `[6px]` on FilterBottomSheet; aria-pressed added to pill buttons; transition specificity narrowed — minor design alignment, no token adds. |
| 3 | f3bb6c0 | 2026-03-28 20:03 | coiffeur/salon: fix fetch .ok checks, transitions, a11y | 4 | +43/-34 | bug-fix | NO | YES | NO | `.ok` guards patched on 5 fetches; Escape key + aria-pressed on AiMatcherModal; duration-150 standardised across salon page transitions. |
| 4 | e855b45 | 2026-03-28 20:07 | barber: cancellation guards, a11y fixes, transition consistency | 8 | +42/-18 | bug-fix | NO | YES | NO | backdrop-blur-sm → `[6px]` on BarbershopSections; Escape/role/aria on SmartReminderConfig; cancellation guards on FadeBlueprint and ChairManager fetches. |
| 5 | 9db4c02 | 2026-03-28 20:10 | nail: transition duration-150, aria-pressed, tab roles | 7 | +16/-10 | bug-fix | NO | YES | NO | role=tablist/tab added to NailClientTab; aria-pressed across AiArtGenerator, ShapeLengthPicker, TechPortfolio, NailDiscoveryFilters; duration-150 sweep on InspoBoard. |
| 6 | a63348b | 2026-03-28 20:20 | fix(homepage): replace solen_score with average_rating, remove crash-on-DB-error | 1 | +4/-5 | bug-fix | YES | YES | NO | Critical SSR crash fixed — `solen_score` column never existed; every homepage load threw 400 + "Etwas ist schiefgelaufen". Replaced with `average_rating`; graceful degradation on partial DB errors. |
| 7 | ba0b70a | 2026-03-28 20:23 | last-minute/search/shared-ui: .ok checks, cancelled guards, transition-colors duration-150, backdrop-blur-[6px] | 14 | +88/-57 | bug-fix | NO | YES | NO | Largest hardening sweep: GlassModal bg changed from `#FFFFFF` to `var(--raised)`; BottomSheet backdrop-blur → `[6px]`; Escape key on BottomSheet; SalonCard hover duration 500ms→250ms; ForecastWidget SVG fill uses `var(--raised)`. Minor design-token fixes bundled with safety work. |
| 8 | 93d116a | 2026-03-28 20:29 | fix: add missing components/compare/ to git | 3 | +390/-0 | add | NO | YES | YES | Introduced CompareContext, CompareBar, CompareDrawer — previously untracked; broken Vercel build. 390 net-new lines, all three files >100 lines. |
| 9 | f8daf46 | 2026-03-28 21:47 | fix: CompareProvider Suspense crash — useCompare returns safe noops outside provider | 1 | +12/-3 | bug-fix | NO | YES | NO | NOOP_COMPARE defaults returned when context is unavailable during Suspense loading phase; prevents entire-page crash. |
| 10 | 2f1d70e | 2026-03-28 22:33 | feat: V5 design overhaul — Phases 1-6A | 12 | +508/-225 | rewrite | YES | YES | YES | Major design pivot: introduces `glass-frost`, `glass-search`, `glass-toolbar` CSS classes; `card-v4` replaces prior card styles; v5 shadow tokens (`v5-card`, `v5-card-hover`, `v5-float`); v4-reveal/v4-scale-in keyframes; blob float animation REMOVED from globals.css; SalonCardSkeleton added; card radius changed 20px→16px (`card-lg` alias for old 20px); Footer blur blob removed; i18n strings added (lessFilters, moreFiltersToggle, fadpCompliant, changeLanguage). NOTE: introduces dark mode CSS variants despite dark mode being listed as retired in CLAUDE.md. |

---

## Summary

### Date range
2026-03-28 19:53 — 2026-03-28 22:33 (single day, ~3 hours)

### Defining theme
A systematic hardening pass (commits 1–9) followed by a substantial V5 design pivot (commit 10). The first nine commits applied a consistent set of fixes across the entire codebase in rapid succession: `.ok` guards on fetch responses, cancellation flags on useEffect async chains, Escape-key handlers on all modals, `aria-pressed` on toggle/filter buttons, `role=tablist/tab` on tab UIs, and global standardisation of `backdrop-blur-sm` → `backdrop-blur-[6px]` and `transition-colors duration-150`. Commit 10 then replaced the animation/glass/card foundation with V5 tokens and rewrote SalonCard and CategoryPage significantly.

### Components introduced / rewritten / deleted
- **Introduced:** `components/compare/CompareContext.tsx`, `components/compare/CompareBar.tsx`, `components/compare/CompareDrawer.tsx`, `components/ui/SalonCardSkeleton.tsx`
- **Rewritten:** `components/SalonCard.tsx` (252→significant restructure), `components/CategoryPage.tsx`, `components/layout/Header.tsx`, `components/layout/Footer.tsx`, `app/globals.css` (+223 lines net)
- **Deleted logic:** `blobFloat` keyframe + `animate-blob-float` class removed from globals.css; V3 card radius 20px promoted to `card-lg`, default `card` reduced to 16px

### Design tokens added / removed
**Added:**
- CSS utility classes: `.glass-frost`, `.glass-search`, `.glass-toolbar`, `.card-v4` with v5-updated hover shadow
- Tailwind shadow tokens: `elevation-1`, `elevation-2`, `elevation-3`, `v5-card`, `v5-card-hover`, `v5-float`, `v5-glow-coral`
- Tailwind animations: `v4-reveal`, `v4-scale-in`
- Tailwind keyframes: `v4-reveal`, `v4-scale-in`
- Tailwind border-radius alias: `card-lg` (20px)
- Ambient V5 token references in CategoryPage/Header

**Removed:**
- `blobFloat` keyframe and `animate-blob-float` animation class
- `rounded-card` changed from 20px → 16px (old value moved to `rounded-card-lg`)
- Comment reference to V3 design system in tailwind.config.js

**Pattern shifts in hardening commits:**
- `backdrop-blur-sm` → `backdrop-blur-[6px]` (system-wide)
- `backdrop-blur-[16px]` → `backdrop-blur-[6px]` on FilterBottomSheet
- `transition-all` → specific property transitions (e.g., `transition-colors`, `transition-[width]`)
- `duration-200`/`duration-300`/`duration-500` → `duration-150` (system-wide)
- GlassModal background: hardcoded `#FFFFFF` → `var(--raised)` (dark mode compatible)

### Patterns adopted / rejected
- **Adopted:** ARIA pressed/role patterns on all interactive toggles; Escape key handlers on all modal overlays; cancellation guards (`let cancelled = false`) on all useEffect async fetches; `duration-150` as the standard interaction duration
- **Rejected (removed):** Blob float animation (was already restricted in SOLEN_DESIGN.md §7); dark mode was called out as retired in CLAUDE.md but V5 adds `.dark .glass-frost`, `.dark .glass-search`, `.dark .glass-toolbar` — potential design-spec violation

### Notable bug fixes
- **Critical:** `solen_score` column crash (commit 6) — all homepage SSR renders were failing with a Supabase 400 error causing a full error page for every visitor
- **Critical:** Compare components untracked from git (commit 8) — Vercel builds were broken because `SalonCard` imported from an untracked file
- **Important:** CompareProvider Suspense crash (commit 9) — entire pages crashed during Suspense loading phase

### Commits flagged for drill-down

| sha | reason |
|-----|--------|
| 93d116a | 3 new files >100 lines each; CompareDrawer is 193 lines — review full component API |
| 2f1d70e | 508+/225- across 12 files including globals.css, tailwind.config.js, messages/*.json; V5 design pivot with V3→V4 radius change; dark mode classes added despite dark mode being retired; blob animation removed |
