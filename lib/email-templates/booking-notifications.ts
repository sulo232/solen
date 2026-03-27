// Booking notification email templates
// Used by confirm/cancel routes for customer + salon notification.

import type { EmailLocale } from "@/lib/email";

interface BookingVars {
  service: string;
  salon: string;
  date: string;
  time?: string;
}

/** Salon cancels → email to customer with reason */
export function salonCancelledBooking(
  to: string,
  vars: BookingVars & { reason?: string },
  locale: EmailLocale = "de"
) {
  const subjects: Record<EmailLocale, string> = {
    de: `Leider wurde dein Termin bei ${vars.salon} abgesagt`,
    en: `Unfortunately your appointment at ${vars.salon} was cancelled`,
    fr: `Malheureusement votre rendez-vous chez ${vars.salon} a été annulé`,
    it: `Purtroppo il tuo appuntamento da ${vars.salon} è stato cancellato`,
  };
  const reasonLine: Record<EmailLocale, string> = vars.reason
    ? { de: `<p><strong>Grund:</strong> ${vars.reason}</p>`, en: `<p><strong>Reason:</strong> ${vars.reason}</p>`, fr: `<p><strong>Raison :</strong> ${vars.reason}</p>`, it: `<p><strong>Motivo:</strong> ${vars.reason}</p>` }
    : { de: "", en: "", fr: "", it: "" };
  const bodies: Record<EmailLocale, string> = {
    de: `<p>Hallo,</p><p>Leider wurde dein Termin für <strong>${vars.service}</strong> bei <strong>${vars.salon}</strong> am ${vars.date} abgesagt.</p>${reasonLine.de}<p>Du kannst jederzeit einen neuen Termin buchen.</p><p><a href="https://solen.ch/de">Neuen Termin buchen →</a></p>`,
    en: `<p>Hello,</p><p>Unfortunately, your appointment for <strong>${vars.service}</strong> at <strong>${vars.salon}</strong> on ${vars.date} has been cancelled.</p>${reasonLine.en}<p>You can book a new appointment anytime.</p><p><a href="https://solen.ch/en">Book new appointment →</a></p>`,
    fr: `<p>Bonjour,</p><p>Votre rendez-vous pour <strong>${vars.service}</strong> chez <strong>${vars.salon}</strong> le ${vars.date} a été annulé.</p>${reasonLine.fr}<p><a href="https://solen.ch/fr">Prendre un nouveau rendez-vous →</a></p>`,
    it: `<p>Ciao,</p><p>Purtroppo il tuo appuntamento per <strong>${vars.service}</strong> da <strong>${vars.salon}</strong> il ${vars.date} è stato cancellato.</p>${reasonLine.it}<p><a href="https://solen.ch/it">Prenota un nuovo appuntamento →</a></p>`,
  };
  return { to, subject: subjects[locale], html: bodies[locale] };
}

/** Payment failed → email to customer */
export function paymentFailedNotification(
  to: string,
  vars: BookingVars,
  locale: EmailLocale = "de"
) {
  const subjects: Record<EmailLocale, string> = {
    de: `Zahlung fehlgeschlagen – Termin bei ${vars.salon} nicht bestätigt`,
    en: `Payment failed – Appointment at ${vars.salon} not confirmed`,
    fr: `Paiement échoué – Rendez-vous chez ${vars.salon} non confirmé`,
    it: `Pagamento fallito – Appuntamento da ${vars.salon} non confermato`,
  };
  const bodies: Record<EmailLocale, string> = {
    de: `<p>Hallo,</p><p>Leider konnte die Zahlung für deinen Termin für <strong>${vars.service}</strong> bei <strong>${vars.salon}</strong> am ${vars.date} nicht verarbeitet werden.</p><p>Dein Termin wurde daher nicht bestätigt. Bitte versuche es erneut oder wähle eine andere Zahlungsmethode.</p><p><a href="https://solen.ch/de">Erneut buchen →</a></p>`,
    en: `<p>Hello,</p><p>Unfortunately, the payment for your appointment for <strong>${vars.service}</strong> at <strong>${vars.salon}</strong> on ${vars.date} could not be processed.</p><p>Your appointment was not confirmed. Please try again or choose a different payment method.</p><p><a href="https://solen.ch/en">Book again →</a></p>`,
    fr: `<p>Bonjour,</p><p>Le paiement pour votre rendez-vous pour <strong>${vars.service}</strong> chez <strong>${vars.salon}</strong> le ${vars.date} n'a pas pu être traité.</p><p>Votre rendez-vous n'a pas été confirmé. Veuillez réessayer.</p><p><a href="https://solen.ch/fr">Réserver à nouveau →</a></p>`,
    it: `<p>Ciao,</p><p>Purtroppo il pagamento per il tuo appuntamento per <strong>${vars.service}</strong> da <strong>${vars.salon}</strong> il ${vars.date} non è stato elaborato.</p><p>Il tuo appuntamento non è stato confermato. Riprova o scegli un altro metodo di pagamento.</p><p><a href="https://solen.ch/it">Prenota di nuovo →</a></p>`,
  };
  return { to, subject: subjects[locale], html: bodies[locale] };
}

/** Customer cancels → email to salon owner */
export function customerCancelledNotification(
  to: string,
  vars: BookingVars & { customerName: string },
  locale: EmailLocale = "de"
) {
  const subjects: Record<EmailLocale, string> = {
    de: `Stornierung: ${vars.customerName} hat abgesagt`,
    en: `Cancellation: ${vars.customerName} cancelled`,
    fr: `Annulation: ${vars.customerName} a annulé`,
    it: `Cancellazione: ${vars.customerName} ha cancellato`,
  };
  const bodies: Record<EmailLocale, string> = {
    de: `<p><strong>${vars.customerName}</strong> hat den Termin für <strong>${vars.service}</strong> am ${vars.date} bei <strong>${vars.salon}</strong> storniert.</p><p>Der Slot ist jetzt wieder frei.</p><p><a href="https://solen.ch/de/dashboard/bookings">Buchungen anzeigen →</a></p>`,
    en: `<p><strong>${vars.customerName}</strong> cancelled the appointment for <strong>${vars.service}</strong> on ${vars.date} at <strong>${vars.salon}</strong>.</p><p>The slot is now available again.</p><p><a href="https://solen.ch/en/dashboard/bookings">View bookings →</a></p>`,
    fr: `<p><strong>${vars.customerName}</strong> a annulé le rendez-vous pour <strong>${vars.service}</strong> le ${vars.date} chez <strong>${vars.salon}</strong>.</p><p>Le créneau est à nouveau disponible.</p><p><a href="https://solen.ch/fr/dashboard/bookings">Voir les réservations →</a></p>`,
    it: `<p><strong>${vars.customerName}</strong> ha cancellato l'appuntamento per <strong>${vars.service}</strong> il ${vars.date} da <strong>${vars.salon}</strong>.</p><p>Lo slot è di nuovo disponibile.</p><p><a href="https://solen.ch/it/dashboard/bookings">Vedi prenotazioni →</a></p>`,
  };
  return { to, subject: subjects[locale], html: bodies[locale] };
}
