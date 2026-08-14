// lib/promo/resolve-promo-discount.ts
//
// SHARED promo re-validation + discount math. Extracted verbatim (2026-07-07,
// pre-charge overcharge fix) from app/api/stripe/booking-pay-intent/route.ts
// so the immediate-charge path and the cron pre-charge path apply IDENTICAL
// promo rules: a promo the customer applied at booking must reduce the
// charge the SAME way whether it's charged now or 5 days later off-session.
//
// RE-VALIDATES the persisted code against the LIVE promo_codes row + ALL
// constraints (active, valid_from, valid_until, max_uses, min_booking_amount,
// salon applicability, min_tier). The caller's promoCode is NEVER trusted as
// pre-validated, only a fully-valid promo reduces the charge. The discount is
// computed off the FULL price (percent or fixed), converted to Rappen, then
// CAPPED so it can never exceed baseAmountRappen nor push the charge below the
// Stripe minimum (CHF 0.50 = 50 Rappen).
import type { SupabaseClient } from "@supabase/supabase-js";
import { toRappen } from "@/lib/stripe";
import { getCurrentTier, tierAtLeast } from "@/lib/loyalty/perks";
import type { Tier } from "@/lib/loyalty/status";

export interface ResolvePromoDiscountArgs {
  /** The code persisted on the booking (booking.promo_code), or null/undefined for none. */
  promoCode: string | null | undefined;
  /** FULL service price in CHF, percent discount and min_booking_amount are judged on this, NEVER the deposit/base amount. */
  fullPriceChf: number;
  /** Booking's salon, a salon-scoped promo must match. */
  salonId: string;
  /** Booking's user_id (null for guest), a guest fails any tier-gated promo. */
  userId: string | null | undefined;
  /** What is being charged BEFORE the promo (full price or deposit, in Rappen), the discount is capped against this. */
  baseAmountRappen: number;
}

export interface ResolvePromoDiscountResult {
  /** Rappen the charge is reduced by. 0 when no promo, invalid promo, or fully clamped away. */
  promoDiscountRappen: number;
  /** The validated code that funded the discount (uppercased, as stored), null when none applied. */
  promoCodeApplied: string | null;
}

export async function resolvePromoDiscount(
  admin: SupabaseClient,
  args: ResolvePromoDiscountArgs,
): Promise<ResolvePromoDiscountResult> {
  const { promoCode, fullPriceChf, salonId, userId, baseAmountRappen } = args;

  let promoDiscountRappen = 0;
  let promoCodeApplied: string | null = null;

  if (!promoCode) {
    return { promoDiscountRappen, promoCodeApplied };
  }

  try {
    const { data: promo } = await admin
      .from("promo_codes")
      .select("id, code, discount_type, discount_value, min_booking_amount, max_uses, current_uses, salon_id, valid_from, valid_until, is_active, min_tier")
      .eq("code", promoCode.toUpperCase())
      .eq("is_active", true)
      .maybeSingle();

    const now = new Date();
    let promoOk = !!promo;
    if (promo) {
      if (promo.valid_from && new Date(promo.valid_from) > now) promoOk = false;
      if (promo.valid_until && new Date(promo.valid_until) < now) promoOk = false;
      if (promo.max_uses !== null && (promo.current_uses ?? 0) >= promo.max_uses) promoOk = false;
      if (fullPriceChf < (promo.min_booking_amount ?? 0)) promoOk = false;
      if (promo.salon_id && promo.salon_id !== salonId) promoOk = false;
      // min_tier gate (Solen Plus, LOYALTY_STRUCTURE.md §12.4): the server derives the LIVE tier;
      // a guest (no user_id) is base and fails any tier-gated promo. Mirrors /api/promo/validate.
      if (promo.min_tier === "gold" || promo.min_tier === "platinum") {
        const tier = await getCurrentTier(admin, userId);
        if (!tierAtLeast(tier, promo.min_tier as Tier)) promoOk = false;
      }
    }

    if (promo && promoOk) {
      // Discount CHF off the FULL price, identical formula to /api/promo/validate.
      const discountChf = promo.discount_type === "percent"
        ? Math.round(fullPriceChf * (promo.discount_value / 100) * 100) / 100
        : Math.min(promo.discount_value, fullPriceChf);
      const discountRappen = toRappen(discountChf);
      // Cap: never exceed what is charged now (baseAmountRappen), and never push the charge
      // below the Stripe minimum (50 Rappen).
      promoDiscountRappen = Math.max(0, Math.min(discountRappen, baseAmountRappen - 50));
      if (promoDiscountRappen > 0) {
        promoCodeApplied = promo.code;
      } else {
        promoDiscountRappen = 0; // discount fully clamped away, treat as not applied
      }
    }
  } catch (err) {
    // Never let a promo lookup error block or under-charge: fail to NO discount (full charge).
    console.error("[resolvePromoDiscount] promo re-validation failed; charging without discount:", err);
    promoDiscountRappen = 0;
    promoCodeApplied = null;
  }

  return { promoDiscountRappen, promoCodeApplied };
}
