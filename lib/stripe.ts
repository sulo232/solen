import Stripe from "stripe";

// Server-side Stripe singleton
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});

export const PLATFORM_FEE_PERCENT = 0.01; // 1%

/** Convert CHF to Rappen (Stripe uses smallest unit) */
export function toRappen(chf: number): number {
  return Math.round(chf * 100);
}
