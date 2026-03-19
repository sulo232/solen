export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";

// GET /api/analytics/platform — admin only
export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminSupabaseClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [salonsResult, bookingsResult, usersResult] = await Promise.all([
    admin.from("salons").select("id, is_active, average_rating", { count: "exact" }),
    admin
      .from("bookings")
      .select("id, price_paid, status", { count: "exact" })
      .gte("created_at", thirtyDaysAgo),
    admin.from("profiles").select("id", { count: "exact" }),
  ]);

  const totalSalons = salonsResult.count ?? 0;
  const allBookings = bookingsResult.data ?? [];
  const totalBookings30d = allBookings.length;
  const totalRevenue30d = allBookings
    .filter((b) => b.status === "confirmed" || b.status === "completed")
    .reduce((sum, b) => sum + (b.price_paid ?? 0), 0);
  const totalUsers = usersResult.count ?? 0;

  const salons = salonsResult.data ?? [];
  const ratingsWithValue = salons.filter((s) => s.average_rating > 0);
  const avgPlatformRating =
    ratingsWithValue.length > 0
      ? ratingsWithValue.reduce((sum, s) => sum + s.average_rating, 0) / ratingsWithValue.length
      : 0;

  return NextResponse.json({
    total_salons: totalSalons,
    total_bookings_30d: totalBookings30d,
    total_revenue_30d: Math.round(totalRevenue30d * 100) / 100,
    total_users: totalUsers,
    avg_platform_rating: Math.round(avgPlatformRating * 100) / 100,
  });
}
