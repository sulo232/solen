"use client";

import * as React from "react";
import { Section, SectionTitle, SectionFrame, ScrollRow } from "./SectionHeader";
import { SalonCard, type SalonCardProps } from "./SalonCard";

/**
 * Recently Viewed — V3 (LIVE_TRUTH §Q51.0 + V2-D34 cards).
 *
 * Conditional section — only renders for returning users with ≥ 1 entry in
 * localStorage. localStorage key: `solen.recently-viewed`. Capped at last 5.
 *
 * Each entry is the minimal SalonCard data needed to render:
 *   { slug, name, rating, photoUrl, category, ...availability }
 *
 * Persistence rules (the `recently-viewed` localStorage write happens at
 * `/salon/[slug]` page mount — Phase 2 work; for now, this section reads
 * what's there OR shows demo data in dev to validate the visual.):
 *   - Push to front on visit
 *   - Dedupe by slug
 *   - Cap at 5 most recent
 *   - Older entries fall off
 *
 * No backend dep — pure client state. Section hides itself when list is empty
 * (returns null pre-mount + post-mount when storage is empty).
 *
 * NOT in this commit:
 *   - Real `/salon/[slug]` route doesn't exist yet (Phase 2)
 *   - "Im Profil ansehen" link target `/profile/recently-viewed` doesn't exist
 *     yet (Phase 3) — link is rendered but routes 404 for now
 */

const STORAGE_KEY = "solen.recently-viewed";

/**
 * Demo data for development — only shows if localStorage is empty AND the
 * env is NOT production. Lets the section render visually during the homepage
 * port without requiring real visit history. Removed once /salon/[slug] writes
 * real entries.
 */
// Inline type so demo entries match RecentEntry exactly (string availabilityRow,
// the only kind that round-trips through localStorage).
// V2-D60-photos: Unsplash imagery; same slug reuses same photo URL across sections.
const DEMO_SALONS: RecentEntry[] = [
  { slug: "atelier-coiffure", name: "Atelier Coiffure", rating: 4.9, category: "coiffeur", availabilityRow: "14:30, 15:00, 16:30",
    photoUrl: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=600&h=450&fit=crop&q=80" },
  { slug: "studio-nord", name: "Studio Nord", rating: 4.7, category: "barbershop", availabilityRow: "In 25 Min frei",
    photoUrl: "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=600&h=450&fit=crop&q=80" },
  { slug: "nail-loft", name: "Nail Loft", rating: 4.8, category: "nails", availabilityRow: "Heute 17:00, 18:30",
    photoUrl: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&h=450&fit=crop&q=80" },
  { slug: "rheinspa", name: "Rhein Spa", rating: 4.95, category: "spa", availabilityRow: "Nächster Termin Mo. 09:00",
    photoUrl: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&h=450&fit=crop&q=80" },
];

interface RecentEntry {
  slug: string;
  name: string;
  rating: number | null;
  category: SalonCardProps["category"];
  photoUrl?: string;
  /** Cached availability string at time of write — refreshed on next salon visit. */
  availabilityRow?: string;
}

// V2-D60-cards-7: extract ONE time from a comma list / phrase per "only one time" rule.
// V2-D60-cards-9: strip "Heute" prefix from today entries (green pill carries that signal).
// "14:30, 15:00, 16:30" → "14:30"  ·  "Heute 17:00, 18:30" → "17:00"
// "Nächster Termin Mo. 09:00" → "Mo. 09:00"  ·  "In 25 Min frei" → kept as-is
function pickOneSlot(row?: string): string {
  if (!row) return "—";
  const r = row.trim();
  // 1. "In N Min frei" → keep as today indicator (no clean number alternative)
  if (/^In\s+\d+\s+Min/i.test(r)) return r;
  // 2. Comma-list of times like "14:30, 15:00, 16:30" → first time only
  const firstTimeMatch = r.match(/(\d{1,2}:\d{2})/);
  if (firstTimeMatch && /^\d/.test(r)) return firstTimeMatch[1];
  // 3. "Heute 17:00, 18:30" → "17:00" (strip Heute)
  if (r.startsWith("Heute") && firstTimeMatch) return firstTimeMatch[1];
  // 4. "Nächster Termin Mo. 09:00" → "Mo. 09:00" (keep day prefix for non-today)
  const dayTimeMatch = r.match(/([A-Z][a-z]{1,3}\.\s+\d{1,2}:\d{2})/);
  if (dayTimeMatch) return dayTimeMatch[1];
  return r;
}

const CAT_PRICE: Record<SalonCardProps["category"], number> = {
  coiffeur: 80, barbershop: 50, nails: 45, spa: 95,
};

// V2-D60-cards-8: addresses for Row 2 meta.
const RV_ADDRESSES = ["Aeschenvorstadt 55", "Klybeckstrasse 12", "Spalenberg 23", "Bahnhofstrasse 14"];
const RV_CITIES    = ["Basel",              "Basel",             "Basel",         "Zürich"];

// V2-D67-fu13 (2026-05-16): added schema-shape filter. Older versions of the
// app wrote `solen.recently-viewed` entries with different fields (e.g. no
// `name` or no `slug`), which crashed SalonCard's `name.trim()` and produced
// duplicate React keys. Drop any entry missing required fields so the section
// degrades gracefully instead of taking down the page.
function isValidEntry(e: unknown): e is RecentEntry {
  if (!e || typeof e !== "object") return false;
  const o = e as Record<string, unknown>;
  return (
    typeof o.slug === "string" && o.slug.length > 0 &&
    typeof o.name === "string" && o.name.trim().length > 0 &&
    typeof o.category === "string" &&
    (o.category === "coiffeur" || o.category === "barbershop" ||
     o.category === "nails" || o.category === "spa")
  );
}

function readStorage(): RecentEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidEntry).slice(0, 5);
  } catch (err) {
    console.error("[RecentlyViewed] localStorage read failed:", err);
    return [];
  }
}

export default function RecentlyViewed() {
  const [entries, setEntries] = React.useState<RecentEntry[] | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setEntries(readStorage());
  }, []);

  // Pre-mount: render nothing (avoids hydration mismatch + avoids flash for
  // first-time visitors who'll never see this section)
  if (entries === null) return null;

  // Post-mount, empty storage: in dev mode only, fall back to demo data so
  // the section renders. Production = hide the section when empty.
  const list: RecentEntry[] =
    entries.length === 0 && process.env.NODE_ENV !== "production"
      ? DEMO_SALONS
      : entries;

  if (list.length === 0) return null;

  return (
    <Section>
      <SectionFrame>
        <SectionTitle
          title="Zuletzt angesehen"
          link={{ label: "Im Profil →", href: "/profile/recently-viewed" }}
          scrollRef={scrollRef}
        />
        <ScrollRow ref={scrollRef}>
          {list.map((s, idx) => (
            <SalonCard
              key={s.slug}
              slug={s.slug}
              name={s.name}
              rating={s.rating}
              category={s.category}
              photoUrl={s.photoUrl}
              variant="availability"
              priceFromCHF={CAT_PRICE[s.category]}
              nextSlotLabel={pickOneSlot(s.availabilityRow)}
              address={RV_ADDRESSES[idx % RV_ADDRESSES.length]}
              city={RV_CITIES[idx % RV_CITIES.length]}
            />
          ))}
        </ScrollRow>
      </SectionFrame>
    </Section>
  );
}
