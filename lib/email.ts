// =============================================================================
// lib/email.ts — Transactional email via Resend
// All emails have DE + EN + FR versions.
// =============================================================================

import { getServerEnv } from "@/lib/env";
import { EMAIL_COLORS } from "@/lib/email-colors";
import { buildBookingIcs } from "@/lib/ics";
import { unsubscribeToken } from "@/lib/unsubscribe-token";

export type EmailLocale = "de" | "en" | "fr" | "it";

// typography-02 (2026-07-27): shared font-family stack for every transactional +
// lifecycle email. Email clients cannot load next/font's self-hosted Inter Tight /
// Inter, so this is the closest-available system-font stack (system-ui sans on
// every platform, never a serif fallback, never monospace). Applied once in
// sendEmail() so every template builder (lib/email.ts + lib/email-templates/**)
// gets brand-consistent typography without each one re-declaring it; codes use
// this same stack + font-weight:700 + tabular-nums (LOCKFILE §13.4's .num
// recipe) instead of the retired font-family:monospace.
export const EMAIL_FONT_STACK =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif";

/** Escape the few chars that would break out of an HTML text context. */
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// seo-comms-07 (2026-07-27): derive a plain-text alternative from a template's html so
// Resend's payload always carries both parts, not html-only. A single-part HTML message
// is a well-documented negative deliverability signal and breaks plain-text/screen-reader
// clients. Centralized here (sendEmail's one choke point) instead of hand-writing a
// second copy of every one of the ~60 template bodies, which would be the same
// information duplicated at high edit-drift risk for close to zero reader benefit over
// an accurate derivation. `<a href>` links keep their URL in parens so the plain-text
// reader isn't left with a dead "click here".
function stripHtmlToText(html: string): string {
  return html
    .replace(/<a\s+[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, "$2 ($1)")
    .replace(/<\/(p|div|tr|table|blockquote|h[1-6])>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export interface EmailPayload {
  to: string | string[];
  subject: string;
  html: string;
  /** Plain-text alternative. Auto-derived from `html` by sendEmail() when omitted. */
  text?: string;
  // seo-comms-09: an optional attachment set, e.g. bookingConfirmation's .ics calendar
  // file. `content` is base64, matching Resend's own attachments field shape.
  attachments?: { filename: string; content: string }[];
  /**
   * Optional From override. Defaults to "solen.ch <noreply@solen.ch>" (below) when omitted, so
   * every existing caller that doesn't set this keeps sending from the same default address.
   * Needed by the 8 collapsed hand-rolled sites (2026-07-17), which use "support@solen.ch" or
   * "Solen <noreply@solen.ch>" and must keep their existing sender identity byte-identical.
   */
  from?: string;
}

/**
 * How long we are willing to wait for Resend before giving up.
 *
 * Why a timeout exists at all: this call is awaited INSIDE synchronous, customer-facing
 * requests (app/api/bookings/route.ts:594 and :628, inside the booking POST). Callers already
 * try/catch it, so a Resend ERROR is handled and the booking survives. A Resend HANG was not:
 * with no timeout, the await blocked until the platform killed the whole function, so the
 * customer watched their booking screen die AFTER the booking row had already been committed,
 * and saw a failure for something that actually worked.
 *
 * Why 5000ms specifically, measured not guessed (2026-07-16): 10 timed calls to
 * api.resend.com/emails returned in 0.21s to 0.34s. 5s is roughly 15x the observed worst case,
 * so it cannot fire on a normal slow day, and it sits well under the serverless function's own
 * wall-clock ceiling, so WE give up before the platform kills the request and we keep the
 * ability to log it.
 *
 * Honest limit of that measurement: it was taken from a dev machine against the validation
 * path (an intentionally invalid payload, no mail sent), NOT from a cold Netlify eu-west
 * invocation doing a real send. So this is a sane bound, not a true p99. If Resend ever gets
 * genuinely slower, this fires and logs, which is the point: a logged timeout beats a silent
 * hang. Re-measure from production before tightening it.
 */
const RESEND_TIMEOUT_MS = 5000;

/**
 * Send a transactional email via Resend.
 * Requires RESEND_API_KEY in environment.
 *
 * Throws on failure, including timeout. Every caller must keep its try/catch: an email is never
 * worth failing a booking that already committed.
 *
 * @param requestId optional (OBS-01): the caller's request id, logged alongside this
 *   function's own console.error/warn lines so a failed send can be traced back to the
 *   booking-create or webhook request that triggered it. Optional so every EXISTING caller
 *   (there are several) keeps compiling unchanged.
 */
/**
 * The ONE wrapper every outgoing email body is placed inside at send time.
 *
 * Extracted from sendEmail's request body (2026-08-15) so the dev preview page
 * (/dev/emails) can show a template exactly as a recipient gets it rather than an
 * approximation. Extraction only: the string below is byte-identical to what was
 * inlined before, so no email changes shape. When the shared shell (logo, 600px
 * card, footer) lands, THIS is the single place it goes, and all 67 templates get
 * it at once.
 */
export function wrapEmailHtml(html: string): string {
  return `<div style="font-family:${EMAIL_FONT_STACK};color:${EMAIL_COLORS.ink};font-size:15px;line-height:1.5">${html}</div>`;
}

export async function sendEmail(payload: EmailPayload, requestId?: string): Promise<void> {
  const apiKey = getServerEnv().RESEND_API_KEY;
  if (!apiKey || apiKey === "PASTE_RESEND_KEY_HERE") {
    // Was a warn + silent return: the docstring above already promised "throws on failure",
    // but this branch didn't, so a caller's try/catch never ran and callers that claim-then-
    // revert-on-catch (app/api/cron/sms-reminders/route.ts) treated an unsent email as sent.
    // Throwing here is what makes the docstring true and every existing try/catch do its job.
    console.error("[email] RESEND_API_KEY not configured, refusing to send", { requestId });
    throw new Error("RESEND_API_KEY not configured");
  }

  // MERGED BY HAND 2026-08-14, both halves kept. The timeout below came from the July branch and
  // had never reached main: main carried the RESEND_TIMEOUT_MS comment explaining a timeout that
  // the code did not actually apply, so every send waited indefinitely. The brand font wrapper,
  // the text/plain part and the attachments came from main and are not in the branch. Dropping
  // either side loses something real, so the request body below is main's and the abort handling
  // around it is the branch's.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), RESEND_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: payload.from ?? "solen.ch <noreply@solen.ch>",
        to: payload.to,
        subject: payload.subject,
        // typography-02: wrap every template's body in the brand font stack here,
        // the single choke point all ~30 template builders funnel through. Fixes
        // lib/email-templates/{audit-notifications,booking-notifications,
        // salon-onboarding,welcome-series}.ts, which had zero font-family
        // declarations of their own and rendered in each client's default font
        // (Times New Roman in classic Outlook) with no brand typeface.
        html: wrapEmailHtml(payload.html),
        // seo-comms-07: every send now carries a text/plain part, hand-written when the
        // template supplied one, else derived from the same html above.
        text: payload.text ?? stripHtmlToText(payload.html),
        ...(payload.attachments ? { attachments: payload.attachments } : {}),
      }),
      signal: controller.signal,
    });
  } catch (err) {
    // Name the timeout explicitly rather than letting it surface as a bare "AbortError", so the
    // log says WHY. Do not swallow it: the caller decides, and every caller already try/catches.
    if (err instanceof Error && err.name === "AbortError") {
      console.error(`[email] Resend timed out after ${RESEND_TIMEOUT_MS}ms:`, payload.subject, { requestId });
      throw new Error(`Resend timeout after ${RESEND_TIMEOUT_MS}ms`);
    }
    throw err;
  } finally {
    // Always clear, including the success path, or the pending timer holds the function alive.
    clearTimeout(timer);
  }

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Resend error: ${error}`);
  }
}

// ---------------------------------------------------------------------------
// Template builders
// ---------------------------------------------------------------------------

export function bookingConfirmation(
  to: string,
  vars: {
    service: string; salon: string; date: string; time: string;
    // Optional price + Swiss VAT breakdown (VAT-INCLUSIVE), all pre-formatted CHF strings.
    // When net+vat+rate are present (a VAT-registered salon) the email shows the
    // Netto/MWST/Gesamt split + the salon's UID; when only `total` is present it shows
    // just the amount; when none are present the email is unchanged (backward-compatible).
    total?: string; net?: string; vat?: string; rate?: string; vatNumber?: string;
    // seo-comms-09 (2026-07-27): a booking confirmation with no address/manage-link/
    // calendar-file forces every follow-up action (where do I go, can I cancel, put it
    // in my calendar) back into a manual app login. All three are optional and
    // additive: an existing call site that doesn't pass them renders exactly as before.
    address?: string;
    manageUrl?: string;
    // Raw ISO start/end (not the human-formatted `date`/`time` above) + a stable id,
    // needed to build the .ics VEVENT. Only rendered when all three are present.
    icsStartsAt?: string;
    icsEndsAt?: string;
    bookingId?: string;
  },
  locale: EmailLocale = "de"
): EmailPayload {
  const subjects: Record<EmailLocale, string> = {
    de: `Buchungsbestätigung: ${vars.service} bei ${vars.salon}`,
    en: `Booking confirmed: ${vars.service} at ${vars.salon}`,
    fr: `Réservation confirmée: ${vars.service} chez ${vars.salon}`,
    it: `Prenotazione confermata: ${vars.service} presso ${vars.salon}`,
  };

  // Per-locale labels for the optional price/VAT block (mirrors the on-screen receipt).
  const PL = {
    de: { net: "Netto", vat: "MWST", total: "Gesamt (inkl. MWST)", amount: "Betrag", nr: "MWST-Nr." },
    en: { net: "Net", vat: "VAT", total: "Total (incl. VAT)", amount: "Amount", nr: "VAT no." },
    fr: { net: "Net", vat: "TVA", total: "Total (TVA incl.)", amount: "Montant", nr: "N° TVA" },
    it: { net: "Netto", vat: "IVA", total: "Totale (IVA incl.)", amount: "Importo", nr: "N. IVA" },
  }[locale];

  let priceHtml = "";
  if (vars.total) {
    if (vars.net && vars.vat && vars.rate) {
      priceHtml =
        `<table style="margin-top:12px;border-collapse:collapse;font-size:14px">` +
        `<tr><td style="padding:3px 24px 3px 0;color:${EMAIL_COLORS.ink2}">${PL.net}</td><td style="padding:3px 0;text-align:right">${vars.net}</td></tr>` +
        `<tr><td style="padding:3px 24px 3px 0;color:${EMAIL_COLORS.ink2}">${PL.vat} ${vars.rate}%</td><td style="padding:3px 0;text-align:right">${vars.vat}</td></tr>` +
        `<tr><td style="padding:6px 24px 0 0;font-weight:700">${PL.total}</td><td style="padding:6px 0 0;text-align:right;font-weight:700">${vars.total}</td></tr>` +
        `</table>` +
        (vars.vatNumber ? `<p style="margin-top:6px;color:${EMAIL_COLORS.ink2};font-size:12px">${PL.nr} ${escapeHtml(vars.vatNumber)}</p>` : "");
    } else {
      priceHtml = `<p style="margin-top:12px;font-size:14px"><strong>${PL.amount}: ${vars.total}</strong></p>`;
    }
  }

  // seo-comms-09: address + manage-link labels, same per-locale shape as PL above.
  const CL = {
    de: { address: "Adresse", manage: "Buchung ansehen oder stornieren" },
    en: { address: "Address", manage: "View or cancel booking" },
    fr: { address: "Adresse", manage: "Voir ou annuler la réservation" },
    it: { address: "Indirizzo", manage: "Visualizza o annulla la prenotazione" },
  }[locale];

  const addressHtml = vars.address
    ? `<p style="margin-top:12px;font-size:14px;color:${EMAIL_COLORS.ink2}">${CL.address}: ${escapeHtml(vars.address)}</p>`
    : "";
  const manageHtml = vars.manageUrl
    ? `<p style="margin-top:12px"><a href="${vars.manageUrl}">${CL.manage} →</a></p>`
    : "";

  const bodies: Record<EmailLocale, string> = {
    de: `<p>Hallo,</p><p><strong>${escapeHtml(vars.service)}</strong> bei <strong>${escapeHtml(vars.salon)}</strong> am ${vars.date} um ${vars.time} Uhr ist bestätigt. Wir freuen uns auf Sie!</p>${priceHtml}${addressHtml}${manageHtml}<p>solen.ch</p>`,
    en: `<p>Hello,</p><p><strong>${escapeHtml(vars.service)}</strong> at <strong>${escapeHtml(vars.salon)}</strong> on ${vars.date} at ${vars.time} is confirmed. See you there!</p>${priceHtml}${addressHtml}${manageHtml}<p>solen.ch</p>`,
    fr: `<p>Bonjour,</p><p><strong>${escapeHtml(vars.service)}</strong> chez <strong>${escapeHtml(vars.salon)}</strong> le ${vars.date} à ${vars.time} est confirmé. À bientôt!</p>${priceHtml}${addressHtml}${manageHtml}<p>solen.ch</p>`,
    it: `<p>Ciao,</p><p><strong>${escapeHtml(vars.service)}</strong> presso <strong>${escapeHtml(vars.salon)}</strong> il ${vars.date} alle ${vars.time} è confermato. A presto!</p>${priceHtml}${addressHtml}${manageHtml}<p>solen.ch</p>`,
  };

  // seo-comms-09: attach a .ics calendar file when the caller supplied raw ISO
  // start/end + a booking id (all three, or none, no partial rendering).
  let attachments: EmailPayload["attachments"];
  if (vars.icsStartsAt && vars.icsEndsAt && vars.bookingId) {
    const ics = buildBookingIcs({
      uid: vars.bookingId,
      title: `${vars.service} - ${vars.salon}`,
      description: `${vars.service} bei ${vars.salon}`,
      location: vars.address ?? vars.salon,
      startsAt: vars.icsStartsAt,
      endsAt: vars.icsEndsAt,
      url: vars.manageUrl,
    });
    attachments = [{ filename: "termin.ics", content: Buffer.from(ics, "utf-8").toString("base64") }];
  }

  return { to, subject: subjects[locale], html: bodies[locale], ...(attachments ? { attachments } : {}) };
}

export function bookingCancellation(
  to: string,
  vars: { service: string; salon: string; date: string },
  locale: EmailLocale = "de"
): EmailPayload {
  const subjects: Record<EmailLocale, string> = {
    de: `Buchung storniert: ${vars.service} bei ${vars.salon}`,
    en: `Booking cancelled: ${vars.service} at ${vars.salon}`,
    fr: `Réservation annulée: ${vars.service} chez ${vars.salon}`,
    it: `Prenotazione cancellata: ${vars.service} presso ${vars.salon}`,
  };
  const bodies: Record<EmailLocale, string> = {
    de: `<p>${escapeHtml(vars.service)} bei ${escapeHtml(vars.salon)} am ${vars.date} wurde storniert.</p>`,
    en: `<p>${escapeHtml(vars.service)} at ${escapeHtml(vars.salon)} on ${vars.date} has been cancelled.</p>`,
    fr: `<p>${escapeHtml(vars.service)} chez ${escapeHtml(vars.salon)} le ${vars.date} a été annulé.</p>`,
    it: `<p>${escapeHtml(vars.service)} presso ${escapeHtml(vars.salon)} il ${vars.date} è stata cancellata.</p>`,
  };
  return { to, subject: subjects[locale], html: bodies[locale] };
}

export function bookingReschedule(
  to: string,
  vars: { service: string; salon: string; oldDate: string; newDate: string },
  locale: EmailLocale = "de"
): EmailPayload {
  const subjects: Record<EmailLocale, string> = {
    de: `Buchung verschoben: ${vars.service} bei ${vars.salon}`,
    en: `Booking rescheduled: ${vars.service} at ${vars.salon}`,
    fr: `Réservation reprogrammée: ${vars.service} chez ${vars.salon}`,
    it: `Prenotazione riprogrammata: ${vars.service} presso ${vars.salon}`,
  };
  // Appointment times are Swiss wall-clock times. Without an explicit zone the server's own
  // zone applies (UTC in production), which printed a 10:00 appointment as 08:00 in summer.
  const zurich: Intl.DateTimeFormatOptions = { timeZone: "Europe/Zurich" };
  const bodies: Record<EmailLocale, string> = {
    de: `<p>Ihre Buchung für ${escapeHtml(vars.service)} bei ${escapeHtml(vars.salon)} wurde von ${new Date(vars.oldDate).toLocaleString("de-CH", zurich)} auf den ${new Date(vars.newDate).toLocaleString("de-CH", zurich)} verschoben.</p>`,
    // en-CH (not en-US, fixed 2026-07-26 de-CH sweep): every other locale here uses its Swiss
    // regional variant (de-CH/fr-CH/it-CH); en-US would show US date order + AM/PM to a Swiss
    // English-locale user, inconsistent with lib/format.ts's SWISS_DATE_LOCALES (en -> en-CH).
    en: `<p>Your booking for ${escapeHtml(vars.service)} at ${escapeHtml(vars.salon)} has been rescheduled from ${new Date(vars.oldDate).toLocaleString("en-CH", zurich)} to ${new Date(vars.newDate).toLocaleString("en-CH", zurich)}.</p>`,
    fr: `<p>Votre réservation pour ${escapeHtml(vars.service)} chez ${escapeHtml(vars.salon)} a été reprogrammée du ${new Date(vars.oldDate).toLocaleString("fr-CH", zurich)} au ${new Date(vars.newDate).toLocaleString("fr-CH", zurich)}.</p>`,
    it: `<p>La Sua prenotazione per ${escapeHtml(vars.service)} presso ${escapeHtml(vars.salon)} è stata riprogrammata dal ${new Date(vars.oldDate).toLocaleString("it-CH", zurich)} al ${new Date(vars.newDate).toLocaleString("it-CH", zurich)}.</p>`,
  };
  return { to, subject: subjects[locale], html: bodies[locale] };
}

/**
 * Salon-initiated upcharge REQUEST notification (SP-3 Endpoint 6). Sent to the customer
 * so they can approve or decline the extra charge; distinct from `upchargeChargedEmail`
 * in lib/email-templates/audit-notifications.ts, which fires only after the customer's
 * approved charge actually succeeds.
 *
 * All four locales (email-locales slice, 2026-09-04): app/api/bookings/[id]/dispute/route.ts
 * used to send this as one hardcoded "German | English" subject/body regardless of the
 * customer's own locale, so fr/it customers got German. The DE/EN wording below is the
 * pre-existing copy from that hardcoded call, split into separate locale entries; fr/it
 * are new translations in the same register and structure.
 */
export function upchargeRequestEmail(
  to: string,
  vars: { bookingId: string; upchargeUrl: string },
  locale: EmailLocale = "de"
): EmailPayload {
  const subjects: Record<EmailLocale, string> = {
    de: "Ein Salon hat einen Aufpreis angefragt",
    en: "A salon requested an additional charge",
    fr: "Un salon a demandé un supplément",
    it: "Un salone ha richiesto un supplemento",
  };
  const bodies: Record<EmailLocale, string> = {
    de: `<p>Der Salon hat für Buchung #${vars.bookingId} einen Aufpreis angefragt.</p><p>Sie müssen ausdrücklich zustimmen, bevor etwas berechnet wird. Wenn Sie nicht reagieren, passiert nichts.</p><p><a href="${vars.upchargeUrl}">Aufpreis prüfen und zustimmen oder ablehnen</a></p>`,
    en: `<p>The salon has requested an additional charge for booking #${vars.bookingId}.</p><p>You must explicitly agree before anything is charged. If you don't respond, nothing happens.</p><p><a href="${vars.upchargeUrl}">Review the additional charge and approve or decline</a></p>`,
    fr: `<p>Le salon a demandé un supplément pour la réservation #${vars.bookingId}.</p><p>Vous devez donner votre accord explicite avant que quoi que ce soit ne soit débité. Si vous ne répondez pas, rien ne se passe.</p><p><a href="${vars.upchargeUrl}">Vérifier le supplément et approuver ou refuser</a></p>`,
    it: `<p>Il salone ha richiesto un supplemento per la prenotazione #${vars.bookingId}.</p><p>Devi acconsentire esplicitamente prima che venga addebitato qualcosa. Se non rispondi, non succede nulla.</p><p><a href="${vars.upchargeUrl}">Verifica il supplemento e approva o rifiuta</a></p>`,
  };
  return { to, subject: subjects[locale], html: bodies[locale] };
}

