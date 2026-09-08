import { escapeHtml, type EmailLocale, type EmailPayload } from "../email";
import { EMAIL_COLORS } from "../email-colors";

// seo-comms-04 (2026-07-27): every function below used to accept a `locale: EmailLocale`
// parameter and ignore it completely, hardcoding German subject/body regardless of the
// caller's resolved locale. These are financially/legally significant notices (no-show
// fees, late-cancellation fees, refunds, upcharges, account suspension), so a fr/it/en
// customer previously got a German-only explanation for a charge or suspension. Callers
// (lib/bookings/notify-no-show-fee.ts, notify-refund.ts, notify-upcharge.ts, lib/notifications.ts)
// already resolve and pass the real customer locale; the gap was entirely inside these
// template bodies. Fixed by branching every subject/body on locale, matching the
// Record<EmailLocale,string> pattern already used in lib/email.ts and
// lib/email-templates/booking-notifications.ts.

export function bookingPendingApprovalEmail(to: string, vars: { service: string; customerName: string; date: string; time: string; approvalUrl: string }, locale: EmailLocale = "de"): EmailPayload {
  const subjects: Record<EmailLocale, string> = {
    de: `Buchung wartet auf Bestätigung: ${vars.service} für ${vars.customerName}`,
    en: `Booking awaiting confirmation: ${vars.service} for ${vars.customerName}`,
    fr: `Réservation en attente de confirmation : ${vars.service} pour ${vars.customerName}`,
    it: `Prenotazione in attesa di conferma: ${vars.service} per ${vars.customerName}`,
  };
  const bodies: Record<EmailLocale, string> = {
    de: `<p>Hallo,</p><p>Eine neue Buchung wartet auf Ihre Bestätigung: <strong>${vars.service}</strong> am ${vars.date} um ${vars.time} Uhr für ${vars.customerName}.</p><p><a href="${vars.approvalUrl}">Jetzt bestätigen oder ablehnen</a></p>`,
    en: `<p>Hello,</p><p>A new booking is awaiting your confirmation: <strong>${vars.service}</strong> on ${vars.date} at ${vars.time} for ${vars.customerName}.</p><p><a href="${vars.approvalUrl}">Confirm or decline now</a></p>`,
    fr: `<p>Bonjour,</p><p>Une nouvelle réservation attend votre confirmation : <strong>${vars.service}</strong> le ${vars.date} à ${vars.time} pour ${vars.customerName}.</p><p><a href="${vars.approvalUrl}">Confirmer ou refuser maintenant</a></p>`,
    it: `<p>Buongiorno,</p><p>Una nuova prenotazione è in attesa della Sua conferma: <strong>${vars.service}</strong> il ${vars.date} alle ${vars.time} per ${vars.customerName}.</p><p><a href="${vars.approvalUrl}">Conferma o rifiuta ora</a></p>`,
  };
  return { to, subject: subjects[locale], html: bodies[locale] };
}

export function bookingApprovedEmail(to: string, vars: { service: string; salonName: string; date: string; time: string }, locale: EmailLocale = "de"): EmailPayload {
  const subjects: Record<EmailLocale, string> = {
    de: `Buchung bestätigt: ${vars.service} bei ${vars.salonName}`,
    en: `Booking confirmed: ${vars.service} at ${vars.salonName}`,
    fr: `Réservation confirmée : ${vars.service} chez ${vars.salonName}`,
    it: `Prenotazione confermata: ${vars.service} presso ${vars.salonName}`,
  };
  const bodies: Record<EmailLocale, string> = {
    de: `<p>Hallo,</p><p>Ihre Buchung für <strong>${vars.service}</strong> bei <strong>${vars.salonName}</strong> am ${vars.date} um ${vars.time} Uhr wurde vom Salon bestätigt.</p>`,
    en: `<p>Hello,</p><p>Your booking for <strong>${vars.service}</strong> at <strong>${vars.salonName}</strong> on ${vars.date} at ${vars.time} has been confirmed by the salon.</p>`,
    fr: `<p>Bonjour,</p><p>Votre réservation pour <strong>${vars.service}</strong> chez <strong>${vars.salonName}</strong> le ${vars.date} à ${vars.time} a été confirmée par le salon.</p>`,
    it: `<p>Buongiorno,</p><p>La Sua prenotazione per <strong>${vars.service}</strong> presso <strong>${vars.salonName}</strong> il ${vars.date} alle ${vars.time} è stata confermata dal salone.</p>`,
  };
  return { to, subject: subjects[locale], html: bodies[locale] };
}

