"use client";

import * as React from "react";
import { ChevronRight, Diamond, Gem, Crown, UserPlus } from "lucide-react";
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
      subtitle: "Erfahren Sie, wie Sie Punkte sammeln",
      desc: "Sammeln Sie bei jedem Besuch automatisch Treuepunkte. Je öfter Sie buchen, desto mehr.",
    },
    {
      icon: Gem,
      title: "Belohnungen",
      subtitle: "Lösen Sie spannende Belohnungen ein",
      desc: "Tauschen Sie gesammelte Punkte gegen Rabatte, kostenlose Services oder Geschenke ein.",
    },
    {
      icon: Crown,
      title: "Stufen",
      subtitle: "Entdecken Sie unser Stufenprogramm",
      desc: "Erreichen Sie höhere Treuestufen für exklusive Vorteile — von Bronze bis Platin.", // em-dash-ok: pre-existing, unrelated to this edit
    },
    {
      icon: UserPlus,
      title: "Freund:in einladen",
      subtitle: "Empfehlen Sie uns weiter",
      desc: "Laden Sie Freund:innen zu Solen ein, Sie beide erhalten eine Belohnung beim ersten Termin.",
    },
  ];

  return (
    <section id="section-loyalty">
      {/* V3-D202 (A16): font-body → font-display + Scale B. */}
      <h2 className="font-display text-[clamp(18px,2vw,20px)] font-semibold leading-[1.2] tracking-[-0.02em] text-s-ink">
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
                className="font-body group flex w-full items-center gap-4 rounded-2xl border border-s-border bg-white p-5 text-left transition-[box-shadow,transform] hover:shadow-elevation-2 active:scale-[0.99] active:duration-[80ms] active:ease-glide md:p-6"
              >
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white md:h-12 md:w-12">
                  <Icon size={20} strokeWidth={2.2} className="text-s-ink" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-semibold text-s-ink md:text-[15px]">
                    {r.title}
                  </div>
                  <div className="mt-0.5 text-[12px] text-s-ink-2 md:text-[13px]">
                    {r.subtitle}
                  </div>
                </div>
                <ChevronRight
                  size={16}
                  strokeWidth={1.9}
                  className={cn(
                    "shrink-0 text-s-ink-2 transition-transform duration-150",
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
