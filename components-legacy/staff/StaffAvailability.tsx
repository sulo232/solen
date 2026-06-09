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
 * Now: lead with the answer (next open day + start time), a compact week strip
 * (open days = ink date + working hours in success; closed = calm "zu"; today =
 * ink ring), and ONE honest empty-state when the whole week is closed. No inner
 * heading — the section title lives in the page.
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
      <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar pb-1 animate-pulse">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-[78px] w-[62px] shrink-0 rounded-[14px] bg-s-ink/5" />
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
          <div className="font-body text-[11px] font-semibold uppercase tracking-[0.08em] text-s-ink-2">
            {t("Nächster Termin", "Next opening")}
          </div>
          <div className="font-display text-[15px] font-semibold capitalize leading-tight text-s-ink">
            {nextLabel} <span className="text-s-ink-3">|</span> {t("ab", "from")} {fo.start_time.slice(0, 5)}
          </div>
        </div>
      </div>

      {/* Week strip */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {days.map((date) => {
          const s = scheduleFor(date);
          const isToday = isSameDay(date, today);
          const hours = s ? `${parseInt(s.start_time, 10)}-${parseInt(s.end_time, 10)}` : null;
          return (
            <div
              key={date.toISOString()}
              className={`flex w-[62px] shrink-0 flex-col items-center rounded-[14px] border border-s-border bg-white px-1.5 py-2.5 text-center ${
                isToday ? "ring-2 ring-s-ink" : ""
              }`}
            >
              <span className={`font-body text-[11px] font-semibold capitalize ${s ? "text-s-ink-2" : "text-s-ink-3"}`}>
                {format(date, "EEEEEE", { locale: dateLocale })}
              </span>
              <span className={`font-display text-[18px] font-semibold leading-none mt-1 ${s ? "text-s-ink" : "text-s-ink-3"}`}>
                {format(date, "d")}
              </span>
              {hours ? (
                <span className="mt-2 font-body text-[10.5px] font-semibold tabular-nums text-s-success">{hours}</span>
              ) : (
                <span className="mt-2 font-body text-[10.5px] text-s-ink-3">{t("zu", "closed")}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
