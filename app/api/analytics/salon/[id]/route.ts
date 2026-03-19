export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";

// GET /api/analytics/salon/[id]?period=week|month|quarter|year
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") ?? "month";

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  // Check ownership or admin role
  const admin = createAdminSupabaseClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const { data: salon } = await admin
    .from("salons")
    .select("owner_id")
    .eq("id", id)
    .single();

  const isOwner = salon?.owner_id === user.id;
  const isAdmin = profile?.role === "admin";

  if (!isOwner && !isAdmin) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  // Determine period date range
  const now = new Date();
  const periodDays: Record<string, number> = { week: 7, month: 30, quarter: 90, year: 365 };
  const days = periodDays[period] ?? 30;
  const periodStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];
  const periodEnd = now.toISOString().split("T")[0];

  const { data, error } = await admin
    .from("salon_analytics")
    .select("*")
    .eq("salon_id", id)
    .eq("period_start", periodStart)
    .eq("period_end", periodEnd)
    .maybeSingle();

  if (error) {
    console.error("[api/analytics/salon]", error.message);
  }

  // Return zeroed-out fields if no analytics row yet
  const empty = {
    salon_id: id,
    period_start: periodStart,
    period_end: periodEnd,
    total_bookings: 0,
    total_revenue: 0,
    unique_customers: 0,
    avg_booking_price: 0,
    new_customers: 0,
    returning_customers: 0,
    cancellation_count: 0,
    cancellation_rate: 0,
    avg_rating: 0,
    total_reviews: 0,
    most_popular_service: null,
    most_popular_time: null,
    last_minute_bookings: 0,
    last_minute_conversion_rate: 0,
  };

  return NextResponse.json(data ?? empty);
}
