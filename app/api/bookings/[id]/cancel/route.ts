import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { sendEmail, bookingCancellation } from "@/lib/email";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ message: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { reason } = body;

  // Fetch booking with relations
  const { data: booking, error } = await supabase
    .from("bookings")
    .select("*, salons(*), services(*)")
    .eq("id", id)
    .single();

  if (error || !booking) {
    return NextResponse.json({ message: "Booking not found", code: "NOT_FOUND" }, { status: 404 });
  }

  if (booking.user_id !== user.id) {
    return NextResponse.json({ message: "Unauthorized", code: "UNAUTHORIZED" }, { status: 403 });
  }

  if (booking.status !== "confirmed") {
    return NextResponse.json({ message: "Booking cannot be cancelled", code: "INVALID_STATUS" }, { status: 400 });
  }

  // Update booking status
  const { error: updateError } = await supabase
    .from("bookings")
    .update({
      status: "cancelled",
      cancellation_reason: reason ?? null,
      cancelled_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (updateError) return NextResponse.json({ message: updateError.message, code: "DB_ERROR" }, { status: 500 });

  // Free the slot
  await supabase
    .from("availability_slots")
    .update({ status: "available", booked_by: null, booking_id: null })
    .eq("id", booking.slot_id);

  // Send cancellation emails to both customer and salon owner
  const locale = "de"; // TODO: use user's locale from profile
  const dateStr = new Date(booking.starts_at).toLocaleDateString("de-CH");
  const serviceName = booking.services?.name_de ?? "Service";
  const salonName = booking.salons?.name ?? "Salon";

  try {
    await Promise.allSettled([
      sendEmail(bookingCancellation(user.email!, { service: serviceName, salon: salonName, date: dateStr }, locale)),
    ]);
  } catch { /* non-fatal */ }

  return NextResponse.json({ data: { id, status: "cancelled" } });
}
