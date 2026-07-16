import { stripe } from "@/lib/stripe";

// exists-check: net-new (npm run exists stripe-ready -> 0 matches). Factored out of
// app/api/salon/go-live/route.ts so app/api/salon/setup-progress/route.ts can import the
// SAME check instead of a looser local approximation (bare stripe_account_id presence),
// which is how those two routes drifted apart (reviewer punch, 2026-07-16).

/**
 * A bare non-null stripe_account_id only means the salon clicked "Connect", not that
 * Stripe onboarding (KYC/bank/TOS) actually completed. Mirrors the live check already
 * done correctly in /api/stripe/connect/status.
 *
 * Resilient by design: any Stripe API error (network blip, rate limit, bad account id)
 * is caught and logged, never thrown, so a caller route never 500s because of this check.
 * On error the salon is simply treated as not-ready (fails closed, not open).
 */
export async function isStripeReady(accountId: string | null): Promise<boolean> {
  if (!accountId) return false;
  try {
    const account = await stripe.accounts.retrieve(accountId);
    return !!(account.charges_enabled && account.payouts_enabled);
  } catch (err) {
    console.error("[isStripeReady] Stripe account retrieve failed:", err, { accountId });
    return false;
  }
}
