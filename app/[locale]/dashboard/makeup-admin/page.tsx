"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import BridalPlanner from "@/components/dashboard/makeup/BridalPlanner";
import FaceChartBuilder from "@/components/dashboard/makeup/FaceChartBuilder";
import KitInventory from "@/components/dashboard/makeup/KitInventory";
import SkinToneMatcher from "@/components/dashboard/makeup/SkinToneMatcher";
import ClientSelectorDropdown from "@/components/shared/ClientSelectorDropdown";

const TABS = ["Braut", "Face Chart", "Kit", "Hauttöne"] as const;

export default function MakeupAdminPage() {
  const [salonId, setSalonId] = useState<string | undefined>();
  const [salonName, setSalonName] = useState<string | undefined>();
  const [salonCategories, setSalonCategories] = useState<string[] | undefined>();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [clientId, setClientId] = useState<string | null>(null);

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
        <p className="text-[9px] font-heading font-bold uppercase tracking-[.20em] text-s-ink/30 mb-1">Makeup</p>
        <h1 className="font-heading font-bold text-[28px] text-s-ink dark:text-s-dm-text leading-none">
          Makeup Studio
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
        <div className="h-64 bg-s-bg-sunken dark:bg-s-dm-raised rounded-[12px] animate-pulse" />
      ) : (
        <div className="space-y-4">
          {/* Client ID picker for client-specific tabs */}
          {(activeTab === 1 || activeTab === 3) && (
            <div className="bg-white dark:bg-s-dm-surface rounded-[12px] border border-s-ink/[0.06] p-4">
              <p className="text-[9px] font-heading font-bold uppercase tracking-[.18em] text-s-ink/35 mb-2">
                Kunden-ID
              </p>
              <ClientSelectorDropdown 
                salonId={salonId}
                value={clientId || null} 
                onChange={(id) => setClientId(id || "")} 
                placeholder="Kunde suchen oder auswählen..." 
              />
            </div>
          )}

          {activeTab === 0 && salonId && <BridalPlanner salonId={salonId} />}
          {activeTab === 1 && salonId && <FaceChartBuilder salonId={salonId} clientId={clientId} />}
          {activeTab === 2 && salonId && <KitInventory salonId={salonId} />}
          {activeTab === 3 && <SkinToneMatcher clientId={clientId} />}
        </div>
      )}
    </DashboardLayout>
  );
}
