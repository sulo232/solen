"use client";

import * as React from "react";
import { Section, SectionTitle, SectionFrame, ScrollRow } from "./SectionHeader";
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

// V2-D60-photos: Unsplash imagery — same slug reuses same photo across sections.
const DEMO: NearbyEntry[] = [
  { slug: "salon-maria", name: "Salon Maria", rating: 4.8, category: "coiffeur", distance: "200 m", nextSlot: { prefix: "In ", bold: "15 Min", suffix: " frei" }, freeToday: true, isSaved: true,
    photoUrl: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&h=450&fit=crop&q=80" },
  { slug: "atelier-coiffure", name: "Atelier Coiffure", rating: 4.9, category: "coiffeur", distance: "450 m", nextSlot: { bold: "14:30, 16:00" }, freeToday: true,
    photoUrl: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=600&h=450&fit=crop&q=80" },
  { slug: "nails-und-co", name: "Nails & Co.", rating: 4.7, category: "nails", distance: "800 m", nextSlot: { prefix: "Nächster ", bold: "Mo. 09:00" },
    photoUrl: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&h=450&fit=crop&q=80" },
  { slug: "spa-rheinufer", name: "Spa Rheinufer", rating: 4.8, category: "spa", distance: "1.2 km", nextSlot: { prefix: "Nächster ", bold: "Do. 11:00" },
    photoUrl: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&h=450&fit=crop&q=80" },
  { slug: "boheme", name: "Bohème", rating: 4.9, category: "barbershop", distance: "1.5 km", nextSlot: { prefix: "In ", bold: "30 Min", suffix: " frei" }, freeToday: true,
    photoUrl: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&h=450&fit=crop&q=80" },
  { slug: "studio-nord", name: "Studio Nord", rating: 4.7, category: "barbershop", distance: "1.8 km", nextSlot: { prefix: "Heute ", bold: "18:00" }, freeToday: true,
    photoUrl: "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=600&h=450&fit=crop&q=80" },
  // V2-D60.1: expanded 6 → 15 cards per LIVE_TRUTH §17.4 update.
  { slug: "haar-atelier", name: "Haar Atelier", rating: 4.6, category: "coiffeur", distance: "2.0 km", nextSlot: { prefix: "Heute ", bold: "16:30" }, freeToday: true,
    photoUrl: "https://images.unsplash.com/photo-1559599101-f09722fb4948?w=600&h=450&fit=crop&q=80" },
  { slug: "nail-loft", name: "Nail Loft", rating: 4.8, category: "nails", distance: "2.2 km", nextSlot: { prefix: "Heute ", bold: "17:30" }, freeToday: true,
    photoUrl: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&h=450&fit=crop&q=80" },
  { slug: "salon-bellevue", name: "Salon Bellevue", rating: 4.9, category: "coiffeur", distance: "2.4 km", nextSlot: { bold: "Morgen 09:00" },
    photoUrl: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&h=450&fit=crop&q=80" },
  { slug: "studio-rheinblick", name: "Studio Rheinblick", rating: 4.7, category: "coiffeur", distance: "2.6 km", nextSlot: { prefix: "Nächster ", bold: "Mi. 14:00" },
    photoUrl: "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=600&h=450&fit=crop&q=80" },
  { slug: "spa-margarethen", name: "Spa Margarethen", rating: 4.7, category: "spa", distance: "3.0 km", nextSlot: { prefix: "Nächster ", bold: "Fr. 10:00" },
    photoUrl: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&h=450&fit=crop&q=80" },
  { slug: "coiffure-trois-rois", name: "Coiffure Trois Rois", rating: 4.85, category: "coiffeur", distance: "3.2 km", nextSlot: { bold: "Heute 17:00" }, freeToday: true,
    photoUrl: "https://images.unsplash.com/photo-1600948836101-f9ffda59d250?w=600&h=450&fit=crop&q=80" },
  { slug: "atelier-solene", name: "Atelier Solène", rating: 4.95, category: "coiffeur", distance: "3.5 km", nextSlot: { prefix: "Nächster ", bold: "Sa. 11:30" },
    photoUrl: "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=600&h=450&fit=crop&q=80" },
  { slug: "barber-kleinbasel", name: "Barber Kleinbasel", rating: 4.75, category: "barbershop", distance: "3.8 km", nextSlot: { prefix: "Heute ", bold: "19:00" }, freeToday: true,
    photoUrl: "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=600&h=450&fit=crop&q=80" },
  { slug: "salon-felix", name: "Salon Felix", rating: 4.8, category: "coiffeur", distance: "4.1 km", nextSlot: { prefix: "Nächster ", bold: "Di. 13:00" },
    photoUrl: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=600&h=450&fit=crop&q=80" },
];

// V2-D60-cards-7: default price per category for demo (real API will provide).
const CATEGORY_DEFAULT_PRICE: Record<NearbyEntry["category"], number> = {
  coiffeur: 80, barbershop: 50, nails: 45, spa: 95,
};

// V2-D60-cards-8: Basel street addresses for Row 2 meta.
const NEARBY_ADDRESSES = [
  "Steinenvorstadt 18", "Spalenberg 5", "Rheingasse 14", "Marktplatz 9",
  "Bahnhofstrasse 33", "Aeschenvorstadt 22", "Margarethenstrasse 12", "Freie Strasse 67",
  "Pfeffingerstrasse 8", "Gerbergasse 28", "Petersgraben 19", "Kornhausgasse 14",
  "St. Alban-Vorstadt 25", "Klosterberg 6", "Bundesgasse 41",
];

// V2-D60-cards-7: convert legacy nextSlot {prefix, bold, suffix} into a clean
// single label. Strips "Nächster " prefix; keeps the bold date/time chunk.
// "Only one time" rule: comma-lists like "14:30, 16:00" → first time only.
// V2-D60-cards-9: strip "Heute" prefix — green HEUTE FREI pill already signals today.
function formatNextSlot(e: NearbyEntry): string {
  const firstChunk = e.nextSlot.bold.split(",")[0].trim();
  return firstChunk; // e.g. "14:30", "Mi. 14:00", "21. Mai 14:00"
}

// V2-D66 (2026-05-16, Hayden move #16): pick the right directional state.
// Cards with freeToday + "In N Min" copy → "limited" (time-pressure ⚡).
// Cards with freeToday + multiple times → "urgent" (filling fast ↘).
// Cards with freeToday + single time → "now" (available ↗).
// Cards without freeToday → no pill (date in row 2 carries the info).
// TODO: Phase 2 derives state from real booking density / time-to-fill,
// not heuristics on demo copy.
function resolveAvailability(
  e: NearbyEntry,
  _idx: number,
): { state: "now" | "urgent" | "limited"; label: string } | null {
  if (!e.freeToday) return null;
  const isMinutesAway = /\bMin\b/i.test(e.nextSlot.bold);
  if (isMinutesAway) {
    return { state: "limited", label: e.nextSlot.bold };
  }
  const hasMultipleSlots = e.nextSlot.bold.includes(",");
  if (hasMultipleSlots) {
    return { state: "now", label: "Heute frei" };
  }
  return { state: "urgent", label: "Schnell weg" };
}

export default function Nearby() {
  const entries = DEMO; // TODO: replace w real geo query Phase 2
  const scrollRef = React.useRef<HTMLDivElement>(null);

  return (
    <Section>
      <SectionFrame>
        <SectionTitle
          title="In der Nähe"
          link={{ label: "Alle in deiner Nähe →", href: "/search/results?nearby=true" }}
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
            isSaved={e.isSaved}
            availability={resolveAvailability(e, idx)}
            variant="availability"
            priceFromCHF={CATEGORY_DEFAULT_PRICE[e.category]}
            nextSlotLabel={formatNextSlot(e)}
            address={NEARBY_ADDRESSES[idx % NEARBY_ADDRESSES.length]}
            city="Basel"
          />
        ))}
        </ScrollRow>
      </SectionFrame>
    </Section>
  );
}
