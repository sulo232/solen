"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type Variants,
} from "motion/react";
import { Section, SectionFrame } from "./SectionHeader";

/**
 * HeroDuo — V3-D103 (2026-05-23): design-taste-frontend polish pass.
 *
 * Original V3-D99 + V3-D100 in `_backup/V3-D103-pre-taste-<ts>/` if revert needed.
 *
 * What this pass adds:
 *   1. **Magnetic cursor follow** on the oversized mark — letter translates
 *      slightly toward the cursor with Framer spring physics (skill rule:
 *      "Magnetic Micro-physics via useMotionValue / useSpring, NEVER React
 *      useState for hover").
 *   2. **Tactile press feedback** — `whileTap` scales card to 0.97 (skill
 *      rule: "tactile feedback on :active for physical-push feel").
 *   3. **Card hover lift** — subtle -translate-y-1 + shadow bloom with
 *      premium spring (`stiffness: 200, damping: 22`).
 *   4. **Mount animation** — staggered fade-up so both cards arrive together
 *      with a faint waterfall (skill rule: "staggered orchestration via
 *      Framer parent variants + staggerChildren").
 *
 * Two cards side-by-side on mobile (each ~44vw). Pattern matches IMG_4285
 * (Hims homepage 2-card grid above the fold).
 */

interface DuoCard {
  href: string;
  /** Big mark on the right side — single character (Bricolage display). */
  mark: string;
  /** Top-left two-line title. */
  title: string;
  /** Bottom-left CTA label. */
  cta: string;
  /** Card bg color. */
  bg: string;
  /** Text + mark color. */
  ink: string;
  /** CTA pill bg. */
  pillBg: string;
  /** CTA pill text. */
  pillInk: string;
}

const DUO: [DuoCard, DuoCard] = [
  // V3-D100: 5-stripe palette pairings. Card 1 = navy + cream, card 2 = cream + navy.
  {
    href: "/de/search?availability=heute",
    mark: "H",
    title: "Heute noch\nfrei.",
    cta: "Slots heute",
    bg: "#142F4A",
    ink: "#E9DFC8",
    pillBg: "#E58840",
    pillInk: "#FFFFFF",
  },
  {
    href: "/de/search?sort=top-rated",
    mark: "T",
    title: "Top bewertet\nin der Schweiz.",
    cta: "4.8★ Salons",
    bg: "#E9DFC8",
    ink: "#E58840",
    pillBg: "#1A1A1A",
    pillInk: "#FFFFFF",
  },
];

/** Container stagger — parent variants enable child stagger on mount. */
const containerVariants: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 110, damping: 18 },
  },
};

/**
 * Single magnetic card.
 *
 * MOTION_INTENSITY-6 implementation: cursor tracks card-local coords, the
 * oversized mark translates ~10-14 px toward cursor with a spring lag.
 * Springs keep the mark's motion organic (no linear ease).
 */
function MagneticDuoCard({ card }: { card: DuoCard }) {
  // Cursor position 0..1 within the card box. Reset to 0.5,0.5 on leave.
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  // Map 0..1 → -14..14 px. Letter pulls toward cursor.
  const rawX = useTransform(mouseX, [0, 1], [-14, 14]);
  const rawY = useTransform(mouseY, [0, 1], [-10, 10]);

  // Spring lag — premium feel, no linear motion. Stiffness/damping per skill.
  const letterX = useSpring(rawX, { stiffness: 120, damping: 18, mass: 0.6 });
  const letterY = useSpring(rawY, { stiffness: 120, damping: 18, mass: 0.6 });

  const handleMouseMove = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      mouseX.set((e.clientX - rect.left) / rect.width);
      mouseY.set((e.clientY - rect.top) / rect.height);
    },
    [mouseX, mouseY],
  );

  const handleMouseLeave = React.useCallback(() => {
    mouseX.set(0.5);
    mouseY.set(0.5);
  }, [mouseX, mouseY]);

  return (
    <Link href={card.href} prefetch={false} className="block">
      <motion.div
        variants={cardVariants}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        whileHover={{ y: -4 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 200, damping: 22 }}
        className="group relative aspect-[3/4] overflow-hidden rounded-[18px] will-change-transform"
        style={{ background: card.bg }}
      >
        {/* Magnetic mark — translates toward cursor via spring */}
        <motion.span
          aria-hidden
          style={{
            color: card.ink,
            fontSize: "clamp(180px, 42vw, 240px)",
            opacity: 0.88,
            x: letterX,
            y: letterY,
          }}
          className="absolute -right-2 -bottom-2 font-display font-semibold leading-none tracking-[-0.05em]"
        >
          {card.mark}
        </motion.span>

        {/* Top-left title — z above the mark */}
        <h3
          className="relative z-10 p-4 font-display text-[18px] font-semibold leading-[1.08] tracking-[-0.015em] md:p-5 md:text-[22px]"
          style={{ color: card.ink, whiteSpace: "pre-line" }}
        >
          {card.title}
        </h3>

        {/* Bottom-left CTA pill */}
        <span
          className="absolute bottom-4 left-4 z-10 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 font-body text-[12px] font-semibold transition-transform duration-200 ease-out group-hover:translate-x-1 md:bottom-5 md:left-5"
          style={{ background: card.pillBg, color: card.pillInk }}
        >
          {card.cta}
          <ArrowRight size={12} strokeWidth={2.5} aria-hidden />
        </span>
      </motion.div>
    </Link>
  );
}

export default function HeroDuo() {
  return (
    <Section>
      <SectionFrame>
        <motion.div
          className="grid grid-cols-2 gap-3 md:gap-4"
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
        >
          {DUO.map((c) => (
            <MagneticDuoCard key={c.href} card={c} />
          ))}
        </motion.div>
      </SectionFrame>
    </Section>
  );
}
