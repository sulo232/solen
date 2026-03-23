import { EmailLocale, EmailPayload } from "../email";

export function bookingPendingApprovalEmail(to: string, vars: { service: string; customerName: string; date: string; time: string; approvalUrl: string }, locale: EmailLocale = "de"): EmailPayload {
  return {
    to,
    subject: `Buchung wartet auf Bestätigung: ${vars.service} für ${vars.customerName}`,
    html: `<p>Hallo,</p><p>Eine neue Buchung wartet auf Ihre Bestätigung: <strong>${vars.service}</strong> am ${vars.date} um ${vars.time} Uhr für ${vars.customerName}.</p><p><a href="${vars.approvalUrl}">Jetzt bestätigen oder ablehnen</a></p>`,
  };
}

export function bookingApprovedEmail(to: string, vars: { service: string; salonName: string; date: string; time: string }, locale: EmailLocale = "de"): EmailPayload {
  return {
    to,
    subject: `Buchung bestätigt: ${vars.service} bei ${vars.salonName}`,
    html: `<p>Hallo,</p><p>Ihre Buchung für <strong>${vars.service}</strong> bei <strong>${vars.salonName}</strong> am ${vars.date} um ${vars.time} Uhr wurde vom Salon bestätigt.</p>`,
  };
}

export function bookingRejectedEmail(to: string, vars: { service: string; salonName: string; date: string; time: string; reason?: string }, locale: EmailLocale = "de"): EmailPayload {
  return {
    to,
    subject: `Buchung abgelehnt: ${vars.service} bei ${vars.salonName}`,
    html: `<p>Hallo,</p><p>Ihre Anfrage für <strong>${vars.service}</strong> bei <strong>${vars.salonName}</strong> am ${vars.date} wurde vom Salon abgelehnt.</p>${vars.reason ? `<p>Grund: ${vars.reason}</p>` : ''}`,
  };
}

export function bookingModifiedEmail(to: string, vars: { service: string; customerName: string; date: string; time: string; detailsUrl: string }, locale: EmailLocale = "de"): EmailPayload {
  return {
    to,
    subject: `Buchung geändert: ${vars.service} für ${vars.customerName}`,
    html: `<p>Hallo,</p><p>Die Buchung für <strong>${vars.service}</strong> am ${vars.date} um ${vars.time} Uhr wurde geändert.</p><p><a href="${vars.detailsUrl}">Details ansehen</a></p>`,
  };
}

export function noShowChargeEmail(to: string, vars: { service: string; salonName: string; date: string; feeAmount: string }, locale: EmailLocale = "de"): EmailPayload {
  return {
    to,
    subject: `Nicht erschienen zu Termin bei ${vars.salonName}`,
    html: `<p>Hallo,</p><p>Es wurde gemeldet, dass Sie zu Ihrem Termin für <strong>${vars.service}</strong> am ${vars.date} bei <strong>${vars.salonName}</strong> nicht erschienen sind.</p><p>Ihnen wurde eine Nichterscheinen-Gebühr in Höhe von ${vars.feeAmount} berechnet (gemäss AGB §4.4).</p>`,
  };
}

export function lateCancellationFeeEmail(to: string, vars: { service: string; salonName: string; date: string; feeAmount: string }, locale: EmailLocale = "de"): EmailPayload {
  return {
    to,
    subject: `Späte Stornierung bei ${vars.salonName}`,
    html: `<p>Hallo,</p><p>Sie haben Ihren Termin für <strong>${vars.service}</strong> am ${vars.date} bei <strong>${vars.salonName}</strong> weniger als 24 Stunden im Voraus storniert.</p><p>Ihnen wurde eine Stornierungsgebühr in Höhe von ${vars.feeAmount} berechnet (gemäss AGB §4.2).</p>`,
  };
}

export function refundProcessedEmail(to: string, vars: { service: string; salonName: string; amount: string }, locale: EmailLocale = "de"): EmailPayload {
  return {
    to,
    subject: `Rückerstattung verarbeitet: ${vars.amount} für ${vars.salonName}`,
    html: `<p>Hallo,</p><p>Eine Rückerstattung in Höhe von <strong>${vars.amount}</strong> für Ihre Buchung (<strong>${vars.service}</strong>) bei <strong>${vars.salonName}</strong> wurde verarbeitet. Es kann einige Tage dauern, bis das Geld auf Ihrem Konto eingeht.</p>`,
  };
}

export function newReviewEmail(to: string, vars: { customerName: string; rating: number; salonUrl: string }, locale: EmailLocale = "de"): EmailPayload {
  return {
    to,
    subject: `Neue ${vars.rating}-Sterne Bewertung von ${vars.customerName}`,
    html: `<p>Hallo,</p><p>Sie haben eine neue ${vars.rating}-Sterne Bewertung von <strong>${vars.customerName}</strong> erhalten.</p><p><a href="${vars.salonUrl}">Bewertung ansehen und beantworten</a></p>`,
  };
}

