// ─────────────────────────────────────────────────────────────────────────────
// lib/email.ts — Transactional email via Resend
// All emails sent in German by default; pass locale to get English versions.
// ─────────────────────────────────────────────────────────────────────────────

import { formatDate, formatTime } from "./utils";

type EmailTemplate =
  | "booking_confirmation"
  | "booking_cancellation"
  | "booking_reminder"
  | "recurring_confirmation"
  | "recurring_failed"
  | "salon_verification_request"
  | "salon_verification_warning"
  | "salon_frozen"
  | "customer_booking_suspended"
  | "new_message_notification";

type TemplateData = Record<string, string | number | undefined>;

interface EmailPayload {
  from: string;
  to: string;
  subject: string;
  html: string;
}

function buildEmail(
  template: EmailTemplate,
  to: string,
  data: TemplateData,
  locale: "de" | "en" = "de"
): EmailPayload {
  const from = "noreply@solen.ch";
  const appName = "solen.ch";

  const dateStr  = data.date  ? formatDate(String(data.date), locale === "de" ? "de-CH" : "en-GB")  : "";
  const timeStr  = data.time  ? formatTime(String(data.time), locale === "de" ? "de-CH" : "en-GB")  : "";

  const templates: Record<EmailTemplate, { subject: Record<"de"|"en", string>; html: Record<"de"|"en", string> }> = {
    booking_confirmation: {
      subject: {
        de: `Buchungsbestätigung: ${data.service} bei ${data.salon}`,
        en: `Booking confirmed: ${data.service} at ${data.salon}`,
      },
      html: {
        de: `<p>Hallo ${data.name ?? ""},</p><p>Dein Termin für <strong>${data.service}</strong> bei <strong>${data.salon}</strong> am <strong>${dateStr}</strong> um <strong>${timeStr}</strong> ist bestätigt. Wir freuen uns auf dich!</p><p>— ${appName}</p>`,
        en: `<p>Hi ${data.name ?? ""},</p><p>Your appointment for <strong>${data.service}</strong> at <strong>${data.salon}</strong> on <strong>${dateStr}</strong> at <strong>${timeStr}</strong> is confirmed. See you there!</p><p>— ${appName}</p>`,
      },
    },
    booking_cancellation: {
      subject: {
        de: `Terminabsage: ${data.service} bei ${data.salon}`,
        en: `Booking cancelled: ${data.service} at ${data.salon}`,
      },
      html: {
        de: `<p>Hallo ${data.name ?? ""},</p><p>Dein Termin für <strong>${data.service}</strong> bei <strong>${data.salon}</strong> am <strong>${dateStr}</strong> wurde abgesagt.</p><p>— ${appName}</p>`,
        en: `<p>Hi ${data.name ?? ""},</p><p>Your appointment for <strong>${data.service}</strong> at <strong>${data.salon}</strong> on <strong>${dateStr}</strong> has been cancelled.</p><p>— ${appName}</p>`,
      },
    },
    booking_reminder: {
      subject: {
        de: `Erinnerung: ${data.service} bei ${data.salon} morgen`,
        en: `Reminder: ${data.service} at ${data.salon} tomorrow`,
      },
      html: {
        de: `<p>Hallo ${data.name ?? ""},</p><p>Erinnerung: Du hast morgen um <strong>${timeStr}</strong> einen Termin für <strong>${data.service}</strong> bei <strong>${data.salon}</strong>.</p><p>— ${appName}</p>`,
        en: `<p>Hi ${data.name ?? ""},</p><p>Reminder: You have an appointment for <strong>${data.service}</strong> at <strong>${data.salon}</strong> tomorrow at <strong>${timeStr}</strong>.</p><p>— ${appName}</p>`,
      },
    },
    recurring_confirmation: {
      subject: {
        de: `Wiederkehrende Buchung: ${data.service} bei ${data.salon}`,
        en: `Recurring booking set up: ${data.service} at ${data.salon}`,
      },
      html: {
        de: `<p>Hallo,</p><p>Deine wiederkehrende Buchung (<strong>${data.frequency}</strong>) für <strong>${data.service}</strong> bei <strong>${data.salon}</strong> wurde eingerichtet.</p><p>— ${appName}</p>`,
        en: `<p>Hi,</p><p>Your recurring <strong>${data.frequency}</strong> booking for <strong>${data.service}</strong> at <strong>${data.salon}</strong> has been set up.</p><p>— ${appName}</p>`,
      },
    },
    recurring_failed: {
      subject: {
        de: `Wiederkehrende Buchung fehlgeschlagen: ${data.service}`,
        en: `Recurring booking failed: ${data.service}`,
      },
      html: {
        de: `<p>Hallo,</p><p>Deine wiederkehrende Buchung für <strong>${data.service}</strong> bei <strong>${data.salon}</strong> am <strong>${dateStr}</strong> konnte nicht automatisch gebucht werden. Der Zeitslot ist nicht verfügbar. Bitte buche manuell nach.</p><p>— ${appName}</p>`,
        en: `<p>Hi,</p><p>We couldn't auto-book your <strong>${data.service}</strong> at <strong>${data.salon}</strong> for <strong>${dateStr}</strong>. The time slot is not available. Please rebook manually.</p><p>— ${appName}</p>`,
      },
    },
    salon_verification_request: {
      subject: {
        de: `Ist dein Salon noch aktiv auf ${appName}?`,
        en: `Is your salon still active on ${appName}?`,
      },
      html: {
        de: `<p>Hallo,</p><p>Wir möchten bestätigen, dass dein Salon <strong>${data.salon}</strong> noch aktiv auf ${appName} ist. Bitte klicke auf den folgenden Link um dies zu bestätigen:</p><p><a href="${data.verify_url}">Salon bestätigen</a></p><p>— ${appName}</p>`,
        en: `<p>Hi,</p><p>We want to confirm your salon <strong>${data.salon}</strong> is still active on ${appName}. Please click the link below to confirm:</p><p><a href="${data.verify_url}">Confirm salon</a></p><p>— ${appName}</p>`,
      },
    },
    salon_verification_warning: {
      subject: {
        de: `Warnung ${data.warning_number}/3: Bitte bestätige deinen Salon`,
        en: `Warning ${data.warning_number}/3: Please confirm your salon`,
      },
      html: {
        de: `<p>Hallo,</p><p><strong>Warnung ${data.warning_number}/3:</strong> Bitte bestätige, dass dein Salon <strong>${data.salon}</strong> noch aktiv auf ${appName} ist. Nach 3 unbeachteten Warnungen wird der Salon eingefroren.</p><p><a href="${data.verify_url}">Salon bestätigen</a></p><p>— ${appName}</p>`,
        en: `<p>Hi,</p><p><strong>Warning ${data.warning_number}/3:</strong> Please confirm your salon <strong>${data.salon}</strong> is still active on ${appName}. After 3 unacknowledged warnings, your salon will be frozen.</p><p><a href="${data.verify_url}">Confirm salon</a></p><p>— ${appName}</p>`,
      },
    },
    salon_frozen: {
      subject: {
        de: `Dein Salon wurde eingefroren`,
        en: `Your salon has been frozen`,
      },
      html: {
        de: `<p>Hallo,</p><p>Dein Salon <strong>${data.salon}</strong> wurde wegen Inaktivität auf ${appName} eingefroren. Alle zukünftigen Buchungen wurden storniert. Bitte kontaktiere uns um den Salon wieder zu aktivieren.</p><p>— ${appName}</p>`,
        en: `<p>Hi,</p><p>Your salon <strong>${data.salon}</strong> has been frozen due to inactivity on ${appName}. All future bookings have been cancelled. Please contact us to reactivate your salon.</p><p>— ${appName}</p>`,
      },
    },
    customer_booking_suspended: {
      subject: {
        de: `Deine Buchung bei ${data.salon} wurde storniert`,
        en: `Your booking at ${data.salon} has been suspended`,
      },
      html: {
        de: `<p>Hallo ${data.name ?? ""},</p><p>Deine Buchung bei <strong>${data.salon}</strong> am <strong>${dateStr}</strong> wurde storniert, weil der Salon derzeit inaktiv ist. Entschuldige die Unannehmlichkeiten.</p><p>— ${appName}</p>`,
        en: `<p>Hi ${data.name ?? ""},</p><p>Your booking at <strong>${data.salon}</strong> on <strong>${dateStr}</strong> has been suspended because the salon is currently inactive. We apologise for the inconvenience.</p><p>— ${appName}</p>`,
      },
    },
    new_message_notification: {
      subject: {
        de: `Neue Nachricht von ${data.sender} auf ${appName}`,
        en: `New message from ${data.sender} on ${appName}`,
      },
      html: {
        de: `<p>Hallo,</p><p><strong>${data.sender}</strong> hat dir eine Nachricht auf ${appName} gesendet. <a href="${data.app_url}">Jetzt lesen</a></p><p>— ${appName}</p>`,
        en: `<p>Hi,</p><p><strong>${data.sender}</strong> sent you a message on ${appName}. <a href="${data.app_url}">Read now</a></p><p>— ${appName}</p>`,
      },
    },
  };

  const t = templates[template];
  return {
    from,
    to,
    subject: t.subject[locale],
    html:    t.html[locale],
  };
}

/**
 * Send a transactional email via Resend.
 * Falls back silently in development if RESEND_API_KEY is not set.
 */
export async function sendEmail(
  template: EmailTemplate,
  to: string,
  data: TemplateData,
  locale: "de" | "en" = "de"
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    if (process.env.NODE_ENV === "development") {
      console.log(`[email] Would send ${template} to ${to}`, data);
    }
    return;
  }

  const payload = buildEmail(template, to, data, locale);

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error(`[email] Failed to send ${template}:`, err);
  }
}
