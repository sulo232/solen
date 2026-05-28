"use client";

import * as React from "react";
import { motion, type Variants } from "motion/react";

/**
 * BellIcon — V3-D167 (2026-05-26).
 *
 * Animate-on-hover notification bell. Implemented directly here instead of
 * pulling from `@animate-ui/icons-bell` via the shadcn CLI — the repo has no
 * `components.json` yet, and initializing shadcn for one icon would have
 * added eight prompts worth of config we don't need.
 *
 * Pattern matches animate-ui's API surface (`<Bell animateOnHover />`):
 *   - `animateOnHover` (default true) — uses Framer's whileHover to trigger
 *     a quick swing on the bell when the user hovers the parent
 *   - When false, the bell is a plain static SVG
 *
 * Animation: rotate keyframes [0, -15, 13, -9, 6, -3, 0] over 700ms ease-out.
 * Same "decaying swing" pattern Apple uses for shake feedback. transform-
 * origin is set at 50% 4px so the bell pivots from the top (its hanger
 * point), not the geometric center — looks like a real bell being struck.
 *
 * Inherits `currentColor` for stroke, so set color via the parent's
 * `text-…` class. Default 24px to match lucide's defaults; override via
 * the `size` prop.
 */

const ringVariants: Variants = {
  rest: { rotate: 0 },
  ring: {
    rotate: [0, -15, 13, -9, 6, -3, 0],
    transition: { duration: 0.7, ease: "easeOut" },
  },
};

interface Props {
  size?: number;
  strokeWidth?: number;
  className?: string;
  /** When true (default), bell swings on parent hover. */
  animateOnHover?: boolean;
}

export function BellIcon({
  size = 22,
  strokeWidth = 2,
  className,
  animateOnHover = true,
}: Props) {
  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
      style={{ transformOrigin: "50% 4px" }}
      initial="rest"
      // group-hover triggers via the parent button (style follows the
      // hamburger pattern — hover on the wrapper, animation on the icon).
      // whileHover on the SVG itself also works as a fallback.
      animate="rest"
      whileHover={animateOnHover ? "ring" : undefined}
      variants={ringVariants}
    >
      {/* Bell body (lucide-shaped for visual consistency with the other
          header icons until/unless we swap in a custom shape) */}
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      {/* Clapper */}
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </motion.svg>
  );
}
