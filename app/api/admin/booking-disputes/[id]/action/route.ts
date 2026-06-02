export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, adminLimiter } from "@/lib/ratelimit";
import { logAuditEvent } from "@/lib/audit";
import { validateBody, adminDisputeBookingActionSchema } from "@/lib/validations";
import { issueRefund, RefundError } from "@/lib/bookings/issue-refund";
import { notifyRefundProcessed } from "@/lib/bookings/notify-refund";
import { writeCaseEvent } from "@/lib/bookings/dispute-engine";
import { getServerEnv } from "@/lib/env";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: disputeId } = await params;

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rateLimited = await applyRateLimit(adminLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const body = await req.json();
  const { data: validated, error: validationError } = validateBody(adminDisputeBookingActionSchema, body);
  if (validationError) return NextResponse.json({ error: validationError.message }, { status: 400 });

  const admin = createAdminSupabaseClient();

  // Fetch dispute first
  const { data: dispute } = await admin
    .from("booking_disputes")
    .select("id, reporter_id, reported_id, status, booking_id, direction")
    .eq("id", disputeId)
    .single();
  if (!dispute) return NextResponse.json({ error: "Dispute not found" }, { status: 404 });

  const { action, resolution_note } = validated;

  if (action === "dismiss" || action === "resolve_with_note") {
    await admin.from("booking_disputes").update({
      status: "resolved",
      resolution: resolution_note ?? "Resolved by admin",
      resolved_by: user.id,
      resolved_at: new Date().toISOString(),
    }).eq("id", disputeId);

  } else if (action === "escalate") {
    const mediationStart = new Date();
    const mediationDeadline = new Date(mediationStart.getTime() + 30 * 24 * 60 * 60 * 1000);
    await admin.from("booking_disputes").update({
      status: "escalated",
      mediation_started_at: mediationStart.toISOString(),
      mediation_deadline_at: mediationDeadline.toISOString(),
    }).eq("id", disputeId);
    
    // Phase 7: Email to both parties on escalation
    try {
      const { data: parties } = await admin
        .from("profiles")
        .select("id, email")
        .in("id", [dispute.reporter_id, dispute.reported_id]);
        
      const resendApiKey = getServerEnv().RESEND_API_KEY;
      if (!resendApiKey) {
        console.warn("[booking-disputes] RESEND_API_KEY not set — skipping email notification");
      }
      if (parties && parties.length > 0 && resendApiKey) {
        const emails = parties.map(p => p.email).filter(Boolean) as string[];
        if (emails.length > 0) {
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              from: 'support@solen.ch',
              to: emails,
              subject: 'Mediation für Buchungsbeschwerde gestartet (30-Tage-Frist) | Mediation Started',
              html: `<p>Your dispute has entered the 30-day mediation period (T&S §13.2).</p>
                     <p>If unresolved by ${mediationDeadline.toLocaleDateString()}, either party may proceed to court in Basel-Stadt.</p>
                     <p>Contact: support@solen.ch</p>`,
            }),
          });
        }
      }
    } catch (e) {
      console.error("Failed to send escalation email", e);
    }

  } else if (action === "refund") {
    // Admin-issued refund — routes through the shared issueRefund chokepoint
    // (§10b#3), the single place that talks to Stripe refunds + writes
    // refunded_amount. amounts are integer Rappen; NEVER coalesce price_paid (CHF).
    const { data: disputeFetch } = await admin
      .from("booking_disputes")
      .select("booking_id")
      .eq("id", disputeId)
      .single();
    if (!disputeFetch) return NextResponse.json({ error: "Dispute not found" }, { status: 404 });

    // Default (full remaining) when refund_amount is omitted: paid_amount - refunded_amount,
    // both integer Rappen. Do NOT read price_paid.
    let refundCents = validated.refund_amount ?? null;
    if (refundCents == null) {
      const { data: amounts } = await admin
        .from("bookings")
        .select("paid_amount, refunded_amount")
        .eq("id", disputeFetch.booking_id)
        .single();
      const paid = amounts?.paid_amount ?? 0;
      const already = amounts?.refunded_amount ?? 0;
      refundCents = paid - already; // remaining, Rappen
    }

    let refundResult;
    try {
      refundResult = await issueRefund({
        db: admin,
        source: "booking",
        id: disputeFetch.booking_id,
        amountCents: refundCents,
        actor: "admin",
        reason: resolution_note ?? "Refund issued by admin",
      });
    } catch (e) {
      console.error("[booking-disputes] admin refund via issueRefund failed:", e);
      if (e instanceof RefundError) {
        const status =
          e.code === "BOOKING_NOT_FOUND" ? 404
          : e.code === "STRIPE_FAILED" || e.code === "CONCURRENT_RETRY" ? 500
          : 400;
        return NextResponse.json({ error: e.message, code: e.code }, { status });
      }
      return NextResponse.json({ error: "Refund failed" }, { status: 500 });
    }

    // Close the dispute. 'refunded' is the terminal refund state in the live
    // booking_disputes_status_check enum.
    await admin.from("booking_disputes").update({
      status: "refunded",
      resolution: resolution_note ?? "Refund issued by admin",
      resolved_by: user.id,
      resolved_at: new Date().toISOString(),
    }).eq("id", disputeId);

    // Timeline event (caller owns case_events; issueRefund only touches money + booking).
    await admin.from("case_events").insert({
      dispute_id: disputeId,
      actor_role: "admin",
      actor_user_id: user.id,
      action: "refunded",
      to_status: "refunded",
      amount: refundResult.totalRefundedCents,
      note: resolution_note ?? null,
    });

    // N1: notify the customer their refund was issued (this action's slice, Rappen).
    // Never blocks/rolls back the money move (same discipline as the Stripe webhook).
    await notifyRefundProcessed(admin, disputeFetch.booking_id, refundCents, "booking-disputes").catch((err) =>
      console.error("[booking-disputes] admin refund notification failed:", err),
    );

  } else if (action === "admin_approve") {
    // SP-3 Endpoint 5 — admin final decision on an ESCALATED refund. Same
    // approve machinery as the salon path (Endpoint 3.3) but actor=admin:
    // checkpoint escalated → admin_approved (CAS), persist idempotency key,
    // call the shared issueRefund chokepoint, advance to refunded.
    if (dispute.status !== "escalated") {
      return NextResponse.json(
        { error: "Can only approve an escalated case", status: dispute.status },
        { status: 409 },
      );
    }

    // Amount: explicit refund_amount, else full remaining (Rappen). Never read price_paid.
    let amount = validated.refund_amount ?? null;
    if (amount == null) {
      const { data: amounts } = await admin
        .from("bookings")
        .select("paid_amount, refunded_amount")
        .eq("id", dispute.booking_id)
        .single();
      const paid = amounts?.paid_amount ?? 0;
      const already = amounts?.refunded_amount ?? 0;
      amount = Math.max(0, paid - already);
    }
    if (amount <= 0) {
      return NextResponse.json({ error: "Nothing left to refund on this booking" }, { status: 400 });
    }

    // CAS checkpoint escalated → admin_approved, persisting amount + idem key BEFORE Stripe.
    const idempotencyKey = `dispute:${disputeId}:refund:${amount}`;
    const { data: checkpoint, error: cpErr } = await admin
      .from("booking_disputes")
      .update({
        status: "admin_approved",
        resolved_amount: amount,
        idempotency_key: idempotencyKey,
        admin_response: resolution_note ?? null,
        admin_responded_at: new Date().toISOString(),
      })
      .eq("id", disputeId)
      .eq("status", "escalated") // CAS
      .select("id")
      .maybeSingle();
    if (cpErr) {
      if (cpErr.code === "23505") {
        return NextResponse.json({ error: "Refund already in progress" }, { status: 409 });
      }
      console.error("[booking-disputes] admin approve checkpoint failed:", cpErr.message);
      return NextResponse.json({ error: cpErr.message }, { status: 500 });
    }
    if (!checkpoint) return NextResponse.json({ error: "Case status changed; reload" }, { status: 409 });

    let refundResult;
    try {
      refundResult = await issueRefund({
        db: admin,
        source: "booking",
        id: dispute.booking_id,
        amountCents: amount,
        actor: "admin",
        reason: resolution_note ?? "Refund approved by admin",
      });
    } catch (e) {
      // Leave at admin_approved (checkpoint); retry re-enters with the same idem key.
      console.error("[booking-disputes] admin approve via issueRefund failed:", e);
      if (e instanceof RefundError) {
        const httpStatus = e.code === "BOOKING_NOT_FOUND" ? 404
          : e.code === "STRIPE_FAILED" || e.code === "CONCURRENT_RETRY" ? 502
          : 400;
        return NextResponse.json({ error: e.message, code: e.code, status: "admin_approved" }, { status: httpStatus });
      }
      return NextResponse.json({ error: "Refund failed", status: "admin_approved" }, { status: 502 });
    }

    // Advance admin_approved → refunded (CAS) + back-compat resolution fields.
    await admin.from("booking_disputes").update({
      status: "refunded",
      stripe_refund_id: refundResult.refundId,
      resolution: resolution_note ?? "Refund approved by admin",
      resolved_by: user.id,
      resolved_at: new Date().toISOString(),
    }).eq("id", disputeId).eq("status", "admin_approved");

    await writeCaseEvent(admin, {
      disputeId, actorRole: "admin", actorUserId: user.id,
      action: "refund_issued", fromStatus: "admin_approved", toStatus: "refunded",
      amount, note: resolution_note ?? null,
    });

    // N1: notify the customer their refund was issued (this action's slice, Rappen).
    // Never blocks/rolls back the money move (same discipline as the Stripe webhook).
    await notifyRefundProcessed(admin, dispute.booking_id, amount, "booking-disputes").catch((err) =>
      console.error("[booking-disputes] admin approve notification failed:", err),
    );

  } else if (action === "admin_reject") {
    // SP-3 — admin denies an escalated refund. Terminal (admin_rejected).
    if (dispute.status !== "escalated") {
      return NextResponse.json(
        { error: "Can only reject an escalated case", status: dispute.status },
        { status: 409 },
      );
    }
    const { data: updated } = await admin
      .from("booking_disputes")
      .update({
        status: "admin_rejected",
        admin_response: resolution_note ?? null,
        admin_responded_at: new Date().toISOString(),
        resolution: resolution_note ?? "Refund rejected by admin",
        resolved_by: user.id,
        resolved_at: new Date().toISOString(),
      })
      .eq("id", disputeId)
      .eq("status", "escalated") // CAS
      .select("id")
      .maybeSingle();
    if (!updated) return NextResponse.json({ error: "Case status changed; reload" }, { status: 409 });

    await writeCaseEvent(admin, {
      disputeId, actorRole: "admin", actorUserId: user.id,
      action: "admin_rejected", fromStatus: "escalated", toStatus: "admin_rejected",
      note: resolution_note ?? null,
    });

  } else if (action === "warn_customer" || action === "warn_salon") {
    const targetId = action === "warn_customer" ? dispute.reporter_id : dispute.reported_id;
    // Insert into warnings table (migration 063)
    await admin.from("warnings").insert({
      user_id: targetId,
      issued_by: user.id,
      reason: resolution_note ?? `Issued from dispute #${disputeId}`,
      dispute_id: disputeId,
    }).select();
  }

  await logAuditEvent(req, user.id, `booking_dispute_${action}`, "booking_dispute", disputeId, { action, resolution_note });

  return NextResponse.json({ message: `Action '${action}' applied to dispute ${disputeId}` });
}
