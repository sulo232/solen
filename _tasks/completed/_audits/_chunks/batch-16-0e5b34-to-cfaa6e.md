# Batch 16 Audit — Commits 0e5b34 to cfaa6e

Date range: 2026-03-25 22:35:45 → 2026-03-25 23:00:37
Branch: claude/vigorous-spence-0e9aa7

| # | sha | date | message | files | +/- | kind | lost? | alive? | drill? | notes |
|---|-----|------|---------|-------|-----|------|-------|--------|--------|-------|
| 1 | 0e5b34b | 2026-03-25 22:35 | KI-P1.2: AI recommendation engine with Gemini 2.0 Flash + locale-aware prompts | 1 | +232/0 | add | NO | YES | NO | Adds `/api/recommendations` route. Backend only — no design tokens touched. Rate-limited, locale-aware, cold-start fallback, anti-hallucination guard. |
| 2 | e54f264 | 2026-03-25 22:35 | phase 4: add similar salons section to salon detail page | 7 | +156/-7 | add | NO | YES | YES | New `SimilarSalons.tsx` component + API route. Uses existing Skeleton component. i18n added to all 4 locales. No explicit design token violations visible in stat output. |
| 3 | 36ede11 | 2026-03-25 22:36 | docs: create INCOMPLETE_FEATURES.md with voucher system phases 4-5 deferred work | 1 | +129/0 | docs-only | NO | YES | NO | Creates `_tasks/INCOMPLETE_FEATURES.md`. Purely documentation — no code impact. |
| 4 | d3a9174 | 2026-03-25 22:37 | PREFS-P2-P3: customer preferences in profile settings + i18n | 2 | +328/0 | add | NO | YES | YES | New `CustomerPreferencesForm.tsx` (220 lines) and additions to `ProfilePage.tsx` (108 lines). Commit claims "Zone 3 styling" (rounded-input, shadow-warm-md, no glass) — Zone language is retired but underlying tokens appear correct. |
| 5 | a6f2a0c | 2026-03-25 22:38 | KI-P2.1: create KI recommendations UI section with Zone 1 styling | 1 | +150/0 | add | NO | YES | YES | New `KISection.tsx` (150 lines). References "Zone 1/2/3/4" language in prop interface and JSDoc — both are retired per CLAUDE.md. Gradient bg-gradient-to-b from-s-coral-subtle/40 to-s-bg-base uses correct design tokens. Dark mode support present (dark: variants). |
| 6 | fcafb91 | 2026-03-25 22:41 | KI-P2.2: add AI reason tooltip to SalonCard with Sparkles icon | 1 | +14/-2 | add | NO | YES | YES | Surgical addition to `SalonCard.tsx`. Tooltip uses rounded-card and shadow-warm-md — correct tokens. Mentions dark:bg-s-dm-surface — dark mode is retired per CLAUDE.md §Retired. |
| 7 | c23ea92 | 2026-03-25 22:43 | KI-P2.3: add PostHog tracking for AI recommendation clicks + refresh | 1 | +22/-2 | add | NO | YES | NO | Adds PostHog tracking events to `KISection.tsx`. Pure analytics instrumentation, no design changes. Completes KI feature (P1.1–P2.3). |
| 8 | 9743f96 | 2026-03-25 22:50 | docs: document 7 incomplete features in INCOMPLETE_FEATURES.md | 7 | +186/0 | docs-only | NO | YES | NO | Appends 7 detailed incomplete-feature entries to INCOMPLETE_FEATURES.md AND moves 6 components to `components/_archive/` (CompareBar, CompareDrawer, WeatherBanner, WaitlistModal, RecommendedSalons, QuartierTile). The archive moves are functional. |
| 9 | 547d649 | 2026-03-25 22:52 | cleanup: archive orphaned components per Rule 41 | 4 | +232/-3 | cleanup | NO | PARTIAL | NO | Removes QuartierTile from `components/index.ts`. Also modifies CLAUDE.md (+173 lines) and creates a mysterious agent-comms file. Archived components not visible at HEAD (`components/_archive/` files missing from ls-files). |
| 10 | cfaa6e3 | 2026-03-25 23:00 | V3 Master Lint: fix N4, TY2, M3, T6 violations (partial certification) | 33 | +166/-40 | cleanup | NO | PARTIAL | YES | Broad lint pass touching 33 files. Replaces `hover:bg-s-coral-hover` → `hover:brightness-[1.06]`, `font-display` → `font-heading`, x→y transitions in animations. Creates `_roadmaps/V3-CERTIFICATION-REPORT.md` (not present at HEAD). Deferred T2/T3/T5/TY1 violations noted. |