export function bookingRejectedEmail(to: string, vars: { service: string; salonName: string; date: string; time: string; reason?: string }, locale: EmailLocale = "de"): EmailPayload {
  const subjects: Record<EmailLocale, string> = {
    de: `Buchung abgelehnt: ${vars.service} bei ${vars.salonName}`,
    en: `Booking declined: ${vars.service} at ${vars.salonName}`,
    fr: `Réservation refusée : ${vars.service} chez ${vars.salonName}`,
    it: `Prenotazione rifiutata: ${vars.service} presso ${vars.salonName}`,
  };
  const reasonLines: Record<EmailLocale, string> = {
    de: vars.reason ? `<p>Grund: ${vars.reason}</p>` : "",
    en: vars.reason ? `<p>Reason: ${vars.reason}</p>` : "",
    fr: vars.reason ? `<p>Raison : ${vars.reason}</p>` : "",
    it: vars.reason ? `<p>Motivo: ${vars.reason}</p>` : "",
  };
  const bodies: Record<EmailLocale, string> = {
    de: `<p>Hallo,</p><p>Ihre Anfrage für <strong>${vars.service}</strong> bei <strong>${vars.salonName}</strong> am ${vars.date} wurde vom Salon abgelehnt.</p>${reasonLines.de}`,
    en: `<p>Hello,</p><p>Your request for <strong>${vars.service}</strong> at <strong>${vars.salonName}</strong> on ${vars.date} was declined by the salon.</p>${reasonLines.en}`,
    fr: `<p>Bonjour,</p><p>Votre demande pour <strong>${vars.service}</strong> chez <strong>${vars.salonName}</strong> le ${vars.date} a été refusée par le salon.</p>${reasonLines.fr}`,
    it: `<p>Buongiorno,</p><p>La Sua richiesta per <strong>${vars.service}</strong> presso <strong>${vars.salonName}</strong> il ${vars.date} è stata rifiutata dal salone.</p>${reasonLines.it}`,
  };
  return { to, subject: subjects[locale], html: bodies[locale] };
}

export function bookingModifiedEmail(to: string, vars: { service: string; customerName: string; date: string; time: string; detailsUrl: string }, locale: EmailLocale = "de"): EmailPayload {
  const subjects: Record<EmailLocale, string> = {
    de: `Buchung geändert: ${vars.service} für ${vars.customerName}`,
    en: `Booking changed: ${vars.service} for ${vars.customerName}`,
    fr: `Réservation modifiée : ${vars.service} pour ${vars.customerName}`,
    it: `Prenotazione modificata: ${vars.service} per ${vars.customerName}`,
  };
  const bodies: Record<EmailLocale, string> = {
    de: `<p>Hallo,</p><p>Die Buchung für <strong>${vars.service}</strong> am ${vars.date} um ${vars.time} Uhr wurde geändert.</p><p><a href="${vars.detailsUrl}">Details ansehen</a></p>`,
    en: `<p>Hello,</p><p>The booking for <strong>${vars.service}</strong> on ${vars.date} at ${vars.time} has been changed.</p><p><a href="${vars.detailsUrl}">View details</a></p>`,
    fr: `<p>Bonjour,</p><p>La réservation pour <strong>${vars.service}</strong> le ${vars.date} à ${vars.time} a été modifiée.</p><p><a href="${vars.detailsUrl}">Voir les détails</a></p>`,
    it: `<p>Buongiorno,</p><p>La prenotazione per <strong>${vars.service}</strong> il ${vars.date} alle ${vars.time} è stata modificata.</p><p><a href="${vars.detailsUrl}">Vedi i dettagli</a></p>`,
  };
  return { to, subject: subjects[locale], html: bodies[locale] };
}

export function noShowChargeEmail(to: string, vars: { service: string; salonName: string; date: string; feeAmount: string }, locale: EmailLocale = "de"): EmailPayload {
  const subjects: Record<EmailLocale, string> = {
    de: `Nicht erschienen zu Termin bei ${vars.salonName}`,
    en: `No-show for appointment at ${vars.salonName}`,
    fr: `Absence au rendez-vous chez ${vars.salonName}`,
    it: `Mancata presentazione all'appuntamento da ${vars.salonName}`,
  };
  const bodies: Record<EmailLocale, string> = {
    de: `<p>Hallo,</p><p>Es wurde gemeldet, dass Sie zu Ihrem Termin für <strong>${vars.service}</strong> am ${vars.date} bei <strong>${vars.salonName}</strong> nicht erschienen sind.</p><p>Ihnen wurde eine Nichterscheinen-Gebühr in Höhe von ${vars.feeAmount} berechnet (gemäss AGB §4.4).</p>`,
    en: `<p>Hello,</p><p>It has been reported that you did not show up for your appointment for <strong>${vars.service}</strong> on ${vars.date} at <strong>${vars.salonName}</strong>.</p><p>You have been charged a no-show fee of ${vars.feeAmount} (per Terms §4.4).</p>`,
    fr: `<p>Bonjour,</p><p>Il a été signalé que vous ne vous êtes pas présenté(e) à votre rendez-vous pour <strong>${vars.service}</strong> le ${vars.date} chez <strong>${vars.salonName}</strong>.</p><p>Des frais d'absence de ${vars.feeAmount} vous ont été facturés (conformément aux CGV §4.4).</p>`,
    it: `<p>Buongiorno,</p><p>È stato segnalato che non si è presentato/a al Suo appuntamento per <strong>${vars.service}</strong> il ${vars.date} da <strong>${vars.salonName}</strong>.</p><p>Le è stata addebitata una penale di mancata presentazione di ${vars.feeAmount} (secondo i Termini §4.4).</p>`,
  };
  return { to, subject: subjects[locale], html: bodies[locale] };
}

