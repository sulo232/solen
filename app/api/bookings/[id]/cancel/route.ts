export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { sendEmail, bookingCancellation } from "@/lib/email";
import { calculateCancellationFee } from "@/lib/cancellation-policy";
import { validateBody, bookingCancelSchema } from "@/lib/validations";
import { toRappen } from "@/lib/stripe";
import { issueRefund, RefundError } from "@/lib/bookings/issue-refund";
import { applyCustomerCancelMoney } from "@/lib/bookings/customer-cancel-money";
import { logAuditEvent } from "@/lib/audit";
import { applyRateLimit, bookingLimiter } from "@/lib/ratelimit";

// Read-only refund preview for the cancel-confirm sheet (audit #7). Runs the SAME
// policy math as POST (calculateCancellationFee) but mutates nothing — so the sheet can
// show the REAL "you'll get back CHF X" before the customer confirms, never the gross price.
// Salon-owner cancels are always a full refund (mirrors the POST fast-track).
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ message: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });

  const { data: booking, error } = await supabase
    .from("bookings")
    .select("user_id, starts_at, status, paid_amount, price_paid, payment_intent_id, refunded_amount, salons(owner_id, cancellation_fee_type, cancellation_fee_value, free_cancel_hours)")
    .eq("id", id)
    .single();
  if (error || !booking) return NextResponse.json({ message: "Booking not found", code: "NOT_FOUND" }, { status: 404 });

  const isCustomer = booking.user_id === user.id;
  const isSalonOwner = (booking.salons as any)?.owner_id === user.id;
  if (!isCustomer && !isSalonOwner) return NextResponse.json({ message: "Unauthorized", code: "UNAUTHORIZED" }, { status: 403 });

  const salon = booking.salons as any;
  const baseCents = (booking.paid_amount as number | null) ?? toRappen(Number(booking.price_paid ?? 0));
  const freeCancelHours = salon?.free_cancel_hours ?? 24;

  let feeCents = 0;
  let isWithinWindow = false;
  if (isCustomer) {
    const calc = calculateCancellationFee(
      salon?.cancellation_fee_type,
      salon?.cancellation_fee_value,
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
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ message: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });

  const rateLimited = await applyRateLimit(bookingLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const body = await request.json().catch(() => ({}));
  const { data: validated } = validateBody(bookingCancelSchema, body);
  const reason = validated?.reason;

  // Fetch booking with relations. Policy read switched to the CANONICAL live columns
  // (SP-AC §B2): cancellation_fee_type / cancellation_fee_value / free_cancel_hours.
  // The old cancellation_fee_percent / cancellation_window_hours reads are dropped —
  // those columns are ABSENT live, so the legacy `?? 30` silently masked the drift.
  const { data: booking, error } = await supabase
    .from("bookings")
    .select("*, salons(*, owner_id, cancellation_fee_type, cancellation_fee_value, free_cancel_hours), services(*)")
    .eq("id", id)
    .single();

  if (error || !booking) {
    return NextResponse.json({ message: "Booking not found", code: "NOT_FOUND" }, { status: 404 });
  }

  const isCustomer = booking.user_id === user.id;
  const isSalonOwner = (booking.salons as any)?.owner_id === user.id;

  if (!isCustomer && !isSalonOwner) {
    return NextResponse.json({ message: "Unauthorized", code: "UNAUTHORIZED" }, { status: 403 });
  }

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
  const { data: updatedBooking, error: updateError } = await supabase
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
      salon,
      reason ?? "customer cancelled the booking",
    );
    feeCents = money.feeCents;
    isWithinWindow = money.isWithinWindow;
    feeChargeStatus = money.feeChargeStatus;
    feeChargedCents = money.feeChargedCents;
    if (money.refundAmount > 0) {
      refundResult = { refundAmount: money.refundAmount, feeAmount: money.feeCents, isWithinWindow: money.isWithinWindow };
    }
    if (money.feeChargeStatus !== "none") {
      // Lane A audit -> audit_log (NOT case_events; no dispute parent). Caller owns this.
      await logAuditEvent(request, user.id, "cancellation_fee_charged", "booking", id, {
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
  // on the winning path, but the fresh value is the correct source of truth).
  await supabase
    .from("availability_slots")
    .update({ status: "available", booked_by: null, booking_id: null })
    .eq("id", updatedBooking.slot_id);

  // Notify waitlist entries for the freed slot
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
    if (!entry.user_id) continue;
    const { data: waitlistUser } = await adminForWaitlist.auth.admin.getUserById(entry.user_id);
    if (waitlistUser?.user?.email) {
      try {
        await sendEmail({
          to: waitlistUser.user.email,
          subject: `Ein Termin ist frei geworden bei ${booking.salons?.name ?? "einem Salon"}!`,
          html: `<p>Ein Termin für <strong>${booking.services?.name_de ?? "deinen Service"}</strong> am <strong>${new Date(booking.starts_at).toLocaleDateString("de-CH")}</strong> ist jetzt verfügbar.</p><p><a href="https://solen.ch">Jetzt buchen →</a></p>`,
        });
      } catch (err) { console.error("[bookings/cancel] waitlist notification email failed:", err); }
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
  const customerId = booking.user_id;
  const salonOwnerId = booking.salons?.owner_id;

  const promises: Promise<void>[] = [];

  if (user.email && customerId) {
    const { sendNotification } = await import("@/lib/notifications");
    promises.push(sendNotification({
      userId: customerId,
      type: isCustomer ? "booking_cancelled_by_customer" : "booking_cancelled_by_salon",
      title: `Buchung storniert: ${serviceName}`,
      body: `Ihre Buchung bei ${salonName} am ${dateStr} wurde storniert.`,
      data: { booking_id: id },
      emailParams: {
        to: user.email,
        locale: locale,
        vars: { service: serviceName, salon: salonName, date: dateStr }
      }
    }));
  }

  if (salonOwnerId && salonOwnerId !== user.id) {
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
