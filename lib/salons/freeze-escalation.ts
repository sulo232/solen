// lib/salons/freeze-escalation.ts
//
// Ported from the retired Supabase Edge Function `salon-verification`. Last live source
// read end to end at git sha bd67f9e43, path supabase/functions/salon-verification/index.ts
// (added 386361a45, deleted in the dead-code sweep 71d1c2522). That function ran monthly,
// escalated up to 3 warning emails to a salon owner whose `last_verified_at` was 6+ months
// old, and on the 4th check froze the salon: is_active=false, cancelled every future
// confirmed booking, freed the slot, and emailed both the owner and each affected customer.
//
// Escalation ladder (unchanged from the retired function): warnings 0 -> send the first
// request and set 1; 1 -> 2 and 2 -> 3 each gated on `last_verified_at` still being 2+ weeks
// old (the retired function's own gate, checked against the ORIGINAL verification date, not
// the last warning sent, reproduced as-is); warnings >= 3 (same gate) -> freeze.
//
// Every column this reads/writes (salons.verification_warnings, salons.last_verified_at,
// salons.is_active, salons.owner_id, salons.name, salons.frozen_at, salons.frozen_reason,
// bookings.user_id/starts_at/service_id/cancellation_reason/cancelled_at, profiles.email,
// profiles.locale) is confirmed present in the live column snapshot,
// _inventory/_db-columns.json, so nothing here was skipped for a missing schema.
//
// Two deliberate deviations from the retired function, both because the surrounding system
// moved on while the function sat dead on an unmerged/deleted path:
//
// 1. Freezing now goes through `cancelAndRefundSalonBookings` (lib/bookings/suspend-salon.ts),
//    the shared, race-safe, refund-issuing helper the admin freeze/warn routes already call.
//    The retired function's own inline cancel loop never refunded anything, which is exactly
//    the "orphaned paid booking" bug that helper was written on 2026-07-27 to close for the
//    admin routes. Reusing it here means a SCHEDULED freeze gets the same fix, instead of
//    reintroducing the pre-fix behaviour. That helper does not send customer emails, so the
//    per-customer notification (the retired function's other half of the freeze branch) is
//    done here, reading back the bookings it just cancelled by `cancellation_reason` +
//    `cancelled_at`.
//
// 2. The retired function minted its own base64 "token" (salon_id/owner_id/exp) for the
//    email's confirm link. The LIVE `app/api/salons/verify` GET route authenticates via
//    `admin.auth.getUser(token)`, a real Supabase access token, which that base64 token was
//    never valid input for. So the email link here points at the owner's authenticated
//    dashboard settings page instead (`VerificationTab`, app/[locale]/dashboard/settings/
//    page.tsx:634, deep-linked via `?tab=verification`) rather than a token the current
//    verify route cannot validate.
//
//    KNOWN BLOCKER, verified live 2026-09-04, not fixed here: that page loads fine, but its
//    own "Confirm now" button (page.tsx:641) does `fetch("/api/salons/verify?salon_id=...",
//    { method: "POST" })`, and `app/api/salons/verify/route.ts` exports only GET today, no
//    POST handler. Curled directly: GET returns 307 (redirect, expected), POST returns 405.
//    So the button this email's link ultimately leads to is a dead click, confirmed by
//    request, not by reading the code. A POST handler already exists, stranded on the
//    unmerged/dead sha a67fa01b0 at this same path (session-authenticated, D6 owner_id
//    gate, stamps last_verified_at/verification_warnings=0), but wiring it in is outside
//    this slice's file scope (app/api/salons/verify/route.ts is not one of this slice's
//    files) and is reported here, not silently fixed or silently left unstated.

import { cancelAndRefundSalonBookings } from "@/lib/bookings/suspend-salon";
import {
  sendEmail,
  salonVerificationRequest,
  salonVerificationWarning,
  salonFrozen,
  customerBookingSuspended,
} from "@/lib/email";
import type { EmailLocale } from "@/lib/email";
import { getAppUrl } from "@/lib/env";
import type { createAdminSupabaseClient } from "@/lib/supabase";

