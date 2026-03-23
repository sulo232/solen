# Design System & Tokens Audit Report

**Date:** 2026-03-22
**Scope:** All active files in `components/` and `app/` (excluding `src/` legacy)

---

## Section A: Missing Token Definitions (tailwind.config ↔ UI_RULES gap)

| # | Issue | File | Severity | Fix |
|---|---|---|---|---|
| A1 | `s-success`, `s-success-bg` used but NOT defined in tailwind.config.js or globals.css | GoLiveStep.tsx:89-91, salon/[slug]/page.tsx:395-396,823 | 🔴 | Add semantic tokens to tailwind.config.js |
| A2 | `s-warning`, `s-warning-bg` used but NOT defined in tailwind.config.js or globals.css | GoLiveStep.tsx:89-91 | 🔴 | Add semantic tokens to tailwind.config.js |
| A3 | `s-error`, `s-error-bg` documented in UI_RULES.md §18 but NOT defined in tailwind.config.js | (not yet used in code) | 🟡 | Add semantic tokens to tailwind.config.js |

---

## Section B: Banned Token Violations (active codebase only)

| # | Issue | File | Severity | Fix |
|---|---|---|---|---|
| B1 | `bg-amber-100 dark:bg-amber-900/30 text-amber-700` — generic Tailwind, not design token | SalonCard.tsx:232 | 🟡 | → `bg-s-amber-subtle text-s-amber-text` |
| B2 | `bg-amber-50 border border-amber-200` | dashboard/settings/page.tsx:566 | 🟡 | → `bg-s-amber-subtle border-s-amber/20` |
| B3 | `bg-amber-100 text-amber-700` status badge | dashboard/settings/page.tsx:662 | 🟡 | → `bg-s-amber-subtle text-s-amber-text` |
| B4 | `bg-amber-100 border-amber-300 text-amber-700` calendar colors | dashboard/calendar/page.tsx:343 | 🟡 | → `bg-s-amber-subtle border-s-amber/30 text-s-amber-text` |
| B5 | `bg-amber-100 text-amber-700` salon status | dashboard/all-salons/page.tsx:39 | 🟡 | → `bg-s-amber-subtle text-s-amber-text` |
| B6 | `bg-amber-50 text-amber-400` stat card | dashboard/platform-analytics/page.tsx:115 | 🟡 | → `bg-s-amber-subtle text-s-amber` |
| B7 | `bg-amber-50 text-amber-600` badge | dashboard/content-editor/page.tsx:68 | 🟡 | → `bg-s-amber-subtle text-s-amber-text` |
| B8 | `bg-amber-100 text-amber-700` dispute status | dashboard/disputes/page.tsx:39 | 🟡 | → `bg-s-amber-subtle text-s-amber-text` |
| B9 | `bg-amber-50` icon bg | bookings/[id]/approve-increase/page.tsx:108 | 🟡 | → `bg-s-amber-subtle` |
| B10 | `from-amber-100 to-amber-200 border-amber-300` illustration | warum-solen/page.tsx:242 | 🟡 | → use `s-amber-subtle` / `s-amber/30` tokens |
| B11 | `bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800` allergy warning | chat/ClientTags.tsx:100 | 🟡 | → use `s-error-bg`/`s-error` tokens (after A1 fix) |

---

## Section C: Rounded Token Violations

