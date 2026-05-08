import { Section, SectionHeader, ScrollRow } from "./SectionHeader";
import { SalonCard, type SalonCardProps } from "./SalonCard";

/**
 * Last-Minute heute — V3 (LIVE_TRUTH §Q51.1 + V2-D34 cards).
 *
 * Server component. Static demo data for now; Phase 2 wires real
 * `/api/salons/last-minute` query (filters: discounted slots remaining
 * today, ordered by slot proximity).
 *
 * Card config for this section:
 *   - Top-left: discount badge (warning-amber light glass per §16.3.1b)
 *   - Bottom-left: NO availability pill — discount IS the live signal
 *   - Variant: `availability` w/ row 2 = "Heute [time] · ab CHF [price]"
 *     (bold parts per §16.5 typography rule)
 *
 * NOT in this commit:
 *   - Real backend query (deferred to Phase 2)
 *   - "Alle ansehen" link target `/last-minute` doesn't exist yet
 */

interface LastMinuteEntry {
  slug: string;
  name: string;
  rating: number;
  category: SalonCardProps["category"];
  discountPercent: number;
  /** Time string e.g. "14:30" — bold in row 2 per §16.5. */
  time: string;
  /** Price-from CHF — bold in row 2. */
  priceFromCHF: number;
  photoUrl?: string;
}

const DEMO: LastMinuteEntry[] = [
  { slug: "salon-maria", name: "Salon Maria", rating: 4.8, category: "coiffeur", discountPercent: 20, time: "14:30", priceFromCHF: 64 },
  { slug: "nails-und-co", name: "Nails & Co.", rating: 4.7, category: "nails", discountPercent: 15, time: "16:00", priceFromCHF: 38 },
  { slug: "boheme", name: "Bohème", rating: 4.9, category: "barbershop", discountPercent: 25, time: "17:30", priceFromCHF: 32 },
  { slug: "spa-rheinufer", name: "Spa Rheinufer", rating: 4.8, category: "spa", discountPercent: 10, time: "18:00", priceFromCHF: 95 },
  { slug: "haar-atelier", name: "Haar Atelier", rating: 4.6, category: "coiffeur", discountPercent: 15, time: "18:30", priceFromCHF: 72 },
  { slug: "studio-kleinbasel", name: "Studio Kleinbasel", rating: 4.85, category: "barbershop", discountPercent: 20, time: "19:00", priceFromCHF: 28 },
];

export default function LastMinute() {
  const entries = DEMO; // TODO: replace w real query Phase 2
  const maxDiscount = Math.max(...entries.map((e) => e.discountPercent));

  return (
    <Section>
      <SectionHeader
        eyebrow="Heute · letzte Slots"
        meta={`${entries.length} Salons · bis zu −${maxDiscount}%`}
        title="Last-Minute heute"
        link={{ label: "Alle →", href: "/last-minute" }}
      />

      <ScrollRow>
        {entries.map((e) => (
          <SalonCard
            key={e.slug}
            slug={e.slug}
            name={e.name}
            rating={e.rating}
            category={e.category}
            photoUrl={e.photoUrl}
            discountPercent={e.discountPercent}
            variant="availability"
            availabilityRow={
              <>
                Heute <strong className="font-semibold text-s-ink">{e.time}</strong>
                {" · ab "}
                <strong className="font-semibold text-s-ink">CHF {e.priceFromCHF}</strong>
              </>
            }
          />
        ))}
      </ScrollRow>
    </Section>
  );
}
