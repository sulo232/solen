/**
 * POST /api/vouchers/validate
 *
 * Validates a promo code against business rules before applying to checkout.
 * Returns discount details if valid, or error message if invalid.
 */

export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validateVoucher, calculateDiscountedAmount } from "@/lib/vouchers/validate";

const ValidateVoucherRequestSchema = z.object({
  code: z.string().min(1),
  bookingAmount: z.number().positive(),
  salonId: z.string().uuid().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = ValidateVoucherRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Ungültige Anfrage", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { code, bookingAmount, salonId } = parsed.data;

    const result = await validateVoucher(code, bookingAmount, salonId);

    if (!result.valid) {
      return NextResponse.json(
        { valid: false, error: result.error },
        { status: 200 }
      );
    }

    // Calculate discounted amount
    const discountedAmount = calculateDiscountedAmount(
      bookingAmount,
      result.code!.discount_type,
      result.code!.discount_value
    );

    return NextResponse.json({
      valid: true,
      code: result.code,
      originalAmount: bookingAmount,
      discountedAmount,
      discountAmount: bookingAmount - discountedAmount,
    });
  } catch (error: any) {
    console.error("[vouchers/validate] Error:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler", message: error.message },
      { status: 500 }
    );
  }
}
