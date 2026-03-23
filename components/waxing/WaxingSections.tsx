"use client";

import { useState } from "react";
import Link from "next/link";
import { Clock, Tag, ChevronRight } from "lucide-react";
import { useLocale } from "next-intl";

// ── Body zone grid ────────────────────────────────────────────────────────

const BODY_ZONES = [
  { label: "Beine", emoji: "🦵", slug: "beine" },
  { label: "Arme", emoji: "💪", slug: "arme" },
  { label: "Gesicht", emoji: "👄", slug: "gesicht" },
  { label: "Bikini", emoji: "🩱", slug: "bikini" },
  { label: "Ganzkörper", emoji: "✨", slug: "ganzkoerper" },
  { label: "Augenbrauen", emoji: "🌿", slug: "augenbrauen" },
];

export function WaxingAboveGrid() {
  const locale = useLocale();
  const [offPeak, setOffPeak] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      {/* Body zone icon grid */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {BODY_ZONES.map((zone) => (
          <Link
            key={zone.slug}
            href={`/${locale}/waxing?zone=${zone.slug}`}
            className="rounded-card bg-s-bg-surface dark:bg-s-dm-surface border border-s-ink/5 dark:border-white/5 p-3 flex flex-col items-center gap-1.5 text-center hover:border-s-sand/40 hover:shadow-warm-sm transition-all duration-200"
          >
            <span className="text-2xl leading-none">{zone.emoji}</span>
            <span className="text-xs font-body font-medium text-s-ink/60 dark:text-s-dm-text/60">{zone.label}</span>
          </Link>
        ))}
      </div>

      {/* Off-peak toggle */}
      <button
        onClick={() => setOffPeak(!offPeak)}
        className={`self-start flex items-center gap-2 px-3 py-1.5 rounded-pill text-xs font-body font-medium transition-all border ${
          offPeak
            ? "bg-s-amber-subtle border-s-amber/40 text-s-amber-text"
            : "bg-s-bg-surface dark:bg-s-dm-surface border-s-ink/10 dark:border-white/10 text-s-ink/60 dark:text-s-dm-text/60 hover:border-s-amber/40"
        }`}
      >
        <Tag size={12} />
        Rabatt verfügbar
        {offPeak && (
          <span className="ml-1 text-xs bg-s-amber text-white rounded-pill px-1.5 py-0.5">Aktiv</span>
        )}
      </button>
    </div>
  );
}

// ── Below-grid: Last-minute waxing strip ─────────────────────────────────

export function WaxingBelowGrid() {
  const locale = useLocale();

  return (
    <section className="pt-12 pb-4">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Clock size={18} className="text-s-coral" />
            <h2 className="font-heading font-bold text-xl text-s-ink dark:text-s-dm-text">
              Last-Minute Waxing
            </h2>
          </div>
          <p className="text-sm text-s-ink/50 dark:text-s-dm-text/50 font-body">
            Kurzfristige Termine — bis zu 50% Rabatt
          </p>
        </div>
        <Link
          href={`/${locale}/last-minute`}
          className="flex items-center gap-1 text-sm text-s-coral hover:underline font-body shrink-0"
        >
          Alle Angebote <ChevronRight size={14} />
        </Link>
      </div>
      <div className="rounded-card bg-s-coral-subtle/40 dark:bg-s-coral/5 border border-s-coral/15 p-6 text-center">
        <p className="text-sm text-s-ink/60 dark:text-s-dm-text/60 font-body">
          Aktuell keine Last-Minute Waxing-Slots — prüfe die{" "}
          <Link href={`/${locale}/last-minute`} className="text-s-coral hover:underline">
            Angebots-Seite
          </Link>{" "}
          für alle verfügbaren Rabatte.
        </p>
      </div>
    </section>
  );
}
