# V5 Zone 6 Roadmap — Motion & Micro-animations Site-Wide
`_tasks/roadmap-v5-zone6-motion.md`

> **Scope:** `components/SalonCard.tsx`, `components/HomePage.tsx`, `components/CategoryPage.tsx`, `components/LastMinuteCard.tsx`, `app/globals.css` (heart-bounce keyframe)
> **Target:** Purge all banned spring/transition-all patterns. Add stagger reveals to all card grids. Add section heading slide-in.

---

## Breakage Risk Assessment

| Phase | Risk | Could Break | Prevention |
|---|---|---|---|
| 6.1 | 🟢 SAFE | Nothing | CSS + animation fixes |
| 6.2 | 🟢 SAFE | Nothing | Animation-only |
| 6.3 | 🟢 SAFE | Nothing | Animation-only |

---

## 🤖 Phase 6.1 — Global spring audit and purge

Run this grep before starting:
```bash
grep -rn "type.*spring\|transition-all" components/ app/ --include="*.tsx" --include="*.ts" | grep -v "node_modules" | grep -v "_archive"
```

For EVERY match found:
- `type: "spring"` in a layout/card/grid transition → replace with `{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }`
- `type: "spring"` on a category icon/heart/avatar → **KEEP** but constrain: `{ type: "spring", stiffness: 400, damping: 25 }`
- `transition-all` in className → replace with explicit property list:
  - Cards: `transition-[transform,box-shadow]`
  - Buttons: `transition-[transform,filter,background-color]`
  - Colors: `transition-colors`
  - Opacity: `transition-opacity`

Key files to fix based on the audit:
- `[MODIFY] components/SalonCard.tsx` — `cardReveal` (already cubic-bezier ✅, verify heart-bounce)
- `[MODIFY] components/HomePage.tsx` — `itemVariants`, `fadeUp` (see Zone 1 roadmap Phase 1.4)
- `[MODIFY] components/LastMinuteCard.tsx` — hover transitions
- `[MODIFY] components/CategoryPage.tsx` — button/filter transitions

**Pattern to enforce everywhere:**

✅ DO:
```tsx
// Cards:
className="transition-[transform,box-shadow] duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)]"

// Buttons:
className="transition-[transform,filter] duration-150"

// Color changes:
className="transition-colors duration-150"
```

❌ DON'T:
```tsx
className="transition-all"          // too broad, layout-thrash risk
transition: { type: "spring" }      // banned on layout transitions
```

**Commit**: `git commit -m "phase 6.1: purge banned spring and transition-all patterns site-wide"`

---

## 🤖 Phase 6.2 — Add stagger reveal to all homepage card grids

**File**: `[MODIFY] components/HomePage.tsx`

Create a reusable stagger container variant (put at top of file, after existing variants):
```tsx
const gridContainerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};

const gridItemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1, y: 0,
    transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] },
  },
};
```

Apply to EVERY card grid section wrapper:
```tsx
<motion.div
  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
  variants={gridContainerVariants}
  initial="hidden"
  whileInView="visible"
  viewport={{ once: true, amount: 0.1 }}
>
  {salons.map((salon) => (
    <motion.div key={salon.id} variants={gridItemVariants}>
      <SalonCard salon={salon} ... />
    </motion.div>
  ))}
</motion.div>
```

**Affected grid sections in HomePage.tsx:**
- Featured Salons grid
- Trending Salons grid
- New Salons grid
- Last Minute slots grid

> ⚠️ **BE CAREFUL**: `SalonCard` itself has `motion.div` with `cardReveal` variant. When wrapped in another `motion.div` with grid variants, the inner `cardReveal` will also fire. To avoid double-animation, remove `variants={cardReveal}` from `SalonCard` and let the parent grid handle the reveal.
>
> Or: make `cardReveal` in `SalonCard` optional via a prop `animated?: boolean` and set it to `false` when used in the grid. Default to `true` for standalone usage.

**Commit**: `git commit -m "phase 6.2: add stagger reveal to all homepage card grids"`

---

## 🤖 Phase 6.3 — Section heading slide-in

**File**: `[MODIFY] components/HomePage.tsx`

Every section heading (`<h2>` + optional eyebrow `<span>`) should slide in from below when scrolled into view.

Create a reusable heading variant:
```tsx
const headingVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1, y: 0,
    transition: { duration: 0.5, ease: [0.23, 1, 0.32, 1] },
  },
};
```

Apply to each section heading block:
```tsx
<motion.div
  variants={headingVariants}
  initial="hidden"
  whileInView="visible"
  viewport={{ once: true, amount: 0.5 }}
  className="mb-7"
>
  <span className="block font-body font-bold text-[11px] uppercase tracking-[.10em] text-s-amber mb-2">
    {t("featured.eyebrow")}
  </span>
  <h2 className="font-heading font-extrabold text-s-ink dark:text-s-dm-text" ...>
    {t("featured.title")}
  </h2>
</motion.div>
```

> ⚠️ **BE CAREFUL**: Use `whileInView` not `animate` — section headings are below the fold. `viewport={{ once: true }}` means it only animates once (Airbnb behaviour — no re-trigger on scroll back up).
>
> Do NOT apply to Zone 3 or Zone 4 sections (booking, dashboard). Check the section type before adding.

**Commit**: `git commit -m "phase 6.3: section headings slide-in from bottom on scroll into view"`

---

## Execution Order

| Step | Type | What | Depends On |
|---|---|---|---|
| Phase 6.1 | 🤖 | Purge springs + transition-all | Nothing |
| Phase 6.2 | 🤖 | Grid stagger reveals | 6.1 |
| Phase 6.3 | 🤖 | Section heading slide-in | Nothing |

6.1 and 6.3 can run in parallel. 6.2 depends on 6.1 for the SalonCard animated prop.
