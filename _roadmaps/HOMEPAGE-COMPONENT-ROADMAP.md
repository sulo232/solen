# ═══════════════════════════════════════════════════════════════
#  SOLEN.CH · HOMEPAGE COMPONENT ROADMAP
#  For: Claude Code execution
#  Stack: Next.js 15, React 19, Tailwind, Framer Motion v12
#  Updated: 2026-04-07
# ═══════════════════════════════════════════════════════════════

> **HOW TO USE THIS FILE:**
> Claude Code reads this top-to-bottom. Each `## TASK` is one atomic unit of work.
> Execute them in order. Each task has: File, What to Change, Design Tokens, Motion Spec, Responsive Rules, and a Done Checklist.
> All animation values reference `lib/animations.ts`. All colors reference `globals.css` tokens.
> **DO NOT** invent new design tokens — use only what's defined here.

---

# GLOBAL RULES (apply to EVERY task)

## Colors — The Solen Palette
```
C.ink        = #1A1209          (text, icons)
C.coral      = #E8624A          (brand accent, CTAs, active states)
C.coral-fade = rgba(232,98,74)  (use with opacity for tints)
C.bg         = #FFFFFF          (page background — NO cream, NO #FAF6EF, NO #FDFAF6)
C.border     = rgba(26,18,9,0.08)  (borders, dividers — standardized)
C.muted      = rgba(26,18,9,0.45)  (secondary text)
C.sunken     = rgba(26,18,9,0.04)  (subtle background tints for chips/badges)
```

## Typography
```
font-display  = "Bebas Neue"     → hero headlines ONLY
font-heading  = "Syne"           → section titles, labels, buttons, nav
font-body     = "DM Sans"        → body text, descriptions, metadata
```
**Rule:** Never use font-display for body. Never use font-body for headings. No mixing.

## Motion System (Framer Motion)
Import from `@/lib/animations`:
```ts
EASE_SOLEN       = [0.23, 1, 0.32, 1]    // All reveals & transitions
EASE_SNAPPY      = [0.4, 0, 0.2, 1]      // Dropdowns, popovers
EASE_BOUNCE      = { type: "spring", stiffness: 400, damping: 25 }
STAGGER_GRID     = 0.06   // 60ms between grid children
STAGGER_LIST     = 0.04   // 40ms between list items
DURATION_FAST    = 0.15   // Hover/press
DURATION_NORMAL  = 0.2    // Modals, dropdowns
DURATION_SMOOTH  = 0.3    // Reveals
DURATION_SLOW    = 0.5    // Hero animations
```

**Emil Kowalski Rules (mandatory):**
1. Never `scale(0)` — start from `scale(0.95)` + `opacity: 0`
2. `ease-out` for entering elements. NEVER `ease-in` on UI.
3. UI animations UNDER 300ms. Hero/marketing can be longer.
4. Button press = `scale(0.97)` feedback via `whileTap`
5. Popovers scale from trigger origin. Modals from center.
6. `@media (hover: hover) and (pointer: fine)` gate for hover animations
7. `prefers-reduced-motion: reduce` respected (already in globals.css ✓)
8. Stagger delays 30-80ms between items. Never block interaction during stagger.
9. Exit animations faster than enter (enter 300ms → exit 150ms)
10. Only animate `transform` and `opacity` (GPU-accelerated)

## Spacing
```
Section gap        = 32px (py-8 or space-y-8)
Section padding    = px-5 md:px-6 lg:px-10 xl:px-20
Max content width  = max-w-[2520px] mx-auto
Card border-radius = 12px (rounded-[12px])
Pill border-radius = 9999px (rounded-pill or rounded-full)
```

## Accessibility
- Every icon-only button needs `aria-label`
- Focus ring: `outline: 2px solid rgba(232,98,74,0.5)` (already global ✓)
- No emoji as icons — use SVG stroke icons only
- Badges/stats must come from data, not hardcoded

---

# ═════════════════════════════════════════════
#  PHASE 1: HERO & FIRST IMPRESSION
#  Impact: ★★★★★ (above-the-fold)
# ═════════════════════════════════════════════

## TASK 1.1 — HomepageHero: Fix Cream Colors & Add Entrance Motion

**File:** `components/ui/HomepageHero.tsx`

### What to Change

**A — Category Chips (lines 75-106):**
Remove ALL inline `onMouseEnter` / `onMouseLeave` handlers. Replace with CSS classes:

