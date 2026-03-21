export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";
import { checkUserBanned } from "@/lib/feature-flags";
import { validateBody, giftCardPurchaseSchema } from "@/lib/validations";
import { sendEmail } from "@/lib/email";
import { nanoid } from "nanoid";
import Stripe from "stripe";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-12-18.acacia" });
}

// POST /api/gift-cards/purchase — Buy a gift card + email delivery
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
  const { data: validated, error: valError } = validateBody(giftCardPurchaseSchema, body);
  if (valError) return NextResponse.json({ error: valError.message }, { status: 400 });

  // Get salon info
  const { data: salon } = await supabase
    .from("salons")
    .select("id, name, stripe_account_id")
    .eq("id", validated.salon_id)
    .single();

  if (!salon) return NextResponse.json({ error: "Salon not found" }, { status: 404 });

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

    await supabase.from("gift_cards").insert({
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

    // Send gift card email to recipient (after payment succeeds, but preview now)
    try {
      await sendEmail({
        to: validated.recipient_email,
        subject: `Du hast eine Geschenkkarte von ${salon.name} erhalten!`,
        html: `<div style="font-family:sans-serif;max-width:400px;margin:0 auto;text-align:center">
<h2 style="color:#E8624A">Geschenkkarte</h2>
<p>Hallo ${validated.recipient_name},</p>
<p>Du hast eine Geschenkkarte für <strong>${salon.name}</strong> erhalten!</p>
<div style="background:#FAF6EF;border-radius:12px;padding:20px;margin:16px 0">
<p style="font-size:24px;font-weight:bold;color:#E8624A;margin:0">CHF ${(validated.amount / 100).toFixed(2)}</p>
<p style="font-size:14px;color:#999;margin:4px 0 0">Code: <strong>${code}</strong></p>
</div>
${validated.message ? `<p style="color:#666;font-style:italic">"${validated.message}"</p>` : ""}
<p><a href="https://www.solen.ch" style="display:inline-block;padding:12px 24px;background:#E8624A;color:#fff;border-radius:8px;text-decoration:none">Jetzt einlösen →</a></p>
<p style="font-size:11px;color:#999">Gültig bis ${new Date(expiresAt).toLocaleDateString("de-CH")}</p>
</div>`,
      });
    } catch { /* email non-fatal */ }

    return NextResponse.json({ clientSecret: paymentIntent.client_secret, code }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
