"use client";

// ForYouSalonRows (V3-D348) - the payoff of homepage curation. For each category
// the user picked during onboarding, render a "Weil du <X> magst" row of salon
// cards. Client-side (reads prefs after hydration) so the homepage stays static.
// Every card field beyond identity (id/slug/name/category) comes live from
// salonData (getSalonCardDataMap in page.tsx) - a salon missing from that map
// renders with those fields simply omitted, never an invented fallback.
//
// Interest signal "top_rated" sorts by the REAL fetched rating desc (missing
// rating sorts last) and adds a "Top bewertet" badge on the lead card.
//
// Renders nothing for logged-out / no-picks users, homepage is unchanged for them.

import * as React from "react";
import { useLocale } from "next-intl";
import { Section, SectionFrame, SectionTitle, ScrollRow } from "./SectionHeader";
import { SalonCard } from "./SalonCard";
import { useCustomerPrefs, type CustomerPrefs } from "./useCustomerPrefs";
import { FORYOU_SALONS, FORYOU_LABEL, FORYOU_CATEGORIES, type ForYouCategory } from "./forYouSalons";
// 2026-07-13: real rating/review-count data, batch-fetched server-side in
// page.tsx (type-only import, the Supabase fetch code never reaches this
// client bundle).
import type { SalonCardDataMap } from "./salonCardData";
import { nameForLocale, type ServiceNameLocale } from "@/lib/min-price-service";

const MAX_ROWS = 2; // don't flood the feed — top 2 picks get a "Weil du X magst" row

function ForYouRow({
  category,
  locale,
  wantsTopRated,
  salonData,
}: {
  category: ForYouCategory;
  locale: string;
  wantsTopRated: boolean;
  salonData: SalonCardDataMap;
}) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const salons = [...FORYOU_SALONS[category]];
  // Sort by the REAL fetched rating only, missing rating sorts last, so the
  // "Top bewertet" badge below always lands on the actually-top-rated card
  // (never an invented tiebreak value).
  if (wantsTopRated) {
    salons.sort((a, b) => {
      const ra = salonData[a.id]?.rating;
      const rb = salonData[b.id]?.rating;
      if (ra == null && rb == null) return 0;
      if (ra == null) return 1;
      if (rb == null) return -1;
      return rb - ra;
    });
  }
  if (salons.length === 0) return null;

  const label = FORYOU_LABEL[category];
  return (
    <Section>
      <SectionFrame>
        <SectionTitle
          title={`Weil Sie ${label} mögen`}
          link={{ label: `Alle ${label}-Stores`, href: `/${locale}/${category}` }}
          scrollRef={scrollRef}
        />
        <ScrollRow ref={scrollRef}>
          {salons.map((s, i) => {
            const real = salonData[s.id];
            return (
              <SalonCard
                key={s.slug}
                slug={s.slug}
                salonId={s.id}
                name={s.name}
                rating={real?.rating ?? null}
                reviewCount={real?.reviewCount ?? null}
                category={s.category}
                photoUrl={real?.photoUrl ?? undefined}
                variant="service"
                priceFromCHF={real?.priceFromCHF ?? null}
                priceFromService={nameForLocale(real?.priceFromServiceNames, locale)}
                citySelected={false}
                postalCode={real?.postalCode ?? undefined}
                city={real?.city ?? undefined}
                curation={wantsTopRated && i === 0 ? "top-bewertet" : null}
              />
            );
          })}
        </ScrollRow>
      </SectionFrame>
    </Section>
  );
}

/** Pure view. Takes prefs directly so it can be rendered with mock data. */
export function ForYouSalonRowsView({
  prefs,
  locale,
  salonData = {},
}: {
  prefs: CustomerPrefs | null;
  locale: string;
  /** Real rating/review-count per salon id, batch-fetched server-side in
   *  page.tsx. Defaults to empty so existing callers still compile. */
  salonData?: SalonCardDataMap;
}) {
  if (!prefs) return null;
  const picks = prefs.categories
    .filter((c): c is ForYouCategory => (FORYOU_CATEGORIES as string[]).includes(c))
    .slice(0, MAX_ROWS);
  if (picks.length === 0) return null;

  const wantsTopRated = prefs.interests.includes("top_rated");

  return (
    <>
      {picks.map((cat) => (
        <ForYouRow
          key={cat}
          category={cat}
          locale={locale}
          wantsTopRated={wantsTopRated}
          salonData={salonData}
        />
      ))}
    </>
  );
}

export default function ForYouSalonRows({
  salonData,
}: {
  /** Real rating/review-count per salon id, batch-fetched server-side in page.tsx. */
  salonData?: SalonCardDataMap;
} = {}) {
  const prefs = useCustomerPrefs();
  const locale = useLocale();
  return <ForYouSalonRowsView prefs={prefs} locale={locale} salonData={salonData} />;
}