/**
 * 24h / 1h booking reminder email.
 *
 * Was dead code (zero callers) until seo-comms-10 (2026-09-04): the owner asked for an
 * email reminder alongside the existing SMS one, customer-choosable via
 * profiles.notification_email / notification_sms. Called from
 * app/api/cron/sms-reminders/route.ts, the live reminder cron (never the deprecated
 * app/api/cron/reminders/route.ts stub).
 *
 * `window` picks the 24h ("tomorrow") vs 1h ("starting soon") copy, mirroring the two
 * distinct SMS bodies already sent by that cron. `date`/`time` are pre-formatted by the
 * caller (Europe/Zurich, the caller's Swiss locale), same convention as bookingConfirmation.
 */
export function bookingReminder(
  to: string,
  vars: { service: string; salon: string; date: string; time: string; manageUrl?: string; window: "24h" | "1h" },
  locale: EmailLocale = "de"
): EmailPayload {
  const subjects: Record<EmailLocale, Record<"24h" | "1h", string>> = {
    de: { "24h": `Erinnerung: ${vars.service} morgen um ${vars.time}`, "1h": `Erinnerung: ${vars.service} in 1 Stunde` },
    en: { "24h": `Reminder: ${vars.service} tomorrow at ${vars.time}`, "1h": `Reminder: ${vars.service} in 1 hour` },
    fr: { "24h": `Rappel: ${vars.service} demain à ${vars.time}`, "1h": `Rappel: ${vars.service} dans 1 heure` },
    it: { "24h": `Promemoria: ${vars.service} domani alle ${vars.time}`, "1h": `Promemoria: ${vars.service} tra 1 ora` },
  };

  // Same per-locale manage-link label as bookingConfirmation's CL constant.
  const manageLabels: Record<EmailLocale, string> = {
    de: "Buchung ansehen oder stornieren",
    en: "View or cancel booking",
    fr: "Voir ou annuler la réservation",
    it: "Visualizza o annulla la prenotazione",
  };
  const manageLabel = manageLabels[locale];
  const manageHtml = vars.manageUrl
    ? `<p style="margin-top:12px"><a href="${vars.manageUrl}">${manageLabel} →</a></p>`
    : "";

  const lead: Record<EmailLocale, Record<"24h" | "1h", string>> = {
    de: {
      "24h": `<strong>${escapeHtml(vars.service)}</strong> bei <strong>${escapeHtml(vars.salon)}</strong> am ${vars.date} um ${vars.time} Uhr ist morgen. Wir freuen uns auf Sie!`,
      "1h": `<strong>${escapeHtml(vars.service)}</strong> bei <strong>${escapeHtml(vars.salon)}</strong> beginnt in 1 Stunde, um ${vars.time} Uhr.`,
    },
    en: {
      "24h": `<strong>${escapeHtml(vars.service)}</strong> at <strong>${escapeHtml(vars.salon)}</strong> on ${vars.date} at ${vars.time} is tomorrow. See you there!`,
      "1h": `<strong>${escapeHtml(vars.service)}</strong> at <strong>${escapeHtml(vars.salon)}</strong> starts in 1 hour, at ${vars.time}.`,
    },
    fr: {
      "24h": `<strong>${escapeHtml(vars.service)}</strong> chez <strong>${escapeHtml(vars.salon)}</strong> le ${vars.date} à ${vars.time} est demain. À bientôt!`,
      "1h": `<strong>${escapeHtml(vars.service)}</strong> chez <strong>${escapeHtml(vars.salon)}</strong> commence dans 1 heure, à ${vars.time}.`,
    },
    it: {
      "24h": `<strong>${escapeHtml(vars.service)}</strong> presso <strong>${escapeHtml(vars.salon)}</strong> il ${vars.date} alle ${vars.time} è domani. A presto!`,
      "1h": `<strong>${escapeHtml(vars.service)}</strong> presso <strong>${escapeHtml(vars.salon)}</strong> inizia tra 1 ora, alle ${vars.time}.`,
    },
  };

  const greeting: Record<EmailLocale, string> = { de: "Hallo,", en: "Hello,", fr: "Bonjour,", it: "Ciao," };

  const bodies: Record<EmailLocale, string> = {
    de: `<p>${greeting.de}</p><p>${lead.de[vars.window]}</p>${manageHtml}<p>solen.ch</p>`,
    en: `<p>${greeting.en}</p><p>${lead.en[vars.window]}</p>${manageHtml}<p>solen.ch</p>`,
    fr: `<p>${greeting.fr}</p><p>${lead.fr[vars.window]}</p>${manageHtml}<p>solen.ch</p>`,
    it: `<p>${greeting.it}</p><p>${lead.it[vars.window]}</p>${manageHtml}<p>solen.ch</p>`,
  };

  return { to, subject: subjects[locale][vars.window], html: bodies[locale] };
}

export function recurringConfirmation(
  to: string,
  vars: { frequency: string; service: string; salon: string },
  locale: EmailLocale = "de"
): EmailPayload {
  const subjects: Record<EmailLocale, string> = {
    de: `Serienbuchung eingerichtet: ${vars.service} bei ${vars.salon}`,
    en: `Recurring booking set up: ${vars.service} at ${vars.salon}`,
    fr: `Abonnement configuré: ${vars.service} chez ${vars.salon}`,
    it: `Prenotazione ricorrente impostata: ${vars.service} presso ${vars.salon}`,
  };
  const bodies: Record<EmailLocale, string> = {
    de: `<p>Ihre ${vars.frequency} Serienbuchung für <strong>${escapeHtml(vars.service)}</strong> bei <strong>${escapeHtml(vars.salon)}</strong> ist eingerichtet.</p>`,
    en: `<p>Your ${vars.frequency} recurring booking for <strong>${escapeHtml(vars.service)}</strong> at <strong>${escapeHtml(vars.salon)}</strong> has been set up.</p>`,
    fr: `<p>Votre abonnement ${vars.frequency} pour <strong>${escapeHtml(vars.service)}</strong> chez <strong>${escapeHtml(vars.salon)}</strong> a été configuré.</p>`,
    it: `<p>La Sua prenotazione ricorrente ${vars.frequency} per <strong>${escapeHtml(vars.service)}</strong> presso <strong>${escapeHtml(vars.salon)}</strong> è stata impostata.</p>`,
  };
  return { to, subject: subjects[locale], html: bodies[locale] };
}

export function recurringFailed(
  to: string,
  vars: { service: string; salon: string; date: string },
  locale: EmailLocale = "de"
): EmailPayload {
  const subjects: Record<EmailLocale, string> = {
    de: `Serienbuchung fehlgeschlagen: ${vars.service} am ${vars.date}`,
    en: `Recurring booking failed: ${vars.service} on ${vars.date}`,
    fr: `Abonnement échoué: ${vars.service} le ${vars.date}`,
    it: `Prenotazione ricorrente fallita: ${vars.service} il ${vars.date}`,
  };
  const bodies: Record<EmailLocale, string> = {
    de: `<p>Wir konnten <strong>${escapeHtml(vars.service)}</strong> bei ${escapeHtml(vars.salon)} für ${vars.date} nicht automatisch buchen. Der Zeitslot ist nicht verfügbar. Bitte buchen Sie manuell auf <a href="https://solen.ch">solen.ch</a>.</p>`,
    en: `<p>We couldn't auto-book <strong>${escapeHtml(vars.service)}</strong> at ${escapeHtml(vars.salon)} for ${vars.date}. The time slot is not available. Please rebook manually at <a href="https://solen.ch">solen.ch</a>.</p>`,
    fr: `<p>Nous n'avons pas pu réserver automatiquement <strong>${escapeHtml(vars.service)}</strong> chez ${escapeHtml(vars.salon)} pour le ${vars.date}. Le créneau n'est pas disponible. Veuillez réserver manuellement sur <a href="https://solen.ch">solen.ch</a>.</p>`,
    it: `<p>Non è stato possibile prenotare automaticamente <strong>${escapeHtml(vars.service)}</strong> presso ${escapeHtml(vars.salon)} per il ${vars.date}. Lo slot non è disponibile. Si prega di prenotare manualmente su <a href="https://solen.ch">solen.ch</a>.</p>`,
  };
  return { to, subject: subjects[locale], html: bodies[locale] };
}

