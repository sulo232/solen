# Roadmap R18: Dark Mode Polish — Full Platform Sweep

> **Scope:** Every single page and component in the app
> **Design System:** V3 — read `_rules/UI_RULES.md` fully before starting.
> **Goal:** Make dark mode feel intentionally designed and ultra premium, not just "inverted colors"

---

## Pre-read Requirements

1. Read `CLAUDE.md` fully
2. Read `_rules/UI_RULES.md` fully — especially §12 (dark mode surface) and §13 (glass tiers)

---

## Context: Dark Mode Token Reference

From `_rules/UI_RULES.md`:
- Background: `dark:bg-s-dm-bg` (#0E0E10)
- Surface: `dark:bg-s-dm-surface` (#1A1A1E) 
- Text: `dark:text-s-dm-text` (#F0EDE8)
- Borders: `dark:border-white/5` or `dark:border-white/10`
- Glass: `dark:bg-s-dm-surface/70 dark:backdrop-blur-md`

---

## Phase 1: Layout & Navigation Dark Mode

> **Goal:** Ensure header, sidebar, footer, and layout skeleton look correct in dark mode.

#### Files
- `[MODIFY]` `components/layout/Header.tsx`
- `[MODIFY]` `components/layout/Footer.tsx`
- `[MODIFY]` `components/layout/Sidebar.tsx` (if exists)
- `[MODIFY]` `app/[locale]/layout.tsx`

#### Instructions
1. Grep every layout file for hardcoded colors: `bg-white`, `text-black`, `text-gray-`, `border-gray-`
2. Replace with V3 dark mode pairs:
   - `bg-white` → `bg-white dark:bg-s-dm-surface`
   - `text-black` → `text-s-ink dark:text-s-dm-text`
   - `border-gray-200` → `border-s-ink/10 dark:border-white/10`
3. Check coral glow effects: they should be more subtle in dark mode (`shadow-coral-glow` already adapts if defined correctly)
4. Footer decorative blobs: reduce opacity in dark mode (`dark:opacity-50`)
5. Verify the theme toggle button is visible in both modes

#### Verification
```bash
npm run build
```
- Browser: toggle dark mode on — check header, footer, sidebar

---

## Phase 2: Category Pages Dark Mode

> **Goal:** Audit all 6 category pages for dark mode contrast and readability.

#### Files
- `[MODIFY]` `components/coiffeur/CoiffeurSections.tsx`
- `[MODIFY]` `components/barbershop/BarbershopSections.tsx`
- `[MODIFY]` `components/nails/NailsSections.tsx`
- `[MODIFY]` `components/CategoryPage.tsx`

#### Instructions
1. For each category page component, verify:
   - All text has a `dark:text-s-dm-text` or `dark:text-s-dm-text/XX` pair
   - All backgrounds have `dark:bg-s-dm-surface` or `dark:bg-s-dm-bg` pairs
   - All borders have `dark:border-white/XX` pairs
   - Category pills/filters have visible selected state in dark mode
2. Hair type pills (CoiffeurSections): selected state `bg-s-coral text-white` works in both modes ✅ — but unselected needs `dark:bg-s-dm-surface dark:text-s-dm-text/60 dark:border-white/10`
3. Trending style cards: gradient backgrounds need dark mode variants
4. AI matcher CTA: border should be `dark:border-s-coral/10` not invisible

#### Verification
```bash
npm run build
```

---

## Phase 3: Dashboard Dark Mode

> **Goal:** Ensure the salon owner dashboard is fully usable in dark mode.

#### Files
- `[MODIFY]` Multiple files in `components/dashboard/`
- `[MODIFY]` Multiple files in `app/[locale]/dashboard/`

#### Instructions
1. Grep `components/dashboard/` for `bg-white` without a corresponding `dark:` — fix all
2. Grep for `text-gray-` — replace with V3 tokens
3. Charts (recharts): verify chart colors are visible on dark backgrounds
4. Data tables: ensure row hover states work in dark mode
5. Dashboard stat cards: verify the numbers/data are readable
6. Priority fix: any component using `shadow-md` or `shadow-lg` without `dark:shadow-warm-md` — add dark shadow variant

#### Verification
```bash
npm run build
```

---

## Phase 4: Booking & Profile Dark Mode

> **Goal:** Ensure the booking flow and profile pages are polished in dark mode.

#### Files
- `[MODIFY]` `components/booking/` (all booking flow components)
- `[MODIFY]` `components/profile/` (if exists)
- `[MODIFY]` `app/[locale]/profile/` pages

#### Instructions
1. Booking flow: time slot picker needs visible distinction between available/unavailable/selected in dark mode
2. Price summary cards: verify contrast ratios
3. Stripe Elements: ensure `appearance` config passes dark mode colors
4. Profile page: verify all form inputs have `dark:bg-black/20 dark:text-s-dm-text dark:border-white/10`
5. Empty state illustrations: check they don't disappear on dark backgrounds

#### Verification
```bash
npm run build
```

---

## Phase 5: Modals & Overlays Dark Mode

> **Goal:** Fix all modals, sheets, and overlays for dark mode.

#### Files
- `[MODIFY]` `components/ReviewForm.tsx`
- `[MODIFY]` `components/ui/QuickPreviewSheet.tsx`
- `[MODIFY]` Any other modal components

#### Instructions
1. Modal backdrop: `bg-s-ink/40 backdrop-blur-sm` (already correct in ReviewForm ✅)
2. Modal body: `bg-white dark:bg-s-dm-surface` with `dark:border-white/5`
3. Close buttons: `text-s-ink/40 dark:text-s-dm-text/40 hover:text-s-ink dark:hover:text-s-dm-text`
4. Input fields inside modals: `dark:bg-black/20 dark:text-s-dm-text`
5. Error messages: `dark:bg-red-500/10 dark:text-red-400` (not red-50 which is invisible in dark)

#### Verification
```bash
npm run build
```

---

## Phase 6: Discovery & Salon Detail Dark Mode

> **Goal:** Ensure the discover feed and salon detail pages look stunning in dark mode.

#### Files
- `[MODIFY]` Components in `components/discovery/`
- `[MODIFY]` Salon detail page components

#### Instructions
1. Discovery masonry/grid: card borders should be `dark:border-white/5` not invisible
2. Discovery item overlays (like count, save button): ensure visible contrast
3. Salon detail hero: if using gradient overlays on cover photos, check dark mode opacity
4. Gallery lightbox: verify `dark:bg-s-ink/80` backdrop
5. Badge pills: verify readability on dark backgrounds
6. Review section on salon page: already uses V3 tokens in ReviewBreakdown ✅ — verify carousel

#### Verification
```bash
npm run build
```

---

## Execution Order

All phases are independent. Run any order or simultaneously.

| Phase | Scope | Risk |
|---|---|---|
| 1 | Layout (header, footer, sidebar) | 🟢 Safe — CSS only |
| 2 | Category pages | 🟢 Safe — CSS only |
| 3 | Dashboard | 🟢 Safe — CSS only |
| 4 | Booking + Profile | 🟡 Medium — Stripe appearance config |
| 5 | Modals + Overlays | 🟢 Safe — CSS only |
| 6 | Discovery + Salon detail | 🟢 Safe — CSS only |
