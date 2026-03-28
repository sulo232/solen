"use client";

import { useState, useEffect } from "react";
import { Calendar, Check, Lightbulb, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

interface ScheduleStepProps {
  onSaved: () => void;
}

export default function ScheduleStep({ onSaved }: ScheduleStepProps) {
  const t = useTranslations("onboarding") as any;
  const [applied, setApplied] = useState(false);
  const [applying, setApplying] = useState(false);

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
      .catch(() => {});
  }, []);

  const handleApply = async () => {
    setApplying(true);
    try {
      const res = await fetch("/api/salons/mine").then(r => r.json());
      const salonId = res?.salon?.id;
      if (!salonId) return;

      // Create default schedule from opening hours for all staff
      await fetch("/api/staff/schedule/auto-apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ salon_id: salonId }),
      });
      setApplied(true);
      onSaved();
    } catch { /* ignore */ } finally {
      setApplying(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-12 h-12 rounded-[12px] bg-s-coral/10 dark:bg-s-coral/20 flex items-center justify-center">
          <Calendar size={22} className="text-s-coral" />
        </div>
        <div>
          <h2 className="font-heading font-bold text-xl text-s-ink dark:text-s-dm-text">
            {t("schedule.title")}
          </h2>
          <p className="text-sm text-s-ink/40 dark:text-s-dm-text/50">
            {t("schedule.subtitle")}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-s-dm-surface rounded-[12px] border border-s-ink/5 dark:border-white/5 p-6 space-y-4">
        <p className="text-sm text-s-ink/60 dark:text-s-dm-text/60">
          {t("schedule.description")}
        </p>

        {applied ? (
          <div className="bg-s-coral/5 dark:bg-s-coral/10 border border-s-coral/20 rounded-[12px] px-4 py-3 flex items-center gap-2">
            <Check size={14} className="text-s-coral shrink-0" />
            <div>
              <p className="text-xs text-s-coral font-medium">
                {t("schedule.autoConfigured")}
              </p>
              <p className="text-[10px] text-s-ink/40 dark:text-s-dm-text/40 mt-0.5">
                {t("schedule.autoConfiguredDesc")}
              </p>
            </div>
          </div>
        ) : (
          <button
            onClick={handleApply}
            disabled={applying}
            className="w-full py-3 rounded-btn active:scale-[0.98] bg-s-coral text-white text-[11px] font-heading font-bold uppercase tracking-[.06em] disabled:opacity-50 flex items-center justify-center gap-2 hover:brightness-[1.06] shadow-coral-glow transition-[transform,filter]"
          >
            {applying && <Loader2 size={14} className="animate-spin" />}
            {t("schedule.applyHours")}
          </button>
        )}

        {applied && (
          <button
            onClick={() => onSaved()}
            className="w-full py-3 mt-6 rounded-btn active:scale-[0.98] bg-s-coral text-white text-[11px] font-heading font-bold uppercase tracking-[.06em] disabled:opacity-50 flex items-center justify-center gap-2 hover:brightness-[1.06] shadow-coral-glow transition-[transform,filter]"
          >
            {t("setup.saveAndContinue")}
          </button>
        )}

        <div className="bg-s-bg-surface dark:bg-s-dm-raised rounded-[12px] px-4 py-3 flex items-start gap-2">
          <Lightbulb size={14} className="text-s-ink/30 dark:text-s-dm-text/30 mt-0.5 shrink-0" />
          <p className="text-xs text-s-ink/40 dark:text-s-dm-text/40">
            {t("schedule.individualHint")}
          </p>
        </div>
      </div>
    </div>
  );
}
