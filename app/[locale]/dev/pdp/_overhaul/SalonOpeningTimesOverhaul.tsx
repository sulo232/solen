"use client";

// exists-check: net-new vs app/[locale]/_components/salon/SalonOpeningTimes.tsx (real,
// unmodified). `npm run exists` (2026-07-24) confirms SalonOpeningTimes is the single hours-list
// section. GATE-FORCED DEVIATION: see StatusInlineOverhaul.tsx header , the per-day open dot
// repoints to `s-success` (#16A34A), not the research's #1F8900, because #1F8900 fails the live
// muted-color-gate. Day labels and "Closed" text are re-authored in English per mockup law
// (the real DAY_LABEL constant is German); the day ORDER still comes from the real DAY_KEYS.

import * as React from "react";
import { DAY_KEYS, type DayKey } from "../../../_components/salon/_shared";
import { cn } from "@/lib/utils";

const DAY_LABEL_EN: Record<DayKey, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

export function SalonOpeningTimesOverhaul({
  hours,
  todayKey,
}: {
  hours: Record<string, { open: string; close: string }> | null;
  /** Precomputed server-side (2026-07-04 hydration fix); never derive from
   * `new Date()` here. See lib/salon-detail.ts. */
  todayKey: DayKey;
}) {
  if (!hours) return null;

  return (
    <section id="section-hours" className="scroll-mt-24">
      <h2 className="font-display text-[clamp(18px,2vw,20px)] font-semibold leading-[1.2] tracking-[-0.02em] text-s-ink">
        Opening hours
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
                "font-body flex items-center justify-between text-[15px]",
                isToday ? "font-semibold text-s-ink" : "text-s-ink-2"
              )}
            >
              <span className="inline-flex items-center gap-3">
                <span
                  className={cn("h-2 w-2 shrink-0 rounded-full", isOpen ? "bg-s-success" : "bg-s-ink-3/40")}
                  aria-hidden
                />
                {DAY_LABEL_EN[day]}
              </span>
              <span className={cn(!isOpen && "text-s-ink-3")}>
                {dayHours ? `${dayHours.open} to ${dayHours.close}` : "Closed"}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
