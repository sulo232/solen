export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

// GET /api/reviews/eligibility?salon_id=... , may the caller post a rating for this salon?
//
// Owner decision 4, 2026-08-09 ("4B like google maps"): signed-in is the whole test. This used to
// answer "does the caller have a completed, not-yet-reviewed booking here", which WAS the visit
// check; that check is gone from RLS and from POST /api/reviews, so it is gone from here too.
// booking_id is still returned when the caller happens to have an unreviewed completed booking,
// because the rating links to it and inherits its stylist. Its absence no longer means ineligible.
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
  }

  // Step 2: find which of those bookings already have a review.
  // Using JS exclusion (mirroring /api/reviews/my-booking) to avoid the
  // PostgREST 22P02 error from a subquery inside .not(...in...).
  let unreviewedBookingId: string | null = null;
  if (bookings && bookings.length > 0) {
    const bookingIds = bookings.map((b) => b.id);
    const { data: existingReviews, error: reviewsError } = await supabase
      .from("reviews")
      .select("booking_id")
      .in("booking_id", bookingIds);

    if (reviewsError) {
      console.error("[reviews/eligibility] reviews fetch:", reviewsError);
    } else {
      const reviewedIds = new Set((existingReviews ?? []).map((r) => r.booking_id));
      unreviewedBookingId = bookings.find((b) => !reviewedIds.has(b.id))?.id ?? null;
    }
  }

  // With an unreviewed booking the caller can always post: that booking's own review slot is free.
  if (unreviewedBookingId) {
    return NextResponse.json({ eligible: true, booking_id: unreviewedBookingId });
  }

  // Without one, the only bound is the single appointment-free rating per person per salon that
  // POST /api/reviews enforces. Not a visit check, just one per person per salon.
  const { data: existingOpenReview, error: openError } = await supabase
    .from("reviews")
    .select("id")
    .eq("user_id", user.id)
    .eq("salon_id", salon_id)
    .is("booking_id", null)
    .is("walkin_queue_id", null)
    .limit(1)
    .maybeSingle();

  if (openError) {
    console.error("[reviews/eligibility] open-review fetch:", openError);
    return NextResponse.json({ eligible: false, booking_id: null });
  }

  return NextResponse.json({ eligible: !existingOpenReview, booking_id: null });
}
