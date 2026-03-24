export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";

// GET /api/dashboard/walkin-analytics?salon_id=...&period=week|month
export async function GET(req: NextRequest) {
  const disabled = await checkFeatureEnabled("barber_features");
  if (disabled) return disabled;

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const admin = createAdminSupabaseClient();
  const { data: salon } = await admin
    .from("salons").select("id").eq("owner_id", user.id).single();
  if (!salon) return NextResponse.json({ error: "No salon" }, { status: 404 });

  const period = req.nextUrl.searchParams.get("period") ?? "week";
  const since = new Date();
  if (period === "week") since.setDate(since.getDate() - 7);
  else since.setMonth(since.getMonth() - 1);
  const sinceStr = since.toISOString();

  // Walk-ins
  const { data: walkins } = await admin
    .from("barber_walkin_queue")
    .select("status, estimated_wait_minutes, created_at")
    .eq("salon_id", salon.id)
    .gte("created_at", sinceStr);

  // Appointments
  const { data: appointments } = await admin
    .from("bookings")
    .select("id")
    .eq("salon_id", salon.id)
    .gte("starts_at", sinceStr);

  const totalWalkins = walkins?.length ?? 0;
  const completedWalkins = (walkins ?? []).filter((w) => w.status === "completed").length;
  const cancelledWalkins = (walkins ?? []).filter((w) => w.status === "cancelled" || w.status === "no_show").length;
  const waitTimes = (walkins ?? [])
    .filter((w) => w.estimated_wait_minutes != null)
    .map((w) => w.estimated_wait_minutes!);
  const avgWait = waitTimes.length > 0 ? Math.round(waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length) : 0;

  // Chair utilization: rough estimate from concurrent walk-ins
  const { data: chairs } = await admin
    .from("barber_chairs").select("chair_count").eq("salon_id", salon.id).single();
  const chairCount = chairs?.chair_count ?? 1;
  const chairUtil = chairCount > 0 ? Math.min(100, Math.round((completedWalkins / (chairCount * (period === "week" ? 7 : 30) * 8)) * 100)) : 0;

  // Daily breakdown for sparkline trends (last 7 days always)
  const dailyDays = 7;
  const dailyData: { walkins: number[]; waits: number[]; conversions: number[]; abandonments: number[] } = {
    walkins: [], waits: [], conversions: [], abandonments: [],
  };
  for (let d = dailyDays - 1; d >= 0; d--) {
    const dayStart = new Date();
    dayStart.setDate(dayStart.getDate() - d);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    const dayWalkins = (walkins ?? []).filter((w) => {
      const t = new Date(w.created_at);
      return t >= dayStart && t < dayEnd;
    });
    const dayCompleted = dayWalkins.filter((w) => w.status === "completed").length;
    const dayCancelled = dayWalkins.filter((w) => w.status === "cancelled" || w.status === "no_show").length;
    const dayWaits = dayWalkins
      .filter((w) => w.estimated_wait_minutes != null)
      .map((w) => w.estimated_wait_minutes!);
    dailyData.walkins.push(dayWalkins.length);
    dailyData.waits.push(dayWaits.length > 0 ? Math.round(dayWaits.reduce((a, b) => a + b, 0) / dayWaits.length) : 0);
    dailyData.conversions.push(dayWalkins.length > 0 ? Math.round((dayCompleted / dayWalkins.length) * 100) : 0);
    dailyData.abandonments.push(dayWalkins.length > 0 ? Math.round((dayCancelled / dayWalkins.length) * 100) : 0);
  }

  return NextResponse.json({
    stats: {
      total_walkins: totalWalkins,
      total_appointments: appointments?.length ?? 0,
      avg_wait_minutes: avgWait,
      conversion_rate: totalWalkins > 0 ? Math.round((completedWalkins / totalWalkins) * 100) : 0,
      abandonment_rate: totalWalkins > 0 ? Math.round((cancelledWalkins / totalWalkins) * 100) : 0,
      chair_utilization: chairUtil,
    },
    trends: dailyData,
  });
}
