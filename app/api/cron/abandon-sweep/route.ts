export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { getStripe } from "@/lib/stripe";
import { getServerEnv } from "@/lib/env";

// Cron: Abandonment sweeper (C1 online-pay). Every 15 min.
//
// The C1 full-prepay flow (POST /api/bookings with payment_method:"online")
// creates the booking row FIRST as status:"pending" + payment_status:"none",
// then the FE calls POST /api/stripe/booking-pay-intent, which stamps
// payment_intent_id onto the row. The Stripe webhook flips it to
// status:"confirmed" + payment_status:"paid" on payment_intent.succeeded.
//
// An ABANDONED online booking = the customer never finished paying:
//   - status:"pending" + payment_status:"none" older than ~30 min, AND
//   - either no PI was ever created (FE closed the tab before the pay step), or
//   - a PI was stamped but it never succeeded (still requires_payment_method /
//     requires_confirmation, or was canceled).
//
// Why a sweeper is needed even though the webhook already releases on
// payment_intent.payment_failed: a customer who simply closes the tab produces
// NO Stripe event — the PI sits in requires_payment_method forever and the slot
// stays held. pending-timeout only targets status:"pending_approval" (the
// request-to-book/approval flow), so it does NOT cover this case.
//
// This cancels those abandoned bookings (status->"cancelled", payment_status
// stays "none") and frees the held slot. It NEVER cancels a booking whose PI
// succeeded or that is already paid/confirmed — the Stripe PI status is the
// source of truth there, double-checked live before each cancel.
export async function GET(req: NextRequest) {
  const cronSecret = getServerEnv().CRON_SECRET;
  if (!cronSecret) return NextResponse.json({ error: "Cron not configured" }, { status: 503 });
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminSupabaseClient();
  const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

  // Abandoned online bookings: pending + unpaid + older than 30 min. Bounded batch.
  const { data: stale, error: selErr } = await admin
    .from("bookings")
    .select("id, slot_id, payment_intent_id")
    .eq("status", "pending")
    .eq("payment_status", "none")
    .lt("created_at", thirtyMinAgo)
    .limit(50);

  if (selErr) {
    console.error("[cron/abandon-sweep] failed to load stale bookings:", selErr);
    return NextResponse.json({ error: "Query failed" }, { status: 500 });
  }

  let cancelled = 0;
  let skippedPaid = 0; // PI actually succeeded/in-flight — webhook will (or did) confirm it.
  let errors = 0;

  for (const booking of stale ?? []) {
    try {
      // If a PI was stamped, the live PI status is the source of truth. Never
      // cancel a booking whose money already moved (or is mid-capture) just
      // because the webhook hasn't flipped the row yet.
      if (booking.payment_intent_id) {
        let piStatus: string | null = null;
        try {
          const pi = await getStripe().paymentIntents.retrieve(booking.payment_intent_id);
          piStatus = pi.status;
        } catch (err) {
          // PI lookup failed (e.g. deleted/unknown id). Log and skip this row —
          // do NOT cancel on uncertainty about whether money moved.
          console.error(`[cron/abandon-sweep] PI retrieve failed for booking ${booking.id} (${booking.payment_intent_id}):`, err);
          errors++;
          continue;
        }
        // Anything that means money moved or is moving -> leave it for the webhook.
        if (
          piStatus === "succeeded" ||
          piStatus === "processing" ||
          piStatus === "requires_capture"
        ) {
          skippedPaid++;
          continue;
        }
        // requires_payment_method / requires_confirmation / requires_action /
        // canceled -> genuinely abandoned, fall through to cancel + free slot.
      }

      // 1. Cancel the booking. payment_status stays "none" (no money moved).
      const { error: updErr } = await admin
        .from("bookings")
        .update({
          status: "cancelled",
          cancellation_reason: "abandoned_payment_timeout",
          cancelled_at: new Date().toISOString(),
        })
        .eq("id", booking.id)
        // Re-assert the guard in the WHERE clause: only flip a row that is STILL
        // pending+none. If the webhook confirmed it between our SELECT and now,
        // this matches 0 rows and we don't clobber a paid booking.
        .eq("status", "pending")
        .eq("payment_status", "none");

      if (updErr) {
        console.error(`[cron/abandon-sweep] failed to cancel booking ${booking.id}:`, updErr);
        errors++;
        continue;
      }

      // 2. Free the held slot (same shape as pending-timeout).
      if (booking.slot_id) {
        const { error: slotErr } = await admin
          .from("availability_slots")
          .update({ status: "available", booked_by: null, booking_id: null })
          .eq("id", booking.slot_id);
        if (slotErr) {
          console.error(`[cron/abandon-sweep] failed to free slot ${booking.slot_id} for booking ${booking.id}:`, slotErr);
          errors++;
          // Booking is already cancelled; surface the slot error but keep going.
        }
      }

      cancelled++;
    } catch (err) {
      console.error(`[cron/abandon-sweep] unexpected error for booking ${booking.id}:`, err);
      errors++;
    }
  }

  return NextResponse.json({
    scanned: (stale ?? []).length,
    cancelled,
    skippedPaid,
    errors,
  });
}