```tsx
// BEFORE (bad — inline style handlers)
style={{ background: "#FAF6EF", color: "#6A5040", borderColor: "#E8D8CC" }}
onMouseEnter={e => { ... }}
onMouseLeave={e => { ... }}

// AFTER (good — Tailwind classes, no inline handlers)
className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-pill text-xs
  font-heading font-semibold border transition-[background,color,border-color] duration-150
  active:scale-[0.97]
  bg-s-ink/[0.04] text-s-ink/70 border-s-ink/[0.08]
  hover:bg-s-coral/[0.08] hover:text-s-coral hover:border-s-coral/[0.25]"
```

Remove the `style={{}}` prop entirely from the `<Link>` chip elements.

**B — Trust Micro-Signal (lines 109-124):**
Change `style={{ fontSize: "12px", color: "#9A7A60" }}` to:
```tsx
className="flex items-center justify-center gap-2.5 font-body font-medium text-xs text-s-ink/45"
```
Remove the inline `style` prop.

Change the separator dots from `style={{ background: "#D4C4B4" }}` to:
```tsx
className="w-1 h-1 rounded-full bg-s-ink/20"
```

**C — Staggered Entrance Animation:**
Add `import { motion } from "framer-motion"` (already imported in parent, check).
Add `import { EASE_SOLEN, DURATION_SLOW, STAGGER_GRID } from "@/lib/animations"`.

Wrap each major element in the hero with staggered motion:

```tsx
const heroContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: STAGGER_GRID, delayChildren: 0.1 }
  }
};

const heroItem = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1, y: 0,
    transition: { duration: DURATION_SLOW, ease: EASE_SOLEN }
  }
};
```

Wrap the `<section>` content in:
```tsx
<motion.div variants={heroContainer} initial="hidden" animate="visible">
  <motion.div variants={heroItem}>{/* Eyebrow */}</motion.div>
  <motion.h1 variants={heroItem}>{/* Headline */}</motion.h1>
  <motion.p variants={heroItem}>{/* Subtitle */}</motion.p>
  <motion.div variants={heroItem}>{/* Search bar */}</motion.div>
  <motion.div variants={heroItem}>{/* Category chips */}</motion.div>
  <motion.div variants={heroItem}>{/* Trust signal */}</motion.div>
</motion.div>
```

### Done Checklist
- [ ] No more `#FAF6EF` or `#E8D8CC` anywhere in file
- [ ] No inline `onMouseEnter`/`onMouseLeave` handlers
- [ ] Category chips use `bg-s-ink/[0.04]` idle, `bg-s-coral/[0.08]` hover
- [ ] Trust text uses `text-s-ink/45` not `#9A7A60`
- [ ] 6 hero elements stagger in with 60ms gaps on page load
- [ ] Build passes: `npm run build`

---

## TASK 1.2 — TrustStatsBanner: Framer Motion Viewport Animation

**File:** `components/TrustStatsBanner.tsx`

### What to Change

**A — Replace manual IntersectionObserver with Framer Motion:**
The current implementation (lines 35-98) uses `IntersectionObserver` + manual `requestAnimationFrame` counter. Replace with:

```tsx
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { EASE_SOLEN, STAGGER_GRID, DURATION_SMOOTH } from "@/lib/animations";

// Animated counter hook
function useCountUp(target: number, inView: boolean) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!inView || target === 0) return;
    const controls = animate(0, target, {
      duration: 1.8,
      ease: [0.23, 1, 0.32, 1],
      onUpdate: (v) => setValue(Math.floor(v)),
    });
    return () => controls.stop();
  }, [inView, target]);
  return value;
}
```

**B — Fix inline styles → Tailwind classes:**
```tsx
// BEFORE
style={{ background: "#FFFFFF", borderTop: "1px solid rgba(26,18,9,0.06)", ... padding: "40px 48px" }}

// AFTER
className="bg-white border-y border-s-ink/[0.06] py-10 px-5 md:px-12"
```

**C — Add stagger to the 3 stat columns:**
```tsx
const statsContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } }
};

const statItem = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1, y: 0,
    transition: { duration: DURATION_SMOOTH, ease: EASE_SOLEN }
  }
};

// In JSX:
<motion.div
  variants={statsContainer}
  initial="hidden"
  whileInView="visible"
  viewport={{ once: true, margin: "-80px" }}
  className="flex items-center justify-center gap-12 flex-wrap"
>
  {statItems.map((item, idx) => (
    <motion.div key={item.label} variants={statItem} className="flex items-center gap-12">
      {/* stat content */}
    </motion.div>
  ))}
</motion.div>
```

**D — Divider height:** Change `height: 40` to `height: 32`.

### Done Checklist
- [ ] No `IntersectionObserver` or `requestAnimationFrame` in file
- [ ] Uses Framer Motion `whileInView` + `animate()` for count-up
- [ ] Stats stagger in with 120ms delay
- [ ] No inline `style` for layout padding
- [ ] Numbers animate up from 0 on first viewport entry, then stay
- [ ] Build passes

