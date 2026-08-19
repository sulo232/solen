"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import Spinner from "@/components-legacy/ui/Spinner";

type OffPeakRule = {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  discount_percent: number;
};

// Compact time label: "10:00" → "10", "10:30" → "10:30" (drop only a zero-minute suffix).
function fmtTime(t: string) {
  const hhmm = t.slice(0, 5);
  return hhmm.endsWith(":00") ? hhmm.slice(0, 2) : hhmm;
}

export default function OffPeakManager({ salonId }: { salonId: string }) {
  const t = useTranslations("dashboard.offPeak") as any;
  const tSchedule = useTranslations("dashboard.schedule");

  // DAYS[di] where di is the JS day index (0 = Sunday … 6 = Saturday).
  const DAYS = (["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const).map(
    (d) => tSchedule(d).slice(0, 2)
  );
  // Monday-first display order (European).
  const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

  const [rules, setRules] = useState<OffPeakRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addDay, setAddDay] = useState(1);
  const [addStart, setAddStart] = useState("10:00");
  const [addEnd, setAddEnd] = useState("14:00");
  const [addDiscount, setAddDiscount] = useState(15);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/off-peak?salon_id=${salonId}`)
      .then((r) => {
        if (!r.ok) throw new Error("fetch failed");
        return r.json();
      })
      .then((d) => setRules(d.items ?? []))
      .catch((err) => console.error("[OffPeakManager] failed to load off-peak rules:", err))
      .finally(() => setLoading(false));
  }, [salonId]);

  const handleAdd = async () => {
    setError("");
    if (addEnd <= addStart) {
      setError(t("invalidTimes"));
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/off-peak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salon_id: salonId,
          day_of_week: addDay,
          start_time: addStart,
          end_time: addEnd,
          discount_percent: addDiscount,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? t("saveError"));
        return;
      }
      const created = await res.json();
      setRules((prev) => [...prev, created]);
      setAddOpen(false);
    } catch {
      setError(t("networkError"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t("confirmDelete"))) return;
    const previous = [...rules];
    setRules((prev) => prev.filter((r) => r.id !== id));
    try {
      const res = await fetch("/api/off-peak", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("delete failed");
    } catch {
      setRules(previous);
      setError(t("deleteError"));
    }
  };

  // Group rules by day_of_week so each weekday row lists its own windows.
  const byDay = new Map<number, OffPeakRule[]>();
  for (const r of rules) {
    const arr = byDay.get(r.day_of_week) ?? [];
    arr.push(r);
    byDay.set(r.day_of_week, arr);
  }

  if (loading) return <div className="py-6 flex justify-center"><Spinner size="md" /></div>;

  return (
    <div className="py-4 max-w-md">
      {/* Per-day list — one row per weekday, windows as light-blue pills (tap a pill to remove). */}
      <div className="rounded-[16px] border border-s-border overflow-hidden">
        {WEEK_ORDER.map((di) => {
          const dayRules = (byDay.get(di) ?? []).slice().sort((a, b) => a.start_time.localeCompare(b.start_time));
          return (
            <div key={di} className="flex items-center gap-3 px-3.5 py-3 border-b border-s-border last:border-b-0 min-h-[50px]">
              <span className="font-heading font-semibold text-sm text-s-ink w-9 shrink-0">{DAYS[di]}</span>
              <div className="flex-1 min-w-0 flex gap-1.5 flex-wrap">
                {dayRules.length === 0 ? (
                  <span className="text-s-ink-2 text-sm">—</span>
                ) : (
                  dayRules.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => handleDelete(r.id)}
                      title={t("confirmDelete")}
                      className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[12px] font-semibold bg-s-accent-bright/10 text-s-accent-bright tabular-nums transition-colors hover:bg-s-accent-bright/[0.18]"
                    >
                      {fmtTime(r.start_time)}–{fmtTime(r.end_time)} −{r.discount_percent}%
                    </button>
                  ))
                )}
              </div>
            </div>
          );
        })}
        {/* Add-rule trigger */}
        <button
          type="button"
          onClick={() => { setAddOpen((v) => !v); setError(""); }}
          className="w-full flex items-center gap-2 px-3.5 py-3 text-s-accent-bright font-heading font-semibold text-[13.5px]"
        >
          <Plus size={16} strokeWidth={1.9} />{t("newRule")}
        </button>
      </div>

      {/* Add-rule sheet (inline expander styled as a sheet) */}
      {addOpen && (
        <div className="mt-3 rounded-[16px] border border-s-border bg-white p-4 shadow-warm-lg">
          <p className="font-heading font-bold text-base text-s-ink mb-3">{t("newRule")}</p>

          <p className="text-xs font-medium text-s-ink-2 mb-2">{t("day")}</p>
          <div className="flex gap-1.5 mb-3.5">
            {WEEK_ORDER.map((di) => (
              <button
                key={di}
                type="button"
                onClick={() => setAddDay(di)}
                className={[
                  "flex-1 text-center font-heading font-semibold text-xs rounded-[10px] py-2 border transition-colors",
                  addDay === di ? "bg-s-bg-sunken text-s-ink border-s-border" : "border-s-border text-s-ink-2",
                ].join(" ")}
              >
                {DAYS[di]}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2.5 mb-3.5">
            <div>
              <label className="block text-[12px] text-s-ink-2 mb-1">{t("from")}</label>
              <input
                type="time"
                value={addStart}
                onChange={(e) => { setAddStart(e.target.value); setError(""); }}
                className="w-full px-3 py-2.5 text-sm data-text focus:outline-none" // mockup-ok: dead-class removal only (V3-D-input-fill-2026-07-17)
              />
            </div>
            <div>
              <label className="block text-[12px] text-s-ink-2 mb-1">{t("to")}</label>
              <input
                type="time"
                value={addEnd}
                onChange={(e) => { setAddEnd(e.target.value); setError(""); }}
                className="w-full px-3 py-2.5 text-sm data-text focus:outline-none" // mockup-ok: dead-class removal only (V3-D-input-fill-2026-07-17)
              />
            </div>
          </div>

          <div className="mb-3.5">
            <label className="block text-[12px] text-s-ink-2 mb-1">{t("discount")}</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={5}
                max={50}
                step={5}
                value={addDiscount}
                onChange={(e) => setAddDiscount(Math.min(50, Math.max(5, +e.target.value)))}
                className="w-20 px-3 py-2.5 text-sm data-text focus:outline-none" // mockup-ok: dead-class removal only (V3-D-input-fill-2026-07-17)
              />
              <span className="text-sm text-s-ink-2">%</span>
            </div>
          </div>

          {error && <p role="alert" className="text-xs text-s-error mb-3">{error}</p>}

          <button
            onClick={handleAdd}
            disabled={saving}
            className="w-full py-3 rounded-btn bg-s-ink text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <Spinner size="sm" invert /> : <Plus size={16} strokeWidth={1.9} />}{t("add")}
          </button>
        </div>
      )}

      {rules.length === 0 && !addOpen && (
        <p className="text-xs text-s-ink-2 text-center py-3 mt-1">{t("empty")}</p>
      )}
    </div>
  );
}
