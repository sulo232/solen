export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, paymentLimiter, getClientIp } from "@/lib/ratelimit";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { validateBody, upchargeRequestSchema, upchargeRespondSchema } from "@/lib/validations";
import { getServerEnv, getAppUrl } from "@/lib/env";
import { logAuditEvent } from "@/lib/audit";
import { resolveBookingActor } from "@/lib/bookings/authorize";
import { writeCaseEvent, chargeUpcharge, ChargeUpchargeError } from "@/lib/bookings/dispute-engine";
import { notifyUpchargeCharged } from "@/lib/bookings/notify-upcharge";
import { reportError } from "@/lib/error-report";
import { sendEmail, EmailLocale } from "@/lib/email";

// SP-3 Endpoints 6 (POST salon upcharge request) + 7 (PATCH customer respond).
//
// RE-POINTED from the dead `price_disputes` table onto the unified
// `booking_disputes` spine with `direction='upcharge'` (master plan §10b.1), so
// the admin queue + case timeline see ONE table for both money directions.
//
// D8 (review-first / no silent auto-approve): an upcharge moves money ONLY on an
// EXPLICIT customer approve. No response past `expires_at` = VOID (lazy here; an
// optional housekeeping cron may flip it). On an explicit approve the difference
// is charged OFF-SESSION to the SP-G2 saved card via chargeUpcharge() (the shared
// off-session primitive, same Stripe call as charge-fee): open → salon_approved
// (CAS) → charged. SCA / decline leaves it at salon_approved (the approval stands;
// the charge is pursued out-of-band, mirroring the Lane A fee paths).
//
// Money is INTEGER Rappen. The +50% cap is enforced against `bookings.paid_amount`
// (Rappen) — NEVER `price_paid` (CHF, the 100x bug).

const UPCHARGE_WINDOW_MS = 48 * 60 * 60 * 1000;

function shapeUpcharge(row: Record<string, any> | null) {
  if (!row) return null;
  return {
    id: row.id,
    booking_id: row.booking_id,
    direction: row.direction,
    status: row.status,
    requested_amount: row.requested_amount, // Rappen
    salon_reason: row.salon_response,        // stored in salon_response
    customer_response: row.customer_response,
    customer_responded_at: row.customer_responded_at,
    expires_at: row.expires_at,
    created_at: row.created_at,
  };
}

// ───────────────────────────────────────────────────────────────────────────
// GET — customer/guest fetches the upcharge for the approve/decline screen.
// ───────────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: bookingId } = await params;

  const { actor, booking } = await resolveBookingActor(req, bookingId);
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (actor !== "customer" && actor !== "guest") {
    return actor === null
      ? NextResponse.json({ error: "Not found" }, { status: 404 })
      : NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createAdminSupabaseClient();
  const { data: dispute } = await admin
    .from("booking_disputes")
    .select("*")
    .eq("booking_id", bookingId)
    .eq("direction", "upcharge")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json({ dispute: shapeUpcharge(dispute) });
}

