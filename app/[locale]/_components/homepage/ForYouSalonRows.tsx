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

const MAX_ROWS = 2; // don't flood the feed — top 2 picks get a row

function ForYouRow({
  category,
  locale,
  wantsDeals,
  wantsTopRated,
}: {
  category: ForYouCategory;
  locale: string;
  wantsDeals: boolean;
  wantsTopRated: boolean;
}) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const salons = [...FORYOU_SALONS[category]];
  if (wantsTopRated) salons.sort((a, b) => b.rating - a.rating);
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
          {salons.map((s, i) => (
            <SalonCard
              key={s.slug}
              slug={s.slug}
              name={s.name}
              rating={s.rating}
              category={s.category}
              photoUrl={s.photoUrl}
              variant="service"
              priceFromCHF={s.priceFromCHF}
              address={s.address}
              city="Zürich"
              // deals interest → one card carries a discount; top_rated → lead card badged.
              discountPercent={wantsDeals && i === 1 ? 20 : null}
              curation={wantsTopRated && i === 0 ? "top-bewertet" : null}
            />
          ))}
        </ScrollRow>
      </SectionFrame>
    </Section>
  );
}

/** Pure view — takes prefs directly so it can be rendered with mock data. */
export function ForYouSalonRowsView({
  prefs,
  locale,
}: {
  prefs: CustomerPrefs | null;
  locale: string;
}) {
  if (!prefs) return null;
  const picks = prefs.categories
    .filter((c): c is ForYouCategory => (FORYOU_CATEGORIES as string[]).includes(c))
    .slice(0, MAX_ROWS);
  if (picks.length === 0) return null;

  const wantsDeals = prefs.interests.includes("deals");
  const wantsTopRated = prefs.interests.includes("top_rated");

  return (
    <>
      {picks.map((cat) => (
        <ForYouRow
          key={cat}
          category={cat}
          locale={locale}
          wantsDeals={wantsDeals}
          wantsTopRated={wantsTopRated}
        />
      ))}
    </>
  );
}

export default function ForYouSalonRows() {
  const prefs = useCustomerPrefs();
  const locale = useLocale();
  return <ForYouSalonRowsView prefs={prefs} locale={locale} />;
}
