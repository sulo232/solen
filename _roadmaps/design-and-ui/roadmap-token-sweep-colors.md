# Roadmap: Color Palette Sweep (V3 Enforcement)

This roadmap enforces the V3 Design System constraints by hunting down and eliminating all hardcoded "chaos" colors (Teal, Cool Grays, random oranges/yellows, and pure blacks) across the platform.

**Related UI_RULES.md section**: §20 (Banned Token List)

## Phase 1: Eradicate Hardcoded Hex Chaos

### 1.1 Teal and Wrong Orange Replacements
Find all occurrences of `#00A19C` (Teal), `orange` (where used instead of s-coral), `#FF6B6B` (old coral), and `text-teal-*`/`bg-teal-*`.
- **"Partner werden" Button**: Verify and update the CTA to use `bg-s-coral` and `text-white`. Ensure hover state uses `hover:brightness-[1.06]`, NOT hardcoded hexes or hover backgrounds.
- **Teal text**: Replace all `text-[#00A19C]` with `text-s-coral`, `text-s-coral-text`, or `text-s-blue` depending on context.

### 1.2 Footer & Dark Background Compliance
Find all instances of `#0F0F0F`, `#1A1A1A`, `#2D2D2D`, and `bg-slate-900`, `bg-navy-900`, or `bg-[#0F0F0F]`.
- **Footer Section**: Update the global footer background to `bg-s-dm-surface` or `bg-s-dm-bg` (or `bg-s-plum` if inverted) to respect the warm dark mode spec.
- **Dark Sections**: Ensure all inverted dark blocks use `bg-s-plum` or `bg-s-ink` depending on contrast needs.

### 1.3 Unify Warning and Rating Yellows
Find all `#F59E0B` (Amber/Orange), `text-yellow-*`, `bg-yellow-*`.
- **Star Ratings**: Ensure all rating stars (`Lucide Star`) use exactly `fill-s-yellow text-s-yellow`.
- **Top Pick Badges**: Ensure all badges use `bg-s-yellow-subtle text-s-yellow-text`. Remove any hardcoded `#F59E0B` or `bg-yellow-500`.

### 1.4 Unify Muted Text & Borders
Find all `#6B7280` (Cool Gray) and `#E5E7EB` (Light Gray).
- **Muted Text**: Replace with `text-s-ink/50` (or `text-s-ink/70` if applicable).
- **Borders**: Replace with `border-s-ink/10` to maintain Apple-like minimal warm borders.

## Phase 2: Verification

Execute the following commands from `roadmap-v3-master-lint.md`:
1. Check for banned hexes:
```bash
grep -rn "#00A19C\|#F59E0B\|#6B7280\|#0F0F0F\|#1A1A1A\|#2D2D2D\|#E5E7EB" --include="*.tsx" --include="*.css" app/ components/
```
2. Verify "Partner werden" button class uses `s-coral`.
3. Check `npm run build` passes.
