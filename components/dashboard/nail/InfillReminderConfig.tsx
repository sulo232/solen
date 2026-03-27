"use client";

import { useState, useEffect } from "react";
import { Bell, Clock, Users } from "lucide-react";
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

export default function InfillReminderConfig({ salonId }: { salonId: string }) {
  const t = useTranslations("nail_dashboard");
  const [services, setServices] = useState<NailService[]>([]);
  const [dueClients, setDueClients] = useState<DueClient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch nail services
    fetch(`/api/services?salon_id=${salonId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const nailSvcs = (d?.services ?? []).filter((s: { category?: string }) => s.category === "nails");
        setServices(nailSvcs);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    // Fetch due clients
    fetch(`/api/dashboard/nail/infill-due?salon_id=${salonId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.due_clients) setDueClients(d.due_clients);
      })
      .catch(() => {});
  }, [salonId]);

  const updateCycle = async (serviceId: string, days: number | null) => {
    setServices((prev) =>
      prev.map((s) => (s.id === serviceId ? { ...s, reminder_cycle_days: days } : s))
    );
    await fetch("/api/services", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: serviceId, reminder_cycle_days: days }),
    });
  };

  if (loading) return <p className="text-sm text-s-ink/40 dark:text-s-dm-text/40 py-4">{t("loading")}</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Bell size={16} className="text-s-coral" />
        <h3 className="font-heading font-semibold text-sm text-s-ink dark:text-s-dm-text">{t("infill_title")}</h3>
      </div>

      {services.length === 0 ? (
        <p className="text-sm text-s-ink/40 dark:text-s-dm-text/40">{t("infill_no_services")}</p>
      ) : (
        <div className="space-y-3">
          {services.map((svc) => (
            <div
              key={svc.id}
              className="flex items-center justify-between p-3 rounded-[16px] border border-s-ink/5 dark:border-s-dm-text/10 bg-white dark:bg-s-dm-surface"
            >
              <div>
                <p className="text-sm font-medium text-s-ink dark:text-s-dm-text">{svc.name_de}</p>
                <p className="text-xs text-s-ink/40 dark:text-s-dm-text/40 flex items-center gap-1">
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
                  className="w-16 px-2 py-1 text-sm text-center rounded-btn border border-s-ink/10 dark:border-s-dm-text/10 bg-transparent text-s-ink dark:text-s-dm-text"
                />
                <span className="text-xs text-s-ink/40 dark:text-s-dm-text/40">{t("infill_days")}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Due clients summary */}
      {dueClients.length > 0 && (
        <div className="mt-4 p-3 rounded-[16px] bg-s-amber-subtle dark:bg-s-amber/5 border border-s-amber/20">
          <p className="text-sm font-medium text-s-amber-text dark:text-s-amber flex items-center gap-1.5">
            <Users size={14} />
            {t("infill_due_clients", { count: dueClients.length })}
          </p>
        </div>
      )}
    </div>
  );
}
