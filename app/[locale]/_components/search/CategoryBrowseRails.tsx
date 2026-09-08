"use client";

import * as React from "react";
import { Section, SectionFrame, SectionTitle, ScrollRow } from "../homepage/SectionHeader";
import { SalonCard, type SalonCardProps } from "../homepage/SalonCard";
import { nextAvailableSlotLabel } from "@/lib/format";
import { nameForLocale } from "@/lib/min-price-service";
import { localizedField } from "@/lib/i18n/localized-field";

/**
 * CategoryBrowseRails — V3-D366 (2026-05-29) · re-expanded to 6 rails V3-D368
 * (user: "ok make angebote in der nahe bald frei manner and color").
 *
 * Homepage-style horizontal rails shown ABOVE the full results grid on a
 * category route in browse mode (no query + no active filter). Each rail is a
 * filtered + sorted VIEW of the same `salons` array SearchTemplate already
 * fetched (no extra network). Reuses the homepage `SalonCard` so the cards are
 * identical to the homepage (size + details). The `<Rail>` sub-component
 * self-hides any slice with < 2 salons, so empty rails never render.
 *
 * Rails, in order:
 *   1. Top auf Solen — top-rated of this category
 *   2. Angebote      — last-minute discount > 0
 *   3. In der Naehe   — by distance (falls back to the city-scoped pool when
 *                       no geolocation, since the page is already city-scoped)
 *   4. Bald frei     — soonest free slot
 *   5. Fuer Maenner   — salons offering a men's service
 *   6. Coloration    — salons offering a coloration service
 *
 * Gated behind `BROWSE_RAILS` in SearchTemplate — flip to false to revert to
 * the grid-only category page.
 *
 * DATA NOTE (2026-05-29): on a thin category seed (few salons, discount 0, no
 * geo, sparse slots/services) most rails self-hide by design. They light up as
 * the underlying salons gain discounts / slots / men's + color services.
 */

export type RailSalon = {
  id: string;
  name: string;
  slug: string;
  average_rating: number | null;
  review_count?: number | null;
  cover_photo_url: string | null;
  address?: string;
  city?: string;
  quartier?: string | null;
  avg_price?: number | null;
  // /api/salons has always returned min_price beside avg_price; only the type was
  // missing it, which is why the cards reached for the average. Its service name came
  // with it on 2026-07-27 so a from-price can name the offer it buys (PBV Art. 13).
  min_price?: number | null;
  min_price_service_de?: string | null;
  min_price_service_en?: string | null;
  min_price_service_fr?: string | null;
  min_price_service_it?: string | null;
  distance_meters?: number | null;
  last_minute_discount_percent?: number | null;
  services?: {
    name_de?: string | null;
    name_en?: string | null;
    name_fr?: string | null;
    name_it?: string | null;
    price?: number | null;
    slots?: string[] | null;
  }[];
};

// Per-locale rail titles (inline-record pattern, mirrors Header SEARCH_PLACEHOLDER).
// German umlauts allowed (matches homepage "In der Nähe"); no ß, no em-dash.
// Exported: CategoryMobileRails.tsx (the mobile 3-rail set, owner 2026-08-01) reuses the
// `nearby` / `soon` copy here rather than re-declaring the same locale strings a second time.
export const TITLES = {
  top: { de: "Top auf Solen", en: "Top on Solen", fr: "Top sur Solen", it: "Top su Solen" },
  deals: { de: "Angebote", en: "Deals", fr: "Offres", it: "Offerte" },
  nearby: { de: "In der Nähe", en: "Nearby", fr: "À proximité", it: "Nelle vicinanze" },
  soon: { de: "Bald frei", en: "Available soon", fr: "Bientôt dispo", it: "Presto liberi" },
  men: { de: "Für Männer", en: "For men", fr: "Pour hommes", it: "Per uomo" },
  color: { de: "Coloration", en: "Color", fr: "Coloration", it: "Colore" },
} as const;

export const pick = (rec: Record<string, string>, locale: string) => rec[locale] ?? rec.de;

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// Match localized service names in all four supported languages.
const MEN_RE = /herren|männer|maenner|\bmann\b|\bmen\b|barber|bart|beard|homme|hommes|barbe|barbier|uomo|uomini|barba|barbiere/;
const COLOR_RE = /färb|faerb|farb|colo|couleur|tönung|toenung|strähn|straehn|balayage|highlight|mèche|meche/;

function serviceText(s: RailSalon, locale: string): string {
  return (s.services ?? [])
    .map((sv) => localizedField(sv, "name", locale).toLowerCase())
    .join(" | ");
}

