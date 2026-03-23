// Salon onboarding drip email templates (used by /api/cron/salon-onboarding)
// Adaptive 5-email series — each sends only if condition is met.

import type { EmailLocale } from "@/lib/email";

interface OnboardingVars {
  salonName: string;
}

export function onboardingWelcome(to: string, vars: OnboardingVars, locale: EmailLocale = "de") {
  const subjects = {
    de: `Willkommen als Partner, ${vars.salonName}!`,
    en: `Welcome as a partner, ${vars.salonName}!`,
    fr: `Bienvenue en tant que partenaire, ${vars.salonName} !`,
  };
  const bodies = {
    de: `<p>Hallo,</p><p>Willkommen bei solen.ch! <strong>${vars.salonName}</strong> ist jetzt Teil unserer Plattform.</p><p>In den nächsten Tagen helfen wir dir, dein Profil optimal einzurichten.</p><p><a href="https://solen.ch/de/dashboard">Zum Dashboard →</a></p>`,
    en: `<p>Hello,</p><p>Welcome to solen.ch! <strong>${vars.salonName}</strong> is now part of our platform.</p><p>Over the next few days, we'll help you set up your profile.</p><p><a href="https://solen.ch/en/dashboard">Go to dashboard →</a></p>`,
    fr: `<p>Bonjour,</p><p>Bienvenue sur solen.ch ! <strong>${vars.salonName}</strong> fait désormais partie de notre plateforme.</p><p><a href="https://solen.ch/fr/dashboard">Aller au tableau de bord →</a></p>`,
  };
  return { to, subject: subjects[locale], html: bodies[locale] };
}

export function onboardingCompleteProfile(to: string, vars: OnboardingVars, locale: EmailLocale = "de") {
  const subjects = {
    de: `Vervollständige dein Profil, ${vars.salonName}`,
    en: `Complete your profile, ${vars.salonName}`,
    fr: `Complétez votre profil, ${vars.salonName}`,
  };
  const bodies = {
    de: `<p>Dein Profil ist noch nicht vollständig. Je mehr Informationen du hinzufügst, desto besser finden dich Kunden.</p><p>Füge eine Beschreibung, Öffnungszeiten und Kontaktdaten hinzu.</p><p><a href="https://solen.ch/de/dashboard/settings">Profil bearbeiten →</a></p>`,
    en: `<p>Your profile is not yet complete. The more information you add, the easier customers will find you.</p><p><a href="https://solen.ch/en/dashboard/settings">Edit profile →</a></p>`,
    fr: `<p>Votre profil n'est pas encore complet. Plus vous ajoutez d'informations, plus les clients vous trouveront facilement.</p><p><a href="https://solen.ch/fr/dashboard/settings">Modifier le profil →</a></p>`,
  };
  return { to, subject: subjects[locale], html: bodies[locale] };
}

export function onboardingAddServices(to: string, vars: OnboardingVars, locale: EmailLocale = "de") {
  const subjects = {
    de: `Füge Behandlungen hinzu, ${vars.salonName}`,
    en: `Add your services, ${vars.salonName}`,
    fr: `Ajoutez vos services, ${vars.salonName}`,
  };
  const bodies = {
    de: `<p>Du hast noch keine Behandlungen hinzugefügt. Kunden können nur buchen, wenn Services verfügbar sind.</p><p><a href="https://solen.ch/de/dashboard/services">Services hinzufügen →</a></p>`,
    en: `<p>You haven't added any services yet. Customers can only book when services are available.</p><p><a href="https://solen.ch/en/dashboard/services">Add services →</a></p>`,
    fr: `<p>Vous n'avez pas encore ajouté de services. Les clients ne peuvent réserver que si des services sont disponibles.</p><p><a href="https://solen.ch/fr/dashboard/services">Ajouter des services →</a></p>`,
  };
  return { to, subject: subjects[locale], html: bodies[locale] };
}

export function onboardingAddPhoto(to: string, vars: OnboardingVars, locale: EmailLocale = "de") {
  const subjects = {
    de: `Lade ein Foto hoch, ${vars.salonName}`,
    en: `Upload a cover photo, ${vars.salonName}`,
    fr: `Téléchargez une photo, ${vars.salonName}`,
  };
  const bodies = {
    de: `<p>Salons mit Fotos erhalten 3x mehr Buchungen. Lade ein ansprechendes Titelbild hoch!</p><p><a href="https://solen.ch/de/dashboard/settings">Foto hochladen →</a></p>`,
    en: `<p>Salons with photos get 3x more bookings. Upload an attractive cover photo!</p><p><a href="https://solen.ch/en/dashboard/settings">Upload photo →</a></p>`,
    fr: `<p>Les salons avec photos reçoivent 3x plus de réservations. Téléchargez une photo de couverture attrayante !</p><p><a href="https://solen.ch/fr/dashboard/settings">Télécharger une photo →</a></p>`,
  };
  return { to, subject: subjects[locale], html: bodies[locale] };
}

export function onboardingReady(to: string, vars: OnboardingVars, locale: EmailLocale = "de") {
  const subjects = {
    de: `Bereit für deine erste Buchung! 🎉 ${vars.salonName}`,
    en: `Ready for your first booking! 🎉 ${vars.salonName}`,
    fr: `Prêt pour votre première réservation ! 🎉 ${vars.salonName}`,
  };
  const bodies = {
    de: `<p>Gratulation! Dein Profil bei <strong>${vars.salonName}</strong> ist vollständig. Kunden können dich jetzt finden und buchen.</p><p>Tipp: Aktiviere Last-Minute-Angebote, um leere Slots zu füllen!</p><p><a href="https://solen.ch/de/dashboard">Zum Dashboard →</a></p>`,
    en: `<p>Congratulations! Your profile at <strong>${vars.salonName}</strong> is complete. Customers can now find and book you.</p><p>Tip: Enable last-minute deals to fill empty slots!</p><p><a href="https://solen.ch/en/dashboard">Go to dashboard →</a></p>`,
    fr: `<p>Félicitations ! Votre profil chez <strong>${vars.salonName}</strong> est complet. Les clients peuvent maintenant vous trouver.</p><p><a href="https://solen.ch/fr/dashboard">Aller au tableau de bord →</a></p>`,
  };
  return { to, subject: subjects[locale], html: bodies[locale] };
}
