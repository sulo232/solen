# V5 Zone 2 Roadmap — Animated Category Row
`_tasks/roadmap-v5-zone2-categories.md`

> **Scope:** `components/HomePage.tsx` category section (lines 258–294), `components/icons/category/*.tsx`
> **Target:** Airbnb-style horizontal scroll (mobile) + 6-up grid (desktop) + animated SVG icons + stagger load animation

---

## Breakage Risk Assessment

| Phase | Risk | Could Break | Prevention |
|---|---|---|---|
| 2.1 | 🟢 SAFE | Nothing | Only icon files changed |
| 2.2 | 🟡 MEDIUM | Category grid layout | Keep fallback grid for `md:` |
| 2.3 | 🟢 SAFE | Nothing | Animation-only change |

---

## 🤖 Phase 2.1 — Animate all 6 category icons (CSS SVG micro-animations)

For each icon, add an `animate?: boolean` prop. When `true`, the icon plays its 1-cycle animation.

**File**: `[MODIFY] components/icons/category/CoiffeurIcon.tsx`
Already started in this session. Verify the `animate` prop exists and the `scissor-top` / `scissor-bot` keyframes work.

**File**: `[MODIFY] components/icons/category/BarberIcon.tsx`
Add `animate` prop. Animation: razor shimmer — `strokeDashoffset` from 0 to full path length and back (a shine pass across the blade).

```tsx
<style>{`
  @keyframes razor-shine {
    0%, 100% { stroke-dashoffset: 0; }
    50% { stroke-dashoffset: 24; }
  }
`}</style>
```

**File**: `[MODIFY] components/icons/category/NailsIcon.tsx`
Add `animate` prop. Animation: nail brush drip — a small `<circle>` at the brush tip that scales from 0 → 1 → 0 (drip drops).

```tsx
@keyframes nail-drip {
  0%, 70%, 100% { transform: scaleY(0); transform-origin: top; }
  30% { transform: scaleY(1); }
}
```

**File**: `[MODIFY] components/icons/category/SpaIcon.tsx`
Add `animate` prop. Animation: lotus petals open — `rotate` from -10deg to 0 on each petal path.

```tsx
@keyframes lotus-open {
  0% { transform: rotate(-10deg); opacity: 0.5; }
  100% { transform: rotate(0deg); opacity: 1; }
}
```

**File**: `[MODIFY] components/icons/category/MakeupIcon.tsx`
Add `animate` prop. Animation: lipstick stroke — `strokeDashoffset` drawing a curved arc.

**File**: `[MODIFY] components/icons/category/WaxingIcon.tsx`
Add `animate` prop. Animation: strip peel — `translateY` + `skewX` going from 0 to slight skew (peel motion).

**Pattern for ALL icons:**
```tsx
export function CoiffeurIcon({
  animate = false,
  ...props
}: React.SVGProps<SVGSVGElement> & { animate?: boolean }) {
  return (
    <svg {...props}>
      {animate && <style>{`/* keyframes */`}</style>}
      {/* paths with style={animate ? { animation: "..." } : undefined} */}
    </svg>
  );
}
```

✅ DO: use `style={animate ? { animation: "name 0.55s ease-in-out" } : undefined}` on affected paths
❌ DON'T: use Tailwind animate classes inside SVGs — they don't scope correctly to SVG attributes

> ⚠️ **BE CAREFUL**: Safari requires `-webkit-` prefix for some SVG filter + animation combos. Test `CoiffeurIcon` in Safari before committing all 6.

**Commit**: `git commit -m "phase 2.1: add animate prop to all 6 category icon SVGs"`

---

## 🤖 Phase 2.2 — Rebuild category section layout

**File**: `[MODIFY] components/HomePage.tsx` (lines 258–294)

Replace the current `flex flex-wrap` grid with:
- **Mobile (< md)**: horizontal scroll row, icon circle + label below, no count
- **Desktop (≥ md)**: 6-column grid, icon circle + label + count, hover lift

BEFORE:
```tsx
<div className="flex flex-wrap justify-center gap-3 sm:gap-4">
  {CATEGORIES.map(({ key, label, Icon, color, bgClass }) => {
    // ... fat wrapping cards
  })}
</div>
```

