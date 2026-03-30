# Design Token & Animation Sweep — Deep-Dive V3 Roadmap

> **Scope:** `tailwind.config.js`, `app/globals.css`, `lib/animations.ts`, and a platform-wide grep for token violations.
> **Zone: Foundation** — These two files define every token used across all zones. A bug here propagates to every component. Treat each change as high-risk and run `npm run build` after every phase.
> **This roadmap must be executed FIRST before any other page roadmap.** It removes deprecated tokens and NEVER-rule violations at the source.

---

## Token Audit Summary

### tailwind.config.js Violations Found

| Token | Issue | Action |
|---|---|---|
| `rounded-button` (8px) | BANNED — old V2 token. V3 uses `rounded-btn` (99px) | Remove |
| `rounded-blob` | NEVER rule #6 — blob morph radius is banned | Remove |
| `shadow-glass` | Name is misleading (values already warm) — rename to `shadow-surface` | Rename |
| `shadow-glass-hover` | Same — rename to `shadow-surface-hover` | Rename |
| `backdropBlur.glass` | OK but rename to `blur-panel` to match V3 naming | Rename |

### globals.css Violations Found

| Item | Issue | Action |
|---|---|---|
| `stampBounce` keyframe | `scale(0) → scale(1.3) → scale(0.9) → scale(1)` — NEVER #8 | Rewrite |
| `photoUpload` keyframe | `scale(0.8) → scale(1)` — NEVER #8 | Rewrite |
| Font import | Missing `JetBrains Mono` for referral code display | Add |
| `font-display` indentation | `font-display` is indented inconsistently | Fix |
| Missing glass Tier 3 | No `.glass-subtle` for auth/Zone 3 contexts | Add |

### lib/animations.ts Violations Found

| Export | Issue | Action |
|---|---|---|
| `cardPopIn` | `scale: 0.96 → 1` start — just under NEVER threshold but springs back | Refine |
| `modalVariants` | `scale: 0.97` on hidden/exit — keep (exit only, small delta) ✅ | Keep |
| `exitFade` | `scale: 0.95` on exit — borderline. Exit-only is OK per V3 rules ✅ | Keep |
| `pressAnimation` | `whileTap: scale: 0.95` — too much (5%). Max is `scale-[0.98]` | Fix |
| `containerVariants` | `staggerChildren: 0.2` — 200ms stagger is slow. Max 100ms | Fix |
| `toastVariants` | Already correct (opacity + y only) ✅ | Keep |

---

## Breakage Risk Assessment

| Phase | Risk | Reason |
|---|---|---|
| P1 — Remove `rounded-button` | 🔴 High | If any component still uses it, removing causes visual regression |
| P2 — Remove `rounded-blob` | 🟡 Medium | SalonCard still needs to be cleaned up (Global roadmap P15) |
| P3 — Rename shadow-glass | 🔴 High | Name used in Toast, Header — must grep and update all usages first |
| P4 — Add glass utilities | 🟢 Low | New additions, no regressions |
| P5 — Fix stampBounce | 🟡 Medium | Used in StampCard — verify animation still feels celebratory |
| P6 — Fix photoUpload | 🟢 Low | Onboarding-only |
| P7 — Add font import | 🟢 Low | Additive only |
| P8 — cardPopIn refinement | 🟡 Medium | Used in grid loading — verify cards still feel snappy |
| P9 — pressAnimation fix | 🟢 Low | `0.95 → 0.98` max delta |
| P10 — stagger timing | 🟢 Low | 200ms → 80ms per child |
| P11 — Grep scan final | 🟢 Low | Verification only |

---

## Phase 1 — Remove `rounded-button` (BANNED V2 Token)

### ⚠️ GREP FIRST — find all usages before removing

```bash
# Grep for rounded-button usage:
grep -rn "rounded-button\|rounded-btn\b" components/ app/ --include="*.tsx" --include="*.ts" --include="*.css"
```

Expected: no usages of `rounded-button` (V2 discontinued). If any found, migrate to `rounded-btn` first.

### Files to modify

#### [MODIFY] [tailwind.config.js](file:///c:/Users/sulod/solen/tailwind.config.js)
**Lines 44–51** — borderRadius block:
```js
borderRadius: {
  // Legacy Tailwind vars (keep for shadcn compat)
  lg: "var(--radius)",
  md: "calc(var(--radius) - 2px)",
  sm: "calc(var(--radius) - 4px)",
  // ── Solen V3 Design System ──
  card: "12px",      // Zone 2 cards, salon profiles
  pill: "9999px",    // availability Pills, tags
  btn:  "99px",      // CTA buttons, action buttons (V3 standard)
  input: "12px",     // form inputs
  // NOTE: rounded-button (8px) REMOVED — use rounded-btn (99px)
  // NOTE: rounded-blob REMOVED — NEVER rule #6
},
```

