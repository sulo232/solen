// ── V5 Shared Motion Tokens ────────────────────────────────────────────────
// Single source of truth for all Framer Motion variants used across the app.
// Import from this file — never inline duplicate variant objects.

// Used by category pages — see _tasks/roadmap-v5-zone8-category-pages.md
export const EASE_V5 = [0.23, 1, 0.32, 1] as const;

/** Stagger container for salon card grids (Featured, Trending, Nearby, New) */
export const gridContainerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
} as const;

/** Individual card item inside a stagger grid */
export const gridItemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] },
  },
} as const;

/** Section heading slide-in (eyebrow + h2 block) */
export const headingVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.23, 1, 0.32, 1] },
  },
} as const;
