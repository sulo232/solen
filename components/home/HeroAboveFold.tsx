"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Search, MapPin, Calendar, Sparkles, Clock, Heart } from "lucide-react";
import SignatureLockup from "@/components/ui/SignatureLockup";

/**
 * HeroAboveFold — Q49 (locked 2026-05-02) home above-fold replacement.
 *
 * Replaces the V5-era HomepageHero (cinematic gradient + AirbnbSearchBar pill).
 *
 * Anatomy per Q49:
 *   - White bg (Q15)
 *   - SignatureLockup at top: tracked-uppercase coral eyebrow + Anton headline
 *   - Fresha-flow stacked 3-field search card (Was · Wo · Wann), full-bleed
 *     pill wrapper. Tapping any field opens GuidedSearch sheet.
 *   - 3 quick-action chips below the search card (Last-Minute · Nearby · Trending)
 *
 * NO hero photo. NO decorative gradient. NO floating glass pill (retired).
 *
 * The search fields here are presentational triggers — actual input flow lives
 * in GuidedSearch sheet, opened on field tap. Same pattern as Booksy/Fresha
 * mobile-first home.
 */
export default function HeroAboveFold() {
  const locale = useLocale();
  const t = useTranslations("home.hero") as any;

  // Quick-action chips — links to filtered discovery
  const quickActions = [
    { key: "last-minute", icon: Clock, href: `/${locale}/last-minute`, label: "Last-Minute" },
    { key: "nearby", icon: MapPin, href: `/${locale}/entdecken?near=1`, label: "In der Nähe" },
    { key: "trending", icon: Sparkles, href: `/${locale}/entdecken?sort=trending`, label: "Trending" },
  ];

  return (
    <section
      className="bg-white px-5 md:px-10 lg:px-20"
      style={{ paddingTop: 96, paddingBottom: 48 }}
    >
      <div className="max-w-[640px] mx-auto">
        {/* Q48 signature — coral eyebrow + Anton uppercase headline */}
        <SignatureLockup
          eyebrow="Schweizer Salons · Direkt buchen"
          headline="Finde deinen Salon."
          subLine={
            <>
              Coiffeur · Barber · Nails · Spa · Makeup · Waxing.
              <br />
              Echte Bewertungen, echte Verfügbarkeit, in unter 30 Sekunden.
            </>
          }
          size="lg"
          align="center"
          className="mb-8"
        />

        {/* Q49 Fresha-flow stacked 3-field search card */}
        <button
          type="button"
          onClick={() => {
            // Open GuidedSearch sheet by clicking its trigger
            const trigger = document.querySelector<HTMLElement>("[data-gs-trigger]");
            trigger?.click();
          }}
          className="w-full block rounded-[16px] border border-s-ink/10 bg-white shadow-elevation-1 hover:shadow-elevation-2 transition-shadow duration-200 overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-s-coral focus-visible:ring-offset-2 text-left"
          aria-label="Suche öffnen"
        >
          {/* Field 1: Was */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-s-ink/[0.08] min-h-[56px]">
            <Search size={18} className="text-s-coral shrink-0" aria-hidden />
            <div className="flex-1 min-w-0">
              <span className="block font-body text-[10px] font-bold uppercase tracking-[.18em] text-s-coral-text">
                Was
              </span>
              <span className="block font-body text-[14px] text-s-ink/55 truncate mt-0.5">
                Service oder Salon
              </span>
            </div>
          </div>
          {/* Field 2: Wo */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-s-ink/[0.08] min-h-[56px]">
            <MapPin size={18} className="text-s-coral shrink-0" aria-hidden />
            <div className="flex-1 min-w-0">
              <span className="block font-body text-[10px] font-bold uppercase tracking-[.18em] text-s-coral-text">
                Wo
              </span>
              <span className="block font-body text-[14px] text-s-ink/55 truncate mt-0.5">
                Stadt oder Quartier
              </span>
            </div>
          </div>
          {/* Field 3: Wann */}
          <div className="flex items-center gap-3 px-4 py-3.5 min-h-[56px]">
            <Calendar size={18} className="text-s-coral shrink-0" aria-hidden />
            <div className="flex-1 min-w-0">
              <span className="block font-body text-[10px] font-bold uppercase tracking-[.18em] text-s-coral-text">
                Wann
              </span>
              <span className="block font-body text-[14px] text-s-ink/55 truncate mt-0.5">
                Heute, morgen, oder ein Datum
              </span>
            </div>
          </div>
        </button>

        {/* Quick-action chips */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {quickActions.map(({ key, icon: Icon, href, label }) => (
            <Link
              key={key}
              href={href}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-s-ink/10 bg-white hover:border-s-coral/40 hover:text-s-coral transition-colors duration-150 font-body text-[12px] font-semibold text-s-ink/70 min-h-[40px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-s-coral focus-visible:ring-offset-2"
            >
              <Icon size={14} aria-hidden />
              {label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
