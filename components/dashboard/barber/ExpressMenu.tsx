"use client";

import { useEffect, useState } from "react";
import { Scissors, Clock } from "lucide-react";
import { useTranslations } from "next-intl";

interface Service {
  id: string;
  name: string;
  duration_minutes: number;
  price: number;
}

interface ExpressMenuProps {
  salonId: string;
}

export default function ExpressMenu({ salonId }: ExpressMenuProps) {
  const t = useTranslations("dashboardBarber");
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState<string | null>(null);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await fetch(
          `/api/salon/services?salon_id=${salonId}&category=barbershop`
        );
        if (res.ok) {
          const data = await res.json();
          // Take top 6 services
          setServices((data.services ?? data.data ?? []).slice(0, 6));
        }
      } catch {
        // Error
      }
      setLoading(false);
    };
    fetchServices();
  }, [salonId]);

  const createWalkin = async (serviceId: string) => {
    setCreating(serviceId);
    try {
      await fetch("/api/walkin/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salon_id: salonId,
          customer_name: t("walk_in_customer"),
          service_id: serviceId,
          join_method: "in_person",
        }),
      });
    } catch {
      // Error
    }
    setCreating(null);
  };

  if (loading) {
    return (
      <div className="rounded-[12px] border border-s-ink/[0.06] dark:border-s-dm-text/[0.06] bg-white dark:bg-s-dm-surface p-4">
        <p className="text-sm text-s-ink/40 dark:text-s-dm-text/40 text-center py-4">
          {t("loading")}
        </p>
      </div>
    );
  }

  if (services.length === 0) return null;

  return (
    <div className="rounded-[12px] border border-s-ink/[0.06] dark:border-s-dm-text/[0.06] bg-white dark:bg-s-dm-surface p-4">
      <p className="text-[9px] font-heading font-bold uppercase tracking-[.18em] text-s-amber mb-3">
        {t("express_menu")}
      </p>

      <div className="grid grid-cols-2 gap-2">
        {services.map((svc) => (
          <button
            key={svc.id}
            onClick={() => createWalkin(svc.id)}
            disabled={creating === svc.id}
            className={`rounded-[12px] border p-4 text-left transition-colors duration-150 ${
              creating === svc.id
                ? "border-s-coral bg-s-coral/[0.06] dark:bg-s-coral/[0.06]"
                : "border-s-ink/[0.06] dark:border-s-dm-text/[0.06] bg-white dark:bg-s-dm-surface hover:border-s-coral/40"
            } disabled:opacity-60`}
            aria-label={`${svc.name} — ${svc.duration_minutes} min, ${svc.price} CHF`}
          >
            <div className="flex items-start gap-2">
              <Scissors
                size={14}
                className="text-s-ink/30 dark:text-s-dm-text/30 mt-0.5 shrink-0"
              />
              <div className="min-w-0">
                <p className="text-sm font-heading font-semibold text-s-ink dark:text-s-dm-text truncate">
                  {svc.name}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] data-text text-s-ink/40 dark:text-s-dm-text/40 flex items-center gap-0.5">
                    <Clock size={10} />
                    {svc.duration_minutes} min
                  </span>
                  <span className="text-[10px] data-text font-bold text-s-coral">
                    {svc.price} CHF
                  </span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
