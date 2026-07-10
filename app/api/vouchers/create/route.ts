/**
 * POST /api/vouchers/create
 *
 * Creates a Stripe Promotion Code-backed voucher (Gutschein).
 * Flow:
 *   1. Create Stripe Coupon (percent_off or amount_off)
 *   2. Create Stripe Promotion Code with max_redemptions=1
 *   3. Save to Supabase promo_codes table
 *   4. Create PaymentIntent for purchase
 *   5. Return client secret for Stripe Elements
 */

export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getStripe, toRappen } from "@/lib/stripe";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled } from "@/lib/feature-flags";
import { applyRateLimit, paymentLimiter } from "@/lib/ratelimit";
import { nanoid } from "nanoid";

// Validation schema. customerId is deliberately NOT accepted from the client, the
// original caller (app/[locale]/vouchers/buy, now hidden per that page's own note)
// is a logged-in customer buying a voucher for themselves, so the buyer is derived
// from the session below, never trusted from the request body.
// Caps (P0 fix, 2026-07-10): a purchased voucher is stored value, so discountValue
// must be bounded , without a cap a client could mint an arbitrarily large fixed
// discount. 500 CHF mirrors the gift-card purchase ceiling (giftCardPurchaseSchema,
// 50000 Rappen). The percent cap is moot once percent is rejected below, but keeps
// the schema internally consistent if that branch is ever revisited.
const CreateVoucherSchema = z
  .object({
    discountType: z.enum(["percent", "fixed"]),
    discountValue: z.number().positive(),
    recipientEmail: z.string().email().optional(),
    salonId: z.string().uuid().optional(),
  })
  .refine((data) => data.discountValue >= 1, {
    message: "Wert muss mindestens 1 sein",
    path: ["discountValue"],
  })
  .refine(
    (data) => !(data.discountType === "percent" && data.discountValue > 100),
    { message: "Prozentwert darf 100 nicht überschreiten", path: ["discountValue"] }
  )
  .refine(
    (data) => !(data.discountType === "fixed" && data.discountValue > 500),
    { message: "Gutschein darf CHF 500 nicht überschreiten", path: ["discountValue"] }
  );

export async function POST(req: NextRequest) {
  try {
    // Fail-closed feature gate (mirrors app/api/gift-cards/purchase): blocks mint
    // while the "vouchers" flag is off or on a verify error, FIRST, before auth.
    const disabled = await checkFeatureEnabled("vouchers");
    if (disabled) return disabled;

    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Rate-limited: minting a voucher creates a Stripe coupon + promotion code +
    // an is_active:false promo_codes row per call (mirrors the other payment-adjacent
    // mint endpoints, e.g. gift-cards/purchase).
    const rateLimited = await applyRateLimit(paymentLimiter, { userId: user.id });
    if (rateLimited) return rateLimited;

    const body = await req.json();
    const parsed = CreateVoucherSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Ungültige Eingabedaten", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { discountType, discountValue, recipientEmail, salonId } = parsed.data;
    const customerId = user.id;

    // A purchased voucher is a stored-value instrument (the buyer pays a CHF amount
    // for a matching CHF discount). A percent voucher has no fixed value to charge
    // (buy 95%-off for CHF 95 mispriced it, and the discount is uncapped relative to
    // the price paid), so purchasable vouchers must be fixed-amount only.
    if (discountType === "percent") {
      return NextResponse.json(
        { error: "percent_voucher_not_purchasable" },
        { status: 400 }
      );
    }

    const stripe = getStripe();
    const admin = createAdminSupabaseClient();

    // Step 1: Create Stripe Coupon
    // discountType is narrowed to "fixed" here: the percent branch returns 400 above.
    const couponParams: any = {
      currency: "chf",
      name: `Gutschein CHF ${discountValue}`,
      amount_off: toRappen(discountValue), // CHF → Rappen
    };

    const coupon = await stripe.coupons.create(couponParams);

    // Step 2: Create Stripe Promotion Code
    const code = nanoid(10).toUpperCase(); // Generate unique 10-char code
    const promotionCode = await stripe.promotionCodes.create({
      coupon: coupon.id as string,
      code,
      max_redemptions: 1, // Single-use voucher
    } as unknown as import("stripe").Stripe.PromotionCodeCreateParams);

    // Step 3: Save to Supabase promo_codes table
    const { data: promoCodeRecord, error: promoError } = await admin
      .from("promo_codes")
      .insert({
        code,
        discount_type: discountType,
        discount_value: discountValue,
        stripe_coupon_id: coupon.id,
        stripe_promotion_code_id: promotionCode.id,
        is_purchased_voucher: true,
        salon_id: salonId ?? null,
        max_uses: 1,
        current_uses: 0,
        // CRITICAL (P0 fix, 2026-07-10): inert until paid. This row used to be inserted
        // is_active:true, so any logged-in user could mint a working 100%-off /
        // arbitrary-fixed discount code without ever paying, then redeem it on a
        // booking , unlimited free services. Flipped to true ONLY by the Stripe webhook
        // (app/api/stripe/webhook/voucher-handler.ts, handleVoucherPurchase) after the
        // PaymentIntent below actually succeeds. Mirrors gift_cards.is_active (gift-card-handler.ts).
        is_active: false,
        created_by: customerId,
      })
      .select()
      .single();

    if (promoError || !promoCodeRecord) {
      console.error("[vouchers/create] Failed to save promo code:", promoError);
      return NextResponse.json(
        { error: "Fehler beim Speichern des Gutscheins" },
        { status: 500 }
      );
    }

    // Step 4: Create PaymentIntent for voucher purchase
    // The purchase amount is the discount value for fixed vouchers,
    // or a platform-defined amount for percentage vouchers
    const purchaseAmount =
      discountType === "fixed" ? discountValue : discountValue; // For % vouchers, you may want to set a fixed purchase price

    const paymentIntent = await stripe.paymentIntents.create({
      amount: toRappen(purchaseAmount),
      currency: "chf",
      automatic_payment_methods: { enabled: true },
      metadata: {
        type: "voucher_purchase",
        promo_code_id: promoCodeRecord.id,
        customer_id: customerId,
        voucher_code: code,
        recipient_email: recipientEmail ?? "",
        is_gift: recipientEmail ? "true" : "false",
      },
    });

    // Step 5: Return client secret for frontend
    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      voucherCode: code,
      promoCodeId: promoCodeRecord.id,
    });
  } catch (error: any) {
    console.error("[vouchers/create] Error:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler", message: error.message },
      { status: 500 }
    );
  }
}