---

## TASK 1.3 — TestimonialCarousel: Kill Cream Background + Add Reveal

**File:** `components/TestimonialCarousel.tsx`

### What to Change

**A — Background fix (line 55):**
```tsx
// BEFORE
style={{ background: "#FDFAF6" }}

// AFTER — remove the style prop, add class:
className="px-5 md:px-6 lg:px-10 xl:px-20 py-16 bg-white border-t border-s-ink/[0.06]"
```

**B — Add Framer Motion viewport stagger:**
```tsx
import { motion } from "framer-motion";
import { EASE_SOLEN, STAGGER_GRID, DURATION_SMOOTH } from "@/lib/animations";

const cardContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: STAGGER_GRID } }
};

const cardItem = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1, y: 0,
    transition: { duration: 0.4, ease: EASE_SOLEN }
  }
};
```

Wrap the grid in:
```tsx
<motion.div
  variants={cardContainer}
  initial="hidden"
  whileInView="visible"
  viewport={{ once: true, margin: "-60px" }}
  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
>
```

Each `<article>` becomes `<motion.article variants={cardItem}>`.

### Done Checklist
- [ ] No `#FDFAF6` in file — background is `bg-white`
- [ ] Has `border-t border-s-ink/[0.06]` separator
- [ ] 3 testimonial cards stagger in on viewport entry
- [ ] Build passes

---

# ═════════════════════════════════════════════
#  PHASE 2: HEADER & NAVIGATION
#  Impact: ★★★★☆ (core navigation)
# ═════════════════════════════════════════════

## TASK 2.1 — Header: Smoother Scroll Morph

**File:** `components/layout/Header.tsx`

### What to Change

**A — Search pill tactile feedback (lines 254-264):**
The compact scrolled search pill should feel alive:
```tsx
<motion.button
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.97 }}
  onClick={() => setSearchExpanded(true)}
  className="flex items-center gap-2.5 bg-white border border-s-ink/[0.08] shadow-elevation-1
    rounded-full px-4 py-2 w-[380px]
    transition-shadow duration-150"
  aria-label="Suche öffnen"
>
```
Keep existing content inside. Just wrap in `motion.button` and add whileHover/whileTap.

**B — Category tab crossfade (lines 205-247 vs 250-264):**
The current toggle between icon tabs and search pill uses `opacity-0 pointer-events-none absolute`. This is fine for performance but lacks a smooth crossfade. Add a subtle `transition-opacity` with 200ms:
```tsx
// Icon tabs wrapper (line 205):
className="... transition-opacity duration-200 ..."

// Search pill wrapper (line 250):
className="... transition-opacity duration-200 ..."
```
This is a CSS-only improvement — no Framer Motion needed. The `opacity` toggle already exists. Just ensure `duration-200` is present on both.

**C — Expanded search overlay (lines 428-446):**
The spring animation is good. Add `transition={{ duration: 0.22, ease: EASE_SOLEN }}` if not already using it (it currently uses `[0.23, 1, 0.32, 1]` inline — refactor to import):
```tsx
import { EASE_SOLEN } from "@/lib/animations";
// ...
transition={{ duration: 0.22, ease: EASE_SOLEN as unknown as number[] }}
```

### Done Checklist
- [ ] Compact search pill has `whileHover` + `whileTap` spring feedback
- [ ] Tab/pill crossfade has `duration-200` on both states
- [ ] EASE_SOLEN imported from animations.ts (not hardcoded)
- [ ] Build passes

---

## TASK 2.2 — BottomTabBar: Airbnb Scroll-Hide

**File:** `components/layout/BottomTabBar.tsx`

### What to Change

**THE BEHAVIOR:** Hide the bottom tab bar when scrolling DOWN. Show it when scrolling UP. This matches the Airbnb mobile app pattern and gives more viewport space for content.

**A — Add scroll-direction tracking:**
```tsx
import { motion, useMotionValueEvent, useScroll } from "framer-motion";

// Inside component:
const { scrollY } = useScroll();
const [isVisible, setIsVisible] = useState(true);
const lastScrollY = useRef(0);

useMotionValueEvent(scrollY, "change", (current) => {
  const delta = current - lastScrollY.current;
  // Only trigger after 10px threshold to prevent jitter
  if (Math.abs(delta) < 10) return;

  if (delta > 0 && current > 80) {
    setIsVisible(false);  // Scrolling DOWN
  } else if (delta < 0) {
    setIsVisible(true);   // Scrolling UP
  }
  lastScrollY.current = current;
});
```

