export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { type EmailLocale } from "@/lib/email";
import { sendNotification } from "@/lib/notifications";
import { resolveBookingActor } from "@/lib/bookings/authorize";
import { applyRateLimit, bookingLimiter } from "@/lib/ratelimit";
import { completeReferralForFirstBooking } from "@/lib/referral/complete-referral";
import { resolveSwissLocale } from "@/lib/format";
import { localizedField } from "@/lib/i18n/localized-field";

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
  if (!booking) return NextResponse.json({ error: "Booking not found", code: "NOT_FOUND" }, { status: 404 });
  if (actor !== "salon") {
    return actor === null
      ? NextResponse.json({ error: "Booking not found", code: "NOT_FOUND" }, { status: 404 })
      : NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 });
  }

  // actor === "salon" always has a non-null userId (resolveBookingActor only leaves it
  // null for the guest/none cases), so this is a real per-owner key, not a shared bucket.
  const rateLimited = await applyRateLimit(bookingLimiter, { userId: userId ?? "unknown" });
  if (rateLimited) return rateLimited;

  const admin = createAdminSupabaseClient();

  if (!["pending", "pending_approval", "confirmed"].includes(booking.status ?? "")) {
    return NextResponse.json({ error: "Booking cannot be confirmed in current state", code: "INVALID_STATUS" }, { status: 400 });
  }
  const wasAlreadyConfirmed = booking.status === "confirmed";

  // CAS: re-assert the status read by resolveBookingActor above, mirroring the cancel
  // route's guard. Without this, a concurrent cancel (which flips status to "cancelled" and
  // frees the slot) can be silently overwritten back to "confirmed" by this update, leaving
  // the booking confirmed against a freed/reassigned slot. .maybeSingle() so a lost race
  // (0 rows) comes back as data=null instead of a PGRST116 error, distinguishable from a
  // real DB error.
  const { data: updatedBooking, error } = await admin
    .from("bookings")
    .update({ status: "confirmed" })
    .eq("id", id)
    .eq("status", booking.status) // CAS
    .select("id")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message, code: "DB_ERROR" }, { status: 500 });
  if (!updatedBooking) {
    console.error("[Confirm] CAS lost: booking changed concurrently", { bookingId: id });
    return NextResponse.json(
      { error: "Booking changed concurrently, please retry", code: "CONFLICT" },
      { status: 409 },
    );
  }

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
    .select("user_id, starts_at, services(name_de, name_en, name_fr, name_it), salons(name)")
    .eq("id", id)
    .single();

  if (fullBooking && fullBooking.user_id) {
    const fullBookingUserId = fullBooking.user_id;
    const { data: profile } = await admin.from("profiles").select("locale").eq("id", fullBookingUserId).single();
    const locale: EmailLocale = (profile?.locale as EmailLocale) ?? "de";
    const { data: authUser } = await admin.auth.admin.getUserById(fullBookingUserId);
    const email = authUser?.user?.email;
    if (email) {
      const dateStr = new Date(fullBooking.starts_at).toLocaleDateString(resolveSwissLocale(locale), { weekday: "long", day: "numeric", month: "long" });
      const timeStr = new Date(fullBooking.starts_at).toLocaleTimeString(resolveSwissLocale(locale), { hour: "2-digit", minute: "2-digit" });
      const serviceName = localizedField(fullBooking.services as Record<string, unknown> | null, "name", locale) || "Service";
      const salonName = (fullBooking.salons as any)?.name ?? "Salon";
      await sendNotification({
        userId: fullBookingUserId,
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
