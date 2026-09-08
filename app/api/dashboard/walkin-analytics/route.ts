import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { recentAvgServiceMinutes } from "@/lib/barber/walkin-ticket";
import { requireSalonAccess } from "@/lib/auth/require";

// Real walk-in analytics, computed from the live queue (barber_walkin_queue) — the single
// source of truth for ALL walk-ins. No fabricated values: every metric below is derived from
// actual rows, or returned as 0 / an empty series when the data genuinely can't be computed.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const salonId = url.searchParams.get("salon_id");
  const period = url.searchParams.get("period") || "week";

  if (!salonId) {
    return NextResponse.json({ error: "salon_id is required" }, { status: 400 });
  }

  // P9-2: requireSalonAccess composes the owner check with the staff
  // area-permission check (calendar) instead of the old owner-or-admin
  // compare. The owner path is unchanged.
  const accessResult = await requireSalonAccess(salonId, "calendar");
  if (accessResult instanceof NextResponse) return accessResult;

  // Date range for the requested period.
  const now = new Date();
  const startDate = new Date();
  if (period === "week") {
    startDate.setDate(now.getDate() - 7);
  } else if (period === "month") {
    startDate.setMonth(now.getMonth() - 1);
  } else if (period === "year") {
    startDate.setFullYear(now.getFullYear() - 1);
  }

  const admin = createAdminSupabaseClient();

  // Walk-ins in period — the live queue, scoped to this salon + joined_at window.
  const { data: queue, error: queueError } = await admin
    .from("barber_walkin_queue")
    .select("status, joined_at, started_at, completed_at")
    .eq("salon_id", salonId)
    .gte("joined_at", startDate.toISOString())
    .lte("joined_at", now.toISOString());

  if (queueError) {
    console.error("[walkin-analytics] queue fetch failed:", queueError);
    return NextResponse.json({ error: "Failed to fetch walk-in data" }, { status: 500 });
  }

  // Scheduled appointments in period — used only for the "walk-ins vs scheduled" ratio the
  // WalkinAnalytics card shows as total_walkins/total_appointments.
  const { count: scheduledCount } = await admin
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("salon_id", salonId)
    .is("walkin_queue_id", null) // exclude walk-in-linked bookings — those are counted as walk-ins
    .gte("starts_at", startDate.toISOString())
    .lte("starts_at", now.toISOString());

  const rows = queue ?? [];
  const totalWalkins = rows.length;
  const completedCount = rows.filter((r) => r.status === "completed").length;
  const noShowCount = rows.filter((r) => r.status === "no_show").length;
  const cancelledCount = rows.filter((r) => r.status === "cancelled").length;

  // Real funnel rates. "conversion" = sat in a chair & finished; "abandonment" = left the
  // queue (no-show or cancelled) without being served. Both over total walk-ins in period.
  const conversionRate = totalWalkins > 0 ? Math.round((completedCount / totalWalkins) * 100) : 0;
  const abandonmentRate = totalWalkins > 0 ? Math.round(((noShowCount + cancelledCount) / totalWalkins) * 100) : 0;

  // Real average service time (EWMA of started→completed). Pass fallback 0 so an absence of
  // signal shows "0 min", not an invented default.
  const avgServiceMinutes = await recentAvgServiceMinutes(admin, salonId, 0);

  const stats = {
    total_walkins: totalWalkins,
    total_appointments: scheduledCount ?? 0,
    avg_wait_minutes: avgServiceMinutes,
    conversion_rate: conversionRate,
    abandonment_rate: abandonmentRate,
    // No data available to compute chair occupancy (no per-chair schedule / open-hours model).
    // Returned as 0 rather than fabricated. See INCOMPLETE_FEATURES.
    chair_utilization: 0,
  };

  // ── Real per-day trend series over the period ────────────────────────────────────────────
  // Bucket rows by calendar day, then derive each series from the real bucket. No Math.random.
  const trendDays = period === "week" ? 7 : 30;
  const dayKey = (d: Date) => d.toISOString().slice(0, 10); // YYYY-MM-DD

  // Pre-seed every day in the window to 0 so the series length is stable for the sparkline.
  const days: string[] = [];
  for (let i = trendDays - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    days.push(dayKey(d));
  }

  const perDay = new Map<string, { walkins: number; completed: number; abandoned: number; durSum: number; durN: number }>();
  for (const d of days) perDay.set(d, { walkins: 0, completed: 0, abandoned: 0, durSum: 0, durN: 0 });

  for (const r of rows) {
    const k = r.joined_at ? dayKey(new Date(r.joined_at)) : null;
    if (!k || !perDay.has(k)) continue;
    const bucket = perDay.get(k)!;
    bucket.walkins += 1;
    if (r.status === "completed") bucket.completed += 1;
    if (r.status === "no_show" || r.status === "cancelled") bucket.abandoned += 1;
    if (r.started_at && r.completed_at) {
      const mins = (new Date(r.completed_at).getTime() - new Date(r.started_at).getTime()) / 60000;
      if (mins > 1 && mins < 180) {
        bucket.durSum += mins;
        bucket.durN += 1;
      }
    }
  }

  const walkinsSeries = days.map((d) => perDay.get(d)!.walkins);
  const conversionsSeries = days.map((d) => {
    const b = perDay.get(d)!;
    return b.walkins > 0 ? Math.round((b.completed / b.walkins) * 100) : 0;
  });
  const abandonmentsSeries = days.map((d) => {
    const b = perDay.get(d)!;
    return b.walkins > 0 ? Math.round((b.abandoned / b.walkins) * 100) : 0;
  });
  const waitsSeries = days.map((d) => {
    const b = perDay.get(d)!;
    return b.durN > 0 ? Math.round(b.durSum / b.durN) : 0;
  });

  const trends = {
    walkins: walkinsSeries,
    waits: waitsSeries,
    conversions: conversionsSeries,
    abandonments: abandonmentsSeries,
  };

  // ── Hourly breakdown for today (8–20h), real walk-in joins ────────────────────────────────
  const breakdown = url.searchParams.get("breakdown");
  if (breakdown === "hourly") {
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const { data: todayQueue } = await admin
      .from("barber_walkin_queue")
      .select("joined_at")
      .eq("salon_id", salonId)
      .gte("joined_at", todayStart.toISOString())
      .lte("joined_at", now.toISOString());

    const hourlyMap = new Map<number, number>();
    for (const q of todayQueue ?? []) {
      if (!q.joined_at) continue;
      const h = new Date(q.joined_at).getHours();
      if (h >= 8 && h <= 20) {
        hourlyMap.set(h, (hourlyMap.get(h) ?? 0) + 1);
      }
    }
    const hourly = Array.from(hourlyMap.entries())
      .map(([hour, count]) => ({ hour, count }))
      .sort((a, b) => a.hour - b.hour);
    return NextResponse.json({ stats, trends, hourly });
  }

  return NextResponse.json({ stats, trends });
}
