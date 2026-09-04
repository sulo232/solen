"use client";

import * as React from "react";
import Link from "next/link";
import { capitalize } from "./_shared";
import { TabPill } from "../primitives/TabPill";
import {
  PORTFOLIO_CATEGORIES,
  PORTFOLIO_TAXONOMY_BY_SALON_CATEGORY,
  getPortfolioCategoryLabel,
} from "@/lib/portfolio-categories";
import { CATEGORIES } from "../homepage/searchCategories";
import { useTranslations } from "next-intl";

/**
 * mockup-ok: SalonAppCta, 2026-07-24 PORT (ref _overhaul/SalonAppCtaOverhaul.tsx).
 * The mid-page black "Termin buchen bei {salon}" hero card is REMOVED: booking already
 * lives in the sticky SalonMobileBookBar + the desktop SalonSidebar, so the card was a
 * third repeat of the same action and read as an unexplained black card (owner: "I
 * don't know what it is"). Only the real Fresha-pattern SEO/discovery cross-links remain.
 *
 * `variant`/`slug`/`salonName` retired with the hero card, kept unused-by-render in the
 * prop type only so app/[locale]/dev/pdp/cta/page.tsx (left as reference) still compiles.
 *
 * 2026-08-15, TWO CORRECTIONS FROM HIM, both blunt.
 *
 * 1. THE NEIGHBOURHOOD IS GONE. "why do you have, like, this, like, city sections, like s t j o h
 *    a n n? I told you never do that shit. It's so fucking cringe." The pills used to be AREAS,
 *    one of them the salon's quartier ("Andere Stores in St. Johann"). Quartier is dropped from
 *    this surface entirely, label and link both. The city still scopes the category href, because
 *    /[locale]/[city]/[category] is how the real category pages are addressed, but it is never
 *    printed as a section name.
 *
 * 2. FAR MORE TO TAP. "why is the the options so low?" It rendered four broad category names.
 *    The pills are now the four marketplace categories and the list under each is that category's
 *    OWN service taxonomy, so coiffeur offers Damenschnitt, Herrenschnitt, Farbe and Styling
 *    instead of the single word "Coiffeure".
 *
 * NOT ONE LIST IS DECLARED IN THIS FILE, deliberately. The categories come from `CATEGORIES`
 * (homepage/searchCategories.ts, the list the search hub itself renders) and their services from
 * `PORTFOLIO_TAXONOMY_BY_SALON_CATEGORY` + `PORTFOLIO_CATEGORIES` (lib/portfolio-categories.ts),
 * which SalonImageGallery already reads and which ships localised in all four locales. The slug
 * for each category is DERIVED from its own label rather than written down again, so this file
 * cannot drift from the search hub the way a hand-kept copy would.
 */

/**
 * "Spa & Wellness" -> "spa", "Coiffeur" -> "coiffeur". The canonical categories carry a display
 * label and no slug, and the taxonomy is keyed by slug, so the first word of the label IS the
 * join. Written as a derivation rather than a lookup table on purpose: a table here would be the
 * fifth copy of the category list in this codebase.
 */
const slugOf = (label: string) => label.toLowerCase().split(/[^a-z]+/)[0];

export function SalonAppCta({
  locale,
  city,
  salonCategories = [],
}: {
  locale: string;
  slug: string;
  salonName: string;
  city: string;
  /** Used only to open on the category this salon belongs to. Defaults to the first pill. */
  salonCategories?: string[];
  quartier?: string | null;
  variant?: "hero" | "twoTier" | "minimal";
}) {
  const t = useTranslations("salonDetail");
  const cityLabel = capitalize(city);
  // postalToCity falls back to the literal "der Schweiz" when the postal code resolves to no known
  // city. That is a country, not a city slug, so it must never reach /[locale]/[city]/[category].
  const citySlug = cityLabel.toLowerCase();
  const cityIsReal = citySlug !== "der schweiz";

  const pills = React.useMemo(
    () =>
      CATEGORIES.map((c) => ({ slug: slugOf(c.label), label: c.label })).filter(
        (c) => c.slug in PORTFOLIO_TAXONOMY_BY_SALON_CATEGORY,
      ),
    [],
  );

  const own = salonCategories.map((c) => c.toLowerCase()).find((c) => pills.some((p) => p.slug === c));
  const [activeCat, setActiveCat] = React.useState<string>(own ?? pills[0]?.slug ?? "");
  const activeLabel = pills.find((p) => p.slug === activeCat)?.label ?? activeCat;

  // The active category's own service taxonomy, localised, straight from the canonical module.
  const services = (
    PORTFOLIO_TAXONOMY_BY_SALON_CATEGORY[activeCat as keyof typeof PORTFOLIO_TAXONOMY_BY_SALON_CATEGORY] ?? []
  )
    .map((key) => PORTFOLIO_CATEGORIES[key])
    .filter(Boolean);

  if (pills.length === 0) return null;

  return (
    <section className="border-t border-s-border pt-6">
      <h2 className="font-display text-[clamp(18px,2vw,20px)] font-semibold leading-[1.2] tracking-[-0.02em] text-s-ink">
        {t("discoverMore")}
      </h2>

      {/* Category pills. TabPill is the locked selected-state treatment (gray sunken fill + ink +
          semibold), composed rather than restyled here. */}
      <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {pills.map((p) => (
          <TabPill key={p.slug} active={activeCat === p.slug} onClick={() => setActiveCat(p.slug)} size="sm">
            {p.label}
          </TabPill>
        ))}
      </div>

      {/* Two columns of real service links in the selected category, plus the category page itself
          as the last entry so the broad option never disappears. */}
      <ul className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3.5">
        {services.map((c) => (
          <li key={c.key}>
            <Link
              href={`/${locale}/search?category=${activeCat}&q=${encodeURIComponent(getPortfolioCategoryLabel(c.key, locale))}`}
              className="font-body text-[14px] text-s-ink underline-offset-4 transition-opacity duration-150 hover:underline hover:opacity-80"
            >
              {getPortfolioCategoryLabel(c.key, locale)}
            </Link>
          </li>
        ))}
        <li>
          <Link
            href={cityIsReal ? `/${locale}/${citySlug}/${activeCat}` : `/${locale}/${activeCat}`}
            className="font-body text-[14px] font-medium text-s-accent underline-offset-4 transition-opacity duration-150 hover:underline hover:opacity-80"
          >
            {cityIsReal ? t("categoryInCity", { category: activeLabel, city: cityLabel }) : activeLabel}
          </Link>
        </li>
      </ul>
    </section>
  );
}
