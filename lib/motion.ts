/**
 * Solen Unified Motion System
 * ────────────────────────────────────────────────────────────────────
 * Single source of truth for ALL animations across the app.
 * Import from here instead of defining variants per-component.
 *
 * Principles:
 *   1. One easing set — never mix curves
 *   2. Spring physics for interactive elements (hover, press, drag)
 *   3. Duration-based for entrance/exit (scroll reveals, page transitions)
 *   4. Stagger children via container variants, never manual delays
 */

import type { Variants, Transition } from "framer-motion";

// ── Easing Curves ──────────────────────────────────────────────────────
// cubic-bezier(0.23, 1, 0.32, 1) = the ONE curve. No more mixing.
export const EASE = {
  /** Default for all entrances, transitions, hover */
  out: [0.23, 1, 0.32, 1] as [number, number, number, number],
  /** For dramatic reveals (hero, page transition) */
  dramatic: [0.16, 1, 0.3, 1] as [number, number, number, number],
  /** For bounce-back effects (heart, toggle) */
  bounce: [0.34, 1.56, 0.64, 1] as [number, number, number, number],
  /** For smooth deceleration (marquee pause) */
  decel: [0.0, 0.0, 0.2, 1] as [number, number, number, number],
} as const;

/** @deprecated Use EASE.out instead */
export const EASE_V5 = EASE.out;

// ── Spring Configs ─────────────────────────────────────────────────────
export const SPRING = {
  /** Snappy — buttons, toggles, small interactions (120ms feel) */
  snappy: { type: "spring" as const, stiffness: 500, damping: 30, mass: 1 },
  /** Smooth — cards lifting, section reveals (250ms feel) */
  smooth: { type: "spring" as const, stiffness: 300, damping: 30, mass: 1 },
  /** Bouncy — favorites, success states (300ms feel) */
  bouncy: { type: "spring" as const, stiffness: 400, damping: 15, mass: 1 },
  /** Gentle — page-level transitions (400ms feel) */
  gentle: { type: "spring" as const, stiffness: 200, damping: 25, mass: 1 },
} as const;

// ── Duration Presets ───────────────────────────────────────────────────
export const DUR = {
  instant: 0.1,
  fast: 0.15,
  normal: 0.25,
  slow: 0.35,
  dramatic: 0.5,
  /** For stagger delay between children */
  stagger: 0.06,
  /** For stagger delay between sections */
  sectionStagger: 0.12,
} as const;

// ── Shared Transitions ────────────────────────────────────────────────
export const TRANSITION = {
  /** Default entrance — used by most variants */
  entrance: { duration: DUR.normal, ease: EASE.out } satisfies Transition,
  /** Fast interaction — hover states, toggles */
  fast: { duration: DUR.fast, ease: EASE.out } satisfies Transition,
  /** Dramatic — hero, page-level */
  dramatic: { duration: DUR.dramatic, ease: EASE.dramatic } satisfies Transition,
} as const;

// ═══════════════════════════════════════════════════════════════════════
//  ANIMATION VARIANTS
//  Use with <motion.div variants={X} initial="hidden" whileInView="visible">
// ═══════════════════════════════════════════════════════════════════════

// ── Blur Fade Up (default entrance for sections) ──────────────────────
export const blurFadeUp: Variants = {
  hidden: {
    opacity: 0,
    y: 24,
    filter: "blur(6px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: DUR.slow, ease: EASE.out },
  },
};

// ── Blur Fade (no Y, just opacity + blur) ─────────────────────────────
export const blurFade: Variants = {
  hidden: {
    opacity: 0,
    filter: "blur(6px)",
  },
  visible: {
    opacity: 1,
    filter: "blur(0px)",
    transition: { duration: DUR.normal, ease: EASE.out },
  },
};

// ── Slide Up (subtle, for cards) ──────────────────────────────────────
export const slideUp: Variants = {
  hidden: {
    opacity: 0,
    y: 12,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DUR.normal, ease: EASE.out },
  },
};

