import type { Variants } from "framer-motion";

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
export const DURATION_FAST = 0.15;    // Hover / press feedback
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
/** Stagger container — 60ms per child (UI_RULES.md §4: Airbnb-style) */
export const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: STAGGER_GRID,
      delayChildren: 0.04,
    },
  },
};

/** Individual grid item — fades + slides up */
export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION_SMOOTH, ease: EASE_SOLEN },
  },
};

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
    transition: { duration: DURATION_FAST },
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
    transition: { duration: DURATION_FAST },
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
/** Smooth tab slide — use with AnimatePresence mode="wait" */
export const slideSwitch = (direction: "left" | "right" | 1 | -1 = "right"): Variants => {
  const isForward = direction === "right" || direction === 1;
  return {
    initial: { x: isForward ? 40 : -40, opacity: 0 },
    animate: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.4, ease: EASE_SOLEN },
    },
    exit: {
      x: isForward ? -40 : 40,
      opacity: 0,
      transition: { duration: 0.25, ease: EASE_SOLEN },
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

/** Toast slide in from below */
export const toastVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: EASE_SOLEN },
  },
  exit: {
    opacity: 0,
    y: -6,
    transition: { duration: 0.18, ease: EASE_SOLEN },
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
