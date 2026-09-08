import type { Salon, SalonCategory } from "./types";
import { defaultLocale } from "./locale-constants";

/* ─── JSON-LD safe serialization (A4-jsonld-escape, 2026-07-27) ───
 * JSON.stringify does NOT escape `<`, `>`, or `&`. A JSON-LD payload built
 * from a DB-sourced or user-editable value (a salon name, edited from the
 * salon owner's own dashboard) can therefore break out of the
 * `<script type="application/ld+json">` tag it's injected into via
 * dangerouslySetInnerHTML if the value contains "</script>". There is no
 * CSP to catch it. Use this at every JSON-LD site that carries a
 * DB-sourced or user-editable value; compile-time-literal-only payloads
 * (static copy, translation strings) don't need it. */
export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/&/g, "\\u0026")
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e");
}

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

// A7-city-category-seo (2026-07-27): was a single de-only record served verbatim under
// /en/, /fr/, /it/ too (untranslated FAQ copy on 3 of 4 locales). These pages are the
// legacy single-city (Basel) category routes (app/[locale]/coiffeur|nails|barbershop|spa),
// not the multi-city [city]/[category] route, so "Basel" is intentionally still literal
// here; the locale-per-key nesting fixes the actual bug (wrong-language answer text).
export const CATEGORY_FAQS: Record<string, Record<string, FaqItem[]>> = {
  coiffeur: {
    de: [
      { question: "Was kostet ein Haarschnitt in Basel?", answer: "Ein Haarschnitt bei einem Coiffeur in Basel kostet durchschnittlich CHF 45 bis 65. Bei Solen findest du Coiffeure ab CHF 35, vergleiche Preise und buche direkt online." },
      { question: "Wie finde ich den besten Coiffeur in meiner Nähe?", answer: "Auf Solen kannst du Coiffeure in Basel nach Bewertungen, Preisen und Verfügbarkeit filtern. Lies echte Kundenbewertungen und buche deinen Wunschtermin sofort online." },
      { question: "Kann ich online einen Coiffeur-Termin buchen?", answer: "Ja! Auf Solen buchst du Coiffeur-Termine in Basel rund um die Uhr online, ohne Anruf, sofort bestätigt. Kostenlose Stornierung bis 24h vor dem Termin." },
      { question: "Was ist der Unterschied zwischen Coiffeur und Barbershop?", answer: "Ein Coiffeur spezialisiert sich auf alle Haartypen und Styling für Frauen, Männer und Kinder. Ein Barbershop konzentriert sich auf klassische Herrenhaarschnitte und Bart-Pflege." },
      { question: "Wie lange dauert ein Balayage-Termin?", answer: "Ein Balayage-Termin beim Coiffeur dauert in der Regel 2 bis 3,5 Stunden, abhängig von Haarlänge und -dichte. Auf Solen siehst du die Dauer jedes Services direkt bei der Buchung." },
    ],
    en: [
      { question: "How much does a haircut cost in Basel?", answer: "A haircut at a hair salon in Basel costs CHF 45 to 65 on average. On Solen you'll find hair salons from CHF 35, compare prices and book directly online." },
      { question: "How do I find the best hair salon near me?", answer: "On Solen you can filter hair salons in Basel by reviews, prices and availability. Read real customer reviews and book your preferred slot instantly online." },
      { question: "Can I book a hair salon appointment online?", answer: "Yes! On Solen you book hair salon appointments in Basel online, any time of day, no phone call needed, confirmed instantly. Free cancellation up to 24h before the appointment." },
      { question: "What's the difference between a hair salon and a barbershop?", answer: "A hair salon specializes in all hair types and styling for women, men and children. A barbershop focuses on classic men's haircuts and beard grooming." },
      { question: "How long does a balayage appointment take?", answer: "A balayage appointment at a hair salon usually takes 2 to 3.5 hours, depending on hair length and density. On Solen you see each service's duration directly when booking." },
    ],
    fr: [
      { question: "Combien coûte une coupe de cheveux à Bâle?", answer: "Une coupe de cheveux chez un coiffeur à Bâle coûte en moyenne CHF 45 à 65. Sur Solen, tu trouves des coiffeurs dès CHF 35, compare les prix et réserve directement en ligne." },
      { question: "Comment trouver le meilleur coiffeur près de chez moi?", answer: "Sur Solen, filtre les coiffeurs à Bâle par avis, prix et disponibilité. Lis de vrais avis clients et réserve ton créneau immédiatement en ligne." },
      { question: "Puis-je réserver un rendez-vous chez le coiffeur en ligne?", answer: "Oui! Sur Solen, réserve des rendez-vous chez le coiffeur à Bâle en ligne, à toute heure, sans appel, confirmé instantanément. Annulation gratuite jusqu'à 24h avant le rendez-vous." },
      { question: "Quelle est la différence entre un coiffeur et un barbershop?", answer: "Un coiffeur se spécialise dans tous les types de cheveux et le style pour femmes, hommes et enfants. Un barbershop se concentre sur les coupes masculines classiques et l'entretien de la barbe." },
      { question: "Combien de temps dure un rendez-vous balayage?", answer: "Un rendez-vous balayage chez le coiffeur dure généralement 2 à 3,5 heures, selon la longueur et la densité des cheveux. Sur Solen, tu vois la durée de chaque service directement lors de la réservation." },
    ],
    it: [
      { question: "Quanto costa un taglio di capelli a Basilea?", answer: "Un taglio di capelli da un parrucchiere a Basilea costa in media CHF 45-65. Su Solen trovi parrucchieri a partire da CHF 35, confronta i prezzi e prenota direttamente online." },
      { question: "Come trovo il miglior parrucchiere vicino a me?", answer: "Su Solen puoi filtrare i parrucchieri a Basilea per recensioni, prezzi e disponibilità. Leggi recensioni reali e prenota subito il tuo appuntamento online." },
      { question: "Posso prenotare un appuntamento dal parrucchiere online?", answer: "Sì! Su Solen prenoti appuntamenti dal parrucchiere a Basilea online, a qualsiasi ora, senza chiamare, confermato all'istante. Cancellazione gratuita fino a 24h prima dell'appuntamento." },
      { question: "Qual è la differenza tra parrucchiere e barbershop?", answer: "Un parrucchiere è specializzato in tutti i tipi di capelli e styling per donne, uomini e bambini. Un barbershop si concentra su tagli maschili classici e cura della barba." },
      { question: "Quanto dura un appuntamento per il balayage?", answer: "Un appuntamento per il balayage dal parrucchiere dura solitamente 2-3,5 ore, a seconda della lunghezza e densità dei capelli. Su Solen vedi la durata di ogni servizio direttamente al momento della prenotazione." },
    ],
  },
  nails: {
    de: [
      { question: "Was kosten Gel-Nägel in Basel?", answer: "Gel-Nägel in Basel kosten durchschnittlich CHF 60 bis 100, abhängig von Länge, Design und Studio. Auf Solen findest du Nagelstudios ab CHF 45, vergleiche Preise transparent." },
      { question: "Wie oft sollte man Gel-Nägel erneuern?", answer: "Gel-Nägel sollten alle 3 bis 4 Wochen aufgefüllt (Infill) und alle 8 bis 12 Wochen vollständig erneuert werden. Auf Solen kannst du deinen nächsten Termin direkt nach dem Besuch vorbuchen." },
      { question: "Was ist der Unterschied zwischen Gel, Acryl und BIAB?", answer: "Gel ist flexibel und natürlicher wirkend. Acryl ist widerstandsfähiger und haltbarer. BIAB (Builder In A Bottle) ist eine neue Methode, die die natürlichen Nägel stärkt und schützt." },
      { question: "Kann ich Nail Art in Basel online buchen?", answer: "Ja! Auf Solen buchst du Nail-Art-Termine bei spezialisierten Nagelstudios in Basel online. Viele Studios zeigen ihr Portfolio direkt auf Solen, lass dich inspirieren und buche." },
      { question: "Was ist eine Maniküre und was kostet sie?", answer: "Eine klassische Maniküre umfasst Nagelpflege, Feilen, Nagelhaut-Behandlung und Lack. In Basel kostet eine Maniküre ca. CHF 35 bis 55. Auf Solen findest du Studios für jeden Budget." },
    ],
    en: [
      { question: "How much do gel nails cost in Basel?", answer: "Gel nails in Basel cost CHF 60 to 100 on average, depending on length, design and studio. On Solen you'll find nail studios from CHF 45, compare prices transparently." },
      { question: "How often should gel nails be redone?", answer: "Gel nails should be infilled every 3 to 4 weeks and fully redone every 8 to 12 weeks. On Solen you can pre-book your next appointment right after your visit." },
      { question: "What's the difference between gel, acrylic and BIAB?", answer: "Gel is flexible and looks more natural. Acrylic is tougher and longer-lasting. BIAB (Builder In A Bottle) is a newer method that strengthens and protects the natural nail." },
      { question: "Can I book nail art in Basel online?", answer: "Yes! On Solen you book nail art appointments at specialized nail studios in Basel online. Many studios show their portfolio directly on Solen, get inspired and book." },
      { question: "What is a manicure and how much does it cost?", answer: "A classic manicure includes nail care, filing, cuticle treatment and polish. In Basel a manicure costs around CHF 35 to 55. On Solen you'll find studios for every budget." },
    ],
    fr: [
      { question: "Combien coûtent les ongles en gel à Bâle?", answer: "Les ongles en gel à Bâle coûtent en moyenne CHF 60 à 100, selon la longueur, le design et le studio. Sur Solen, tu trouves des instituts d'ongles dès CHF 45, compare les prix en toute transparence." },
      { question: "À quelle fréquence faut-il refaire ses ongles en gel?", answer: "Les ongles en gel doivent être remplis toutes les 3 à 4 semaines et entièrement refaits toutes les 8 à 12 semaines. Sur Solen, tu peux réserver ton prochain rendez-vous directement après ta visite." },
      { question: "Quelle est la différence entre gel, acrylique et BIAB?", answer: "Le gel est flexible et a un rendu plus naturel. L'acrylique est plus résistant et durable. Le BIAB (Builder In A Bottle) est une méthode récente qui renforce et protège l'ongle naturel." },
      { question: "Puis-je réserver du nail art à Bâle en ligne?", answer: "Oui! Sur Solen, réserve des rendez-vous de nail art dans des instituts spécialisés à Bâle en ligne. Beaucoup de studios montrent leur portfolio directement sur Solen, inspire-toi et réserve." },
      { question: "Qu'est-ce qu'une manucure et combien coûte-t-elle?", answer: "Une manucure classique comprend le soin des ongles, le limage, le traitement des cuticules et le vernis. À Bâle, une manucure coûte environ CHF 35 à 55. Sur Solen, tu trouves des instituts pour tous les budgets." },
    ],
    it: [
      { question: "Quanto costano le unghie in gel a Basilea?", answer: "Le unghie in gel a Basilea costano in media CHF 60-100, a seconda di lunghezza, design e studio. Su Solen trovi centri unghie a partire da CHF 45, confronta i prezzi in modo trasparente." },
      { question: "Ogni quanto vanno rifatte le unghie in gel?", answer: "Le unghie in gel andrebbero riempite (infill) ogni 3-4 settimane e rifatte completamente ogni 8-12 settimane. Su Solen puoi prenotare il prossimo appuntamento subito dopo la visita." },
      { question: "Qual è la differenza tra gel, acrilico e BIAB?", answer: "Il gel è flessibile e ha un aspetto più naturale. L'acrilico è più resistente e duraturo. Il BIAB (Builder In A Bottle) è un metodo nuovo che rinforza e protegge l'unghia naturale." },
      { question: "Posso prenotare la nail art a Basilea online?", answer: "Sì! Su Solen prenoti appuntamenti di nail art presso centri unghie specializzati a Basilea online. Molti centri mostrano il loro portfolio direttamente su Solen, lasciati ispirare e prenota." },
      { question: "Cos'è una manicure e quanto costa?", answer: "Una manicure classica include cura delle unghie, limatura, trattamento delle cuticole e smalto. A Basilea una manicure costa circa CHF 35-55. Su Solen trovi centri per ogni budget." },
    ],
  },
  barbershop: {
    de: [
      { question: "Was kostet ein Haarschnitt im Barbershop in Basel?", answer: "Ein Haarschnitt im Barbershop in Basel kostet durchschnittlich CHF 35 bis 55. Auf Solen findest du Barbershops ab CHF 25, vergleiche Preise und buche online oder via Walk-in Queue." },
      { question: "Kann ich walk-in zum Barbershop in Basel?", answer: "Viele Barbershops in Basel bieten einen digitalen Walk-in Queue via Solen an, trage dich von unterwegs ein und sieh die aktuelle Wartezeit in Echtzeit. Kein langes Warten vor Ort." },
      { question: "Was ist ein Skin Fade und was kostet er?", answer: "Ein Skin Fade ist ein Haarschnitt, der an den Seiten bis auf die Haut ausrasiert wird. In Basel kostet ein Skin Fade ca. CHF 40 bis 60. Auf Solen findest du Barbiere, die auf Fades spezialisiert sind." },
      { question: "Bieten Barbershops in Basel auch Bart-Pflege an?", answer: "Ja! Die meisten Barbershops in Basel bieten Bart-Trimmen, Bart-Design und Hot-Towel Rasur an. Auf Solen siehst du genau, welche Services ein Barbershop anbietet, bevor du buchst." },
      { question: "Was ist der Unterschied zwischen Barbershop und Coiffeur?", answer: "Ein Barbershop ist auf klassische Herrenhaarschnitte, Fades und Bart-Pflege spezialisiert. Ein Coiffeur bietet das volle Spektrum für alle Haartypen. Beide findest du auf Solen." },
    ],
    en: [
      { question: "How much does a haircut at a barbershop in Basel cost?", answer: "A haircut at a barbershop in Basel costs CHF 35 to 55 on average. On Solen you'll find barbershops from CHF 25, compare prices and book online or via the walk-in queue." },
      { question: "Can I walk in to a barbershop in Basel?", answer: "Many barbershops in Basel offer a digital walk-in queue via Solen, join from wherever you are and see the current wait time in real time. No more waiting around in the shop." },
      { question: "What's a skin fade and how much does it cost?", answer: "A skin fade is a haircut shaved down to the skin at the sides. In Basel a skin fade costs around CHF 40 to 60. On Solen you'll find barbers who specialize in fades." },
      { question: "Do barbershops in Basel also offer beard grooming?", answer: "Yes! Most barbershops in Basel offer beard trimming, beard shaping and hot towel shaves. On Solen you see exactly which services a barbershop offers before you book." },
      { question: "What's the difference between a barbershop and a hair salon?", answer: "A barbershop specializes in classic men's haircuts, fades and beard grooming. A hair salon offers the full range for all hair types. You'll find both on Solen." },
    ],
    fr: [
      { question: "Combien coûte une coupe de cheveux dans un barbershop à Bâle?", answer: "Une coupe de cheveux dans un barbershop à Bâle coûte en moyenne CHF 35 à 55. Sur Solen, tu trouves des barbershops dès CHF 25, compare les prix et réserve en ligne ou via la file d'attente walk-in." },
      { question: "Puis-je me présenter sans rendez-vous dans un barbershop à Bâle?", answer: "De nombreux barbershops à Bâle proposent une file d'attente walk-in numérique via Solen, inscris-toi où que tu sois et vois le temps d'attente actuel en temps réel. Plus besoin d'attendre sur place." },
      { question: "Qu'est-ce qu'un skin fade et combien coûte-t-il?", answer: "Un skin fade est une coupe rasée jusqu'à la peau sur les côtés. À Bâle, un skin fade coûte environ CHF 40 à 60. Sur Solen, tu trouves des barbiers spécialisés dans les fades." },
      { question: "Les barbershops à Bâle proposent-ils aussi l'entretien de la barbe?", answer: "Oui! La plupart des barbershops à Bâle proposent la taille de barbe, le design de barbe et le rasage à la serviette chaude. Sur Solen, tu vois exactement les services proposés par un barbershop avant de réserver." },
      { question: "Quelle est la différence entre un barbershop et un coiffeur?", answer: "Un barbershop est spécialisé dans les coupes masculines classiques, les fades et l'entretien de la barbe. Un coiffeur offre toute la palette pour tous les types de cheveux. Tu trouves les deux sur Solen." },
    ],
    it: [
      { question: "Quanto costa un taglio di capelli in un barbershop a Basilea?", answer: "Un taglio di capelli in un barbershop a Basilea costa in media CHF 35-55. Su Solen trovi barbershop a partire da CHF 25, confronta i prezzi e prenota online o tramite la coda walk-in." },
      { question: "Posso presentarmi senza appuntamento in un barbershop a Basilea?", answer: "Molti barbershop a Basilea offrono una coda walk-in digitale tramite Solen, iscriviti da dove ti trovi e vedi il tempo di attesa attuale in tempo reale. Niente più attese sul posto." },
      { question: "Cos'è uno skin fade e quanto costa?", answer: "Uno skin fade è un taglio rasato fino alla pelle ai lati. A Basilea uno skin fade costa circa CHF 40-60. Su Solen trovi barbieri specializzati nei fade." },
      { question: "I barbershop a Basilea offrono anche cura della barba?", answer: "Sì! La maggior parte dei barbershop a Basilea offre rifinitura barba, design barba e rasatura con asciugamano caldo. Su Solen vedi esattamente quali servizi offre un barbershop prima di prenotare." },
      { question: "Qual è la differenza tra barbershop e parrucchiere?", answer: "Un barbershop è specializzato in tagli maschili classici, fade e cura della barba. Un parrucchiere offre la gamma completa per tutti i tipi di capelli. Trovi entrambi su Solen." },
    ],
  },
  spa: {
    de: [
      { question: "Was kostet eine Massage in Basel?", answer: "Eine klassische Massage in Basel kostet ca. CHF 80 bis 140 für 60 Minuten. Auf Solen findest du Massagen ab CHF 60, vergleiche Preise und buche direkt online." },
      { question: "Welche Arten von Massagen gibt es in Basel?", answer: "In Basel findest du auf Solen klassische Massage, Hot-Stone, Tiefengewebsmassage, Aromatherapie, Reflexzonenmassage und mehr. Jedes Studio zeigt seine Services mit Preisen und Dauer." },
      { question: "Wie buche ich einen Spa-Termin in Basel?", answer: "Auf Solen buchst du Spa-Termine in Basel rund um die Uhr online, kein Anruf nötig, sofort bestätigt. Wähle Datum, Uhrzeit und Service und bezahle sicher online." },
      { question: "Was ist eine Gesichtsbehandlung und was kostet sie?", answer: "Eine Gesichtsbehandlung reinigt und pflegt die Haut intensiv. In Basel kostet eine Facial-Behandlung ca. CHF 90 bis 160. Auf Solen findest du Studios mit ★ Bewertungen und Preisen." },
      { question: "Kann ich einen Spa-Gutschein in Basel kaufen?", answer: "Viele Spas auf Solen bieten digitale Geschenkkarten an, die du direkt auf der Plattform kaufen kannst. Das perfekte Geschenk für Wellness-Liebhaber in Basel." },
    ],
    en: [
      { question: "How much does a massage cost in Basel?", answer: "A classic massage in Basel costs around CHF 80 to 140 for 60 minutes. On Solen you'll find massages from CHF 60, compare prices and book directly online." },
      { question: "What types of massage are available in Basel?", answer: "On Solen you'll find classic massage, hot stone, deep tissue, aromatherapy, reflexology and more in Basel. Every studio lists its services with prices and duration." },
      { question: "How do I book a spa appointment in Basel?", answer: "On Solen you book spa appointments in Basel online, any time of day, no phone call needed, confirmed instantly. Choose date, time and service and pay securely online." },
      { question: "What's a facial treatment and how much does it cost?", answer: "A facial treatment deeply cleanses and cares for the skin. In Basel a facial costs around CHF 90 to 160. On Solen you'll find studios with star ratings and prices." },
      { question: "Can I buy a spa gift card in Basel?", answer: "Many spas on Solen offer digital gift cards you can buy directly on the platform, the perfect gift for wellness lovers in Basel." },
    ],
    fr: [
      { question: "Combien coûte un massage à Bâle?", answer: "Un massage classique à Bâle coûte environ CHF 80 à 140 pour 60 minutes. Sur Solen, tu trouves des massages dès CHF 60, compare les prix et réserve directement en ligne." },
      { question: "Quels types de massages trouve-t-on à Bâle?", answer: "Sur Solen, tu trouves à Bâle des massages classiques, pierres chaudes, tissus profonds, aromathérapie, réflexologie et plus encore. Chaque institut affiche ses services avec prix et durée." },
      { question: "Comment réserver un rendez-vous spa à Bâle?", answer: "Sur Solen, réserve des rendez-vous spa à Bâle en ligne, à toute heure, sans appel, confirmé instantanément. Choisis la date, l'heure et le service et paie en toute sécurité en ligne." },
      { question: "Qu'est-ce qu'un soin du visage et combien coûte-t-il?", answer: "Un soin du visage nettoie et soigne la peau en profondeur. À Bâle, un soin du visage coûte environ CHF 90 à 160. Sur Solen, tu trouves des instituts avec notes ★ et prix." },
      { question: "Puis-je acheter un bon cadeau spa à Bâle?", answer: "De nombreux spas sur Solen proposent des cartes-cadeaux numériques que tu peux acheter directement sur la plateforme, le cadeau parfait pour les amateurs de bien-être à Bâle." },
    ],
    it: [
      { question: "Quanto costa un massaggio a Basilea?", answer: "Un massaggio classico a Basilea costa circa CHF 80-140 per 60 minuti. Su Solen trovi massaggi a partire da CHF 60, confronta i prezzi e prenota direttamente online." },
      { question: "Quali tipi di massaggio si trovano a Basilea?", answer: "Su Solen trovi a Basilea massaggio classico, hot stone, tessuti profondi, aromaterapia, riflessologia e altro. Ogni centro mostra i propri servizi con prezzi e durata." },
      { question: "Come prenoto un appuntamento spa a Basilea?", answer: "Su Solen prenoti appuntamenti spa a Basilea online, a qualsiasi ora, senza chiamare, confermato all'istante. Scegli data, ora e servizio e paga in modo sicuro online." },
      { question: "Cos'è un trattamento viso e quanto costa?", answer: "Un trattamento viso pulisce e cura la pelle in profondità. A Basilea un trattamento viso costa circa CHF 90-160. Su Solen trovi centri con recensioni ★ e prezzi." },
      { question: "Posso comprare un buono regalo spa a Basilea?", answer: "Molti spa su Solen offrono carte regalo digitali che puoi acquistare direttamente sulla piattaforma, il regalo perfetto per gli amanti del benessere a Basilea." },
    ],
  },
};

