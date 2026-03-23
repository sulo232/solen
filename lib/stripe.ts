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

/** @deprecated Use getStripe() instead — kept for backward compatibility */
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as any)[prop];
  },
});

export const PLATFORM_FEE_PERCENT = 0.01; // 1%

/** Convert CHF to Rappen (Stripe uses smallest unit) */
export function toRappen(chf: number): number {
  return Math.round(chf * 100);
}
