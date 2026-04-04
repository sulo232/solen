# R3: Animation System, Motion & Micro-Interactions

> **Scope**: 85 issues | **Files**: ~40 | **Conflicts**: None — only changes animation/transition properties
> **Agent session**: Separate Claude Code window
> **Rule**: Zone-based — heavy on homepage/discovery (Zone 1-2), minimal on booking/dashboard (Zone 3-4)

---

## Phase 3.1: Centralize Animation System in lib/animations.ts

**Goal**: Single source of truth for all easing curves, durations, and variant objects. No more copy-pasted variants.

**Steps**:
1. Read existing `lib/animations.ts`
2. Ensure these exports exist (add missing ones):

```ts
// Easing curves
export const EASE_SOLEN = [0.23, 1, 0.32, 1]; // V5 brand curve — deceleration
export const EASE_SNAPPY = [0.4, 0, 0.2, 1];   // Material-style for quick actions
export const EASE_BOUNCE = { type: "spring", stiffness: 400, damping: 25 }; // Hearts, favorites

// Durations
export const DURATION_FAST = 0.15;    // Hover/press feedback
export const DURATION_NORMAL = 0.2;   // Modals, dropdowns
export const DURATION_SMOOTH = 0.3;   // Page transitions, reveals
export const DURATION_SLOW = 0.5;     // Hero animations

// Stagger
export const STAGGER_GRID = 0.06;     // 60ms between grid children
export const STAGGER_LIST = 0.04;     // 40ms between list items

// Reusable variants
export const fadeIn = { hidden: { opacity: 0 }, visible: { opacity: 1 } };
export const slideUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };
export const scaleIn = { hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1 } };

export const popoverVariants = {
  hidden: { opacity: 0, scale: 0.96, y: 8 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: DURATION_NORMAL, ease: EASE_SNAPPY } },
  exit: { opacity: 0, scale: 0.96, y: 8, transition: { duration: DURATION_FAST } },
};

export const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: DURATION_NORMAL, ease: EASE_SOLEN } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: DURATION_FAST } },
};

export const sheetVariants = {
  hidden: { y: "100%" },
  visible: { y: 0, transition: { duration: DURATION_SMOOTH, ease: EASE_SOLEN } },
  exit: { y: "100%", transition: { duration: DURATION_NORMAL } },
};

export const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: STAGGER_GRID } },
};

export const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: DURATION_SMOOTH, ease: EASE_SOLEN } },
};
```

3. Delete duplicate `airbnbPopoverVariants` from:
   - `components/layout/Header.tsx`
   - `components/ui/AirbnbSearchBar.tsx`
   - Any other file that defines its own variant objects
4. Replace with import: `import { popoverVariants } from '@/lib/animations'`

**Verification**: `grep -rn 'airbnbPopoverVariants' components/` returns 0 results.

---

## Phase 3.2: Page Transition System

**Goal**: Smooth 200ms crossfade between ALL page navigations. No jarring snaps.

**Steps**:
1. Read `components/layout/PageTransitionWrapper.tsx` and `PageTransition.tsx`
2. Current `duration-0.2` is correct but easing needs to be EASE_SOLEN
3. Ensure `AnimatePresence mode="wait"` wraps page content
4. Transition: `initial={{ opacity: 0 }}` → `animate={{ opacity: 1 }}` → `exit={{ opacity: 0 }}`
5. Duration: 200ms (DURATION_NORMAL)
6. Easing: EASE_SOLEN

**Verification**: Navigate between homepage → category → salon → booking. Smooth fade on every transition.

---

## Phase 3.3: Grid Stagger Animations (Zone 1-2 Only)

**Goal**: Salon card grids animate in with 60ms stagger on page load. Airbnb-style.

**Files**:
1. **HomePage.tsx** — Featured salon grid: wrap in `motion.div` with `containerVariants` + each card gets `itemVariants`
2. **CategoryPage.tsx** — Salon grid (line ~584): already has stagger but uses `Math.min(i * 0.04, 0.24)` → replace with `containerVariants` + `itemVariants` from lib/animations
3. **DiscoverCarousel.tsx** — Cards stagger on load

**Implementation**:
```tsx
<motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid ...">
  {salons.map((salon) => (
    <motion.div key={salon.id} variants={itemVariants}>
      <SalonCard ... />
    </motion.div>
  ))}
</motion.div>
```

**Verification**: Load homepage. Cards fade-slide up with 60ms stagger. Feels smooth, not jarring.

---

## Phase 3.4: Modal & Bottom Sheet Timing

**Goal**: All modals enter at 200ms. All bottom sheets slide up at 300ms. Consistent timing.

