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

import type { NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { calculateCancellationFee } from "@/lib/cancellation-policy";
import { toRappen, getStripe } from "@/lib/stripe";
import { chargeFee, FeeError, type ChargeFeeResult } from "@/lib/bookings/charge-fee";
import { issueRefund, RefundError } from "@/lib/bookings/issue-refund";
import { sendFeePaymentIssueEmail } from "@/lib/email";
import { buildFeePayUrl } from "@/lib/bookings/fee-pay-link";
import { localizedField } from "@/lib/i18n/localized-field";

async function notifyLateCancelFeePaymentIssue(
  admin: SupabaseClient,
  bookingId: string,
  feeCents: number,
): Promise<void> {
  const { data: bk } = await admin
    .from("bookings")
    .select("user_id, guest_email, starts_at, services(name_de, name_en, name_fr, name_it), salons(name)")
    .eq("id", bookingId)
    .maybeSingle();
  const booking = bk as Record<string, any> | null;
  if (!booking) {
    console.error(`[customer-cancel-money] payment-issue email: booking ${bookingId} not found`);
    return;
  }
  const salonName = (booking.salons as { name?: string } | null)?.name ?? "Salon";
  const services = booking.services as Record<string, string | null> | null;
  const userId = (booking.user_id as string | null) ?? null;

  let locale = "de";
  if (userId) {
    const { data: profile } = await admin.from("profiles").select("locale").eq("id", userId).maybeSingle();
    locale = (profile?.locale as string) ?? "de";
  }
  const serviceName = localizedField(services, "name", locale) || "Service";
  const payUrl = buildFeePayUrl(locale, bookingId, "cancellation");

  await sendFeePaymentIssueEmail({
    admin,
    userId,
    guestEmail: (booking.guest_email as string | null) ?? null,
    serviceName,
    salonName,
    feeCents,
    date: (booking.starts_at as string | null) ?? new Date().toISOString(),
    payUrl,
    kind: "cancellation",
    logPrefix: "customer-cancel-money",
  });
}

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

/** Shape of `bookings.policy_snapshot`, frozen once at booking time
 * (app/api/bookings/route.ts ~488, `policySnapshot`). Only the cancellation
 * fields are read here; the no-show fields live on the same JSON object. */
export interface CustomerCancelPolicySnapshot {
  cancellation_fee_type?: string | null;
  cancellation_fee_value?: number | null;
  free_cancel_hours?: number | null;
}

/**
 * Resolve the policy to BILL a customer cancel against: the terms frozen on the
 * booking at booking time (bookings.policy_snapshot), never the salon's CURRENT
 * live policy. A salon that tightens its cancellation terms after the booking was
 * made must not retroactively charge a customer on terms they never agreed to.
 * Mirrors the no-show cron's own snapshot-first pattern
 * (app/api/cron/no-show/route.ts ~76-86): snapshot field wins when present,
 * per-field fallback to the live salon otherwise, one warn log when the snapshot
 * itself is missing/malformed (legacy pre-snapshot bookings).
 *
 * Every customer-cancel read site (the canonical /cancel route's GET preview +
 * POST, and the public HMAC quick-action cancel link) must resolve through this
 * before calling calculateCancellationFee / applyCustomerCancelMoney, so the
 * preview a customer sees and the fee they're actually charged can never disagree.
 */
export function resolveCustomerCancelPolicy(
  bookingId: string,
  snapshot: CustomerCancelPolicySnapshot | null | undefined,
  liveSalon: CustomerCancelSalonPolicy | null,
): CustomerCancelSalonPolicy {
  const wellFormed = snapshot != null && typeof snapshot === "object";
  if (!wellFormed) {
    console.warn(`[cancel] no policy_snapshot on booking ${bookingId}, billing on live salon policy`);
  }
  return {
    cancellation_fee_type:
      (wellFormed ? snapshot!.cancellation_fee_type : undefined) ?? liveSalon?.cancellation_fee_type ?? null,
    cancellation_fee_value:
      (wellFormed ? snapshot!.cancellation_fee_value : undefined) ?? liveSalon?.cancellation_fee_value ?? null,
    free_cancel_hours:
      (wellFormed ? snapshot!.free_cancel_hours : undefined) ?? liveSalon?.free_cancel_hours ?? 24,
  };
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
  auditContext?: { request: NextRequest; userId: string | null },
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

  // GENUINE uncaptured-hold release. payment_status === 'deposit_held' is the only
  // hold-only status written in this repo (app/api/stripe/webhook/route.ts ~232-234,
  // the async payment_intent.succeeded delivery for a manual-capture booking PI, and
  // lib/barber/walkin-ticket.ts ~278-281, the paid walk-in queue flow); neither write
  // site ever sets paid_amount, and the only two writers of paid_amount
  // (app/api/stripe/webhook/route.ts ~163-172 and app/api/cron/pre-charge/route.ts
  // ~135-141) both set it in the SAME update that flips payment_status to 'paid'. So
  // wasPrepaid above is always false for a deposit_held booking and the refund branch
  // below never runs for it. Left alone, the hold only releases on Stripe's own ~7-day
  // authorization expiry; a customer cancel must release it now. Gated on the
  // booking's ACTUAL state, not nested inside issueRefund's NOT_CAPTURED error (that
  // branch never sees this booking, since it never has paid_amount to trigger a
  // refund attempt in the first place). !wasPrepaid guard is defensive: the two
  // states are mutually exclusive by every writer above, but this keeps the refund
  // path and the hold-release path from ever both firing on the same booking.
  const isUncapturedHold =
    !wasPrepaid && booking.payment_status === "deposit_held" && !!booking.payment_intent_id;

  if (isUncapturedHold && booking.payment_intent_id) {
    const releaseHoldStatus = async () => {
      // 'none' mirrors the existing convention this repo already uses for "no money
      // held, no money paid" after a pre-capture PaymentIntent is voided (the
      // payment_intent.payment_failed handler, app/api/stripe/webhook/route.ts
      // ~529-535); there is no separate 'released'/'cancelled' payment_status value
      // anywhere in the codebase, so this reuses that one instead of inventing a new
      // one. CAS guard (.eq payment_status + .select().maybeSingle()): only downgrade
      // from 'deposit_held', and confirm the update actually matched a row, so a
      // webhook that captured this PI in the same race window is never clobbered and
      // a lost race is visible instead of silently reporting success.
      const { data: releasedRow, error: releaseErr } = await admin
        .from("bookings")
        .update({ payment_status: "none" })
        .eq("id", booking.id)
        .eq("payment_status", "deposit_held")
        .select("id")
        .maybeSingle();
      if (releaseErr) {
        console.error(`[customer-cancel-money] hold-release payment_status update failed for booking ${booking.id}:`, releaseErr.message);
      } else if (!releasedRow) {
        // 0 rows matched: the booking's payment_status already moved off 'deposit_held'
        // between the read that produced `booking` and this update (e.g. a concurrent
        // webhook captured it). The PaymentIntent cancel above either succeeded (in
        // which case Stripe itself is now the source of truth) or was a no-op against
        // an already-different PI state; either way this is not a silent failure the
        // caller needs to know about, just not the row we thought we were updating.
        console.error(`[customer-cancel-money] hold-release skipped for booking ${booking.id}: payment_status was no longer 'deposit_held'`);
      }
    };

    try {
      await getStripe().paymentIntents.cancel(booking.payment_intent_id, {
        cancellation_reason: "requested_by_customer",
      });
      await releaseHoldStatus();
    } catch (cancelErr) {
      const stripeErr = cancelErr as { code?: string; message?: string } | null | undefined;
      // Stripe throws payment_intent_unexpected_state when the PI is already
      // canceled (a retry, or the release-deposits/release-payments cron got there
      // first); that is the outcome we wanted, not a failure, so the booking still
      // gets marked released. Any other error (network, restricted key, a status
      // that isn't 'canceled') is a real failure: log it, non-blocking, same
      // discipline as issueRefund/chargeFee above, the cancellation still proceeds
      // and the hold stays 'deposit_held' for the release-deposits cron backstop.
      const alreadyCanceled =
        stripeErr?.code === "payment_intent_unexpected_state" &&
        typeof stripeErr?.message === "string" &&
        stripeErr.message.toLowerCase().includes("canceled");
      if (alreadyCanceled) {
        await releaseHoldStatus();
      } else {
        console.error(
          `[customer-cancel-money] paymentIntents.cancel failed for booking ${booking.id} (${booking.payment_intent_id}):`,
          cancelErr,
        );
      }
    }
  }

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
          // A NOT_CAPTURED throw here would mean issueRefund saw an uncaptured
          // PaymentIntent, but that can only happen via a corrupted paid_amount
          // (wasPrepaid, which gates this whole branch, requires paid_amount > 0,
          // and no writer in this repo ever sets paid_amount on a genuine
          // uncaptured hold, see isUncapturedHold above, which owns releasing
          // those). Nothing else to do here beyond the log above.
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
        actor: auditContext ? "customer" : "system",
        actorUserId: auditContext?.userId,
        request: auditContext?.request,
        reason,
      });
      feeChargeStatus = result.status;
      feeChargedCents = result.chargedCents ?? 0;
      feeChargePaymentIntentId = result.paymentIntentId ?? null;
      if ((result.status === "failed" && result.declined) || result.status === "requires_action") {
        await notifyLateCancelFeePaymentIssue(admin, booking.id, feeCents).catch((err) => {
          console.error(`[customer-cancel-money] payment-issue email failed for booking ${booking.id}:`, err);
        });
      }
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
