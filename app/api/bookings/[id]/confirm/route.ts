export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { type EmailLocale } from "@/lib/email";
import { sendNotification } from "@/lib/notifications";
import { resolveBookingActor } from "@/lib/bookings/authorize";

// POST /api/bookings/[id]/confirm
// Called by salon owner to confirm a pending booking.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Centralized authorization (Task B). Confirming a booking is a salon-owner action,
  // so only actor 'salon' is allowed — identical to the prior salons.owner_id check.
  const { actor, booking } = await resolveBookingActor(request, id);
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  if (actor !== "salon") {
    return actor === null
      ? NextResponse.json({ error: "Booking not found" }, { status: 404 })
      : NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createAdminSupabaseClient();

  if (booking.status !== "pending" && booking.status !== "confirmed") {
    return NextResponse.json({ error: "Booking cannot be confirmed in current state" }, { status: 400 });
  }

  const { error } = await admin
    .from("bookings")
    .update({ status: "confirmed" })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Send confirmation email to customer
  const { data: fullBooking } = await admin
    .from("bookings")
    .select("user_id, starts_at, services(name_de), salons(name)")
    .eq("id", id)
    .single();

  if (fullBooking) {
    const { data: profile } = await admin.from("profiles").select("locale").eq("id", fullBooking.user_id).single();
    const locale: EmailLocale = (profile?.locale as EmailLocale) ?? "de";
    const { data: authUser } = await admin.auth.admin.getUserById(fullBooking.user_id);
    const email = authUser?.user?.email;
    if (email) {
      const dateStr = new Date(fullBooking.starts_at).toLocaleDateString("de-CH", { weekday: "long", day: "numeric", month: "long" });
      const timeStr = new Date(fullBooking.starts_at).toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" });
      const serviceName = (fullBooking.services as any)?.name_de ?? "Service";
      const salonName = (fullBooking.salons as any)?.name ?? "Salon";
      await sendNotification({
        userId: fullBooking.user_id,
        type: "booking_confirmed",
        title: `Buchung bestätigt: ${serviceName}`,
        body: `Ihre Buchung bei ${salonName} am ${dateStr} um ${timeStr} wurde bestätigt.`,
        data: { booking_id: id },
        emailParams: {
          to: email,
          locale,
          vars: {
            service: serviceName,
            salon: salonName,
            date: dateStr,
            time: timeStr,
          }
        }
      });
    }
  }

  return NextResponse.json({ ok: true });
}
