"use client";

import { useEffect, useState } from "react";
import { Users, Clock, TrendingUp, Armchair, BarChart3 } from "lucide-react";
import MiniSparkline from "@/components-legacy/dashboard/MiniSparkline";

interface WalkinStats {
  total_walkins: number;
  total_appointments: number;
  avg_wait_minutes: number;
  conversion_rate: number;
  abandonment_rate: number;
  chair_utilization: number;
}

interface Trends {
  walkins: number[];
  waits: number[];
  conversions: number[];
  abandonments: number[];
}

interface WalkinAnalyticsProps {
  salonId: string;
}

import { useTranslations } from "next-intl";

export default function WalkinAnalytics({ salonId }: WalkinAnalyticsProps) {
  const tc = useTranslations("common");
  const t = useTranslations("walkinAnalytics") as any;
  const [stats, setStats] = useState<WalkinStats | null>(null);
  const [trends, setTrends] = useState<Trends | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"week" | "month">("week");

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/dashboard/walkin-analytics?salon_id=${salonId}&period=${period}`);
        if (res.ok) {
          const data = await res.json();
          setStats(data.stats);
          setTrends(data.trends ?? null);
        }
      } catch {
        // Error
      }
      setLoading(false);
    };
    fetchStats();
  }, [salonId, period]);

  const metrics = stats ? [
    {
      label: t("walkin_rate"),
      value: `${stats.total_walkins}/${stats.total_appointments}`,
      icon: Users,
      color: "#276EF1",
      trend: trends?.walkins,
    },
    {
      label: t("avg_wait"),
      value: t("minutes", { minutes: stats.avg_wait_minutes }),
      icon: Clock,
      color: "#276EF1",
      trend: trends?.waits,
    },
    {
      label: t("conversion_rate"),
      value: `${stats.conversion_rate}%`,
      icon: TrendingUp,
      color: "#16A34A",
      trend: trends?.conversions,
    },
    {
      label: t("abandonment_rate"),
      value: `${stats.abandonment_rate}%`,
      icon: BarChart3,
      color: "#DC2626",
      trend: trends?.abandonments,
    },
    {
      label: t("chair_utilization"),
      value: `${stats.chair_utilization}%`,
      icon: Armchair,
      color: "#276EF1",
      trend: undefined,
    },
  ] : [];

  return (
    <div className="rounded-card bg-white border border-s-ink/5 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading text-sm font-semibold text-s-ink">{t("title")}</h3>
        <div className="flex rounded-btn border border-s-border overflow-hidden">
          {(["week", "month"] as const).map((p) => (
            <button
              key={p}
              aria-pressed={period === p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 text-xs font-medium transition-colors duration-150 ${
                period === p
                  ? "bg-s-ink text-white"
                  : "text-s-ink-2 hover:bg-s-bg-surface"
              }`}
            >
              {p === "week" ? t("week") : t("month")}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-8 text-center text-sm text-s-ink/40">{tc("loading")}</div>
      ) : !stats ? (
        <div className="py-8 text-center text-sm text-s-ink/40">{t("no_data")}</div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {metrics.map((m) => (
            <div key={m.label} className="bg-white rounded-card border border-s-ink/5 p-4">
              <p className="text-[12px] tracking-[0.2em] uppercase text-s-ink-2 font-heading">
                {m.label}
              </p>
              <p className="text-2xl font-heading text-s-ink data-text mt-1">
                {m.value}
              </p>
              {m.trend && <MiniSparkline data={m.trend} color={m.color} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
