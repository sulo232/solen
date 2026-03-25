# R33 — Global Shadow + Token System Sweep

> Replace all cold rgba(0,0,0) shadows with warm rgba(26,18,9) two-layer tokens. Add missing shadow levels (warm-xs, warm-xl, pressed, coral-glow-hover, amber-glow). Remove banned `rounded-button` token usage.

---

## Breakage Risk Assessment

| Phase | Risk | Reason |
|---|---|---|
| Phase 1 — Add missing shadow tokens | 🟢 Low | Additive to tailwind.config only |
| Phase 2 — Replace cold shadow references | 🟡 Medium | Grep/replace across ~30 files |
| Phase 3 — Sweep `rounded-button` → `rounded-btn` | 🟡 Medium | Bulk replace across ~50 files |
| Phase 4 — Upgrade button active states | 🟢 Low | CSS-only |

---

## Phase 1 — Add Missing Shadow Tokens to tailwind.config.js

### ⚠️ BE CAREFUL
- Only ADD new tokens, do NOT remove existing `card`, `card-hover`, `glass`, `glass-hover` — other files still reference them. They get deprecated, not deleted.
- The 5-level warm shadow system is additive and breaks nothing on its own.

### Files to modify

#### [MODIFY] [tailwind.config.js](file:///c:/Users/sulod/solen/tailwind.config.js)
**Lines 53–63** — Add full warm shadow system

✅ DO (add these, keep existing):
```js
boxShadow: {
  // ── Keep (deprecated aliases): ──
  card: "0 4px 12px rgba(0,0,0,0.08)",
  "card-hover": "0 8px 24px rgba(0,0,0,0.12)",
  glass: "0 8px 32px rgba(0,0,0,0.06)",
  "glass-hover": "0 16px 48px rgba(0,0,0,0.10)",
  // ── V3 Apple Warm Shadow System ──
  "warm-xs":    "0 1px 2px rgba(26,18,9,.06)",
  "warm-sm":    "0 1px 3px rgba(26,18,9,.07), 0 2px 8px rgba(26,18,9,.05)",
  "warm-md":    "0 2px 4px rgba(26,18,9,.08), 0 4px 16px rgba(26,18,9,.06)",
  "warm-lg":    "0 4px 8px rgba(26,18,9,.09), 0 8px 32px rgba(26,18,9,.07)",
  "warm-xl":    "0 8px 16px rgba(26,18,9,.10), 0 20px 60px rgba(26,18,9,.08)",
  "warm-float": "0 24px 72px rgba(26,18,9,.18)",
  // ── Colour-matched button glows ──
  "coral-glow":       "0 2px 4px rgba(232,98,74,.25), 0 4px 16px rgba(232,98,74,.15)",
  "coral-glow-hover": "0 4px 8px rgba(232,98,74,.32), 0 8px 28px rgba(232,98,74,.22)",
  "amber-glow":       "0 2px 4px rgba(212,135,10,.22), 0 4px 16px rgba(212,135,10,.14)",
  "pressed":          "0 1px 1px rgba(26,18,9,.12)",
},
```

❌ DON'T:
```js
// Don't delete cold tokens in Phase 1 — they still have references
// Don't rename warm-sm/md/lg that already exist to avoid breaking current usage
```

**Git commit:** `git add tailwind.config.js && git commit -m "R33-P1: add full V3 warm shadow token system to tailwind.config"`

---

## Phase 2 — Replace Cold Shadow References Site-wide

### ⚠️ BE CAREFUL
- Run grep before replacing to understand scope.
- Replace `shadow-card` with `shadow-warm-sm`, `shadow-card-hover` with `shadow-warm-float`.
- `shadow-glass` → `shadow-warm-md`, `shadow-glass-hover` → `shadow-warm-xl`.
- Check every file for inline `style={{ boxShadow: "... rgba(0,0,0..." }}` — replace those too.

### Files to modify

Run this grep first to find all usages:
```bash
grep -rn "shadow-card\|shadow-glass\|rgba(0,0,0" --include="*.tsx" --include="*.ts" --include="*.css" app/ components/ | grep -v node_modules
```

