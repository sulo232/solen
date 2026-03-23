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

    // ─── Platform-wide stats ───
    const { count: totalSalons } = await admin.from("salons").select("id", { count: "exact", head: true }).eq("is_active", true);
    const { count: totalUsers } = await admin.from("profiles").select("id", { count: "exact", head: true });
    const { data: allBookings } = await admin.from("bookings").select("price_paid").in("status", ["confirmed", "completed"]);
    const totalBookings = allBookings?.length ?? 0;
    const avgSpending = totalBookings > 0 ? (allBookings ?? []).reduce((s: number, b: { price_paid: number | null }) => s + (b.price_paid ?? 0), 0) / totalBookings : 0;

    for (const [key, val] of Object.entries({
      total_salons: totalSalons ?? 0,
      total_users: totalUsers ?? 0,
      total_bookings: totalBookings,
      avg_spending: Math.round(avgSpending * 100) / 100,
    })) {
      await admin.from("platform_stats").upsert({ key, value: val, computed_at: new Date().toISOString() }, { onConflict: "key" });
    }

    // ─── Salon explore score ───
    for (const salon of salons) {
      const { data: analytics } = await admin.from("salon_analytics")
        .select("total_bookings, total_reviews, avg_rating")
        .eq("salon_id", salon.id)
        .order("period_end", { ascending: false })
        .limit(1)
        .maybeSingle();

      const rating = analytics?.avg_rating ?? 0;
      const bookings = analytics?.total_bookings ?? 0;
      const reviews = analytics?.total_reviews ?? 0;

      const score = (0.4 * rating) + (0.3 * Math.min(bookings / 10, 3)) + (0.2 * Math.min(reviews / 5, 2)) + (0.1 * Math.min(0, 1));

      await admin.from("salons").update({ explore_score: Math.round(score * 100) / 100 }).eq("id", salon.id);
    }

    // ─── Customer segment computation ───
    let segmentsComputed = 0;

    const { data: customerSegments } = await admin.from("customer_segments").select("id, auto_rule");
    const { data: allProfiles } = await admin.from("profiles").select("id, created_at").eq("role", "customer");

    for (const segment of customerSegments ?? []) {
      const rule = segment.auto_rule as Record<string, unknown>;

      for (const profile of allProfiles ?? []) {
        let qualifies = false;

        if (rule.type === "bookings_gte") {
          const cutoff = new Date(now.getTime() - ((rule.period_days as number) ?? 30) * 86400000).toISOString();
          const { count } = await admin.from("bookings")
            .select("id", { count: "exact", head: true })
            .eq("user_id", profile.id)
            .in("status", ["confirmed", "completed"])
            .gte("starts_at", cutoff);
          qualifies = (count ?? 0) >= ((rule.value as number) ?? 3);

        } else if (rule.type === "avg_price_gte") {
          const { data: userBookings } = await admin.from("bookings")
            .select("price_paid")
            .eq("user_id", profile.id)
            .in("status", ["confirmed", "completed"]);
          const prices = (userBookings ?? []).map((b: { price_paid: number | null }) => b.price_paid ?? 0);
          const avg = prices.length > 0 ? prices.reduce((a: number, b: number) => a + b, 0) / prices.length : 0;
          qualifies = avg >= ((rule.value as number) ?? 80);

        } else if (rule.type === "inactive_days") {
          const { count: totalBookings } = await admin.from("bookings")
            .select("id", { count: "exact", head: true })
            .eq("user_id", profile.id)
            .in("status", ["confirmed", "completed"]);
          if ((totalBookings ?? 0) >= ((rule.min_bookings as number) ?? 3)) {
            const { data: lastBooking } = await admin.from("bookings")
              .select("starts_at")
              .eq("user_id", profile.id)
              .in("status", ["confirmed", "completed"])
              .order("starts_at", { ascending: false })
              .limit(1)
              .maybeSingle();
            if (lastBooking) {
              const daysSince = (now.getTime() - new Date(lastBooking.starts_at).getTime()) / 86400000;
              qualifies = daysSince >= ((rule.inactive_days as number) ?? 45);
            }
          }

        } else if (rule.type === "registered_within_days") {
          const cutoff = new Date(now.getTime() - ((rule.days as number) ?? 14) * 86400000);
          qualifies = new Date(profile.created_at) > cutoff;

        } else if (rule.type === "total_bookings_gte") {
          const { count } = await admin.from("bookings")
            .select("id", { count: "exact", head: true })
            .eq("user_id", profile.id)
            .in("status", ["confirmed", "completed"]);
          qualifies = (count ?? 0) >= ((rule.value as number) ?? 10);
        }

        if (qualifies) {
          await admin.from("customer_segment_members").upsert(
            { segment_id: segment.id, user_id: profile.id, computed_at: now.toISOString() },
            { onConflict: "segment_id,user_id" }
          );
          segmentsComputed++;
        } else {
          // Remove if no longer qualifies
          await admin.from("customer_segment_members")
            .delete()
            .eq("segment_id", segment.id)
            .eq("user_id", profile.id);
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
        segments_computed: segmentsComputed,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[compute-analytics] unexpected error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), { status: 500 });
  }
});
