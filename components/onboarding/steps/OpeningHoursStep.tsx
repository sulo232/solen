"use client";

import { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import Spinner from "@/components/ui/Spinner";
import { useTranslations } from "next-intl";

const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
const DAYS_SHORT = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

interface OpeningHoursStepProps {
  salonId: string;
  onSaved: () => void;
}

export default function OpeningHoursStep({ salonId, onSaved }: OpeningHoursStepProps) {
  const t = useTranslations("onboarding");
  const tc = useTranslations("common");
  const dayLabels = DAY_KEYS.map((k) => t(`hours.days.${k}`));
  const [hours, setHours] = useState<Record<string, { open: string; close: string } | null>>(() => {
    const h: Record<string, { open: string; close: string } | null> = {};
    DAY_KEYS.forEach((k, i) => {
      h[k] = i < 5 ? { open: "09:00", close: "18:00" } : (i === 5 ? { open: "09:00", close: "16:00" } : null);
    });
    return h;
  });
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!salonId) return;
    fetch(`/api/salons/${salonId}`)
      .then((r) => r.json())
      .then((s) => {
        if (s?.opening_hours && Object.keys(s.opening_hours).length > 0) {
          setHours(s.opening_hours);
        }
      })
      .finally(() => setLoaded(true));
  }, [salonId]);

  const toggle = (key: string) => {
    setHours((h) => ({ ...h, [key]: h[key] ? null : { open: "09:00", close: "18:00" } }));
  };

  const update = (key: string, field: "open" | "close", val: string) => {
    setHours((h) => {
      const curr = h[key];
      if (!curr) return h;
      return { ...h, [key]: { ...curr, [field]: val } };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch(`/api/salons/${salonId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opening_hours: hours }),
      });
      onSaved();
    } catch { /* ignore */ } finally {
      setSaving(false);
    }
  };

  const hasAnyOpen = Object.values(hours).some((v) => v !== null);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-12 h-12 rounded-card bg-s-coral/10 dark:bg-s-coral/20 flex items-center justify-center">
          <Clock size={22} className="text-s-coral" />
        </div>
        <div>
          <h2 className="font-heading font-bold text-xl text-s-ink dark:text-s-dm-text">
            {t("hours.title")}
          </h2>
          <p className="text-sm text-s-ink/40 dark:text-s-dm-text/50">
            {t("hours.subtitle")}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-s-dm-surface rounded-card border border-s-ink/5 dark:border-white/5 p-6 space-y-3">
        {DAY_KEYS.map((key, i) => {
          const h = hours[key];
          return (
            <div key={key} className="flex items-center gap-4">
              <button
                onClick={() => toggle(key)}
                className={[
                  "w-20 text-center text-xs font-medium py-2 rounded-btn transition-all",
                  h ? "bg-s-coral text-white shadow-warm-sm" : "bg-s-bg-sunken dark:bg-s-dm-raised text-s-ink/30 dark:text-s-dm-text/30 hover:text-s-ink/50 dark:hover:text-s-dm-text/50",
                ].join(" ")}
              >
                {DAYS_SHORT[i]}
              </button>
              <span className="text-sm text-s-ink/60 dark:text-s-dm-text/60 w-24 hidden sm:block">{dayLabels[i]}</span>
              {h ? (
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={h.open}
                    onChange={(e) => update(key, "open", e.target.value)}
                    className="px-3 py-2 rounded-btn border border-s-ink/10 dark:border-white/10 bg-white dark:bg-s-dm-raised text-sm text-s-ink dark:text-s-dm-text focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/20"
                  />
                  <span className="text-s-ink/20 dark:text-s-dm-text/20">–</span>
                  <input
                    type="time"
                    value={h.close}
                    onChange={(e) => update(key, "close", e.target.value)}
                    className="px-3 py-2 rounded-btn border border-s-ink/10 dark:border-white/10 bg-white dark:bg-s-dm-raised text-sm text-s-ink dark:text-s-dm-text focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/20"
                  />
                </div>
              ) : (
                <span className="text-sm text-s-ink/20 dark:text-s-dm-text/20 italic">
                  {t("hours.closed")}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <button
        onClick={handleSave}
        disabled={!hasAnyOpen || saving}
        className="w-full py-3 rounded-btn active:scale-[0.98] bg-s-coral text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2 hover:brightness-[1.06] transition-all shadow-warm-sm"
      >
        {saving && <Spinner size="sm" invert />}
        {tc("save")}
      </button>
    </div>
  );
}
