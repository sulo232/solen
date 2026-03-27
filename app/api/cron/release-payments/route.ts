export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import Stripe from "stripe";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-02-25.clover" });
}

// Cron: Release (capture) payments 24h after booking completion. Every hour.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminSupabaseClient();
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // Find completed bookings with uncaptured payments
  const { data: bookings } = await admin
    .from("bookings")
    .select("id, payment_intent_id, paid_amount, salon_id")
    .eq("status", "completed")
    .eq("payment_status", "deposit_held")
    .not("payment_intent_id", "is", null)
    .lt("completed_at", twentyFourHoursAgo)
    .neq("paid_via", "walk_in")
    .limit(50);

  let released = 0;
  let failed = 0;

  for (const booking of bookings ?? []) {
    try {
      await getStripe().paymentIntents.capture(booking.payment_intent_id);

      await admin
        .from("bookings")
        .update({ payment_status: "paid" })
        .eq("id", booking.id);

      // Audit log
      await admin.from("audit_log").insert({
        action: "payment_released",
        target_type: "booking",
        target_id: booking.id,
        metadata: { amount: booking.paid_amount, payment_intent_id: booking.payment_intent_id },
      });

      released++;
    } catch (err: any) {
      console.error(`[release-payments] Failed for booking ${booking.id}:`, err.message);
      failed++;
    }
  }

  return NextResponse.json({ released, failed });
}
