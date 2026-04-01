import type { Salon, SalonCategory } from "./types";

/* ─── BreadcrumbList schema ─── */

interface BreadcrumbItem {
  name: string;
  item?: string; // URL — omit for the last (current) item
}

export function generateBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((crumb, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: crumb.name,
      ...(crumb.item ? { item: crumb.item } : {}),
    })),
  };
}

const BASE_URL = "https://solen.ch";
const LOCALES = ["de", "en", "fr", "it"] as const;

/* ─── FAQPage schema ─── */

interface FaqItem {
  question: string;
  answer: string;
}

export function generateFaqSchema(faqs: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export const CATEGORY_FAQS: Record<string, FaqItem[]> = {
  coiffeur: [
    { question: "Was kostet ein Haarschnitt in Basel?", answer: "Ein Haarschnitt bei einem Coiffeur in Basel kostet durchschnittlich CHF 45–65. Bei Solen findest du Coiffeure ab CHF 35 — vergleiche Preise und buche direkt online." },
    { question: "Wie finde ich den besten Coiffeur in meiner Nähe?", answer: "Auf Solen kannst du Coiffeure in Basel nach Bewertungen, Preisen und Verfügbarkeit filtern. Lies echte Kundenbewertungen und buche deinen Wunschtermin sofort online." },
    { question: "Kann ich online einen Coiffeur-Termin buchen?", answer: "Ja! Auf Solen buchst du Coiffeur-Termine in Basel rund um die Uhr online — ohne Anruf, sofort bestätigt. Kostenlose Stornierung bis 24h vor dem Termin." },
    { question: "Was ist der Unterschied zwischen Coiffeur und Barbershop?", answer: "Ein Coiffeur spezialisiert sich auf alle Haartypen und Styling für Frauen, Männer und Kinder. Ein Barbershop konzentriert sich auf klassische Herrenhaarschnitte und Bart-Pflege." },
    { question: "Wie lange dauert ein Balayage-Termin?", answer: "Ein Balayage-Termin beim Coiffeur dauert in der Regel 2–3,5 Stunden, abhängig von Haarlänge und -dichte. Auf Solen siehst du die Dauer jedes Services direkt bei der Buchung." },
  ],
  nails: [
    { question: "Was kosten Gel-Nägel in Basel?", answer: "Gel-Nägel in Basel kosten durchschnittlich CHF 60–100, abhängig von Länge, Design und Studio. Auf Solen findest du Nagelstudios ab CHF 45 — vergleiche Preise transparent." },
    { question: "Wie oft sollte man Gel-Nägel erneuern?", answer: "Gel-Nägel sollten alle 3–4 Wochen aufgefüllt (Infill) und alle 8–12 Wochen vollständig erneuert werden. Auf Solen kannst du deinen nächsten Termin direkt nach dem Besuch vorbuchen." },
    { question: "Was ist der Unterschied zwischen Gel, Acryl und BIAB?", answer: "Gel ist flexibel und natürlicher wirkend. Acryl ist widerstandsfähiger und haltbarer. BIAB (Builder In A Bottle) ist eine neue Methode, die die natürlichen Nägel stärkt und schützt." },
    { question: "Kann ich Nail Art in Basel online buchen?", answer: "Ja! Auf Solen buchst du Nail-Art-Termine bei spezialisierten Nagelstudios in Basel online. Viele Studios zeigen ihr Portfolio direkt auf Solen — lass dich inspirieren und buche." },
    { question: "Was ist eine Maniküre und was kostet sie?", answer: "Eine klassische Maniküre umfasst Nagelpflege, Feilen, Nagelhaut-Behandlung und Lack. In Basel kostet eine Maniküre ca. CHF 35–55. Auf Solen findest du Studios für jeden Budget." },
  ],
  barbershop: [
    { question: "Was kostet ein Haarschnitt im Barbershop in Basel?", answer: "Ein Haarschnitt im Barbershop in Basel kostet durchschnittlich CHF 35–55. Auf Solen findest du Barbershops ab CHF 25 — vergleiche Preise und buche online oder via Walk-in Queue." },
    { question: "Kann ich walk-in zum Barbershop in Basel?", answer: "Viele Barbershops in Basel bieten einen digitalen Walk-in Queue via Solen an — trage dich von unterwegs ein und sieh die aktuelle Wartezeit in Echtzeit. Kein langes Warten vor Ort." },
    { question: "Was ist ein Skin Fade und was kostet er?", answer: "Ein Skin Fade ist ein Haarschnitt, der an den Seiten bis auf die Haut ausrasiert wird. In Basel kostet ein Skin Fade ca. CHF 40–60. Auf Solen findest du Barbiere, die auf Fades spezialisiert sind." },
    { question: "Bieten Barbershops in Basel auch Bart-Pflege an?", answer: "Ja! Die meisten Barbershops in Basel bieten Bart-Trimmen, Bart-Design und Hot-Towel Rasur an. Auf Solen siehst du genau, welche Services ein Barbershop anbietet, bevor du buchst." },
    { question: "Was ist der Unterschied zwischen Barbershop und Coiffeur?", answer: "Ein Barbershop ist auf klassische Herrenhaarschnitte, Fades und Bart-Pflege spezialisiert. Ein Coiffeur bietet das volle Spektrum für alle Haartypen. Beide findest du auf Solen." },
  ],
  spa: [
    { question: "Was kostet eine Massage in Basel?", answer: "Eine klassische Massage in Basel kostet ca. CHF 80–140 für 60 Minuten. Auf Solen findest du Massagen ab CHF 60 — vergleiche Preise und buche direkt online." },
    { question: "Welche Arten von Massagen gibt es in Basel?", answer: "In Basel findest du auf Solen klassische Massage, Hot-Stone, Tiefengewebsmassage, Aromatherapie, Reflexzonenmassage und mehr. Jedes Studio zeigt seine Services mit Preisen und Dauer." },
    { question: "Wie buche ich einen Spa-Termin in Basel?", answer: "Auf Solen buchst du Spa-Termine in Basel rund um die Uhr online — kein Anruf nötig, sofort bestätigt. Wähle Datum, Uhrzeit und Service und bezahle sicher online." },
    { question: "Was ist eine Gesichtsbehandlung und was kostet sie?", answer: "Eine Gesichtsbehandlung reinigt und pflegt die Haut intensiv. In Basel kostet eine Facial-Behandlung ca. CHF 90–160. Auf Solen findest du Studios mit ★ Bewertungen und Preisen." },
    { question: "Kann ich einen Spa-Gutschein in Basel kaufen?", answer: "Viele Spas auf Solen bieten digitale Geschenkkarten an, die du direkt auf der Plattform kaufen kannst. Das perfekte Geschenk für Wellness-Liebhaber in Basel." },
  ],
  makeup: [
    { question: "Was kostet ein professionelles Make-up in Basel?", answer: "Professionelles Make-up in Basel kostet ca. CHF 80–150. Für Braut-Makeup können die Preise höher sein. Auf Solen vergleichst du Make-up Artists mit Preisen und Bewertungen." },
    { question: "Wie finde ich einen guten Make-up Artist in Basel?", answer: "Auf Solen findest du Make-up Artists in Basel mit Portfolio, Bewertungen und Preisen. Vergleiche Stile — von natürlich bis editorial — und buche deinen Termin online." },
    { question: "Was kostet Braut-Makeup in Basel?", answer: "Braut-Makeup in Basel kostet durchschnittlich CHF 150–300, oft inklusive Probe-Make-up. Auf Solen findest du auf Hochzeits-Make-up spezialisierte Artists in Basel." },
    { question: "Kann ich Make-up online buchen?", answer: "Ja! Auf Solen buchst du Make-up Artists in Basel online — für Hochzeiten, Events, Fotoshoots oder den Alltag. Sofort bestätigt, kostenlose Stornierung bis 24h vorher." },
    { question: "Wie lange dauert ein Make-up Termin?", answer: "Ein professionelles Make-up dauert ca. 45–90 Minuten, Braut-Make-up bis zu 2 Stunden. Auf Solen siehst du die genaue Termindauer direkt bei der Buchung." },
  ],
  waxing: [
    { question: "Was kostet Brazilian Waxing in Basel?", answer: "Brazilian Waxing in Basel kostet ca. CHF 50–80. Auf Solen findest du Waxing-Studios ab CHF 40 — vergleiche Preise, lies Bewertungen und buche online." },
    { question: "Wie lange hält Waxing?", answer: "Waxing hält in der Regel 3–6 Wochen, da die Haare an der Wurzel entfernt werden. Auf Solen kannst du deinen nächsten Waxing-Termin in Basel bequem vorbuchen." },
    { question: "Was ist der Unterschied zwischen Waxing und Sugaring?", answer: "Beim Waxing wird heisses oder warmes Wachs verwendet. Sugaring nutzt eine natürliche Zuckerpaste. Beide Methoden sind effektiv — Sugaring gilt als sanfter für empfindliche Haut." },
    { question: "Wie bereite ich mich auf einen Waxing-Termin vor?", answer: "Die Haare sollten mindestens 3–5mm lang sein. Vermeide Cremes und Öle vor dem Termin. Auf Solen siehst du Studio-spezifische Hinweise direkt auf der Buchungsseite." },
    { question: "Kann ich Waxing in Basel online buchen?", answer: "Ja! Auf Solen buchst du Waxing-Termine in Basel rund um die Uhr online — kein Anruf, sofort bestätigt. Wähle deinen Wunschtermin und buche in wenigen Klicks." },
  ],
};

/* ─── Canonical URL + hreflang alternates helper ─── */

export function buildAlternates(path: string, locale?: string) {
  const loc = locale ?? "de";
  const cleanPath = path ? `/${path}` : "";
  return {
    canonical: `${BASE_URL}/${loc}${cleanPath}`,
    languages: {
      ...Object.fromEntries(LOCALES.map((l) => [l, `${BASE_URL}/${l}${cleanPath}`])),
      "x-default": `${BASE_URL}/de${cleanPath}`,
    },
  };
}

/* ─── Category listing ItemList schema ─── */

interface CategoryListSalon {
  name: string;
  slug: string;
  cover_photo_url?: string | null;
}

export function generateCategoryListSchema(
  category: string,
  salons: CategoryListSalon[],
  locale: string = "de",
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${category.charAt(0).toUpperCase() + category.slice(1)} in Basel`,
    url: `https://solen.ch/${locale}/${category}`,
    numberOfItems: salons.length,
    itemListElement: salons.slice(0, 20).map((s, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `https://solen.ch/${locale}/salon/${s.slug}`,
      name: s.name,
      ...(s.cover_photo_url ? { image: s.cover_photo_url } : {}),
    })),
  };
}

