# V5 Zone 1 Roadmap — Hero Section Overhaul
`_tasks/roadmap-v5-zone1-hero.md`

> **Scope:** `components/HomePage.tsx` hero section (lines 204–256), `components/ui/HomeSearchBar.tsx`
> **Target:** Cinematic gradient hero + always-visible glass search pill + ambient depth

---

## Breakage Risk Assessment

| Phase | Risk | Could Break | Prevention |
|---|---|---|---|
| 1.1 | 🟢 SAFE | Nothing | New CSS class, no JSX change |
| 1.2 | 🟡 MEDIUM | Hero layout shift | Test at all breakpoints before commit |
| 1.3 | 🟡 MEDIUM | Search bar regression | Keep `<HomeSearchBar />` wrapper unchanged |
| 1.4 | 🟢 SAFE | Nothing | Animation-only change |

---

## 🤖 Phase 1.1 — Add `.hero-cinematic` CSS class to `globals.css`

**File**: `[MODIFY] app/globals.css`

Add the new cinematic gradient background token. This replaces the flat `bg-white` on the hero section.

```css
/* ── V5 Hero Cinematic Gradient ────────────────────────────────── */
.hero-cinematic {
  background:
    radial-gradient(ellipse 80% 60% at 50% -10%, rgba(232, 98, 74, 0.12) 0%, transparent 70%),
    radial-gradient(ellipse 60% 40% at 80% 100%, rgba(74, 30, 60, 0.08) 0%, transparent 60%),
    radial-gradient(ellipse 40% 30% at 10% 80%, rgba(212, 135, 10, 0.06) 0%, transparent 50%),
    var(--bg);
}

.dark .hero-cinematic {
  background:
    radial-gradient(ellipse 80% 60% at 50% -10%, rgba(232, 98, 74, 0.18) 0%, transparent 70%),
    radial-gradient(ellipse 60% 40% at 80% 100%, rgba(74, 30, 60, 0.14) 0%, transparent 60%),
    radial-gradient(ellipse 40% 30% at 10% 80%, rgba(212, 135, 10, 0.10) 0%, transparent 50%),
    var(--bg);
}

/* ── V5 Glass Pill ────────────────────────────────────────────── */
.glass-pill {
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(12px) saturate(1.2);
  -webkit-backdrop-filter: blur(12px) saturate(1.2);
  border: 1px solid rgba(26, 18, 9, 0.08);
}

.dark .glass-pill {
  background: rgba(30, 23, 16, 0.60);
  border: 1px solid rgba(245, 238, 228, 0.08);
}
```

✅ DO:
```css
.hero-cinematic { background: radial-gradient(...), var(--bg); }
```

❌ DON'T:
```css
.hero-cinematic { background: #E8624A; } /* never raw hex on sections */
```

> ⚠️ **BE CAREFUL**: Do NOT add `min-height` to `.hero-cinematic` — let the section control its own height. This class is background-only.

**Commit**: `git commit -m "phase 1.1: add hero-cinematic and glass-pill CSS tokens"`

---

## 🤖 Phase 1.2 — Swap hero background in `HomePage.tsx`

**File**: `[MODIFY] components/HomePage.tsx`

BEFORE (line 205):
```tsx
<div className="min-h-screen bg-white dark:bg-s-dm-bg ambient-v5 relative overflow-x-hidden">
```

AFTER:
```tsx
<div className="min-h-screen hero-cinematic relative overflow-x-hidden">
```

BEFORE (line 208):
```tsx
<section className="relative overflow-hidden pt-10 sm:pt-16 pb-6 sm:pb-10">
```

AFTER:
```tsx
<section className="relative overflow-hidden pt-14 sm:pt-20 pb-10 sm:pb-14">
```

✅ DO: swap `ambient-v5` for `hero-cinematic`, adjust vertical padding slightly
❌ DON'T: change `overflow-x-hidden` or `relative` — they prevent layout jumps

