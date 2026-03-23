"use client";

import { useState } from "react";
import Link from "next/link";
import { Brain, TrendingUp, ChevronRight } from "lucide-react";
import { useLocale } from "next-intl";

// ── Hair type filter pills ─────────────────────────────────────────────────

const HAIR_TYPES = ["Lockig", "Wellig", "Glatt", "Fein", "Kräftig", "Gefärbt"] as const;

export function CoiffeurAboveGrid() {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  return (
    <div className="bg-white/70 dark:bg-s-dm-surface/70 backdrop-blur-sm border border-s-ink/5 dark:border-white/5 rounded-card px-4 py-3 flex items-center gap-3 flex-wrap">
      <span className="text-xs font-body text-s-ink/40 dark:text-s-dm-text/40 shrink-0">Haartyp</span>
      {HAIR_TYPES.map((type, i) => (
        <button
          key={type}
          onClick={() => setActiveIdx(activeIdx === i ? null : i)}
          className={`px-3 py-1.5 rounded-pill text-xs font-body font-medium transition-all ${
            activeIdx === i
              ? "bg-s-coral text-white shadow-warm-sm"
              : "bg-s-bg-surface dark:bg-s-dm-surface text-s-ink/60 dark:text-s-dm-text/60 border border-s-ink/10 dark:border-white/10 hover:border-s-coral/40"
          }`}
        >
          {type}
        </button>
      ))}
    </div>
  );
}

// ── Below-grid: Trending styles strip + AI matching CTA ───────────────────

const TRENDING_STYLES = [
  { label: "Curtain Bang", tag: "Trending", color: "from-s-coral/20 to-s-coral/5" },
  { label: "Wolf Cut", tag: "Beliebt", color: "from-s-blue/20 to-s-blue/5" },
  { label: "Shag Haircut", tag: "Neu", color: "from-s-amber/20 to-s-amber/5" },
  { label: "Blunt Bob", tag: "Klassiker", color: "from-s-sage/20 to-s-sage/5" },
];

export function CoiffeurBelowGrid() {
  const locale = useLocale();

  return (
    <div className="flex flex-col gap-12 pt-12 pb-4">
      {/* Trending styles strip */}
      <section>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={18} className="text-s-coral" />
              <h2 className="font-heading font-bold text-xl text-s-ink dark:text-s-dm-text">
                Trending in Basel
              </h2>
            </div>
            <p className="text-sm text-s-ink/50 dark:text-s-dm-text/50 font-body">
              Diese Looks werden gerade gebucht
            </p>
          </div>
          <Link
            href={`/${locale}/discover`}
            className="flex items-center gap-1 text-sm text-s-coral hover:underline font-body shrink-0"
          >
            Alle Looks <ChevronRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {TRENDING_STYLES.map((style) => (
            <Link
              key={style.label}
              href={`/${locale}/discover`}
              className={`rounded-card bg-gradient-to-br ${style.color} border border-s-ink/5 dark:border-white/5 p-4 h-28 flex flex-col justify-between hover:shadow-warm-md hover:-translate-y-0.5 transition-all duration-200`}
            >
              <span className="text-xs rounded-pill px-2 py-0.5 bg-white/60 dark:bg-s-dm-surface/60 text-s-ink/60 dark:text-s-dm-text/60 font-body self-start">
                {style.tag}
              </span>
              <p className="font-heading font-semibold text-s-ink dark:text-s-dm-text text-sm">
                {style.label}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* AI matching CTA */}
      <section className="rounded-card bg-gradient-to-r from-s-coral/5 to-s-coral/10 dark:from-s-coral/10 dark:to-s-coral/5 border border-s-coral/15 p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <div className="w-12 h-12 rounded-pill bg-s-coral/10 flex items-center justify-center shrink-0">
          <Brain size={22} className="text-s-coral" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-heading font-semibold text-s-ink dark:text-s-dm-text">
            Nicht sicher welcher Salon?
          </p>
          <p className="text-sm text-s-ink/50 dark:text-s-dm-text/50 font-body mt-1">
            Beantworte 3 kurze Fragen — wir empfehlen dir den passenden Salon.
          </p>
        </div>
        <Link
          href={`/${locale}/coiffeur?ai=true`}
          className="shrink-0 px-4 py-2 rounded-button bg-s-coral text-white text-sm font-body font-medium hover:bg-s-coral-hover transition-colors shadow-warm-sm"
        >
          KI-Empfehlung →
        </Link>
      </section>
    </div>
  );
}