/* ─── WebSite + SearchAction schema (homepage) ─── */

export function generateWebsiteSchema(locale: string = "de") {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "solen.ch",
    url: `https://solen.ch/${locale}`,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `https://solen.ch/${locale}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

const categoryToSchemaType: Record<SalonCategory, string> = {
  coiffeur: "HairSalon",
  barbershop: "HairSalon",
  nails: "NailSalon",
  spa: "DaySpa",
  makeup: "BeautySalon",
  waxing: "BeautySalon",
};

function getSchemaType(categories: SalonCategory[]): string {
  if (categories.includes("spa")) return "DaySpa";
  if (categories.includes("nails")) return "NailSalon";
  if (categories.includes("coiffeur") || categories.includes("barbershop")) return "HairSalon";
  return "HealthAndBeautyBusiness";
}

/**
 * Generate JSON-LD structured data for a salon profile page.
 * Embed in <head> via Next.js script tag or generateMetadata.
 * Used by Dev 2 on the salon/[slug] page.
 */
export function generateSalonSchema(salon: Salon, locale: string = "de") {
  const dayMap: Record<string, string> = {
    mon: "Monday",
    tue: "Tuesday",
    wed: "Wednesday",
    thu: "Thursday",
    fri: "Friday",
    sat: "Saturday",
    sun: "Sunday",
  };

  const openingHoursSpec = Object.entries(salon.opening_hours ?? {})
    .filter(([, hours]) => hours !== null)
    .map(([day, hours]) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: dayMap[day] ?? day,
      opens: hours!.open,
      closes: hours!.close,
    }));

  const priceRange =
    salon.average_rating >= 4 ? "CHF CHF CHF" : salon.average_rating >= 3 ? "CHF CHF" : "CHF";

  return {
    "@context": "https://schema.org",
    "@type": getSchemaType(salon.categories),
    name: salon.name,
    url: `https://solen.ch/${locale}/salon/${salon.slug}`,
    telephone: salon.phone ?? undefined,
    image: salon.cover_photo_url ?? undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress: salon.address,
      addressLocality: "Basel",
      addressCountry: "CH",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: salon.latitude,
      longitude: salon.longitude,
    },
    aggregateRating:
      salon.review_count > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: salon.average_rating.toFixed(1),
            reviewCount: salon.review_count,
          }
        : undefined,
    openingHoursSpecification: openingHoursSpec,
    priceRange,
  };
}
