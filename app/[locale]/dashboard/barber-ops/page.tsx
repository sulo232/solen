"use client";

import { useEffect, useState } from "react";
import { Users, BarChart3, Scissors, Trophy } from "lucide-react";
import { useTranslations } from "next-intl";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import LiveQueuePanel from "@/components/dashboard/barber/LiveQueuePanel";
import ExpressMenu from "@/components/dashboard/barber/ExpressMenu";
import WalkinAnalytics from "@/components/dashboard/barber/WalkinAnalytics";
import WalkinHourlyChart from "@/components/dashboard/barber/WalkinHourlyChart";
import PLComparison from "@/components/dashboard/barber/PLComparison";
import FadeBlueprint from "@/components/dashboard/barber/FadeBlueprint";
import BarberLeaderboard from "@/components/dashboard/barber/BarberLeaderboard";
import ClientSelectorDropdown from "@/components/shared/ClientSelectorDropdown";

type Tab = "queue" | "analytics" | "blueprints" | "leaderboard";

const TABS: { id: Tab; labelKey: string; icon: React.ElementType }[] = [
  { id: "queue", labelKey: "tabQueue", icon: Users },
  { id: "analytics", labelKey: "tabAnalytics", icon: BarChart3 },
  { id: "blueprints", labelKey: "tabBlueprints", icon: Scissors },
  { id: "leaderboard", labelKey: "tabLeaderboard", icon: Trophy },
];

export default function BarberOpsPage() {
  const t = useTranslations("dashboardBarber") as any;
  const [salonId, setSalonId] = useState<string | undefined>();
  const [salonName, setSalonName] = useState<string | undefined>();
  const [salonCategories, setSalonCategories] = useState<string[] | undefined>();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("queue");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((p) => {
        setSalonId(p?.salon_id);
        setSalonName(p?.salon_name);
        setSalonCategories(p?.salon_categories);
      })
      .catch((err) => console.error("[DashboardBarberOps] failed to fetch profile:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout salonName={salonName} salonCategories={salonCategories}>
      <div className="mb-6">
        <p className="text-[9px] font-heading font-bold uppercase tracking-[.20em] text-s-ink/50 mb-1">
          Barber
        </p>
        <h1 className="font-heading font-bold text-[28px] text-s-ink dark:text-s-dm-text leading-none">
          {t("pageTitle")}
        </h1>
      </div>

      {/* Tab Nav */}
      <div className="flex gap-1 overflow-x-auto pb-1 mb-6 scrollbar-hide">
        {TABS.map(({ id, labelKey, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            aria-label={t(labelKey)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-pill text-xs font-heading font-semibold whitespace-nowrap transition-colors duration-150 shrink-0 ${
              activeTab === id
                ? "bg-s-coral text-white shadow-coral-glow"
                : "bg-s-ink/[0.05] text-s-ink/55 dark:bg-s-dm-text/[0.05] dark:text-s-dm-text/55 hover:bg-s-ink/[0.09] dark:hover:bg-s-dm-text/[0.09]"
            }`}
          >
            <Icon size={12} />
            {t(labelKey)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-64 bg-s-ink/[0.04] dark:bg-s-dm-text/[0.04] rounded-[12px]" />
          <div className="h-64 bg-s-ink/[0.04] dark:bg-s-dm-text/[0.04] rounded-[12px]" />
        </div>
      ) : !salonId ? null : (
        <>
          {/* ── Live Queue ── */}
          {activeTab === "queue" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
                <LiveQueuePanel salonId={salonId} />
                <ExpressMenu salonId={salonId} />
              </div>
            </div>
          )}

          {/* ── Analytics ── */}
          {activeTab === "analytics" && (
            <div className="space-y-4">
              <WalkinHourlyChart salonId={salonId} />
              <WalkinAnalytics salonId={salonId} />
              <PLComparison salonId={salonId} />
            </div>
          )}

          {/* ── Fade Blueprints ── */}
          {activeTab === "blueprints" && (
            <div className="space-y-4">
              {/* Client selector — required to save/load blueprints */}
              <div className="bg-white dark:bg-s-dm-surface rounded-[12px] border border-s-ink/[0.06] dark:border-white/[0.06] p-4">
                <p className="text-[10px] font-heading font-bold uppercase tracking-[.15em] text-s-ink/40 dark:text-s-dm-text/40 mb-2">
                  {t("selectClient")}
                </p>
                <ClientSelectorDropdown
                  salonId={salonId}
                  value={selectedClientId}
                  onChange={setSelectedClientId}
                  placeholder={t("clientPlaceholder")}
                />
              </div>
              <FadeBlueprint salonId={salonId} clientId={selectedClientId ?? undefined} />
            </div>
          )}

          {/* ── Leaderboard ── */}
          {activeTab === "leaderboard" && (
            <BarberLeaderboard salonId={salonId} />
          )}
        </>
      )}
    </DashboardLayout>
  );
}
