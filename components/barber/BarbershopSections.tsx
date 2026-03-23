"use client";

import { useState } from "react";
import Link from "next/link";
import { Users, Zap, ChevronRight } from "lucide-react";
import { useLocale } from "next-intl";

// ── Discovery signal filter pills ─────────────────────────────────────────

const FADE_TYPES = ["Skin Fade", "Low Fade", "Mid Fade", "High Fade"] as const;
const HAIR_TEXTURES = ["Afro", "Lockig", "Wellig", "Glatt"] as const;
const BARBER_STYLES = ["Klassisch", "Modern", "Urban"] as const;

type FilterPill = { label: string; active: boolean };

function FilterPills({
  label,
  options,
  activeIndex,
  onSelect,
  accentClass,
}: {
  label: string;
  options: readonly string[];
  activeIndex: number | null;
  onSelect: (i: number | null) => void;
  accentClass: string;
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs font-body text-s-ink/40 dark:text-s-dm-text/40 shrink-0">{label}</span>
      {options.map((opt, i) => (
        <button
          key={opt}
          onClick={() => onSelect(activeIndex === i ? null : i)}
          className={`px-3 py-1.5 rounded-pill text-xs font-body font-medium transition-all ${
            activeIndex === i
              ? `${accentClass} text-white shadow-warm-sm`
              : "bg-s-bg-surface dark:bg-s-dm-surface text-s-ink/60 dark:text-s-dm-text/60 border border-s-ink/10 dark:border-white/10 hover:border-s-amber/40"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

// ── Above-grid: Walk-in teaser + filter pills ──────────────────────────────

export function BarbershopAboveGrid() {
  const [fadeIdx, setFadeIdx] = useState<number | null>(null);
  const [textureIdx, setTextureIdx] = useState<number | null>(null);
  const [styleIdx, setStyleIdx] = useState<number | null>(null);
  const locale = useLocale();

  return (
    <div className="flex flex-col gap-4">
      {/* Walk-in teaser */}
      <div className="flex items-center justify-between gap-4 px-4 py-3 bg-s-amber-subtle dark:bg-s-dm-surface border border-s-amber/30 dark:border-s-amber/20 rounded-card">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-pill bg-s-amber/15 flex items-center justify-center shrink-0">
            <Users size={16} className="text-s-amber" />
          </div>
          <div className="min-w-0">
            <p className="font-heading font-semibold text-s-ink dark:text-s-dm-text text-sm">
              Kein Termin? Einfach reingehen.
            </p>
            <p className="text-xs text-s-ink/50 dark:text-s-dm-text/50 font-body">
              Barbershops mit Walk-in Queue — sieh Wartezeiten in Echtzeit
            </p>
          </div>
        </div>
        <Link
          href={`/${locale}/barbershop?walkin=true`}
          className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-button bg-s-amber text-white text-xs font-body font-medium hover:bg-s-amber-hover transition-colors shadow-warm-sm"
        >
          <Zap size={12} />
          Walk-ins
        </Link>
      </div>

      {/* Discovery signal filter pills */}
      <div className="bg-white/70 dark:bg-s-dm-surface/70 backdrop-blur-sm border border-s-ink/5 dark:border-white/5 rounded-card px-4 py-3 flex flex-col gap-3">
        <FilterPills
          label="Fade-Typ"
          options={FADE_TYPES}
          activeIndex={fadeIdx}
          onSelect={setFadeIdx}
          accentClass="bg-s-amber"
        />
        <FilterPills
          label="Haartyp"
          options={HAIR_TEXTURES}
          activeIndex={textureIdx}
          onSelect={setTextureIdx}
          accentClass="bg-s-amber"
        />
        <FilterPills
          label="Stil"
          options={BARBER_STYLES}
          activeIndex={styleIdx}
          onSelect={setStyleIdx}
          accentClass="bg-s-amber"
        />
      </div>
    </div>
  );
}

// ── Below-grid: Barber Roster preview ──────────────────────────────────────

const FEATURED_BARBERS = [
  { id: "1", name: "Marco B.", speciality: "Skin Fade", styles: ["Urban", "Klassisch"], initials: "MB" },
  { id: "2", name: "Yannick R.", speciality: "Afro Cuts", styles: ["Modern", "Urban"], initials: "YR" },
  { id: "3", name: "Davide S.", speciality: "Bart-Design", styles: ["Klassisch"], initials: "DS" },
  { id: "4", name: "Kevin L.", speciality: "High Fade", styles: ["Modern"], initials: "KL" },
];

export function BarbershopBelowGrid() {
  const locale = useLocale();
  return (
    <section className="pt-12 pb-4">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="font-heading font-bold text-xl text-s-ink dark:text-s-dm-text">
            Unsere Barber
          </h2>
          <p className="text-sm text-s-ink/50 dark:text-s-dm-text/50 font-body mt-1">
            Profis für jeden Stil in Basel
          </p>
        </div>
        <Link
          href={`/${locale}/barbershop`}
          className="flex items-center gap-1 text-sm text-s-amber hover:underline font-body shrink-0"
        >
          Alle Barber <ChevronRight size={14} />
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {FEATURED_BARBERS.map((barber) => (
          <div
            key={barber.id}
            className="rounded-card bg-white dark:bg-s-dm-surface border border-s-ink/5 dark:border-white/5 p-4 flex flex-col items-center text-center shadow-warm-sm hover:shadow-warm-md hover:-translate-y-1 transition-all duration-200"
          >
            <div className="w-14 h-14 rounded-pill bg-s-amber/10 flex items-center justify-center mb-3">
              <span className="font-heading font-bold text-s-amber text-lg">{barber.initials}</span>
            </div>
            <p className="font-heading font-semibold text-s-ink dark:text-s-dm-text text-sm">{barber.name}</p>
            <p className="text-xs text-s-ink/50 dark:text-s-dm-text/50 font-body mt-0.5">{barber.speciality}</p>
            <div className="flex gap-1 flex-wrap justify-center mt-2">
              {barber.styles.map((s) => (
                <span key={s} className="text-xs px-2 py-0.5 rounded-pill bg-s-amber-subtle text-s-amber-text font-body">
                  {s}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