export function lateCancellationFeeEmail(to: string, vars: { service: string; salonName: string; date: string; feeAmount: string }, locale: EmailLocale = "de"): EmailPayload {
  const subjects: Record<EmailLocale, string> = {
    de: `Späte Stornierung bei ${vars.salonName}`,
    en: `Late cancellation at ${vars.salonName}`,
    fr: `Annulation tardive chez ${vars.salonName}`,
    it: `Cancellazione tardiva da ${vars.salonName}`,
  };
  const bodies: Record<EmailLocale, string> = {
    de: `<p>Hallo,</p><p>Sie haben Ihren Termin für <strong>${vars.service}</strong> am ${vars.date} bei <strong>${vars.salonName}</strong> innerhalb der vereinbarten Stornofrist storniert.</p><p>Ihnen wurde eine Stornierungsgebühr in Höhe von ${vars.feeAmount} berechnet (gemäss AGB §4.2).</p>`,
    en: `<p>Hello,</p><p>You cancelled your appointment for <strong>${vars.service}</strong> on ${vars.date} at <strong>${vars.salonName}</strong> within the agreed cancellation window.</p><p>You have been charged a cancellation fee of ${vars.feeAmount} (per Terms §4.2).</p>`,
    fr: `<p>Bonjour,</p><p>Vous avez annulé votre rendez-vous pour <strong>${vars.service}</strong> le ${vars.date} chez <strong>${vars.salonName}</strong> pendant la période de frais convenue.</p><p>Des frais d'annulation de ${vars.feeAmount} vous ont été facturés (conformément aux CGV §4.2).</p>`,
    it: `<p>Buongiorno,</p><p>Ha cancellato il Suo appuntamento per <strong>${vars.service}</strong> il ${vars.date} da <strong>${vars.salonName}</strong> entro il periodo di penale concordato.</p><p>Le è stata addebitata una penale di cancellazione di ${vars.feeAmount} (secondo i Termini §4.2).</p>`,
  };
  return { to, subject: subjects[locale], html: bodies[locale] };
}

