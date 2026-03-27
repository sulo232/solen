"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Search, User, Settings } from "lucide-react";
import BodyZoneSelector from "@/components/dashboard/waxing/BodyZoneSelector";
import SensitivityLog from "@/components/dashboard/waxing/SensitivityLog";
import RegrowthConfig from "@/components/dashboard/waxing/RegrowthConfig";
import ZonePackages from "@/components/dashboard/waxing/ZonePackages";
import Spinner from "@/components/ui/Spinner";

interface Client {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

type Tab = "client" | "settings";

export default function WaxingAdminPage() {
  const t = useTranslations("dashboardWaxing");
  const [activeTab, setActiveTab] = useState<Tab>("client");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [salonId, setSalonId] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetch("/api/dashboard/clients?category=waxing")
      .then((r) => r.json())
      .then((d) => {
        setClients(d.clients ?? []);
        setSalonId(d.salon_id ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredClients = clients.filter((c) =>
    (c.display_name ?? "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const TABS: { key: Tab; labelKey: string; icon: typeof User }[] = [
    { key: "client", labelKey: "tab_client", icon: User },
    { key: "settings", labelKey: "tab_settings", icon: Settings },
  ];

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="md" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <p className="text-[9px] font-heading font-bold uppercase tracking-[.18em] text-s-ink/30 dark:text-s-dm-text/30 mb-1">
        {t("eyebrow")}
      </p>
      <h1 className="font-heading font-bold text-[28px] text-s-ink dark:text-s-dm-text leading-none mb-6">
        {t("title")}
      </h1>

      {/* Tab bar */}
      <div className="flex border-b border-s-ink/[0.06] dark:border-s-dm-text/[0.06] mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            aria-label={t(tab.labelKey)}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-heading font-semibold border-b-2 transition-colors duration-150 ${
              activeTab === tab.key
                ? "border-s-coral text-s-coral"
                : "border-transparent text-s-ink/40 dark:text-s-dm-text/40"
            }`}
          >
            <tab.icon size={14} />
            {t(tab.labelKey)}
          </button>
        ))}
      </div>

      {/* Client tab */}
      {activeTab === "client" && (
        <div>
          {/* Client selector */}
          <div className="mb-6 max-w-md">
            <label className="text-[10px] font-heading font-bold uppercase tracking-[.10em] text-s-ink/30 dark:text-s-dm-text/30 mb-1 block">
              {t("select_client")}
            </label>
            <div className="relative">
              <Search
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-s-ink/30 dark:text-s-dm-text/30"
              />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("search_client")}
                aria-label={t("search_client")}
                className="w-full pl-8 pr-3 py-2 rounded-[8px] border border-s-ink/[0.06] dark:border-s-dm-text/[0.06] bg-white dark:bg-s-dm-surface text-sm text-s-ink dark:text-s-dm-text"
              />
            </div>
            {searchQuery && filteredClients.length > 0 && (
              <div className="mt-1 rounded-[8px] border border-s-ink/[0.06] dark:border-s-dm-text/[0.06] bg-white dark:bg-s-dm-surface max-h-48 overflow-y-auto">
                {filteredClients.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedClientId(c.id);
                      setSearchQuery(c.display_name ?? "");
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-s-ink dark:text-s-dm-text hover:bg-s-ink/[0.03] dark:hover:bg-s-dm-text/[0.03] transition-colors duration-150"
                  >
                    {c.display_name ?? t("unknown_client")}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Client components */}
          {selectedClientId && salonId ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <BodyZoneSelector
                salonId={salonId}
                clientId={selectedClientId}
              />
              <SensitivityLog
                salonId={salonId}
                clientId={selectedClientId}
              />
            </div>
          ) : (
            <p className="text-xs text-s-ink/30 dark:text-s-dm-text/30 text-center py-8">
              {t("select_client_prompt")}
            </p>
          )}
        </div>
      )}

      {/* Settings tab */}
      {activeTab === "settings" && salonId && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <RegrowthConfig salonId={salonId} />
          <ZonePackages salonId={salonId} />
        </div>
      )}
    </div>
  );
}
