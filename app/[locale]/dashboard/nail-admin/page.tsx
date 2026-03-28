"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import AiArtGenerator from "@/components/dashboard/nail/AiArtGenerator";
import DynamicPricingConfig from "@/components/dashboard/nail/DynamicPricingConfig";
import StationManager from "@/components/dashboard/nail/StationManager";
import RetailManager from "@/components/dashboard/nail/RetailManager";

const TABS = ["AI Art", "Preise", "Stationen", "Retail"] as const;

export default function NailAdminPage() {
  const [salonId, setSalonId] = useState<string | undefined>();
  const [salonName, setSalonName] = useState<string | undefined>();
  const [salonCategories, setSalonCategories] = useState<string[] | undefined>();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((p) => {
        setSalonId(p?.salon_id);
        setSalonName(p?.salon_name);
        setSalonCategories(p?.salon_categories);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout salonName={salonName} salonCategories={salonCategories}>
      <div className="mb-6">
        <p className="text-[9px] font-heading font-bold uppercase tracking-[.20em] text-s-ink/30 mb-1">Nails</p>
        <h1 className="font-heading font-bold text-[28px] text-s-ink dark:text-s-dm-text leading-none">
          Nagel Verwaltung
        </h1>
      </div>

      {/* Scrollable tab nav */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
        {TABS.map((tab, idx) => (
          <button
            key={tab}
            onClick={() => setActiveTab(idx)}
            className={`shrink-0 px-4 py-2 rounded-[12px] text-[11px] font-heading font-bold uppercase tracking-[.06em] transition-colors ${
              activeTab === idx
                ? "bg-s-coral text-white"
                : "bg-white dark:bg-s-dm-surface border border-s-ink/[0.06] text-s-ink/55 dark:text-s-dm-text/55 hover:text-s-ink"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="h-64 bg-s-bg-sunken dark:bg-s-dm-raised rounded-card animate-pulse" />
      ) : (
        <div>
          {activeTab === 0 && salonId && <AiArtGenerator salonId={salonId} />}
          {activeTab === 1 && salonId && <DynamicPricingConfig salonId={salonId} />}
          {activeTab === 2 && salonId && <StationManager salonId={salonId} />}
          {activeTab === 3 && salonId && <RetailManager salonId={salonId} />}
        </div>
      )}
    </DashboardLayout>
  );
}
