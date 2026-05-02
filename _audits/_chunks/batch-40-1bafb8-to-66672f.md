# Batch 40 Audit — 1bafb8 to 66672f

Date range: 2026-03-31 00:33 → 2026-03-31 09:47

| # | sha | date | message | files | +/- | kind | lost? | alive? | drill? | notes |
|---|-----|------|---------|-------|-----|------|-------|--------|--------|-------|
| 1 | 1bafb8 | 2026-03-31 00:33 | fix(homepage): execute Airbnb audit — BUG-1/2/3 + UNWIRED-2/5 + GAP-3/4 + POLISH-1/3/6/8 | 9 | +70/-24 | bug-fix | NO | YES | YES | Multi-item homepage polish pass: adds category anchor strip (smooth-scroll), review_count display in SalonCard, search-bar hover scale/shadow elevation-3, carousel "view all" arrow hover animation, larger pagination dots (w-2). All changes use existing design tokens (s-coral, s-ink, shadow-elevation-*). |
| 2 | 2f9d1c | 2026-03-31 09:36 | fix: prevent crash on /termine when unauthenticated — redirect to login | 1 | +14/-4 | bug-fix | NO | YES | NO | Auth guard added to TerminePage to redirect unauthenticated users rather than crashing. No design changes. |
| 3 | 6b2be7 | 2026-03-31 09:37 | feat: search empty state with category suggestions and filter reset | 1 | +37/-3 | add | NO | YES | YES | Adds empty-state UI with category suggestion pills and a filter-reset button to SearchResultGrid. Uses design tokens; categorically enriches the search zero-results experience with inline chips. |
| 4 | 04b14d | 2026-03-31 09:39 | feat: last-minute empty state with category suggestions and notify button | 2 | +55/-13 | add | NO | YES | YES | Adds empty state to /angebote with category suggestions and a "Notify Me" button. Also creates _tasks/INCOMPLETE_FEATURES.md (new file) documenting a known blocker: notify button POSTs to /api/waitlist with wrong schema and fails silently (low priority). |
| 5 | 23ef3a | 2026-03-31 09:40 | fix: replace 60+ silent .catch(() => {}) with descriptive console.error logging | 99 | +290/-148 | cleanup | NO | YES | YES | Massive sweep across 99 files replacing silent error catches with labeled console.error calls per CLAUDE.md rule. Also introduces app/[locale]/coming-soon/page.tsx and app/api/coming-soon-notify/route.ts as new pages. No design changes but >200 lines touched. |
| 6 | 88e097 | 2026-03-31 09:41 | fix: replace auth TODO stub with proper profile fetch in voucher buy flow | 1 | +12/-35 | bug-fix | NO | YES | NO | Replaces auth TODO placeholder in voucher buy page with real Supabase profile fetch. No visual/design changes. |
| 7 | 9e8817 | 2026-03-31 09:41 | feat: add Recently Viewed carousel to homepage | 1 | +10/-0 | add | NO | YES | YES | Exports getRecentlyViewed() helper from RecentlyViewed.tsx for SSR-safe localStorage access. Minimal change; no new visual component introduced in this commit, just the utility export. |
| 8 | 086a08 | 2026-03-31 09:44 | feat: full i18n migration of salon detail page — 40+ strings extracted | 1 | +29/-29 | cleanup | NO | YES | NO | Replaces 40+ hardcoded strings on salon detail page with i18n keys. Pure i18n refactor, no logic or design changes. |
| 9 | 96f6b3 | 2026-03-31 09:44 | feat: add Instant Book badge to salon cards | 2 | +8/-1 | add | NO | YES | YES | Adds coral Zap icon + "Instant Book" badge to SalonCard when booking_confirmation_mode === "instant". Uses s-coral color tokens and Lucide Zap icon, consistent with design system. |
| 10 | 66672f | 2026-03-31 09:47 | feat: full i18n migration of compare page — 12 TODO markers resolved | 1 | +48/-43 | cleanup | NO | YES | NO | Resolves 12 i18n TODO markers on the compare page. Pure i18n refactor with no layout or design changes. |

---

## Summary

**Date range:** 2026-03-31 00:33 → 2026-03-31 09:47 (single day, two sessions)

**Defining theme:** Homepage and marketplace polish sprint. The first commit (1bafb8) is a broad Airbnb-audit fix batch applying multiple UX polish items. The remaining nine commits (all within a ~11 minute window) are rapid individual features and maintenance tasks: auth guards, empty states, error-logging hardening, i18n extraction, and small UI badges. No design regressions detected; all visual work uses existing tokens.

### Components introduced
- `app/[locale]/coming-soon/page.tsx` — new coming-soon page (created in commit 5)
- `app/api/coming-soon-notify/route.ts` — new notify API route (commit 5)
- `_tasks/INCOMPLETE_FEATURES.md` — tracking file created (commit 4)

### Components rewritten
- None (no full rewrites)

### Components with significant changes
- `components/HomePage.tsx` — category anchor strip added, carousel IDs added
- `components/SalonCard.tsx` — review_count display + Instant Book badge
- `components/ui/AirbnbSearchBar.tsx` — hover scale + shadow-elevation-3
- `components/ui/CityCarouselSection.tsx` — view-all threshold lowered, arrow animation
- `components/search/SearchResultGrid.tsx` — empty state with category chips
- `app/[locale]/angebote/page.tsx` — empty state with notify button

### Design tokens added/removed
- No new tokens introduced. Existing tokens used: `s-coral`, `s-ink`, `shadow-elevation-2`, `shadow-elevation-3`, `s-dm-text`, `rounded-pill`, `rounded-search`, `font-heading`, `font-body`.

### Patterns adopted
- Anchor-strip navigation for section jumping (smooth-scroll via `scrollIntoView`)
- Hover micro-animation: `scale-[1.005]` + shadow elevation bump on search bar
- Directional arrow animation via `group-hover:translate-x-1`
- Instant Book signal badge on SalonCard using Zap icon

### Patterns rejected / no change
- No dark-mode removals (still present in all modified files)
- No blob changes
- No glass context changes

### Known issues flagged
- `_tasks/INCOMPLETE_FEATURES.md` (created in commit 4) documents that the "Notify Me" button in /angebote POSTs to `/api/waitlist` with an incompatible schema — fails silently. Needs a dedicated endpoint or schema extension.

---

## Commits flagged for drill-down

| sha | reason |
|-----|--------|
| 1bafb8 | Multi-item polish batch; touches design components + messages/* |
| 6b2be7 | New empty-state UI pattern introduced in SearchResultGrid |
| 04b14d | New empty-state + known broken Notify Me button (INCOMPLETE_FEATURES.md created) |
| 23ef3a | 99 files changed, >200 lines; introduces coming-soon page alongside error-logging sweep |
| 9e8817 | Message says "add Recently Viewed carousel" but only exports a utility — actual carousel integration not in this commit |
| 96f6b3 | New Instant Book badge on SalonCard — design token usage to verify |
