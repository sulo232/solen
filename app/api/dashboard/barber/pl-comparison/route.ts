export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";

// GET /api/dashboard/barber/pl-comparison?salon_id=...
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const salonId = searchParams.get("salon_id");

  if (!salonId) {
    return NextResponse.json({ error: "salon_id required" }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminSupabaseClient();

  // Auth: verify ownership or admin
  const { data: salon } = await admin.from("salons").select("owner_id").eq("id", salonId).single();
  const { data: profile } = await admin.from("profiles").select("role").eq("id", session.user.id).single();
  if (salon?.owner_id !== session.user.id && profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();
  const start = new Date(now.getTime() - 8 * 7 * 24 * 60 * 60 * 1000).toISOString(); // last 8 weeks

  const { data: bookings } = await admin
    .from("bookings")
    .select("id, is_walkin, price_paid, status, starts_at, amount_paid")
    .eq("salon_id", salonId)
    .gte("starts_at", start)
    .in("status", ["completed"]);

  const all = bookings ?? [];

  const apptBookings = all.filter((b) => !b.is_walkin);
  const walkinBookings = all.filter((b) => b.is_walkin);

  const apptRevenue = apptBookings.reduce((s, b) => s + (b.price_paid ?? 0), 0);
  const walkinRevenue = walkinBookings.reduce((s, b) => s + (b.amount_paid ?? b.price_paid ?? 0), 0);

  const stats = {
    appointment_revenue: apptRevenue,
    walkin_revenue: walkinRevenue,
    appointment_count: apptBookings.length,
    walkin_count: walkinBookings.length,
    appointment_avg: apptBookings.length > 0 ? Math.round(apptRevenue / apptBookings.length) : 0,
    walkin_avg: walkinBookings.length > 0 ? Math.round(walkinRevenue / walkinBookings.length) : 0,
  };

  // Weekly breakdown for stacked bar (last 8 weeks)
  const weeklyMap = new Map<string, { appointments: number; walkins: number }>();
  for (let w = 7; w >= 0; w--) {
    const weekStart = new Date(now.getTime() - (w + 1) * 7 * 24 * 60 * 60 * 1000);
    const weekEnd = new Date(now.getTime() - w * 7 * 24 * 60 * 60 * 1000);
    const label = `KW${Math.ceil((weekStart.getDate() + (new Date(weekStart.getFullYear(), weekStart.getMonth(), 1).getDay())) / 7)}`;
    const weekBookings = all.filter((b) => {
      const d = new Date(b.starts_at);
      return d >= weekStart && d < weekEnd;
    });
    weeklyMap.set(label, {
      appointments: weekBookings.filter((b) => !b.is_walkin).reduce((s, b) => s + (b.price_paid ?? 0), 0),
      walkins: weekBookings.filter((b) => b.is_walkin).reduce((s, b) => s + (b.amount_paid ?? b.price_paid ?? 0), 0),
    });
  }

  const weekly = [...weeklyMap.entries()].map(([week, v]) => ({ week, ...v }));

  return NextResponse.json({ stats, weekly });
}
