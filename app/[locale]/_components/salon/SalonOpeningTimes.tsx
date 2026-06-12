"use client";

import * as React from "react";
import { DAY_KEYS, DAY_LABEL, type DayKey } from "./_shared";
import { cn } from "@/lib/utils";

/**
 * SalonOpeningTimes — V2-D53.3 (2026-05-11).
 *
 * Day-by-day list with green dot for open days, gray dot for closed.
 * Today's row is bold. No outer card border — whitespace + dividers only.
 *
 * Designed to sit in the side-by-side grid with SalonAdditionalInfo on
 * desktop. Renders as a simple list on mobile in normal flow.
 */
export function SalonOpeningTimes({
  hours,
}: {
  hours: Record<string, { open: string; close: string }> | null;
}) {
  if (!hours) return null;

  const todayKey = (["sun", "mon", "tue", "wed", "thu", "fri", "sat"][new Date().getDay()]) as DayKey;

  return (
    <section id="section-hours" className="scroll-mt-24">
      {/* V3-D202 (A13): font-body → font-display + Scale B. */}
      <h2 className="font-display text-[clamp(18px,2vw,20px)] font-semibold leading-[1.2] tracking-[-0.02em] text-s-ink">
        Öffnungszeiten
      </h2>

      <ul className="mt-4 space-y-2.5">
        {DAY_KEYS.map((day) => {
          const isToday = day === todayKey;
          const dayHours = hours[day];
          const isOpen = Boolean(dayHours);
          return (
            <li
              key={day}
              className={cn(
                "font-body flex items-center justify-between text-[14px]",
                isToday ? "font-semibold text-s-ink" : "text-s-ink-2"
              )}
            >
              <span className="inline-flex items-center gap-3">
                <span
                  className={cn(
                    "h-2 w-2 shrink-0 rounded-full",
                    isOpen ? "bg-s-open" : "bg-s-ink-3/40"
                  )}
                  aria-hidden
                />
                {DAY_LABEL[day]}
              </span>
              <span>
                {dayHours ? `${dayHours.open} – ${dayHours.close}` : "Geschlossen"}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