/* ─── Canonical URL + hreflang alternates helper ─── */

export function buildAlternates(path: string, locale?: string) {
  // seo-comms-12 (2026-07-27): loc's fallback and x-default both used to hardcode the
  // literal "de" independently of middleware.ts's own defaultLocale import from ./i18n,
  // so the two files could silently drift apart with no shared source of truth. Now both
  // read the same constant middleware.ts already uses, turning the invariant (x-default
  // must equal the crawler-facing default locale) into a structural impossibility to drift
  // instead of a documentation-only rule.
  const loc = locale ?? defaultLocale;
  const cleanPath = path ? `/${path}` : "";
  return {
    canonical: `${BASE_URL}/${loc}${cleanPath}`,
    languages: {
      ...Object.fromEntries(LOCALES.map((l) => [l, `${BASE_URL}/${l}${cleanPath}`])),
      "x-default": `${BASE_URL}/${defaultLocale}${cleanPath}`,
    },
  };
}

/* ─── Category listing ItemList schema ─── */

interface CategoryListSalon {
  name: string;
  slug: string;
  cover_photo_url?: string | null;
  average_rating?: number | null;
  review_count?: number | null;
  address?: string | null;
  postal_code?: string | null;
  categories?: string[] | null;
}

export function generateCategoryListSchema(
  category: string,
  salons: CategoryListSalon[],
  locale: string = "de",
  options?: { url?: string; cityName?: string },
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    // A6-address-locality (2026-07-27): was hardcoded "<Category> in Basel",
    // wrong the moment this nationwide (city-unfiltered) query returns a
    // salon in any other city (the seed DB already has Zuerich salons).
    // Category name only, no invented city.
    name: category.charAt(0).toUpperCase() + category.slice(1),
    url: options?.url ?? `https://solen.ch/${locale}/${category}`,
    numberOfItems: Math.min(salons.length, 20),
    itemListElement: salons.slice(0, 20).map((s, i) => {
      const url = `https://solen.ch/${locale}/salon/${s.slug}`;
      return {
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": getSchemaType((s.categories ?? []) as SalonCategory[]),
          "@id": url,
          name: s.name,
          url,
          ...(s.cover_photo_url ? { image: s.cover_photo_url } : {}),
          // No-fabrication: only emitted when the salon actually has reviews AND a rating to
          // report, never a 0/0 placeholder.
          ...(s.review_count && s.review_count > 0 && s.average_rating != null
            ? {
                aggregateRating: {
                  "@type": "AggregateRating",
                  ratingValue: s.average_rating,
                  reviewCount: s.review_count,
                },
              }
            : {}),
          // A street address is the anchor; postalCode/addressLocality/addressCountry only
          // join it when there IS a street to attach them to, so a salon with a postal_code
          // but no street never emits a half address.
          ...(s.address
            ? {
                address: {
                  "@type": "PostalAddress",
                  streetAddress: s.address,
                  ...(s.postal_code ? { postalCode: s.postal_code } : {}),
                  ...(options?.cityName ? { addressLocality: options.cityName } : {}),
                  addressCountry: "CH",
                },
              }
            : {}),
        },
      };
    }),
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

