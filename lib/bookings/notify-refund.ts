// lib/bookings/notify-refund.ts
//
// N1 (REFUND_APPEAL_PLAN Phase 1): notify the CUSTOMER when a refund is ISSUED.
// Shared by every refund call site (salon-approve, admin refund, admin_approve,
// salon manual refund) so the guest-vs-user guard + amount formatting live in ONE
// place. Mirrors the webhook's pattern exactly (app/api/stripe/webhook/route.ts):
//   - user_id present  → in-app notification + email (locale + email resolved via
//                         profiles.locale + auth.admin.getUserById, like the webhook)
//   - user_id null      → GUEST: email only to bookings.guest_email, no in-app row
//
// Money is INTEGER Rappen end-to-end; we format Rappen → CHF for the email var only.
// The caller wraps this in `.catch(...)` — a notification failure must NEVER roll
// back or block the money move (same discipline as the webhook).

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
 * Send the `refund_processed` notification to a booking's customer.
 *
 * @param admin       ADMIN (service-role) Supabase client (same one the caller holds).
 * @param bookingId   The booking that was refunded.
 * @param amountCents The refunded amount in integer Rappen (this refund's slice).
 * @param logPrefix   Caller tag for console.error context, e.g. "booking-disputes".
 */
export async function notifyRefundProcessed(
  admin: SupabaseClient,
  bookingId: string,
  amountCents: number,
  logPrefix: string,
): Promise<void> {
  // Pull the customer + the email display facts (service + salon name) the
  // refundProcessedEmail template needs. guest_email/user_id drive the guest-vs-user
  // branch below. services only carry de/en today; fr/it fall back to name_de.
  const { data: bk } = await admin
    .from("bookings")
    .select("user_id, guest_email, vat_rate, services(name_de, name_en), salons(name, vat_number)")
    .eq("id", bookingId)
    .maybeSingle();

  const booking = bk as Record<string, any> | null;
  if (!booking) {
    console.error(`[${logPrefix}] refund notification: booking ${bookingId} not found`);
    return;
  }

  const salonName = (booking.salons as { name?: string } | null)?.name ?? "Salon";
  const services = booking.services as Record<string, string | null> | null;

  // Swiss VAT credit-note split of THIS refund slice (VAT-inclusive). Only when the booking
  // carried VAT at payment (registered salon, vat_rate > 0). Mirrors variant 3 of the receipt
  // mockup; vatVars(bcp47) is spread into the email vars per locale (empty ⇒ no breakdown).
  const vatRate = Number((booking.vat_rate as number | null) ?? 0);
  const vatNumber = (booking.salons as { vat_number?: string } | null)?.vat_number ?? undefined;
  const { computeVat } = await import("@/lib/vat");
  const vb = vatRate > 0 ? computeVat(amountCents, { registered: true, ratePercent: vatRate }) : null;
  const rateStr = vatRate % 1 === 0 ? String(vatRate) : vatRate.toFixed(1);
  const vatVars = (bcp47: string) =>
    vb
      ? { net: formatCurrency(vb.netRappen / 100, bcp47), vat: formatCurrency(vb.vatRappen / 100, bcp47), rate: rateStr, vatNumber }
      : {};

  const { sendNotification } = await import("@/lib/notifications");

  if (booking.user_id) {
    // Logged-in customer → in-app notification + email (mirror webhook:159-188).
    const { data: profile } = await admin
      .from("profiles")
      .select("locale")
      .eq("id", booking.user_id)
      .single();
    const locale: EmailLocale = (profile?.locale as EmailLocale) ?? "de";
    const serviceName =
      services?.[`name_${locale}`] ?? services?.name_de ?? "Service";
    const amountStr = formatCurrency(amountCents / 100, LOCALE_BCP47[locale] ?? "de-CH");

    const { data: authUser } = await admin.auth.admin.getUserById(booking.user_id);
    const email = authUser?.user?.email;

    await sendNotification({
      userId: booking.user_id,
      type: "refund_processed",
      title: "Rückerstattung verarbeitet",
      body: `Eine Rückerstattung in Höhe von ${amountStr} für deine Buchung wurde verarbeitet.`,
      data: { bookingId, amount: amountCents },
      emailParams: email
        ? { to: email, locale, vars: { service: serviceName, salonName, amount: amountStr, ...vatVars(LOCALE_BCP47[locale] ?? "de-CH") } }
        : undefined,
    });
    return;
  }

  // GUEST (user_id null) → EMAIL ONLY, no in-app notification. notifications.user_id is
  // NOT NULL REFERENCES auth.users (migration 075), so a guest can't get an in-app row;
  // sendNotification would always insert + log a FK error. So we call the refund template
  // + sendEmail directly here (mirrors how the webhook keeps guests off the user-keyed path).
  const guestEmail = booking.guest_email as string | null;
  if (!guestEmail) {
    // Nothing to notify (e.g. a free/back-office booking with no contact); not an error.
    return;
  }
  const serviceName = services?.name_de ?? "Service"; // no guest profile → de fallback.
  const amountStr = formatCurrency(amountCents / 100, "de-CH");

  const { refundProcessedEmail } = await import("@/lib/email-templates/audit-notifications");
  const { sendEmail } = await import("@/lib/email");
  await sendEmail(
    refundProcessedEmail(guestEmail, { service: serviceName, salonName, amount: amountStr, ...vatVars("de-CH") }, "de"),
  );
}
