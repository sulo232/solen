// lib/purchases/notify-purchase-refund.ts
//
// Notify the CUSTOMER when a PACKAGE or RETAIL refund is issued. Sibling of
// lib/bookings/notify-refund.ts — reuses the SAME `refund_processed`
// notification type + refundProcessedEmail template + locale resolution
// (profiles.locale + auth.admin.getUserById), differing only in where the buyer
// + display label come from.
//
// Unlike bookings there is no guest path here: /api/packages/purchase and
// /api/salon/retail/purchase both require an authenticated user, so a purchase
// always has a real user_id (in-app notification + email). If user_id is ever
// null (e.g. the buyer's account was later deleted → user_id set null), we skip
// silently — notifications.user_id is NOT NULL REFERENCES auth.users.
//
// Money is INTEGER Rappen end-to-end; we format Rappen → CHF for the email var
// only. The caller wraps this in `.catch(...)` — a notification failure must
// NEVER roll back or block the money move (same discipline as the webhook).

import type { SupabaseClient } from "@supabase/supabase-js";
import type { EmailLocale } from "@/lib/email";
import { formatCurrency } from "@/lib/format-currency";

const LOCALE_BCP47: Record<EmailLocale, string> = {
  de: "de-CH",
  en: "en-CH",
  fr: "fr-CH",
  it: "it-CH",
};

/**
 * Send the `refund_processed` notification to a purchase's buyer.
 *
 * @param admin       ADMIN (service-role) Supabase client (same one the caller holds).
 * @param params.userId      Buyer (resolved by the refund helper); null → skip.
 * @param params.salonId     Salon the purchase was at (for the display name).
 * @param params.amountCents This refund's slice, integer Rappen.
 * @param params.itemLabel   What was refunded ("Paket" / "Produkt") for the email body.
 * @param logPrefix   Caller tag for console.error context, e.g. "package-refund".
 */
export async function notifyPurchaseRefundProcessed(
  admin: SupabaseClient,
  params: { userId: string | null; salonId: string | null; amountCents: number; itemLabel: string },
  logPrefix: string,
): Promise<void> {
  const { userId, salonId, amountCents, itemLabel } = params;
  if (!userId) {
    // No buyer to notify (account deleted / back-office purchase); not an error.
    return;
  }

  // Salon display name (best-effort).
  let salonName = "Salon";
  if (salonId) {
    const { data: salon } = await admin.from("salons").select("name").eq("id", salonId).maybeSingle();
    salonName = (salon?.name as string | null) ?? "Salon";
  }

  const { data: profile } = await admin.from("profiles").select("locale").eq("id", userId).single();
  const locale: EmailLocale = (profile?.locale as EmailLocale) ?? "de";
  const amountStr = formatCurrency(amountCents / 100, LOCALE_BCP47[locale] ?? "de-CH");

  const { data: authUser } = await admin.auth.admin.getUserById(userId);
  const email = authUser?.user?.email;

  const { sendNotification } = await import("@/lib/notifications");
  await sendNotification({
    userId,
    type: "refund_processed",
    title: "Rückerstattung verarbeitet",
    body: `Eine Rückerstattung in Höhe von ${amountStr} wurde verarbeitet.`,
    data: { amount: amountCents, salonId },
    // refundProcessedEmail expects { service, salonName, amount }; we pass the
    // purchase item label as `service` (the template renders it as the line item).
    emailParams: email
      ? { to: email, locale, vars: { service: itemLabel, salonName, amount: amountStr } }
      : undefined,
  });
}
