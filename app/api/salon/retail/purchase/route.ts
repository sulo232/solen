export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { checkUserBanned } from "@/lib/feature-flags";
import { applyRateLimit, paymentLimiter } from "@/lib/ratelimit";
import { validateBody, retailPurchaseSchema } from "@/lib/validations";
import { getStripe } from "@/lib/stripe";

// POST /api/salon/retail/purchase — Create Stripe PaymentIntent for retail purchase
export async function POST(req: NextRequest) {
  let stripe;
  try {
    stripe = getStripe();
  } catch {
    return NextResponse.json({ error: "Payments not configured" }, { status: 503 });
  }

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const rateLimited = await applyRateLimit(paymentLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const body = await req.json();
  const { data: validated, error: validationError } = validateBody(retailPurchaseSchema, body);
  if (validationError) return NextResponse.json({ error: validationError.message }, { status: 400 });
  const { product_ids, salon_id } = validated;

  const admin = createAdminSupabaseClient();

  // Get salon's Stripe account
  const { data: salon } = await admin
    .from("salons").select("id, stripe_account_id, accepts_online_payment").eq("id", salon_id).single();
  if (!salon?.stripe_account_id) {
    return NextResponse.json({ error: "Salon has no payment setup" }, { status: 400 });
  }
  if (!salon.accepts_online_payment) {
    return NextResponse.json({ error: "Salon is not set up to accept online payments" }, { status: 400 });
  }

  // Get products and calculate total
  // BUG-3: also select stock_count so we can block a sold-out product BEFORE the charge.
  const { data: products } = await admin
    .from("nail_retail_products")
    .select("id, name, price, stock_count")
    .in("id", product_ids)
    .eq("salon_id", salon_id)
    .eq("is_active", true);

  if (!products?.length) return NextResponse.json({ error: "No valid products" }, { status: 400 });

  // Council guard: never charge a SUBSET. If any requested product was missing /
  // inactive / from another salon, the DB returns fewer rows than requested , reject
  // the whole purchase rather than silently pricing only the products that resolved.
  const requestedIds = [...new Set(product_ids)];
  if (products.length !== requestedIds.length) {
    return NextResponse.json(
      { error: "Some products are unavailable", code: "PRODUCTS_UNAVAILABLE" },
      { status: 400 },
    );
  }

  // BUG-3 (oversell): block a sold-out product BEFORE creating the PaymentIntent. A tracked
  // product (stock_count IS NOT NULL) with stock_count < 1 is out of stock. An untracked product
  // (stock_count NULL) is unlimited and skipped , this matches the webhook decrement, which only
  // decrements SKUs that return a flipped row and skips NULL-stock SKUs.
  const outOfStock = products.filter((p) => p.stock_count != null && p.stock_count < 1);
  if (outOfStock.length > 0) {
    return NextResponse.json(
      { error: "Some products are out of stock", code: "OUT_OF_STOCK", productIds: outOfStock.map((p) => p.id) },
      { status: 409 },
    );
  }

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

  // Record a pending purchase row (mirrors /api/packages/purchase). The webhook
  // (type:'retail_purchase') flips it to paid + writes paid_amount in Rappen on
  // settle; this row is what makes a retail purchase refundable
  // (lib/purchases/issue-purchase-refund.ts). Keyed on the PI (unique index).
  await admin.from("retail_purchases").insert({
    salon_id,
    user_id: user.id,
    product_ids,
    stripe_payment_intent_id: paymentIntent.id,
    status: "pending",
  });

  return NextResponse.json({
    clientSecret: paymentIntent.client_secret,
    amount: totalAmount,
    products,
  });
}
