// lib/bookings/notify-upcharge.ts
//
// N2 (REFUND_APPEAL_PLAN Phase 1): notify the CUSTOMER when their saved card IS
// charged for an approved salon upcharge (booking_disputes direction='upcharge'
// reaches status 'charged'). Without this the off-session debit is silent — a
// chargeback magnet. Sibling of notify-refund.ts; same guest-vs-user guard.
//
//   - user_id present  → in-app notification + email (locale + email resolved via
//                         profiles.locale + auth.admin.getUserById, like notify-refund)
//   - user_id null      → GUEST: email only to bookings.guest_email, no in-app row
//                         (notifications.user_id is NOT NULL REFERENCES auth.users —
//                         a guest can't get an in-app row; sendNotification would
//                         insert + log an FK error)
//
// EMAIL: via the `upchargeChargedEmail` template (lib/email-templates/audit-notifications.ts)
// + a `case 'upcharge_charged'` in lib/notifications.ts, mirroring notify-refund's receipt.
//
// Money is INTEGER Rappen end-to-end; we format Rappen → CHF for the body/email var only.
// The caller wraps this in `.catch(...)` — a notification failure must NEVER roll
// back or block the money move (same discipline as the webhook / notify-refund).

import type { SupabaseClient } from "@supabase/supabase-js";
import type { EmailLocale } from "@/lib/email";
import { formatCurrency } from "@/lib/format-currency";
import { resolveSwissLocale } from "@/lib/format";
import { locales } from "@/lib/locale-constants";

/**
 * Send the `upcharge_charged` notification (in-app + email) to a booking's customer.
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
    .select("user_id, guest_email, services(name_de, name_en), salons(name)")
    .eq("id", bookingId)
    .maybeSingle();

  const booking = bk as Record<string, any> | null;
  if (!booking) {
    console.error(`[${logPrefix}] upcharge notification: booking ${bookingId} not found`);
    return;
  }

  const salonName = (booking.salons as { name?: string } | null)?.name ?? "Salon";
  const services = booking.services as Record<string, string | null> | null;

  const { sendNotification } = await import("@/lib/notifications");

  if (booking.user_id) {
    // Logged-in customer → in-app notification + email (mirror notify-refund.ts).
    const { data: profile } = await admin
      .from("profiles")
      .select("locale")
      .eq("id", booking.user_id)
      .single();
    // Runtime whitelist against the real locale list (security review, 2026-09-04): a bare
    // `as EmailLocale` cast trusted profiles.locale unchecked before splicing it into an
    // email href downstream. A value not in `locales` falls back to "de".
    const locale: EmailLocale = (locales as readonly string[]).includes(profile?.locale ?? "")
      ? (profile!.locale as EmailLocale)
      : "de";
    const serviceName = services?.[`name_${locale}`] ?? services?.name_de ?? "Service";
    const amountStr = formatCurrency(amountCents / 100, resolveSwissLocale(locale));

    const { data: authUser } = await admin.auth.admin.getUserById(booking.user_id);
    const email = authUser?.user?.email;

    await sendNotification({
      userId: booking.user_id,
      type: "upcharge_charged",
      title: "Aufpreis berechnet",
      body: `Der von dir genehmigte Aufpreis von ${amountStr} für deine Buchung (${serviceName}) bei ${salonName} wurde deiner Karte belastet.`,
      data: { bookingId, amount: amountCents },
      emailParams: email
        ? { to: email, locale, vars: { service: serviceName, salonName, amount: amountStr } }
        : undefined,
    });
    return;
  }

  // GUEST (user_id null) → EMAIL ONLY, no in-app notification. notifications.user_id is
  // NOT NULL REFERENCES auth.users (migration 075), so a guest can't get an in-app row;
  // sendNotification would always insert + log an FK error. So we call the upcharge template
  // + sendEmail directly here (mirrors notify-refund.ts's guest branch).
  const guestEmail = booking.guest_email as string | null;
  if (!guestEmail) {
    // Nothing to notify (e.g. a free/back-office booking with no contact); not an error.
    return;
  }
  const serviceName = services?.name_de ?? "Service"; // no guest profile → de fallback.
  const amountStr = formatCurrency(amountCents / 100, "de-CH");

  const { upchargeChargedEmail } = await import("@/lib/email-templates/audit-notifications");
  const { sendEmail } = await import("@/lib/email");
  await sendEmail(
    upchargeChargedEmail(guestEmail, { service: serviceName, salonName, amount: amountStr }, "de"),
  );
}
