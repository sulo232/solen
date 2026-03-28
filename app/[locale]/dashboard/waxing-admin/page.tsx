"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import BodyZoneSelector from "@/components/dashboard/waxing/BodyZoneSelector";
import RegrowthConfig from "@/components/dashboard/waxing/RegrowthConfig";
import SensitivityLog from "@/components/dashboard/waxing/SensitivityLog";
import ZonePackages from "@/components/dashboard/waxing/ZonePackages";
import ClientSelectorDropdown from "@/components/shared/ClientSelectorDropdown";

const TABS = ["Zonen", "Empfindlichkeit", "Nachwuchs", "Pakete"] as const;

export default function WaxingAdminPage() {
  const [salonId, setSalonId] = useState<string | undefined>();
  const [salonName, setSalonName] = useState<string | undefined>();
  const [salonCategories, setSalonCategories] = useState<string[] | undefined>();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [clientId, setClientId] = useState("");

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

  // Tabs 0 (Zonen) and 1 (Empfindlichkeit) need a client
  const needsClient = activeTab === 0 || activeTab === 1;

  return (
    <DashboardLayout salonName={salonName} salonCategories={salonCategories}>
      <div className="mb-6">
        <p className="text-[9px] font-heading font-bold uppercase tracking-[.20em] text-s-ink/30 mb-1">Waxing</p>
        <h1 className="font-heading font-bold text-[28px] text-s-ink dark:text-s-dm-text leading-none">
          Waxing Studio
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
        <div className="space-y-4">
          {/* Client ID picker for client-specific tabs */}
          {needsClient && (
            <div className="bg-white dark:bg-s-dm-surface rounded-card border border-s-ink/[0.06] p-4">
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

          {/* Tab content */}
          {activeTab === 0 && salonId && (
            clientId
              ? <BodyZoneSelector salonId={salonId} clientId={clientId} />
              : <EmptyClientPrompt />
          )}
          {activeTab === 1 && salonId && (
            clientId
              ? <SensitivityLog salonId={salonId} clientId={clientId} />
              : <EmptyClientPrompt />
          )}
          {activeTab === 2 && salonId && <RegrowthConfig salonId={salonId} />}
          {activeTab === 3 && salonId && <ZonePackages salonId={salonId} />}
        </div>
      )}
    </DashboardLayout>
  );
}

function EmptyClientPrompt() {
  return (
    <div className="rounded-card border border-s-ink/[0.06] border-dashed p-12 text-center bg-white dark:bg-s-dm-surface">
      <p className="text-xs font-heading text-s-ink/30 uppercase tracking-[.10em]">
        Kunden-ID eingeben, um weiterzufahren
      </p>
    </div>
  );
}
