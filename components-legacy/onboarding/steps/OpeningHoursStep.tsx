"use client";

import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { Clock } from "lucide-react";
import Spinner from "@/components-legacy/ui/Spinner";
import { useTranslations } from "next-intl";
import type { StepHandle } from "@/components-legacy/onboarding/SetupWizard";

const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
const DAYS_SHORT = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

interface OpeningHoursStepProps {
  salonId: string;
  onSaved: () => void;
}

const OpeningHoursStep = forwardRef<StepHandle, OpeningHoursStepProps>(function OpeningHoursStep({ salonId, onSaved }, ref) {
  const t = useTranslations("onboarding") as any;
  const tc = useTranslations("common");
  const genericError = tc("errorGeneric");
  const [error, setError] = useState<string | null>(null);
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
    let isCurrentLoad = true;
    setLoaded(false);
    setError(null);
    fetch(`/api/salons/${salonId}`)
      .then((response) => {
        if (!response.ok) throw new Error(`GET /api/salons/${salonId} returned ${response.status}`);
        return response.json();
      })
      .then((s) => {
        if (!isCurrentLoad) return;
        if (s?.opening_hours && Object.keys(s.opening_hours).length > 0) {
          setHours(s.opening_hours);
        }
        setLoaded(true);
      })
      .catch((err) => {
        if (!isCurrentLoad) return;
        console.error("[OpeningHoursStep] load failed:", err);
        setError(genericError);
      });
    return () => {
      isCurrentLoad = false;
    };
  }, [genericError, salonId]);

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

  const handleSave = async (): Promise<boolean> => {
    if (!loaded) {
      setError(genericError);
      return false;
    }
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/salons/${salonId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opening_hours: hours }),
      });
      if (!response.ok) throw new Error(`PATCH /api/salons/${salonId} returned ${response.status}`);
      onSaved();
      return true;
    } catch (err) {
      console.error("[OpeningHoursStep] save failed:", err);
      setError(genericError);
      return false;
    } finally {
      setSaving(false);
    }
  };

  useImperativeHandle(ref, () => ({ save: handleSave }));

  const hasAnyOpen = Object.values(hours).some((v) => v !== null);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-12 h-12 rounded-[12px] bg-s-ink/10 flex items-center justify-center">
          <Clock size={22} strokeWidth={2.2} className="text-s-ink-2" />
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

      <div className="bg-white rounded-[12px] border border-s-border p-6 space-y-3">
        {DAY_KEYS.map((key, i) => {
          const h = hours[key];
          return (
            <div key={key} className="flex items-center gap-4">
              <button
                onClick={() => toggle(key)}
                className={[
                  "w-20 text-center text-xs font-medium py-2 rounded-btn transition-colors",
                  h ? "bg-s-ink text-white shadow-warm-sm" : "bg-s-bg-sunken text-s-ink/30 hover:text-s-ink-2",
                ].join(" ")}
              >
                {DAYS_SHORT[i]}
              </button>
              <span className="text-sm text-s-ink-2 w-24 hidden sm:block">{dayLabels[i]}</span>
              {h ? (
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={h.open}
                      onChange={(e) => update(key, "open", e.target.value)}
                      className="text-s-ink w-[146px] transition-colors" // mockup-ok: widened from w-24 (96px); the base input law's 16px font + 16px padding clipped the "09:00" value inside the old 96px box; px-3/py-2/text-sm deleted, they were already dead under the base law's own padding/font-size (V3-D-input-fill-2026-07-17)
                    />
                    <span className="text-s-ink/20">–</span>
                    <input
                      type="time"
                      value={h.close}
                      onChange={(e) => update(key, "close", e.target.value)}
                      className="text-s-ink w-[146px] transition-colors" // mockup-ok: widened from w-24 (96px); the base input law's 16px font + 16px padding clipped the "09:00" value inside the old 96px box; px-3/py-2/text-sm deleted, they were already dead under the base law's own padding/font-size (V3-D-input-fill-2026-07-17)
                    />
                    {!h.break_start && (
                      <button onClick={() => toggleBreak(key)} className="ml-2 text-xs font-medium text-s-accent hover:text-s-accent/80">
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
                        className="text-s-ink w-[146px] transition-colors" // mockup-ok: widened from w-24 (96px); the base input law's 16px font + 16px padding clipped the "09:00" value inside the old 96px box; px-3/py-2/text-sm deleted, they were already dead under the base law's own padding/font-size (V3-D-input-fill-2026-07-17)
                      />
                      <span className="text-s-ink/20">–</span>
                      <input
                        type="time"
                        value={h.break_end}
                        onChange={(e) => update(key, "break_end", e.target.value)}
                        className="text-s-ink w-[146px] transition-colors" // mockup-ok: widened from w-24 (96px); the base input law's 16px font + 16px padding clipped the "09:00" value inside the old 96px box; px-3/py-2/text-sm deleted, they were already dead under the base law's own padding/font-size (V3-D-input-fill-2026-07-17)
                      />
                      <button onClick={() => toggleBreak(key)} className="ml-2 text-xs text-s-ink/30 hover:text-s-accent">
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

      {error && <p className="text-xs text-s-error" role="alert">{error}</p>}

      <button
        onClick={handleSave}
        disabled={!loaded || !hasAnyOpen || saving}
        // mockup-ok: hook-enforced no-caps compliance fix (CLAUDE.md rule 10), ported from reviewed commit 37e703762
        className="w-full py-3 rounded-btn active:scale-[0.97] bg-s-ink text-white text-[13px] font-semibold disabled:opacity-50 flex items-center justify-center gap-2 hover:brightness-[1.06] shadow-elevation-2 transition-[transform,filter]"
      >
        {saving && <Spinner size="sm" invert />}
        {tc("save")}
      </button>
    </div>
  );
});

export default OpeningHoursStep;
