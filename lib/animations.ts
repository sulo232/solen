import type { Variants } from "framer-motion";

/* ── Emil Kowalski easing constants ── */
const EASE_OUT_STRONG = [0.23, 1, 0.32, 1];
const EASE_IN_OUT_STRONG = [0.77, 0, 0.175, 1];

/** Stagger children with 60ms delay (UI_RULES.md §4: Airbnb-style) */
export const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.04,
    },
  },
};

/** Individual item that fades + slides up */
export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: EASE_OUT_STRONG },
  },
};

/** Smooth tab slide — use with AnimatePresence mode="wait" */
export const slideSwitch = (direction: "left" | "right" | 1 | -1 = "right"): Variants => {
  const isForward = direction === "right" || direction === 1;
  return {
    initial: { x: isForward ? 40 : -40, opacity: 0 },
    animate: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.4, ease: EASE_OUT_STRONG },
    },
    exit: {
      x: isForward ? -40 : 40,
      opacity: 0,
      transition: { duration: 0.25, ease: EASE_OUT_STRONG },
    },
  };
};

/** Fade + scale down for removed items */
export const exitFade: Variants = {
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.2, ease: EASE_OUT_STRONG },
  },
};

/** Card fade in — for grid items appearing on load */
export const cardPopIn: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: EASE_OUT_STRONG },
  },
};

/** Modal slide up from bottom */
export const modalVariants: Variants = {
  hidden: { opacity: 0, y: 32, scale: 0.97, filter: "blur(0px)" },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: { duration: 0.35, ease: [0.34, 1.2, 0.64, 1] },
  },
  exit: {
    opacity: 0,
    y: 24,
    scale: 0.97,
    filter: "blur(2px)",
    transition: { duration: 0.18, ease: EASE_OUT_STRONG },
  },
};

/** Toast slide in from below */
export const toastVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: EASE_OUT_STRONG },
  },
  exit: {
    opacity: 0,
    y: -6,
    transition: { duration: 0.18, ease: EASE_OUT_STRONG },
  },
};

/** Fade in + slide up — general purpose */
export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
};

/** Stagger container — for lists */
export const staggerContainer = {
  animate: { transition: { staggerChildren: 0.1 } },
};

/** Press animation — tactile button feedback (max 2% shrink per V3 rules) */
export const pressAnimation = {
  whileTap: { scale: 0.98 },
  transition: { duration: 0.12, ease: "easeOut" },
};

/** Exported easing constants for use in components */
export { EASE_OUT_STRONG, EASE_IN_OUT_STRONG };
