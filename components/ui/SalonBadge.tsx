"use client";

import type { SalonCard } from "@/lib/types";

/**
 * SalonBadge — Phase 2.1
 * Renders max 1 badge per card in the following priority order:
 *  1. "★ Top"         — rating ≥ 4.5 AND review_count ≥ 10
 *  2. "Sofort buchbar" — next_available_slot within 48 h OR availability.status === 'available'
 *  3. "Angebot -X%"   — last_minute_discount_percent > 0
 *  4. "Neu"           — created_at within last 30 days
 *  5. "Walk-in"       — walk_in_available = true (barbershops only, NOT coiffeur)
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

export default function SalonBadge({ salon, availabilityStatus }: SalonBadgeProps) {
  const now = Date.now();
  const MS_48H = 48 * 60 * 60 * 1000;
  const MS_30D = 30 * 24 * 60 * 60 * 1000;

  // 1. ★ Top
  if (salon.average_rating >= 4.5 && salon.review_count >= 10) {
    return (
      <span
        className="flex items-center gap-1 font-heading font-bold text-[11px] uppercase tracking-wide text-white px-2.5 py-1 rounded-full"
        style={{ background: "#E8624A", boxShadow: "0 2px 4px rgba(0,0,0,0.15)" }}
      >
        ★ Top
      </span>
    );
  }

  // 2. Sofort buchbar
  const nextSlotMs = salon.next_available_slot ? new Date(salon.next_available_slot).getTime() : null;
  const isSofortBuchbar =
    availabilityStatus === "available" ||
    (nextSlotMs != null && nextSlotMs - now <= MS_48H && nextSlotMs > now);
  if (isSofortBuchbar) {
    return (
      <span
        className="font-heading font-bold text-[11px] uppercase tracking-wide text-white px-2.5 py-1 rounded-full"
        style={{ background: "#2E7D32", boxShadow: "0 2px 4px rgba(0,0,0,0.15)" }}
      >
        Sofort buchbar
      </span>
    );
  }

  // 3. Angebot -X%
  if (salon.last_minute_discount_percent > 0) {
    return (
      <span
        className="font-heading font-bold text-[11px] uppercase tracking-wide text-white px-2.5 py-1 rounded-full"
        style={{ background: "#D4870A", boxShadow: "0 2px 4px rgba(0,0,0,0.15)" }}
      >
        Angebot −{salon.last_minute_discount_percent}%
      </span>
    );
  }

  // 4. Neu — created within last 30 days
  if (salon.created_at && now - new Date(salon.created_at).getTime() <= MS_30D) {
    return (
      <span
        className="font-heading font-bold text-[11px] uppercase tracking-wide text-white px-2.5 py-1 rounded-full"
        style={{ background: "s-ink", boxShadow: "0 2px 4px rgba(0,0,0,0.15)" }}
      >
        Neu
      </span>
    );
  }

  // 5. Walk-in — NOT shown for coiffeur
  const isCoiffeur = salon.categories?.includes("coiffeur");
  if (salon.walk_in_available && !isCoiffeur) {
    return (
      <span
        className="font-heading font-bold text-[11px] uppercase tracking-wide text-s-ink px-2.5 py-1 rounded-full"
        style={{ background: "rgba(26,18,9,0.10)", boxShadow: "0 2px 4px rgba(0,0,0,0.10)" }}
      >
        Walk-in
      </span>
    );
  }

  return null;
}
