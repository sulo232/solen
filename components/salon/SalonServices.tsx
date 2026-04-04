"use client";

import { useMemo, useState } from "react";
import { Clock, Scissors } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import { useTranslations, useLocale } from "next-intl";
import { usePostHog } from "posthog-js/react";
import { formatCurrency } from "@/lib/format-currency";
import ServiceCategoryFilter from "@/components/salon/ServiceCategoryFilter";
import type { Service } from "@/lib/types";

interface SalonServicesProps {
  services: Service[];
  salonId: string;
  onServiceSelect: (serviceId: string) => void;
  selectedServiceId?: string;
}

export default function SalonServices({ services, salonId, onServiceSelect, selectedServiceId }: SalonServicesProps) {
  const t = useTranslations("salonDetail");
  const locale = useLocale();
  const posthog = usePostHog();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const servicesByCategory = useMemo(() => {
    return services.reduce<Record<string, Service[]>>((acc, s) => {
      (acc[s.category] = acc[s.category] ?? []).push(s);
      return acc;
    }, {});
  }, [services]);

  const filterCategories = useMemo(() => {
    return Object.entries(servicesByCategory).map(([key, svcs]) => ({ key, count: svcs.length }));
  }, [servicesByCategory]);

  const filteredServicesByCategory = activeCategory
    ? { [activeCategory]: servicesByCategory[activeCategory] }
    : servicesByCategory;

  if (services.length === 0) {
    return (
      <div id="section-angebot" className="scroll-mt-[80px]">
        <EmptyState
          icon={Scissors}
          title={t("noServicesYet")}
          message={t("noServicesMessage")}
          zone={3}
        />
      </div>
    );
  }

  return (
    <div id="section-angebot" className="scroll-mt-[80px]">
      <h2 className="font-heading font-semibold text-base text-s-ink mb-3">{t("services")}</h2>
      <ServiceCategoryFilter
        categories={filterCategories}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        lang={locale}
      />

      <div>
        {Object.entries(filteredServicesByCategory).map(([cat, svcs]) => (
          <div key={cat} className="mb-4 mt-3 md:mt-0">
            <p className="text-[9px] font-heading font-bold uppercase tracking-[.18em] text-s-amber mb-3 mt-1">
              {cat}
            </p>
            <div className="divide-y divide-s-ink/5">
              {svcs.map((svc) => (
                <button
                  key={svc.id}
                  onClick={() => {
                    posthog?.capture("service_selected", {
                      salon_id: salonId,
                      service_id: svc.id,
                      service_name: svc.name_en || svc.name_de,
                    });
                    onServiceSelect(svc.id);
                  }}
                  className={`w-full flex items-center justify-between py-3.5 px-3 rounded-[12px] text-left transition-[background-color,border-color] duration-[200ms] ${
                    selectedServiceId === svc.id
                      ? "bg-s-coral/[0.08] border border-s-coral/20"
                      : "hover:bg-s-bg-surface border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div>
                      <p className="text-sm font-medium text-s-ink">
                        {locale === "de" ? svc.name_de : svc.name_en}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-1 text-xs text-s-ink/40">
                          <Clock size={10} /> {svc.duration_minutes} Min.
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    <span className="data-text font-semibold text-sm text-s-ink">
                      {formatCurrency(svc.price, locale)}
                    </span>
                    <span
                      className="text-[10px] font-heading font-bold uppercase tracking-[.08em] text-s-coral px-2.5 py-1 rounded-[12px]"
                      style={{ background: "rgba(232,98,74,.10)" }}
                    >
                      {t("book")}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