export function reviewResponseEmail(to: string, vars: { salonName: string; response: string; reviewUrl: string }, locale: EmailLocale = "de"): EmailPayload {
  return {
    to,
    subject: `Antwort auf Ihre Bewertung von ${vars.salonName}`,
    html: `<p>Hallo,</p><p><strong>${vars.salonName}</strong> hat auf Ihre Bewertung geantwortet:</p><blockquote style="border-left:4px solid #ccc;padding-left:16px">${vars.response}</blockquote><p><a href="${vars.reviewUrl}">Zur Bewertung</a></p>`,
  };
}

export function reviewFlaggedEmail(to: string, vars: { salonName: string }, locale: EmailLocale = "de"): EmailPayload {
  return {
    to,
    subject: `Ihre Bewertung für ${vars.salonName} wurde wegen Verstoß gegen Richtlinien gemeldet`,
    html: `<p>Hallo,</p><p>Ihre kürzlich verfasste Bewertung für <strong>${vars.salonName}</strong> wurde von unserem System zur Überprüfung gemeldet. Bitte beachten Sie unsere Richtlinien für Bewertungen auf solen.ch.</p>`,
  };
}

export function accountWarningEmail(to: string, vars: { reason: string }, locale: EmailLocale = "de"): EmailPayload {
  return {
    to,
    subject: `Verwarnung zu Ihrem solen.ch-Konto`,
    html: `<p>Hallo,</p><p>Dies ist eine offizielle Verwarnung bezüglich Ihres Kontos auf solen.ch.</p><p>Grund: <strong>${vars.reason}</strong></p><p>Bitte stellen Sie sicher, dass Sie unsere Nutzungsbedingungen einhalten, da weitere Verstösse zur Kontosperrung führen können.</p>`,
  };
}

export function accountSuspensionEmail(to: string, vars: { reason: string }, locale: EmailLocale = "de"): EmailPayload {
  return {
    to,
    subject: `Ihr solen.ch-Konto wurde gesperrt`,
    html: `<p>Hallo,</p><p>Ihr Konto auf solen.ch wurde gesperrt.</p><p>Grund: <strong>${vars.reason}</strong></p><p>Wenn Sie glauben, dass dies ein Fehler ist, kontaktieren Sie uns bitte unter support@solen.ch.</p>`,
  };
}

export function payoutCompletedEmail(to: string, vars: { amount: string; date: string; downloadUrl: string }, locale: EmailLocale = "de"): EmailPayload {
  return {
    to,
    subject: `Auszahlung verarbeitet: ${vars.amount}`,
    html: `<p>Hallo,</p><p>Ihre wöchentliche Auszahlung für Buchungen bis zum ${vars.date} in Höhe von <strong>${vars.amount}</strong> wurde verarbeitet. Es kann 1-3 Werktage dauern, bis das Geld auf Ihrem Bankkonto eingeht.</p><p><a href="${vars.downloadUrl}">Abrechnung herunterladen</a></p>`,
  };
}

export function payoutFailedEmail(to: string, vars: { amount: string; reason: string }, locale: EmailLocale = "de"): EmailPayload {
  return {
    to,
    subject: `Fehlgeschlagene Auszahlung: ${vars.amount}`,
    html: `<p>Hallo,</p><p>Leider ist eine Auszahlung in Höhe von <strong>${vars.amount}</strong> fehlgeschlagen. Grund: ${vars.reason}. Bitte überprüfen Sie Ihre Bankangaben (Stripe Connect) in Ihrem Dashboard.</p>`,
  };
}

export function termsChangedEmail(to: string, vars: { effectiveDate: string; detailsUrl: string }, locale: EmailLocale = "de"): EmailPayload {
  return {
    to,
    subject: `Aktualisierung der Allgemeinen Geschäftsbedingungen`,
    html: `<p>Hallo,</p><p>Wir haben unsere Allgemeinen Geschäftsbedingungen (AGB) aktualisiert. Diese treten am ${vars.effectiveDate} in Kraft.</p><p><a href="${vars.detailsUrl}">Änderungen ansehen</a></p>`,
  };
}

export function salonStrikeEmail(to: string, vars: { strikeCount: number; reason: string }, locale: EmailLocale = "de"): EmailPayload {
  return {
    to,
    subject: `Strike ${vars.strikeCount}/3: Regelverstoss auf solen.ch`,
    html: `<p>Hallo,</p><p>Ihrem Salon wurde ein Strike vergeben.</p><p>Grund: <strong>${vars.reason}</strong></p><p>Dies ist Strike ${vars.strikeCount} von 3. Bei 3 Strikes kann Ihr Salon gesperrt werden.</p>`,
  };
}