export function salonNewBooking(
  to: string,
  vars: { customerName: string; service: string; date: string; time: string; price: number },
  locale: EmailLocale = "de"
): EmailPayload {
  const subjects: Record<EmailLocale, string> = {
    de: `Neue Buchung: ${vars.service} am ${vars.date}`,
    en: `New booking: ${vars.service} on ${vars.date}`,
    fr: `Nouvelle réservation: ${vars.service} le ${vars.date}`,
    it: `Nuova prenotazione: ${vars.service} il ${vars.date}`,
  };
  const bodies: Record<EmailLocale, string> = {
    de: `<p>Hallo,</p><p>Sie haben eine neue Buchung erhalten:</p><ul><li><strong>Kunde:</strong> ${escapeHtml(vars.customerName)}</li><li><strong>Service:</strong> ${escapeHtml(vars.service)}</li><li><strong>Datum:</strong> ${vars.date} um ${vars.time} Uhr</li><li><strong>Preis:</strong> CHF ${vars.price.toFixed(2)}</li></ul><p>Bitte loggen Sie sich in Ihr Dashboard auf <a href="https://solen.ch">solen.ch</a> ein.</p>`,
    en: `<p>Hello,</p><p>You have received a new booking:</p><ul><li><strong>Customer:</strong> ${escapeHtml(vars.customerName)}</li><li><strong>Service:</strong> ${escapeHtml(vars.service)}</li><li><strong>Date:</strong> ${vars.date} at ${vars.time}</li><li><strong>Price:</strong> CHF ${vars.price.toFixed(2)}</li></ul><p>Please log in to your dashboard at <a href="https://solen.ch">solen.ch</a>.</p>`,
    fr: `<p>Bonjour,</p><p>Vous avez reçu une nouvelle réservation:</p><ul><li><strong>Client:</strong> ${escapeHtml(vars.customerName)}</li><li><strong>Service:</strong> ${escapeHtml(vars.service)}</li><li><strong>Date:</strong> ${vars.date} à ${vars.time}</li><li><strong>Prix:</strong> CHF ${vars.price.toFixed(2)}</li></ul><p>Connectez-vous à votre tableau de bord sur <a href="https://solen.ch">solen.ch</a>.</p>`,
    it: `<p>Ciao,</p><p>Ha ricevuto una nuova prenotazione:</p><ul><li><strong>Cliente:</strong> ${escapeHtml(vars.customerName)}</li><li><strong>Servizio:</strong> ${escapeHtml(vars.service)}</li><li><strong>Data:</strong> ${vars.date} alle ${vars.time}</li><li><strong>Prezzo:</strong> CHF ${vars.price.toFixed(2)}</li></ul><p>Acceda alla Sua dashboard su <a href="https://solen.ch">solen.ch</a>.</p>`,
  };
  return { to, subject: subjects[locale], html: bodies[locale] };
}

export function salonVerificationRequest(
  to: string,
  vars: { salon: string; confirmUrl: string },
  locale: EmailLocale = "de"
): EmailPayload {
  const subjects: Record<EmailLocale, string> = {
    de: `Ist Ihr Salon noch aktiv? Bitte bestätigen`,
    en: `Is your salon still active? Please confirm`,
    fr: `Votre salon est-il toujours actif? Veuillez confirmer`,
    it: `Il Suo salone è ancora attivo? Confermi`,
  };
  const bodies: Record<EmailLocale, string> = {
    de: `<p>Hallo,</p><p>Ist <strong>${escapeHtml(vars.salon)}</strong> noch aktiv auf solen.ch? Bitte klicken Sie auf den Link, um zu bestätigen:</p><p><a href="${vars.confirmUrl}">Salon bestätigen</a></p>`,
    en: `<p>Hello,</p><p>Is <strong>${escapeHtml(vars.salon)}</strong> still active on solen.ch? Please click the link to confirm:</p><p><a href="${vars.confirmUrl}">Confirm salon</a></p>`,
    fr: `<p>Bonjour,</p><p><strong>${escapeHtml(vars.salon)}</strong> est-il toujours actif sur solen.ch? Veuillez cliquer sur le lien pour confirmer:</p><p><a href="${vars.confirmUrl}">Confirmer le salon</a></p>`,
    it: `<p>Ciao,</p><p><strong>${escapeHtml(vars.salon)}</strong> è ancora attivo su solen.ch? Clicchi il link per confermare:</p><p><a href="${vars.confirmUrl}">Conferma salone</a></p>`,
  };
  return { to, subject: subjects[locale], html: bodies[locale] };
}

export function salonVerificationWarning(
  to: string,
  vars: { salon: string; confirmUrl: string; warningNum: number },
  locale: EmailLocale = "de"
): EmailPayload {
  const subjects: Record<EmailLocale, string> = {
    de: `Warnung ${vars.warningNum}/3: Bitte bestätigen Sie Ihren Salon`,
    en: `Warning ${vars.warningNum}/3: Please confirm your salon`,
    fr: `Avertissement ${vars.warningNum}/3: Veuillez confirmer votre salon`,
    it: `Avviso ${vars.warningNum}/3: Confermi il Suo salone`,
  };
  const bodies: Record<EmailLocale, string> = {
    de: `<p>Warnung ${vars.warningNum} von 3: <strong>${escapeHtml(vars.salon)}</strong> wurde noch nicht bestätigt. Bitte bestätigen Sie jetzt, sonst wird Ihr Salon eingefroren: <a href="${vars.confirmUrl}">Jetzt bestätigen</a></p>`,
    en: `<p>Warning ${vars.warningNum} of 3: <strong>${escapeHtml(vars.salon)}</strong> has not been confirmed. Please confirm now or your salon will be frozen: <a href="${vars.confirmUrl}">Confirm now</a></p>`,
    fr: `<p>Avertissement ${vars.warningNum} sur 3: <strong>${escapeHtml(vars.salon)}</strong> n'a pas été confirmé. Veuillez confirmer maintenant ou votre salon sera suspendu: <a href="${vars.confirmUrl}">Confirmer maintenant</a></p>`,
    it: `<p>Avviso ${vars.warningNum} di 3: <strong>${escapeHtml(vars.salon)}</strong> non è stato confermato. Confermi ora o il Suo salone verrà sospeso: <a href="${vars.confirmUrl}">Conferma ora</a></p>`,
  };
  return { to, subject: subjects[locale], html: bodies[locale] };
}

export function salonFrozen(
  to: string,
  vars: { salon: string },
  locale: EmailLocale = "de"
): EmailPayload {
  const subjects: Record<EmailLocale, string> = {
    de: `Ihr Salon wurde aufgrund von Inaktivität gesperrt`,
    en: `Your salon has been frozen due to inactivity`,
    fr: `Votre salon a été suspendu pour inactivité`,
    it: `Il Suo salone è stato sospeso per inattività`,
  };
  const bodies: Record<EmailLocale, string> = {
    de: `<p><strong>${escapeHtml(vars.salon)}</strong> wurde auf solen.ch wegen Inaktivität gesperrt. Um Ihren Salon wieder zu aktivieren, kontaktieren Sie uns unter support@solen.ch.</p>`,
    en: `<p><strong>${escapeHtml(vars.salon)}</strong> has been frozen on solen.ch due to inactivity. To reactivate, contact us at support@solen.ch.</p>`,
    fr: `<p><strong>${escapeHtml(vars.salon)}</strong> a été suspendu sur solen.ch pour inactivité. Pour réactiver, contactez-nous à support@solen.ch.</p>`,
    it: `<p><strong>${escapeHtml(vars.salon)}</strong> è stato sospeso su solen.ch per inattività. Per riattivare, ci contatti a support@solen.ch.</p>`,
  };
  return { to, subject: subjects[locale], html: bodies[locale] };
}

export function customerBookingSuspended(
  to: string,
  vars: { salon: string; service: string; date: string },
  locale: EmailLocale = "de"
): EmailPayload {
  const subjects: Record<EmailLocale, string> = {
    de: `Ihre Buchung bei ${vars.salon} wurde storniert`,
    en: `Your booking at ${vars.salon} has been suspended`,
    fr: `Votre réservation chez ${vars.salon} a été annulée`,
    it: `La Sua prenotazione presso ${vars.salon} è stata cancellata`,
  };
  const bodies: Record<EmailLocale, string> = {
    de: `<p>Ihre Buchung für <strong>${escapeHtml(vars.service)}</strong> bei <strong>${escapeHtml(vars.salon)}</strong> am ${vars.date} wurde storniert, da der Salon nicht mehr aktiv ist. Es tut uns leid für die Unannehmlichkeiten.</p>`,
    en: `<p>Your booking for <strong>${escapeHtml(vars.service)}</strong> at <strong>${escapeHtml(vars.salon)}</strong> on ${vars.date} has been cancelled because the salon is no longer active. We apologise for the inconvenience.</p>`,
    fr: `<p>Votre réservation pour <strong>${escapeHtml(vars.service)}</strong> chez <strong>${escapeHtml(vars.salon)}</strong> le ${vars.date} a été annulée car le salon n'est plus actif. Nous nous excusons pour la gêne occasionnée.</p>`,
    it: `<p>La Sua prenotazione per <strong>${escapeHtml(vars.service)}</strong> presso <strong>${escapeHtml(vars.salon)}</strong> il ${vars.date} è stata cancellata perché il salone non è più attivo. Ci scusiamo per l'inconveniente.</p>`,
  };
  return { to, subject: subjects[locale], html: bodies[locale] };
}

export function salonApproved(
  to: string,
  vars: { salon: string },
  locale: EmailLocale = "de"
): EmailPayload {
  const subjects: Record<EmailLocale, string> = {
    de: `Ihr Salon ist jetzt live auf solen.ch!`,
    en: `Your salon is now live on solen.ch!`,
    fr: `Votre salon est maintenant en ligne sur solen.ch !`,
    it: `Il Suo salone è ora live su solen.ch!`,
  };
  const bodies: Record<EmailLocale, string> = {
    de: `<p>Hallo,</p><p>Gute Neuigkeiten! <strong>${escapeHtml(vars.salon)}</strong> wurde genehmigt und ist ab sofort auf <a href="https://solen.ch">solen.ch</a> für Buchungen verfügbar.</p><p>Kunden können Sie jetzt finden und buchen. Viel Erfolg!</p><p>Das solen.ch Team</p>`,
    en: `<p>Hello,</p><p>Great news! <strong>${escapeHtml(vars.salon)}</strong> has been approved and is now live on <a href="https://solen.ch">solen.ch</a> for bookings.</p><p>Customers can now find and book you. Good luck!</p><p>The solen.ch team</p>`,
    fr: `<p>Bonjour,</p><p>Bonne nouvelle ! <strong>${escapeHtml(vars.salon)}</strong> a été approuvé et est désormais disponible sur <a href="https://solen.ch">solen.ch</a> pour les réservations.</p><p>Les clients peuvent maintenant vous trouver et vous réserver. Bonne chance !</p><p>L'équipe solen.ch</p>`,
    it: `<p>Ciao,</p><p>Ottime notizie! <strong>${escapeHtml(vars.salon)}</strong> è stato approvato ed è ora disponibile su <a href="https://solen.ch">solen.ch</a> per le prenotazioni.</p><p>I clienti possono ora trovarLa e prenotare. In bocca al lupo!</p><p>Il team solen.ch</p>`,
  };
  return { to, subject: subjects[locale], html: bodies[locale] };
}

export function salonRejected(
  to: string,
  vars: { salon: string; reason: string },
  locale: EmailLocale = "de"
): EmailPayload {
  const subjects: Record<EmailLocale, string> = {
    de: `Ihr Salon wurde leider nicht genehmigt`,
    en: `Your salon application was not approved`,
    fr: `Votre demande de salon n'a pas été approuvée`,
    it: `La Sua richiesta di salone non è stata approvata`,
  };
  const bodies: Record<EmailLocale, string> = {
    de: `<p>Hallo,</p><p>Leider konnten wir <strong>${escapeHtml(vars.salon)}</strong> aktuell nicht genehmigen.</p><p><strong>Grund:</strong> ${escapeHtml(vars.reason)}</p><p>Bei Fragen wenden Sie sich an <a href="mailto:support@solen.ch">support@solen.ch</a>.</p><p>Das solen.ch Team</p>`,
    en: `<p>Hello,</p><p>Unfortunately we were unable to approve <strong>${escapeHtml(vars.salon)}</strong> at this time.</p><p><strong>Reason:</strong> ${escapeHtml(vars.reason)}</p><p>If you have questions, contact <a href="mailto:support@solen.ch">support@solen.ch</a>.</p><p>The solen.ch team</p>`,
    fr: `<p>Bonjour,</p><p>Malheureusement, nous n'avons pas pu approuver <strong>${escapeHtml(vars.salon)}</strong> pour le moment.</p><p><strong>Raison :</strong> ${escapeHtml(vars.reason)}</p><p>Pour toute question, contactez <a href="mailto:support@solen.ch">support@solen.ch</a>.</p><p>L'équipe solen.ch</p>`,
    it: `<p>Ciao,</p><p>Purtroppo non è stato possibile approvare <strong>${escapeHtml(vars.salon)}</strong> al momento.</p><p><strong>Motivo:</strong> ${escapeHtml(vars.reason)}</p><p>Per domande, contatti <a href="mailto:support@solen.ch">support@solen.ch</a>.</p><p>Il team solen.ch</p>`,
  };
  return { to, subject: subjects[locale], html: bodies[locale] };
}

