import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

/**
 * POST /api/reviews
 * Submit a review for a completed booking.
 * Body: { booking_id, rating, comment?, staff_member_id? }
 */
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = await request.json();
  const { booking_id, rating, comment, staff_member_id } = body;

  if (!booking_id || !rating) {
    return NextResponse.json({ message: "booking_id and rating are required", code: "BAD_REQUEST" }, { status: 400 });
  }

  if (rating < 1 || rating > 5) {
    return NextResponse.json({ message: "rating must be between 1 and 5", code: "BAD_REQUEST" }, { status: 400 });
  }

  // Validate booking belongs to user and is completed
  const { data: booking } = await supabase
    .from("bookings")
    .select("id, salon_id, user_id, status")
    .eq("id", booking_id)
    .single();

  if (!booking || booking.user_id !== user.id) {
    return NextResponse.json({ message: "Booking not found", code: "NOT_FOUND" }, { status: 404 });
  }

  if (booking.status !== "completed") {
    return NextResponse.json({ message: "Can only review completed bookings", code: "INVALID_STATUS" }, { status: 409 });
  }

  const { data, error } = await supabase
    .from("reviews")
    .insert({
      salon_id:        booking.salon_id,
      user_id:         user.id,
      booking_id,
      staff_member_id: staff_member_id ?? null,
      rating,
      comment:         comment ?? null,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      // Unique constraint — already reviewed
      return NextResponse.json({ message: "You have already reviewed this booking", code: "ALREADY_REVIEWED" }, { status: 409 });
    }
    return NextResponse.json({ message: error.message, code: "DB_ERROR" }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
