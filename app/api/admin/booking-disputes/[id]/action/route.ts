export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, adminLimiter } from "@/lib/ratelimit";
import { logAuditEvent } from "@/lib/audit";
import { validateBody, adminDisputeBookingActionSchema } from "@/lib/validations";
import { getStripe } from "@/lib/stripe";
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
    .select("id, reporter_id, reported_id, status")
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
    // Admin-issued refund — bypasses salon owner check (admin privilege)
    // Existing /api/bookings/[id]/refund is salon-owner only, so we call Stripe directly here
    const { data: disputeFetch } = await admin
      .from("booking_disputes")
      .select("booking_id")
      .eq("id", disputeId)
      .single();
    if (!disputeFetch) return NextResponse.json({ error: "Dispute not found" }, { status: 404 });

    const { data: booking } = await admin
      .from("bookings")
      .select("id, paid_amount, price_paid, payment_intent_id, refunded_amount")
      .eq("id", disputeFetch.booking_id)
      .single();

    if (!booking?.payment_intent_id) {
      return NextResponse.json({ error: "No Stripe payment to refund" }, { status: 400 });
    }

    const paidAmount = booking.paid_amount ?? booking.price_paid ?? 0;
    const alreadyRefunded = booking.refunded_amount ?? 0;
    const refundAmount = validated.refund_amount ?? (paidAmount - alreadyRefunded); // default: full remaining

    if (refundAmount > paidAmount - alreadyRefunded) {
      return NextResponse.json({ error: "Refund exceeds maximum refundable amount" }, { status: 400 });
    }

    const stripe = getStripe();
    try {
      await stripe.refunds.create({
        payment_intent: booking.payment_intent_id,
        amount: refundAmount,
        reason: "requested_by_customer",
      });
    } catch (stripeErr: any) {
      return NextResponse.json({ error: `Stripe refund failed: ${stripeErr.message}` }, { status: 500 });
    }

    const newTotal = alreadyRefunded + refundAmount;
    await admin.from("bookings").update({
      refunded_amount: newTotal,
      payment_status: newTotal >= paidAmount ? "refunded" : "partially_refunded",
    }).eq("id", disputeFetch.booking_id);

    await admin.from("booking_disputes").update({
      status: "resolved",
      resolution: resolution_note ?? "Refund issued by admin",
      resolved_by: user.id,
      resolved_at: new Date().toISOString(),
    }).eq("id", disputeId);

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
