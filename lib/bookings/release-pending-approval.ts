// lib/bookings/release-pending-approval.ts
//
// Ends a manual-approval booking that the salon never confirmed: flips it from
// pending_approval to cancelled (CAS), frees the slot, emails the customer and releases the
// held money. Shared by the 24h auto-timeout cron (/api/cron/pending-timeout) and the salon
// owner's Decline button (/api/bookings/[id]/decline), so both paths release money the same way.

import type { SupabaseClient } from "@supabase/supabase-js";
import { sendEmail, bookingCancellation } from "@/lib/email";
import { resolveSwissLocale } from "@/lib/format";
import { issueRefund, RefundError } from "@/lib/bookings/issue-refund";
import { alertAdmin } from "@/lib/alert-admin";
import { localizedField } from "@/lib/i18n/localized-field";

export interface PendingApprovalBooking {
  id: string;
  slot_id: string | null;
  starts_at: string;
  payment_intent_id: string | null;
  paid_amount: number | null;
  refunded_amount: number | null;
  salons?: { name?: string | null } | null;
  services?: Record<string, unknown> | null;
  profiles?: { email?: string | null; locale?: string | null } | null;
}

export interface ReleaseResult {
  /** false when the booking was no longer pending_approval (lost the CAS); nothing else ran. */
  released: boolean;
  errors: string[];
}

export async function releasePendingApproval(
  admin: SupabaseClient,
  booking: PendingApprovalBooking,
  opts: { reason: string; actor: "salon" | "system"; logTag: string },
): Promise<ReleaseResult> {
  const { reason, actor, logTag } = opts;
  const errors: string[] = [];

  // 1. Update status. Re-assert status="pending_approval" in the WHERE, select the
  // changed row back, and skip if it did not match, so a booking approved between the
  // caller's read and this UPDATE is never clobbered back to cancelled.
  const { data: cancelledRow } = await admin
    .from("bookings")
    .update({
      status: "cancelled",
      cancellation_reason: reason,
      cancelled_at: new Date().toISOString(),
    })
    .eq("id", booking.id)
    .eq("status", "pending_approval")
    .select("id")
    .maybeSingle();

  if (!cancelledRow) {
    console.error(`[${logTag}] booking ${booking.id} no longer pending_approval (changed between select and update), skipping`);
    return { released: false, errors };
  }

  // 2. Free the slot
  await admin
    .from("availability_slots")
    .update({ status: "available", booked_by: null, booking_id: null })
    .eq("id", booking.slot_id);

  // 3. Notify customer
  const userEmail = booking.profiles?.email;
  const locale = booking.profiles?.locale ?? "de";
  if (userEmail) {
    try {
      await sendEmail(
        bookingCancellation(
          userEmail,
          {
            service: localizedField(booking.services, "name", locale) || "Service",
            salon: booking.salons?.name ?? "Salon",
            date: new Date(booking.starts_at).toLocaleDateString(resolveSwissLocale(locale)),
          },
          locale as Parameters<typeof bookingCancellation>[2],
        ),
      );
    } catch (err) { console.error(`[${logTag}] cancellation email failed:`, err); }
  }

  // 4. Since they were pending approval, payment was likely held/authorized. Check the live
  // PI status first: only requires_capture / requires_confirmation / requires_payment_method
  // are cancellable. If it already succeeded (a full-prepay booking's money was captured),
  // cancelling would throw and, worse, leave the customer cancelled-but-charged, so route
  // that case through the canonical refund chokepoint (lib/bookings/issue-refund.ts) instead.
  if (booking.payment_intent_id) {
    try {
      const { getStripe } = await import("@/lib/stripe");
      const stripe = getStripe();
      const intent = await stripe.paymentIntents.retrieve(booking.payment_intent_id);

      if (
        intent.status === "requires_capture" ||
        intent.status === "requires_confirmation" ||
        intent.status === "requires_payment_method"
      ) {
        await stripe.paymentIntents.cancel(booking.payment_intent_id).catch((err) => {
          console.error(`[${logTag}] failed to cancel Stripe payment intent:`, err);
          errors.push(`booking ${booking.id}: Stripe cancel failed: ${err instanceof Error ? err.message : String(err)}`);
        });
      } else if (intent.status === "succeeded") {
        const paidCents = booking.paid_amount ?? 0;
        const alreadyRefunded = booking.refunded_amount ?? 0;
        const refundCents = paidCents - alreadyRefunded;
        if (refundCents > 0) {
          const refund = () => issueRefund({
            db: admin,
            source: "booking",
            id: booking.id,
            amountCents: refundCents,
            actor,
            reason: `${reason}: PI already captured, refunding instead of cancel`,
          });
          try {
            try {
              await refund();
            } catch (firstErr) {
              // A concurrent refund held the claim; one retry after it settles.
              if (firstErr instanceof RefundError && firstErr.code === "CONCURRENT_RETRY") await refund();
              else throw firstErr;
            }
          } catch (refundErr) {
            console.error(`[${logTag}] failed to refund captured payment for booking ${booking.id}:`, refundErr);
            errors.push(`booking ${booking.id}: refund failed: ${refundErr instanceof Error ? refundErr.message : String(refundErr)}`);
          }
        }
      }
    } catch (err) {
      console.error(`[${logTag}] failed to retrieve/cancel Stripe payment intent:`, err);
      errors.push(`booking ${booking.id}: Stripe retrieve/cancel failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // The booking is already cancelled, so neither caller will pick it up again: a failed
  // void/refund here would leave the customer charged with only a log line. Alert the admin
  // so the money is released by hand (e.g. NOT_CAPTURED during webhook lag).
  if (errors.length > 0) {
    await alertAdmin("Pending-request money release failed", {
      bookingId: booking.id,
      paymentIntentId: booking.payment_intent_id,
      reason,
      actor,
      errors,
    });
  }

  return { released: true, errors };
}
