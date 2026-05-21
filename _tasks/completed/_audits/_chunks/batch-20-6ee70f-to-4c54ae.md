# Batch 20 Audit — 6ee70f…4c54ae

Date range: 2026-03-26 20:04 → 2026-03-26 22:10 (UTC+1)
Commits: 10

| # | sha | date | message | files | +/- | kind | lost? | alive? | drill? | notes |
|---|-----|------|---------|-------|-----|------|-------|--------|--------|-------|
| 1 | 6ee70f0 | 2026-03-26 20:04 | feat: Mobile Carousel dynamic scaling & Registration schema SQL | 4 | +74/-9 | add | NO | YES | NO | Adds hover state / dynamic scaling logic to `DiscoverCarousel.tsx` and a SQL migration for salon registration fields. No design token changes. |
| 2 | e3a4d6a | 2026-03-26 20:14 | feat(routing): integrate explicit category pages directly into multi-city schema | 3 | +252/-15 | add | NO | YES | YES | Creates a new roadmap task doc and expands `CategoryPage.tsx` + city/category page. Drill: roadmap doc + component >200 lines. |
| 3 | 310f711 | 2026-03-26 20:34 | fix: insert dummy quartier to bypass NOT NULL constraint | 1 | +1/-0 | bug-fix | NO | YES | NO | One-line DB workaround in salons API route — inserts a dummy `quartier` value. No visual impact. |
| 4 | 02d1766 | 2026-03-26 20:39 | fix: insert valid enum string 'grossbasel' to bypass CHECK constraint | 5 | +3/-20 | bug-fix | YES | YES | NO | Fixes DB enum, prunes dead type definitions in `lib/types.ts` (lost: removed unused type members). Also commits `ts_errors.txt` binary artifact. |
| 5 | b618b5a | 2026-03-26 21:08 | fix: resolve SWC parser crash and implement discovery carousel features | 34 | +871/-216 | rewrite | NO | YES | YES | Large batch-fix touching 34 files: carousel hover/expansion, search suggest/smart routes, new DB migrations, all 4 locale files. Drill: scope creep — many unrelated fixes bundled. |
| 6 | 226443b | 2026-03-26 21:12 | fix: replace cluttered text navigation with official category svgs in header | 4 | +31/-21 | add | YES | YES | YES | Swaps text nav links for custom SVG category icons in `Header.tsx`. Old text nav lost. Drill: design change to primary nav. |
| 7 | db289a5 | 2026-03-26 21:41 | fix: explicit width dimensions for custom category icons | 1 | +1/-1 | bug-fix | NO | YES | NO | One-line fix — adds explicit `width` to category icon elements in `Header.tsx` to prevent layout shift. |
| 8 | 3139b8b | 2026-03-26 21:48 | fix: merge duplicate auth i18n keys across all 4 locale files (de/en/fr/it) | 6 | +221/-87 | add | NO | YES | YES | Despite the fix message, also introduces `ScrollableFilterRow.tsx` (new component, 142 lines) and rewrites `NailsSections.tsx`. Drill: new component + commit scope mismatch. |
| 9 | 9488c1a | 2026-03-26 22:01 | fix: make tab bars fully opaque with solid backgrounds and proper z-index | 4 | +145/-93 | bug-fix | YES | YES | YES | Removes `backdrop-blur` glass effect from `SalonTabBar.tsx` and rewrites `BarbershopSections` + `CoiffeurSections`. Old semi-transparent/blur tab bar lost. Drill: design decision — glass removed from tab bar. |
| 10 | 4c54ae4 | 2026-03-26 22:10 | feat: real LikeButton with optimistic UI + Gespeichert in hamburger menu | 6 | +104/-2 | add | YES | YES | YES | Replaces stub `LikeButton` (was a 1-line no-op) with a full optimistic-UI implementation using `useTransition` + Heart icon. Old stub lost. Drill: core social feature added. |

---

## Summary

**Date range:** 2026-03-26 20:04 – 22:10 (UTC+1), all within a single evening session.

**Defining theme:** Discovery UX buildout + multi-city DB foundation, plus a rapid succession of DB constraint workarounds and UI polish fixes. The session oscillates between ambitious feature work and small correctional commits.

### Components introduced
- `components/ui/ScrollableFilterRow.tsx` — new, 142 lines (commit 8, message mislabelled as i18n fix)
- `components/discovery/LikeButton.tsx` — stub replaced with real implementation (commit 10)

### Components substantially rewritten
- `components/ui/DiscoverCarousel.tsx` — hover-aware dynamic scaling (commits 1, 5)
- `components/CategoryPage.tsx` — city-category routing expansion (commits 2, 5)
- `components/layout/Header.tsx` — text nav → SVG category icons (commit 6)
- `components/nail/NailsSections.tsx` — refactored alongside ScrollableFilterRow (commit 8)
- `components/barber/BarbershopSections.tsx`, `components/coiffeur/CoiffeurSections.tsx` — tab bar glass removal (commit 9)

### Components deleted / stubs removed
- `LikeButton` stub (1-line placeholder) replaced by real component

### Design tokens added/removed
- `z-40` and `bg-s-bg-base` applied to `SalonTabBar` (commit 9), removing `backdrop-blur` + semi-transparent bg — this removes glass effect from tab bar (aligns with SOLEN_DESIGN.md §6 glass restriction)
- No new tokens added; no palette changes

### Patterns adopted
- Optimistic UI with `useTransition` for social interactions (LikeButton)
- Hover-index state separate from scroll-active-index for carousel scaling
- SVG category icons in header replacing text links

### Patterns rejected
- Glass/blur on tab bars (explicitly removed, consistent with design system glass restriction)
- Text-based category navigation in Header

### DB migrations introduced (commits 1, 5)
- `20260326000001_salon_registration_fields.sql` — registration fields
- `20260326000002_match_search_embeddings_city.sql` — city-aware embedding search
- `20260326000003_salon_directory_city.sql` — city directory

---

## Commits flagged for drill-down

| sha | reason |
|-----|--------|
| e3a4d6a | New roadmap doc + CategoryPage expansion >200 lines, multi-city routing architecture |
| b618b5a | 34-file mega-commit bundling SWC fix, carousel, search routes, DB migrations, all locales — highest risk of hidden regressions |
| 226443b | Primary nav redesign: text → SVG icons. Lost old nav; confirm SVG assets are present at HEAD |
| 3139b8b | New `ScrollableFilterRow` component silently added under an unrelated i18n fix commit |
| 9488c1a | Design decision: glass/blur removed from tab bars; verify this aligns with current SOLEN_DESIGN.md §6 |
| 4c54ae4 | Core social feature (LikeButton) moved from stub to real implementation — verify API endpoint wired correctly |
