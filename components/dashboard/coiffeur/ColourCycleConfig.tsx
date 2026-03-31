"use client";

import { useState, useEffect } from "react";
import { Bell, Clock } from "lucide-react";
import { useTranslations } from "next-intl";

interface CoiffeurService {
  id: string;
  name_de: string;
  reminder_cycle_days: number | null;
}

const CYCLE_OPTIONS = [
  { value: 28, labelKey: "cycle_4_weeks" },
  { value: 42, labelKey: "cycle_6_weeks" },
  { value: 56, labelKey: "cycle_8_weeks" },
] as const;

interface ColourCycleConfigProps {
  salonId: string;
}

export default function ColourCycleConfig({ salonId }: ColourCycleConfigProps) {
  const t = useTranslations("dashboardCoiffeur") as any;
  const [services, setServices] = useState<CoiffeurService[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/services?salon_id=${salonId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const coiffeurSvcs = (d?.services ?? []).filter(
          (s: { category?: string }) => s.category === "coiffeur"
        );
        setServices(coiffeurSvcs);
      })
      .catch((err) => console.error("[ColourCycleConfig] failed to load coiffeur services:", err))
      .finally(() => setLoading(false));
  }, [salonId]);

  const updateCycle = async (serviceId: string, days: number | null) => {
    setServices((prev) =>
      prev.map((s) => (s.id === serviceId ? { ...s, reminder_cycle_days: days } : s))
    );
    await fetch(`/api/services/${serviceId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reminder_cycle_days: days }),
    });
  };

  if (loading) {
    return <p className="text-sm text-s-ink/40 dark:text-s-dm-text/40 py-4">{t("loading")}</p>;
  }

  return (
    <div className="rounded-[12px] border border-s-ink/[0.06] dark:border-s-dm-text/[0.06] p-4 bg-white dark:bg-s-dm-surface w-full max-w-lg">
      <div className="flex items-center gap-2 mb-3">
        <Bell size={16} className="text-s-coral" />
        <p className="text-[9px] font-heading font-bold uppercase tracking-[.18em] text-s-amber">
          {t("colour_cycle_title")}
        </p>
      </div>

      {services.length === 0 ? (
        <p className="text-sm text-s-ink/40 dark:text-s-dm-text/40">{t("no_coiffeur_services")}</p>
      ) : (
        <div className="space-y-3">
          {services.map((svc) => (
            <div
              key={svc.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-[12px] border border-s-ink/5 dark:border-s-dm-text/10 bg-white dark:bg-s-dm-surface"
            >
              <div className="min-w-0">
                <p className="text-sm font-heading font-medium text-s-ink dark:text-s-dm-text truncate">{svc.name_de}</p>
                <p className="text-xs text-s-ink/40 dark:text-s-dm-text/40 flex items-center gap-1">
                  <Clock size={10} />
                  {t("reminder_after")}
                </p>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {CYCLE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => updateCycle(svc.id, svc.reminder_cycle_days === opt.value ? null : opt.value)}
                    aria-label={t(opt.labelKey)}
                    className={`rounded-[12px] border px-3 py-1.5 text-xs font-heading font-semibold transition-colors duration-150 ${
                      svc.reminder_cycle_days === opt.value
                        ? "border-s-coral bg-s-coral/[0.06] text-s-coral"
                        : "border-s-ink/[0.06] dark:border-s-dm-text/[0.06] text-s-ink/50 dark:text-s-dm-text/50 hover:border-s-coral/40 hover:text-s-coral"
                    }`}
                  >
                    {t(opt.labelKey)}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
