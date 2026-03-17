import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

// GET /api/analytics/salon/[id]?period=week|month|quarter|year
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") ?? "month";

  const supabase = await createServerSupabaseClient();

  // Auth check: must be owner or admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const { data: salon } = await supabase
    .from("salons")
    .select("owner_id")
    .eq("id", id)
    .single();

  const isOwner = salon?.owner_id === user.id;
  const isAdmin = profile?.role === "admin";

  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Period mapping
  const periodDays: Record<string, number> = {
    week: 7,
    month: 30,
    quarter: 90,
    year: 365,
  };
  const days = periodDays[period] ?? 30;
  const periodEnd = new Date().toISOString().split("T")[0];
  const periodStart = new Date(Date.now() - days * 86400000).toISOString().split("T")[0];

  const { data: analytics } = await supabase
    .from("salon_analytics")
    .select("*")
    .eq("salon_id", id)
    .gte("period_start", periodStart)
    .lte("period_end", periodEnd)
    .order("period_start", { ascending: false })
    .limit(1)
    .single();

  // Return zeroed data if no analytics yet
  const result = analytics ?? {
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

  return NextResponse.json(result);
}
