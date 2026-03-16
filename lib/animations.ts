import type { Variants } from "framer-motion";

/** Stagger children with 200ms delay between each */
export const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.05,
    },
  },
};

/** Individual item that fades + slides up */
export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
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
      transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
    },
    exit: {
      x: isForward ? -40 : 40,
      opacity: 0,
      transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] },
    },
  };
};

/** Fade + scale down for removed items */
export const exitFade: Variants = {
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.3, ease: "easeIn" },
  },
};

/** Card pop-in — for grid items appearing on load */
export const cardPopIn: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.34, 1.56, 0.64, 1] },
  },
};

/** Modal slide up from bottom */
export const modalVariants: Variants = {
  hidden: { opacity: 0, y: 32, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.35, ease: [0.34, 1.2, 0.64, 1] },
  },
  exit: {
    opacity: 0,
    y: 24,
    scale: 0.97,
    transition: { duration: 0.25, ease: "easeIn" },
  },
};

/** Toast slide in from top-right */
export const toastVariants: Variants = {
  hidden: { opacity: 0, x: 48, scale: 0.96 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { duration: 0.35, ease: [0.34, 1.2, 0.64, 1] },
  },
  exit: {
    opacity: 0,
    x: 48,
    scale: 0.96,
    transition: { duration: 0.25, ease: "easeIn" },
  },
};
