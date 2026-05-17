"use client";

import * as React from "react";
import { ChevronRight, Diamond, Sparkles, Crown, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * SalonLoyalty — V2-D53.3 (2026-05-11).
 *
 * 4 program-pillar cards stacked vertically. Each card = icon + title +
 * subtitle + chevron, with hover lift. Currently rendered as inline
 * disclosure (button toggles description text below) because the deeper
 * `/loyalty/{type}` surfaces don't exist yet. When they ship, swap each
 * `<button>` for `<Link>` and drop the openIdx state.
 *
 * Card text follows Fresha pattern: short Title + descriptive Subtitle.
 *
 * Brand: emerald icons + chevron, no purple. Matches Solen brand discipline.
 */
export function SalonLoyalty() {
  const [openIdx, setOpenIdx] = React.useState<number | null>(null);

  const rows: {
    icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
    title: string;
    subtitle: string;
    desc: string;
  }[] = [
    {
      icon: Diamond,
      title: "Punkte sammeln",
      subtitle: "Erfahre, wie du Punkte sammelst",
      desc: "Sammle bei jedem Besuch automatisch Treuepunkte. Je öfter du buchst, desto mehr.",
    },
    {
      icon: Sparkles,
      title: "Belohnungen",
      subtitle: "Lös spannende Belohnungen ein",
      desc: "Tausche gesammelte Punkte gegen Rabatte, kostenlose Services oder Geschenke ein.",
    },
    {
      icon: Crown,
      title: "Stufen",
      subtitle: "Entdecke unser Stufenprogramm",
      desc: "Erreiche höhere Treuestufen für exklusive Vorteile — von Bronze bis Platin.",
    },
    {
      icon: UserPlus,
      title: "Freund:in einladen",
      subtitle: "Empfiehl uns weiter",
      desc: "Lade Freund:innen zu Solen ein und erhaltet beide eine Belohnung beim ersten Termin.",
    },
  ];

  return (
    <section id="section-loyalty">
      <h2 className="font-body text-[18px] font-bold leading-tight tracking-tight text-s-ink md:text-[22px]">
        Treueprogramm
      </h2>

      <ul className="mt-5 space-y-3">
        {rows.map((r, i) => {
          const isOpen = openIdx === i;
          const Icon = r.icon;
          return (
            <li key={r.title}>
              <button
                type="button"
                onClick={() => setOpenIdx(isOpen ? null : i)}
                aria-expanded={isOpen}
                className="font-body group flex w-full items-center gap-4 rounded-2xl border border-s-border bg-white p-4 text-left transition-shadow hover:shadow-[0_2px_12px_rgba(0,0,0,0.04)] md:p-5"
              >
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-s-brand-subtle md:h-12 md:w-12">
                  <Icon size={20} strokeWidth={2} className="text-s-brand" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-semibold text-s-ink md:text-[15px]">
                    {r.title}
                  </div>
                  <div className="mt-0.5 text-[12px] text-s-ink-3 md:text-[13px]">
                    {r.subtitle}
                  </div>
                </div>
                <ChevronRight
                  size={16}
                  strokeWidth={2.5}
                  className={cn(
                    "shrink-0 text-s-ink-3 transition-transform duration-200",
                    isOpen && "rotate-90"
                  )}
                />
              </button>
              {isOpen && (
                <p className="font-body mt-2 pl-4 pr-4 text-[13px] leading-relaxed text-s-ink-2 md:pl-[60px]">
                  {r.desc}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
