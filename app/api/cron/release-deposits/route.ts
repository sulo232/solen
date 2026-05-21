export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { getServerEnv } from "@/lib/env";

// GET /api/cron/release-deposits
// Daily cron: deposits held > 72h without booking confirmation → release back.
export async function GET(request: NextRequest) {
  const cronSecret = getServerEnv().CRON_SECRET;
  if (!cronSecret) return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminSupabaseClient();
  const cutoff = new Date();
  cutoff.setHours(cutoff.getHours() - 72);
  const cutoffStr = cutoff.toISOString();

  // Find bookings with deposits held > 72h that are still pending
  const { data: staleDeposits } = await admin
    .from("bookings")
    .select("id, user_id, price_paid, salon_id, stripe_payment_intent_id")
    .eq("status", "pending")
    .lt("created_at", cutoffStr)
    .not("stripe_payment_intent_id", "is", null);

  let released = 0;
  let errors = 0;

  for (const booking of staleDeposits ?? []) {
    try {
      // Cancel the booking
      await admin
        .from("bookings")
        .update({
          status: "cancelled",
          cancellation_reason: "Deposit auto-released after 72h without confirmation",
          cancelled_at: new Date().toISOString(),
        })
        .eq("id", booking.id);

      // Free the slot if any
      await admin
        .from("availability_slots")
        .update({ status: "available", booked_by: null, booking_id: null })
        .eq("booking_id", booking.id);

      // Log in audit_log
      await admin.from("audit_log").insert({
        actor_id: null,
        action: "deposit_auto_released",
        target_type: "booking",
        target_id: booking.id,
        metadata: {
          amount: booking.price_paid,
          reason: "72h timeout",
          payment_intent: booking.stripe_payment_intent_id,
        },
      });

      released++;
    } catch {
      errors++;
    }
  }

  return NextResponse.json({ ok: true, released, errors });
}
