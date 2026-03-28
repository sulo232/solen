"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Coffee } from "lucide-react";
import Spinner from "@/components/ui/Spinner";
import { useTranslations } from "next-intl";

interface Break {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

interface BreakManagerProps {
  staffMemberId: string;
}

export default function BreakManager({ staffMemberId }: BreakManagerProps) {
  const t = useTranslations("dashboard.break_manager") as any;
  const [breaks, setBreaks] = useState<Break[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [startTime, setStartTime] = useState("12:00");
  const [endTime, setEndTime] = useState("13:00");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadBreaks = () => {
    fetch(`/api/staff/breaks?staff_member_id=${staffMemberId}`)
      .then((r) => {
        if (!r.ok) throw new Error("fetch failed");
        return r.json();
      })
      .then((d) => setBreaks(d.breaks ?? d.items ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadBreaks(); }, [staffMemberId]);

  const handleAdd = async () => {
    setFormError(null);
    if (endTime <= startTime) {
      setFormError(t("invalidTimes"));
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/staff/breaks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staff_member_id: staffMemberId,
          day_of_week: dayOfWeek,
          start_time: startTime,
          end_time: endTime,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setFormError(d.error ?? d.message ?? t("saveError"));
        return;
      }
      setShowAdd(false);
      loadBreaks();
    } catch {
      setFormError(t("saveError"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t("confirmDelete"))) return;
    setDeleteError(null);
    const previous = [...breaks];
    setBreaks((prev) => prev.filter((b) => b.id !== id));
    try {
      const res = await fetch(`/api/staff/breaks?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("delete failed");
    } catch {
      setBreaks(previous);
      setDeleteError(t("deleteError"));
    }
  };

  if (loading) return <div className="flex justify-center py-6"><Spinner size="md" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading font-bold text-sm text-s-ink dark:text-s-dm-text flex items-center gap-2">
          <Coffee size={14} className="text-s-coral" /> {t("title")}
        </h3>
        <button
          onClick={() => { setShowAdd(!showAdd); setFormError(null); }}
          className="flex items-center gap-1 text-xs text-s-coral hover:text-s-coral/80 transition-colors"
        >
          <Plus size={12} /> {t("add")}
        </button>
      </div>

      {deleteError && (
        <p role="alert" className="text-xs text-s-coral mb-3">{deleteError}</p>
      )}

      {showAdd && (
        <div className="rounded-[16px] border border-s-coral/20 bg-s-coral/5 p-4 mb-4 space-y-3">
          <div>
            <label className="text-xs text-s-ink/50 dark:text-s-dm-text/50 mb-1 block">{t("weekday")}</label>
            <select
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(Number(e.target.value))}
              className="w-full px-2 py-1.5 rounded-input border border-s-ink/10 dark:border-white/10 bg-white dark:bg-s-dm-bg text-sm text-s-ink dark:text-s-dm-text focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/20"
            >
              {[0, 1, 2, 3, 4, 5, 6].map((v) => (
                <option key={v} value={v}>{t(`day_${v}` as any)}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-s-ink/50 dark:text-s-dm-text/50 mb-1 block">{t("from")}</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => { setStartTime(e.target.value); setFormError(null); }}
                className="w-full px-2 py-1.5 rounded-input border border-s-ink/10 dark:border-white/10 bg-white dark:bg-s-dm-bg text-sm text-s-ink dark:text-s-dm-text focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/20"
              />
            </div>
            <div>
              <label className="text-xs text-s-ink/50 dark:text-s-dm-text/50 mb-1 block">{t("to")}</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => { setEndTime(e.target.value); setFormError(null); }}
                className="w-full px-2 py-1.5 rounded-input border border-s-ink/10 dark:border-white/10 bg-white dark:bg-s-dm-bg text-sm text-s-ink dark:text-s-dm-text focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/20"
              />
            </div>
          </div>
          {formError && <p role="alert" className="text-xs text-s-coral">{formError}</p>}
          <div className="flex gap-2">
            <button
              onClick={() => { setShowAdd(false); setFormError(null); }}
              className="px-3 py-1.5 rounded-pill border border-s-ink/10 dark:border-white/10 text-xs text-s-ink/60 dark:text-s-dm-text/60"
            >
              {t("cancel")}
            </button>
            <button
              onClick={handleAdd}
              disabled={saving}
              className="px-3 py-1.5 rounded-pill active:scale-[0.98] bg-s-coral text-white text-[11px] font-heading font-bold uppercase tracking-[.06em] disabled:opacity-50 flex items-center gap-1 shadow-coral-glow transition-[transform,filter] duration-150"
            >
              {saving && <Spinner size="sm" invert />} {t("save")}
            </button>
          </div>
        </div>
      )}

      {breaks.length === 0 ? (
        <p className="text-xs text-s-ink/30 dark:text-s-dm-text/30 text-center py-4">{t("empty")}</p>
      ) : (
        <div className="space-y-2">
          {breaks.map((b) => (
            <div
              key={b.id}
              className="flex items-center justify-between bg-white dark:bg-s-dm-surface rounded-[16px] border border-s-ink/5 dark:border-white/5 p-3"
            >
              <div>
                <p className="text-sm font-medium text-s-ink dark:text-s-dm-text">{t(`day_${b.day_of_week}` as any)}</p>
                <p className="text-xs text-s-ink/40 dark:text-s-dm-text/40">{b.start_time} — {b.end_time}</p>
              </div>
              <button
                onClick={() => handleDelete(b.id)}
                aria-label={t("confirmDelete")}
                className="p-1.5 text-s-ink/20 dark:text-s-dm-text/20 hover:text-s-coral transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
