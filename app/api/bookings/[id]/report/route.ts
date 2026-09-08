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
import { notifyRefundProcessed } from "@/lib/bookings/notify-refund";
import { reportError } from "@/lib/error-report";
import {
  resolveEligibility,
  reasonAllowedOnConfirmed,
  writeCaseEvent,
  salonRespondsByDeadline,
  salonResponseOverdue,
  type ReasonCode,
  type DisputeStatus,
} from "@/lib/bookings/dispute-engine";
import { sendEmail } from "@/lib/email";

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

// trust-04: reporting window (REFUND_APPEAL_PLAN.md section 11 flagged this as open
// since 2026-06-01: "proposed default 14 days for appointments, owner to confirm".
// No resolution found, so a completed booking stayed an open financial liability
// forever. 14 days matches the plan's own proposed default; the ToS (section 13.1a)
// states the same number so the two never drift apart.
const REPORTING_WINDOW_DAYS = 14;

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
    // Same function a timeout/auto-escalation job would use (dispute-engine.ts),
    // so the date shown here and the date any future cron acts on can never
    // drift apart. null once the salon has already responded.
    salon_responds_by:
      salonRespondsByDeadline(row.status as DisputeStatus, row.created_at)?.toISOString() ?? null,
    // Discriminates "on track" from "already broken" for the same deadline above
    // (response-deadline-visible review, 2026-08-20). Same status/created_at inputs,
    // so it can never disagree with salon_responds_by.
    salon_response_overdue: salonResponseOverdue(row.status as DisputeStatus, row.created_at),
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

  // Booking display facts for the status/timeline + entry screens. This is the ONLY
  // guest-safe surface that serves these (the relational /api/bookings/[id] GET is
  // session-only, 401s a guest), so it carries the minimal facts the case view renders:
  // salon name/address, service, appointment, paid/refunded (Rappen), order number,
  // booking status. No card PAN/last4 exists on the row (foundation migration) — never
  // fabricate one. Pulled via the admin client we already hold (entitlement proven above).
  const { data: bkData, error: bkErr } = await admin
    .from("bookings")
    .select(
      "id, reference_code, status, starts_at, paid_amount, refunded_amount, " +
        "guest_name, salons(name, address, postal_code, cover_photo_url), services(name_de, name_en, name_fr, name_it), " +
        "staff_members(name)",
    )
    .eq("id", bookingId)
    .maybeSingle();
  if (bkErr) console.error("[booking-disputes] booking facts query failed:", bkErr.message);

  // The clients are intentionally untyped (lib/supabase.ts); narrow the joined shape here.
  const bk = bkData as Record<string, any> | null;
  const salon = (bk?.salons ?? null) as { name?: string; address?: string; postal_code?: string; cover_photo_url?: string | null } | null;
  const service = (bk?.services ?? null) as Record<string, string | null> | null;
  const staff = (bk?.staff_members ?? null) as { name?: string } | null;

  const bookingFacts = bk
    ? {
        id: bk.id,
        reference_code: bk.reference_code ?? null,
        status: bk.status ?? null,
        starts_at: bk.starts_at ?? null,
        paid_amount: bk.paid_amount ?? 0, // Rappen
        refunded_amount: bk.refunded_amount ?? 0, // Rappen
        currency: "CHF",
        salon_name: salon?.name ?? null,
        salon_address: salon?.address ?? null,
        salon_city: salon?.postal_code ?? null, // postal code stands in for the city line
        salon_photo: salon?.cover_photo_url ?? null, // V3-D424: real salon photo (FE falls back to initials when null)
        // name_fr/name_it now selected above; the FE serviceName() helper (refund/shared.ts)
        // already falls back en -> de -> fr -> it when a locale column is empty.
        service_name: service
          ? {
              de: service.name_de ?? null,
              en: service.name_en ?? null,
              fr: service.name_fr ?? null,
              it: service.name_it ?? null,
            }
          : null,
        staff_name: staff?.name ?? null,
      }
    : null;

  return NextResponse.json({ case: shapeCase(dispute), events, booking: bookingFacts });
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

  // trust-04: reporting window. starts_at is the appointment time; a booking older
  // than REPORTING_WINDOW_DAYS from its own appointment can no longer open a NEW
  // case. Only gates creation (this POST); an already-open case keeps running through
  // review/escalation regardless of how old it gets.
  if (booking.starts_at) {
    const ageMs = Date.now() - new Date(booking.starts_at as string).getTime();
    const windowMs = REPORTING_WINDOW_DAYS * 24 * 60 * 60 * 1000;
    if (ageMs > windowMs) {
      return NextResponse.json(
        {
          error: `The reporting window has closed. Cases must be opened within ${REPORTING_WINDOW_DAYS} days of the appointment.`,
          code: "REPORTING_WINDOW_CLOSED",
        },
        { status: 400 },
      );
    }
  }

  // Remaining refundable (Rappen). NEVER read price_paid (CHF — the 100x bug).
  const paidAmount: number = booking.paid_amount ?? 0;
  const refundedAmount: number = booking.refunded_amount ?? 0;
  const remaining = Math.max(0, paidAmount - refundedAmount);

  // Empty-refund guard: a booking that was never charged (paid_amount null/0 — the
  // "free booking" gap) has nothing to refund. Reject the refund REQUEST up front so
  // issueRefund never throws NO_PAID_AMOUNT mid-flow and strands the case at
  // salon_approved. A pure complaint (wants_refund=false) still goes through.
  if (validated.wants_refund && remaining <= 0) {
    return NextResponse.json(
      { error: "Nothing to refund — this booking has no refundable payment", code: "NO_PAID_AMOUNT" },
      { status: 400 },
    );
  }

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

  // H7 — re-file cooldown. The partial unique index booking_disputes_one_open_per_dir
  // EXCLUDES salon_rejected/admin_rejected from "open", so a customer whose refund was
  // rejected can immediately spam a FRESH refund instead of using the proper path
  // (ESCALATE → admin review). Guard ONLY the refund direction (wants_refund) — pure
  // complaints and upcharges are unaffected. Block iff the most-recent refund case is
  // still in a rejected state, was rejected within the last 24h, and has NOT been
  // escalated. Tightly scoped: first filings (no prior case) and already-escalated
  // cases pass; after the 24h cooldown a genuinely new problem can be re-filed.
  if (validated.wants_refund) {
    const COOLDOWN_MS = 24 * 60 * 60 * 1000;
    const { data: lastRefundCase } = await admin
      .from("booking_disputes")
      .select("id, status, escalated_at, salon_responded_at, admin_responded_at, updated_at")
      .eq("booking_id", bookingId)
      .eq("direction", "refund")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (
      lastRefundCase &&
      (lastRefundCase.status === "salon_rejected" || lastRefundCase.status === "admin_rejected") &&
      !lastRefundCase.escalated_at
    ) {
      // When was it rejected? salon_rejected → salon_responded_at; admin_rejected →
      // admin_responded_at. Fall back to updated_at (the rejection was the last write).
      const rejectedAtRaw =
        lastRefundCase.status === "salon_rejected"
          ? lastRefundCase.salon_responded_at
          : lastRefundCase.admin_responded_at;
      const rejectedAt = new Date(rejectedAtRaw ?? lastRefundCase.updated_at ?? 0).getTime();
      const withinCooldown = Number.isFinite(rejectedAt) && Date.now() - rejectedAt < COOLDOWN_MS;

      // Conservative: salon_rejected is still escalatable, so block it (point to ESCALATE).
      // admin_rejected is terminal — only block during the cooldown to avoid a hard lock.
      const shouldBlock = lastRefundCase.status === "salon_rejected" || withinCooldown;
      if (shouldBlock) {
        return NextResponse.json(
          {
            error:
              "This refund was already reviewed and rejected. Re-filing is disabled — escalate the existing case to Solen for review instead.",
            code: "REFUND_REJECTED_USE_ESCALATE",
            dispute_id: lastRefundCase.id,
          },
          { status: 409 },
        );
      }
    }
  }
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
        await sendEmail({
          from: "support@solen.ch",
          to: owner.email,
          subject: "Ein Kunde hat ein Problem mit einer Buchung gemeldet",
          html: `<p>Ein Kunde hat ein Problem mit Buchung #${bookingId} gemeldet.</p>
                   <p><strong>Typ:</strong> ${reasonCode}</p>
                   <p>Bitte loggen Sie sich in Ihr Dashboard ein, um zu antworten.</p>`,
          // The per-call 8s abort that used to sit here is gone because sendEmail carries its own
          // 5s timeout for every send, so the bound survives and is no longer per-caller.
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
    // Default: leave the case at salon_approved (checkpoint). A retry re-enters with
    // the SAME idempotency key (Stripe dedupes) and the same checkpoint resumes.
    console.error("[booking-disputes] salon refund via issueRefund failed:", e);
    if (e instanceof RefundError) {
      // NO_PAID_AMOUNT / NO_PAYMENT are NON-retryable: there is no money to move, so a
      // retry can never succeed and leaving the case at salon_approved misleadingly
      // signals an issued refund. Roll the checkpoint back to open (CAS-guarded) and
      // clear the idempotency key so the case reflects reality (no money moved).
      if (e.code === "NO_PAID_AMOUNT" || e.code === "NO_PAYMENT") {
        const { error: rbErr } = await admin
          .from("booking_disputes")
          .update({ status: "open", resolved_amount: null, idempotency_key: null })
          .eq("id", dispute.id)
          .eq("status", "salon_approved"); // CAS — only undo our own checkpoint.
        if (rbErr) console.error("[booking-disputes] checkpoint rollback failed:", rbErr.message);
        return NextResponse.json({ error: e.message, code: e.code, status: "open" }, { status: 400 });
      }
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

  // N1: notify the customer their refund was issued. Never blocks/rolls back the money
  // move — the refund already committed above (same discipline as the Stripe webhook).
  await notifyRefundProcessed(admin, bookingId, amount, "booking-disputes").catch(async (err) => {
    console.error("[booking-disputes] refund notification failed:", err);
    await reportError("booking-disputes-refund-notification", err, { bookingId, amount });
  });

  return NextResponse.json({
    status: "refunded",
    resolved_amount: amount,
    stripe_refund_id: refundResult.refundId,
  });
}
