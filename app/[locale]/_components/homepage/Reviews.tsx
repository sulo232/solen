import { Section, SectionTitle } from "./SectionHeader";
import { TestimonialsColumn, type Review } from "./TestimonialsColumn";

/**
 * Bewertungen — V2-D47 (2026-05-09) + V2-D49l card-tap split (2026-05-10).
 *
 * Vertical marquee testimonial column pattern. Each card has TWO tap
 * targets per V2-D49l:
 *   1. Card body (review text, avatar, person name, meta) → opens the
 *      review on the homepage (modal/inline expansion — stub today,
 *      wires when /api/reviews/featured ships in Phase 2).
 *   2. Salon name pill (with Store icon) → jumps to /salon/[slug],
 *      letting users discover the salon directly from the testimonial.
 *
 * Layout: 1 col mobile / 2 cols tablet / 3 cols desktop. Each column
 * scrolls at a different speed for organic feel (32s / 26s / 38s).
 *
 * Mask-image fade at top + bottom hides the marquee boundaries so
 * cards appear to enter / leave softly instead of popping in.
 *
 * BACKEND CONTRACT (Phase 2 — `/api/reviews/featured?limit=10`):
 *   The endpoint returns reviews shaped EXACTLY like the demo data below:
 *     { stars, text, initials, name, salonName, salonSlug, meta }
 *   Real data swap only requires replacing the REVIEWS const with a
 *   client-side fetch + state hook. Card structure stays.
 */

const REVIEWS: Review[] = [
  {
    stars: 5,
    text: "Termin in 30 Sekunden, keine Anrufe, keine Vorab-Zahlung. Salon Maria war wie immer top, aber die Buchung über Solen war diesmal einfach besser.",
    initials: "LK",
    name: "Lara K.",
    meta: "Basel · vor 2 Wochen",
    salonName: "Salon Maria",
    salonSlug: "salon-maria",
  },
  {
    stars: 5,
    text: "Last-Minute heute Abend zu Bohème: 25% Rabatt und der beste Fade meines Lebens. Die Heute-frei-Anzeige ist Gold wert wenn man spontan ist.",
    initials: "MH",
    name: "Marc H.",
    meta: "Basel · vor 5 Tagen",
    salonName: "Bohème",
    salonSlug: "boheme",
  },
  {
    stars: 5,
    text: "Habe einen Look auf Entdecken gespeichert und konnte direkt buchen, same-day. Die Stylistin hatte das Foto schon offen als ich ankam. Magic.",
    initials: "SR",
    name: "Sara R.",
    meta: "Zürich · vor 1 Woche",
    salonName: "Nail Lab",
    salonSlug: "nail-lab",
  },
  {
    stars: 5,
    text: "Endlich kein Telefonieren mehr. Drei Optionen verglichen, eine gebucht, fertig in unter zwei Minuten. So sollte das überall funktionieren.",
    initials: "AM",
    name: "Anna M.",
    meta: "Bern · vor 3 Tagen",
    salonName: "Rhein Spa",
    salonSlug: "rhein-spa",
  },
  {
    stars: 4,
    text: "Buchung war easy, Salon top. Einziger Kritikpunkt: Wegbeschreibung zeigt nicht alle Eingänge. Aber das ist Detail. Komme wieder.",
    initials: "TW",
    name: "Tobias W.",
    meta: "Zürich · vor 1 Woche",
    salonName: "Atelier Coiffure",
    salonSlug: "atelier-coiffure",
  },
  {
    stars: 5,
    text: "Mein Geburtstagsgeschenk war eigentlich der Salonbesuch, aber dass ich es online buchen konnte, ohne fünfmal anzurufen, war fast besser.",
    initials: "ES",
    name: "Eva S.",
    meta: "Basel · vor 4 Tagen",
    salonName: "Nail Lab",
    salonSlug: "nail-lab",
  },
  {
    stars: 5,
    text: "Habe den Salon zufällig über die Karte gefunden, 200 m von zu Hause. Wie konnte ich den nicht kennen? Bewertungen waren spot-on.",
    initials: "NB",
    name: "Niklas B.",
    meta: "Luzern · vor 6 Tagen",
    salonName: "Studio Nord",
    salonSlug: "studio-nord",
  },
  {
    stars: 5,
    text: "Premium ohne Premium-Preise. Spa-Atmosphäre wie in einem 5-Sterne-Hotel, aber ich habe normal mit Solen gebucht: gleicher Preis, sofortige Bestätigung.",
    initials: "SL",
    name: "Sophie L.",
    meta: "Lausanne · vor 10 Tagen",
    salonName: "Rhein Spa",
    salonSlug: "rhein-spa",
  },
  {
    stars: 4,
    text: "Hat mich überzeugt. Die Stornierungsregel ist fair, die Erinnerungen kommen rechtzeitig. Ein paar Salons haben noch keine Echtzeit-Verfügbarkeit, aber das wird sicher besser.",
    initials: "DK",
    name: "David K.",
    meta: "St. Gallen · vor 2 Wochen",
    salonName: "Haar Atelier",
    salonSlug: "haar-atelier",
  },
  {
    stars: 5,
    text: "Es ist die Detailliebe: die Erinnerung am Vortag, die Wegbeschreibung mit dem richtigen Eingang, die Möglichkeit, einfach umzubuchen. Fühlt sich einfach durchdacht an.",
    initials: "LF",
    name: "Lena F.",
    meta: "Basel · vor 3 Tagen",
    salonName: "Salon Maria",
    salonSlug: "salon-maria",
  },
];

// Split into 3 columns with intentional overlap so each column has 4-5 cards
// (long enough for the loop to feel populated, not stark when one card per
// row would create awkward gaps mid-scroll).
const COL_A = REVIEWS.slice(0, 5);
const COL_B = REVIEWS.slice(3, 8);
const COL_C = REVIEWS.slice(5, 10);

export default function Reviews() {
  return (
    <Section>
      <SectionTitle
        title="Bewertungen"
        link={{ label: "Alle Bewertungen →", href: "/reviews" }}
      />
      <div
        className={[
          // V2-D47-3: container height bumped 380→440 since cards bumped one notch up
          // (p-4 + 13px body + h-8 avatar). Keeps ~2.5 cards visible at once.
          "relative mt-6 grid h-[440px] gap-2.5 overflow-hidden md:gap-4",
          "grid-cols-2 lg:grid-cols-3",
          // Mask-image: fade out top + bottom so cards enter/leave softly
          "[mask-image:linear-gradient(to_bottom,transparent_0%,black_12%,black_88%,transparent_100%)]",
          "[-webkit-mask-image:linear-gradient(to_bottom,transparent_0%,black_12%,black_88%,transparent_100%)]",
        ].join(" ")}
      >
        <TestimonialsColumn reviews={COL_A} duration={32} />
        <TestimonialsColumn reviews={COL_B} duration={26} />
        <TestimonialsColumn reviews={COL_C} duration={38} className="hidden lg:block" />
      </div>
    </Section>
  );
}
