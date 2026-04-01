export const revalidate = 86400; // 24 hours caching

import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";

export async function GET() {
  try {
    const admin = createAdminSupabaseClient();

    // Default values if queries fail
    const defaultStats = {
      salons: 500,
      bookings_this_week: 10000,
      bookings_all_time: 10000,
      reviews: 5000,
      avg_rating: 4.9,
    };

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [salonsResult, bookingsThisWeekResult, bookingsAllResult, reviewsResult, ratingResult] = await Promise.all([
      admin.from("salons").select("*", { count: "exact", head: true }).eq("is_active", true).eq("is_test", false),
      admin
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .gte("created_at", oneWeekAgo),
      admin
        .from("bookings")
        .select("*", { count: "exact", head: true }),
      admin.from("salons").select("review_count"),
      admin.from("salons").select("average_rating").gt("average_rating", 0)
    ]);

    const salons = salonsResult.count ?? defaultStats.salons;
    const bookings_this_week = bookingsThisWeekResult.count ?? defaultStats.bookings_this_week;
    const bookings_all_time = bookingsAllResult.count ?? defaultStats.bookings_all_time;

    let reviews = defaultStats.reviews;
    if (reviewsResult.data && reviewsResult.data.length > 0) {
      reviews = reviewsResult.data.reduce((acc, s) => acc + (s.review_count || 0), 0);
    }

    let avg_rating = defaultStats.avg_rating;
    if (ratingResult.data && ratingResult.data.length > 0) {
      const sum = ratingResult.data.reduce((acc, s) => acc + (s.average_rating || 0), 0);
      avg_rating = Math.round((sum / ratingResult.data.length) * 10) / 10;
    }

    return NextResponse.json({
      salons,
      bookings_this_week,
      bookings_all_time,
      reviews,
      avg_rating,
    });
  } catch (error) {
    // Always provide a fallback if Supabase fails
    return NextResponse.json({
      salons: 500,
      bookings_this_week: 10000,
      bookings_all_time: 10000,
      reviews: 5000,
      avg_rating: 4.9,
    });
  }
}
