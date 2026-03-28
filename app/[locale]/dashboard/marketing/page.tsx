"use client";

import { useState } from "react";
import { Package, Gift, Users, Tag, ArrowRight } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import PromoManager from "@/components/dashboard/PromoManager";
import PackageManager from "@/components/dashboard/PackageManager";
import ReferralDashboard from "@/components/dashboard/ReferralDashboard";
import GiftCardManager from "@/components/dashboard/GiftCardManager";

type MarketingTab = "pakete" | "geschenkkarten" | "empfehlungen" | "aktionen";

const TABS: { key: MarketingTab; label: string; icon: typeof Package }[] = [
  { key: "pakete", label: "Pakete", icon: Package },
  { key: "geschenkkarten", label: "Geschenkkarten", icon: Gift },
  { key: "empfehlungen", label: "Empfehlungen", icon: Users },
  { key: "aktionen", label: "Aktionen", icon: Tag },
];

export default function MarketingPage() {
  const [tab, setTab] = useState<MarketingTab>("pakete");
  const [salonId, setSalonId] = useState<string | null>(null);

  // Fetch salonId from session
  useState(() => {
    fetch("/api/salon/mine")
      .then((r) => r.json())
      .then((d) => setSalonId(d.salon?.id ?? d.id ?? null))
      .catch(() => {});
  });

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="font-heading font-bold text-2xl text-s-ink dark:text-s-dm-text">Marketing</h1>
        <p className="text-sm text-s-ink/40 dark:text-s-dm-text/40 mt-0.5">Pakete, Geschenkkarten, Empfehlungen & Aktionen</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={[
              "flex items-center gap-1.5 px-3 py-2 rounded-btn text-sm font-medium transition-colors whitespace-nowrap",
              tab === t.key
                ? "bg-s-coral text-white"
                : "bg-white dark:bg-s-dm-surface text-s-ink/50 dark:text-s-dm-text/50 hover:text-s-ink dark:hover:text-s-dm-text border border-s-ink/5 dark:border-white/5",
            ].join(" ")}
          >
            <t.icon size={14} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="bg-white dark:bg-s-dm-surface rounded-[12px] border border-s-ink/5 dark:border-white/5 shadow-warm-md p-5">
        {tab === "pakete" && salonId && <PackageManager salonId={salonId} />}
        {tab === "geschenkkarten" && salonId && <GiftCardManager salonId={salonId} />}
        {tab === "empfehlungen" && salonId && <ReferralDashboard salonId={salonId} />}
        {tab === "aktionen" && <PromoManager />}
        {!salonId && tab !== "aktionen" && (
          <p className="text-sm text-s-ink/30 dark:text-s-dm-text/30 text-center py-8">Salon wird geladen...</p>
        )}
      </div>
    </DashboardLayout>
  );
}
