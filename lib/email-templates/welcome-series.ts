// Welcome email series templates (used by /api/cron/welcome-series)
// Day 0: Welcome, Day 3: Discover salons, Day 7: First appointment

import type { EmailLocale } from "@/lib/email";

interface WelcomeVars {
  name: string;
}

export function welcomeDay0(to: string, vars: WelcomeVars, locale: EmailLocale = "de") {
  const subjects: Record<EmailLocale, string> = {
    de: `Willkommen bei Solen, ${vars.name}!`,
    en: `Welcome to Solen, ${vars.name}!`,
    fr: `Bienvenue chez Solen, ${vars.name} !`,
    it: `Benvenuto su Solen, ${vars.name}!`,
  };
  const bodies: Record<EmailLocale, string> = {
    de: `<p>Hallo <strong>${vars.name}</strong>,</p><p>Willkommen bei solen.ch — deiner Plattform für Beauty & Wellness in Basel.</p><p>Entdecke hunderte Salons, buche Termine online und profitiere von Last-Minute-Angeboten.</p><p><a href="https://solen.ch/de">Jetzt entdecken →</a></p><p>Dein solen.ch Team</p>`,
    en: `<p>Hello <strong>${vars.name}</strong>,</p><p>Welcome to solen.ch — your beauty & wellness platform in Basel.</p><p>Discover hundreds of salons, book appointments online, and enjoy last-minute deals.</p><p><a href="https://solen.ch/en">Explore now →</a></p><p>Your solen.ch team</p>`,
    fr: `<p>Bonjour <strong>${vars.name}</strong>,</p><p>Bienvenue sur solen.ch — votre plateforme beauté & bien-être à Bâle.</p><p>Découvrez des centaines de salons et profitez d'offres de dernière minute.</p><p><a href="https://solen.ch/fr">Découvrir →</a></p><p>L'équipe solen.ch</p>`,
    it: `<p>Ciao <strong>${vars.name}</strong>,</p><p>Benvenuto su solen.ch — la tua piattaforma beauty & wellness a Basilea.</p><p>Scopri centinaia di saloni, prenota online e approfitta delle offerte last-minute.</p><p><a href="https://solen.ch/it">Scopri ora →</a></p><p>Il tuo team solen.ch</p>`,
  };
  return { to, subject: subjects[locale], html: bodies[locale] };
}

export function welcomeDay3(to: string, vars: WelcomeVars, locale: EmailLocale = "de") {
  const subjects: Record<EmailLocale, string> = {
    de: `Entdecke Salons in deiner Nähe, ${vars.name}`,
    en: `Discover salons near you, ${vars.name}`,
    fr: `Découvrez les salons près de chez vous, ${vars.name}`,
    it: `Scopri i saloni vicino a te, ${vars.name}`,
  };
  const bodies: Record<EmailLocale, string> = {
    de: `<p>Hallo ${vars.name},</p><p>Wusstest du, dass es über 200 Salons auf solen.ch gibt? Finde den perfekten Salon in deinem Quartier.</p><p><a href="https://solen.ch/de/coiffeur">Salons entdecken →</a></p>`,
    en: `<p>Hello ${vars.name},</p><p>Did you know there are over 200 salons on solen.ch? Find the perfect salon in your neighborhood.</p><p><a href="https://solen.ch/en/coiffeur">Discover salons →</a></p>`,
    fr: `<p>Bonjour ${vars.name},</p><p>Saviez-vous qu'il y a plus de 200 salons sur solen.ch ? Trouvez le salon parfait dans votre quartier.</p><p><a href="https://solen.ch/fr/coiffeur">Découvrir les salons →</a></p>`,
    it: `<p>Ciao ${vars.name},</p><p>Sapevi che ci sono oltre 200 saloni su solen.ch? Trova il salone perfetto nel tuo quartiere.</p><p><a href="https://solen.ch/it/coiffeur">Scopri i saloni →</a></p>`,
  };
  return { to, subject: subjects[locale], html: bodies[locale] };
}

export function welcomeDay7(to: string, vars: WelcomeVars, locale: EmailLocale = "de") {
  const subjects: Record<EmailLocale, string> = {
    de: `Dein erster Termin wartet, ${vars.name}!`,
    en: `Your first appointment awaits, ${vars.name}!`,
    fr: `Votre premier rendez-vous vous attend, ${vars.name} !`,
    it: `Il tuo primo appuntamento ti aspetta, ${vars.name}!`,
  };
  const bodies: Record<EmailLocale, string> = {
    de: `<p>Hallo ${vars.name},</p><p>Du hast dich vor einer Woche bei solen.ch angemeldet — hast du schon deinen ersten Termin gebucht?</p><p>Probiere es aus und finde deinen Lieblingssalon.</p><p><a href="https://solen.ch/de">Termin buchen →</a></p>`,
    en: `<p>Hello ${vars.name},</p><p>You signed up a week ago — have you booked your first appointment yet?</p><p>Give it a try and find your favorite salon.</p><p><a href="https://solen.ch/en">Book now →</a></p>`,
    fr: `<p>Bonjour ${vars.name},</p><p>Vous vous êtes inscrit(e) il y a une semaine — avez-vous déjà pris votre premier rendez-vous ?</p><p><a href="https://solen.ch/fr">Réserver maintenant →</a></p>`,
    it: `<p>Ciao ${vars.name},</p><p>Ti sei registrato una settimana fa — hai già prenotato il tuo primo appuntamento?</p><p><a href="https://solen.ch/it">Prenota ora →</a></p>`,
  };
  return { to, subject: subjects[locale], html: bodies[locale] };
}
