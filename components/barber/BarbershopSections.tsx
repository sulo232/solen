"use client";

import { useCallback } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Users, Zap, ChevronRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import ScrollableFilterRow, { type PillOption } from "@/components/ui/ScrollableFilterRow";

// ── Filter options ────────────────────────────────────────────────────────

const FADE_TYPES: PillOption[] = [
  { value: "Skin Fade", label: "Skin Fade" },
  { value: "Low Fade", label: "Low Fade" },
  { value: "Mid Fade", label: "Mid Fade" },
  { value: "High Fade", label: "High Fade" },
];

const HAIR_TEXTURES: PillOption[] = [
  { value: "Afro", label: "Afro" },
  { value: "Lockig", label: "Lockig" },
  { value: "Wellig", label: "Wellig" },
  { value: "Glatt", label: "Glatt" },
  { value: "Lang", label: "Lang" },
  { value: "Mittellang", label: "Mittellang" },
];

const BARBER_STYLES: PillOption[] = [
  { value: "Klassisch", label: "Klassisch" },
  { value: "Modern", label: "Modern" },
  { value: "Urban", label: "Urban" },
];

const BART_TYPES: PillOption[] = [
  { value: "Bartschnitt", label: "Bartschnitt" },
  { value: "Rasur", label: "Rasur" },
  { value: "Konturierung", label: "Konturierung" },
];

// ── Above-grid: Walk-in teaser + filter pills ──────────────────────────────

export function BarbershopAboveGrid() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("barber.sections");

  // Stable helper that sets one param without wiping others
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
    <div className="flex flex-col gap-4">
      {/* Walk-in teaser — tier-2 glassmorphism (Zone 2) with pulsing sage dot */}
      <div className="flex items-center justify-between gap-4 px-4 py-3 bg-white/[.62] dark:bg-[rgba(38,32,26,.70)] backdrop-blur-[16px] saturate-[1.2] dark:backdrop-saturate-100 border border-white/55 dark:border-white/10 rounded-[20px] shadow-warm-md" style={{ boxShadow: "var(--sh-md), var(--glass-shadow-inset)" }}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-pill bg-s-amber/15 flex items-center justify-center shrink-0">
            <Users size={16} className="text-s-amber" />
          </div>
          <div className="min-w-0">
            <p className="font-heading font-semibold text-s-ink dark:text-s-dm-text text-sm flex items-center gap-2">
              {t("walkin_teaser")}
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-pill bg-s-sage opacity-75" />
                <span className="relative inline-flex rounded-pill h-2.5 w-2.5 bg-s-sage" />
              </span>
            </p>
            <p className="text-xs text-s-ink/50 dark:text-s-dm-text/50 font-body">
              {t("walkin_desc")}
            </p>
          </div>
        </div>
        <Link
          href={`/${locale}/barbershop?walkin=true`}
          className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-btn bg-s-amber text-white text-[11px] font-heading font-bold uppercase tracking-[.06em] hover:brightness-[1.06] transition-colors shadow-warm-sm"
        >
          <Zap size={12} />
          {t("walkin_cta")}
        </Link>
      </div>

      {/* Discovery signal filter pills */}
      <div className="bg-white/70 dark:bg-s-dm-surface/70 backdrop-blur-sm border border-s-ink/5 dark:border-white/5 rounded-[20px] px-4 py-3 flex flex-col gap-2.5">
        <ScrollableFilterRow
          label={t("filter_fade_type")}
          options={FADE_TYPES}
          activeValue={searchParams.get("fade")}
          onSelect={handleSelect("fade")}
        />
        <ScrollableFilterRow
          label={t("filter_hair_type")}
          options={HAIR_TEXTURES}
          activeValue={searchParams.get("texture")}
          onSelect={handleSelect("texture")}
        />
        <ScrollableFilterRow
          label={t("filter_style")}
          options={BARBER_STYLES}
          activeValue={searchParams.get("style")}
          onSelect={handleSelect("style")}
        />
        <ScrollableFilterRow
          label="Bart"
          options={BART_TYPES}
          activeValue={searchParams.get("bart")}
          onSelect={handleSelect("bart")}
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
  const t = useTranslations("barber");
  const ts = useTranslations("barber.sections");
  return (
    <section className="pt-12 pb-4">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="font-heading font-bold text-[clamp(26px,3.5vw,44px)] tracking-[-0.02em] text-s-ink dark:text-s-dm-text">
            {t("roster_title")}
          </h2>
          <p className="text-sm text-s-ink/50 dark:text-s-dm-text/50 font-body mt-1">
            {ts("roster_subtitle")}
          </p>
        </div>
        <Link
          href={`/${locale}/barbershop`}
          className="flex items-center gap-1 text-sm text-s-amber hover:underline font-body shrink-0"
        >
          {ts("roster_all")} <ChevronRight size={14} />
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {FEATURED_BARBERS.map((barber) => (
          <div
            key={barber.id}
            className="rounded-[16px] bg-white dark:bg-s-dm-surface border border-s-ink/5 dark:border-white/5 p-4 flex flex-col items-center text-center shadow-warm-sm hover:shadow-warm-xl hover:-translate-y-[5px] transition-all duration-250"
          >
            <div className="w-14 h-14 rounded-pill bg-s-amber/10 flex items-center justify-center mb-3">
              <span className="font-heading font-bold text-s-amber text-lg">{barber.initials}</span>
            </div>
            <p className="font-heading font-semibold text-s-ink dark:text-s-dm-text text-sm">{barber.name}</p>
            <p className="text-xs text-s-ink/50 dark:text-s-dm-text/50 font-body mt-0.5">{barber.speciality}</p>
            <div className="flex gap-1 flex-wrap justify-center mt-2">
              {barber.styles.map((s) => (
                <span key={s} className="text-[9px] px-2 py-0.5 rounded-pill bg-s-amber-subtle text-s-amber-text font-heading font-bold uppercase tracking-[.10em]">
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
