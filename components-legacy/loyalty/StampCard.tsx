"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale } from "next-intl";
import { Check } from "lucide-react";
import { motion } from "motion/react";
import CelebrationRing from "@/components-legacy/ui/CelebrationRing";

interface StampCardProps {
  salonName: string;
  salonSlug: string;
  salonImageUrl?: string;
  stampsTotal: number;
  stampsCollected: number;
  rewardText: string;
  /** Fire Q36 reward-unlock celebration when this stamp event just happened.
   *  Caller toggles this true on the stamp-just-earned moment, false after. */
  celebrate?: boolean;
}

/**
 * StampCard — Q59-anatomy active loyalty card (white bg + dashed-outline empty stamps).
 *
 * Confetti animation removed 2026-05-02 per Q57 + Q59 anti-confetti rule.
 * Reward-unlock celebration now uses Q36 grammar via <CelebrationRing kind="loyalty">,
 * fired only on the actual stamp-earned event (caller controls `celebrate` prop) —
 * NEVER on page mount.
 */
export default function StampCard({
  salonName,
  salonSlug,
  salonImageUrl,
  stampsTotal,
  stampsCollected,
  rewardText,
  celebrate = false,
}: StampCardProps) {
  const locale = useLocale();
  const isComplete = stampsCollected >= stampsTotal;

  return (
    <div className="relative rounded-[12px] border border-s-border bg-white overflow-hidden"
      style={{ boxShadow: "none" }}>
      {/* Q36 celebration on reward unlock — replaces retired confetti animation */}
      <CelebrationRing kind="loyalty" active={celebrate && isComplete} maxRadius={120} />

      {/* Top: salon info */}
      <div className="p-4 pb-3">
        <p className="text-[12px] font-heading uppercase tracking-[.18em] text-s-ink/35 mb-2">
          Treuekarte
        </p>
        <Link
          href={`/${locale}/salon/${salonSlug}`}
          className="flex items-center gap-3 transition-[background-color,color] duration-150"
        >
          <div className="relative w-10 h-10 rounded-[8px] overflow-hidden bg-s-bg-sunken shrink-0">
            {salonImageUrl ? (
              <Image src={salonImageUrl} alt={salonName} fill className="object-cover" sizes="40px" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm font-heading text-s-ink/30">
                {salonName[0]}
              </div>
            )}
          </div>
          <p className="font-heading text-sm text-s-ink truncate">
            {salonName}
          </p>
        </Link>
      </div>

      {/* Middle: stamp circles */}
      <div className="px-4 pb-3">
        <div className="flex items-center gap-2 flex-wrap">
          {Array.from({ length: stampsTotal }).map((_, i) => {
            const isFilled = i < stampsCollected;
            const isNewest = i === stampsCollected - 1;
            return (
              <motion.div
                key={i}
                className={[
                  "w-9 h-9 rounded-full flex items-center justify-center",
                  // V3-D328 (Section A): bg-s-ink (retired alias → old brand green) → bg-s-success
                  // (LOCKFILE §1 universal-color: success/done = #16A34A). Filled stamp = completed
                  // step, that's a universal-color success signal, NOT a primary CTA.
                  isFilled
                    ? "bg-s-success text-white"
                    : "border-2 border-dashed border-s-border",
                ].join(" ")}
                // V3-D333 (overnight T1): framer-motion error "Only two keyframes
                // supported with spring/inertia. Trying to animate 0.7,1.15,1."
                // Old: 3-keyframe scale array with type:"spring" (incompatible).
                // New: switched to type:"tween" with cubic-bezier easeOutBack curve
                // [0.34, 1.56, 0.64, 1] — preserves the satisfying 1.15 overshoot
                // bounce on stamp add. Equivalent visual to original 3-keyframe spring
                // but uses an ease curve which IS multi-keyframe compatible.
                animate={isNewest ? { scale: [0.7, 1.15, 1] } : {}}
                transition={isNewest ? { duration: 0.5, ease: [0.34, 1.56, 0.64, 1] } : {}}
              >
                {isFilled && <Check className="w-4 h-4" />}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Bottom: reward + progress — V3-D328 (Section A): retired s-amber → s-warning */}
      <div className="px-4 pb-4 flex items-center justify-between gap-2">
        <p className="text-xs font-heading text-s-warning">
          {rewardText}
        </p>
        <span className="text-[12px] font-heading text-s-ink-2 whitespace-nowrap uppercase tracking-[.08em]">
          {stampsCollected}/{stampsTotal}
        </span>
      </div>

      {/* Complete overlay — V3-D328: retired s-coral border + green rgba bg + s-coral text → s-success tokens */}
      {isComplete && (
        <div className="absolute bottom-0 left-0 right-0 border-t border-s-success/20 bg-s-success-bg px-4 py-2.5 text-center">
          <p className="text-[12px] font-heading uppercase tracking-[.12em] text-s-success">
            Belohnung freigeschaltet.
          </p>
        </div>
      )}
    </div>
  );
}
