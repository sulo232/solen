// lib/bookings/refund-config.ts
//
// D7 (REFUND_APPEAL_PLAN.md §8): when a booking is refunded, does Solen also
// refund its platform commission, or keep it? Owner decision: KEEP the
// commission wherever legally allowed; give it back only where the law
// requires. Built CONFIGURABLE so the answer can flip without a code change —
// it drives Stripe's `refund_application_fee` flag inside issueRefund().
//
// `refundApplicationFeeDefault = false` => keep the commission (D7 default).
// `true` => also refund the application fee back to the customer.

export interface RefundConfig {
  /** Default for Stripe `refund_application_fee` when a caller omits the per-refund override. */
  refundApplicationFeeDefault: boolean;
}

/**
 * Resolve the refund fee policy.
 *
 * Source-of-truth order (council §10b#3 / D7):
 *   1. env `REFUND_APP_FEE_DEFAULT` ("true" | "false").
 *   2. hardcoded default `false` (keep the commission).
 *
 * `platform_settings` is live (verified 2026-09-04, holds `commission`,
 * `homepage_sections`, `referral`), but its `commission` row only carries
 * `{ rate_percent }`, the platform's cut of a charge. This function's
 * boolean (return the application fee on a refund, yes or no) is a
 * different, unrelated value with no key in that table. Do not read
 * `commission` here and do not invent a `refund_policy` key: if the
 * table ever gains one, wire it here (there is no shared reader yet,
 * each of the 8 charging paths duplicates its own `platform_settings`
 * query, see lib/bookings/charge-fee.ts:169), ahead of the env
 * fallback below.
 */
export async function getRefundConfig(): Promise<RefundConfig> {
  // env override, falls through to `false` (keep the commission) when unset.
  const envDefault = process.env.REFUND_APP_FEE_DEFAULT === "true";

  return { refundApplicationFeeDefault: envDefault };
}
