"use client";

import { useEffect, useState } from "react";
import { Trophy, Medal, ArrowUpDown, Eye, EyeOff, BarChart2, Table2 } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { useTranslations } from "next-intl";

interface BarberStats {
  staff_id: string;
  staff_name: string;
  bookings_count: number;
  revenue: number;
  retention_pct: number;
  avg_tip: number;
  walkin_conversion_pct: number;
  chair_utilization_pct: number;
}

interface BarberLeaderboardProps {
  salonId: string;
}

type SortKey = keyof Omit<BarberStats, "staff_id" | "staff_name">;
type Period = "week" | "month";
type ViewMode = "table" | "chart";

const CHART_CORAL = "#E8624A";

export default function BarberLeaderboard({ salonId }: BarberLeaderboardProps) {
  const t = useTranslations("dashboard.barber_leaderboard") as any;
  const [stats, setStats] = useState<BarberStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortKey>("bookings_count");
  const [period, setPeriod] = useState<Period>("week");
  const [anonymized, setAnonymized] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/dashboard/barber-leaderboard?salon_id=${salonId}&period=${period}`);
        if (res.ok) {
          const data = await res.json();
          setStats(data.stats ?? []);
        }
      } catch {
        // Error loading
      }
      setLoading(false);
    };
    fetchStats();
  }, [salonId, period]);

  const sorted = [...stats].sort((a, b) => (b[sortBy] as number) - (a[sortBy] as number));

  const columns: { key: SortKey; label: string; format: (v: number) => string }[] = [
    { key: "bookings_count", label: t("bookings"), format: (v) => `${v}` },
    { key: "revenue", label: t("revenue"), format: (v) => `CHF ${v.toFixed(0)}` },
    { key: "retention_pct", label: t("retention"), format: (v) => `${v}%` },
    { key: "avg_tip", label: t("avg_tip"), format: (v) => `CHF ${v.toFixed(1)}` },
    { key: "walkin_conversion_pct", label: t("walkin_conv"), format: (v) => `${v}%` },
    { key: "chair_utilization_pct", label: t("chair_utilization"), format: (v) => `${v}%` },
  ];

  const getRankIcon = (rank: number) => {
    if (rank === 0) return <Trophy size={14} className="text-s-amber" />;
    if (rank === 1) return <Medal size={14} className="text-s-ink/40" />;
    if (rank === 2) return <Medal size={14} className="text-s-sand" />;
    return null;
  };

  const getDisplayName = (barber: BarberStats, index: number) =>
    anonymized ? `${t("barber")} ${String.fromCharCode(65 + index)}` : barber.staff_name;

  const chartData = sorted.map((b, i) => ({
    name: getDisplayName(b, i),
    [columns.find((c) => c.key === sortBy)?.label ?? t("value")]: b[sortBy],
  }));

  return (
    <div className="rounded-[16px] bg-white border border-s-ink/5 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy size={18} className="text-s-amber" />
          <h3 className="font-heading text-sm font-bold text-s-ink">{t("title")}</h3>
        </div>
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <button
            onClick={() => setViewMode(viewMode === "table" ? "chart" : "table")}
            aria-pressed={viewMode === "chart"}
            className="p-1.5 rounded-btn text-s-ink/40 hover:bg-s-bg-surface transition-colors duration-150"
            title={viewMode === "table" ? t("view_chart") : t("view_table")}
            aria-label={viewMode === "table" ? t("view_chart") : t("view_table")}
          >
            {viewMode === "table" ? <BarChart2 size={14} /> : <Table2 size={14} />}
          </button>
          {/* Anonymize toggle */}
          <button
            onClick={() => setAnonymized(!anonymized)}
            aria-pressed={anonymized}
            className="p-1.5 rounded-btn text-s-ink/40 hover:bg-s-bg-surface transition-colors duration-150"
            title={anonymized ? t("show_names") : t("anonymize")}
            aria-label={anonymized ? t("show_names") : t("anonymize")}
          >
            {anonymized ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
          {/* Period toggle */}
          <div className="flex rounded-btn border border-s-ink/10 overflow-hidden">
            {(["week", "month"] as Period[]).map((p) => (
              <button
                key={p}
                aria-pressed={period === p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 text-xs font-medium transition-colors duration-150 ${
                  period === p
                    ? "bg-s-coral text-white"
                    : "text-s-ink/50 hover:bg-s-bg-surface"
                }`}
              >
                {p === "week" ? t("week") : t("month")}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-8 text-center text-sm text-s-ink/40">{t("loading")}</div>
      ) : stats.length === 0 ? (
        <div className="py-8 text-center text-sm text-s-ink/40">{t("no_data")}</div>
      ) : viewMode === "chart" ? (
        /* ═══ CHART VIEW ═══ */
        <div>
          {/* Metric selector for chart */}
          <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
            {columns.map((col) => (
              <button
                key={col.key}
                onClick={() => setSortBy(col.key)}
                className={`px-2 py-1 rounded-btn text-xs whitespace-nowrap transition-colors duration-150 ${
                  sortBy === col.key
                    ? "bg-s-coral/10 text-s-coral font-medium"
                    : "text-s-ink/40 hover:text-s-ink"
                }`}
              >
                {col.label}
              </button>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EDE5D8" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#1A1209", fillOpacity: 0.4 }} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#1A1209", fillOpacity: 0.4 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #EDE5D8" }} />
              <Bar
                dataKey={columns.find((c) => c.key === sortBy)?.label ?? t("value")}
                fill={CHART_CORAL}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        /* ═══ TABLE VIEW ═══ */
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-s-ink/5">
                <th className="text-left py-2 text-xs font-medium text-s-ink/50 pr-4">#</th>
                <th className="text-left py-2 text-xs font-medium text-s-ink/50 pr-4">{t("barber")}</th>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => setSortBy(col.key)}
                    className="text-right py-2 text-xs font-medium text-s-ink/50 cursor-pointer hover:text-s-ink pr-3 whitespace-nowrap"
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      {sortBy === col.key && <ArrowUpDown size={10} />}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((barber, i) => (
                <tr key={barber.staff_id} className="border-b border-s-ink/5 last:border-0">
                  <td className="py-2.5 pr-4">
                    <span className="inline-flex items-center gap-1">
                      {getRankIcon(i) ?? <span className="text-s-ink/40 font-medium">{i + 1}</span>}
                    </span>
                  </td>
                  <td className="py-2.5 text-s-ink pr-4 font-medium whitespace-nowrap">
                    {getDisplayName(barber, i)}
                  </td>
                  {columns.map((col) => (
                    <td key={col.key} className="py-2.5 text-right text-s-ink/70 pr-3 tabular-nums whitespace-nowrap">
                      {col.format(barber[col.key] as number)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