**B — Animate the nav bar:**
Replace the outer `<nav>` with `<motion.nav>`:
```tsx
<motion.nav
  initial={{ y: 0 }}
  animate={{ y: isVisible ? 0 : 100 }}
  transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
  className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
  style={{
    paddingBottom: "max(16px,env(safe-area-inset-bottom))",
    background: "var(--glass-bg)",
    backdropFilter: "blur(20px) saturate(180%)",
    WebkitBackdropFilter: "blur(20px) saturate(180%)",
    borderTop: "1px solid rgba(26,18,9,0.07)",
    boxShadow: "0 -1px 0 rgba(26,18,9,0.04), 0 -8px 32px rgba(26,18,9,0.06)",
  }}
  aria-label={t("mobileNavigation") ?? "Navigation"}
>
```

**C — Always show on specific interactions:**
When the login sheet opens (`loginSheet.open === true`), force `isVisible = true` so the user can still see the nav context:
```tsx
useEffect(() => {
  if (loginSheet.open) setIsVisible(true);
}, [loginSheet.open]);
```

### Motion Spec
```
Hide: translateY(100px) over 250ms, EASE_SOLEN
Show: translateY(0) over 250ms, EASE_SOLEN
Threshold: 10px scroll delta minimum, only after scrollY > 80px
```

### Done Checklist
- [ ] Nav bar hides on scroll-down (after 80px from top)
- [ ] Nav bar shows on scroll-up
- [ ] No jitter on tiny scroll movements (10px threshold)
- [ ] Login sheet forces nav visible
- [ ] Glass background preserved during animation
- [ ] `md:hidden` still hides on desktop
- [ ] Build passes

---

# ═════════════════════════════════════════════
#  PHASE 3: CAROUSELS & CARDS
#  Impact: ★★★★☆ (product display)
# ═════════════════════════════════════════════

## TASK 3.1 — FeaturedSalonCarousel: Stagger + Scroll Fade

**File:** `components/ui/FeaturedSalonCarousel.tsx`

### What to Change

**A — Card entrance stagger:**
```tsx
import { motion } from "framer-motion";
import { EASE_SOLEN, STAGGER_GRID } from "@/lib/animations";

const cardStagger = {
  hidden: {},
  visible: { transition: { staggerChildren: STAGGER_GRID } }
};
const cardItem = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1, y: 0,
    transition: { duration: 0.35, ease: EASE_SOLEN }
  }
};
```

Wrap the scroll container's content:
```tsx
<motion.div
  variants={cardStagger}
  initial="hidden"
  whileInView="visible"
  viewport={{ once: true, margin: "-60px" }}
  className="flex gap-4 overflow-x-auto scrollbar-hide px-6 pb-4 snap-x snap-mandatory"
  ref={scrollRef}
>
  {salonsToShow.map((salon, index) => (
    <motion.div key={salon.id} variants={cardItem} className="flex-shrink-0 snap-start">
      <SalonHeroCard ... />
    </motion.div>
  ))}
</motion.div>
```

**B — Nav arrow tactile feedback:**
```tsx
<motion.button
  whileHover={{ scale: 1.08 }}
  whileTap={{ scale: 0.92 }}
  onClick={() => scroll("left")}
  // ...existing classes...
>
```

**C — Scroll fade gradient (right edge):**
Add to the scroll container's parent `<div>`:
```tsx
<div className="relative">
  {/* scroll container goes here */}

  {/* Right fade gradient — indicates more content */}
  <div
    className="pointer-events-none absolute right-0 top-0 bottom-4 w-16"
    style={{
      background: "linear-gradient(to right, transparent, white)",
    }}
    aria-hidden="true"
  />
</div>
```

### Done Checklist
- [ ] Cards stagger in with 60ms gap on viewport entry
- [ ] Stagger fires only ONCE (viewport `once: true`)
- [ ] Nav arrows have spring hover/tap feedback
- [ ] Right edge has white gradient fade
- [ ] Build passes

---

## TASK 3.2 — LastMinuteStrip: Entrance Animation

**File:** `components/ui/LastMinuteStrip.tsx`

### What to Change

**A — Strip viewport entrance:**
```tsx
import { motion } from "framer-motion";
import { EASE_SOLEN, STAGGER_LIST } from "@/lib/animations";
```

Wrap the outer `<div>` in `<motion.div>`:
```tsx
<motion.div
  initial={{ opacity: 0, y: 24 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true }}
  transition={{ duration: 0.4, ease: EASE_SOLEN }}
  className="relative overflow-hidden"
  style={{ background: "#E8624A" }}
  aria-label={t("badge")}
>
```

