export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { getStripe } from "@/lib/stripe";
import { getServerEnv } from "@/lib/env";
import { verifyCronSecret } from "@/lib/cron-auth";
import { withCronRun } from "@/lib/cron-run";
import { alertAdmin } from "@/lib/alert-admin";
import type Stripe from "stripe";

// RING 3a: caps a per-item errors[] array so a bad batch never floods cron_runs.
function capErrors(errs: string[], max = 20): string[] {
  if (errs.length <= max) return errs;
  return [...errs.slice(0, max), `...and ${errs.length - max} more`];
}

// GET /api/cron/release-deposits
// Daily cron: deposits held > 72h without booking confirmation → release back.
export async function GET(request: NextRequest) {
  const cronSecret = getServerEnv().CRON_SECRET;
  if (!cronSecret) return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });
  const authHeader = request.headers.get("authorization");
  if (!(await verifyCronSecret(authHeader, cronSecret))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return withCronRun("release-deposits", async () => {
  const admin = createAdminSupabaseClient();
  const cutoff = new Date();
  cutoff.setHours(cutoff.getHours() - 72);
  const cutoffStr = cutoff.toISOString();

  // Find bookings with deposits held > 72h that are still pending. Bounded batch
  // (mirrors abandon-sweep / release-payments) so a large backlog never blocks the run.
  const { data: staleDeposits, error: staleDepositsError } = await admin
    .from("bookings")
    .select("id, user_id, price_paid, salon_id, payment_intent_id")
    .eq("status", "pending")
    .lt("created_at", cutoffStr)
    .not("payment_intent_id", "is", null)
    .limit(50);

  if (staleDepositsError) console.error("[cron/release-deposits] stale deposits query error:", staleDepositsError.message);

  let released = 0;
  const errorMsgs: string[] = [];

  for (const booking of staleDeposits ?? []) {
    try {
      // The query above already filters .not("payment_intent_id", "is", null), so this
      // is always present here; this narrows the type to match (release-payments pattern).
      if (!booking.payment_intent_id) continue;

      // 0. Void (or refund) the held deposit BEFORE cancelling the booking, so the
      // customer's money is never left held while the booking shows cancelled. The
      // live PI status is the source of truth: an uncaptured hold is voided with
      // paymentIntents.cancel; a hold that somehow already captured (payment_status
      // advanced without the booking itself ever confirming) is refunded instead.
      // Only proceed to cancel + free the slot below once the money is actually back
      // with the customer, or was already back (canceled or refunded).
      const pi = await getStripe().paymentIntents.retrieve(booking.payment_intent_id, {
        expand: ["latest_charge"],
      });

      if (pi.status === "processing") {
        // Mid-capture/transfer, do not fight Stripe's in-flight state. Leave this
        // booking for the next run rather than cancel it while money is moving.
        errorMsgs.push(`booking ${booking.id}: PI still processing, deferred`);
        continue;
      }

      if (pi.status === "succeeded") {
        const charge = pi.latest_charge as Stripe.Charge | null;
        if (!charge?.refunded) {
          // Deliberately NOT routed through lib/bookings/issue-refund.ts: that
          // chokepoint requires payment_status 'paid'/'partially_refunded' (a
          // confirmed, paid booking) and throws NOT_CAPTURED otherwise, this booking
          // never reached that state (it's a stale hold whose PI captured without the
          // booking ever confirming), so there is no paid_amount/refunded_amount
          // ledger for it to reconcile. Mirror the Connect params issueRefund uses
          // (reverse_transfer + refund_application_fee) straight off the live PI, so
          // a Connect-routed deposit doesn't leave the salon holding transferred
          // funds while the platform eats the refund.
          const refundParams: Stripe.RefundCreateParams = { payment_intent: booking.payment_intent_id };
          if (pi.transfer_data?.destination) {
            refundParams.reverse_transfer = true;
            if (pi.application_fee_amount) refundParams.refund_application_fee = true;
          }
          try {
            await getStripe().refunds.create(refundParams);
          } catch (refundErr) {
            console.error(`[cron/release-deposits] refund failed for booking ${booking.id} (${booking.payment_intent_id}):`, refundErr);
            void alertAdmin("release-deposits: refund failed", {
              booking_id: booking.id,
              payment_intent: booking.payment_intent_id,
              error: refundErr instanceof Error ? refundErr.message : String(refundErr),
            });
            errorMsgs.push(`booking ${booking.id}: refund failed: ${refundErr instanceof Error ? refundErr.message : String(refundErr)}`);
            continue;
          }
        }
      } else if (pi.status !== "canceled") {
        // requires_payment_method / requires_confirmation / requires_action /
        // requires_capture, the hold was never captured, void it.
        try {
          await getStripe().paymentIntents.cancel(booking.payment_intent_id);
        } catch (cancelErr) {
          console.error(`[cron/release-deposits] PI cancel failed for booking ${booking.id} (${booking.payment_intent_id}):`, cancelErr);
          void alertAdmin("release-deposits: PI cancel failed", {
            booking_id: booking.id,
            payment_intent: booking.payment_intent_id,
            error: cancelErr instanceof Error ? cancelErr.message : String(cancelErr),
          });
          errorMsgs.push(`booking ${booking.id}: PI cancel failed: ${cancelErr instanceof Error ? cancelErr.message : String(cancelErr)}`);
          continue;
        }
      }
      // pi.status === "canceled": already voided, nothing to do here.

      // 1. Cancel the booking. Re-assert it's still the same stale-pending row
      // selected above (status + payment_intent_id) so a booking that advanced
      // (confirmed or cancelled elsewhere) between the SELECT and now is never
      // clobbered, and the slot-free / audit steps below never fire for a row we
      // didn't actually touch.
      const { data: updRows, error: cancelErr } = await admin
        .from("bookings")
        .update({
          status: "cancelled",
          cancellation_reason: "Deposit auto-released after 72h without confirmation",
          cancelled_at: new Date().toISOString(),
        })
        .eq("id", booking.id)
        .eq("status", "pending")
        .not("payment_intent_id", "is", null)
        .select("id");
      if (cancelErr) throw cancelErr;

      if (!updRows || updRows.length === 0) {
        // 0 rows matched: the booking already advanced between our SELECT and now
        // (webhook confirmed it, or it was cancelled some other way). The deposit
        // was already voided/refunded above either way, so nothing is left held;
        // just skip the slot-free/audit steps for a row we didn't touch.
        continue;
      }

      // Free the slot if any
      const { error: slotErr } = await admin
        .from("availability_slots")
        .update({ status: "available", booked_by: null, booking_id: null })
        .eq("booking_id", booking.id);
      if (slotErr) throw slotErr;

      // Log in audit_log
      const { error: auditErr } = await admin.from("audit_log").insert({
        actor_id: null,
        action: "deposit_auto_released",
        target_type: "booking",
        target_id: booking.id,
        metadata: {
          amount: booking.price_paid,
          reason: "72h timeout",
          payment_intent: booking.payment_intent_id,
        },
      });
      if (auditErr) throw auditErr;

      released++;
    } catch (err) {
      console.error(`[cron/release-deposits] unexpected error for booking ${booking.id}:`, err);
      errorMsgs.push(`booking ${booking.id}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return { ok: true, released, errors: capErrors(errorMsgs), processed: released };
  });
}
