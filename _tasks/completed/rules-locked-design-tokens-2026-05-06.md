# Archived from `_rules/*` · 2026-05-06

> Archived alongside the CLAUDE.md design-system section to free AI agents from anchoring on locked tokens while the design system is being iterated. Restore (or replace with new locked values) once the new system stabilizes.

---

## From `_rules/CODE_SAFETY.md` — Rule 12: SINGLE DESIGN SYSTEM

```
## Rule 12: SINGLE DESIGN SYSTEM
- There is only ONE design system: **V5** (see `_rules/UI_RULES.md`)
- Colors: Terracotta Coral `#E8624A` (primary, `s-coral`), Amber `#D4870A` (accent, `s-amber`), Blue `#6BA3C8` (accent, `s-blue`), Warm Ink `#1A1209` (text, `s-ink`)
- Fonts: Bebas Neue (display ≥40px), Syne (headings), DM Sans (body + data with `data-text`)
- The old teal/coral design (`#38B2AC`, `#FF6B6B`) and the monolith wine-red design are **RETIRED**
- **NEVER** use teal, old coral `#FF6B6B`, wine red, gold, DM Serif Display, or Space Grotesk in any new code
- **NEVER** reference `index.html` or `public/home.html` — they no longer exist
```

---

## From `_rules/STRUCTURAL_RULES.md` — Rule 43: INTERACTION STANDARD

```
## Rule 43: INTERACTION STANDARD — HOVER, ACTIVE, FOCUS

> **INCIDENT**: Cards used 5 different hover patterns. Buttons used `hover:bg-s-coral/90` everywhere (banned) instead of `hover:brightness-[1.06]`.

> For complete interaction patterns with code examples, see `_rules/SOLEN_DESIGN_SYSTEM.md` Section 8.

**Quick reference:**
- **Cards**: `hover:-translate-y-[5px]` + shadow lift. NEVER: `hover:scale-*`, `hover:opacity-*`
- **CTA Buttons**: `hover:brightness-[1.06] active:scale-[0.98]`. NEVER: `hover:bg-s-coral/90`
- **Ghost Buttons**: `hover:border-s-coral/40 hover:text-s-coral active:scale-[0.98]`
- **Text Links**: `hover:text-s-coral transition-colors duration-150`
- **Filter Pills**: Active = `bg-s-coral text-white`. Inactive = `bg-s-ink/[0.05] hover:bg-s-ink/[0.09]`
- **Images in cards**: No separate hover effect — card elevation handles it
```

---

## From `_rules/STRUCTURAL_RULES.md` — Rule 47: HOMEPAGE UI/UX OVERHAUL SPEC (V5)

```
## Rule 47: HOMEPAGE UI/UX OVERHAUL SPEC (V5) STRICT ENFORCEMENT

> **CONTEXT**: The Solen.ch homepage underwent a major redesign to adhere strictly to V5.

1. **Aesthetics:** Page background is Warm Beige (`#F5F0EB`). NO shadows on cards (use simple 1px borders). ALL interactive elements must be pill shapes. Blobs are RETIRED.
2. **Hero:** Solid `#F5F0EB` background (no images/fade-ups). Horizontal scroll-snap featured salon carousel. Header is Bebas Neue 42px.
3. **Header/Navigation:** Max height `56px`. Background is `#F5F0EB` glass frost. Header morphs: when hero search bar scrolls out of view, header shows compact Search Pill. `Zuruck` button must never render on `/`.
4. **Icons:** Category SVG icons render perfectly solid in Coral (`#E8735A`) without opacity layers.
5. **Footer:** Background is strictly `#2C2825`. Leftover trust pills removed. Instagram natively inside legal links.
6. **Mobile Tab Bar:** Background `#FFFFFF` glass frost, 1px top border (no shadow), active states Coral (`#E8735A`), `z-index: 50`.
```

---

## From `_rules/SYSTEMS.md` — Section 5: Design Tokens (body)

```
## 5. Design Tokens

All code must use design tokens. No arbitrary hex, no wrong fonts, no banned patterns.

**Component specs:** `_rules/DESIGN_SPEC.md` — the complete design system with exact values for every component, color, shadow, spacing, animation, and interaction. **Read the relevant section BEFORE implementing any component.**
**Tailwind mapping:** `tailwind.config.js` (tokens), `app/globals.css` (CSS vars).
**Rules:** `_rules/UI_RULES.md`, `_rules/SOLEN_DESIGN_SYSTEM.md`.

**Key tokens:** `s-coral` (#E8735A accent, #C05038 button, #B84A35 text), `s-ink` (#222222), `s-amber`, `s-blue`. `rounded-card` (16px), `rounded-btn` (99px). `shadow-elevation-1/2/3`. See `_rules/DESIGN_SPEC.md` for all values.

**Banned:** `shadow-sm/md/lg`, `hover:bg-s-coral/90`, `transition-all`, `bg-white`, `text-black`, `rounded-lg`, `ease-in` on enters, `duration-500+` on UI.
```

---

## Notes flagged during the audit

- **Drift inside the locked spec**: `CODE_SAFETY.md` calls `s-coral = #E8624A`. `SYSTEMS.md` calls `s-coral` three different hexes (`#E8735A` / `#C05038` / `#B84A35`). `STRUCTURAL_RULES.md` Rule 47.4 uses `#E8735A`. The "single source of truth" already disagreed with itself.
- **Stale references**: `_rules/SYSTEMS.md` and `_rules/STRUCTURAL_RULES.md` point to `_rules/DESIGN_SPEC.md` and `_rules/SOLEN_DESIGN_SYSTEM.md` — verify these files exist before restoring the rules.