// 2026-09-06 (owner-approved variant B of public/_mockups/r2-fee-failed/index.html): sent
// INSTEAD OF noShowChargeEmail / lateCancellationFeeEmail when the automated off-session
// fee charge lands on 'failed' (a genuine decline) or 'requires_action' (SCA re-auth
// needed), so the customer is never silently left owing money nobody told them about.
// Keeps the same greeting + appointment-context sentence shape as its two siblings above,
// changes only the fee sentence (could not be charged, instead of was charged) and adds
// one button. The button reuses the exact ink-CTA recipe already shipped for a different
// pay email (lib/email.ts, walkInPaymentEmail: padding 12px 24px, background #0A0A0A,
// color #fff, border-radius 8px, font-weight 600), not an invented recipe.
export function feePaymentIssueEmail(
  to: string,
  vars: { service: string; salonName: string; date: string; feeAmount: string; payUrl: string; kind: "no_show" | "cancellation" },
  locale: EmailLocale = "de"
): EmailPayload {
  const subjects = {
    no_show: {
      de: `Zahlungsproblem: No-Show-Gebühr bei ${vars.salonName}`,
      en: `Payment issue: no-show fee at ${vars.salonName}`,
      fr: `Problème de paiement : frais de non-présentation chez ${vars.salonName}`,
      it: `Problema di pagamento: penale per mancata presentazione presso ${vars.salonName}`,
    },
    cancellation: {
      de: `Zahlungsproblem: Stornogebühr bei ${vars.salonName}`,
      en: `Payment issue: cancellation fee at ${vars.salonName}`,
      fr: `Problème de paiement : frais d'annulation chez ${vars.salonName}`,
      it: `Problema di pagamento: penale di cancellazione presso ${vars.salonName}`,
    },
  } as const;

  const buttonLabels: Record<EmailLocale, string> = {
    de: "Gebühr bezahlen",
    en: "Pay fee",
    fr: "Payer les frais",
    it: "Paga la penale",
  };
  const button = `<p><a href="${escapeHtml(vars.payUrl)}" style="display:inline-block;padding:12px 24px;background:#0A0A0A;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">${buttonLabels[locale]} →</a></p>`;

  const bodies: Record<"no_show" | "cancellation", Record<EmailLocale, string>> = {
    no_show: {
      de: `<p>Hallo,</p><p>Es wurde gemeldet, dass Sie zu Ihrem Termin für <strong>${escapeHtml(vars.service)}</strong> am ${escapeHtml(vars.date)} bei <strong>${escapeHtml(vars.salonName)}</strong> nicht erschienen sind.</p><p>Leider konnte die Nichterscheinen-Gebühr in Höhe von ${escapeHtml(vars.feeAmount)} nicht von Ihrer hinterlegten Karte abgebucht werden. Die Gebühr bleibt bestehen (gemäss AGB §4.4).</p>${button}`,
      en: `<p>Hello,</p><p>It has been reported that you did not show up for your appointment for <strong>${escapeHtml(vars.service)}</strong> on ${escapeHtml(vars.date)} at <strong>${escapeHtml(vars.salonName)}</strong>.</p><p>Unfortunately, we were unable to charge your no-show fee of ${escapeHtml(vars.feeAmount)} to your card on file. The fee is still owed (per Terms §4.4).</p>${button}`,
      fr: `<p>Bonjour,</p><p>Il a été signalé que vous ne vous êtes pas présenté(e) à votre rendez-vous pour <strong>${escapeHtml(vars.service)}</strong> le ${escapeHtml(vars.date)} chez <strong>${escapeHtml(vars.salonName)}</strong>.</p><p>Malheureusement, nous n'avons pas pu débiter vos frais d'absence de ${escapeHtml(vars.feeAmount)} sur votre carte enregistrée. Ces frais restent dus (conformément aux CGV §4.4).</p>${button}`,
      it: `<p>Buongiorno,</p><p>È stato segnalato che non si è presentato/a al Suo appuntamento per <strong>${escapeHtml(vars.service)}</strong> il ${escapeHtml(vars.date)} da <strong>${escapeHtml(vars.salonName)}</strong>.</p><p>Purtroppo non è stato possibile addebitare la penale di mancata presentazione di ${escapeHtml(vars.feeAmount)} sulla carta registrata. La penale resta dovuta (secondo i Termini §4.4).</p>${button}`,
    },
    cancellation: {
      de: `<p>Hallo,</p><p>Sie haben Ihren Termin für <strong>${escapeHtml(vars.service)}</strong> am ${escapeHtml(vars.date)} bei <strong>${escapeHtml(vars.salonName)}</strong> innerhalb der vereinbarten Stornofrist storniert.</p><p>Leider konnte die Stornierungsgebühr in Höhe von ${escapeHtml(vars.feeAmount)} nicht von Ihrer hinterlegten Karte abgebucht werden. Die Gebühr bleibt bestehen (gemäss AGB §4.2).</p>${button}`,
      en: `<p>Hello,</p><p>You cancelled your appointment for <strong>${escapeHtml(vars.service)}</strong> on ${escapeHtml(vars.date)} at <strong>${escapeHtml(vars.salonName)}</strong> within the agreed cancellation window.</p><p>Unfortunately, we were unable to charge your cancellation fee of ${escapeHtml(vars.feeAmount)} to your card on file. The fee is still owed (per Terms §4.2).</p>${button}`,
      fr: `<p>Bonjour,</p><p>Vous avez annulé votre rendez-vous pour <strong>${escapeHtml(vars.service)}</strong> le ${escapeHtml(vars.date)} chez <strong>${escapeHtml(vars.salonName)}</strong> pendant la période de frais convenue.</p><p>Malheureusement, nous n'avons pas pu débiter vos frais d'annulation de ${escapeHtml(vars.feeAmount)} sur votre carte enregistrée. Ces frais restent dus (conformément aux CGV §4.2).</p>${button}`,
      it: `<p>Buongiorno,</p><p>Ha cancellato il Suo appuntamento per <strong>${escapeHtml(vars.service)}</strong> il ${escapeHtml(vars.date)} da <strong>${escapeHtml(vars.salonName)}</strong> entro il periodo di penale concordato.</p><p>Purtroppo non è stato possibile addebitare la penale di cancellazione di ${escapeHtml(vars.feeAmount)} sulla carta registrata. La penale resta dovuta (secondo i Termini §4.2).</p>${button}`,
    },
  };

  return { to, subject: subjects[vars.kind][locale], html: bodies[vars.kind][locale] };
}

