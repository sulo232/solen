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

import { createAdminSupabaseClient } from "@/lib/supabase";

export interface RefundConfig {
  /** Default for Stripe `refund_application_fee` when a caller omits the per-refund override. */
  refundApplicationFeeDefault: boolean;
}

/**
 * Resolve the refund fee policy.
 *
 * Source-of-truth order (council §10b#3 / D7; extended cron-health SLICE
 * stripe-refunds (b), 2026-09-04):
 *   1. `platform_settings` key `'refund_policy'` -> `value.refund_application_fee_default`
 *      (migration `supabase/migrations/20260904230000_refund_keep_commission_setting.sql`,
 *      NOT YET APPLIED as of this change, the orchestrator applies it live via
 *      the Supabase MCP after review; until then this read simply misses,
 *      same as any not-yet-applied key, and falls through to step 2).
 *   2. env `REFUND_APP_FEE_DEFAULT` ("true" | "false").
 *   3. hardcoded default `false` (keep the commission).
 *
 * `platform_settings` is live (verified 2026-09-04, holds `commission`,
 * `homepage_sections`, `referral`), but until the migration above lands its
 * `commission` row only carries `{ rate_percent }`, the platform's cut of a
 * charge, an unrelated value. This resolver never throws on a missing
 * table/row/schema-cache-miss (a config read must not block a refund):
 * errors are logged and fall through to the env/hardcoded default, mirroring
 * the promo_counted_at swallow pattern in app/api/stripe/webhook/route.ts.
 */
export async function getRefundConfig(): Promise<RefundConfig> {
  // env override, falls through to `false` (keep the commission) when unset.
  const envDefault = process.env.REFUND_APP_FEE_DEFAULT === "true";

  try {
    const admin = createAdminSupabaseClient();
    const { data, error } = await admin
      .from("platform_settings")
      .select("value")
      .eq("key", "refund_policy")
      .maybeSingle();
    if (error) {
      console.error("[getRefundConfig] platform_settings read failed, falling back to env/default:", error.message);
    } else {
      const value = data?.value as { refund_application_fee_default?: boolean } | null;
      if (value && typeof value.refund_application_fee_default === "boolean") {
        return { refundApplicationFeeDefault: value.refund_application_fee_default };
      }
    }
  } catch (err) {
    console.error("[getRefundConfig] platform_settings read threw, falling back to env/default:", err);
  }

  return { refundApplicationFeeDefault: envDefault };
}
