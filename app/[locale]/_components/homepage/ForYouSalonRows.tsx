"use client";

// ForYouSalonRows (V3-D348) — the payoff of homepage curation. For each category
// the user picked during onboarding, render a "Weil du <X> magst" row of salon
// cards. Client-side (reads prefs after hydration) so the homepage stays static.
//
// Interest signals shape the row:
//   - "top_rated" → sort by rating desc + a "Top bewertet" badge on the lead card
//   - "deals"     → a −% discount badge on one card (urgency/deal surface)
//
// Renders nothing for logged-out / no-picks users → homepage is unchanged for them.

import * as React from "react";
import { useLocale } from "next-intl";
import { Section, SectionFrame, SectionTitle, ScrollRow } from "./SectionHeader";
import { SalonCard } from "./SalonCard";
import { useCustomerPrefs, type CustomerPrefs } from "./useCustomerPrefs";
import { FORYOU_SALONS, FORYOU_LABEL, FORYOU_CATEGORIES, type ForYouCategory } from "./forYouSalons";
// 2026-07-13: real rating/address/price data, batch-fetched server-side in
// page.tsx (type-only import, the Supabase fetch code never reaches this
// client bundle).
import type { SalonCardDataMap } from "./salonCardData";

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
  // Sort by the REAL fetched rating when known (falls back to the demo rating
  // only as a defensive tiebreak, e.g. if the fetch failed for that salon) so
  // the "Top bewertet" badge below lands on the actually-top-rated card.
  if (wantsTopRated) {
    salons.sort(
      (a, b) => (salonData[b.id]?.rating ?? b.rating) - (salonData[a.id]?.rating ?? a.rating),
    );
  }
  if (salons.length === 0) return null;

  const label = FORYOU_LABEL[category];
  return (
    <Section>
      <SectionFrame>
        <SectionTitle
          title={`Weil du ${label} magst`}
          link={{ label: `Alle ${label}-Salons`, href: `/${locale}/${category}` }}
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
                photoUrl={s.photoUrl}
                variant="service"
                citySelected={false}
                postalCode={real?.postalCode ?? undefined}
                city={real?.city ?? undefined}
                priceFromCHF={real?.priceFromCHF ?? null}
                curation={wantsTopRated && i === 0 ? "top-bewertet" : null}
              />
            );
          })}
        </ScrollRow>
      </SectionFrame>
    </Section>
  );
}

/** Pure view, takes prefs directly so it can be rendered with mock data. */
export function ForYouSalonRowsView({
  prefs,
  locale,
  salonData = {},
}: {
  prefs: CustomerPrefs | null;
  locale: string;
  /** Real rating/address/price per salon id, batch-fetched in page.tsx. Defaults
   *  to empty so existing callers (that predate this wiring) still compile. */
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
  /** Real rating/address/price per salon id, batch-fetched server-side in page.tsx. */
  salonData?: SalonCardDataMap;
} = {}) {
  const prefs = useCustomerPrefs();
  const locale = useLocale();
  return <ForYouSalonRowsView prefs={prefs} locale={locale} salonData={salonData} />;
}
