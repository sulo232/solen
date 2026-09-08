export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, generalLimiter, getClientIp } from "@/lib/ratelimit";
import { getServerEnv } from "@/lib/env";
import { mintTrackingToken } from "@/lib/walkin/authz";
import crypto from "crypto";
import { localizedField } from "@/lib/i18n/localized-field";

// Reopen debounce. A reopened booking link mints a fresh ticket token (the stored one is a hash),
// and without this a double tap would rotate twice and invalidate the tab that is already loading.
// Process-local on purpose: a serverless instance handles the burst that causes this, and the worst
// case on a cold instance is one extra rotation, which is safe.
const REOPEN_DEBOUNCE_MS = 60_000;
const reopenCache = new Map<string, { token: string; until: number }>();

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

  const searchParams = new URL(req.url).searchParams;
  const token = searchParams.get("token");
  const locale = searchParams.get("locale") || "de";
  if (!token) return NextResponse.json({ error: "Token required" }, { status: 400 });

  const { bookingId, valid } = verifyHmacToken(token);
  if (!valid) return NextResponse.json({ error: "Invalid or expired token" }, { status: 403 });

  // The HMAC token IS the authorization here (guest bookings have user_id NULL, so the
  // RLS-bound client always returns 0 rows for them). Use the admin client for the
  // token-gated read, mirroring app/api/walkin/confirm + app/api/bookings/guest-lookup.
  const admin = createAdminSupabaseClient();
  const { data: booking } = await admin
    .from("bookings")
    .select("id, salon_id, service_id, staff_member_id, walkin_queue_id, starts_at, price_paid, payment_status, paid_via, salons(name, slug, stripe_account_id, cover_photo_url, average_rating, review_count, address, phone, vat_registered, vat_rate), services(name_de, name_en, name_fr, name_it, duration_minutes), staff_members(name, avatar_url)")
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
  let tracking_token: string | null = null;
  const queueId = (booking as any).walkin_queue_id;
  if (queueId) {
    const { data: q } = await admin
      .from("barber_walkin_queue")
      .select("ticket_code, position, estimated_wait_minutes")
      .eq("id", queueId)
      .single();
    if (q) {
      ticket_number = q.ticket_code;
      wait_minutes = q.estimated_wait_minutes;
      // Mint fresh on reopen. The stored token is a hash now, so there is nothing to hand back, and
      // a new raw token is issued for this visit instead. Only a caller who already passed the HMAC
      // check above reaches here, so this cannot be used to take over someone else's ticket, and an
      // older token stops working the moment a new one is issued.
      //
      // The reopen debounce below matters because two rapid reopens (a double tap, a second tab)
      // would otherwise rotate twice and kill the token the first tab is still using.
      const cached = reopenCache.get(queueId);
      if (cached && cached.until > Date.now()) {
        tracking_token = cached.token;
      } else {
        const fresh = await mintTrackingToken(admin, queueId);
        if (!fresh) {
          return NextResponse.json({ error: "Could not open ticket" }, { status: 500 });
        }
        tracking_token = fresh;
        reopenCache.set(queueId, { token: fresh, until: Date.now() + REOPEN_DEBOUNCE_MS });
      }
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
      salon_vat_registered: salon?.vat_registered,
      salon_vat_rate: salon?.vat_rate,
      barber_id: booking.staff_member_id ?? null,
      service_name: service ? localizedField(service, "name", locale) : undefined,
      service_duration: service?.duration_minutes ?? null,
      barber_name: staff?.name ?? null,
      barber_avatar: staff?.avatar_url ?? null,
      is_walkin: true,
      ticket_number, // set once payment has issued the queue ticket; null = still unpaid
      queue_id: queueId ?? null, // queue-entry row id — needed to cancel (DELETE) on reopen
      tracking_token, // public capability token — gates the cancel + the live-queue page
      queue_ahead,
      wait_minutes,
      amount: booking.price_paid,
      payment_method: null, // card brand+last4 only surfaced live via /confirm (not persisted yet)
      starts_at: booking.starts_at,
      stripe_account_id: salon?.stripe_account_id,
    },
  });
}
