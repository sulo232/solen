import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { stripe, toRappen, PLATFORM_FEE_PERCENT } from "@/lib/stripe";

// POST /api/stripe/create-payment-intent
// Body: { salon_id, service_name, estimated_price, deposit_amount }
// Returns: { client_secret, payment_intent_id }
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { salon_id, service_name, estimated_price, deposit_amount } = await req.json();

  if (!salon_id || !estimated_price || !deposit_amount) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

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

  const depositRappen = toRappen(deposit_amount);
  const platformFeeRappen = Math.round(depositRappen * PLATFORM_FEE_PERCENT);

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
