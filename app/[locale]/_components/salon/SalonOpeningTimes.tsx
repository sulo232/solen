"use client";

import * as React from "react";
import { DAY_KEYS, type DayKey } from "./_shared";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

/**
 * SalonOpeningTimes — V2-D53.3 (2026-05-11).
 *
 * Day-by-day list, Fresha anatomy: no dots, today bold, closed grey.
 * Today's row is bold. No outer card border — whitespace + dividers only.
 *
 * Designed to sit in the side-by-side grid with SalonAdditionalInfo on
 * desktop. Renders as a simple list on mobile in normal flow.
 */
export function SalonOpeningTimes({
  hours,
  todayKey,
}: {
  hours: Record<string, { open: string; close: string }> | null;
  /** Precomputed server-side (2026-07-04 hydration fix); never derive from
   * `new Date()` here. See lib/salon-detail.ts. */
  todayKey: DayKey;
}) {
  const t = useTranslations("salonDetail");
  if (!hours) return null;

  return (
    <section id="section-hours" className="scroll-mt-24">
      {/* V3-D202 (A13): font-body → font-display + Scale B. */}
      <h2 className="font-display text-[clamp(18px,2vw,20px)] font-semibold leading-[1.2] tracking-[-0.02em] text-s-ink">
        {t("openingHours")}
      </h2>

      <ul className="mt-4 space-y-2.5">
        {DAY_KEYS.map((day) => {
          const isToday = day === todayKey;
          const dayHours = hours[day];
          const isOpen = Boolean(dayHours);
          return (
            /* Hours rows: per-day status dot RESTORED (owner 2026-06-12: 'I like the
               green dot on the date section, bring that back') in the Fresha s-open
               green; today bold, closed grey. */
            <li
              key={day}
              className={cn(
                "font-body flex items-center justify-between text-[15px]",
                isToday ? "font-semibold text-s-ink" : "text-s-ink-2"
              )}
            >
              <span className="inline-flex items-center gap-3">
                <span
                  className={cn("h-2 w-2 shrink-0 rounded-full", isOpen ? "bg-s-open" : "bg-s-ink-2/40")}
                  aria-hidden
                />
                {t(day)}
              </span>
              <span className={cn(!isOpen && "text-s-ink-2")}>
                {dayHours ? t("hoursRange", { open: dayHours.open, close: dayHours.close }) : t("closed")}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
