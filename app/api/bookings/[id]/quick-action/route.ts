export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, generalLimiter, getClientIp } from "@/lib/ratelimit";
import { getServerEnv } from "@/lib/env";
import { applyCustomerCancelMoney } from "@/lib/bookings/customer-cancel-money";
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
      "id, status, starts_at, paid_amount, price_paid, payment_intent_id, payment_status, refunded_amount, stripe_customer_id, stripe_payment_method_id, salons(cancellation_fee_type, cancellation_fee_value, free_cancel_hours)"
    )
    .eq("id", bookingId)
    .single();

  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  if (action === "confirm" && booking.status === "pending") {
    await admin.from("bookings").update({ status: "confirmed" }).eq("id", bookingId);
    return NextResponse.json({ result: "confirmed", booking_id: bookingId });
  }

  // Array.prototype.includes requires a string arg; booking.status is string | null here.
  // ?? "" is behaviorally inert (the array never contains ""), type-only cast, no new branch.
  if (action === "cancel" && ["confirmed", "pending"].includes(booking.status ?? "")) {
    await admin.from("bookings").update({ status: "cancelled", cancelled_at: new Date().toISOString() }).eq("id", bookingId);
    // Free slot
    await admin.from("availability_slots").update({ status: "available", booked_by: null, booking_id: null }).eq("booking_id", bookingId);

    // Audit finding #19 (MEDIUM, 2026-07-09): this public one-click cancel used to set
    // status='cancelled' and free the slot with NO refund and NO fee, stranding a prepaid
    // customer's money. Route through the SAME chokepoint the canonical customer-cancel
    // branch uses (lib/bookings/customer-cancel-money.ts) so a prepaid booking is refunded
    // base minus fee, matching /api/bookings/[id]/cancel's customer branch exactly. The
    // HMAC token IS the authorization here (same discipline as the read/update above).
    await applyCustomerCancelMoney(
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
      booking.salons as any,
      "customer cancelled via one-click email link",
    );

    return NextResponse.json({ result: "cancelled", booking_id: bookingId });
  }

  return NextResponse.json({ error: `Cannot ${action} booking in status ${booking.status}` }, { status: 400 });
}