// ───────────────────────────────────────────────────────────────────────────
// POST — salon owner creates an upcharge request (Endpoint 6).
// ───────────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: bookingId } = await params;

  const disabled = await checkFeatureEnabled("upcharge_requests");
  if (disabled) return disabled;

  const { actor, booking, userId } = await resolveBookingActor(req, bookingId);
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (actor !== "salon" || !userId) {
    return actor === null
      ? NextResponse.json({ error: "Not found" }, { status: 404 })
      : NextResponse.json({ error: "Only salon owners can request an upcharge" }, { status: 403 });
  }

  const banned = await checkUserBanned(userId);
  if (banned) return banned;

  const rateLimited = await applyRateLimit(paymentLimiter, { userId });
  if (rateLimited) return rateLimited;

  const body = await req.json();
  const { data: validated, error: validationError } = validateBody(upchargeRequestSchema, body);
  if (validationError) return NextResponse.json({ error: validationError.message }, { status: 400 });

  if (booking.status !== "completed") {
    return NextResponse.json({ error: "Can only upcharge a completed booking" }, { status: 400 });
  }

  // +50% cap against NET retained payment (paid_amount − refunded_amount, Rappen).
  // Netting the refund is the fairness fix: a gross-anchored cap would let a salon
  // upcharge back what was already refunded. Reject when there's no recorded payment
  // to anchor the cap (G2 prepay populates paid_amount).
  const paidAmount: number = booking.paid_amount ?? 0;
  if (paidAmount <= 0) {
    return NextResponse.json(
      { error: "Booking has no recorded payment to upcharge against" },
      { status: 400 },
    );
  }
  const refundedAmount: number = booking.refunded_amount ?? 0;
  const netRetained = paidAmount - refundedAmount;
  const cap = Math.max(0, Math.round(netRetained * 0.5));
  if (validated.requested_amount > cap) {
    return NextResponse.json(
      { error: `Upcharge cannot exceed 50% of the amount paid (max ${cap})` },
      { status: 400 },
    );
  }

  const admin = createAdminSupabaseClient();
  const expiresAt = new Date(Date.now() + UPCHARGE_WINDOW_MS).toISOString();

  const { data: dispute, error } = await admin
    .from("booking_disputes")
    .insert({
      booking_id: bookingId,
      direction: "upcharge",
      status: "open",
      issue_type: "other", // 075 back-compat CHECK
      requested_amount: validated.requested_amount, // Rappen
      salon_response: validated.salon_reason,       // the salon's reason for the extra
      salon_responded_at: new Date().toISOString(),
      reporter_id: userId,           // the salon owner initiated this direction
      reported_id: booking.user_id ?? null, // the customer (null for guest)
      expires_at: expiresAt,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "An open upcharge already exists for this booking" },
        { status: 409 },
      );
    }
    console.error("[booking-disputes] upcharge create failed:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await writeCaseEvent(admin, {
    disputeId: dispute.id, actorRole: "salon", actorUserId: userId,
    action: "created", toStatus: "open", amount: validated.requested_amount,
    note: validated.salon_reason,
  });
  await logAuditEvent(req, userId, "booking_upcharge_created", "booking_dispute", dispute.id, {
    requested_amount: validated.requested_amount,
  });

  // Reuse the Resend hook to notify the customer (logged-in users have a profile email).
  const resendApiKey = getServerEnv().RESEND_API_KEY;
  if (!resendApiKey) {
    console.warn("[booking-disputes] RESEND_API_KEY not set — skipping upcharge email");
  } else {
    let customerEmail: string | null = booking.guest_email ?? null;
    // seo-comms-04 style: resolve the customer's locale from profiles.locale (bookings has
    // no locale column, and a guest_bookings row has none either, same source and guest
    // fallback as lib/bookings/notify-upcharge.ts).
    let customerLocale: EmailLocale = "de";
    if (!customerEmail && booking.user_id) {
      const { data: cust } = await admin.from("profiles").select("email, locale").eq("id", booking.user_id).single();
      customerEmail = cust?.email ?? null;
      customerLocale = (cust?.locale as EmailLocale) ?? "de";
    }
    if (customerEmail) {
      // H8: deep-link to the customer approve/decline screen so the email is actionable.
      // Canonical origin (NEXT_PUBLIC_APP_URL → www.solen.ch fallback), same as booking-email.
      let baseUrl: string;
      try {
        baseUrl = getAppUrl();
      } catch {
        baseUrl = "https://www.solen.ch";
      }
      const upchargeUrl = `${baseUrl}/${customerLocale}/bookings/${bookingId}/upcharge`;
      try {
        await sendEmail({
          from: "support@solen.ch",
          to: customerEmail,
          subject: "Ein Salon hat einen Aufpreis angefragt | A salon requested an additional charge",
          html: `<p>Der Salon hat für Buchung #${bookingId} einen Aufpreis angefragt.</p>
                   <p>Sie müssen ausdrücklich zustimmen, bevor etwas berechnet wird. Wenn Sie nicht reagieren, passiert nichts.</p>
                   <p><a href="${upchargeUrl}">Aufpreis prüfen und zustimmen oder ablehnen</a></p>`,
          // The per-call 8s abort that used to sit here is gone because sendEmail carries its own
          // 5s timeout for every send, so the bound survives and is no longer per-caller.
        });
      } catch (e) {
        console.error("[booking-disputes] Failed to send upcharge email to customer", e);
      }
    }
  }

  return NextResponse.json(
    { case: { id: dispute.id, status: "open", requested_amount: validated.requested_amount, expires_at: expiresAt } },
    { status: 201 },
  );
}

