/**
 * Mockup-scope: whole-page
 * Exists-check: `npm run exists mock-radius` -> 0 hits (net-new route). `npm run exists
 * decision-radius` -> the v1 A/B panel mockup (app/[locale]/dev/decision-radius/page.tsx,
 * kept on disk untouched, superseded by this route per the owner's 2026-07-13 rewrite).
 * `npm run exists SearchTemplate/SalonResultCard` -> both real
 * (app/[locale]/_components/search/SearchTemplate.tsx; SalonResultCard.tsx, every card
 * variant's photo wrapper already ships `rounded-[22px]`). Net-new: this whole-page route.
 * No dev route renders the FULL real search results page (filters, hero, result grid) for
 * this decision today, v1 rendered 2 isolated cards side by side.
 *
 * Decision: result-card photo radius, 18px vs. 22px. NOTE (surfaced, not silently fixed,
 * same finding v1 made): every SalonResultCard variant (feed/card/list) already ships
 * `rounded-[22px]` today, no live 18px instance exists on this card; this route still
 * renders the requested A=18 / B=22 comparison, a valid decision either way.
 *
 * Composed exactly as app/[locale]/[city]/[category]/page.tsx does: SearchTemplate with a
 * pinned city + category (hardcoded to Basel/Coiffeur here since this mock route carries
 * no [city]/[category] path params), real live salons via SearchTemplate's own
 * /api/salons fetch. SalonResultCard.tsx is NOT edited: the radius override is a scoped
 * <style> attribute-selector on a wrapper class, matched on the card's OWN
 * `rounded-[22px]` class substring (stable across every variant SearchTemplate renders,
 * feed on mobile + card on desktop are both in the DOM at once, gated by Tailwind
 * responsive classes), not a structural nth-child guess.
 */
import { notFound } from "next/navigation";
import SearchTemplate from "@/app/[locale]/_components/search/SearchTemplate";
import { getActiveCityBySlug, getCityName, DEFAULT_CITY_SLUG } from "@/lib/cities";
import { getFilterAvailability } from "@/lib/search/filter-availability";
import { VariantSwitcher } from "../_shared/VariantSwitcher";

export default async function MockRadiusPage({
  searchParams,
}: {
  searchParams: Promise<{ v?: string }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();
  const { v } = await searchParams;
  const variant = v === "22" ? "22" : "18";

  const cityRow = await getActiveCityBySlug(DEFAULT_CITY_SLUG);
  if (!cityRow) notFound();
  const cityName = getCityName(DEFAULT_CITY_SLUG, "de", cityRow);
  const categoryName = "Coiffeur";
  const filterAvailability = await getFilterAvailability();

  return (
    <div className={variant === "22" ? "mock-radius-22" : "mock-radius-18"}>
      <style>{`
        .mock-radius-18 div[class*="rounded-[22px]"] { border-radius: 18px !important; }
        .mock-radius-22 div[class*="rounded-[22px]"] { border-radius: 22px !important; }
      `}</style>
      <SearchTemplate
        locale="de"
        serviceFilter="coiffeur"
        cityFilter={DEFAULT_CITY_SLUG}
        filterAvailability={filterAvailability}
        breadcrumb={[
          { label: "Solen", href: "/de" },
          { label: cityName, href: `/de/${DEFAULT_CITY_SLUG}` },
          { label: categoryName },
        ]}
        hero={{
          title: `${categoryName} in ${cityName}`,
          subtitle: `Discover the best ${categoryName} in ${cityName}. Compare reviews, prices and availability.`,
        }}
      />
      <VariantSwitcher
        options={[
          { value: "18", label: "18px" },
          { value: "22", label: "22px" },
        ]}
      />
    </div>
  );
}
