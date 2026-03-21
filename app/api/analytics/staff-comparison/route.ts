export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";

// GET /api/analytics/staff-comparison?salon_id=XXX&period=month
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const salonId = searchParams.get("salon_id");
  const period = searchParams.get("period") ?? "month";

  if (!salonId) return NextResponse.json({ error: "salon_id required" }, { status: 400 });

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminSupabaseClient();

  const { data: salon } = await admin
    .from("salons")
    .select("owner_id")
    .eq("id", salonId)
    .single();

  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (salon?.owner_id !== user.id && profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();
  const periodDays: Record<string, number> = { week: 7, month: 30, quarter: 90, year: 365 };
  const days = periodDays[period] ?? 30;
  const periodStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

  // Get all active staff
  const { data: staffMembers } = await admin
    .from("staff_members")
    .select("id, name, avatar_url")
    .eq("salon_id", salonId)
    .eq("is_active", true);

  if (!staffMembers?.length) return NextResponse.json({ staff: [] });

  const staffIds = staffMembers.map(s => s.id);

  // All bookings for this salon in period
  const { data: bookings } = await admin
    .from("bookings")
    .select("id, staff_member_id, user_id, price_paid, status, starts_at")
    .eq("salon_id", salonId)
    .in("staff_member_id", staffIds)
    .gte("starts_at", periodStart)
    .lte("starts_at", now.toISOString());

  // All reviews for staff in period
  const { data: reviews } = await admin
    .from("reviews")
    .select("staff_member_id, rating")
    .eq("salon_id", salonId)
    .in("staff_member_id", staffIds)
    .gte("created_at", periodStart);

  const staff = staffMembers.map(s => {
    const staffBookings = (bookings ?? []).filter(b => b.staff_member_id === s.id);
    const completed = staffBookings.filter(b => b.status === "completed");
    const revenue = completed.reduce((sum, b) => sum + (b.price_paid ?? 0), 0);
    const staffReviews = (reviews ?? []).filter(r => r.staff_member_id === s.id);
    const avgRating = staffReviews.length
      ? Math.round((staffReviews.reduce((sum, r) => sum + r.rating, 0) / staffReviews.length) * 10) / 10
      : 0;
    const uniqueCustomers = new Set(staffBookings.map(b => b.user_id).filter(Boolean)).size;

    return {
      id: s.id,
      name: s.name,
      avatar_url: s.avatar_url,
      total_bookings: staffBookings.length,
      completed_bookings: completed.length,
      total_revenue: revenue,
      avg_rating: avgRating,
      total_reviews: staffReviews.length,
      unique_customers: uniqueCustomers,
    };
  });

  // Sort by revenue descending
  staff.sort((a, b) => b.total_revenue - a.total_revenue);

  return NextResponse.json({ staff, period });
}
