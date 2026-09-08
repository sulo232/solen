"use client";

import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { Calendar, Check, Lightbulb, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { StepHandle } from "@/components-legacy/onboarding/SetupWizard";

interface ScheduleStepProps {
  onSaved: () => void;
}

const ScheduleStep = forwardRef<StepHandle, ScheduleStepProps>(function ScheduleStep({ onSaved }, ref) {
  const t = useTranslations("onboarding") as any;
  const tc = useTranslations("common");
  const [applied, setApplied] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-apply default schedules on mount
  useEffect(() => {
    fetch("/api/salons/mine")
      .then(r => r.json())
      .then(d => {
        const salonId = d?.salon?.id;
        if (!salonId) return;
        // Check if schedules already exist
        return fetch(`/api/staff/my-schedule?salon_id=${salonId}`)
          .then(r => r.json())
          .then(schedData => {
            if ((schedData?.schedules ?? []).length > 0) {
              setApplied(true);
            }
          });
      })
      .catch((err) => console.error("[ScheduleStep] failed to load salon schedule data:", err));
  }, []);

  const handleApply = async (): Promise<boolean> => {
    setApplying(true);
    setError(null);
    try {
      const salonResponse = await fetch("/api/salons/mine");
      if (!salonResponse.ok) throw new Error(`GET /api/salons/mine returned ${salonResponse.status}`);
      const data = await salonResponse.json();
      const salonId = data?.salon?.id;
      if (!salonId) throw new Error("No Store id for current user");

      // Create default schedule from opening hours for all staff
      const response = await fetch("/api/staff/schedule/auto-apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ salon_id: salonId }),
      });
      if (!response.ok) throw new Error(`POST /api/staff/schedule/auto-apply returned ${response.status}`);
      setApplied(true);
      onSaved();
      return true;
    } catch (err) {
      console.error("[ScheduleStep] save failed:", err);
      setError(tc("errorGeneric"));
      return false;
    } finally {
      setApplying(false);
    }
  };

  const handleContinue = async (): Promise<boolean> => {
    if (!applied) return handleApply();
    onSaved();
    return true;
  };

  useImperativeHandle(ref, () => ({ save: handleContinue }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-12 h-12 rounded-[12px] bg-s-ink/10 flex items-center justify-center">
          <Calendar size={22} strokeWidth={2.2} className="text-s-ink-2" />
        </div>
        <div>
          <h2 className="font-heading text-xl text-s-ink">
            {t("schedule.title")}
          </h2>
          <p className="text-sm text-s-ink/40">
            {t("schedule.subtitle")}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-[12px] border border-s-border p-6 space-y-4">
        <p className="text-sm text-s-ink-2">
          {t("schedule.description")}
        </p>

        {applied ? (
          <div className="bg-s-ink/5 border border-s-accent/20 rounded-[12px] px-4 py-3 flex items-center gap-2">
            <Check size={14} strokeWidth={1.6} className="text-s-accent shrink-0" />
            <div>
              <p className="text-xs text-s-accent font-medium">
                {t("schedule.autoConfigured")}
              </p>
              <p className="text-[12px] text-s-ink/40 mt-0.5">
                {t("schedule.autoConfiguredDesc")}
              </p>
            </div>
          </div>
        ) : (
          <button
            onClick={handleApply}
            disabled={applying}
            // mockup-ok: hook-enforced no-caps compliance fix (CLAUDE.md rule 10), ported from reviewed commit 37e703762
            className="w-full py-3 rounded-btn active:scale-[0.97] bg-s-ink text-white text-[13px] font-semibold disabled:opacity-50 flex items-center justify-center gap-2 hover:brightness-[1.06] shadow-elevation-2 transition-[transform,filter]"
          >
            {applying && <Loader2 size={14} strokeWidth={1.6} className="animate-spin" />}
            {t("schedule.applyHours")}
          </button>
        )}

        {applied && (
          <button
            onClick={handleContinue}
            // mockup-ok: hook-enforced no-caps compliance fix (CLAUDE.md rule 10), ported from reviewed commit 37e703762
            className="w-full py-3 mt-6 rounded-btn active:scale-[0.97] bg-s-ink text-white text-[13px] font-semibold disabled:opacity-50 flex items-center justify-center gap-2 hover:brightness-[1.06] shadow-elevation-2 transition-[transform,filter]"
          >
            {t("setup.saveAndContinue")}
          </button>
        )}

        {error && <p className="text-xs text-s-error" role="alert">{error}</p>}

        <div className="bg-s-bg-surface rounded-[12px] px-4 py-3 flex items-start gap-2">
          <Lightbulb size={14} strokeWidth={1.6} className="text-s-ink/30 mt-0.5 shrink-0" />
          <p className="text-xs text-s-ink/40">
            {t("schedule.individualHint")}
          </p>
        </div>
      </div>
    </div>
  );
});

export default ScheduleStep;
