"use client";

import { useEffect, useState } from "react";
import { format, addDays, isSameDay } from "date-fns";
import { de, enGB, fr, it } from "date-fns/locale";

interface StaffAvailabilityProps {
  staffId: string;
  locale: string;
}

interface DaySchedule {
  day_of_week: number;
  start_time: string;
  end_time: string;
}

/**
 * StaffAvailability — V3-D421 (2026-06-01) redesign (Option A).
 *
 * Was: 7 identical cards, every closed day rendered a greyed "Nicht verfügbar"
 * at 60% opacity, so an empty week read as broken. Plus a duplicate "Verfügbarkeit"
 * heading (this component's h3 sat under the section title in StaffProfilePage).
 *
 * Now (calm pass 2026-06-11): lead with the answer (next open day + start time
 * in the ONE green box), then day-by-day rows in the SalonOpeningTimes pattern
 * (status dot + label left, hours right, today bold — no tiles, no ink ring,
 * no per-day green text), and ONE honest empty-state when the whole week is
 * closed. No inner heading — the section title lives in the page.
 *
 * Data note: the API returns WEEKLY recurring schedules (day_of_week + hours),
 * not bookable slots, so the strip shows working hours, not slot counts.
 */
export default function StaffAvailability({ staffId, locale }: StaffAvailabilityProps) {
  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState<DaySchedule[]>([]);

  useEffect(() => {
    const ac = new AbortController();
    async function fetchAvailability() {
      try {
        const res = await fetch(`/api/staff/${staffId}/availability`, { signal: ac.signal });
        if (res.ok) {
          const { data } = await res.json();
          setSchedules(data.schedules || []);
        }
      } catch (e) {
        if ((e as { name?: string })?.name !== "AbortError") {
          console.error("[StaffAvailability] failed to load availability:", e);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchAvailability();
    return () => ac.abort();
  }, [staffId]);

  const dateLocale = locale === "de" ? de : locale === "fr" ? fr : locale === "it" ? it : enGB;
  const t = (deStr: string, enStr: string) => (locale === "de" ? deStr : enStr);

  // Match a calendar date to a weekly schedule (handle ISO dow 1-7 vs JS 0-6).
  const scheduleFor = (date: Date): DaySchedule | null => {
    const jsDow = date.getDay(); // 0=Sun..6=Sat
    const isoDow = jsDow === 0 ? 7 : jsDow; // 1=Mon..7=Sun
    return schedules.find((s) => s.day_of_week === isoDow || s.day_of_week === jsDow) ?? null;
  };

  if (loading) {
    return (
      <div className="mt-4 space-y-2.5 animate-pulse">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-[20px] rounded-[6px] bg-s-ink/5" />
        ))}
      </div>
    );
  }

  const today = new Date();
  const days = Array.from({ length: 7 }).map((_, i) => addDays(today, i));
  const firstOpen = days.find((d) => scheduleFor(d));

  // Whole week closed → ONE honest empty-state, not 7 dead cards.
  if (!firstOpen) {
    return (
      <div className="mt-4 rounded-[14px] border border-dashed border-s-border px-5 py-6 text-center">
        <p className="font-display text-[15px] font-semibold text-s-ink">
          {t("Diese Woche nicht verfügbar", "Not available this week")}
        </p>
        <p className="mt-1 font-body text-[13px] text-s-ink-2">
          {t("Schau bald wieder vorbei.", "Check back soon.")}
        </p>
      </div>
    );
  }

  const fo = scheduleFor(firstOpen)!;
  const nextLabel = isSameDay(firstOpen, today)
    ? t("Heute", "Today")
    : format(firstOpen, "EEEE, d. MMM", { locale: dateLocale });

  return (
    <div className="mt-4">
      {/* Lead with the answer */}
      <div className="mb-4 flex items-center gap-3 rounded-[14px] bg-s-success-bg px-4 py-3">
        <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-s-success" aria-hidden />
        <div className="min-w-0">
          <div className="font-body text-[12.5px] font-semibold text-s-ink-2">
            {t("Nächster Termin", "Next opening")}
          </div>
          <div className="font-display text-[15px] font-semibold capitalize leading-tight text-s-ink">
            {nextLabel} <span className="text-s-ink-3">|</span> {t("ab", "from")} {fo.start_time.slice(0, 5)}
          </div>
        </div>
      </div>

      {/* Day-by-day rows — same calm pattern as SalonOpeningTimes (dot + label
          left, hours right, today bold). Replaces the tile strip whose ink ring
          + per-day green hours read cluttered (owner 2026-06-11). */}
      <ul className="space-y-2.5">
        {days.map((date) => {
          const s = scheduleFor(date);
          const isToday = isSameDay(date, today);
          return (
            <li
              key={date.toISOString()}
              className={`font-body flex items-center justify-between text-[14px] ${
                isToday ? "font-semibold text-s-ink" : "text-s-ink-2"
              }`}
            >
              <span className="inline-flex items-center gap-3">
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${s ? "bg-s-success" : "bg-s-ink-3/40"}`}
                  aria-hidden
                />
                <span className="capitalize">
                  {isToday
                    ? t("Heute", "Today")
                    : format(date, "EEEE, d. MMM", { locale: dateLocale })}
                </span>
              </span>
              <span className="tabular-nums">
                {s
                  ? `${s.start_time.slice(0, 5)} – ${s.end_time.slice(0, 5)}`
                  : t("Geschlossen", "Closed")}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
