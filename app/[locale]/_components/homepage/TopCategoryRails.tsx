"use client";

// exists-check (I3, 2026-08-01): ran `npm run exists TopCategoryRails` (0 hits, genuinely new) and
// `npm run exists homepage` (30 existing homepage components, none matching; the dead
// `adminHomepageSectionsSchema`/`/api/homepage-sections` toggle system uses section keys page.tsx
// never reads - legacy from a prior architecture, not touched here). Closest real match is
// CategoryMobileRails.tsx's own `top` calc (average_rating != null, sorted desc, top N - already
// shipping as "Top <Category>" on /de/coiffeur etc.), which getTopSalonIdsByCategory (salonCardData.ts)
// mirrors, computed for all 4 categories in one query. Closest structural precedent for "one
// component, several category-scoped Section rails" is ForYouSalonRows.tsx (its own per-row `useRef`
// pattern is reused here). No new card, no new rail primitive: this file composes the SAME
// Section/SectionFrame/SectionTitle/ScrollRow/SalonCard the homepage's own neighbouring sections
// already use.
// registry-sync-ok: row added in _design-system/COMPONENT_REGISTRY.md (Layout / Section composition)
// and _design-system/components/TopCategoryRails.md written in this same turn.
// reinvent-ok: CATEGORY_ROUTE below is a route-path + display-label lookup for building a homepage
// rail's title/href, not a search-category taxonomy. It is NOT a duplicate of searchCategories.ts's
// CATEGORIES (that array has dead V2 colors, no `route` field, and label "Spa & Wellness"/"Barbershop"
// - different values than what already ships), SearchBar.tsx's SERVICES, or lib/discovery-categories.ts
// (Inspo taxonomy, unrelated). The slug ITERATION ORDER still reuses the canonical
// SALON_CATEGORY_SLUGS (lib/validations.ts) rather than a new array. The route+label values match
// HEADER_CATEGORIES (layout/Header.tsx) and CATEGORY_PILLS (search/SearchTemplate.tsx) byte-for-byte
// but are a small local copy, not a cross-import: Header.tsx is this task's locked no-touch surface,
// and SearchTemplate.tsx is a large "use client" module (pulls in SalonResultCard/MapSalonDetail/
// motion/mapbox at module scope) whose bundle impact this task cannot verify without a build (hard
// constraint: do not run `npm run build`). Full reasoning: components/TopCategoryRails.md.

import * as React from "react";
import { useLocale } from "next-intl";
import { Section, SectionFrame, SectionTitle, ScrollRow } from "./SectionHeader";
import { SalonCard } from "./SalonCard";
import type { SalonCardDataMap } from "./salonCardData";
import type { SalonCardCategory } from "../salon/_shared";
import { SALON_CATEGORY_SLUGS } from "@/lib/validations";
import { nameForLocale, type ServiceNameLocale } from "@/lib/min-price-service";

const CATEGORY_ROUTE: Record<SalonCardCategory, { route: string; label: string }> = {
  coiffeur: { route: "coiffeur", label: "Coiffeur" },
  barbershop: { route: "barbershop", label: "Barber" },
  nails: { route: "nails", label: "Nails" },
  spa: { route: "spa", label: "Spa" },
};

interface CategoryRailSalon {
  id: string;
  slug: string;
  name: string;
  photoUrl: string | null;
  rating: number | null;
  reviewCount: number | null;
  postalCode: string | null;
  city: string | null;
  priceFromCHF: number | null;
  priceFromServiceNames: Record<ServiceNameLocale, string | null> | null;
}

/** One category's "Top X" rail. Self-hides at < 2 salons, same floor CategoryMobileRails.tsx's own
 *  Rail() and CategoryBrowseRails.tsx's Rail() both already use , a lonely single card is not a rail
 *  (also the task's own "do NOT add a section that has no real data" instruction). */
function CategoryRail({
  category,
  salons,
  locale,
}: {
  category: SalonCardCategory;
  salons: CategoryRailSalon[];
  locale: string;
}) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  if (salons.length < 2) return null;

  const { route, label } = CATEGORY_ROUTE[category];
  return (
    <Section>
      <SectionFrame>
        <SectionTitle
          title={`Top ${label}`}
          // Same "Alle {label}-Stores" template ForYouSalonRows.tsx already ships for its own
          // category-scoped rows, not a new string.
          link={{ label: `Alle ${label}-Stores`, href: `/${locale}/${route}` }}
          scrollRef={scrollRef}
        />
        <ScrollRow ref={scrollRef}>
          {salons.map((s) => (
            <SalonCard
              key={s.id}
              slug={s.slug}
              salonId={s.id}
              name={s.name}
              rating={s.rating}
              reviewCount={s.reviewCount}
              category={category}
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

/**
 * Home's four per-category "Top X" rails , I3 (home rails reconciliation, search-a.html
 * RAILS[3..6]: Top hair salons / Top Barbershops / Top nail studios / Top Spas). Real data:
 * getTopSalonIdsByCategory (salonCardData.ts), active salons with a real average_rating, grouped
 * by category, rating desc. A category with < 2 resolvable salons renders no rail at all , never
 * an invented or empty section.
 */
export default function TopCategoryRails({
  salonData = {},
  idsByCategory,
}: {
  salonData?: SalonCardDataMap;
  /** Real per-category top-rated ids, getTopSalonIdsByCategory() (salonCardData.ts). */
  idsByCategory?: Record<SalonCardCategory, string[]>;
} = {}) {
  const locale = useLocale();
  if (!idsByCategory) return null;

  return (
    <>
      {(SALON_CATEGORY_SLUGS as SalonCardCategory[]).map((cat) => {
        const ids = idsByCategory[cat] ?? [];
        const salons: CategoryRailSalon[] = ids
          .map((id) => {
            const real = salonData[id];
            if (!real || !real.name || !real.slug) return null;
            return {
              id,
              slug: real.slug,
              name: real.name,
              photoUrl: real.photoUrl,
              rating: real.rating,
              reviewCount: real.reviewCount,
              postalCode: real.postalCode,
              city: real.city,
              priceFromCHF: real.priceFromCHF,
              priceFromServiceNames: real.priceFromServiceNames,
            };
          })
          .filter((row): row is CategoryRailSalon => row !== null);
        return <CategoryRail key={cat} category={cat} salons={salons} locale={locale} />;
      })}
    </>
  );
}
