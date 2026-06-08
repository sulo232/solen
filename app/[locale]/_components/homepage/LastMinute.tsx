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
  /** Real salon UUID — threaded to SalonCard → HeartButton so the save persists. */
  id: string;
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
// 2026-06-05: slugs/names/ids point at the REAL seeded salons (Basel) so every
// card resolves to a live PDP instead of a 404. The curated discount/time/photo
// styling is kept; only identity (id+slug+name) is real. Each entry maps to a
// real salon of its OWN category so the colorway/labels stay correct.
const DEMO: LastMinuteEntry[] = [
  { id: "0ed041f9-149b-4241-a09e-d41351be7097", slug: "muse-beauty-studio", name: "Muse Beauty Studio", rating: 4.93, category: "coiffeur", discountPercent: 20, time: "14:30", priceFromCHF: 64,
    photoUrl: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&h=450&fit=crop&q=80" },
  { id: "ca037638-362a-491b-ada2-238e20d9d4a9", slug: "nail-studio-bliss", name: "Nail Studio Bliss", rating: 4.95, category: "nails", discountPercent: 15, time: "16:00", priceFromCHF: 38,
    photoUrl: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&h=450&fit=crop&q=80" },
  { id: "599bb853-c713-4dae-a3c4-96c6216139c4", slug: "old-town-barbers", name: "Old Town Barbers", rating: 4.91, category: "barbershop", discountPercent: 25, time: "17:30", priceFromCHF: 32,
    photoUrl: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&h=450&fit=crop&q=80" },
  { id: "40c96be2-198c-471e-82d8-3ada6f7de0de", slug: "smooth-skin-studio", name: "Smooth Skin Studio", rating: 4.90, category: "spa", discountPercent: 10, time: "18:00", priceFromCHF: 95,
    photoUrl: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&h=450&fit=crop&q=80" },
  { id: "e34402f4-2986-4f63-8487-b09645395c65", slug: "glow-lab-basel", name: "Glow Lab Basel", rating: 4.87, category: "coiffeur", discountPercent: 15, time: "18:30", priceFromCHF: 72,
    photoUrl: "https://images.unsplash.com/photo-1559599101-f09722fb4948?w=600&h=450&fit=crop&q=80" },
  { id: "9f078a3f-071d-4797-a0cf-e5ab6f3c1d2f", slug: "the-fade-factory", name: "The Fade Factory", rating: 4.86, category: "barbershop", discountPercent: 20, time: "19:00", priceFromCHF: 28,
    photoUrl: "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=600&h=450&fit=crop&q=80" },
  // V2-D60.1: expanded 6 → 15 cards per LIVE_TRUTH §17.4 update.
  { id: "d46e4ae5-8410-4fc9-a2da-43c978bc9477", slug: "salon-lumiere", name: "Salon Lumière", rating: 4.85, category: "coiffeur", discountPercent: 30, time: "15:00", priceFromCHF: 56,
    photoUrl: "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=600&h=450&fit=crop&q=80" },
  { id: "1c217cdc-f342-4790-91ec-c87709468666", slug: "velvet-face", name: "Velvet Face", rating: 4.81, category: "coiffeur", discountPercent: 15, time: "15:30", priceFromCHF: 68,
    photoUrl: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&h=450&fit=crop&q=80" },
  { id: "08760993-cdfd-4cc7-ac69-6a2bf8aed383", slug: "pink-petal-nails", name: "Pink Petal Nails", rating: 4.88, category: "nails", discountPercent: 20, time: "16:30", priceFromCHF: 42,
    photoUrl: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&h=450&fit=crop&q=80" },
  { id: "6aedd8a4-30fd-4390-949c-4d1fa06e1ff1", slug: "wax-and-glow-basel", name: "Wax & Glow Basel", rating: 4.83, category: "spa", discountPercent: 15, time: "17:00", priceFromCHF: 78,
    photoUrl: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&h=450&fit=crop&q=80" },
  { id: "f4f9bdc6-96e9-4bbb-819d-3a2931897e57", slug: "haarsalon-margot", name: "Haarsalon Margot", rating: 4.78, category: "coiffeur", discountPercent: 25, time: "17:00", priceFromCHF: 45,
    photoUrl: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=600&h=450&fit=crop&q=80" },
  { id: "63e581dd-2b0e-4910-b4a5-543bc1e157f6", slug: "blade-and-stone", name: "Blade & Stone", rating: 4.79, category: "barbershop", discountPercent: 30, time: "18:00", priceFromCHF: 24,
    photoUrl: "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=600&h=450&fit=crop&q=80" },
  { id: "9956212b-166f-4a51-a880-6e99e329267a", slug: "rouge-studio", name: "Rouge Studio", rating: 4.74, category: "coiffeur", discountPercent: 20, time: "18:30", priceFromCHF: 108,
    photoUrl: "https://images.unsplash.com/photo-1600948836101-f9ffda59d250?w=600&h=450&fit=crop&q=80" },
  { id: "23a8c8f8-4c9e-457a-a176-4b3c2881842a", slug: "lisse-studio", name: "Lisse Studio", rating: 4.68, category: "spa", discountPercent: 25, time: "19:00", priceFromCHF: 30,
    photoUrl: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&h=450&fit=crop&q=80" },
  { id: "ff2abacd-661a-4e7a-9c00-2dda7ce29133", slug: "studio-schnittkunst", name: "Studio Schnittkunst", rating: 4.71, category: "coiffeur", discountPercent: 15, time: "19:30", priceFromCHF: 60,
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
            key={`${e.slug}-${idx}`}
            slug={e.slug}
            salonId={e.id}
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
