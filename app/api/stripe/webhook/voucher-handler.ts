/**
 * Voucher Purchase Webhook Handler
 *
 * This code should be integrated into app/api/stripe/webhook/route.ts
 * in the payment_intent.succeeded case, BEFORE the booking payment handling.
 *
 * Integration point: Line 42, right after `const pi = event.data.object;`
 */

import type { NextRequest, NextResponse } from "next/server";
import type { EmailLocale } from "@/lib/email";
import { createAdminSupabaseClient } from "@/lib/supabase";

export async function handleVoucherPurchase(pi: any): Promise<boolean> {
  // Check if this is a voucher purchase
  if (pi.metadata?.type !== "voucher_purchase") {
    return false; // Not a voucher purchase, continue to booking handler
  }

  const admin = createAdminSupabaseClient();
  const promoCodeId = pi.metadata.promo_code_id;
  const customerId = pi.metadata.customer_id;
  const recipientEmail = pi.metadata.recipient_email;
  const voucherCode = pi.metadata.voucher_code;
  const isGift = pi.metadata.is_gift === "true";

  if (!promoCodeId || !customerId) {
    console.error("[webhook/voucher] Missing required metadata");
    return true; // Stop processing, but don't fail webhook
  }

  try {
    // Activate the voucher (P0 fix, 2026-07-10): promo_codes is inserted is_active:false
    // at mint time (app/api/vouchers/create), so the code is inert until this handler runs,
    // which only fires on the VERIFIED payment_intent.succeeded event (the caller in
    // app/api/stripe/webhook/route.ts), i.e. only after the PI is confirmed paid. Advance-only
    // CAS (is_active false -> true): the returned row is non-null ONLY on the transition, so a
    // Stripe re-delivery of the same event (or any retry) is a safe no-op, it neither
    // re-activates an already-active code nor re-inserts voucher_purchases / re-sends the email
    // below. Mirrors gift-card-handler.ts's is_active activation.
    const { data: activated } = await admin
      .from("promo_codes")
      .update({ is_active: true })
      .eq("id", promoCodeId)
      .eq("is_active", false)
      .select("id")
      .maybeSingle();

    if (!activated) {
      // Already activated (re-delivery), still a voucher-purchase PI, so we own it (stop
      // other handlers), but skip the rest so a retry never double-inserts voucher_purchases
      // or re-sends the voucher-code email.
      console.log(`[webhook/voucher] voucher ${voucherCode} already activated, skipping re-processing for PI ${pi.id}`);
      return true;
    }

    // Create voucher_purchases record
    await admin.from("voucher_purchases").insert({
      customer_id: customerId,
      promo_code_id: promoCodeId,
      amount_paid: (pi.amount ?? 0) / 100,
      stripe_payment_intent_id: pi.id,
      recipient_email: recipientEmail || null,
      is_gift: isGift,
    });

    // Send email with voucher code
    const { sendNotification } = await import("@/lib/notifications");
    const { data: profile } = await admin
      .from("profiles")
      .select("locale")
      .eq("id", customerId)
      .single();
    const locale: EmailLocale = (profile?.locale as EmailLocale) ?? "de";
    const { data: authUser } = await admin.auth.admin.getUserById(customerId);
    const email = recipientEmail || authUser?.user?.email;

    if (email) {
      const emailVars = {
        code: voucherCode,
        amount: ((pi.amount ?? 0) / 100).toFixed(2),
        isGift: isGift.toString(),
      };

      await sendNotification({
        userId: customerId,
        type: "voucher_purchased",
        title: isGift ? "Gutschein versendet" : "Gutschein gekauft",
        body: `Dein Gutschein-Code: ${voucherCode}`,
        data: { voucherCode, promoCodeId },
        emailParams: {
          to: email,
          locale,
          vars: emailVars,
        },
      }).catch((err) =>
        console.error("[webhook/voucher] Failed to send email:", err)
      );
    }

    console.log(`[webhook/voucher] Successfully processed voucher purchase: ${voucherCode}`);
    return true; // Successfully handled, stop processing other handlers
  } catch (error) {
    console.error("[webhook/voucher] Error processing voucher purchase:", error);
    throw error; // Re-throw so Stripe receives a non-200 and retries the event
  }
}

/**
 * INTEGRATION INSTRUCTIONS:
 *
 * In app/api/stripe/webhook/route.ts, modify the payment_intent.succeeded case as follows:
 *
 * ```typescript
 * case "payment_intent.succeeded": {
 *   const pi = event.data.object;
 *
 *   // Handle voucher purchases (ADD THIS)
 *   const { handleVoucherPurchase } = await import("./voucher-handler");
 *   const wasVoucherPurchase = await handleVoucherPurchase(pi);
 *   if (wasVoucherPurchase) break; // Skip booking handler if voucher
 *
 *   // Handle booking payments (EXISTING CODE BELOW)
 *   const bookingId = pi.metadata?.booking_id;
 *   if (bookingId) {
 *     // ... rest of existing booking logic
 *   }
 *   break;
 * }
 * ```
 */
