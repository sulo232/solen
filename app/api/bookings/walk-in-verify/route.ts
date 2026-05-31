export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, generalLimiter, getClientIp } from "@/lib/ratelimit";
import { getServerEnv } from "@/lib/env";
import crypto from "crypto";

function verifyHmacToken(token: string): { bookingId: string; valid: boolean } {
  const secret = getServerEnv().BOOKING_HMAC_SECRET;
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
    .select("id, salon_id, service_id, staff_member_id, walkin_queue_id, starts_at, price_paid, payment_status, paid_via, salons(name, slug, stripe_account_id, cover_photo_url, average_rating, review_count, address, phone), services(name_de, duration_minutes), staff_members(name, avatar_url)")
    .eq("id", bookingId)
    .eq("paid_via", "walk_in")
    .single();

  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  if (booking.payment_status === "paid") {
    return NextResponse.json({ error: "Already paid", booking_id: bookingId }, { status: 409 });
  }

  const salon = booking.salons as any;
  const service = booking.services as any;
  const staff = booking.staff_members as any;

  // If payment already issued a ticket (booking linked to a queue entry), surface it so
  // reopening the link goes straight to the ticket instead of asking to pay again.
  let ticket_number: string | null = null;
  let queue_ahead: number | null = null;
  let wait_minutes: number | null = null;
  const queueId = (booking as any).walkin_queue_id;
  if (queueId) {
    const admin = createAdminSupabaseClient();
    const { data: q } = await admin
      .from("barber_walkin_queue")
      .select("ticket_code, position, estimated_wait_minutes")
      .eq("id", queueId)
      .single();
    if (q) {
      ticket_number = q.ticket_code;
      wait_minutes = q.estimated_wait_minutes;
      const { count } = await admin
        .from("barber_walkin_queue")
        .select("id", { count: "exact", head: true })
        .eq("salon_id", booking.salon_id)
        .in("status", ["waiting", "in_chair"])
        .lt("position", q.position);
      queue_ahead = count ?? 0;
    }
  }

  return NextResponse.json({
    booking: {
      id: booking.id,
      salon_id: booking.salon_id,
      service_id: booking.service_id,
      salon_name: salon?.name,
      salon_image: salon?.cover_photo_url ?? null,
      salon_rating: salon?.average_rating ?? null,
      salon_review_count: salon?.review_count ?? null,
      salon_address: salon?.address ?? null,
      salon_phone: salon?.phone ?? null,
      salon_slug: salon?.slug ?? null,
      barber_id: booking.staff_member_id ?? null,
      service_name: service?.name_de,
      service_duration: service?.duration_minutes ?? null,
      barber_name: staff?.name ?? null,
      barber_avatar: staff?.avatar_url ?? null,
      is_walkin: true,
      ticket_number, // set once payment has issued the queue ticket; null = still unpaid
      queue_ahead,
      wait_minutes,
      amount: booking.price_paid,
      payment_method: null, // card brand+last4 only surfaced live via /confirm (not persisted yet)
      starts_at: booking.starts_at,
      stripe_account_id: salon?.stripe_account_id,
    },
  });
}
