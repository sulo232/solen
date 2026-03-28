"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Trash2, Plus, Clock } from "lucide-react";
import Spinner from "@/components/ui/Spinner";

const HOURS = Array.from({ length: 15 }, (_, i) => i + 7);

type OffPeakRule = {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  discount_percent: number;
};

function timeToHour(t: string) {
  return parseInt(t.slice(0, 2), 10);
}

export default function OffPeakManager({ salonId }: { salonId: string }) {
  const t = useTranslations("dashboard.offPeak") as any;
  const tSchedule = useTranslations("dashboard.schedule");

  const DAYS = (["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const).map(d => tSchedule(d).slice(0, 2));

  const [rules, setRules] = useState<OffPeakRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addDay, setAddDay] = useState(1);
  const [addStart, setAddStart] = useState("10:00");
  const [addEnd, setAddEnd] = useState("14:00");
  const [addDiscount, setAddDiscount] = useState(15);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/off-peak?salon_id=${salonId}`)
      .then((r) => r.json())
      .then((d) => setRules(d.items ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [salonId]);

  const handleAdd = async () => {
    setError("");
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
        const d = await res.json();
        setError(d.error ?? t("saveError"));
        return;
      }
      const created = await res.json();
      setRules((prev) => [...prev, created]);
    } catch {
      setError(t("networkError"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch("/api/off-peak", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setRules((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const cellMap = new Map<string, OffPeakRule>();
  for (const rule of rules) {
    const startH = timeToHour(rule.start_time);
    const endH = timeToHour(rule.end_time);
    for (let h = startH; h < endH; h++) {
      cellMap.set(`${rule.day_of_week}-${h}`, rule);
    }
  }

  if (loading) return <div className="py-6 flex justify-center"><Spinner size="md" /></div>;

  return (
    <div className="py-4 space-y-6">
      <div className="overflow-x-auto">
        <div className="grid gap-px min-w-[500px]" style={{ gridTemplateColumns: "48px repeat(7, 1fr)" }}>
          <div />
          {DAYS.map((d, i) => (
            <div key={i} className="text-center text-xs font-medium text-s-ink/50 dark:text-s-dm-text/50 py-1.5">
              {d}
            </div>
          ))}
          {HOURS.map((hour) => (
            <div key={`row-${hour}`} className="contents">
              <div className="text-right pr-2 text-[10px] text-s-ink/30 dark:text-s-dm-text/30 data-text">
                {String(hour).padStart(2, "0")}:00
              </div>
              {Array.from({ length: 7 }, (_, day) => {
                const rule = cellMap.get(`${day}-${hour}`);
                return (
                  <div
                    key={`${day}-${hour}`}
                    className={[
                      "h-6 rounded-sm text-[9px] flex items-center justify-center transition-colors",
                      rule
                        ? "bg-s-sage-subtle text-s-sage-text font-medium dark:bg-s-sage/20 dark:text-s-sage"
                        : "bg-s-bg-surface/50 dark:bg-s-dm-raised/50",
                    ].join(" ")}
                  >
                    {rule ? `-${rule.discount_percent}%` : ""}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {rules.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-s-ink/50 dark:text-s-dm-text/50">{t("activeRules")}</p>
          {rules.map((r) => (
            <div key={r.id} className="flex items-center justify-between py-2 px-3 bg-s-bg-surface/50 dark:bg-s-dm-raised rounded-btn border border-s-ink/5 dark:border-white/5">
              <div className="flex items-center gap-2">
                <Clock size={13} className="text-s-sage" />
                <span className="text-sm text-s-ink dark:text-s-dm-text">
                  {DAYS[r.day_of_week]} {r.start_time.slice(0, 5)}–{r.end_time.slice(0, 5)}
                </span>
                <span className="px-1.5 py-0.5 rounded-pill bg-s-sage-subtle text-s-sage-text text-[10px] font-medium dark:bg-s-sage/20 dark:text-s-sage">
                  -{r.discount_percent}%
                </span>
              </div>
              <button onClick={() => handleDelete(r.id)} className="text-s-ink/30 hover:text-s-coral transition-colors dark:text-s-dm-text/30">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="border-t border-s-ink/5 dark:border-white/5 pt-4 space-y-3">
        <p className="text-xs font-medium text-s-ink/50 dark:text-s-dm-text/50 flex items-center gap-1.5">
          <Plus size={12} /> {t("newRule")}
        </p>
        <div className="flex flex-wrap gap-2 items-end">
          <div>
            <label className="block text-[10px] text-s-ink/40 dark:text-s-dm-text/40 mb-1">{t("day")}</label>
            <select value={addDay} onChange={(e) => setAddDay(+e.target.value)}
              className="px-2 py-1.5 rounded-btn border border-s-ink/10 dark:border-white/10 text-sm bg-white dark:bg-s-dm-surface text-s-ink dark:text-s-dm-text focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/20">
              {DAYS.map((d, i) => (<option key={i} value={i}>{d}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-s-ink/40 dark:text-s-dm-text/40 mb-1">{t("from")}</label>
            <input type="time" value={addStart} onChange={(e) => setAddStart(e.target.value)}
              className="px-2 py-1.5 rounded-btn border border-s-ink/10 dark:border-white/10 text-sm bg-white dark:bg-s-dm-surface text-s-ink dark:text-s-dm-text focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/20" />
          </div>
          <div>
            <label className="block text-[10px] text-s-ink/40 dark:text-s-dm-text/40 mb-1">{t("to")}</label>
            <input type="time" value={addEnd} onChange={(e) => setAddEnd(e.target.value)}
              className="px-2 py-1.5 rounded-btn border border-s-ink/10 dark:border-white/10 text-sm bg-white dark:bg-s-dm-surface text-s-ink dark:text-s-dm-text focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/20" />
          </div>
          <div>
            <label className="block text-[10px] text-s-ink/40 dark:text-s-dm-text/40 mb-1">{t("discount")}</label>
            <div className="flex items-center gap-1">
              <input type="number" min={5} max={50} step={5} value={addDiscount}
                onChange={(e) => setAddDiscount(Math.min(50, Math.max(5, +e.target.value)))}
                className="w-16 px-2 py-1.5 rounded-btn border border-s-ink/10 dark:border-white/10 text-sm data-text bg-white dark:bg-s-dm-surface text-s-ink dark:text-s-dm-text focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/20" />
              <span className="text-xs text-s-ink/40 dark:text-s-dm-text/40">%</span>
            </div>
          </div>
          <button onClick={handleAdd} disabled={saving}
            className="px-4 py-1.5 rounded-btn active:scale-[0.98] bg-s-coral text-white text-[11px] font-heading font-bold uppercase tracking-[.06em] disabled:opacity-50 flex items-center gap-1.5 transition-all">
            {saving && <Spinner size="sm" invert />}
            {t("add")}
          </button>
        </div>
        {error && <p className="text-xs text-s-coral">{error}</p>}
      </div>

      {rules.length === 0 && (
        <p className="text-xs text-s-ink/30 dark:text-s-dm-text/30 text-center py-2">
          {t("empty")}
        </p>
      )}
    </div>
  );
}
