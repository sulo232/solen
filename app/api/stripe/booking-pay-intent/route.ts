export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { stripe, toRappen } from "@/lib/stripe";
import { applyRateLimit, paymentLimiter, getClientIp } from "@/lib/ratelimit";
import { checkFeatureEnabled } from "@/lib/feature-flags";
import { DEFAULT_COMMISSION_RATE_PERCENT } from "@/lib/constants/billing";
import { createHash } from "crypto";

// POST /api/stripe/booking-pay-intent
// FULL PREPAY at booking (the Fresha model). Creates an automatic-capture
// PaymentIntent for the full service price, routed as a Stripe Connect
// destination charge to the salon's connected account with the Solen
// commission as application_fee_amount, AND saves the card off-session
// (setup_future_usage) so SP-AC (cancellation/no-show) and SP-3 (upcharge)
// can charge later without a fresh SCA prompt.
//
// Modeled on app/api/walkin/pay-intent/route.ts (server-trusted price,
// Connect destination, commission fee, guest-tolerant) but:
//   - capture_method "automatic" (full prepay, not a hold)
//   - customer + setup_future_usage:"off_session" (saved card)
//   - keyed off an existing booking row (Option B): the booking is created
//     first by POST /api/bookings with payment_method:"online" (status
//     "pending"), then the FE calls this with that booking_id. The webhook
//     payment_intent.succeeded → flips status "confirmed" + payment_status
//     "paid"; payment_intent.payment_failed → releases the slot.
//
// Works for BOTH a logged-in customer and a guest (booking.user_id IS NULL).
export async function POST(req: NextRequest) {
  const paymentsOff = await checkFeatureEnabled("payments");
  if (paymentsOff) return paymentsOff;

  // Who is acting: logged-in user (rate-limit by userId) or guest (by IP).
  // Mirrors walk-in/pay-intent's dual key. §10b#12 wants a dedicated
  // moneyLimiter; until SP-0/SP-2 adds it, reuse the 3/hour paymentLimiter.
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id ?? null;

  const rateLimited = await applyRateLimit(
    paymentLimiter,
    userId ? { userId } : { ip: getClientIp(req) }
  );
  if (rateLimited) return rateLimited;

  const body = await req.json().catch(() => null);
  const booking_id = String(body?.booking_id ?? "").trim();
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!booking_id || !UUID_RE.test(booking_id)) {
    return NextResponse.json({ error: "booking_id is required" }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();

  // 1. Load the booking (server-trusted anchor). It already carries salon,
  //    service, slot, time, staff, and — for guests — guest_email/name.
  const { data: booking } = await admin
    .from("bookings")
    .select("id, user_id, salon_id, service_id, slot_id, starts_at, staff_member_id, status, payment_status, guest_email, guest_name")
    .eq("id", booking_id)
    .single();
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  // Authorize: a logged-in user may only pay their OWN booking. A guest booking
  // (user_id IS NULL) is payable without a session — the booking row is the
  // authorization anchor here (SP-2's hashed-token resolveBookingActor is the
  // stronger gate and lands later). Reject a guest trying to pay a user's booking.
  if (booking.user_id) {
    if (!userId || userId !== booking.user_id) {
      return NextResponse.json({ error: "Not authorized for this booking" }, { status: 403 });
    }
  }

  // Don't re-charge an already-paid booking (idempotent at the booking level).
  if (booking.payment_status === "paid") {
    return NextResponse.json({ error: "Booking is already paid" }, { status: 409 });
  }
  // Only a live booking awaiting payment can be charged.
  if (!["pending", "pending_approval", "confirmed"].includes(booking.status ?? "")) {
    return NextResponse.json({ error: "Booking is not payable" }, { status: 409 });
  }

  // 2. Salon must accept online payment.
  const { data: salon } = await admin
    .from("salons")
    .select("name, stripe_account_id, accepts_online_payment")
    .eq("id", booking.salon_id)
    .single();
  if (!salon) return NextResponse.json({ error: "Salon not found" }, { status: 404 });
  if (!salon.accepts_online_payment) {
    return NextResponse.json({ error: "Salon does not accept online payments" }, { status: 400 });
  }

  // 3. Server-trusted price — from the service row, NEVER the client.
  //    (price_paid on the booking is server-set too, but the unit contract is
  //    explicit: derive CHF from services.price and convert via toRappen only.)
  const { data: service } = await admin
    .from("services")
    .select("price, salon_id, is_active, name_de")
    .eq("id", booking.service_id)
    .single();
  if (!service || service.salon_id !== booking.salon_id || service.is_active === false) {
    return NextResponse.json({ error: "Service not found for this salon" }, { status: 404 });
  }
  const priceChf = Number(service.price);
  if (!Number.isFinite(priceChf) || priceChf < 0.5) {
    return NextResponse.json({ error: "Service has no valid price" }, { status: 400 });
  }
  const amountRappen = toRappen(priceChf);

  // 4. Re-verify the slot is still held by THIS booking (don't take a card for
  //    a slot that was released / re-booked under us).
  if (booking.slot_id) {
    const { data: slot } = await admin
      .from("availability_slots")
      .select("id, status, booking_id")
      .eq("id", booking.slot_id)
      .single();
    if (!slot || (slot.status !== "booked" && slot.status !== "available") || (slot.booking_id && slot.booking_id !== booking.id)) {
      return NextResponse.json({ error: "Slot no longer available" }, { status: 409 });
    }
  }

  // 5. Resolve the Stripe customer (the card is saved on it for off-session reuse).
  let customerId: string | null = null;
  const guestEmail = (booking.guest_email ?? "").trim();
  try {
    if (booking.user_id) {
      // Logged-in: one shared customer per user, persisted on profiles.
      const { data: profile } = await admin
        .from("profiles")
        .select("stripe_customer_id, display_name, email")
        .eq("id", booking.user_id)
        .single();
      customerId = profile?.stripe_customer_id ?? null;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: profile?.email ?? session?.user?.email ?? undefined,
          name: profile?.display_name ?? undefined,
          metadata: { solen_user_id: booking.user_id },
        });
        customerId = customer.id;
        await admin.from("profiles").update({ stripe_customer_id: customerId }).eq("id", booking.user_id);
      }
    } else {
      // Guest: a fresh customer keyed off the guest booking (no profiles row).
      // The id is carried in PI metadata and persisted onto the booking by the
      // webhook (bookings.stripe_customer_id), so SP-AC/SP-3 can reuse it.
      const customer = await stripe.customers.create({
        email: guestEmail || undefined,
        name: (booking.guest_name ?? "").trim() || undefined,
        metadata: { guest: "1", booking_id: booking.id },
      });
      customerId = customer.id;
    }
  } catch (err) {
    console.error("[booking-pay-intent] Stripe customer create/resolve failed:", err);
    return NextResponse.json({ error: "Could not initialize payment" }, { status: 500 });
  }

  // 6. Platform commission (Connect destination charge).
  const { data: commissionSetting } = await admin
    .from("platform_settings").select("value").eq("key", "commission").single();
  const commissionRate = (commissionSetting?.value?.rate_percent ?? DEFAULT_COMMISSION_RATE_PERCENT) / 100;
  const platformFeeRappen = Math.round(amountRappen * commissionRate);

  // 7. Build the PaymentIntent.
  const intentParams: Parameters<typeof stripe.paymentIntents.create>[0] = {
    amount: amountRappen,                  // Rappen — Stripe's smallest unit for CHF
    currency: "chf",
    capture_method: "automatic",           // FULL PREPAY (captured immediately on success), not a hold
    customer: customerId ?? undefined,
    setup_future_usage: "off_session",     // saves the PM for later off-session charges (SP-AC / SP-3)
    // Wallets (Apple/Google Pay) + Link surface via the Payment Element;
    // allow_redirects:"never" excludes redirect/BNPL (TWINT etc.) that can't
    // be saved off-session or don't fit prepay-then-recharge. Matches walk-in.
    // Apple Pay needs the domain registered in Stripe (HTTPS, never localhost) —
    // see _tasks/APPLE_PAY_SETUP.md.
    automatic_payment_methods: { enabled: true, allow_redirects: "never" },
    metadata: {
      type: "booking",
      booking_id: booking.id,
      salon_id: booking.salon_id,
      salon_name: salon.name ?? "",
      service_id: booking.service_id,
      service_name: service.name_de ?? "",
      customer_id: booking.user_id ?? "",
      guest_email: guestEmail,
      slot_id: booking.slot_id ?? "",
      starts_at: booking.starts_at ?? "",
      staff_member_id: booking.staff_member_id ?? "",
    },
    description: `Buchung: ${service.name_de ?? "Service"} @ ${salon.name ?? "Salon"}`,
  };
  // Connect destination charge: route funds to the salon, keep the commission.
  // on_behalf_of is implied by transfer_data.destination for destination charges
  // — Stripe forbids setting both, so we do NOT set on_behalf_of here.
  if (salon.stripe_account_id) {
    intentParams.application_fee_amount = platformFeeRappen;
    intentParams.transfer_data = { destination: salon.stripe_account_id };
  }

  // 8. Idempotency: a deterministic key per (booking, amount) so a double-submit
  //    of the pay step reuses the SAME PaymentIntent (no double PI, no double
  //    charge). §10b#11. Stripe replays the original response for a matching key.
  const idempotencyKey = createHash("sha256")
    .update(`booking-pay:${booking.id}:${amountRappen}`)
    .digest("hex");

  let paymentIntent;
  try {
    paymentIntent = await stripe.paymentIntents.create(intentParams, { idempotencyKey });
  } catch (err) {
    console.error("[booking-pay-intent] PaymentIntent create failed:", err);
    return NextResponse.json({ error: "Could not create payment" }, { status: 500 });
  }

  // 9. Stamp the PI id onto the booking now so the webhook's booking_id-keyed
  //    handlers (succeeded → paid; payment_failed → release slot) can also match
  //    by payment_intent_id, and a refund later has it.
  await admin
    .from("bookings")
    .update({ payment_intent_id: paymentIntent.id })
    .eq("id", booking.id);

  return NextResponse.json({
    client_secret: paymentIntent.client_secret,
    payment_intent_id: paymentIntent.id,
    amount: priceChf,
    service_name: service.name_de,
  });
}
