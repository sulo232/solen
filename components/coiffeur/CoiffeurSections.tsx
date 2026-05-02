"use client";

import { useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Brain, TrendingUp, ChevronRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import AiMatcherModal from "./AiMatcherModal";
import ScrollableFilterRow, {
  type PillOption,
  type IconOption,
} from "@/components/ui/ScrollableFilterRow";

// ── Hair type icons (simple SVG illustrations) ──────────────────────────

function HairIcon({ d }: { d: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

// ── Trending styles (labels are style names, not translatable UI copy) ───

const TRENDING_STYLES = [
  { label: "Curtain Bang", tag: "trending", color: "from-s-coral/20 to-s-coral/5", q: "Curtain Bang" },
  { label: "Wolf Cut", tag: "popular", color: "from-s-blue/20 to-s-blue/5", q: "Wolf Cut" },
  { label: "Shag Haircut", tag: "new", color: "from-s-amber/20 to-s-amber/5", q: "Shag Haircut" },
  { label: "Blunt Bob", tag: "classic", color: "from-s-sage/20 to-s-sage/5", q: "Blunt Bob" },
];

// ── Above-grid: Service + Hair type (icons) + Target group ──────────────

export function CoiffeurAboveGrid() {
  const t = useTranslations("coiffeur.sections");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const SERVICES: PillOption[] = [
    { value: "schnitt", label: t("service_cut") },
    { value: "farbe", label: t("service_color") },
    { value: "straehnen", label: t("service_highlights") },
    { value: "behandlung", label: t("service_treatment") },
    { value: "styling", label: t("service_styling") },
  ];

  const HAIR_TYPES: IconOption[] = [
    {
      value: "lockig",
      label: t("hair_curly"),
      icon: <HairIcon d="M4 4c2 0 2 3 0 3s-2 3 0 3 2 3 0 3M10 4c2 0 2 3 0 3s-2 3 0 3 2 3 0 3M16 4c2 0 2 3 0 3s-2 3 0 3 2 3 0 3" />,
    },
    {
      value: "wellig",
      label: t("hair_wavy"),
      icon: <HairIcon d="M3 6c3-3 5 3 7 0s5 3 7 0M3 10c3-3 5 3 7 0s5 3 7 0M3 14c3-3 5 3 7 0s5 3 7 0" />,
    },
    {
      value: "glatt",
      label: t("hair_straight"),
      icon: <HairIcon d="M4 4v12M8 4v12M12 4v12M16 4v12" />,
    },
    {
      value: "fein",
      label: t("hair_fine"),
      icon: <HairIcon d="M7 4v12M10 4v12M13 4v12" />,
    },
    {
      value: "kraeftig",
      label: t("hair_thick"),
      icon: <HairIcon d="M3 4v12M7 4v12M10 4v12M13 4v12M17 4v12" />,
    },
    {
      value: "gefaerbt",
      label: t("hair_colored"),
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="10" cy="7" r="4" />
          <path d="M10 11v5M7 18h6" />
        </svg>
      ),
    },
  ];

  const TARGET_GROUPS: PillOption[] = [
    { value: "damen", label: t("gender_women") },
    { value: "herren", label: t("gender_men") },
    { value: "kinder", label: t("gender_kids") },
  ];

  const createQueryString = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === null) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      return params.toString();
    },
    [searchParams]
  );

  const handleSelect = (key: string) => (value: string | null) => {
    const qs = createQueryString(key, value);
    router.push(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  };

  return (
    <div className="bg-[--raised]/70 backdrop-blur-[6px] border border-s-ink/5 rounded-[16px] px-4 py-3 flex flex-col gap-2.5">
      <ScrollableFilterRow
        label={t("service_label")}
        options={SERVICES}
        activeValue={searchParams.get("service")}
        onSelect={handleSelect("service")}
      />
      <ScrollableFilterRow
        variant="icon"
        label={t("hairtype_label")}
        options={HAIR_TYPES}
        activeValue={searchParams.get("hairType")}
        onSelect={handleSelect("hairType")}
      />
      <ScrollableFilterRow
        label={t("target_label")}
        options={TARGET_GROUPS}
        activeValue={searchParams.get("target")}
        onSelect={handleSelect("target")}
      />
    </div>
  );
}

// ── Below-grid: Trending styles strip + AI matching CTA ───────────────────

export function CoiffeurBelowGrid() {
  const locale = useLocale();
  const t = useTranslations("coiffeur.sections");
  const tAi = useTranslations("coiffeur.ai_matcher");
  const [aiModalOpen, setAiModalOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col gap-12 pt-12 pb-4">
        {/* Trending styles strip */}
        <section>
          <div className="mb-6 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp size={18} className="text-s-coral" />
                <h2 className="font-heading font-bold text-[clamp(26px,3.5vw,44px)] tracking-[-0.02em] text-s-ink">
                  {t("trending_title")}
                </h2>
              </div>
              <p className="text-sm text-s-ink/50 font-body">
                {t("trending_subtitle")}
              </p>
            </div>
            <Link
              href={`/${locale}/discover`}
              className="flex items-center gap-1 text-sm text-s-coral hover:underline font-body shrink-0"
            >
              {t("trending_cta")} <ChevronRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {TRENDING_STYLES.map((style) => (
              <Link
                key={style.label}
                href={`/${locale}/discover?q=${encodeURIComponent(style.q)}`}
                className={`rounded-[14px] bg-gradient-to-br ${style.color} border border-s-ink/5 p-4 h-28 flex flex-col justify-between hover:shadow-v5-card-hover hover:-translate-y-[5px] transition-[transform,box-shadow] duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)]`}
              >
                <span className="text-[9px] font-heading font-bold uppercase tracking-[.10em] rounded-pill px-2 py-0.5 bg-[--raised]/60 text-s-ink/60 self-start">
                  {style.tag}
                </span>
                <p className="font-heading font-semibold text-s-ink text-sm">
                  {style.label}
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* AI matching CTA */}
        <section className="rounded-[16px] bg-gradient-to-r from-s-coral/5 to-s-coral/10 border border-s-coral/15 p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="w-12 h-12 rounded-pill bg-s-coral/10 flex items-center justify-center shrink-0">
            <Brain size={22} className="text-s-coral" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-heading font-semibold text-s-ink">
              {t("ai_teaser")}
            </p>
            <p className="text-sm text-s-ink/50 font-body mt-1">
              {t("ai_desc")}
            </p>
          </div>
          <button
            onClick={() => setAiModalOpen(true)}
            aria-label={tAi("ai_badge")}
            className="shrink-0 px-4 py-2 rounded-pill active:scale-[0.97] bg-s-coral text-white text-xs font-heading font-bold uppercase tracking-[.04em] hover:brightness-[1.06] shadow-coral-glow transition-[transform,filter] duration-150"
          >
            {t("ai_cta")}
          </button>
        </section>
      </div>

      <AiMatcherModal open={aiModalOpen} onClose={() => setAiModalOpen(false)} />
    </>
  );
}