**Files**:
1. **GlassModal.tsx** — Use `modalVariants` from lib/animations. Duration 200ms.
2. **BottomSheet.tsx** — Fix easing from `[0.32, 0.72, 0, 1]` to EASE_SOLEN `[0.23, 1, 0.32, 1]`. Duration 300ms.
3. **BeautyProfileEditModal.tsx** — Use `modalVariants`
4. **DeleteAccountModal.tsx** — Use `modalVariants`
5. **ProfileSetupModal.tsx** — Use `modalVariants`
6. **ReportProblemModal.tsx** — Use `modalVariants`
7. **PostFromDiscover.tsx** — Fix modal bg fade appearing after content (line ~164) → ensure backdrop animates FIRST with lower delay

**Verification**: Open/close every modal. Timing feels snappy (200ms). No flicker. Backdrop always appears before content.

---

## Phase 3.5: Micro-Interaction Polish

**Goal**: Hearts bounce, stars wiggle, success checks pop. Small details that feel alive.

**Specific animations**:

1. **Heart/Favorite toggle** (SalonCard, FeaturedSalonCarousel):
   - On fill: `scale: [1, 1.3, 1]` with spring `{ type: "spring", stiffness: 400, damping: 15 }`
   - Heart icon color transition: 200ms
   - Add `aria-pressed` state

2. **Star rating tap** (ReviewPrompt, ReviewForm):
   - On tap: quick scale `1 → 1.2 → 1` with spring on each star
   - Fill animation: left-to-right cascade (50ms delay per star)

3. **Success checkmark** (BookingSuccess, GoLiveGate):
   - Draw-in animation: SVG path `pathLength` from 0 → 1 over 400ms
   - Or use `scale: [0, 1.1, 1]` with spring

4. **Copy button feedback** (referral codes, share links):
   - Text changes from "Copy" to "Copied!" with fade
   - Icon changes from Copy to Check with scale

5. **Confetti on stamp card complete** (StampCard.tsx):
   - Fix: `stamp-new` class undefined → use Framer motion scale animation
   - Fix: confetti has no exit animation → add `exit={{ opacity: 0, scale: 0 }}`

6. **Counter animations** (TrustStatsBanner, StatCard):
   - Numbers count up from 0 to final value over 500ms
   - Use `useInView` + `useCountUp` pattern
   - StatCard.tsx `useCountUp` already exists → verify it has `prefers-reduced-motion` check

7. **Review bar fill** (ReviewBreakdown.tsx):
   - Already has `useInView` → verify bars animate from `width: 0` to `width: X%`
   - Duration: 600ms, stagger: 80ms between bars

8. **Booking progress bar** (BookingWizard.tsx):
   - Progress animates smoothly between steps
   - Step dots: active dot `w-6`, inactive `w-3`, transition with `layout` prop

**Verification**: Interact with each element. Animations feel responsive (< 300ms feedback). No jank.

---

## Phase 3.6: prefers-reduced-motion Global Disable

**Goal**: All animations respect user preference. When enabled: instant transitions, no movement.

**Steps**:
1. In `lib/animations.ts`, add:
```ts
export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
```

2. In globals.css, add:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

3. For Framer Motion: configure `MotionConfig` in layout.tsx:
```tsx
<MotionConfig reducedMotion="user">
  {children}
</MotionConfig>
```

**Verification**: Enable "Reduce motion" in OS settings. All animations instantly complete. No movement.

---

## Phase 3.7: Remove Undefined Animations

**Goal**: Zero references to animation classes that don't exist.

**Fixes**:
1. **LastMinuteCard.tsx** — `animate-coral-pulse` → define in globals.css OR replace with Framer `animate={{ scale: [1, 1.02, 1] }}` loop
2. **SalonCard.tsx** — `img-hover-zoom` → define or remove (card elevation handles hover feedback)
3. **StampCard.tsx** — `stamp-new` class → define or replace with Framer scale animation
4. **WarumSolenPage** — `animate-photo-upload` → define or replace
5. **ReviewPrompt.tsx** — `animate-[slideUp_0.3s_ease-out]` → replace with Framer `slideUp` variant

**Verification**: `grep -rn 'animate-' components/ --include="*.tsx" | grep -v 'animate-spin\|animate-pulse\|animate-shimmer\|animate-in'` — all results should map to defined keyframes.

---

## Commit Strategy

- **3.1**: `"refactor: centralize animation system in lib/animations.ts"`
- **3.2**: `"fix: smooth 200ms page crossfade transitions"`
- **3.3**: `"feat: grid stagger reveal animations (Zone 1-2)"`
- **3.4**: `"fix: standardize modal/sheet timing to 200ms/300ms"`
- **3.5**: `"feat: micro-interactions — heart bounce, star cascade, counter animate"`
- **3.6**: `"a11y: prefers-reduced-motion global disable"`
- **3.7**: `"fix: remove undefined animation classes, replace with Framer"`
