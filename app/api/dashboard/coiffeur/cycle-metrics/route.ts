export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";

// GET /api/dashboard/coiffeur/cycle-metrics?salon_id=...
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

  // Fetch colour_cycle_reminders or bookings with colour service in last 90 days
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

  // Get completed colour bookings
  const { data: bookings } = await admin
    .from("bookings")
    .select("user_id, starts_at, status")
    .eq("salon_id", salonId)
    .eq("status", "completed")
    .gte("starts_at", ninetyDaysAgo);

  const all = bookings ?? [];

  // Group by user, compute gaps between visits
  const userVisits = new Map<string, string[]>();
  for (const b of all) {
    if (!b.user_id) continue;
    const list = userVisits.get(b.user_id) ?? [];
    list.push(b.starts_at);
    userVisits.set(b.user_id, list);
  }

  let totalGaps = 0;
  let gapCount = 0;
  let onTimeCount = 0;
  let totalPairs = 0;
  const TARGET_DAYS = 42; // 6-week default cycle

  for (const [, visits] of userVisits) {
    const sorted = visits.sort();
    for (let i = 1; i < sorted.length; i++) {
      const days = (new Date(sorted[i]).getTime() - new Date(sorted[i - 1]).getTime()) / (24 * 60 * 60 * 1000);
      totalGaps += days;
      gapCount++;
      totalPairs++;
      if (days <= TARGET_DAYS + 7) onTimeCount++; // within 1-week buffer
    }
  }

  const avgDays = gapCount > 0 ? Math.round(totalGaps / gapCount) : 0;
  const adherenceRate = totalPairs > 0 ? Math.round((onTimeCount / totalPairs) * 100) : 0;

  // Weekly sparkline: count of colour bookings per week for last 12 weeks
  const sparkline: number[] = [];
  for (let w = 11; w >= 0; w--) {
    const weekStart = new Date(Date.now() - (w + 1) * 7 * 24 * 60 * 60 * 1000);
    const weekEnd = new Date(Date.now() - w * 7 * 24 * 60 * 60 * 1000);
    const count = all.filter((b) => {
      const d = new Date(b.starts_at);
      return d >= weekStart && d < weekEnd;
    }).length;
    sparkline.push(count);
  }

  return NextResponse.json({
    avg_days_between_visits: avgDays,
    adherence_rate: adherenceRate,
    total_tracked_clients: userVisits.size,
    sparkline,
    target_days: TARGET_DAYS,
  });
}
