"use client";

import * as React from "react";
import { Section, SectionHeader, ScrollRow } from "./SectionHeader";
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
const DEMO_SALONS: RecentEntry[] = [
  { slug: "atelier-coiffure", name: "Atelier Coiffure", rating: 4.9, category: "coiffeur", availabilityRow: "14:30, 15:00, 16:30" },
  { slug: "studio-nord", name: "Studio Nord", rating: 4.7, category: "barbershop", availabilityRow: "In 25 Min frei" },
  { slug: "nail-loft", name: "Nail Loft", rating: 4.8, category: "nails", availabilityRow: "Heute 17:00, 18:30" },
  { slug: "rheinspa", name: "Rhein Spa", rating: 4.95, category: "spa", availabilityRow: "Nächster Termin Mo. 09:00" },
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

function readStorage(): RecentEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(0, 5);
  } catch (err) {
    console.error("[RecentlyViewed] localStorage read failed:", err);
    return [];
  }
}

export default function RecentlyViewed() {
  const [entries, setEntries] = React.useState<RecentEntry[] | null>(null);

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
      <SectionHeader
        eyebrow="Bei dir zuletzt"
        meta={`letzte ${list.length} · localStorage`}
        title="Zuletzt angesehen"
        link={{ label: "Im Profil ansehen →", href: "/profile/recently-viewed" }}
      />

      <ScrollRow>
        {list.map((s) => (
          <SalonCard
            key={s.slug}
            slug={s.slug}
            name={s.name}
            rating={s.rating}
            category={s.category}
            photoUrl={s.photoUrl}
            variant="availability"
            availabilityRow={s.availabilityRow}
          />
        ))}
      </ScrollRow>
    </Section>
  );
}
