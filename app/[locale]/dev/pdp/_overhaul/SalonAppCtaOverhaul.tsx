"use client";

// exists-check: net-new vs app/[locale]/_components/salon/SalonAppCta.tsx (real, unmodified,
// already carries a variant prop reviewed at /dev/pdp/cta). `npm run exists` for "cta" confirmed
// that route + component. The research spec's RESHAPE recommendation removes the redundant black
// book hero (booking already lives on SalonMobileBookBar + SalonSidebar , this was a THIRD copy
// of the same action) and keeps only the SEO/discovery cross-links (the one non-redundant thing
// here: the global Footer carries no city/category links, verified in Footer.tsx). Links data +
// gating are UNCHANGED real logic from the shipped component; the only NET-NEW text is the "Find
// more" heading, authored in English per the mockup-english rule.

import * as React from "react";
import Link from "next/link";
import { capitalize } from "../../../_components/salon/_shared";
import { formatQuartier } from "@/lib/basel-neighborhoods";

/**
 * SalonAppCtaOverhaul , mockup copy of the real SalonAppCta with the RESHAPE fix (ask 7).
 * REMOVED: the black "book at {salon}" hero card + subline + chevron circle + bookingHref ,
 * book is already owned by SalonMobileBookBar (sticky bottom) + SalonSidebar (desktop), so this
 * was a third repeat of the same action, and it was the loudest element on the page while
 * carrying the least new information.
 * KEPT: the real `links` array (city + quartier + category cross-links) unchanged, now the
 * ONLY content here, reshaped into a quiet, clearly-labelled block that reads as a PEER of
 * "Nearby" above it, not a hero.
 */
export function SalonAppCtaOverhaul({
  locale,
  slug,
  salonName,
  city,
  quartier,
}: {
  locale: string;
  slug: string;
  salonName: string;
  city: string;
  quartier?: string | null;
}) {
  const cityLabel = capitalize(city);
  const quartierLabel = quartier ? formatQuartier(quartier) : null;
  const links = [
    { label: `Other salons in ${cityLabel}`, href: `/${locale}/search?city=${encodeURIComponent(cityLabel)}` },
    ...(quartierLabel && quartierLabel.toLowerCase() !== cityLabel.toLowerCase()
      ? [{ label: `Other salons in ${quartierLabel}`, href: `/${locale}/search?q=${encodeURIComponent(quartierLabel)}` }]
      : []),
    { label: "Coiffeurs", href: `/${locale}/coiffeur` },
    { label: "Barbershops", href: `/${locale}/barbershop` },
    { label: "Nail studios", href: `/${locale}/nails` },
    { label: "Spa & wellness", href: `/${locale}/spa` },
  ];

  return (
    <section className="pt-6 border-t border-s-border">
      <h2 className="font-display text-[clamp(18px,2vw,20px)] font-semibold leading-[1.2] tracking-[-0.02em] text-s-ink">
        Find more
      </h2>
      <div className="mt-4 flex flex-wrap gap-2">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="font-body rounded-full bg-s-bg-sunken px-3.5 py-2 text-[13px] font-medium text-s-ink-2 transition-colors duration-150 hover:bg-s-border hover:text-s-ink"
          >
            {l.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
