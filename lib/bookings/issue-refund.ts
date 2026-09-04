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
  | "NOT_CAPTURED"
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
  payment_status: string | null;
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
    .select("id, payment_intent_id, paid_amount, refunded_amount, payment_status, salon_id, salons(stripe_account_id)")
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

  // 4b. Require a CAPTURED payment before touching Stripe. The create-then-charge
  //     flow can leave a row with a payment_intent_id + paid_amount>0 but
  //     payment_status='none' (PI created, never captured/succeeded, then
  //     abandoned). Such a row passes NO_PAYMENT + NO_PAID_AMOUNT yet would make
  //     refunds.create fire against a PI that never took money. Only 'paid' /
  //     'partially_refunded' mean funds actually moved IN and are refundable.
  if (booking.payment_status !== "paid" && booking.payment_status !== "partially_refunded") {
    throw new RefundError(
      "NOT_CAPTURED",
      `Booking payment_status '${booking.payment_status ?? "null"}' is not a captured state — cannot refund`
    );
  }

  // 5. Resolve fee policy (D7).
  const appFee = refundApplicationFee ?? (await getRefundConfig()).refundApplicationFeeDefault;

  // 6. Deterministic idempotency key, per (booking, prior-refunded-total, amount).
  //    A double-click or Stripe retry collapses to one refund; keyed on the same
  //    staleRefunded that gates the claim below, so Stripe + DB stay in lockstep.
  const idempotencyKey = `refund:${source}:${id}:${staleRefunded}:${amountCents}`;

  // 7. Compute the accounting totals up front so we can CLAIM them BEFORE
  //    touching Stripe. priorPaymentStatus is kept for the rollback in step 9.
  const priorPaymentStatus = booking.payment_status;
  const newTotal = staleRefunded + amountCents;
  const isFull = newTotal >= paidAmount;
  const paymentStatus: IssueRefundResult["paymentStatus"] = isFull ? "refunded" : "partially_refunded";

  // 8. CLAIM FIRST, atomic compare-and-set BEFORE calling Stripe, NOT
  //    read-modify-write (salon + admin can both act). This closes the race where
  //    two concurrent DIFFERENT-amount refunds (the Stripe idempotency key includes
  //    amountCents, so it does NOT collapse them) could both reach refunds.create
  //    before either wrote the DB, a real double-Stripe-refund, not just a DB
  //    no-op. Whoever wins this CAS is the only caller allowed to call Stripe; the
  //    loser is rejected here, before any money moves.
  // 8b. cron-health SLICE stripe-refunds (c): refund_pending_at (migration
  //     20260904230500_bookings_refund_pending_at.sql, NOT YET APPLIED, the
  //     orchestrator applies it live after review) is set in the SAME claim
  //     write as the CAS above, BEFORE the Stripe call in step 9 below. The
  //     claim above already writes the booking's TERMINAL refunded_amount /
  //     payment_status optimistically, ahead of Stripe confirming anything
  //     (claim-first, so two concurrent refunds can't both reach Stripe); a
  //     process crash between this write committing and step 9 resolving
  //     leaves the booking showing a refund Stripe was never confirmed to
  //     have issued (a phantom-refund window) with nothing to detect it. The
  //     marker flags "a refund claim is in flight" so the reconcile cron's
  //     sweep (app/api/cron/reconcile) can find a stuck one and check it
  //     against Stripe's own refund list for the payment intent. Cleared
  //     after Stripe confirms (right after the `refunds.create` call below)
  //     or after the rollback on a Stripe failure (same guarded update).
  const { data: claimRow, error: casError } = await db
    .from("bookings")
    .update({ refunded_amount: newTotal, payment_status: paymentStatus, refund_pending_at: new Date().toISOString() })
    .eq("id", id)
    .eq("refunded_amount", staleRefunded) // CAS guard.
    .select("id")
    .maybeSingle();

  if (casError) {
    console.error("[issueRefund] CAS claim error:", casError);
    throw new RefundError("CONCURRENT_RETRY", casError.message);
  }

  if (!claimRow) {
    // CAS matched 0 rows -> a concurrent refund already advanced refunded_amount
    // between our read and this claim. Do NOT call Stripe here, the caller
    // surfaces CONCURRENT_RETRY and the retry re-reads the fresh total.
    console.error(
      `[issueRefund] CAS claim no-op (concurrent refund) for booking ${id}; refund not attempted`
    );
    throw new RefundError("CONCURRENT_RETRY", "refunded_amount advanced concurrently; retry");
  }

  // 9. Stripe call, only reached after winning the claim above. reverse_transfer /
  //    refund_application_fee ONLY for Connect destination charges (stripe_account_id
  //    present); omit both otherwise.
  const stripeAccountId = booking.salons?.stripe_account_id ?? null;
  const refundParams: Record<string, unknown> = {
    payment_intent: pi,
    amount: amountCents, // Rappen, Stripe's smallest unit for CHF.
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
    // Roll back the claim, we reserved newTotal but Stripe never issued the
    // money, so the booking must not be left showing a refund that didn't happen.
    // Guarded: only revert if the row is still at OUR claimed value; if a later
    // (legitimate) refund has since stacked on top of it, leave the row alone and
    // let the alert below surface the drift for manual reconciliation.
    const { data: rollbackRow, error: rollbackError } = await db
      .from("bookings")
      .update({ refunded_amount: staleRefunded, payment_status: priorPaymentStatus, refund_pending_at: null })
      .eq("id", id)
      .eq("refunded_amount", newTotal)
      .select("id")
      .maybeSingle();
    if (rollbackError) {
      console.error("[issueRefund] claim rollback error:", rollbackError);
    }
    // rollback_reverted tells an admin apart a CLEAN revert (the row was still at
    // OUR claimed newTotal, so the update above matched and undid it) from a
    // NO-OP (a later legitimate refund already advanced refunded_amount past
    // newTotal, so the .eq("refunded_amount", newTotal) guard matched 0 rows and
    // the row was deliberately left alone, leaving drift for manual reconciliation).
    const rollbackReverted = !rollbackError && !!rollbackRow;
    // A refund that throws is a genuine money-path failure, unlike a charge there
    // is no "decline" business outcome here (the funds already moved IN; a failing
    // refund means already_refunded / insufficient platform balance / Stripe API
    // error). Always worth an alert. Keep the typed throw so callers map it to 500.
    void alertAdmin("Stripe refund threw", {
      booking_id: id,
      payment_intent: pi,
      amount_cents: amountCents,
      idempotency_key: idempotencyKey,
      rollback_reverted: rollbackReverted,
      stripe_error_type: stripeErr?.type ?? stripeErr?.raw?.type ?? null,
      stripe_error_code: stripeErr?.code ?? stripeErr?.raw?.code ?? null,
      error: stripeErr?.message ?? String(stripeErr),
    });
    throw new RefundError("STRIPE_FAILED", stripeErr?.message ?? "Stripe refund failed");
  }

  // 9b. Stripe confirmed the refund, clear the in-flight marker set in step
  //     8b. Guarded on refunded_amount still matching OUR claimed newTotal,
  //     same discipline as the rollback above: if this somehow races with
  //     another writer, leave the marker for the sweeper rather than clobber
  //     a state we no longer understand.
  const { error: clearPendingError } = await db
    .from("bookings")
    .update({ refund_pending_at: null })
    .eq("id", id)
    .eq("refunded_amount", newTotal);
  if (clearPendingError) {
    console.error("[issueRefund] failed to clear refund_pending_at after a confirmed Stripe refund:", clearPendingError.message, { booking_id: id, payment_intent: pi });
    // Non-fatal: the refund already succeeded on both Stripe and the booking
    // row; the reconcile-cron sweeper will find and clear a marker stuck
    // like this (Stripe already shows the refund, so it just clears it).
  }

  // 10. salon_payouts reconciliation is intentionally NOT done here. The
  //     `charge.refunded` Stripe webhook (app/api/stripe/webhook/route.ts) is the
  //     single canonical reconciler, it fires after every `refunds.create`
  //     (including this one) and recomputes gross/commission/net on the payout
  //     row. Decrementing here as well double-counted the refund against the
  //     salon's payout (the live double-decrement bug, REFUND_APPEAL_PLAN §10b#3).
  //     Keep this chokepoint single-responsibility: Stripe refund + the booking
  //     claim above; the webhook owns the ledger.

  // 10b. CREDITS + VOUCHER SPEND restore (owner-approved 2026-07-11). Both RPCs are
  //      keyed on `pi` (the SAME Stripe PaymentIntent id booking-pay-intent redeemed
  //      against) and are all-or-nothing per PI (they loop over matching ledger rows
  //      and delete them; there is no proportional/partial variant). Gated on isFull
  //      (computed in step 7): a PARTIAL refund must NOT touch the credit/voucher
  //      ledger, the redeemed amount stays spent until the booking is fully refunded,
  //      otherwise a small partial refund would fully restore credits/vouchers that
  //      are still backing the unrefunded remainder (over-restore). This chokepoint
  //      covers every caller that refunds a booking (salon/admin refund, dispute
  //      action, the customer-cancel path, cron reconcile), so restoring here once
  //      covers all of them. A failed restore must NEVER block the refund that
  //      already succeeded on Stripe: log + alert an admin for manual reconciliation.
  if (isFull) {
    try {
      const { error: restoreCreditsErr } = await db.rpc("restore_user_credits", { p_pi: pi });
      if (restoreCreditsErr) {
        console.error("[issueRefund] restore_user_credits failed:", restoreCreditsErr.message, { booking_id: id, payment_intent: pi });
        void alertAdmin("restore_user_credits failed after a successful refund", {
          booking_id: id,
          payment_intent: pi,
          refund_id: refund.id,
          error: restoreCreditsErr.message,
        });
      }
    } catch (restoreCreditsCatchErr) {
      console.error("[issueRefund] restore_user_credits threw:", restoreCreditsCatchErr, { booking_id: id, payment_intent: pi });
      void alertAdmin("restore_user_credits threw after a successful refund", {
        booking_id: id,
        payment_intent: pi,
        refund_id: refund.id,
        error: String(restoreCreditsCatchErr),
      });
    }
    try {
      const { error: restoreVoucherErr } = await db.rpc("restore_voucher", { p_pi: pi });
      if (restoreVoucherErr) {
        console.error("[issueRefund] restore_voucher failed:", restoreVoucherErr.message, { booking_id: id, payment_intent: pi });
        void alertAdmin("restore_voucher failed after a successful refund", {
          booking_id: id,
          payment_intent: pi,
          refund_id: refund.id,
          error: restoreVoucherErr.message,
        });
      }
    } catch (restoreVoucherCatchErr) {
      console.error("[issueRefund] restore_voucher threw:", restoreVoucherCatchErr, { booking_id: id, payment_intent: pi });
      void alertAdmin("restore_voucher threw after a successful refund", {
        booking_id: id,
        payment_intent: pi,
        refund_id: refund.id,
        error: String(restoreVoucherCatchErr),
      });
    }
  }

  // 11. Return. The accounting was already recorded by the claim in step 8 (no
  //     post-Stripe CAS needed). case_events + audit are the CALLER's
  //     responsibility (it knows the dispute id); this chokepoint is
  //     single-responsibility: money + booking row.
  return {
    refundId: refund.id,
    totalRefundedCents: newTotal,
    paymentStatus,
  };
}
