export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resolveBookingActor } from "@/lib/bookings/authorize";
import { checkUserBanned } from "@/lib/feature-flags";
import { applyRateLimit, generalLimiter, getClientIp } from "@/lib/ratelimit";
import { getReadOnlyStripe } from "@/lib/stripe";

const privateHeaders = { "Cache-Control": "private, no-store" };
const unavailable = () => NextResponse.json({ error: "Not found" }, { status: 404, headers: privateHeaders });

// Return Stripe's existing receipt, including its recorded refunds. Do not synthesize an invoice
// from a service quote, current price, tax rate or the booking's aggregate payment fields.
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const limited = await applyRateLimit(generalLimiter, { ip: getClientIp(request) });
  if (limited) return limited;
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return unavailable();
  const { actor, booking, userId } = await resolveBookingActor(request, id);
  if (!actor || !booking) return unavailable();
  if (userId) {
    const banned = await checkUserBanned(userId);
    if (banned) return banned;
    const userLimited = await applyRateLimit(generalLimiter, { userId });
    if (userLimited) return userLimited;
  }
  if (!booking.payment_intent_id) return unavailable();
  let stripe: ReturnType<typeof getReadOnlyStripe>;
  try {
    stripe = getReadOnlyStripe();
  } catch {
    console.error("[bookings/receipt] read-only Stripe credentials unavailable");
    return NextResponse.json({ error: "RECEIPT_UNAVAILABLE" }, { status: 503, headers: privateHeaders });
  }
  try {
    // Existing booking payments are platform-created Connect destination charges.
    const pi = await stripe.paymentIntents.retrieve(booking.payment_intent_id, { expand: ["latest_charge"] });
    const charge = pi.latest_charge;
    if (pi.id !== booking.payment_intent_id || pi.metadata.booking_id !== id || !["booking", "pre_charge"].includes(pi.metadata.type) || pi.status !== "succeeded" ||
        (pi.metadata.salon_id && pi.metadata.salon_id !== booking.salon_id) ||
        (booking.stripe_customer_id && (typeof pi.customer === "string" ? pi.customer : pi.customer?.id) !== booking.stripe_customer_id) ||
        !charge || typeof charge === "string" || charge.payment_intent !== pi.id ||
        !charge.paid || !charge.captured || charge.status !== "succeeded" || !Number.isSafeInteger(charge.amount_captured) || charge.amount_captured <= 0 ||
        charge.currency !== "chf" || !charge.receipt_url) return unavailable();
    const url = new URL(charge.receipt_url);
    if (url.protocol !== "https:" || (url.hostname !== "stripe.com" && !url.hostname.endsWith(".stripe.com"))) return unavailable();
    return NextResponse.redirect(url, { status: 302, headers: privateHeaders });
  } catch (error) {
    console.error("[bookings/receipt] receipt lookup failed", error);
    return unavailable();
  }
}
