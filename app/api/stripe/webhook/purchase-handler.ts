// app/api/stripe/webhook/purchase-handler.ts
//
// Finalizes PACKAGE + RETAIL purchases on payment_intent.succeeded. Mirrors
// voucher-handler.ts (early-return guard called from the webhook's succeeded
// case): returns true if it handled the PI (stop other handlers), false to fall
// through.
//
// Two jobs per purchase, so refunds (lib/purchases/issue-purchase-refund.ts) work:
//   1. Persist paid_amount (INTEGER Rappen, straight from pi.amount) + mark the
//      row settled. issuePurchaseRefund caps the refund at paid_amount and CASes
//      on refunded_amount; without paid_amount it throws NO_PAID_AMOUNT.
//   2. Write a salon_payouts ledger row (CHF, same shape + commission math as the
//      booking branch) keyed on the PI, so the webhook's charge.refunded reconciler
//      decrements the salon's earnings when the purchase is later refunded — exactly
//      like a booking refund. Idempotent upsert on stripe_payment_intent_id.
//
// Owner decision (2026-06-02): packages + retail are refundable; gift-cards /
// vouchers / tips are FINAL-SALE — vouchers keep their own handler, tips/gift-cards
// are untouched.

import { createAdminSupabaseClient } from "@/lib/supabase";
import { DEFAULT_COMMISSION_RATE_PERCENT } from "@/lib/constants/billing";

/**
 * Resolve the platform commission percent the same way the booking branch does.
 * Package/retail PIs carry a real application_fee_amount; we derive the percent
 * from it where present (the truthful figure), else fall back to platform_settings.
 */
async function resolveCommissionPercent(
  admin: ReturnType<typeof createAdminSupabaseClient>,
  grossChf: number,
  applicationFeeRappen: number | null | undefined,
): Promise<number> {
  if (applicationFeeRappen && grossChf > 0) {
    const feeChf = applicationFeeRappen / 100;
    return Math.round((feeChf / grossChf) * 100 * 100) / 100;
  }
  const { data: commissionSetting } = await admin
    .from("platform_settings")
    .select("value")
    .eq("key", "commission")
    .single();
  return commissionSetting?.value?.rate_percent ?? DEFAULT_COMMISSION_RATE_PERCENT;
}

/** Write/refresh the salon_payouts ledger row for a settled purchase PI (CHF). */
async function writePurchasePayout(
  admin: ReturnType<typeof createAdminSupabaseClient>,
  pi: any,
  salonId: string,
): Promise<void> {
  const grossAmount = (pi.amount ?? 0) / 100; // Rappen → CHF
  if (grossAmount <= 0 || !salonId) return;
  const commissionPercent = await resolveCommissionPercent(admin, grossAmount, pi.application_fee_amount);
  const commissionAmount = Math.round(grossAmount * (commissionPercent / 100) * 100) / 100;
  const netAmount = Math.round((grossAmount - commissionAmount) * 100) / 100;
  await admin.from("salon_payouts").upsert(
    {
      booking_id: null, // purchases are not bookings.
      salon_id: salonId,
      stripe_payment_intent_id: pi.id,
      gross_amount: grossAmount,
      commission_percent: commissionPercent,
      commission_amount: commissionAmount,
      net_amount: netAmount,
      status: "recorded",
    },
    { onConflict: "stripe_payment_intent_id" },
  );
}

export async function handlePurchasePaid(pi: any): Promise<boolean> {
  const type = pi.metadata?.type;
  // Packages feature removed (owner, 2026-06-11) — only retail purchases remain refundable here.
  if (type !== "retail_purchase") {
    return false; // not a refundable purchase — fall through to other handlers.
  }

  const admin = createAdminSupabaseClient();
  const paidAmount = pi.amount ?? 0; // INTEGER Rappen, straight from Stripe.
  const salonId = pi.metadata?.salon_id ?? null;

  // VAT/MWST (per-salon, VAT-inclusive) — split the purchase's paid_amount into
  // net + VAT by subtraction from the selling salon's registration + rate.
  // GRACEFUL: if the salon vat columns aren't present yet (migration not applied)
  // the select errors → default to not-registered (no VAT), never crash.
  let vat = { netRappen: paidAmount, vatRappen: 0, ratePercent: 0 };
  if (salonId) {
    const { data: vatSalon } = await admin
      .from("salons")
      .select("vat_registered, vat_rate")
      .eq("id", salonId)
      .maybeSingle();
    const { computeVat } = await import("@/lib/vat");
    vat = computeVat(paidAmount, {
      registered: (vatSalon as any)?.vat_registered ?? false,
      ratePercent: (vatSalon as any)?.vat_rate ?? 8.1,
    });
  }

  try {
    {
      // retail_purchase: /api/salon/retail/purchase inserted a pending row keyed on
      // the PI. Flip to paid + set paid_amount. Advance-only via the status guard so
      // a re-delivery never overwrites a row a refund already moved past 'paid'.
      await admin
        .from("retail_purchases")
        .update({
          status: "paid",
          paid_amount: paidAmount,
          vat_amount: vat.vatRappen, // Rappen — VAT portion of paid_amount.
          net_amount: vat.netRappen, // Rappen — paid_amount − vat_amount.
          vat_rate: vat.ratePercent, // rate applied (0 if salon not registered).
        })
        .eq("stripe_payment_intent_id", pi.id)
        .eq("status", "pending");
    }

    if (salonId) {
      await writePurchasePayout(admin, pi, salonId);
    } else {
      console.error("[webhook/purchase] missing salon_id in metadata, skipping payout row:", {
        type,
        pi: pi.id,
      });
    }

    console.log(`[webhook/purchase] settled ${type} for PI ${pi.id} (${paidAmount} Rappen)`);
    return true; // handled — stop other handlers.
  } catch (error) {
    console.error("[webhook/purchase] error finalizing purchase:", error, { type, pi: pi.id });
    throw error; // re-throw so the webhook releases its claim and Stripe retries.
  }
}
