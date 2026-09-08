export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { stripe, toRappen } from "@/lib/stripe";
import { applyRateLimit, paymentLimiter, getClientIp } from "@/lib/ratelimit";
import { checkFeatureEnabled } from "@/lib/feature-flags";
import { DEFAULT_COMMISSION_RATE_PERCENT } from "@/lib/constants/billing";
import { localizedField } from "@/lib/i18n/localized-field";
import { validateBody, walkinPayIntentSchema } from "@/lib/validations";

// POST /api/walkin/pay-intent
// Create a manual-capture (hold) PaymentIntent for a barbershop walk-in.
// Works for BOTH guest (anonymous) AND logged-in customers. Hardening for the
// anonymous path: server-trusted price (from services row, never client),
// IP rate limit, manual capture (authorize-only), barbershop + online-pay guards.
export async function POST(req: NextRequest) {
  const paymentsOff = await checkFeatureEnabled("payments");
  if (paymentsOff) return paymentsOff;
  const barberOff = await checkFeatureEnabled("barber_features");
  if (barberOff) return barberOff;

  const rateLimited = await applyRateLimit(paymentLimiter, { ip: getClientIp(req) });
  if (rateLimited) return rateLimited;

  const rawBody = await req.json().catch(() => null);
  const { data: validated, error: valError } = validateBody(walkinPayIntentSchema, rawBody);
  if (valError) {
    return NextResponse.json({ error: "salon_id and service_id are required", message: valError.message, code: "VALIDATION_ERROR" }, { status: 400 });
  }
  const { salon_id, service_id, locale = "de" } = validated;
  const customer_name = (validated.customer_name ?? "").trim();
  const customer_phone = (validated.customer_phone ?? "").trim();
  // booking_id: present when paying an existing walk-in booking (SMS payment-link flow).
  // Stamped into metadata so /api/walkin/confirm can verify the PI belongs to that booking.
  const booking_id = (validated.booking_id ?? "").trim();

  const admin = createAdminSupabaseClient();

  // Salon must be a barbershop that accepts online payment.
  const { data: salon } = await admin
    .from("salons")
    .select("name, walkin_enabled, walkin_paused, stripe_account_id, accepts_online_payment, vat_registered, vat_rate")
    .eq("id", salon_id)
    .single();
  if (!salon) return NextResponse.json({ error: "Salon not found", code: "NOT_FOUND" }, { status: 404 });
  // Phase 2 de-gate: walk-in is universal now (any category), gated on walkin_enabled.
  if (!(salon as any).walkin_enabled) {
    return NextResponse.json({ error: "Walk-in is not enabled for this salon", code: "WALKIN_DISABLED" }, { status: 403 });
  }
  if ((salon as any).walkin_paused) {
    return NextResponse.json({ error: "This shop has paused new walk-ins right now", code: "walkins_paused" }, { status: 409 });
  }
  if (!salon.accepts_online_payment) {
    // This salon only takes walk-ins in person — surface it as the pay-at-counter state,
    // not a generic failure, so the client can keep the summary readable (audit #6 state B).
    return NextResponse.json({ error: "Salon does not accept online payments", code: "counter_only" }, { status: 409 });
  }
  // PAY-IN-APP REQUIRES a connected Stripe account. Without one, the PaymentIntent
  // below would be created with no transfer_data / application_fee → the money would
  // land in SOLEN's platform account instead of the salon's, with no commission split
  // (council landmine #3). Block it; the shop must finish Stripe Connect onboarding
  // first (or run the free pay-at-counter mode instead).
  if (!salon.stripe_account_id) {
    // DEV-ONLY fallback (2026-06-12): seed salons have no Connect account and the
    // platform's test Stripe has Connect not yet enabled — allow a PLATFORM charge
    // so the walk-in flow is testable locally. Production keeps the hard block
    // (money must route to the salon with the commission split, council landmine #3).
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "This shop hasn't finished connecting payouts yet. Pay at the counter or try again later.", code: "payouts_not_connected" },
        { status: 409 },
      );
    }
    console.warn("[walkin/pay-intent] DEV fallback: platform charge, no Connect account for salon", salon_id);
  }

  // Server-trusted price — from the service row, NEVER the client.
  const { data: service } = await admin
    .from("services")
    .select("price, salon_id, is_active, name_de, name_en, name_fr, name_it")
    .eq("id", service_id)
    .single();
  if (!service || service.salon_id !== salon_id || service.is_active === false) {
    return NextResponse.json({ error: "Service not found for this salon", code: "NOT_FOUND" }, { status: 404 });
  }
  const priceChf = Number(service.price);
  if (!Number.isFinite(priceChf) || priceChf < 0.5) {
    return NextResponse.json({ error: "Service has no valid price", code: "INVALID_PRICE" }, { status: 400 });
  }
  const amountRappen = toRappen(priceChf);

  // Optional preferred barber (walk-in picker). Validate it's an active staff of THIS salon
  // before trusting it — an invalid id would later break the queue insert's FK. Drop silently
  // if absent/spoofed (barber preference is optional → "Egal").
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  let preferredBarberId = (validated.preferred_barber_id ?? "").trim();
  if (preferredBarberId && UUID_RE.test(preferredBarberId)) {
    const { data: barber } = await admin
      .from("staff_members")
      .select("id")
      .eq("id", preferredBarberId)
      .eq("salon_id", salon_id)
      .maybeSingle();
    if (!barber) preferredBarberId = "";
  } else {
    preferredBarberId = "";
  }

  // Capture customer_id opportunistically if logged in; guest = null.
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  const customerId = user?.id ?? null;

  // Platform commission (Connect).
  const { data: commissionSetting } = await admin
    .from("platform_settings").select("value").eq("key", "commission").single();
  // value is Json; narrow to the known shape, same pattern as app/api/stripe/create-payment-intent/route.ts.
  const commissionSettingValue = commissionSetting?.value as { rate_percent?: number } | null;
  const commissionRate = (commissionSettingValue?.rate_percent ?? DEFAULT_COMMISSION_RATE_PERCENT) / 100;
  const platformFeeRappen = Math.round(amountRappen * commissionRate);

  const intentParams: Parameters<typeof stripe.paymentIntents.create>[0] = {
    amount: amountRappen,
    currency: "chf",
    capture_method: "manual", // hold; captured when the barber marks the customer served
    // Apple Pay / Google Pay are wallets that ride on `card`; the Payment Element shows their
    // buttons automatically when eligible. allow_redirects:"never" surfaces wallets + Link while
    // still EXCLUDING redirect/BNPL methods (TWINT etc.) that don't fit a manual-capture hold.
    // Apple Pay additionally needs the domain registered in Stripe — deploy-time, HTTPS only.
    // See _tasks/APPLE_PAY_SETUP.md. (Never appears on localhost.)
    automatic_payment_methods: { enabled: true, allow_redirects: "never" },

    metadata: {
      type: "walk_in",
      salon_id,
      salon_name: salon.name,
      service_id,
      service_name: service.name_de ?? "",
      // Stripe rejects any metadata value >500 chars. customer_name/_phone are
      // raw free text from the client — cap defensively so a long string can't
      // throw inside paymentIntents.create.
      customer_name: customer_name.slice(0, 200),
      customer_phone: customer_phone.slice(0, 200),
      customer_id: customerId ?? "",
      booking_id,
      preferred_barber_id: preferredBarberId,
    },
    description: `Walk-in: ${service.name_de} @ ${salon.name}`,
  };
  if (salon.stripe_account_id) {
    intentParams.application_fee_amount = platformFeeRappen;
    intentParams.transfer_data = { destination: salon.stripe_account_id };
  }

  let paymentIntent;
  try {
    paymentIntent = await stripe.paymentIntents.create(intentParams);
  } catch (e) {
    console.error("[walkin/pay-intent] create failed:", e);
    return NextResponse.json(
      { error: "Could not start payment. Please try again.", code: "PAYMENT_INIT_FAILED" },
      { status: 502 },
    );
  }

  return NextResponse.json({
    client_secret: paymentIntent.client_secret,
    payment_intent_id: paymentIntent.id,
    amount: priceChf,
    service_name: localizedField(service, "name", locale),
    salon_vat_registered: salon.vat_registered,
    salon_vat_rate: salon.vat_rate,
  });
}
