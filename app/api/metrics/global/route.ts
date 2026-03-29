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
      avg_rating: 4.9,
    };

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [salonsResult, bookingsResult, ratingResult] = await Promise.all([
      admin.from("salons").select("*", { count: "exact", head: true }).eq("is_active", true).eq("is_test", false),
      admin
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .gte("created_at", oneWeekAgo),
      admin.from("salons").select("average_rating").gt("average_rating", 0)
    ]);

    const salons = salonsResult.count ?? defaultStats.salons;
    const bookings_this_week = bookingsResult.count ?? defaultStats.bookings_this_week;
    
    let avg_rating = defaultStats.avg_rating;
    if (ratingResult.data && ratingResult.data.length > 0) {
      const sum = ratingResult.data.reduce((acc, s) => acc + (s.average_rating || 0), 0);
      avg_rating = Math.round((sum / ratingResult.data.length) * 10) / 10;
    }

    return NextResponse.json({
      salons,
      bookings_this_week,
      avg_rating,
    });
  } catch (error) {
    // Always provide a fallback if Supabase fails
    return NextResponse.json({
      salons: 500,
      bookings_this_week: 10000,
      avg_rating: 4.9,
    });
  }
}