AFTER:
```tsx
{/* Mobile: horizontal scroll (Airbnb-style) */}
<div className="flex md:hidden gap-5 overflow-x-auto scrollbar-hide px-4 -mx-4 pb-2">
  {CATEGORIES.map(({ key, label, Icon, color, bgClass }, i) => {
    const isEnabled = key !== 'spa' || CLIENT_FEATURE_FLAGS.isMassageSpaEnabled;
    return (
      <motion.div
        key={key}
        variants={categoryItemVariants}
        custom={i}
      >
        <Link
          href={isEnabled ? (persistedCity ? `/${locale}/${persistedCity}/${key}` : `/${locale}/${key}`) : '#'}
          aria-disabled={!isEnabled}
          className="flex flex-col items-center gap-2 shrink-0 group"
        >
          <div className={`w-16 h-16 rounded-full flex items-center justify-center ${bgClass} transition-transform duration-250 group-hover:scale-[1.07] group-active:scale-[0.95]`}>
            <Icon
              className={`w-7 h-7 ${isEnabled ? color : 'text-s-ink/30'}`}
              animate={false}   {/* idle — animation triggers via CSS on load */}
            />
          </div>
          <span className={`text-[11px] font-heading font-bold uppercase tracking-[.08em] whitespace-nowrap ${isEnabled ? 'text-s-ink dark:text-s-dm-text' : 'text-s-ink/40'}`}>
            {label}
          </span>
        </Link>
      </motion.div>
    );
  })}
</div>

{/* Desktop: 6-column grid */}
<div className="hidden md:grid grid-cols-6 gap-4">
  {CATEGORIES.map(({ key, label, Icon, color, bgClass }, i) => {
    const isEnabled = key !== 'spa' || CLIENT_FEATURE_FLAGS.isMassageSpaEnabled;
    return (
      <motion.div key={key} variants={categoryItemVariants} custom={i}>
        <Link
          href={isEnabled ? (persistedCity ? `/${locale}/${persistedCity}/${key}` : `/${locale}/${key}`) : '#'}
          aria-disabled={!isEnabled}
          className={`flex flex-col items-center gap-3 p-5 rounded-card border border-s-ink/[0.05] dark:border-white/[0.05] shadow-elevation-1 bg-[--raised] group transition-[transform,box-shadow] duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] ${isEnabled ? 'hover:-translate-y-[5px] hover:shadow-elevation-3' : 'cursor-default opacity-60'}`}
        >
          <div className={`w-14 h-14 rounded-full flex items-center justify-center ${bgClass} transition-transform duration-250 group-hover:scale-[1.08]`}>
            <Icon className={`w-7 h-7 ${isEnabled ? color : 'text-s-ink/30'}`} animate={false} />
          </div>
          <div className="text-center">
            <div className={`font-display text-[17px] leading-none ${isEnabled ? 'text-s-ink dark:text-s-dm-text' : 'text-s-ink/40'}`}>
              {label}
            </div>
            {isEnabled && categoryCounts[key] != null && (
              <div className="text-[10px] font-body text-s-ink/40 dark:text-s-dm-text/40 mt-1">
                {categoryCounts[key]} {t("categories.salonsCount")}
              </div>
            )}
          </div>
        </Link>
      </motion.div>
    );
  })}
</div>
```

✅ DO: use `motion.div` wrapper around each item so stagger works
❌ DON'T: put `variants` on the `<Link>` — Next.js Link doesn't forward motion props

> ⚠️ **BE CAREFUL**: The `overflow-x-auto` row on mobile needs `px-4 -mx-4` to bleed to screen edges (Airbnb pattern). The `scrollbar-hide` class must exist in `globals.css` — verify it does before committing.

**Commit**: `git commit -m "phase 2.2: category row - horizontal scroll mobile + 6-col desktop grid"`

---

## 🤖 Phase 2.3 — Add Airbnb-style load animation + icon trigger

**File**: `[MODIFY] components/HomePage.tsx`

Add new animation variants for the category section:

```tsx
// Replace the existing containerVariants for the category section
const categoryContainerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const categoryItemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: [0.23, 1, 0.32, 1],
      delay: i * 0.06,
    },
  }),
};
```

Wrap the category section in a `<motion.div>`:
```tsx
<motion.div
  variants={categoryContainerVariants}
  initial="hidden"
  whileInView="visible"
  viewport={{ once: true, amount: 0.2 }}
>
  {/* category row here */}
</motion.div>
```

Use `whileInView` instead of `animate` so it triggers when the row scrolls into view (works on mobile scroll too).

✅ DO: `whileInView={{ visible }}` with `viewport={{ once: true }}`
❌ DON'T: animate on `animate` prop at page level — this fires before the section is visible

> ⚠️ **BE CAREFUL**: The `custom={i}` prop on `motion.div` passes the index to the variant function. This requires the variant to be a function `(i) => ({...})` not an object. Verify the pattern works with framer-motion v10+.

**Commit**: `git commit -m "phase 2.3: category row stagger load animation (Airbnb-style)"`

---

## Execution Order

| Step | Type | What | Depends On |
|---|---|---|---|
| Phase 2.1 | 🤖 | Animate icon SVGs | Nothing |
| Phase 2.2 | 🤖 | Rebuild category layout | 2.1 |
| Phase 2.3 | 🤖 | Add stagger animation | 2.2 |
