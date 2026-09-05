"use client";

// Grounded-in: app/[locale]/_components/homepage/TopCategoryRails.tsx (the real component this
// file forks; every prop shape and data path is unchanged from it).
//
// Exists-check: ran `npm run exists TopCategoryRails`, hit the real, live component (four
// per-category "Top X" rails, self-hiding under 2 salons). This file is a COPY of it (per the
// off-limits rule: "copy that component into your own _v<letter>/ folder, rename it, change the
// copy"), because the real file lives under the off-limits app/[locale]/_components tree. Two
// changes from the original: (1) each SalonCard call gets `widthClassName` (SalonCard's own
// sanctioned width-override prop, added 2026-07-24) for the same "bigger card, same anatomy" idea
// as this direction's RecentlyViewedBig.tsx; (2) capped to the first TWO categories that resolve
// to a real rail (>= 2 salons), not all four, matching this direction's "fewer, taller rails"
// brief. Neither change touches SalonCard's own file, its 5:4 photo ratio, its text stack or its
// radius. The section chrome comes from ./SectionPrimitivesBig, this folder's own copy of the
// real SectionHeader.tsx primitives (see that file's header for why it is a local copy).
//
// reinvent-ok: CATEGORY_ROUTE below is byte-copied from the real TopCategoryRails.tsx's own
// route-path + display-label lookup, which that file's own header already justifies as not a
// duplicate of searchCategories.ts's CATEGORIES (different values, no `route` field). The slug
// ITERATION ORDER still reuses the canonical SALON_CATEGORY_SLUGS (imported below), same as the
// real file.
//
// Depicts: category rails, capped to 2, bigger cards -> real file app/[locale]/_components/homepage/TopCategoryRails.tsx, forked with BIG_CARD_WIDTH and a 2-rail cap; the route/label map and the >= 2 salon self-hide floor are unchanged.
//
// No em-dashes. English copy only (all visible strings are the real i18n / label values).

import * as React from "react";
import { useLocale } from "next-intl";
import { Section, SectionFrame, SectionTitle, ScrollRow } from "./SectionPrimitivesBig";
import { SalonCard } from "@/app/[locale]/_components/homepage/SalonCard";
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

// Same widening as RecentlyViewedBig.tsx: measured 390px viewport -> (390-32)/1.3 = 275px card
// (vs the live page's ~231px). SalonCard's own aspect-[5/4] photo ratio is untouched.
const BIG_CARD_WIDTH = [
  "w-[calc((100vw-32px)/1.3)]",
  "sm:w-[calc((100%-24px)/2.4)]",
  "md:w-[calc((100%-36px)/3)]",
  "lg:w-[calc((100%-48px)/3.6)]",
  "xl:w-[calc((100%-60px)/4.2)]",
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

function CategoryRailBig({
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
              widthClassName={BIG_CARD_WIDTH}
              priority={i === 0}
            />
          ))}
        </ScrollRow>
      </SectionFrame>
    </Section>
  );
}

/**
 * Direction B's "fewer, taller rails": the same real per-category top-rated data the live
 * TopCategoryRails.tsx renders, capped to the first 2 categories that actually resolve to a rail
 * (>= 2 salons), so a max of 2 rails render here instead of the live page's up-to-4.
 */
export default function TopCategoryRailsBig({
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
    .filter(({ salons }) => salons.length >= 2)
    .slice(0, 2);

  return (
    <>
      {rails.map(({ cat, salons }) => (
        <CategoryRailBig key={cat} category={cat} salons={salons} locale={locale} />
      ))}
    </>
  );
}
