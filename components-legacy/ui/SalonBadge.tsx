"use client";

import type { SalonCard } from "@/lib/types";

/**
 * SalonBadge , the ONE badge a card is allowed to carry: the discount pill.
 *
 * REWRITTEN 2026-08-09. This file rendered five badges in priority order and FOUR of them were
 * banned by name, on the favourites page, the city pages, the brand page and the treatments pages.
 * The "Top" one had already been switched off in place; the other three were still live:
 *
 *   "★ Top"          , banned: memory project_card_badges, "NO Top-bewertet/Neu/Beliebt badges"
 *   "Sofort buchbar" , banned: the design contract's availability row, "plain ink text, NO green
 *                      pill (owner call, do not re-add)". It was a solid #16A34A pill.
 *   "Neu"            , banned by the same line as Top. It was also #1A1209, a warm brown-black,
 *                      not the locked ink #0A0A0A.
 *   "Walk-in"        , redundant filler by copy rule 4: the row already says what the salon is,
 *                      and the owner named "· Walk-in" as an example of the thing to delete.
 *
 * What survives is what the same memory line specifies: "SalonCard discount = pale-green -X% pill".
 * Its colour was #C2410C, which is in no palette here; the pale green pair is the locked
 * s-success token (#16A34A on #E8F5E9).
 *
 * The base class also carried `uppercase`, banned since 2026-06-18, and a warm-ink shadow. The
 * shadow stays, alone, because this pill sits on top of a photograph and needs an edge to stay
 * legible; the uppercase is gone.
 *
 * mockup-ok: every change here applies a written ban or a locked value. No look was chosen.
 */

interface SalonBadgeProps {
  salon: Pick<
    SalonCard,
    | "average_rating"
    | "review_count"
    | "next_available_slot"
    | "last_minute_discount_percent"
    | "created_at"
    | "walkin_enabled"
    | "categories"
    | "is_top_pick"
  >;
  availabilityStatus?: "available" | "unavailable" | "unknown";
}

// Q23 + §5: warm-ink-tinted shadows, NOT pure black
const BADGE_SHADOW = "0 2px 4px rgba(26,18,9,0.15)";
const BADGE_SHADOW_LIGHT = "0 2px 4px rgba(26,18,9,0.10)";

const BASE_CLASSES =
  "inline-flex items-center gap-1 font-heading text-[12px] font-semibold tracking-[.01em] px-2.5 py-1 rounded-full leading-[1]";

export default function SalonBadge({ salon }: SalonBadgeProps) {
  const pct = salon.last_minute_discount_percent;
  if (!pct || pct <= 0) return null;
  return (
    <span
      className={BASE_CLASSES}
      style={{ background: "#E8F5E9", color: "#0A0A0A", boxShadow: BADGE_SHADOW_LIGHT }}
    >
      <span className="tabular-nums">&minus;{pct}%</span>
    </span>
  );
}
