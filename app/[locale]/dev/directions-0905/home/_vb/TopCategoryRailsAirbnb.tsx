"use client";

// Grounded-in: app/[locale]/_components/homepage/TopCategoryRails.tsx (the real component this
// file forks; every prop shape and data path is unchanged from it).
//
// Exists-check: ran `npm run exists TopCategoryRails`, hit the real, live component (four
// per-category "Top X" rails, self-hiding under 2 salons). This file is a COPY of it (off-limits
// rule: fork into _v<letter>/ when the anatomy must change), for the same LOOK-FULL reason as
// RecentlyViewedAirbnb.tsx: it needs SalonCardAirbnb instead of the real SalonCard. Unlike the
// PREVIOUS pass at this direction (which capped this to 2 rails as a "fewer, bigger" density
// strategy), this fork keeps ALL FOUR real category rails, matching the live page's own
// composition: this round's brief is a LOOK axis only ("2.2 cards visible PER rail"), not a rail
// count reduction, and the density floor (>= 4 home sections) argues for keeping every rail that
// resolves real data rather than trimming it. The route/label map and the >= 2 salon self-hide
// floor are unchanged from the real file.
//
// Direction: home ?v=b, Airbnb look at FULL STRENGTH (LOCK MODE: LOOK-FULL).
//
// Sources + values taken: same as RecentlyViewedAirbnb.tsx, see that file's header for the full
// arithmetic: airbnb--home-mobile.md's measured "~2.2 cards visible across 390" solved against
// Solen's own existing 12px gutter/gap tokens.
//
// Conflicts: same lock broken as RecentlyViewedAirbnb.tsx (card-count-per-viewport), see that
// file's header. SalonCardAirbnb.tsx carries the four card-anatomy conflicts (ratio/radius/
// shadow/ink), not duplicated here.
//
// No em-dashes. English copy only (all visible strings are the real i18n / label values).

import * as React from "react";
import { useLocale } from "next-intl";
import { Section, SectionFrame, SectionTitle, ScrollRow } from "./SectionPrimitivesAirbnb";
import { SalonCardAirbnb } from "./SalonCardAirbnb";
import type { SalonCardDataMap } from "@/app/[locale]/_components/homepage/salonCardData";
import type { SalonCardCategory } from "@/app/[locale]/_components/salon/_shared";
import { SALON_CATEGORY_SLUGS } from "@/lib/validations";
import { nameForLocale, type ServiceNameLocale } from "@/lib/min-price-service";

const CATEGORY_ROUTE: Record<SalonCardCategory, { route: string; label: string }> = {
  coiffeur: { route: "coiffeur", label: "Coiffeur" },
  barbershop: { route: "barbershop", label: "Barber" },
  nails: { route: "nails", label: "Nails" },
  spa: { route: "spa", label: "Spa" },
};

// measured: same arithmetic as RecentlyViewedAirbnb.tsx's AIRBNB_CARD_WIDTH, see that file's
// header for the derivation (airbnb--home-mobile.md's ~2.2 cards visible across 390).
const AIRBNB_CARD_WIDTH = [
  "w-[calc((100vw-36px)/2.2)]",
  "sm:w-[calc((100%-24px)/4.4)]",
  "md:w-[calc((100%-36px)/5.9)]",
  "lg:w-[calc((100%-48px)/7.3)]",
  "xl:w-[calc((100%-60px)/8.8)]",
].join(" ");

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

function CategoryRailAirbnb({
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
          link={{ label: `All ${label} salons`, href: `/${locale}/${route}` }}
          scrollRef={scrollRef}
        />
        <ScrollRow ref={scrollRef}>
          {salons.map((s, i) => (
            <SalonCardAirbnb
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
              widthClassName={AIRBNB_CARD_WIDTH}
              priority={i === 0}
            />
          ))}
        </ScrollRow>
      </SectionFrame>
    </Section>
  );
}

/**
 * Direction B: the same real per-category top-rated data the live TopCategoryRails.tsx renders,
 * ALL resolving categories (no cap), each rail restyled through SalonCardAirbnb.
 */
export default function TopCategoryRailsAirbnb({
  salonData = {},
  idsByCategory,
}: {
  salonData?: SalonCardDataMap;
  idsByCategory?: Record<SalonCardCategory, string[]>;
} = {}) {
  const locale = useLocale();
  if (!idsByCategory) return null;

  const rails = (SALON_CATEGORY_SLUGS as SalonCardCategory[])
    .map((cat) => {
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
      return { cat, salons };
    })
    .filter(({ salons }) => salons.length >= 2);

  return (
    <>
      {rails.map(({ cat, salons }) => (
        <CategoryRailAirbnb key={cat} category={cat} salons={salons} locale={locale} />
      ))}
    </>
  );
}