const SIX_MONTHS_MS = 6 * 30 * 24 * 60 * 60 * 1000;
const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;

type AdminClient = ReturnType<typeof createAdminSupabaseClient>;

export interface FreezeEscalationResult {
  processed: number;
  warned: number;
  frozen: number;
  errors: string[];
}

function confirmUrl(baseUrl: string, locale: string): string {
  return `${baseUrl}/${locale}/dashboard/settings?tab=verification`;
}

export async function runFreezeEscalation(admin: AdminClient): Promise<FreezeEscalationResult> {
  const result: FreezeEscalationResult = { processed: 0, warned: 0, frozen: 0, errors: [] };

  let baseUrl: string;
  try {
    baseUrl = getAppUrl();
  } catch (err) {
    console.warn("[freeze-escalation] getAppUrl failed, falling back to prod URL:", err);
    baseUrl = "https://www.solen.ch";
  }

  const sixMonthsAgo = new Date(Date.now() - SIX_MONTHS_MS).toISOString();

  const { data: salons, error: salonsError } = await admin
    .from("salons")
    .select("id, name, owner_id, verification_warnings, last_verified_at")
    .lt("last_verified_at", sixMonthsAgo)
    .eq("is_active", true);

  if (salonsError) {
    console.error("[freeze-escalation] fetch salons failed:", salonsError.message);
    result.errors.push(`fetch salons: ${salonsError.message}`);
    return result;
  }
  if (!salons || salons.length === 0) return result;

  const ownerIds = Array.from(new Set(salons.map((s) => s.owner_id)));
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, email, locale")
    .in("id", ownerIds);
  const profileByOwner = new Map((profiles ?? []).map((p) => [p.id, p]));

  for (const salon of salons) {
    result.processed++;
    const owner = profileByOwner.get(salon.owner_id);
    const ownerEmail = owner?.email;
    if (!ownerEmail) {
      console.error(`[freeze-escalation] salon ${salon.id}: owner ${salon.owner_id} has no email on profile`);
      result.errors.push(`salon ${salon.id}: owner has no email on profile`);
      continue;
    }
    const locale: EmailLocale = (owner?.locale as EmailLocale) ?? "de";
    const url = confirmUrl(baseUrl, locale);
    const warnings = salon.verification_warnings ?? 0;
    const lastVerified = salon.last_verified_at ? new Date(salon.last_verified_at).getTime() : 0;
    const pastTwoWeekGate = lastVerified < Date.now() - TWO_WEEKS_MS;

    try {
      if (warnings === 0) {
        await sendEmail(salonVerificationRequest(ownerEmail, { salon: salon.name, confirmUrl: url }, locale));
        // cas-ok: monthly cron is the sole writer of this counter's forward direction; the
        // only concurrent writer is /api/salons/verify, which resets it to 0 on owner
        // confirm. A race just means the reset wins on the next read (idempotent either way,
        // no money moves here), same shape as the existing unprotected admin warn/freeze
        // writes this module calls into below.
        await admin.from("salons").update({ verification_warnings: 1 }).eq("id", salon.id);
        result.warned++;
      } else if (warnings === 1 && pastTwoWeekGate) {
        await sendEmail(salonVerificationWarning(ownerEmail, { salon: salon.name, confirmUrl: url, warningNum: 2 }, locale));
        // cas-ok: see reasoning above, same counter.
        await admin.from("salons").update({ verification_warnings: 2 }).eq("id", salon.id);
        result.warned++;
      } else if (warnings === 2 && pastTwoWeekGate) {
        await sendEmail(salonVerificationWarning(ownerEmail, { salon: salon.name, confirmUrl: url, warningNum: 3 }, locale));
        // cas-ok: see reasoning above, same counter.
        await admin.from("salons").update({ verification_warnings: 3 }).eq("id", salon.id);
        result.warned++;
      } else if (warnings >= 3 && pastTwoWeekGate) {
        const cutoffIso = new Date().toISOString();
        // cas-ok: is_active/frozen_at/frozen_reason is an idempotent status flip (setting
        // false/now twice yields the same state), identical in shape to the unprotected
        // .update() in app/api/admin/salons/[id]/freeze/route.ts. The money-bearing write is
        // the per-booking CAS inside cancelAndRefundSalonBookings below, which already does
        // compare-and-set per booking.
        const { error: freezeError } = await admin.from("salons").update({
          is_active: false,
          frozen_at: cutoffIso,
          frozen_reason: "Automatische Sperrung: Salon seit über 6 Monaten nicht bestätigt",
        }).eq("id", salon.id);
        if (freezeError) {
          console.error(`[freeze-escalation] salon ${salon.id}: freeze update failed:`, freezeError.message);
          result.errors.push(`salon ${salon.id}: freeze update failed: ${freezeError.message}`);
          continue;
        }

        const suspendResult = await cancelAndRefundSalonBookings(
          admin,
          salon.id,
          "verification escalation: unconfirmed 6+ months",
          "salon-freeze-escalation",
        );
        if (suspendResult.refundFailures > 0) {
          console.error(`[freeze-escalation] salon ${salon.id}: ${suspendResult.refundFailures} refund(s) failed during freeze`);
          result.errors.push(`salon ${salon.id}: ${suspendResult.refundFailures} refund(s) failed during freeze`);
        }

        // cancelAndRefundSalonBookings only cancels + refunds; it sends no email. Read back
        // the bookings this run just cancelled (by reason + cutoff) to notify each customer,
        // matching the retired function's per-customer email.
        const { data: cancelledBookings } = await admin
          .from("bookings")
          .select("user_id, starts_at, service_id")
          .eq("salon_id", salon.id)
          .eq("cancellation_reason", "admin_salon_suspension")
          .gte("cancelled_at", cutoffIso);

        if (cancelledBookings && cancelledBookings.length > 0) {
          // Guest bookings (no user_id) aren't notified here, matching the retired
          // function's scope, which only ever resolved a customer via auth.admin.getUserById
          // and had no guest_email handling either.
          const custIds = Array.from(
            new Set(cancelledBookings.map((b) => b.user_id).filter((v): v is string => !!v)),
          );
          const svcIds = Array.from(
            new Set(cancelledBookings.map((b) => b.service_id).filter((v): v is string => !!v)),
          );
          const [{ data: custProfiles }, { data: svcRows }] = await Promise.all([
            admin.from("profiles").select("id, email, locale").in("id", custIds),
            admin.from("services").select("id, name_de, name_en, name_fr, name_it").in("id", svcIds),
          ]);
          const custById = new Map((custProfiles ?? []).map((p) => [p.id, p]));
          const svcById = new Map((svcRows ?? []).map((s) => [s.id, s]));

          for (const booking of cancelledBookings) {
            if (!booking.user_id) continue;
            const cust = custById.get(booking.user_id);
            if (!cust?.email) continue;
            const custLocale: EmailLocale = (cust.locale as EmailLocale) ?? "de";
            const svc = booking.service_id ? svcById.get(booking.service_id) : undefined;
            const svcNames = svc as unknown as Record<string, string> | undefined;
            const serviceName = svcNames?.[`name_${custLocale}`] ?? svcNames?.name_de ?? "Service";
            try {
              await sendEmail(customerBookingSuspended(cust.email, {
                salon: salon.name,
                service: serviceName,
                date: new Date(booking.starts_at).toLocaleDateString("de-CH"),
              }, custLocale));
            } catch (err) {
              console.error(`[freeze-escalation] salon ${salon.id}: customer notify failed for user ${booking.user_id}:`, err);
              result.errors.push(`salon ${salon.id}: customer notify failed for user ${booking.user_id}`);
            }
          }
        }

        try {
          await sendEmail(salonFrozen(ownerEmail, { salon: salon.name }, locale));
        } catch (err) {
          console.error(`[freeze-escalation] salon ${salon.id}: owner freeze email failed:`, err);
          result.errors.push(`salon ${salon.id}: owner freeze email failed`);
        }
        result.frozen++;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[freeze-escalation] salon ${salon.id} failed:`, err);
      result.errors.push(`salon ${salon.id}: ${msg}`);
    }
  }

  return result;
}
