export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { getServerEnv } from "@/lib/env";

// GET /api/cron/nail-infill-reminders — Daily cron: semi-auto infill reminders
export async function GET(req: NextRequest) {
  // Verify cron secret
  const cronSecret = getServerEnv().CRON_SECRET;
  if (!cronSecret) return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminSupabaseClient();
  const now = new Date();
  const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

  // Find completed nail bookings with reminder_cycle_days approaching
  const { data: bookings, error } = await admin
    .from("bookings")
    .select(`
      id, user_id, salon_id, starts_at, status,
      services!inner(id, name_de, category, reminder_cycle_days)
    `)
    .eq("status", "completed")
    .eq("services.category", "nails")
    .not("services.reminder_cycle_days", "is", null);

  if (error) {
    console.error("[nail-infill-cron] Query error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let remindersCreated = 0;

  for (const booking of bookings ?? []) {
    const service = Array.isArray(booking.services) ? booking.services[0] : booking.services;
    if (!service?.reminder_cycle_days) continue;

    const bookingDate = new Date(booking.starts_at);
    const dueDate = new Date(bookingDate.getTime() + service.reminder_cycle_days * 24 * 60 * 60 * 1000);

    // Only if due within next 2 days
    if (dueDate > twoDaysFromNow || dueDate < now) continue;

    // Check no subsequent nail booking exists
    const { count: futureBookings } = await admin
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("user_id", booking.user_id)
      .eq("salon_id", booking.salon_id)
      .in("status", ["confirmed", "pending", "completed"])
      .gt("starts_at", booking.starts_at);

    if ((futureBookings ?? 0) > 0) continue;

    // Check notification preferences
    const { data: notifPrefs } = await admin
      .from("notification_preferences")
      .select("rebooking_enabled")
      .eq("user_id", booking.user_id)
      .single();
    if (notifPrefs && !notifPrefs.rebooking_enabled) continue;

    // Get customer name
    const { data: profile } = await admin
      .from("profiles").select("display_name").eq("id", booking.user_id).single();

    // Create client_note as infill reminder notification
    await admin.from("client_notes").insert({
      salon_id: booking.salon_id,
      customer_id: booking.user_id,
      note: JSON.stringify({
        type: "infill_reminder",
        service_name: service.name_de,
        customer_name: profile?.display_name ?? "Kunde",
        customer_id: booking.user_id,
        due_date: dueDate.toISOString().split("T")[0],
        booking_id: booking.id,
      }),
      note_type: "infill_reminder",
      created_by: "system",
    });
    remindersCreated++;
  }

  return NextResponse.json({ success: true, remindersCreated });
}
