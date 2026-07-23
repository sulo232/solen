"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { capitalize, withDateParam } from "./_shared";
import { formatQuartier } from "@/lib/basel-neighborhoods";

/**
 * SalonAppCta — booking-first refresh (2026-07-23, owner feedback: the old layout
 * "confusingly mixes SEO cross-links + a Book CTA" and "shows stray focus rings on
 * hover", "not refined").
 *
 * Now ONE strong primary hero card — "Termin buchen bei {salon}" — carries the
 * block (mid-page repetition of the primary action for users who scrolled past the
 * sidebar/sticky bar without booking). The Fresha-pattern cross-links (Andere Salons
 * in ..., category links) are demoted to a single quiet text row underneath — still
 * there for SEO/discovery, no longer competing with the CTA for attention.
 *
 * Both links use color/shadow-based hover (bg-s-ink → bg-black + shadow lift on the
 * card, text-s-ink-2 → text-s-ink on the footer links) — never a border/ring box,
 * per the global no-focus-ring policy (globals.css:378-393) which already kills any
 * real focus outline; a border-only hover read as a stray "focus ring" appearing.
 *
 * `variant` (added 2026-07-23 for the /dev/pdp/cta owner review, default "hero" =
 * pixel-identical to the pre-existing markup, so every other caller is unaffected):
 *   - "hero" (default): the booking-first card above + the quiet footer-links row.
 *   - "twoTier": same booking card, but the cross-links become an explicitly-labelled
 *     "Andere Salons in {city}" discovery row (heading link + a pill/chip row below it),
 *     instead of being folded anonymously into one quiet line.
 *   - "minimal": a single full-width book BAR (not a hero card) and the cross-links
 *     collapse to one quiet, non-wrapping text line — SEO/discovery kept, but reduced
 *     to the smallest possible footprint.
 */
export function SalonAppCta({
  locale,
  slug,
  salonName,
  city,
  quartier,
  variant = "hero",
}: {
  locale: string;
  slug: string;
  salonName: string;
  city: string;
  quartier?: string | null;
  variant?: "hero" | "twoTier" | "minimal";
}) {
  const cityLabel = capitalize(city);
  const quartierLabel = quartier ? formatQuartier(quartier) : null;
  // GAP #5: a searched date (?date=YYYY-MM-DD, forwarded from the search result the
  // user tapped) rides through to the booking picker instead of getting dropped.
  const searchParams = useSearchParams();
  const bookingHref = withDateParam(`/${locale}/salon/${slug}/booking`, searchParams?.get("date"));
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

  // "minimal" swaps the hero card for a thinner full-width bar; both other
  // variants keep the exact hero card markup below unchanged.
  if (variant === "minimal") {
    return (
      <section className="pt-4">
        {/* Minimal: single full-width book BAR, not a hero card — same ink fill +
            hover/press language as the hero, just a thinner shape. */}
        <Link
          href={bookingHref}
          className="font-body group flex items-center justify-between gap-4 rounded-card-lg bg-s-ink px-5 py-4 shadow-elevation-2 transition-all duration-200 ease-glide hover:bg-black hover:shadow-elevation-3 active:scale-[0.97]"
        >
          <span className="min-w-0 truncate text-[15px] font-semibold text-white">
            Termin buchen bei {salonName}
          </span>
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-s-ink">
            <ChevronRight size={18} strokeWidth={2.5} className="transition-transform group-hover:translate-x-1" />
          </span>
        </Link>

        {/* Footer: SEO/category cross-links collapsed to ONE quiet, non-wrapping
            line — still real links (no chip/border chrome), just the smallest
            footprint of the three directions. */}
        <div className="mt-3 flex flex-nowrap items-center gap-x-4 overflow-x-auto pb-0.5">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="font-body shrink-0 whitespace-nowrap text-[12.5px] font-normal text-s-ink-3 transition-colors duration-150 hover:text-s-ink-2"
            >
              {l.label}
            </Link>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="pt-4">
      {/* Hero: primary booking CTA card. bg-s-ink per V3-D192-fix (primary CTAs
          never blue-filled). Headline reuses the Section H2 recipe (recolored to
          white); hover is bg-black + a shadow lift + chevron nudge — matches the
          SalonBuy.tsx card-link pattern, never a border/ring box. */}
      <Link
        href={bookingHref}
        className="font-body group flex items-center gap-4 rounded-card-lg bg-s-ink px-6 py-5 shadow-elevation-2 transition-all duration-200 ease-glide hover:bg-black hover:shadow-elevation-3 active:scale-[0.97] sm:px-7 sm:py-6"
      >
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-[clamp(18px,2vw,20px)] font-semibold tracking-[-0.01em] text-white">
            Termin buchen bei {salonName}
          </h3>
          <p className="mt-1 text-[13px] font-normal text-white/70">
            Gönn dir ein Verwöhnprogramm, wo und wann du willst
          </p>
        </div>
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white text-s-ink shadow-elevation-2">
          <ChevronRight size={20} strokeWidth={2.5} className="transition-transform group-hover:translate-x-1" />
        </span>
      </Link>

      {variant === "twoTier" ? (
        /* Two tiers: cross-links promoted to an explicitly-labelled discovery
           row — the section heading IS the "Andere Salons in {city}" link (so
           the intent reads immediately), a pill/chip row of the remaining
           quartier + category links sits underneath. Chips are the standard
           gray See-all pill (bg-s-bg-sunken + text-s-ink-2), never ink/blue —
           this is navigation, not a selection control. */
        <div className="mt-5">
          <Link
            href={links[0].href}
            className="group flex items-center gap-1.5 font-body text-[13px] font-semibold text-s-ink transition-colors duration-150 hover:text-s-ink-2"
          >
            {links[0].label}
            <ChevronRight size={14} strokeWidth={2.5} className="transition-transform group-hover:translate-x-1" />
          </Link>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {links.slice(1).map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="font-body rounded-full bg-s-bg-sunken px-3.5 py-2 text-[13px] font-medium text-s-ink-2 transition-colors duration-150 hover:bg-s-border hover:text-s-ink"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      ) : (
        /* Footer: demoted SEO/category cross-links — quiet, secondary, plain text
            (no chip/border chrome, so the hover reads as a color shift, never a
            ring box). */
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-s-border pt-4">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="font-body text-[13px] font-medium text-s-ink-2 transition-colors duration-150 hover:text-s-ink"
            >
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
