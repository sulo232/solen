# Roadmap R20: Shadow, Hover Physics & Transition Polish

> **Scope:** Fix generic shadows, card hover patterns, and standardize transition durations
> **Design System:** V3 — read `_rules/UI_RULES.md` fully before starting.
> **Audit reference:** Fixes findings #2-#6 from the UI audit.

---

## Pre-read Requirements

1. Read `CLAUDE.md` fully
2. Read `_rules/UI_RULES.md` fully — especially §4 (hover physics) and §31 (shadow system)

---

## Phase 1: Fix Generic Shadows → V3 Shadow Tokens

> **Goal:** Replace all non-V3 shadow classes with the warm shadow system.

#### Files
- `[MODIFY]` `components/ReviewForm.tsx` — line 123: `shadow-xl` → `shadow-warm-xl`
- `[MODIFY]` `components/notifications/NotificationBell.tsx` — line 143: `shadow-lg` → `shadow-warm-lg`
- `[MODIFY]` `components/global/TOSUpdateBanner.tsx` — line 60: `shadow-md` → `shadow-warm-md`

#### Instructions
1. Simple token swap on each file — change the shadow class only
2. Also grep for any other `shadow-sm`, `shadow-md`, `shadow-lg`, `shadow-xl`, `shadow-2xl` WITHOUT `warm` prefix
3. Replace: `shadow-sm` → `shadow-warm-sm`, `shadow-md` → `shadow-warm-md`, etc.
4. **DO NOT** touch `shadow-coral-glow`, `shadow-card`, `shadow-card-hover`, `shadow-pressed` — those are correct V3 tokens

#### Verification
```bash
grep -rn "shadow-sm\b\|shadow-md\b\|shadow-lg\b\|shadow-xl\b\|shadow-2xl\b" components/ --include="*.tsx" | grep -v "shadow-warm" | grep -v "shadow-card" | grep -v "shadow-coral" | grep -v "shadow-pressed"
# Must return 0 results
npm run build
```

---

## Phase 2: Fix Card Hover Physics

> **Goal:** Replace `hover:scale` on card-like elements with `translateY(-5px)` + shadow upgrade.

#### Files
- `[MODIFY]` `components/ServiceTile.tsx` — line 30: `hover:scale-[1.02]` → `hover:-translate-y-[5px] hover:shadow-card-hover`

#### Instructions
1. Remove `hover:scale-[1.02]` from ServiceTile
2. Add `hover:-translate-y-[5px] hover:shadow-card-hover`
3. Keep `transition-all duration-250` (correct for cards)
4. **DO NOT** change `HomePage.tsx` category tiles — those correctly use `hover:scale-[1.03] hover:-rotate-1` per UI_RULES §4 Tier 3 exception
5. **DO NOT** change `SalonCard.tsx` image zoom — `group-hover:scale-[1.03]` on an image INSIDE a card is fine (the card itself translates, the image zooms — this is a premium pattern)

#### Verification
```bash
npm run build
```

---

## Phase 3: Fix `rounded-xl` → `rounded-card`

#### Files
- `[MODIFY]` `components/notifications/NotificationBell.tsx` — line 143: `rounded-xl` → `rounded-card`

#### Instructions
1. Replace `rounded-xl` → `rounded-card`
2. Grep for any remaining `rounded-xl` or `rounded-2xl` or `rounded-3xl` in components (excluding `rounded-card`, `rounded-btn`, `rounded-pill`, `rounded-full`, `rounded-blob-*`)
3. Replace all found instances

#### Verification
```bash
grep -rn "rounded-xl\|rounded-2xl\|rounded-3xl" components/ --include="*.tsx" | grep -v "rounded-card" | grep -v "node_modules"
# Should return 0 (or only GlassCard.tsx comment which is fine)
npm run build
```

---

## Phase 4: Standardize Transition Durations

> **Goal:** Make animation timing consistent across the platform.

#### Rules
- Buttons/pills: `duration-200`
- Cards: `duration-250` (per UI_RULES §4)
- Modals/overlays: `duration-300`
- Large animations (score, progress): keep their custom durations (500/700/1000)

#### Instructions
1. Grep for `duration-150` in button/pill contexts → change to `duration-200`
2. Verify cards use `duration-250` (most already do)
3. **DO NOT** change `duration-300` on modals or `duration-500+` on intentional animations
4. This is a judgment-based sweep — only change obvious mismatches

#### Verification
```bash
npm run build
```

---

## Phase 5: Add Missing Hover Physics to Remaining Cards

> **Goal:** Ensure every card-like element has the V3 hover pattern.

#### Instructions
1. Grep for card-like components that have `rounded-card` but NO hover effect:
   ```bash
   grep -rn "rounded-card" components/ --include="*.tsx" -l
   ```
2. For each file, check if it has `hover:-translate-y` or `hover:shadow-card-hover`
3. If missing AND it's a clickable/linkable card, add: `hover:-translate-y-[5px] hover:shadow-card-hover transition-all duration-250`
4. Dashboard stat cards, notification list items, and inline elements should NOT get hover physics — only standalone cards

#### Verification
```bash
npm run build
```

---

## Execution Order

| Phase | Depends On | Risk |
|---|---|---|
| 1 | Nothing | 🟢 Trivial — 3 token swaps |
| 2 | Nothing | 🟢 Safe — 1 file |
| 3 | Nothing | 🟢 Trivial — 1 file |
| 4 | Nothing | 🟡 Judgment needed |
| 5 | Nothing | 🟡 Judgment needed |
