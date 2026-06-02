// lib/bookings/notify-upcharge.ts
//
// N2 (REFUND_APPEAL_PLAN Phase 1): notify the CUSTOMER when their saved card IS
// charged for an approved salon upcharge (booking_disputes direction='upcharge'
// reaches status 'charged'). Without this the off-session debit is silent — a
// chargeback magnet. Sibling of notify-refund.ts; same guest-vs-user guard.
//
//   - user_id present → in-app notification (locale resolved via profiles.locale)
//   - user_id null     → GUEST: nothing here (notifications.user_id is NOT NULL
//                         REFERENCES auth.users — a guest can't get an in-app row;
//                         sendNotification would insert + log an FK error)
//
// EMAIL: deliberately NOT sent. There is NO `upcharge_charged` email template in
// lib/email-templates yet, and inventing copy is out of scope. This helper wires
// the IN-APP notification only; the email leg is flagged as missing (see the
// task report). When a template lands, add an `emailParams` block here mirroring
// notify-refund.ts + a `case 'upcharge_charged'` in lib/notifications.ts.
//
// Money is INTEGER Rappen end-to-end; we format Rappen → CHF for the body var only.
// The caller wraps this in `.catch(...)` — a notification failure must NEVER roll
// back or block the money move (same discipline as the webhook / notify-refund).

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
 * Send the `upcharge_charged` IN-APP notification to a booking's customer.
 *
 * @param admin       ADMIN (service-role) Supabase client (same one the caller holds).
 * @param bookingId   The booking whose saved card was charged.
 * @param amountCents The charged upcharge difference in integer Rappen.
 * @param logPrefix   Caller tag for console.error context, e.g. "booking-disputes".
 */
export async function notifyUpchargeCharged(
  admin: SupabaseClient,
  bookingId: string,
  amountCents: number,
  logPrefix: string,
): Promise<void> {
  // Pull the customer + display facts (service + salon name) for the body. user_id
  // drives the guest-vs-user branch; services only carry de/en today so fr/it fall
  // back to name_de (same as notify-refund).
  const { data: bk } = await admin
    .from("bookings")
    .select("user_id, services(name_de, name_en), salons(name)")
    .eq("id", bookingId)
    .maybeSingle();

  const booking = bk as Record<string, any> | null;
  if (!booking) {
    console.error(`[${logPrefix}] upcharge notification: booking ${bookingId} not found`);
    return;
  }

  // GUEST (user_id null): no in-app row possible (FK) and no email template — nothing to do.
  if (!booking.user_id) return;

  const salonName = (booking.salons as { name?: string } | null)?.name ?? "Salon";
  const services = booking.services as Record<string, string | null> | null;

  const { data: profile } = await admin
    .from("profiles")
    .select("locale")
    .eq("id", booking.user_id)
    .single();
  const locale: EmailLocale = (profile?.locale as EmailLocale) ?? "de";
  const serviceName = services?.[`name_${locale}`] ?? services?.name_de ?? "Service";
  const amountStr = formatCurrency(amountCents / 100, LOCALE_BCP47[locale] ?? "de-CH");

  const { sendNotification } = await import("@/lib/notifications");

  // In-app only (no emailParams → sendNotification skips the email switch entirely).
  await sendNotification({
    userId: booking.user_id,
    type: "upcharge_charged",
    title: "Aufpreis berechnet",
    body: `Der von dir genehmigte Aufpreis von ${amountStr} für deine Buchung (${serviceName}) bei ${salonName} wurde deiner Karte belastet.`,
    data: { bookingId, amount: amountCents },
  });
}
