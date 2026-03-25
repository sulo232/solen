/**
 * Voucher Validation Service
 *
 * Custom validation layer for promo codes before applying them to Stripe.
 * Checks salon-specific rules, minimum amounts, and usage limits.
 */

import { createAdminSupabaseClient } from "@/lib/supabase";

export interface ValidateVoucherResult {
  valid: boolean;
  error?: string;
  code?: {
    id: string;
    code: string;
    discount_type: "percent" | "fixed";
    discount_value: number;
    salon_id: string | null;
    stripe_promotion_code_id: string | null;
  };
}

/**
 * Validates a promo code against custom business rules
 * @param code - The promo code string to validate
 * @param bookingAmount - The total booking amount in CHF
 * @param salonId - Optional salon ID to validate salon-specific codes
 * @returns Validation result with code details or error message
 */
export async function validateVoucher(
  code: string,
  bookingAmount: number,
  salonId?: string
): Promise<ValidateVoucherResult> {
  const admin = createAdminSupabaseClient();

  // Query promo_codes table
  const { data: promoCode, error } = await admin
    .from("promo_codes")
    .select("*")
    .eq("code", code.toUpperCase())
    .eq("is_active", true)
    .single();

  if (error || !promoCode) {
    return {
      valid: false,
      error: "Gutschein nicht gefunden oder abgelaufen",
    };
  }

  // Check if code has expired
  if (promoCode.valid_until && new Date(promoCode.valid_until) < new Date()) {
    return {
      valid: false,
      error: "Gutschein ist abgelaufen",
    };
  }

  // Check if code is still valid (valid_from)
  if (promoCode.valid_from && new Date(promoCode.valid_from) > new Date()) {
    return {
      valid: false,
      error: "Gutschein ist noch nicht gültig",
    };
  }

  // Check usage limits
  if (
    promoCode.max_uses !== null &&
    promoCode.current_uses >= promoCode.max_uses
  ) {
    return {
      valid: false,
      error: "Gutschein wurde bereits vollständig eingelöst",
    };
  }

  // Check minimum booking amount
  if (
    promoCode.min_booking_amount &&
    bookingAmount < promoCode.min_booking_amount
  ) {
    return {
      valid: false,
      error: `Mindestbuchungswert von CHF ${promoCode.min_booking_amount.toFixed(2)} nicht erreicht`,
    };
  }

  // Check salon-specific codes
  if (promoCode.salon_id && salonId && promoCode.salon_id !== salonId) {
    return {
      valid: false,
      error: "Dieser Gutschein ist nur für einen anderen Salon gültig",
    };
  }

  // Valid code — return details
  return {
    valid: true,
    code: {
      id: promoCode.id,
      code: promoCode.code,
      discount_type: promoCode.discount_type as "percent" | "fixed",
      discount_value: promoCode.discount_value,
      salon_id: promoCode.salon_id,
      stripe_promotion_code_id: promoCode.stripe_promotion_code_id,
    },
  };
}

/**
 * Calculates the discounted amount after applying a voucher
 * @param originalAmount - Original booking amount in CHF
 * @param discountType - "percent" or "fixed"
 * @param discountValue - Percentage (0-100) or fixed CHF amount
 * @returns Discounted amount in CHF (never negative)
 */
export function calculateDiscountedAmount(
  originalAmount: number,
  discountType: "percent" | "fixed",
  discountValue: number
): number {
  let discountedAmount = originalAmount;

  if (discountType === "percent") {
    const discount = (originalAmount * discountValue) / 100;
    discountedAmount = originalAmount - discount;
  } else if (discountType === "fixed") {
    discountedAmount = originalAmount - discountValue;
  }

  // Never return negative amounts
  return Math.max(0, Math.round(discountedAmount * 100) / 100);
}
