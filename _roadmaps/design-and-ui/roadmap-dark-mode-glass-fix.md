# Roadmap: Dark Mode Glass Fix

> **Goal:** Fix 12 component files that use hardcoded `rgba(255,255,255,...)` inline styles. These render as bright white in dark mode, making text invisible.

## BEHAVIOR RULES
- Read `CLAUDE.md` (Section 3.3, Section 13) and `_rules/UI_RULES.md` before starting.
- Do NOT change `rgba(26,18,9,...)` shadow values — those are already warm-dark and work in both modes.
- Do NOT touch files not listed below.
- `npm run build` after EVERY phase. Do not proceed if build fails.
- One `git commit` per phase.

---

## R1: Breakage Risk Assessment

| Phase | Risk Level | Could Break | How to Prevent |
|---|---|---|---|
| Phase 1 | 🟢 SAFE | Nothing — CSS vars only | — |
| Phase 2 | 🟡 MEDIUM | Glass appearance if var name wrong | Test visually in both light+dark |
| Phase 3 | 🟢 SAFE | Nothing — verification only | — |

---

## 🤖 CLAUDE CODE PHASES

### Phase 1: Create Glass CSS Custom Properties

**[MODIFY] `app/globals.css`**

Add at the END of the `:root` block (or create one if none exists):

✅ DO:
```css
:root {
  --glass-bg: rgba(250,246,239,.82);
  --glass-bg-strong: rgba(255,255,255,.92);
  --glass-bg-card: rgba(255,255,255,.80);
  --glass-bg-subtle: rgba(255,255,255,.62);
  --glass-border: rgba(255,255,255,.70);
  --glass-border-subtle: rgba(255,255,255,.55);
  --glass-shadow-inset: inset 0 1px 0 rgba(255,255,255,.70);
}
.dark {
  --glass-bg: rgba(30,23,16,.85);
  --glass-bg-strong: rgba(30,23,16,.92);
  --glass-bg-card: rgba(30,23,16,.80);
  --glass-bg-subtle: rgba(30,23,16,.62);
  --glass-border: rgba(245,238,228,.08);
  --glass-border-subtle: rgba(245,238,228,.06);
  --glass-shadow-inset: inset 0 1px 0 rgba(245,238,228,.05);
}
```

❌ DON'T:
```css
/* Don't use cool grays — must be warm dark */
.dark { --glass-bg: rgba(30,30,30,.85); } /* ← cool gray, banned */
```

**Verification:** `npm run build`
**Commit:** `git commit -m "phase1: add glass CSS custom properties for dark mode"`

> ⚠️ **BE CAREFUL**: Do NOT override existing `:root` variables. APPEND to the existing block. Check if `globals.css` already has a `:root` block first.

---

### Phase 2: Replace Hardcoded rgba in 12 Files

For each file below, find ALL inline `style={{ ... }}` blocks containing `rgba(255,255,255,...)` and replace with the corresponding CSS variable.

**Replacement map:**
| Hardcoded Value | Replace With |
|---|---|
| `rgba(255,255,255,.92)` | `var(--glass-bg-strong)` |
| `rgba(255,255,255,.82)` | `var(--glass-bg)` |
| `rgba(255,255,255,.80)` | `var(--glass-bg-card)` |
| `rgba(255,255,255,.75)` | `var(--glass-bg-card)` |
| `rgba(255,255,255,.70)` in backgrounds | `var(--glass-bg-card)` |
| `rgba(255,255,255,.62)` | `var(--glass-bg-subtle)` |
| `rgba(255,255,255,.55)` in borders | `var(--glass-border-subtle)` |
| `rgba(255,255,255,.70)` in borders | `var(--glass-border)` |
| `rgba(255,255,255,.80)` in borders | `var(--glass-border)` |
| `rgba(255,255,255,.96)` | `var(--glass-bg-strong)` |
| `inset 0 1px 0 rgba(255,255,255,.70)` | `var(--glass-shadow-inset)` |
| `inset 0 1px 0 rgba(255,255,255,.80)` | `var(--glass-shadow-inset)` |
| `inset 0 1px 0 rgba(255,255,255,.90)` | `var(--glass-shadow-inset)` |
| `inset 0 1px 0 rgba(255,255,255,.50)` | `var(--glass-shadow-inset)` |

