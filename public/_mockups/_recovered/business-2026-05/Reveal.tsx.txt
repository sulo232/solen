"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Reveal — per-element scroll-in "pop": rise + slight scale with an overshoot
 * spring, once. Easing cubic-bezier(0.175,0.885,0.32,1.275) IS Solen's
 * `spring-bounce` token. Ported from the user-approved /fuer-salons motion
 * mockup + 21st.dev card patterns (replaces the rejected blur fade).
 *
 * `delay` staggers grid items (e.g. delay={i * 0.07}).
 *
 * Renders an identical motion.div on server + client (no useReducedMotion branch
 * — that caused a hydration mismatch in reduced-motion contexts). For global
 * reduced-motion support, wrap the app in <MotionConfig reducedMotion="user">
 * (follow-up — see _design-system/QUESTIONS.md). Page-scoped to /fuer-salons.
 */
const POP = {
  hidden: { opacity: 0, y: 34, scale: 0.92 },
  show: { opacity: 1, y: 0, scale: 1 },
};

export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2, margin: "0px 0px -8% 0px" }}
      variants={POP}
      transition={{ duration: 0.62, ease: [0.175, 0.885, 0.32, 1.275], delay }}
    >
      {children}
    </motion.div>
  );
}
