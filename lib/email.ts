// =============================================================================
// lib/email.ts — Transactional email via Resend
// All emails have DE + EN + FR versions.
// =============================================================================

export type EmailLocale = "de" | "en" | "fr";

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
    fr: `Réservation confirmée: ${vars.service} chez ${vars.salon}`,
  };
  const bodies = {
    de: `<p>Hallo,</p><p><strong>${vars.service}</strong> bei <strong>${vars.salon}</strong> am ${vars.date} um ${vars.time} Uhr ist bestätigt. Wir freuen uns auf Sie!</p><p>solen.ch</p>`,
    en: `<p>Hello,</p><p><strong>${vars.service}</strong> at <strong>${vars.salon}</strong> on ${vars.date} at ${vars.time} is confirmed. See you there!</p><p>solen.ch</p>`,
    fr: `<p>Bonjour,</p><p><strong>${vars.service}</strong> chez <strong>${vars.salon}</strong> le ${vars.date} à ${vars.time} est confirmé. À bientôt!</p><p>solen.ch</p>`,
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
    fr: `Réservation annulée: ${vars.service} chez ${vars.salon}`,
  };
  const bodies = {
    de: `<p>${vars.service} bei ${vars.salon} am ${vars.date} wurde storniert.</p>`,
    en: `<p>${vars.service} at ${vars.salon} on ${vars.date} has been cancelled.</p>`,
    fr: `<p>${vars.service} chez ${vars.salon} le ${vars.date} a été annulé.</p>`,
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
    fr: `Rappel: ${vars.service} demain à ${vars.time}`,
  };
  const bodies = {
    de: `<p>${vars.service} bei ${vars.salon} ist morgen um ${vars.time} Uhr. Wir freuen uns auf Sie!</p>`,
    en: `<p>${vars.service} at ${vars.salon} is tomorrow at ${vars.time}. See you there!</p>`,
    fr: `<p>${vars.service} chez ${vars.salon} est demain à ${vars.time}. À bientôt!</p>`,
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
    fr: `Abonnement configuré: ${vars.service} chez ${vars.salon}`,
  };
  const bodies = {
    de: `<p>Ihre ${vars.frequency} Serienbuchung für <strong>${vars.service}</strong> bei <strong>${vars.salon}</strong> ist eingerichtet.</p>`,
    en: `<p>Your ${vars.frequency} recurring booking for <strong>${vars.service}</strong> at <strong>${vars.salon}</strong> has been set up.</p>`,
    fr: `<p>Votre abonnement ${vars.frequency} pour <strong>${vars.service}</strong> chez <strong>${vars.salon}</strong> a été configuré.</p>`,
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
    fr: `Abonnement échoué: ${vars.service} le ${vars.date}`,
  };
  const bodies = {
    de: `<p>Wir konnten <strong>${vars.service}</strong> bei ${vars.salon} für ${vars.date} nicht automatisch buchen. Der Zeitslot ist nicht verfügbar. Bitte buchen Sie manuell auf <a href="https://solen.ch">solen.ch</a>.</p>`,
    en: `<p>We couldn't auto-book <strong>${vars.service}</strong> at ${vars.salon} for ${vars.date}. The time slot is not available. Please rebook manually at <a href="https://solen.ch">solen.ch</a>.</p>`,
    fr: `<p>Nous n'avons pas pu réserver automatiquement <strong>${vars.service}</strong> chez ${vars.salon} pour le ${vars.date}. Le créneau n'est pas disponible. Veuillez réserver manuellement sur <a href="https://solen.ch">solen.ch</a>.</p>`,
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
    fr: `Votre salon est-il toujours actif? Veuillez confirmer`,
  };
  const bodies = {
    de: `<p>Hallo,</p><p>Ist <strong>${vars.salon}</strong> noch aktiv auf solen.ch? Bitte klicken Sie auf den Link, um zu bestätigen:</p><p><a href="${vars.confirmUrl}">Salon bestätigen</a></p>`,
    en: `<p>Hello,</p><p>Is <strong>${vars.salon}</strong> still active on solen.ch? Please click the link to confirm:</p><p><a href="${vars.confirmUrl}">Confirm salon</a></p>`,
    fr: `<p>Bonjour,</p><p><strong>${vars.salon}</strong> est-il toujours actif sur solen.ch? Veuillez cliquer sur le lien pour confirmer:</p><p><a href="${vars.confirmUrl}">Confirmer le salon</a></p>`,
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
    fr: `Avertissement ${vars.warningNum}/3: Veuillez confirmer votre salon`,
  };
  const bodies = {
    de: `<p>Warnung ${vars.warningNum} von 3: <strong>${vars.salon}</strong> wurde noch nicht bestätigt. Bitte bestätigen Sie jetzt, sonst wird Ihr Salon eingefroren: <a href="${vars.confirmUrl}">Jetzt bestätigen</a></p>`,
    en: `<p>Warning ${vars.warningNum} of 3: <strong>${vars.salon}</strong> has not been confirmed. Please confirm now or your salon will be frozen: <a href="${vars.confirmUrl}">Confirm now</a></p>`,
    fr: `<p>Avertissement ${vars.warningNum} sur 3: <strong>${vars.salon}</strong> n'a pas été confirmé. Veuillez confirmer maintenant ou votre salon sera suspendu: <a href="${vars.confirmUrl}">Confirmer maintenant</a></p>`,
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
    fr: `Votre salon a été suspendu pour inactivité`,
  };
  const bodies = {
    de: `<p><strong>${vars.salon}</strong> wurde auf solen.ch wegen Inaktivität gesperrt. Um Ihren Salon wieder zu aktivieren, kontaktieren Sie uns unter support@solen.ch.</p>`,
    en: `<p><strong>${vars.salon}</strong> has been frozen on solen.ch due to inactivity. To reactivate, contact us at support@solen.ch.</p>`,
    fr: `<p><strong>${vars.salon}</strong> a été suspendu sur solen.ch pour inactivité. Pour réactiver, contactez-nous à support@solen.ch.</p>`,
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
    fr: `Votre réservation chez ${vars.salon} a été annulée`,
  };
  const bodies = {
    de: `<p>Ihre Buchung für <strong>${vars.service}</strong> bei <strong>${vars.salon}</strong> am ${vars.date} wurde storniert, da der Salon nicht mehr aktiv ist. Es tut uns leid für die Unannehmlichkeiten.</p>`,
    en: `<p>Your booking for <strong>${vars.service}</strong> at <strong>${vars.salon}</strong> on ${vars.date} has been cancelled because the salon is no longer active. We apologise for the inconvenience.</p>`,
    fr: `<p>Votre réservation pour <strong>${vars.service}</strong> chez <strong>${vars.salon}</strong> le ${vars.date} a été annulée car le salon n'est plus actif. Nous nous excusons pour la gêne occasionnée.</p>`,
  };
  return { to, subject: subjects[locale], html: bodies[locale] };
}

