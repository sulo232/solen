import type { SupabaseClient } from "@supabase/supabase-js";
import type { Tier } from "@/lib/loyalty/status";

/**
 * Solen Plus perk enforcement helpers. Spec: _design-system/LOYALTY_STRUCTURE.md §12.
 *
 * The MEMBER DISCOUNT is funded by option (c): Solen waives part of its OWN Stripe
 * Connect application_fee. The salon payout is unchanged; only Solen's margin moves.
 * See computeMemberDiscount for the exact Rappen identity.
 *
 * TIER SOURCE OF TRUTH (§12.2): current_user_tier(uid) computed ON-READ from bookings,
 * NOT the monthly loyalty_status snapshot. The snapshot is display/notifications only;
 * a user who hits Gold mid-month must get member pricing immediately. The client NEVER
 * sends its tier; the server always derives it here.
 */

const TIER_RANK: Record<Tier, number> = { base: 0, gold: 1, platinum: 2 };

/** True when `tier` is at or above `min` (base < gold < platinum). For min_tier gates. */
export function tierAtLeast(tier: Tier, min: Tier): boolean {
  return TIER_RANK[tier] >= TIER_RANK[min];
}

export interface TierPerks {
  tier: Tier;
  discount_pct: number; // 0.05 = 5%
  max_discount_uses_per_window: number | null; // null = unlimited
  cancel_grace_per_month: number;
  reschedule_free: boolean;
  prime_time_early_access: boolean;
  walkin_priority: boolean;
  tier_up_gift: boolean;
}

export interface MemberDiscount {
  /** Rappen the customer's charge is reduced by (== Solen's application_fee reduction). */
  discountRappen: number;
  /** Rappen the customer actually pays now (amount - discount). */
  customerChargeRappen: number;
  /** Rappen Solen keeps as commission AFTER the waiver (commission - discount, never < 0). */
  applicationFeeRappen: number;
  /** Tier that funded the discount (for bookings.applied_tier). null when no discount applied. */
  appliedTier: Tier | null;
}

/**
 * Resolve a user's tier ON-READ via the SECURITY DEFINER current_user_tier() function.
 * Pass an ADMIN client for server-trusted gating (the function is also granted to
 * authenticated, but money paths must not depend on the caller's session). Never throws:
 * degrades to 'base' so a loyalty hiccup can never block a payment.
 */
export async function getCurrentTier(
  db: SupabaseClient,
  userId: string | null | undefined
): Promise<Tier> {
  if (!userId) return "base";
  const { data, error } = await db.rpc("current_user_tier", { uid: userId });
  if (error) {
    console.error("[loyalty] getCurrentTier rpc failed:", error.message);
    return "base";
  }
  const t = String(data ?? "base");
  return t === "gold" || t === "platinum" ? (t as Tier) : "base";
}

/** Read the per-tier knob row (tier_perks). Null when the tier row is missing. */
export async function getTierPerks(
  db: SupabaseClient,
  tier: Tier
): Promise<TierPerks | null> {
  const { data, error } = await db
    .from("tier_perks")
    .select(
      "tier, discount_pct, max_discount_uses_per_window, cancel_grace_per_month, reschedule_free, prime_time_early_access, walkin_priority, tier_up_gift"
    )
    .eq("tier", tier)
    .maybeSingle();
  if (error) {
    console.error("[loyalty] getTierPerks query failed:", error.message);
    return null;
  }
  return (data as unknown as TierPerks) ?? null;
}

/**
 * PURE money calculator (no IO) for the commission-waiver member discount. All Rappen.
 *
 * Identity: salon_payout = customer_charge - application_fee. We reduce BOTH the charge
 * and the fee by the same `discount`, so the salon payout is unchanged and Solen's margin
 * absorbs the discount. Clamped so the fee never goes negative and the per-salon waiver
 * cap is never exceeded (§12.1).
 */
/** Stripe's minimum chargeable CHF amount = 50 Rappen (CHF 0.50). */
export const STRIPE_MIN_CHARGE_RAPPEN = 50;

export function computeMemberDiscount(args: {
  amountRappen: number; // what would be charged with no discount (full or deposit)
  commissionRappen: number; // Solen's normal application_fee on that amount
  tier: Tier;
  discountPct: number; // tier_perks.discount_pct for `tier`
  waiverRate: number; // salons.member_commission_waiver_rate (cap, e.g. 0.02)
  minChargeRappen?: number; // floor the post-discount charge (Stripe min); default 50
}): MemberDiscount {
  const { amountRappen, commissionRappen, tier, discountPct, waiverRate } = args;
  const minCharge = args.minChargeRappen ?? STRIPE_MIN_CHARGE_RAPPEN;

  const noDiscount: MemberDiscount = {
    discountRappen: 0,
    customerChargeRappen: amountRappen,
    applicationFeeRappen: commissionRappen,
    appliedTier: null,
  };

  // Members only (base earns nothing), and only when there's a positive % to apply.
  if (tier === "base" || !(discountPct > 0) || amountRappen <= 0) return noDiscount;

  const rawDiscount = Math.round(amountRappen * discountPct);
  const waiverCap = Math.max(0, Math.round(amountRappen * Math.max(0, waiverRate)));
  // Clamp: never waive more than the cap, never push our own fee below zero, and never
  // push the customer charge below the Stripe minimum (else paymentIntents.create 500s
  // on a near-minimum deposit). The last term forgoes/shrinks the discount rather than
  // erroring; the salon-payout identity holds because charge and fee drop by the same amount.
  const effective = Math.max(
    0,
    Math.min(
      rawDiscount,
      waiverCap,
      Math.max(0, commissionRappen),
      Math.max(0, amountRappen - minCharge)
    )
  );
  if (effective <= 0) return noDiscount;

  return {
    discountRappen: effective,
    customerChargeRappen: amountRappen - effective,
    applicationFeeRappen: commissionRappen - effective,
    appliedTier: tier,
  };
}

