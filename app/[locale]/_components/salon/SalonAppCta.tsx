"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { capitalize } from "./_shared";
import { formatQuartier } from "@/lib/basel-neighborhoods";

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
  const quartierLabel = quartier ? formatQuartier(quartier) : null;
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
      {/* V3-D202 (A22): font-body → font-display + Scale B.
          V3-D335 (T3): tracking -0.03em → -0.01em (canonical Section H2 per §2.5). */}
      <h2 className="font-display text-[clamp(18px,2vw,20px)] font-semibold tracking-[-0.01em] text-s-ink">
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
        {/* V3-D202 (A22): tinted emerald shadow → shadow-elevation-2. */}
        <Link
          href={`/${locale}/salon/${slug}/booking`}
          className="font-body inline-flex items-center gap-2 rounded-full bg-s-ink px-7 py-3.5 text-[14px] font-semibold text-white shadow-elevation-2 transition-colors hover:bg-black active:bg-black md:text-[15px]"
        >
          Termin buchen
          <ChevronRight size={16} strokeWidth={2.5} />
        </Link>
      </div>
    </section>
  );
}
