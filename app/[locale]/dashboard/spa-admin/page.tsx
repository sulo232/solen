"use client";

import { useEffect, useState } from "react";
import { DoorOpen, ShieldCheck, BookHeart } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import RoomManager from "@/components/dashboard/spa/RoomManager";
import SpaIntake from "@/components/dashboard/spa/SpaIntake";
import WellnessJournal from "@/components/dashboard/spa/WellnessJournal";
import ClientSelectorDropdown from "@/components/shared/ClientSelectorDropdown";

const TABS = [
  { label: "Räume", icon: DoorOpen },
  { label: "Gesundheit", icon: ShieldCheck },
  { label: "Journal", icon: BookHeart },
] as const;

export default function SpaAdminPage() {
  const [salonId, setSalonId] = useState<string | undefined>();
  const [salonName, setSalonName] = useState<string | undefined>();
  const [salonCategories, setSalonCategories] = useState<string[] | undefined>();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  // Client ID state for per-client views
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

  return (
    <DashboardLayout salonName={salonName} salonCategories={salonCategories}>
      <div className="mb-6">
        <p className="text-[9px] font-heading font-bold uppercase tracking-[.20em] text-s-ink/30 mb-1">Spa</p>
        <h1 className="font-heading font-bold text-[28px] text-s-ink dark:text-s-dm-text leading-none">
          Spa Verwaltung
        </h1>
      </div>

      {/* Tab Nav */}
      <div className="flex gap-1 mb-6 border-b border-s-ink/[0.06] overflow-x-auto pb-px">
        {TABS.map((tab, idx) => {
          const active = activeTab === idx;
          const Icon = tab.icon;
          return (
            <button
              key={tab.label}
              onClick={() => setActiveTab(idx)}
              className={`flex items-center gap-2 px-4 py-2.5 text-[11px] font-heading font-bold uppercase tracking-[.10em] transition-colors border-b-2 shrink-0 ${
                active
                  ? "border-s-coral text-s-coral"
                  : "border-transparent text-s-ink/40 hover:text-s-ink/60 dark:text-s-dm-text/40"
              }`}
            >
              <Icon size={13} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-64 bg-s-bg-sunken dark:bg-s-dm-raised rounded-[12px]" />
        </div>
      ) : (
        <div>
          {activeTab === 0 && salonId && <RoomManager salonId={salonId} />}

          {activeTab === 1 && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-s-dm-surface rounded-[12px] border border-s-ink/[0.06] p-4">
                <p className="text-[9px] font-heading font-bold uppercase tracking-[.18em] text-s-ink/35 mb-2">
                  Kunden-ID (für Gesundheitsformular)
                </p>
                <ClientSelectorDropdown 
                  salonId={salonId}
                  value={clientId || null} 
                  onChange={(id) => setClientId(id || "")} 
                  placeholder="Kunde suchen oder auswählen..." 
                />
              </div>
              {clientId ? (
                <SpaIntake customerId={clientId} />
              ) : (
                <div className="rounded-[12px] border border-s-ink/[0.06] border-dashed p-12 text-center bg-white dark:bg-s-dm-surface">
                  <p className="text-xs font-heading text-s-ink/30 uppercase tracking-[.10em]">
                    Kunden-ID eingeben, um Gesundheitsformular anzuzeigen
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 2 && salonId && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-s-dm-surface rounded-[12px] border border-s-ink/[0.06] p-4">
                <p className="text-[9px] font-heading font-bold uppercase tracking-[.18em] text-s-ink/35 mb-2">
                  Kunden-ID (für Wellness Journal)
                </p>
                <ClientSelectorDropdown 
                  salonId={salonId}
                  value={clientId || null} 
                  onChange={(id) => setClientId(id || "")} 
                  placeholder="Kunde suchen oder auswählen..." 
                />
              </div>
              {clientId ? (
                <WellnessJournal salonId={salonId} clientId={clientId} />
              ) : (
                <div className="rounded-[12px] border border-s-ink/[0.06] border-dashed p-12 text-center bg-white dark:bg-s-dm-surface">
                  <p className="text-xs font-heading text-s-ink/30 uppercase tracking-[.10em]">
                    Kunden-ID eingeben, um Journal anzuzeigen
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
