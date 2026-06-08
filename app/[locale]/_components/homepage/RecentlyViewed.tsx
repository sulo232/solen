"use client";

import * as React from "react";
import { Section, SectionTitle, SectionFrame, ScrollRow } from "./SectionHeader";
import { SalonCard, type SalonCardProps } from "./SalonCard";
import { useCustomerPrefs, sortByCategoryPicks, type CustomerPrefs } from "./useCustomerPrefs";

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
// 2026-06-05: the "Top auf Solen" fallback now points at REAL seeded salons
// (Basel) so every card resolves to a live PDP instead of a 404. Curated
// availability/photo styling kept; identity (id+slug+name) is real. The real
// localStorage "recently viewed" path may omit `id` (older writes) — those
// cards just keep a local-only heart, which is fine.
const DEMO_SALONS: RecentEntry[] = [
  { id: "0ed041f9-149b-4241-a09e-d41351be7097", slug: "muse-beauty-studio", name: "Muse Beauty Studio", rating: 4.93, category: "coiffeur", availabilityRow: "14:30, 15:00, 16:30",
    photoUrl: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=600&h=450&fit=crop&q=80" },
  // V3-D128 (2026-05-24): "In 25 Min frei" → "Heute 16:00" per user — Solen books by TIME.
  { id: "599bb853-c713-4dae-a3c4-96c6216139c4", slug: "old-town-barbers", name: "Old Town Barbers", rating: 4.91, category: "barbershop", availabilityRow: "Heute 16:00",
    photoUrl: "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=600&h=450&fit=crop&q=80" },
  { id: "ca037638-362a-491b-ada2-238e20d9d4a9", slug: "nail-studio-bliss", name: "Nail Studio Bliss", rating: 4.95, category: "nails", availabilityRow: "Heute 17:00, 18:30",
    photoUrl: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&h=450&fit=crop&q=80" },
  { id: "40c96be2-198c-471e-82d8-3ada6f7de0de", slug: "smooth-skin-studio", name: "Smooth Skin Studio", rating: 4.90, category: "spa", availabilityRow: "Nächster Termin Mo. 09:00",
    photoUrl: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&h=450&fit=crop&q=80" },
];

interface RecentEntry {
  /** Real salon UUID — threaded to SalonCard → HeartButton so the save persists.
   *  Optional: older localStorage entries predate this field (heart stays local). */
  id?: string;
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

export default function RecentlyViewed({
  prefsOverride,
}: {
  /** Test seam — bypasses the live fetch when provided (dev previews). */
  prefsOverride?: CustomerPrefs | null;
} = {}) {
  const fetched = useCustomerPrefs();
  const prefs = prefsOverride !== undefined ? prefsOverride : fetched;
  const [entries, setEntries] = React.useState<RecentEntry[] | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setEntries(readStorage());
  }, []);

  // V3-D106 (2026-05-23): pre-mount renders the FALLBACK so first-time
  // visitors always see something (per user "if not put same as in der
  // nahe but [renamed] cz how will we acc like yk find"). Title flips
  // to "Top auf Solen" with curated top-rated salons.
  // Pre-mount: render fallback (no flash, no hydration mismatch)
  const hasHistory = entries !== null && entries.length > 0;
  // V3-D348: bend the curated "Top auf Solen" fallback toward the user's picks.
  // Real view history stays chronological (it's "recently viewed", not "for you").
  const list: RecentEntry[] = hasHistory
    ? entries
    : sortByCategoryPicks(DEMO_SALONS, prefs?.categories ?? []);
  const title = hasHistory ? "Zuletzt angesehen" : "Top auf Solen";
  const linkLabel = hasHistory ? "Im Profil →" : "Alle entdecken →";
  const linkHref = hasHistory ? "/profile/recently-viewed" : "/search?sort=top-rated";

  return (
    // V3-D112 (2026-05-23): bg-s-peach REMOVED per user "remove ths color like
    // cream everywhere" — selected the peach RecentlyViewed section. Reverted
    // to default white substrate. Token `s-peach` kept in tailwind for back-
    // compat / future use; only the usage on this section is removed.
    // Prior V3-D107: bg-s-peach was the warm welcome at top of feed.
    <Section>
      <SectionFrame>
        <SectionTitle
          title={title}
          link={{ label: linkLabel, href: linkHref }}
          scrollRef={scrollRef}
        />
        <ScrollRow ref={scrollRef}>
          {list.map((s, idx) => (
            <SalonCard
              key={s.slug}
              slug={s.slug}
              salonId={s.id}
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
