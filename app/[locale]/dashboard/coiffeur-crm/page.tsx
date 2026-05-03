"use client";

import { useEffect, useState } from "react";
import { BookOpen, ClipboardList, RefreshCw, BarChart3 } from "lucide-react";
import { useTranslations } from "next-intl";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import FormulaBook from "@/components/dashboard/coiffeur/FormulaBook";
import ConsultationNotes from "@/components/dashboard/coiffeur/ConsultationNotes";
import ColourCycleConfig from "@/components/dashboard/coiffeur/ColourCycleConfig";
import AllergyAlert from "@/components/dashboard/coiffeur/AllergyAlert";
import ClientSelectorDropdown from "@/components/shared/ClientSelectorDropdown";

type Tab = "formulas" | "consultations" | "cycles" | "metrics";

const TABS: { id: Tab; labelKey: string; icon: React.ElementType }[] = [
  { id: "formulas", labelKey: "tabFormulas", icon: BookOpen },
  { id: "consultations", labelKey: "tabConsultations", icon: ClipboardList },
  { id: "cycles", labelKey: "tabCycles", icon: RefreshCw },
  { id: "metrics", labelKey: "tabMetrics", icon: BarChart3 },
];

interface CycleMetrics {
  avg_days_between_visits: number;
  adherence_rate: number;
  total_tracked_clients: number;
  sparkline: number[];
  target_days: number;
}

export default function CoiffeurCRMPage() {
  const t = useTranslations("dashboardCoiffeur") as any;
  const [salonId, setSalonId] = useState<string | undefined>();
  const [salonName, setSalonName] = useState<string | undefined>();
  const [salonCategories, setSalonCategories] = useState<string[] | undefined>();
  const [loading, setLoading] = useState(true);
  const [clientId, setClientId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("formulas");
  const [cycleMetrics, setCycleMetrics] = useState<CycleMetrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((p) => {
        setSalonId(p?.salon_id);
        setSalonName(p?.salon_name);
        setSalonCategories(p?.salon_categories);
      })
      .catch((err) => console.error("[DashboardCoiffeurCRM] failed to fetch profile:", err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!salonId || activeTab !== "metrics") return;
    setMetricsLoading(true);
    fetch(`/api/dashboard/coiffeur/cycle-metrics?salon_id=${salonId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) setCycleMetrics(d); })
      .catch((err) => console.error("[DashboardCoiffeurCRM] failed to fetch cycle metrics:", err))
      .finally(() => setMetricsLoading(false));
  }, [salonId, activeTab]);

  return (
    <DashboardLayout salonName={salonName} salonCategories={salonCategories}>
      <div className="mb-6">
        <p className="text-[9px] font-heading font-bold uppercase tracking-[.20em] text-s-ink/50 mb-1">Coiffeur</p>
        <h1 className="font-heading font-bold text-[28px] text-s-ink leading-none">
          {t("pageTitle")}
        </h1>
      </div>

      {/* Client selector */}
      <div className="bg-white rounded-[12px] border border-s-ink/[0.06] p-4 mb-5">
        <p className="text-[9px] font-heading font-bold uppercase tracking-[.15em] text-s-ink/45 mb-2">
          {t("selectClient")}
        </p>
        <ClientSelectorDropdown
          salonId={salonId}
          value={clientId}
          onChange={setClientId}
          placeholder={t("clientPlaceholder")}
        />
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 overflow-x-auto pb-1 mb-5 scrollbar-hide">
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
        <>
          {/* ── Formulas ── */}
          {activeTab === "formulas" && <FormulaBook clientId={clientId} salonId={salonId} />}

          {/* ── Consultations ── */}
          {activeTab === "consultations" && (
            <div>
              <AllergyAlert allergies={null} />
              <ConsultationNotes clientId={clientId} salonId={salonId} />
            </div>
          )}

          {/* ── Colour Cycles ── */}
          {activeTab === "cycles" && <ColourCycleConfig salonId={salonId} />}

          {/* ── Metrics ── */}
          {activeTab === "metrics" && (
            <div className="space-y-4">
              {metricsLoading ? (
                <div className="h-32 animate-pulse bg-s-ink/[0.04] rounded-[12px]" />
              ) : cycleMetrics ? (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white rounded-[12px] border border-s-ink/[0.06] p-3 text-center">
                      <p className="text-2xl font-heading font-bold data-text text-s-coral">
                        {cycleMetrics.avg_days_between_visits}
                      </p>
                      <p className="text-[9px] text-s-ink/40 mt-1">{t("metricsAvgDays")}</p>
                    </div>
                    <div className="bg-white rounded-[12px] border border-s-ink/[0.06] p-3 text-center">
                      <p className="text-2xl font-heading font-bold data-text text-s-amber">
                        {cycleMetrics.adherence_rate}%
                      </p>
                      <p className="text-[9px] text-s-ink/40 mt-1">{t("metricsAdherence")}</p>
                    </div>
                    <div className="bg-white rounded-[12px] border border-s-ink/[0.06] p-3 text-center">
                      <p className="text-2xl font-heading font-bold data-text text-s-blue">
                        {cycleMetrics.total_tracked_clients}
                      </p>
                      <p className="text-[9px] text-s-ink/40 mt-1">{t("metricsClients")}</p>
                    </div>
                  </div>
                  {/* Sparkline */}
                  <div className="bg-white rounded-[12px] border border-s-ink/[0.06] p-4">
                    <p className="text-[9px] font-heading font-bold uppercase tracking-[.15em] text-s-ink/45 mb-3">
                      {t("metricsSparkTitle")}
                    </p>
                    <div className="flex items-end gap-1 h-12">
                      {cycleMetrics.sparkline.map((v, i) => {
                        const max = Math.max(...cycleMetrics.sparkline, 1);
                        return (
                          <div
                            key={i}
                            className="flex-1 bg-s-coral rounded-t-[3px] transition-[height]"
                            style={{ height: `${Math.max(4, (v / max) * 100)}%`, opacity: v === 0 ? 0.15 : 1 }}
                          />
                        );
                      })}
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-s-ink/40 text-center py-8">{t("noData")}</p>
              )}
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
}
