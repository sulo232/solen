import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

// GET /api/analytics/platform — admin only
export async function GET() {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();

  const [
    { count: totalSalons },
    { count: totalBookings30d },
    { count: totalUsers },
    { data: revenueData },
    { data: ratingData },
  ] = await Promise.all([
    supabase.from("salons").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("bookings").select("*", { count: "exact", head: true }).gte("created_at", thirtyDaysAgo),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("bookings")
      .select("price_paid")
      .gte("created_at", thirtyDaysAgo)
      .eq("status", "completed"),
    supabase.from("salons").select("average_rating").eq("is_active", true),
  ]);

  const totalRevenue30d = (revenueData ?? []).reduce(
    (sum, b) => sum + (b.price_paid ?? 0),
    0
  );

  const avgPlatformRating =
    ratingData && ratingData.length > 0
      ? ratingData.reduce((sum, s) => sum + (s.average_rating ?? 0), 0) / ratingData.length
      : 0;

  return NextResponse.json({
    total_salons: totalSalons ?? 0,
    total_bookings_30d: totalBookings30d ?? 0,
    total_revenue_30d: Number(totalRevenue30d.toFixed(2)),
    total_users: totalUsers ?? 0,
    avg_platform_rating: Number(avgPlatformRating.toFixed(2)),
  });
}
