export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { sendEmail, bookingCancellation } from "@/lib/email";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
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

  // Notify waitlist entries for the freed slot
  const { createAdminSupabaseClient } = await import("@/lib/supabase");
  const adminForWaitlist = createAdminSupabaseClient();
  const cancelledDate = new Date(booking.starts_at).toISOString().split("T")[0];
  const { data: waitlistEntries } = await adminForWaitlist
    .from("waitlist")
    .select("id, user_id")
    .eq("salon_id", booking.salon_id)
    .eq("service_id", booking.service_id)
    .eq("preferred_date", cancelledDate)
    .is("notified_at", null)
    .order("created_at", { ascending: true })
    .limit(3);

  for (const entry of waitlistEntries ?? []) {
    const { data: waitlistUser } = await adminForWaitlist.auth.admin.getUserById(entry.user_id);
    if (waitlistUser?.user?.email) {
      try {
        await sendEmail({
          to: waitlistUser.user.email,
          subject: `Ein Termin ist frei geworden bei ${booking.salons?.name ?? "einem Salon"}!`,
          html: `<p>Ein Termin für <strong>${booking.services?.name_de ?? "deinen Service"}</strong> am <strong>${new Date(booking.starts_at).toLocaleDateString("de-CH")}</strong> ist jetzt verfügbar.</p><p><a href="https://solen.ch">Jetzt buchen →</a></p>`,
        });
      } catch { /* non-fatal */ }
    }
    await adminForWaitlist.from("waitlist").update({ notified_at: new Date().toISOString() }).eq("id", entry.id);
  }

  // Send cancellation emails to customer + salon owner
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
