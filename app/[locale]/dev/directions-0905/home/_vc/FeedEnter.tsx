"use client";

// exists-check: net-new vs every framer-motion wrapper already grepped in
// app/[locale]/_components/homepage/** (none of those files import "motion/react"; the feed's
// existing per-card fade lives in globals.css as a plain CSS class, "salon-card-stagger", applied
// by ScrollRow, not a framer-motion component). This is the one new client boundary this
// direction needs so the feed can animate its own mount; nothing else in this file is new.
//
// Grounded-in: app/[locale]/_components/homepage/SalonCard.tsx (the real card this wrapper animates on mount, unmodified)
//
// Depicts: feed entrance animation -> NET-NEW: no existing homepage feed component animates its own mount, this applies the locked recipe from _design-system/MOTION.md
//
// Applies the locked ENTER RECIPE (_design-system/MOTION.md: opacity 0 -> 1, scale 0.96 -> 1,
// blur(8px) -> blur(0), 280ms, cubic-bezier(0.16, 1, 0.3, 1)) once, to the whole feed as it first
// paints. A per-card stagger across twenty-plus cards was considered and dropped for this pass:
// the recipe's blur is real compositor work per element, and this surface is graded as a static
// screen (see this direction's own header comment), so one clean settle beats twenty small ones
// competing for paint time on first load.
import { motion } from "motion/react";

export function FeedEnter({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, filter: "blur(8px)" }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