export function refundProcessedEmail(to: string, vars: { service: string; salonName: string; amount: string; net?: string; vat?: string; rate?: string; vatNumber?: string }, locale: EmailLocale = "de"): EmailPayload {
  // Per-locale labels for the optional Swiss VAT credit-note (Gutschrift) breakdown,
  // shown only when the refunded booking carried VAT (registered salon).
  const CN = {
    de: { net: "Erstattet (netto)", vatOf: "davon MWST", total: "Gutschrift gesamt", nr: "Gutschrift zu MWST-Nr." },
    en: { net: "Refunded (net)", vatOf: "of which VAT", total: "Total credit", nr: "Credit note re VAT no." },
    fr: { net: "Remboursé (net)", vatOf: "dont TVA", total: "Avoir total", nr: "Avoir relatif au n° TVA" },
    it: { net: "Rimborsato (netto)", vatOf: "di cui IVA", total: "Nota di credito totale", nr: "Nota di credito rif. P.IVA" },
  }[locale];
  const creditNote = vars.net && vars.vat && vars.rate
    ? `<table style="margin-top:12px;border-collapse:collapse;font-size:14px">` +
      `<tr><td style="padding:3px 24px 3px 0;color:${EMAIL_COLORS.ink2}">${CN.net}</td><td style="padding:3px 0;text-align:right">${vars.net}</td></tr>` +
      `<tr><td style="padding:3px 24px 3px 0;color:${EMAIL_COLORS.ink2}">${CN.vatOf} ${vars.rate}%</td><td style="padding:3px 0;text-align:right">${vars.vat}</td></tr>` +
      `<tr><td style="padding:6px 24px 0 0;font-weight:700">${CN.total}</td><td style="padding:6px 0 0;text-align:right;font-weight:700">${vars.amount}</td></tr>` +
      `</table>` +
      (vars.vatNumber ? `<p style="margin-top:6px;color:${EMAIL_COLORS.ink2};font-size:12px">${CN.nr} ${vars.vatNumber}</p>` : "")
    : "";
  const subjects: Record<EmailLocale, string> = {
    de: `Rückerstattung verarbeitet: ${vars.amount} für ${vars.salonName}`,
    en: `Refund processed: ${vars.amount} for ${vars.salonName}`,
    fr: `Remboursement traité : ${vars.amount} pour ${vars.salonName}`,
    it: `Rimborso elaborato: ${vars.amount} per ${vars.salonName}`,
  };
  const bodies: Record<EmailLocale, string> = {
    de: `<p>Hallo,</p><p>Eine Rückerstattung in Höhe von <strong>${vars.amount}</strong> für Ihre Buchung (<strong>${vars.service}</strong>) bei <strong>${vars.salonName}</strong> wurde verarbeitet. Es kann einige Tage dauern, bis das Geld auf Ihrem Konto eingeht.</p>${creditNote}`,
    en: `<p>Hello,</p><p>A refund of <strong>${vars.amount}</strong> for your booking (<strong>${vars.service}</strong>) at <strong>${vars.salonName}</strong> has been processed. It may take a few days for the funds to appear in your account.</p>${creditNote}`,
    fr: `<p>Bonjour,</p><p>Un remboursement de <strong>${vars.amount}</strong> pour votre réservation (<strong>${vars.service}</strong>) chez <strong>${vars.salonName}</strong> a été traité. Cela peut prendre quelques jours avant que les fonds n'apparaissent sur votre compte.</p>${creditNote}`,
    it: `<p>Buongiorno,</p><p>Un rimborso di <strong>${vars.amount}</strong> per la Sua prenotazione (<strong>${vars.service}</strong>) presso <strong>${vars.salonName}</strong> è stato elaborato. Potrebbero essere necessari alcuni giorni prima che i fondi appaiano sul Suo conto.</p>${creditNote}`,
  };
  return { to, subject: subjects[locale], html: bodies[locale] };
}

export function upchargeChargedEmail(to: string, vars: { service: string; salonName: string; amount: string }, locale: EmailLocale = "de"): EmailPayload {
  const subjects: Record<EmailLocale, string> = {
    de: `Nachzahlung belastet: ${vars.salonName}`,
    en: `Additional charge: ${vars.salonName}`,
    fr: `Supplément débité : ${vars.salonName}`,
    it: `Supplemento addebitato: ${vars.salonName}`,
  };
  const bodies: Record<EmailLocale, string> = {
    de: `<p>Hallo,</p><p>Der von Ihnen genehmigte Aufpreis in Höhe von <strong>${vars.amount}</strong> für Ihre Buchung (<strong>${vars.service}</strong>) bei <strong>${vars.salonName}</strong> wurde Ihrer hinterlegten Karte belastet.</p>`,
    en: `<p>Hello,</p><p>The additional charge of <strong>${vars.amount}</strong> you approved for your booking (<strong>${vars.service}</strong>) at <strong>${vars.salonName}</strong> has been charged to your card on file.</p>`,
    fr: `<p>Bonjour,</p><p>Le supplément de <strong>${vars.amount}</strong> que vous avez approuvé pour votre réservation (<strong>${vars.service}</strong>) chez <strong>${vars.salonName}</strong> a été débité de votre carte enregistrée.</p>`,
    it: `<p>Buongiorno,</p><p>Il supplemento di <strong>${vars.amount}</strong> che ha approvato per la Sua prenotazione (<strong>${vars.service}</strong>) presso <strong>${vars.salonName}</strong> è stato addebitato sulla Sua carta registrata.</p>`,
  };
  return { to, subject: subjects[locale], html: bodies[locale] };
}

export function newReviewEmail(to: string, vars: { customerName: string; rating: number; salonUrl: string }, locale: EmailLocale = "de"): EmailPayload {
  const subjects: Record<EmailLocale, string> = {
    de: `Neue ${vars.rating}-Sterne Bewertung von ${vars.customerName}`,
    en: `New ${vars.rating}-star review from ${vars.customerName}`,
    fr: `Nouvel avis ${vars.rating} étoiles de ${vars.customerName}`,
    it: `Nuova recensione a ${vars.rating} stelle da ${vars.customerName}`,
  };
  const bodies: Record<EmailLocale, string> = {
    de: `<p>Hallo,</p><p>Sie haben eine neue ${vars.rating}-Sterne Bewertung von <strong>${vars.customerName}</strong> erhalten.</p><p><a href="${vars.salonUrl}">Bewertung ansehen und beantworten</a></p>`,
    en: `<p>Hello,</p><p>You have received a new ${vars.rating}-star review from <strong>${vars.customerName}</strong>.</p><p><a href="${vars.salonUrl}">View and respond to review</a></p>`,
    fr: `<p>Bonjour,</p><p>Vous avez reçu un nouvel avis ${vars.rating} étoiles de <strong>${vars.customerName}</strong>.</p><p><a href="${vars.salonUrl}">Voir et répondre à l'avis</a></p>`,
    it: `<p>Buongiorno,</p><p>Ha ricevuto una nuova recensione a ${vars.rating} stelle da <strong>${vars.customerName}</strong>.</p><p><a href="${vars.salonUrl}">Visualizza e rispondi alla recensione</a></p>`,
  };
  return { to, subject: subjects[locale], html: bodies[locale] };
}

