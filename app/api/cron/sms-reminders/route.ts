export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { sendSMS } from "@/lib/sms";

/**
 * Cron handler: send SMS reminders for upcoming bookings.
 * Runs every 30 minutes. Protected by CRON_SECRET.
 *
 * 24h reminder: bookings starting in 23.5h–24.5h
 * 1h reminder:  bookings starting in 0.5h–1.5h
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.SEVEN_IO_API_KEY) {
    console.warn("[sms-reminders] SEVEN_IO_API_KEY not set — skipping");
    return NextResponse.json({ skipped: true, reason: "no_api_key" });
  }

  const supabase = createAdminSupabaseClient();
  const now = Date.now();

  // Time windows
  const win24hStart = new Date(now + 23.5 * 60 * 60 * 1000).toISOString();
  const win24hEnd = new Date(now + 24.5 * 60 * 60 * 1000).toISOString();
  const win1hStart = new Date(now + 0.5 * 60 * 60 * 1000).toISOString();
  const win1hEnd = new Date(now + 1.5 * 60 * 60 * 1000).toISOString();

  let sent24h = 0;
  let sent1h = 0;
  let errors = 0;

  // ── 24h reminders ──
  const { data: bookings24h } = await supabase
    .from("bookings")
    .select(
      "id, starts_at, profiles!bookings_user_id_fkey(display_name, phone), salons!bookings_salon_id_fkey(name, address)"
    )
    .eq("status", "confirmed")
    .eq("sms_sent_24h", false)
    .gte("starts_at", win24hStart)
    .lte("starts_at", win24hEnd)
    .limit(100);

  for (const booking of bookings24h ?? []) {
    const profile = booking.profiles as any;
    const salon = booking.salons as any;
    const phone = profile?.phone;
    if (!phone) continue;

    const time = new Date(booking.starts_at).toLocaleTimeString("de-CH", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const ok = await sendSMS(
      phone,
      `Erinnerung: Morgen um ${time} bei ${salon?.name ?? "deinem Salon"}. Adresse: ${salon?.address ?? "—"}`
    );

    if (ok) {
      await supabase
        .from("bookings")
        .update({ sms_sent_24h: true })
        .eq("id", booking.id);
      sent24h++;
    } else {
      // Still mark as sent to avoid retry loops when phone is invalid
      await supabase
        .from("bookings")
        .update({ sms_sent_24h: true })
        .eq("id", booking.id);
      errors++;
    }
  }

  // ── 1h reminders ──
  const { data: bookings1h } = await supabase
    .from("bookings")
    .select(
      "id, starts_at, profiles!bookings_user_id_fkey(display_name, phone), salons!bookings_salon_id_fkey(name)"
    )
    .eq("status", "confirmed")
    .eq("sms_sent_1h", false)
    .gte("starts_at", win1hStart)
    .lte("starts_at", win1hEnd)
    .limit(100);

  for (const booking of bookings1h ?? []) {
    const profile = booking.profiles as any;
    const salon = booking.salons as any;
    const phone = profile?.phone;
    if (!phone) continue;

    const time = new Date(booking.starts_at).toLocaleTimeString("de-CH", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const ok = await sendSMS(
      phone,
      `In 1 Stunde: Termin bei ${salon?.name ?? "deinem Salon"} um ${time}.`
    );

    if (ok) {
      await supabase
        .from("bookings")
        .update({ sms_sent_1h: true })
        .eq("id", booking.id);
      sent1h++;
    } else {
      await supabase
        .from("bookings")
        .update({ sms_sent_1h: true })
        .eq("id", booking.id);
      errors++;
    }
  }

  console.log(
    `[sms-reminders] sent24h=${sent24h} sent1h=${sent1h} errors=${errors}`
  );

  return NextResponse.json({ sent24h, sent1h, errors });
}