/** One horizontal rail. Renders nothing when the slice has < 2 salons. */
function Rail({
  title,
  salons,
  cat,
  locale,
  citySelected,
}: {
  title: string;
  salons: RailSalon[];
  cat: SalonCardProps["category"];
  locale: string;
  /** CARD_REDESIGN_2026-07-13 (C6/C11): true on a city-scoped route
   *  (`/{city}/{category}`), so Row 3 shows the street address. */
  citySelected: boolean;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  if (salons.length < 2) return null;

  return (
    <Section>
      <SectionFrame>
        <SectionTitle title={title} scrollRef={ref} />
        <ScrollRow ref={ref}>
          {salons.map((s) => (
            <SalonCard
              key={s.id}
              slug={s.slug}
              name={s.name}
              rating={s.average_rating}
              reviewCount={s.review_count}
              category={cat}
              photoUrl={s.cover_photo_url ?? undefined}
              variant="availability"
              // min_price, not avg_price , an average under a "from" label advertises a
              // starting price the customer can never actually get (PBV Art. 13).
              priceFromCHF={s.min_price ?? undefined}
              priceFromService={nameForLocale({ de: s.min_price_service_de ?? null, en: s.min_price_service_en ?? null, fr: s.min_price_service_fr ?? null, it: s.min_price_service_it ?? null }, locale)}
              nextSlotLabel={nextAvailableSlotLabel(s.services, locale) ?? undefined}
              address={s.address}
              city={(s.quartier ? cap(s.quartier) : undefined) || s.city}
              citySelected={citySelected}
            />
          ))}
        </ScrollRow>
      </SectionFrame>
    </Section>
  );
}

export function CategoryBrowseRails({
  salons,
  locale,
  category,
  citySelected = false,
}: {
  salons: RailSalon[];
  locale: string;
  category: string;
  /** CARD_REDESIGN_2026-07-13 (C6/C11): true on a city-scoped route
   *  (`/{city}/{category}`), threaded from SearchTemplate's `activeCity`,
   *  so the cards' Row 3 shows the street address, not postal + city. */
  citySelected?: boolean;
}) {
  const cat = category as SalonCardProps["category"];

  // 1. Top auf Solen — top-rated.
  const top = [...salons]
    .filter((s) => s.average_rating != null)
    .sort((a, b) => (b.average_rating ?? 0) - (a.average_rating ?? 0))
    .slice(0, 10);

  // The whole section is meaningless without at least a populated Top rail.
  if (top.length < 2) return null;

  // 2. Angebote — has a real last-minute discount.
  const deals = [...salons]
    .filter((s) => (s.last_minute_discount_percent ?? 0) > 0)
    .sort((a, b) => (b.last_minute_discount_percent ?? 0) - (a.last_minute_discount_percent ?? 0))
    .slice(0, 10);

  // 3. In der Nähe — by distance when geolocation gave us any; otherwise the
  //    city-scoped pool (the route is already a city/category view).
  const hasDistance = salons.some((s) => s.distance_meters != null);
  const nearby = (
    hasDistance
      ? [...salons]
          .filter((s) => s.distance_meters != null)
          .sort((a, b) => (a.distance_meters ?? 0) - (b.distance_meters ?? 0))
      : [...salons]
  ).slice(0, 10);

  // 4. Bald frei: soonest free slot. Uses the shared nextAvailableSlotLabel
  //    helper's same approach to find the earliest slot per salon for sorting.
  const soon = [...salons]
    .map((s) => {
      const now = Date.now();
      let earliest: number | null = null;
      for (const sv of s.services ?? []) {
        for (const iso of sv.slots ?? []) {
          const ms = new Date(iso).getTime();
          if (!Number.isNaN(ms) && ms > now && (earliest === null || ms < earliest)) {
            earliest = ms;
          }
        }
      }
      return { s, t: earliest };
    })
    .filter((x) => x.t !== null)
    .sort((a, b) => (a.t as number) - (b.t as number))
    .map((x) => x.s)
    .slice(0, 10);

  // 5. Für Männer — offers a men's service.
  const men = salons.filter((s) => MEN_RE.test(serviceText(s, locale))).slice(0, 10);

  // 6. Coloration — offers a coloration service.
  const color = salons.filter((s) => COLOR_RE.test(serviceText(s, locale))).slice(0, 10);

  return (
    <div className="mt-2">
      <Rail title={pick(TITLES.top, locale)} salons={top} cat={cat} locale={locale} citySelected={citySelected} />
      <Rail title={pick(TITLES.deals, locale)} salons={deals} cat={cat} locale={locale} citySelected={citySelected} />
      <Rail title={pick(TITLES.nearby, locale)} salons={nearby} cat={cat} locale={locale} citySelected={citySelected} />
      <Rail title={pick(TITLES.soon, locale)} salons={soon} cat={cat} locale={locale} citySelected={citySelected} />
      <Rail title={pick(TITLES.men, locale)} salons={men} cat={cat} locale={locale} citySelected={citySelected} />
      <Rail title={pick(TITLES.color, locale)} salons={color} cat={cat} locale={locale} citySelected={citySelected} />
    </div>
  );
}
