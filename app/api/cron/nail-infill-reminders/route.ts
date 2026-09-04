export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { getServerEnv } from "@/lib/env";
import { verifyCronSecret } from "@/lib/cron-auth";
import { withCronRun } from "@/lib/cron-run";
import { checkFeatureEnabled } from "@/lib/feature-flags";

// GET /api/cron/nail-infill-reminders. Daily cron: semi-auto infill reminders
export async function GET(req: NextRequest) {
  // Verify cron secret
  const cronSecret = getServerEnv().CRON_SECRET;
  if (!cronSecret) return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });
  const authHeader = req.headers.get("authorization");
  if (!(await verifyCronSecret(authHeader, cronSecret))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return withCronRun("nail-infill-reminders", async () => {
  const flagDisabled = await checkFeatureEnabled("nail_features");
  if (flagDisabled) {
    console.log("[nail-infill-cron] Skipped: nail_features feature flag is off");
    return { ok: true, skipped: true, processed: 0 };
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
    return { error: error.message, errors: [error.message] };
  }

  // Narrow to bookings that are actually due within the next 2 days (unchanged logic).
  type DueBooking = {
    id: string;
    user_id: string;
    salon_id: string;
    starts_at: string;
    dueDate: Date;
    service: { name_de: string | null };
  };
  const due: DueBooking[] = [];
  for (const booking of bookings ?? []) {
    const service = Array.isArray(booking.services) ? booking.services[0] : booking.services;
    if (!service?.reminder_cycle_days) continue;
    if (!booking.user_id) continue; // guest booking (no user_id): nothing to notify

    const bookingDate = new Date(booking.starts_at);
    const dueDate = new Date(bookingDate.getTime() + service.reminder_cycle_days * 24 * 60 * 60 * 1000);

    // Only if due within next 2 days
    if (dueDate > twoDaysFromNow || dueDate < now) continue;

    due.push({ id: booking.id, user_id: booking.user_id, salon_id: booking.salon_id, starts_at: booking.starts_at, dueDate, service });
  }

  let remindersCreated = 0;

  if (due.length > 0) {
    const userIds = Array.from(new Set(due.map((b) => b.user_id)));
    const salonIds = Array.from(new Set(due.map((b) => b.salon_id)));
    const earliestStartsAt = due.reduce((min, b) => (b.starts_at < min ? b.starts_at : min), due[0].starts_at);

    // RING 3a: batch the 3 previously per-booking reads (future-booking check,
    // notification prefs, customer name) into ONE IN-list query each, instead
    // of one query per due booking.
    const [{ data: futureRows }, { data: prefRows }, { data: profileRows }] = await Promise.all([
      admin
        .from("bookings")
        .select("user_id, salon_id, starts_at")
        .in("user_id", userIds)
        .in("salon_id", salonIds)
        .in("status", ["confirmed", "pending", "completed"])
        .gt("starts_at", earliestStartsAt),
      admin.from("notification_preferences").select("user_id, rebooking_enabled").in("user_id", userIds),
      admin.from("profiles").select("id, display_name").in("id", userIds),
    ]);

    const prefsByUser = new Map((prefRows ?? []).map((p) => [p.user_id, p.rebooking_enabled]));
    const profileByUser = new Map((profileRows ?? []).map((p) => [p.id, p]));

    const noteRows: { salon_id: string; customer_id: string; note: string; note_type: string; created_by: string }[] = [];

    for (const booking of due) {
      // Check no subsequent nail booking exists for this same user+salon.
      const hasFuture = (futureRows ?? []).some(
        (r) => r.user_id === booking.user_id && r.salon_id === booking.salon_id && r.starts_at > booking.starts_at
      );
      if (hasFuture) continue;

      // Check notification preferences
      const rebookingEnabled = prefsByUser.get(booking.user_id);
      if (rebookingEnabled !== undefined && !rebookingEnabled) continue;

      // Get customer name
      const profile = profileByUser.get(booking.user_id);

      noteRows.push({
        salon_id: booking.salon_id,
        customer_id: booking.user_id,
        note: JSON.stringify({
          type: "infill_reminder",
          service_name: booking.service.name_de,
          customer_name: profile?.display_name ?? "Kunde",
          customer_id: booking.user_id,
          due_date: booking.dueDate.toISOString().split("T")[0],
          booking_id: booking.id,
        }),
        note_type: "infill_reminder",
        created_by: "system",
      });
      remindersCreated++;
    }

    // Create client_notes as infill reminder notifications, batched into one insert.
    if (noteRows.length > 0) {
      const { error: insertErr } = await admin.from("client_notes").insert(noteRows);
      if (insertErr) console.error("[nail-infill-cron] client_notes batch insert failed:", insertErr.message);
    }
  }

  return { success: true, remindersCreated, processed: remindersCreated };
  });
}