**Git commit:** `git add tailwind.config.js && git commit -m "TOKEN-P1: remove rounded-button (8px banned) and rounded-blob (NEVER) from config"`

---

## Phase 2 — Remove `rounded-blob` (NEVER Rule #6)

> Included in Phase 1 above. Separate phase for the grep sweep.

```bash
# Find all blob usages:
grep -rn "rounded-blob\|blob-d\|blob-interactive" components/ app/ --include="*.tsx"
```

Expected violations to fix:
- `SalonCard.tsx` — `group-hover:rounded-blob-d` (addressed in Global P15)
- `DirectoryCard` — any `blob-interactive` classes
- `CategoryPage.tsx` — Directory category icons

For each violation found:
```tsx
// Before:
className="... rounded-blob group-hover:rounded-blob-d ..."
// After:
className="... rounded-[16px] ..."
```

**Git commit:** `git add [affected files] && git commit -m "TOKEN-P2: remove all rounded-blob usages — NEVER rule #6 compliance"`

---

## Phase 3 — Rename shadow-glass to shadow-surface

### ⚠️ GREP FIRST

```bash
# Find all shadow-glass usages (we need to update these before renaming):
grep -rn "shadow-glass\b" components/ app/ --include="*.tsx" --include="*.ts"
```

Expected: `Toast.tsx`, possibly `SalonCard.tsx`, older components. We already fixed Toast in Global P5. Run the grep to confirm zero remaining usages, then rename.

### Files to modify

#### [MODIFY] [tailwind.config.js](file:///c:/Users/sulod/solen/tailwind.config.js)
**Lines 53–58** — boxShadow block:
```js
boxShadow: {
  // ── Legacy warm aliases (renamed for V3 clarity) ──
  // Use shadow-warm-* family instead of deprecated shadow-card/glass names:
  card:           "0 1px 2px rgba(26,18,9,.06)",             // kept for compat
  "card-hover":   "0 8px 16px rgba(26,18,9,.10), 0 20px 60px rgba(26,18,9,.08)",
  // shadow-glass renamed to shadow-surface (values unchanged — already warm):
  surface:        "0 8px 32px rgba(26,18,9,0.06)",           // was: shadow-glass
  "surface-hover": "0 16px 48px rgba(26,18,9,0.10)",         // was: shadow-glass-hover
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
  "pressed":          "0 1px 1px rgba(26,18,9,.12), inset 0 1px 2px rgba(26,18,9,.06)",
},
```

**Git commit:** `git add tailwind.config.js && git commit -m "TOKEN-P3: rename shadow-glass → shadow-surface, values unchanged (already warm)"`

---

## Phase 4 — Add Missing Glass Tier Utilities to globals.css

### Current state (globals.css lines 86–99)
```css
.glass { ... backdrop-filter: blur(20px) ... }
.glass-strong { ... backdrop-filter: blur(24px) ... }
```

**Missing:**
- `.glass-subtle` — Zone 3 auth/profile card treatment (lighter blur, barely there)
- `.glass-dark` — Dark mode sidebar/dashboard variant

### Files to modify

#### [MODIFY] [globals.css](file:///c:/Users/sulod/solen/app/globals.css)
**After line 99** — add glass tiers:
```css
  /* Glass Tier 1 — Subtle (Zone 3: Auth, Profile) */
  .glass-subtle {
    background: rgba(255, 255, 255, 0.92);
    backdrop-filter: blur(12px) saturate(1.2);
    -webkit-backdrop-filter: blur(12px) saturate(1.2);
    border: 1px solid rgba(255, 255, 255, 0.75);
  }

  /* Glass Tier 2 — Standard (Zone 1/2: Homepage, Category nav pill) */
  /* This is what .glass already does — keep as-is */

  /* Glass Tier 3 — Strong (Zone 1: Floating cards over hero) */
  /* This is what .glass-strong already does — keep as-is */

  /* Dark mode glass */
  .dark .glass {
    background: rgba(30, 23, 16, 0.82);
    border-color: rgba(255, 255, 255, 0.06);
  }
  .dark .glass-strong {
    background: rgba(30, 23, 16, 0.94);
    border-color: rgba(255, 255, 255, 0.08);
  }
  .dark .glass-subtle {
    background: rgba(30, 23, 16, 0.90);
    border-color: rgba(255, 255, 255, 0.06);
  }
```

**Git commit:** `git add app/globals.css && git commit -m "TOKEN-P4: add glass-subtle tier + dark mode glass variants"`

---

## Phase 5 — Fix stampBounce Animation (NEVER #8 Violation)

### Current state (globals.css lines 153–158)
```css
@keyframes stampBounce {
  0%   { transform: scale(0); opacity: 0; }    /* ← scale(0) NEVER */
  50%  { transform: scale(1.3); }              /* ← scale > 1.02 NEVER */
  70%  { transform: scale(0.9); }
  100% { transform: scale(1); opacity: 1; }
}
```

