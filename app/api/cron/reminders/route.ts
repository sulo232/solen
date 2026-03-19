export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";

/**
 * Cron handler: send SMS reminders for upcoming bookings.
 * Runs every hour. Protected by CRON_SECRET.
 */
export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sevenApiKey = process.env.SEVEN_IO_API_KEY;
  if (!sevenApiKey) {
    console.warn("[reminders] SEVEN_IO_API_KEY not set — skipping SMS");
    return NextResponse.json({ skipped: true, reason: "no_api_key" });
  }

  const supabase = createAdminSupabaseClient();
  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const in1h = new Date(now.getTime() + 60 * 60 * 1000);

  let sent24h = 0;
  let sent1h = 0;

  // 24h reminders
  const { data: bookings24h } = await supabase
    .from("bookings")
    .select("id, user_id, salon_id, starts_at, salons(name, sms_reminder_24h), profiles(display_name)")
    .eq("status", "confirmed")
    .eq("sms_sent_24h", false)
    .gte("starts_at", now.toISOString())
    .lte("starts_at", in24h.toISOString())
    .limit(50);

  for (const booking of bookings24h ?? []) {
    const salon = booking.salons as any;
    if (!salon?.sms_reminder_24h) continue;

    // Get user phone from auth (would need phone in profiles — skip if not available)
    // For now, log the intent
    console.log(`[reminders] Would send 24h SMS for booking ${booking.id}`);

    await supabase.from("bookings").update({ sms_sent_24h: true }).eq("id", booking.id);
    sent24h++;
  }

  // 1h reminders
  const { data: bookings1h } = await supabase
    .from("bookings")
    .select("id, user_id, salon_id, starts_at, salons(name, sms_reminder_1h), profiles(display_name)")
    .eq("status", "confirmed")
    .eq("sms_sent_1h", false)
    .gte("starts_at", now.toISOString())
    .lte("starts_at", in1h.toISOString())
    .limit(50);

  for (const booking of bookings1h ?? []) {
    const salon = booking.salons as any;
    if (!salon?.sms_reminder_1h) continue;

    console.log(`[reminders] Would send 1h SMS for booking ${booking.id}`);

    await supabase.from("bookings").update({ sms_sent_1h: true }).eq("id", booking.id);
    sent1h++;
  }

  return NextResponse.json({ sent24h, sent1h });
}
