# Batch 23 Audit — 75ebb7 to fef50b

Date range: 2026-03-27 22:17 → 2026-03-28 10:11

| # | sha | date | message | files | +/- | kind | lost? | alive? | drill? | notes |
|---|-----|------|---------|-------|-----|------|-------|--------|--------|-------|
| 1 | 75ebb70 | 2026-03-27 | fix: add missing staff PATCH/DELETE API route — commission_rate now persists | 1 | +74/0 | bug-fix | NO | YES | NO | Adds PATCH+DELETE handlers to `app/api/staff/[id]/route.ts`; no design surface touched. Pure API fix for commission_rate persistence gap. |
| 2 | 4f11368 | 2026-03-27 | fix: onboarding wizard — KI Vorschläge validation, ScheduleStep auto-apply, Step 7 sync, schedule API | 11 | +2135/-13 | add | NO | YES | YES | Bulk-drops 7 roadmap planning docs into `_tasks/` alongside real onboarding fixes (SetupWizard.tsx +6 lines, ScheduleStep.tsx +76, new auto-apply API). Roadmap docs dominate the diff; the actual wizard fixes are modest. |
| 3 | a9c11ae | 2026-03-27 | R-CD0: category-to-dashboard auto-assignment — filter Spezial nav by salon categories | 3 | +51/-5 | add | NO | YES | YES | Adds `CATEGORY_NAV_MAP` and `useMemo` filtering to `DashboardLayout`; pulls categories from `/api/profile`. Uses correct Zone 4 style (no glass, no animation). Safe fallback for missing categories documented. |
| 4 | 3b8c54e | 2026-03-27 | R-CD1: category-aware dashboard shell | 10 | +402/-27 | add | NO | YES | YES | Introduces `lib/dashboard/category-nav.ts` registry + 4 stub dashboard pages (coiffeur-crm, spa-admin, makeup-admin, waxing-admin). i18n keys added to all 4 locales. Verification note claims Zone 4 compliance. |
| 5 | 932950b | 2026-03-27 | R-CD2: coiffeur dashboard suite — FormulaBook, ConsultationNotes, ColourCycleConfig | 19 | +2234/-16 | add | NO | YES | YES | Large addition: 3 new components (FormulaBook 280 lines, ConsultationNotes 208 lines, ColourCycleConfig 103 lines), 2 DB migrations, new API routes. Also adds barber components (FadeBlueprint 333 lines, LiveQueuePanel 163 lines) and queue-display page — scope creep beyond stated coiffeur focus. |
| 6 | fd06128 | 2026-03-27 | R-CD6: makeup dashboard suite | 13 | +2274/-14 | add | NO | YES | YES | FaceChartBuilder (427 lines), BridalPlanner (332 lines), KitInventory (331 lines), SkinToneMatcher (147 lines) all added. DB migration for makeup tables. SkinToneMatcher uses untranslated Fitzpatrick scale labels — noted in commit message. |
| 7 | b938098 | 2026-03-27 | R-CD4: spa dashboard suite — room manager, intake, wellness journal | 10 | +1341/-39 | add | NO | YES | YES | RoomManager (320 lines), WellnessJournal (354 lines), SpaIntake (32 lines) introduced. DB migration. Also updates `lib/feature-flags.ts` and `lib/intake-templates.ts`. WellnessJournal uses pain bars + tension tracking — visually rich domain-specific widget. |
| 8 | 5c150ff | 2026-03-27 | R-CD5: waxing dashboard suite | 12 | +1535/-11 | add | NO | YES | YES | BodyZoneSelector (227 lines), SensitivityLog (312 lines), RegrowthConfig (124 lines), ZonePackages (210 lines) added. DB migration for waxing_zone_preferences + waxing_sensitivity_log. RegrowthConfig reuses existing `services.reminder_cycle_days` field — good schema reuse. |
| 9 | f7e2b66 | 2026-03-28 | R-CD7: shared visual diagram framework | 19 | +1529/-139 | add | NO | YES | YES | Shared diagram components introduced: InteractiveZoneDiagram, HeadDiagram, BodyDiagram, FaceDiagram, HandDiagram. SVG placeholders added to `public/diagrams/`. FadeBlueprint (169 lines rewritten) and BodyZoneSelector, FaceChartBuilder, WellnessJournal all updated to include visual mode toggle. |
| 10 | fef50bd | 2026-03-28 | Migrate ClientSelectorDropdown to live pg backend and fix SetupWizard i18n label bugs | 28 | +2410/-1293 | rewrite | NO | YES | YES | Large net-positive churn: new `ClientSelectorDropdown` component backed by live pg, multiple dashboard pages simplified/rewritten. Adds `lib/constants/categories.ts`. Several pages have significant deletions (nail-admin -288+, barber-clients -190+) suggesting simplification. Also expands 6 roadmap docs substantially. |

---

## Summary

**Date range:** 2026-03-27 22:17 — 2026-03-28 10:11 (one working session, ~12 hours)

**Defining theme:** Category-aware B2B dashboard buildout — the R-CD sprint. A single intense session that scaffolded 6 category-specific dashboard suites (coiffeur, barbershop, makeup, spa, waxing) plus a shared visual diagram framework, all on top of a new category-nav routing layer.

