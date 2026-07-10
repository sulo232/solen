export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ eligible: false, booking_id: null });

  const url = new URL(request.url);
  const salon_id = url.searchParams.get("salon_id");
  if (!salon_id) return NextResponse.json({ eligible: false, booking_id: null });

  // Step 1: fetch completed bookings for this user+salon.
  const { data: bookings, error: bookingsError } = await supabase
    .from("bookings")
    .select("id")
    .eq("user_id", user.id)
    .eq("salon_id", salon_id)
    .eq("status", "completed")
    .order("starts_at", { ascending: false });

  if (bookingsError) {
    console.error("[reviews/eligibility] bookings fetch:", bookingsError);
    return NextResponse.json({ eligible: false, booking_id: null });
  }

  if (!bookings || bookings.length === 0) {
    return NextResponse.json({ eligible: false, booking_id: null });
  }

  // Step 2: find which of those bookings already have a review.
  // Using JS exclusion (mirroring /api/reviews/my-booking) to avoid the
  // PostgREST 22P02 error from a subquery inside .not(...in...).
  const bookingIds = bookings.map((b) => b.id);
  const { data: existingReviews, error: reviewsError } = await supabase
    .from("reviews")
    .select("booking_id")
    .in("booking_id", bookingIds);

  if (reviewsError) {
    console.error("[reviews/eligibility] reviews fetch:", reviewsError);
    return NextResponse.json({ eligible: false, booking_id: null });
  }

  const reviewedIds = new Set((existingReviews ?? []).map((r) => r.booking_id));
  const unreviewedBooking = bookings.find((b) => !reviewedIds.has(b.id));

  if (unreviewedBooking) {
    return NextResponse.json({ eligible: true, booking_id: unreviewedBooking.id });
  }

  return NextResponse.json({ eligible: false, booking_id: null });
}
