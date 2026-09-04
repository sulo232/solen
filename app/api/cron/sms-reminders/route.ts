export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { sendSMS } from "@/lib/sms";
import { sendEmail, bookingReminder, type EmailLocale } from "@/lib/email";
import { resolveSwissLocale } from "@/lib/format";
import { getServerEnv } from "@/lib/env";
import { verifyCronSecret } from "@/lib/cron-auth";
import { withCronRun } from "@/lib/cron-run";

// seo-comms-10 (2026-09-04): locale -> services.name_* column, mirrors the same ternary
// already used at app/api/bookings/route.ts:643 for the confirmation email, extended to
// all 4 app locales since services carries name_fr/name_it too.
const SERVICE_NAME_COL: Record<EmailLocale, "name_de" | "name_en" | "name_fr" | "name_it"> = {
  de: "name_de", en: "name_en", fr: "name_fr", it: "name_it",
};

// RING 3a: caps a per-item errors[] array so a bad batch never floods cron_runs.
function capErrors(errs: string[], max = 20): string[] {
  if (errs.length <= max) return errs;
  return [...errs.slice(0, max), `...and ${errs.length - max} more`];
}

/**
 * Cron handler: send SMS reminders for upcoming bookings.
 * Runs every 30 minutes. Protected by CRON_SECRET.
 *
 * 24h reminder: bookings starting in 23.5h–24.5h
 * 1h reminder:  bookings starting in 0.5h–1.5h
 */
