export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, paymentLimiter, getClientIp } from "@/lib/ratelimit";
import { checkUserBanned } from "@/lib/feature-flags";
import { validateBody, customerEscalateSchema } from "@/lib/validations";
import { getServerEnv } from "@/lib/env";
import { logAuditEvent } from "@/lib/audit";
import { resolveBookingActor } from "@/lib/bookings/authorize";
import { writeCaseEvent } from "@/lib/bookings/dispute-engine";
import { sendEmail } from "@/lib/email";
import { escalateDaysLeft, ESCALATE_WINDOW_DAYS } from "@/components-legacy/refund/shared";

// SP-3 Endpoint 4 — customer/guest escalates a salon-REJECTED refund to Solen
// admin. CAS-guarded salon_rejected → escalated; one timeline row; reuse the
// existing Resend hook to notify admins. No money moves here.

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: bookingId } = await params;

  const { actor, booking, userId } = await resolveBookingActor(req, bookingId);
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });
  // Only the original requester (customer or guest) can escalate.
  if (actor !== "customer" && actor !== "guest") {
    return actor === null
      ? NextResponse.json({ error: "Not found" }, { status: 404 })
      : NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (userId) {
    const banned = await checkUserBanned(userId);
    if (banned) return banned;
  }

  const rateLimited = await applyRateLimit(
    paymentLimiter,
    userId ? { userId } : { ip: getClientIp(req) },
  );
  if (rateLimited) return rateLimited;

  const body = await req.json().catch(() => ({}));
  const { data: validated, error: validationError } = validateBody(customerEscalateSchema, body);
  if (validationError) return NextResponse.json({ error: validationError.message }, { status: 400 });

  const admin = createAdminSupabaseClient();

  // Find the salon_rejected refund case (CAS target).
  const { data: dispute } = await admin
    .from("booking_disputes")
    .select("id, status, reporter_id, reported_id, salon_responded_at")
    .eq("booking_id", bookingId)
    .eq("direction", "refund")
    .eq("status", "salon_rejected")
    .maybeSingle();
  if (!dispute) {
    // Can only escalate a salon-rejected case.
    return NextResponse.json({ error: "No rejected refund case to escalate" }, { status: 409 });
  }

  // The escWindowOpen copy on RefundCaseView.tsx:872 tells the customer "you can escalate
  // for {days} more days", but until now this endpoint only checked status, so a countdown
  // reaching zero was decoration, not a real gate. Owner 2026-08-19: "you keep making these
  // decorations or, like, unfinished stuff ... it's gonna cause more harm than good ...
  // because you're being too lazy." Reuse the same helper the screen renders from, so the
  // server and the countdown the customer is staring at can never disagree.
  if (escalateDaysLeft(dispute.salon_responded_at) <= 0) {
    return NextResponse.json(
      { error: "ESCALATION_WINDOW_CLOSED", windowDays: ESCALATE_WINDOW_DAYS },
      { status: 400 },
    );
  }

  const { data: updated, error: updErr } = await admin
    .from("booking_disputes")
    .update({
      status: "escalated",
      escalated_at: new Date().toISOString(),
      customer_response: validated.note ?? null,
    })
    .eq("id", dispute.id)
    .eq("status", "salon_rejected") // CAS
    .select("id")
    .maybeSingle();
  if (updErr) {
    console.error("[booking-disputes] escalate failed:", updErr.message);
    return NextResponse.json({ error: updErr.message }, { status: 500 });
  }
  if (!updated) return NextResponse.json({ error: "Case status changed; reload" }, { status: 409 });

  await writeCaseEvent(admin, {
    disputeId: dispute.id,
    actorRole: actor,
    actorUserId: userId,
    action: "escalated",
    fromStatus: "salon_rejected",
    toStatus: "escalated",
    note: validated.note ?? null,
  });
  await logAuditEvent(req, userId ?? "guest", "booking_dispute_escalated", "booking_dispute", dispute.id, { actor });

  // Reuse the Resend hook to notify platform admins.
  const resendApiKey = getServerEnv().RESEND_API_KEY;
  if (!resendApiKey) {
    console.warn("[booking-disputes] RESEND_API_KEY not set — skipping escalation email");
  } else {
    try {
      const { data: admins } = await admin.from("profiles").select("email").eq("role", "admin");
      const emails = (admins ?? []).map((a) => a.email).filter(Boolean) as string[];
      if (emails.length > 0) {
        await sendEmail({
          from: "support@solen.ch",
          to: emails,
          subject: "Rückerstattung eskaliert — Solen-Review erforderlich | Refund escalated", // em-dash-ok: pre-existing subject, relocated unchanged
          html: `<p>A customer escalated a salon-rejected refund for booking #${bookingId}.</p>
                   <p>Please review in the admin dispute queue.</p>`,
          // The per-call 8s abort that used to sit here is gone because sendEmail carries its own
          // 5s timeout for every send, so the bound survives and is no longer per-caller.
        });
      }
    } catch (e) {
      console.error("[booking-disputes] Failed to send escalation email", e);
    }
  }

  return NextResponse.json({ status: "escalated" });
}
