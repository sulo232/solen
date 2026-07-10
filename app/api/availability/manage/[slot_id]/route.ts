export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { sendEmail, bookingCancellation } from "@/lib/email";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ slot_id: string }> }
) {
  const { slot_id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ message: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });

  const { data: slot } = await supabase
    .from("availability_slots")
    .select("*, salons(owner_id, name), bookings(user_id, starts_at), services(name_de)")
    .eq("id", slot_id)
    .single();

  if (!slot) return NextResponse.json({ message: "Slot not found", code: "NOT_FOUND" }, { status: 404 });
  if (slot.salons?.owner_id !== user.id) {
    return NextResponse.json({ message: "Unauthorized", code: "UNAUTHORIZED" }, { status: 403 });
  }

  // A slot carrying a booking can never be DELETEd: bookings.slot_id is NOT NULL with
  // ON DELETE RESTRICT, so even after the booking is cancelled the FK still points at this
  // row and the delete below would throw 23503 -> 500 (booking cancelled, slot stuck
  // "booked"). Cancel the booking and free the slot in place instead of deleting it.
  if (slot.status === "booked" && slot.booking_id) {
    await supabase
      .from("bookings")
      .update({ status: "cancelled", cancellation_reason: "Slot removed by salon", cancelled_at: new Date().toISOString() })
      .eq("id", slot.booking_id);

    // Notify the customer (use admin client, RLS restricts profiles to own data)
    const admin = createAdminSupabaseClient();
    const { data: bookedUser } = await admin.from("profiles").select("id").eq("id", slot.booked_by).single();
    const { data: authUser } = await admin.auth.admin.getUserById(slot.booked_by ?? "");
    if (authUser?.user?.email) {
      try {
        await sendEmail(bookingCancellation(authUser.user.email, {
          service: slot.services?.name_de ?? "Service",
          salon: slot.salons?.name ?? "Salon",
          date: new Date(slot.starts_at).toLocaleDateString("de-CH"),
        }, "de"));
      } catch { /* non-fatal */ }
    }

    const { error: freeError } = await supabase
      .from("availability_slots")
      .update({ status: "available", booking_id: null, booked_by: null })
      .eq("id", slot_id);
    if (freeError) return NextResponse.json({ message: freeError.message, code: "DB_ERROR" }, { status: 500 });

    return NextResponse.json({ data: { id: slot_id, deleted: false, freed: true } });
  }

  const { error } = await supabase.from("availability_slots").delete().eq("id", slot_id);
  if (error) return NextResponse.json({ message: error.message, code: "DB_ERROR" }, { status: 500 });

  return NextResponse.json({ data: { id: slot_id, deleted: true } });
}
