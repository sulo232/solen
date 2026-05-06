# Onboarding Wizard Audit Report

**Date**: 2026-03-22
**Scope**: Salon Onboarding Wizard (2 systems)

---

## Architecture Note

There are **two separate onboarding flows**:

| Path | File(s) | Purpose | Lines |
|---|---|---|---|
| `/onboarding/salon/` | `app/[locale]/onboarding/salon/page.tsx` | Initial registration wizard (6 steps, all inline) | 1163 |
| `/dashboard/setup/` | `components/onboarding/SetupWizard.tsx` + 7 step components | Post-registration setup wizard | ~850 |

Both systems are actively used (not dead code).

---

## Section A: UI Issues

| # | Issue | File:Line | Severity | Fix |
|---|---|---|---|---|
| 1 | `to-coral/5` — missing `s-` prefix, gradient broken | page.tsx:1053 | 🔴 | `to-s-coral/5` |
| 2 | `rounded-3xl` — banned radius | page.tsx:53 | 🔴 | `rounded-card` |
| 3 | ZERO dark mode on entire page.tsx (1163 lines) — all surfaces `bg-white/80`, text `text-s-ink`, borders, overlays missing `dark:` pairs | page.tsx (throughout) | 🔴 | Add dark mode pairs |
| 4 | `shadow-glass` — not a design system token | page.tsx:53 | 🟡 | `shadow-warm-sm` |
| 5 | `rounded-xl` on icon containers (7 files) — banned radius | All 7 step components | 🟡 | `rounded-card` |
| 6 | `data-font` class — should be `data-text` | page.tsx:931,943 | 🟡 | `data-text` |
| 7 | `translate-x-5.5` — not a valid Tailwind class | page.tsx:922 | 🟡 | `translate-x-[22px]` |
| 8 | `via-white` in gradient — renders white in dark mode | page.tsx:1053 | 🟡 | Add `dark:` override |
| 9 | `bg-white/80` and `bg-white/90` — overlays/header/bottom nav missing dark pairs | page.tsx:1060,1089,1135 | 🟡 | Add `dark:bg-s-dm-bg/80` etc. |
| 10 | `border-white/60` in StepContainer — wrong semantic, should be ink-based | page.tsx:53 | 🟢 | `border-s-ink/5 dark:border-white/5` |

## Section B: i18n Issues

| # | Issue | Severity | Fix |
|---|---|---|---|
| 1 | page.tsx: ALL text hardcoded German. No `useTranslations()`, 0 keys in messages files. EN/FR/IT users see German UI. | 🔴 | Extract ~80 strings to messages/{locale}.json, use `useTranslations()` |
| 2 | 7 step components: `isDE` ternary only covers DE+EN. French treated as German. Italian missing. | 🟡 | Convert to next-intl `useTranslations()` for all 4 locales |

## Section C: Security Issues

| # | Issue | File:Line | Severity | Fix |
|---|---|---|---|---|
| 1 | `auth.getUser()` — BANNED per Rule 25. Network call times out on Vercel Edge | page.tsx:1010 | 🔴 | Use `auth.getSession()` |

## Section D: Accessibility Issues

| # | Issue | Severity | Fix |
|---|---|---|---|
| 1 | Missing `aria-label` on form inputs in both systems | 🟡 | Add aria-labels |
| 2 | No focus management on step transitions | 🟢 | Add focus to step heading on navigation |

## Section E: Cross-Component Issues

| # | Issue | Components | Severity | Fix |
|---|---|---|---|---|
| 1 | Two onboarding systems with overlapping but different UIs/features | page.tsx vs components/onboarding/ | 🟢 | Acceptable — different purposes (registration vs post-reg setup) |
| 2 | Component steps have dark mode; page.tsx has none — inconsistent brand experience | Both systems | 🔴 | Add dark mode to page.tsx |

---

## Fix Plan (severity order)

### 🔴 CRITICAL fixes (this session)
1. `to-coral/5` → `to-s-coral/5` (page.tsx:1053)
2. `rounded-3xl` → `rounded-card` (page.tsx:53)
3. `auth.getUser()` → `auth.getSession()` (page.tsx:1010)
4. Full dark mode pass on page.tsx — all surfaces, text, borders, overlays
5. Full i18n pass — extract strings to messages files, convert to `useTranslations()`

### 🟡 MEDIUM fixes (this session)
6. `rounded-xl` → `rounded-card` in 7 step components
7. `data-font` → `data-text` (page.tsx)
8. `translate-x-5.5` → `translate-x-[22px]` (page.tsx)
9. `shadow-glass` → `shadow-warm-sm` (page.tsx)
10. Add aria-labels to form inputs

### 🟢 LOW fixes
11. Fix `border-white/60` semantic
12. Focus management on step nav
