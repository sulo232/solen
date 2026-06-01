export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, paymentLimiter, getClientIp } from "@/lib/ratelimit";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { validateBody, createCaseSchema, salonReviewSchema } from "@/lib/validations";
import { getServerEnv } from "@/lib/env";
import { logAuditEvent } from "@/lib/audit";
import { resolveBookingActor } from "@/lib/bookings/authorize";
import { issueRefund, RefundError } from "@/lib/bookings/issue-refund";
import {
  resolveEligibility,
  reasonAllowedOnConfirmed,
  writeCaseEvent,
  type ReasonCode,
} from "@/lib/bookings/dispute-engine";

// SP-3 Endpoints 1 (POST create), 2 (GET view + timeline), 3 (PATCH salon review).
//
// This route is the UNIFIED customer/guest entry point for the REFUND direction
// (master plan §10b.2 — "report a problem" and "request a refund" are the SAME
// record, distinguished only by `wants_refund` + `requested_amount`). Authz for
// every method goes through the single `resolveBookingActor()` resolver (SP-2):
// customer (session owns booking) / guest (booking access-token cookie) / salon
// (owns the booking's salon) / admin. Money is INTEGER Rappen; the ONLY money
// move is via the shared `issueRefund` chokepoint (SP-0). Nothing auto-approves.

const REFUND_TERMINAL_OR_REJECTED = new Set([
  "refunded", "charged", "void", "closed", "salon_rejected", "admin_rejected",
]);

/** Rate-limit key: userId for an authenticated actor, IP for a guest. */
function rateLimitId(userId: string | null, req: NextRequest) {
  return userId ? { userId } : { ip: getClientIp(req) };
}

/** Shape a dispute row for the API response (the refund-direction fields). */
function shapeCase(row: Record<string, any> | null) {
  if (!row) return null;
  return {
    id: row.id,
    booking_id: row.booking_id,
    direction: row.direction,
    status: row.status,
    reason_code: row.reason_code,
    issue_type: row.issue_type,
    eligibility: row.eligibility,
    fast_track_recommended: row.fast_track_recommended,
    requested_amount: row.requested_amount,
    resolved_amount: row.resolved_amount,
    description: row.description,
    salon_response: row.salon_response,
    salon_responded_at: row.salon_responded_at,
    customer_response: row.customer_response,
    customer_responded_at: row.customer_responded_at,
    escalated_at: row.escalated_at,
    admin_response: row.admin_response,
    admin_responded_at: row.admin_responded_at,
    stripe_refund_id: row.stripe_refund_id,
    expires_at: row.expires_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

// ───────────────────────────────────────────────────────────────────────────
// GET — customer/guest views their refund case + its timeline (Endpoint 2).
// ───────────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: bookingId } = await params;

  const { actor, booking } = await resolveBookingActor(req, bookingId);
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });
  // Salon/admin use their own surfaces (SP-5); this view is for the requester.
  if (actor !== "customer" && actor !== "guest") {
    // Unauthenticated/guest-without-token → uniform 404 (no enumeration, §10b.7);
    // an authenticated-but-wrong actor → 403.
    return actor === null
      ? NextResponse.json({ error: "Not found" }, { status: 404 })
      : NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createAdminSupabaseClient();
  const { data: dispute } = await admin
    .from("booking_disputes")
    .select("*")
    .eq("booking_id", bookingId)
    .eq("direction", "refund")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let events: any[] = [];
  if (dispute) {
    const { data: ev } = await admin
      .from("case_events")
      .select("id, actor_role, action, from_status, to_status, amount, note, created_at")
      .eq("dispute_id", dispute.id)
      .order("created_at", { ascending: true });
    events = ev ?? [];
  }

  return NextResponse.json({ case: shapeCase(dispute), events });
}

