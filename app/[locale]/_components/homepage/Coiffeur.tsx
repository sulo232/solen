import { Section, SectionMeta, SectionTitle, SectionFrame, ScrollRow } from "./SectionHeader";
import { SalonCard } from "./SalonCard";

/**
 * Coiffeur-Salons — V3 (LIVE_TRUTH §Q51.3a + V2-D34 cards).
 *
 * First per-category section. Validates the §16.5 `service` variant
 * (row 2 = "[Service] · ab CHF [price]") and the combo Z (cream + cherry)
 * category-color tile fallback.
 *
 * Server component. Static demo data — Phase 2 wires:
 *   - `/api/salons/by-category?cat=coiffeur&city={city}` query
 *   - Affinity ordering (search history × repeat-bookings × ratings)
 *   - Per-salon featured-service resolution (most-booked in category)
 *
 * The other 3 category sections (Barbershop / Nails / Spa) will follow the
 * same pattern. If they all stay structurally identical, we'll extract a
 * shared <CategoryCarousel> primitive later. For now, YAGNI.
 */

interface CoiffeurEntry {
  slug: string;
  name: string;
  rating: number;
  /** Featured service in the category — e.g. "Damen-Schnitt", "Balayage". */
  service: string;
  /** Lowest price for the featured service (CHF). */
  priceFromCHF: number;
  /** Show "Heute frei" green pill when slot is today. */
  freeToday?: boolean;
  isSaved?: boolean;
  photoUrl?: string;
}

const DEMO: CoiffeurEntry[] = [
  { slug: "salon-maria", name: "Salon Maria", rating: 4.8, service: "Damen-Schnitt", priceFromCHF: 80, freeToday: true, isSaved: true },
  { slug: "atelier-coiffure", name: "Atelier Coiffure", rating: 4.9, service: "Balayage", priceFromCHF: 120, freeToday: true },
  { slug: "lina-hair-studio", name: "Lina Hair Studio", rating: 4.7, service: "Föhnen & Styling", priceFromCHF: 75 },
  { slug: "coiffeur-bahnhof", name: "Coiffeur Bahnhof", rating: 4.6, service: "Herren-Schnitt", priceFromCHF: 65 },
  { slug: "haar-atelier", name: "Haar Atelier", rating: 4.85, service: "Color & Cut", priceFromCHF: 145 },
  { slug: "studio-rheinblick", name: "Studio Rheinblick", rating: 4.7, service: "Highlights", priceFromCHF: 95 },
];

export default function Coiffeur() {
  const entries = DEMO; // TODO: replace w real query Phase 2

  return (
    <Section>
      <SectionMeta
        eyebrow="Coiffeur · ganze Schweiz"
        meta={`${entries.length} Salons · combo Z`}
      />
      <SectionFrame>
        <SectionTitle
          title="Coiffeur-Salons"
          link={{ label: "Alle Coiffeurs →", href: "/coiffeur" }}
        />
        <ScrollRow>
        {entries.map((e) => (
          <SalonCard
            key={e.slug}
            slug={e.slug}
            name={e.name}
            rating={e.rating}
            category="coiffeur"
            photoUrl={e.photoUrl}
            isSaved={e.isSaved}
            availability={
              e.freeToday ? { state: "now", label: "Heute frei" } : null
            }
            variant="service"
            service={e.service}
            priceFromCHF={e.priceFromCHF}
          />
        ))}
        </ScrollRow>
      </SectionFrame>
    </Section>
  );
}
