"use client";

import type { SalonCard } from "@/lib/types";

/**
 * SalonBadge — Q10 priority badge system + Q23 semantic-color discipline +
 * Q43 tabular numerics + §5 warm-ink shadows.
 *
 * Renders max 1 badge per card in priority order:
 *  1. "★ Top"          — rating ≥ 4.5 AND review_count ≥ 10  → coral (brand signal)
 *  2. "Sofort buchbar" — next_available_slot within 48h        → success green semantic
 *  3. "Angebot -X%"    — last_minute_discount_percent > 0      → amber accent
 *  4. "Neu"            — created_at within last 30 days        → ink (neutral)
 *  5. "Walk-in"        — walk_in_available + non-coiffeur      → ink/10 chip (subtle)
 */

interface SalonBadgeProps {
  salon: Pick<
    SalonCard,
    | "average_rating"
    | "review_count"
    | "next_available_slot"
    | "last_minute_discount_percent"
    | "created_at"
    | "walk_in_available"
    | "categories"
  >;
  availabilityStatus?: "available" | "unavailable" | "unknown";
}

// Q23 + §5: warm-ink-tinted shadows, NOT pure black
const BADGE_SHADOW = "0 2px 4px rgba(26,18,9,0.15)";
const BADGE_SHADOW_LIGHT = "0 2px 4px rgba(26,18,9,0.10)";

const BASE_CLASSES =
  "inline-flex items-center gap-1 font-heading text-[11px] uppercase tracking-[.04em] px-2.5 py-1 rounded-full leading-[1]";

export default function SalonBadge({ salon, availabilityStatus }: SalonBadgeProps) {
  const now = Date.now();
  const MS_48H = 48 * 60 * 60 * 1000;
  const MS_30D = 30 * 24 * 60 * 60 * 1000;

  // 1. ★ Top — coral (brand signal)
  if (salon.average_rating >= 4.5 && salon.review_count >= 10) {
    return (
      <span
        className={`${BASE_CLASSES} text-white`}
        style={{ background: "#E8624A", boxShadow: BADGE_SHADOW, letterSpacing: "0.01em" }}
      >
        ★ Top
      </span>
    );
  }

  // 2. Sofort buchbar — semantic success green
  const nextSlotMs = salon.next_available_slot ? new Date(salon.next_available_slot).getTime() : null;
  const isSofortBuchbar =
    availabilityStatus === "available" ||
    (nextSlotMs != null && nextSlotMs - now <= MS_48H && nextSlotMs > now);
  if (isSofortBuchbar) {
    return (
      <span
        className={`${BASE_CLASSES} text-white`}
        style={{ background: "#16A34A", boxShadow: BADGE_SHADOW, letterSpacing: "0.01em" }}
      >
        Sofort buchbar
      </span>
    );
  }

  // 3. Angebot -X% — amber accent. Q43: tabular numerics on percentage.
  if (salon.last_minute_discount_percent > 0) {
    return (
      <span
        className={`${BASE_CLASSES} text-white`}
        style={{ background: "#F3A864", boxShadow: BADGE_SHADOW, letterSpacing: "0.01em" }}
      >
        Angebot <span className="tabular-nums">−{salon.last_minute_discount_percent}%</span>
      </span>
    );
  }

  // 4. Neu — ink neutral
  if (salon.created_at && now - new Date(salon.created_at).getTime() <= MS_30D) {
    return (
      <span
        className={`${BASE_CLASSES} text-white`}
        style={{ background: "#1A1209", boxShadow: BADGE_SHADOW, letterSpacing: "0.01em" }}
      >
        Neu
      </span>
    );
  }

  // 5. Walk-in — subtle ink/10 chip on white-bg cards
  const isCoiffeur = salon.categories?.includes("coiffeur");
  if (salon.walk_in_available && !isCoiffeur) {
    return (
      <span
        className={`${BASE_CLASSES} text-s-ink`}
        style={{ background: "rgba(26,18,9,0.10)", boxShadow: BADGE_SHADOW_LIGHT, letterSpacing: "0.01em" }}
      >
        Walk-in
      </span>
    );
  }

  return null;
}
