import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/supabase";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: bookingId } = await params;
  const { new_starts_at, new_ends_at } = await req.json();

  if (!new_starts_at || !new_ends_at) {
    return NextResponse.json(
      { error: "new_starts_at and new_ends_at required" },
      { status: 400 }
    );
  }

  const { supabase, user } = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch the booking to verify ownership
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select("*, availability_slots!inner(salon_id)")
    .eq("id", bookingId)
    .eq("customer_id", user.id)
    .single();

  if (bookingError || !booking) {
    console.error("[Reschedule] Booking fetch error:", bookingError);
    return NextResponse.json(
      { error: "Booking not found or not owned by user" },
      { status: 404 }
    );
  }

  // Check if cancellation window has passed (24 hour rule)
  const bookingDate = new Date(booking.starts_at);
  const now = new Date();
  const hoursUntilBooking = (bookingDate.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (hoursUntilBooking < 24) {
    return NextResponse.json(
      { error: "Cannot reschedule within 24 hours of booking" },
      { status: 403 }
    );
  }

  const salonId = (booking.availability_slots as any).salon_id;

  // Check if new slot is available
  const { data: newSlot, error: slotError } = await supabase
    .from("availability_slots")
    .select("id")
    .eq("salon_id", salonId)
    .eq("status", "available")
    .gte("starts_at", new_starts_at)
    .lte("ends_at", new_ends_at)
    .single();

  if (slotError || !newSlot) {
    return NextResponse.json(
      { error: "New time slot is not available" },
      { status: 409 }
    );
  }

  // Step 1: Free the old slot
  const { error: freeError } = await supabase
    .from("availability_slots")
    .update({ status: "available", booking_id: null, booked_by: null })
    .eq("id", booking.slot_id);

  if (freeError) {
    console.error("[Reschedule] Free slot error:", freeError);
    return NextResponse.json(
      { error: "Failed to free old slot" },
      { status: 500 }
    );
  }

  // Step 2: Update booking with new slot
  const { data: updatedBooking, error: updateError } = await supabase
    .from("bookings")
    .update({
      slot_id: newSlot.id,
      starts_at: new_starts_at,
      ends_at: new_ends_at,
      updated_at: new Date().toISOString(),
    })
    .eq("id", bookingId)
    .select()
    .single();

  if (updateError) {
    // Rollback: restore old slot if update fails
    await supabase
      .from("availability_slots")
      .update({
        status: "booked",
        booking_id: bookingId,
        booked_by: user.id,
      })
      .eq("id", booking.slot_id);

    console.error("[Reschedule] Update error:", updateError);
    return NextResponse.json(
      { error: "Failed to reschedule booking" },
      { status: 500 }
    );
  }

  // Step 3: Mark new slot as booked
  const { error: bookError } = await supabase
    .from("availability_slots")
    .update({
      status: "booked",
      booking_id: bookingId,
      booked_by: user.id,
    })
    .eq("id", newSlot.id);

  if (bookError) {
    // Rollback both changes
    await supabase
      .from("bookings")
      .update({
        slot_id: booking.slot_id,
        starts_at: booking.starts_at,
        ends_at: booking.ends_at,
      })
      .eq("id", bookingId);

    await supabase
      .from("availability_slots")
      .update({ status: "available", booking_id: null, booked_by: null })
      .eq("id", newSlot.id);

    console.error("[Reschedule] Book slot error:", bookError);
    return NextResponse.json(
      { error: "Failed to confirm new slot" },
      { status: 500 }
    );
  }

  // Success - return updated booking
  return NextResponse.json({
    success: true,
    booking: updatedBooking,
  });
}
