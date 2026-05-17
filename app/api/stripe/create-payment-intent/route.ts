export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { stripe, toRappen } from "@/lib/stripe";
import { applyRateLimit, paymentLimiter } from "@/lib/ratelimit";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { validateBody, createPaymentIntentSchema } from "@/lib/validations";
import { DEFAULT_COMMISSION_RATE_PERCENT } from "@/lib/constants/billing";

// POST /api/stripe/create-payment-intent
// Body: { salon_id, service_name, estimated_price, deposit_amount }
// Returns: { client_secret, payment_intent_id }
export async function POST(req: NextRequest) {
  const disabled = await checkFeatureEnabled("payments");
  if (disabled) return disabled;

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const rateLimited = await applyRateLimit(paymentLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const body = await req.json();
  const { data: validated, error: valError } = validateBody(createPaymentIntentSchema, body);
  if (valError) return NextResponse.json({ message: valError.message, code: "VALIDATION_ERROR" }, { status: 400 });

  const { salon_id, service_id, service_name, estimated_price, deposit_amount } = validated;

  const admin = createAdminSupabaseClient();
  const { data: salon } = await admin
    .from("salons")
    .select("name, stripe_account_id, accepts_online_payment")
    .eq("id", salon_id)
    .single();

  if (!salon) return NextResponse.json({ error: "Salon not found" }, { status: 404 });
  if (!salon.accepts_online_payment) {
    return NextResponse.json({ error: "Salon does not accept online payments" }, { status: 400 });
  }

  // Server-side price reconciliation — prevents client from sending an
  // arbitrary deposit_amount (e.g. 0.01 CHF for a 500 CHF service).
  // The DB row for the service is the source of truth; deposit must not
  // exceed it and must clear the Stripe minimum (CHF 0.50).
  const { data: service, error: serviceErr } = await admin
    .from("services")
    .select("price, salon_id, is_active")
    .eq("id", service_id)
    .single();

  if (serviceErr || !service) {
    return NextResponse.json({ error: "Service not found" }, { status: 404 });
  }
  if (service.salon_id !== salon_id) {
    return NextResponse.json({ error: "Service does not belong to this salon" }, { status: 400 });
  }
  if (service.is_active === false) {
    return NextResponse.json({ error: "Service is not active" }, { status: 400 });
  }

  const truePriceChf = Number(service.price);
  if (!Number.isFinite(truePriceChf) || truePriceChf <= 0) {
    console.error("[create-payment-intent] service has invalid price", { service_id, price: service.price });
    return NextResponse.json({ error: "Service has no valid price" }, { status: 400 });
  }

  const MIN_DEPOSIT_CHF = 0.5; // Stripe minimum for CHF
  if (deposit_amount < MIN_DEPOSIT_CHF) {
    return NextResponse.json({ error: `Deposit must be at least CHF ${MIN_DEPOSIT_CHF}` }, { status: 400 });
  }
  if (deposit_amount > truePriceChf + 0.01) {
    return NextResponse.json({ error: "Deposit cannot exceed service price" }, { status: 400 });
  }
  if (Math.abs(estimated_price - truePriceChf) > 0.01) {
    return NextResponse.json({ error: "Estimated price does not match service price" }, { status: 400 });
  }

  const depositRappen = toRappen(deposit_amount);

  // Fetch configurable commission rate from platform_settings
  // (default lives in lib/constants/billing.ts — shared with packages/purchase)
  const { data: commissionSetting } = await admin
    .from("platform_settings")
    .select("value")
    .eq("key", "commission")
    .single();
  const commissionRate = (commissionSetting?.value?.rate_percent ?? DEFAULT_COMMISSION_RATE_PERCENT) / 100;
  const platformFeeRappen = Math.round(depositRappen * commissionRate);

  const intentParams: Parameters<typeof stripe.paymentIntents.create>[0] = {
    amount: depositRappen,
    currency: "chf",
    capture_method: "manual", // hold only — captured after service
    metadata: {
      salon_id,
      salon_name: salon.name,
      service_name: service_name ?? "",
      estimated_price: String(estimated_price),
      deposit_amount: String(deposit_amount),
      customer_id: user.id,
    },
    description: `Kaution: ${service_name} bei ${salon.name}`,
  };

  // If salon has Connect account wired up, route via Connect
  if (salon.stripe_account_id) {
    intentParams.application_fee_amount = platformFeeRappen;
    intentParams.transfer_data = { destination: salon.stripe_account_id };
  }

  const paymentIntent = await stripe.paymentIntents.create(intentParams);

  return NextResponse.json({
    client_secret: paymentIntent.client_secret,
    payment_intent_id: paymentIntent.id,
  });
}