### ⚠️ BE CAREFUL — This animation runs when a loyalty stamp is collected. It must still feel satisfying. Replace scale with a combination of opacity + a brief vertical pop.

### Files to modify

#### [MODIFY] [globals.css](file:///c:/Users/sulod/solen/app/globals.css)
**Lines 152–163**:
```css
/* ── Stamp card animations ─────────────────────────────────────────── */
@keyframes stampBounce {
  0%   { opacity: 0; transform: translateY(4px); }
  60%  { opacity: 1; transform: translateY(-3px); }
  100% { opacity: 1; transform: translateY(0); }
}
@keyframes confettiFall {
  0%   { transform: translateY(-20px) rotate(0deg); opacity: 1; }
  100% { transform: translateY(100px) rotate(360deg); opacity: 0; }
}
.stamp-new { animation: stampBounce 0.4s cubic-bezier(0.25, 1, 0.5, 1) forwards; }
.confetti  { animation: confettiFall 1.5s ease-out forwards; }
```

**Git commit:** `git add app/globals.css && git commit -m "TOKEN-P5: stampBounce → opacity+translateY only, remove scale 0→1.3 NEVER violation"`

---

## Phase 6 — Fix photoUpload Animation (NEVER #8)

### Current state (globals.css lines 175–179)
```css
@keyframes photoUpload {
  0%   { opacity: 0; transform: scale(0.8); }   /* ← scale(0.8) NEVER */
  40%  { opacity: 1; transform: scale(1); }
  100% { opacity: 1; transform: scale(1); }
}
```

### Files to modify

#### [MODIFY] [globals.css](file:///c:/Users/sulod/solen/app/globals.css)
**Lines 175–179**:
```css
@keyframes photoUpload {
  0%   { opacity: 0; transform: translateY(8px); }
  50%  { opacity: 1; transform: translateY(-2px); }
  100% { opacity: 1; transform: translateY(0); }
}
```

**Git commit:** `git add app/globals.css && git commit -m "TOKEN-P6: photoUpload → opacity+translateY only, remove scale(0.8) NEVER violation"`

---

## Phase 7 — Add JetBrains Mono Font Import

### Current state (globals.css line 2)
```css
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Syne:wght@400;500;600;700;800&family=DM+Sans:...');
```

Missing: `JetBrains Mono` (used in referral code display per User Profile roadmap P8) and `Inter` fallback.

### Files to modify

#### [MODIFY] [globals.css](file:///c:/Users/sulod/solen/app/globals.css)
**Line 2** — font import:
```css
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=JetBrains+Mono:wght@400;500&family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap');
```

Add font-mono utility:
```css
.font-mono-code {
  font-family: "JetBrains Mono", "Courier New", monospace;
  font-variant-numeric: tabular-nums;
}
```

**Git commit:** `git add app/globals.css && git commit -m "TOKEN-P7: add JetBrains Mono font import + font-mono-code utility"`

---

## Phase 8 — cardPopIn Refinement

### Current state (animations.ts lines 52–61)
```ts
export const cardPopIn: Variants = {
  hidden:  { opacity: 0, scale: 0.96, y: 10 },
  visible: {
    opacity: 1, scale: 1, y: 0,
    transition: { duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }, // ← overshoot spring
  },
};
```
- `scale: 0.96` start — just above threshold (allowed: ≥ 0.98 per V3)
- Ease `[0.34, 1.56, ...]` creates overshoot above 1.0 — NEVER

### Files to modify

#### [MODIFY] [animations.ts](file:///c:/Users/sulod/solen/lib/animations.ts)
**Lines 52–61** — cardPopIn:
```ts
/** Card fade in — for grid items appearing on load */
export const cardPopIn: Variants = {
  hidden:  { opacity: 0, y: 12 },
  visible: {
    opacity: 1, y: 0,
    transition: { duration: 0.35, ease: [0.25, 1, 0.5, 1] },
  },
};
```

**Git commit:** `git add lib/animations.ts && git commit -m "TOKEN-P8: cardPopIn — remove scale entirely, opacity+y only, no overshoot ease"`

---

## Phase 9 — pressAnimation: Max Scale Fix

### Current state (animations.ts lines 107–111)
```ts
export const pressAnimation = {
  whileTap: { scale: 0.95 },    // ← 5% shrink NEVER rule
  transition: { type: "spring", stiffness: 400, damping: 17 },
};
```

### Files to modify

#### [MODIFY] [animations.ts](file:///c:/Users/sulod/solen/lib/animations.ts)
**Lines 107–111** — pressAnimation:
```ts
/** Press animation — tactile button feedback (max 2% shrink per V3 rules) */
export const pressAnimation = {
  whileTap:   { scale: 0.98 },
  transition: { duration: 0.12, ease: "easeOut" },
};
```

