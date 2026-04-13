# Solen Project Context — Design Skill Override

> **This file overrides generic advice in SKILL.md when working on Solen.ch**

## Locked Design Decisions — Do NOT Override

### Fonts (LOCKED)
- Display: **Bebas Neue** (≥36px, always uppercase)
- Headings: **Syne** (never italic)
- Body: **DM Sans**
- Do NOT suggest other fonts. Do NOT use Inter, Roboto, Space Grotesk, or system fonts.

### Color Palette (LOCKED)
- Primary: Coral `#E8624A` (`s-coral`)
- Secondary: Amber `#D4870A` (`s-amber`)
- Accent: Blue `#6BA3C8` (`s-blue`)
- Text: Ink `#1A1209` (`s-ink`)
- Extended: Sage, Plum, Yellow, Sand (each with `-subtle` and `-text` variants)
- Do NOT suggest new colors. Use the `s-*` Tailwind tokens.

### Aesthetic Direction (LOCKED)
- **Airbnb × Fresha** — warm, premium, multi-layer shadows
- Solid white cards (`.card-v4`), glass ONLY on floating UI
- Cream base `#FAF6EF`, never pure white backgrounds, never pure black
- Warm shadows only: `rgba(26,18,9,x)` — never `rgba(0,0,0,x)`

### Radii (LOCKED)
- Cards: `rounded-card` (16px)
- Buttons: `rounded-btn` (99px)
- Inputs: `rounded-input` (12px)
- Pills: `rounded-pill` (9999px)
- Do NOT use `rounded-lg`, `rounded-xl`, `rounded-full`

### Animation (LOCKED)
- V5 easing: `cubic-bezier(0.23, 1, 0.32, 1)`
- Card hover: `translateY(-4px)` + shadow upgrade, 250ms
- Stagger: 60ms between children
- No animation in Zone 3 (booking) or Zone 4 (dashboard)
- Springs ONLY for: icon micro-animations, heart bounce, avatar pop

## Full Design System
Read `_rules/SOLEN_DESIGN_SYSTEM.md` for complete token reference.
