"use client";

// Grounded-in: app/[locale]/_components/search/SearchTemplate.tsx (aboveSlot prop, line 142;
// CATEGORY_PILLS export, line 318; activeCategory/activeCity derivation, L464-480), lib/cities.ts
// (getCityName, slugFromCity, DEFAULT_CITY_SLUG, ALL_CITIES_PARAM).
//
// exists-check: net-new vs lib/service-templates.ts, lib/search-filter-pills.ts,
// app/[locale]/_components/salon/SalonServices.tsx, components-legacy/salon/ServiceCategoryFilter.tsx
// (all read) , none of them render a heading/anchor; they are service-taxonomy and PDP-services
// files, unrelated to SearchTemplate's results header. `npm run exists search-anchor` returned 0
// hits this turn. This file is the `aboveSlot` content for the one new element in this mockup.
//
// Depicts: search-context label -> NET-NEW: no display anchor exists on SearchTemplate's first
//   viewport today (measured this morning: no text >= 28px there); this component fills that gap
//   using SearchTemplate's own real `aboveSlot` extension point (SearchTemplate.tsx line 142) and
//   its own exported category/city helpers (CATEGORY_PILLS, lib/cities.ts), not new copy or logic.
//
// The VARY element for this mockup: a display anchor for SearchTemplate's `aboveSlot` prop
// (a real first-class extension point, not a byte-copy or DOM edit). Reads the URL exactly the
// way SearchTemplate itself derives activeCategory/activeCity, reusing the SAME exported
// helpers, so the label always matches what the real page underneath it is actually showing
// instead of a second, drifting copy of that logic.

import { useSearchParams } from "next/navigation";
import { CATEGORY_PILLS } from "@/app/[locale]/_components/search/SearchTemplate";
import { getCityName, slugFromCity, DEFAULT_CITY_SLUG, ALL_CITIES_PARAM, type CitySlug } from "@/lib/cities";

export function SearchAnchor({ locale }: { locale: string }) {
  const searchParams = useSearchParams();

  const urlService = searchParams.get("service") ?? searchParams.get("category");
  const categoryLabel = urlService
    ? CATEGORY_PILLS.find((c) => c.slug === urlService.toLowerCase())?.label ?? null
    : null;

  const urlCity = searchParams.get("city");
  const explicitCountrywide = urlCity === ALL_CITIES_PARAM;
  const activeCity: CitySlug | null =
    (urlCity ? slugFromCity(urlCity) : null) ??
    (!explicitCountrywide ? DEFAULT_CITY_SLUG : null);
  const cityName = activeCity ? getCityName(activeCity, locale) : null;

  // "Salons" + "in {city}" both already live as real copy elsewhere on this same template
  // (CATEGORY_PILLS labels, the count row's t("inCity")); "Salons near you" is the exact
  // existing string at messages/en.json:459/717. This composes them, it does not invent new
  // English copy.
  const label =
    categoryLabel && cityName
      ? `${categoryLabel} in ${cityName}`
      : cityName
        ? `Salons in ${cityName}`
        : "Salons near you";

  return (
    // 28px / Inter Tight / 600, per FLOORS LAW 6 (display anchor floor) and this brief's
    // locked value. font-display = Inter Tight (tailwind.config.js line 262).
    <h1 className="font-display text-[28px] font-semibold leading-tight tracking-[-0.01em] text-s-ink">
      {label}
    </h1>
  );
}
