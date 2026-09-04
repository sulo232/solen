export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { sendEmail, bookingCancellation, waitlistSlotFreed } from "@/lib/email";
import { calculateCancellationFee } from "@/lib/cancellation-policy";
import { validateBody, bookingCancelSchema } from "@/lib/validations";
import { toRappen } from "@/lib/stripe";
import { issueRefund, RefundError } from "@/lib/bookings/issue-refund";
import { applyCustomerCancelMoney, resolveCustomerCancelPolicy } from "@/lib/bookings/customer-cancel-money";
import { logAuditEvent } from "@/lib/audit";
import { applyRateLimit, bookingLimiter, getClientIp } from "@/lib/ratelimit";
import { resolveSwissLocale } from "@/lib/format";
import { resolveBookingActor } from "@/lib/bookings/authorize";
import { zurichYmd } from "@/lib/time/zurich";

// Read-only refund preview for the cancel-confirm sheet (audit #7). Runs the SAME
// policy math as POST (calculateCancellationFee) but mutates nothing — so the sheet can
// show the REAL "you'll get back CHF X" before the customer confirms, never the gross price.
// Salon-owner cancels are always a full refund (mirrors the POST fast-track).
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // resolveBookingActor (lib/bookings/authorize.ts): logged-in customer/salon via session,
  // OR a token-verified guest via the httpOnly solen_guest_access cookie
  // (lib/bookings/guest-access.ts). Was a hard `auth.getUser()` gate with no guest branch
  // at all, so a guest could never preview their own refund (checklist #28). null actor
  // maps to a uniform 404, matching resolveBookingActor's own anti-enumeration contract and
  // every other route already on this resolver (reschedule, dispute/upcharge).
  const { actor, booking } = await resolveBookingActor(request, id);
  if (!booking) return NextResponse.json({ message: "Booking not found", code: "NOT_FOUND" }, { status: 404 });
  if (actor !== "customer" && actor !== "guest" && actor !== "salon") {
    return actor === null
      ? NextResponse.json({ message: "Booking not found", code: "NOT_FOUND" }, { status: 404 })
      : NextResponse.json({ message: "Unauthorized", code: "UNAUTHORIZED" }, { status: 403 });
  }

  // resolveBookingActor's own select("*") doesn't carry the salon relation this preview
  // needs, so a single follow-up admin read fills it in (entitlement already proven above).
  const admin = createAdminSupabaseClient();
  const { data: salon } = await admin
    .from("salons")
    .select("owner_id, cancellation_fee_type, cancellation_fee_value, free_cancel_hours")
    .eq("id", booking.salon_id)
    .maybeSingle();

  const isCustomer = actor === "customer" || actor === "guest";
  const baseCents = (booking.paid_amount as number | null) ?? toRappen(Number(booking.price_paid ?? 0));
  // Bill the preview off the SAME source as the real charge (POST below): the terms frozen
  // on the booking at booking time, not the salon's current live policy. Otherwise the
  // preview and the actual charge can disagree whenever the salon tightened its policy
  // after this booking was made.
  const policy = resolveCustomerCancelPolicy(id, booking.policy_snapshot as any, salon ?? null);
  const freeCancelHours = policy.free_cancel_hours ?? 24;

  let feeCents = 0;
  let isWithinWindow = false;
  if (isCustomer) {
    const calc = calculateCancellationFee(
      policy.cancellation_fee_type,
      policy.cancellation_fee_value,
      freeCancelHours,
      baseCents,
      new Date(booking.starts_at),
    );
    feeCents = calc.feeCents;
    isWithinWindow = calc.isWithinWindow;
  }
  // Net against any already-refunded balance (mirrors the POST/customer-cancel-money
  // math) so a booking with a prior partial/full refund never previews a gross figure.
  const alreadyRefunded = (booking.refunded_amount as number | null) ?? 0;
  const remaining = Math.max(0, baseCents - alreadyRefunded);
  const refundCents = Math.max(0, remaining - feeCents);

  return NextResponse.json({
    data: {
      base_cents: baseCents,
      fee_cents: feeCents,
      refund_cents: refundCents,
      within_free_window: !isWithinWindow, // true = early/free cancel (no fee)
      free_cancel_hours: freeCancelHours,
      currency: "CHF",
    },
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // resolveBookingActor (lib/bookings/authorize.ts): logged-in customer/salon via session,
  // OR a token-verified guest via the httpOnly solen_guest_access cookie
  // (lib/bookings/guest-access.ts). Was a hard `auth.getUser()` gate with NO guest branch
  // at all (no resolveBookingActor, no cookie, no token check anywhere in this route), so a
  // guest cancel always 401'd (checklist #28). null actor maps to a uniform 404, matching
  // resolveBookingActor's own anti-enumeration contract and the other two routes already on
  // this resolver (reschedule, dispute/upcharge, the latter of which already lets a
  // token-verified guest trigger a REAL off-session Stripe charge, same trust boundary).
  const { actor, booking: actorBooking, userId } = await resolveBookingActor(request, id);
  if (!actorBooking) {
    return NextResponse.json({ message: "Booking not found", code: "NOT_FOUND" }, { status: 404 });
  }
  if (actor !== "customer" && actor !== "guest" && actor !== "salon") {
    return actor === null
      ? NextResponse.json({ message: "Booking not found", code: "NOT_FOUND" }, { status: 404 })
      : NextResponse.json({ message: "Unauthorized", code: "UNAUTHORIZED" }, { status: 403 });
  }

  // userId is set for a logged-in customer/salon owner, null for a token-verified guest
  // (resolveBookingActor's contract, mirrors reschedule's own rate-limit fallback).
  const rateLimited = await applyRateLimit(bookingLimiter, userId ? { userId } : { ip: getClientIp(request) });
  if (rateLimited) return rateLimited;

  const body = await request.json().catch(() => ({}));
  const { data: validated } = validateBody(bookingCancelSchema, body);
  const reason = validated?.reason;

  // Fetch booking with relations. ADMIN client, not a session client: resolveBookingActor's
  // own select("*") doesn't carry the salons/services joins this route needs, and a guest
  // has no RLS-passing session to read through anyway (bookings_select_own excludes
  // user_id IS NULL rows, supabase/migrations/20260601_sp1_bookings_guest_rls.sql).
  // Entitlement is already proven by resolveBookingActor above. Policy read stays on the
  // CANONICAL live columns (SP-AC §B2): cancellation_fee_type / cancellation_fee_value /
  // free_cancel_hours. The old cancellation_fee_percent / cancellation_window_hours reads
  // are dropped, those columns are ABSENT live, so the legacy `?? 30` silently masked the drift.
  const admin = createAdminSupabaseClient();
  const { data: booking, error } = await admin
    .from("bookings")
    .select("*, salons(*, owner_id, cancellation_fee_type, cancellation_fee_value, free_cancel_hours), services(*)")
    .eq("id", id)
    .single();

  if (error || !booking) {
    return NextResponse.json({ message: "Booking not found", code: "NOT_FOUND" }, { status: 404 });
  }

  const isCustomer = actor === "customer" || actor === "guest";
  const isSalonOwner = actor === "salon";

  if (booking.status !== "confirmed") {
    return NextResponse.json({ message: "Booking cannot be cancelled", code: "INVALID_STATUS" }, { status: 400 });
  }

  const salon = booking.salons as any;
  // Fee base in Rappen: paid_amount (Rappen) ?? toRappen(price_paid CHF). NEVER mix units.
  const baseCents = (booking.paid_amount as number | null) ?? toRappen(Number(booking.price_paid ?? 0));
  const paymentIntentId = booking.payment_intent_id;

  // SALON-OWNER cancel = full refund of the REMAINING balance (Lane B fast-track,
  // REFUND_APPEAL_PLAN §11). Audit fix: this used to refund the gross baseCents even when a
  // prior partial refund already existed, mirror the remaining-balance math every other refund
  // path uses (issueRefund itself, the customer-cancel path below, GET preview above).
  const alreadyRefundedCents = (booking.refunded_amount as number | null) ?? 0;
  const remainingCents = Math.max(0, baseCents - alreadyRefundedCents);
  // Kept as-is (SP-3/SP-0 own the refund-chokepoint migration of this branch); SP-AC
  // does not touch the refund path beyond not breaking it.
  let refundResult = { refundAmount: 0, feeAmount: 0, isWithinWindow: false };
  if (isSalonOwner && remainingCents > 0 && paymentIntentId) {
    refundResult = { refundAmount: remainingCents, feeAmount: 0, isWithinWindow: true };
    // Route through the single refund chokepoint (REFUND_APPEAL_PLAN §10b#3) on the
    // admin client so the CAS write isn't fighting RLS. issueRefund owns the Stripe
    // call + the refunded_amount/payment_status persistence (so the booking update
    // below no longer stamps them). amountCents is integer Rappen.
    const adminForRefund = createAdminSupabaseClient();
    try {
      await issueRefund({
        db: adminForRefund,
        source: "booking",
        id,
        amountCents: remainingCents,
        actor: "salon",
        reason: reason ?? "salon cancelled the booking (full refund)",
      });
    } catch (stripeErr: any) {
      if (stripeErr instanceof RefundError) {
        const status = stripeErr.code === "BOOKING_NOT_FOUND" ? 404
          : stripeErr.code === "STRIPE_FAILED" || stripeErr.code === "CONCURRENT_RETRY" ? 500
          : 400;
        return NextResponse.json({ message: `Refund failed: ${stripeErr.message}`, code: stripeErr.code }, { status });
      }
      return NextResponse.json({ message: `Refund failed: ${stripeErr.message}`, code: "STRIPE_ERROR" }, { status: 500 });
    }
  }

  // Update booking status FIRST (the cancellation is honored regardless of the fee
  // charge outcome (a requires_action/failed charge never rolls it back)). The salon-owner
  // refund's payment_status / refunded_amount are already persisted by issueRefund's CAS
  // above (the single writer of those columns); the customer path leaves fee_charge_* to
  // applyCustomerCancelMoney's chargeFee call.
  // CAS: re-assert BOTH the status and slot_id read for this request's guard above (mirrors
  // reschedule's CAS). A concurrent reschedule commits first, moving slot_id onto a NEW slot
  // without touching status, so a status-only CAS would still match and this cancel would go
  // on to free the STALE booking.slot_id snapshot below, orphaning the booking's real (new)
  // slot as permanently 'booked'. Guarding slot_id too makes that race lose here (0 rows, 409)
  // instead of silently freeing the wrong slot. .maybeSingle() so a lost race (0 rows) comes
  // back as data=null instead of a PGRST116 error, distinguishable from a real DB error.
  // ADMIN client, not a session one: bookings_update_own (RLS) excludes a guest row
  // (user_id IS NULL) on purpose, and a guest actor has no session at all here, so the old
  // session-client write would silently match 0 rows for a guest. resolveBookingActor
  // already proved entitlement above for customer/guest/salon alike.
  const { data: updatedBooking, error: updateError } = await admin
    .from("bookings")
    .update({
      status: "cancelled",
      cancellation_reason: reason ?? null,
      cancelled_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("status", booking.status) // CAS
    .eq("slot_id", booking.slot_id) // CAS: guard against a concurrent reschedule moving slot_id
    .select()
    .maybeSingle();

  if (updateError) return NextResponse.json({ message: updateError.message, code: "DB_ERROR" }, { status: 500 });
  if (!updatedBooking) {
    console.error("[Cancel] CAS lost: booking changed concurrently", { bookingId: id });
    return NextResponse.json(
      { message: "Booking changed concurrently, please retry", code: "CONFLICT" },
      { status: 409 },
    );
  }

  // CUSTOMER cancel money outcome depends on prepayment (audit fix A), routed through the
  // SAME chokepoint (lib/bookings/customer-cancel-money.ts) the public quick-action cancel
  // link now also uses (audit finding #19, MEDIUM, 2026-07-09) instead of a re-inlined
  // divergent version. Prepaid: net the fee out of the refund (refundCents = base minus fee,
  // NO separate fee charge on top, matching the GET preview's "you'll get back CHF X" math
  // exactly). Not prepaid (pay-at-salon, nothing was ever captured): off-session fee charge
  // against the saved card, nothing to refund.
  let feeCents = 0;
  let isWithinWindow = false;
  let feeChargeStatus: "charged" | "requires_action" | "failed" | "none" = "none";
  let feeChargedCents = 0;
  if (isCustomer) {
    const adminForCustomerCancel = createAdminSupabaseClient();
    // Same source as the GET preview above: the frozen policy_snapshot, never the salon's
    // current live policy, so a salon tightening its terms after this booking was made
    // cannot retroactively charge on terms the customer never saw.
    const cancelPolicy = resolveCustomerCancelPolicy(id, booking.policy_snapshot as any, salon);
    const money = await applyCustomerCancelMoney(
      adminForCustomerCancel,
      {
        id,
        starts_at: booking.starts_at,
        paid_amount: booking.paid_amount as number | null,
        price_paid: booking.price_paid as number | null,
        payment_intent_id: paymentIntentId,
        payment_status: booking.payment_status,
        refunded_amount: booking.refunded_amount as number | null,
        stripe_customer_id: booking.stripe_customer_id,
        stripe_payment_method_id: booking.stripe_payment_method_id,
      },
      cancelPolicy,
      reason ?? (actor === "guest" ? "guest cancelled the booking" : "customer cancelled the booking"),
    );
    feeCents = money.feeCents;
    isWithinWindow = money.isWithinWindow;
    feeChargeStatus = money.feeChargeStatus;
    feeChargedCents = money.feeChargedCents;
    if (money.refundAmount > 0) {
      refundResult = { refundAmount: money.refundAmount, feeAmount: money.feeCents, isWithinWindow: money.isWithinWindow };
    }
    // Lane A audit -> audit_log (NOT case_events; no dispute parent). Caller owns this.
    // audit_log.actor_id is a uuid FK to profiles (ON DELETE SET NULL), and a token-verified
    // guest has no profiles row, so only log when userId is set. (The upcharge PATCH route
    // logs `userId ?? "guest"` for a guest actor, which throws a uuid-cast error against
    // this same FK and is silently swallowed by logAuditEvent's own catch, a pre-existing
    // gap in that route, not repeated here.)
    if (money.feeChargeStatus !== "none" && userId) {
      await logAuditEvent(request, userId, "cancellation_fee_charged", "booking", id, {
        kind: "cancellation",
        fee_cents: feeCents,
        charged_cents: feeChargedCents,
        status: money.feeChargeStatus,
        payment_intent_id: money.feeChargePaymentIntentId,
      });
    }
  }

  // Free the slot. Use the FRESH slot_id from the CAS update above, not the stale
  // pre-refund booking.slot_id snapshot (the CAS now guards slot_id too, so these match
  // on the winning path, but the fresh value is the correct source of truth). ADMIN client:
  // availability_slots' `slots_manage_owner` RLS policy is salon-owner-only (014_new_schema.sql),
  // so a plain customer's (or guest's) session client always silently matched 0 rows here,
  // this slot free-up never actually happened for a non-salon-owner cancel. Pre-existing gap
  // (unrelated to guest support, discovered while moving this route off the session client
  // for the guest path), fixed here the same way reschedule.ts already routes ALL slot writes
  // through the service-role client ("Slot state changes are a SYSTEM op"). CAS on booking_id
  // so a lost race (slot already freed/reassigned concurrently) is detected instead of
  // silently reporting success on a zero-row update.
  const { data: freedSlot } = await admin
    .from("availability_slots")
    .update({ status: "available", booked_by: null, booking_id: null })
    .eq("id", updatedBooking.slot_id)
    .eq("booking_id", id) // CAS: only free if the slot still points at THIS booking
    .select("id")
    .maybeSingle();
  if (!freedSlot) {
    console.error("[Cancel] Slot free skipped: slot no longer linked to this booking", { bookingId: id, slotId: updatedBooking.slot_id });
  }

  // Notify waitlist entries for the freed slot
  const adminForWaitlist = createAdminSupabaseClient();
  // Zurich-local calendar day, not a raw UTC slice: a booking whose Zurich-local start is
  // between 00:00 and 02:00 sits on the previous UTC day, so a startsWith/slice prefix would
  // silently miss matching waitlist.preferred_date rows for that slot.
  const cancelledDate = zurichYmd(new Date(booking.starts_at));
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
    if (!entry.user_id) continue;
    const { data: waitlistUser } = await adminForWaitlist.auth.admin.getUserById(entry.user_id);
    if (waitlistUser?.user?.email) {
      try {
        // A9-email-locale (2026-07-27): each waitlisted person gets THEIR OWN profile.locale,
        // not the cancelling customer's; was hardcoded German + de-CH regardless of recipient.
        const { data: waitlistProfile } = await adminForWaitlist.from("profiles").select("locale").eq("id", entry.user_id).maybeSingle();
        const waitlistLocale = (waitlistProfile?.locale as "de" | "en" | "fr" | "it") ?? "de";
        await sendEmail(waitlistSlotFreed(
          waitlistUser.user.email,
          {
            service: booking.services?.name_de ?? "Service",
            salon: booking.salons?.name ?? "Salon",
            date: new Date(booking.starts_at).toLocaleDateString(resolveSwissLocale(waitlistLocale)),
          },
          waitlistLocale
        ));
      } catch (err) { console.error("[bookings/cancel] waitlist notification email failed:", err); }
    }
    await adminForWaitlist.from("waitlist").update({ notified_at: new Date().toISOString() }).eq("id", entry.id);
  }

  // Send cancellation emails to customer + salon owner. Acting-party identity is `userId`
  // (set for a logged-in customer/salon owner, null for a token-verified guest); a guest has
  // neither a profiles row nor an auth.users row, so both lookups below branch on it instead
  // of the old unconditional `user.id`/`user.email` reads (reuses the `admin` client created
  // above for the relational booking fetch, no second instance).
  // A9-email-locale (2026-07-27): a logged-in actor's own profile.locale is the source of
  // truth; a guest has no profiles row, so fall back to the locale threaded through the
  // request body (the page the guest is cancelling from), then "de" if neither is present.
  let locale: "de" | "en" | "fr" | "it" = validated?.locale ?? "de";
  let actingEmail: string | null = null;
  if (userId) {
    const { data: profile } = await admin.from("profiles").select("locale").eq("id", userId).maybeSingle();
    locale = (profile?.locale as "de" | "en" | "fr" | "it") ?? "de";
    const { data: actingAuth } = await admin.auth.admin.getUserById(userId);
    actingEmail = actingAuth?.user?.email ?? null;
  }
  const dateStr = new Date(booking.starts_at).toLocaleDateString(resolveSwissLocale(locale));
  const serviceName = booking.services?.name_de ?? "Service";
  const salonName = booking.salons?.name ?? "Salon";
  const customerId = booking.user_id;
  const salonOwnerId = booking.salons?.owner_id;

  const promises: Promise<void>[] = [];

  if (actingEmail && customerId) {
    // Unchanged from before: notify the booking's own logged-in customer (in-app + email,
    // `to` the ACTING party's email, same as the prior `user.email` read).
    const { sendNotification } = await import("@/lib/notifications");
    promises.push(sendNotification({
      userId: customerId,
      type: isCustomer ? "booking_cancelled_by_customer" : "booking_cancelled_by_salon",
      title: `Buchung storniert: ${serviceName}`,
      body: `Ihre Buchung bei ${salonName} am ${dateStr} wurde storniert.`,
      data: { booking_id: id },
      emailParams: {
        to: actingEmail,
        locale: locale,
        vars: { service: serviceName, salon: salonName, date: dateStr }
      }
    }));
  } else if (isCustomer && !userId && booking.guest_email) {
    // NEW: a token-verified guest cancelling their own booking has no in-app notifications
    // row (notifications.user_id is NOT NULL REFERENCES auth.users) and no `actingEmail` (no
    // auth.users row at all), so send the SAME cancellation email straight to
    // bookings.guest_email (mirrors lib/bookings/notify-refund.ts's established guest branch).
    promises.push(
      sendEmail(bookingCancellation(booking.guest_email as string, { service: serviceName, salon: salonName, date: dateStr }, locale)),
    );
  }

  if (salonOwnerId && salonOwnerId !== userId) {
    const { data: ownerAuth } = await admin.auth.admin.getUserById(salonOwnerId);
    const ownerEmail = ownerAuth?.user?.email;
    if (ownerEmail) {
      const { sendNotification } = await import("@/lib/notifications");
      promises.push(sendNotification({
        userId: salonOwnerId,
        type: isCustomer ? "booking_cancelled_by_customer" : "booking_cancelled_by_salon",
        title: `Kunde hat storniert: ${serviceName}`,
        body: `Die Buchung für ${serviceName} am ${dateStr} wurde storniert.`,
        data: { booking_id: id },
        emailParams: {
          to: ownerEmail,
          locale: "de",
          vars: { service: serviceName, salon: salonName, date: dateStr }
        }
      }));
    }
  }

  try {
    await Promise.allSettled(promises);
  } catch (err) { console.error("[bookings/cancel] cancellation notification dispatch failed:", err); }

  return NextResponse.json({
    data: {
      id,
      status: "cancelled",
      refund_amount: refundResult.refundAmount,
      // SP-AC: the customer-cancellation policy fee (Lane A). All Rappen.
      cancellation_fee: feeCents,
      fee_charged: feeChargedCents,
      fee_charge_status: feeChargeStatus,
      within_cancellation_window: isWithinWindow,
    },
  });
}
