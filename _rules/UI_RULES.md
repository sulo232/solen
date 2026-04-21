# 🎨 Solen UI Rules — MOVED

> **This file has been merged into [`_rules/DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) on 2026-04-21.**
>
> `DESIGN_SYSTEM.md` is now the single source of truth for all UI/design rules — colors, typography, shapes, shadows, glass, motion, component standards, accessibility, mobile, i18n, search bar, banned tokens, and the pre-commit checklist.
>
> This stub remains so agents grepping for `UI_RULES.md` can find the redirect.

## What moved where

| Old section in UI_RULES.md | New location in DESIGN_SYSTEM.md |
|---|---|
| §1 Core Aesthetic, §2 Colors, §9 Dark Mode, §15 Text Colors, §15b Status | §1, §3, §16 |
| §3 Typography, §12 Typography, §18 Typography & Color Usage Guide | §4 |
| §4 Animations & Interactions, §20 Next-Gen Fluidity | §8, §9.2 |
| §5 Structural Rules, §7 21st.dev Components, §8 New Components | §9, §21 |
| §6 Layout Specifics, §6 Salon Cards | §9.1, §11 (SALON CARDS NOW 1:1) |
| §10 Border Radius — V5 Shape System | §5 |
| §11 Shadows | §6 |
| §13 V5 Glass System | §7 |
| §14 Z-Index Scale | (kept in `tailwind.config.js` — reference there) |
| §16 BANNED tokens, Rule 20 BANNED TOKEN LIST | §16 |
| §19 Premium Design Enforcement Rules (8pt grid, nesting, shadow stacking, 60-30-10, cheap vs premium) | §5, §6, §3.5, §13.4 |
| §21 Interaction Consistency (transitions, timing, modal, close X, cancel, submit, tabs, input focus, feedback banner) | §8, §9.2, §9.4 |
| §22 Homepage UI/UX Overhaul Spec (V5) | §1, §2, §7 |
| Rule 23 Documentation-Code Consistency | §22 File Source Map |
| Rule 26 No Dead Code | §18 Feature Completeness, §20 Component Lifecycle |
| Rule 27 No Duplicate Layout Elements | §19 Pre-Commit Checklist, §21 USE THIS DON'T BUILD |
| Rule 30 Premium Enforcement | §19 Pre-Commit Checklist |
| Rule 31 Filter Component Zone Compliance | §2 (now `mode` prop: `marketing` / `app`) |
| Rule 32 No Hardcoded Marketing Stats, Rule 33 Badge Data Integrity | (operational — see `CLAUDE.md`) |

## Key changes in the merge

1. **4 zones → 2 modes**: `marketing` (animated, glass allowed) + `app` (static, solid). See `DESIGN_SYSTEM.md` §2.
2. **Salon cards ALWAYS 1:1**: `aspect-square` on all breakpoints. Old `aspect-[4/5]` / `aspect-[20/19] md:aspect-square` retired.
3. **Card hover duration 400ms → 250ms**: matches UI_RULES §21-B, overrides old §4. `card-v4` CSS migration pending.
4. **Image hover zoom removed**: card lift alone provides feedback. `.img-hover-zoom` deprecated.
5. **Modal enter 350ms spring → 200ms EASE_SOLEN**: matches code in `lib/animations.ts`. Overrides old §21-B.
6. **Filter pills use `.glass-pill`** (not `.glass-frost`).
7. **Beauty icons allowed** for hair/nail/skin domain, lucide for UI chrome, Recraft for category tiles.
8. **7 accent colors → 3 active + 4 reserved** (locked to semantic contexts).
9. **Icon color `#E8624A`** canonical (not `#E8735A` — that was a drift).
10. **Stagger 60ms** canonical (not 50ms).
11. **Card hover translateY -4px** canonical (not -5px).

## Where to look now

→ **[`_rules/DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md)** for everything.

→ `tailwind.config.js` for raw token values.

→ `app/globals.css` for CSS custom properties, glass classes, motion keyframes, `prefers-reduced-motion` global block.

→ `lib/animations.ts` for Framer Motion variants, easing constants, stagger timings.
