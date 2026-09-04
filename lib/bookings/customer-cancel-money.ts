// lib/bookings/customer-cancel-money.ts
//
// THE single money-outcome chokepoint for a CUSTOMER-initiated booking cancel.
// Extracted (audit finding #19, MEDIUM, 2026-07-09) out of the POST customer branch
// of app/api/bookings/[id]/cancel/route.ts so every entry point that lets a
// CUSTOMER cancel their own booking (the canonical /cancel route AND the public
// HMAC quick-action link) applies the SAME fee/refund math instead of a divergent
// no-refund no-fee no-op. Do NOT re-inline this logic at a new call site. call
// applyCustomerCancelMoney() instead, same discipline as chargeFee/issueRefund.
//
// Prepaid booking: fee is netted OUT of the refund (refund = paid - fee), no
// separate off-session charge on top. Not prepaid (pay-at-salon): nothing to
// refund, the fee (if any, inside the free-cancel window) is charged off-session
// against the saved card. Single-responsibility: money + the bookings columns
// chargeFee/issueRefund already own. Audit logging is the CALLER's responsibility
// (mirrors chargeFee/issueRefund's own convention). this function has no session
// user to log against for a public/token-gated caller.

import type { SupabaseClient } from "@supabase/supabase-js";
import { calculateCancellationFee } from "@/lib/cancellation-policy";
import { toRappen, getStripe } from "@/lib/stripe";
import { chargeFee, FeeError, type ChargeFeeResult } from "@/lib/bookings/charge-fee";
import { issueRefund, RefundError } from "@/lib/bookings/issue-refund";

export interface CustomerCancelBookingRow {
  id: string;
  starts_at: string;
  paid_amount: number | null;
  price_paid: number | null;
  payment_intent_id: string | null;
  payment_status: string | null;
  refunded_amount: number | null;
  stripe_customer_id: string | null;
  stripe_payment_method_id: string | null;
}

export interface CustomerCancelSalonPolicy {
  cancellation_fee_type?: string | null;
  cancellation_fee_value?: number | null;
  free_cancel_hours?: number | null;
}

export interface CustomerCancelMoneyResult {
  /** Integer Rappen (policy fee for cancelling inside the free-cancel window). */
  feeCents: number;
  /** true = cancelling inside the window (a fee CAN apply); false = free/early cancel. */
  isWithinWindow: boolean;
  /** Integer Rappen actually refunded (0 when not prepaid, or fee fully absorbed the base). */
  refundAmount: number;
  feeChargeStatus: ChargeFeeResult["status"] | "none";
  /** Integer Rappen actually off-session charged (0 unless feeChargeStatus === "charged"). */
  feeChargedCents: number;
  feeChargePaymentIntentId: string | null;
}

/**
 * Apply the customer-cancel money outcome for a single booking. Callers must have
 * already verified the actor is the booking's customer and already flipped
 * booking.status to 'cancelled' (the cancellation is honored regardless of the
 * money outcome, same discipline as the canonical /cancel route).
 */
