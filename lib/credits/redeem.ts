// lib/credits/redeem.ts
//
// Small helpers for the credits + voucher SPEND path (owner-approved 2026-07-11).
// The atomic redeem/restore RPCs already exist live (see
// supabase/migrations/20260703150856_credit_redemption_ledger_and_rpcs.sql,
// 20260703103322_voucher_redemption_ledger_and_rpcs.sql,
// 20260703161101_fix_redeem_idempotency.sql). This file does NOT reimplement
// their logic, it only (a) derives how much stored value a checkout is allowed
// to apply right now (pure, unit-tested by scripts/spend-path-kill-test.ts) and
// (b) reads the two feature flags that gate spend, and (c) sums a user's live
// credit balance from the SAME table shape the RPC itself reads.
//
// Used by app/api/stripe/booking-pay-intent/route.ts.

import type { SupabaseClient } from "@supabase/supabase-js";
import { toRappen } from "@/lib/stripe";
import { STRIPE_MIN_CHARGE_RAPPEN } from "@/lib/loyalty/perks";

/**
 * How many Rappen of stored value (referral credit OR a gift voucher) may be
 * applied to reduce a charge right now, in Rappen, given:
 *   - desiredRappen: the caller's own ceiling (a real balance for credits; for
 *     a voucher, pass a large number and let the RPC's own least(remaining, p_amount)
 *     do the real cap against the voucher's remaining_amount)
 *   - chargeRappen / appFeeRappen: the PaymentIntent's amount / application_fee_amount
 *     BEFORE this application
 *   - hasConnectFee: true only when application_fee_amount is actually sent to Stripe
 *     (a Connect destination charge). Stripe REQUIRES application_fee_amount <= amount,
 *     so when a Connect fee is in play the cap is also bounded by the fee itself.
 *
 * Dollar for dollar: both amount and fee are meant to drop by the SAME Rappen figure
 * (the caller does that), so the salon's payout (amount minus fee) is UNCHANGED, the
 * PLATFORM funds the credit/voucher, never the salon. That is why credit/voucher can
 * never eat MORE than the current commission when a Connect fee is present: beyond
 * that the fee would have to go negative, which Stripe rejects outright.
 */
export function capStoredValueRappen(args: {
  desiredRappen: number;
  chargeRappen: number;
  appFeeRappen: number;
  hasConnectFee: boolean;
  minChargeRappen?: number;
}): number {
  const minCharge = args.minChargeRappen ?? STRIPE_MIN_CHARGE_RAPPEN;
  const desired = Number.isFinite(args.desiredRappen)
    ? Math.max(0, Math.floor(args.desiredRappen))
    : Number.MAX_SAFE_INTEGER;
  const byChargeFloor = Math.max(0, Math.floor(args.chargeRappen) - minCharge);
  const byFee = args.hasConnectFee ? Math.max(0, Math.floor(args.appFeeRappen)) : byChargeFloor;
  return Math.max(0, Math.min(desired, byChargeFloor, byFee));
}

/**
 * Sum of a user's live spendable credit balance, in Rappen. Mirrors the EXACT
 * predicate redeem_user_credits itself selects on (user_id, remaining > 0,
 * expires_at IS NULL OR expires_at > now()), read here so booking-pay-intent can
 * decide whether it is worth calling the RPC at all, never to gate the RPC's own
 * atomicity (the RPC re-checks everything under FOR UPDATE regardless).
 */
export async function getAvailableCreditRappen(db: SupabaseClient, userId: string): Promise<number> {
  const { data, error } = await db
    .from("user_credits")
    .select("remaining")
    .eq("user_id", userId)
    .gt("remaining", 0)
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);
  if (error) {
    console.error("[credits] balance lookup failed:", error.message);
    return 0;
  }
  const totalChf = (data ?? []).reduce(
    (sum: number, row: { remaining?: number | null }) => sum + (Number(row.remaining) || 0),
    0,
  );
  return toRappen(totalChf);
}

/**
 * Direct feature_flags read for "credits" / "vouchers" (money-adjacent, ADDITIVE
 * discounts). Deliberately does NOT reuse lib/feature-flags.ts's checkFeatureEnabled:
 * that helper fails OPEN (a missing row / query error enables the feature) because it
 * gates whether a whole route may run at all, and bricking checkout on a transient flag
 * read is worse than serving it. Here the bias must be the OPPOSITE, this only ever
 * REDUCES a charge, so an unreadable flag must never silently apply a discount. Fails
 * CLOSED on any error or a missing row.
 */
export async function isMoneySpendFlagEnabled(
  db: SupabaseClient,
  key: "credits" | "vouchers",
): Promise<boolean> {
  try {
    const { data, error } = await db
      .from("feature_flags")
      .select("enabled")
      .eq("key", key)
      .maybeSingle();
    if (error || !data) return false;
    return !!data.enabled;
  } catch (err) {
    console.error("[credits] feature flag read failed:", err);
    return false;
  }
}
