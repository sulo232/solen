"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, ChevronRight } from "lucide-react";
import { useLocale } from "next-intl";

// ── Shape / material filter pills ─────────────────────────────────────────

const SHAPES = ["Mandel", "Quadrat", "Coffin", "Stiletto", "Rund", "Oval"] as const;
const MATERIALS = ["Gel", "Acryl", "BIAB", "Shellac", "Naturnagel"] as const;
const STYLES = ["Minimalistisch", "Nail Art", "French", "Ombre"] as const;

function PillGroup({
  label,
  options,
  active,
  onToggle,
  activeClass,
}: {
  label: string;
  options: readonly string[];
  active: number | null;
  onToggle: (i: number | null) => void;
  activeClass: string;
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-[11px] tracking-[0.2em] uppercase text-s-amber font-heading font-bold shrink-0 w-16">{label}</span>
      {options.map((opt, i) => (
        <button
          key={opt}
          onClick={() => onToggle(active === i ? null : i)}
          className={`px-3 py-1.5 rounded-pill text-xs font-body font-medium transition-all ${
            active === i
              ? `${activeClass} text-white shadow-warm-sm`
              : "bg-s-bg-surface dark:bg-s-dm-surface text-s-ink/60 dark:text-s-dm-text/60 border border-s-ink/10 dark:border-white/10 hover:border-s-coral/40"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

export function NailsAboveGrid() {
  const [shapeIdx, setShapeIdx] = useState<number | null>(null);
  const [matIdx, setMatIdx] = useState<number | null>(null);
  const [styleIdx, setStyleIdx] = useState<number | null>(null);

  return (
    <div className="bg-white dark:bg-s-dm-surface border border-s-ink/5 dark:border-white/5 rounded-card px-4 py-3 flex flex-col gap-3">
      <PillGroup label="Form" options={SHAPES} active={shapeIdx} onToggle={setShapeIdx} activeClass="bg-s-coral" />
      <PillGroup label="Material" options={MATERIALS} active={matIdx} onToggle={setMatIdx} activeClass="bg-s-coral" />
      <PillGroup label="Stil" options={STYLES} active={styleIdx} onToggle={setStyleIdx} activeClass="bg-s-coral" />
    </div>
  );
}

// ── Below-grid: Discovery preview + AI inspo teaser ───────────────────────

const INSPO_PLACEHOLDERS = [
  { color: "from-s-coral/20 to-s-coral-subtle", label: "Nail Art" },
  { color: "from-s-blue/20 to-s-blue-subtle", label: "French" },
  { color: "from-s-amber/20 to-s-amber-subtle", label: "Ombre" },
  { color: "from-s-plum/15 to-s-plum-subtle", label: "Minimalistisch" },
  { color: "from-s-sage/20 to-s-sage-subtle", label: "Naturnagel" },
  { color: "from-s-sand/30 to-s-sand-subtle", label: "Glitter" },
];

export function NailsBelowGrid() {
  const locale = useLocale();

  return (
    <div className="flex flex-col gap-12 pt-12 pb-4">
      {/* Nail Discovery Feed Preview */}
      <section>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="font-heading font-bold text-[clamp(26px,3.5vw,44px)] tracking-[-0.02em] text-s-ink dark:text-s-dm-text">
              Nail Inspo
            </h2>
            <p className="text-sm text-s-ink/50 dark:text-s-dm-text/50 font-body mt-1">
              Lass dich von echten Designs inspirieren
            </p>
          </div>
          <Link
            href={`/${locale}/discover/nails`}
            className="flex items-center gap-1 text-sm text-s-coral hover:underline font-body shrink-0"
          >
            Alle Designs <ChevronRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {INSPO_PLACEHOLDERS.map((item) => (
            <Link
              key={item.label}
              href={`/${locale}/discover/nails`}
              className={`rounded-card bg-gradient-to-br ${item.color} aspect-square flex items-end p-2 overflow-hidden hover:-translate-y-[5px] hover:shadow-warm-xl transition-all duration-250`}
            >
              <span className="text-xs font-body text-s-ink/60 dark:text-s-dm-text/60 leading-tight">
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* AI Nail Art Inspo teaser */}
      <section className="rounded-card bg-gradient-to-r from-s-coral/5 to-s-plum/5 dark:from-s-coral/10 dark:to-s-plum/10 border border-s-coral/15 p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <div className="w-12 h-12 rounded-pill bg-s-coral/10 flex items-center justify-center shrink-0">
          <Sparkles size={22} className="text-s-coral" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-heading font-semibold text-s-ink dark:text-s-dm-text">
            Dein Design, dein Stil
          </p>
          <p className="text-sm text-s-ink/50 dark:text-s-dm-text/50 font-body mt-1">
            Erstelle dein persönliches Nail-Art-Design mit KI — teile es beim Termin.
          </p>
        </div>
        <Link
          href={`/${locale}/discover/nails`}
          className="shrink-0 px-4 py-2 rounded-pill bg-s-coral text-white text-sm font-body font-medium hover:bg-s-coral-hover transition-colors shadow-warm-sm"
        >
          Inspo entdecken →
        </Link>
      </section>
    </div>
  );
}
