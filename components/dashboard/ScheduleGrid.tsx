"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Save, Check } from "lucide-react";
import Spinner from "@/components/ui/Spinner";

interface ScheduleEntry {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_alternate_week?: boolean;
  alternate_week_parity?: number;
  active: boolean;
}

interface ScheduleGridProps {
  staffMemberId: string;
}

export default function ScheduleGrid({ staffMemberId }: ScheduleGridProps) {
  const tc = useTranslations("common");
  const t = useTranslations("dashboard.schedule");

  const DAYS = [
    { value: 1, label: t("monday") },
    { value: 2, label: t("tuesday") },
    { value: 3, label: t("wednesday") },
    { value: 4, label: t("thursday") },
    { value: 5, label: t("friday") },
    { value: 6, label: t("saturday") },
    { value: 0, label: t("sunday") },
  ];

  const [schedule, setSchedule] = useState<ScheduleEntry[]>(
    DAYS.map(d => ({ day_of_week: d.value, start_time: "09:00", end_time: "18:00", active: false }))
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch(`/api/staff/my-schedule?staff_member_id=${staffMemberId}`)
      .then(r => r.json())
      .then(d => {
        const existing = d.schedules ?? [];
        setSchedule(DAYS.map(day => {
          const entry = existing.find((e: any) => e.day_of_week === day.value);
          return entry
            ? { ...entry, active: true }
            : { day_of_week: day.value, start_time: "09:00", end_time: "18:00", active: false };
        }));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [staffMemberId]);

  const updateDay = (dayOfWeek: number, field: string, value: any) => {
    setSchedule(prev => prev.map(s =>
      s.day_of_week === dayOfWeek ? { ...s, [field]: value } : s
    ));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const activeDays = schedule.filter(s => s.active);
    for (const entry of activeDays) {
      await fetch("/api/staff/my-schedule", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staff_member_id: staffMemberId,
          day_of_week: entry.day_of_week,
          start_time: entry.start_time,
          end_time: entry.end_time,
          is_alternate_week: entry.is_alternate_week ?? false,
          alternate_week_parity: entry.alternate_week_parity ?? 0,
        }),
      });
    }
    setSaving(false);
    setSaved(true);
  };

  if (loading) return <div className="flex justify-center py-8"><Spinner size="md" /></div>;

  return (
    <div className="space-y-3">
      {DAYS.map(day => {
        const entry = schedule.find(s => s.day_of_week === day.value)!;
        return (
          <div key={day.value} className={`flex items-center gap-3 p-3 rounded-[16px] border transition-colors ${entry.active ? "border-s-coral/20 bg-white dark:bg-s-dm-surface" : "border-s-ink/5 dark:border-white/5 bg-s-bg-surface dark:bg-s-dm-bg opacity-60"}`}>
            <label className="flex items-center gap-2 w-28 shrink-0 cursor-pointer">
              <input
                type="checkbox"
                checked={entry.active}
                onChange={e => updateDay(day.value, "active", e.target.checked)}
                className="w-4 h-4 rounded accent-s-coral"
              />
              <span className="text-sm font-medium text-s-ink dark:text-s-dm-text">{day.label}</span>
            </label>
            <input
              type="time"
              value={entry.start_time}
              onChange={e => updateDay(day.value, "start_time", e.target.value)}
              disabled={!entry.active}
              className="px-2 py-1.5 rounded-input border border-s-ink/10 dark:border-white/10 bg-white dark:bg-s-dm-bg text-sm text-s-ink dark:text-s-dm-text focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/20 disabled:opacity-40"
            />
            <span className="text-s-ink/30 dark:text-s-dm-text/30">—</span>
            <input
              type="time"
              value={entry.end_time}
              onChange={e => updateDay(day.value, "end_time", e.target.value)}
              disabled={!entry.active}
              className="px-2 py-1.5 rounded-input border border-s-ink/10 dark:border-white/10 bg-white dark:bg-s-dm-bg text-sm text-s-ink dark:text-s-dm-text focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/20 disabled:opacity-40"
            />
            <label className="flex items-center gap-1 text-xs text-s-ink/40 dark:text-s-dm-text/40 ml-auto cursor-pointer">
              <input
                type="checkbox"
                checked={entry.is_alternate_week ?? false}
                onChange={e => updateDay(day.value, "is_alternate_week", e.target.checked)}
                disabled={!entry.active}
                className="w-3 h-3 rounded accent-s-coral"
              />
              {t("alternating")}
            </label>
          </div>
        );
      })}

      <div className="sticky bottom-0 bg-white dark:bg-s-dm-surface border-t border-s-ink/5 dark:border-white/5 p-3 z-10 -mx-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2.5 rounded-btn active:scale-[0.98] bg-s-coral text-white text-[11px] font-heading font-bold uppercase tracking-[.06em] hover:brightness-[1.06] transition-all disabled:opacity-50"
        >
          {saving ? <Spinner size="sm" invert /> : saved ? <Check size={14} /> : <Save size={14} />}
          {saved ? tc("saved") : tc("save")}
        </button>
      </div>
    </div>
  );
}
