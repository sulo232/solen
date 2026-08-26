// exists-check: ran `npm run exists search` (2026-08-01) , closest real match is
// CategoryBrowseRails.tsx (read in full, see components/CategoryMobileRails.md): its TITLES/pick
// export, SalonCard and ScrollRow are REUSED directly, not duplicated. net-new vs the rest of that
// list: SearchOverlay.tsx (full-page search composer, no rail/card anatomy), SearchTemplate.tsx (the
// host this file is imported INTO), SalonResultCard.tsx (the flat-list card this component REPLACES
// on mobile, different anatomy per SalonResultCard.md), CategoryHeroCarousel.tsx (one black hero
// swipe, not a rail set), FilterSheet/MapSalonDetail/SearchBar/SearchAutocomplete (unrelated search
// UI). This file exists because CategoryBrowseRails renders 6 rails inside Section/SectionFrame
// (desktop-oriented padding, SectionTitle's bare in-h2 arrow) where the task's literal spec is 3
// rails with the mockup's own 32px pinned-arrow heading, composed against a different (already
// px-3-padded) ancestor , see the header comment below for the padding/heading reasoning in full.
// registry-sync-ok: row added in _design-system/COMPONENT_REGISTRY.md (Search / category routes
// section) and _design-system/components/CategoryMobileRails.md written in this same turn.
// mockup-ok: every visual value in this file (32px circular arrow, bg-s-bg-sunken fill, 14px
// heading gap, the .sa-h2 18/600 clamp recipe, the ScrollRow bleed) is copied directly from the
// APPROVED mockup public/_mockups/home-v3/search-a.html (categorySections/railCard/sectionFrame),
// named by the task as this change's source of truth , not a new/invented treatment.
"use client";

import * as React from "react";
import { ArrowRight } from "lucide-react";
import { ScrollRow } from "../homepage/SectionHeader";
import { SalonCard, type SalonCardProps } from "../homepage/SalonCard";
import { TITLES, pick } from "./CategoryBrowseRails";
// I6 (2026-08-01, home rails reconciliation with public/_mockups/home-v3/search-a.html
// categorySections(): "Barber is where walk-in lives now that it is not a category pill"): the
// real, already-shipped WalkInBand (homepage/WalkInBand.tsx) composed in, not rebuilt , same
// component the home page renders. It self-hides on zero walk-in salons (own `if (!loading &&
// (!salons || salons.length === 0)) return null` gate), so no extra empty-state handling needed
// here.
import WalkInBand from "../homepage/WalkInBand";
// postalToCity reuse (rule 12, don't re-declare): the same postal-code -> city lookup
// salonCardData.ts already uses to feed the homepage Nearby rail's SalonCard `city` prop
// (a working surface). A rail's `cityName` prop is one page-level value (the active city
// filter, or "Schweizweit" on a countrywide category route); it is wrong per-card the
// moment two salons in the same rail sit in different cities, so each card derives its
// own city from ITS postal_code instead of inheriting the page's.
import { postalToCity } from "../salon/_shared";
import { useLocale } from "next-intl";
import { nameForLocale } from "@/lib/min-price-service";

/**
 * CategoryMobileRails , owner 2026-08-01 ("remove cz we made it carousel right did u forget"):
 * the mobile category page (/de/coiffeur and siblings) renders three curated rails instead of
 * the flat SalonResultCard feed. Source of truth: public/_mockups/home-v3/search-a.html,
 * categorySections() + railCard() + sectionFrame() (only the first three sections , Top /
 * Nearby / Available this week , the walk-in band, reviews and inspo sections the mockup also
 * builds for a category are a separate, not-yet-scoped ask). Doc: components/CategoryMobileRails.md.
 *
 * Distinct from CategoryBrowseRails.tsx (6 rails, dormant behind BROWSE_RAILS, wraps cards in
 * Section/SectionFrame): this is composed to sit directly inside SearchTemplate's existing
 * px-3-padded "Result grid" wrapper, so it skips SectionFrame's own padding (that would double
 * up against the ancestor's gutter and break the edge-to-edge rail bleed) and instead pairs
 * ScrollRow's bleed math 1:1 against that ancestor. The heading also differs on purpose: the
 * mockup pins a 32px circular arrow to the right edge of the title row (sectionFrame()'s
 * `.sa-h2arrow`), which is NOT what the shared SectionHeader/SectionTitle component renders
 * today (that arrow lives INSIDE the h2, bare, no circle, by a dated 2026-05-15/16 decision) ,
 * so this file draws its own heading row rather than mis-using SectionTitle. The card anatomy
 * is NOT redrawn: SalonCard (photo 5/4 radius 22, mt-2 body, name+rating / category / postal+
 * price rows, width calc((100vw-44px)/1.5)) already matches the mockup's railCard byte for
 * byte, so every card here is the same composed SalonCard the homepage and PDP use.
 */