### Components introduced
- `components/dashboard/coiffeur/FormulaBook.tsx` (280 lines)
- `components/dashboard/coiffeur/ConsultationNotes.tsx` (208 lines)
- `components/dashboard/coiffeur/ColourCycleConfig.tsx` (103 lines)
- `components/dashboard/barber/FadeBlueprint.tsx` (333 lines)
- `components/dashboard/barber/ExpressMenu.tsx` (118 lines)
- `components/dashboard/barber/LiveQueuePanel.tsx` (163 lines)
- `components/dashboard/barber/HeadDiagram.tsx` (127 lines)
- `components/dashboard/makeup/FaceChartBuilder.tsx` (427 lines)
- `components/dashboard/makeup/BridalPlanner.tsx` (332 lines)
- `components/dashboard/makeup/KitInventory.tsx` (331 lines)
- `components/dashboard/makeup/SkinToneMatcher.tsx` (147 lines)
- `components/dashboard/spa/RoomManager.tsx` (320 lines)
- `components/dashboard/spa/WellnessJournal.tsx` (354 lines)
- `components/dashboard/spa/SpaIntake.tsx` (32 lines)
- `components/dashboard/waxing/BodyZoneSelector.tsx` (227 lines)
- `components/dashboard/waxing/SensitivityLog.tsx` (312 lines)
- `components/dashboard/waxing/RegrowthConfig.tsx` (124 lines)
- `components/dashboard/waxing/ZonePackages.tsx` (210 lines)
- `components/shared/InteractiveZoneDiagram.tsx` (107 lines)
- `components/shared/BodyDiagram.tsx` (84 lines)
- `components/shared/FaceDiagram.tsx` (89 lines)
- `components/shared/HandDiagram.tsx` (68 lines)
- `components/shared/ClientSelectorDropdown.tsx` (117 lines)
- `lib/dashboard/category-nav.ts` (90 lines)
- `lib/diagrams/interactive-zone.ts` (80 lines)
- `lib/constants/categories.ts` (16 lines)

### Components rewritten
- `components/dashboard/barber/FadeBlueprint.tsx` — rewritten in commit 9 to add visual mode toggle

### Design tokens added/removed
- No new design tokens or color changes. All dashboard components use Zone 4 rules (rounded-[12px], no glass, no Bebas Neue, no animations) per commit messages. No `solen-coral.html` or `SOLEN_DESIGN.md` touched.

### DB migrations introduced
- `supabase/migrations/20260328_coiffeur_dashboard.sql` — extends client_formulas, adds consultation_notes
- `supabase/migrations/20260329_fade_blueprints.sql` — fade_blueprints table
- `supabase/migrations/20260328_spa_dashboard.sql` — spa_treatment_rooms, wellness_journals
- `supabase/migrations/20260328_waxing_dashboard.sql` — waxing_zone_preferences, waxing_sensitivity_log
- `supabase/migrations/20260329_makeup_dashboard.sql` — makeup_face_charts, bridal_workflows, makeup_kit_items

### Patterns adopted
- Zone 4 dashboard style (no glass, no blobs, no Bebas, functional layout)
- SVG placeholder diagrams in `public/diagrams/` with "coming soon" fallbacks
- Visual mode toggle pattern (text mode preserved as fallback in diagrams)
- `useMemo` for category-filtered nav (safe fallback for undefined categories)
- Shared `ClientSelectorDropdown` with live pg backend (replaces mock data patterns)

### Patterns rejected
- None observed (no reverts, no explicit rejections)

### Notable observations
- R-CD2 (coiffeur suite) commit also snuck in barber-specific components (FadeBlueprint, LiveQueuePanel, ExpressMenu) — scope creep relative to stated intent
- SkinToneMatcher Fitzpatrick scale labels remain untranslated (noted in commit, not yet resolved)
- 7 roadmap planning docs were bulk-added in a fix commit (commit 2) — planning docs mixed into functional commits throughout the batch
- Commit 10 shows large deletions across dashboard pages (net -1293 lines removed) indicating a simplification/consolidation pass that centralized client selection

---

## Commits flagged for drill-down

All commits except #1 are flagged (`drill? = YES`):

| sha | reason |
|-----|--------|
| 4f11368 | >200-line roadmap docs bulk-added; wizard fix mixed with planning artifacts |
| a9c11ae | touches `components/dashboard/DashboardLayout.tsx` with category nav |
| 3b8c54e | large new `lib/dashboard/category-nav.ts` + 4 page stubs + all i18n files |
| 932950b | multiple components >200 lines; scope creep (barber tools in coiffeur commit) |
| fd06128 | FaceChartBuilder 427 lines; SkinToneMatcher with untranslated i18n gap |
| b938098 | WellnessJournal 354 lines; RoomManager 320 lines; modifies feature-flags + intake-templates |
| 5c150ff | SensitivityLog 312 lines; waxing DB schema |
| f7e2b66 | rewrites FadeBlueprint (-169 lines replaced); adds 4 shared diagram components + SVGs |
| fef50bd | large rewrite commit: +2410/-1293 across 28 files including multiple dashboard pages and roadmap docs |
