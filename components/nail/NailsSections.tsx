"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, ChevronRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import ScrollableFilterRow, { type PillOption } from "@/components/ui/ScrollableFilterRow";

// ── Above-grid: Shape / material / style / length filter pills ────────────

export function NailsAboveGrid() {
  const t = useTranslations("nails") as any;
  const [shape, setShape] = useState<string | null>(null);
  const [material, setMaterial] = useState<string | null>(null);
  const [style, setStyle] = useState<string | null>(null);
  const [length, setLength] = useState<string | null>(null);

  const SHAPES: PillOption[] = [
    { value: "mandel", label: t("shape_almond") },
    { value: "quadrat", label: t("shape_square") },
    { value: "coffin", label: t("shape_coffin") },
    { value: "stiletto", label: t("shape_stiletto") },
    { value: "rund", label: t("shape_round") },
    { value: "oval", label: t("shape_oval") },
  ];

  const MATERIALS: PillOption[] = [
    { value: "gel", label: t("material_gel") },
    { value: "acryl", label: t("material_acrylic") },
    { value: "biab", label: t("material_biab") },
    { value: "shellac", label: t("material_shellac") },
    { value: "naturnagel", label: t("material_natural") },
  ];

  const STYLES: PillOption[] = [
    { value: "minimalistisch", label: t("style_minimal") },
    { value: "nail-art", label: t("style_nail_art") },
    { value: "french", label: t("style_french") },
    { value: "ombre", label: t("style_ombre") },
    { value: "glitzer", label: t("style_glitter") },
    { value: "chrome", label: t("style_chrome") },
  ];

  const LENGTHS: PillOption[] = [
    { value: "kurz", label: t("length_short") },
    { value: "mittel", label: t("length_medium") },
    { value: "lang", label: t("length_long") },
  ];

  return (
    <div className="bg-[--raised] dark:bg-s-dm-surface border border-s-ink/5 dark:border-white/5 rounded-[20px] px-4 py-3 flex flex-col gap-2.5">
      <ScrollableFilterRow label={t("filter_shape")} options={SHAPES} activeValue={shape} onSelect={setShape} />
      <ScrollableFilterRow label={t("filter_material")} options={MATERIALS} activeValue={material} onSelect={setMaterial} />
      <ScrollableFilterRow label={t("filter_style")} options={STYLES} activeValue={style} onSelect={setStyle} />
      <ScrollableFilterRow label={t("filter_length")} options={LENGTHS} activeValue={length} onSelect={setLength} />
    </div>
  );
}

// ── Below-grid: Discovery preview + AI inspo teaser ───────────────────────

export function NailsBelowGrid() {
  const t = useTranslations("nails") as any;
  const locale = useLocale();

  const INSPO_PLACEHOLDERS = [
    { color: "from-s-coral/20 to-s-coral-subtle", label: t("style_nail_art") },
    { color: "from-s-blue/20 to-s-blue-subtle", label: t("style_french") },
    { color: "from-s-amber/20 to-s-amber-subtle", label: t("style_ombre") },
    { color: "from-s-plum/15 to-s-plum-subtle", label: t("style_minimal") },
    { color: "from-s-sage/20 to-s-sage-subtle", label: t("material_natural") },
    { color: "from-s-sand/30 to-s-sand-subtle", label: t("style_glitter") },
  ];

  return (
    <div className="flex flex-col gap-12 pt-12 pb-4">
      {/* Nail Discovery Feed Preview */}
      <section>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="font-heading font-bold text-[clamp(26px,3.5vw,44px)] tracking-[-0.02em] text-s-ink dark:text-s-dm-text">
              {t("inspo_heading")}
            </h2>
            <p className="text-sm text-s-ink/50 dark:text-s-dm-text/50 font-body mt-1">
              {t("inspo_subheading")}
            </p>
          </div>
          <Link
            href={`/${locale}/discover?category=nails`}
            className="flex items-center gap-1 text-sm text-s-coral hover:text-s-coral transition-colors duration-150 font-body shrink-0"
          >
            {t("inspo_see_all")} <ChevronRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {INSPO_PLACEHOLDERS.map((item) => (
            <Link
              key={item.label}
              href={`/${locale}/discover?category=nails`}
              className={`rounded-[16px] bg-gradient-to-br ${item.color} aspect-square flex items-end p-2 overflow-hidden hover:-translate-y-[5px] hover:shadow-v5-card-hover transition-[transform,box-shadow] duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)]`}
              aria-label={item.label}
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
            {t("ai_teaser_title")}
          </p>
          <p className="text-sm text-s-ink/50 dark:text-s-dm-text/50 font-body mt-1">
            {t("ai_teaser_body")}
          </p>
        </div>
        <Link
          href={`/${locale}/discover?category=nails`}
          className="shrink-0 px-4 py-2 rounded-pill bg-s-coral text-white text-[11px] font-heading font-bold uppercase tracking-[.06em] hover:brightness-[1.06] active:scale-[0.97] transition-[transform,filter] duration-150 shadow-coral-glow"
        >
          {t("ai_teaser_cta")}
        </Link>
      </section>
    </div>
  );
}