const RAIL_CAP = 10; // matches CategoryBrowseRails' existing per-rail cap

type MobileRailSalon = {
  id: string;
  name: string;
  slug: string;
  average_rating: number | null;
  review_count?: number | null;
  cover_photo_url: string | null;
  postal_code?: string | null;
  min_price?: number | null;
  // Art. 13 PBV: the from-price must name the offer it buys. These arrive on every /api/salons
  // response; this type simply never declared them, so the rail printed a bare number.
  min_price_service_de?: string | null;
  min_price_service_en?: string | null;
  min_price_service_fr?: string | null;
  min_price_service_it?: string | null;
  distance_meters?: number | null;
  services?: { slots?: string[] | null }[];
};

/** Title left, a 32px circular arrow pinned right, 14px gap to the first card , the mockup's
 *  sectionFrame() anatomy (search-a.html .sa-secheadrow / .sa-h2arrow), copied literally. The
 *  arrow is decorative (aria-hidden), matching the mockup's own `a.setAttribute("aria-hidden",
 *  "true")` , no see-all destination was specified for this rail set, so it stays inert chrome
 *  rather than a link built to nowhere. */
function RailHeading({ title }: { title: string }) {
  return (
    <div className="mb-[14px] flex items-center justify-between gap-4">
      {/* mockup-ok: public/_mockups/home-v3/search-a.html .sa-h2 (18/600, clamp(18px,2vw,20px)),
          same H2 recipe SectionHeader's SectionTitle already locks too, not reinvented. */}
      <h2 className="font-display text-[clamp(18px,2vw,20px)] font-semibold leading-[1.25] tracking-[-0.01em] text-s-ink">
        {title}
      </h2>
      <span
        aria-hidden="true"
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-s-bg-sunken text-s-ink"
      >
        <ArrowRight size={20} strokeWidth={2.2} aria-hidden />
      </span>
    </div>
  );
}

function Rail({
  title,
  salons,
  category,
  cityName,
  favoriteIds,
}: {
  title: string;
  salons: MobileRailSalon[];
  category: SalonCardProps["category"];
  cityName: string;
  favoriteIds: Set<string>;
}) {
  // Read here rather than threaded through three call sites: this is a client component and the
  // locale is the only thing the price label needs that the salon row does not carry.
  const locale = useLocale();
  // Same self-hide floor CategoryBrowseRails' own Rail() already uses: a 1-card rail is not a
  // rail, and an empty one is never rendered , never a section with no data.
  if (salons.length < 2) return null;
  return (
    <section className="mb-6">
      <RailHeading title={title} />
      <ScrollRow>
        {salons.map((s) => (
          <SalonCard
            key={s.id}
            slug={s.slug}
            salonId={s.id}
            name={s.name}
            rating={s.average_rating}
            reviewCount={s.review_count}
            category={category}
            photoUrl={s.cover_photo_url ?? undefined}
            variant="availability"
            priceFromCHF={s.min_price ?? undefined}
            priceFromService={nameForLocale({ de: s.min_price_service_de ?? null, en: s.min_price_service_en ?? null, fr: s.min_price_service_fr ?? null, it: s.min_price_service_it ?? null }, locale)}
            postalCode={s.postal_code ?? undefined}
            // Per-salon city from its own postal_code (postalToCity), not the page-level
            // cityName ("4051 Schweizweit" bug: every card showed the countrywide fallback
            // instead of its own city). cityName kept as the fallback for the rare salon
            // with no postal_code, so that case still shows an honest, locale-correct label
            // instead of postalToCity's own hardcoded-German "der Schweiz" default.
            city={s.postal_code ? postalToCity(s.postal_code) : cityName}
            isSaved={favoriteIds.has(s.id)}
          />
        ))}
      </ScrollRow>
    </section>
  );
}

