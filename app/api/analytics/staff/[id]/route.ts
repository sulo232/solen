export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";

// GET /api/analytics/staff/[id]?period=week|month|quarter|year
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: staffId } = await params;
  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") ?? "month";

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminSupabaseClient();

  // Get staff member's salon to verify ownership
  const { data: staff } = await admin
    .from("staff_members")
    .select("id, salon_id, name")
    .eq("id", staffId)
    .single();

  if (!staff) return NextResponse.json({ error: "Staff not found" }, { status: 404 });

  const { data: salon } = await admin
    .from("salons")
    .select("owner_id")
    .eq("id", staff.salon_id)
    .single();

  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const isOwner = salon?.owner_id === user.id;
  const isAdmin = profile?.role === "admin";
  const isSelf = user.id === staffId;

  if (!isOwner && !isAdmin && !isSelf) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();
  const periodDays: Record<string, number> = { week: 7, month: 30, quarter: 90, year: 365 };
  const days = periodDays[period] ?? 30;
  const periodStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

  // Bookings for this staff member
  const { data: bookings } = await admin
    .from("bookings")
    .select("id, user_id, price_paid, status, starts_at, service_id")
    .eq("staff_member_id", staffId)
    .gte("starts_at", periodStart)
    .lte("starts_at", now.toISOString());

  const all = bookings ?? [];
  const completed = all.filter(b => b.status === "completed");
  const totalBookings = all.length;
  const totalRevenue = completed.reduce((s, b) => s + (b.price_paid ?? 0), 0);

  // Average rating from reviews
  const { data: reviews } = await admin
    .from("reviews")
    .select("rating")
    .eq("staff_member_id", staffId)
    .gte("created_at", periodStart);

  const avgRating = reviews?.length
    ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
    : 0;

  // Retention: customers who rebooked within 60 days
  const customerDates = new Map<string, string[]>();
  for (const b of completed) {
    if (!b.user_id) continue;
    const list = customerDates.get(b.user_id) ?? [];
    list.push(b.starts_at);
    customerDates.set(b.user_id, list);
  }
  let retained = 0;
  for (const [, dates] of customerDates) {
    if (dates.length < 2) continue;
    const sorted = dates.sort();
    for (let i = 1; i < sorted.length; i++) {
      const diff = (new Date(sorted[i]).getTime() - new Date(sorted[i - 1]).getTime()) / (24 * 60 * 60 * 1000);
      if (diff <= 60) { retained++; break; }
    }
  }
  const retentionRate = customerDates.size > 0 ? Math.round((retained / customerDates.size) * 100) : 0;

  return NextResponse.json({
    staff_id: staffId,
    staff_name: staff.name,
    period,
    total_bookings: totalBookings,
    completed_bookings: completed.length,
    total_revenue: totalRevenue,
    avg_booking_price: completed.length > 0 ? Math.round(totalRevenue / completed.length) : 0,
    avg_rating: avgRating,
    total_reviews: reviews?.length ?? 0,
    unique_customers: customerDates.size,
    retention_rate: retentionRate,
  });
}