export function adminNewSalonNotification(
  to: string,
  vars: { salon: string; email: string; address: string }
): EmailPayload {
  return {
    to,
    subject: `Neuer Salon wartet auf Genehmigung: ${vars.salon}`,
    html: `<p>Ein neuer Salon hat sich registriert und wartet auf Genehmigung:</p><ul><li><strong>Name:</strong> ${escapeHtml(vars.salon)}</li><li><strong>E-Mail:</strong> ${escapeHtml(vars.email)}</li><li><strong>Adresse:</strong> ${escapeHtml(vars.address)}</li></ul><p><a href="https://solen.ch/de/dashboard/approvals">Jetzt prüfen →</a></p>`,
  };
}

/**
 * Internal team alert for a new partner-page lead (app/api/partner/leads). Goes to
 * ADMIN_EMAIL only, never to the lead, so like adminNewSalonNotification it is German-only.
 */
export function adminPartnerLeadNotification(
  to: string,
  vars: { salon: string; email: string }
): EmailPayload {
  return {
    to,
    subject: `Neuer Partner-Lead: ${vars.salon}`,
    html: `<p>Über die Partnerseite ist ein neuer Lead eingegangen:</p><ul><li><strong>Salon:</strong> ${escapeHtml(vars.salon)}</li><li><strong>E-Mail:</strong> ${escapeHtml(vars.email)}</li></ul>`,
  };
}

// async: unsubscribeToken() now runs on Web Crypto (crypto.subtle), which is async in every
// runtime (see lib/unsubscribe-token.ts). Both callers were updated to await this: the
// "salon-outreach-invitation" entry in lib/email-preview-samples.ts, and the
// /dev/emails page (app/[locale]/dev/emails/page.tsx) that resolves it before rendering.
export async function salonOutreachInvitation(
  to: string,
  vars: { salonName: string; claimUrl: string }
): Promise<EmailPayload> {
  const unsubToken = await unsubscribeToken(to);
  return {
    to,
    subject: `${vars.salonName} ist jetzt auf solen.ch gelistet — kostenlos Buchungen aktivieren`,
    html: `
      <p>Guten Tag,</p>
      <p>Ihr Salon <strong>${escapeHtml(vars.salonName)}</strong> ist ab sofort auf <a href="https://solen.ch">solen.ch</a> gelistet — dem führenden Beauty-Buchungsportal der Region Basel.</p>
      <p>Kunden können Ihren Salon bereits finden und Ihre Kontaktdaten einsehen. Wenn Sie Online-Buchungen aktivieren möchten, können Sie Ihren Salon kostenlos beanspruchen:</p>
      <p><a href="${vars.claimUrl}" style="display:inline-block;padding:12px 24px;background:${EMAIL_COLORS.ink};color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Salon jetzt beanspruchen →</a></p>
      <p>Vorteile:</p>
      <ul>
        <li>Online-Buchungen 24/7 entgegennehmen</li>
        <li>Direktnachrichten von Kunden erhalten</li>
        <li>Kostenlos — keine Grundgebühr</li>
      </ul>
      <p>Bei Fragen: <a href="mailto:support@solen.ch">support@solen.ch</a></p>
      <p style="font-size:11px;color:${EMAIL_COLORS.ink2};margin-top:32px">
        solen.ch · Booking platform Basel ·
        <a href="https://solen.ch/unsubscribe?email=${encodeURIComponent(to)}&t=${unsubToken}" style="color:${EMAIL_COLORS.ink2}">Abmelden</a>
        · Diese E-Mail wurde an ${to} gesendet, da Ihr Salon öffentlich gelistet ist (nDSG Art. 31).
      </p>
    `,
  };
}

export function newMessageNotification(
  to: string,
  vars: { sender?: string; senderName?: string; preview?: string; conversationUrl?: string },
  locale: EmailLocale = "de"
): EmailPayload {
  const name = vars.senderName ?? vars.sender ?? "Jemand";
  const nameHtml = escapeHtml(name);
  const link = vars.conversationUrl ?? "https://solen.ch";
  const previewLine = vars.preview ? `<p style="color:${EMAIL_COLORS.ink2};font-style:italic">"${escapeHtml(vars.preview)}"</p>` : "";
  const subjects: Record<EmailLocale, string> = {
    de: `Neue Nachricht von ${name}`,
    en: `New message from ${name}`,
    fr: `Nouveau message de ${name}`,
    it: `Nuovo messaggio da ${name}`,
  };
  const bodies: Record<EmailLocale, string> = {
    de: `<p><strong>${nameHtml}</strong> hat Ihnen eine Nachricht auf solen.ch gesendet.</p>${previewLine}<p><a href="${link}">Nachricht lesen →</a></p>`,
    en: `<p><strong>${nameHtml}</strong> sent you a message on solen.ch.</p>${previewLine}<p><a href="${link}">Read message →</a></p>`,
    fr: `<p><strong>${nameHtml}</strong> vous a envoyé un message sur solen.ch.</p>${previewLine}<p><a href="${link}">Lire le message →</a></p>`,
    it: `<p><strong>${nameHtml}</strong> Le ha inviato un messaggio su solen.ch.</p>${previewLine}<p><a href="${link}">Leggi messaggio →</a></p>`,
  };
  return { to, subject: subjects[locale], html: bodies[locale] };
}

// ---------------------------------------------------------------------------
// Re-booking nudge
// ---------------------------------------------------------------------------

export function rebookingNudge(
  to: string,
  vars: { service: string; salon: string; daysSince: number },
  locale: EmailLocale = "de"
): EmailPayload {
  const subjects: Record<EmailLocale, string> = {
    de: `Zeit für einen neuen Termin bei ${vars.salon}?`,
    en: `Time for a new appointment at ${vars.salon}?`,
    fr: `Prêt(e) pour un nouveau rendez-vous chez ${vars.salon} ?`,
    it: `È ora di un nuovo appuntamento da ${vars.salon}?`,
  };
  const bodies: Record<EmailLocale, string> = {
    de: `<p>Dein letzter <strong>${escapeHtml(vars.service)}</strong>-Termin bei <strong>${escapeHtml(vars.salon)}</strong> war vor ${vars.daysSince} Tagen.</p><p><a href="https://solen.ch">Neuen Termin buchen →</a></p>`,
    en: `<p>Your last <strong>${escapeHtml(vars.service)}</strong> appointment at <strong>${escapeHtml(vars.salon)}</strong> was ${vars.daysSince} days ago.</p><p><a href="https://solen.ch">Book a new appointment →</a></p>`,
    fr: `<p>Votre dernier rendez-vous <strong>${escapeHtml(vars.service)}</strong> chez <strong>${escapeHtml(vars.salon)}</strong> remonte à ${vars.daysSince} jours.</p><p><a href="https://solen.ch">Réserver un nouveau rendez-vous →</a></p>`,
    it: `<p>Il tuo ultimo appuntamento <strong>${escapeHtml(vars.service)}</strong> presso <strong>${escapeHtml(vars.salon)}</strong> risale a ${vars.daysSince} giorni fa.</p><p><a href="https://solen.ch">Prenota un nuovo appuntamento →</a></p>`,
  };
  return { to, subject: subjects[locale], html: bodies[locale] };
}

// ---------------------------------------------------------------------------
// Review prompt
// ---------------------------------------------------------------------------

export function reviewPrompt(
  to: string,
  vars: { service: string; salon: string; reviewUrl: string },
  locale: EmailLocale = "de"
): EmailPayload {
  const subjects: Record<EmailLocale, string> = {
    de: `Wie war Ihr Besuch bei ${vars.salon}?`,
    en: `How was your visit at ${vars.salon}?`,
    fr: `Comment était votre visite chez ${vars.salon} ?`,
    it: `Com'è stata la Sua visita da ${vars.salon}?`,
  };
  const bodies: Record<EmailLocale, string> = {
    de: `<p>Vielen Dank für Ihren <strong>${escapeHtml(vars.service)}</strong>-Termin bei <strong>${escapeHtml(vars.salon)}</strong>!</p><p>Helfen Sie anderen Kunden und teilen Sie Ihre Erfahrung.</p><p><a href="${vars.reviewUrl}">Bewertung schreiben →</a></p>`,
    en: `<p>Thanks for your <strong>${escapeHtml(vars.service)}</strong> appointment at <strong>${escapeHtml(vars.salon)}</strong>!</p><p>Help other customers by sharing your experience.</p><p><a href="${vars.reviewUrl}">Write a review →</a></p>`,
    fr: `<p>Merci pour votre rendez-vous <strong>${escapeHtml(vars.service)}</strong> chez <strong>${escapeHtml(vars.salon)}</strong> !</p><p>Aidez les autres clients en partageant votre expérience.</p><p><a href="${vars.reviewUrl}">Écrire un avis →</a></p>`,
    it: `<p>Grazie per il Suo appuntamento <strong>${escapeHtml(vars.service)}</strong> presso <strong>${escapeHtml(vars.salon)}</strong>!</p><p>Aiuti gli altri clienti condividendo la Sua esperienza.</p><p><a href="${vars.reviewUrl}">Scrivi una recensione →</a></p>`,
  };
  return { to, subject: subjects[locale], html: bodies[locale] };
}

// ---------------------------------------------------------------------------
// Welcome series (3 steps)
// ---------------------------------------------------------------------------

export function welcomeEmail(
  to: string,
  vars: { name: string },
  locale: EmailLocale = "de",
  // NARROWED from `1 | 2 | 3` on 2026-08-15, found by the new /dev/emails preview: every
  // locale array below holds TWO entries, so step 3 read undefined and threw a TypeError
  // on `s.subject`, taking the whole send with it. The third step was never written. The
  // type was widened when the 3-step onboarding wizard landed (adcd252e2) and the body
  // never followed; the job then moved to lib/email-templates/welcome-series.ts
  // (welcomeDay0/3/7), which is what /api/cron/welcome-series actually calls. So this is
  // superseded, not lost: do NOT invent a third body. Narrowing turns a runtime crash
  // into a compile error. No production caller exists today (grepped app/ and lib/).
  step: 1 | 2 = 1
): EmailPayload {
  const steps: Record<EmailLocale, { subject: string; html: string }[]> = {
    de: [
      { subject: `Willkommen bei solen.ch, ${vars.name}!`, html: `<p>Hallo <strong>${escapeHtml(vars.name)}</strong>,</p><p>Willkommen bei solen.ch, Ihrer Plattform für Beauty & Wellness in Basel.</p><p><a href="https://solen.ch">Entdecken Sie Salons in Ihrer Nähe →</a></p>` },
      { subject: `Ihr Profil vervollständigen`, html: `<p>Vervollständigen Sie Ihr Profil, um personalisierte Empfehlungen zu erhalten und schneller zu buchen.</p><p><a href="https://solen.ch/de/account">Profil bearbeiten →</a></p>` },
    ],
    en: [
      { subject: `Welcome to solen.ch, ${vars.name}!`, html: `<p>Hello <strong>${escapeHtml(vars.name)}</strong>,</p><p>Welcome to solen.ch, your beauty & wellness platform in Basel.</p><p><a href="https://solen.ch/en/search">Discover salons near you →</a></p>` },
      { subject: `Complete your profile`, html: `<p>Complete your profile to get personalized recommendations and faster bookings.</p><p><a href="https://solen.ch/en/account">Edit profile →</a></p>` },
    ],
    fr: [
      { subject: `Bienvenue sur solen.ch, ${vars.name} !`, html: `<p>Bonjour <strong>${escapeHtml(vars.name)}</strong>,</p><p>Bienvenue sur solen.ch, votre plateforme beauté & bien-être à Bâle.</p><p><a href="https://solen.ch/fr/search">Découvrir les salons →</a></p>` },
      { subject: `Complétez votre profil`, html: `<p>Complétez votre profil pour des recommandations personnalisées.</p><p><a href="https://solen.ch/fr/account">Modifier le profil →</a></p>` },
    ],
    it: [
      { subject: `Benvenuto su solen.ch, ${vars.name}!`, html: `<p>Ciao <strong>${escapeHtml(vars.name)}</strong>,</p><p>Benvenuto su solen.ch, la Sua piattaforma beauty & wellness a Basilea.</p><p><a href="https://solen.ch">Scopri i saloni vicini →</a></p>` },
      { subject: `Completi il Suo profilo`, html: `<p>Completi il Suo profilo per raccomandazioni personalizzate.</p><p><a href="https://solen.ch/it/account">Modifica profilo →</a></p>` },
    ],
  };
  const s = steps[locale]?.[step - 1] ?? steps.de[step - 1];
  return { to, subject: s.subject, html: s.html };
}

// ---------------------------------------------------------------------------
// Walk-in payment email
// ---------------------------------------------------------------------------

export function walkInPaymentEmail(
  to: string,
  vars: { customerName: string; salonName: string; serviceName: string; paymentUrl: string; amount: string },
  locale: EmailLocale = "de"
): EmailPayload {
  const subjects: Record<EmailLocale, string> = {
    de: `Zahlung für ${vars.serviceName} bei ${vars.salonName}`,
    en: `Payment for ${vars.serviceName} at ${vars.salonName}`,
    fr: `Paiement pour ${vars.serviceName} chez ${vars.salonName}`,
    it: `Pagamento per ${vars.serviceName} presso ${vars.salonName}`,
  };
  const bodies: Record<EmailLocale, string> = {
    de: `<p>Hallo ${escapeHtml(vars.customerName)},</p><p>Bitte bezahlen Sie <strong>${vars.amount}</strong> für <strong>${escapeHtml(vars.serviceName)}</strong> bei <strong>${escapeHtml(vars.salonName)}</strong>:</p><p><a href="${vars.paymentUrl}" style="display:inline-block;padding:12px 24px;background:#0A0A0A;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Jetzt bezahlen →</a></p><p>solen.ch</p>`,
    en: `<p>Hello ${escapeHtml(vars.customerName)},</p><p>Please pay <strong>${vars.amount}</strong> for <strong>${escapeHtml(vars.serviceName)}</strong> at <strong>${escapeHtml(vars.salonName)}</strong>:</p><p><a href="${vars.paymentUrl}" style="display:inline-block;padding:12px 24px;background:#0A0A0A;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Pay now →</a></p><p>solen.ch</p>`,
    fr: `<p>Bonjour ${escapeHtml(vars.customerName)},</p><p>Veuillez payer <strong>${vars.amount}</strong> pour <strong>${escapeHtml(vars.serviceName)}</strong> chez <strong>${escapeHtml(vars.salonName)}</strong> :</p><p><a href="${vars.paymentUrl}" style="display:inline-block;padding:12px 24px;background:#0A0A0A;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Payer maintenant →</a></p><p>solen.ch</p>`,
    it: `<p>Ciao ${escapeHtml(vars.customerName)},</p><p>Si prega di pagare <strong>${vars.amount}</strong> per <strong>${escapeHtml(vars.serviceName)}</strong> presso <strong>${escapeHtml(vars.salonName)}</strong>:</p><p><a href="${vars.paymentUrl}" style="display:inline-block;padding:12px 24px;background:#0A0A0A;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Paga ora →</a></p><p>solen.ch</p>`,
  };
  return { to, subject: subjects[locale], html: bodies[locale] };
}

