import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, createAdminSupabaseClient } from "@/lib/supabase";
import { claimSlot } from "@/lib/bookings/claim-slot";
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

  // Only an active booking can be rescheduled (audit gap: the previous version let a
  // cancelled/completed/no_show booking through, which could resurrect a dead booking's
  // slot claim).
  if (booking.status !== "confirmed" && booking.status !== "pending") {
    return NextResponse.json(
      { error: "Booking cannot be rescheduled", code: "INVALID_STATUS" },
      { status: 400 }
    );
  }

  // We still need a query client for the slot reads/writes below. resolveBookingActor
  // already proved entitlement, so this is no longer the ownership gate.
  const { supabase } = await getSessionUser();
  // availability_slots UPDATE is owner-only under RLS, so a customer's session client
  // silently no-ops every slot write. Slot state changes are a SYSTEM op: route them through
  // the service-role client. Booking-row writes stay on `supabase` (bookings_update_own
  // permits the owner). Council 2026-07-07.
  const admin = createAdminSupabaseClient();

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

  // Find an available new slot (fail-fast; the CAS claim below is the real guard).
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

  // Ordering matters: CLAIM the new slot FIRST, move the booking, then FREE the old slot LAST.
  // Claim-before-free means the old slot is never released until the new one is secured, so
  // there is no window where the old slot is bookable while the reschedule is half-done, and
  // no rollback ever has to race to re-book the old slot. (Council 2026-07-07; supersedes the
  // earlier free-then-claim order whose rollbacks re-claimed the old slot without a CAS guard.)

  // Step 1: CAS-claim the new slot (admin: availability_slots UPDATE is owner-only under RLS).
  const { claimed, error: claimError } = await claimSlot(admin, newSlot.id, {
    booking_id: bookingId,
    booked_by: userId ?? booking.user_id,
  });

  if (claimError) {
    console.error("[Reschedule] Claim new slot error:", claimError);
    return NextResponse.json({ error: "Failed to claim new slot" }, { status: 500 });
  }
  if (!claimed) {
    // A concurrent request claimed the new slot first. Nothing has changed yet (old slot still
    // held by this booking, booking row untouched), so just return 409.
    return NextResponse.json(
      { error: "Slot no longer available", code: "SLOT_TAKEN" },
      { status: 409 }
    );
  }

  // Step 2: Move the booking onto the new slot (session client; bookings_update_own allows the
  // owner). If this fails, release the new slot we just claimed; the OLD slot was never freed,
  // so the booking still validly holds it and no double-booking is possible.
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
    await admin
      .from("availability_slots")
      .update({ status: "available", booking_id: null, booked_by: null })
      .eq("id", newSlot.id);
    console.error("[Reschedule] Update error:", updateError);
    return NextResponse.json(
      { error: "Failed to reschedule booking" },
      { status: 500 }
    );
  }

  // Step 3: Free the OLD slot LAST (admin). The booking already points at the new slot, so if
  // this fails the worst case is a stale 'booked' hold on the old slot, never a double-booking.
  const { error: freeError } = await admin
    .from("availability_slots")
    .update({ status: "available", booking_id: null, booked_by: null })
    .eq("id", booking.slot_id);
  if (freeError) {
    console.error("[Reschedule] Failed to free old slot (stale hold, no double-booking):", freeError);
  }

  // Success - return updated booking
  return NextResponse.json({
    success: true,
    booking: updatedBooking,
  });
}
