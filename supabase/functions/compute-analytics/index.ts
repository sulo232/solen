// Edge Function: compute-analytics
// Scheduled: nightly at 03:00 ("0 3 * * *")
// Computes aggregated analytics for each active salon and upserts into salon_analytics.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const supabase = createClient(supabaseUrl, serviceRoleKey);

const PERIODS: { label: string; days: number }[] = [
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
];

Deno.serve(async (_req) => {
  try {
    // Fetch all active salons
    const { data: salons, error: salonError } = await supabase
      .from("salons")
      .select("id, average_rating, review_count")
      .eq("is_active", true);

    if (salonError) {
      console.error("[compute-analytics] Failed to fetch salons:", salonError.message);
      return new Response(JSON.stringify({ error: salonError.message }), { status: 500 });
    }

    let processed = 0;

    for (const salon of salons ?? []) {
      for (const period of PERIODS) {
        const periodEnd = new Date();
        const periodStart = new Date(Date.now() - period.days * 86400000);
        const startStr = periodStart.toISOString().split("T")[0];
        const endStr = periodEnd.toISOString().split("T")[0];

        // Fetch bookings for this salon in this period
        const { data: bookings } = await supabase
          .from("bookings")
          .select("id, user_id, price_paid, status, is_last_minute, starts_at, service_id, created_at")
          .eq("salon_id", salon.id)
          .gte("created_at", periodStart.toISOString())
          .lte("created_at", periodEnd.toISOString());

        const allBookings = bookings ?? [];
        const completed = allBookings.filter((b) => b.status === "completed");
        const cancelled = allBookings.filter((b) => b.status === "cancelled");

        const totalBookings = completed.length;
        const totalRevenue = completed.reduce((s, b) => s + (b.price_paid ?? 0), 0);
        const avgBookingPrice = totalBookings > 0 ? totalRevenue / totalBookings : 0;
        const cancellationCount = cancelled.length;
        const totalAttempts = totalBookings + cancellationCount;
        const cancellationRate = totalAttempts > 0 ? (cancellationCount / totalAttempts) * 100 : 0;
        const lastMinuteBookings = completed.filter((b) => b.is_last_minute).length;
        const lastMinuteRate = totalBookings > 0 ? (lastMinuteBookings / totalBookings) * 100 : 0;

        // Unique customers
        const customerIds = [...new Set(completed.map((b) => b.user_id).filter(Boolean))];
        const uniqueCustomers = customerIds.length;

        // New vs returning: check if first booking at this salon falls in this period
        let newCustomers = 0;
        for (const customerId of customerIds) {
          const { count } = await supabase
            .from("bookings")
            .select("*", { count: "exact", head: true })
            .eq("salon_id", salon.id)
            .eq("user_id", customerId)
            .lt("created_at", periodStart.toISOString());
          if ((count ?? 0) === 0) newCustomers++;
        }
        const returningCustomers = uniqueCustomers - newCustomers;

        // Most popular service
        const serviceCounts: Record<string, number> = {};
        for (const b of completed) {
          if (b.service_id) serviceCounts[b.service_id] = (serviceCounts[b.service_id] ?? 0) + 1;
        }
        let mostPopularServiceId: string | null = null;
        let maxCount = 0;
        for (const [sid, cnt] of Object.entries(serviceCounts)) {
          if (cnt > maxCount) { maxCount = cnt; mostPopularServiceId = sid; }
        }
        let mostPopularService: string | null = null;
        if (mostPopularServiceId) {
          const { data: svc } = await supabase
            .from("services")
            .select("name_de")
            .eq("id", mostPopularServiceId)
            .single();
          mostPopularService = svc?.name_de ?? null;
        }

        // Most popular hour
        const hourCounts: Record<number, number> = {};
        for (const b of completed) {
          if (b.starts_at) {
            const hour = new Date(b.starts_at).getHours();
            hourCounts[hour] = (hourCounts[hour] ?? 0) + 1;
          }
        }
        let mostPopularHour: number | null = null;
        let maxHourCount = 0;
        for (const [h, cnt] of Object.entries(hourCounts)) {
          if (cnt > maxHourCount) { maxHourCount = cnt; mostPopularHour = Number(h); }
        }
        const mostPopularTime = mostPopularHour !== null
          ? `${String(mostPopularHour).padStart(2, "0")}:00`
          : null;

        await supabase.from("salon_analytics").upsert({
          salon_id: salon.id,
          period_start: startStr,
          period_end: endStr,
          total_bookings: totalBookings,
          total_revenue: Number(totalRevenue.toFixed(2)),
          unique_customers: uniqueCustomers,
          avg_booking_price: Number(avgBookingPrice.toFixed(2)),
          new_customers: newCustomers,
          returning_customers: returningCustomers,
          cancellation_count: cancellationCount,
          cancellation_rate: Number(cancellationRate.toFixed(2)),
          avg_rating: salon.average_rating ?? 0,
          total_reviews: salon.review_count ?? 0,
          most_popular_service: mostPopularService,
          most_popular_time: mostPopularTime,
          last_minute_bookings: lastMinuteBookings,
          last_minute_conversion_rate: Number(lastMinuteRate.toFixed(2)),
        }, { onConflict: "salon_id,period_start,period_end" });

        processed++;
      }
    }

    console.log(`[compute-analytics] Done. Processed ${processed} salon-period combinations.`);
    return new Response(JSON.stringify({ ok: true, processed }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[compute-analytics] Unexpected error:", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