/* ─── Organization schema (homepage) ─── */
export function generateOrganizationSchema(locale: string = "de") {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Solen",
    url: `https://solen.ch/${locale}`,
    logo: "https://solen.ch/logo.svg",
  };
}

const categoryToSchemaType: Record<SalonCategory, string> = {
  coiffeur: "HairSalon",
  barbershop: "HairSalon",
  nails: "NailSalon",
  spa: "DaySpa",
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
 *
 * A6-address-locality (2026-07-27): addressLocality used to be hardcoded to
 * "Basel" unconditionally, wrong structured data for every salon the moment
 * a second city has salons (the seed DB already carries Zuerich salons,
 * currently inactive but visible in the owner's own PDP preview). The
 * caller must now supply the salon's real joined city names (`cities`,
 * one name per locale, from the `salons.city_id -> cities.id` FK); a salon
 * with no city join gets NO addressLocality field, never an invented one.
 */
export function generateSalonSchema(
  salon: Salon & {
    cities: { name_de: string; name_en: string; name_fr: string; name_it: string } | null;
  },
  locale: string = "de",
) {
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

  // Locale-matched city name, joined from the salon's own city_id. Falls back
  // to German (the site default) only when the requested locale's name is
  // missing but another locale's isn't; stays undefined (field omitted by
  // safeJsonLd/JSON.stringify) when the salon has no city join at all.
  const cityNamesByLocale: Record<string, string | undefined> = {
    de: salon.cities?.name_de,
    en: salon.cities?.name_en,
    fr: salon.cities?.name_fr,
    it: salon.cities?.name_it,
  };
  const addressLocality = cityNamesByLocale[locale] ?? salon.cities?.name_de ?? undefined;

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
      addressLocality,
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
