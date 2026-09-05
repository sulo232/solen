"use client";

// exists-check: net-new file. `npm run exists press-motion` -> 0 hits this session. No pointer-
// tracked tilt wrapper exists anywhere in app/[locale]/_components (grepped "tilt" before
// writing this, 0 component hits besides the unrelated BentoCard "tilt" prop cited in
// motion.ts's own header comment, a different, already-shipped drift effect on a different
// component family, not reused or touched here).
//
// Grounded-in: app/[locale]/_components/homepage/SalonCard.tsx (the real card this wraps,
// unmodified, imported as a child) and app/[locale]/_components/primitives/motion.ts
// (SPRING_GENTLE, the one locked non-gesture spring preset this file reuses for the return-to-
// flat motion, rather than inventing new stiffness/damping numbers).
//
// Depicts: the salon card itself -> app/[locale]/_components/homepage/SalonCard.tsx (real,
//   unmodified, real seeded photo/name/price/rating passed in from the page)
// Depicts: the pointer-tracked tilt -> NET-NEW: this direction's own idea (the brief's Direction
//   C), not an effect any real card carries today
//
// Direction: while a pointer is down and moving over the card, it tilts up to 1.5 degrees
// toward the touch point (a physical, "you are pressing a real object" cue). No external
// reference measures this specific effect (neither airbnb--motion.md nor 21st-dev--motion-kit.md
// captured a tilt-on-press card), so the cap (1.5deg) is the value stated in the brief itself,
// not invented here. The return-to-flat spring on release/leave uses SPRING_GENTLE
// (motion.ts, LOCKFILE's own "Return home / any default UI spring" row), not a new spring value.

import * as React from "react";
import { motion, useMotionValue, animate, useReducedMotion } from "motion/react";
import { SPRING_GENTLE } from "@/app/[locale]/_components/primitives";

const MAX_TILT_DEG = 1.5;

export function TiltCard({ children }: { children: React.ReactNode }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const reduce = useReducedMotion();

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (reduce || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const px = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const py = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));
    rotateY.set((px - 0.5) * 2 * MAX_TILT_DEG);
    rotateX.set(-(py - 0.5) * 2 * MAX_TILT_DEG);
  }

  function reset() {
    animate(rotateX, 0, SPRING_GENTLE);
    animate(rotateY, 0, SPRING_GENTLE);
  }

  return (
    <div style={{ perspective: 800 }}>
      <motion.div
        ref={ref}
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerMove}
        onPointerUp={reset}
        onPointerLeave={reset}
        style={{ rotateX, rotateY }}
      >
        {children}
      </motion.div>
    </div>
  );
}
