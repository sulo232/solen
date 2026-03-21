export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, generalLimiter, getClientIp } from "@/lib/ratelimit";
import crypto from "crypto";

function verifyActionToken(token: string): { bookingId: string; action: string; valid: boolean } {
  const secret = process.env.BOOKING_HMAC_SECRET;
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

  const supabase = await createServerSupabaseClient();
  const { data: booking } = await supabase
    .from("bookings")
    .select("id, status")
    .eq("id", bookingId)
    .single();

  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  if (action === "confirm" && booking.status === "pending") {
    await supabase.from("bookings").update({ status: "confirmed" }).eq("id", bookingId);
    return NextResponse.json({ result: "confirmed", booking_id: bookingId });
  }

  if (action === "cancel" && ["confirmed", "pending"].includes(booking.status)) {
    await supabase.from("bookings").update({ status: "cancelled", cancelled_at: new Date().toISOString() }).eq("id", bookingId);
    // Free slot
    await supabase.from("availability_slots").update({ status: "available", booked_by: null, booking_id: null }).eq("booking_id", bookingId);
    return NextResponse.json({ result: "cancelled", booking_id: bookingId });
  }

  return NextResponse.json({ error: `Cannot ${action} booking in status ${booking.status}` }, { status: 400 });
}
