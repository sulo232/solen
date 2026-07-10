export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { applyRateLimit, paymentLimiter } from "@/lib/ratelimit";
import { validateBody, giftCardPurchaseSchema } from "@/lib/validations";
import { nanoid } from "nanoid";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";

// POST /api/gift-cards/purchase — Buy a gift card + email delivery
export async function POST(req: NextRequest) {
  const disabled = await checkFeatureEnabled("payments");
  if (disabled) return disabled;

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const rateLimited = await applyRateLimit(paymentLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const body = await req.json();
  const { data: validated, error: valError } = validateBody(giftCardPurchaseSchema, body);
  if (valError) return NextResponse.json({ error: valError.message }, { status: 400 });

  // Get salon info
  const { data: salon } = await supabase
    .from("salons")
    .select("id, name, stripe_account_id, accepts_online_payment")
    .eq("id", validated.salon_id)
    .single();

  if (!salon) return NextResponse.json({ error: "Salon not found" }, { status: 404 });
  // A salon can have stripe_account_id set (clicked Connect) before onboarding/KYC completes
  // (charges_enabled false). Only gate when a Connect transfer would actually be attempted
  // below (stripe_account_id set); a salon with no Connect account at all still sells gift
  // cards straight to the platform balance, which is not the misroute this guards against.
  if (salon.stripe_account_id && !salon.accepts_online_payment) {
    return NextResponse.json({ error: "Salon is not set up to accept online payments" }, { status: 400 });
  }

  // Generate unique gift card code (12 chars, uppercase alphanumeric)
  const code = nanoid(12).toUpperCase().replace(/[^A-Z0-9]/g, "X");

  // Create PaymentIntent
  const piParams: Stripe.PaymentIntentCreateParams = {
    amount: validated.amount,
    currency: "chf",
    metadata: { type: "gift_card", salon_id: salon.id, code },
  };

  if (salon.stripe_account_id) {
    piParams.transfer_data = { destination: salon.stripe_account_id };
  }

  try {
    const paymentIntent = await getStripe().paymentIntents.create(piParams);

    // Create gift card record (active after payment succeeds via webhook)
    const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(); // 1 year

    // Written via the admin client: the session client's RLS insert policy requires the
    // caller to be the salon owner, which silently blocks this insert for a customer buyer
    // (P0 fix, 2026-07-10: charged with no gift card row ever created).
    const admin = createAdminSupabaseClient();
    const { error: insertError } = await admin.from("gift_cards").insert({
      salon_id: salon.id,
      code,
      original_amount: validated.amount,
      remaining_amount: validated.amount,
      purchaser_user_id: user.id,
      purchaser_email: user.email,
      recipient_email: validated.recipient_email,
      recipient_name: validated.recipient_name,
      message: validated.message ?? null,
      stripe_payment_intent_id: paymentIntent.id,
      expires_at: expiresAt,
      is_active: false, // Activated after payment
    });

    if (insertError) {
      console.error("[gift-cards/purchase] insert failed:", insertError);
      try {
        await getStripe().paymentIntents.cancel(paymentIntent.id);
      } catch (cancelErr) {
        console.error("[gift-cards/purchase] PaymentIntent cancel failed:", cancelErr);
      }
      return NextResponse.json({ error: "Could not create gift card" }, { status: 500 });
    }

    // NOTE: the recipient email + card activation (is_active:true) happen in the Stripe
    // webhook on payment_intent.succeeded (app/api/stripe/webhook/gift-card-handler.ts),
    // NOT here. Sending it at PI creation delivered a redeemable code for a card that was
    // never paid if the buyer abandoned checkout (P0 fix, 2026-06-10).

    return NextResponse.json({ clientSecret: paymentIntent.client_secret, code }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
