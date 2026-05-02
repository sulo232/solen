"use client";

import { useState, useEffect } from "react";
import { Bell, Clock, Users, Send, CalendarCheck, Percent } from "lucide-react";
import { useTranslations } from "next-intl";

interface NailService {
  id: string;
  name_de: string;
  reminder_cycle_days: number | null;
}

interface DueClient {
  customer_id: string;
  display_name: string;
  days_overdue: number;
}

interface ReminderMetrics {
  sent: number;
  booked: number;
  conversion_rate: number;
}

export default function InfillReminderConfig({ salonId }: { salonId: string }) {
  const t = useTranslations("nail_dashboard") as any;
  const [services, setServices] = useState<NailService[]>([]);
  const [dueClients, setDueClients] = useState<DueClient[]>([]);
  const [metrics, setMetrics] = useState<ReminderMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch nail services
    fetch(`/api/services?salon_id=${salonId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const nailSvcs = (d?.services ?? []).filter((s: { category?: string }) => s.category === "nails");
        setServices(nailSvcs);
      })
      .catch((err) => console.error("[InfillReminderConfig] failed to load nail services:", err))
      .finally(() => setLoading(false));

    // Fetch due clients
    fetch(`/api/dashboard/nail/infill-due?salon_id=${salonId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.due_clients) setDueClients(d.due_clients);
      })
      .catch((err) => console.error("[InfillReminderConfig] failed to load due clients:", err));

    // Fetch reminder metrics
    fetch(`/api/dashboard/nail/reminder-metrics?salon_id=${salonId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) setMetrics({ sent: d.sent, booked: d.booked, conversion_rate: d.conversion_rate }); })
      .catch((err) => console.error("[InfillReminderConfig] failed to load reminder metrics:", err));
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

  if (loading) return <p className="text-sm text-s-ink/40 py-4">{t("loading")}</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Bell size={16} className="text-s-coral" />
        <h3 className="font-heading font-semibold text-sm text-s-ink">{t("infill_title")}</h3>
      </div>

      {services.length === 0 ? (
        <p className="text-sm text-s-ink/40">{t("infill_no_services")}</p>
      ) : (
        <div className="space-y-3">
          {services.map((svc) => (
            <div
              key={svc.id}
              className="flex items-center justify-between p-3 rounded-[16px] border border-s-ink/5 bg-white"
            >
              <div>
                <p className="text-sm font-medium text-s-ink">{svc.name_de}</p>
                <p className="text-xs text-s-ink/40 flex items-center gap-1">
                  <Clock size={10} />
                  {t("infill_reminder_after")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={90}
                  value={svc.reminder_cycle_days ?? ""}
                  onChange={(e) => updateCycle(svc.id, e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="—"
                  className="w-16 px-2 py-1 text-sm text-center rounded-input border border-s-ink/10 bg-transparent text-s-ink"
                />
                <span className="text-xs text-s-ink/40">{t("infill_days")}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Due clients summary */}
      {dueClients.length > 0 && (
        <div className="mt-4 p-3 rounded-[16px] bg-s-amber-subtle border border-s-amber/20">
          <p className="text-sm font-medium text-s-amber-text flex items-center gap-1.5">
            <Users size={14} />
            {t("infill_due_clients", { count: dueClients.length })}
          </p>
        </div>
      )}

      {/* Reminder metrics (last 30 days) */}
      {metrics && (
        <div className="mt-2 pt-4 border-t border-s-ink/[0.05]">
          <p className="text-[9px] font-heading font-bold uppercase tracking-[.15em] text-s-ink/35 mb-3">
            {t("infill_metrics_title")}
          </p>
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col items-center gap-1 p-2 rounded-[8px] bg-s-ink/[0.03]">
              <Send size={12} className="text-s-blue" />
              <p className="text-base font-heading font-bold data-text text-s-ink">{metrics.sent}</p>
              <p className="text-[9px] text-s-ink/40 text-center">{t("infill_sent")}</p>
            </div>
            <div className="flex flex-col items-center gap-1 p-2 rounded-[8px] bg-s-ink/[0.03]">
              <CalendarCheck size={12} className="text-s-sage" />
              <p className="text-base font-heading font-bold data-text text-s-ink">{metrics.booked}</p>
              <p className="text-[9px] text-s-ink/40 text-center">{t("infill_booked")}</p>
            </div>
            <div className="flex flex-col items-center gap-1 p-2 rounded-[8px] bg-s-ink/[0.03]">
              <Percent size={12} className="text-s-coral" />
              <p className="text-base font-heading font-bold data-text text-s-ink">{metrics.conversion_rate}%</p>
              <p className="text-[9px] text-s-ink/40 text-center">{t("infill_conversion")}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
