export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, generalLimiter, getClientIp } from "@/lib/ratelimit";
import { getServerEnv } from "@/lib/env";
import { applyCustomerCancelMoney, resolveCustomerCancelPolicy } from "@/lib/bookings/customer-cancel-money";
import crypto from "crypto";

function verifyActionToken(token: string): { bookingId: string; action: string; valid: boolean } {
  const secret = getServerEnv().BOOKING_HMAC_SECRET;
  if (!secret) return { bookingId: "", action: "", valid: false };

  try {
    const decoded = Buffer.from(token, "base64url").toString();
    const parts = decoded.split(":");
    if (parts.length !== 4) return { bookingId: "", action: "", valid: false };

    const [bookingId, action, expiryStr, providedHmac] = parts;
    const expiry = parseInt(expiryStr, 10);

    if (Date.now() / 1000 > expiry) return { bookingId, action, valid: false };

    const payload = `${bookingId}:${action}:${expiryStr}`;
    const expectedHmac = crypto.createHmac("sha256", secret).update(payload).digest("hex");

    if (!crypto.timingSafeEqual(Buffer.from(providedHmac), Buffer.from(expectedHmac))) {
      return { bookingId, action, valid: false };
    }

    return { bookingId, action, valid: true };
  } catch {
    return { bookingId: "", action: "", valid: false };
  }
}

