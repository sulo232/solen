export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { applyRateLimit, paymentLimiter } from "@/lib/ratelimit";
import Stripe from "stripe";

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

// POST /api/salon/retail/purchase — Create Stripe PaymentIntent for retail purchase
export async function POST(req: NextRequest) {
  const disabled = await checkFeatureEnabled("nail_features");
  if (disabled) return disabled;

  if (!stripe) return NextResponse.json({ error: "Payments not configured" }, { status: 503 });

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const rateLimited = await applyRateLimit(paymentLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const body = await req.json();
  const { product_ids, salon_id } = body;
  if (!product_ids?.length || !salon_id) {
    return NextResponse.json({ error: "product_ids and salon_id required" }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();

  // Get salon's Stripe account
  const { data: salon } = await admin
    .from("salons").select("id, stripe_account_id").eq("id", salon_id).single();
  if (!salon?.stripe_account_id) {
    return NextResponse.json({ error: "Salon has no payment setup" }, { status: 400 });
  }

  // Get products and calculate total
  const { data: products } = await admin
    .from("nail_retail_products")
    .select("id, name, price")
    .in("id", product_ids)
    .eq("salon_id", salon_id)
    .eq("is_active", true);

  if (!products?.length) return NextResponse.json({ error: "No valid products" }, { status: 400 });

  const totalAmount = products.reduce((sum, p) => sum + p.price, 0);
  const platformFee = Math.round(totalAmount * 0.05); // 5% platform fee

  const paymentIntent = await stripe.paymentIntents.create({
    amount: totalAmount,
    currency: "chf",
    payment_method_types: ["card"],
    application_fee_amount: platformFee,
    transfer_data: { destination: salon.stripe_account_id },
    metadata: {
      type: "retail_purchase",
      salon_id,
      user_id: user.id,
      product_ids: product_ids.join(","),
    },
  });

  return NextResponse.json({
    clientSecret: paymentIntent.client_secret,
    amount: totalAmount,
    products,
  });
}
