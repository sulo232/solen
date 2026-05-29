"use client";

import * as React from "react";
import { Section, SectionFrame, SectionTitle, ScrollRow } from "../homepage/SectionHeader";
import { SalonCard, type SalonCardProps } from "../homepage/SalonCard";

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
  cover_photo_url: string | null;
  address?: string;
  city?: string;
  quartier?: string | null;
  avg_price?: number | null;
  distance_meters?: number | null;
  last_minute_discount_percent?: number | null;
  services?: {
    name_de?: string | null;
    name_en?: string | null;
    price?: number | null;
    slots?: string[] | null;
  }[];
};

// Per-locale rail titles (inline-record pattern, mirrors Header SEARCH_PLACEHOLDER).
// German umlauts allowed (matches homepage "In der Nähe"); no ß, no em-dash.
const TITLES = {
  top: { de: "Top auf Solen", en: "Top on Solen", fr: "Top sur Solen", it: "Top su Solen" },
  deals: { de: "Angebote", en: "Deals", fr: "Offres", it: "Offerte" },
  nearby: { de: "In der Nähe", en: "Nearby", fr: "À proximité", it: "Nelle vicinanze" },
  soon: { de: "Bald frei", en: "Available soon", fr: "Bientôt dispo", it: "Presto liberi" },
  men: { de: "Für Männer", en: "For men", fr: "Pour hommes", it: "Per uomo" },
  color: { de: "Coloration", en: "Color", fr: "Coloration", it: "Colore" },
} as const;

const pick = (rec: Record<string, string>, locale: string) => rec[locale] ?? rec.de;

const WD = ["So.", "Mo.", "Di.", "Mi.", "Do.", "Fr.", "Sa."]; // short DE weekdays
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// Service-name matchers (lowercased, locale-agnostic substrings).
const MEN_RE = /herren|männer|maenner|\bmann\b|\bmen\b|barber|bart|beard/;
const COLOR_RE = /färb|faerb|farb|colo|tönung|toenung|strähn|straehn|balayage|highlight|mèche|meche/;

function serviceText(s: RailSalon): string {
  return (s.services ?? [])
    .map((sv) => (sv.name_de ?? sv.name_en ?? "").toLowerCase())
    .join(" | ");
}

function earliestSlot(s: RailSalon): Date | null {
  const now = Date.now();
  let min: Date | null = null;
  for (const sv of s.services ?? []) {
    for (const iso of sv.slots ?? []) {
      const t = new Date(iso);
      if (!Number.isNaN(t.getTime()) && t.getTime() >= now && (!min || t < min)) min = t;
    }
  }
  return min;
}

function slotLabel(d: Date | null): string | undefined {
  if (!d) return undefined;
  const hhmm = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  const isToday = d.toDateString() === new Date().toDateString();
  return isToday ? hhmm : `${WD[d.getDay()]} ${hhmm}`;
}

/** One horizontal rail. Renders nothing when the slice has < 2 salons. */
function Rail({
  title,
  salons,
  cat,
}: {
  title: string;
  salons: RailSalon[];
  cat: SalonCardProps["category"];
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
              category={cat}
              photoUrl={s.cover_photo_url ?? undefined}
              variant="availability"
              priceFromCHF={s.avg_price ?? undefined}
              nextSlotLabel={slotLabel(earliestSlot(s))}
              address={s.address}
              city={(s.quartier ? cap(s.quartier) : undefined) || s.city}
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
}: {
  salons: RailSalon[];
  locale: string;
  category: string;
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

  // 4. Bald frei — soonest free slot.
  const soon = [...salons]
    .map((s) => ({ s, t: earliestSlot(s) }))
    .filter((x) => x.t != null)
    .sort((a, b) => (a.t as Date).getTime() - (b.t as Date).getTime())
    .map((x) => x.s)
    .slice(0, 10);

  // 5. Für Männer — offers a men's service.
  const men = salons.filter((s) => MEN_RE.test(serviceText(s))).slice(0, 10);

  // 6. Coloration — offers a coloration service.
  const color = salons.filter((s) => COLOR_RE.test(serviceText(s))).slice(0, 10);

  return (
    <div className="mt-2">
      <Rail title={pick(TITLES.top, locale)} salons={top} cat={cat} />
      <Rail title={pick(TITLES.deals, locale)} salons={deals} cat={cat} />
      <Rail title={pick(TITLES.nearby, locale)} salons={nearby} cat={cat} />
      <Rail title={pick(TITLES.soon, locale)} salons={soon} cat={cat} />
      <Rail title={pick(TITLES.men, locale)} salons={men} cat={cat} />
      <Rail title={pick(TITLES.color, locale)} salons={color} cat={cat} />
    </div>
  );
}
