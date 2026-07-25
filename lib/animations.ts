import type { Variants } from "motion/react";
import {
  enterStaggerContainer,
  enterStaggerItem,
} from "@/app/[locale]/_components/primitives/motion";

// JOB 1 reconciliation (motion audit RANK 2b, 2026-07-25): this file is a second,
// undocumented motion vocabulary that predates both THE ENTER RECIPE and THE SPEED
// LAW (_design-system/MOTION.md). `containerVariants`/`itemVariants` below now
// RE-EXPORT the sanctioned equivalents from `primitives/motion.ts`
// (`enterStaggerContainer`/`enterStaggerItem`) instead of keeping a second set of
// numbers, because that file already had one. `slideSwitch`'s directional x-slide
// has no sanctioned equivalent (`useStepSwapMotion` there is opacity+scale only,
// no x-offset), so it keeps its own shape, retimed. Every export name below still
// works, nothing importing this file needs to change.

/* ── Easing curves ── */
/** V5 brand deceleration curve — use for all reveals and transitions */
export const EASE_SOLEN = [0.23, 1, 0.32, 1] as const;
/** Material-style — quick, snappy actions (dropdowns, popovers) */
export const EASE_SNAPPY = [0.4, 0, 0.2, 1] as const;
/** Spring config — hearts, favorites, stamps */
export const EASE_BOUNCE = { type: "spring", stiffness: 400, damping: 25 } as const;

// Legacy aliases — keep for backward compat
export const EASE_OUT_STRONG = EASE_SOLEN;
export const EASE_IN_OUT_STRONG = [0.77, 0, 0.175, 1] as const;

/* ── Durations (seconds) ── */
/**
 * THE SPEED LAW press tier (80-100ms, MOTION.md "THE SPEED LAW"): the
 * instant acknowledgement that an input registered, e.g. press-scale, tap
 * feedback. Never share this with a hover/snap transition again; a shared
 * `duration-*` silently pulling a press onto the hover timing is RANK 2's
 * root cause across the dashboard.
 */
export const DURATION_PRESS = 0.09;
/**
 * THE SPEED LAW snap tier (150ms): an in-place state flip, e.g. hover, tab
 * switch, chip select, filter change, toggle.
 */
export const DURATION_SNAP = 0.15;
/** @deprecated `DURATION_FAST` used to serve both the press AND hover/snap
 *  tiers at once (THE SPEED LAW splits them); kept as an alias to
 *  `DURATION_SNAP` so no existing import breaks. Use `DURATION_PRESS` for a
 *  press and `DURATION_SNAP` for a hover/in-place flip going forward. */
export const DURATION_FAST = DURATION_SNAP;
export const DURATION_NORMAL = 0.2;   // Modals, dropdowns
export const DURATION_SMOOTH = 0.3;   // Page transitions, reveals
export const DURATION_SLOW = 0.5;     // Hero animations

/* ── Stagger delays ── */
export const STAGGER_GRID = 0.06;     // 60ms between grid children
export const STAGGER_LIST = 0.04;     // 40ms between list items

/* ── Simple variants ── */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export const slideUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
};

/* ── Grid / list stagger ── */
/**
 * Stagger container. Re-exports the sanctioned `enterStaggerContainer`
 * (`app/[locale]/_components/primitives/motion.ts`) instead of keeping a
 * second stagger schedule; `STAGGER_GRID` stays exported below for any
 * caller that reads it directly, but no longer feeds this variant.
 */
export const containerVariants: Variants = enterStaggerContainer;

/**
 * Individual grid item. Re-exports the sanctioned `enterStaggerItem`, the
 * locked ENTER RECIPE (opacity + scale 0.96 + blur(8px), 420ms glide). The
 * old local version animated opacity+y only, no scale and no blur, the
 * exact shape `motion-recipe-gate.py` exists to block for net-new code
 * (MOTION.md "THE ENTER RECIPE, LOCKED").
 */
export const itemVariants: Variants = enterStaggerItem;

/* ── Overlays ── */
/** Dropdown / popover — search suggestions, city picker, category dropdowns */
export const popoverVariants: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 8 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: DURATION_NORMAL, ease: EASE_SNAPPY },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: 8,
    transition: { duration: DURATION_SNAP },
  },
};

/** Modal / dialog — 200ms, EASE_SOLEN */
export const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: DURATION_NORMAL, ease: EASE_SOLEN },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: DURATION_SNAP },
  },
};

/** Bottom sheet — slides up from bottom edge, 300ms */
export const sheetVariants: Variants = {
  hidden: { y: "100%" },
  visible: {
    y: 0,
    transition: { duration: DURATION_SMOOTH, ease: EASE_SOLEN },
  },
  exit: {
    y: "100%",
    transition: { duration: DURATION_NORMAL },
  },
};

/* ── Misc reusable ── */
/**
 * Directional step/tab slide: opacity + a direction-aware x offset. Retimed
 * to THE SPEED LAW reveal band (250-300ms, MOTION.md "THE SPEED LAW"),
 * matching the owner-approved step-swap tier (MOTION.md "THE ENTER RECIPE,
 * LOCKED" section, 260ms). It shipped at 400ms in, 250ms out, over the
 * ceiling for a swap that is not full-screen.
 *
 * Do NOT pair this with `AnimatePresence mode="wait"`: that serializes the
 * exiting and entering step so a user acting again mid-swap has to wait for
 * the first one to finish, which THE SPEED LAW hard rule 4 forbids. Use the
 * default `AnimatePresence` (concurrent enter/exit) or `mode="popLayout"`.
 */
export const slideSwitch = (direction: "left" | "right" | 1 | -1 = "right"): Variants => {
  const isForward = direction === "right" || direction === 1;
  return {
    initial: { x: isForward ? 40 : -40, opacity: 0 },
    animate: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.26, ease: EASE_SOLEN },
    },
    exit: {
      x: isForward ? -40 : 40,
      opacity: 0,
      transition: { duration: 0.26, ease: EASE_SOLEN },
    },
  };
};

/** Fade + scale down for removed items */
export const exitFade: Variants = {
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: DURATION_NORMAL, ease: EASE_SOLEN },
  },
};

/** Card fade in — for grid items appearing on load */
export const cardPopIn: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: EASE_SOLEN },
  },
};

/** Fade in + slide up — general purpose (object form, not Variants) */
export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
};

/** Stagger container — for lists (object form) */
export const staggerContainer = {
  animate: { transition: { staggerChildren: STAGGER_LIST } },
};

/** Press animation — tactile button feedback (max 2% shrink) */
export const pressAnimation = {
  whileTap: { scale: 0.98 },
  transition: { duration: 0.12, ease: "easeOut" },
};

/** prefers-reduced-motion check (use inside event handlers / hooks) */
export const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Toast in/out (top-anchored): slide down + fade + subtle scale. Motion-22 toast. */
export const toastVariants = {
  hidden: { opacity: 0, y: -12, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.22, ease: EASE_SOLEN } },
  exit: { opacity: 0, y: -8, scale: 0.96, transition: { duration: 0.15, ease: EASE_SOLEN } },
};
