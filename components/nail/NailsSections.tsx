"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, ChevronRight } from "lucide-react";
import { useLocale } from "next-intl";
import ScrollableFilterRow, { type PillOption } from "@/components/ui/ScrollableFilterRow";

// ── Filter options ────────────────────────────────────────────────────────

const SHAPES: PillOption[] = [
  { value: "mandel", label: "Mandel" },
  { value: "quadrat", label: "Quadrat" },
  { value: "coffin", label: "Coffin" },
  { value: "stiletto", label: "Stiletto" },
  { value: "rund", label: "Rund" },
  { value: "oval", label: "Oval" },
];

const MATERIALS: PillOption[] = [
  { value: "gel", label: "Gel" },
  { value: "acryl", label: "Acryl" },
  { value: "biab", label: "BIAB" },
  { value: "shellac", label: "Shellac" },
  { value: "naturnagel", label: "Naturnagel" },
];

const STYLES: PillOption[] = [
  { value: "minimalistisch", label: "Minimalistisch" },
  { value: "nail-art", label: "Nail Art" },
  { value: "french", label: "French" },
  { value: "ombre", label: "Ombre" },
  { value: "glitzer", label: "Glitzer" },
  { value: "chrome", label: "Chrome" },
];

const LENGTHS: PillOption[] = [
  { value: "kurz", label: "Kurz" },
  { value: "mittel", label: "Mittel" },
  { value: "lang", label: "Lang" },
];

// ── Above-grid: Shape / material / style / length filter pills ────────────

export function NailsAboveGrid() {
  const [shape, setShape] = useState<string | null>(null);
  const [material, setMaterial] = useState<string | null>(null);
  const [style, setStyle] = useState<string | null>(null);
  const [length, setLength] = useState<string | null>(null);

  return (
    <div className="bg-white dark:bg-s-dm-surface border border-s-ink/5 dark:border-white/5 rounded-[20px] px-4 py-3 flex flex-col gap-2.5">
      <ScrollableFilterRow label="Form" options={SHAPES} activeValue={shape} onSelect={setShape} />
      <ScrollableFilterRow label="Material" options={MATERIALS} activeValue={material} onSelect={setMaterial} />
      <ScrollableFilterRow label="Stil" options={STYLES} activeValue={style} onSelect={setStyle} />
      <ScrollableFilterRow label="Länge" options={LENGTHS} activeValue={length} onSelect={setLength} />
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
            href={`/${locale}/discover?category=nails`}
            className="flex items-center gap-1 text-sm text-s-coral hover:underline font-body shrink-0"
          >
            Alle Designs <ChevronRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {INSPO_PLACEHOLDERS.map((item) => (
            <Link
              key={item.label}
              href={`/${locale}/discover?category=nails`}
              className={`rounded-[16px] bg-gradient-to-br ${item.color} aspect-square flex items-end p-2 overflow-hidden hover:-translate-y-[5px] hover:shadow-warm-xl transition-all duration-250`}
            >
              <span className="text-xs font-body text-s-ink/60 dark:text-s-dm-text/60 leading-tight">
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* AI Nail Art Inspo teaser */}
      <section className="rounded-[20px] bg-gradient-to-r from-s-coral/5 to-s-plum/5 dark:from-s-coral/10 dark:to-s-plum/10 border border-s-coral/15 p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6">
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
          href={`/${locale}/discover?category=nails`}
          className="shrink-0 px-4 py-2 rounded-btn bg-s-coral text-white text-[11px] font-heading font-bold uppercase tracking-[.06em] hover:brightness-[1.06] transition-colors shadow-warm-sm"
        >
          Inspo entdecken →
        </Link>
      </section>
    </div>
  );
}
