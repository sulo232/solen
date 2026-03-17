// Edge Function: compute-analytics
// Scheduled: nightly at 03:00 ("0 3 * * *")
// Computes analytics for each salon over periods [7d, 30d, 90d] and
// upserts results into salon_analytics table.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const admin = createClient(supabaseUrl, serviceRoleKey);

const PERIODS: { label: string; days: number }[] = [
  { label: "7d",  days: 7  },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
];

Deno.serve(async () => {
  try {
    // Fetch all active salons
    const { data: salons, error: salonsError } = await admin
      .from("salons")
      .select("id")
      .eq("is_active", true);

    if (salonsError || !salons) {
      console.error("[compute-analytics] salons error:", salonsError?.message);
      return new Response(JSON.stringify({ error: "Failed to fetch salons" }), { status: 500 });
    }

    const now = new Date();
    let processed = 0;

    for (const salon of salons) {
      for (const period of PERIODS) {
        const periodEnd = now.toISOString().split("T")[0];
        const periodStart = new Date(now.getTime() - period.days * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0];

        // Fetch all bookings for this salon in the period
        const { data: bookings } = await admin
          .from("bookings")
          .select("id, user_id, price_paid, status, starts_at, service_id")
          .eq("salon_id", salon.id)
          .gte("starts_at", periodStart)
          .lte("starts_at", periodEnd);

        const completed = (bookings ?? []).filter(
          (b) => b.status === "confirmed" || b.status === "completed"
        );
        const cancelled = (bookings ?? []).filter((b) => b.status === "cancelled");

        const totalBookings = completed.length;
        const cancellationCount = cancelled.length;
        const totalRevenue = completed.reduce((sum, b) => sum + (b.price_paid ?? 0), 0);
        const uniqueCustomerIds = [...new Set(completed.map((b) => b.user_id))];
        const uniqueCustomers = uniqueCustomerIds.length;
        const avgBookingPrice = totalBookings > 0 ? totalRevenue / totalBookings : 0;
        const cancellationRate =
          totalBookings + cancellationCount > 0
            ? (cancellationCount / (totalBookings + cancellationCount)) * 100
            : 0;

        // New vs returning customers: first-ever booking for each customer at this salon
        let newCustomers = 0;
        for (const customerId of uniqueCustomerIds) {
          const { count } = await admin
            .from("bookings")
            .select("id", { count: "exact", head: true })
            .eq("salon_id", salon.id)
            .eq("user_id", customerId)
            .lt("starts_at", periodStart);
          if ((count ?? 0) === 0) newCustomers++;
        }
        const returningCustomers = uniqueCustomers - newCustomers;

        // Most popular service
        const serviceCount: Record<string, number> = {};
        for (const b of completed) {
          if (b.service_id) serviceCount[b.service_id] = (serviceCount[b.service_id] ?? 0) + 1;
        }
        const mostPopularServiceId = Object.entries(serviceCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
        let mostPopularService: string | null = null;
        if (mostPopularServiceId) {
          const { data: svc } = await admin
            .from("services")
            .select("name_de")
            .eq("id", mostPopularServiceId)
            .single();
          mostPopularService = svc?.name_de ?? null;
        }

        // Most popular booking hour
        const hourCount: Record<number, number> = {};
        for (const b of completed) {
          const hour = new Date(b.starts_at).getHours();
          hourCount[hour] = (hourCount[hour] ?? 0) + 1;
        }
        const mostPopularHour = Object.entries(hourCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
        const mostPopularTime = mostPopularHour !== null ? `${mostPopularHour}:00` : null;

        // Ratings for this salon
        const { data: reviews, count: totalReviews } = await admin
          .from("reviews")
          .select("rating", { count: "exact" })
          .eq("salon_id", salon.id)
          .gte("created_at", periodStart);
        const reviewList = reviews ?? [];
        const avgRating =
          reviewList.length > 0
            ? reviewList.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / reviewList.length
            : 0;

        // Upsert into salon_analytics
        await admin.from("salon_analytics").upsert(
          {
            salon_id: salon.id,
            period_start: periodStart,
            period_end: periodEnd,
            total_bookings: totalBookings,
            total_revenue: Math.round(totalRevenue * 100) / 100,
            unique_customers: uniqueCustomers,
            avg_booking_price: Math.round(avgBookingPrice * 100) / 100,
            new_customers: newCustomers,
            returning_customers: returningCustomers,
            cancellation_count: cancellationCount,
            cancellation_rate: Math.round(cancellationRate * 100) / 100,
            avg_rating: Math.round(avgRating * 100) / 100,
            total_reviews: totalReviews ?? 0,
            most_popular_service: mostPopularService,
            most_popular_time: mostPopularTime,
          },
          { onConflict: "salon_id,period_start,period_end" }
        );

        processed++;
      }
    }

    // ─── Badge auto-computation ───
    let badgesAssigned = 0;
    let badgesRemoved = 0;

    const { data: systemBadges } = await admin
      .from("salon_badges")
      .select("id, auto_rule")
      .eq("is_system", true)
      .not("auto_rule", "is", null);

    if (systemBadges && systemBadges.length > 0) {
      // Fetch all salons with their stats for badge evaluation
      const { data: allSalons } = await admin
        .from("salons")
        .select("id, average_rating, review_count, created_at, approved_at")
        .eq("is_active", true);

      for (const salon of allSalons ?? []) {
        for (const badge of systemBadges) {
          const rule = badge.auto_rule as Record<string, unknown>;
          let qualifies = false;

          if (rule.type === "rating_and_reviews") {
            qualifies =
              salon.average_rating >= (rule.min_rating as number) &&
              salon.review_count >= (rule.min_reviews as number);
          } else if (rule.type === "bookings_growth") {
            // Compare this week vs last week bookings
            const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString();
            const twoWeeksAgo = new Date(now.getTime() - 14 * 86400000).toISOString();
            const { count: thisWeek } = await admin
              .from("bookings").select("id", { count: "exact", head: true })
              .eq("salon_id", salon.id).gte("starts_at", weekAgo);
            const { count: lastWeek } = await admin
              .from("bookings").select("id", { count: "exact", head: true })
              .eq("salon_id", salon.id).gte("starts_at", twoWeeksAgo).lt("starts_at", weekAgo);
            const growth = (lastWeek ?? 0) > 0
              ? (((thisWeek ?? 0) - (lastWeek ?? 0)) / (lastWeek ?? 1)) * 100
              : 0;
            qualifies = growth >= (rule.min_percent as number);
          } else if (rule.type === "created_within_days") {
            const cutoff = new Date(now.getTime() - (rule.days as number) * 86400000);
            qualifies = new Date(salon.created_at) > cutoff;
          } else if (rule.type === "verified_within_months") {
            if (salon.approved_at) {
              const cutoff = new Date(now.getTime() - (rule.months as number) * 30 * 86400000);
              qualifies = new Date(salon.approved_at) > cutoff;
            }
          }

          // Check for override removal
          const { data: existing } = await admin
            .from("salon_badge_assignments")
            .select("assigned_by, is_override_removal")
            .eq("salon_id", salon.id)
            .eq("badge_id", badge.id)
            .maybeSingle();

          if (qualifies) {
            if (existing?.is_override_removal) continue; // Admin blocked this badge
            if (!existing) {
              await admin.from("salon_badge_assignments").insert({
                salon_id: salon.id,
                badge_id: badge.id,
                assigned_by: null, // auto-assigned
                is_override_removal: false,
              });
              badgesAssigned++;
            }
          } else {
            // Only remove auto-assigned badges (assigned_by IS NULL)
            if (existing && !existing.is_override_removal && existing.assigned_by === null) {
              await admin
                .from("salon_badge_assignments")
                .delete()
                .eq("salon_id", salon.id)
                .eq("badge_id", badge.id);
              badgesRemoved++;
            }
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        salons_processed: salons.length,
        rows_upserted: processed,
        badges_assigned: badgesAssigned,
        badges_removed: badgesRemoved,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[compute-analytics] unexpected error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), { status: 500 });
  }
});
