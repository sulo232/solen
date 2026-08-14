"use client";

import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";

/**
 * MotionProvider — wraps motion content so Framer respects the user's
 * prefers-reduced-motion setting globally (reducedMotion="user"): transforms are
 * disabled for those users WITHOUT a render-time branch, so there's no SSR
 * hydration mismatch. Resolves Q36. Wraps /fuer-salons.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
