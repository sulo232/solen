// lib/bookings/notify-no-show-fee.ts
//
// N4: notify the CUSTOMER when a NO-SHOW fee is actually charged. A silent
// off-session / partial-capture debit is a chargeback magnet — the customer must
// be told a fee was taken. Shared by the two no-show charge call sites so the
// user-vs-guest send branch lives in ONE place (mirrors lib/bookings/notify-refund.ts):
//   - APPOINTMENT path: app/api/cron/no-show/route.ts (after chargeFee succeeds)
//   - WALK-IN path:     app/api/walkin/queue/[id]/route.ts (after a fee is captured)
//
// Unlike notify-refund (which keys off bookings.guest_email), the two no-show sources
// have DIFFERENT row shapes — appointments carry a guest_email, walk-in queue entries
// carry only customer_name + customer_phone (NO email column, migration 073/20260531).
// So this helper takes ALREADY-RESOLVED facts (userId + optional email + display
// strings) rather than a row + table name. Each call site resolves its own shape and
// hands the resolved inputs in. The branch this centralizes:
//   - userId present → in-app notification (notifications.user_id is NOT NULL) + email
//                       when an email is resolvable.
//   - userId null + email present → email only (guest with an email, e.g. appointment).
//   - userId null + no email → nothing to send. Walk-in phone-only guests fall here;
//                       SMS is a logged future epic (V3-D421), so we do NOT fabricate a
//                       channel — we no-op and the caller's .catch keeps the charge safe.
//
// Money is INTEGER Rappen end-to-end; callers pass feeCents (Rappen) and we format to
// CHF for the email var only. The caller wraps this in `.catch(...)` — a notification
// failure must NEVER block or roll back the charge (same discipline as the webhook).

import type { SupabaseClient } from "@supabase/supabase-js";
import type { EmailLocale } from "@/lib/email";
import { formatCurrency } from "@/lib/format-currency";
import { resolveSwissLocale } from "@/lib/format";

export interface NotifyNoShowFeeArgs {
  /** ADMIN (service-role) Supabase client — the same one the caller holds. */
  admin: SupabaseClient;
  kind?: "no_show" | "cancellation";
  /** Logged-in customer id, or null for a guest (no in-app row possible). */
  userId: string | null;
  /** Guest email when there is no userId (appointment guests). null for phone-only walk-ins. */
  guestEmail?: string | null;
  /** Service display name (already localized by the caller; falls back to "Service"). */
  serviceName: string;
  /** Salon display name (falls back to "Salon"). */
  salonName: string;
  /** The fee actually charged, in integer Rappen. */
  feeCents: number;
  /**
   * Appointment/visit date for the email body, as a raw Date or ISO string. Formatted
   * INSIDE this helper against the resolved customer locale (2026-07-26, de-CH literal
   * sweep: both call sites used to pre-format this with toLocaleDateString("de-CH") before
   * the locale below was even known, so the amount localized correctly but the date never
   * did).
   */
  date: Date | string;
  /** Caller tag for console.error context, e.g. "no-show" / "walkin/queue". */
  logPrefix: string;
}

/**
 * Send the `no_show_charge` notification to the customer of a charged no-show fee.
 * Never throws meaningfully past the caller's `.catch` — money has already moved.
 */
export async function notifyNoShowFee(args: NotifyNoShowFeeArgs): Promise<void> {
  const { admin, kind = "no_show", userId, guestEmail, serviceName, salonName, feeCents, date, logPrefix } = args;

  const { sendNotification } = await import("@/lib/notifications");

  if (userId) {
    // Logged-in customer → in-app notification + email (mirror notify-refund:60-85).
    const { data: profile, error: preferenceError } = await admin
      .from("profiles")
      .select("locale, notification_email")
      .eq("id", userId)
      .single();
    if (preferenceError) {
      console.error(`[${logPrefix}] fee receipt preference lookup failed:`, preferenceError);
    }
    const locale: EmailLocale = (profile?.locale as EmailLocale) ?? "de";
    const bcp47 = resolveSwissLocale(locale);
    const amountStr = formatCurrency(feeCents / 100, bcp47);
    const dateStr = new Date(date).toLocaleDateString(bcp47);

    const { data: authUser } = await admin.auth.admin.getUserById(userId);
    const email = authUser?.user?.email;

    const { noShowChargeEmail, lateCancellationFeeEmail } = await import("@/lib/email-templates/audit-notifications");
    const receipt = (kind === "cancellation" ? lateCancellationFeeEmail : noShowChargeEmail)(
      email ?? "", { service: serviceName, salonName, date: dateStr, feeAmount: amountStr }, locale,
    );
    await sendNotification({
      userId,
      type: kind === "cancellation" ? "late_cancellation_fee" : "no_show_charge",
      title: receipt.subject,
      body: amountStr,
      data: { feeCents, kind },
      emailParams: email && !preferenceError && profile && profile.notification_email !== false
        ? { to: email, locale, vars: { service: serviceName, salonName, date: dateStr, feeAmount: amountStr } }
        : undefined,
    });
    return;
  }

  // GUEST (no userId). notifications.user_id is NOT NULL REFERENCES auth.users, so a
  // guest gets NO in-app row — email only, and only if we have an address. Walk-in
  // phone-only guests have no email at all → nothing to send (SMS is a future epic).
  if (!guestEmail) {
    return;
  }
  const amountStr = formatCurrency(feeCents / 100, "de-CH"); // no guest profile → de fallback.
  const guestDateStr = new Date(date).toLocaleDateString("de-CH"); // no guest profile → de fallback.
  const { noShowChargeEmail, lateCancellationFeeEmail } = await import("@/lib/email-templates/audit-notifications");
  const { sendEmail } = await import("@/lib/email");
  try {
    await sendEmail(
      (kind === "cancellation" ? lateCancellationFeeEmail : noShowChargeEmail)(
        guestEmail,
        { service: serviceName, salonName, date: guestDateStr, feeAmount: amountStr },
        "de",
      ),
    );
  } catch (err) {
    console.error(`[${logPrefix}] no-show fee guest email failed:`, err);
  }
}