> ⚠️ **BE CAREFUL**: The `ambient-v5` class was also on sections below the hero. Only change the outer wrapper. The hero section `<section>` does NOT need `ambient-v5` — `hero-cinematic` replaces it on the root.

**Commit**: `git commit -m "phase 1.2: apply cinematic gradient hero background"`

---

## 🤖 Phase 1.3 — Make search pill always visible (remove hover-only glow)

**File**: `[MODIFY] components/HomePage.tsx` (lines 232–236)

BEFORE:
```tsx
<div className="mt-8 max-w-4xl mx-auto relative group">
  <div className="absolute -inset-3 md:-inset-5 bg-gradient-to-r from-s-coral/8 via-s-plum/6 to-s-amber/8 rounded-[40px] blur-2xl opacity-0 group-hover:opacity-60 transition-opacity duration-[400ms] -z-10" />
  <HomeSearchBar />
</div>
```

AFTER:
```tsx
<div className="mt-10 max-w-4xl mx-auto relative">
  {/* Always-visible ambient glow under the pill */}
  <div
    aria-hidden
    className="absolute -inset-4 bg-gradient-to-r from-s-coral/10 via-s-plum/8 to-s-amber/10 rounded-[48px] blur-2xl opacity-40 -z-10 transition-opacity duration-500 group-hover:opacity-70"
  />
  <HomeSearchBar />
</div>
```

**File**: `[MODIFY] components/ui/HomeSearchBar.tsx`

The search bar outer wrapper must use `.glass-search` instead of a plain white background.

Find the outermost container in `HomeSearchBar.tsx` and:

BEFORE (whatever the current wrapper is):
```tsx
<div className="bg-white border border-s-ink/[0.06] rounded-search shadow-warm-md ...">
```

AFTER:
```tsx
<div className="glass-search rounded-search shadow-warm-md transition-shadow duration-300 focus-within:shadow-warm-lg ...">
```

✅ DO: use `glass-search` class — it already includes all the blur/bg/border
❌ DON'T: add `bg-white` or `backdrop-blur-*` manually — the class handles it

> ⚠️ **BE CAREFUL**: `HomeSearchBar.tsx` has internal state for date/location/category. Don't touch any of that logic. Only change the outermost wrapper's className.

**Commit**: `git commit -m "phase 1.3: search pill always-visible glass styling"`

---

## 🤖 Phase 1.4 — Fix hero animation variants (remove banned spring)

**File**: `[MODIFY] components/HomePage.tsx` (lines 49–63)

BEFORE:
```tsx
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1, y: 0,
    transition: { type: "spring", stiffness: 320, damping: 28 },  // ← BANNED
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
  visible: {
    opacity: 1, y: 0, filter: "blur(0px)",
    transition: { type: "spring", stiffness: 300, damping: 30, mass: 0.8 },  // ← BANNED
  },
};
```

AFTER:
```tsx
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1, y: 0,
    transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
  visible: {
    opacity: 1, y: 0, filter: "blur(0px)",
    transition: { duration: 0.5, ease: [0.23, 1, 0.32, 1] },
  },
};
```

Also update `containerVariants` stagger from 0.07 to 0.06 (60ms):
```tsx
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};
```

✅ DO: `ease: [0.23, 1, 0.32, 1]` — cubic-bezier array notation for framer-motion
❌ DON'T: `type: "spring"` — banned for layout transitions

> ⚠️ **BE CAREFUL**: Grep for ALL instances of `type: "spring"` in `HomePage.tsx` before committing. There may be more than shown here.

**Commit**: `git commit -m "phase 1.4: fix banned spring animations in hero to cubic-bezier"`

---

## Execution Order

| Step | Type | What | Depends On |
|---|---|---|---|
| Phase 1.1 | 🤖 | Add CSS tokens | Nothing |
| Phase 1.2 | 🤖 | Swap hero background | 1.1 |
| Phase 1.3 | 🤖 | Glass search pill | 1.1 |
| Phase 1.4 | 🤖 | Fix spring animations | Nothing |

Phases 1.1 and 1.4 can run in parallel. 1.2 and 1.3 require 1.1 first.
