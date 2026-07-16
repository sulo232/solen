"use client";

import * as React from "react";
import { MapPin } from "lucide-react";
import { useLocale } from "next-intl";
import { Section, SectionTitle, SectionFrame, ScrollRow } from "./SectionHeader";
import { SalonCard, type SalonCardProps } from "./SalonCard";
import { useCustomerPrefs, sortByCategoryPicks, type CustomerPrefs } from "./useCustomerPrefs";
// NEARBY_SALON_IDS is a plain value module (no server-only imports), legal
// to import directly into this "use client" file. salonCardData.ts stays a
// type-only import: it's a Server module (next/headers via createServerSupabaseClient),
// so only its types (erased at compile time) may cross into the client bundle.
import { NEARBY_SALON_IDS } from "./nearbySalonIds";
import type { SalonCardDataMap } from "./salonCardData";

/**
 * In der Nähe - V3 (LIVE_TRUTH §Q51.2 + V2-D34 cards).
 *
 * "use client" (reads prefs after hydration, same seam as ForYouSalonRows).
 * NEARBY_SALON_IDS (nearbySalonIds.ts) is the curated source of truth for
 * WHICH salons show here; name/category/photo/rating/review count/postal
 * code/price all come live from salonData (getSalonCardDataMap, batch-
 * fetched server-side in page.tsx). An id with no matching (or incomplete)
 * salonData entry renders nothing, never an invented card.
 *
 * V3-D348: bends toward the user's onboarding category picks via
 * sortByCategoryPicks, picked-category salons lead, the rest keep list order.
 *
 * Real geo-distance ordering + per-salon next-slot resolution (both dropped
 * with the 2026-07-13 converged card, which has no availability/next-slot
 * row) remain Phase 2 work.
 */

interface NearbyRow {
  /** Real salon UUID, threaded to SalonCard -> HeartButton so the save persists. */
  id: string;
  slug: string;
  name: string;
  category: SalonCardProps["category"];
  photoUrl: string | null;
  rating: number | null;
  reviewCount: number | null;
  postalCode: string | null;
  city: string | null;
  priceFromCHF: number | null;
}

export default function Nearby({
  prefsOverride,
  salonData = {},
  nearbyCount = null,
}: {
  /** Test seam. Bypasses the live fetch when provided (dev previews). */
  prefsOverride?: CustomerPrefs | null;
  /** Real rating/address/price per salon id, batch-fetched server-side in page.tsx. */
  salonData?: SalonCardDataMap;
  /** Real count of active salons with coordinates (getNearbyTeaserCount in
   *  page.tsx), for the map-teaser label. Null/absent renders the count-free
   *  "Karte öffnen" label instead of a fabricated number. */
  nearbyCount?: number | null;
} = {}) {
  const locale = useLocale();
  const fetched = useCustomerPrefs();
  const prefs = prefsOverride !== undefined ? prefsOverride : fetched;
  // NEARBY_SALON_IDS is the curated list; an id with no salonData entry (or
  // missing name/slug/category) is skipped, never rendered with invented
  // values.
  const rows: NearbyRow[] = NEARBY_SALON_IDS.map((id) => {
    const real = salonData[id];
    if (!real || !real.name || !real.slug || !real.category) return null;
    return {
      id,
      slug: real.slug,
      name: real.name,
      category: real.category,
      photoUrl: real.photoUrl,
      rating: real.rating,
      reviewCount: real.reviewCount,
      postalCode: real.postalCode,
      city: real.city,
      priceFromCHF: real.priceFromCHF,
    };
  }).filter((row): row is NearbyRow => row !== null);
  // V3-D348: bend toward the user's picks, picked-category salons lead, the
  // rest keep their list order. Logged-out (no prefs) = unchanged.
  const entries = sortByCategoryPicks(rows, prefs?.categories ?? []);
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
            <MapPin size={13} className="text-s-ink" aria-hidden />
            {nearbyCount != null
              ? `${nearbyCount} Salons in der Nähe`
              : "Karte öffnen"}
          </span>
        </a>
        <ScrollRow ref={scrollRef}>
        {entries.map((e) => (
          <SalonCard
            key={e.id}
            slug={e.slug}
            salonId={e.id}
            name={e.name}
            rating={e.rating}
            reviewCount={e.reviewCount}
            category={e.category}
            photoUrl={e.photoUrl ?? undefined}
            variant="service"
            citySelected={false}
            postalCode={e.postalCode ?? undefined}
            city={e.city ?? undefined}
            priceFromCHF={e.priceFromCHF}
          />
        ))}
        </ScrollRow>
      </SectionFrame>
    </Section>
  );
}
