"use client";

import * as React from "react";
import { Section, SectionTitle, SectionFrame, ScrollRow } from "./SectionHeader";
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

// V2-D60-photos: reuses same Unsplash photo per slug for cross-section consistency.
const DEMO: LastMinuteEntry[] = [
  { slug: "salon-maria", name: "Salon Maria", rating: 4.8, category: "coiffeur", discountPercent: 20, time: "14:30", priceFromCHF: 64,
    photoUrl: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&h=450&fit=crop&q=80" },
  { slug: "nails-und-co", name: "Nails & Co.", rating: 4.7, category: "nails", discountPercent: 15, time: "16:00", priceFromCHF: 38,
    photoUrl: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&h=450&fit=crop&q=80" },
  { slug: "boheme", name: "Bohème", rating: 4.9, category: "barbershop", discountPercent: 25, time: "17:30", priceFromCHF: 32,
    photoUrl: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&h=450&fit=crop&q=80" },
  { slug: "spa-rheinufer", name: "Spa Rheinufer", rating: 4.8, category: "spa", discountPercent: 10, time: "18:00", priceFromCHF: 95,
    photoUrl: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&h=450&fit=crop&q=80" },
  { slug: "haar-atelier", name: "Haar Atelier", rating: 4.6, category: "coiffeur", discountPercent: 15, time: "18:30", priceFromCHF: 72,
    photoUrl: "https://images.unsplash.com/photo-1559599101-f09722fb4948?w=600&h=450&fit=crop&q=80" },
  { slug: "studio-kleinbasel", name: "Studio Kleinbasel", rating: 4.85, category: "barbershop", discountPercent: 20, time: "19:00", priceFromCHF: 28,
    photoUrl: "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=600&h=450&fit=crop&q=80" },
  // V2-D60.1: expanded 6 → 15 cards per LIVE_TRUTH §17.4 update.
  { slug: "atelier-solene", name: "Atelier Solène", rating: 4.95, category: "coiffeur", discountPercent: 30, time: "15:00", priceFromCHF: 56,
    photoUrl: "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=600&h=450&fit=crop&q=80" },
  { slug: "salon-bellevue", name: "Salon Bellevue", rating: 4.9, category: "coiffeur", discountPercent: 15, time: "15:30", priceFromCHF: 68,
    photoUrl: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&h=450&fit=crop&q=80" },
  { slug: "nail-loft", name: "Nail Loft", rating: 4.8, category: "nails", discountPercent: 20, time: "16:30", priceFromCHF: 42,
    photoUrl: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&h=450&fit=crop&q=80" },
  { slug: "spa-margarethen", name: "Spa Margarethen", rating: 4.7, category: "spa", discountPercent: 15, time: "17:00", priceFromCHF: 78,
    photoUrl: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&h=450&fit=crop&q=80" },
  { slug: "coiffeur-spalentor", name: "Coiffeur Spalentor", rating: 4.6, category: "coiffeur", discountPercent: 25, time: "17:00", priceFromCHF: 45,
    photoUrl: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=600&h=450&fit=crop&q=80" },
  { slug: "barber-kleinbasel", name: "Barber Kleinbasel", rating: 4.75, category: "barbershop", discountPercent: 30, time: "18:00", priceFromCHF: 24,
    photoUrl: "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=600&h=450&fit=crop&q=80" },
  { slug: "haarwerkstatt", name: "Haarwerkstatt", rating: 4.75, category: "coiffeur", discountPercent: 20, time: "18:30", priceFromCHF: 108,
    photoUrl: "https://images.unsplash.com/photo-1600948836101-f9ffda59d250?w=600&h=450&fit=crop&q=80" },
  { slug: "studio-nord", name: "Studio Nord", rating: 4.7, category: "barbershop", discountPercent: 25, time: "19:00", priceFromCHF: 30,
    photoUrl: "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=600&h=450&fit=crop&q=80" },
  { slug: "salon-felix", name: "Salon Felix", rating: 4.8, category: "coiffeur", discountPercent: 15, time: "19:30", priceFromCHF: 60,
    photoUrl: "https://images.unsplash.com/photo-1559599101-f09722fb4948?w=600&h=450&fit=crop&q=80" },
];

// V2-D60-cards-8: Basel street addresses for Row 2 meta.
const LM_ADDRESSES = [
  "Steinenvorstadt 22", "Aeschenplatz 15", "Spalentorweg 8", "Klosterberg 12",
  "Marktplatz 19", "Petersgraben 28", "Picassoplatz 7", "Bundesgasse 14",
  "Margarethenstrasse 31", "Rheingasse 11", "Freie Strasse 44", "Gerbergasse 22",
  "Kornhausgasse 9", "Pfeffingerstrasse 17", "St. Alban-Anlage 5",
];

export default function LastMinute() {
  const entries = DEMO; // TODO: replace w real query Phase 2
  const maxDiscount = Math.max(...entries.map((e) => e.discountPercent));
  const scrollRef = React.useRef<HTMLDivElement>(null);

  return (
    <Section>
      <SectionFrame>
        <SectionTitle
          title="Last-Minute heute"
          link={{ label: "Alle →", href: "/last-minute" }}
          scrollRef={scrollRef}
        />
        <ScrollRow ref={scrollRef}>
        {entries.map((e, idx) => (
          <SalonCard
            key={e.slug}
            slug={e.slug}
            name={e.name}
            rating={e.rating}
            category={e.category}
            photoUrl={e.photoUrl}
            discountPercent={e.discountPercent}
            variant="availability"
            priceFromCHF={e.priceFromCHF}
            nextSlotLabel={e.time}
            address={LM_ADDRESSES[idx % LM_ADDRESSES.length]}
            city="Basel"
          />
        ))}
        </ScrollRow>
      </SectionFrame>
    </Section>
  );
}