// ---------------------------------------------------------------------------
// Tip prompt email
// ---------------------------------------------------------------------------

export function tipPromptEmail(
  to: string,
  vars: { customerName: string; stylistName: string; stylistPhoto: string; tipUrl: string },
  locale: EmailLocale = "de"
): EmailPayload {
  const photoHtml = vars.stylistPhoto
    ? `<img src="${vars.stylistPhoto}" alt="${escapeHtml(vars.stylistName)}" style="width:64px;height:64px;border-radius:50%;object-fit:cover;margin:12px auto;display:block" />`
    : "";
  const subjects: Record<EmailLocale, string> = {
    de: `Trinkgeld für ${vars.stylistName}?`,
    en: `Leave a tip for ${vars.stylistName}?`,
    fr: `Pourboire pour ${vars.stylistName} ?`,
    it: `Mancia per ${vars.stylistName}?`,
  };
  const bodies: Record<EmailLocale, string> = {
    de: `<p>Hallo ${escapeHtml(vars.customerName)},</p><p>Waren Sie zufrieden mit Ihrem Termin? Hinterlassen Sie ein Trinkgeld für <strong>${escapeHtml(vars.stylistName)}</strong>!</p>${photoHtml}<p><a href="${vars.tipUrl}" style="display:inline-block;padding:12px 24px;background:#0A0A0A;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Trinkgeld geben →</a></p>`,
    en: `<p>Hello ${escapeHtml(vars.customerName)},</p><p>Happy with your appointment? Leave a tip for <strong>${escapeHtml(vars.stylistName)}</strong>!</p>${photoHtml}<p><a href="${vars.tipUrl}" style="display:inline-block;padding:12px 24px;background:#0A0A0A;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Leave a tip →</a></p>`,
    fr: `<p>Bonjour ${escapeHtml(vars.customerName)},</p><p>Satisfait(e) de votre rendez-vous ? Laissez un pourboire à <strong>${escapeHtml(vars.stylistName)}</strong> !</p>${photoHtml}<p><a href="${vars.tipUrl}" style="display:inline-block;padding:12px 24px;background:#0A0A0A;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Laisser un pourboire →</a></p>`,
    it: `<p>Ciao ${escapeHtml(vars.customerName)},</p><p>Soddisfatto del Suo appuntamento? Lasci una mancia a <strong>${escapeHtml(vars.stylistName)}</strong>!</p>${photoHtml}<p><a href="${vars.tipUrl}" style="display:inline-block;padding:12px 24px;background:#0A0A0A;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Lascia una mancia →</a></p>`,
  };
  return { to, subject: subjects[locale], html: bodies[locale] };
}

// ---------------------------------------------------------------------------
// Birthday email
// ---------------------------------------------------------------------------

export function birthdayEmail(
  to: string,
  vars: { customerName: string; salonName: string },
  locale: EmailLocale = "de"
): EmailPayload {
  const subjects: Record<EmailLocale, string> = {
    de: `Alles Gute zum Geburtstag, ${vars.customerName}!`,
    en: `Happy Birthday, ${vars.customerName}!`,
    fr: `Joyeux anniversaire, ${vars.customerName} !`,
    it: `Buon compleanno, ${vars.customerName}!`,
  };
  const bodies: Record<EmailLocale, string> = {
    de: `<p>Hallo ${escapeHtml(vars.customerName)},</p><p>Alles Gute zum Geburtstag! <strong>${escapeHtml(vars.salonName)}</strong> wünscht Ihnen einen wunderbaren Tag.</p><p>Gönnen Sie sich etwas Besonderes. Buchen Sie Ihren nächsten Termin mit einem Geburtstagsrabatt!</p><p><a href="https://solen.ch">Jetzt buchen →</a></p>`,
    en: `<p>Hello ${escapeHtml(vars.customerName)},</p><p>Happy Birthday! <strong>${escapeHtml(vars.salonName)}</strong> wishes you a wonderful day.</p><p>Treat yourself. Book your next appointment with a birthday discount!</p><p><a href="https://solen.ch">Book now →</a></p>`,
    fr: `<p>Bonjour ${escapeHtml(vars.customerName)},</p><p>Joyeux anniversaire ! <strong>${escapeHtml(vars.salonName)}</strong> vous souhaite une merveilleuse journée.</p><p>Faites-vous plaisir. Réservez votre prochain rendez-vous avec une réduction d'anniversaire !</p><p><a href="https://solen.ch">Réserver →</a></p>`,
    it: `<p>Buongiorno ${escapeHtml(vars.customerName)},</p><p>Buon compleanno! <strong>${escapeHtml(vars.salonName)}</strong> Le augura una splendida giornata.</p><p>Si conceda qualcosa di speciale. Prenoti il Suo prossimo appuntamento con uno sconto di compleanno!</p><p><a href="https://solen.ch">Prenota ora →</a></p>`,
  };
  return { to, subject: subjects[locale], html: bodies[locale] };
}

// ---------------------------------------------------------------------------
// Gift card delivery email
// ---------------------------------------------------------------------------

export function giftCardDeliveryEmail(
  to: string,
  vars: { recipientName: string; senderName: string; amount: string; code: string; message?: string },
  locale: EmailLocale = "de"
): EmailPayload {
  const msgHtml = vars.message ? `<p style="background:${EMAIL_COLORS.bgSunken};padding:12px;border-radius:8px;font-style:italic;margin:16px 0">"${escapeHtml(vars.message)}"</p>` : "";
  const subjects: Record<EmailLocale, string> = {
    de: `${vars.senderName} hat Ihnen eine Geschenkkarte geschickt!`,
    en: `${vars.senderName} sent you a gift card!`,
    fr: `${vars.senderName} vous a envoyé une carte cadeau !`,
    it: `${vars.senderName} Le ha inviato una carta regalo!`,
  };
  const bodies: Record<EmailLocale, string> = {
    de: `<p>Hallo ${escapeHtml(vars.recipientName)},</p><p><strong>${escapeHtml(vars.senderName)}</strong> hat Ihnen eine Geschenkkarte im Wert von <strong>${vars.amount}</strong> auf solen.ch geschenkt!</p>${msgHtml}<p style="text-align:center;margin:20px 0"><span style="font-family:${EMAIL_FONT_STACK};font-weight:700;font-variant-numeric:tabular-nums;font-size:24px;letter-spacing:3px;background:${EMAIL_COLORS.bgSunken};padding:12px 20px;border-radius:8px;border:2px dashed #0A0A0A;display:inline-block">${vars.code}</span></p><p>Verwenden Sie diesen Code bei Ihrer nächsten Buchung auf <a href="https://solen.ch">solen.ch</a>.</p>`,
    en: `<p>Hello ${escapeHtml(vars.recipientName)},</p><p><strong>${escapeHtml(vars.senderName)}</strong> sent you a gift card worth <strong>${vars.amount}</strong> on solen.ch!</p>${msgHtml}<p style="text-align:center;margin:20px 0"><span style="font-family:${EMAIL_FONT_STACK};font-weight:700;font-variant-numeric:tabular-nums;font-size:24px;letter-spacing:3px;background:${EMAIL_COLORS.bgSunken};padding:12px 20px;border-radius:8px;border:2px dashed #0A0A0A;display:inline-block">${vars.code}</span></p><p>Use this code on your next booking at <a href="https://solen.ch">solen.ch</a>.</p>`,
    fr: `<p>Bonjour ${escapeHtml(vars.recipientName)},</p><p><strong>${escapeHtml(vars.senderName)}</strong> vous a offert une carte cadeau d'une valeur de <strong>${vars.amount}</strong> sur solen.ch !</p>${msgHtml}<p style="text-align:center;margin:20px 0"><span style="font-family:${EMAIL_FONT_STACK};font-weight:700;font-variant-numeric:tabular-nums;font-size:24px;letter-spacing:3px;background:${EMAIL_COLORS.bgSunken};padding:12px 20px;border-radius:8px;border:2px dashed #0A0A0A;display:inline-block">${vars.code}</span></p><p>Utilisez ce code lors de votre prochaine réservation sur <a href="https://solen.ch">solen.ch</a>.</p>`,
    it: `<p>Buongiorno ${escapeHtml(vars.recipientName)},</p><p><strong>${escapeHtml(vars.senderName)}</strong> Le ha regalato una carta regalo del valore di <strong>${vars.amount}</strong> su solen.ch!</p>${msgHtml}<p style="text-align:center;margin:20px 0"><span style="font-family:${EMAIL_FONT_STACK};font-weight:700;font-variant-numeric:tabular-nums;font-size:24px;letter-spacing:3px;background:${EMAIL_COLORS.bgSunken};padding:12px 20px;border-radius:8px;border:2px dashed #0A0A0A;display:inline-block">${vars.code}</span></p><p>Usi questo codice per la Sua prossima prenotazione su <a href="https://solen.ch">solen.ch</a>.</p>`,
  };
  return { to, subject: subjects[locale], html: bodies[locale] };
}

// ---------------------------------------------------------------------------
// Nail infill reminder
// ---------------------------------------------------------------------------

export function nailInfillReminderEmail(
  to: string,
  vars: { customerName: string; salonName: string; serviceName: string; lastVisitDate: string; bookingUrl: string },
  locale: EmailLocale = "de"
): EmailPayload {
  const subjects: Record<EmailLocale, string> = {
    de: `Zeit für Ihre Auffüllung bei ${vars.salonName}!`,
    en: `Time for your nail infill at ${vars.salonName}!`,
    fr: `C'est l'heure de votre remplissage chez ${vars.salonName} !`,
    it: `È ora del ritocco presso ${vars.salonName}!`,
  };
  const bodies: Record<EmailLocale, string> = {
    de: `<p>Hallo ${escapeHtml(vars.customerName)},</p><p>Ihr letzter <strong>${escapeHtml(vars.serviceName)}</strong>-Termin bei <strong>${escapeHtml(vars.salonName)}</strong> war am ${vars.lastVisitDate}. Es ist Zeit für eine Auffüllung!</p><p><a href="${vars.bookingUrl}" style="display:inline-block;padding:12px 24px;background:#0A0A0A;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Jetzt Termin buchen →</a></p><p>solen.ch</p>`,
    en: `<p>Hello ${escapeHtml(vars.customerName)},</p><p>Your last <strong>${escapeHtml(vars.serviceName)}</strong> appointment at <strong>${escapeHtml(vars.salonName)}</strong> was on ${vars.lastVisitDate}. Time for an infill!</p><p><a href="${vars.bookingUrl}" style="display:inline-block;padding:12px 24px;background:#0A0A0A;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Book now →</a></p><p>solen.ch</p>`,
    fr: `<p>Bonjour ${escapeHtml(vars.customerName)},</p><p>Votre dernier rendez-vous <strong>${escapeHtml(vars.serviceName)}</strong> chez <strong>${escapeHtml(vars.salonName)}</strong> était le ${vars.lastVisitDate}. C'est l'heure du remplissage !</p><p><a href="${vars.bookingUrl}" style="display:inline-block;padding:12px 24px;background:#0A0A0A;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Réserver maintenant →</a></p><p>solen.ch</p>`,
    it: `<p>Ciao ${escapeHtml(vars.customerName)},</p><p>Il Suo ultimo appuntamento <strong>${escapeHtml(vars.serviceName)}</strong> presso <strong>${escapeHtml(vars.salonName)}</strong> era il ${vars.lastVisitDate}. È ora del ritocco!</p><p><a href="${vars.bookingUrl}" style="display:inline-block;padding:12px 24px;background:#0A0A0A;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Prenota ora →</a></p><p>solen.ch</p>`,
  };
  return { to, subject: subjects[locale], html: bodies[locale] };
}

// ---------------------------------------------------------------------------
// Nail allergy alert (sent to salon when allergic client books)
// ---------------------------------------------------------------------------

export function nailAllergyAlertEmail(
  to: string,
  vars: { salonName: string; customerName: string; allergies: string; bookingDate: string },
  locale: EmailLocale = "de"
): EmailPayload {
  const subjects: Record<EmailLocale, string> = {
    de: `Allergie-Hinweis: ${vars.customerName} hat einen Termin gebucht`,
    en: `Allergy alert: ${vars.customerName} booked an appointment`,
    fr: `Alerte allergie : ${vars.customerName} a réservé un rendez-vous`,
    it: `Avviso allergia: ${vars.customerName} ha prenotato un appuntamento`,
  };
  const bodies: Record<EmailLocale, string> = {
    de: `<p>Hallo <strong>${escapeHtml(vars.salonName)}</strong>,</p><p><strong>${escapeHtml(vars.customerName)}</strong> hat einen Termin am ${vars.bookingDate} gebucht und hat folgende Allergien vermerkt:</p><p style="background:${EMAIL_COLORS.warningBg};padding:12px;border-radius:8px;border-left:4px solid ${EMAIL_COLORS.warningText}"><strong>${escapeHtml(vars.allergies)}</strong></p><p>Bitte stellen Sie sicher, dass die verwendeten Produkte kompatibel sind.</p><p>solen.ch</p>`,
    en: `<p>Hello <strong>${escapeHtml(vars.salonName)}</strong>,</p><p><strong>${escapeHtml(vars.customerName)}</strong> has booked an appointment on ${vars.bookingDate} and has the following allergies on file:</p><p style="background:${EMAIL_COLORS.warningBg};padding:12px;border-radius:8px;border-left:4px solid ${EMAIL_COLORS.warningText}"><strong>${escapeHtml(vars.allergies)}</strong></p><p>Please ensure compatible products are used.</p><p>solen.ch</p>`,
    fr: `<p>Bonjour <strong>${escapeHtml(vars.salonName)}</strong>,</p><p><strong>${escapeHtml(vars.customerName)}</strong> a réservé un rendez-vous le ${vars.bookingDate} et a les allergies suivantes :</p><p style="background:${EMAIL_COLORS.warningBg};padding:12px;border-radius:8px;border-left:4px solid ${EMAIL_COLORS.warningText}"><strong>${escapeHtml(vars.allergies)}</strong></p><p>Veuillez utiliser des produits compatibles.</p><p>solen.ch</p>`,
    it: `<p>Ciao <strong>${escapeHtml(vars.salonName)}</strong>,</p><p><strong>${escapeHtml(vars.customerName)}</strong> ha prenotato un appuntamento il ${vars.bookingDate} e ha le seguenti allergie registrate:</p><p style="background:${EMAIL_COLORS.warningBg};padding:12px;border-radius:8px;border-left:4px solid ${EMAIL_COLORS.warningText}"><strong>${escapeHtml(vars.allergies)}</strong></p><p>Si prega di utilizzare prodotti compatibili.</p><p>solen.ch</p>`,
  };
  return { to, subject: subjects[locale], html: bodies[locale] };
}