**B — Slot card stagger:**
Each slot `<Link>` inside the scroll container gets individual stagger:
```tsx
{slots.slice(0, 6).map((slot, idx) => (
  <motion.div
    key={slot.id}
    initial={{ opacity: 0, x: 20 }}
    whileInView={{ opacity: 1, x: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.3, ease: EASE_SOLEN, delay: idx * 0.05 }}
  >
    <Link ...>{/* existing content */}</Link>
  </motion.div>
))}
```

### Done Checklist
- [ ] Strip slides up on first viewport entry
- [ ] Slot cards cascade left-to-right with 50ms stagger
- [ ] Animations fire once only
- [ ] Build passes

---

# ═════════════════════════════════════════════
#  PHASE 4: BELOW-FOLD SECTIONS
#  Impact: ★★★☆☆ (scroll-triggered delight)
# ═════════════════════════════════════════════

## TASK 4.1 — BrowseByCitySection: Viewport Reveal + Kill Inline Handlers

**File:** `components/BrowseByCitySection.tsx`

### What to Change

**A — City row stagger:**
```tsx
import { motion } from "framer-motion";
import { EASE_SOLEN } from "@/lib/animations";
```

Each city `<Link>` wraps in `<motion.div>` with stagger:
```tsx
{CITIES.map((city, idx) => (
  <motion.div
    key={city.slug}
    initial={{ opacity: 0, x: -24 }}
    whileInView={{ opacity: 1, x: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, ease: EASE_SOLEN, delay: idx * 0.12 }}
  >
    <Link ...>{/* existing city row */}</Link>
  </motion.div>
))}
```

**B — Replace inline onMouseEnter/onMouseLeave on category pills (lines 117-143):**
```tsx
// BEFORE (bad — inline handlers)
onMouseEnter={(e) => { el.style.background = "rgba(232,98,74,.18)"; ... }}
onMouseLeave={(e) => { el.style.background = "rgba(255,255,255,.05)"; ... }}

// AFTER (good — group hover with Tailwind)
// Create a wrapper style or use a custom class. Since these are on dark bg,
// use inline style for the base + transition class:
className="px-3.5 py-1.5 rounded-pill font-heading text-xs font-medium
  transition-[background,color,border-color] duration-150
  bg-white/[0.05] text-white/40 border border-white/[0.07]
  hover:bg-s-coral/[0.18] hover:text-s-coral/95 hover:border-s-coral/[0.28]"
```
Remove ALL `onMouseEnter`/`onMouseLeave` handlers. Remove all `style={{}}` from the pills.

**C — Category pills stagger:**
```tsx
<motion.div
  initial="hidden"
  whileInView="visible"
  viewport={{ once: true }}
  variants={{
    hidden: {},
    visible: { transition: { staggerChildren: 0.04 } }
  }}
  className="flex flex-wrap gap-2 mt-11"
>
  {CATEGORY_KEYS.map((key) => (
    <motion.div
      key={key}
      variants={{
        hidden: { opacity: 0, scale: 0.9 },
        visible: { opacity: 1, scale: 1, transition: { duration: 0.25, ease: EASE_SOLEN } }
      }}
    >
      <Link ...>{/* pill content */}</Link>
    </motion.div>
  ))}
</motion.div>
```

### Done Checklist
- [ ] City rows stagger in from left with 120ms gap
- [ ] Category pills use Tailwind hover, NO inline handlers
- [ ] Category pills stagger with scale-in on viewport
- [ ] Build passes

---

## TASK 4.2 — Partner CTA: Viewport Reveal + Stat Stagger

**File:** `components/HomePage.tsx` (lines 204-279)

### What to Change

**A — Wrap Partner CTA section in motion:**
```tsx
<motion.section
  initial={{ opacity: 0, y: 40 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, margin: "-80px" }}
  transition={{ duration: 0.5, ease: EASE_SOLEN }}
  className="py-12 px-5 md:px-6 lg:px-10 xl:px-20"
>
```

**B — Checklist items stagger (lines 233-248):**
```tsx
{[...].map((item, idx) => (
  <motion.li
    key={item}
    initial={{ opacity: 0, x: -12 }}
    whileInView={{ opacity: 1, x: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.3, ease: EASE_SOLEN, delay: 0.3 + idx * 0.06 }}
    className="flex items-center gap-3 font-body"
    style={{ fontSize: "14px", color: "rgba(255,255,255,.55)" }}
  >
```

**C — Stat cards stagger (lines 260-276):**
```tsx
{[...].map((stat, idx) => (
  <motion.div
    key={stat.label}
    initial={{ opacity: 0, y: 16 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.35, ease: EASE_SOLEN, delay: 0.2 + idx * 0.1 }}
    className="rounded-[14px] px-5 py-4"
    style={{ ... }}
  >
```

