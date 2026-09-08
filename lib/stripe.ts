import Stripe from "stripe";

// Server-side Stripe singleton — lazily initialized to avoid build-time crash
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
    _stripe = new Stripe(key, { apiVersion: "2026-02-25.clover" });
  }
  return _stripe;
}

// Separate credentials for new read-only consumers; never fall back to the payment write key.
let _readOnlyStripe: Stripe | null = null;
export function getReadOnlyStripe(): Stripe {
  if (!_readOnlyStripe) {
    const key = process.env.STRIPE_RESTRICTED_KEY;
    if (!key || !/^rk_(live|test)_/.test(key)) {
      throw new Error("STRIPE_RESTRICTED_KEY is not configured");
    }
    _readOnlyStripe = new Stripe(key, { apiVersion: "2026-02-25.clover" });
  }
  return _readOnlyStripe;
}

/** @deprecated Use getStripe() instead — kept for backward compatibility */
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as any)[prop];
  },
});

/** Convert CHF to Rappen (Stripe uses smallest unit) */
export function toRappen(chf: number): number {
  return Math.round(chf * 100);
}

/**
 * Classify a caught Stripe error as a genuine CARD DECLINE (declined /
 * insufficient_funds / expired_card and kin) versus every other Stripe
 * failure (API outage, restricted account, malformed request, an expired
 * capture window). A card decline is a normal business outcome, the system
 * worked and the answer was no; anything else means Stripe (or our own call)
 * did not do its job and is worth surfacing as a real error.
 *
 * `err.type === "StripeCardError"` is the stripe-node SDK's typed error
 * class name; `err.raw?.type === "card_error"` is the same classification
 * straight off the raw API response, kept as a fallback for whichever shape
 * the caller's catch actually sees. This is the ORIGINAL discriminator from
 * lib/bookings/off-session-charge.ts's alertAdmin gate, pulled out here so a
 * second Stripe call site (a capture, not a create) can reuse it instead of
 * re-deriving its own copy.
 */
export function isStripeCardDecline(err: unknown): boolean {
  const e = err as { type?: string; raw?: { type?: string } } | null | undefined;
  const errType = e?.type ?? e?.raw?.type;
  return errType === "StripeCardError" || errType === "card_error";
}
