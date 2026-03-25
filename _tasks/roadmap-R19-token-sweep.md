# Roadmap R19: Global Token Sweep — `rounded-button` → `rounded-btn`

> **Scope:** Every `.tsx` file in `components/` and `app/`
> **Design System:** V3 — read `_rules/UI_RULES.md` fully before starting.
> **Audit reference:** This roadmap fixes the #1 finding from the UI audit. `rounded-button` is BANNED per UI_RULES §16.

---

## Pre-read Requirements

1. Read `CLAUDE.md` fully
2. Read `_rules/UI_RULES.md` fully — especially §16 (radius tokens)

---

## Phase 1: Bulk Replace in UI Components

> **Goal:** Replace every `rounded-button` with `rounded-btn` in `components/ui/`.

#### Files (~15 files)
- `[MODIFY]` `components/ui/AnimatedButton.tsx` (3 instances)
- `[MODIFY]` `components/ui/CookieBanner.tsx` (5 instances)
- `[MODIFY]` `components/ui/HomeSearchBar.tsx` (1 instance)
- `[MODIFY]` `components/ui/PWAInstallPrompt.tsx` (2 instances)
- `[MODIFY]` `components/ui/QuickPreviewSheet.tsx` (2 instances)
- `[MODIFY]` `components/ui/SearchAutocomplete.tsx` (1 instance)
- `[MODIFY]` `components/ui/sidebar.tsx` (2 instances)
- `[MODIFY]` `components/ui/SolenExclusiveBadge.tsx` (1 instance)
- `[MODIFY]` `components/ui/ThemeToggle.tsx` (1 instance)
- `[MODIFY]` `components/ui/ReportContentButton.tsx` (5 instances)
- `[MODIFY]` `components/ui/PriceOfferModal.tsx` (4 instances)
- `[MODIFY]` `components/ui/LanguageSwitcher.tsx` (1 instance)
- `[MODIFY]` `components/ui/interactive-hover-button.tsx` (1 instance)
- `[MODIFY]` `components/ui/expandable-tabs.tsx` (1 instance)
- `[MODIFY]` `components/ui/AddressAutocomplete.tsx` (1 instance)
- `[MODIFY]` `components/ui/AddressAutocomplete 2.tsx` (1 instance — also rename this file, spaces in filenames are bad)
- `[MODIFY]` `components/ui/CategoryTree.tsx` (1 instance)

#### Instructions
1. For each file: find-replace `rounded-button` → `rounded-btn`
2. No other changes — purely mechanical token swap
3. **DO NOT** change `rounded-card`, `rounded-pill`, `rounded-blob-*`, or `rounded-full` — those are correct

#### Verification
```bash
grep -rn "rounded-button" components/ui/ --include="*.tsx"
# Must return 0 results
npm run build
```

---

## Phase 2: Bulk Replace in Page Components

> **Goal:** Replace `rounded-button` in all non-ui components.

#### Files (~35+ files)
- `[MODIFY]` `components/ReviewForm.tsx` (3 instances)
- `[MODIFY]` `components/StaffPortfolio.tsx` (1 instance)
- `[MODIFY]` `components/TerminePage.tsx` (8 instances)
- `[MODIFY]` `components/WeatherBanner.tsx` (1 instance)
- `[MODIFY]` `components/WaitlistModal.tsx` (3 instances)
- `[MODIFY]` `components/SalonCard.tsx` (1 instance)
- `[MODIFY]` `components/BookingCalendar.tsx`
- `[MODIFY]` `components/staff/StaffProfilePage.tsx` (2 instances)
- `[MODIFY]` `components/search/SearchResultGrid.tsx` (1 instance)
- `[MODIFY]` All other files found by grep

#### Instructions
1. Run: `grep -rn "rounded-button" components/ --include="*.tsx"` to get the full list
2. Replace all `rounded-button` → `rounded-btn`
3. Same mechanical swap — no other changes

#### Verification
```bash
grep -rn "rounded-button" components/ --include="*.tsx"
# Must return 0 results
npm run build
```

---

## Phase 3: Bulk Replace in App Pages

> **Goal:** Replace `rounded-button` in all `app/` page files.

#### Instructions
1. Run: `grep -rn "rounded-button" app/ --include="*.tsx"` to find all instances
2. Replace all `rounded-button` → `rounded-btn`

#### Verification
```bash
grep -rn "rounded-button" app/ --include="*.tsx"
# Must return 0 results
npm run build
```

---

## Phase 4: Verify & Clean

1. Final check: `grep -rn "rounded-button" . --include="*.tsx" --include="*.ts" | grep -v node_modules | grep -v ".next"`
2. Also check CSS: `grep -rn "rounded-button" . --include="*.css" | grep -v node_modules`
3. If `rounded-button` is defined in `globals.css` or `tailwind.config.js`, **DO NOT DELETE IT YET** — it might be used by 3rd-party components. Just verify nothing imports it after the sweep.

#### Verification
```bash
npm run build  # Must pass
npx tsc --noEmit  # Must pass
```