// ── Scale Fade (for modals, popups, badges) ───────────────────────────
export const scaleFade: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.92,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: DUR.normal, ease: EASE.out },
  },
};

// ── Slide In From Left (for section headings) ─────────────────────────
export const slideInLeft: Variants = {
  hidden: {
    opacity: 0,
    x: -20,
    filter: "blur(4px)",
  },
  visible: {
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
    transition: { duration: DUR.slow, ease: EASE.out },
  },
};

// ── Card Reveal (listing cards — fast, no blur) ───────────────────────
export const cardReveal: Variants = {
  hidden: {
    opacity: 0,
    y: 8,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.22, ease: EASE.out },
  },
};

// ═══════════════════════════════════════════════════════════════════════
//  STAGGER CONTAINERS
// ═══════════════════════════════════════════════════════════════════════

/** Stagger children with default 60ms gap */
export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: DUR.stagger,
      delayChildren: 0.05,
    },
  },
};

/** Stagger children with wider gap (for sections) */
export const staggerContainerWide: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: DUR.sectionStagger,
      delayChildren: 0.1,
    },
  },
};

/** Stagger children tightly (for grid items, chips) */
export const staggerContainerTight: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.03,
    },
  },
};

// ── Backward-compatible aliases ────────────────────────────────────────
/** @deprecated Use staggerContainer */
export const gridContainerVariants = staggerContainer;
/** @deprecated Use slideUp */
export const gridItemVariants = slideUp;
/** @deprecated Use blurFadeUp */
export const headingVariants = blurFadeUp;

// ═══════════════════════════════════════════════════════════════════════
//  MICRO-INTERACTION VARIANTS
//  Category icons, dropdowns, parallax effects
// ═══════════════════════════════════════════════════════════════════════

/** Category icon hover — scale effect only (no filter animation due to rendering issues) */
export const categoryIconHover: Variants = {
  rest: {
    scale: 1,
  },
  hover: {
    scale: 1.08,
    transition: { duration: DUR.fast, ease: EASE.out },
  },
};

/** Staggered dropdown reveal (for GuidedSearch suggestions) */
export const dropdownItemVariants: Variants = {
  hidden: { opacity: 0, x: -8, scale: 0.95 },
  visible: (index: number) => ({
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      duration: DUR.normal,
      ease: EASE.out,
      delay: index * DUR.stagger, // 40ms per item
    },
  }),
  exit: {
    opacity: 0,
    x: 8,
    transition: { duration: DUR.fast },
  },
};

/** Image parallax (carousel images move slower than scroll) */
export const imageParallax: Variants = {
  initial: { y: 0 },
  animate: {
    y: -12,
    transition: { duration: 0.7, ease: EASE.decel },
  },
};

// ═══════════════════════════════════════════════════════════════════════
//  HOVER / INTERACTIVE STATES
//  Use with whileHover, whileTap on motion elements
// ═══════════════════════════════════════════════════════════════════════

/** Standard card hover — subtle lift (Airbnb pattern) */
export const cardHover = {
  y: -2,
  transition: SPRING.smooth,
};

/** Standard press effect — scale down */
export const cardTap = {
  scale: 0.98,
  transition: SPRING.snappy,
};

/** Button press */
export const buttonTap = {
  scale: 0.97,
  transition: SPRING.snappy,
};

/** Heart favorite bounce */
export const heartBounce = {
  scale: [1, 1.3, 0.9, 1.1, 1],
  transition: {
    duration: 0.5,
    ease: EASE.bounce,
    times: [0, 0.15, 0.3, 0.5, 1],
  },
};

// ═══════════════════════════════════════════════════════════════════════
//  VIEWPORT SETTINGS
//  Consistent IntersectionObserver config for all scroll-triggered anims
// ═══════════════════════════════════════════════════════════════════════

/** Default: trigger when 15% visible, animate once */
export const VIEWPORT = {
  once: true,
  amount: 0.15 as const,
  margin: "0px 0px -60px 0px",
};

/** For small elements (badges, stats) — trigger when 30% visible */
export const VIEWPORT_CLOSE = {
  once: true,
  amount: 0.3 as const,
};
