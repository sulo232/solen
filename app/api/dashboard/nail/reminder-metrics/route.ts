export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";

// GET /api/dashboard/nail/reminder-metrics?salon_id=...
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const salonId = searchParams.get("salon_id");
  if (!salonId) return NextResponse.json({ error: "salon_id required" }, { status: 400 });

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminSupabaseClient();
  const { data: salon } = await admin.from("salons").select("owner_id").eq("id", salonId).single();
  const { data: profile } = await admin.from("profiles").select("role").eq("id", session.user.id).single();
  if (salon?.owner_id !== session.user.id && profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // Count reminders sent (SMS/email reminder events)
  const { count: sentCount } = await admin
    .from("reminder_log")
    .select("*", { count: "exact", head: true })
    .eq("salon_id", salonId)
    .eq("reminder_type", "infill")
    .gte("sent_at", thirtyDaysAgo);

  // Count bookings created after a reminder (within 7 days of reminder)
  // We approximate: bookings in last 30 days that are infill-type
  const { data: reminders } = await admin
    .from("reminder_log")
    .select("user_id, sent_at")
    .eq("salon_id", salonId)
    .eq("reminder_type", "infill")
    .gte("sent_at", thirtyDaysAgo);

  let bookedCount = 0;
  if (reminders && reminders.length > 0) {
    const userIds = [...new Set(reminders.map((r) => r.user_id))];
    const { data: bookings } = await admin
      .from("bookings")
      .select("user_id, created_at")
      .eq("salon_id", salonId)
      .in("user_id", userIds)
      .gte("created_at", thirtyDaysAgo);

    // Count users who booked within 7 days of their reminder
    for (const reminder of reminders) {
      const bookedAfter = (bookings ?? []).find((b) => {
        if (b.user_id !== reminder.user_id) return false;
        const diff = new Date(b.created_at).getTime() - new Date(reminder.sent_at).getTime();
        return diff >= 0 && diff <= 7 * 24 * 60 * 60 * 1000;
      });
      if (bookedAfter) bookedCount++;
    }
  }

  const sent = sentCount ?? 0;
  const conversionRate = sent > 0 ? Math.round((bookedCount / sent) * 100) : 0;

  return NextResponse.json({
    sent,
    booked: bookedCount,
    conversion_rate: conversionRate,
    period_days: 30,
  });
}
