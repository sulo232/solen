// =============================================================================
// lib/guided-search-data.ts — Static data for the guided search funnel
// Category → Service map, date quick-picks, time preferences
// =============================================================================

export interface GuidedService {
  key: string;
  label_de: string;
  label_en: string;
  label_fr: string;
  label_it: string;
}

export interface QuickPick {
  key: string;
  label_de: string;
  label_en: string;
  label_fr: string;
  label_it: string;
}

/** Services shown in Step 3, keyed by SalonCategory */
export const CATEGORY_SERVICES: Record<string, GuidedService[]> = {
  coiffeur: [
    { key: "womens-haircut", label_de: "Damenhaarschnitt", label_en: "Women's Haircut", label_fr: "Coupe femme", label_it: "Taglio donna" },
    { key: "mens-haircut", label_de: "Herrenhaarschnitt", label_en: "Men's Haircut", label_fr: "Coupe homme", label_it: "Taglio uomo" },
    { key: "blowout", label_de: "Föhnen / Blowout", label_en: "Blowout", label_fr: "Brushing", label_it: "Piega" },
    { key: "coloring", label_de: "Färben", label_en: "Coloring", label_fr: "Coloration", label_it: "Colorazione" },
    { key: "balayage", label_de: "Balayage", label_en: "Balayage", label_fr: "Balayage", label_it: "Balayage" },
    { key: "highlights", label_de: "Strähnchen", label_en: "Highlights", label_fr: "Mèches", label_it: "Colpi di sole" },
    { key: "treatment", label_de: "Haarpflege / Treatment", label_en: "Hair Treatment", label_fr: "Soin capillaire", label_it: "Trattamento capelli" },
  ],
  barbershop: [
    { key: "fade", label_de: "Fade", label_en: "Fade", label_fr: "Dégradé", label_it: "Sfumatura" },
    { key: "buzz-cut", label_de: "Buzz Cut", label_en: "Buzz Cut", label_fr: "Coupe courte", label_it: "Taglio corto" },
    { key: "mens-haircut", label_de: "Herrenhaarschnitt", label_en: "Men's Haircut", label_fr: "Coupe homme", label_it: "Taglio uomo" },
    { key: "beard-trim", label_de: "Barttrimm", label_en: "Beard Trim", label_fr: "Taille de barbe", label_it: "Regolazione barba" },
    { key: "hot-towel-shave", label_de: "Nassrasur", label_en: "Hot Towel Shave", label_fr: "Rasage serviette chaude", label_it: "Rasatura con asciugamano caldo" },
    { key: "lineup", label_de: "Lineup / Konturen", label_en: "Lineup / Edge Up", label_fr: "Contours", label_it: "Contorni" },
  ],
  nails: [
    { key: "gel-nails", label_de: "Gelnägel", label_en: "Gel Nails", label_fr: "Ongles gel", label_it: "Unghie gel" },
    { key: "manicure", label_de: "Maniküre", label_en: "Manicure", label_fr: "Manucure", label_it: "Manicure" },
    { key: "pedicure", label_de: "Pediküre", label_en: "Pedicure", label_fr: "Pédicure", label_it: "Pedicure" },
    { key: "nail-art", label_de: "Nagelkunst", label_en: "Nail Art", label_fr: "Nail art", label_it: "Nail art" },
    { key: "removal", label_de: "Entfernung", label_en: "Removal", label_fr: "Dépose", label_it: "Rimozione" },
    { key: "refill", label_de: "Auffüllung", label_en: "Refill", label_fr: "Remplissage", label_it: "Ricostruzione" },
  ],
  spa: [
    { key: "massage", label_de: "Massage", label_en: "Massage", label_fr: "Massage", label_it: "Massaggio" },
    { key: "facial", label_de: "Gesichtsbehandlung", label_en: "Facial", label_fr: "Soin du visage", label_it: "Trattamento viso" },
    { key: "body-wrap", label_de: "Körperpackung", label_en: "Body Wrap", label_fr: "Enveloppement", label_it: "Impacco corpo" },
    { key: "sauna", label_de: "Sauna / Dampfbad", label_en: "Sauna / Steam", label_fr: "Sauna / Hammam", label_it: "Sauna / Bagno turco" },
  ],
  makeup: [
    { key: "bridal-makeup", label_de: "Braut-Makeup", label_en: "Bridal Makeup", label_fr: "Maquillage mariée", label_it: "Trucco sposa" },
    { key: "evening-makeup", label_de: "Abend-Makeup", label_en: "Evening Makeup", label_fr: "Maquillage soirée", label_it: "Trucco sera" },
    { key: "natural-look", label_de: "Natürliches Makeup", label_en: "Natural Look", label_fr: "Maquillage naturel", label_it: "Trucco naturale" },
    { key: "lash-extensions", label_de: "Wimpernverlängerung", label_en: "Lash Extensions", label_fr: "Extensions cils", label_it: "Extension ciglia" },
    { key: "brow-shaping", label_de: "Augenbrauen formen", label_en: "Brow Shaping", label_fr: "Mise en forme des sourcils", label_it: "Modellazione sopracciglia" },
  ],
  waxing: [
    { key: "leg-waxing", label_de: "Beine", label_en: "Leg Waxing", label_fr: "Épilation jambes", label_it: "Ceretta gambe" },
    { key: "bikini-waxing", label_de: "Bikinizone", label_en: "Bikini Waxing", label_fr: "Maillot", label_it: "Ceretta bikini" },
    { key: "arm-waxing", label_de: "Arme", label_en: "Arm Waxing", label_fr: "Épilation bras", label_it: "Ceretta braccia" },
    { key: "face-waxing", label_de: "Gesicht", label_en: "Face Waxing", label_fr: "Épilation visage", label_it: "Ceretta viso" },
    { key: "full-body", label_de: "Ganzkörper", label_en: "Full Body", label_fr: "Corps entier", label_it: "Corpo intero" },
  ],
};

