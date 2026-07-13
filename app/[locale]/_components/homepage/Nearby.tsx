"use client";

import * as React from "react";
import { MapPin } from "lucide-react";
import { useLocale } from "next-intl";
import { Section, SectionTitle, SectionFrame, ScrollRow } from "./SectionHeader";
import { SalonCard, type SalonCardProps } from "./SalonCard";
import { useCustomerPrefs, sortByCategoryPicks, type CustomerPrefs } from "./useCustomerPrefs";

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
  /** Real salon UUID — threaded to SalonCard → HeartButton so the save persists. */
  id: string;
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
// 2026-06-05: slugs/names/ids point at the REAL seeded salons (Basel) so every
// card resolves to a live PDP instead of a 404. The curated distance/next-slot/
// photo styling is kept; only identity (id+slug+name) is real. Each entry maps
// to a real salon of its OWN category so the colorway/labels stay correct.
const DEMO: NearbyEntry[] = [
  // V3-D128 (2026-05-24): "15 Min" → "Heute 15:30" per user "we book by
  // TIME not by Min". Solen's data model is TIME-slot based, not duration.
  { id: "0ed041f9-149b-4241-a09e-d41351be7097", slug: "muse-beauty-studio", name: "Muse Beauty Studio", rating: 4.93, category: "coiffeur", distance: "200 m", nextSlot: { prefix: "Heute ", bold: "15:30" }, freeToday: true, isSaved: true,
    photoUrl: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&h=450&fit=crop&q=80" },
  { id: "e34402f4-2986-4f63-8487-b09645395c65", slug: "glow-lab-basel", name: "Glow Lab Basel", rating: 4.87, category: "coiffeur", distance: "450 m", nextSlot: { bold: "14:30, 16:00" }, freeToday: true,
    photoUrl: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=600&h=450&fit=crop&q=80" },
  { id: "ca037638-362a-491b-ada2-238e20d9d4a9", slug: "nail-studio-bliss", name: "Nail Studio Bliss", rating: 4.95, category: "nails", distance: "800 m", nextSlot: { prefix: "Nächster ", bold: "Mo. 09:00" },
    photoUrl: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&h=450&fit=crop&q=80" },
  { id: "40c96be2-198c-471e-82d8-3ada6f7de0de", slug: "smooth-skin-studio", name: "Smooth Skin Studio", rating: 4.90, category: "spa", distance: "1.2 km", nextSlot: { prefix: "Nächster ", bold: "Do. 11:00" },
    photoUrl: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&h=450&fit=crop&q=80" },
  // V3-D128 (2026-05-24): "30 Min" → "Heute 17:15" — same fix as above.
  { id: "599bb853-c713-4dae-a3c4-96c6216139c4", slug: "old-town-barbers", name: "Old Town Barbers", rating: 4.91, category: "barbershop", distance: "1.5 km", nextSlot: { prefix: "Heute ", bold: "17:15" }, freeToday: true,
    photoUrl: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&h=450&fit=crop&q=80" },
  { id: "9f078a3f-071d-4797-a0cf-e5ab6f3c1d2f", slug: "the-fade-factory", name: "The Fade Factory", rating: 4.86, category: "barbershop", distance: "1.8 km", nextSlot: { prefix: "Heute ", bold: "18:00" }, freeToday: true,
    photoUrl: "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=600&h=450&fit=crop&q=80" },
  // V2-D60.1: expanded 6 → 15 cards per LIVE_TRUTH §17.4 update.
  { id: "d46e4ae5-8410-4fc9-a2da-43c978bc9477", slug: "salon-lumiere", name: "Salon Lumière", rating: 4.85, category: "coiffeur", distance: "2.0 km", nextSlot: { prefix: "Heute ", bold: "16:30" }, freeToday: true,
    photoUrl: "https://images.unsplash.com/photo-1559599101-f09722fb4948?w=600&h=450&fit=crop&q=80" },
  { id: "08760993-cdfd-4cc7-ac69-6a2bf8aed383", slug: "pink-petal-nails", name: "Pink Petal Nails", rating: 4.88, category: "nails", distance: "2.2 km", nextSlot: { prefix: "Heute ", bold: "17:30" }, freeToday: true,
    photoUrl: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&h=450&fit=crop&q=80" },
  { id: "1c217cdc-f342-4790-91ec-c87709468666", slug: "velvet-face", name: "Velvet Face", rating: 4.81, category: "coiffeur", distance: "2.4 km", nextSlot: { bold: "Morgen 09:00" },
    photoUrl: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&h=450&fit=crop&q=80" },
  { id: "f4f9bdc6-96e9-4bbb-819d-3a2931897e57", slug: "haarsalon-margot", name: "Haarsalon Margot", rating: 4.78, category: "coiffeur", distance: "2.6 km", nextSlot: { prefix: "Nächster ", bold: "Mi. 14:00" },
    photoUrl: "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=600&h=450&fit=crop&q=80" },
  { id: "6aedd8a4-30fd-4390-949c-4d1fa06e1ff1", slug: "wax-and-glow-basel", name: "Wax & Glow Basel", rating: 4.83, category: "spa", distance: "3.0 km", nextSlot: { prefix: "Nächster ", bold: "Fr. 10:00" },
    photoUrl: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&h=450&fit=crop&q=80" },
  { id: "9956212b-166f-4a51-a880-6e99e329267a", slug: "rouge-studio", name: "Rouge Studio", rating: 4.74, category: "coiffeur", distance: "3.2 km", nextSlot: { bold: "Heute 17:00" }, freeToday: true,
    photoUrl: "https://images.unsplash.com/photo-1600948836101-f9ffda59d250?w=600&h=450&fit=crop&q=80" },
  { id: "ff2abacd-661a-4e7a-9c00-2dda7ce29133", slug: "studio-schnittkunst", name: "Studio Schnittkunst", rating: 4.71, category: "coiffeur", distance: "3.5 km", nextSlot: { prefix: "Nächster ", bold: "Sa. 11:30" },
    photoUrl: "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=600&h=450&fit=crop&q=80" },
  { id: "63e581dd-2b0e-4910-b4a5-543bc1e157f6", slug: "blade-and-stone", name: "Blade & Stone", rating: 4.79, category: "barbershop", distance: "3.8 km", nextSlot: { prefix: "Heute ", bold: "19:00" }, freeToday: true,
    photoUrl: "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=600&h=450&fit=crop&q=80" },
  { id: "dd4a3e35-8b9c-4ee6-a52e-1fb71ce04f89", slug: "atelier-haarwerk", name: "Atelier Haarwerk", rating: 4.64, category: "coiffeur", distance: "4.1 km", nextSlot: { prefix: "Nächster ", bold: "Di. 13:00" },
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

// CARD_REDESIGN_2026-07-13 (C2, mockup-ok, approved card-redesign.html #c11):
// resolveAvailability() removed. It always returned null (the "Heute frei"
// badge was retired at V3-D173 and the urgency-count branch was already dead
// per the 2026-07-08 frontend audit), and SalonCard's `availability` prop is
// gone too, see _design-system/REMOVED.md for the graveyard line.

export default function Nearby({
  prefsOverride,
}: {
  /** Test seam — bypasses the live fetch when provided (dev previews). */
  prefsOverride?: CustomerPrefs | null;
} = {}) {
  const locale = useLocale();
  const fetched = useCustomerPrefs();
  const prefs = prefsOverride !== undefined ? prefsOverride : fetched;
  // V3-D348: bend toward the user's picks — picked-category salons lead, the
  // rest keep their distance order. Logged-out (no prefs) = unchanged.
  const entries = sortByCategoryPicks(DEMO, prefs?.categories ?? []);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  return (
    // V3-D120 (2026-05-24): section bg tint REMOVED per user "remove these
    // color dividing things." Future-state homepage = all-white substrate,
    // teal section-arrow buttons + typography rhythm carry section breaks.
    <Section>
      <SectionFrame>
        <SectionTitle
          title="In der Nähe"
          link={{ label: "Alle in deiner Nähe →", href: `/${locale}/search?nearby=true` }}
          scrollRef={scrollRef}
        />
        {/* V3-D348 (tweak #2): map teaser — gives "In der Nähe" a location-led
            identity distinct from the editorial "Top auf Solen" carousel above.
            The salon cards below are UNCHANGED (name+star / street / time·price).
            Tap → nearby results. */}
        <a
          href={`/${locale}/search?view=map`}
          aria-label="Salons in der Nähe auf der Karte ansehen"
          className="relative mt-1 block h-[120px] overflow-hidden rounded-card border border-s-border bg-s-bg-sunken transition-transform duration-200 ease-glide active:scale-[0.97]"
        >
          <span
            aria-hidden
            className="absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(rgba(10,10,10,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(10,10,10,0.05) 1px, transparent 1px)",
              backgroundSize: "26px 26px",
            }}
          />
          <MapPin className="absolute left-[26%] top-[28%] text-s-ink" size={20} strokeWidth={2.5} fill="currentColor" aria-hidden />
          <MapPin className="absolute left-[56%] top-[42%] text-s-ink" size={22} strokeWidth={2.5} fill="currentColor" aria-hidden />
          <MapPin className="absolute left-[40%] top-[62%] text-s-ink" size={18} strokeWidth={2.5} fill="currentColor" aria-hidden />
          <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-pill bg-white px-3 py-1.5 text-[13px] font-medium text-s-ink shadow-[0_2px_8px_rgba(0,0,0,0.12)]">
            <MapPin size={13} className="text-s-ink" aria-hidden /> 14 Salons in der Nähe Karte öffnen
          </span>
        </a>
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
            isSaved={e.isSaved}
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
