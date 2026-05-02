"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale } from "next-intl";
import { Check } from "lucide-react";

/**
 * HeroStampCard — Q59 (locked 2026-05-02) closest-to-reward variant of StampCard.
 *
 * Renders at the top of /profile/stamps. Full-bleed coral-amber gradient,
 * white-on-gradient typography, big Anton headline. Distinct from the standard
 * StampCard which uses white bg + dashed-outline empty stamps.
 *
 * Used only when the user has at least one active stamp card; if multiple,
 * caller picks the one closest to reward unlock.
 *
 * Anatomy per Q59 lock:
 *   - bg: linear-gradient(135deg,#E8624A 0%,#F3A864 100%)
 *   - salon image (round, ~28px) + name
 *   - count chip "N/total" (Figtree 700 tabular)
 *   - Anton headline "<X> mehr für <reward>"
 *   - filled stamp dots in white circles with coral check
 *   - empty dots as dashed white outlines
 */
interface HeroStampCardProps {
  salonName: string;
  salonSlug: string;
  salonImageUrl?: string;
  stampsTotal: number;
  stampsCollected: number;
  rewardText: string;
}

export default function HeroStampCard({
  salonName,
  salonSlug,
  salonImageUrl,
  stampsTotal,
  stampsCollected,
  rewardText,
}: HeroStampCardProps) {
  const locale = useLocale();
  const remaining = Math.max(0, stampsTotal - stampsCollected);

  return (
    <Link
      href={`/${locale}/salon/${salonSlug}`}
      className="block rounded-[16px] p-5 sm:p-6 text-white transition-[transform] duration-150 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
      style={{ background: "linear-gradient(135deg,#E8624A 0%,#F3A864 100%)" }}
    >
      {/* Top row — salon identity + count chip */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {salonImageUrl ? (
            <Image
              src={salonImageUrl}
              alt={salonName}
              width={28}
              height={28}
              className="rounded-full object-cover shrink-0"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center shrink-0 font-heading text-[11px] uppercase">
              {salonName[0]}
            </div>
          )}
          <span className="font-body font-semibold text-[13px] truncate">{salonName}</span>
        </div>
        <span className="font-body font-bold text-[12px] tabular-nums px-2.5 py-1 rounded-full bg-white/20 shrink-0">
          {stampsCollected}/{stampsTotal}
        </span>
      </div>

      {/* Headline */}
      <h2
        className="mt-4 font-heading text-[24px] sm:text-[28px] uppercase leading-[0.98]"
        style={{ letterSpacing: "0.01em" }}
      >
        {remaining > 0 ? `${remaining} mehr für ${rewardText}` : rewardText}
      </h2>

      {/* Stamp grid */}
      <div className="mt-5 flex items-center gap-2 flex-wrap">
        {Array.from({ length: stampsTotal }).map((_, i) => {
          const isFilled = i < stampsCollected;
          return (
            <span
              key={i}
              className={[
                "w-7 h-7 rounded-full flex items-center justify-center",
                isFilled ? "bg-white" : "border-2 border-dashed border-white/55",
              ].join(" ")}
              aria-hidden
            >
              {isFilled && <Check size={14} strokeWidth={3} className="text-s-coral" />}
            </span>
          );
        })}
      </div>
    </Link>
  );
}
