"use client";

import { useEffect, useState } from "react";
import { Package, Gift, Users, Tag } from "lucide-react";
import { useTranslations } from "next-intl";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import PromoManager from "@/components/dashboard/PromoManager";
import PackageManager from "@/components/dashboard/PackageManager";
import ReferralDashboard from "@/components/dashboard/ReferralDashboard";
import GiftCardManager from "@/components/dashboard/GiftCardManager";
import Spinner from "@/components/ui/Spinner";

type MarketingTab = "pakete" | "geschenkkarten" | "empfehlungen" | "aktionen";

export default function MarketingPage() {
  const t = useTranslations("marketing") as any;
  const [tab, setTab] = useState<MarketingTab>("pakete");
  const [salonId, setSalonId] = useState<string | null>(null);
  const [loadingSalon, setLoadingSalon] = useState(true);

  useEffect(() => {
    fetch("/api/salon/mine")
      .then((r) => r.json())
      .then((d) => setSalonId(d.salon?.id ?? d.id ?? null))
      .catch(() => {})
      .finally(() => setLoadingSalon(false));
  }, []);

  const TABS: { key: MarketingTab; label: string; icon: React.ElementType }[] = [
    { key: "pakete", label: t("tab_packages"), icon: Package },
    { key: "geschenkkarten", label: t("tab_gift_cards"), icon: Gift },
    { key: "empfehlungen", label: t("tab_referrals"), icon: Users },
    { key: "aktionen", label: t("tab_promos"), icon: Tag },
  ];

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="font-heading font-bold text-2xl text-s-ink dark:text-s-dm-text">{t("title")}</h1>
        <p className="text-sm text-s-ink/40 dark:text-s-dm-text/40 mt-0.5">{t("subtitle")}</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
        {TABS.map((tab_item) => (
          <button
            key={tab_item.key}
            onClick={() => setTab(tab_item.key)}
            className={[
              "flex items-center gap-1.5 px-3 py-2 rounded-btn text-sm font-medium transition-colors whitespace-nowrap",
              tab === tab_item.key
                ? "bg-s-coral text-white"
                : "bg-white dark:bg-s-dm-surface text-s-ink/50 dark:text-s-dm-text/50 hover:text-s-ink dark:hover:text-s-dm-text border border-s-ink/5 dark:border-white/5",
            ].join(" ")}
          >
            <tab_item.icon size={14} />
            {tab_item.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="bg-white dark:bg-s-dm-surface rounded-[12px] border border-s-ink/5 dark:border-white/5 shadow-warm-md p-5">
        {loadingSalon ? (
          <div className="flex justify-center py-8"><Spinner size="md" /></div>
        ) : !salonId && tab !== "aktionen" ? (
          <p className="text-sm text-s-ink/30 dark:text-s-dm-text/30 text-center py-8">{t("loading_salon")}</p>
        ) : (
          <>
            {tab === "pakete" && salonId && <PackageManager salonId={salonId} />}
            {tab === "geschenkkarten" && salonId && <GiftCardManager salonId={salonId} />}
            {tab === "empfehlungen" && salonId && <ReferralDashboard salonId={salonId} />}
            {tab === "aktionen" && <PromoManager />}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
