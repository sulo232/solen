"use client";

// exists-check: `npm run exists useStepSwapMotion` -> 1 hit, the LOCKED base tier this file
// extends (app/[locale]/_components/primitives/motion.ts), reused for its curve tokens and
// blur-omission reasoning, not forked. `npm run exists slideStackMotion` -> 0, net-new.
//
// Direction A ("slide stack") owned motion primitive. Extends the LOCKED useStepSwapMotion
// tier rather than replacing it: same curve-by-direction split (glide enter / thud exit, THE
// CURVE RULE, motion-02, _design-system/MOTION.md), same reason for omitting blur (a resting
// non-none `filter` establishes a CSS containing block for `position:fixed` descendants, and
// every real step component nests its own `fixed bottom-0` running-summary/CTA bar inside its
// own returned tree, e.g. components-legacy/booking/ServicesStaffStep.tsx:571 , see this
// surface's BookingWizardSlideStack.tsx header for the fuller note on what that costs here).
// NEW in this file: horizontal x-displacement and direction-awareness, which the base tier
// never needed (its own scale(0.99) delta is too small to read differently forward vs back).
//
// Sources / values, all traced, nothing invented:
//   - GLIDE_EASE: imported from the real motion.ts (locked, cubic-bezier(0.16,1,0.3,1)).
//   - THUD_EASE: motion.ts declares this SAME locked bezier (cubic-bezier(0.7,0,0.84,0),
//     LOCKFILE §4) as a module-private const, not exported. Re-declared here as the identical
//     literal rather than widening an off-limits shared file's exports for one mockup.
//   - 320ms duration: the brief's own STARTING value for this direction. Checked both motion
//     spec files for a measured horizontal step-to-step slide and found none:
//     `_design-system/references/21st-dev--motion-kit.md` names this exact strategy
//     ("Step-to-step transition, strategy A: slide stack") and says outright "Not captured
//     live this session"; `_design-system/references/airbnb--motion.md` has no step-wizard
//     capture at all, only full-screen TAKEOVER reveals (400-550ms) and card staggers
//     (150-300ms). 320ms sits between Solen's own existing step-swap (260ms) and Airbnb's
//     full-screen-reveal family, and is kept exactly as directed since nothing measured
//     describes this specific interaction closely enough to justify overriding it.
//   - -24% exit distance / 0.6 exit opacity: literal values from the direction brief
//     ("moves left by 24 percent and dims to 60 percent").
//
// Conflict, stated plainly: the base tier's scale(0.99) is DROPPED here on purpose. The
// brief's own wording for this direction names only x-position and opacity, never scale, so
// adding scale back would be inventing a property this direction was not asked to carry.
import type { Transition, Variants } from "motion/react";
import { useReducedMotion } from "motion/react";
import { GLIDE_EASE } from "@/app/[locale]/_components/primitives/motion";

const THUD_EASE = [0.7, 0, 0.84, 0] as const;

export const SLIDE_DURATION_SECONDS = 0.32; // 320ms, brief starting value, see header note
export const SLIDE_EXIT_DISTANCE_PERCENT = 24; // brief-specified
export const SLIDE_EXIT_OPACITY = 0.6; // brief-specified

const enterTransition: Transition = { duration: SLIDE_DURATION_SECONDS, ease: GLIDE_EASE };
const exitTransition: Transition = { duration: SLIDE_DURATION_SECONDS, ease: THUD_EASE };

/**
 * useSlideStackMotion, direction A's drop-in replacement for useStepSwapMotion on
 * BookingWizardSlideStack.tsx. Returns `{ variants, transition }` in the exact same shape as
 * the base primitive, so the swap in the wizard copy is a one-line change. `variants.enter`
 * and `variants.exit` are dynamic (framer-motion "custom" variants): the caller passes
 * `custom={direction}` (1 = advancing, -1 = going back) on both `<AnimatePresence>` and the
 * swapped `<motion.div>`, and this hook never needs to know which way the user is moving.
 *
 * Respects `prefers-reduced-motion`: all three states collapse to the same resting position
 * (x 0%, opacity 1) with `duration: 0`, matching every other enter primitive in this project.
 */
export function useSlideStackMotion(): { variants: Variants; transition: Transition } {
  const reduce = useReducedMotion();

  if (reduce) {
    const still = { x: "0%", opacity: 1 };
    return {
      variants: { enter: still, center: still, exit: still },
      transition: { duration: 0 },
    };
  }

  return {
    variants: {
      enter: (direction: 1 | -1) => ({
        x: direction > 0 ? "100%" : "-100%",
        opacity: 1,
        transition: enterTransition,
      }),
      center: {
        x: "0%",
        opacity: 1,
        transition: enterTransition,
      },
      exit: (direction: 1 | -1) => ({
        x: direction > 0 ? `-${SLIDE_EXIT_DISTANCE_PERCENT}%` : `${SLIDE_EXIT_DISTANCE_PERCENT}%`,
        opacity: SLIDE_EXIT_OPACITY,
        transition: exitTransition,
      }),
    },
    transition: enterTransition,
  };
}
