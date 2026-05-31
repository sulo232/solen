"use client";

import { Star, Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import type { DiscoveryItem } from "@/lib/types";

/**
 * CardSignals — Layer-3 booking-signal row under a discovery card (V3-D393).
 *
 * Mirrors the LOCKED SalonResultCard treatment (V3-D371/V3-D374) so the feed and search results read identically —
 * site-wide consistency over a louder one-off:
 *   • rating       → ★ #FFC32B (the one colour signal; universal rating convention) + recessive ink number
 *   • price        → "ab X CHF" in recessive ink (CardMeta recipe: text-s-ink-2 / 400) — NOT accent, matches SalonResultCard
 *   • availability → Clock (ink-2) + ink label — the V3-D371 "booking-intent" slot pill, graceful-hides
 *
 * Why there is NO "Bookable" badge: the feed is moving toward everything-bookable, so that badge would sit on 100% of
 * cards = zero information = decoration. Colour instead marks what DIFFERENTIATES bookable options (quality via ★).
 *
 * CRITICAL: every field is backend-fed and rendered ONLY when present — never faked. Until the booking/availability
 * backend populates them this renders nothing and the card stays clean B&W (the "design for the backend later" contract).
 */
export default function CardSignals({ item }: { item: DiscoveryItem }) {
  const t = useTranslations("discover");
  const hasRating = typeof item.rating === "number";
  const hasPrice = typeof item.price_min === "number";
  const hasAvailability = !!item.availability_label;

  if (!hasRating && !hasPrice && !hasAvailability) return null;

  return (
    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
      {hasRating && (
        <span className="inline-flex items-center gap-[3px] font-body text-[12px] font-normal text-s-ink-2 tabular-nums">
          <Star size={11} fill="#FFC32B" stroke="none" aria-hidden />
          {item.rating!.toFixed(1)}
        </span>
      )}
      {hasPrice && (
        <span className="font-body text-[12px] font-normal text-s-ink-2">
          {t("priceFrom", { amount: item.price_min! })}
        </span>
      )}
      {hasAvailability && (
        <span className="inline-flex items-center gap-1.5 font-body text-[12px] font-medium text-s-ink">
          <Clock size={12} strokeWidth={2} className="text-s-ink-2" aria-hidden />
          {item.availability_label}
        </span>
      )}
    </div>
  );
}
