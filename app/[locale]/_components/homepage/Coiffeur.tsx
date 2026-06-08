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
  /** Real salon UUID — threaded to SalonCard → HeartButton so the save persists. */
  id: string;
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
// 2026-06-05: slugs/names/ids point at the REAL seeded coiffeur salons (Basel)
// so every card resolves to a live PDP instead of a 404. The curated
// service/price/photo/freeToday styling is kept; only identity is real. There
// are 8 seeded coiffeur salons, so a few are reused to keep the 15-card row.
const DEMO: CoiffeurEntry[] = [
  { id: "0ed041f9-149b-4241-a09e-d41351be7097", slug: "muse-beauty-studio", name: "Muse Beauty Studio", rating: 4.93, service: "Damen-Schnitt", priceFromCHF: 80, freeToday: true, isSaved: true,
    photoUrl: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&h=450&fit=crop&q=80" },
  { id: "e34402f4-2986-4f63-8487-b09645395c65", slug: "glow-lab-basel", name: "Glow Lab Basel", rating: 4.87, service: "Balayage", priceFromCHF: 120, freeToday: true,
    photoUrl: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=600&h=450&fit=crop&q=80" },
  { id: "d46e4ae5-8410-4fc9-a2da-43c978bc9477", slug: "salon-lumiere", name: "Salon Lumière", rating: 4.85, service: "Föhnen & Styling", priceFromCHF: 75,
    photoUrl: "https://images.unsplash.com/photo-1600948836101-f9ffda59d250?w=600&h=450&fit=crop&q=80" },
  { id: "1c217cdc-f342-4790-91ec-c87709468666", slug: "velvet-face", name: "Velvet Face", rating: 4.81, service: "Herren-Schnitt", priceFromCHF: 65,
    photoUrl: "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=600&h=450&fit=crop&q=80" },
  { id: "f4f9bdc6-96e9-4bbb-819d-3a2931897e57", slug: "haarsalon-margot", name: "Haarsalon Margot", rating: 4.78, service: "Color & Cut", priceFromCHF: 145,
    photoUrl: "https://images.unsplash.com/photo-1559599101-f09722fb4948?w=600&h=450&fit=crop&q=80" },
  { id: "9956212b-166f-4a51-a880-6e99e329267a", slug: "rouge-studio", name: "Rouge Studio", rating: 4.74, service: "Highlights", priceFromCHF: 95,
    photoUrl: "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=600&h=450&fit=crop&q=80" },
  // V2-D60.1: expanded 6 → 15 cards per row per LIVE_TRUTH §17.4 update.
  { id: "ff2abacd-661a-4e7a-9c00-2dda7ce29133", slug: "studio-schnittkunst", name: "Studio Schnittkunst", rating: 4.71, service: "Damen-Schnitt", priceFromCHF: 90, freeToday: true,
    photoUrl: "https://images.unsplash.com/photo-1600948836101-f9ffda59d250?w=600&h=450&fit=crop&q=80" },
  { id: "dd4a3e35-8b9c-4ee6-a52e-1fb71ce04f89", slug: "atelier-haarwerk", name: "Atelier Haarwerk", rating: 4.64, service: "Pflegeschnitt", priceFromCHF: 85,
    photoUrl: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&h=450&fit=crop&q=80" },
  { id: "0ed041f9-149b-4241-a09e-d41351be7097", slug: "muse-beauty-studio", name: "Muse Beauty Studio", rating: 4.93, service: "Strähnen", priceFromCHF: 110,
    photoUrl: "https://images.unsplash.com/photo-1559599101-f09722fb4948?w=600&h=450&fit=crop&q=80" },
  { id: "e34402f4-2986-4f63-8487-b09645395c65", slug: "glow-lab-basel", name: "Glow Lab Basel", rating: 4.87, service: "Föhnen", priceFromCHF: 55, freeToday: true,
    photoUrl: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=600&h=450&fit=crop&q=80" },
  { id: "d46e4ae5-8410-4fc9-a2da-43c978bc9477", slug: "salon-lumiere", name: "Salon Lumière", rating: 4.85, service: "Brautstyling", priceFromCHF: 180,
    photoUrl: "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=600&h=450&fit=crop&q=80" },
  { id: "1c217cdc-f342-4790-91ec-c87709468666", slug: "velvet-face", name: "Velvet Face", rating: 4.81, service: "Herren-Schnitt", priceFromCHF: 60,
    photoUrl: "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=600&h=450&fit=crop&q=80" },
  { id: "f4f9bdc6-96e9-4bbb-819d-3a2931897e57", slug: "haarsalon-margot", name: "Haarsalon Margot", rating: 4.78, service: "Color & Schnitt", priceFromCHF: 135, freeToday: true,
    photoUrl: "https://images.unsplash.com/photo-1600948836101-f9ffda59d250?w=600&h=450&fit=crop&q=80" },
  { id: "9956212b-166f-4a51-a880-6e99e329267a", slug: "rouge-studio", name: "Rouge Studio", rating: 4.74, service: "Föhnen & Styling", priceFromCHF: 70,
    photoUrl: "https://images.unsplash.com/photo-1559599101-f09722fb4948?w=600&h=450&fit=crop&q=80" },
  { id: "ff2abacd-661a-4e7a-9c00-2dda7ce29133", slug: "studio-schnittkunst", name: "Studio Schnittkunst", rating: 4.71, service: "Damen-Schnitt", priceFromCHF: 88,
    photoUrl: "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=600&h=450&fit=crop&q=80" },
];

export default function Coiffeur() {
  const entries = DEMO; // TODO: replace w real query Phase 2
  const scrollRef = React.useRef<HTMLDivElement>(null);

  return (
    // V3-D112 (2026-05-23): bg-s-peach REMOVED per user "remove ths color like
    // cream everywhere." Reverted to default white substrate. Token kept;
    // only usage on this section is removed. Prior V3-D107: warm return mid-feed.
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
            key={`${e.slug}-${idx}`}
            slug={e.slug}
            salonId={e.id}
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