#### [MODIFY] All files returned by grep above
For each file with `shadow-card`:
```tsx
// Before:
className="... shadow-card ..."
// After:
className="... shadow-warm-sm ..."

// Before:
className="... shadow-card-hover ..."
// After:
className="... shadow-warm-float ..."
```

For inline style shadows:
```tsx
// Before:
style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
// After:
style={{ boxShadow: "0 1px 3px rgba(26,18,9,.07), 0 2px 8px rgba(26,18,9,.05)" }}
```

**Expected files touched:** `components/SalonCard.tsx`, `components/LastMinuteCard.tsx`, `components/layout/Nav.tsx`, `components/ui/*.tsx`, `components/dashboard/*.tsx`

**Verification:** `npm run build` — no TypeScript errors, no broken layout.

**Git commit:** `git add -A && git commit -m "R33-P2: replace cold shadow-card/glass tokens with warm-sm/float globally"`

---

## Phase 3 — Sweep `rounded-button` → `rounded-btn` (Banned token)

### ⚠️ BE CAREFUL
- `rounded-button: "8px"` is a BANNED token — buttons must be pill (99px = `rounded-btn`).
- `rounded-card: "12px"` is the correct non-pill container radius — do NOT replace this.
- `rounded-btn: "99px"` = pill — the only correct token for buttons, tags, badges.
- After sweep, `rounded-button` should have zero occurrences outside of `tailwind.config.js` itself.

Run grep to find all usages:
```bash
grep -rn "rounded-button" --include="*.tsx" --include="*.ts" app/ components/ | grep -v node_modules
```

#### [MODIFY] All files returned by grep
```tsx
// Before:
className="... rounded-button ..."
// After:
className="... rounded-btn ..."
```

**Expected count:** ~50 files (from previous audit)

**Do NOT touch:**
```js
// tailwind.config.js — keep the deprecated token definition for backward compat
button: "8px", // deprecated — use rounded-btn
```

**Verification:** 
```bash
grep -rn "rounded-button" --include="*.tsx" app/ components/
# Should return 0 results (only tailwind.config.js should remain)
npm run build
```

**Git commit:** `git add -A && git commit -m "R33-P3: sweep rounded-button → rounded-btn across all ~50 components"`

---

## Phase 4 — Button Active State + Coral Focus Ring

### ⚠️ BE CAREFUL
- The `active:scale-[0.98]` pattern currently used on some buttons is not V3 spec. Replace with `active:translate-y-[1px] active:shadow-pressed`.
- Focus ring in `globals.css` uses `outline: 2px solid rgba(232,98,74,0.5)` — good but RULEBOOK specifies box-shadow approach for inputs specifically: `box-shadow: 0 0 0 3px var(--coral-s)`.

### Files to modify

#### [MODIFY] [globals.css](file:///c:/Users/sulod/solen/app/globals.css)
**Lines 119–139** — Enhance focus ring for inputs (keep outline for links/buttons):
```css
input:focus-visible,
textarea:focus-visible,
select:focus-visible {
  outline: none;
  border-color: #E8624A;
  box-shadow: 0 1px 3px rgba(26,18,9,.07), 0 2px 8px rgba(26,18,9,.05), 0 0 0 3px #FAECE7;
}

/* Dark mode input focus */
.dark input:focus-visible,
.dark textarea:focus-visible,
.dark select:focus-visible {
  border-color: #F07560;
  box-shadow: 0 0 0 3px rgba(240,117,96,.20);
}
```

**Also add** universal prefers-reduced-motion (RULEBOOK requirement):
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
  }
}
```

**Verification:** `npm run build` — All interactive elements have pill shape. Input focus shows coral ring. Active buttons press down.

**Git commit:** `git add app/globals.css && git commit -m "R33-P4: input coral focus ring, universal prefers-reduced-motion"`

---

## Dependency Ordering

| Step | Depends On |
|---|---|
| Phase 1 — Add tokens | Nothing (additive) |
| Phase 2 — Replace shadows | Phase 1 (tokens must exist first) |
| Phase 3 — rounded-button → rounded-btn | Nothing (independent) |
| Phase 4 — globals.css | Nothing (independent) |

## Final Verification

```bash
npm run build
grep -rn "rounded-button" --include="*.tsx" app/ components/ # 0 results
grep -rn "rgba(0,0,0" --include="*.tsx" app/ components/ # 0 results (ideally)
```
