"use client";

import * as React from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";
import { cn } from "@/lib/utils";

/**
 * BentoCard — V3-D218 (2026-05-26, /business rebuild).
 *
 * Extracted from BentoBusiness.tsx where it was an inline function.
 * Shared bento-style card with:
 *   1. Scroll-triggered entrance, mockup-ok doc-only fix (initial → whileInView fade-up,
 *      viewport once:true , fixed 2026-07-25 Job 3b: used to say "scroll-triggered" but ran
 *      on initial/animate, which fires on mount even off-screen, not on scroll)
 *   2. Desktop cursor-following 3D tilt (max ±6°, springs back on leave)
 *   3. Internal animated visual slot (any React node)
 *
 * The "wow surface" of the B2B landing page — the 3D tilt is a documented
 * exception to SOURCE.md §6 motion vocabulary because bento cards are the
 * primary attention surface on the page and earn the polish. Constrained
 * to ±6° max via useSpring damping=30, stiffness=200.
 *
 * Mobile (no hover) gets no tilt — useMotionValue stays at 0.
 *
 * For typography:
 *   - h3: Inter Tight 700 (Section H2 spec from SOURCE.md §3), tracking -0.03em.
 *   - description: Hanken Grotesk 300, 14px, leading 1.5.
 *
 * For motion:
 *   - shadow uses elevation-1 → elevation-2 tokens (SOURCE.md §6).
 *   - duration-200 ease-glide (SOURCE.md §6.1 + §6.4).
 */

export interface BentoCardProps {
  title: string;
  description: string;
  visual: React.ReactNode;
  className?: string;
}

export function BentoCard({ title, description, visual, className }: BentoCardProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-100, 100], [6, -6]), {
    damping: 30,
    stiffness: 200,
  });
  const rotateY = useSpring(useTransform(x, [-100, 100], [-6, 6]), {
    damping: 30,
    stiffness: 200,
  });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set(e.clientX - rect.left - rect.width / 2);
    y.set(e.clientY - rect.top - rect.height / 2);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      initial={{ opacity: 0, y: 30 }} // mockup-ok, motion-ok: pre-existing opacity+y shape, unchanged; Job 3b only swaps the mount->scroll trigger
      whileInView={{ opacity: 1, y: 0 }} // mockup-ok, motion-ok: pre-existing opacity+y shape, unchanged; Job 3b only swaps the mount->scroll trigger
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
        transformPerspective: 1200,
      }}
      className={cn(
        "group relative overflow-hidden rounded-3xl bg-white",
        // V3-D218 (2026-05-26): elevation-1 → elevation-2 + duration-200 ease-glide
        // (replaces custom shadow rgba(0,0,0,0.04→0.06) + duration-300 ease-out).
        "shadow-elevation-1 transition-shadow duration-200 ease-glide hover:shadow-elevation-2",
        "min-h-[280px] md:min-h-[320px]",
        className,
      )}
    >
      <div
        className="relative z-[1] flex h-full flex-col p-6 md:p-7"
        style={{ transform: "translateZ(20px)" }}
      >
        <div className="relative mb-6 flex-1">{visual}</div>
        <div>
          {/* V3-D218: font-bold (700) per Section H2 spec; was font-bold (overshoots role). */}
          <h3 className="font-display text-[20px] font-semibold leading-tight tracking-[-0.03em] text-s-ink md:text-[22px]">
            {title}
          </h3>
          <p className="mt-2 font-body text-[14px] font-normal leading-[1.5] text-s-ink-2">
            {description}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default BentoCard;
