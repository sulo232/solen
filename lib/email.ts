// =============================================================================
// lib/email.ts — Transactional email via Resend
// All emails have DE + EN versions.
// =============================================================================

export type EmailLocale = "de" | "en";

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

/**
 * Send a transactional email via Resend.
 * Requires RESEND_API_KEY in environment.
 */
export async function sendEmail(payload: EmailPayload): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey === "PASTE_RESEND_KEY_HERE") {
    console.warn("[email] RESEND_API_KEY not configured — skipping email send");
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "solen.ch <noreply@solen.ch>",
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
    }),
  });

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
  vars: { service: string; salon: string; date: string; time: string },
  locale: EmailLocale = "de"
): EmailPayload {
  const subjects = {
    de: `Buchungsbestätigung: ${vars.service} bei ${vars.salon}`,
    en: `Booking confirmed: ${vars.service} at ${vars.salon}`,
  };
  const bodies = {
    de: `<p>Hallo,</p><p><strong>${vars.service}</strong> bei <strong>${vars.salon}</strong> am ${vars.date} um ${vars.time} Uhr ist bestätigt. Wir freuen uns auf Sie!</p><p>solen.ch</p>`,
    en: `<p>Hello,</p><p><strong>${vars.service}</strong> at <strong>${vars.salon}</strong> on ${vars.date} at ${vars.time} is confirmed. See you there!</p><p>solen.ch</p>`,
  };
  return { to, subject: subjects[locale], html: bodies[locale] };
}

export function bookingCancellation(
  to: string,
  vars: { service: string; salon: string; date: string },
  locale: EmailLocale = "de"
): EmailPayload {
  const subjects = {
    de: `Buchung storniert: ${vars.service} bei ${vars.salon}`,
    en: `Booking cancelled: ${vars.service} at ${vars.salon}`,
  };
  const bodies = {
    de: `<p>${vars.service} bei ${vars.salon} am ${vars.date} wurde storniert.</p>`,
    en: `<p>${vars.service} at ${vars.salon} on ${vars.date} has been cancelled.</p>`,
  };
  return { to, subject: subjects[locale], html: bodies[locale] };
}

export function bookingReminder(
  to: string,
  vars: { service: string; salon: string; time: string },
  locale: EmailLocale = "de"
): EmailPayload {
  const subjects = {
    de: `Erinnerung: ${vars.service} morgen um ${vars.time}`,
    en: `Reminder: ${vars.service} tomorrow at ${vars.time}`,
  };
  const bodies = {
    de: `<p>${vars.service} bei ${vars.salon} ist morgen um ${vars.time} Uhr. Wir freuen uns auf Sie!</p>`,
    en: `<p>${vars.service} at ${vars.salon} is tomorrow at ${vars.time}. See you there!</p>`,
  };
  return { to, subject: subjects[locale], html: bodies[locale] };
}

export function recurringConfirmation(
  to: string,
  vars: { frequency: string; service: string; salon: string },
  locale: EmailLocale = "de"
): EmailPayload {
  const subjects = {
    de: `Serienbuchung eingerichtet: ${vars.service} bei ${vars.salon}`,
    en: `Recurring booking set up: ${vars.service} at ${vars.salon}`,
  };
  const bodies = {
    de: `<p>Ihre ${vars.frequency} Serienbuchung für <strong>${vars.service}</strong> bei <strong>${vars.salon}</strong> ist eingerichtet.</p>`,
    en: `<p>Your ${vars.frequency} recurring booking for <strong>${vars.service}</strong> at <strong>${vars.salon}</strong> has been set up.</p>`,
  };
  return { to, subject: subjects[locale], html: bodies[locale] };
}

export function recurringFailed(
  to: string,
  vars: { service: string; salon: string; date: string },
  locale: EmailLocale = "de"
): EmailPayload {
  const subjects = {
    de: `Serienbuchung fehlgeschlagen: ${vars.service} am ${vars.date}`,
    en: `Recurring booking failed: ${vars.service} on ${vars.date}`,
  };
  const bodies = {
    de: `<p>Wir konnten <strong>${vars.service}</strong> bei ${vars.salon} für ${vars.date} nicht automatisch buchen. Der Zeitslot ist nicht verfügbar. Bitte buchen Sie manuell auf <a href="https://solen.ch">solen.ch</a>.</p>`,
    en: `<p>We couldn't auto-book <strong>${vars.service}</strong> at ${vars.salon} for ${vars.date}. The time slot is not available. Please rebook manually at <a href="https://solen.ch">solen.ch</a>.</p>`,
  };
  return { to, subject: subjects[locale], html: bodies[locale] };
}

