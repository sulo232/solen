import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";

// GET /api/admin/revenue?period=week|month|year
export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const period = req.nextUrl.searchParams.get("period") ?? "month";
  const admin = createAdminSupabaseClient();

  const now = new Date();
  let since: Date;
  if (period === "week") {
    since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (period === "year") {
    since = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  } else {
    // month
    since = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
  }

  const { data: bookings, error } = await admin
    .from("bookings")
    .select("id, price_paid, starts_at, salon_id, status")
    .gte("starts_at", since.toISOString())
    .eq("status", "completed");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const allBookings = bookings ?? [];
  const total_revenue = allBookings.reduce((sum, b) => sum + (b.price_paid ?? 0), 0);
  const total_bookings = allBookings.length;
  const avg_booking_value = total_bookings > 0 ? total_revenue / total_bookings : 0;

  // Compare to previous period for growth
  const prevSince = new Date(since.getTime() - (now.getTime() - since.getTime()));
  const { data: prevBookings } = await admin
    .from("bookings")
    .select("price_paid")
    .gte("starts_at", prevSince.toISOString())
    .lt("starts_at", since.toISOString())
    .eq("status", "completed");
  const prev_revenue = (prevBookings ?? []).reduce((sum, b) => sum + (b.price_paid ?? 0), 0);
  const growth_percent = prev_revenue > 0 ? ((total_revenue - prev_revenue) / prev_revenue) * 100 : 0;

  // Daily breakdown
  const dailyMap = new Map<string, number>();
  for (const b of allBookings) {
    const day = b.starts_at.split("T")[0];
    dailyMap.set(day, (dailyMap.get(day) ?? 0) + (b.price_paid ?? 0));
  }
  const daily = Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, revenue]) => ({ date, revenue, bookings: allBookings.filter((b) => b.starts_at.startsWith(date)).length }));

  // Top salons
  const salonMap = new Map<string, { revenue: number; bookings: number }>();
  for (const b of allBookings) {
    const entry = salonMap.get(b.salon_id) ?? { revenue: 0, bookings: 0 };
    salonMap.set(b.salon_id, { revenue: entry.revenue + (b.price_paid ?? 0), bookings: entry.bookings + 1 });
  }
  const salonIds = Array.from(salonMap.keys());
  const { data: salonsData } = await admin
    .from("salons").select("id, name").in("id", salonIds);
  const salonNames = new Map((salonsData ?? []).map((s) => [s.id, s.name]));
  const top_salons = Array.from(salonMap.entries())
    .sort(([, a], [, b]) => b.revenue - a.revenue)
    .slice(0, 10)
    .map(([id, stats]) => ({ name: salonNames.get(id) ?? id, ...stats }));

  return NextResponse.json({
    total_revenue,
    total_bookings,
    avg_booking_value,
    growth_percent,
    daily,
    top_salons,
  });
}
