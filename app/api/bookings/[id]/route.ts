export const dynamic = "force-dynamic";
// nodejs (was edge): resolveBookingActor -> lib/bookings/guest-access uses Node `crypto`
// (timingSafeEqual / sha256), matching every other resolveBookingActor consumer
// (dispute/escalate/report are all nodejs). This route does Supabase + Stripe only, so
// nodejs is functionally equivalent — no edge-specific behavior is lost.
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { issueRefund } from "@/lib/bookings/issue-refund";
import { applyRateLimit, bookingLimiter } from "@/lib/ratelimit";
import { validateBody, bookingPatchSchema } from "@/lib/validations";
import { resolveBookingActor } from "@/lib/bookings/authorize";

// ToS §4.2 default cancellation terms for the legacy PATCH-status cancel branch.
// The CANONICAL customer-cancel path is app/api/bookings/[id]/cancel/route.ts, which
// reads the salon's own policy columns (cancellation_fee_type/value, free_cancel_hours)
// via calculateCancellationFee. This PATCH branch is the older platform-wide ToS fallback
// (no per-salon override); the values are named here rather than left as bare magic
// numbers. If/when this branch is retired in favour of the canonical route, drop these.
const TOS_LATE_CANCEL_WINDOW_HOURS = 24; // customer cancel inside this window = partial refund
const TOS_LATE_CANCEL_REFUND_FRACTION = 0.5; // fraction refunded for a late customer cancel

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
  if (!user) return NextResponse.json({ message: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });

  // Centralized authorization (Task B). resolveBookingActor replaces the ad-hoc
  // owner/salon-owner check: it grants customer (booking owner), salon (salon owner),
  // and additionally admin — a strict superset of the prior logic for logged-in users.
  // null booking -> 404; logged-in-but-not-entitled -> 403 (identical to before).
  const { actor, booking: authBooking } = await resolveBookingActor(request, id);
  if (!authBooking) return NextResponse.json({ message: "Booking not found", code: "NOT_FOUND" }, { status: 404 });
  if (actor === null) {
    return NextResponse.json({ message: "Unauthorized", code: "UNAUTHORIZED" }, { status: 403 });
  }

  // Entitlement proven; fetch the relational shape the client expects.
  const { data: booking, error } = await supabase
    .from("bookings")
    .select("*, salons(*), services(*), staff_members(*), availability_slots(*)")
    .eq("id", id)
    .single();

  if (error || !booking) {
    return NextResponse.json({ message: "Booking not found", code: "NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json({ data: booking });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const disabled = await checkFeatureEnabled("bookings");
  if (disabled) return disabled;

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
  if (!user) return NextResponse.json({ message: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const rateLimited = await applyRateLimit(bookingLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const body = await request.json().catch(() => ({}));
  const { data: validated, error: valError } = validateBody(bookingPatchSchema, body);
  if (valError) return NextResponse.json({ message: valError.message, code: "VALIDATION_ERROR" }, { status: 400 });

  const { status } = validated;

  const { data: booking, error: fetchErr } = await supabase
    .from("bookings")
    .select("*, salons(owner_id, stripe_account_id)")
    .eq("id", id)
    .single();

  if (fetchErr || !booking) return NextResponse.json({ message: "Not found", code: "NOT_FOUND" }, { status: 404 });

  // Centralized authorization (Task B). resolveBookingActor makes the entitlement
  // decision (and is the one place that understands guests/admins). The
  // isSalonOwner/isBookingOwner booleans below — which drive cancellation_reason, the
  // refund actor, and strike attribution downstream — are still derived from the DIRECT
  // row facts (not from the resolved actor) so this binary customer-vs-salon logic is
  // byte-for-byte identical to before, even for the edge case of a salon owner who also
  // holds the admin role (the resolver would label them 'admin', but their write here is
  // still attributed as the salon owner).
  const { actor } = await resolveBookingActor(request, id);
  if (actor === null) {
    return NextResponse.json({ message: "Unauthorized", code: "UNAUTHORIZED" }, { status: 403 });
  }
  const isSalonOwner = booking.salons?.owner_id === user.id;
  const isBookingOwner = booking.user_id === user.id;

  // A logged-in admin who is neither the customer nor the salon owner has no role in this
  // binary status write — preserve the prior owner-only gate rather than silently granting it.
  if (!isSalonOwner && !isBookingOwner) {
    return NextResponse.json({ message: "Unauthorized", code: "UNAUTHORIZED" }, { status: 403 });
  }

  const updates: any = { status };
  if (status === "completed") updates.completed_at = new Date().toISOString();

  // Refund logic for cancellations
  if (status === "cancelled") {
    updates.cancelled_at = new Date().toISOString();
    updates.cancellation_reason = isBookingOwner ? "customer_cancelled" : "salon_cancelled";

    const pi_id = booking.payment_intent_id;
    if (pi_id && (booking.payment_status === "paid" || booking.payment_status === "deposit_held")) {
      try {
        const { getStripe } = await import("@/lib/stripe");
        const stripe = getStripe();
        const intent = await stripe.paymentIntents.retrieve(pi_id);
        
        const hoursUntilAppointment = (new Date(booking.starts_at).getTime() - Date.now()) / (1000 * 60 * 60);
        // By ToS §4.2: inside the late window gives a partial refund, outside gives 100%.
        // If salon cancels, always 100% refund.
        const isLate = isBookingOwner && hoursUntilAppointment < TOS_LATE_CANCEL_WINDOW_HOURS;
        
        if (booking.payment_status === "deposit_held" && intent.status === "requires_capture") {
          // It's just a hold
          if (!isLate) {
            // 100% refund -> cancel the hold
            await stripe.paymentIntents.cancel(pi_id);
            updates.payment_status = "refunded";
          } else {
            // Late cancel: retain the fee, capture the kept fraction, release the rest.
            const captureAmount = Math.round(intent.amount * (1 - TOS_LATE_CANCEL_REFUND_FRACTION));
            // Calculate new application fee proportionally
            const originalFee = intent.application_fee_amount || 0;
            const newFee = Math.round(originalFee * (1 - TOS_LATE_CANCEL_REFUND_FRACTION));
            await stripe.paymentIntents.capture(pi_id, {
              amount_to_capture: captureAmount,
              application_fee_amount: newFee > 0 ? newFee : undefined
            });
            updates.payment_status = "partially_refunded";
            updates.refunded_amount = intent.amount - captureAmount;
          }
        } else if (booking.payment_status === "paid" && intent.status === "succeeded") {
          // It's already captured -> refund through the single chokepoint
          // (REFUND_APPEAL_PLAN §10b#3). issueRefund owns the Stripe refund,
          // the reverse_transfer/refund_application_fee (D7) flags, the CAS
          // write of refunded_amount + payment_status, and unit safety — so
          // those columns are NOT stamped into `updates` here. Amounts are
          // integer Rappen from the canonical paid_amount column (never
          // intent.amount/CHF mixing). 100% refund = full remaining; late
          // customer-cancel = 50% per ToS §4.2.
          const paidCents = (booking.paid_amount as number | null) ?? 0;
          const alreadyRefunded = (booking.refunded_amount as number | null) ?? 0;
          const refundCents = isLate
            ? Math.round(paidCents * TOS_LATE_CANCEL_REFUND_FRACTION)
            : paidCents - alreadyRefunded;
          if (refundCents > 0) {
            const adminForRefund = createAdminSupabaseClient();
            await issueRefund({
              db: adminForRefund,
              source: "booking",
              id,
              amountCents: refundCents,
              actor: isSalonOwner ? "salon" : "customer",
              reason: isLate
                ? "customer cancelled <24h (50% refund, ToS §4.2)"
                : isSalonOwner
                  ? "salon cancelled the booking (full refund)"
                  : "customer cancelled >24h (full refund, ToS §4.2)",
            });
          }
        }
      } catch (err: any) {
        console.error(`[bookings/patch] Stripe refund error for booking ${id}:`, err.message);
        // We log error but still let cancellation proceed
      }
    } else {
      updates.payment_status = "none";
    }

    // Free the slot
    if (booking.slot_id) {
      await supabase.from("availability_slots").update({ status: "available", booked_by: null, booking_id: null }).eq("id", booking.slot_id);
    }
  }

  const { error: updateErr } = await supabase.from("bookings").update(updates).eq("id", id);
  if (updateErr) return NextResponse.json({ message: updateErr.message, code: "DB_ERROR" }, { status: 500 });

  // Evaluate strikes and warnings
  if (status === "cancelled" || status === "no_show") {
    try {
      const { evaluateBookingPenalties } = await import("@/lib/strikes");
      const cancelledBy = isBookingOwner ? "customer" : "salon";
      await evaluateBookingPenalties(id, status as "cancelled" | "no_show", cancelledBy);
    } catch (err) {
      console.error("Strike evaluation error:", err);
    }
  }

  return NextResponse.json({ data: { success: true } });
}
