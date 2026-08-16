"use client";

// exists-check (I3, 2026-08-01): ran `npm run exists AvailableThisWeek` (1 hit, the data function this
// file itself calls, no UI component) and `npm run exists homepage` (30 existing homepage components,
// none named this; the dead `adminHomepageSectionsSchema`/`/api/homepage-sections` toggle system uses
// section keys page.tsx never reads - legacy from a prior architecture, not touched here). Closest real
// match is CategoryMobileRails.tsx's own 7-day-bounded "soon" rail (already shipping on /de/coiffeur
// etc.), which this file's data source (getAvailableThisWeekSalonIds, salonCardData.ts) mirrors: same
// `salons_with_slot_in_hours` RPC, same 7-day bound, just scoped across every category instead of one
// route, and merged into the homepage's own single-batch salonCardData fetch instead of a second
// `/api/salons?with_slots=1` round trip. No new card, no new rail primitive: this file composes the
// SAME Section/SectionFrame/SectionTitle/ScrollRow/SalonCard the homepage's own neighbouring sections
// (RecentlyViewed.tsx, Nearby.tsx) already use.
// registry-sync-ok: row added in _design-system/COMPONENT_REGISTRY.md (Layout / Section composition)
// and _design-system/components/AvailableThisWeek.md written in this same turn.

import * as React from "react";
import { useLocale } from "next-intl";
import { Section, SectionFrame, SectionTitle, ScrollRow } from "./SectionHeader";
import { SalonCard, type SalonCardProps } from "./SalonCard";
// TITLES.soon / pick reuse (rule 12, don't re-declare): CategoryMobileRails.tsx already titles its
// own real 7-day-bounded rail with this exact key ("Bald frei" / "Available soon"), not a new
// "Available this week" string - reused verbatim rather than adding new copy (hard constraint,
// this task: "No German added beyond existing i18n keys").
import { TITLES, pick } from "../search/CategoryBrowseRails";
import type { SalonCardDataMap } from "./salonCardData";
import { nameForLocale, type ServiceNameLocale } from "@/lib/min-price-service";

interface AvailableRow {
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
  priceFromServiceNames: Record<ServiceNameLocale, string | null> | null;
}

/**
 * Available this week , I3 (home rails reconciliation, search-a.html RAILS[2]).
 * Real 7-day slot availability (getAvailableThisWeekSalonIds, salonCardData.ts), NOT the
 * mockup's own fallback (`s.online` ordering with an honest "no live slot data" sub-state note) ,
 * this project already wired real per-slot availability for CategoryMobileRails.tsx, so the home
 * rail reuses that real signal instead of the mockup's weaker placeholder.
 *
 * `salonIds` order is rating-desc (set server-side). An id with no matching (or incomplete)
 * salonData entry is skipped, never shown with an invented name/photo (same contract as every
 * other homepage rail). Self-hides at < 2 salons, same floor CategoryMobileRails.tsx's own Rail()
 * and CategoryBrowseRails.tsx's Rail() both already use , a lonely single card is not a rail.
 */
export default function AvailableThisWeek({
  salonData = {},
  salonIds = [],
}: {
  salonData?: SalonCardDataMap;
  /** Real ids, getAvailableThisWeekSalonIds() (salonCardData.ts), server-fetched in page.tsx. */
  salonIds?: string[];
} = {}) {
  const locale = useLocale();
  const rows: AvailableRow[] = salonIds
    .map((id) => {
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
        priceFromServiceNames: real.priceFromServiceNames,
      };
    })
    .filter((row): row is AvailableRow => row !== null);

  if (rows.length < 2) return null;

  return (
    <Section>
      <SectionFrame>
        <SectionTitle title={pick(TITLES.soon, locale)} />
        <ScrollRow>
          {rows.map((s) => (
            <SalonCard
              key={s.id}
              slug={s.slug}
              salonId={s.id}
              name={s.name}
              rating={s.rating}
              reviewCount={s.reviewCount}
              category={s.category}
              photoUrl={s.photoUrl ?? undefined}
              variant="availability"
              priceFromCHF={s.priceFromCHF}
              priceFromService={nameForLocale(s.priceFromServiceNames, locale)}
              postalCode={s.postalCode ?? undefined}
              city={s.city ?? undefined}
            />
          ))}
        </ScrollRow>
      </SectionFrame>
    </Section>
  );
}
