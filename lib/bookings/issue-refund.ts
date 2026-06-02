// lib/bookings/issue-refund.ts
//
// THE single chokepoint that talks to Stripe `refunds.create` and writes
// bookings.refunded_amount. Council fix §10b#3 (REFUND_APPEAL_PLAN.md): every
// refund call site routes through here — the salon refund route, the admin
// dispute-action route, and (later, D10) the walk-in path. Do NOT call
// `stripe.refunds.create` anywhere else.
//
// MONEY UNIT: integer Rappen (centimes) end-to-end. `amountCents` in, Stripe
// `amount` in Rappen, bookings.paid_amount / refunded_amount are INTEGER Rappen.
// NEVER read bookings.price_paid here — that column is CHF (numeric) and
// coalescing it into a Rappen field is the live 100x bug this chokepoint kills.

import type { SupabaseClient } from "@supabase/supabase-js";
import { getStripe } from "@/lib/stripe";
import { getRefundConfig } from "@/lib/bookings/refund-config";
import { alertAdmin } from "@/lib/alert-admin";

export type RefundSource = "booking" | "walkin"; // 'walkin' reserved for D10; SP-0 implements 'booking'.

export type RefundErrorCode =
  | "INVALID_AMOUNT"
  | "BOOKING_NOT_FOUND"
  | "NO_PAID_AMOUNT"
  | "EXCEEDS_REMAINING"
  | "NO_PAYMENT"
  | "STRIPE_FAILED"
  | "CONCURRENT_RETRY"
  | "UNSUPPORTED_SOURCE";

/** Typed error so callers can map a code -> HTTP status without string-matching. */
export class RefundError extends Error {
  code: RefundErrorCode;
  constructor(code: RefundErrorCode, message?: string) {
    super(message ?? code);
    this.name = "RefundError";
    this.code = code;
  }
}

export interface IssueRefundArgs {
  /** Pass an ADMIN (service-role) client — the CAS update must not fight RLS. */
  db: SupabaseClient;
  source: RefundSource;
  /** Booking id (source='booking'). */
  id: string;
  /** Integer Rappen to refund; must be > 0 and <= remaining. */
  amountCents: number;
  actor: "salon" | "admin" | "customer" | "system";
  /** Free text for the case timeline / audit (written by the CALLER, not here). */
  reason: string;
  /** D7 override; when omitted, resolved from getRefundConfig(). */
  refundApplicationFee?: boolean;
}

export interface IssueRefundResult {
  refundId: string;
  totalRefundedCents: number;
  paymentStatus: "refunded" | "partially_refunded";
}

interface BookingRow {
  id: string;
  payment_intent_id: string | null;
  paid_amount: number | null;
  refunded_amount: number | null;
  salon_id: string | null;
  salons: { stripe_account_id: string | null } | null;
}

