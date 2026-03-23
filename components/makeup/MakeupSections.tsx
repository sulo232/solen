"use client";

import { useState } from "react";
import Link from "next/link";
import { Camera, ChevronRight } from "lucide-react";
import { useLocale } from "next-intl";

// ── Occasion filter pills ──────────────────────────────────────────────────

const OCCASIONS = ["Braut", "Editorial", "Alltag", "Special Event", "Theater", "Abend"] as const;

export function MakeupAboveGrid() {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  return (
    <div className="bg-white/70 dark:bg-s-dm-surface/70 backdrop-blur-sm border border-s-ink/5 dark:border-white/5 rounded-card px-4 py-3 flex items-center gap-3 flex-wrap">
      <span className="text-xs font-body text-s-ink/40 dark:text-s-dm-text/40 shrink-0">Anlass</span>
      {OCCASIONS.map((occ, i) => (
        <button
          key={occ}
          onClick={() => setActiveIdx(activeIdx === i ? null : i)}
          className={`px-3 py-1.5 rounded-pill text-xs font-body font-medium transition-all ${
            activeIdx === i
              ? "bg-s-plum text-white shadow-warm-sm"
              : "bg-s-bg-surface dark:bg-s-dm-surface text-s-ink/60 dark:text-s-dm-text/60 border border-s-ink/10 dark:border-white/10 hover:border-s-plum/40"
          }`}
        >
          {occ}
        </button>
      ))}
    </div>
  );
}

// ── Below-grid: Lookbook + Before/After ───────────────────────────────────

const LOOKBOOK = [
  { label: "Bridal Glow", tag: "Braut", color: "from-s-sand/40 to-s-sand-subtle" },
  { label: "Editorial Dark", tag: "Editorial", color: "from-s-plum/15 to-s-plum-subtle" },
  { label: "Natural Everyday", tag: "Alltag", color: "from-s-sage/20 to-s-sage-subtle" },
  { label: "Smoky Evening", tag: "Abend", color: "from-s-ink/8 to-s-bg-surface" },
  { label: "Golden Hour", tag: "Event", color: "from-s-amber/20 to-s-amber-subtle" },
  { label: "Artistic Stage", tag: "Theater", color: "from-s-coral/15 to-s-coral-subtle" },
];

export function MakeupBelowGrid() {
  const locale = useLocale();

  return (
    <div className="flex flex-col gap-12 pt-12 pb-4">
      {/* Lookbook grid */}
      <section>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="font-heading font-bold text-xl text-s-ink dark:text-s-dm-text">
              Aktuelle Looks
            </h2>
            <p className="text-sm text-s-ink/50 dark:text-s-dm-text/50 font-body mt-1">
              Inspiration von Basler Make-up Artists
            </p>
          </div>
          <Link
            href={`/${locale}/discover`}
            className="flex items-center gap-1 text-sm text-s-coral hover:underline font-body shrink-0"
          >
            Alle Looks <ChevronRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {LOOKBOOK.map((look) => (
            <Link
              key={look.label}
              href={`/${locale}/discover`}
              className={`rounded-card bg-gradient-to-br ${look.color} border border-s-ink/5 dark:border-white/5 aspect-[3/2] flex flex-col justify-between p-3 overflow-hidden hover:shadow-warm-md hover:scale-[1.02] transition-all duration-300`}
            >
              <span className="text-xs rounded-pill px-2 py-0.5 bg-white/60 dark:bg-s-dm-surface/60 text-s-ink/60 dark:text-s-dm-text/60 font-body self-start">
                {look.tag}
              </span>
              <p className="font-heading font-semibold text-s-ink dark:text-s-dm-text text-sm">
                {look.label}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Before/After showcase */}
      <section className="rounded-card bg-white dark:bg-s-dm-surface border border-s-ink/5 dark:border-white/5 p-6 shadow-warm-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-pill bg-s-plum/10 flex items-center justify-center">
            <Camera size={18} className="text-s-plum" />
          </div>
          <div>
            <p className="font-heading font-semibold text-s-ink dark:text-s-dm-text text-sm">
              Vorher / Nachher
            </p>
            <p className="text-xs text-s-ink/50 dark:text-s-dm-text/50 font-body">
              Echte Verwandlungen von unseren Artists
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { before: "Natural Skin", after: "Bridal Glow", artist: "Sofia M." },
            { before: "No Makeup", after: "Smoky Evening", artist: "Laura B." },
          ].map((item) => (
            <div key={item.artist} className="flex gap-2 rounded-button overflow-hidden border border-s-ink/5 dark:border-white/5">
              <div className="flex-1 bg-s-bg-sunken dark:bg-s-dm-sunken flex flex-col items-center justify-center p-3 text-center">
                <span className="text-xs text-s-ink/40 dark:text-s-dm-text/40 font-body uppercase tracking-wider mb-1">Vorher</span>
                <span className="text-sm font-heading text-s-ink/60 dark:text-s-dm-text/60">{item.before}</span>
              </div>
              <div className="w-px bg-s-ink/5 dark:bg-white/5" />
              <div className="flex-1 bg-s-plum-subtle/30 dark:bg-s-plum/10 flex flex-col items-center justify-center p-3 text-center">
                <span className="text-xs text-s-plum font-body uppercase tracking-wider mb-1">Nachher</span>
                <span className="text-sm font-heading font-semibold text-s-ink dark:text-s-dm-text">{item.after}</span>
                <span className="text-xs text-s-ink/40 dark:text-s-dm-text/40 font-body mt-1">by {item.artist}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
