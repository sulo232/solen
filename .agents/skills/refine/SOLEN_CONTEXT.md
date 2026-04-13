# Solen Project Context — Refine Skill Override

> **This file overrides generic advice in SKILL.md when working on Solen.ch**

## Solen-Specific Refinement Rules

### 1. Spatial Design — Use Solen's Grid
- **8px grid only:** `gap-2`(8) · `gap-4`(16) · `gap-6`(24) · `gap-8`(32)
- **Micro (pills/badges only):** `gap-1`(4) · `gap-1.5`(6) · `gap-3`(12)
- **BANNED:** `gap-5`(20) · `gap-7`(28) · `gap-9`(36)
- Between sections: `py-12` (48px) or `py-16` (64px)
- Inside cards: `p-4` (16px) minimum

### 2. Typography — Locked Fonts
Do NOT suggest new fonts. Solen uses:
- **Bebas Neue** (`font-display`) for hero titles ≥36px, always uppercase
- **Syne** (`font-heading`) for section headings, card titles — never italic
- **DM Sans** (`font-body`) for body text, captions, nav
- Line-heights: headings 1.1-1.2, body 1.75-1.85

### 3. Responsive — Solen Breakpoints
- Mobile first: 375px (iPhone SE)
- `sm`=640px, `md`=768px, `lg`=1024px, `xl`=1280px
- Mobile nav: `<BottomTabBar />` — 4 tabs only
- Mobile booking: bottom sheet (not sidebar)
- Touch targets: ≥44x44px, form inputs 48px height

### 4. Motion — Solen Timing System
- 100ms active feedback
- 150ms color/hover changes
- 250ms card hover lift — easing `cubic-bezier(.4,0,.2,1)`
- 300ms bottom sheets — easing `cubic-bezier(0.32,0.72,0,1)`
- **ZERO animation in Zone 3 (booking) and Zone 4 (dashboard)**
- Only animate `transform` and `opacity`
- No `transition-all` — name exact properties

### 5. Hardening — Solen i18n
- 4 locales: de, en, fr, it (Swiss German primary)
- Use `useTranslations("namespace")` — check `messages/*.json`
- German text ~30% longer — budget for it
- `formatCurrency(amount, locale)` — never hardcode "CHF"
- Date formatting: derive locale from `useLocale()` → `de-CH / fr-CH / it-CH / en-GB`

## Full Design System
Read `_rules/SOLEN_DESIGN_SYSTEM.md` for complete token reference.
