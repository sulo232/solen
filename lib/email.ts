// =============================================================================
// lib/email.ts — Transactional email via Resend
// All emails have DE + EN + FR versions.
// =============================================================================

export type EmailLocale = "de" | "en" | "fr" | "it";

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

// ---------------------------------------------------------------------------
// Re-booking nudge
// ---------------------------------------------------------------------------

export function rebookingNudge(
  to: string,
  vars: { service: string; salon: string; daysSince: number },
  locale: EmailLocale = "de"
): EmailPayload {
  const subjects = {
    de: `Zeit für einen neuen Termin bei ${vars.salon}?`,
    en: `Time for a new appointment at ${vars.salon}?`,
    fr: `Prêt(e) pour un nouveau rendez-vous chez ${vars.salon} ?`,
  };
  const bodies = {
    de: `<p>Dein letzter <strong>${vars.service}</strong>-Termin bei <strong>${vars.salon}</strong> war vor ${vars.daysSince} Tagen.</p><p><a href="https://solen.ch">Neuen Termin buchen →</a></p>`,
    en: `<p>Your last <strong>${vars.service}</strong> appointment at <strong>${vars.salon}</strong> was ${vars.daysSince} days ago.</p><p><a href="https://solen.ch">Book a new appointment →</a></p>`,
    fr: `<p>Votre dernier rendez-vous <strong>${vars.service}</strong> chez <strong>${vars.salon}</strong> remonte à ${vars.daysSince} jours.</p><p><a href="https://solen.ch">Réserver un nouveau rendez-vous →</a></p>`,
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
  const subjects = {
    de: `Wie war dein Besuch bei ${vars.salon}?`,
    en: `How was your visit at ${vars.salon}?`,
    fr: `Comment était votre visite chez ${vars.salon} ?`,
  };
  const bodies = {
    de: `<p>Vielen Dank für deinen <strong>${vars.service}</strong>-Termin bei <strong>${vars.salon}</strong>!</p><p>Hilf anderen Kunden und teile deine Erfahrung.</p><p><a href="${vars.reviewUrl}">Bewertung schreiben →</a></p>`,
    en: `<p>Thanks for your <strong>${vars.service}</strong> appointment at <strong>${vars.salon}</strong>!</p><p>Help other customers by sharing your experience.</p><p><a href="${vars.reviewUrl}">Write a review →</a></p>`,
    fr: `<p>Merci pour votre rendez-vous <strong>${vars.service}</strong> chez <strong>${vars.salon}</strong> !</p><p>Aidez les autres clients en partageant votre expérience.</p><p><a href="${vars.reviewUrl}">Écrire un avis →</a></p>`,
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
  step: 1 | 2 | 3 = 1
): EmailPayload {
  const steps = {
    de: [
      { subject: `Willkommen bei solen.ch, ${vars.name}!`, html: `<p>Hallo <strong>${vars.name}</strong>,</p><p>Willkommen bei solen.ch — deiner Plattform für Beauty & Wellness in Basel.</p><p><a href="https://solen.ch/de/explore">Entdecke Salons in deiner Nähe →</a></p>` },
      { subject: `Entdecke Last-Minute-Angebote, ${vars.name}`, html: `<p>Wusstest du, dass viele Salons Last-Minute-Rabatte anbieten? Spare bis zu 50 % auf freie Termine.</p><p><a href="https://solen.ch/de/explore?filter=lastminute">Last-Minute-Angebote ansehen →</a></p>` },
      { subject: `Dein Profil vervollständigen`, html: `<p>Vervollständige dein Profil, um personalisierte Empfehlungen zu erhalten und schneller zu buchen.</p><p><a href="https://solen.ch/de/account">Profil bearbeiten →</a></p>` },
    ],
    en: [
      { subject: `Welcome to solen.ch, ${vars.name}!`, html: `<p>Hello <strong>${vars.name}</strong>,</p><p>Welcome to solen.ch — your beauty & wellness platform in Basel.</p><p><a href="https://solen.ch/en/explore">Discover salons near you →</a></p>` },
      { subject: `Discover last-minute deals, ${vars.name}`, html: `<p>Did you know many salons offer last-minute discounts? Save up to 50% on available slots.</p><p><a href="https://solen.ch/en/explore?filter=lastminute">View last-minute deals →</a></p>` },
      { subject: `Complete your profile`, html: `<p>Complete your profile to get personalized recommendations and faster bookings.</p><p><a href="https://solen.ch/en/account">Edit profile →</a></p>` },
    ],
    fr: [
      { subject: `Bienvenue sur solen.ch, ${vars.name} !`, html: `<p>Bonjour <strong>${vars.name}</strong>,</p><p>Bienvenue sur solen.ch — votre plateforme beauté & bien-être à Bâle.</p><p><a href="https://solen.ch/fr/explore">Découvrir les salons →</a></p>` },
      { subject: `Offres de dernière minute, ${vars.name}`, html: `<p>Saviez-vous que de nombreux salons proposent des réductions de dernière minute ? Économisez jusqu'à 50 %.</p><p><a href="https://solen.ch/fr/explore?filter=lastminute">Voir les offres →</a></p>` },
      { subject: `Complétez votre profil`, html: `<p>Complétez votre profil pour des recommandations personnalisées.</p><p><a href="https://solen.ch/fr/account">Modifier le profil →</a></p>` },
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
    de: `<p>Hallo ${vars.customerName},</p><p>Bitte bezahlen Sie <strong>${vars.amount}</strong> für <strong>${vars.serviceName}</strong> bei <strong>${vars.salonName}</strong>:</p><p><a href="${vars.paymentUrl}" style="display:inline-block;padding:12px 24px;background:#E8624A;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Jetzt bezahlen →</a></p><p>solen.ch</p>`,
    en: `<p>Hello ${vars.customerName},</p><p>Please pay <strong>${vars.amount}</strong> for <strong>${vars.serviceName}</strong> at <strong>${vars.salonName}</strong>:</p><p><a href="${vars.paymentUrl}" style="display:inline-block;padding:12px 24px;background:#E8624A;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Pay now →</a></p><p>solen.ch</p>`,
    fr: `<p>Bonjour ${vars.customerName},</p><p>Veuillez payer <strong>${vars.amount}</strong> pour <strong>${vars.serviceName}</strong> chez <strong>${vars.salonName}</strong> :</p><p><a href="${vars.paymentUrl}" style="display:inline-block;padding:12px 24px;background:#E8624A;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Payer maintenant →</a></p><p>solen.ch</p>`,
    it: `<p>Ciao ${vars.customerName},</p><p>Si prega di pagare <strong>${vars.amount}</strong> per <strong>${vars.serviceName}</strong> presso <strong>${vars.salonName}</strong>:</p><p><a href="${vars.paymentUrl}" style="display:inline-block;padding:12px 24px;background:#E8624A;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Paga ora →</a></p><p>solen.ch</p>`,
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
    ? `<img src="${vars.stylistPhoto}" alt="${vars.stylistName}" style="width:64px;height:64px;border-radius:50%;object-fit:cover;margin:12px auto;display:block" />`
    : "";
  const subjects: Record<EmailLocale, string> = {
    de: `Trinkgeld für ${vars.stylistName}?`,
    en: `Leave a tip for ${vars.stylistName}?`,
    fr: `Pourboire pour ${vars.stylistName} ?`,
    it: `Mancia per ${vars.stylistName}?`,
  };
  const bodies: Record<EmailLocale, string> = {
    de: `<p>Hallo ${vars.customerName},</p><p>Waren Sie zufrieden mit Ihrem Termin? Hinterlassen Sie ein Trinkgeld für <strong>${vars.stylistName}</strong>!</p>${photoHtml}<p><a href="${vars.tipUrl}" style="display:inline-block;padding:12px 24px;background:#E8624A;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Trinkgeld geben →</a></p>`,
    en: `<p>Hello ${vars.customerName},</p><p>Happy with your appointment? Leave a tip for <strong>${vars.stylistName}</strong>!</p>${photoHtml}<p><a href="${vars.tipUrl}" style="display:inline-block;padding:12px 24px;background:#E8624A;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Leave a tip →</a></p>`,
    fr: `<p>Bonjour ${vars.customerName},</p><p>Satisfait(e) de votre rendez-vous ? Laissez un pourboire à <strong>${vars.stylistName}</strong> !</p>${photoHtml}<p><a href="${vars.tipUrl}" style="display:inline-block;padding:12px 24px;background:#E8624A;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Laisser un pourboire →</a></p>`,
    it: `<p>Ciao ${vars.customerName},</p><p>Soddisfatto del tuo appuntamento? Lascia una mancia a <strong>${vars.stylistName}</strong>!</p>${photoHtml}<p><a href="${vars.tipUrl}" style="display:inline-block;padding:12px 24px;background:#E8624A;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Lascia una mancia →</a></p>`,
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
    de: `Alles Gute zum Geburtstag, ${vars.customerName}! 🎂`,
    en: `Happy Birthday, ${vars.customerName}! 🎂`,
    fr: `Joyeux anniversaire, ${vars.customerName} ! 🎂`,
    it: `Buon compleanno, ${vars.customerName}! 🎂`,
  };
  const bodies: Record<EmailLocale, string> = {
    de: `<p>Hallo ${vars.customerName},</p><p>Alles Gute zum Geburtstag! <strong>${vars.salonName}</strong> wünscht Ihnen einen wunderbaren Tag.</p><p>Gönnen Sie sich etwas Besonderes — buchen Sie Ihren nächsten Termin mit einem Geburtstagsrabatt!</p><p><a href="https://solen.ch">Jetzt buchen →</a></p>`,
    en: `<p>Hello ${vars.customerName},</p><p>Happy Birthday! <strong>${vars.salonName}</strong> wishes you a wonderful day.</p><p>Treat yourself — book your next appointment with a birthday discount!</p><p><a href="https://solen.ch">Book now →</a></p>`,
    fr: `<p>Bonjour ${vars.customerName},</p><p>Joyeux anniversaire ! <strong>${vars.salonName}</strong> vous souhaite une merveilleuse journée.</p><p>Faites-vous plaisir — réservez votre prochain rendez-vous avec une réduction d'anniversaire !</p><p><a href="https://solen.ch">Réserver →</a></p>`,
    it: `<p>Ciao ${vars.customerName},</p><p>Buon compleanno! <strong>${vars.salonName}</strong> ti augura una splendida giornata.</p><p>Concediti qualcosa di speciale — prenota il tuo prossimo appuntamento con uno sconto di compleanno!</p><p><a href="https://solen.ch">Prenota ora →</a></p>`,
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
  const msgHtml = vars.message ? `<p style="background:#FAF6EF;padding:12px;border-radius:8px;font-style:italic;margin:16px 0">"${vars.message}"</p>` : "";
  const subjects: Record<EmailLocale, string> = {
    de: `${vars.senderName} hat dir eine Geschenkkarte geschickt!`,
    en: `${vars.senderName} sent you a gift card!`,
    fr: `${vars.senderName} vous a envoyé une carte cadeau !`,
    it: `${vars.senderName} ti ha inviato una carta regalo!`,
  };
  const bodies: Record<EmailLocale, string> = {
    de: `<p>Hallo ${vars.recipientName},</p><p><strong>${vars.senderName}</strong> hat dir eine Geschenkkarte im Wert von <strong>${vars.amount}</strong> auf solen.ch geschenkt!</p>${msgHtml}<p style="text-align:center;margin:20px 0"><span style="font-family:monospace;font-size:24px;letter-spacing:3px;background:#FAF6EF;padding:12px 20px;border-radius:8px;border:2px dashed #E8624A;display:inline-block">${vars.code}</span></p><p>Verwende diesen Code bei deiner nächsten Buchung auf <a href="https://solen.ch">solen.ch</a>.</p>`,
    en: `<p>Hello ${vars.recipientName},</p><p><strong>${vars.senderName}</strong> sent you a gift card worth <strong>${vars.amount}</strong> on solen.ch!</p>${msgHtml}<p style="text-align:center;margin:20px 0"><span style="font-family:monospace;font-size:24px;letter-spacing:3px;background:#FAF6EF;padding:12px 20px;border-radius:8px;border:2px dashed #E8624A;display:inline-block">${vars.code}</span></p><p>Use this code on your next booking at <a href="https://solen.ch">solen.ch</a>.</p>`,
    fr: `<p>Bonjour ${vars.recipientName},</p><p><strong>${vars.senderName}</strong> vous a offert une carte cadeau d'une valeur de <strong>${vars.amount}</strong> sur solen.ch !</p>${msgHtml}<p style="text-align:center;margin:20px 0"><span style="font-family:monospace;font-size:24px;letter-spacing:3px;background:#FAF6EF;padding:12px 20px;border-radius:8px;border:2px dashed #E8624A;display:inline-block">${vars.code}</span></p><p>Utilisez ce code lors de votre prochaine réservation sur <a href="https://solen.ch">solen.ch</a>.</p>`,
    it: `<p>Ciao ${vars.recipientName},</p><p><strong>${vars.senderName}</strong> ti ha regalato una carta regalo del valore di <strong>${vars.amount}</strong> su solen.ch!</p>${msgHtml}<p style="text-align:center;margin:20px 0"><span style="font-family:monospace;font-size:24px;letter-spacing:3px;background:#FAF6EF;padding:12px 20px;border-radius:8px;border:2px dashed #E8624A;display:inline-block">${vars.code}</span></p><p>Usa questo codice per la tua prossima prenotazione su <a href="https://solen.ch">solen.ch</a>.</p>`,
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
    de: `Zeit für deine Auffüllung bei ${vars.salonName}!`,
    en: `Time for your nail infill at ${vars.salonName}!`,
    fr: `C'est l'heure de votre remplissage chez ${vars.salonName} !`,
    it: `È ora del ritocco presso ${vars.salonName}!`,
  };
  const bodies: Record<EmailLocale, string> = {
    de: `<p>Hallo ${vars.customerName},</p><p>Dein letzter <strong>${vars.serviceName}</strong>-Termin bei <strong>${vars.salonName}</strong> war am ${vars.lastVisitDate}. Es ist Zeit für eine Auffüllung!</p><p><a href="${vars.bookingUrl}" style="display:inline-block;padding:12px 24px;background:#E8624A;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Jetzt Termin buchen →</a></p><p>solen.ch</p>`,
    en: `<p>Hello ${vars.customerName},</p><p>Your last <strong>${vars.serviceName}</strong> appointment at <strong>${vars.salonName}</strong> was on ${vars.lastVisitDate}. Time for an infill!</p><p><a href="${vars.bookingUrl}" style="display:inline-block;padding:12px 24px;background:#E8624A;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Book now →</a></p><p>solen.ch</p>`,
    fr: `<p>Bonjour ${vars.customerName},</p><p>Votre dernier rendez-vous <strong>${vars.serviceName}</strong> chez <strong>${vars.salonName}</strong> était le ${vars.lastVisitDate}. C'est l'heure du remplissage !</p><p><a href="${vars.bookingUrl}" style="display:inline-block;padding:12px 24px;background:#E8624A;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Réserver maintenant →</a></p><p>solen.ch</p>`,
    it: `<p>Ciao ${vars.customerName},</p><p>Il tuo ultimo appuntamento <strong>${vars.serviceName}</strong> presso <strong>${vars.salonName}</strong> era il ${vars.lastVisitDate}. È ora del ritocco!</p><p><a href="${vars.bookingUrl}" style="display:inline-block;padding:12px 24px;background:#E8624A;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Prenota ora →</a></p><p>solen.ch</p>`,
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
    de: `<p>Hallo <strong>${vars.salonName}</strong>,</p><p><strong>${vars.customerName}</strong> hat einen Termin am ${vars.bookingDate} gebucht und hat folgende Allergien vermerkt:</p><p style="background:#FEF3C7;padding:12px;border-radius:8px;border-left:4px solid #D4870A"><strong>${vars.allergies}</strong></p><p>Bitte stellen Sie sicher, dass die verwendeten Produkte kompatibel sind.</p><p>solen.ch</p>`,
    en: `<p>Hello <strong>${vars.salonName}</strong>,</p><p><strong>${vars.customerName}</strong> has booked an appointment on ${vars.bookingDate} and has the following allergies on file:</p><p style="background:#FEF3C7;padding:12px;border-radius:8px;border-left:4px solid #D4870A"><strong>${vars.allergies}</strong></p><p>Please ensure compatible products are used.</p><p>solen.ch</p>`,
    fr: `<p>Bonjour <strong>${vars.salonName}</strong>,</p><p><strong>${vars.customerName}</strong> a réservé un rendez-vous le ${vars.bookingDate} et a les allergies suivantes :</p><p style="background:#FEF3C7;padding:12px;border-radius:8px;border-left:4px solid #D4870A"><strong>${vars.allergies}</strong></p><p>Veuillez utiliser des produits compatibles.</p><p>solen.ch</p>`,
    it: `<p>Ciao <strong>${vars.salonName}</strong>,</p><p><strong>${vars.customerName}</strong> ha prenotato un appuntamento il ${vars.bookingDate} e ha le seguenti allergie registrate:</p><p style="background:#FEF3C7;padding:12px;border-radius:8px;border-left:4px solid #D4870A"><strong>${vars.allergies}</strong></p><p>Si prega di utilizzare prodotti compatibili.</p><p>solen.ch</p>`,
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
    de: `<p>Hey ${vars.customerName},</p><p>Dein letzter Schnitt bei <strong>${vars.salonName}</strong> war vor ${vars.daysSince} Tagen. Bereit für ein frisches Styling?</p><p><a href="${vars.bookingUrl}" style="display:inline-block;padding:12px 24px;background:#E8624A;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Jetzt Termin buchen →</a></p><p style="color:#999;font-size:12px;margin-top:24px">— Dein Solen Team</p>`,
    en: `<p>Hey ${vars.customerName},</p><p>Your last cut at <strong>${vars.salonName}</strong> was ${vars.daysSince} days ago. Ready for a fresh look?</p><p><a href="${vars.bookingUrl}" style="display:inline-block;padding:12px 24px;background:#E8624A;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Book now →</a></p><p style="color:#999;font-size:12px;margin-top:24px">— Your Solen Team</p>`,
    fr: `<p>Salut ${vars.customerName},</p><p>Ta dernière coupe chez <strong>${vars.salonName}</strong> remonte à ${vars.daysSince} jours. Prêt pour un nouveau look ?</p><p><a href="${vars.bookingUrl}" style="display:inline-block;padding:12px 24px;background:#E8624A;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Réserver maintenant →</a></p><p style="color:#999;font-size:12px;margin-top:24px">— Ton équipe Solen</p>`,
    it: `<p>Ciao ${vars.customerName},</p><p>Il tuo ultimo taglio da <strong>${vars.salonName}</strong> risale a ${vars.daysSince} giorni fa. Pronto per un nuovo look?</p><p><a href="${vars.bookingUrl}" style="display:inline-block;padding:12px 24px;background:#E8624A;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Prenota ora →</a></p><p style="color:#999;font-size:12px;margin-top:24px">— Il tuo team Solen</p>`,
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
    de: `${vars.customerName}, du bist auf Position ${vars.position} in der Warteschlange bei ${vars.salonName}. Geschätzte Wartezeit: ~${vars.estimatedMinutes} Min. Wir melden uns, wenn du dran bist!`,
    en: `${vars.customerName}, you're #${vars.position} in the queue at ${vars.salonName}. Estimated wait: ~${vars.estimatedMinutes} min. We'll notify you when it's your turn!`,
    fr: `${vars.customerName}, vous êtes en position ${vars.position} dans la file chez ${vars.salonName}. Attente estimée : ~${vars.estimatedMinutes} min. Nous vous préviendrons !`,
    it: `${vars.customerName}, sei in posizione ${vars.position} nella coda da ${vars.salonName}. Attesa stimata: ~${vars.estimatedMinutes} min. Ti avviseremo quando sarà il tuo turno!`,
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
    de: `Deine Treuekarte bei ${vars.salonName} ist voll!`,
    en: `Your loyalty card at ${vars.salonName} is complete!`,
    fr: `Ta carte fidélité chez ${vars.salonName} est complète !`,
    it: `La tua carta fedeltà da ${vars.salonName} è completa!`,
  };
  const bodies: Record<EmailLocale, string> = {
    de: `<p>Hey ${vars.customerName},</p><p>Glückwunsch! Deine Treuekarte bei <strong>${vars.salonName}</strong> ist voll. Du hast dir folgende Belohnung verdient:</p><p style="background:#FAF6EF;padding:16px;border-radius:8px;text-align:center;font-size:18px;font-weight:600;color:#E8624A">${vars.reward}</p><p><a href="${vars.redeemUrl}" style="display:inline-block;padding:12px 24px;background:#E8624A;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Belohnung einlösen →</a></p><p style="color:#999;font-size:12px;margin-top:24px">— Dein Solen Team</p>`,
    en: `<p>Hey ${vars.customerName},</p><p>Congrats! Your loyalty card at <strong>${vars.salonName}</strong> is complete. You've earned:</p><p style="background:#FAF6EF;padding:16px;border-radius:8px;text-align:center;font-size:18px;font-weight:600;color:#E8624A">${vars.reward}</p><p><a href="${vars.redeemUrl}" style="display:inline-block;padding:12px 24px;background:#E8624A;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Redeem reward →</a></p><p style="color:#999;font-size:12px;margin-top:24px">— Your Solen Team</p>`,
    fr: `<p>Salut ${vars.customerName},</p><p>Félicitations ! Ta carte fidélité chez <strong>${vars.salonName}</strong> est complète. Tu as gagné :</p><p style="background:#FAF6EF;padding:16px;border-radius:8px;text-align:center;font-size:18px;font-weight:600;color:#E8624A">${vars.reward}</p><p><a href="${vars.redeemUrl}" style="display:inline-block;padding:12px 24px;background:#E8624A;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Utiliser la récompense →</a></p><p style="color:#999;font-size:12px;margin-top:24px">— Ton équipe Solen</p>`,
    it: `<p>Ciao ${vars.customerName},</p><p>Complimenti! La tua carta fedeltà da <strong>${vars.salonName}</strong> è completa. Hai guadagnato:</p><p style="background:#FAF6EF;padding:16px;border-radius:8px;text-align:center;font-size:18px;font-weight:600;color:#E8624A">${vars.reward}</p><p><a href="${vars.redeemUrl}" style="display:inline-block;padding:12px 24px;background:#E8624A;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Riscatta il premio →</a></p><p style="color:#999;font-size:12px;margin-top:24px">— Il tuo team Solen</p>`,
  };
  return { to, subject: subjects[locale], html: bodies[locale] };
}
