export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { sendEmail, bookingCancellation } from "@/lib/email";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  for (const booking of pendingBookings ?? []) {
    // 1. Update status
    await admin
      .from("bookings")
      .update({
        status: "cancelled",
        cancellation_reason: "automatic_timeout_no_response",
        cancelled_at: new Date().toISOString(),
      })
      .eq("id", booking.id);

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
              service: booking.services?.name_de ?? "Service",
              salon: booking.salons?.name ?? "Salon",
              date: new Date(booking.starts_at).toLocaleDateString("de-CH"),
            },
            locale
          )
        );
      } catch { /* ignore */ }
    }

    // Since they were pending approval, payment was likely held/authorized, so we might need to cancel Stripe intent
    // But standard Stripe holds expire naturally after 7 days if uncaptured, or we could cancel explicitly:
    if (booking.payment_intent_id) {
      try {
        const Stripe = (await import("stripe")).default;
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-02-25.clover" });
        await stripe.paymentIntents.cancel(booking.payment_intent_id).catch((err) => console.error("[CronPendingTimeout] failed to cancel Stripe payment intent:", err));
      } catch { /* ignore */ }
    }

    cancelled++;
  }

  return NextResponse.json({ cancelled });
}
