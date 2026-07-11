export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { type EmailLocale } from "@/lib/email";
import { sendNotification } from "@/lib/notifications";
import { resolveBookingActor } from "@/lib/bookings/authorize";
import { applyRateLimit, bookingLimiter } from "@/lib/ratelimit";
import { completeReferralForFirstBooking } from "@/lib/referral/complete-referral";

// POST /api/bookings/[id]/confirm
// Called by salon owner to confirm a pending booking, INCLUDING the manual-approval
// "pending_approval" state (Ring 8 fix, backend loop): a manual-approval salon's booking
// never reaches "confirmed" synchronously at create time, so referral completion for it
// was never wired anywhere. This is now the approve transition for BOTH states, and the
// only one of the three referral-completion call sites (booking-create, this route, the
// Stripe webhook) that previously did not call the shared helper.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Centralized authorization (Task B). Confirming a booking is a salon-owner action,
  // so only actor 'salon' is allowed, identical to the prior salons.owner_id check.
  const { actor, booking, userId } = await resolveBookingActor(request, id);
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  if (actor !== "salon") {
    return actor === null
      ? NextResponse.json({ error: "Booking not found" }, { status: 404 })
      : NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // actor === "salon" always has a non-null userId (resolveBookingActor only leaves it
  // null for the guest/none cases), so this is a real per-owner key, not a shared bucket.
  const rateLimited = await applyRateLimit(bookingLimiter, { userId: userId ?? "unknown" });
  if (rateLimited) return rateLimited;

  const admin = createAdminSupabaseClient();

  if (!["pending", "pending_approval", "confirmed"].includes(booking.status ?? "")) {
    return NextResponse.json({ error: "Booking cannot be confirmed in current state" }, { status: 400 });
  }
  const wasAlreadyConfirmed = booking.status === "confirmed";

  const { error } = await admin
    .from("bookings")
    .update({ status: "confirmed" })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Referral fix: complete a pending referral on the SAME transition the booking-create
  // path (status: "confirmed" at create, instant/in-person only) and the Stripe webhook
  // (payment_intent.succeeded) already cover, closing the manual-approval gap those two
  // never reach. Only on a genuine pending/pending_approval -> confirmed transition (never
  // re-run when this route is hit again on an already-confirmed booking). The helper's own
  // compare-and-swap makes a retry/duplicate call a safe no-op, never a double credit.
  if (!wasAlreadyConfirmed && booking.user_id && booking.referral_code) {
    await completeReferralForFirstBooking(admin, booking.user_id, booking.referral_code);
  }

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
