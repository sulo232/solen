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
  const subjects = {
    de: `Leider wurde dein Termin bei ${vars.salon} abgesagt`,
    en: `Unfortunately your appointment at ${vars.salon} was cancelled`,
    fr: `Malheureusement votre rendez-vous chez ${vars.salon} a été annulé`,
  };
  const reasonLine = vars.reason
    ? { de: `<p><strong>Grund:</strong> ${vars.reason}</p>`, en: `<p><strong>Reason:</strong> ${vars.reason}</p>`, fr: `<p><strong>Raison :</strong> ${vars.reason}</p>` }
    : { de: "", en: "", fr: "" };
  const bodies = {
    de: `<p>Hallo,</p><p>Leider wurde dein Termin für <strong>${vars.service}</strong> bei <strong>${vars.salon}</strong> am ${vars.date} abgesagt.</p>${reasonLine.de}<p>Du kannst jederzeit einen neuen Termin buchen.</p><p><a href="https://solen.ch/de">Neuen Termin buchen →</a></p>`,
    en: `<p>Hello,</p><p>Unfortunately, your appointment for <strong>${vars.service}</strong> at <strong>${vars.salon}</strong> on ${vars.date} has been cancelled.</p>${reasonLine.en}<p>You can book a new appointment anytime.</p><p><a href="https://solen.ch/en">Book new appointment →</a></p>`,
    fr: `<p>Bonjour,</p><p>Votre rendez-vous pour <strong>${vars.service}</strong> chez <strong>${vars.salon}</strong> le ${vars.date} a été annulé.</p>${reasonLine.fr}<p><a href="https://solen.ch/fr">Prendre un nouveau rendez-vous →</a></p>`,
  };
  return { to, subject: subjects[locale], html: bodies[locale] };
}

/** Payment failed → email to customer */
export function paymentFailedNotification(
  to: string,
  vars: BookingVars,
  locale: EmailLocale = "de"
) {
  const subjects = {
    de: `Zahlung fehlgeschlagen – Termin bei ${vars.salon} nicht bestätigt`,
    en: `Payment failed – Appointment at ${vars.salon} not confirmed`,
    fr: `Paiement échoué – Rendez-vous chez ${vars.salon} non confirmé`,
  };
  const bodies = {
    de: `<p>Hallo,</p><p>Leider konnte die Zahlung für deinen Termin für <strong>${vars.service}</strong> bei <strong>${vars.salon}</strong> am ${vars.date} nicht verarbeitet werden.</p><p>Dein Termin wurde daher nicht bestätigt. Bitte versuche es erneut oder wähle eine andere Zahlungsmethode.</p><p><a href="https://solen.ch/de">Erneut buchen →</a></p>`,
    en: `<p>Hello,</p><p>Unfortunately, the payment for your appointment for <strong>${vars.service}</strong> at <strong>${vars.salon}</strong> on ${vars.date} could not be processed.</p><p>Your appointment was not confirmed. Please try again or choose a different payment method.</p><p><a href="https://solen.ch/en">Book again →</a></p>`,
    fr: `<p>Bonjour,</p><p>Le paiement pour votre rendez-vous pour <strong>${vars.service}</strong> chez <strong>${vars.salon}</strong> le ${vars.date} n'a pas pu être traité.</p><p>Votre rendez-vous n'a pas été confirmé. Veuillez réessayer.</p><p><a href="https://solen.ch/fr">Réserver à nouveau →</a></p>`,
  };
  return { to, subject: subjects[locale], html: bodies[locale] };
}

/** Customer cancels → email to salon owner */
export function customerCancelledNotification(
  to: string,
  vars: BookingVars & { customerName: string },
  locale: EmailLocale = "de"
) {
  const subjects = {
    de: `Stornierung: ${vars.customerName} hat abgesagt`,
    en: `Cancellation: ${vars.customerName} cancelled`,
    fr: `Annulation: ${vars.customerName} a annulé`,
  };
  const bodies = {
    de: `<p><strong>${vars.customerName}</strong> hat den Termin für <strong>${vars.service}</strong> am ${vars.date} bei <strong>${vars.salon}</strong> storniert.</p><p>Der Slot ist jetzt wieder frei.</p><p><a href="https://solen.ch/de/dashboard/bookings">Buchungen anzeigen →</a></p>`,
    en: `<p><strong>${vars.customerName}</strong> cancelled the appointment for <strong>${vars.service}</strong> on ${vars.date} at <strong>${vars.salon}</strong>.</p><p>The slot is now available again.</p><p><a href="https://solen.ch/en/dashboard/bookings">View bookings →</a></p>`,
    fr: `<p><strong>${vars.customerName}</strong> a annulé le rendez-vous pour <strong>${vars.service}</strong> le ${vars.date} chez <strong>${vars.salon}</strong>.</p><p>Le créneau est à nouveau disponible.</p><p><a href="https://solen.ch/fr/dashboard/bookings">Voir les réservations →</a></p>`,
  };
  return { to, subject: subjects[locale], html: bodies[locale] };
}