export function salonApproved(
  to: string,
  vars: { salon: string },
  locale: EmailLocale = "de"
): EmailPayload {
  const subjects = {
    de: `🎉 Dein Salon ist jetzt live auf solen.ch!`,
    en: `🎉 Your salon is now live on solen.ch!`,
    fr: `🎉 Votre salon est maintenant en ligne sur solen.ch !`,
  };
  const bodies = {
    de: `<p>Hallo,</p><p>Gute Neuigkeiten! <strong>${vars.salon}</strong> wurde genehmigt und ist ab sofort auf <a href="https://solen.ch">solen.ch</a> für Buchungen verfügbar.</p><p>Kunden können dich jetzt finden und buchen. Viel Erfolg!</p><p>Das solen.ch Team</p>`,
    en: `<p>Hello,</p><p>Great news! <strong>${vars.salon}</strong> has been approved and is now live on <a href="https://solen.ch">solen.ch</a> for bookings.</p><p>Customers can now find and book you. Good luck!</p><p>The solen.ch team</p>`,
    fr: `<p>Bonjour,</p><p>Bonne nouvelle ! <strong>${vars.salon}</strong> a été approuvé et est désormais disponible sur <a href="https://solen.ch">solen.ch</a> pour les réservations.</p><p>Les clients peuvent maintenant vous trouver et vous réserver. Bonne chance !</p><p>L'équipe solen.ch</p>`,
  };
  return { to, subject: subjects[locale], html: bodies[locale] };
}

