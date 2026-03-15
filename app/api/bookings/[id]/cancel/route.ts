import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { sendEmail } from "@/lib/email";

/**
 * POST /api/bookings/[id]/cancel
 * Cancel a confirmed booking. Body: { reason? }
 * Frees the slot, sends cancellation emails to both parties.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const reason: string | undefined = body.reason;

  // Fetch booking with salon owner info
  const { data: booking, error } = await supabase
    .from("bookings")
    .select("*, salons(name, owner_id, profiles!salons_owner_id_fkey(display_name)), services(name_de), profiles!bookings_user_id_fkey(display_name)")
    .eq("id", id)
    .single();

  if (error || !booking) {
    return NextResponse.json({ message: "Booking not found", code: "NOT_FOUND" }, { status: 404 });
  }

  if (booking.user_id !== user.id) {
    return NextResponse.json({ message: "Forbidden", code: "FORBIDDEN" }, { status: 403 });
  }

  if (booking.status !== "confirmed") {
    return NextResponse.json({ message: "Booking cannot be cancelled", code: "INVALID_STATUS" }, { status: 409 });
  }

  // Update booking status
  const { error: updateError } = await supabase
    .from("bookings")
    .update({
      status:              "cancelled",
      cancellation_reason: reason ?? null,
      cancelled_at:        new Date().toISOString(),
    })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ message: updateError.message, code: "DB_ERROR" }, { status: 500 });
  }

  // Free the slot
  await supabase
    .from("availability_slots")
    .update({
      status:     "available",
      booked_by:  null,
      booking_id: null,
    })
    .eq("id", booking.slot_id);

  // Notify customer + salon owner
  const salonData = booking.salons as { name: string };
  const serviceData = booking.services as { name_de: string };

  await Promise.all([
    sendEmail("booking_cancellation", user.email!, {
      service: serviceData.name_de,
      salon:   salonData.name,
      date:    booking.starts_at,
    }),
  ]);

  return NextResponse.json({ success: true });
}
