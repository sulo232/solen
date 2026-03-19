export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { getStripe, toRappen } from "@/lib/stripe";

/**
 * Cron: Late cancellation fee processor
 * Runs every 30 minutes. Checks for bookings cancelled within the salon's
 * cancellation_hours window and charges the late_cancel_fee_percent.
 *
 * Only applies to bookings that had a Stripe PaymentIntent (prepay/deposit modes).
 */
export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminSupabaseClient();

  // Find recently cancelled bookings that:
  // 1. Were cancelled within the cancellation window (late cancel)
  // 2. Have not been charged a late fee yet
  // 3. Have a stripe_payment_intent_id
  const { data: lateCancels, error } = await admin
    .from("bookings")
    .select("id, salon_id, price_paid, stripe_payment_intent_id, cancelled_at, starts_at, salons(cancellation_hours, late_cancel_fee_percent, payment_mode)")
    .eq("status", "cancelled")
    .eq("late_fee_charged", false)
    .not("stripe_payment_intent_id", "is", null)
    .not("cancelled_at", "is", null);

  if (error || !lateCancels?.length) {
    return NextResponse.json({ processed: 0, message: error?.message ?? "No late cancellations found" });
  }

  let processed = 0;
  const stripe = getStripe();

  for (const booking of lateCancels) {
    try {
      const salon = (booking as any).salons;
      if (!salon || salon.payment_mode === "at_salon") continue;

      const cancellationHours = salon.cancellation_hours ?? 24;
      const lateFeePercent = salon.late_cancel_fee_percent ?? 50;

      const cancelledAt = new Date(booking.cancelled_at!);
      const startsAt = new Date(booking.starts_at);
      const hoursBeforeStart = (startsAt.getTime() - cancelledAt.getTime()) / (1000 * 60 * 60);

      // Only charge if cancelled within the cancellation window
      if (hoursBeforeStart >= cancellationHours) continue;

      // Calculate fee
      const feeAmount = Math.round(booking.price_paid * (lateFeePercent / 100) * 100) / 100;
      if (feeAmount <= 0) continue;

      // Capture the fee from the held PaymentIntent
      const pi = await stripe.paymentIntents.retrieve(booking.stripe_payment_intent_id!);

      if (pi.status === "requires_capture") {
        // Capture only the fee amount (partial capture)
        await stripe.paymentIntents.capture(booking.stripe_payment_intent_id!, {
          amount_to_capture: toRappen(feeAmount),
        });
      }
      // If already captured (prepay mode), no additional charge needed

      // Mark as charged
      await admin
        .from("bookings")
        .update({ late_fee_charged: true, late_fee_amount: feeAmount })
        .eq("id", booking.id);

      processed++;
    } catch (err) {
      console.error(`[late-cancel] Failed to process booking ${booking.id}:`, err);
    }
  }

  return NextResponse.json({ processed, total: lateCancels.length });
}
