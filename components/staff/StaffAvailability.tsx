"use client";

import { useEffect, useState } from "react";
import { format, addDays } from "date-fns";
import { de, enGB, fr, it } from "date-fns/locale";

interface StaffAvailabilityProps {
  staffId: string;
  locale: string;
}

export default function StaffAvailability({ staffId, locale }: StaffAvailabilityProps) {
  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState<any[]>([]);

  useEffect(() => {
    async function fetchAvailability() {
      try {
        const res = await fetch(`/api/staff/${staffId}/availability`);
        if (res.ok) {
          const { data } = await res.json();
          setSchedules(data.schedules || []);
        }
      } catch (e) {
        console.error("Failed to load staff availability", e);
      } finally {
        setLoading(false);
      }
    }
    fetchAvailability();
  }, [staffId]);

  if (loading) {
    return (
      <div className="flex gap-3 overflow-x-auto no-scrollbar py-2 animate-pulse mt-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="min-w-[110px] h-[90px] rounded-[12px] bg-s-ink/5 dark:bg-white/5" />
        ))}
      </div>
    );
  }

  // Pre-calculate the next 7 days and check schedules.
  const dateLocale = locale === "de" ? de : locale === "fr" ? fr : locale === "it" ? it : enGB;
  const today = new Date();
  const next7Days = Array.from({ length: 7 }).map((_, i) => addDays(today, i));

  return (
    <div className="mt-6 mb-2">
      <h3 className="font-heading font-semibold text-sm text-s-ink dark:text-s-dm-text mb-3">
        {locale === "de" ? "Verfügbarkeit" : "Availability"}
      </h3>
      <div className="flex gap-3 items-stretch overflow-x-auto no-scrollbar pb-2">
        {next7Days.map((date) => {
          // Note: PostgreSQL `isodow` (1-7) or generic JS `getDay()` (0-6).
          const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay(); // map JS Sun(0) to ISO(7)
          const daySchedule = schedules.find((s) => s.day_of_week === dayOfWeek || s.day_of_week === date.getDay());

          return (
            <div
              key={date.toISOString()}
              className={`shrink-0 min-w-[110px] p-3 rounded-[12px] border transition-[background-color,border-color,box-shadow] ${
                daySchedule
                  ? "border-s-coral/30 bg-s-coral/5"
                  : "border-s-ink/5 dark:border-white/5 bg-s-bg-sunken dark:bg-s-dm-bg opacity-60"
              }`}
            >
              <p className="text-xs font-heading font-bold text-s-ink dark:text-s-dm-text capitalize mb-1">
                {format(date, "EEEE", { locale: dateLocale })}
              </p>
              <p className="text-[10px] text-s-ink/50 dark:text-s-dm-text/50 uppercase tracking-widest font-heading mb-2">
                {format(date, "dd MMM", { locale: dateLocale })}
              </p>
              {daySchedule ? (
                <p className="text-xs font-medium text-s-green dark:text-s-green/80 truncate">
                  {daySchedule.start_time.slice(0, 5)} - {daySchedule.end_time.slice(0, 5)}
                </p>
              ) : (
                <p className="text-[11px] text-s-ink/30 dark:text-s-dm-text/30">
                  {locale === "de" ? "Nicht verfügbar" : "Unavailable"}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
