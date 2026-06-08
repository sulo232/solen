"use client";

import { useEffect, useState } from "react";
import { Package, Gift, Users, Tag, Clock, Store } from "lucide-react";
import { useTranslations } from "next-intl";
import DashboardLayout from "@/components-legacy/dashboard/DashboardLayout";
import PromoManager from "@/components-legacy/dashboard/PromoManager";
import PackageManager from "@/components-legacy/dashboard/PackageManager";
import ReferralDashboard from "@/components-legacy/dashboard/ReferralDashboard";
import GiftCardManager from "@/components-legacy/dashboard/GiftCardManager";
import LastMinuteManager from "@/components-legacy/dashboard/LastMinuteManager";
import Spinner from "@/components-legacy/ui/Spinner";
import EmptyState from "@/components-legacy/ui/EmptyState";
import ErrorState from "@/components-legacy/ui/ErrorState";

type MarketingTab = "pakete" | "geschenkkarten" | "empfehlungen" | "aktionen" | "lastminute";

export default function MarketingPage() {
  const t = useTranslations("marketing") as any;
  const [tab, setTab] = useState<MarketingTab>("pakete");
  const [salonId, setSalonId] = useState<string | null>(null);
  const [loadingSalon, setLoadingSalon] = useState(true);
  // H2: a failed salon-resolution gets an error state + retry instead of the misleading
  // "loading salon…" text that never resolved.
  const [error, setError] = useState(false);

  const loadSalon = () => {
    setLoadingSalon(true);
    setError(false);
    fetch("/api/profile")
      .then((r) => { if (!r.ok) throw new Error(`profile ${r.status}`); return r.json(); })
      .then((d) => setSalonId(d.salon_id ?? null))
      .catch((err) => { console.error("[DashboardMarketing] failed to fetch salon id:", err); setError(true); setSalonId(null); })
      .finally(() => setLoadingSalon(false));
  };

  useEffect(() => { loadSalon(); }, []);

  const TABS: { key: MarketingTab; label: string; icon: React.ElementType }[] = [
    { key: "pakete", label: t("tab_packages"), icon: Package },
    { key: "geschenkkarten", label: t("tab_gift_cards"), icon: Gift },
    { key: "empfehlungen", label: t("tab_referrals"), icon: Users },
    { key: "aktionen", label: t("tab_promos"), icon: Tag },
    { key: "lastminute", label: t("tab_last_minute"), icon: Clock },
  ];

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="font-heading text-2xl text-s-ink">{t("title")}</h1>
        <p className="text-sm text-s-ink/40 mt-0.5">{t("subtitle")}</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
        {TABS.map((tab_item) => (
          <button
            key={tab_item.key}
            onClick={() => setTab(tab_item.key)}
            className={[
              "flex items-center gap-1.5 px-3 py-2 rounded-btn text-sm font-medium transition-colors whitespace-nowrap border",
              tab === tab_item.key
                ? "bg-s-accent-bright/10 text-s-accent-bright border-transparent"
                : "bg-white border-s-border text-s-ink-2 hover:bg-s-bg-sunken hover:text-s-ink",
            ].join(" ")}
          >
            <tab_item.icon size={14} />
            {tab_item.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="bg-white rounded-[16px] border border-s-ink/5 shadow-warm-md p-5">
        {loadingSalon ? (
          <div className="flex justify-center py-8"><Spinner size="md" /></div>
        ) : error && tab !== "aktionen" ? (
          <ErrorState title={t("loadErrorTitle")} message={t("loadErrorMessage")} retryLabel={t("retry")} onRetry={loadSalon} />
        ) : !salonId && tab !== "aktionen" ? (
          <EmptyState icon={Store} title={t("noSalonTitle")} message={t("noSalonMessage")} />
        ) : (
          <>
            {tab === "pakete" && salonId && <PackageManager salonId={salonId} />}
            {tab === "geschenkkarten" && salonId && <GiftCardManager salonId={salonId} />}
            {tab === "empfehlungen" && salonId && <ReferralDashboard salonId={salonId} />}
            {tab === "aktionen" && <PromoManager />}
            {tab === "lastminute" && salonId && <LastMinuteManager salonId={salonId} />}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
