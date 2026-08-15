"use client";

import * as React from "react";
import Link from "next/link";
import { capitalize } from "./_shared";
import { formatQuartier } from "@/lib/basel-neighborhoods";
import { TabPill } from "../primitives/TabPill";
import { useTranslations } from "next-intl";

/**
 * mockup-ok: SalonAppCta, 2026-07-24 PORT (ref _overhaul/SalonAppCtaOverhaul.tsx).
 * The mid-page black "Termin buchen bei {salon}" hero card is REMOVED: booking already
 * lives in the sticky SalonMobileBookBar + the desktop SalonSidebar, so the card was a
 * third repeat of the same action and read as an unexplained black card (owner: "I
 * don't know what it is"). Only the real Fresha-pattern SEO/discovery cross-links
 * (Andere Salons in ..., category links) remain, unchanged, as a quiet peer section
 * below "In der Nähe".
 *
 * `variant`/`slug`/`salonName` retired with the hero card, kept unused-by-render in the
 * prop type only so app/[locale]/dev/pdp/cta/page.tsx (left as reference) still
 * compiles, same pattern as SalonCard's `nextSlotLabel`.
 *
 * 2026-08-15, TAP-THROUGH AREAS. Owner, pointing at his Fresha "Sonstige" capture: "on the
 * Discover More store ... maybe we can make it, like, more like this, you know, instead of
 * whatever we have so they can actually, like, tap through them and stuff."
 *
 * What his reference actually does, so this copies a structure instead of a description: an
 * AREA is a pill, the pills sit in one scrollable row, and the links below are the categories
 * IN the selected area, laid out in two columns. The flat cloud of six mixed chips this section
 * used to render put areas and categories on the same level, so there was nothing to tap
 * through, and every category link was nationwide even though the visitor is looking at a
 * specific salon in a specific neighbourhood.
 *
 * Every href here is a route that already exists and was checked live before shipping:
 * /[locale]/[city]/[category] returned 200 for basel/coiffeur and basel/barbershop,
 * /[locale]/[category] returned 200 for all four, and /[locale]/search returned 200. The
 * nationwide fallback is used whenever `postalToCity` could not resolve a real city (it
 * returns the literal "der Schweiz" in that case, which is not a city slug and would 404).
 */

/** The four marketplace categories, keyed by the slug /[locale]/[city]/[category] accepts. */
const CATEGORY_LINKS: { key: string; label: string }[] = [
  { key: "coiffeur", label: "Coiffeure" },
  { key: "barbershop", label: "Barbershops" },
  { key: "nails", label: "Nagelstudios" },
  { key: "spa", label: "Spa & Wellness" },
];

export function SalonAppCta({
  locale,
  city,
  quartier,
}: {
  locale: string;
  slug: string;
  salonName: string;
  city: string;
  quartier?: string | null;
  variant?: "hero" | "twoTier" | "minimal";
}) {
  const t = useTranslations("salonDetail");
  const cityLabel = capitalize(city);
  const quartierLabel = quartier ? formatQuartier(quartier) : null;

  // postalToCity falls back to the literal "der Schweiz" when the postal code resolves to no
  // known city. That is a country, not a city slug, so it must never be pushed into
  // /[locale]/[city]/[category] , those links go nationwide instead.
  const citySlug = cityLabel.toLowerCase();
  const cityIsReal = citySlug !== "der schweiz";

  const areas = [
    ...(quartierLabel && quartierLabel.toLowerCase() !== cityLabel.toLowerCase()
      ? [{ key: "quartier", label: `Andere Stores in ${quartierLabel}` }]
      : []),
    { key: "city", label: `Andere Stores in ${cityLabel}` },
  ];

  const [activeArea, setActiveArea] = React.useState(areas[0].key);

  const hrefFor = (categoryKey: string) => {
    if (activeArea === "quartier" && quartierLabel) {
      // SearchTemplate reads the category from `service` first, then `category`
      // (SearchTemplate.tsx:458), and takes a free-text `q`. A quartier has no route of its
      // own, so it travels as the query the search page already understands.
      return `/${locale}/search?q=${encodeURIComponent(quartierLabel)}&category=${categoryKey}`;
    }
    if (cityIsReal) return `/${locale}/${citySlug}/${categoryKey}`;
    return `/${locale}/${categoryKey}`;
  };

  return (
    <section className="border-t border-s-border pt-6">
      <h2 className="font-display text-[clamp(18px,2vw,20px)] font-semibold leading-[1.2] tracking-[-0.02em] text-s-ink">
        {t("discoverMore")}
      </h2>

      {/* The area pills. Only rendered when there is genuinely more than one area to tap
          between: a one-tab tab row is chrome that decides nothing. TabPill is the locked
          selected-state treatment (gray sunken fill + ink + semibold), composed rather than
          restyled here. */}
      {areas.length > 1 && (
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {areas.map((a) => (
            <TabPill
              key={a.key}
              active={activeArea === a.key}
              onClick={() => setActiveArea(a.key)}
              size="sm"
            >
              {a.label}
            </TabPill>
          ))}
        </div>
      )}

      {/* Two columns of category links in the selected area (his reference's own layout).
          Text links, so they take the accent per the design contract's link row, and the
          hover underline that makes them read as links rather than labels. */}
      <ul className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3.5">
        {CATEGORY_LINKS.map((c) => (
          <li key={c.key}>
            <Link
              href={hrefFor(c.key)}
              className="font-body text-[14px] text-s-ink underline-offset-4 transition-opacity duration-150 hover:underline hover:opacity-80"
            >
              {c.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