// ───────────────────────────────────────────────────────────────────────────
// PATCH — customer/guest responds to an upcharge: EXPLICIT approve or decline
//         (Endpoint 7). No silent auto-approve (D8).
// ───────────────────────────────────────────────────────────────────────────
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: bookingId } = await params;

  const { actor, booking, userId } = await resolveBookingActor(req, bookingId);
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });
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

  const body = await req.json();
  const { data: validated, error: validationError } = validateBody(upchargeRespondSchema, body);
  if (validationError) return NextResponse.json({ error: validationError.message }, { status: 400 });

  const admin = createAdminSupabaseClient();

  // Load the OPEN upcharge (CAS target).
  const { data: dispute } = await admin
    .from("booking_disputes")
    .select("id, status, expires_at")
    .eq("booking_id", bookingId)
    .eq("direction", "upcharge")
    .eq("status", "open")
    .maybeSingle();
  if (!dispute) {
    return NextResponse.json({ error: "No open upcharge to respond to" }, { status: 409 });
  }

  // Lazy VOID: an upcharge past its window can't be approved/declined — it's void.
  const expired = dispute.expires_at != null && Date.now() > new Date(dispute.expires_at).getTime();
  if (expired) {
    // Best-effort flip open → void so the row reflects the lazy semantics.
    const { data: voided } = await admin
      .from("booking_disputes")
      .update({ status: "void" })
      .eq("id", dispute.id)
      .eq("status", "open")
      .select("id")
      .maybeSingle();
    if (voided) {
      await writeCaseEvent(admin, {
        disputeId: dispute.id, actorRole: "system",
        action: "voided", fromStatus: "open", toStatus: "void", note: "expired (no response)",
      });
    }
    return NextResponse.json({ error: "This upcharge has expired", status: "void" }, { status: 409 });
  }

  // ── decline → void (no money) ───────────────────────────────────────────────
  if (validated.action === "decline") {
    const { data: updated, error: updErr } = await admin
      .from("booking_disputes")
      .update({
        status: "void",
        customer_response: validated.customer_response ?? null,
        customer_responded_at: new Date().toISOString(),
      })
      .eq("id", dispute.id)
      .eq("status", "open") // CAS
      .select("id")
      .maybeSingle();
    if (updErr) {
      console.error("[booking-disputes] upcharge decline failed:", updErr.message);
      return NextResponse.json({ error: updErr.message }, { status: 500 });
    }
    if (!updated) return NextResponse.json({ error: "Upcharge status changed; reload" }, { status: 409 });

    await writeCaseEvent(admin, {
      disputeId: dispute.id, actorRole: actor, actorUserId: userId,
      action: "voided", fromStatus: "open", toStatus: "void", note: "declined",
    });
    await logAuditEvent(req, userId ?? "guest", "booking_upcharge_declined", "booking_dispute", dispute.id, { actor });
    return NextResponse.json({ status: "void" });
  }

  // ── approve → salon_approved (CAS) → charged ──────────────────────────────────
  // Record the EXPLICIT approval first (open → salon_approved, CAS), then charge the
  // difference off-session to the SP-G2 saved card. The two-step (approve, then
  // charge) means a Stripe SCA/decline leaves a durable salon_approved row the charge
  // can be retried against — the customer's approval is never lost.
  const { data: approved, error: appErr } = await admin
    .from("booking_disputes")
    .update({
      status: "salon_approved",
      customer_response: validated.customer_response ?? null,
      customer_responded_at: new Date().toISOString(),
    })
    .eq("id", dispute.id)
    .eq("status", "open") // CAS
    .select("id")
    .maybeSingle();
  if (appErr) {
    console.error("[booking-disputes] upcharge approve failed:", appErr.message);
    return NextResponse.json({ error: appErr.message }, { status: 500 });
  }
  if (!approved) return NextResponse.json({ error: "Upcharge status changed; reload" }, { status: 409 });

  await writeCaseEvent(admin, {
    disputeId: dispute.id, actorRole: actor, actorUserId: userId,
    action: "customer_approved", fromStatus: "open", toStatus: "salon_approved",
    note: "customer approved the upcharge",
  });
  await logAuditEvent(req, userId ?? "guest", "booking_upcharge_approved", "booking_dispute", dispute.id, { actor });

  // Charge the approved difference off-session (salon_approved → charged). chargeUpcharge
  // owns the Stripe call (shared primitive), the +50% cap re-check, the CAS to 'charged',
  // and the 'charged' case_event. It never throws on a decline/SCA — it returns a status.
  let charge;
  try {
    charge = await chargeUpcharge({ db: admin, disputeId: dispute.id, actorRole: actor, actorUserId: userId });
  } catch (e) {
    await reportError("booking-dispute-upcharge-charge", e, { disputeId: dispute.id });
    // Structural errors only (NO_SAVED_CARD, EXCEEDS_CAP, etc.). The approval already
    // stands at salon_approved; surface the reason and let it be charged out-of-band.
    if (e instanceof ChargeUpchargeError) {
      console.error(`[booking-disputes] upcharge charge skipped for dispute ${dispute.id} (${e.code}):`, e.message);
      return NextResponse.json(
        { status: "salon_approved", charge_status: "deferred", code: e.code, note: e.message },
        { status: 200 },
      );
    }
    console.error(`[booking-disputes] upcharge charge threw for dispute ${dispute.id}:`, e);
    return NextResponse.json({ status: "salon_approved", charge_status: "deferred" }, { status: 200 });
  }

  await logAuditEvent(req, userId ?? "guest", "booking_upcharge_charged", "booking_dispute", dispute.id, {
    actor, charge_status: charge.status, charged_cents: charge.chargedCents ?? 0,
    payment_intent_id: charge.paymentIntentId ?? null,
  });

  if (charge.status === "charged") {
    // N2: notify the customer their card was charged for the approved upcharge. A silent
    // off-session debit is a chargeback magnet. Never blocks/rolls back the money move
    // (same discipline as the refund receipt / Stripe webhook).
    await notifyUpchargeCharged(admin, bookingId, charge.chargedCents ?? 0, "booking-disputes").catch((err) =>
      console.error("[booking-disputes] upcharge charged notification failed:", err),
    );
    return NextResponse.json({ status: "charged", charged: charge.chargedCents });
  }
  if (charge.status === "requires_action") {
    // SCA: the customer must complete a fresh authentication. The approval stands.
    return NextResponse.json(
      { status: "salon_approved", charge_status: "requires_action", client_secret: charge.clientSecret ?? null },
      { status: 200 },
    );
  }
  // Declined/other — approval stands; charge pursued out-of-band.
  return NextResponse.json({ status: "salon_approved", charge_status: "failed" }, { status: 200 });
}
