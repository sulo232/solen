"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { SalonDetail } from "./_shared";
import { capitalize, postalToCity } from "./_shared";

/**
 * SalonBreadcrumb — V2-D53.3 polish (2026-05-11).
 *
 * Top-of-page breadcrumb matching Fresha pattern:
 *   Home › {primary category} › {city} › {quartier} › {salon name}
 *
 * Renders on desktop ONLY (`hidden md:flex`) — mobile screen real estate
 * doesn't justify the trail; mobile users have the Back overlay on the
 * hero cover photo anyway.
 *
 * Final segment (salon name) is NOT a link — current page.
 */
export function SalonBreadcrumb({ salon, locale }: { salon: SalonDetail; locale: string }) {
  const primaryCat = (salon.categories?.[0] ?? "coiffeur").toLowerCase();

  // German labels for each category — keeps the route slug English-friendly
  // while displaying the user-facing label.
  const catLabel: Record<string, string> = {
    coiffeur: "Coiffeure",
    barbershop: "Barbershops",
    nails: "Nagelstudios",
    spa: "Spa & Wellness",
  };

  const segments = [
    { label: "Home", href: `/${locale}` },
    { label: catLabel[primaryCat] ?? capitalize(primaryCat), href: `/${locale}/${primaryCat}` },
  ];

  // City from postal-code map (V2-D53.3 fix). Falls back to "der Schweiz"
  // when the prefix isn't recognized, in which case we skip the segment
  // (a "Schweiz" breadcrumb chip is meaningless).
  const city = postalToCity(salon.postal_code);
  const cityIsKnown = city !== "der Schweiz";
  if (cityIsKnown) {
    segments.push({ label: city, href: `/${locale}/${city.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")}` });
  }
  if (
    salon.quartier &&
    salon.quartier.toLowerCase() !== city.toLowerCase()
  ) {
    segments.push({
      label: capitalize(salon.quartier),
      href: cityIsKnown
        ? `/${locale}/${city.toLowerCase()}/${salon.quartier.toLowerCase()}`
        : `/${locale}/search?q=${encodeURIComponent(salon.quartier)}`,
    });
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className="font-body hidden items-center gap-1.5 text-[13px] text-s-ink-3 md:flex"
    >
      {segments.map((seg, i) => (
        <React.Fragment key={seg.href}>
          <Link
            href={seg.href}
            className="hover:text-s-ink hover:underline"
          >
            {seg.label}
          </Link>
          <ChevronRight size={12} strokeWidth={2} className="text-s-ink-3/60" />
        </React.Fragment>
      ))}
      <span className="truncate text-s-ink">{salon.name}</span>
    </nav>
  );
}