**Files to modify (in order):**

1. **[MODIFY] `components/layout/Header.tsx`** — 6 hits (nav bar, dropdowns, mobile menu)
2. **[MODIFY] `components/SearchFilterBar.tsx`** — 4 hits (price popup, sort dropdown)
3. **[MODIFY] `components/HomePage.tsx`** — 5 hits (category cards, partner section)
4. **[MODIFY] `components/SalonCard.tsx`** — 4 hits (card bg, hover shadow)
5. **[MODIFY] `components/CategoryPage.tsx`** — 6 hits (hero overlay, sort buttons)
6. **[MODIFY] `components/ui/HomeSearchBar.tsx`** — 3 hits (autocomplete dropdown)
7. **[MODIFY] `components/ui/HeroVisualCard.tsx`** — 5 hits (hero cards)
8. **[MODIFY] `components/ui/SocialProofStrip.tsx`** — 3 hits (social bar)
9. **[MODIFY] `components/ReviewCarousel.tsx`** — 3 hits (review cards)
10. **[MODIFY] `components/ui/BottomSheet.tsx`** — 1 hit (sheet bg)
11. **[MODIFY] `components/ProfilePage.tsx`** — 1 hit (profile card)
12. **[MODIFY] `components/barber/BarbershopSections.tsx`** — 1 hit (section card)

✅ DO:
```tsx
// BEFORE (broken in dark mode):
style={{ background: "rgba(255,255,255,.92)", backdropFilter: "blur(24px)" }}

// AFTER (works in both modes):
style={{ background: "var(--glass-bg-strong)", backdropFilter: "blur(24px)" }}
```

❌ DON'T:
```tsx
// Don't remove backdropFilter or boxShadow — only change rgba(255,...) values
// Don't change rgba(26,18,9,...) — those are shadow colors and work in both modes
```

**Verification:** `npm run build` → toggle dark mode on homepage, salons, categories
**Commit:** `git commit -m "phase2: replace hardcoded white glass with CSS vars for dark mode"`

> ⚠️ **BE CAREFUL**:
> - `SalonCard.tsx` line ~105 has `whileHover` with an `inset rgba(255,255,255,.80)` — this is inside a framer-motion prop, not a static style. Still replace it with `var(--glass-shadow-inset)`.
> - `CategoryPage.tsx` line ~79 has `rgba(26,18,9,.55)` as a DARK overlay on images — do NOT change this one, it's correct.
> - `HomePage.tsx` lines ~611-638 use `rgba(255,255,255,.06)` and `.12` as DECORATIVE subtle tints on the dark partner section — these are intentionally near-transparent on dark bg. Leave them.

---

### Phase 3: Verify Dark Mode

1. Toggle dark mode via ThemeToggle
2. Check these pages:
   - `/de` (homepage) — all glass cards readable
   - `/de/coiffeur` (category) — filter bar, sort dropdown readable
   - `/de/last-minute` — filter bar readable
   - Any salon detail page — SalonCard readable
3. `npm run build`
4. `npx tsc --noEmit`

**Commit:** `git commit -m "phase3: dark mode glass verification complete"`

> ⚠️ **BE CAREFUL**: If any glass element looks wrong (too dark, too transparent), check that you used the right variable. `--glass-bg-strong` (.92 opacity = most opaque) vs `--glass-bg-subtle` (.62 = most transparent).

---

## R6: Dependency Ordering

| Step | Type | What | Depends On |
|---|---|---|---|
| Phase 1 | 🤖 | CSS variables | Nothing |
| Phase 2 | 🤖 | Replace in 12 files | Phase 1 |
| Phase 3 | 🤖 | Verify | Phase 2 |

## R8: CLAUDE.md Updates
**[MODIFY] `CLAUDE.md`** Section 3.3 — Add:
```
- **Glass tokens (dark mode)**: Use CSS vars (`--glass-bg`, `--glass-bg-strong`, `--glass-border`) instead of hardcoded `rgba(255,255,255,...)`. These flip automatically in `.dark`. See `globals.css`.
```
