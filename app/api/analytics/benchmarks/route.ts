export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";

// GET /api/analytics/benchmarks?salon_id=xxx
// Returns percentile ranking for a salon in rating, booking volume, response time.
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const salonId = request.nextUrl.searchParams.get("salon_id");
  if (!salonId) return NextResponse.json({ error: "salon_id required" }, { status: 400 });

  const admin = createAdminSupabaseClient();

  // Verify ownership
  const { data: salon } = await admin
    .from("salons")
    .select("id, owner_id, average_rating, review_count, quartier")
    .eq("id", salonId)
    .single();

  if (!salon || salon.owner_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Get all active salons for benchmarking
  const { data: allSalons } = await admin
    .from("salons")
    .select("id, average_rating, review_count")
    .eq("is_active", true);

  if (!allSalons?.length) {
    return NextResponse.json({ benchmarks: null });
  }

  // Rating percentile
  const belowRating = allSalons.filter((s) => s.average_rating < salon.average_rating).length;
  const ratingPercentile = Math.round(((allSalons.length - belowRating) / allSalons.length) * 100);

  // Booking volume percentile (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { count: myBookings } = await admin
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("salon_id", salonId)
    .gte("created_at", thirtyDaysAgo.toISOString());

  // Get booking counts for all salons
  const bookingCounts: number[] = [];
  for (const s of allSalons) {
    const { count } = await admin
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("salon_id", s.id)
      .gte("created_at", thirtyDaysAgo.toISOString());
    bookingCounts.push(count ?? 0);
  }

  const myCount = myBookings ?? 0;
  const belowBooking = bookingCounts.filter((c) => c < myCount).length;
  const bookingPercentile = Math.round(((allSalons.length - belowBooking) / allSalons.length) * 100);

  // Review count percentile
  const belowReviews = allSalons.filter((s) => s.review_count < salon.review_count).length;
  const reviewPercentile = Math.round(((allSalons.length - belowReviews) / allSalons.length) * 100);

  return NextResponse.json({
    benchmarks: {
      rating: {
        value: salon.average_rating,
        percentile: ratingPercentile,
        label: `Top ${ratingPercentile}% in Basel`,
      },
      bookings: {
        value: myCount,
        percentile: bookingPercentile,
        label: `Top ${bookingPercentile}% Buchungsvolumen`,
      },
      reviews: {
        value: salon.review_count,
        percentile: reviewPercentile,
        label: `Top ${reviewPercentile}% Bewertungen`,
      },
    },
  });
}
