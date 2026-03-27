"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Leaf, Users } from "lucide-react";
import RoomManager from "@/components/dashboard/spa/RoomManager";
import SpaIntake from "@/components/dashboard/spa/SpaIntake";
import WellnessJournal from "@/components/dashboard/spa/WellnessJournal";

interface Client {
  id: string;
  display_name: string;
  avatar_url?: string;
}

export default function SpaAdminPage() {
  const t = useTranslations("dashboardSpa");
  const [activeTab, setActiveTab] = useState<"rooms" | "client">("rooms");
  const [salonId, setSalonId] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [loadingClients, setLoadingClients] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/clients")
      .then((r) => (r.ok ? r.json() : { clients: [], salon_id: null }))
      .then((d) => {
        setClients(d.clients ?? []);
        setSalonId(d.salon_id ?? null);
        if (d.clients?.length) setSelectedClientId(d.clients[0].id);
      })
      .catch(() => {})
      .finally(() => setLoadingClients(false));
  }, []);

  return (
    <div className="p-6 max-w-4xl">
      {/* Header */}
      <p className="text-[9px] font-heading font-bold uppercase tracking-[.18em] text-s-ink/30 dark:text-s-dm-text/30 mb-1">
        {t("eyebrow")}
      </p>
      <h1 className="font-heading font-bold text-[28px] text-s-ink dark:text-s-dm-text leading-none mb-6">
        {t("title")}
      </h1>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-s-ink/[0.06] dark:border-s-dm-text/[0.06] mb-6 overflow-x-auto">
        {(["rooms", "client"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2 text-xs font-heading font-semibold whitespace-nowrap transition-colors duration-150 border-b-2 ${
              activeTab === tab
                ? "border-s-coral text-s-coral"
                : "border-transparent text-s-ink/40 dark:text-s-dm-text/40"
            }`}
          >
            {t(`tabs.${tab}`)}
          </button>
        ))}
      </div>

      {/* Rooms Tab */}
      {activeTab === "rooms" && salonId && (
        <RoomManager salonId={salonId} />
      )}

      {/* Client Tab */}
      {activeTab === "client" && (
        <div className="space-y-6">
          {/* Client Selector */}
          <div className="flex items-center gap-3">
            <Users size={14} className="text-s-ink/40 dark:text-s-dm-text/40 shrink-0" />
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              aria-label={t("select_client")}
              className="flex-1 max-w-xs rounded-[8px] border border-s-ink/[0.10] dark:border-s-dm-text/[0.10] px-3 py-2 text-xs bg-transparent text-s-ink dark:text-s-dm-text focus:outline-none focus:ring-2 focus:ring-s-coral/30"
            >
              {loadingClients ? (
                <option>{t("loading")}</option>
              ) : clients.length === 0 ? (
                <option>{t("no_clients")}</option>
              ) : (
                clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.display_name || c.id}</option>
                ))
              )}
            </select>
          </div>

          {selectedClientId && salonId && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Intake */}
              <div className="w-full max-w-lg">
                <SpaIntake customerId={selectedClientId} />
              </div>
              {/* Journal */}
              <div className="w-full max-w-2xl">
                <WellnessJournal salonId={salonId} clientId={selectedClientId} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Loading state */}
      {!salonId && !loadingClients && (
        <div className="rounded-[12px] border border-s-ink/[0.06] dark:border-s-dm-text/[0.06] border-dashed p-8 text-center bg-white dark:bg-s-dm-surface">
          <Leaf size={24} className="mx-auto mb-2 text-s-ink/20 dark:text-s-dm-text/20" />
          <p className="text-xs font-heading text-s-ink/30 dark:text-s-dm-text/30 uppercase tracking-[.10em]">
            {t("no_salon")}
          </p>
        </div>
      )}
    </div>
  );
}
