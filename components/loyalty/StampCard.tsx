"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale } from "next-intl";
import { Check } from "lucide-react";
import { motion } from "framer-motion";
import CelebrationRing from "@/components/ui/CelebrationRing";

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
    <div className="relative rounded-[12px] border border-s-ink/[0.06] bg-white overflow-hidden"
      style={{ boxShadow: "none" }}>
      {/* Q36 celebration on reward unlock — replaces retired confetti animation */}
      <CelebrationRing kind="loyalty" active={celebrate && isComplete} maxRadius={120} />

      {/* Top: salon info */}
      <div className="p-4 pb-3">
        <p className="text-[9px] font-heading uppercase tracking-[.18em] text-s-ink/35 mb-2">
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
                  isFilled
                    ? "bg-s-coral text-white"
                    : "border-2 border-dashed border-s-ink/10",
                ].join(" ")}
                animate={isNewest ? { scale: [0.7, 1.15, 1] } : {}}
                transition={isNewest ? { type: "spring", stiffness: 400, damping: 20, duration: 0.5 } : {}}
              >
                {isFilled && <Check className="w-4 h-4" />}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Bottom: reward + progress */}
      <div className="px-4 pb-4 flex items-center justify-between gap-2">
        <p className="text-xs font-heading text-s-amber">
          {rewardText}
        </p>
        <span className="text-[10px] font-heading text-s-ink/35 whitespace-nowrap uppercase tracking-[.08em]">
          {stampsCollected}/{stampsTotal}
        </span>
      </div>

      {/* Complete overlay */}
      {isComplete && (
        <div
          className="absolute bottom-0 left-0 right-0 border-t border-s-coral/20 px-4 py-2.5 text-center"
          style={{ background: "rgba(232,98,74,.08)" }}
        >
          <p className="text-[10px] font-heading uppercase tracking-[.12em] text-s-coral">
            Belohnung freigeschaltet!
          </p>
        </div>
      )}
    </div>
  );
}
