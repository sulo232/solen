export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { fetchPostHogProfileViews } from "@/lib/posthog-api";

// GET /api/analytics/salon/[id]?period=week|month|quarter|year
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") ?? "month";

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;

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

  // Determine period date range — support explicit from/to params OR named period
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");
  const now = new Date();
  const periodDays: Record<string, number> = { week: 7, month: 30, quarter: 90, year: 365 };
  const days = periodDays[period] ?? 30;
  const periodStart = fromParam ? new Date(fromParam + "T00:00:00Z").toISOString() : new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
  const periodEnd = toParam ? new Date(toParam + "T23:59:59Z").toISOString() : now.toISOString();
  const periodMs = new Date(periodEnd).getTime() - new Date(periodStart).getTime();

  // Prior period for trends_vs_prior comparison
  const priorEnd = new Date(periodStart).toISOString();
  const priorStart = new Date(new Date(periodStart).getTime() - periodMs).toISOString();

  // Fetch pre-aggregated analytics if available
  const periodStartDate = periodStart.split("T")[0];
  const periodEndDate = periodEnd.split("T")[0];

  const { data: preAggregated } = await admin
    .from("salon_analytics")
    .select("*")
    .eq("salon_id", id)
    .eq("period_start", periodStartDate)
    .eq("period_end", periodEndDate)
    .maybeSingle();

  // Live-query bookings for real-time stats
  const { data: bookings } = await admin
    .from("bookings")
    .select("id, user_id, service_id, starts_at, ends_at, price_paid, status, is_first_visit, acquisition_source, created_at")
    .eq("salon_id", id)
    .gte("starts_at", periodStart)
    .lte("starts_at", periodEnd);

  const allBookings = bookings ?? [];
  const completed = allBookings.filter(b => b.status === "completed");
  const cancelled = allBookings.filter(b => b.status === "cancelled");
  const noShows = allBookings.filter(b => b.status === "no_show");

  const totalBookings = allBookings.length;
  const totalRevenue = completed.reduce((sum, b) => sum + (b.price_paid ?? 0), 0);
  const uniqueCustomers = new Set(allBookings.map(b => b.user_id).filter(Boolean)).size;
  const avgBookingPrice = completed.length > 0 ? Math.round(totalRevenue / completed.length) : 0;
  const cancellationRate = totalBookings > 0 ? Math.round((cancelled.length / totalBookings) * 100) : 0;
  const noShowRate = totalBookings > 0 ? Math.round((noShows.length / totalBookings) * 100) : 0;

  // New vs returning
  const firstVisits = allBookings.filter(b => b.is_first_visit === true).length;
  const returningCount = totalBookings - firstVisits;

  // Peak hours heatmap: day_of_week (0-6) x hour (0-23)
  const heatmap: { day: number; hour: number; count: number }[] = [];
  const heatmapMap = new Map<string, number>();
  for (const b of allBookings) {
    const d = new Date(b.starts_at);
    const key = `${d.getDay()}-${d.getHours()}`;
    heatmapMap.set(key, (heatmapMap.get(key) ?? 0) + 1);
  }
  for (const [key, count] of heatmapMap) {
    const [day, hour] = key.split("-").map(Number);
    heatmap.push({ day, hour, count });
  }

  // Popular services (top 5)
  const serviceCounts = new Map<string, number>();
  for (const b of allBookings) {
    if (b.service_id) serviceCounts.set(b.service_id, (serviceCounts.get(b.service_id) ?? 0) + 1);
  }
  const topServiceIds = [...serviceCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([sid]) => sid);

  let popularServices: { id: string; name: string; count: number }[] = [];
  if (topServiceIds.length > 0) {
    const { data: services } = await admin
      .from("services")
      .select("id, name_de")
      .in("id", topServiceIds);
    popularServices = topServiceIds.map(sid => ({
      id: sid,
      name: services?.find(s => s.id === sid)?.name_de ?? "Unknown",
      count: serviceCounts.get(sid) ?? 0,
    }));
  }

  // Retention rate: customers who booked again within 60 days
  const customerBookings = new Map<string, string[]>();
  for (const b of completed) {
    if (!b.user_id) continue;
    const list = customerBookings.get(b.user_id) ?? [];
    list.push(b.starts_at);
    customerBookings.set(b.user_id, list);
  }

  let retainedCount = 0;
  for (const [, dates] of customerBookings) {
    if (dates.length < 2) continue;
    const sorted = dates.sort();
    for (let i = 1; i < sorted.length; i++) {
      const diff = (new Date(sorted[i]).getTime() - new Date(sorted[i - 1]).getTime()) / (24 * 60 * 60 * 1000);
      if (diff <= 60) { retainedCount++; break; }
    }
  }
  const retentionRate = customerBookings.size > 0 ? Math.round((retainedCount / customerBookings.size) * 100) : 0;

  // Acquisition sources
  const sourceCounts = new Map<string, number>();
  for (const b of allBookings) {
    const src = b.acquisition_source ?? "unknown";
    sourceCounts.set(src, (sourceCounts.get(src) ?? 0) + 1);
  }
  const acquisitionSources = [...sourceCounts.entries()].map(([source, count]) => ({ source, count }));

  // Reviews in period
  const { data: reviews } = await admin
    .from("reviews")
    .select("rating")
    .eq("salon_id", id)
    .gte("created_at", periodStart)
    .lte("created_at", periodEnd);

  const totalReviews = reviews?.length ?? 0;
  const avgRating = totalReviews > 0
    ? Math.round((reviews!.reduce((s, r) => s + r.rating, 0) / totalReviews) * 10) / 10
    : 0;

  // PostHog Insights
  let profileViews = 0;
  if (isOwner || isAdmin) {
    profileViews = await fetchPostHogProfileViews(id, days);
  }
  const conversionRate = profileViews > 0 ? (totalBookings / profileViews) * 100 : 0;

  // Prior period bookings for trends_vs_prior delta percentages
  const { data: priorBookings } = await admin
    .from("bookings")
    .select("status, price_paid, user_id, is_first_visit")
    .eq("salon_id", id)
    .gte("starts_at", priorStart)
    .lte("starts_at", priorEnd);

  const priorAll = priorBookings ?? [];
  const priorCompleted = priorAll.filter(b => b.status === "completed");
  const priorRevenue = priorCompleted.reduce((s, b) => s + (b.price_paid ?? 0), 0);
  const priorFirst = priorAll.filter(b => b.is_first_visit === true).length;

  function pctDelta(current: number, prior: number): number {
    if (prior === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - prior) / prior) * 100);
  }

  return NextResponse.json({
    salon_id: id,
    period,
    trends_vs_prior: {
      bookings: pctDelta(totalBookings, priorAll.length),
      revenue: pctDelta(totalRevenue, priorRevenue),
      new_customers: pctDelta(firstVisits, priorFirst),
      rating: 0, // rating delta requires prior period reviews — set flat for now
    },
    period_start: periodStartDate,
    period_end: periodEndDate,
    total_bookings: totalBookings,
    total_revenue: totalRevenue,
    unique_customers: uniqueCustomers,
    avg_booking_price: avgBookingPrice,
    new_customers: firstVisits,
    returning_customers: returningCount,
    cancellation_count: cancelled.length,
    cancellation_rate: cancellationRate,
    no_show_rate: noShowRate,
    avg_rating: avgRating,
    total_reviews: totalReviews,
    peak_hours_heatmap: heatmap,
    popular_services: popularServices,
    retention_rate: retentionRate,
    new_vs_returning: { new: firstVisits, returning: returningCount },
    acquisition_sources: acquisitionSources,
    posthog_profile_views: profileViews,
    posthog_conversion_rate: conversionRate,
    // Legacy fields for backwards compatibility
    most_popular_service: popularServices[0]?.name ?? null,
    most_popular_time: heatmap.sort((a, b) => b.count - a.count)[0] ?? null,
    last_minute_bookings: preAggregated?.last_minute_bookings ?? 0,
    last_minute_conversion_rate: preAggregated?.last_minute_conversion_rate ?? 0,
  });
}
