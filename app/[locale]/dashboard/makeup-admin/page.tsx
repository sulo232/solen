"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Palette } from "lucide-react";
import Spinner from "@/components/ui/Spinner";
import FaceChartBuilder from "@/components/dashboard/makeup/FaceChartBuilder";
import BridalPlanner from "@/components/dashboard/makeup/BridalPlanner";
import KitInventory from "@/components/dashboard/makeup/KitInventory";
import SkinToneMatcher from "@/components/dashboard/makeup/SkinToneMatcher";

const TABS = ["clients", "events", "kit"] as const;
type Tab = typeof TABS[number];

export default function MakeupAdminPage() {
  const t = useTranslations("dashboardMakeup");
  const [salonId, setSalonId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("clients");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [clientInput, setClientInput] = useState("");

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((p) => { if (p?.salon_id) setSalonId(p.salon_id); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-6 flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!salonId) {
    return (
      <div className="p-6">
        <p className="text-sm text-s-ink/50 dark:text-s-dm-text/50">{t("no_salon")}</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Page header */}
      <p className="text-[9px] font-heading font-bold uppercase tracking-[.18em] text-s-ink/30 dark:text-s-dm-text/30 mb-1">
        {t("eyebrow")}
      </p>
      <div className="flex items-center gap-2 mb-6">
        <Palette size={20} className="text-s-coral" />
        <h1 className="font-heading font-bold text-[28px] text-s-ink dark:text-s-dm-text leading-none">
          {t("title")}
        </h1>
      </div>

      {/* Tab bar — overflow-x-auto on mobile */}
      <div className="flex gap-4 border-b border-s-ink/[0.06] dark:border-s-dm-text/[0.06] mb-6 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2 text-xs font-heading font-semibold transition-colors duration-150 border-b-2 whitespace-nowrap ${
              activeTab === tab
                ? "border-s-coral text-s-coral"
                : "border-transparent text-s-ink/40 dark:text-s-dm-text/40"
            }`}
            aria-label={t(`tabs.${tab}`)}
          >
            {t(`tabs.${tab}`)}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "clients" && (
        <div className="space-y-6">
          {/* Client ID input */}
          <div className="space-y-1">
            <label className="text-[10px] font-heading font-bold uppercase tracking-[.10em] text-s-ink/40 dark:text-s-dm-text/40">
              {t("client_id_label")}
            </label>
            <div className="flex gap-2">
              <input
                value={clientInput}
                onChange={(e) => setClientInput(e.target.value)}
                placeholder={t("client_id_placeholder")}
                className="flex-1 px-3 py-2 rounded-[8px] border border-s-ink/[0.10] dark:border-s-dm-text/[0.10] bg-transparent text-xs text-s-ink dark:text-s-dm-text"
                aria-label={t("client_id_label")}
              />
              <button
                onClick={() => setSelectedClientId(clientInput.trim() || null)}
                className="px-4 py-2 min-h-[44px] rounded-[8px] bg-s-coral text-white text-[11px] font-heading font-bold uppercase tracking-[.06em] hover:brightness-[1.06] active:scale-[0.98] transition-all"
                aria-label={t("select")}
              >
                {t("select")}
              </button>
            </div>
          </div>

          <FaceChartBuilder salonId={salonId} clientId={selectedClientId} />
          <SkinToneMatcher clientId={selectedClientId} />
        </div>
      )}

      {activeTab === "events" && (
        <BridalPlanner salonId={salonId} />
      )}

      {activeTab === "kit" && (
        <KitInventory salonId={salonId} />
      )}
    </div>
  );
}