---

## Summary

**Date range:** 2026-03-25 22:35 – 23:00 (25 minutes of rapid feature development)

**Defining theme:** AI-powered KI (Künstliche Intelligenz) recommendation feature build-out (P1.2 through P2.3), accompanied by similar-salons discovery, customer preferences form, and a broad design-token lint pass.

### Components introduced
- `components/discovery/KISection.tsx` — AI recommendation section (Zone 1 gradient, Skeleton loading, PostHog tracking)
- `components/salon/SimilarSalons.tsx` — fetches 3 salons by quartier+category
- `components/booking/CustomerPreferencesForm.tsx` — allergies/skin-type/preferences form

### Components rewritten
- `components/SalonCard.tsx` — added optional `aiReason` prop + Sparkles tooltip (surgical)

### Components archived (moved, not deleted)
- `components/_archive/CompareBar.tsx`, `CompareDrawer.tsx`, `WeatherBanner.tsx`, `WaitlistModal.tsx`, `RecommendedSalons.tsx`, `QuartierTile.tsx`
- Note: archive directory not present at HEAD (`git ls-files` returns MISSING) — these may have been later removed or the archive was cleaned up

### APIs introduced
- `app/api/recommendations/route.ts` — Gemini 2.0 Flash, rate-limited, cold-start fallback
- `app/api/salons/similar/route.ts` — quartier+category similarity

### Design tokens added/removed
- No new tokens defined
- `hover:bg-s-coral-hover` globally replaced by `hover:brightness-[1.06]` (commit 10, 24 files)
- `font-display` → `font-heading` corrected in 5 files (commit 10)

### Patterns adopted
- KI Section uses correct coral-subtle/coral gradient tokens
- Skeleton component used for loading states (per roadmap rule)
- PostHog event tracking pattern established for AI feature CTR
- Anti-hallucination prompting documented in API route

### Patterns/flags to review
- **Zone 1/2/3/4 language** appears in `KISection.tsx` (prop `zone?: 1|2|3|4`) — this language is retired per CLAUDE.md; the prop should be renamed or removed
- **Dark mode** (`dark:` variants) added in KI tooltip (SalonCard commit 6) — dark mode is retired per CLAUDE.md §Retired
- Commit 9 (`547d649`) modifies `CLAUDE.md` substantively (+173 lines) and creates a file named `c\357\200\272Userssulodsolen.agent-comms.md` — unusual agent communication artifact
- `_roadmaps/V3-CERTIFICATION-REPORT.md` created in commit 10 but absent at HEAD — deleted later

---

## Commits flagged for drill-down

| sha | reason |
|-----|--------|
| e54f264 | New SimilarSalons.tsx component — verify design token compliance |
| d3a9174 | CustomerPreferencesForm.tsx (220 lines) — Zone language in commit msg, verify actual token usage |
| a6f2a0c | KISection.tsx uses retired Zone 1/2/3/4 prop interface — flag for rename |
| fcafb91 | SalonCard tooltip adds dark mode variants — retired pattern |
| cfaa6e3 | 33-file broad lint pass — verify no regressions, check deferred T2/T3/T5/TY1 violations still open |