// ───────────────────────────────────────────────────────────────────────────
// POST — customer/guest creates a refund/complaint case (Endpoint 1).
// ───────────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: bookingId } = await params;

  const disabled = await checkFeatureEnabled("dispute_reporting");
  if (disabled) return disabled;

  const { actor, booking, userId } = await resolveBookingActor(req, bookingId);
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (actor !== "customer" && actor !== "guest") {
    return actor === null
      ? NextResponse.json({ error: "Not found" }, { status: 404 })
      : NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Banned check only meaningful for a logged-in customer.
  if (userId) {
    const banned = await checkUserBanned(userId);
    if (banned) return banned;
  }

  const rateLimited = await applyRateLimit(paymentLimiter, rateLimitId(userId, req));
  if (rateLimited) return rateLimited;

  const body = await req.json();
  const { data: validated, error: validationError } = validateBody(createCaseSchema, body);
  if (validationError) return NextResponse.json({ error: validationError.message }, { status: 400 });

  const reasonCode = validated.reason_code as ReasonCode;

  // Booking-status gate (§ Endpoint 1, logic #1): completed for refund/complaint;
  // wrong_amount / double_charge also allowed on confirmed.
  const status = booking.status as string;
  const statusOk =
    status === "completed" || (status === "confirmed" && reasonAllowedOnConfirmed(reasonCode));
  if (!statusOk) {
    return NextResponse.json(
      { error: "Can only report a problem on a completed booking" },
      { status: 400 },
    );
  }

  // Remaining refundable (Rappen). NEVER read price_paid (CHF — the 100x bug).
  const paidAmount: number = booking.paid_amount ?? 0;
  const refundedAmount: number = booking.refunded_amount ?? 0;
  const remaining = Math.max(0, paidAmount - refundedAmount);

  // Resolve the money ask. wants_refund=false → pure complaint (null amount).
  // wants_refund=true + provided → partial, must be <= remaining. omitted → full (null).
  let requestedAmount: number | null = null;
  if (validated.wants_refund) {
    if (validated.requested_amount != null) {
      if (validated.requested_amount <= 0) {
        return NextResponse.json({ error: "requested_amount must be positive" }, { status: 400 });
      }
      if (remaining > 0 && validated.requested_amount > remaining) {
        return NextResponse.json(
          { error: `requested_amount exceeds remaining refundable (${remaining})` },
          { status: 400 },
        );
      }
      requestedAmount = validated.requested_amount;
    }
    // else null = "full" (resolved against remaining at approval).
  }

  const { eligibility, fastTrackRecommended, issueType } = resolveEligibility(reasonCode);

  // Salon owner (reported party). booking.salon_id is on the row from resolveBookingActor.
  const admin = createAdminSupabaseClient();
  let salonOwnerId: string | null = null;
  if (booking.salon_id) {
    const { data: salon } = await admin
      .from("salons").select("owner_id").eq("id", booking.salon_id).maybeSingle();
    salonOwnerId = salon?.owner_id ?? null;
  }

  const { data: dispute, error } = await admin
    .from("booking_disputes")
    .insert({
      booking_id: bookingId,
      direction: "refund",
      status: "open",
      reason_code: reasonCode,
      issue_type: issueType, // 075 back-compat (the live issue_type CHECK still applies)
      description: validated.description,
      requested_amount: requestedAmount,
      eligibility,
      fast_track_recommended: fastTrackRecommended,
      reporter_id: userId,           // null for guest
      requested_by_user_id: userId,  // null for guest
      reported_id: salonOwnerId,     // null when no owner derivable
      // Guest contact snapshot (so a salon/admin can reach a no-account requester)
      guest_name: actor === "guest" ? (booking.guest_name ?? null) : null,
      guest_email: actor === "guest" ? (booking.guest_email ?? null) : null,
      guest_phone: actor === "guest" ? (booking.guest_phone ?? null) : null,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      // partial unique index booking_disputes_one_open_per_dir — one open refund per booking.
      return NextResponse.json(
        { error: "An open refund case already exists for this booking" },
        { status: 409 },
      );
    }
    console.error("[booking-disputes] create case failed:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Timeline: created.
  await writeCaseEvent(admin, {
    disputeId: dispute.id,
    actorRole: actor,
    actorUserId: userId,
    action: "created",
    toStatus: "open",
    amount: requestedAmount,
  });

  await logAuditEvent(req, userId ?? "guest", "booking_dispute_created", "booking_dispute", dispute.id, {
    reason_code: reasonCode,
    wants_refund: validated.wants_refund,
    requested_amount: requestedAmount,
    actor,
  });

  // Reuse the existing Resend hook to notify the salon owner.
  const resendApiKey = getServerEnv().RESEND_API_KEY;
  if (!resendApiKey) {
    console.warn("[booking-disputes] RESEND_API_KEY not set — skipping email notification");
  }
  if (salonOwnerId && resendApiKey) {
    const { data: owner } = await admin.from("profiles").select("email").eq("id", salonOwnerId).single();
    if (owner?.email) {
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: "support@solen.ch",
            to: owner.email,
            subject: "Ein Kunde hat ein Problem mit einer Buchung gemeldet",
            html: `<p>Ein Kunde hat ein Problem mit Buchung #${bookingId} gemeldet.</p>
                   <p><strong>Typ:</strong> ${reasonCode}</p>
                   <p>Bitte loggen Sie sich in Ihr Dashboard ein, um zu antworten.</p>`,
          }),
        });
      } catch (e) {
        console.error("[booking-disputes] Failed to send dispute email to salon owner", e);
      }
    }
  }

  return NextResponse.json({ case: shapeCase(dispute) }, { status: 201 });
}

