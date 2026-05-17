"use client";

import * as React from "react";
import { Section, SectionTitle, SectionFrame, ScrollRow } from "./SectionHeader";
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

// V2-D60-cards-7: time slots rotated to vary by entry index. Real backend
// returns each salon's actual next bookable slot — this is demo-only.
const SLOTS_TODAY = ["14:00", "15:30", "17:00", "18:30"];
const SLOTS_LATER = ["Morgen 09:00", "Morgen 10:30", "Mi. 14:00", "Do. 11:00", "Fr. 16:00", "Mo. 09:30", "21. Mai 14:00"];
function pickSlot(idx: number, freeToday: boolean): string {
  return freeToday ? SLOTS_TODAY[idx % SLOTS_TODAY.length] : SLOTS_LATER[idx % SLOTS_LATER.length];
}

// V2-D60-cards-8: Basel street addresses for Row 2 meta (Fresha-style).
const ADDRESSES = [
  "Steinenvorstadt 12", "Spalenberg 23", "Rheingasse 7", "Marktplatz 14",
  "St. Alban-Vorstadt 18", "Aeschenvorstadt 55", "Margarethenpark 4", "Bundesgasse 9",
  "Spitalgasse 27", "Petersgraben 31", "Freie Strasse 88", "Gerbergasse 16",
  "Klosterberg 19", "Picassoplatz 4", "Barfüsserplatz 6",
];

// V2-D60-photos (2026-05-14): real Unsplash salon imagery added. Letter-only
// placeholder fallbacks looked "beta" against Airbnb / Fresha-quality cards.
// Photos use ?w=600&h=450&fit=crop&q=80 for 4:3 aspect at 2x retina.
const DEMO: CoiffeurEntry[] = [
  { slug: "salon-maria", name: "Salon Maria", rating: 4.8, service: "Damen-Schnitt", priceFromCHF: 80, freeToday: true, isSaved: true,
    photoUrl: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&h=450&fit=crop&q=80" },
  { slug: "atelier-coiffure", name: "Atelier Coiffure", rating: 4.9, service: "Balayage", priceFromCHF: 120, freeToday: true,
    photoUrl: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=600&h=450&fit=crop&q=80" },
  { slug: "lina-hair-studio", name: "Lina Hair Studio", rating: 4.7, service: "Föhnen & Styling", priceFromCHF: 75,
    photoUrl: "https://images.unsplash.com/photo-1600948836101-f9ffda59d250?w=600&h=450&fit=crop&q=80" },
  { slug: "coiffeur-bahnhof", name: "Coiffeur Bahnhof", rating: 4.6, service: "Herren-Schnitt", priceFromCHF: 65,
    photoUrl: "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=600&h=450&fit=crop&q=80" },
  { slug: "haar-atelier", name: "Haar Atelier", rating: 4.85, service: "Color & Cut", priceFromCHF: 145,
    photoUrl: "https://images.unsplash.com/photo-1559599101-f09722fb4948?w=600&h=450&fit=crop&q=80" },
  { slug: "studio-rheinblick", name: "Studio Rheinblick", rating: 4.7, service: "Highlights", priceFromCHF: 95,
    photoUrl: "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=600&h=450&fit=crop&q=80" },
  // V2-D60.1: expanded 6 → 15 cards per row per LIVE_TRUTH §17.4 update.
  { slug: "coiffure-trois-rois", name: "Coiffure Trois Rois", rating: 4.85, service: "Damen-Schnitt", priceFromCHF: 90, freeToday: true,
    photoUrl: "https://images.unsplash.com/photo-1600948836101-f9ffda59d250?w=600&h=450&fit=crop&q=80" },
  { slug: "salon-bellevue", name: "Salon Bellevue", rating: 4.9, service: "Pflegeschnitt", priceFromCHF: 85,
    photoUrl: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&h=450&fit=crop&q=80" },
  { slug: "haar-stil", name: "Haar & Stil", rating: 4.7, service: "Strähnen", priceFromCHF: 110,
    photoUrl: "https://images.unsplash.com/photo-1559599101-f09722fb4948?w=600&h=450&fit=crop&q=80" },
  { slug: "coiffeur-spalentor", name: "Coiffeur Spalentor", rating: 4.6, service: "Föhnen", priceFromCHF: 55, freeToday: true,
    photoUrl: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=600&h=450&fit=crop&q=80" },
  { slug: "atelier-solene", name: "Atelier Solène", rating: 4.95, service: "Brautstyling", priceFromCHF: 180,
    photoUrl: "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=600&h=450&fit=crop&q=80" },
  { slug: "coiffeur-margarethen", name: "Coiffeur Margarethen", rating: 4.65, service: "Herren-Schnitt", priceFromCHF: 60,
    photoUrl: "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=600&h=450&fit=crop&q=80" },
  { slug: "haarwerkstatt", name: "Haarwerkstatt", rating: 4.75, service: "Color & Schnitt", priceFromCHF: 135, freeToday: true,
    photoUrl: "https://images.unsplash.com/photo-1600948836101-f9ffda59d250?w=600&h=450&fit=crop&q=80" },
  { slug: "salon-felix", name: "Salon Felix", rating: 4.8, service: "Föhnen & Styling", priceFromCHF: 70,
    photoUrl: "https://images.unsplash.com/photo-1559599101-f09722fb4948?w=600&h=450&fit=crop&q=80" },
  { slug: "coiffeur-st-alban", name: "Coiffeur St. Alban", rating: 4.75, service: "Damen-Schnitt", priceFromCHF: 88,
    photoUrl: "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=600&h=450&fit=crop&q=80" },
];

export default function Coiffeur() {
  const entries = DEMO; // TODO: replace w real query Phase 2
  const scrollRef = React.useRef<HTMLDivElement>(null);

  return (
    <Section>
      <SectionFrame>
        <SectionTitle
          title="Coiffeur-Salons"
          link={{ label: "Alle Coiffeurs →", href: "/coiffeur" }}
          scrollRef={scrollRef}
        />
        <ScrollRow ref={scrollRef}>
        {entries.map((e, idx) => (
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
            priceFromCHF={e.priceFromCHF}
            nextSlotLabel={pickSlot(idx, !!e.freeToday)}
            address={ADDRESSES[idx % ADDRESSES.length]}
            city="Basel"
          />
        ))}
        </ScrollRow>
      </SectionFrame>
    </Section>
  );
}
