"use client";

import { useTranslations } from "next-intl";

interface ZoneData {
  zone: string;
  last_wax_date: string | null;
  cycle_days: number;
}

interface RegrowthTimelineProps {
  zones: ZoneData[];
}

export default function RegrowthTimeline({ zones }: RegrowthTimelineProps) {
  const t = useTranslations("dashboardWaxing") as any;
  const now = Date.now();

  if (!zones || zones.length === 0) return null;

  return (
    <div className="bg-white dark:bg-s-dm-surface rounded-[12px] border border-s-ink/[0.06] dark:border-white/[0.06] p-4">
      <p className="text-[9px] font-heading font-bold uppercase tracking-[.18em] text-s-plum mb-4">
        {t("timelineTitle")}
      </p>
      <div className="space-y-3">
        {zones.map((zone) => {
          if (!zone.last_wax_date) return null;
          const lastMs = new Date(zone.last_wax_date).getTime();
          const daysSince = Math.floor((now - lastMs) / (24 * 60 * 60 * 1000));
          const cycle = zone.cycle_days || 28;
          const pct = Math.min(100, Math.round((daysSince / cycle) * 100));
          const rebookStart = Math.round(cycle * 0.75);
          const isOverdue = daysSince > cycle;
          const isInWindow = daysSince >= rebookStart && !isOverdue;

          return (
            <div key={zone.zone}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-heading font-semibold text-s-ink dark:text-s-dm-text capitalize">
                  {zone.zone}
                </span>
                <span className={`text-[10px] font-heading font-semibold ${
                  isOverdue ? "text-red-500" : isInWindow ? "text-s-amber" : "text-s-sage"
                }`}>
                  {isOverdue ? t("timelineOverdue") : isInWindow ? t("timelineRebook") : `${daysSince}/${cycle} ${t("days")}`}
                </span>
              </div>
              <div className="relative h-2 rounded-full bg-s-ink/[0.06] dark:bg-s-dm-text/[0.06] overflow-hidden">
                {/* Rebook window zone */}
                <div
                  className="absolute top-0 h-full bg-s-amber/20 rounded-full"
                  style={{ left: `${rebookStart / cycle * 100}%`, width: `${25}%` }}
                />
                {/* Progress */}
                <div
                  className={`absolute top-0 left-0 h-full rounded-full transition-[width] duration-[350ms] ${
                    isOverdue ? "bg-red-400" : isInWindow ? "bg-s-amber" : "bg-s-sage"
                  }`}
                  style={{ width: `${pct}%` }}
                />
                {/* Today hairline */}
                <div className="absolute top-0 h-full w-px bg-s-ink/30 dark:bg-s-dm-text/30" style={{ left: `${pct}%` }} />
              </div>
              <div className="flex justify-between mt-0.5">
                <span className="text-[8px] text-s-ink/25 dark:text-s-dm-text/25">{t("timelineLastWax")}</span>
                <span className="text-[8px] text-s-amber/70">{t("timelineRebookWindow")}</span>
                <span className="text-[8px] text-s-ink/25 dark:text-s-dm-text/25">{t("timelineOverdueLabel")}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
