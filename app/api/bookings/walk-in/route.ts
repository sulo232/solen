export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";
import { checkUserBanned } from "@/lib/feature-flags";
import { validateBody, walkInSchema } from "@/lib/validations";
import crypto from "crypto";

function createHmacToken(bookingId: string, expiry: number): string {
  const secret = process.env.BOOKING_HMAC_SECRET;
  if (!secret) throw new Error("BOOKING_HMAC_SECRET not set");
  const payload = `${bookingId}:${expiry}`;
  const hmac = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return Buffer.from(`${payload}:${hmac}`).toString("base64url");
}

// POST /api/bookings/walk-in — Create walk-in booking + send SMS payment link
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const body = await req.json();
  const { data: validated, error: valError } = validateBody(walkInSchema, body);
  if (valError) return NextResponse.json({ error: valError.message }, { status: 400 });

  // Verify user owns a salon
  const { data: salon } = await supabase
    .from("salons")
    .select("id, name")
    .eq("owner_id", user.id)
    .single();

  if (!salon) return NextResponse.json({ error: "No salon found" }, { status: 403 });

  // Get service details
  const { data: service } = await supabase
    .from("services")
    .select("id, name_de, price, duration_minutes")
    .eq("id", validated.service_id)
    .eq("salon_id", salon.id)
    .single();

  if (!service) return NextResponse.json({ error: "Service not found" }, { status: 404 });

  // Create the booking
  const now = new Date();
  const endsAt = new Date(now.getTime() + (service.duration_minutes ?? 60) * 60 * 1000);

  const { data: booking, error: bookErr } = await supabase
    .from("bookings")
    .insert({
      salon_id: salon.id,
      service_id: validated.service_id,
      staff_member_id: validated.staff_member_id ?? null,
      starts_at: now.toISOString(),
      ends_at: endsAt.toISOString(),
      price_paid: service.price ?? 0,
      status: "confirmed",
      payment_status: "pending",
      paid_via: "walk_in",
    })
    .select()
    .single();

  if (bookErr) return NextResponse.json({ error: bookErr.message }, { status: 500 });

  // Generate HMAC token for payment link (expires in 24h)
  const expiry = Math.floor(Date.now() / 1000) + 24 * 60 * 60;
  const token = createHmacToken(booking.id, expiry);
  const paymentUrl = `https://www.solen.ch/walk-in-pay?token=${token}`;

  // Send SMS via seven.io
  const sevenApiKey = process.env.SEVEN_IO_API_KEY;
  const timeStr = now.toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" });
  const smsText = `Dein Termin bei ${salon.name}: ${service.name_de} um ${timeStr}. Bezahle hier: ${paymentUrl}`;

  let smsSent = false;
  if (sevenApiKey) {
    try {
      const smsRes = await fetch("https://gateway.seven.io/api/sms", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Api-Key": sevenApiKey },
        body: JSON.stringify({
          to: validated.customer_phone,
          text: smsText,
          from: "solen.ch",
        }),
      });
      smsSent = smsRes.ok;
    } catch { /* SMS failure non-fatal */ }
  }

  return NextResponse.json({
    data: {
      booking_id: booking.id,
      payment_url: paymentUrl,
      sms_sent: smsSent,
    },
  }, { status: 201 });
}
