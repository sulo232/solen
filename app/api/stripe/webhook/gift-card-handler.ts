/**
 * Gift-card Purchase Webhook Handler
 *
 * Finalizes a GIFT-CARD purchase on payment_intent.succeeded. Mirrors
 * voucher-handler.ts (an early-return guard called from the webhook's succeeded
 * case): returns true if it handled the PI (stop other handlers), false to fall
 * through.
 *
 * Why this exists (P0 fix, 2026-06-10): /api/gift-cards/purchase used to
 *   (a) email the recipient the redeemable code at PaymentIntent *creation* — so
 *       an abandoned checkout still delivered a code for a card that was never paid,
 *       and
 *   (b) rely on "the webhook" to activate the card (is_active:true) — but no
 *       gift-card branch existed in the webhook, so paid cards were NEVER activated.
 * Both are fixed here: activation + the recipient email now happen together, only
 * on real payment success. The card row is inserted is_active:false at purchase and
 * flipped here.
 *
 * Idempotent: the activation is gated on is_active=false in the WHERE clause and
 * returns the flipped row, so a Stripe re-delivery flips nothing and re-emails no one.
 */

import { createAdminSupabaseClient } from "@/lib/supabase";
import { sendEmail, giftCardDeliveryEmail, type EmailLocale } from "@/lib/email";

export async function handleGiftCardPurchase(pi: any): Promise<boolean> {
  if (pi.metadata?.type !== "gift_card") {
    return false; // not a gift-card purchase — fall through to the next handler.
  }

  const admin = createAdminSupabaseClient();

  try {
    // Activate the card — advance-only (is_active false → true). The returned row is
    // non-null ONLY on the transition, so the email below fires exactly once even if
    // Stripe re-delivers the event.
    const { data: card } = await admin
      .from("gift_cards")
      .update({ is_active: true })
      .eq("stripe_payment_intent_id", pi.id)
      .eq("is_active", false)
      .select("code, original_amount, recipient_email, recipient_name, message, expires_at, purchaser_user_id, salons(name)")
      .maybeSingle();

    if (!card) {
      // Already activated (re-delivery) or no matching row — nothing to do, but this
      // IS a gift-card PI so we still own it (stop other handlers).
      return true;
    }

    const salonName = (card as any).salons?.name ?? "Solen";
    const recipientEmail = (card as any).recipient_email as string | null;

    if (recipientEmail) {
      try {
        // A9-email-locale (2026-07-27): the recipient has no profile of their own (a gift
        // card can go to a non-Solen email address); the purchaser's own profile.locale is
        // the best-available signal in scope. Was hardcoded German + de-CH regardless of
        // either party, and inline HTML with no locale mechanism at all. Routed through the
        // existing giftCardDeliveryEmail builder (already locale-aware) instead of duplicating it.
        const purchaserId = (card as any).purchaser_user_id as string | null;
        const { data: purchaserProfile } = purchaserId
          ? await admin.from("profiles").select("locale").eq("id", purchaserId).maybeSingle()
          : { data: null };
        const cardLocale = (purchaserProfile?.locale as EmailLocale) ?? "de";
        await sendEmail(giftCardDeliveryEmail(
          recipientEmail,
          {
            recipientName: (card as any).recipient_name ?? "",
            senderName: salonName,
            amount: `CHF ${(((card as any).original_amount ?? 0) / 100).toFixed(2)}`,
            code: (card as any).code,
            message: (card as any).message ?? undefined,
          },
          cardLocale
        ));
      } catch (err) {
        // Email is non-fatal — the card is already activated; don't fail the webhook
        // (a re-delivery wouldn't re-send anyway, since the row is now active).
        console.error("[webhook/gift-card] recipient email failed (card activated):", err);
      }
    }

    console.log(`[webhook/gift-card] activated gift card for PI ${pi.id}`);
    return true; // handled — stop other handlers.
  } catch (error) {
    console.error("[webhook/gift-card] error finalizing gift-card purchase:", error, { pi: pi.id });
    throw error; // re-throw so the webhook releases its claim and Stripe retries.
  }
}
