"use client";

import { useState, useEffect } from "react";
import { Bell, Clock } from "lucide-react";
import { useTranslations } from "next-intl";

interface WaxingService {
  id: string;
  name_de: string;
  reminder_cycle_days: number | null;
}

const REGROWTH_OPTIONS = [
  { value: 21, labelKey: "cycle_3_weeks" },
  { value: 28, labelKey: "cycle_4_weeks" },
  { value: 35, labelKey: "cycle_5_weeks" },
  { value: 42, labelKey: "cycle_6_weeks" },
];

interface RegrowthConfigProps {
  salonId: string;
}

export default function RegrowthConfig({ salonId }: RegrowthConfigProps) {
  const t = useTranslations("dashboardWaxing");
  const [services, setServices] = useState<WaxingService[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/services?salon_id=${salonId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const waxingSvcs = (d?.services ?? []).filter(
          (s: { category?: string }) => s.category === "waxing"
        );
        setServices(waxingSvcs);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [salonId]);

  const updateCycle = async (serviceId: string, days: number | null) => {
    setServices((prev) =>
      prev.map((s) =>
        s.id === serviceId ? { ...s, reminder_cycle_days: days } : s
      )
    );
    await fetch("/api/services", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: serviceId, reminder_cycle_days: days }),
    });
  };

  if (loading)
    return (
      <p className="text-sm text-s-ink/40 dark:text-s-dm-text/40 py-4">
        {t("loading")}
      </p>
    );

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Bell size={16} className="text-s-coral" />
        <p className="text-[9px] font-heading font-bold uppercase tracking-[.18em] text-s-amber">
          {t("regrowth_title")}
        </p>
      </div>

      {services.length === 0 ? (
        <p className="text-xs text-s-ink/30 dark:text-s-dm-text/30 text-center py-6">
          {t("no_waxing_services")}
        </p>
      ) : (
        <div className="space-y-4">
          {services.map((svc) => (
            <div
              key={svc.id}
              className="rounded-[12px] border border-s-ink/[0.06] dark:border-s-dm-text/[0.06] p-3 bg-white dark:bg-s-dm-surface"
            >
              <div className="flex items-center gap-2 mb-2">
                <p className="text-sm font-heading font-semibold text-s-ink dark:text-s-dm-text">
                  {svc.name_de}
                </p>
                <span className="text-[10px] text-s-ink/30 dark:text-s-dm-text/30 flex items-center gap-1">
                  <Clock size={10} />
                  {svc.reminder_cycle_days
                    ? t("cycle_active", { days: svc.reminder_cycle_days })
                    : t("cycle_not_set")}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {REGROWTH_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => updateCycle(svc.id, opt.value)}
                    aria-label={t(opt.labelKey)}
                    className={`rounded-[12px] border px-4 py-2 text-xs font-heading font-semibold transition-colors duration-150 ${
                      svc.reminder_cycle_days === opt.value
                        ? "border-s-coral bg-s-coral/[0.06] text-s-coral"
                        : "border-s-ink/[0.06] dark:border-s-dm-text/[0.06] text-s-ink/50 dark:text-s-dm-text/50"
                    }`}
                  >
                    {t(opt.labelKey)}
                  </button>
                ))}
                {svc.reminder_cycle_days && (
                  <button
                    onClick={() => updateCycle(svc.id, null)}
                    aria-label={t("cycle_clear")}
                    className="rounded-[12px] border border-s-ink/[0.06] dark:border-s-dm-text/[0.06] px-3 py-2 text-xs font-heading text-s-ink/30 dark:text-s-dm-text/30 transition-colors duration-150 hover:text-s-coral hover:border-s-coral/40"
                  >
                    {t("cycle_clear")}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
