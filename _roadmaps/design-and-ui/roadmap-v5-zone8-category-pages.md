# V5 Zone 8 Roadmap — Category Pages (Listing, Filters, Sticky Toolbar)
`_tasks/roadmap-v5-zone8-category-pages.md`

> **Scope:** `components/CategoryPage.tsx`, `components/ui/FilterBar.tsx` when used on category pages, sticky header region on category pages
> **Target:** Glass sticky toolbar, lifestyle hero, consistent card grid, glass filter pills

---

## Breakage Risk Assessment

| Phase | Risk | Could Break | Prevention |
|---|---|---|---|
| 8.1 | 🟡 MEDIUM | Category page layout shift on mobile | Test sticky position on iOS Safari |
| 8.2 | 🟢 SAFE | Nothing | Style-only hero change |
| 8.3 | 🟢 SAFE | Nothing | Grid stagger additive |

---

## 🤖 Phase 8.1 — Sticky glass toolbar for filter bar on category pages

**File**: `[MODIFY] components/CategoryPage.tsx`

Find the filter bar container (the sticky region that houses `<FilterBar />` + `<SearchAutocomplete />`).

BEFORE (common pattern in CategoryPage):
```tsx
<div className="sticky top-[68px] z-30 bg-white dark:bg-s-dm-bg border-b border-s-ink/[0.06] ...">
  <FilterBar ... />
</div>
```

AFTER:
```tsx
<div className="sticky top-[68px] z-30 glass-toolbar border-b border-s-ink/[0.04] dark:border-white/[0.04]">
  <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
    <FilterBar ... zone={zone} />
  </div>
</div>
```

`glass-toolbar` class provides: `backdrop-blur(16px) saturate(1.2) rgba(255,255,255,0.88)` — already defined in `globals.css`.

> ⚠️ **BE CAREFUL**: The `top-[68px]` offset is the header height. If the header height changed in Zone 4, update this offset. Grep:
> ```bash
> grep -n "sticky top-\[" components/CategoryPage.tsx
> ```
> Also: `glass-toolbar` on a `position: sticky` element may flicker in Safari. Test on iOS. Fallback: add `will-change: transform` to the sticky container.

**Commit**: `git commit -m "phase 8.1: category page filter bar uses glass-toolbar sticky header"`

---

## 🤖 Phase 8.2 — Category page hero mood gradient

**File**: `[MODIFY] components/CategoryPage.tsx`

Each category page (coiffeur, barbershop, nails, etc.) should have a coloured hero mood gradient, not a plain white header.

Add a category-to-color map:
```tsx
const CATEGORY_HERO_GRADIENT: Record<string, string> = {
  coiffeur:   "radial-gradient(ellipse 100% 100% at 50% 0%, rgba(232,98,74,0.15) 0%, transparent 70%)",
  barbershop: "radial-gradient(ellipse 100% 100% at 50% 0%, rgba(74,30,60,0.12) 0%, transparent 70%)",
  nails:      "radial-gradient(ellipse 100% 100% at 50% 0%, rgba(242,193,68,0.15) 0%, transparent 70%)",
  spa:        "radial-gradient(ellipse 100% 100% at 50% 0%, rgba(123,166,136,0.15) 0%, transparent 70%)",
  makeup:     "radial-gradient(ellipse 100% 100% at 50% 0%, rgba(201,169,110,0.15) 0%, transparent 70%)",
  waxing:     "radial-gradient(ellipse 100% 100% at 50% 0%, rgba(107,163,200,0.15) 0%, transparent 70%)",
};
```

Apply to the page hero/header section:
```tsx
<section
  className="relative pt-10 pb-6"
  style={{ background: CATEGORY_HERO_GRADIENT[category] || "var(--bg)" }}
>
  {/* Category name + subtitle */}
  <div className="max-w-6xl mx-auto px-4">
    <h1 className="font-display uppercase text-s-ink dark:text-s-dm-text" style={{ fontSize: "clamp(36px, 6vw, 60px)" }}>
      {categoryLabel}
    </h1>
    <p className="font-body text-s-ink/50 dark:text-s-dm-text/50 mt-1 text-sm">
      {t("categorySubtitle", { count: salonCount, city: cityName })}
    </p>
  </div>
</section>
```

✅ DO: category-specific gradient, warm palette, no photo required
❌ DON'T: use a full-bleed photo here — category pages load quickly and photos would slow them

**Commit**: `git commit -m "phase 8.2: category pages get mood gradient hero per category"`

---

## 🤖 Phase 8.3 — Stagger reveal on category page salon grid

**File**: `[MODIFY] components/CategoryPage.tsx`

The listing grid on category pages needs the same stagger reveal pattern as homepage grids (Zone 6 Phase 6.2).

Wrap the salon grid:
```tsx
<motion.div
  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
  variants={gridContainerVariants}
  initial="hidden"
  animate="visible"   {/* not whileInView here — grid is the main content */}
>
  {salons.map((salon, i) => (
    <motion.div key={salon.id} variants={gridItemVariants} custom={i}>
      <SalonCard salon={salon} ... animated={false} />
    </motion.div>
  ))}
</motion.div>
```

Use `animate="visible"` (not `whileInView`) because the grid IS the page — it's always in view.

Import the same `gridContainerVariants` and `gridItemVariants` — or extract them to `lib/motion.ts` for reuse:

**File**: `[NEW] lib/motion.ts` — shared motion variants:
```tsx
export const EASE_V5 = [0.23, 1, 0.32, 1] as const;

export const gridContainerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};

export const gridItemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1, y: 0,
    transition: { duration: 0.4, ease: EASE_V5 },
  },
};

export const headingVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1, y: 0,
    transition: { duration: 0.5, ease: EASE_V5 },
  },
};
```

Then import from `lib/motion.ts` in both `HomePage.tsx` and `CategoryPage.tsx` — single source of truth.

> ⚠️ **BE CAREFUL**: If `CategoryPage.tsx` re-fetches data on filter change (re-renders the grid), the stagger animation will replay on each filter change. That's fine and desirable — it gives visual feedback that the grid updated. However, avoid staggering more than 12 items at a time (12 × 60ms = 720ms total). If the grid has 20+ items, only stagger the first 8: `custom={Math.min(i, 7)}`.

**Commit**: `git commit -m "phase 8.3: category page salon grid stagger reveal + extract lib/motion.ts"`

---

## Execution Order

| Step | Type | What | Depends On |
|---|---|---|---|
| Phase 8.1 | 🤖 | Glass filter toolbar | Zone 5 Phase 5.1 (glass CSS) |
| Phase 8.2 | 🤖 | Category hero gradient | Nothing |
| Phase 8.3 | 🤖 | Grid stagger + lib/motion.ts | Zone 6 Phase 6.1 |

8.2 is independent. 8.1 needs Zone 5 CSS. 8.3 should run after Zone 6.
