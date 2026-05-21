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
    <section>
      <h2 className="font-body text-[18px] font-bold leading-tight tracking-tight text-s-ink md:text-[20px]">
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
                    isOpen ? "bg-emerald-500" : "bg-s-ink-3/40"
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
