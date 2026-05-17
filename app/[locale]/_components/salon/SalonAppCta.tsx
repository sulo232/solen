"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { capitalize } from "./_shared";

/**
 * SalonAppCta — V2-D53.3 polish (2026-05-11).
 *
 * Bottom-of-page block matching Fresha pattern:
 *   "Treat yourself anytime, anywhere" h2
 *   + chip-link row (Andere Salons in Zürich, Andere Salons in [quartier])
 *   + repeated Book CTA
 *
 * Mid-page repetition of the primary CTA is intentional — users who
 * scrolled past the sidebar/sticky bar without booking get one more shot
 * at the bottom. Per Solen brand, Book is emerald (NOT Fresha's black).
 */
export function SalonAppCta({
  locale,
  slug,
  city,
  quartier,
}: {
  locale: string;
  slug: string;
  city: string;
  quartier?: string | null;
}) {
  const cityLabel = capitalize(city);
  const quartierLabel = quartier ? capitalize(quartier) : null;
  const chips = [
    { label: `Andere Salons in ${cityLabel}`, href: `/${locale}/search?city=${encodeURIComponent(cityLabel)}` },
    ...(quartierLabel && quartierLabel.toLowerCase() !== cityLabel.toLowerCase()
      ? [{ label: `Andere Salons in ${quartierLabel}`, href: `/${locale}/search?q=${encodeURIComponent(quartierLabel)}` }]
      : []),
    { label: "Coiffeure", href: `/${locale}/coiffeur` },
    { label: "Barbershops", href: `/${locale}/barbershop` },
    { label: "Nagelstudios", href: `/${locale}/nails` },
    { label: "Spa & Wellness", href: `/${locale}/spa` },
  ];

  return (
    <section className="pt-4">
      <h2 className="font-body text-[20px] font-bold leading-tight tracking-tight text-s-ink md:text-[26px]">
        Verwöhne dich jederzeit, überall
      </h2>

      <div className="mt-5 flex flex-wrap gap-2">
        {chips.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="font-body rounded-full border border-s-border bg-white px-4 py-2 text-[13px] font-medium text-s-ink-2 transition-colors hover:border-s-ink hover:text-s-ink"
          >
            {c.label}
          </Link>
        ))}
      </div>

      <div className="mt-6 flex justify-center md:justify-start">
        <Link
          href={`/${locale}/salon/${slug}/booking`}
          className="font-body inline-flex items-center gap-2 rounded-full bg-s-brand px-7 py-3.5 text-[14px] font-semibold text-white shadow-[0_4px_16px_rgba(31,92,66,0.20)] transition-colors hover:bg-s-brand-mid active:bg-s-brand-deep md:text-[15px]"
        >
          Termin buchen
          <ChevronRight size={16} strokeWidth={2.5} />
        </Link>
      </div>
    </section>
  );
}
