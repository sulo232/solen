"use client";

import { useCallback } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Users, Zap, ChevronRight } from "lucide-react";
import { useLocale } from "next-intl";

// ── Discovery signal filter pills ─────────────────────────────────────────

const FADE_TYPES = ["Skin Fade", "Low Fade", "Mid Fade", "High Fade"] as const;
const HAIR_TEXTURES = ["Afro", "Lockig", "Wellig", "Glatt"] as const;
const BARBER_STYLES = ["Klassisch", "Modern", "Urban"] as const;

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
      <span className="text-[11px] tracking-[0.2em] uppercase text-s-amber font-heading font-bold shrink-0">{label}</span>
      {options.map((opt, i) => (
        <button
          key={opt}
          onClick={() => onSelect(activeIndex === i ? null : i)}
          className={`px-3 py-1.5 rounded-pill text-[11px] font-heading font-bold uppercase tracking-[.06em] transition-all ${
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
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();

  // Read filter state from URL
  const activeFade = searchParams.get("fade");
  const activeTexture = searchParams.get("texture");
  const activeStyle = searchParams.get("style");

  const fadeIdx = activeFade !== null ? FADE_TYPES.indexOf(activeFade as typeof FADE_TYPES[number]) : null;
  const textureIdx = activeTexture !== null ? HAIR_TEXTURES.indexOf(activeTexture as typeof HAIR_TEXTURES[number]) : null;
  const styleIdx = activeStyle !== null ? BARBER_STYLES.indexOf(activeStyle as typeof BARBER_STYLES[number]) : null;

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

  const handleSelect = (key: string, options: readonly string[], idx: number | null, currentIdx: number | null) => {
    const value = idx === currentIdx ? null : idx !== null ? options[idx] : null;
    const qs = createQueryString(key, value);
    router.push(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Walk-in teaser — tier-2 glassmorphism (Zone 2) with pulsing sage dot */}
      <div className="flex items-center justify-between gap-4 px-4 py-3 bg-white/[.62] dark:bg-[rgba(38,32,26,.70)] backdrop-blur-[16px] saturate-[1.2] dark:backdrop-saturate-100 border border-white/55 dark:border-white/10 rounded-[20px] shadow-warm-md" style={{ boxShadow: "var(--sh-md), inset 0 1px 0 rgba(255,255,255,.70)" }}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-pill bg-s-amber/15 flex items-center justify-center shrink-0">
            <Users size={16} className="text-s-amber" />
          </div>
          <div className="min-w-0">
            <p className="font-heading font-semibold text-s-ink dark:text-s-dm-text text-sm flex items-center gap-2">
              Kein Termin? Einfach reingehen.
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-pill bg-s-sage opacity-75" />
                <span className="relative inline-flex rounded-pill h-2.5 w-2.5 bg-s-sage" />
              </span>
            </p>
            <p className="text-xs text-s-ink/50 dark:text-s-dm-text/50 font-body">
              Barbershops mit Walk-in Queue — sieh Wartezeiten in Echtzeit
            </p>
          </div>
        </div>
        <Link
          href={`/${locale}/barbershop?walkin=true`}
          className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-btn bg-s-amber text-white text-[11px] font-heading font-bold uppercase tracking-[.06em] hover:brightness-[1.06] transition-colors shadow-warm-sm"
        >
          <Zap size={12} />
          Walk-ins
        </Link>
      </div>

      {/* Discovery signal filter pills */}
      <div className="bg-white/70 dark:bg-s-dm-surface/70 backdrop-blur-sm border border-s-ink/5 dark:border-white/5 rounded-[20px] px-4 py-3 flex flex-col gap-3">
        <FilterPills
          label="Fade-Typ"
          options={FADE_TYPES}
          activeIndex={fadeIdx !== null && fadeIdx >= 0 ? fadeIdx : null}
          onSelect={(i) => handleSelect("fade", FADE_TYPES, i, fadeIdx)}
          accentClass="bg-s-amber"
        />
        <FilterPills
          label="Haartyp"
          options={HAIR_TEXTURES}
          activeIndex={textureIdx !== null && textureIdx >= 0 ? textureIdx : null}
          onSelect={(i) => handleSelect("texture", HAIR_TEXTURES, i, textureIdx)}
          accentClass="bg-s-amber"
        />
        <FilterPills
          label="Stil"
          options={BARBER_STYLES}
          activeIndex={styleIdx !== null && styleIdx >= 0 ? styleIdx : null}
          onSelect={(i) => handleSelect("style", BARBER_STYLES, i, styleIdx)}
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
          <h2 className="font-heading font-bold text-[clamp(26px,3.5vw,44px)] tracking-[-0.02em] text-s-ink dark:text-s-dm-text">
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