### Done Checklist
- [ ] Partner CTA slides up on viewport entry
- [ ] 3 checklist items stagger with 60ms gap
- [ ] 3 stat cards stagger with 100ms gap
- [ ] All animations fire once
- [ ] Build passes

---

# ═════════════════════════════════════════════
#  PHASE 5: CSS UTILITIES
#  Impact: ★★☆☆☆ (system-level)
# ═════════════════════════════════════════════

## TASK 5.1 — Add Scroll-Fade Utility

**File:** `app/globals.css`

### What to Add

At the end of `@layer utilities { ... }`, add:

```css
/* ── Scroll-fade: right-edge gradient for horizontal carousels ── */
.scroll-fade-right {
  mask-image: linear-gradient(to right, black 85%, transparent 100%);
  -webkit-mask-image: linear-gradient(to right, black 85%, transparent 100%);
}
```

This can be applied to any horizontal scroll container as an alternative to the absolute-positioned gradient div in Task 3.1.

### Done Checklist
- [ ] `.scroll-fade-right` class exists in globals.css
- [ ] Build passes

---

# ═════════════════════════════════════════════
#  PHASE 6: BUG FIXES
#  Impact: ★★☆☆☆ (correctness)
# ═════════════════════════════════════════════

## TASK 6.1 — GuidedSearch: Fix Step Indicator Color Strings

**File:** `components/ui/GuidedSearch.tsx`

### What to Change

Lines 495-497 use raw CSS class names inside inline `style={{}}` — this doesn't work.

```tsx
// BEFORE (BROKEN — "s-ink" is not a valid CSS color)
style={{
  background: isActive ? "s-ink" : isCompleted ? "s-coral" : "s-bg-sunken",
  color: isActive ? "#FFFFFF" : isCompleted ? "#FFFFFF" : "s-ink/60",
}}

// AFTER (FIXED — use Tailwind classes)
className={cn(
  "rounded-pill font-body font-medium text-[12px] transition-all duration-150",
  "px-3 py-1",
  isActive
    ? "bg-s-ink text-white"
    : isCompleted
    ? "bg-s-coral text-white"
    : "bg-s-bg-sunken text-s-ink/60"
)}
```

Remove the `style={{}}` prop for background/color and replace with `className` using `cn()` helper.

Also fix the icon/indicator text references at lines 524 and 556:
```tsx
// BEFORE (BROKEN)
style={{ color: "s-ink/60" }}

// AFTER
className="text-[11px] font-heading font-bold uppercase tracking-[.07em] text-s-ink/60"
```

And at line 697:
```tsx
// BEFORE (BROKEN)
style={{ width: 40, height: 40, borderRadius: 12, background: "s-bg-base" }}

// AFTER
className="shrink-0 flex items-center justify-center w-10 h-10 rounded-[12px] bg-s-bg-base"
```

And at line 712:
```tsx
// BEFORE (BROKEN)
style={{ fontFamily: "var(--font-body)", ... color: "s-ink/60", ... }}

// AFTER
className="font-body text-[13px] font-normal text-s-ink/60 whitespace-nowrap shrink-0"
```

And at line 716:
```tsx
// BEFORE
style={{ color: "s-sand", flexShrink: 0 }}

// AFTER
className="text-s-sand shrink-0"
```

### Done Checklist
- [ ] No raw string "s-ink", "s-coral", "s-bg-sunken", "s-sand" used inside `style={{}}`
- [ ] All color references use Tailwind class names via `className`
- [ ] Step indicator pills visually show: black (active), coral (completed), grey (upcoming)
- [ ] Build passes

---

# ═════════════════════════════════════════════
#  VERIFICATION CHECKLIST (run after all tasks)
# ═════════════════════════════════════════════

```bash
# 1. Type check
npx tsc --noEmit

# 2. Build
npm run build

# 3. Visual verification (dev server)
npm run dev
# → Navigate to http://localhost:3000
# → Scroll down slowly: verify stagger animations fire once
# → Scroll up/down on mobile: verify bottom nav hides/shows
# → Check hero chips: should be neutral grey, not cream
# → Check testimonials section: white background, not warm cream
# → Open GuidedSearch: step pills should show black/coral/grey correctly
```

---

# ═════════════════════════════════════════════
#  WIRING REQUIREMENTS (read before each task)
# ═════════════════════════════════════════════

Claude Code: Check these before making ANY import. Missing wiring = broken build.

## Import Map

