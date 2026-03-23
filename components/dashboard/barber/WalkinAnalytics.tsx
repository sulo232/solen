"use client";

import { useEffect, useState } from "react";
import { Users, Clock, TrendingUp, Armchair, BarChart3 } from "lucide-react";

interface WalkinStats {
  total_walkins: number;
  total_appointments: number;
  avg_wait_minutes: number;
  conversion_rate: number;
  abandonment_rate: number;
  chair_utilization: number;
}

interface WalkinAnalyticsProps {
  salonId: string;
}

export default function WalkinAnalytics({ salonId }: WalkinAnalyticsProps) {
  const [stats, setStats] = useState<WalkinStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"week" | "month">("week");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`/api/dashboard/walkin-analytics?salon_id=${salonId}&period=${period}`);
        if (res.ok) {
          const data = await res.json();
          setStats(data.stats);
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
      label: "Walk-in vs Termin",
      value: `${stats.total_walkins}/${stats.total_appointments}`,
      icon: Users,
      color: "text-s-coral",
    },
    {
      label: "Ø Wartezeit",
      value: `${stats.avg_wait_minutes} Min.`,
      icon: Clock,
      color: "text-s-blue",
    },
    {
      label: "Conversion Rate",
      value: `${stats.conversion_rate}%`,
      icon: TrendingUp,
      color: "text-s-sage",
    },
    {
      label: "Abbruchrate",
      value: `${stats.abandonment_rate}%`,
      icon: BarChart3,
      color: "text-s-amber",
    },
    {
      label: "Stuhl-Auslastung",
      value: `${stats.chair_utilization}%`,
      icon: Armchair,
      color: "text-s-plum",
    },
  ] : [];

  return (
    <div className="rounded-card bg-white dark:bg-s-dm-surface border border-s-ink/5 dark:border-s-dm-text/10 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading text-sm font-bold text-s-ink dark:text-s-dm-text">Walk-in Statistiken</h3>
        <div className="flex rounded-button border border-s-ink/10 dark:border-s-dm-text/10 overflow-hidden">
          {(["week", "month"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 text-xs font-medium transition-colors ${
                period === p
                  ? "bg-s-coral text-white"
                  : "text-s-ink/50 dark:text-s-dm-text/50 hover:bg-s-bg-surface dark:hover:bg-s-dm-bg"
              }`}
            >
              {p === "week" ? "Woche" : "Monat"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-8 text-center text-sm text-s-ink/40 dark:text-s-dm-text/40">Laden...</div>
      ) : !stats ? (
        <div className="py-8 text-center text-sm text-s-ink/40 dark:text-s-dm-text/40">Keine Daten</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {metrics.map((m) => (
            <div key={m.label} className="rounded-button bg-s-bg-surface dark:bg-s-dm-bg p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <m.icon size={14} className={m.color} />
                <span className="text-xs text-s-ink/50 dark:text-s-dm-text/50">{m.label}</span>
              </div>
              <p className="text-lg font-bold text-s-ink dark:text-s-dm-text tabular-nums">{m.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
