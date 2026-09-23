// Salon onboarding email templates. The welcome is sent by POST /api/salons at creation;
// the day 2-8 nudges by /api/cron/salon-onboarding, each only if its condition is met.
// Formal register in every locale (COPY_LAW): Sie / vous / Lei.

import { escapeHtml, type EmailLocale } from "@/lib/email";

interface OnboardingVars {
  salonName: string;
}

export function onboardingWelcome(to: string, vars: OnboardingVars, locale: EmailLocale = "de") {
  const name = escapeHtml(vars.salonName);
  const subjects: Record<EmailLocale, string> = {
    de: `Willkommen als Partner, ${vars.salonName}`,
    en: `Welcome as a partner, ${vars.salonName}`,
    fr: `Bienvenue en tant que partenaire, ${vars.salonName}`,
    it: `Benvenuto come partner, ${vars.salonName}`,
  };
  const bodies: Record<EmailLocale, string> = {
    de: `<p>Guten Tag,</p><p>Willkommen bei solen.ch. <strong>${name}</strong> ist jetzt Teil unserer Plattform.</p><p>In den nächsten Tagen helfen wir Ihnen, Ihr Profil einzurichten.</p><p><a href="https://solen.ch/de/dashboard">Zum Dashboard →</a></p>`,
    en: `<p>Hello,</p><p>Welcome to solen.ch. <strong>${name}</strong> is now part of our platform.</p><p>Over the next few days, we'll help you set up your profile.</p><p><a href="https://solen.ch/en/dashboard">Go to dashboard →</a></p>`,
    fr: `<p>Bonjour,</p><p>Bienvenue sur solen.ch. <strong>${name}</strong> fait désormais partie de notre plateforme.</p><p>Dans les prochains jours, nous vous aidons à configurer votre profil.</p><p><a href="https://solen.ch/fr/dashboard">Aller au tableau de bord →</a></p>`,
    it: `<p>Buongiorno,</p><p>Benvenuto su solen.ch. <strong>${name}</strong> fa ora parte della nostra piattaforma.</p><p>Nei prossimi giorni La aiutiamo a configurare il Suo profilo.</p><p><a href="https://solen.ch/it/dashboard">Vai alla dashboard →</a></p>`,
  };
  return { to, subject: subjects[locale], html: bodies[locale] };
}

export function onboardingCompleteProfile(to: string, vars: OnboardingVars, locale: EmailLocale = "de") {
  const subjects: Record<EmailLocale, string> = {
    de: `Vervollständigen Sie Ihr Profil, ${vars.salonName}`,
    en: `Complete your profile, ${vars.salonName}`,
    fr: `Complétez votre profil, ${vars.salonName}`,
    it: `Completi il Suo profilo, ${vars.salonName}`,
  };
  const bodies: Record<EmailLocale, string> = {
    de: `<p>Ihr Profil ist noch nicht vollständig. Je mehr Informationen Sie hinzufügen, desto besser finden Kunden Sie.</p><p>Fügen Sie eine Beschreibung, Öffnungszeiten und Kontaktdaten hinzu.</p><p><a href="https://solen.ch/de/dashboard/settings">Profil bearbeiten →</a></p>`,
    en: `<p>Your profile is not yet complete. The more information you add, the easier customers will find you.</p><p><a href="https://solen.ch/en/dashboard/settings">Edit profile →</a></p>`,
    fr: `<p>Votre profil n'est pas encore complet. Plus vous ajoutez d'informations, plus les clients vous trouveront facilement.</p><p><a href="https://solen.ch/fr/dashboard/settings">Modifier le profil →</a></p>`,
    it: `<p>Il Suo profilo non è ancora completo. Più informazioni aggiunge, più facilmente i clienti La troveranno.</p><p><a href="https://solen.ch/it/dashboard/settings">Modifica profilo →</a></p>`,
  };
  return { to, subject: subjects[locale], html: bodies[locale] };
}

