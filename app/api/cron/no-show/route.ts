export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminSupabaseClient();
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Find confirmed bookings ended over 24h ago
  const { data: overdues } = await admin
    .from("bookings")
    .select("id, user_id, salon_id, stripe_payment_intent_id, status")
    .eq("status", "confirmed")
    .lt("ends_at", twentyFourHoursAgo)
    .gt("ends_at", sevenDaysAgo)
    .limit(50);

  let processed = 0;

  for (const booking of overdues ?? []) {
    // 1. Mark as no_show
    await admin
      .from("bookings")
      .update({ status: "no_show", cancelled_at: now.toISOString() })
      .eq("id", booking.id);

    // 2. Capture payment if held (no_show = 100% fee)
    if (booking.stripe_payment_intent_id) {
      try {
        const Stripe = (await import("stripe")).default;
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-02-25.clover" });
        const pi = await stripe.paymentIntents.retrieve(booking.stripe_payment_intent_id);
        if (pi.status === "requires_capture") {
          await stripe.paymentIntents.capture(booking.stripe_payment_intent_id);
          await admin.from("bookings").update({ payment_status: "paid" }).eq("id", booking.id);
        }
      } catch (err) {
        console.error("Failed to capture no_show payment", err);
      }
    }

    // 3. Increment customer no_show_count
    const { data: profile } = await admin.from("profiles").select("no_show_count").eq("id", booking.user_id).single();
    const newCount = (profile?.no_show_count ?? 0) + 1;
    await admin.from("profiles").update({ no_show_count: newCount }).eq("id", booking.user_id);

    // 4. Warning if > 3
    if (newCount >= 3) {
      try {
        const { logAuditEvent } = await import("@/lib/audit");
        await logAuditEvent(req, "system", "customer_excessive_no_shows", "user", booking.user_id, { count: newCount });
      } catch { /* ignore */ }
    }

    processed++;
  }

  return NextResponse.json({ processed });
}