export async function GET(req: NextRequest) {
  const env = getServerEnv();
  if (!env.CRON_SECRET) return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });
  const authHeader = req.headers.get("authorization");
  if (!(await verifyCronSecret(authHeader, env.CRON_SECRET))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return withCronRun("sms-reminders", async () => {
  // seo-comms-10 (2026-09-04): this used to bail the WHOLE run (no bookings even
  // queried) when SEVEN_IO_API_KEY was unset, on the reasoning that nothing else in
  // this cron could send anything either. That stopped being true once this route also
  // sends email reminders: email must keep going out on its own key (RESEND_API_KEY)
  // even when the SMS provider key is missing. sendSMS() already self-guards per call
  // (warns + returns false), and the claim/revert logic below reverts sms_sent_24h/1h
  // on that false so a later run with a real key retries it, so no cron-wide bailout
  // is needed; RING 3a's original point (log a row even on a fully-skipped run) is now
  // just the normal processed-count path.
  if (!env.SEVEN_IO_API_KEY) {
    console.warn("[sms-reminders] SEVEN_IO_API_KEY not set, SMS channel will no-op (email channel unaffected)");
  }

  const supabase = createAdminSupabaseClient();
  const now = Date.now();

  // Time windows
  const win24hStart = new Date(now + 23.5 * 60 * 60 * 1000).toISOString();
  const win24hEnd = new Date(now + 24.5 * 60 * 60 * 1000).toISOString();
  const win1hStart = new Date(now + 0.5 * 60 * 60 * 1000).toISOString();
  const win1hEnd = new Date(now + 1.5 * 60 * 60 * 1000).toISOString();

  let sent24h = 0;
  let sent1h = 0;
  let sentEmail24h = 0;
  let sentEmail1h = 0;
  const errorMsgs: string[] = [];

  // -- 24h reminders --
  // seo-comms-10: `.or(sms_sent_24h.eq.false,email_sent_24h.eq.false)` replaces the old
  // single `.eq("sms_sent_24h", false)`. A booking whose SMS already went out (or was
  // skipped) but whose email hasn't must still be fetched, or the email channel would
  // never get a chance to fire once the SMS side claims the row.
  const { data: bookings24h } = await supabase
    .from("bookings")
    .select(
      "id, starts_at, profiles!bookings_user_id_fkey(display_name, phone_number, notification_sms, notification_email, email, locale), salons!bookings_salon_id_fkey(name, address, sms_reminder_24h), services(name_de, name_en, name_fr, name_it)"
    )
    .eq("status", "confirmed")
    .or("sms_sent_24h.eq.false,email_sent_24h.eq.false")
    .gte("starts_at", win24hStart)
    .lte("starts_at", win24hEnd)
    .limit(100);

  for (const booking of bookings24h ?? []) {
    const profile = booking.profiles as any;
    const salon = booking.salons as any;
    const phone = profile?.phone_number;

    // SMS channel: unchanged behavior, now scoped to its own claim so it does not block
    // the email channel below when the SMS side is already sent/skipped/disqualified.
    if (phone && profile?.notification_sms !== false && salon?.sms_reminder_24h) {
      // Claim before send: flip the flag with a conditional update so a second concurrent
      // cron run (still on the `sms_sent_24h: false` select above) can't also send this
      // booking. If 0 rows come back, another run already claimed it, so skip.
      const { data: claimed24h, error: claim24hErr } = await supabase
        .from("bookings")
        .update({ sms_sent_24h: true })
        .eq("id", booking.id)
        .eq("sms_sent_24h", false)
        .select("id");
      if (claim24hErr) {
        console.error(`[sms-reminders] booking ${booking.id}: 24h SMS claim update failed:`, claim24hErr);
      } else if (claimed24h && claimed24h.length > 0) {
        const time = new Date(booking.starts_at).toLocaleTimeString("de-CH", {
          hour: "2-digit",
          minute: "2-digit",
        });
        const ok = await sendSMS(
          phone,
          `Erinnerung: Morgen um ${time} bei ${salon?.name ?? "Ihrem Salon"}. Adresse: ${salon?.address ?? "-"}`
        );
        if (ok) {
          sent24h++;
        } else {
          // Revert the claim so a later run retries this booking.
          await supabase.from("bookings").update({ sms_sent_24h: false }).eq("id", booking.id);
          errorMsgs.push(`booking ${booking.id}: 24h SMS send failed (invalid phone or provider error)`);
        }
      } // else: already claimed by another run
    }

    // Email channel (seo-comms-10, new). Independent of the salon's SMS toggles by
    // design (task #4: sms_reminder_24h/1h keep gating SMS only, never silently email
    // too). A guest booking has no profile row, so `profile` is null and this is
    // skipped, same as the SMS branch above always was for guests (no live code path
    // here ever read bookings.guest_email/guest_phone), unchanged guest behavior.
    if (profile?.email && profile?.notification_email !== false) {
      const { data: claimedEmail24h, error: claimEmailErr } = await supabase
        .from("bookings")
        .update({ email_sent_24h: true })
        .eq("id", booking.id)
        .eq("email_sent_24h", false)
        .select("id");
      if (claimEmailErr) {
        console.error(`[sms-reminders] booking ${booking.id}: 24h email claim update failed:`, claimEmailErr);
      } else if (claimedEmail24h && claimedEmail24h.length > 0) {
        const locale = (profile.locale as EmailLocale) ?? "de";
        const swissLocale = resolveSwissLocale(locale);
        const date = new Date(booking.starts_at).toLocaleDateString(swissLocale, { timeZone: "Europe/Zurich" });
        const time = new Date(booking.starts_at).toLocaleTimeString(swissLocale, {
          timeZone: "Europe/Zurich", hour: "2-digit", minute: "2-digit",
        });
        const serviceName = booking.services?.[SERVICE_NAME_COL[locale] ?? "name_de"] ?? "Service";
        const emailData = bookingReminder(
          profile.email,
          {
            service: serviceName,
            salon: salon?.name ?? "Solen",
            date, time,
            manageUrl: `https://solen.ch/${locale}/profile/bookings`,
            window: "24h",
          },
          locale
        );
        try {
          await sendEmail(emailData);
          sentEmail24h++;
        } catch (err) {
          console.error(`[sms-reminders] booking ${booking.id}: 24h email send failed:`, err);
          await supabase.from("bookings").update({ email_sent_24h: false }).eq("id", booking.id);
          errorMsgs.push(`booking ${booking.id}: 24h email send failed`);
        }
      } // else: already claimed by another run
    }
  }

  // -- 1h reminders --
  // seo-comms-10: same `.or(...)` widening as the 24h query above, same reason.
  const { data: bookings1h } = await supabase
    .from("bookings")
    .select(
      "id, starts_at, profiles!bookings_user_id_fkey(display_name, phone_number, notification_sms, notification_email, email, locale), salons!bookings_salon_id_fkey(name, sms_reminder_1h), services(name_de, name_en, name_fr, name_it)"
    )
    .eq("status", "confirmed")
    .or("sms_sent_1h.eq.false,email_sent_1h.eq.false")
    .gte("starts_at", win1hStart)
    .lte("starts_at", win1hEnd)
    .limit(100);

  for (const booking of bookings1h ?? []) {
    const profile = booking.profiles as any;
    const salon = booking.salons as any;
    const phone = profile?.phone_number;

    if (phone && profile?.notification_sms !== false && salon?.sms_reminder_1h) {
      // Claim before send: flip the flag with a conditional update so a second concurrent
      // cron run (still on the `sms_sent_1h: false` select above) can't also send this
      // booking. If 0 rows come back, another run already claimed it, so skip.
      const { data: claimed1h, error: claim1hErr } = await supabase
        .from("bookings")
        .update({ sms_sent_1h: true })
        .eq("id", booking.id)
        .eq("sms_sent_1h", false)
        .select("id");
      if (claim1hErr) {
        console.error(`[sms-reminders] booking ${booking.id}: 1h SMS claim update failed:`, claim1hErr);
      } else if (claimed1h && claimed1h.length > 0) {
        const time = new Date(booking.starts_at).toLocaleTimeString("de-CH", {
          hour: "2-digit",
          minute: "2-digit",
        });
        const ok = await sendSMS(
          phone,
          `In 1 Stunde: Termin bei ${salon?.name ?? "Ihrem Salon"} um ${time}.`
        );
        if (ok) {
          sent1h++;
        } else {
          // Revert the claim so a later run retries this booking.
          await supabase.from("bookings").update({ sms_sent_1h: false }).eq("id", booking.id);
          errorMsgs.push(`booking ${booking.id}: 1h SMS send failed (invalid phone or provider error)`);
        }
      } // else: already claimed by another run
    }

    // Email channel (seo-comms-10, new). Same rules as the 24h block above: independent
    // of the salon SMS toggle, skipped for guests (no profile row), claim-before-send.
    if (profile?.email && profile?.notification_email !== false) {
      const { data: claimedEmail1h, error: claimEmail1hErr } = await supabase
        .from("bookings")
        .update({ email_sent_1h: true })
        .eq("id", booking.id)
        .eq("email_sent_1h", false)
        .select("id");
      if (claimEmail1hErr) {
        console.error(`[sms-reminders] booking ${booking.id}: 1h email claim update failed:`, claimEmail1hErr);
      } else if (claimedEmail1h && claimedEmail1h.length > 0) {
        const locale = (profile.locale as EmailLocale) ?? "de";
        const swissLocale = resolveSwissLocale(locale);
        const date = new Date(booking.starts_at).toLocaleDateString(swissLocale, { timeZone: "Europe/Zurich" });
        const time = new Date(booking.starts_at).toLocaleTimeString(swissLocale, {
          timeZone: "Europe/Zurich", hour: "2-digit", minute: "2-digit",
        });
        const serviceName = booking.services?.[SERVICE_NAME_COL[locale] ?? "name_de"] ?? "Service";
        const emailData = bookingReminder(
          profile.email,
          {
            service: serviceName,
            salon: salon?.name ?? "Solen",
            date, time,
            manageUrl: `https://solen.ch/${locale}/profile/bookings`,
            window: "1h",
          },
          locale
        );
        try {
          await sendEmail(emailData);
          sentEmail1h++;
        } catch (err) {
          console.error(`[sms-reminders] booking ${booking.id}: 1h email send failed:`, err);
          await supabase.from("bookings").update({ email_sent_1h: false }).eq("id", booking.id);
          errorMsgs.push(`booking ${booking.id}: 1h email send failed`);
        }
      } // else: already claimed by another run
    }
  }

  console.log(
    `[sms-reminders] sent24h=${sent24h} sent1h=${sent1h} sentEmail24h=${sentEmail24h} sentEmail1h=${sentEmail1h} errors=${errorMsgs.length}`
  );

  return {
    sent24h, sent1h, sentEmail24h, sentEmail1h,
    errors: capErrors(errorMsgs),
    processed: sent24h + sent1h + sentEmail24h + sentEmail1h,
  };
  });
}