export async function applyCustomerCancelMoney(
  admin: SupabaseClient,
  booking: CustomerCancelBookingRow,
  salon: CustomerCancelSalonPolicy | null,
  reason: string,
): Promise<CustomerCancelMoneyResult> {
  const baseCents = booking.paid_amount ?? toRappen(Number(booking.price_paid ?? 0));

  const calc = calculateCancellationFee(
    salon?.cancellation_fee_type,
    salon?.cancellation_fee_value,
    salon?.free_cancel_hours ?? 24,
    baseCents,
    new Date(booking.starts_at),
  );
  const feeCents = calc.feeCents;
  const isWithinWindow = calc.isWithinWindow;

  let refundAmount = 0;
  let feeChargeStatus: CustomerCancelMoneyResult["feeChargeStatus"] = "none";
  let feeChargedCents = 0;
  let feeChargePaymentIntentId: string | null = null;

  // Prepayment is evidenced by paid_amount + payment_intent_id, NOT payment_status:
  // a PRIOR partial/full refund (e.g. a dispute resolved via issueRefund while the
  // booking stayed 'confirmed') flips payment_status to 'partially_refunded' /
  // 'refunded' while leaving paid_amount and payment_intent_id in place. Gating on
  // payment_status === "paid" misclassified that booking as not-prepaid and let the
  // ELSE branch charge a fresh off-session cancellation fee on top, double-charging.
  const wasPrepaid =
    booking.paid_amount != null &&
    booking.paid_amount > 0 &&
    !!booking.payment_intent_id;

  if (wasPrepaid) {
    // Net the fee against the REMAINING (un-refunded) balance, not the gross paid
    // amount, so a booking that was already partially/fully refunded before this
    // cancel doesn't get double-refunded on top of the prior refund.
    const alreadyRefunded = booking.refunded_amount ?? 0;
    const remaining = Math.max(0, baseCents - alreadyRefunded);
    const refundCents = Math.max(0, remaining - feeCents);
    if (refundCents > 0) {
      try {
        await issueRefund({
          db: admin,
          source: "booking",
          id: booking.id,
          amountCents: refundCents,
          actor: "customer",
          reason,
        });
        refundAmount = refundCents;
      } catch (e) {
        // A failed refund does not roll back the cancellation, logged, pursued out-of-band
        // (same discipline as the canonical /cancel route).
        if (e instanceof RefundError) {
          console.error(`[customer-cancel-money] issueRefund failed for booking ${booking.id} (${e.code}):`, e.message);
          // NOT_CAPTURED means the PaymentIntent is only an authorization hold
          // (never captured), so issueRefund correctly refused to refund it. But
          // an uncaptured hold left alone only releases on Stripe's own ~7-day
          // clock; a cancelled booking must release it immediately. Cancel the
          // PaymentIntent explicitly instead. Never touches the captured-payment
          // (refund) path above.
          if (e.code === "NOT_CAPTURED" && booking.payment_intent_id) {
            try {
              await getStripe().paymentIntents.cancel(booking.payment_intent_id);
            } catch (cancelErr) {
              const stripeErr = cancelErr as { code?: string; message?: string } | null | undefined;
              // Stripe throws payment_intent_unexpected_state when the PI is
              // already canceled (e.g. a retry, or a cron job got there first);
              // that is the outcome we wanted, not a failure. Any other error
              // (network, restricted key, a status that isn't 'canceled') is a
              // real failure: log it, same non-blocking discipline as issueRefund
              // above, the cancellation still proceeds.
              const alreadyCanceled =
                stripeErr?.code === "payment_intent_unexpected_state" &&
                typeof stripeErr?.message === "string" &&
                stripeErr.message.toLowerCase().includes("canceled");
              if (!alreadyCanceled) {
                console.error(
                  `[customer-cancel-money] paymentIntents.cancel failed for booking ${booking.id} (${booking.payment_intent_id}):`,
                  cancelErr,
                );
              }
            }
          }
        } else {
          console.error(`[customer-cancel-money] issueRefund threw for booking ${booking.id}:`, e);
        }
      }
    }
    // feeCents >= remaining means refundCents is 0: no refund, no charge (remaining
    // balance fully absorbed by the fee, or already fully refunded previously).
  } else if (feeCents > 0 && booking.stripe_customer_id && booking.stripe_payment_method_id) {
    try {
      const result = await chargeFee({
        db: admin,
        source: "booking",
        id: booking.id,
        amountCents: feeCents,
        kind: "cancellation",
        actor: "system",
        reason,
      });
      feeChargeStatus = result.status;
      feeChargedCents = result.chargedCents ?? 0;
      feeChargePaymentIntentId = result.paymentIntentId ?? null;
    } catch (e) {
      // NO_SAVED_CARD / INVALID_AMOUNT etc, log, do not fail the cancellation.
      if (e instanceof FeeError) {
        console.error(`[customer-cancel-money] chargeFee skipped for booking ${booking.id} (${e.code}):`, e.message);
      } else {
        console.error(`[customer-cancel-money] chargeFee threw for booking ${booking.id}:`, e);
      }
    }
  }

  return { feeCents, isWithinWindow, refundAmount, feeChargeStatus, feeChargedCents, feeChargePaymentIntentId };
}
