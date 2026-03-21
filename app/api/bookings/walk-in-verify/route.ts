export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, generalLimiter, getClientIp } from "@/lib/ratelimit";
import crypto from "crypto";

function verifyHmacToken(token: string): { bookingId: string; valid: boolean } {
  const secret = process.env.BOOKING_HMAC_SECRET;
  if (!secret) return { bookingId: "", valid: false };

  try {
    const decoded = Buffer.from(token, "base64url").toString();
    const parts = decoded.split(":");
    if (parts.length !== 3) return { bookingId: "", valid: false };

    const [bookingId, expiryStr, providedHmac] = parts;
    const expiry = parseInt(expiryStr, 10);

    // Check expiry
    if (Date.now() / 1000 > expiry) return { bookingId, valid: false };

    // Verify HMAC
    const payload = `${bookingId}:${expiryStr}`;
    const expectedHmac = crypto.createHmac("sha256", secret).update(payload).digest("hex");

    if (!crypto.timingSafeEqual(Buffer.from(providedHmac), Buffer.from(expectedHmac))) {
      return { bookingId, valid: false };
    }

    return { bookingId, valid: true };
  } catch {
    return { bookingId: "", valid: false };
  }
}

// GET /api/bookings/walk-in-verify — Validate HMAC token and return booking data (PUBLIC)
export async function GET(req: NextRequest) {
  const rateLimited = await applyRateLimit(generalLimiter, { ip: getClientIp(req) });
  if (rateLimited) return rateLimited;

  const token = new URL(req.url).searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Token required" }, { status: 400 });

  const { bookingId, valid } = verifyHmacToken(token);
  if (!valid) return NextResponse.json({ error: "Invalid or expired token" }, { status: 403 });

  const supabase = await createServerSupabaseClient();
  const { data: booking } = await supabase
    .from("bookings")
    .select("id, salon_id, service_id, starts_at, price_paid, payment_status, paid_via, salons(name, stripe_account_id), services(name_de)")
    .eq("id", bookingId)
    .eq("paid_via", "walk_in")
    .single();

  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  if (booking.payment_status === "paid") {
    return NextResponse.json({ error: "Already paid", booking_id: bookingId }, { status: 409 });
  }

  return NextResponse.json({
    booking: {
      id: booking.id,
      salon_name: (booking.salons as any)?.name,
      service_name: (booking.services as any)?.name_de,
      amount: booking.price_paid,
      starts_at: booking.starts_at,
      stripe_account_id: (booking.salons as any)?.stripe_account_id,
    },
  });
}