export function salonVerificationRequest(
  to: string,
  vars: { salon: string; confirmUrl: string },
  locale: EmailLocale = "de"
): EmailPayload {
  const subjects = {
    de: `Ist Ihr Salon noch aktiv? Bitte bestätigen`,
    en: `Is your salon still active? Please confirm`,
  };
  const bodies = {
    de: `<p>Hallo,</p><p>Ist <strong>${vars.salon}</strong> noch aktiv auf solen.ch? Bitte klicken Sie auf den Link, um zu bestätigen:</p><p><a href="${vars.confirmUrl}">Salon bestätigen</a></p>`,
    en: `<p>Hello,</p><p>Is <strong>${vars.salon}</strong> still active on solen.ch? Please click the link to confirm:</p><p><a href="${vars.confirmUrl}">Confirm salon</a></p>`,
  };
  return { to, subject: subjects[locale], html: bodies[locale] };
}

export function salonVerificationWarning(
  to: string,
  vars: { salon: string; confirmUrl: string; warningNum: number },
  locale: EmailLocale = "de"
): EmailPayload {
  const subjects = {
    de: `Warnung ${vars.warningNum}/3: Bitte bestätigen Sie Ihren Salon`,
    en: `Warning ${vars.warningNum}/3: Please confirm your salon`,
  };
  const bodies = {
    de: `<p>Warnung ${vars.warningNum} von 3: <strong>${vars.salon}</strong> wurde noch nicht bestätigt. Bitte bestätigen Sie jetzt, sonst wird Ihr Salon eingefroren: <a href="${vars.confirmUrl}">Jetzt bestätigen</a></p>`,
    en: `<p>Warning ${vars.warningNum} of 3: <strong>${vars.salon}</strong> has not been confirmed. Please confirm now or your salon will be frozen: <a href="${vars.confirmUrl}">Confirm now</a></p>`,
  };
  return { to, subject: subjects[locale], html: bodies[locale] };
}

export function salonFrozen(
  to: string,
  vars: { salon: string },
  locale: EmailLocale = "de"
): EmailPayload {
  const subjects = {
    de: `Ihr Salon wurde aufgrund von Inaktivität gesperrt`,
    en: `Your salon has been frozen due to inactivity`,
  };
  const bodies = {
    de: `<p><strong>${vars.salon}</strong> wurde auf solen.ch wegen Inaktivität gesperrt. Um Ihren Salon wieder zu aktivieren, kontaktieren Sie uns unter support@solen.ch.</p>`,
    en: `<p><strong>${vars.salon}</strong> has been frozen on solen.ch due to inactivity. To reactivate, contact us at support@solen.ch.</p>`,
  };
  return { to, subject: subjects[locale], html: bodies[locale] };
}

export function customerBookingSuspended(
  to: string,
  vars: { salon: string; service: string; date: string },
  locale: EmailLocale = "de"
): EmailPayload {
  const subjects = {
    de: `Ihre Buchung bei ${vars.salon} wurde storniert`,
    en: `Your booking at ${vars.salon} has been suspended`,
  };
  const bodies = {
    de: `<p>Ihre Buchung für <strong>${vars.service}</strong> bei <strong>${vars.salon}</strong> am ${vars.date} wurde storniert, da der Salon nicht mehr aktiv ist. Es tut uns leid für die Unannehmlichkeiten.</p>`,
    en: `<p>Your booking for <strong>${vars.service}</strong> at <strong>${vars.salon}</strong> on ${vars.date} has been cancelled because the salon is no longer active. We apologise for the inconvenience.</p>`,
  };
  return { to, subject: subjects[locale], html: bodies[locale] };
}

export function newMessageNotification(
  to: string,
  vars: { sender: string },
  locale: EmailLocale = "de"
): EmailPayload {
  const subjects = {
    de: `Neue Nachricht von ${vars.sender}`,
    en: `New message from ${vars.sender}`,
  };
  const bodies = {
    de: `<p><strong>${vars.sender}</strong> hat Ihnen eine Nachricht auf <a href="https://solen.ch">solen.ch</a> gesendet.</p>`,
    en: `<p><strong>${vars.sender}</strong> sent you a message on <a href="https://solen.ch">solen.ch</a>.</p>`,
  };
  return { to, subject: subjects[locale], html: bodies[locale] };
}