/** Date quick-pick chips for Step 4 */
export const DATE_QUICK_PICKS: QuickPick[] = [
  { key: "today", label_de: "Heute", label_en: "Today", label_fr: "Aujourd'hui", label_it: "Oggi" },
  { key: "tomorrow", label_de: "Morgen", label_en: "Tomorrow", label_fr: "Demain", label_it: "Domani" },
  { key: "this-week", label_de: "Diese Woche", label_en: "This Week", label_fr: "Cette semaine", label_it: "Questa settimana" },
  { key: "weekend", label_de: "Wochenende", label_en: "Weekend", label_fr: "Week-end", label_it: "Fine settimana" },
  { key: "any", label_de: "Egal", label_en: "Any Time", label_fr: "N'importe quand", label_it: "Qualsiasi" },
];

/** Time-of-day preference chips for Step 4 */
export const TIME_PREFERENCES: QuickPick[] = [
  { key: "any", label_de: "Egal", label_en: "Any", label_fr: "Peu importe", label_it: "Qualsiasi" },
  { key: "morning", label_de: "Morgens", label_en: "Morning", label_fr: "Matin", label_it: "Mattina" },
  { key: "afternoon", label_de: "Nachmittags", label_en: "Afternoon", label_fr: "Après-midi", label_it: "Pomeriggio" },
  { key: "evening", label_de: "Abends", label_en: "Evening", label_fr: "Soirée", label_it: "Sera" },
];

/** Resolve localized label for a service/pick item */
export function getLocalizedLabel(
  item: { label_de: string; label_en: string; label_fr: string; label_it: string },
  locale: string
): string {
  switch (locale) {
    case "en": return item.label_en;
    case "fr": return item.label_fr;
    case "it": return item.label_it;
    default: return item.label_de;
  }
}

/** Convert a date quick-pick key to an ISO date or search param */
export function datePickToParam(key: string): string | null {
  const now = new Date();
  switch (key) {
    case "today":
      return now.toISOString().split("T")[0];
    case "tomorrow": {
      const d = new Date(now);
      d.setDate(d.getDate() + 1);
      return d.toISOString().split("T")[0];
    }
    case "this-week":
      return "this_week";
    case "weekend":
      return "weekend";
    case "any":
      return null;
    default:
      return key; // assume ISO date
  }
}
