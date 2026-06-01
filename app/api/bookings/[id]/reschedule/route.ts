import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/supabase";
import { resolveBookingActor } from "@/lib/bookings/authorize";

// Reschedule is allowed up to this many hours before the appointment (platform rule).
const RESCHEDULE_MIN_LEAD_HOURS = 24;

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

  // Centralized authorization (Task B). Replaces getSessionUser + the ad-hoc
  // `.eq("customer_id", user.id)` ownership filter (which referenced a column that does
  // not exist on `bookings` — only `user_id` does — so the old query always 404'd).
  // Reschedule is a customer action: only the booking's customer (or token guest) may do
  // it. The relational fetch for the slot's salon_id is kept below, entitlement proven.
  const { actor, booking, userId } = await resolveBookingActor(req, bookingId);
  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }
  if (actor !== "customer" && actor !== "guest") {
    return actor === null
      ? NextResponse.json({ error: "Booking not found" }, { status: 404 })
      : NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // We still need a query client for the slot reads/writes below. resolveBookingActor
  // already proved entitlement, so this is no longer the ownership gate.
  const { supabase } = await getSessionUser();

  // Check if reschedule window has passed (platform lead-time rule).
  const bookingDate = new Date(booking.starts_at);
  const now = new Date();
  const hoursUntilBooking = (bookingDate.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (hoursUntilBooking < RESCHEDULE_MIN_LEAD_HOURS) {
    return NextResponse.json(
      { error: "Cannot reschedule within 24 hours of booking" },
      { status: 403 }
    );
  }

  // booking.salon_id is on the row directly (resolveBookingActor selects *), so the old
  // availability_slots!inner join is no longer needed to derive the salon.
  const salonId = booking.salon_id;

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
        booked_by: userId ?? booking.user_id,
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
      booked_by: userId ?? booking.user_id,
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
