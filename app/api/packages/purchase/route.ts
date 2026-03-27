export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { applyRateLimit, paymentLimiter } from "@/lib/ratelimit";
import { validateBody, packagePurchaseSchema } from "@/lib/validations";
import Stripe from "stripe";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-02-25.clover" });
}

// POST /api/packages/purchase — Buy a service package via Stripe
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
  const { data: validated, error: valError } = validateBody(packagePurchaseSchema, body);
  if (valError) return NextResponse.json({ error: valError.message }, { status: 400 });

  // Get package details
  const { data: pkg } = await supabase
    .from("service_packages")
    .select("*, salons(stripe_account_id)")
    .eq("id", validated.package_id)
    .eq("is_active", true)
    .single();

  if (!pkg) return NextResponse.json({ error: "Package not found or inactive" }, { status: 404 });

  const stripeAccountId = (pkg.salons as any)?.stripe_account_id;

  // Read commission rate from platform_settings
  const { data: settings } = await supabase
    .from("platform_settings")
    .select("value")
    .eq("key", "commission")
    .single();

  const ratePercent = settings?.value?.rate_percent ?? 1;
  const platformFee = Math.round(pkg.price * (ratePercent / 100));

  // Create PaymentIntent
  const piParams: Stripe.PaymentIntentCreateParams = {
    amount: pkg.price,
    currency: "chf",
    metadata: {
      type: "package_purchase",
      package_id: pkg.id,
      user_id: user.id,
      salon_id: pkg.salon_id,
    },
  };

  if (stripeAccountId) {
    piParams.application_fee_amount = platformFee;
    piParams.transfer_data = { destination: stripeAccountId };
  }

  try {
    const paymentIntent = await getStripe().paymentIntents.create(piParams);

    // Create purchase record (pending until payment succeeds via webhook)
    await supabase.from("package_purchases").insert({
      package_id: pkg.id,
      user_id: user.id,
      salon_id: pkg.salon_id,
      sessions_total: pkg.total_sessions + (pkg.bonus_sessions ?? 0),
      sessions_used: 0,
      stripe_payment_intent_id: paymentIntent.id,
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