// ---------------------------------------------------------------------------
// Barber smart reminder (salon owner → client)
// ---------------------------------------------------------------------------

export function barberSmartReminderEmail(
  to: string,
  vars: { customerName: string; salonName: string; daysSince: number; bookingUrl: string },
  locale: EmailLocale = "de"
): EmailPayload {
  const subjects: Record<EmailLocale, string> = {
    de: `Zeit für einen frischen Schnitt bei ${vars.salonName}!`,
    en: `Time for a fresh cut at ${vars.salonName}!`,
    fr: `C'est l'heure d'une nouvelle coupe chez ${vars.salonName} !`,
    it: `È ora di un nuovo taglio da ${vars.salonName}!`,
  };
  const bodies: Record<EmailLocale, string> = {
    de: `<p>Hey ${escapeHtml(vars.customerName)},</p><p>Ihr letzter Schnitt bei <strong>${escapeHtml(vars.salonName)}</strong> war vor ${vars.daysSince} Tagen. Bereit für ein frisches Styling?</p><p><a href="${vars.bookingUrl}" style="display:inline-block;padding:12px 24px;background:#0A0A0A;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Jetzt Termin buchen →</a></p><p style="color:${EMAIL_COLORS.ink2};font-size:12px;margin-top:24px">Ihr Solen Team</p>`,
    en: `<p>Hey ${escapeHtml(vars.customerName)},</p><p>Your last cut at <strong>${escapeHtml(vars.salonName)}</strong> was ${vars.daysSince} days ago. Ready for a fresh look?</p><p><a href="${vars.bookingUrl}" style="display:inline-block;padding:12px 24px;background:#0A0A0A;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Book now →</a></p><p style="color:${EMAIL_COLORS.ink2};font-size:12px;margin-top:24px">Your Solen Team</p>`,
    fr: `<p>Bonjour ${escapeHtml(vars.customerName)},</p><p>Votre dernière coupe chez <strong>${escapeHtml(vars.salonName)}</strong> remonte à ${vars.daysSince} jours. Souhaitez-vous un nouveau look ?</p><p><a href="${vars.bookingUrl}" style="display:inline-block;padding:12px 24px;background:#0A0A0A;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Réserver maintenant →</a></p><p style="color:${EMAIL_COLORS.ink2};font-size:12px;margin-top:24px">Votre équipe Solen</p>`,
    it: `<p>Ciao ${escapeHtml(vars.customerName)},</p><p>Il Suo ultimo taglio da <strong>${escapeHtml(vars.salonName)}</strong> risale a ${vars.daysSince} giorni fa. Pronto per un nuovo look?</p><p><a href="${vars.bookingUrl}" style="display:inline-block;padding:12px 24px;background:#0A0A0A;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Prenota ora →</a></p><p style="color:${EMAIL_COLORS.ink2};font-size:12px;margin-top:24px">Il team Solen</p>`,
  };
  return { to, subject: subjects[locale], html: bodies[locale] };
}

// ---------------------------------------------------------------------------
// Barber queue position SMS (sent when client joins walk-in queue)
// ---------------------------------------------------------------------------

export function barberQueuePositionSMS(
  vars: { customerName: string; salonName: string; position: number; estimatedMinutes: number },
  locale: EmailLocale = "de"
): string {
  const templates: Record<EmailLocale, string> = {
    de: `${vars.customerName}, Sie sind auf Position ${vars.position} in der Warteschlange bei ${vars.salonName}. Geschätzte Wartezeit: ~${vars.estimatedMinutes} Min. Wir melden uns, wenn Sie dran sind!`,
    en: `${vars.customerName}, you're #${vars.position} in the queue at ${vars.salonName}. Estimated wait: ~${vars.estimatedMinutes} min. We'll notify you when it's your turn!`,
    fr: `${vars.customerName}, vous êtes en position ${vars.position} dans la file chez ${vars.salonName}. Attente estimée : ~${vars.estimatedMinutes} min. Nous vous préviendrons !`,
    it: `${vars.customerName}, è in posizione ${vars.position} nella coda da ${vars.salonName}. Attesa stimata: ~${vars.estimatedMinutes} min. La avviseremo quando sarà il Suo turno!`,
  };
  return templates[locale];
}

// ---------------------------------------------------------------------------
// Barber "you're next" SMS (sent when client is next in queue)
// ---------------------------------------------------------------------------

export function barberYoureNextSMS(
  vars: { customerName: string; salonName: string },
  locale: EmailLocale = "de"
): string {
  const templates: Record<EmailLocale, string> = {
    de: `${vars.customerName}, du bist als Nächstes dran bei ${vars.salonName}! Bitte komm jetzt zum Salon. 💈`,
    en: `${vars.customerName}, you're up next at ${vars.salonName}! Please head to the salon now. 💈`,
    fr: `${vars.customerName}, c'est bientôt ton tour chez ${vars.salonName} ! Rendez-vous au salon maintenant. 💈`,
    it: `${vars.customerName}, è il tuo turno da ${vars.salonName}! Per favore dirigiti al salone ora. 💈`,
  };
  return templates[locale];
}

// ---------------------------------------------------------------------------
// Barber loyalty reward email (sent when stamp card is complete)
// ---------------------------------------------------------------------------

export function barberLoyaltyRewardEmail(
  to: string,
  vars: { customerName: string; salonName: string; reward: string; redeemUrl: string },
  locale: EmailLocale = "de"
): EmailPayload {
  const subjects: Record<EmailLocale, string> = {
    de: `Ihre Treuekarte bei ${vars.salonName} ist voll!`,
    en: `Your loyalty card at ${vars.salonName} is complete!`,
    fr: `Votre carte fidélité chez ${vars.salonName} est complète !`,
    it: `La Sua carta fedeltà da ${vars.salonName} è completa!`,
  };
  const bodies: Record<EmailLocale, string> = {
    de: `<p>Hey ${escapeHtml(vars.customerName)},</p><p>Glückwunsch! Ihre Treuekarte bei <strong>${escapeHtml(vars.salonName)}</strong> ist voll. Sie haben sich folgende Belohnung verdient:</p><p style="background:${EMAIL_COLORS.bgSunken};padding:16px;border-radius:8px;text-align:center;font-size:18px;font-weight:600;color:#0A0A0A">${escapeHtml(vars.reward)}</p><p><a href="${vars.redeemUrl}" style="display:inline-block;padding:12px 24px;background:#0A0A0A;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Belohnung einlösen →</a></p><p style="color:${EMAIL_COLORS.ink2};font-size:12px;margin-top:24px">Ihr Solen Team</p>`,
    en: `<p>Hey ${escapeHtml(vars.customerName)},</p><p>Congrats! Your loyalty card at <strong>${escapeHtml(vars.salonName)}</strong> is complete. You've earned:</p><p style="background:${EMAIL_COLORS.bgSunken};padding:16px;border-radius:8px;text-align:center;font-size:18px;font-weight:600;color:#0A0A0A">${escapeHtml(vars.reward)}</p><p><a href="${vars.redeemUrl}" style="display:inline-block;padding:12px 24px;background:#0A0A0A;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Redeem reward →</a></p><p style="color:${EMAIL_COLORS.ink2};font-size:12px;margin-top:24px">Your Solen Team</p>`,
    fr: `<p>Bonjour ${escapeHtml(vars.customerName)},</p><p>Félicitations ! Votre carte fidélité chez <strong>${escapeHtml(vars.salonName)}</strong> est complète. Vous avez gagné :</p><p style="background:${EMAIL_COLORS.bgSunken};padding:16px;border-radius:8px;text-align:center;font-size:18px;font-weight:600;color:#0A0A0A">${escapeHtml(vars.reward)}</p><p><a href="${vars.redeemUrl}" style="display:inline-block;padding:12px 24px;background:#0A0A0A;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Utiliser la récompense →</a></p><p style="color:${EMAIL_COLORS.ink2};font-size:12px;margin-top:24px">Votre équipe Solen</p>`,
    it: `<p>Ciao ${escapeHtml(vars.customerName)},</p><p>Complimenti! La Sua carta fedeltà da <strong>${escapeHtml(vars.salonName)}</strong> è completa. Ha guadagnato:</p><p style="background:${EMAIL_COLORS.bgSunken};padding:16px;border-radius:8px;text-align:center;font-size:18px;font-weight:600;color:#0A0A0A">${escapeHtml(vars.reward)}</p><p><a href="${vars.redeemUrl}" style="display:inline-block;padding:12px 24px;background:#0A0A0A;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Riscatta il premio →</a></p><p style="color:${EMAIL_COLORS.ink2};font-size:12px;margin-top:24px">Il team Solen</p>`,
  };
  return { to, subject: subjects[locale], html: bodies[locale] };
}

// ---------------------------------------------------------------------------
// TOS Update Notification
// ---------------------------------------------------------------------------

export function tosUpdateNotification(
  to: string,
  vars: { tosVersion: string; effectiveDate: string; termsUrl: string },
  locale: EmailLocale = "de"
): EmailPayload {
  const subjects: Record<EmailLocale, string> = {
    de: `Wichtig: Aktualisierung unserer AGB und Datenschutzerklärung`,
    en: `Important: Update to our Terms of Service and Privacy Policy`,
    fr: `Important: Mise à jour de nos Conditions Générales et Politique de Confidentialité`,
    it: `Importante: Aggiornamento dei nostri Termini di Servizio e Informativa sulla Privacy`,
  };
  const bodies: Record<EmailLocale, string> = {
    de: `<p>Guten Tag,</p><p>Wir haben unsere Nutzungsbedingungen und unsere Datenschutzerklärung aktualisiert. Die Änderungen treten am <strong>${vars.effectiveDate}</strong> in Kraft.</p><p><a href="${vars.termsUrl}" style="display:inline-block;padding:12px 24px;background:#0A0A0A;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Neue AGB lesen →</a></p><p>Bitte loggen Sie sich ein, um die neuen Bedingungen zu akzeptieren.</p><p>Mit freundlichen Grüssen,<br>Das solen.ch Team</p>`,
    en: `<p>Hello,</p><p>We have updated our Terms of Service and Privacy Policy. The changes take effect on <strong>${vars.effectiveDate}</strong>.</p><p><a href="${vars.termsUrl}" style="display:inline-block;padding:12px 24px;background:#0A0A0A;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Read new Terms →</a></p><p>Please log in to accept the new terms.</p><p>Best regards,<br>The solen.ch Team</p>`,
    fr: `<p>Bonjour,</p><p>Nous avons mis à jour nos Conditions Générales et notre Politique de Confidentialité. Les modifications entrent en vigueur le <strong>${vars.effectiveDate}</strong>.</p><p><a href="${vars.termsUrl}" style="display:inline-block;padding:12px 24px;background:#0A0A0A;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Lire les nouvelles conditions →</a></p><p>Veuillez vous connecter pour accepter les nouvelles conditions.</p><p>Cordialement,<br>L'équipe solen.ch</p>`,
    it: `<p>Buongiorno,</p><p>Abbiamo aggiornato i nostri Termini di Servizio e l'Informativa sulla Privacy. Le modifiche entrano in vigore il <strong>${vars.effectiveDate}</strong>.</p><p><a href="${vars.termsUrl}" style="display:inline-block;padding:12px 24px;background:#0A0A0A;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Leggi i nuovi Termini →</a></p><p>Accedi per accettare i nuovi termini.</p><p>Cordiali saluti,<br>Il team solen.ch</p>`,
  };
  return { to, subject: subjects[locale], html: bodies[locale] };
}

// ---------------------------------------------------------------------------
// Waitlist: a slot just freed up (cancellation)
// ---------------------------------------------------------------------------
// Added 2026-07-27 (A9-email-locale): was a raw inline German-only sendEmail() call in
// app/api/bookings/[id]/cancel/route.ts, moved here so it goes through the same locale
// mechanism as every other transactional email.

// ---------------------------------------------------------------------------
// Review posted (to salon owner) / review replied (to reviewer)
// ---------------------------------------------------------------------------
// Added 2026-07-27 (A9-email-locale): app/api/notify/review-posted and review-replied inlined
// raw German-only HTML directly in the route (bypassing the whole locale mechanism). Moved
// here so both go through the same subjects/bodies-by-locale pattern as every other email.

