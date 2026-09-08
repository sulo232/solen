// lib/bookings/off-session-charge.ts
//
// THE single primitive that talks to Stripe `paymentIntents.create` for an
// OFF-SESSION charge against an already-saved card (SP-G2 setup_future_usage).
// These money-IN paths reuse it (REFUND_APPEAL_PLAN §10b#3 "do not duplicate the
// Stripe call"):
//   - lib/bookings/charge-fee.ts: cancellation / no-show policy fee
//   - app/api/cron/pre-charge/route.ts: scheduled booking prepayment
//   - the dispute upcharge executor (chargeUpcharge in dispute-engine.ts) — D13
//
// It is INTENTIONALLY db-agnostic: it knows nothing about which columns or table
// the caller updates (charge-fee writes bookings.fee_charge_*, the upcharge writes
// booking_disputes.status='charged' + case_events). It only:
//   - builds the off-session destination-charge PaymentIntent (Connect
//     application_fee_amount + transfer_data.destination when a connected account
//     is present),
//   - passes the caller's DETERMINISTIC idempotency key so a double-tick / retry
//     collapses to ONE Stripe charge,
//   - maps Stripe's SCA `authentication_required` (off-session needs a fresh
//     strong-customer-auth) to a `requires_action` result instead of throwing,
//   - never throws on a decline (returns 'failed') so a cron loop keeps going.
//
// MONEY UNIT: integer Rappen end-to-end. `amountCents` is Rappen; it is sent
// verbatim as Stripe `amount` (Stripe's smallest CHF unit). NEVER pass a CHF
// number here — convert at the FE / settings boundary via lib/stripe.ts toRappen.

import Stripe from "stripe";
import { getStripe, isStripeCardDecline } from "@/lib/stripe";
import { alertAdmin } from "@/lib/alert-admin";

export interface OffSessionChargeArgs {
  /** Integer Rappen to charge; MUST be a positive integer (caller validates/caps first). */
  amountCents: number;
  /** Fee caller publishes this intent before confirmation; other callers keep create+confirm. */
  paymentIntentId?: string;
  /** Saved Stripe customer (SP-G2). */
  stripeCustomerId: string;
  /** Saved payment method on that customer (SP-G2 off-session card). */
  stripePaymentMethodId: string;
  /** Connected account for a Connect destination charge; null = plain charge (no fee/transfer). */
  stripeAccountId: string | null;
  /** Platform commission in Rappen; applied as application_fee_amount only when stripeAccountId is set. */
  applicationFeeCents: number;
  /** DETERMINISTIC key — the caller owns it so retries collapse to one charge. */
  idempotencyKey: string;
  /** Stripe PI metadata (type, booking_id, dispute id, actor, …). */
  metadata: Record<string, string>;
}

export type OffSessionChargeResult =
  | { status: "charged"; paymentIntentId: string; chargedCents: number }
  | { status: "pending"; paymentIntentId: string }
  /** Off-session SCA: the PI is parked; the caller must surface a re-auth (notification hook). */
  | { status: "requires_action"; paymentIntentId: string | null; clientSecret: string | null }
  /**
   * Decline / restricted account / any other Stripe error. Never throws.
   * `declined: true` = a genuine card decline (customer-side, data, don't
   * redden a cron run over it); `false` = a non-decline Stripe failure
   * (system-side, should redden). See `isStripeCardDecline` (lib/stripe.ts).
   */
  | { status: "failed"; error: string; declined: boolean };

/**
 * Create + confirm an off-session PaymentIntent. Pure money primitive: no DB writes,
 * no logging of business state (callers own audit + their own status columns).
 */
export async function chargeOffSession(args: OffSessionChargeArgs): Promise<OffSessionChargeResult> {
  const {
    amountCents,
    stripeCustomerId,
    stripePaymentMethodId,
    stripeAccountId,
    applicationFeeCents,
    idempotencyKey,
    metadata,
  } = args;

  const piParams: Stripe.PaymentIntentCreateParams = {
    amount: amountCents, // Rappen.
    currency: "chf",
    customer: stripeCustomerId,
    payment_method: stripePaymentMethodId,
    off_session: true,
    confirm: true,
    metadata,
  };
  if (stripeAccountId) {
    piParams.application_fee_amount = applicationFeeCents;
    piParams.transfer_data = { destination: stripeAccountId }; // Connect destination charge.
  }

  try {
    const pi = args.paymentIntentId
      ? await getStripe().paymentIntents.confirm(args.paymentIntentId, { payment_method: stripePaymentMethodId, off_session: true }, { idempotencyKey })
      : await getStripe().paymentIntents.create(piParams, { idempotencyKey });
    if (pi.status === "processing" || pi.status === "requires_capture") {
      return { status: "pending", paymentIntentId: pi.id };
    }
    if (pi.status !== "succeeded") {
      return { status: "requires_action", paymentIntentId: pi.id, clientSecret: pi.client_secret };
    }
    return { status: "charged", paymentIntentId: pi.id, chargedCents: amountCents };
  } catch (err: any) {
    // SCA fallback. An off-session charge can require strong customer auth; surface a
    // parkable PI instead of treating it as a hard failure. Do NOT retry off-session
    // (it will keep failing) — the caller parks it for a later on-session re-auth.
    const code: string | undefined = err?.code ?? err?.raw?.code;
    const intent: Stripe.PaymentIntent | undefined = err?.raw?.payment_intent ?? err?.payment_intent;
    const needsAuth = code === "authentication_required" || intent?.status === "requires_action";
    if (needsAuth) {
      return {
        status: "requires_action",
        paymentIntentId: intent?.id ?? null,
        clientSecret: intent?.client_secret ?? null,
      };
    }
    // Alert ONLY on a genuinely-unexpected failure — NOT on a normal card decline
    // (declined / insufficient_funds / expired_card …). A decline is an expected
    // business outcome the callers already model as status:'failed'; a
    // StripeAPIError / StripeConnectionError / idempotency conflict / programming
    // error is the infrastructure failure worth an inbox ping. (requires_action
    // already returned above, so it can't reach here.)
    const isCardDecline = isStripeCardDecline(err);
    if (!isCardDecline) {
      void alertAdmin("off-session charge threw (non-decline)", {
        stripe_error_type: (err?.type ?? err?.raw?.type) ?? null,
        stripe_error_code: code ?? null,
        customer: stripeCustomerId,
        idempotency_key: idempotencyKey,
        booking_id: metadata?.booking_id ?? null,
        type: metadata?.type ?? null,
        error: err?.message ?? String(err),
      });
    }
    // declined = isCardDecline, surfaced to the caller so a cron loop can count
    // this as a customer-side outcome (data) instead of a system error.
    return { status: "failed", error: err?.message ?? String(err), declined: isCardDecline };
  }
}
