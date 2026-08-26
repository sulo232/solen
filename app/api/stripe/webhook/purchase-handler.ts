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
import { alertAdmin } from "@/lib/alert-admin";
import { issuePurchaseRefund, PurchaseRefundError } from "@/lib/purchases/issue-purchase-refund";

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
  const commissionSettingValue = commissionSetting?.value as { rate_percent?: number } | null;
  return commissionSettingValue?.rate_percent ?? DEFAULT_COMMISSION_RATE_PERCENT;
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
  const { error: payoutUpsertError } = await admin.from("salon_payouts").upsert(
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
  if (payoutUpsertError) {
    console.error("[purchase-handler] salon_payouts upsert failed:", payoutUpsertError.message, { pi: pi.id, salon_id: salonId });
    // Never throw here: the payment already succeeded on Stripe, and this function's
    // caller must still let the webhook return 200 so Stripe does not retry forever.
    // The missing ledger row is surfaced via the alert instead.
    void alertAdmin("salon_payouts upsert failed (purchase)", {
      pi: pi.id,
      salon_id: salonId,
      error: payoutUpsertError.message,
    });
  }
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
      // .select() returns the row(s) that ACTUALLY transitioned, so a webhook retry
      // (row already 'paid') matches 0 rows and the stock decrement below is skipped
      // (idempotent: stock is decremented exactly once, on the real pending->paid flip).
      const { data: settled } = await admin
        .from("retail_purchases")
        .update({
          status: "paid",
          paid_amount: paidAmount,
          vat_amount: vat.vatRappen, // Rappen , VAT portion of paid_amount.
          net_amount: vat.netRappen, // Rappen , paid_amount minus vat_amount.
          vat_rate: vat.ratePercent, // rate applied (0 if salon not registered).
        })
        .eq("stripe_payment_intent_id", pi.id)
        .eq("status", "pending")
        .select("id, product_ids");

      // A-5 stock: decrement each purchased SKU by 1 ONLY when this call performed the
      // pending->paid transition. Atomic + guarded in the DB (decrement_retail_stock:
      // SET stock_count = stock_count - 1 WHERE id=? AND stock_count IS NOT NULL AND
      // stock_count >= 1). An out-of-stock / untracked SKU returns no row , log it, alert,
      // and automatically refund the purchase so the customer is not charged for stock
      // that no longer exists (money paths in this file must never silently keep the
      // charge). The settle itself is still NEVER failed (payment already succeeded).
      const settledRow = settled?.[0] as { id: string; product_ids: string[] | null } | undefined;
      if (settledRow?.product_ids?.length) {
        let stockRefundIssued = false; // one full refund per purchase, even if several SKUs are out of stock.
        for (const productId of settledRow.product_ids) {
          const { data: decremented, error: decErr } = await admin.rpc(
            "decrement_retail_stock",
            { p_product_id: productId },
          );
          if (decErr) {
            console.error("[purchase-handler] stock decrement RPC failed:", decErr, {
              pi: pi.id,
              product_id: productId,
            });
          } else if (!decremented) {
            console.error("[purchase-handler] stock not decremented (out of stock or untracked):", {
              pi: pi.id,
              product_id: productId,
            });
            void alertAdmin("Retail purchase stock unavailable after payment succeeded", {
              pi: pi.id,
              retail_purchase_id: settledRow.id,
              product_id: productId,
              paid_amount: paidAmount,
            });
            if (!stockRefundIssued) {
              stockRefundIssued = true;
              try {
                await issuePurchaseRefund({
                  db: admin,
                  source: "retail",
                  id: settledRow.id,
                  amountCents: paidAmount,
                  actor: "system",
                  reason: `stock unavailable for product ${productId} after payment succeeded`,
                });
                // observability-3: this is an AUTOMATIC money-movement (no human review,
                // the webhook decided the refund), so write the audit_log row here since
                // there is no human "caller" upstream to own it. actor_id null (mirrors
                // the chargeback_opened/closed inserts in webhook/route.ts: "not a human,
                // opened this"). Best-effort: a failed audit write must never undo or
                // re-throw past a refund that already succeeded on Stripe.
                const { error: auditErr } = await admin.from("audit_log").insert({
                  actor_id: null,
                  action: "purchase_refunded_stock_unavailable",
                  target_type: "retail_purchase",
                  target_id: settledRow.id,
                  metadata: {
                    pi: pi.id,
                    product_id: productId,
                    amount_cents: paidAmount,
                    reason: `stock unavailable for product ${productId} after payment succeeded`,
                  },
                });
                if (auditErr) {
                  console.error("[purchase-handler] audit_log write failed after stock-failure refund:", auditErr.message, { retail_purchase_id: settledRow.id });
                }
              } catch (refundErr) {
                if (refundErr instanceof PurchaseRefundError) {
                  console.error(
                    `[purchase-handler] automatic stock-failure refund failed for retail purchase ${settledRow.id} (${refundErr.code}):`,
                    refundErr.message,
                  );
                } else {
                  console.error(
                    `[purchase-handler] automatic stock-failure refund threw for retail purchase ${settledRow.id}:`,
                    refundErr,
                  );
                }
                void alertAdmin("Automatic purchase refund after stock failure failed", {
                  pi: pi.id,
                  retail_purchase_id: settledRow.id,
                  product_id: productId,
                  error: refundErr instanceof Error ? refundErr.message : String(refundErr),
                });
              }
            }
            // The whole purchase has been (or was already) refunded for this out-of-stock
            // event; stop decrementing the remaining SKUs so we do not reduce stock for
            // items the now-refunded customer will not receive.
            break;
          }
        }
      }
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