| # | Issue | File | Severity | Fix |
|---|---|---|---|---|
| C1 | `rounded-3xl` on GlassCard container | ui/GlassCard.tsx:20 | 🟡 | Design decision — keep as-is (24px provides premium glass feel > card 12px) |
| C2 | `rounded-3xl` on GlassModal | ui/GlassModal.tsx:75 | 🟡 | Keep — matches GlassCard pattern |
| C3 | `rounded-2xl` on CookieBanner | ui/CookieBanner.tsx:76,123 | 🟡 | → `rounded-card` (12px) |
| C4 | `rounded-2xl` on Toast | ui/Toast.tsx:58 | 🟡 | → `rounded-card` |
| C5 | `rounded-xl` on Skeleton base | ui/Skeleton.tsx:13 | 🟡 | → `rounded-card` |
| C6 | `rounded-2xl` on Skeleton card wrapper | ui/Skeleton.tsx:21 | 🟡 | → `rounded-card` |
| C7 | `rounded-2xl` on EmptyState icon wrapper | ui/EmptyState.tsx:44 | 🟡 | → `rounded-card` |
| C8 | `rounded-xl` on PWAInstallPrompt icon | ui/PWAInstallPrompt.tsx:67 | 🟢 | → `rounded-card` |
| C9 | `rounded-2xl` on warum-solen chat mockup | warum-solen/page.tsx:64,76,81,86 | 🟢 | Intentional chat-bubble aesthetic — keep |
| C10 | `rounded-xl` on brand page avatar | brand/[slug]/page.tsx:68,72 | 🟢 | → `rounded-card` |
| C11 | `rounded-2xl` on help page icon | help/page.tsx:58 | 🟢 | → `rounded-card` |
| C12 | `rounded-3xl` on auth pages (login/register/reset) | auth/*.tsx | 🟢 | GlassCard-like — keep for consistency with GlassCard |
| C13 | `rounded-lg` used for icon containers, tooltips | Multiple files | 🟢 | Acceptable — `rounded-lg` = `var(--radius)` = 12px = `rounded-card`. Equivalent but legacy syntax |

---

## Section D: Hardcoded Hex Colors (non-token)

| # | Issue | File | Severity | Fix |
|---|---|---|---|---|
| D1 | `#ECC94B` — not a design token, used for map pin | warum-solen/page.tsx:162,165 | 🟡 | → use `s-yellow` (#F2C144) or `s-amber` (#D4870A) |
| D2 | `#D4AF37` — old gold, not a design token | MapView.tsx:123,130 | 🟡 | → use `s-amber` (#D4870A) |
| D3 | `#9CA3AF` / `#6B7280` — generic Tailwind gray hex | MapView.tsx:139, SolenScoreCard.tsx:24-25 | 🟡 | → use `s-ink-tertiary` or `s-ink-disabled` tokens |
| D4 | `#22C55E` / `#EAB308` — hardcoded price-range colors | MapView.tsx:144 | 🟢 | Map-specific — create `s-map-cheap`/`s-map-mid` tokens or accept |
| D5 | `#25D366` — WhatsApp brand green | ProfilePage.tsx:187, referral/page.tsx:100 | 🟢 | Brand color — acceptable |
| D6 | `#f0f0f0` — chart grid stroke | dashboard/analytics/page.tsx (×10) | 🟢 | Recharts inline — acceptable for charting lib |
| D7 | Google auth logo SVG hex colors | auth/SignIn.tsx:151-154 | 🟢 | Brand colors in SVG — acceptable |

---

## Section E: Missing Dark Mode Pairs

| # | Issue | File | Severity | Fix |
|---|---|---|---|---|
| E1 | `bg-white` page wrapper without `dark:bg-s-dm-bg` | help/page.tsx:54 | 🟡 | Add `dark:bg-s-dm-bg` |
| E2 | `bg-white` search input without dark pair | help/page.tsx:76 | 🟡 | Add `dark:bg-s-dm-surface` |
| E3 | `bg-white` page wrappers (×3) without dark pair | help/[slug]/page.tsx:46,54,75 | 🟡 | Add `dark:bg-s-dm-bg` |
| E4 | `bg-white` card without dark pair | bookings/[id]/approve-increase/page.tsx:72 | 🟡 | Add `dark:bg-s-dm-surface` |
| E5 | `bg-white` ServiceTile without dark pair | ServiceTile.tsx:30 | 🟡 | Add `dark:bg-s-dm-surface` |

---

## Section F: Cross-Document Consistency

| # | Issue | Severity | Fix |
|---|---|---|---|
| F1 | UI_RULES.md §18 documents `s-success`, `s-error`, `s-warning` semantic tokens but they don't exist in tailwind.config.js | 🔴 | Add to tailwind.config.js (see A1-A3) |
| F2 | UI_RULES.md §9 documents `dark:text-s-dm-text-secondary (#C8BAA8)` — token exists in config but never used in any .tsx file | 🟢 | Informational — available when needed |
| F3 | UI_RULES.md §18 documents `text-s-ink-secondary`, `text-s-ink-tertiary`, `text-s-ink-disabled` — defined in config, never used in code (code uses `text-s-ink/70` opacity instead) | 🟢 | Informational — both patterns valid |
| F4 | Dark mode hex values are CONSISTENT across all three files (tailwind.config, UI_RULES, CLAUDE.md) | ✅ | No action needed |
| F5 | Light mode hex values are CONSISTENT across all three files | ✅ | No action needed |

---

## Summary

| Severity | Count |
|---|---|
| 🔴 Critical | 2 (missing semantic token definitions) |
| 🟡 Medium | 20 (banned amber-*, rounded-*, dark mode gaps, non-token hex) |
| 🟢 Low/Info | 12 (acceptable patterns, informational) |

### Priority Fix Order
1. **A1-A2** — Define `s-success`/`s-warning`/`s-error` semantic tokens in tailwind.config.js
2. **B1-B11** — Replace all `amber-*` generic Tailwind with `s-amber-*` design tokens
3. **E1-E5** — Add missing `dark:` pairs
4. **C3-C8** — Replace `rounded-2xl/xl` with `rounded-card`
5. **D1-D3** — Replace non-token hex with design tokens