export function salonRejected(
  to: string,
  vars: { salon: string; reason: string },
  locale: EmailLocale = "de"
): EmailPayload {
  const subjects = {
    de: `Dein Salon wurde leider nicht genehmigt`,
    en: `Your salon application was not approved`,
    fr: `Votre demande de salon n'a pas été approuvée`,
  };
  const bodies = {
    de: `<p>Hallo,</p><p>Leider konnten wir <strong>${vars.salon}</strong> aktuell nicht genehmigen.</p><p><strong>Grund:</strong> ${vars.reason}</p><p>Bei Fragen wende dich an <a href="mailto:support@solen.ch">support@solen.ch</a>.</p><p>Das solen.ch Team</p>`,
    en: `<p>Hello,</p><p>Unfortunately we were unable to approve <strong>${vars.salon}</strong> at this time.</p><p><strong>Reason:</strong> ${vars.reason}</p><p>If you have questions, contact <a href="mailto:support@solen.ch">support@solen.ch</a>.</p><p>The solen.ch team</p>`,
    fr: `<p>Bonjour,</p><p>Malheureusement, nous n'avons pas pu approuver <strong>${vars.salon}</strong> pour le moment.</p><p><strong>Raison :</strong> ${vars.reason}</p><p>Pour toute question, contactez <a href="mailto:support@solen.ch">support@solen.ch</a>.</p><p>L'équipe solen.ch</p>`,
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
    html: `<p>Ein neuer Salon hat sich registriert und wartet auf Genehmigung:</p><ul><li><strong>Name:</strong> ${vars.salon}</li><li><strong>E-Mail:</strong> ${vars.email}</li><li><strong>Adresse:</strong> ${vars.address}</li></ul><p><a href="https://solen.ch/de/dashboard/approvals">Jetzt prüfen →</a></p>`,
  };
}

export function salonOutreachInvitation(
  to: string,
  vars: { salonName: string; claimUrl: string }
): EmailPayload {
  return {
    to,
    subject: `${vars.salonName} ist jetzt auf solen.ch gelistet — kostenlos Buchungen aktivieren`,
    html: `
      <p>Guten Tag,</p>
      <p>Ihr Salon <strong>${vars.salonName}</strong> ist ab sofort auf <a href="https://solen.ch">solen.ch</a> gelistet — dem führenden Beauty-Buchungsportal der Region Basel.</p>
      <p>Kunden können Ihren Salon bereits finden und Ihre Kontaktdaten einsehen. Wenn Sie Online-Buchungen aktivieren möchten, können Sie Ihren Salon kostenlos beanspruchen:</p>
      <p><a href="${vars.claimUrl}" style="display:inline-block;padding:12px 24px;background:#4ECDC4;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Salon jetzt beanspruchen →</a></p>
      <p>Vorteile:</p>
      <ul>
        <li>Online-Buchungen 24/7 entgegennehmen</li>
        <li>Last-Minute-Angebote veröffentlichen</li>
        <li>Direktnachrichten von Kunden erhalten</li>
        <li>Kostenlos — keine Grundgebühr</li>
      </ul>
      <p>Bei Fragen: <a href="mailto:support@solen.ch">support@solen.ch</a></p>
      <p style="font-size:11px;color:#999;margin-top:32px">
        solen.ch · Booking platform Basel ·
        <a href="https://solen.ch/unsubscribe?email=${encodeURIComponent(to)}" style="color:#999">Abmelden</a>
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
  const link = vars.conversationUrl ?? "https://solen.ch";
  const previewLine = vars.preview ? `<p style="color:#555;font-style:italic">"${vars.preview}"</p>` : "";
  const subjects = {
    de: `Neue Nachricht von ${name}`,
    en: `New message from ${name}`,
    fr: `Nouveau message de ${name}`,
  };
  const bodies = {
    de: `<p><strong>${name}</strong> hat Ihnen eine Nachricht auf solen.ch gesendet.</p>${previewLine}<p><a href="${link}">Nachricht lesen →</a></p>`,
    en: `<p><strong>${name}</strong> sent you a message on solen.ch.</p>${previewLine}<p><a href="${link}">Read message →</a></p>`,
    fr: `<p><strong>${name}</strong> vous a envoyé un message sur solen.ch.</p>${previewLine}<p><a href="${link}">Lire le message →</a></p>`,
  };
  return { to, subject: subjects[locale], html: bodies[locale] };
}
