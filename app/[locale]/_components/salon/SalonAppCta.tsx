"use client";

import * as React from "react";
import Link from "next/link";
import { capitalize } from "./_shared";
import { formatQuartier } from "@/lib/basel-neighborhoods";
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
 */
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
  const links = [
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
    <section className="border-t border-s-border pt-6">
      <h2 className="font-display text-[clamp(18px,2vw,20px)] font-semibold leading-[1.2] tracking-[-0.02em] text-s-ink">
        {t("discoverMore")}
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
