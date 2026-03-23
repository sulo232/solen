"use client";

import { Calendar, Check, Lightbulb } from "lucide-react";
import { useTranslations } from "next-intl";

interface ScheduleStepProps {
  onSaved: () => void;
}

export default function ScheduleStep({ onSaved }: ScheduleStepProps) {
  const t = useTranslations("onboarding");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-12 h-12 rounded-card bg-s-coral/10 dark:bg-s-coral/20 flex items-center justify-center">
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

      <div className="bg-white dark:bg-s-dm-surface rounded-card border border-s-ink/5 dark:border-white/5 p-6 space-y-4">
        <p className="text-sm text-s-ink/60 dark:text-s-dm-text/60">
          {t("schedule.description")}
        </p>

        <div className="bg-s-coral/5 dark:bg-s-coral/10 border border-s-coral/20 rounded-card px-4 py-3 flex items-center gap-2">
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

        <div className="bg-s-bg-surface dark:bg-s-dm-raised rounded-card px-4 py-3 flex items-start gap-2">
          <Lightbulb size={14} className="text-s-ink/30 dark:text-s-dm-text/30 mt-0.5 shrink-0" />
          <p className="text-xs text-s-ink/40 dark:text-s-dm-text/40">
            {t("schedule.individualHint")}
          </p>
        </div>
      </div>
    </div>
  );
}