export function onboardingAddServices(to: string, vars: OnboardingVars, locale: EmailLocale = "de") {
  const subjects: Record<EmailLocale, string> = {
    de: `Fügen Sie Behandlungen hinzu, ${vars.salonName}`,
    en: `Add your services, ${vars.salonName}`,
    fr: `Ajoutez vos services, ${vars.salonName}`,
    it: `Aggiunga i Suoi servizi, ${vars.salonName}`,
  };
  const bodies: Record<EmailLocale, string> = {
    de: `<p>Sie haben noch keine Behandlungen hinzugefügt. Kunden können erst buchen, wenn Behandlungen verfügbar sind.</p><p><a href="https://solen.ch/de/dashboard/services">Behandlungen hinzufügen →</a></p>`,
    en: `<p>You haven't added any services yet. Customers can only book when services are available.</p><p><a href="https://solen.ch/en/dashboard/services">Add services →</a></p>`,
    fr: `<p>Vous n'avez pas encore ajouté de services. Les clients ne peuvent réserver que si des services sont disponibles.</p><p><a href="https://solen.ch/fr/dashboard/services">Ajouter des services →</a></p>`,
    it: `<p>Non ha ancora aggiunto servizi. I clienti possono prenotare solo quando i servizi sono disponibili.</p><p><a href="https://solen.ch/it/dashboard/services">Aggiungi servizi →</a></p>`,
  };
  return { to, subject: subjects[locale], html: bodies[locale] };
}

export function onboardingAddPhoto(to: string, vars: OnboardingVars, locale: EmailLocale = "de") {
  const subjects: Record<EmailLocale, string> = {
    de: `Laden Sie ein Titelbild hoch, ${vars.salonName}`,
    en: `Upload a cover photo, ${vars.salonName}`,
    fr: `Ajoutez une photo de couverture, ${vars.salonName}`,
    it: `Carichi una foto di copertina, ${vars.salonName}`,
  };
  const bodies: Record<EmailLocale, string> = {
    de: `<p>Ein Titelbild macht Ihren Salon für Kunden sichtbarer.</p><p><a href="https://solen.ch/de/dashboard/settings">Foto hochladen →</a></p>`,
    en: `<p>A cover photo makes your salon more visible to customers.</p><p><a href="https://solen.ch/en/dashboard/settings">Upload photo →</a></p>`,
    fr: `<p>Une photo de couverture rend votre salon plus visible pour les clients.</p><p><a href="https://solen.ch/fr/dashboard/settings">Ajouter une photo →</a></p>`,
    it: `<p>Una foto di copertina rende il Suo salone più visibile ai clienti.</p><p><a href="https://solen.ch/it/dashboard/settings">Carica foto →</a></p>`,
  };
  return { to, subject: subjects[locale], html: bodies[locale] };
}

export function onboardingReady(to: string, vars: OnboardingVars, locale: EmailLocale = "de") {
  const name = escapeHtml(vars.salonName);
  const subjects: Record<EmailLocale, string> = {
    de: `Bereit für Ihre erste Buchung, ${vars.salonName}`,
    en: `Ready for your first booking, ${vars.salonName}`,
    fr: `Prêt pour votre première réservation, ${vars.salonName}`,
    it: `Pronto per la Sua prima prenotazione, ${vars.salonName}`,
  };
  const bodies: Record<EmailLocale, string> = {
    de: `<p>Ihr Profil bei <strong>${name}</strong> ist vollständig. Kunden können Sie jetzt finden und buchen.</p><p>Tipp: Mit Walk-ins füllen Sie freie Zeiten.</p><p><a href="https://solen.ch/de/dashboard">Zum Dashboard →</a></p>`,
    en: `<p>Your profile at <strong>${name}</strong> is complete. Customers can now find and book you.</p><p>Tip: walk-ins help you fill open times.</p><p><a href="https://solen.ch/en/dashboard">Go to dashboard →</a></p>`,
    fr: `<p>Votre profil chez <strong>${name}</strong> est complet. Les clients peuvent maintenant vous trouver et réserver.</p><p>Conseil : les walk-ins vous aident à remplir les créneaux libres.</p><p><a href="https://solen.ch/fr/dashboard">Aller au tableau de bord →</a></p>`,
    it: `<p>Il Suo profilo presso <strong>${name}</strong> è completo. I clienti possono ora trovarLa e prenotare.</p><p>Suggerimento: i walk-in La aiutano a riempire gli orari liberi.</p><p><a href="https://solen.ch/it/dashboard">Vai alla dashboard →</a></p>`,
  };
  return { to, subject: subjects[locale], html: bodies[locale] };
}