export function reviewPostedEmail(
  to: string,
  vars: { salon: string; rating: number; comment?: string },
  locale: EmailLocale = "de"
): EmailPayload {
  const starText: Record<EmailLocale, string> = {
    de: vars.rating === 1 ? "1 Stern" : `${vars.rating} Sternen`,
    en: vars.rating === 1 ? "1 star" : `${vars.rating} stars`,
    fr: vars.rating === 1 ? "1 étoile" : `${vars.rating} étoiles`,
    it: vars.rating === 1 ? "1 stella" : `${vars.rating} stelle`,
  };
  const subjects: Record<EmailLocale, string> = {
    de: `Neue Bewertung für ${vars.salon}`,
    en: `New review for ${vars.salon}`,
    fr: `Nouvel avis pour ${vars.salon}`,
    it: `Nuova recensione per ${vars.salon}`,
  };
  const commentHtml = vars.comment ? `<blockquote>"${escapeHtml(vars.comment)}"</blockquote>` : "";
  const ctas: Record<EmailLocale, string> = {
    de: "Bewertungen im Dashboard ansehen",
    en: "View reviews in dashboard",
    fr: "Voir les avis dans le tableau de bord",
    it: "Visualizza recensioni nella dashboard",
  };
  const bodies: Record<EmailLocale, string> = {
    de: `<h3>Neue Kundenbewertung</h3><p>Ihr Salon <strong>${escapeHtml(vars.salon)}</strong> hat eine neue Bewertung mit ${starText.de} erhalten.</p>${commentHtml}<p><a href="https://solen.ch/de/dashboard/reviews" style="display:inline-block;padding:10px 20px;background:${EMAIL_COLORS.ink};color:#fff;text-decoration:none;border-radius:8px;margin-top:20px;">${ctas.de}</a></p>`,
    en: `<h3>New customer review</h3><p>Your salon <strong>${escapeHtml(vars.salon)}</strong> received a new review with ${starText.en}.</p>${commentHtml}<p><a href="https://solen.ch/en/dashboard/reviews" style="display:inline-block;padding:10px 20px;background:${EMAIL_COLORS.ink};color:#fff;text-decoration:none;border-radius:8px;margin-top:20px;">${ctas.en}</a></p>`,
    fr: `<h3>Nouvel avis client</h3><p>Votre salon <strong>${escapeHtml(vars.salon)}</strong> a reçu un nouvel avis avec ${starText.fr}.</p>${commentHtml}<p><a href="https://solen.ch/fr/dashboard/reviews" style="display:inline-block;padding:10px 20px;background:${EMAIL_COLORS.ink};color:#fff;text-decoration:none;border-radius:8px;margin-top:20px;">${ctas.fr}</a></p>`,
    it: `<h3>Nuova recensione cliente</h3><p>Il Suo salone <strong>${escapeHtml(vars.salon)}</strong> ha ricevuto una nuova recensione con ${starText.it}.</p>${commentHtml}<p><a href="https://solen.ch/reviews" style="display:inline-block;padding:10px 20px;background:${EMAIL_COLORS.ink};color:#fff;text-decoration:none;border-radius:8px;margin-top:20px;">${ctas.it}</a></p>`,
  };
  return { to, subject: subjects[locale], html: bodies[locale] };
}

export function reviewRepliedEmail(
  to: string,
  vars: { salon: string; salonSlug: string; replyText: string },
  locale: EmailLocale = "de"
): EmailPayload {
  const subjects: Record<EmailLocale, string> = {
    de: `${vars.salon} hat auf Ihre Bewertung geantwortet`,
    en: `${vars.salon} replied to your review`,
    fr: `${vars.salon} a répondu à votre avis`,
    it: `${vars.salon} ha risposto alla Sua recensione`,
  };
  const ctas: Record<EmailLocale, string> = {
    de: "Zum Salon Profil",
    en: "Go to salon profile",
    fr: "Voir le profil du salon",
    it: "Vai al profilo del salone",
  };
  const bodies: Record<EmailLocale, string> = {
    de: `<h3>Antwort auf Ihre Bewertung</h3><p>Der Salon <strong>${escapeHtml(vars.salon)}</strong> hat auf Ihre Bewertung geantwortet:</p><blockquote style="border-left: 4px solid ${EMAIL_COLORS.ink}; padding-left: 12px; margin-left: 0; color: ${EMAIL_COLORS.ink2};">${escapeHtml(vars.replyText)}</blockquote><p><a href="https://solen.ch/de/salon/${vars.salonSlug}" style="display:inline-block;padding:10px 20px;background:${EMAIL_COLORS.ink};color:#fff;text-decoration:none;border-radius:8px;margin-top:20px;">${ctas.de}</a></p>`,
    en: `<h3>Reply to your review</h3><p>The salon <strong>${escapeHtml(vars.salon)}</strong> replied to your review:</p><blockquote style="border-left: 4px solid ${EMAIL_COLORS.ink}; padding-left: 12px; margin-left: 0; color: ${EMAIL_COLORS.ink2};">${escapeHtml(vars.replyText)}</blockquote><p><a href="https://solen.ch/en/salon/${vars.salonSlug}" style="display:inline-block;padding:10px 20px;background:${EMAIL_COLORS.ink};color:#fff;text-decoration:none;border-radius:8px;margin-top:20px;">${ctas.en}</a></p>`,
    fr: `<h3>Réponse à votre avis</h3><p>Le salon <strong>${escapeHtml(vars.salon)}</strong> a répondu à votre avis :</p><blockquote style="border-left: 4px solid ${EMAIL_COLORS.ink}; padding-left: 12px; margin-left: 0; color: ${EMAIL_COLORS.ink2};">${escapeHtml(vars.replyText)}</blockquote><p><a href="https://solen.ch/fr/salon/${vars.salonSlug}" style="display:inline-block;padding:10px 20px;background:${EMAIL_COLORS.ink};color:#fff;text-decoration:none;border-radius:8px;margin-top:20px;">${ctas.fr}</a></p>`,
    it: `<h3>Risposta alla Sua recensione</h3><p>Il salone <strong>${escapeHtml(vars.salon)}</strong> ha risposto alla Sua recensione:</p><blockquote style="border-left: 4px solid ${EMAIL_COLORS.ink}; padding-left: 12px; margin-left: 0; color: ${EMAIL_COLORS.ink2};">${escapeHtml(vars.replyText)}</blockquote><p><a href="https://solen.ch/it/salon/${vars.salonSlug}" style="display:inline-block;padding:10px 20px;background:${EMAIL_COLORS.ink};color:#fff;text-decoration:none;border-radius:8px;margin-top:20px;">${ctas.it}</a></p>`,
  };
  return { to, subject: subjects[locale], html: bodies[locale] };
}

// ---------------------------------------------------------------------------
// Directory claim verification code
// ---------------------------------------------------------------------------
// Added 2026-07-27 (A9-email-locale): app/api/directory/[id]/claim inlined raw German-only
// HTML directly (no locale mechanism, no caller yet threading a locale). Moved here so the
// route can accept an optional locale (defaults "de") instead of being permanently stuck.

export function directoryClaimCode(
  to: string,
  vars: { salonName: string; code: string },
  locale: EmailLocale = "de"
): EmailPayload {
  const subjects: Record<EmailLocale, string> = {
    de: `Ihr Bestätigungscode für solen.ch: ${vars.code}`,
    en: `Your solen.ch verification code: ${vars.code}`,
    fr: `Votre code de vérification solen.ch : ${vars.code}`,
    it: `Il Suo codice di verifica solen.ch: ${vars.code}`,
  };
  const bodies: Record<EmailLocale, string> = {
    de: `<p>Guten Tag,</p><p>Sie haben beantragt, den Salon <strong>${escapeHtml(vars.salonName)}</strong> auf solen.ch zu beanspruchen.</p><p>Ihr Bestätigungscode lautet: <strong style="font-size:24px;letter-spacing:4px">${vars.code}</strong></p><p>Der Code ist 15 Minuten gültig.</p><p>Falls Sie diese Anfrage nicht gestellt haben, können Sie diese E-Mail ignorieren.</p><p>Das solen.ch Team</p>`,
    en: `<p>Hello,</p><p>You requested to claim the salon <strong>${escapeHtml(vars.salonName)}</strong> on solen.ch.</p><p>Your verification code is: <strong style="font-size:24px;letter-spacing:4px">${vars.code}</strong></p><p>The code is valid for 15 minutes.</p><p>If you did not request this, you can ignore this email.</p><p>The solen.ch team</p>`,
    fr: `<p>Bonjour,</p><p>Vous avez demandé à revendiquer le salon <strong>${escapeHtml(vars.salonName)}</strong> sur solen.ch.</p><p>Votre code de vérification est : <strong style="font-size:24px;letter-spacing:4px">${vars.code}</strong></p><p>Le code est valable 15 minutes.</p><p>Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail.</p><p>L'équipe solen.ch</p>`,
    it: `<p>Buongiorno,</p><p>Ha richiesto di rivendicare il salone <strong>${escapeHtml(vars.salonName)}</strong> su solen.ch.</p><p>Il Suo codice di verifica è: <strong style="font-size:24px;letter-spacing:4px">${vars.code}</strong></p><p>Il codice è valido per 15 minuti.</p><p>Se non ha richiesto Lei questa operazione, può ignorare questa email.</p><p>Il team solen.ch</p>`,
  };
  return { to, subject: subjects[locale], html: bodies[locale] };
}

// ---------------------------------------------------------------------------
// Staff invite
// ---------------------------------------------------------------------------
// Added 2026-07-27 (A9-email-locale): app/api/staff/invite inlined raw German-only HTML with
// a hardcoded /de/staff/accept link, regardless of the inviting salon's own working language.

export function staffInviteEmail(
  to: string,
  vars: { salonName: string; staffName?: string; inviteUrl: string },
  locale: EmailLocale = "de"
): EmailPayload {
  const greeting: Record<EmailLocale, string> = {
    de: `Hallo${vars.staffName ? ` ${escapeHtml(vars.staffName)}` : ""},`,
    en: `Hello${vars.staffName ? ` ${escapeHtml(vars.staffName)}` : ""},`,
    fr: `Bonjour${vars.staffName ? ` ${escapeHtml(vars.staffName)}` : ""},`,
    it: `Ciao${vars.staffName ? ` ${escapeHtml(vars.staffName)}` : ""},`,
  };
  const subjects: Record<EmailLocale, string> = {
    de: `Einladung als Mitarbeiter bei ${vars.salonName} - solen.ch`,
    en: `Invitation to join ${vars.salonName} - solen.ch`,
    fr: `Invitation à rejoindre ${vars.salonName} - solen.ch`,
    it: `Invito a unirsi a ${vars.salonName} - solen.ch`,
  };
  const invite: Record<EmailLocale, string> = {
    de: `<strong>${escapeHtml(vars.salonName)}</strong> lädt Sie ein, als Mitarbeiter auf solen.ch beizutreten.`,
    en: `<strong>${escapeHtml(vars.salonName)}</strong> is inviting you to join solen.ch as staff.`,
    fr: `<strong>${escapeHtml(vars.salonName)}</strong> vous invite à rejoindre solen.ch en tant que membre du personnel.`,
    it: `<strong>${escapeHtml(vars.salonName)}</strong> La invita a unirsi a solen.ch come membro dello staff.`,
  };
  const ctas: Record<EmailLocale, string> = {
    de: "Einladung annehmen →",
    en: "Accept invitation →",
    fr: "Accepter l'invitation →",
    it: "Accetta l'invito →",
  };
  const expiry: Record<EmailLocale, string> = {
    de: "Dieser Link ist 7 Tage gültig.",
    en: "This link is valid for 7 days.",
    fr: "Ce lien est valable 7 jours.",
    it: "Questo link è valido per 7 giorni.",
  };
  const bodies: Record<EmailLocale, string> = {
    de: `<p>${greeting.de}</p><p>${invite.de}</p><p><a href="${vars.inviteUrl}" style="display:inline-block;padding:12px 24px;background:${EMAIL_COLORS.ink};color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">${ctas.de}</a></p><p style="color:${EMAIL_COLORS.ink2};font-size:12px;">${expiry.de}</p>`,
    en: `<p>${greeting.en}</p><p>${invite.en}</p><p><a href="${vars.inviteUrl}" style="display:inline-block;padding:12px 24px;background:${EMAIL_COLORS.ink};color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">${ctas.en}</a></p><p style="color:${EMAIL_COLORS.ink2};font-size:12px;">${expiry.en}</p>`,
    fr: `<p>${greeting.fr}</p><p>${invite.fr}</p><p><a href="${vars.inviteUrl}" style="display:inline-block;padding:12px 24px;background:${EMAIL_COLORS.ink};color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">${ctas.fr}</a></p><p style="color:${EMAIL_COLORS.ink2};font-size:12px;">${expiry.fr}</p>`,
    it: `<p>${greeting.it}</p><p>${invite.it}</p><p><a href="${vars.inviteUrl}" style="display:inline-block;padding:12px 24px;background:${EMAIL_COLORS.ink};color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">${ctas.it}</a></p><p style="color:${EMAIL_COLORS.ink2};font-size:12px;">${expiry.it}</p>`,
  };
  return { to, subject: subjects[locale], html: bodies[locale] };
}

// ---------------------------------------------------------------------------
// Platform-wide birthday message (no specific salon, cron/birthday-messages)
// ---------------------------------------------------------------------------
// Added 2026-07-27 (A9-email-locale): distinct from birthdayEmail() above (that one is
// triggered per-salon and names the salon). This is the platform-wide daily cron message
// (was raw German-only HTML with no locale mechanism inline in the route).