/**
 * Count how many member-discounted bookings a user already has in the rolling window,
 * for the per-tier use cap (tier_perks.max_discount_uses_per_window). Counts rows where
 * a discount was actually applied (applied_tier set, tier_discount_amount > 0) and not
 * refunded, so a refunded booking's "use" is released. Never throws (returns 0).
 */
export async function countDiscountUsesInWindow(
  db: SupabaseClient,
  userId: string,
  windowMonths: number
): Promise<number> {
  const windowStart = new Date();
  windowStart.setMonth(windowStart.getMonth() - windowMonths);
  const { count, error } = await db
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("payment_status", "paid") // only PAID bookings consume a use (applied_tier is written pre-payment)
    .not("applied_tier", "is", null)
    .gt("tier_discount_amount", 0)
    .or("refunded_amount.is.null,refunded_amount.lte.0") // coalesce(refunded_amount,0)<=0; a refunded use is released
    .gte("starts_at", windowStart.toISOString());
  if (error) {
    console.error("[loyalty] countDiscountUsesInWindow failed:", error.message);
    return 0;
  }
  return count ?? 0;
}

/**
 * End-to-end member-discount resolution for a booking charge. Reads the live tier, the
 * per-tier knobs, and the use cap, then returns the discount to apply. Server-trusted:
 * pass an ADMIN client. Guests (no userId) and base members get no discount. Never throws
 * (degrades to no-discount so loyalty can never block a payment).
 */
export async function resolveMemberDiscount(args: {
  db: SupabaseClient;
  userId: string | null | undefined;
  amountRappen: number;
  commissionRappen: number;
  waiverRate: number;
  windowMonths: number;
  /**
   * The booking this discount would be charged against. When supplied, the per-window use cap
   * is gated by the ATOMIC `reserve_member_discount` RPC (supabase/migrations/
   * 20260710103441_audit_fix_member_discount_reserve.sql, amended by
   * 20260711233100_audit_fix_member_discount_caller_guard.sql , both already live) instead of
   * the plain countDiscountUsesInWindow check below. That RPC advisory-locks the user
   * (pg_advisory_xact_lock, keyed by user id, the correct primitive here since the cap is a
   * per-user aggregate over `bookings` and not a single shared counter row like promo_codes)
   * and recounts in-flight reservations under the lock, so two concurrent callers for the same
   * user can never both pass it, the same guarantee reserve_promo_use gives promo codes via a
   * FOR UPDATE row lock. Omit only for a preview/estimate call that will never itself become a
   * charged booking; every real charge path should pass its booking id.
   */
  bookingId?: string;
}): Promise<MemberDiscount> {
  const { db, userId, amountRappen, commissionRappen, waiverRate, windowMonths, bookingId } = args;
  const none: MemberDiscount = {
    discountRappen: 0,
    customerChargeRappen: amountRappen,
    applicationFeeRappen: commissionRappen,
    appliedTier: null,
  };
  if (!userId) return none;

  try {
    const tier = await getCurrentTier(db, userId);
    if (tier === "base") return none;

    const perks = await getTierPerks(db, tier);
    if (!perks || !(perks.discount_pct > 0)) return none;

    // Per-tier use cap (null = unlimited). At/over the cap → no discount this booking.
    if (perks.max_discount_uses_per_window != null) {
      if (bookingId) {
        // Atomic reserve-at-check: the authoritative gate (see the bookingId doc comment above).
        const { data: reserved, error: reserveErr } = await db.rpc("reserve_member_discount", {
          p_user: userId,
          p_booking: bookingId,
          p_tier: tier,
          p_window_months: windowMonths,
        });
        if (reserveErr) {
          console.error("[loyalty] reserve_member_discount rpc failed:", reserveErr.message);
          return none; // never throws; degrade to no-discount, matching this function's own discipline
        }
        if (!reserved) return none;
      } else {
        // Non-atomic fallback (check-then-act) for a caller that hasn't been wired with a
        // bookingId yet. Kept so existing callers keep working unchanged; not the race-free path.
        const used = await countDiscountUsesInWindow(db, userId, windowMonths);
        if (used >= perks.max_discount_uses_per_window) return none;
      }
    }

    return computeMemberDiscount({
      amountRappen,
      commissionRappen,
      tier,
      discountPct: perks.discount_pct,
      waiverRate,
    });
  } catch (err) {
    console.error("[loyalty] resolveMemberDiscount failed:", err);
    return none;
  }
}