export function reviewResponseEmail(to: string, vars: { salonName: string; response: string; reviewUrl: string }, locale: EmailLocale = "de"): EmailPayload {
  const subjects: Record<EmailLocale, string> = {
    de: `Antwort auf Ihre Bewertung von ${vars.salonName}`,
    en: `Response to your review from ${vars.salonName}`,
    fr: `Réponse à votre avis de ${vars.salonName}`,
    it: `Risposta alla Sua recensione da ${vars.salonName}`,
  };
  const intros: Record<EmailLocale, string> = {
    de: `<p>Hallo,</p><p><strong>${vars.salonName}</strong> hat auf Ihre Bewertung geantwortet:</p>`,
    en: `<p>Hello,</p><p><strong>${vars.salonName}</strong> has responded to your review:</p>`,
    fr: `<p>Bonjour,</p><p><strong>${vars.salonName}</strong> a répondu à votre avis :</p>`,
    it: `<p>Buongiorno,</p><p><strong>${vars.salonName}</strong> ha risposto alla Sua recensione:</p>`,
  };
  const linkLabels: Record<EmailLocale, string> = {
    de: "Zur Bewertung",
    en: "View review",
    fr: "Voir l'avis",
    it: "Vedi la recensione",
  };
  const bodies: Record<EmailLocale, string> = {
    de: `${intros.de}<blockquote style="border-left:4px solid ${EMAIL_COLORS.border};padding-left:16px">${vars.response}</blockquote><p><a href="${vars.reviewUrl}">${linkLabels.de}</a></p>`,
    en: `${intros.en}<blockquote style="border-left:4px solid ${EMAIL_COLORS.border};padding-left:16px">${vars.response}</blockquote><p><a href="${vars.reviewUrl}">${linkLabels.en}</a></p>`,
    fr: `${intros.fr}<blockquote style="border-left:4px solid ${EMAIL_COLORS.border};padding-left:16px">${vars.response}</blockquote><p><a href="${vars.reviewUrl}">${linkLabels.fr}</a></p>`,
    it: `${intros.it}<blockquote style="border-left:4px solid ${EMAIL_COLORS.border};padding-left:16px">${vars.response}</blockquote><p><a href="${vars.reviewUrl}">${linkLabels.it}</a></p>`,
  };
  return { to, subject: subjects[locale], html: bodies[locale] };
}

export function reviewFlaggedEmail(to: string, vars: { salonName: string }, locale: EmailLocale = "de"): EmailPayload {
  const subjects: Record<EmailLocale, string> = {
    de: `Ihre Bewertung für ${vars.salonName} wurde wegen Verstoß gegen Richtlinien gemeldet`,
    en: `Your review for ${vars.salonName} was flagged for violating guidelines`,
    fr: `Votre avis pour ${vars.salonName} a été signalé pour non-respect des règles`,
    it: `La Sua recensione per ${vars.salonName} è stata segnalata per violazione delle linee guida`,
  };
  const bodies: Record<EmailLocale, string> = {
    de: `<p>Hallo,</p><p>Ihre kürzlich verfasste Bewertung für <strong>${vars.salonName}</strong> wurde von unserem System zur Überprüfung gemeldet. Bitte beachten Sie unsere Richtlinien für Bewertungen auf solen.ch.</p>`,
    en: `<p>Hello,</p><p>Your recently submitted review for <strong>${vars.salonName}</strong> was flagged by our system for review. Please review our guidelines for reviews on solen.ch.</p>`,
    fr: `<p>Bonjour,</p><p>Votre avis récemment publié pour <strong>${vars.salonName}</strong> a été signalé par notre système pour vérification. Merci de consulter nos règles concernant les avis sur solen.ch.</p>`,
    it: `<p>Buongiorno,</p><p>La Sua recensione recentemente pubblicata per <strong>${vars.salonName}</strong> è stata segnalata dal nostro sistema per una verifica. La invitiamo a consultare le nostre linee guida per le recensioni su solen.ch.</p>`,
  };
  return { to, subject: subjects[locale], html: bodies[locale] };
}

