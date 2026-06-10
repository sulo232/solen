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
import { sendEmail } from "@/lib/email";

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
      .select("code, original_amount, recipient_email, recipient_name, message, expires_at, salons(name)")
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
        await sendEmail({
          to: recipientEmail,
          subject: `Du hast eine Geschenkkarte von ${salonName} erhalten!`,
          html: `<div style="font-family:sans-serif;max-width:400px;margin:0 auto;text-align:center">
<h2 style="color:#C05038">Geschenkkarte</h2>
<p>Hallo ${(card as any).recipient_name},</p>
<p>Du hast eine Geschenkkarte für <strong>${salonName}</strong> erhalten!</p>
<div style="background:#FAF6EF;border-radius:12px;padding:20px;margin:16px 0">
<p style="font-size:24px;font-weight:bold;color:#C05038;margin:0">CHF ${(((card as any).original_amount ?? 0) / 100).toFixed(2)}</p>
<p style="font-size:14px;color:#999;margin:4px 0 0">Code: <strong>${(card as any).code}</strong></p>
</div>
${(card as any).message ? `<p style="color:#666;font-style:italic">"${(card as any).message}"</p>` : ""}
<p><a href="https://www.solen.ch" style="display:inline-block;padding:12px 24px;background:#C05038;color:#fff;border-radius:8px;text-decoration:none">Jetzt einlösen →</a></p>
<p style="font-size:11px;color:#999">Gültig bis ${new Date((card as any).expires_at).toLocaleDateString("de-CH")}</p>
</div>`,
        });
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
