"use client";

// exists-check: net-new vs app/[locale]/_components/primitives/index.ts (barrel that
// exports this module, edited alongside it), SuccessMark.tsx (a celebration component,
// not a generic entrance recipe, unrelated concern), app/[locale]/dev/motion-recipe/page.tsx
// (a throwaway /dev demo page that inlines the same numbers for owner sign-off; this file is
// the real shared module the demo's comment says doesn't exist yet), lib/motion.ts and
// lib/animations.ts (older V5 variant libraries using a DIFFERENT ease token EASE_SOLEN
// [0.23,1,0.32,1] and opacity/y-only variants, pre-date and are superseded by the
// 2026-07-09 owner-approved ENTER RECIPE for booking/primitives work; left untouched since
// other surfaces still import them). `npm run exists "enter motion"` / "butterPress" /
// "useReducedMotion" all returned 0 matches before this file was written.

/**
 * Shared enter-motion primitives, THE ENTER RECIPE (owner-approved 2026-07-09,
 * "motion approved w ur reccomended but acc make rule abt it for any new stuff").
 * Source of truth: `_design-system/MOTION.md` section "THE ENTER RECIPE, LOCKED".
 *
 * Every element entrance in Solen animates THREE properties together, never one
 * alone (opacity-only was the "raggedy" booking-flow bug this module replaces):
 *   opacity  0    -> 1
 *   scale    0.96 -> 1
 *   filter   blur(8px) -> blur(0px)
 * duration 280ms, ease `glide` cubic-bezier(0.16, 1, 0.3, 1), same token as
 * `ease-glide` in tailwind.config.js (transitionTimingFunction.glide).
 *
 * Never hand-roll `initial={{opacity:0}} animate={{opacity:1}}` per surface,
 * import from here, same discipline as `<SuccessMark>` never being rebuilt
 * per screen. `prefers-reduced-motion`: the BASE state collapses to the FINAL
 * state (nothing to animate FROM), so content never depends on motion to
 * become visible.
 */
import { useReducedMotion, type Transition, type Variants } from "motion/react";

/** Locked "glide" ease, cubic-bezier(0.16, 1, 0.3, 1), long-distance smooth, no overshoot. */
export const GLIDE_EASE = [0.16, 1, 0.3, 1] as const;

/** Locked enter duration, 280ms (owner pick, Demo 7, 2026-07-26: 280ms with blur kept). */
export const ENTER_DURATION = 0.28;

const enterTransition: Transition = { duration: ENTER_DURATION, ease: GLIDE_EASE };

/** The locked recipe as plain from/to objects, opacity + scale + blur together. */
export const ENTER_RECIPE = {
  initial: { opacity: 0, scale: 0.96, filter: "blur(8px)" },
  animate: { opacity: 1, scale: 1, filter: "blur(0px)" },
  transition: enterTransition,
} as const;

/**
 * useEnterMotion, spread onto a single `<motion.*>` element:
 *   <motion.div {...useEnterMotion()}>...</motion.div>
 * `delay` staggers a handful of siblings without a full container/item split.
 * Respects `prefers-reduced-motion`: initial collapses to the final state, so
 * the element renders fully visible with no animated transform/blur/opacity.
 */
export function useEnterMotion(delay = 0) {
  const reduce = useReducedMotion();
  if (reduce) {
    return {
      initial: ENTER_RECIPE.animate,
      animate: ENTER_RECIPE.animate,
      transition: { duration: 0 },
    };
  }
  return {
    initial: ENTER_RECIPE.initial,
    animate: ENTER_RECIPE.animate,
    transition: delay ? { ...enterTransition, delay } : enterTransition,
  };
}

/** Variants form, for `AnimatePresence` exit-capable surfaces (sheets, step swaps). */
export const enterVariants: Variants = {
  hidden: ENTER_RECIPE.initial,
  visible: { ...ENTER_RECIPE.animate, transition: enterTransition },
};

/** ~50ms between list children (MOTION.md: "a stagger helper for lists"). */
export const STAGGER_STEP = 0.05;

/** Stagger container, pair with `enterStaggerItem` on each child; `initial="hidden" animate="visible"`. */
export const enterStaggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: STAGGER_STEP } },
};

/** Stagger child, same recipe as `enterVariants`, driven by the parent's stagger timing. */
export const enterStaggerItem: Variants = {
  hidden: ENTER_RECIPE.initial,
  visible: { ...ENTER_RECIPE.animate, transition: enterTransition },
};

