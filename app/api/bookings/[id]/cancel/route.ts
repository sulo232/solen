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

  // Fetch booking with relations (including salon owner_id for notification)
  const { data: booking, error } = await supabase
    .from("bookings")
    .select("*, salons(*, owner_id), services(*)")
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

  // Send cancellation emails to customer + salon owner
  const { createAdminSupabaseClient } = await import("@/lib/supabase");
  const admin = createAdminSupabaseClient();
  const { data: profile } = await admin.from("profiles").select("locale").eq("id", user.id).single();
  const locale = (profile?.locale as "de" | "en" | "fr") ?? "de";
  const dateStr = new Date(booking.starts_at).toLocaleDateString("de-CH");
  const serviceName = booking.services?.name_de ?? "Service";
  const salonName = booking.salons?.name ?? "Salon";

  const salonOwnerId = booking.salons?.owner_id;
  const promises: Promise<void>[] = [];

  if (user.email) {
    promises.push(sendEmail(bookingCancellation(user.email, { service: serviceName, salon: salonName, date: dateStr }, locale)));
  }

  if (salonOwnerId) {
    const { data: ownerAuth } = await admin.auth.admin.getUserById(salonOwnerId);
    const ownerEmail = ownerAuth?.user?.email;
    if (ownerEmail) {
      promises.push(sendEmail(bookingCancellation(ownerEmail, { service: serviceName, salon: salonName, date: dateStr }, "de")));
    }
  }

  try {
    await Promise.allSettled(promises);
  } catch { /* non-fatal */ }

  return NextResponse.json({ data: { id, status: "cancelled" } });
}
