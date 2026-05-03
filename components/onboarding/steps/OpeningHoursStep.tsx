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
  const t = useTranslations("onboarding") as any;
  const tc = useTranslations("common");
  const dayLabels = DAY_KEYS.map((k) => t(`hours.days.${k}`));
  const [hours, setHours] = useState<Record<string, { open: string; close: string; break_start?: string; break_end?: string } | null>>(() => {
    const h: Record<string, { open: string; close: string; break_start?: string; break_end?: string } | null> = {};
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

  const update = (key: string, field: "open" | "close" | "break_start" | "break_end", val: string) => {
    setHours((h) => {
      const curr = h[key];
      if (!curr) return h;
      return { ...h, [key]: { ...curr, [field]: val } };
    });
  };

  const toggleBreak = (key: string) => {
    setHours((h) => {
      const curr = h[key];
      if (!curr) return h;
      if (curr.break_start) {
        const { break_start, break_end, ...rest } = curr as any;
        return { ...h, [key]: rest };
      }
      return { ...h, [key]: { ...curr, break_start: "12:00", break_end: "13:00" } };
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
        <div className="w-12 h-12 rounded-[12px] bg-s-coral/10 flex items-center justify-center">
          <Clock size={22} className="text-s-ink/60" />
        </div>
        <div>
          <h2 className="font-heading text-xl text-s-ink">
            {t("hours.title")}
          </h2>
          <p className="text-sm text-s-ink/40">
            {t("hours.subtitle")}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-[12px] border border-s-ink/5 p-6 space-y-3">
        {DAY_KEYS.map((key, i) => {
          const h = hours[key];
          return (
            <div key={key} className="flex items-center gap-4">
              <button
                onClick={() => toggle(key)}
                className={[
                  "w-20 text-center text-xs font-medium py-2 rounded-btn transition-colors",
                  h ? "bg-s-coral text-white shadow-warm-sm" : "bg-s-bg-sunken text-s-ink/30 hover:text-s-ink/50",
                ].join(" ")}
              >
                {DAYS_SHORT[i]}
              </button>
              <span className="text-sm text-s-ink/60 w-24 hidden sm:block">{dayLabels[i]}</span>
              {h ? (
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={h.open}
                      onChange={(e) => update(key, "open", e.target.value)}
                      className="px-3 py-2 rounded-input border border-s-ink/10 bg-white text-sm text-s-ink focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/20 w-24 transition-colors"
                    />
                    <span className="text-s-ink/20">–</span>
                    <input
                      type="time"
                      value={h.close}
                      onChange={(e) => update(key, "close", e.target.value)}
                      className="px-3 py-2 rounded-input border border-s-ink/10 bg-white text-sm text-s-ink focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/20 w-24 transition-colors"
                    />
                    {!h.break_start && (
                      <button onClick={() => toggleBreak(key)} className="ml-2 text-xs font-medium text-s-coral hover:text-s-coral/80">
                        {t("hours.addBreak")}
                      </button>
                    )}
                  </div>
                  {h.break_start && (
                    <div className="flex items-center gap-2 pl-[112px] sm:pl-0">
                      <span className="text-xs text-s-ink/40 w-12 hidden sm:inline-block">Pause</span>
                      <input
                        type="time"
                        value={h.break_start}
                        onChange={(e) => update(key, "break_start", e.target.value)}
                        className="px-3 py-2 rounded-input border border-s-ink/10 bg-s-bg-surface text-sm text-s-ink focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/20 w-24 transition-colors"
                      />
                      <span className="text-s-ink/20">–</span>
                      <input
                        type="time"
                        value={h.break_end}
                        onChange={(e) => update(key, "break_end", e.target.value)}
                        className="px-3 py-2 rounded-input border border-s-ink/10 bg-s-bg-surface text-sm text-s-ink focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/20 w-24 transition-colors"
                      />
                      <button onClick={() => toggleBreak(key)} className="ml-2 text-xs text-s-ink/30 hover:text-s-coral">
                        {t("hours.removeBreak")}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <span className="text-sm text-s-ink/20 italic">
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
        className="w-full py-3 rounded-btn active:scale-[0.97] bg-s-coral text-white text-[11px] font-heading uppercase tracking-[.06em] disabled:opacity-50 flex items-center justify-center gap-2 hover:brightness-[1.06] shadow-elevation-2 transition-[transform,filter]"
      >
        {saving && <Spinner size="sm" invert />}
        {tc("save")}
      </button>
    </div>
  );
}
