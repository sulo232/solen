"use client";

import { useEffect, useState } from "react";
import { Sparkles, Tag, Layers, ShoppingBag, ImageIcon, Bell } from "lucide-react";
import { useTranslations } from "next-intl";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import AiArtGenerator from "@/components/dashboard/nail/AiArtGenerator";
import AiArtGallery from "@/components/dashboard/nail/AiArtGallery";
import DynamicPricingConfig from "@/components/dashboard/nail/DynamicPricingConfig";
import StationManager from "@/components/dashboard/nail/StationManager";
import RetailManager from "@/components/dashboard/nail/RetailManager";
import RetailSalesDashboard from "@/components/dashboard/nail/RetailSalesDashboard";
import InfillReminderConfig from "@/components/dashboard/nail/InfillReminderConfig";

type Tab = "ai" | "gallery" | "prices" | "stations" | "retail" | "sales" | "reminders";

const TABS: { id: Tab; labelKey: string; icon: React.ElementType }[] = [
  { id: "ai", labelKey: "tabAI", icon: Sparkles },
  { id: "gallery", labelKey: "tabGallery", icon: ImageIcon },
  { id: "prices", labelKey: "tabPrices", icon: Tag },
  { id: "stations", labelKey: "tabStations", icon: Layers },
  { id: "retail", labelKey: "tabRetail", icon: ShoppingBag },
  { id: "sales", labelKey: "tabSales", icon: ShoppingBag },
  { id: "reminders", labelKey: "tabReminders", icon: Bell },
];

export default function NailAdminPage() {
  const t = useTranslations("nail_dashboard") as any;
  const [salonId, setSalonId] = useState<string | undefined>();
  const [salonName, setSalonName] = useState<string | undefined>();
  const [salonCategories, setSalonCategories] = useState<string[] | undefined>();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("ai");

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((p) => {
        setSalonId(p?.salon_id);
        setSalonName(p?.salon_name);
        setSalonCategories(p?.salon_categories);
      })
      .catch((err) => console.error("[DashboardNailAdmin] Failed to fetch salon profile:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout salonName={salonName} salonCategories={salonCategories}>
      <div className="mb-6">
        <p className="text-[9px] font-heading font-bold uppercase tracking-[.20em] text-s-ink/50 mb-1">Nails</p>
        <h1 className="font-heading font-bold text-[28px] text-s-ink leading-none">
          {t("pageTitle")}
        </h1>
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 overflow-x-auto pb-1 mb-6 scrollbar-hide">
        {TABS.map(({ id, labelKey, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            aria-label={t(labelKey)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-pill text-xs font-heading font-semibold whitespace-nowrap transition-colors duration-150 shrink-0 ${
              activeTab === id
                ? "bg-s-coral text-white shadow-elevation-2"
                : "bg-s-ink/[0.05] text-s-ink/55 hover:bg-s-ink/[0.09]"
            }`}
          >
            <Icon size={12} />
            {t(labelKey)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="h-64 bg-s-ink/[0.04] rounded-[12px] animate-pulse" />
      ) : !salonId ? null : (
        <div>
          {activeTab === "ai" && <AiArtGenerator />}
          {activeTab === "gallery" && <AiArtGallery salonId={salonId} />}
          {activeTab === "prices" && <DynamicPricingConfig salonId={salonId} />}
          {activeTab === "stations" && <StationManager salonId={salonId} />}
          {activeTab === "retail" && <RetailManager salonId={salonId} />}
          {activeTab === "sales" && <RetailSalesDashboard salonId={salonId} />}
          {activeTab === "reminders" && <InfillReminderConfig salonId={salonId} />}
        </div>
      )}
    </DashboardLayout>
  );
}
