"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLocale } from "next-intl";
import { Check } from "lucide-react";

interface StampCardProps {
  salonName: string;
  salonSlug: string;
  salonImageUrl?: string;
  stampsTotal: number;
  stampsCollected: number;
  rewardText: string;
}

const CONFETTI_COLORS = [
  "#E8624A", "#D4870A", "#F6E05E", "#68D391", "#6BA3C8",
  "#FC8181", "#B794F4", "#F687B3", "#7BA688", "#FBD38D",
  "#9AE6B4", "#FEB2B2",
];

export default function StampCard({
  salonName,
  salonSlug,
  salonImageUrl,
  stampsTotal,
  stampsCollected,
  rewardText,
}: StampCardProps) {
  const locale = useLocale();
  const isComplete = stampsCollected >= stampsTotal;
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isComplete) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isComplete]);

  return (
    <div className="relative rounded-card border border-s-ink/5 dark:border-white/10 bg-white dark:bg-s-dm-surface shadow-card overflow-hidden">
      {/* Confetti overlay */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
          {CONFETTI_COLORS.map((color, i) => (
            <div
              key={i}
              className="confetti absolute w-2 h-2 rounded-full"
              style={{
                backgroundColor: color,
                left: `${8 + (i * 7.5) % 84}%`,
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Top: salon info */}
      <Link
        href={`/${locale}/salon/${salonSlug}`}
        className="flex items-center gap-3 p-4 pb-3 hover:bg-s-bg-surface dark:hover:bg-white/5 transition-colors"
      >
        <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-s-bg-sunken dark:bg-white/10 shrink-0">
          {salonImageUrl ? (
            <Image src={salonImageUrl} alt={salonName} fill className="object-cover" sizes="40px" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-sm font-heading text-s-ink/30 dark:text-s-dm-text/30">
              {salonName[0]}
            </div>
          )}
        </div>
        <p className="font-heading font-semibold text-sm text-s-ink dark:text-s-dm-text truncate">
          {salonName}
        </p>
      </Link>

      {/* Middle: stamp circles */}
      <div className="px-4 pb-3">
        <div className="flex items-center gap-2 flex-wrap">
          {Array.from({ length: stampsTotal }).map((_, i) => {
            const isFilled = i < stampsCollected;
            const isNewest = i === stampsCollected - 1;
            return (
              <div
                key={i}
                className={[
                  "w-9 h-9 rounded-full flex items-center justify-center transition-all",
                  isFilled
                    ? "bg-s-coral text-white"
                    : "border-2 border-dashed border-s-ink/10 dark:border-white/20",
                  isNewest ? "stamp-new" : "",
                ].join(" ")}
              >
                {isFilled && <Check className="w-4 h-4" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom: reward + progress */}
      <div className="px-4 pb-4 flex items-center justify-between gap-2">
        <p className="text-xs text-s-ink/60 dark:text-s-dm-text/60 font-body">
          {rewardText}
        </p>
        <span className="text-xs data-text font-medium text-s-ink/50 dark:text-s-dm-text/50 whitespace-nowrap">
          {stampsCollected} von {stampsTotal} Stempel
        </span>
      </div>

      {/* Complete overlay */}
      {isComplete && (
        <div className="absolute bottom-0 left-0 right-0 bg-s-coral/10 dark:bg-s-coral/20 border-t border-s-coral/20 px-4 py-2 text-center">
          <p className="text-xs font-medium text-s-coral">
            Belohnung freigeschaltet!
          </p>
        </div>
      )}
    </div>
  );
}
