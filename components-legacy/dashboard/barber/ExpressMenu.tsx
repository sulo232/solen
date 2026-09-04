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
  const t = useTranslations("dashboardBarber") as any;
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

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
    setCreateError(null);
    try {
      const res = await fetch("/api/walkin/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salon_id: salonId,
          // No name captured here (this is the one-tap express flow): the queue route's
          // schema treats customer_name as optional and lib/walkin/join.ts falls back to the
          // ticket code, never a placeholder string like "Walk-in Customer".
          service_id: serviceId,
          join_method: "in_person",
        }),
      });
      if (!res.ok) {
        setCreateError(t("walkin_create_error"));
      }
    } catch {
      setCreateError(t("walkin_create_error"));
    }
    setCreating(null);
  };

  if (loading) {
    return (
      <div className="rounded-[16px] border border-s-border bg-white p-4">
        <p className="text-sm text-s-ink-2 text-center py-4">
          {t("loading")}
        </p>
      </div>
    );
  }

  if (services.length === 0) return null;

  return (
    <div className="w-full">
      <p className="font-heading font-bold text-base tracking-[-0.01em] text-s-ink mb-[9px] px-0.5">
        {t("express_menu")}
      </p>

      {createError && (
        <p className="text-xs text-s-error mb-2">{createError}</p>
      )}

      <div className="grid grid-cols-2 gap-[9px]">
        {services.map((svc) => (
          <button
            key={svc.id}
            onClick={() => createWalkin(svc.id)}
            disabled={creating === svc.id}
            className={`rounded-[16px] border p-[13px] text-left transition-colors duration-150 ${
              creating === svc.id
                ? "border-s-ink bg-s-bg-sunken"
                : "border-s-border bg-white hover:border-s-ink"
            } disabled:opacity-60`}
            aria-label={`${svc.name} — ${svc.duration_minutes} min, ${svc.price} CHF`}
          >
            <Scissors size={19} strokeWidth={2.2} className="text-s-ink mb-[9px]" />
            <p className="font-heading font-semibold text-[13.5px] text-s-ink truncate">
              {svc.name}
            </p>
            <p className="text-[12px] text-s-ink-2 mt-[3px] flex items-center gap-1">
              <Clock size={11} className="shrink-0" />
              {svc.duration_minutes} min CHF {svc.price}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
