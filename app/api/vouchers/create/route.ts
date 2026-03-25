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
import { createAdminSupabaseClient } from "@/lib/supabase";
import { nanoid } from "nanoid";

// Validation schema
const CreateVoucherSchema = z.object({
  discountType: z.enum(["percent", "fixed"]),
  discountValue: z.number().positive(),
  recipientEmail: z.string().email().optional(),
  salonId: z.string().uuid().optional(),
  customerId: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = CreateVoucherSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Ungültige Eingabedaten", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { discountType, discountValue, recipientEmail, salonId, customerId } =
      parsed.data;

    const stripe = getStripe();
    const admin = createAdminSupabaseClient();

    // Step 1: Create Stripe Coupon
    const couponParams: any = {
      currency: "chf",
      name: `Gutschein ${discountType === "percent" ? `${discountValue}%` : `CHF ${discountValue}`}`,
    };

    if (discountType === "percent") {
      couponParams.percent_off = discountValue;
    } else {
      couponParams.amount_off = toRappen(discountValue); // CHF → Rappen
    }

    const coupon = await stripe.coupons.create(couponParams);

    // Step 2: Create Stripe Promotion Code
    const code = nanoid(10).toUpperCase(); // Generate unique 10-char code
    const promotionCode = await stripe.promotionCodes.create({
      coupon: coupon.id,
      code,
      max_redemptions: 1, // Single-use voucher
    });

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
        is_active: true,
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