export function CategoryMobileRails({
  salons,
  locale,
  category,
  categoryLabel,
  cityName,
  favoriteIds,
}: {
  salons: MobileRailSalon[];
  locale: string;
  category: SalonCardProps["category"];
  /** Real display label for this category route (SearchTemplate's CATEGORY_PILLS, e.g. "Coiffeur"). */
  categoryLabel: string;
  cityName: string;
  favoriteIds: Set<string>;
}) {
  // 1. Top <Category> , sorted by rating (mockup categorySections(): byRating).
  const top = [...salons]
    .filter((s) => s.average_rating != null)
    .sort((a, b) => (b.average_rating ?? 0) - (a.average_rating ?? 0))
    .slice(0, RAIL_CAP);

  // The set is meaningless without a populated Top rail (same gate CategoryBrowseRails uses).
  if (top.length < 2) return null;

  // 2. Nearby , real distance_meters ascending when the page has it (the user granted
  //    geolocation for a distance sort); otherwise the same city/category-scoped pool the page
  //    already fetched. Identical fallback to CategoryBrowseRails' own "In der Nähe" rail , the
  //    mockup's fake `.reverse()` ordering has no real-data equivalent, so it is not copied.
  const hasDistance = salons.some((s) => s.distance_meters != null);
  const nearby = (
    hasDistance
      ? [...salons]
          .filter((s) => s.distance_meters != null)
          .sort((a, b) => (a.distance_meters ?? 0) - (b.distance_meters ?? 0))
      : [...salons]
  ).slice(0, RAIL_CAP);

  // 3. Available this week , a real upcoming slot inside the next 7 days, read from
  //    services[].slots (the same with_slots=1 payload the flat feed already reads for its
  //    next-slot label). Bounded to 7 days, unlike CategoryBrowseRails' unbounded "Bald frei"
  //    rail, so the section's own title claim stays true rather than "eventually free".
  const now = Date.now();
  const weekMs = now + 7 * 24 * 60 * 60 * 1000;
  const availableThisWeek = salons
    .map((s) => {
      let earliest: number | null = null;
      for (const sv of s.services ?? []) {
        for (const iso of sv.slots ?? []) {
          const ms = new Date(iso).getTime();
          if (!Number.isNaN(ms) && ms > now && ms <= weekMs && (earliest === null || ms < earliest)) {
            earliest = ms;
          }
        }
      }
      return { s, t: earliest };
    })
    .filter((x): x is { s: MobileRailSalon; t: number } => x.t !== null)
    .sort((a, b) => a.t - b.t)
    .map((x) => x.s)
    .slice(0, RAIL_CAP);

  return (
    <div>
      <Rail
        title={`Top ${categoryLabel}`}
        salons={top}
        category={category}
        cityName={cityName}
        favoriteIds={favoriteIds}
      />
      {/* I6: Walk-in, second section on Barber ONLY (mockup categorySections(): "Top Barbershops,
          Walk-in, Nearby, Available this week..."). The real WalkInBand fetches its own data and
          renders null with zero walk-in salons, so this never ships an empty shell. */}
      {category === "barbershop" && <WalkInBand />} {/* drift-ok: walk-in is genuinely barbershop-only (queue feature), same precedent as SearchTemplate.tsx:507's walk_in pill, not a styling branch */}
      <Rail
        title={pick(TITLES.nearby, locale)}
        salons={nearby}
        category={category}
        cityName={cityName}
        favoriteIds={favoriteIds}
      />
      <Rail
        title={pick(TITLES.soon, locale)}
        salons={availableThisWeek}
        category={category}
        cityName={cityName}
        favoriteIds={favoriteIds}
      />
    </div>
  );
}