// GET /api/bookings/[id]/quick-action?token=xxx — One-click confirm/cancel via HMAC token (PUBLIC)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimited = await applyRateLimit(generalLimiter, { ip: getClientIp(req) });
  if (rateLimited) return rateLimited;

  const token = new URL(req.url).searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Token required" }, { status: 400 });

  const { bookingId, action, valid } = verifyActionToken(token);
  if (!valid) return NextResponse.json({ error: "Invalid or expired token" }, { status: 403 });

  const { id } = await params;
  if (id !== bookingId) return NextResponse.json({ error: "Token mismatch" }, { status: 403 });

  if (!["confirm", "cancel"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  // The HMAC token IS the authorization here (guest bookings have user_id NULL, so the
  // RLS-bound client always returns 0 rows for them). Use the admin client for the
  // token-gated read/update, mirroring app/api/walkin/confirm + app/api/bookings/guest-lookup.
  const admin = createAdminSupabaseClient();
  const { data: booking } = await admin
    .from("bookings")
    .select(
      "id, status, starts_at, paid_amount, price_paid, payment_intent_id, payment_status, refunded_amount, stripe_customer_id, stripe_payment_method_id, policy_snapshot, salons(cancellation_fee_type, cancellation_fee_value, free_cancel_hours)"
    )
    .eq("id", bookingId)
    .single();

  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  // Audit finding #1 (HIGH, 2026-07-12), RECOVERED 2026-08-14. This route's only gate was a
  // self-contained HMAC token with no server-side single-use marker, so the link in a customer's
  // email stayed REPLAYABLE until its embedded expiry passed: an email link-scanner, or anyone who
  // got the URL, could act on it again and again. Check-and-set `consumed_at` in the SAME update as
  // the status change, so zero rows returned means the link was already used.
  //
  // NOT taken wholesale from the branch it was stranded on. That branch's copy of this file also
  // deleted main's status CAS guard and dropped the `money` result, both of which landed later, so
  // copying it across would have undone two fixes to fix one. Only the single-use marker is lifted.
  // The marker is PER ACTION, not per booking. The first version of this fix used one shared
  // `consumed_at` for both branches, and the review panel caught what that does: a guest clicks
  // confirm, the row is marked used, and their cancel link is then refused for ever, even though
  // it was never clicked. Guest bookings have no signed-in cancel path (see the note above), so
  // that would have locked them out of the only way they have to cancel, and an email scanner
  // auto-clicking confirm would have done it to them. Worse than the replay it was closing.
  //
  // Also re-asserts `status = 'pending'` at write time, which the cancel branch below has always
  // done: without it a stale-but-unexpired confirm link can revive a booking the salon already
  // cancelled, after its slot was freed and possibly rebooked.
  if (action === "confirm" && booking.status === "pending") {
    const { data: confirmedRows } = await admin
      .from("bookings")
      .update({ status: "confirmed", confirm_link_used_at: new Date().toISOString() })
      .eq("id", bookingId)
      .eq("status", "pending")
      .is("confirm_link_used_at", null)
      .select("id");
    if (!confirmedRows || confirmedRows.length === 0) {
      return NextResponse.json({ error: "Link already used" }, { status: 409 });
    }
    return NextResponse.json({ result: "confirmed", booking_id: bookingId });
  }

  // Array.prototype.includes requires a string arg; booking.status is string | null here.
  // ?? "" is behaviorally inert (the array never contains ""), type-only cast, no new branch.
  if (action === "cancel" && ["confirmed", "pending"].includes(booking.status ?? "")) {
    // CAS: re-assert the status read above (mirrors app/api/bookings/[id]/cancel's guard) so
    // a concurrent state change (e.g. the salon already cancelled it) cannot double-process
    // this booking. booking.status is non-null inside this branch (guaranteed by the includes
    // guard above). We check the row count: if the race is lost, DO NOT free the slot or refund.
    // The single-use marker (audit finding #1, recovered 2026-08-14) rides ALONGSIDE the existing
    // status CAS rather than replacing it: the status guard stops a concurrent state change, the
    // cancel_link_used_at guard stops the same link being replayed. Two different races, both real.
    const { data: cancelledRows } = await admin
      .from("bookings")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
        cancel_link_used_at: new Date().toISOString(),
      })
      .eq("id", bookingId)
      .eq("status", booking.status!)
      .is("cancel_link_used_at", null)
      .select("id");
    if (!cancelledRows || cancelledRows.length === 0) {
      // Either the status changed under us, or the link was already used. Do nothing else.
      return NextResponse.json({ result: "noop", booking_id: bookingId }, { status: 409 });
    }
    // Free slot
    await admin.from("availability_slots").update({ status: "available", booked_by: null, booking_id: null }).eq("booking_id", bookingId);

    // Audit finding #19 (MEDIUM, 2026-07-09): this public one-click cancel used to set
    // status='cancelled' and free the slot with NO refund and NO fee, stranding a prepaid
    // customer's money. Route through the SAME chokepoint the canonical customer-cancel
    // branch uses (lib/bookings/customer-cancel-money.ts) so a prepaid booking is refunded
    // base minus fee, matching /api/bookings/[id]/cancel's customer branch exactly. The
    // HMAC token IS the authorization here (same discipline as the read/update above).
    // Same source as the canonical /cancel route: the frozen policy_snapshot, never the
    // salon's current live policy (see lib/bookings/customer-cancel-money.ts).
    const cancelPolicy = resolveCustomerCancelPolicy(bookingId, booking.policy_snapshot as any, booking.salons as any);
    const money = await applyCustomerCancelMoney(
      admin,
      {
        id: bookingId,
        starts_at: booking.starts_at,
        paid_amount: booking.paid_amount,
        price_paid: booking.price_paid,
        payment_intent_id: booking.payment_intent_id,
        payment_status: booking.payment_status,
        refunded_amount: booking.refunded_amount,
        stripe_customer_id: booking.stripe_customer_id,
        stripe_payment_method_id: booking.stripe_payment_method_id,
      },
      cancelPolicy,
      "customer cancelled via one-click email link",
    );

    // observability-3: this route is public and token-gated (a guest booking has no
    // profiles row, so actor_id must stay null, not a uuid-cast crash into
    // logAuditEvent's own catch). It is otherwise the SAME money move its sibling
    // /api/bookings/[id]/cancel already audits (via logAuditEvent) for a logged-in
    // customer; without this row a one-click refund/fee here left zero trace.
    // Best-effort: never let a failed audit write mask the cancel that already
    // committed above.
    if (money.refundAmount > 0 || money.feeChargeStatus !== "none") {
      const { error: auditErr } = await admin.from("audit_log").insert({
        actor_id: null,
        action: "cancellation_via_quick_action_link",
        target_type: "booking",
        target_id: bookingId,
        metadata: {
          refund_amount_cents: money.refundAmount,
          fee_cents: money.feeCents,
          fee_charge_status: money.feeChargeStatus,
          fee_charged_cents: money.feeChargedCents,
          payment_intent_id: money.feeChargePaymentIntentId,
        },
      });
      if (auditErr) {
        console.error("[quick-action] audit_log write failed after cancel money move:", auditErr.message, { booking_id: bookingId });
      }
    }

    return NextResponse.json({ result: "cancelled", booking_id: bookingId });
  }

  return NextResponse.json({ error: `Cannot ${action} booking in status ${booking.status}` }, { status: 400 });
}
