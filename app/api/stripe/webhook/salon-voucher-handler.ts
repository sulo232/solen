/**
 * Salon gift-voucher Webhook Handler  (PI metadata.type === "voucher")
 *
 * Distinct from voucher-handler.ts (type:"voucher_purchase" = discount/promo vouchers
 * from /api/vouchers/create). This finalizes a SALON GIFT voucher bought via
 * /api/vouchers (the vouchers table): the row is inserted with remaining_amount NULL
 * and only becomes usable once remaining_amount is set to the face amount.
 *
 * Why this exists (P0 fix, 2026-06-10): the only finalizer used to be a client-side
 * POST /api/vouchers/confirm fired from an onSuccess callback that never ran (the
 * Elements confirm lacked redirect:"if_required"). So paid gift vouchers were created
 * but never made usable, and the recipient email was a never-built TODO. Finalizing in
 * the webhook makes it reliable regardless of 3DS/redirect/tab-close — Stripe fires
 * payment_intent.succeeded on every successful charge.
 *
 * Early-return guard (returns true if handled, false to fall through), like the
 * voucher/purchase/gift-card handlers. Idempotent: the finalize is gated on
 * remaining_amount IS NULL, so a re-delivery flips nothing and re-emails no one.
 */

import { createAdminSupabaseClient } from "@/lib/supabase";
import { sendEmail } from "@/lib/email";

export async function handleSalonVoucherPaid(pi: any): Promise<boolean> {
  if (pi.metadata?.type !== "voucher") {
    return false; // not a salon gift voucher — fall through.
  }

  const admin = createAdminSupabaseClient();

  try {
    const { data: voucher } = await admin
      .from("vouchers")
      .select("id, amount, code, recipient_email, recipient_name, message, expires_at, remaining_amount, salons(name_de)")
      .eq("stripe_payment_intent_id", pi.id)
      .maybeSingle();

    // No matching row (shouldn't happen — /api/vouchers inserts before charge), but we
    // still own this PI type, so stop the chain.
    if (!voucher) {
      console.error("[webhook/salon-voucher] no voucher row for PI", pi.id);
      return true;
    }

    // Idempotent finalize: set remaining_amount = face amount (CHF) if still unset. The
    // client-side confirm POST (vouchers/page.tsx, non-3DS path) may have set it FIRST —
    // that's fine, this simply no-ops then.
    //
    // The recipient email below is deliberately NOT gated on whether this write flipped.
    // The outer processed_webhook_events claim (route.ts) already guarantees this handler
    // runs exactly once per event — a Stripe re-delivery short-circuits before reaching
    // here — so the email cannot double-send. Gating it on the CAS dropped the email
    // whenever the client confirm won the race (the common non-3DS case): money taken,
    // voucher valid, recipient never notified.
    await admin
      .from("vouchers")
      .update({ remaining_amount: (voucher as any).amount })
      .eq("id", (voucher as any).id)
      .is("remaining_amount", null);

    const salonName = (voucher as any).salons?.name_de ?? "Solen";
    const recipientEmail = (voucher as any).recipient_email as string | null;
    const amountChf = Number((voucher as any).amount ?? 0); // vouchers.amount is CHF, not Rappen.

    if (recipientEmail) {
      try {
        await sendEmail({
          to: recipientEmail,
          subject: `Du hast einen Gutschein von ${salonName} erhalten!`,
          html: `<div style="font-family:sans-serif;max-width:400px;margin:0 auto;text-align:center">
<h2 style="color:#0A0A0A">Gutschein</h2>
<p>Hallo ${(voucher as any).recipient_name ?? ""},</p>
<p>Du hast einen Gutschein für <strong>${salonName}</strong> erhalten!</p>
<div style="background:#F4F4F5;border-radius:12px;padding:20px;margin:16px 0">
<p style="font-size:24px;font-weight:bold;color:#0A0A0A;margin:0">CHF ${amountChf.toFixed(2)}</p>
<p style="font-size:14px;color:#999;margin:4px 0 0">Code: <strong>${(voucher as any).code}</strong></p>
</div>
${(voucher as any).message ? `<p style="color:#666;font-style:italic">"${(voucher as any).message}"</p>` : ""}
<p><a href="https://www.solen.ch" style="display:inline-block;padding:12px 24px;background:#0A0A0A;color:#fff;border-radius:8px;text-decoration:none">Jetzt einlösen →</a></p>
<p style="font-size:11px;color:#999">Gültig bis ${new Date((voucher as any).expires_at).toLocaleDateString("de-CH")}</p>
</div>`,
        });
      } catch (err) {
        // Non-fatal: the voucher is already usable; don't fail the webhook (a re-delivery
        // won't re-send anyway, since remaining_amount is now set).
        console.error("[webhook/salon-voucher] recipient email failed (voucher finalized):", err);
      }
    }

    console.log(`[webhook/salon-voucher] finalized voucher for PI ${pi.id}`);
    return true;
  } catch (error) {
    console.error("[webhook/salon-voucher] error finalizing voucher purchase:", error, { pi: pi.id });
    throw error; // re-throw so the webhook releases its claim and Stripe retries.
  }
}
