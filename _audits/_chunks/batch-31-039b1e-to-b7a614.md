# Audit Batch 31 — 039b1e to b7a614

**Date range:** 2026-03-29 20:39–20:59 (all within ~20 min on the same evening)
**Branch:** claude/vigorous-spence-0e9aa7

| # | sha | date | message | files | +/- | kind | lost? | alive? | drill? | notes |
|---|-----|------|---------|-------|-----|------|-------|--------|--------|-------|
| 1 | 039b1e | 2026-03-29 20:39 | phase 1.2: category-tinted gradient fallback when no cover photo | components/SalonCard.tsx | +20/-5 | add | NO | YES | YES | Introduces `CATEGORY_FALLBACK_GRADIENTS` map (6 categories, all using palette-correct rgba values) and an inline IIFE to generate gradient CSS for no-photo fallback. Uses warm cream `rgba(250,246,239,0.98)` as gradient base, consistent with design system. Icon size bumped w-8→w-10. |
| 2 | 4515fc | 2026-03-29 20:43 | phase 1.2b: extract fallback gradient IIFE to named helper | components/SalonCard.tsx | +7/-7 | cleanup | NO | YES | NO | Pure refactor: IIFE inline in JSX extracted to module-level `getCategoryFallbackGradient()` function. Zero visual change; improves readability with no design token drift. |
| 3 | 4b5d8d | 2026-03-29 20:46 | fix(saved): add error state, auth guard, remove unicode heart, is_test filter | app/[locale]/account/saved/page.tsx, app/api/profile/favorites/route.ts, messages/de.json, messages/en.json, messages/fr.json, messages/it.json | +47/-14 | bug-fix | NO | YES | NO | Auth guard + error state for saved page; adds `errorTitle`/`errorMessage` i18n keys to all 4 locales; removes ♡ unicode from emptyMessage to prevent render inconsistencies. Filters `is_test` salons from favorites API. Functional correctness fix, no design system changes. |
| 4 | 0e8ff6 | 2026-03-29 20:47 | phase 1.3: rating always visible, price Ab CHF, neighborhood display | app/[locale]/page.tsx, components/SalonCard.tsx, lib/types.ts | +35/-20 | add | NO | YES | YES | Lowers rating visibility threshold from `review_count >= 5` to `average_rating > 0 \|\| review_count > 0`. Adds `quartier` neighborhood label below rating row. Switches price from Ø (average) to Ab (minimum) using new `min_price` field. Extends `SalonCard` type with `min_price`, `quartier`, `solen_score`. |
| 5 | c1bd15 | 2026-03-29 20:49 | fix(discovery): replace empty-div stub with proper EmptyState component | components/discovery/DiscoveryEmptyState.tsx, messages/*.json (×4) | +39/-1 | add | NO | YES | NO | Replaces placeholder empty div in `DiscoveryEmptyState` with a proper component using `EmptyState`/`AlertCircle`. Adds i18n keys to all 4 locales. Minimal visual treatment consistent with existing empty state patterns. |
| 6 | 96f131 | 2026-03-29 20:49 | fix(footer): replace large language switcher pills with compact text links | components/ui/LanguageSwitcher.tsx | +19/-14 | rewrite | NO | YES | NO | Footer language switcher changed from pill buttons to compact text links for reduced visual weight. Keeps `rounded-pill` on the inline text variant. Design direction: de-emphasize footer nav chrome. |
| 7 | 235808 | 2026-03-29 20:49 | fix(nav): simplify BottomTabBar active state — remove top bar and icon scale | components/layout/BottomTabBar.tsx | +1/-4 | cleanup | YES | NO | NO | Removes top indicator bar and icon scale transform from active tab. Note: HEAD `BottomTabBar.tsx` re-introduces icon scale (scale:1.08 for active) in a later commit, so the "simplify" was partially reverted — icon scale is alive again at HEAD. |
| 8 | 8ae417 | 2026-03-29 20:56 | fix(mobile): add touch active states and horizontal scroll fade to filter rows | app/globals.css, components/discovery/AISuggestionPills.tsx, components/ui/FilterBar.tsx | +55/-24 | add | NO | YES | YES | Adds global `@media (pointer: coarse)` touch feedback (opacity 0.78 + scale 0.97, 80ms) and `.scroll-fade-right` CSS utility. Wraps `AISuggestionPills` scroll container with new utility. Both patterns survive at HEAD. Important mobile UX baseline. |
| 9 | 8a2828 | 2026-03-29 20:58 | fix(legal): scaffold Impressum with dl structure and standard Haftungsausschluss | app/[locale]/impressum/page.tsx | +88/-39 | rewrite | NO | YES | YES | Major rewrite of Impressum page (+88/-39): moves from flat text to semantic `<dl>` structure with Haftungsausschluss boilerplate. >200 line file change — flagged for drill. No design token changes but page layout overhaul. |
| 10 | b7a614 | 2026-03-29 20:59 | phase 1.3b: i18n priceFrom, remove IIFE, fix new-badge threshold | components/SalonCard.tsx, messages/*.json (×4) | +18/-22 | cleanup | NO | YES | YES | Replaces hardcoded `"Ab"` with `t("priceFrom")` across all 4 locales. Hoists `priceToShow` to component top (removes IIFE wrapper introduced in C4). Changes new-badge guard from `review_count < 5` to `review_count === 0` to prevent badge/rating overlap. Final state of SalonCard pricing logic. |

---

## Summary

**Date range:** 2026-03-29 20:39–20:59 UTC+2 (one 20-minute burst)

**Defining theme:** SalonCard polish sprint — iterative refinement of the card's no-photo fallback, price display, rating threshold, and neighborhood field, followed by global mobile UX hardening (touch feedback, scroll fade) and a Impressum scaffold.

### Components introduced / rewritten / deleted
- **SalonCard.tsx** — iteratively modified across commits 1, 2, 4, 10: final state has `CATEGORY_FALLBACK_GRADIENTS`, `getCategoryFallbackGradient()` helper, `priceToShow` hoisted, `quartier` display, i18n priceFrom, `review_count === 0` new-badge guard
- **DiscoveryEmptyState.tsx** — stubbed-in proper EmptyState (C5)
- **AISuggestionPills.tsx** — wrapped in `.scroll-fade-right` utility (C8)
- **LanguageSwitcher.tsx** — rewritten from pills to compact text links (C6)
- **BottomTabBar.tsx** — simplified active state (C7); icon scale partially re-introduced in later work
- **app/[locale]/impressum/page.tsx** — major scaffold rewrite (C9)

### Design tokens added / removed
- Added: `CATEGORY_FALLBACK_GRADIENTS` uses existing palette rgba values (coral, amber, plum, sage, blue); not a new CSS token but formalizes the fallback mapping
- Added CSS: `.scroll-fade-right` utility + `@media (pointer: coarse)` active states in `globals.css`
- Removed: none

### Patterns adopted / rejected
- **Adopted:** Named helper functions over IIFEs in JSX (C2, C10)
- **Adopted:** `min_price` preferred over `avg_price` for price display; `Ab CHF X` convention (C4, C10 via i18n)
- **Adopted:** Neighborhood (`quartier`) as secondary metadata on card (C4)
- **Adopted:** `.scroll-fade-right` CSS utility for horizontal scroll overflow indication (C8)
- **Adopted:** `@media (pointer: coarse)` for touch-only active feedback (C8)
- **Rejected:** Unicode hearts in i18n copy (C3); `review_count < 5` new-badge guard (C10 changes to `=== 0`)

### Commits flagged for drill-down
- **039b1e** (C1) — `design:` adjacent, introduces visual fallback gradient system for cards
- **0e8ff6** (C4) — adds new display fields (quartier, min_price, solen_score), type extension + 3 SSR queries updated
- **8ae417** (C8) — touches `globals.css` + AISuggestionPills, establishes global mobile touch pattern
- **8a2828** (C9) — >200-line file rewrite of Impressum page
- **b7a614** (C10) — finalizes SalonCard pricing/badge logic, touches all 4 locale files