export function platformBirthdayEmail(
  to: string,
  vars: { customerName: string },
  locale: EmailLocale = "de"
): EmailPayload {
  const subjects: Record<EmailLocale, string> = {
    de: `Alles Gute zum Geburtstag, ${vars.customerName}!`,
    en: `Happy Birthday, ${vars.customerName}!`,
    fr: `Joyeux anniversaire, ${vars.customerName} !`,
    it: `Buon compleanno, ${vars.customerName}!`,
  };
  const heading: Record<EmailLocale, string> = { de: "Happy Birthday!", en: "Happy Birthday!", fr: "Joyeux anniversaire !", it: "Buon compleanno!" };
  const cta: Record<EmailLocale, string> = { de: "Jetzt entdecken →", en: "Discover now →", fr: "Découvrir maintenant →", it: "Scopri ora →" };
  const bodies: Record<EmailLocale, string> = {
    de: `<div style="font-family:sans-serif;max-width:400px;margin:0 auto;text-align:center"><h2 style="color:${EMAIL_COLORS.ink}">${heading.de}</h2><p>Liebe/r ${escapeHtml(vars.customerName) || "Kunde/in"},</p><p>Wir wünschen Ihnen alles Gute zum Geburtstag!</p><p>Als kleines Geschenk haben wir eine Überraschung für Sie.</p><p><a href="https://www.solen.ch" style="display:inline-block;padding:12px 24px;background:${EMAIL_COLORS.ink};color:#fff;border-radius:8px;text-decoration:none">${cta.de}</a></p></div>`,
    en: `<div style="font-family:sans-serif;max-width:400px;margin:0 auto;text-align:center"><h2 style="color:${EMAIL_COLORS.ink}">${heading.en}</h2><p>Dear ${escapeHtml(vars.customerName) || "customer"},</p><p>We wish you a wonderful birthday!</p><p>As a little gift, we have a surprise for you.</p><p><a href="https://www.solen.ch" style="display:inline-block;padding:12px 24px;background:${EMAIL_COLORS.ink};color:#fff;border-radius:8px;text-decoration:none">${cta.en}</a></p></div>`,
    fr: `<div style="font-family:sans-serif;max-width:400px;margin:0 auto;text-align:center"><h2 style="color:${EMAIL_COLORS.ink}">${heading.fr}</h2><p>Cher/chère ${escapeHtml(vars.customerName) || "client(e)"},</p><p>Nous vous souhaitons un merveilleux anniversaire !</p><p>Nous avons une petite surprise pour vous.</p><p><a href="https://www.solen.ch" style="display:inline-block;padding:12px 24px;background:${EMAIL_COLORS.ink};color:#fff;border-radius:8px;text-decoration:none">${cta.fr}</a></p></div>`,
    it: `<div style="font-family:sans-serif;max-width:400px;margin:0 auto;text-align:center"><h2 style="color:${EMAIL_COLORS.ink}">${heading.it}</h2><p>Caro/a ${escapeHtml(vars.customerName) || "cliente"},</p><p>Le auguriamo un felice compleanno!</p><p>Abbiamo una piccola sorpresa per Lei.</p><p><a href="https://www.solen.ch" style="display:inline-block;padding:12px 24px;background:${EMAIL_COLORS.ink};color:#fff;border-radius:8px;text-decoration:none">${cta.it}</a></p></div>`,
  };
  return { to, subject: subjects[locale], html: bodies[locale] };
}

// ---------------------------------------------------------------------------
// Salon gift voucher delivery (distinct table/shape from giftCardDeliveryEmail above)
// ---------------------------------------------------------------------------
// Added 2026-07-27 (A9-email-locale): app/api/stripe/webhook/salon-voucher-handler.ts inlined
// raw German-only HTML + de-CH expiry date (no locale mechanism at all).

export function salonVoucherDeliveryEmail(
  to: string,
  vars: { recipientName?: string; salonName: string; amountChf: string; code: string; message?: string; expiresDate: string },
  locale: EmailLocale = "de"
): EmailPayload {
  const msgHtml = vars.message ? `<p style="color:${EMAIL_COLORS.ink2};font-style:italic">"${escapeHtml(vars.message)}"</p>` : "";
  const subjects: Record<EmailLocale, string> = {
    de: `Sie haben einen Gutschein von ${vars.salonName} erhalten!`,
    en: `You received a voucher from ${vars.salonName}!`,
    fr: `Vous avez reçu un bon de ${vars.salonName} !`,
    it: `Ha ricevuto un buono da ${vars.salonName}!`,
  };
  const heading: Record<EmailLocale, string> = { de: "Gutschein", en: "Voucher", fr: "Bon cadeau", it: "Buono" };
  const codeLabel: Record<EmailLocale, string> = { de: "Code", en: "Code", fr: "Code", it: "Codice" };
  const cta: Record<EmailLocale, string> = { de: "Jetzt einlösen →", en: "Redeem now →", fr: "Utiliser maintenant →", it: "Riscatta ora →" };
  const validUntil: Record<EmailLocale, string> = { de: "Gültig bis", en: "Valid until", fr: "Valable jusqu'au", it: "Valido fino al" };
  const bodies: Record<EmailLocale, string> = {
    de: `<div style="font-family:sans-serif;max-width:400px;margin:0 auto;text-align:center"><h2 style="color:#0A0A0A">${heading.de}</h2><p>Hallo ${escapeHtml(vars.recipientName ?? "")},</p><p>Sie haben einen Gutschein für <strong>${escapeHtml(vars.salonName)}</strong> erhalten!</p><div style="background:#F4F4F5;border-radius:12px;padding:20px;margin:16px 0"><p style="font-size:24px;font-weight:bold;color:#0A0A0A;margin:0">CHF ${vars.amountChf}</p><p style="font-size:14px;color:${EMAIL_COLORS.ink2};margin:4px 0 0">${codeLabel.de}: <strong>${vars.code}</strong></p></div>${msgHtml}<p><a href="https://www.solen.ch" style="display:inline-block;padding:12px 24px;background:#0A0A0A;color:#fff;border-radius:8px;text-decoration:none">${cta.de}</a></p><p style="font-size:11px;color:${EMAIL_COLORS.ink2}">${validUntil.de} ${vars.expiresDate}</p></div>`,
    en: `<div style="font-family:sans-serif;max-width:400px;margin:0 auto;text-align:center"><h2 style="color:#0A0A0A">${heading.en}</h2><p>Hello ${escapeHtml(vars.recipientName ?? "")},</p><p>You received a voucher for <strong>${escapeHtml(vars.salonName)}</strong>!</p><div style="background:#F4F4F5;border-radius:12px;padding:20px;margin:16px 0"><p style="font-size:24px;font-weight:bold;color:#0A0A0A;margin:0">CHF ${vars.amountChf}</p><p style="font-size:14px;color:${EMAIL_COLORS.ink2};margin:4px 0 0">${codeLabel.en}: <strong>${vars.code}</strong></p></div>${msgHtml}<p><a href="https://www.solen.ch" style="display:inline-block;padding:12px 24px;background:#0A0A0A;color:#fff;border-radius:8px;text-decoration:none">${cta.en}</a></p><p style="font-size:11px;color:${EMAIL_COLORS.ink2}">${validUntil.en} ${vars.expiresDate}</p></div>`,
    fr: `<div style="font-family:sans-serif;max-width:400px;margin:0 auto;text-align:center"><h2 style="color:#0A0A0A">${heading.fr}</h2><p>Bonjour ${escapeHtml(vars.recipientName ?? "")},</p><p>Vous avez reçu un bon pour <strong>${escapeHtml(vars.salonName)}</strong> !</p><div style="background:#F4F4F5;border-radius:12px;padding:20px;margin:16px 0"><p style="font-size:24px;font-weight:bold;color:#0A0A0A;margin:0">CHF ${vars.amountChf}</p><p style="font-size:14px;color:${EMAIL_COLORS.ink2};margin:4px 0 0">${codeLabel.fr}: <strong>${vars.code}</strong></p></div>${msgHtml}<p><a href="https://www.solen.ch" style="display:inline-block;padding:12px 24px;background:#0A0A0A;color:#fff;border-radius:8px;text-decoration:none">${cta.fr}</a></p><p style="font-size:11px;color:${EMAIL_COLORS.ink2}">${validUntil.fr} ${vars.expiresDate}</p></div>`,
    it: `<div style="font-family:sans-serif;max-width:400px;margin:0 auto;text-align:center"><h2 style="color:#0A0A0A">${heading.it}</h2><p>Buongiorno ${escapeHtml(vars.recipientName ?? "")},</p><p>Ha ricevuto un buono per <strong>${escapeHtml(vars.salonName)}</strong>!</p><div style="background:#F4F4F5;border-radius:12px;padding:20px;margin:16px 0"><p style="font-size:24px;font-weight:bold;color:#0A0A0A;margin:0">CHF ${vars.amountChf}</p><p style="font-size:14px;color:${EMAIL_COLORS.ink2};margin:4px 0 0">${codeLabel.it}: <strong>${vars.code}</strong></p></div>${msgHtml}<p><a href="https://www.solen.ch" style="display:inline-block;padding:12px 24px;background:#0A0A0A;color:#fff;border-radius:8px;text-decoration:none">${cta.it}</a></p><p style="font-size:11px;color:${EMAIL_COLORS.ink2}">${validUntil.it} ${vars.expiresDate}</p></div>`,
  };
  return { to, subject: subjects[locale], html: bodies[locale] };
}

export function waitlistSlotFreed(
  to: string,
  vars: { service: string; salon: string; date: string },
  locale: EmailLocale = "de"
): EmailPayload {
  const subjects: Record<EmailLocale, string> = {
    de: `Ein Termin ist frei geworden bei ${vars.salon}!`,
    en: `A slot just opened up at ${vars.salon}!`,
    fr: `Un créneau vient de se libérer chez ${vars.salon} !`,
    it: `Si è liberato uno slot presso ${vars.salon}!`,
  };
  const bodies: Record<EmailLocale, string> = {
    de: `<p>Ein Termin für <strong>${escapeHtml(vars.service)}</strong> am <strong>${vars.date}</strong> ist jetzt verfügbar.</p><p><a href="https://solen.ch">Jetzt buchen →</a></p>`,
    en: `<p>A slot for <strong>${escapeHtml(vars.service)}</strong> on <strong>${vars.date}</strong> is now available.</p><p><a href="https://solen.ch">Book now →</a></p>`,
    fr: `<p>Un créneau pour <strong>${escapeHtml(vars.service)}</strong> le <strong>${vars.date}</strong> est maintenant disponible.</p><p><a href="https://solen.ch">Réserver maintenant →</a></p>`,
    it: `<p>Uno slot per <strong>${escapeHtml(vars.service)}</strong> il <strong>${vars.date}</strong> è ora disponibile.</p><p><a href="https://solen.ch">Prenota ora →</a></p>`,
  };
  return { to, subject: subjects[locale], html: bodies[locale] };
}

// ---------------------------------------------------------------------------
// Fee payment issue email (2026-09-06, owner-approved variant B)
// ---------------------------------------------------------------------------

/**
 * Send the customer a "your automated no-show/late-cancel fee could not be charged,
 * here is a link to pay it" email, when chargeFee's off-session attempt lands on
 * 'failed' (declined) or 'requires_action' (SCA). Called from the two automated fee
 * paths (app/api/cron/no-show/route.ts, lib/bookings/customer-cancel-money.ts).
 *
 * Recipient resolution mirrors lib/bookings/notify-no-show-fee.ts's own shape (userId ->
 * in-app + email when resolvable, guest -> email only, no address -> no-op). The in-app
 * row reuses an EXISTING NotificationType ('no_show_charge' / 'late_cancellation_fee')
 * for its title/body, WITHOUT emailParams: lib/notifications.ts's own type-keyed email
 * switch has no case for this new template and is a closed set this app cannot extend
 * from here, so routing the email through it would silently no-op (console.warn only).
 * The actual email is therefore sent directly via sendEmail below, with the correct
 * fee-FAILED copy, never through that switch.
 */
export async function sendFeePaymentIssueEmail(args: {
  admin: import("@supabase/supabase-js").SupabaseClient;
  userId: string | null;
  guestEmail?: string | null;
  serviceName: string;
  salonName: string;
  feeCents: number;
  date: Date | string;
  payUrl: string;
  kind: "no_show" | "cancellation";
  logPrefix: string;
}): Promise<void> {
  const { admin, userId, guestEmail, serviceName, salonName, feeCents, date, payUrl, kind, logPrefix } = args;
  const { feePaymentIssueEmail } = await import("@/lib/email-templates/audit-notifications");
  const { formatCurrency } = await import("@/lib/format-currency");
  const { resolveSwissLocale } = await import("@/lib/format");

  if (userId) {
    const { data: profile, error: preferenceError } = await admin.from("profiles").select("locale, notification_email").eq("id", userId).single();
    if (preferenceError) console.error(`[${logPrefix}] fee email preference lookup failed:`, preferenceError);
    const locale: EmailLocale = (profile?.locale as EmailLocale) ?? "de";
    const bcp47 = resolveSwissLocale(locale);
    const amountStr = formatCurrency(feeCents / 100, bcp47);
    const dateStr = new Date(date).toLocaleDateString(bcp47);
    const { data: authUser } = await admin.auth.admin.getUserById(userId);
    const email = authUser?.user?.email;

    const inAppTitles: Record<"no_show" | "cancellation", Record<EmailLocale, string>> = {
      no_show: {
        de: "Zahlungsproblem: No-Show-Gebühr",
        en: "Payment issue: no-show fee",
        fr: "Problème de paiement : frais de non-présentation",
        it: "Problema di pagamento: penale per mancata presentazione",
      },
      cancellation: {
        de: "Zahlungsproblem: Stornogebühr",
        en: "Payment issue: cancellation fee",
        fr: "Problème de paiement : frais d'annulation",
        it: "Problema di pagamento: penale di cancellazione",
      },
    };
    const { sendNotification } = await import("@/lib/notifications");
    await sendNotification({
      userId,
      type: kind === "no_show" ? "no_show_charge" : "late_cancellation_fee",
      title: inAppTitles[kind][locale],
      body: inAppTitles[kind][locale],
      data: { feeCents, kind, status: "payment_issue" },
    }).catch((err) => console.error(`[${logPrefix}] fee payment issue in-app notification failed:`, err));

    if (email && !preferenceError && profile && profile.notification_email !== false) {
      try {
        await sendEmail(feePaymentIssueEmail(email, { service: serviceName, salonName, date: dateStr, feeAmount: amountStr, payUrl, kind }, locale));
      } catch (err) {
        console.error(`[${logPrefix}] fee payment issue email failed:`, err);
      }
    }
    return;
  }

  if (!guestEmail) return;
  const amountStr = formatCurrency(feeCents / 100, "de-CH");
  const guestDateStr = new Date(date).toLocaleDateString("de-CH");
  try {
    await sendEmail(feePaymentIssueEmail(guestEmail, { service: serviceName, salonName, date: guestDateStr, feeAmount: amountStr, payUrl, kind }, "de"));
  } catch (err) {
    console.error(`[${logPrefix}] fee payment issue guest email failed:`, err);
  }
}