export function accountWarningEmail(to: string, vars: { reason: string }, locale: EmailLocale = "de"): EmailPayload {
  const subjects: Record<EmailLocale, string> = {
    de: `Verwarnung zu Ihrem solen.ch-Konto`,
    en: `Warning regarding your solen.ch account`,
    fr: `Avertissement concernant votre compte solen.ch`,
    it: `Avviso relativo al Suo account solen.ch`,
  };
  const bodies: Record<EmailLocale, string> = {
    de: `<p>Hallo,</p><p>Dies ist eine offizielle Verwarnung bezüglich Ihres Kontos auf solen.ch.</p><p>Grund: <strong>${vars.reason}</strong></p><p>Bitte stellen Sie sicher, dass Sie unsere Nutzungsbedingungen einhalten, da weitere Verstösse zur Kontosperrung führen können.</p>`,
    en: `<p>Hello,</p><p>This is an official warning regarding your account on solen.ch.</p><p>Reason: <strong>${vars.reason}</strong></p><p>Please make sure you comply with our terms of use, as further violations may lead to account suspension.</p>`,
    fr: `<p>Bonjour,</p><p>Ceci est un avertissement officiel concernant votre compte sur solen.ch.</p><p>Raison : <strong>${vars.reason}</strong></p><p>Veuillez vous assurer de respecter nos conditions d'utilisation, car d'autres infractions peuvent entraîner la suspension de votre compte.</p>`,
    it: `<p>Buongiorno,</p><p>Questo è un avviso ufficiale relativo al Suo account su solen.ch.</p><p>Motivo: <strong>${vars.reason}</strong></p><p>Si assicuri di rispettare i nostri termini di utilizzo, poiché ulteriori violazioni potrebbero comportare la sospensione dell'account.</p>`,
  };
  return { to, subject: subjects[locale], html: bodies[locale] };
}

export function accountSuspensionEmail(to: string, vars: { reason: string }, locale: EmailLocale = "de"): EmailPayload {
  const subjects: Record<EmailLocale, string> = {
    de: `Ihr solen.ch-Konto wurde gesperrt`,
    en: `Your solen.ch account has been suspended`,
    fr: `Votre compte solen.ch a été suspendu`,
    it: `Il Suo account solen.ch è stato sospeso`,
  };
  const bodies: Record<EmailLocale, string> = {
    de: `<p>Hallo,</p><p>Ihr Konto auf solen.ch wurde gesperrt.</p><p>Grund: <strong>${vars.reason}</strong></p><p>Wenn Sie glauben, dass dies ein Fehler ist, kontaktieren Sie uns bitte unter support@solen.ch.</p>`,
    en: `<p>Hello,</p><p>Your account on solen.ch has been suspended.</p><p>Reason: <strong>${vars.reason}</strong></p><p>If you believe this is a mistake, please contact us at support@solen.ch.</p>`,
    fr: `<p>Bonjour,</p><p>Votre compte sur solen.ch a été suspendu.</p><p>Raison : <strong>${vars.reason}</strong></p><p>Si vous pensez qu'il s'agit d'une erreur, veuillez nous contacter à support@solen.ch.</p>`,
    it: `<p>Buongiorno,</p><p>Il Suo account su solen.ch è stato sospeso.</p><p>Motivo: <strong>${vars.reason}</strong></p><p>Se ritiene che si tratti di un errore, ci contatti all'indirizzo support@solen.ch.</p>`,
  };
  return { to, subject: subjects[locale], html: bodies[locale] };
}

export function payoutCompletedEmail(to: string, vars: { amount: string; date: string; downloadUrl: string }, locale: EmailLocale = "de"): EmailPayload {
  const subjects: Record<EmailLocale, string> = {
    de: `Auszahlung verarbeitet: ${vars.amount}`,
    en: `Payout processed: ${vars.amount}`,
    fr: `Versement traité : ${vars.amount}`,
    it: `Pagamento elaborato: ${vars.amount}`,
  };
  const bodies: Record<EmailLocale, string> = {
    de: `<p>Hallo,</p><p>Ihre wöchentliche Auszahlung für Buchungen bis zum ${vars.date} in Höhe von <strong>${vars.amount}</strong> wurde verarbeitet. Es kann 1-3 Werktage dauern, bis das Geld auf Ihrem Bankkonto eingeht.</p><p><a href="${vars.downloadUrl}">Abrechnung herunterladen</a></p>`,
    en: `<p>Hello,</p><p>Your weekly payout for bookings up to ${vars.date} in the amount of <strong>${vars.amount}</strong> has been processed. It may take 1-3 business days for the funds to appear in your bank account.</p><p><a href="${vars.downloadUrl}">Download statement</a></p>`,
    fr: `<p>Bonjour,</p><p>Votre versement hebdomadaire pour les réservations jusqu'au ${vars.date}, d'un montant de <strong>${vars.amount}</strong>, a été traité. Il peut falloir 1 à 3 jours ouvrables pour que les fonds apparaissent sur votre compte bancaire.</p><p><a href="${vars.downloadUrl}">Télécharger le relevé</a></p>`,
    it: `<p>Buongiorno,</p><p>Il Suo pagamento settimanale per le prenotazioni fino al ${vars.date}, pari a <strong>${vars.amount}</strong>, è stato elaborato. Potrebbero essere necessari 1-3 giorni lavorativi prima che i fondi appaiano sul Suo conto bancario.</p><p><a href="${vars.downloadUrl}">Scarica l'estratto conto</a></p>`,
  };
  return { to, subject: subjects[locale], html: bodies[locale] };
}