**Git commit:** `git add lib/animations.ts && git commit -m "TOKEN-P9: pressAnimation scale 0.95 → 0.98 (V3 max 2% active feedback)"`

---

## Phase 10 — containerVariants: Stagger Timing

### Current state (animations.ts lines 3–13)
```ts
export const containerVariants: Variants = {
  visible: {
    transition: {
      staggerChildren: 0.2,  // ← 200ms too slow
      delayChildren: 0.05,
    },
  },
};
```

V3 rule: stagger max 80ms between children (200ms feels laggy on fast scroll).

### Files to modify

#### [MODIFY] [animations.ts](file:///c:/Users/sulod/solen/lib/animations.ts)
**Lines 3–13** — containerVariants:
```ts
/** Stagger children with 80ms delay (V3: max 100ms per child) */
export const containerVariants: Variants = {
  hidden:  { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.04,
    },
  },
};
```

**Git commit:** `git add lib/animations.ts && git commit -m "TOKEN-P10: containerVariants stagger 200ms → 80ms per V3 timing rules"`

---

## Phase 11 — Full Platform Token Grep Verification

### Final grep sweep — run after all phases complete

```bash
npm run build

# ── NEVER violations remaining? ──

# 1. Cold shadows (rgba(0,0,0)):
grep -rn "rgba(0,0,0" components/ app/ --include="*.tsx" --include="*.css"
# Expected: 0 results

# 2. Blob morph:
grep -rn "rounded-blob\|blob-d\b" components/ app/ --include="*.tsx"
# Expected: 0 results

# 3. Banned rounded-button token:
grep -rn "rounded-button\b" components/ app/ --include="*.tsx"
# Expected: 0 results

# 4. Scale violations (>1 or <0.97):
grep -rn "scale-\[1\.[1-9]\|scale: 0\.[0-8]\|scale-110\|scale-125" components/ app/ --include="*.tsx"
# Expected: 0 results

# 5. Font-body used for structural labels:
grep -rn "font-body font-medium\|font-body text-xs uppercase" components/ app/ --include="*.tsx"
# Should be: font-heading for all uppercase tracking labels

# 6. Old shadow-glass usage (after rename in P3):
grep -rn "shadow-glass\b" components/ app/ --include="*.tsx"
# Expected: 0 results after migration

# 7. Verify all zone-critical animations comply:
grep -rn "stampBounce\|photoUpload" components/ app/ --include="*.tsx" --include="*.css"
# Expected: uses from .stamp-new and .animate-photo-upload classes only

# ── Token completeness ──

# 8. Verify V3 shadow tokens present:
grep -n "warm-sm\|warm-md\|warm-lg\|coral-glow" tailwind.config.js
# Expected: all 6 warm levels + coral-glow present

# 9. Verify glass tiers present in globals.css:
grep -n "glass-subtle\|glass-strong\|glass {" app/globals.css
# Expected: 3 tiers defined
```

---

## Critical Dependency Note

> **This roadmap MUST be executed before the Global Components roadmap (Phase 3 — rename shadow-glass).** The token rename propagates to every component that uses `shadow-glass`. If you execute component roadmaps first, you'll need to grep-fix references on every component file after this sweep.

### Recommended execution order:

```
1. TOKEN SWEEP (this roadmap) ← START HERE
2. Global Components → Header, Toast, SalonCard
3. Homepage
4. Category Page
5. Salon Profile
6. Booking Flow
7. Dashboard
8. Auth Pages
9. User Profile
```

---

## Execution Order

| Phase | Task | Parallel? |
|---|---|---|
| P1 | Remove rounded-button + grep | ✅ Start immediately |
| P2 | Remove rounded-blob + grep all files | After P1 grep confirms |
| P3 | Rename shadow-glass → shadow-surface | After P2 (all usages must be migrated first!) |
| P4 | Add glass tier utilities | ✅ Independent |
| P5 | Fix stampBounce | ✅ Independent (globals.css) |
| P6 | Fix photoUpload | ✅ Independent (globals.css with P5) |
| P7 | Add JetBrains Mono | ✅ Independent (globals.css) |
| P8 | cardPopIn scale removal | ✅ Independent (animations.ts) |
| P9 | pressAnimation max fix | ✅ Independent (animations.ts with P8) |
| P10 | containerVariants stagger | ✅ Independent (animations.ts with P8,P9) |
| P11 | Final grep verification | Last — after build passes |

> P4–P7 all parallel (globals.css — careful of conflicts, do sequential).
> P8–P10 all parallel (animations.ts — careful of conflicts, do sequential).
> P1→P2→P3 strictly sequential.
> P11 absolutely last.
