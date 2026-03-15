import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { sendEmail } from "@/lib/email";

/**
 * DELETE /api/availability/manage/[slot_id]
 * Salon owner removes a slot.
 * If the slot is booked, triggers cancellation flow.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ slot_id: string }> }
) {
  const { slot_id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const { data: slot } = await supabase
    .from("availability_slots")
    .select("*, salons(owner_id, name), bookings(user_id, profiles!bookings_user_id_fkey(display_name), services(name_de))")
    .eq("id", slot_id)
    .single();

  if (!slot) {
    return NextResponse.json({ message: "Slot not found", code: "NOT_FOUND" }, { status: 404 });
  }

  const salonOwner = (slot.salons as { owner_id: string })?.owner_id;
  if (salonOwner !== user.id) {
    return NextResponse.json({ message: "Forbidden", code: "FORBIDDEN" }, { status: 403 });
  }

  // If booked, cancel the booking first
  if (slot.status === "booked" && slot.booking_id) {
    await supabase
      .from("bookings")
      .update({
        status:              "cancelled",
        cancellation_reason: "Slot removed by salon",
        cancelled_at:        new Date().toISOString(),
      })
      .eq("id", slot.booking_id);

    // Notify affected customer
    const booking = slot.bookings as { user_id: string } | null;
    if (booking) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", booking.user_id)
        .single();

      const { data: userRecord } = await supabase.auth.admin.getUserById(booking.user_id);
      if (userRecord?.user?.email) {
        await sendEmail("booking_cancellation", userRecord.user.email, {
          service: (slot as { services?: { name_de: string } }).services?.name_de ?? "",
          salon:   (slot.salons as { name: string }).name,
          date:    slot.starts_at,
          name:    profile?.display_name ?? "",
        });
      }
    }
  }

  await supabase.from("availability_slots").delete().eq("id", slot_id);

  return NextResponse.json({ success: true });
}
