"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * SuccessMark , celebratory success badge (motion pass 2026-06-09; see _design-system/MOTION.md).
 *
 * A solid green disc (s-success #16A34A) + white check that springs in (spring overshoot) with a
 * ring pulse on mount. The Solen "moment of delight" for success peaks: booking confirmed (live),
 * walk-in joined, review posted, payment settled. Owner-approved look (dark-green fill + white check).
 *
 * Pair with the `.celebrate-rise` utility on the content that FOLLOWS (with staggered inline
 * animation-delay) for the full beat , e.g. the title at 0.46s, subtitle 0.56s, card 0.68s.
 *
 * prefers-reduced-motion safe: the animation only adds the entrance; the resting/base state is the
 * final visible state, so reduced-motion users see a static, drawn, visible mark.
 *
 * Keyframes + classes (.success-ring / .success-disc / .success-check / .celebrate-rise) live in
 * app/globals.css so they are shared, not re-derived per surface.
 */
export function SuccessMark({
  size = 58,
  className,
}: {
  /** Visible disc diameter in px (default 58, matching the confirmation success mark). */
  size?: number;
  className?: string;
}) {
  const icon = Math.round(size * 0.52);
  return (
    <div className={cn("relative", className)} style={{ width: size, height: size }}>
      <span className="success-ring absolute inset-0 rounded-full bg-s-success" aria-hidden />
      <span className="success-disc relative grid h-full w-full place-items-center rounded-full bg-s-success">
        <svg className="success-check" viewBox="0 0 24 24" width={icon} height={icon} aria-hidden>
          <path d="M5 13l4 4L19 7" />
        </svg>
      </span>
    </div>
  );
}