| What | Import From | Available Since |
|---|---|---|
| `motion`, `AnimatePresence` | `"framer-motion"` | Already installed ✓ |
| `useScroll`, `useMotionValueEvent` | `"framer-motion"` | FM v10+ ✓ (we have v12) |
| `animate` (imperative) | `"framer-motion"` | FM v10+ ✓ |
| `useInView` | `"framer-motion"` | FM v5+ ✓ |
| `EASE_SOLEN`, `STAGGER_GRID`, etc. | `"@/lib/animations"` | Already exported ✓ |
| `cn()` | `"@/lib/utils"` | Uses `clsx` ✓ |
| `containerVariants`, `itemVariants` | `"@/lib/animations"` | Already exported ✓ |

## Package Verification
```
"framer-motion" is installed as "framer-motion" in package.json
```
Check: there is NO separate `"motion"` package. The import is ALWAYS `from "framer-motion"`, NEVER `from "motion"`.

## Tailwind Color Token Verification
These tokens exist in `tailwind.config.js` and are safe to use:
```
✅ bg-s-coral, text-s-coral, border-s-coral — #E8624A
✅ bg-s-ink, text-s-ink — #1A1209
✅ bg-s-sand, text-s-sand — #C9A96E
✅ bg-s-bg-base — #FAF6EF ⚠️ WARNING: this is CREAM, not white
✅ bg-s-bg-sunken — #EDE5D8
✅ bg-s-bg-raised — #FFFFFF
✅ bg-s-bg-surface — #F3EDE2
✅ shadow-elevation-1, shadow-elevation-2, shadow-elevation-3
✅ rounded-pill = 9999px
✅ rounded-btn = 99px
✅ rounded-card = 16px
✅ ease-out-strong, ease-drawer (transition timing)
```

## TypeScript Gotcha: EASE_SOLEN type
`EASE_SOLEN` is typed as `readonly [0.23, 1, 0.32, 1]`. Framer Motion's `ease` prop expects `number[]`. Use this cast when passing:
```tsx
ease: EASE_SOLEN as unknown as number[]
// OR just inline: ease: [0.23, 1, 0.32, 1]
```

---

# ═════════════════════════════════════════════
#  RISKS & GOTCHAS
# ═════════════════════════════════════════════

## RISK 1: `s-bg-base` is CREAM (#FAF6EF), not white
**Impact: Medium** · Tailwind config has `"s-bg": { base: "#FAF6EF" }`.
The design spec says ALL backgrounds should be `#FFFFFF`. If you use `bg-s-bg-base` on the homepage thinking it's white, you'll get cream.
**Mitigation:** On homepage components, use `bg-white` directly. Keep `bg-s-bg-base` for dashboard/form pages where cream is acceptable.

## RISK 2: SSR Hydration Mismatch with `initial` states
**Impact: Low** · `motion.div` with `initial={{ opacity: 0 }}` renders invisible on server. If the component renders content inside, React may warn about hydration mismatch.
**Mitigation:** Use the `<LazyMotion>` wrapper OR set `initial={false}` on components that are above-the-fold and should render immediately (e.g. hero headline — it should NOT be invisible on first paint).
**Rule:** For the hero (TASK 1.1), do NOT use `initial={{ opacity: 0 }}` if it causes layout shift. Instead use `initial={{ opacity: 0.01 }}` or wrap in `useEffect + useState` to only animate on client.

## RISK 3: Horizontal Scroll + whileInView fires wrong
**Impact: Medium** · `whileInView` detection works on VERTICAL scroll only. For horizontal scroll containers (FeaturedSalonCarousel, LastMinuteStrip), the child `motion.div` elements with `whileInView` will ALL trigger at once when the container enters viewport — they won't stagger as you scroll horizontally.
**Mitigation:** For horizontal carousels (TASK 3.1), use `variants` + `staggerChildren` on the parent container's `whileInView` instead of individual `whileInView` on each card. The parent enters viewport → stagger fires for all children → good. This is already the approach in the roadmap ✓.

## RISK 4: BottomTabBar scroll-hide conflicts with Header
**Impact: Low** · Both Header and BottomTabBar will track `scrollY`. They share no state, so no direct conflict. But on pages with very little content (e.g. empty search results), rapid scroll events can cause both to flicker.
**Mitigation:** The 10px threshold in TASK 2.2 prevents this. Also, `current > 80` guard ensures nothing happens at top of page.

## RISK 5: `motion.nav` loses CSS `fixed` stacking
**Impact: Medium** · When you wrap `<nav>` in `motion.nav`, Framer Motion applies `transform` for animation. CSS `position: fixed` + `transform` on the same element can create a new stacking context, breaking the fixed positioning on some browsers.
**Mitigation:** Apply `translateY` animation to the outer wrapper, NOT the fixed-positioned element itself. OR use `will-change: transform` + verify on Safari/iOS.