export function payoutFailedEmail(to: string, vars: { amount: string; reason: string }, locale: EmailLocale = "de"): EmailPayload {
  const subjects: Record<EmailLocale, string> = {
    de: `Fehlgeschlagene Auszahlung: ${vars.amount}`,
    en: `Failed payout: ${vars.amount}`,
    fr: `Échec du versement : ${vars.amount}`,
    it: `Pagamento non riuscito: ${vars.amount}`,
  };
  const bodies: Record<EmailLocale, string> = {
    de: `<p>Hallo,</p><p>Leider ist eine Auszahlung in Höhe von <strong>${vars.amount}</strong> fehlgeschlagen. Grund: ${vars.reason}. Bitte überprüfen Sie Ihre Bankangaben (Stripe Connect) in Ihrem Dashboard.</p>`,
    en: `<p>Hello,</p><p>Unfortunately, a payout of <strong>${vars.amount}</strong> has failed. Reason: ${vars.reason}. Please check your bank details (Stripe Connect) in your dashboard.</p>`,
    fr: `<p>Bonjour,</p><p>Malheureusement, un versement de <strong>${vars.amount}</strong> a échoué. Raison : ${vars.reason}. Veuillez vérifier vos coordonnées bancaires (Stripe Connect) dans votre tableau de bord.</p>`,
    it: `<p>Buongiorno,</p><p>Purtroppo un pagamento di <strong>${vars.amount}</strong> non è riuscito. Motivo: ${vars.reason}. Controlli i Suoi dati bancari (Stripe Connect) nella Sua dashboard.</p>`,
  };
  return { to, subject: subjects[locale], html: bodies[locale] };
}

export function termsChangedEmail(to: string, vars: { effectiveDate: string; detailsUrl: string }, locale: EmailLocale = "de"): EmailPayload {
  const subjects: Record<EmailLocale, string> = {
    de: `Aktualisierung der Allgemeinen Geschäftsbedingungen`,
    en: `Update to our Terms and Conditions`,
    fr: `Mise à jour des conditions générales`,
    it: `Aggiornamento dei Termini e condizioni`,
  };
  const bodies: Record<EmailLocale, string> = {
    de: `<p>Hallo,</p><p>Wir haben unsere Allgemeinen Geschäftsbedingungen (AGB) aktualisiert. Diese treten am ${vars.effectiveDate} in Kraft.</p><p><a href="${vars.detailsUrl}">Änderungen ansehen</a></p>`,
    en: `<p>Hello,</p><p>We have updated our Terms and Conditions. They take effect on ${vars.effectiveDate}.</p><p><a href="${vars.detailsUrl}">View changes</a></p>`,
    fr: `<p>Bonjour,</p><p>Nous avons mis à jour nos conditions générales. Elles entrent en vigueur le ${vars.effectiveDate}.</p><p><a href="${vars.detailsUrl}">Voir les modifications</a></p>`,
    it: `<p>Buongiorno,</p><p>Abbiamo aggiornato i nostri Termini e condizioni. Entreranno in vigore il ${vars.effectiveDate}.</p><p><a href="${vars.detailsUrl}">Vedi le modifiche</a></p>`,
  };
  return { to, subject: subjects[locale], html: bodies[locale] };
}

export function salonStrikeEmail(to: string, vars: { strikeCount: number; reason: string }, locale: EmailLocale = "de"): EmailPayload {
  const subjects: Record<EmailLocale, string> = {
    de: `Strike ${vars.strikeCount}/3: Regelverstoss auf solen.ch`,
    en: `Strike ${vars.strikeCount}/3: Policy violation on solen.ch`,
    fr: `Avertissement ${vars.strikeCount}/3 : infraction sur solen.ch`,
    it: `Strike ${vars.strikeCount}/3: violazione delle regole su solen.ch`,
  };
  const bodies: Record<EmailLocale, string> = {
    de: `<p>Hallo,</p><p>Ihrem Salon wurde ein Strike vergeben.</p><p>Grund: <strong>${vars.reason}</strong></p><p>Dies ist Strike ${vars.strikeCount} von 3. Bei 3 Strikes kann Ihr Salon gesperrt werden.</p>`,
    en: `<p>Hello,</p><p>Your salon has received a strike.</p><p>Reason: <strong>${vars.reason}</strong></p><p>This is strike ${vars.strikeCount} of 3. At 3 strikes your salon may be suspended.</p>`,
    fr: `<p>Bonjour,</p><p>Votre salon a reçu un avertissement.</p><p>Raison : <strong>${vars.reason}</strong></p><p>Il s'agit de l'avertissement ${vars.strikeCount} sur 3. À 3 avertissements, votre salon peut être suspendu.</p>`,
    it: `<p>Buongiorno,</p><p>Il Suo salone ha ricevuto uno strike.</p><p>Motivo: <strong>${vars.reason}</strong></p><p>Questo è lo strike ${vars.strikeCount} di 3. Al terzo strike il Suo salone potrebbe essere sospeso.</p>`,
  };
  return { to, subject: subjects[locale], html: bodies[locale] };
}