/**
 * useStaggerVariants, reduced-motion-safe container/item pair for a staggered
 * list. When reduced motion is on, both variants resolve to the final state
 * with no stagger delay and no animated transform.
 */
export function useStaggerVariants(): { container: Variants; item: Variants } {
  const reduce = useReducedMotion();
  if (reduce) {
    return {
      container: { hidden: {}, visible: {} },
      item: { hidden: ENTER_RECIPE.animate, visible: ENTER_RECIPE.animate },
    };
  }
  return { container: enterStaggerContainer, item: enterStaggerItem };
}

/**
 * butterPress, the button/row micro-interaction that pairs with the enter
 * recipe (MOTION.md: "Buttons additionally get the butter transition"): bg +
 * transform on `glide` ~180ms, hover lifts 1px, press scales down per the
 * 3-tier press rule (SOURCE section 6): CTA/card 0.97, row 0.98, icon-only 0.94.
 */
export type PressTier = "cta" | "row" | "icon";

const PRESS_SCALE: Record<PressTier, string> = {
  cta: "active:scale-[0.97]",
  row: "active:scale-[0.98]",
  icon: "active:scale-[0.94]",
};

export function butterPress(tier: PressTier = "cta"): string {
  return `transition-all duration-[180ms] ease-glide hover:-translate-y-[1px] ${PRESS_SCALE[tier]}`;
}

/**
 * Step-swap tier (owner 2026-07-09: "the transition between the service and
 * to choose the stylist is kinda too much motion"). A WHOLE-SCREEN swap must
 * move LESS than a single card entering, not the same distance, so this is
 * its own gentler tier, not the ENTER RECIPE's 0.96/280ms reused. The ENTER
 * RECIPE itself (0.96 / 8px blur / 280ms) stays LOCKED and is untouched by
 * this, this tier only applies inside `useStepSwapMotion`.
 */
const STEP_SWAP_SCALE_FROM = 0.99;
const STEP_SWAP_DURATION = 0.26;
const stepSwapTransition: Transition = { duration: STEP_SWAP_DURATION, ease: GLIDE_EASE };

/**
 * useStepSwapMotion, a gentler opacity+scale tier (0.99 / 260ms / glide) for
 * an `AnimatePresence`-driven step/screen swap (`initial="enter"
 * animate="center" exit="exit"`). Blur is deliberately OMITTED, same as the
 * ENTER RECIPE would be here, for the reason below, and it is ALSO its own
 * gentler tier, not the ENTER RECIPE's 0.96/280ms: a full-screen swap moving
 * as far as a small card entering reads as "too much motion" (owner
 * 2026-07-09).
 *
 * WHY no blur here, and ONLY here: a resting `filter: blur(0px)` is a
 * non-`none` CSS filter value, and per the CSS spec a non-`none` filter on
 * an element establishes a containing block for its `position: fixed`
 * descendants. A step-swap wrapper commonly renders a step's sticky bottom
 * action bar as a `position: fixed` DOM descendant (BookingWizard does).
 * Framer Motion resets `transform` back to `transform: none` at rest
 * (verified live) but never does the same for `filter`, so keeping blur in
 * the recipe here would silently detach every sticky bar from the
 * viewport. Scale collapses safely, blur does not, so opacity+scale alone
 * carries the recipe at this one level. This is the single source of truth
 * for that exception, do not re-derive it per surface.
 *
 * Respects `prefers-reduced-motion`: all three states (`enter`, `center`,
 * `exit`) collapse to the same final state (opacity 1, scale 1) with
 * `duration: 0`, so a reduced-motion user never sees the animated
 * opacity/scale swap.
 */
export function useStepSwapMotion(): { variants: Variants; transition: Transition } {
  const reduce = useReducedMotion();
  const finalState = { opacity: ENTER_RECIPE.animate.opacity, scale: ENTER_RECIPE.animate.scale };
  const initialState = { opacity: ENTER_RECIPE.initial.opacity, scale: STEP_SWAP_SCALE_FROM };

  if (reduce) {
    return {
      variants: { enter: finalState, center: finalState, exit: finalState },
      transition: { duration: 0 },
    };
  }
  return {
    variants: { enter: initialState, center: finalState, exit: initialState },
    transition: stepSwapTransition,
  };
}