// ───────────────────────────────────────────────────────────────────────────
// PATCH — salon reviews the refund case: approve full/partial (→ issueRefund)
//         or reject with a reason (Endpoint 3). review-first; salon is FIRST.
// ───────────────────────────────────────────────────────────────────────────
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: bookingId } = await params;

  const { actor, booking, userId } = await resolveBookingActor(req, bookingId);
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (actor !== "salon" || !userId) {
    return actor === null
      ? NextResponse.json({ error: "Not found" }, { status: 404 })
      : NextResponse.json({ error: "Only the salon owner can review this case" }, { status: 403 });
  }

  const banned = await checkUserBanned(userId);
  if (banned) return banned;

  const rateLimited = await applyRateLimit(paymentLimiter, { userId });
  if (rateLimited) return rateLimited;

  const body = await req.json();
  const { data: validated, error: validationError } = validateBody(salonReviewSchema, body);
  if (validationError) return NextResponse.json({ error: validationError.message }, { status: 400 });

  const admin = createAdminSupabaseClient();

  // Load the OPEN refund case for this booking (CAS target).
  const { data: dispute } = await admin
    .from("booking_disputes")
    .select("id, status")
    .eq("booking_id", bookingId)
    .eq("direction", "refund")
    .eq("status", "open")
    .maybeSingle();
  if (!dispute) {
    return NextResponse.json({ error: "No open refund case to review" }, { status: 409 });
  }

  // ── reject ────────────────────────────────────────────────────────────────
  if (validated.action === "reject") {
    const { data: updated, error: updErr } = await admin
      .from("booking_disputes")
      .update({
        status: "salon_rejected",
        salon_response: validated.salon_response,
        salon_responded_at: new Date().toISOString(),
      })
      .eq("id", dispute.id)
      .eq("status", "open") // CAS
      .select("id")
      .maybeSingle();
    if (updErr) {
      console.error("[booking-disputes] salon reject failed:", updErr.message);
      return NextResponse.json({ error: updErr.message }, { status: 500 });
    }
    if (!updated) return NextResponse.json({ error: "Case status changed; reload" }, { status: 409 });

    await writeCaseEvent(admin, {
      disputeId: dispute.id, actorRole: "salon", actorUserId: userId,
      action: "salon_rejected", fromStatus: "open", toStatus: "salon_rejected",
      note: validated.salon_response,
    });
    await logAuditEvent(req, userId, "booking_dispute_salon_rejected", "booking_dispute", dispute.id, {});
    return NextResponse.json({ status: "salon_rejected" });
  }

  // ── approve (→ issueRefund) ────────────────────────────────────────────────
  // Compute amount: explicit approved_amount, else full remaining. Rappen.
  const paidAmount: number = booking.paid_amount ?? 0;
  const refundedAmount: number = booking.refunded_amount ?? 0;
  const remaining = Math.max(0, paidAmount - refundedAmount);
  const amount = validated.approved_amount ?? remaining;

  if (amount <= 0) {
    return NextResponse.json({ error: "Nothing left to refund on this booking" }, { status: 400 });
  }
  if (amount > remaining) {
    return NextResponse.json(
      { error: `approved_amount exceeds remaining refundable (${remaining})` },
      { status: 400 },
    );
  }

  // (a) CAS checkpoint open → salon_approved, persisting the resolved amount +
  //     a deterministic idempotency key BEFORE talking to Stripe.
  const idempotencyKey = `dispute:${dispute.id}:refund:${amount}`;
  const { data: checkpoint, error: cpErr } = await admin
    .from("booking_disputes")
    .update({
      status: "salon_approved",
      resolved_amount: amount,
      idempotency_key: idempotencyKey,
      salon_response: validated.salon_response,
      salon_responded_at: new Date().toISOString(),
    })
    .eq("id", dispute.id)
    .eq("status", "open") // CAS
    .select("id")
    .maybeSingle();
  if (cpErr) {
    // idempotency_key partial-unique collision (a concurrent retry of the same
    // amount) also surfaces here as 23505 → treat as stale/in-progress.
    if (cpErr.code === "23505") {
      return NextResponse.json({ error: "Refund already in progress" }, { status: 409 });
    }
    console.error("[booking-disputes] salon approve checkpoint failed:", cpErr.message);
    return NextResponse.json({ error: cpErr.message }, { status: 500 });
  }
  if (!checkpoint) return NextResponse.json({ error: "Case status changed; reload" }, { status: 409 });

  // (c) The ONE Stripe refund chokepoint. issueRefund writes refunded_amount +
  //     payment_status atomically (CAS on the stale total) — SP-3 never touches them.
  let refundResult;
  try {
    refundResult = await issueRefund({
      db: admin,
      source: "booking",
      id: bookingId,
      amountCents: amount,
      actor: "salon",
      reason: "requested_by_customer",
    });
  } catch (e) {
    // Leave the case at salon_approved (checkpoint). A retry re-enters with the
    // SAME idempotency key (Stripe dedupes) and the same checkpoint resumes.
    console.error("[booking-disputes] salon refund via issueRefund failed:", e);
    if (e instanceof RefundError) {
      const httpStatus = e.code === "BOOKING_NOT_FOUND" ? 404
        : e.code === "STRIPE_FAILED" || e.code === "CONCURRENT_RETRY" ? 502
        : 400;
      return NextResponse.json({ error: e.message, code: e.code, status: "salon_approved" }, { status: httpStatus });
    }
    return NextResponse.json({ error: "Refund failed", status: "salon_approved" }, { status: 502 });
  }

  // (d) Advance salon_approved → refunded (CAS), record the Stripe refund id.
  await admin
    .from("booking_disputes")
    .update({ status: "refunded", stripe_refund_id: refundResult.refundId })
    .eq("id", dispute.id)
    .eq("status", "salon_approved");

  await writeCaseEvent(admin, {
    disputeId: dispute.id, actorRole: "salon", actorUserId: userId,
    action: "refund_issued", fromStatus: "salon_approved", toStatus: "refunded", amount,
  });
  await logAuditEvent(req, userId, "booking_dispute_salon_approved", "booking_dispute", dispute.id, {
    amount, stripe_refund_id: refundResult.refundId,
  });

  return NextResponse.json({
    status: "refunded",
    resolved_amount: amount,
    stripe_refund_id: refundResult.refundId,
  });
}
