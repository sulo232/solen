"use client";

import Link from "next/link";
import { Sparkles, Clock, ChevronRight } from "lucide-react";
import { useLocale } from "next-intl";

// ── Treatment package cards ───────────────────────────────────────────────

const PACKAGES = [
  {
    name: "Entspannungs-Massage",
    tag: "Beliebt",
    duration: "60 min",
    price: "ab CHF 85",
    color: "from-s-sage/20 to-s-sage-subtle",
    description: "Klassische Ganzkörpermassage für tiefe Entspannung.",
  },
  {
    name: "Gesichtsbehandlung",
    tag: "Top bewertet",
    duration: "50 min",
    price: "ab CHF 75",
    color: "from-s-blue/15 to-s-blue-subtle",
    description: "Reinigung, Peeling und Maske für strahlende Haut.",
  },
  {
    name: "Day Spa Paket",
    tag: "Empfohlen",
    duration: "3 h",
    price: "ab CHF 195",
    color: "from-s-sand/30 to-s-sand-subtle",
    description: "Massage + Gesichtsbehandlung + Sauna — der perfekte Tag.",
  },
];

export function SpaBelowGrid() {
  const locale = useLocale();

  return (
    <div className="flex flex-col gap-12 pt-12 pb-4">
      {/* Treatment packages */}
      <section>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="font-heading font-bold text-xl text-s-ink dark:text-s-dm-text">
              Beliebte Pakete
            </h2>
            <p className="text-sm text-s-ink/50 dark:text-s-dm-text/50 font-body mt-1">
              Kombi-Behandlungen für maximale Entspannung
            </p>
          </div>
          <Link
            href={`/${locale}/behandlungen/massage`}
            className="flex items-center gap-1 text-sm text-s-sage-text hover:underline font-body shrink-0"
          >
            Alle Behandlungen <ChevronRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {PACKAGES.map((pkg) => (
            <Link
              key={pkg.name}
              href={`/${locale}/spa`}
              className={`rounded-card bg-gradient-to-br ${pkg.color} border border-s-ink/5 dark:border-white/5 p-4 flex flex-col gap-2 hover:shadow-warm-md hover:-translate-y-0.5 transition-all duration-200`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-heading font-semibold text-s-ink dark:text-s-dm-text text-sm leading-tight">
                  {pkg.name}
                </p>
                <span className="text-xs rounded-pill px-2 py-0.5 bg-white/60 dark:bg-s-dm-surface/60 text-s-ink/60 dark:text-s-dm-text/60 font-body shrink-0">
                  {pkg.tag}
                </span>
              </div>
              <p className="text-xs text-s-ink/50 dark:text-s-dm-text/50 font-body leading-relaxed">
                {pkg.description}
              </p>
              <div className="flex items-center justify-between mt-auto pt-2">
                <span className="flex items-center gap-1 text-xs text-s-ink/40 dark:text-s-dm-text/40 font-body">
                  <Clock size={11} /> {pkg.duration}
                </span>
                <span className="text-sm font-heading font-bold text-s-sage-text">{pkg.price}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Perfect Day CTA */}
      <section className="rounded-card bg-s-sage-subtle dark:bg-s-dm-surface border border-s-sage/20 dark:border-s-sage/10 p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <div className="w-12 h-12 rounded-pill bg-s-sage/15 flex items-center justify-center shrink-0">
          <Sparkles size={22} className="text-s-sage-text" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-heading font-semibold text-s-ink dark:text-s-dm-text">
            Massage + Gesichtsbehandlung = Dein perfekter Tag
          </p>
          <p className="text-sm text-s-ink/50 dark:text-s-dm-text/50 font-body mt-1">
            Kombiniere zwei Behandlungen und spare bis zu 15% mit unserem Day-Spa-Paket.
          </p>
        </div>
        <Link
          href={`/${locale}/behandlungen/day-spa`}
          className="shrink-0 px-4 py-2 rounded-button bg-s-sage text-white text-sm font-body font-medium hover:opacity-90 transition-opacity shadow-warm-sm"
        >
          Day Spa buchen →
        </Link>
      </section>
    </div>
  );
}