export async function issueRefund(args: IssueRefundArgs): Promise<IssueRefundResult> {
  const { db, source, id, amountCents, refundApplicationFee } = args;

  // D10: only 'booking' is implemented in SP-0. 'walkin' reserved.
  if (source !== "booking") {
    throw new RefundError("UNSUPPORTED_SOURCE", `Refund source '${source}' not implemented`);
  }

  // 1. Validate input.
  if (!Number.isInteger(amountCents) || amountCents <= 0) {
    throw new RefundError("INVALID_AMOUNT", "amountCents must be a positive integer (Rappen)");
  }

  // 2. Fetch booking (admin client). NB: never select price_paid.
  const { data: bookingData, error: fetchError } = await db
    .from("bookings")
    .select("id, payment_intent_id, paid_amount, refunded_amount, salon_id, salons(stripe_account_id)")
    .eq("id", id)
    .single();

  if (fetchError || !bookingData) {
    throw new RefundError("BOOKING_NOT_FOUND", `Booking ${id} not found`);
  }
  const booking = bookingData as unknown as BookingRow;

  // 3. Compute remaining in Rappen. NEVER fall back to price_paid (CHF — the bug).
  const paidAmount = booking.paid_amount ?? 0;
  if (paidAmount <= 0) {
    throw new RefundError("NO_PAID_AMOUNT", "No integer paid_amount on booking — cannot refund");
  }
  const staleRefunded = booking.refunded_amount ?? 0;
  const remaining = paidAmount - staleRefunded;
  if (amountCents > remaining) {
    throw new RefundError("EXCEEDS_REMAINING", `Refund ${amountCents} exceeds remaining ${remaining}`);
  }

  // 4. Require a payment intent.
  const pi = booking.payment_intent_id;
  if (!pi) {
    throw new RefundError("NO_PAYMENT", "Booking has no Stripe payment_intent_id");
  }

  // 5. Resolve fee policy (D7).
  const appFee = refundApplicationFee ?? (await getRefundConfig()).refundApplicationFeeDefault;

  // 6. Deterministic idempotency key — per (booking, prior-refunded-total, amount).
  //    A double-click or Stripe retry collapses to one refund; keyed on the same
  //    staleRefunded that gates the CAS below, so Stripe + DB stay in lockstep.
  const idempotencyKey = `refund:${source}:${id}:${staleRefunded}:${amountCents}`;

  // 7. Stripe call. reverse_transfer / refund_application_fee ONLY for Connect
  //    destination charges (stripe_account_id present); omit both otherwise.
  const stripeAccountId = booking.salons?.stripe_account_id ?? null;
  const refundParams: Record<string, unknown> = {
    payment_intent: pi,
    amount: amountCents, // Rappen — Stripe's smallest unit for CHF.
    reason: "requested_by_customer",
  };
  if (stripeAccountId) {
    refundParams.reverse_transfer = true; // claw back from the salon's transferred funds (§10b#3).
    refundParams.refund_application_fee = appFee; // D7-driven.
  }

  let refund: { id: string };
  try {
    refund = await getStripe().refunds.create(refundParams as any, { idempotencyKey });
  } catch (stripeErr: any) {
    // A refund that throws is a genuine money-path failure — unlike a charge there
    // is no "decline" business outcome here (the funds already moved IN; a failing
    // refund means already_refunded / insufficient platform balance / Stripe API
    // error). Always worth an alert. Keep the typed throw so callers map it to 500.
    void alertAdmin("Stripe refund threw", {
      booking_id: id,
      payment_intent: pi,
      amount_cents: amountCents,
      idempotency_key: idempotencyKey,
      stripe_error_type: stripeErr?.type ?? stripeErr?.raw?.type ?? null,
      stripe_error_code: stripeErr?.code ?? stripeErr?.raw?.code ?? null,
      error: stripeErr?.message ?? String(stripeErr),
    });
    throw new RefundError("STRIPE_FAILED", stripeErr?.message ?? "Stripe refund failed");
  }

  // 8. Atomic accounting — compare-and-set, NOT read-modify-write (salon + admin
  //    can both act). The .eq("refunded_amount", staleRefunded) guard rejects the
  //    write if another actor already advanced the total.
  const newTotal = staleRefunded + amountCents;
  const isFull = newTotal >= paidAmount;
  const paymentStatus: IssueRefundResult["paymentStatus"] = isFull ? "refunded" : "partially_refunded";

  const { data: casRow, error: casError } = await db
    .from("bookings")
    .update({ refunded_amount: newTotal, payment_status: paymentStatus })
    .eq("id", id)
    .eq("refunded_amount", staleRefunded) // CAS guard.
    .select("id")
    .maybeSingle();

  if (casError) {
    console.error("[issueRefund] CAS update error:", casError);
    throw new RefundError("CONCURRENT_RETRY", casError.message);
  }

  if (!casRow) {
    // CAS matched 0 rows -> a concurrent refund already advanced the total.
    // Because the Stripe idempotency key is keyed on the SAME staleRefunded,
    // Stripe also collapsed this to the already-issued refund. Re-read and
    // return the current state rather than double-counting.
    const { data: fresh } = await db
      .from("bookings")
      .select("refunded_amount, paid_amount")
      .eq("id", id)
      .maybeSingle();
    const freshTotal = (fresh?.refunded_amount as number | null) ?? newTotal;
    const freshPaid = (fresh?.paid_amount as number | null) ?? paidAmount;
    console.error(
      `[issueRefund] CAS no-op (concurrent refund) for booking ${id}; ` +
        `returning current refunded_amount=${freshTotal}`
    );
    return {
      refundId: refund.id,
      totalRefundedCents: freshTotal,
      paymentStatus: freshTotal >= freshPaid ? "refunded" : "partially_refunded",
    };
  }

  // 9. salon_payouts reconciliation is intentionally NOT done here. The
  //    `charge.refunded` Stripe webhook (app/api/stripe/webhook/route.ts) is the
  //    single canonical reconciler — it fires after every `refunds.create`
  //    (including this one) and recomputes gross/commission/net on the payout
  //    row. Decrementing here as well double-counted the refund against the
  //    salon's payout (the live double-decrement bug, REFUND_APPEAL_PLAN §10b#3).
  //    Keep this chokepoint single-responsibility: Stripe refund + the booking
  //    CAS above; the webhook owns the ledger.

  // 10. Return. case_events + audit are the CALLER's responsibility (it knows the
  //     dispute id); this chokepoint is single-responsibility: money + booking row.
  return {
    refundId: refund.id,
    totalRefundedCents: newTotal,
    paymentStatus,
  };
}
