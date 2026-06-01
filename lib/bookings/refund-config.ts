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
 *   1. `platform_settings` row `'refund_policy'` — NOT YET LIVE (table absent),
 *      wired here as a TODO so SP-3 can flip the source without touching callers.
 *   2. env `REFUND_APP_FEE_DEFAULT` ("true" | "false").
 *   3. hardcoded default `false` (keep the commission).
 *
 * Async by design so the future `platform_settings` read drops in without a
 * signature change.
 */
export async function getRefundConfig(): Promise<RefundConfig> {
  // (1) platform_settings.'refund_policy' — deferred: the table does not exist
  //     in the live DB yet (verified 2026-06-01). When it lands, read it here
  //     BEFORE the env fallback. Intentionally not wired now to avoid a query
  //     against a missing table on every refund.

  // (2) env override.
  const envDefault = process.env.REFUND_APP_FEE_DEFAULT === "true";

  // (3) falls through to `false` when the env var is unset.
  return { refundApplicationFeeDefault: envDefault };
}
