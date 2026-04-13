# Solen Project Context — Review Skill Override

> **This file overrides generic advice in SKILL.md when working on Solen.ch**

## Solen-Specific Audit Criteria

When running Part 1 (Audit), score against Solen's actual design system, not generic best practices:

### Theming — Check These Tokens
- Colors must use `s-*` tokens. Flag any raw Tailwind colors (`text-gray-*`, `bg-blue-*`, etc.)
- Dark mode pairs: every `bg-white` needs `dark:bg-s-dm-*`, every `text-s-ink` needs `dark:text-s-dm-text`
- Shadows must be warm (`shadow-card`, `shadow-warm-*`). Flag any `shadow-sm/md/lg/xl`
- Radii must be design tokens (`rounded-card/input/btn/pill`). Flag any `rounded-lg/xl/2xl/full`

### Anti-Patterns — Solen-Specific Tells
Beyond the generic AI slop check, flag:
- Any font other than Bebas Neue / Syne / DM Sans
- Bebas Neue used below 36px (except 22px nav logo and category tiles)
- Syne used in italic
- Glass applied to content cards (should be `.card-v4` solid white)
- Animation in Zone 3 (booking/payment) or Zone 4 (dashboard)
- `transition-all` instead of naming exact CSS properties
- Borders using generic colors instead of `border-s-ink/*`

### Accessibility — Solen Standards
- Focus rings: `focus-visible:ring-2 focus-visible:ring-s-coral` — full opacity
- Touch targets: ≥44x44px
- `text-s-coral` on cream fails AA for <18px text — must use `text-s-coral-text`
- Form inputs: 48px height min, 16px font (iOS zoom prevention)

### Zone Compliance
| Zone | Pages | Animation | Glass |
|---|---|---|---|
| 1 | Homepage, discovery | Full stagger + hover | Floating only |
| 2 | Salon page, search | Hover + slide-in | Dropdowns only |
| 3 | Booking, payment | **ZERO** | **NO** |
| 4 | Dashboard, admin | **ZERO** | **NO** |

## Full Design System
Read `_rules/SOLEN_DESIGN_SYSTEM.md` for complete token reference.