## RISK 6: Framer Motion bundle size
**Impact: Low** · Adding `motion.div` wrappers to many components increases the JS bundle. FM v12 is already tree-shakeable, so only used features ship.
**Mitigation:** Already mitigated — we import specific features, not the full library.

## RISK 7: Dark mode breakage
**Impact: Medium** · Several tasks replace inline `style={{}}` with Tailwind classes. If the new classes don't include `dark:` variants, dark mode will break for those elements.
**Mitigation:** When converting inline styles to Tailwind, ALWAYS check if the element has a `dark:` sibling in the original code. If so, add the equivalent dark variant. Example:
```tsx
// If original had: className="... dark:text-s-dm-text"
// New must include: className="text-s-ink/60 dark:text-s-dm-text/60"
```

---

# ═════════════════════════════════════════════
#  ADDITIONAL BUGS FOUND DURING AUDIT
#  (not in original roadmap — add to Phase 6)
# ═════════════════════════════════════════════

## TASK 6.2 — DiscoverCarousel: Broken Tailwind Class

**File:** `components/ui/DiscoverCarousel.tsx`

**Line 168:**
```tsx
// BROKEN — text-[s-ink/60] is invalid Tailwind (brackets expect a raw value, not a token)
<p className="text-[12px] font-body text-[s-ink/60] mt-2">

// FIXED
<p className="text-[12px] font-body text-s-ink/60 mt-2">
```

## TASK 6.3 — GuidedSearch: Two More Broken Color References

**Line 475 (X close button):**
```tsx
// BROKEN
<X size={24} style={{ color: "s-ink/60" }} aria-hidden="true" />

// FIXED
<X size={24} className="text-s-ink/60 dark:text-s-dm-text/60" aria-hidden="true" />
```

**Line 811:**
```tsx
// BROKEN
style={{ color: "s-coral" }}

// FIXED
className="text-s-coral"
```

## TASK 6.4 — BrowseByCitySection: City Row Inline Hover Handlers

**File:** `components/BrowseByCitySection.tsx` **Lines 70-71:**
```tsx
// BROKEN PATTERN — inline handlers for padding animation
onMouseEnter={(e) => { (e.currentTarget).style.paddingLeft = "20px"; }}
onMouseLeave={(e) => { (e.currentTarget).style.paddingLeft = "0px"; }}

// OPTION A — CSS group-hover (simpler but limited):
className="group ... pl-0 hover:pl-5 transition-[padding-left] duration-300 ease-out-strong"

// OPTION B — Keep inline handlers (padding animation is hard in pure CSS
// because `pl-5` applies at all breakpoints). Mark as TECH DEBT.
```
**Decision:** Keep inline handlers for city row padding — it's a complex hover interaction that doesn't translate cleanly to Tailwind. Document as known tech debt.

---

## TASK 6.5 — CRITICAL: `s-bg-base` Token Is Wrong Color

**File:** `tailwind.config.js` **Line 27:**
```js
// CURRENT — cream background (legacy)
"s-bg": { base: "#FAF6EF", surface: "#F3EDE2", raised: "#FFFFFF", sunken: "#EDE5D8" },

// THIS IS INTENTIONAL for dashboard/form pages.
// DO NOT change this token — it's used by 20+ files (dashboard, booking forms, etc.)
// Instead, homepage components should use `bg-white` directly.
```
**Scope:** NOT a bug — it's a design decision. Dashboard uses cream, homepage uses white. Claude Code must use `bg-white` on all homepage components, NOT `bg-s-bg-base`.

---

# REFERENCE: Component Architecture Map

```
HomePage.tsx
├── GuidedSearch (sheet, portal to body)
├── HomepageHero ← TASK 1.1
│   ├── AirbnbSearchBar
│   └── Category Chips
├── LastMinuteStrip ← TASK 3.2
├── FeaturedSalonCarousel (×5 categories) ← TASK 3.1
│   └── SalonHeroCard (×8 per carousel)
├── TrustStatsBanner ← TASK 1.2
├── DiscoverCarousel
├── Rebook CTA (logged-in only)
├── RecentlyViewed
├── BrowseByCitySection ← TASK 4.1
├── TestimonialCarousel ← TASK 1.3
├── Partner CTA ← TASK 4.2
└── Footer

Header.tsx ← TASK 2.1 (fixed, scroll-aware)
BottomTabBar.tsx ← TASK 2.2 (fixed, Airbnb scroll-hide)
GuidedSearch.tsx ← TASK 6.1 (bug fixes)
globals.css ← TASK 5.1 (scroll-fade utility)
```
