import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ message: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });

  const body = await request.json();
  const { booking_id, rating, comment, staff_member_id } = body;

  if (!booking_id || !rating) {
    return NextResponse.json({ message: "booking_id and rating required", code: "VALIDATION_ERROR" }, { status: 400 });
  }
  if (rating < 1 || rating > 5) {
    return NextResponse.json({ message: "Rating must be between 1 and 5", code: "VALIDATION_ERROR" }, { status: 400 });
  }

  // Verify booking belongs to user and is completed
  const { data: booking } = await supabase
    .from("bookings")
    .select("user_id, salon_id, status")
    .eq("id", booking_id)
    .single();

  if (!booking) return NextResponse.json({ message: "Booking not found", code: "NOT_FOUND" }, { status: 404 });
  if (booking.user_id !== user.id) return NextResponse.json({ message: "Unauthorized", code: "UNAUTHORIZED" }, { status: 403 });
  if (booking.status !== "completed") return NextResponse.json({ message: "Booking is not completed", code: "BOOKING_NOT_COMPLETED" }, { status: 400 });

  // Check no existing review
  const { data: existing } = await supabase.from("reviews").select("id").eq("booking_id", booking_id).maybeSingle();
  if (existing) return NextResponse.json({ message: "Already reviewed", code: "REVIEW_EXISTS" }, { status: 409 });

  const { data, error } = await supabase
    .from("reviews")
    .insert({ salon_id: booking.salon_id, user_id: user.id, booking_id, rating, comment: comment ?? null, staff_member_id: staff_member_id ?? null })
    .select()
    .single();

  if (error) return NextResponse.json({ message: error.message, code: "DB_ERROR" }, { status: 500 });

  return NextResponse.json({ data }, { status: 201 });
}
