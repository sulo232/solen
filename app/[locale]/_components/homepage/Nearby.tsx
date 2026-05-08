import { Section, SectionHeader, ScrollRow } from "./SectionHeader";
import { SalonCard, type SalonCardProps } from "./SalonCard";

/**
 * In der Nähe — V3 (LIVE_TRUTH §Q51.2 + V2-D34 cards).
 *
 * Geo-aware section ordered by distance from user. Each card shows
 * "[distance] · [next-slot]" in row 2 (bold parts per §16.5).
 * Cards w slot today get the green "Heute frei" availability pill;
 * cards w next slot tomorrow+ omit the pill (date is in row 2).
 *
 * Server component. Static demo data — Phase 2 wires:
 *   - geolocation.permissionState() / Geolocation API to get user coords
 *   - PostGIS-style salon proximity query → top 8 within 5km
 *   - Per-salon next-slot resolution (today vs this-week)
 *
 * If geolocation denied: section either hides OR falls back to
 * "city center" coords. Decision deferred to Phase 2 §SY.
 */

interface NearbyEntry {
  slug: string;
  name: string;
  rating: number;
  category: SalonCardProps["category"];
  /** Distance string e.g. "200 m" or "1.2 km" — bold in row 2. */
  distance: string;
  /** Next-slot label OR "in N min" — bold parts in row 2. */
  nextSlot: { prefix?: string; bold: string; suffix?: string };
  /** Show "Heute frei" pill when slot is today AND ≤ today/tonight. */
  freeToday?: boolean;
  isSaved?: boolean;
  photoUrl?: string;
}

const DEMO: NearbyEntry[] = [
  { slug: "salon-maria", name: "Salon Maria", rating: 4.8, category: "coiffeur", distance: "200 m", nextSlot: { prefix: "In ", bold: "15 Min", suffix: " frei" }, freeToday: true, isSaved: true },
  { slug: "atelier-coiffure", name: "Atelier Coiffure", rating: 4.9, category: "coiffeur", distance: "450 m", nextSlot: { bold: "14:30, 16:00" }, freeToday: true },
  { slug: "nails-und-co", name: "Nails & Co.", rating: 4.7, category: "nails", distance: "800 m", nextSlot: { prefix: "Nächster ", bold: "Mo. 09:00" } },
  { slug: "spa-rheinufer", name: "Spa Rheinufer", rating: 4.8, category: "spa", distance: "1.2 km", nextSlot: { prefix: "Nächster ", bold: "Do. 11:00" } },
  { slug: "boheme", name: "Bohème", rating: 4.9, category: "barbershop", distance: "1.5 km", nextSlot: { prefix: "In ", bold: "30 Min", suffix: " frei" }, freeToday: true },
  { slug: "studio-nord", name: "Studio Nord", rating: 4.7, category: "barbershop", distance: "1.8 km", nextSlot: { prefix: "Heute ", bold: "18:00" }, freeToday: true },
];

export default function Nearby() {
  const entries = DEMO; // TODO: replace w real geo query Phase 2

  // Eyebrow shows distance to nearest result. Q5 voice: NO hyperlocal city
  // framing in the static fallback. When geolocation is wired (Phase 2),
  // the city/neighborhood appears dynamically only AFTER the user opts in
  // and we successfully reverse-geocode their position. Until then, just
  // distance — applies everywhere in Switzerland equally.
  const eyebrow = "In deiner Nähe · 200 m";

  return (
    <Section>
      <SectionHeader
        eyebrow={eyebrow}
        meta="geo-aware"
        title="In der Nähe"
        link={{ label: "Alle in deiner Nähe →", href: "/search/results?nearby=true" }}
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
            isSaved={e.isSaved}
            availability={
              e.freeToday
                ? { state: "now", label: "Heute frei" }
                : null
            }
            variant="availability"
            availabilityRow={
              <>
                <strong className="font-semibold text-s-ink">{e.distance}</strong>
                {" · "}
                {e.nextSlot.prefix && <span>{e.nextSlot.prefix}</span>}
                <strong className="font-semibold text-s-ink">{e.nextSlot.bold}</strong>
                {e.nextSlot.suffix && <span>{e.nextSlot.suffix}</span>}
              </>
            }
          />
        ))}
      </ScrollRow>
    </Section>
  );
}
