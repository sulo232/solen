# Roadmap: Micro-Animations & Accessibility

> **Claude Code Instance**: CC-2 (Animations + A11y)
> **Scope**: Implement the 12 highest-impact micro-animations mandated by UI_RULES.md but missing from the codebase, plus 5 accessibility improvements.
> **Safe to run in parallel with**: CC-3 (SEO/i18n), CC-4 (Mobile/Map). Keep away from CC-1's salon page files until CC-1 finishes.

---

## Pre-Flight: What Already Exists (DO NOT DUPLICATE)
Before writing ANY code, verify these already exist:
- ✅ `prefers-reduced-motion` in `globals.css` (lines 651-659) — already implemented
- ✅ `img-hover-zoom` CSS class in `globals.css` (line 517-526) — already scales images 1.03x
- ✅ `img-hover-zoom` applied to `SalonCard.tsx` (lines 118, 168) — already on cards
- ✅ `layoutId` on CategoryStickyRow tab underline — already animates
- ✅ `focus-visible` rings in `globals.css` — already added
- ❌ `layoutId` on SalonTabBar — MISSING (tab underline jumps, doesn't slide)
- ❌ Skip-to-content link — MISSING
- ❌ Stagger on card grids — MISSING
- ❌ Toast slide-in animation — MISSING
- ❌ Review bar fill animation — MISSING
- ❌ Empty state entrance animation — MISSING
- ❌ Search autocomplete height animation — MISSING

---

## Breakage Risk Assessment

| Phase | Risk Level | Could Break | How to Prevent |
|---|---|---|---|
| Phase 1 | 🟢 SAFE | Nothing — CSS only, additive | — |
| Phase 2 | 🟡 MEDIUM | SalonTabBar layout if layoutId conflicts | Use unique layoutId string "salon-tab-indicator" |
| Phase 3 | 🟡 MEDIUM | Category page rendering if motion wrapper has key issues | Test with empty grid (0 results) |
| Phase 4 | 🟢 SAFE | Nothing — additive wrapper | — |
| Phase 5 | 🟢 SAFE | Nothing — additive to ReviewBreakdown | — |
| Phase 6 | 🟢 SAFE | Nothing — additive wrapper on EmptyState | — |
| Phase 7 | 🟢 SAFE | Nothing — additive, layout.tsx change is minimal | — |
| Phase 8 | 🟢 SAFE | Nothing — ARIA attributes only | — |

---

## 🤖 CLAUDE CODE PHASES

### Phase 0: Pre-Flight Scan
1. Read `_rules/UI_RULES.md` — ALL of it. Sections 4, 19, 21 are critical for all phases.
2. Read `_rules/LESSONS_LEARNED.md` — avoid past mistakes.
3. Read `_rules/ROADMAP_RULES.md` — follow every rule.
4. Verify existing implementations listed above: `grep -n "prefers-reduced-motion\|img-hover-zoom\|layoutId\|focus-visible" app/globals.css components/salon/SalonTabBar.tsx components/layout/CategoryStickyRow.tsx`
5. Read `components/ui/Toast.tsx`, `components/ReviewBreakdown.tsx`, `components/ui/EmptyState.tsx`, `components/ui/SearchAutocomplete.tsx` — understand current implementation before modifying.

---

### Phase 1: Card Grid Stagger Animation
**Goal**: Cards appear with 60ms stagger delay instead of all at once (UI_RULES.md §4 REQUIRES this).
**Zone**: Zone 1 (homepage) + Zone 2 (category page). NEVER in Zone 3/4.

#### [MODIFY] `components/CategoryPage.tsx`
Wrap the salon card grid with framer-motion stagger:

✅ DO:
```tsx
import { motion } from "framer-motion";

const gridContainerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06, // 60ms per UI_RULES.md §4
    },
  },
};

const gridItemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.23, 1, 0.32, 1], // V5 deceleration easing
    },
  },
};

// In JSX — wrap the grid container:
<motion.div
  variants={gridContainerVariants}
  initial="hidden"
  animate="visible"
  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
>
  {salons.map((salon) => (
    <motion.div key={salon.id} variants={gridItemVariants}>
      <SalonCard salon={salon} locale={locale} />
    </motion.div>
  ))}
</motion.div>
```

❌ DON'T:
```tsx
// Don't use spring physics for grid stagger (UI_RULES.md §4: springs ONLY for icon micro-animations, heart bounce, avatar pop)
transition: { type: "spring", stiffness: 400 } // ❌ Springs banned for layout/position transitions

// Don't use duration over 500ms (UI_RULES.md §21-B: 500ms+ BANNED)
transition: { duration: 0.6 } // ❌ Too slow

// Don't add stagger to Zone 3/4 pages
// Zone 3 = booking flow, Zone 4 = dashboard → ZERO animation
```

#### [MODIFY] `components/HomePage.tsx`
Apply same stagger pattern to the FeaturedSalonCarousel grid and any salon card sections on homepage.

**IMPORTANT**: Only apply stagger to card grids. NOT to individual elements within cards (that would be excessive).

> ⚠️ **BE CAREFUL**:
> - `framer-motion` is already imported in many components — check that you don't create duplicate imports.
> - If the grid has 0 items (empty state), the stagger container must still render. Test with `salons = []`.
> - Don't apply stagger to paginated/infinite-scroll results that load AFTER initial render — only the first batch.
> - The `key` prop on motion.div MUST be unique per salon. Use `salon.id`, NOT array index.
> - **Zone restriction**: NEVER add this to `BookingCalendar.tsx`, `ProfilePage.tsx`, or any `dashboard/` component.

**Verification:**
```bash
npm run build
# Visit homepage — cards should fade up with 60ms stagger
# Visit /en/coiffeur — category grid should stagger
# Open DevTools → Rendering → check "Prefers reduced motion" → animations should be instant
```

**Git commit:** `git commit -m "feat: add 60ms stagger entrance animation to card grids (Zone 1+2)"`

---

### Phase 2: SalonTabBar Sliding Underline
**Goal**: Tab indicator slides smoothly between tabs instead of jumping.
**Zone**: Zone 2 (salon detail page).

#### [MODIFY] `components/salon/SalonTabBar.tsx`

Replace the static `border-b-2` approach with framer-motion `layoutId`:

✅ DO:
```tsx
import { motion } from "framer-motion";

// Inside the tab button render:
{tabs.map((tab) => {
  const isActive = activeTab === tab.key;
  return (
    <button
      key={tab.key}
      data-tab={tab.key}
      onClick={() => onTabClick(tab.key)}
      className={`
        relative whitespace-nowrap pb-3 text-[14px] font-heading font-semibold 
        transition-colors duration-150 snap-center
        ${isActive ? "text-[#222222]" : "text-[#6A6A6A] hover:text-[#222222]"}
      `}
    >
      {tab.label}
      {isActive && (
        <motion.div
          layoutId="salon-tab-indicator"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#222222]"
          transition={{ type: "tween", duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        />
      )}
    </button>
  );
})}
```

❌ DON'T:
```tsx
// Don't use spring for tab sliding (UI_RULES.md: springs ONLY for icon micro, heart, avatar)
transition={{ type: "spring", stiffness: 300 }} // ❌

// Don't use transition-all
className="transition-all" // ❌ Banned by §21-A

// Don't keep the old static border-b-2 approach alongside layoutId
${isActive ? "border-b-2 border-[#222222]" : "border-b-2 border-transparent"} // ❌ Remove this
```

**Key change**: Remove `border-b-2 border-[#222222]` / `border-transparent` from the className and replace with the `motion.div` layoutId approach.

> ⚠️ **BE CAREFUL**:
> - The `layoutId` string "salon-tab-indicator" must be UNIQUE across the page. Other components (ChatWindow, CategoryStickyRow) use different layoutId strings — verify no conflict.
> - `motion.div` with `layoutId` requires a shared `LayoutGroup` parent if multiple layout animations exist on same page. Test without it first — it usually works without.
> - Don't use `type: "spring"` — UI_RULES.md §4 bans springs for layout/position transitions.
> - Remove the old border-based approach entirely — don't leave dead styling.

**Verification:**
```bash
npm run build
# Visit any salon page → click between tabs → underline should slide smoothly
# Test with 2 tabs, 5 tabs, scrollable tabs on mobile
```

**Git commit:** `git commit -m "feat: add sliding tab indicator animation to SalonTabBar"`

---

### Phase 3: Toast Slide-In Animation
**Goal**: Toast notifications slide up from bottom instead of appearing instantly.
**Zone**: Toast is global (z-toast = 70), animation always allowed.

#### [MODIFY] `components/ui/Toast.tsx`

✅ DO:
```tsx
import { motion, AnimatePresence } from "framer-motion";

// Wrap toast content in AnimatePresence + motion.div:
<AnimatePresence>
  {isVisible && (
    <motion.div
      initial={{ opacity: 0, y: 80 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40 }}
      transition={{
        enter: { duration: 0.3, ease: [0.32, 0.72, 0, 1] },  // iOS drawer curve
        exit: { duration: 0.2, ease: [0.23, 1, 0.32, 1] },    // Fast ease-out
      }}
      className="..." // Keep existing className
    >
      {/* toast content */}
    </motion.div>
  )}
</AnimatePresence>
```

❌ DON'T:
```tsx
// Don't use duration over 300ms for enter (§21-B: bottom sheet enter = 300ms)
transition={{ duration: 0.5 }} // ❌ Too slow, banned

// Don't use ease-in for any interactive element (§21-B: BANNED)
transition={{ ease: "easeIn" }} // ❌ Feels sluggish

// Don't animate from the top — toasts come from bottom
initial={{ y: -80 }} // ❌ Wrong direction
```

> ⚠️ **BE CAREFUL**:
> - Toast might use `setTimeout` for auto-dismiss — the exit animation must complete BEFORE the DOM element is removed. Use `onExitComplete` or ensure the timer accounts for exit duration.
> - If Toast uses React Portal, `AnimatePresence` must wrap the portal content, not the portal container.
> - Don't break the existing toast event system (`solen-toast` custom event).

**Verification:**
```bash
npm run build
# Trigger a toast (e.g., copy link on salon page, or add to favorites)
# Toast should slide up smoothly from bottom
# Toast should slide down on dismiss
```

**Git commit:** `git commit -m "feat: add slide-in/out animation to Toast component"`

---

### Phase 4: ReviewBreakdown Bar Fill Animation
**Goal**: Rating bars grow from 0% to actual width when scrolled into view.
**Zone**: Zone 2 (salon profile page).

#### [MODIFY] `components/ReviewBreakdown.tsx`

✅ DO:
```tsx
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

// Inside component:
const containerRef = useRef(null);
const isInView = useInView(containerRef, { once: true, margin: "-50px" });

// For each rating bar:
<div ref={containerRef}>
  {[5, 4, 3, 2, 1].map((star, index) => (
    <div key={star} className="flex items-center gap-3">
      <span className="text-sm font-body text-s-ink w-4">{star}</span>
      <div className="flex-1 h-2 bg-s-bg-sunken rounded-pill overflow-hidden">
        <motion.div
          className="h-full bg-s-coral rounded-pill"
          initial={{ width: 0 }}
          animate={isInView ? { width: `${percentage}%` } : { width: 0 }}
          transition={{
            duration: 0.6,
            delay: index * 0.08, // 80ms stagger between bars
            ease: [0.23, 1, 0.32, 1], // V5 deceleration
          }}
        />
      </div>
      <span className="data-text text-sm text-s-ink/50 w-8">{count}</span>
    </div>
  ))}
</div>
```

❌ DON'T:
```tsx
// Don't use spring for bar fills (not a micro-icon animation)
transition={{ type: "spring" }} // ❌

// Don't trigger animation on every scroll (once: true is mandatory)
useInView(ref, { once: false }) // ❌ Re-triggers on every scroll

// Don't use 500ms+ duration
transition={{ duration: 0.8 }} // ❌ Banned
```

> ⚠️ **BE CAREFUL**:
> - `useInView` from framer-motion requires a ref on the container — not on individual bars.
> - `once: true` is critical — without it, bars re-animate every time user scrolls past.
> - If ReviewBreakdown receives `0` reviews, don't render empty bars animating to 0%.
> - This is Zone 2 — animation IS allowed here.

**Verification:**
```bash
npm run build
# Visit salon page → scroll down to reviews section
# Bars should grow from 0% to actual width with stagger
# Scroll away and back — animation should NOT replay (once: true)
```

**Git commit:** `git commit -m "feat: add scroll-triggered bar fill animation to ReviewBreakdown"`

---

### Phase 5: Empty State Entrance Animation
**Goal**: EmptyState component fades + scales in instead of appearing instantly.
**Zone**: Zone 1+2 only. Zone 3/4 = static render.

#### [MODIFY] `components/ui/EmptyState.tsx`

✅ DO:
```tsx
import { motion } from "framer-motion";

// Accept zone prop for zone-aware animation:
interface EmptyStateProps {
  // ... existing props
  zone?: 1 | 2 | 3 | 4;
}

// Wrap content:
const Wrapper = zone && zone <= 2 ? motion.div : "div";
const motionProps = zone && zone <= 2 ? {
  initial: { opacity: 0, scale: 0.97 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.25, ease: [0.23, 1, 0.32, 1] },
} : {};

return (
  <Wrapper {...motionProps} className="...">
    {/* existing content */}
  </Wrapper>
);
```

❌ DON'T:
```tsx
// Don't animate in Zone 3/4
<motion.div animate={...}> // ❌ If this appears in booking flow = Zone 3 violation

// Don't use large scale values
initial={{ scale: 0.5 }} // ❌ Too dramatic. Use 0.97 max.
```

> ⚠️ **BE CAREFUL**:
> - EmptyState is used across MANY pages including booking flow (Zone 3) and dashboard (Zone 4). The `zone` prop MUST default to a safe value. Default to `zone={1}` per UI_RULES.md §31 ("defaults to 1 only as DX convenience").
> - Verify all current usages of EmptyState — if none pass a zone prop, the default behavior should be animated (Zone 1).
> - Per UI_RULES.md Rule 31: "NEVER render glassmorphic elements in Zone 3/4" — but this is about animation, not glass, so the zone check is for animation only.

**Verification:**
```bash
npm run build
# Trigger an empty state (e.g., search for nonexistent salon)
# Empty state should scale-fade in
# Check booking flow empty states — should appear without animation
```

**Git commit:** `git commit -m "feat: add zone-aware entrance animation to EmptyState"`

---

### Phase 6: Search Autocomplete Height Animation
**Goal**: Dropdown smoothly expands instead of popping in.
**Zone**: Zone 1+2 (search is header/discovery area).

#### [MODIFY] `components/ui/SearchAutocomplete.tsx`

Wrap the dropdown suggestions container with AnimatePresence:

✅ DO:
```tsx
<AnimatePresence>
  {showDropdown && suggestions.length > 0 && (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
      className="absolute top-full left-0 right-0 mt-1 bg-white rounded-card shadow-warm-lg border border-s-ink/5 overflow-hidden z-50"
    >
      {/* suggestion items */}
    </motion.div>
  )}
</AnimatePresence>
```

❌ DON'T:
```tsx
// Don't animate height (expensive, causes reflow)
animate={{ height: "auto" }} // ❌ Use opacity + y transform instead

// Don't use slow dropdown animation (§21-B: dropdown = 150-200ms)
transition={{ duration: 0.4 }} // ❌ Too slow for dropdown
```

> ⚠️ **BE CAREFUL**:
> - SearchAutocomplete might use a different visibility pattern (display: none vs conditional render). AnimatePresence only works with conditional rendering (`{show && <Component />}`).
> - Don't break keyboard navigation (arrow keys, Enter to select, Escape to close).
> - Dropdown must still have correct z-index to appear above other content.

**Verification:**
```bash
npm run build
# Type in search bar — dropdown should smoothly appear
# Clear search — dropdown should smoothly disappear
# Arrow keys should still navigate suggestions
```

**Git commit:** `git commit -m "feat: add smooth entrance animation to search autocomplete dropdown"`

---

### Phase 7: Skip-to-Content Link (Accessibility)
**Goal**: Screen reader users can skip navigation and jump to main content. WCAG 2.1 AA requirement.

#### [MODIFY] `app/[locale]/layout.tsx`

Add skip link as the FIRST child of `<body>`:

✅ DO:
```tsx
<body>
  <a
    href="#main-content"
    className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-s-coral focus:text-white focus:rounded-btn focus:shadow-warm-lg focus:text-sm focus:font-medium"
  >
    Skip to content
  </a>
  {/* Header, navigation, etc. */}
  <main id="main-content">
    {children}
  </main>
</body>
```

❌ DON'T:
```tsx
// Don't put skip link AFTER the header — it must be first focusable element
<Header />
<a href="#main-content">Skip</a> // ❌ Defeats the purpose

// Don't make it permanently visible — it's hidden until focused
className="fixed top-4 left-4" // ❌ Always visible, clutters UI
```

**IMPORTANT**: Verify that `<main>` exists with `id="main-content"` or add it. Check if layout.tsx already wraps children in a `<main>` tag.

> ⚠️ **BE CAREFUL**:
> - Per LESSONS_LEARNED.md Rule 27: pages must NOT duplicate layout elements. The `<main>` tag should be in layout.tsx ONCE, not in individual pages.
> - Check if individual pages already render `<main>` — if so, remove those to avoid nested `<main>` tags.
> - The skip link text should be in English (universal) or use locale-aware text. English is acceptable for screen reader links.

**Verification:**
```bash
npm run build
# Tab into the page — first Tab press should reveal "Skip to content" link
# Press Enter — page should scroll/focus to main content area
# Link should disappear when not focused
```

**Git commit:** `git commit -m "a11y: add skip-to-content link for keyboard/screen reader navigation"`

---

### Phase 8: ARIA Live Regions for Dynamic Content
**Goal**: Screen readers announce dynamic content changes (booking slot count, search results count).

#### [MODIFY] `components/BookingCalendar.tsx`
Add `aria-live="polite"` to the time slot section:

```tsx
<div aria-live="polite" aria-atomic="true">
  {availableSlots.length} {t("slotsAvailable")}
</div>
```

**Zone 3 — ZERO visual changes**, only semantic ARIA attributes.

#### [MODIFY] `components/ui/SearchAutocomplete.tsx`
Add screen reader result count announcement:

```tsx
<div className="sr-only" aria-live="polite" aria-atomic="true">
  {suggestions.length} {suggestions.length === 1 ? "result" : "results"} found
</div>
```

#### [MODIFY] `components/ReviewForm.tsx`
Add `role="radiogroup"` and `aria-label` to star rating:

```tsx
<div
  role="radiogroup"
  aria-label={t("rating")}
  className="flex gap-1"
  onMouseLeave={() => setHoverRating(0)}
>
  {[1, 2, 3, 4, 5].map((star) => (
    <button
      key={star}
      role="radio"
      aria-checked={rating === star}
      aria-label={`${star} ${star === 1 ? "star" : "stars"}`}
      // ... existing props
    >
```

> ⚠️ **BE CAREFUL**:
> - `aria-live="assertive"` interrupts the user — ALWAYS use `"polite"` for non-critical updates.
> - `aria-atomic="true"` means the ENTIRE region is re-announced on change, not just the changed part. Use it for short text only.
> - Don't add `aria-live` to large containers — screen readers will read the entire container on every change.
> - BookingCalendar is Zone 3 — add ONLY ARIA attributes, NO visual/animation changes.

**Verification:**
```bash
npm run build
# Test with screen reader (VoiceOver / NVDA):
# - Navigate to booking → select date → screen reader should announce slot count
# - Type in search → screen reader should announce result count
# - Open review form → star rating should be navigable as radio group
```

**Git commit:** `git commit -m "a11y: add ARIA live regions, radiogroup on star rating, screen reader announcements"`

---

### Phase 9: Update CLAUDE.md + Final Verification

#### [MODIFY] `CLAUDE.md`
Document new animation patterns:
- Stagger grid pattern (variants + 60ms delay)
- Tab sliding underline pattern (layoutId)
- Toast animation pattern (slide up/down)
- Zone-aware EmptyState animation

#### Full Smoke Test:
```bash
# 1. Build
npm run build

# 2. Type check
npx tsc --noEmit 2>&1 | head -20

# 3. Banned token check
grep -Ern "transition-all|shadow-sm[^a]|shadow-md|shadow-lg[^a]|rounded-lg[^a]" components/salon/SalonTabBar.tsx components/ui/Toast.tsx components/ReviewBreakdown.tsx components/ui/EmptyState.tsx components/ui/SearchAutocomplete.tsx 2>/dev/null | grep -v "shadow-warm\|shadow-card\|rounded-card\|rounded-pill\|//"
# Must return 0

# 4. Zone violation check — no animation in Zone 3/4
grep -rn "motion\.\|animate=\|framer-motion" components/booking/ app/[locale]/dashboard/ --include="*.tsx" 2>/dev/null | grep -v "BookingWizard\|//\|AnimatePresence" | head -10
# Inspect any results carefully — motion should only be for AnimatePresence page transitions

# 5. Accessibility check
grep -rn "skip-to-content\|#main-content\|aria-live\|role=\"radiogroup\"" app/[locale]/layout.tsx components/BookingCalendar.tsx components/ReviewForm.tsx components/ui/SearchAutocomplete.tsx
# Should return matches for all added attributes

# 6. prefers-reduced-motion still works
grep -n "prefers-reduced-motion" app/globals.css
# Should still exist at line 652
```

> ⚠️ **BE CAREFUL**:
> - A feature is NOT complete until ALL checks pass.
> - Stagger animations MUST be disabled by the existing `prefers-reduced-motion` CSS (already global — verify it covers framer-motion by testing).
> - framer-motion respects `prefers-reduced-motion` by default in v11+ — but verify your version.

**Git commit:** `git commit -m "docs: update CLAUDE.md with animation patterns and a11y improvements"`

---

## 🧑 MANUAL PHASES

### Manual A: Screen Reader Testing
1. Enable VoiceOver (Mac) or NVDA (Windows)
2. Navigate to homepage → Tab → verify "Skip to content" link appears
3. Navigate to salon page → scroll to reviews → verify bar animations don't re-trigger
4. Navigate to booking flow → select date → verify slot count is announced

---

## Dependency Ordering

| Step | Type | What | Depends On |
|---|---|---|---|
| Phase 0 | 🤖 | Pre-flight scan | Nothing |
| Phase 1 | 🤖 | Card grid stagger | Nothing |
| Phase 2 | 🤖 | SalonTabBar sliding underline | Nothing |
| Phase 3 | 🤖 | Toast slide-in | Nothing |
| Phase 4 | 🤖 | ReviewBreakdown bar animation | Nothing |
| Phase 5 | 🤖 | EmptyState entrance animation | Nothing |
| Phase 6 | 🤖 | Search autocomplete animation | Nothing |
| Phase 7 | 🤖 | Skip-to-content link | Nothing |
| Phase 8 | 🤖 | ARIA live regions | Nothing |
| Phase 9 | 🤖 | CLAUDE.md + smoke test | All above |
| Manual A | 🧑 | Screen reader testing | Phase 7+8 |
