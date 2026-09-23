import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, createAdminSupabaseClient } from "@/lib/supabase";
import { claimSlot } from "@/lib/bookings/claim-slot";
import { resolveBookingActor } from "@/lib/bookings/authorize";
import { validateBody, bookingRescheduleSchema } from "@/lib/validations";
import { applyRateLimit, bookingLimiter, getClientIp } from "@/lib/ratelimit";
import { sendEmail, bookingReschedule, type EmailLocale } from "@/lib/email";
import { localizedField } from "@/lib/i18n/localized-field";
import { locales, defaultLocale } from "@/lib/locale-constants";
import type { Database } from "@/lib/database.types";

// Reschedule is allowed up to this many hours before the appointment (platform rule).
const RESCHEDULE_MIN_LEAD_HOURS = 24;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: bookingId } = await params;
  const body = await req.json().catch(() => null);
  const { data: validated, error: valError } = validateBody(bookingRescheduleSchema, body);
  if (valError) {
    return NextResponse.json(
      { error: "new_starts_at and new_ends_at required (ISO datetime)", message: valError.message, code: "VALIDATION_ERROR" },
      { status: 400 }
    );
  }
  const { new_starts_at, new_ends_at } = validated;

  // Centralized authorization (Task B). Replaces getSessionUser + the ad-hoc
  // `.eq("customer_id", user.id)` ownership filter (which referenced a column that does
  // not exist on `bookings` — only `user_id` does — so the old query always 404'd).
  // Reschedule is a customer action: only the booking's customer (or token guest) may do
  // it. The relational fetch for the slot's salon_id is kept below, entitlement proven.
  const { actor, booking, userId } = await resolveBookingActor(req, bookingId);
  if (!booking) {
    return NextResponse.json({ error: "Booking not found", code: "NOT_FOUND" }, { status: 404 });
  }
  if (actor !== "customer" && actor !== "guest") {
    return actor === null
      ? NextResponse.json({ error: "Booking not found", code: "NOT_FOUND" }, { status: 404 })
      : NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 });
  }

  // userId is set for a logged-in customer, null for a token-verified guest
  // (resolveBookingActor's contract), so a guest reschedule falls back to IP.
  const rateLimited = await applyRateLimit(
    bookingLimiter,
    userId ? { userId } : { ip: getClientIp(req) }
  );
  if (rateLimited) return rateLimited;

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
      { error: "Cannot reschedule within 24 hours of booking", code: "RESCHEDULE_WINDOW_PASSED" },
      { status: 403 }
    );
  }

  // booking.salon_id is on the row directly (resolveBookingActor selects *), so the old
  // availability_slots!inner join is no longer needed to derive the salon.
  const salonId = booking.salon_id;

  // Find an available new slot (fail-fast; the CAS claim below is the real guard). Filtered by
  // the booking's own service_id/staff_member_id (audit finding #18: an unfiltered query could
  // match a slot for a DIFFERENT service/staff at the salon) and .limit(1).maybeSingle() instead
  // of .single() (busy salons routinely have >1 matching slot in the window, which made .single()
  // error and spuriously 409 the reschedule).
  let newSlotQuery = supabase
    .from("availability_slots")
    .select("id")
    .eq("salon_id", salonId)
    .eq("service_id", booking.service_id)
    .eq("status", "available")
    .gte("starts_at", new_starts_at)
    .lte("ends_at", new_ends_at);
  if (booking.staff_member_id) {
    newSlotQuery = newSlotQuery.eq("staff_member_id", booking.staff_member_id);
  }
  const { data: newSlot, error: slotError } = await newSlotQuery.limit(1).maybeSingle();

  if (slotError || !newSlot) {
    return NextResponse.json(
      { error: "New time slot is not available", code: "SLOT_TAKEN" },
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
    return NextResponse.json({ error: "Failed to claim new slot", code: "CLAIM_FAILED" }, { status: 500 });
  }
  if (!claimed) {
    // A concurrent request claimed the new slot first. Nothing has changed yet (old slot still
    // held by this booking, booking row untouched), so just return 409.
    return NextResponse.json(
      { error: "Slot no longer available", code: "SLOT_TAKEN" },
      { status: 409 }
    );
  }

  // Step 2: Move the booking onto the new slot. ADMIN client, not the session client: the SP-1
  // guest RLS rewrite (supabase/migrations/20260601_sp1_bookings_guest_rls.sql) scopes
  // `bookings_update_own` to `user_id IS NOT NULL AND auth.uid() = user_id` (or the salon
  // owner), so a guest row (user_id IS NULL) is EXCLUDED from that policy on purpose (the
  // migration's own comment: "guest-initiated mutations ... go through SP-2/SP-3 service-role
  // routes after resolveBookingActor() verifies the token"). The session client has no
  // auth.uid() at all for a token-verified guest, so this write would silently match 0 rows
  // under RLS and this handler would return a false 409 for every guest reschedule.
  // resolveBookingActor already proved entitlement above (customer OR token-verified guest),
  // so the write is safe on admin here. If this fails, release the new slot we just claimed,
  // the OLD slot was never freed, so the booking still validly holds it and no double-booking
  // is possible.
  // CAS: re-assert the slot_id/status we read for THIS booking at the top of the handler.
  // Without this, a concurrent second reschedule (which claims a DIFFERENT new slot via its
  // own claimSlot CAS) or a concurrent cancel can both "win" here, last-write-wins clobbers
  // the booking row, and the losing request's newly-claimed slot is left orphaned 'booked'
  // with nothing pointing at it. .maybeSingle() (not .single()) so a lost race (0 rows) comes
  // back as data=null instead of a PGRST116 error, distinguishable from a real DB error below.
  const { data: updatedBooking, error: updateError } = await admin
    .from("bookings")
    .update({
      slot_id: newSlot.id,
      starts_at: new_starts_at,
      ends_at: new_ends_at,
      updated_at: new Date().toISOString(),
    })
    .eq("id", bookingId)
    .eq("slot_id", booking.slot_id) // CAS
    .eq("status", booking.status) // CAS
    .select()
    .maybeSingle();

  if (updateError || !updatedBooking) {
    // Either a real DB error, or the CAS lost (booking was concurrently rescheduled/cancelled
    // between our read and this write). Either way, release the slot THIS request just
    // claimed so it is never left orphaned as 'booked' with no booking pointing at it.
    await admin
      .from("availability_slots")
      .update({ status: "available", booking_id: null, booked_by: null })
      .eq("id", newSlot.id);
    if (updateError) {
      console.error("[Reschedule] Update error:", updateError);
      return NextResponse.json(
        { error: "Failed to reschedule booking", code: "DB_ERROR" },
        { status: 500 }
      );
    }
    console.error("[Reschedule] CAS lost: booking changed concurrently", { bookingId });
    return NextResponse.json(
      { error: "Booking changed concurrently, please retry", code: "CONFLICT" },
      { status: 409 }
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

  // Step 4: tell the booking's customer about the move. Reached only after the CAS update
  // committed, so a lost race or failed write never sends. A retry of an applied reschedule is
  // refused at the slot lookup/claim above (409) before reaching here, so it cannot send twice.
  // Classification: booking lifecycle notice (same class as the confirmation and cancellation
  // emails), so it honors the opt-out profiles.notification_email ("Confirmations, reminders,
  // cancellations"), exactly as app/api/bookings/route.ts and lib/notifications.ts do. A guest
  // (no user_id) has no profile or toggle, so guest_email always gets it, same as the guest
  // confirmation; bookings has no locale column, so a guest falls back to German.
  // Failures are logged and never change the response: the reschedule already committed.
  await sendRescheduleEmail(admin, booking as RescheduleEmailBooking, new_starts_at);

  // Success - return updated booking
  return NextResponse.json({
    success: true,
    booking: updatedBooking,
  });
}

// resolveBookingActor returns the full row untyped (BookingRow = Record<string, any>); these
// are the columns read here, all present on bookings per _inventory/_db-columns.json.
type RescheduleEmailBooking = Pick<
  Database["public"]["Tables"]["bookings"]["Row"],
  "id" | "user_id" | "guest_email" | "salon_id" | "service_id" | "starts_at"
>;

async function sendRescheduleEmail(
  admin: ReturnType<typeof createAdminSupabaseClient>,
  booking: RescheduleEmailBooking,
  newStartsAt: string
): Promise<void> {
  try {
    let recipientEmail: string | null = null;
    let locale: EmailLocale = defaultLocale;
    if (booking.user_id) {
      const { data: profile, error: preferenceError } = await admin
        .from("profiles")
        .select("locale, notification_email")
        .eq("id", booking.user_id)
        .maybeSingle();
      if (preferenceError || !profile) {
        // Fail closed: an unreadable preference is never treated as consent.
        console.error("[Reschedule] notification preference lookup failed, email skipped", { bookingId: booking.id, preferenceError });
        return;
      }
      if (profile.notification_email === false) return;
      locale = (locales as readonly string[]).includes(profile.locale ?? "") ? (profile.locale as EmailLocale) : defaultLocale;
      const { data: authUser } = await admin.auth.admin.getUserById(booking.user_id);
      recipientEmail = authUser?.user?.email ?? null;
    } else {
      recipientEmail = booking.guest_email;
    }
    if (!recipientEmail) return;

    const [{ data: service }, { data: salon }] = await Promise.all([
      admin.from("services").select("name_de, name_en, name_fr, name_it").eq("id", booking.service_id).maybeSingle(),
      admin.from("salons").select("name").eq("id", booking.salon_id).maybeSingle(),
    ]);
    await sendEmail(
      bookingReschedule(
        recipientEmail,
        {
          service: localizedField(service, "name", locale) || "Service",
          salon: salon?.name ?? "Salon",
          oldDate: booking.starts_at,
          newDate: newStartsAt,
        },
        locale
      )
    );
  } catch (err) {
    console.error("[Reschedule] customer reschedule email failed", { bookingId: booking.id, err });
  }
}
