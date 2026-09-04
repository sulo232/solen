export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { sendEmail, bookingCancellation } from "@/lib/email";
import { getServerEnv } from "@/lib/env";
import { verifyCronSecret } from "@/lib/cron-auth";
import { withCronRun } from "@/lib/cron-run";
import { resolveSwissLocale } from "@/lib/format";
import { issueRefund } from "@/lib/bookings/issue-refund";
import { localizedField } from "@/lib/i18n/localized-field";

export async function GET(req: NextRequest) {
  const cronSecret = getServerEnv().CRON_SECRET;
  if (!cronSecret) return NextResponse.json({ error: "Cron not configured" }, { status: 503 });
  const authHeader = req.headers.get("authorization");
  if (!(await verifyCronSecret(authHeader, cronSecret))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return withCronRun("pending-timeout", async () => {
  const admin = createAdminSupabaseClient();
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // Find bookings in pending_approval older than 24 hours
  const { data: pendingBookings } = await admin
    .from("bookings")
    .select("*, salons(*), services(*), profiles(*)")
    .eq("status", "pending_approval")
    .lt("created_at", twentyFourHoursAgo)
    .limit(50);

  let cancelled = 0;
  const errors: string[] = [];

  for (const booking of pendingBookings ?? []) {
    // 1. Update status. Re-assert status="pending_approval" in the WHERE, select the
    // changed row back, and skip if it did not match, so a booking the salon approved
    // between the SELECT above and this UPDATE is never clobbered back to cancelled.
    const { data: cancelledRow } = await admin
      .from("bookings")
      .update({
        status: "cancelled",
        cancellation_reason: "automatic_timeout_no_response",
        cancelled_at: new Date().toISOString(),
      })
      .eq("id", booking.id)
      .eq("status", "pending_approval")
      .select("id")
      .maybeSingle();

    if (!cancelledRow) {
      console.error(`[cron/pending-timeout] booking ${booking.id} no longer pending_approval (changed between select and update), skipping`);
      continue;
    }

    // 2. Free the slot
    await admin
      .from("availability_slots")
      .update({ status: "available", booked_by: null, booking_id: null })
      .eq("id", booking.slot_id);

    // 3. Notify customer
    const userEmail = (booking.profiles as any)?.email;
    const locale = (booking.profiles as any)?.locale ?? "de";
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
            locale
          )
        );
      } catch (err) { console.error("[cron/pending-timeout] cancellation email failed:", err); }
    }

    // Since they were pending approval, payment was likely held/authorized. Check the live
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
            console.error("[cron/pending-timeout] failed to cancel Stripe payment intent:", err);
            errors.push(`booking ${booking.id}: Stripe cancel failed: ${err instanceof Error ? err.message : String(err)}`);
          });
        } else if (intent.status === "succeeded") {
          const paidCents = (booking.paid_amount as number | null) ?? 0;
          const alreadyRefunded = (booking.refunded_amount as number | null) ?? 0;
          const refundCents = paidCents - alreadyRefunded;
          if (refundCents > 0) {
            try {
              await issueRefund({
                db: admin,
                source: "booking",
                id: booking.id,
                amountCents: refundCents,
                actor: "system",
                reason: "automatic_timeout_no_response: PI already captured, refunding instead of cancel",
              });
            } catch (refundErr) {
              console.error(`[cron/pending-timeout] failed to refund captured payment for booking ${booking.id}:`, refundErr);
              errors.push(`booking ${booking.id}: refund failed: ${refundErr instanceof Error ? refundErr.message : String(refundErr)}`);
            }
          }
        }
      } catch (err) {
        console.error("[cron/pending-timeout] failed to retrieve/cancel Stripe payment intent:", err);
        errors.push(`booking ${booking.id}: Stripe retrieve/cancel failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    cancelled++;
  }

  return { cancelled, processed: cancelled, errors };
  });
}
