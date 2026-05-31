export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { getStripe } from "@/lib/stripe";
import { applyRateLimit, paymentLimiter, getClientIp } from "@/lib/ratelimit";
import { getServerEnv } from "@/lib/env";
import { createWalkinTicket } from "@/lib/barber/walkin-ticket";
import crypto from "crypto";
import type Stripe from "stripe";

// Verify the same HMAC payment-link token issued by /api/bookings/walk-in (salon-SMS flow).
function verifyToken(token: string): { bookingId: string; valid: boolean } {
  const secret = getServerEnv().BOOKING_HMAC_SECRET;
  if (!secret) return { bookingId: "", valid: false };
  try {
    const parts = Buffer.from(token, "base64url").toString().split(":");
    if (parts.length !== 3) return { bookingId: "", valid: false };
    const [bookingId, expiryStr, providedHmac] = parts;
    if (Date.now() / 1000 > parseInt(expiryStr, 10)) return { bookingId, valid: false };
    const expected = crypto.createHmac("sha256", secret).update(`${bookingId}:${expiryStr}`).digest("hex");
    if (providedHmac.length !== expected.length) return { bookingId, valid: false };
    if (!crypto.timingSafeEqual(Buffer.from(providedHmac), Buffer.from(expected))) return { bookingId, valid: false };
    return { bookingId, valid: true };
  } catch {
    return { bookingId: "", valid: false };
  }
}

// POST /api/walkin/confirm — { payment_intent_id, token? }
// After Stripe authorizes the hold, issue the ticket number (delegated to the shared
// createWalkinTicket so the webhook backstop runs the exact same, idempotent logic).
//   • TOKENLESS (customer self-serve / in-shop QR) — salon + service come from the PI metadata.
//   • TOKEN (salon-SMS booking link) — salon + service come from the linked booking.
export async function POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(paymentLimiter, { ip: getClientIp(req) });
  if (rateLimited) return rateLimited;

  const body = await req.json().catch(() => null);
  const token: string | undefined = body?.token;
  const paymentIntentId: string | undefined = body?.payment_intent_id;
  if (!paymentIntentId) {
    return NextResponse.json({ error: "payment_intent_id is required" }, { status: 400 });
  }

  // Retrieve + validate the PaymentIntent. Manual-capture hold lands on "requires_capture".
  let pi: Stripe.PaymentIntent;
  try {
    pi = await getStripe().paymentIntents.retrieve(paymentIntentId, { expand: ["latest_charge.payment_method_details"] });
  } catch (e) {
    console.error("[walkin/confirm] PaymentIntent retrieve failed:", e);
    return NextResponse.json({ error: "Payment not found" }, { status: 400 });
  }
  if (pi.status !== "requires_capture" && pi.status !== "succeeded") {
    return NextResponse.json({ error: `Payment not authorized (${pi.status})` }, { status: 400 });
  }
  if (pi.metadata?.type !== "walk_in") {
    return NextResponse.json({ error: "Not a walk-in payment" }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();

  let salonId: string;
  let serviceId: string | null;
  let preferredBarberId: string | null = null;
  let linkBookingId: string | null = null;

  if (token) {
    // TOKEN flow — resolve context from the salon-created booking.
    const { bookingId, valid } = verifyToken(token);
    if (!valid) return NextResponse.json({ error: "Invalid or expired token" }, { status: 403 });
    const { data: booking } = await admin
      .from("bookings")
      .select("id, salon_id, service_id, staff_member_id, paid_via")
      .eq("id", bookingId)
      .eq("paid_via", "walk_in")
      .single();
    if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    if (pi.metadata?.booking_id && pi.metadata.booking_id !== bookingId) {
      return NextResponse.json({ error: "Payment does not match this booking" }, { status: 403 });
    }
    salonId = booking.salon_id;
    serviceId = booking.service_id ?? null;
    preferredBarberId = booking.staff_member_id ?? null;
    linkBookingId = booking.id;
  } else {
    // TOKENLESS flow — trust the server-set PI metadata (created by /api/walkin/pay-intent,
    // which derives salon + price server-side, never from the client).
    salonId = pi.metadata?.salon_id ?? "";
    serviceId = pi.metadata?.service_id || null;
    preferredBarberId = pi.metadata?.preferred_barber_id || null;
    if (!salonId) return NextResponse.json({ error: "Payment missing salon context" }, { status: 400 });
  }

  try {
    const result = await createWalkinTicket(admin, { pi, salonId, serviceId, preferredBarberId, linkBookingId });
    return NextResponse.json(result);
  } catch (e) {
    console.error("[walkin/confirm] ticket creation failed:", e);
    return NextResponse.json({ error: "Could not create queue entry" }, { status: 500 });
  }
}
