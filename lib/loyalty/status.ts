import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Solen Status — GO-modeled frequency RANK (not points). Spec: _design-system/LOYALTY_STRUCTURE.md.
 *
 * v1 computes the tier ON-READ from completed bookings (no stored status table / monthly
 * cron yet — those are phase 2, deferred to avoid a risky migration against the drifted
 * schema). Same `getLoyaltyStatus` is used by the /rewards page (server) and /api/loyalty/status.
 *
 * Units verified against bookings schema (2026-06-14): final_price / price_paid /
 * estimated_price are CHF (the formatCurrency-direct fields); paid_amount is Rappen.
 * The value floor below is CHF.
 */

export type Tier = "base" | "gold" | "platinum";

// PLACEHOLDER thresholds (completed visits within the rolling window). Spec §8: recalibrate
// from the real booking-count distribution (Gold ~ top 20%, Platinum ~ top 5%) before launch.
export const LOYALTY = {
  // Rolling window = the decay mechanism. 12 months (NOT GO's ~3mo) on purpose: beauty
  // cadence is slow (hair every 6-8 weeks), so we ask "did you visit a few times this
  // YEAR". Status still gets lower if you stop booking, but gently + one tier at a time
  // (soft-drop in recompute_loyalty_status). Owner direction 2026-06-14.
  windowMonths: 12,
  minVisitValueChf: 25, // gross booking value floor, anti-gaming (spec §3); CHF, not Rappen
  thresholds: { gold: 3, platinum: 6 }, // completed qualifying visits in window
} as const;

export interface LoyaltyStatus {
  tier: Tier;
  visits: number; // qualifying completed visits in the window
  nextTier: Tier | null; // null when already platinum
  nextThreshold: number | null; // visits needed for nextTier
  toNext: number | null; // visits remaining to nextTier
  windowStartISO: string;
  validThrough: string | null; // loyalty_status.valid_through from the monthly snapshot; null until first recompute
}

export function tierFor(visits: number): Tier {
  if (visits >= LOYALTY.thresholds.platinum) return "platinum";
  if (visits >= LOYALTY.thresholds.gold) return "gold";
  return "base";
}

export function statusFromVisits(
  visits: number,
  windowStartISO: string,
  validThrough: string | null = null
): LoyaltyStatus {
  const tier = tierFor(visits);
  let nextTier: Tier | null = null;
  let nextThreshold: number | null = null;
  if (tier === "base") {
    nextTier = "gold";
    nextThreshold = LOYALTY.thresholds.gold;
  } else if (tier === "gold") {
    nextTier = "platinum";
    nextThreshold = LOYALTY.thresholds.platinum;
  }
  return {
    tier,
    visits,
    nextTier,
    nextThreshold,
    toNext: nextThreshold !== null ? Math.max(0, nextThreshold - visits) : null,
    windowStartISO,
    validThrough,
  };
}

interface BookingValueRow {
  final_price: number | null;
  price_paid: number | null;
  estimated_price: number | null;
  paid_amount: number | null;
  refunded_amount: number | null;
}

/**
 * Count qualifying completed visits for a user in the rolling window and derive status.
 * Qualifying (spec §3) = status 'completed' + not refunded + charged value >= CHF floor.
 * The floor uses paid_amount (Rappen, the amount actually charged by the Stripe webhook)
 * when an online charge happened; final_price is never written anywhere and price_paid is
 * the pre-discount face price, so neither is safe against a discounted-booking gaming
 * exploit. A completed booking with no online charge (paid in person) falls back to the
 * recorded price, since there the visit genuinely happened at that price.
 * Refund timestamp isn't a column, so we exclude any refunded booking (the 72h nuance
 * is a phase-2 refinement once a refunded_at exists). Never throws, degrades to Base.
 */
export async function getLoyaltyStatus(
  supabase: SupabaseClient,
  userId: string
): Promise<LoyaltyStatus> {
  const windowStart = new Date();
  windowStart.setMonth(windowStart.getMonth() - LOYALTY.windowMonths);
  const windowStartISO = windowStart.toISOString();

  const { data, error } = await supabase
    .from("bookings")
    .select("final_price, price_paid, estimated_price, paid_amount, refunded_amount")
    .eq("user_id", userId)
    .eq("status", "completed")
    .gte("starts_at", windowStartISO);

  if (error) {
    console.error("[loyalty] getLoyaltyStatus query failed:", error.message);
    return statusFromVisits(0, windowStartISO);
  }

  const rows = (data ?? []) as unknown as BookingValueRow[];
  const visits = rows.filter((b) => {
    if ((b.refunded_amount ?? 0) > 0) return false;
    // Use the amount actually charged (paid_amount, Rappen) when there was an online
    // charge. A completed booking with no online charge was paid in person, so the
    // recorded price is the only signal there and is trusted (no discount to game).
    const chargedChf =
      b.paid_amount != null && b.paid_amount > 0
        ? b.paid_amount / 100
        : (b.price_paid ?? b.estimated_price ?? 0);
    return chargedChf >= LOYALTY.minVisitValueChf;
  }).length;

  // Layer in the validity date from the monthly snapshot (loyalty_status), if present.
  // Tier/visits stay live (on-read) for fresh progress; the snapshot supplies valid_through.
  let validThrough: string | null = null;
  const { data: stored } = await supabase
    .from("loyalty_status")
    .select("valid_through")
    .eq("user_id", userId)
    .maybeSingle();
  validThrough = (stored as { valid_through: string | null } | null)?.valid_through ?? null;

  return statusFromVisits(visits, windowStartISO, validThrough);
}
