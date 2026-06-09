"use client";

import { useEffect, useState } from "react";
import { Trophy, Eye, EyeOff, BarChart2, Table2 } from "lucide-react";
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

const CHART_ACCENT = "#276EF1";

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
    // #1 = yellow trophy (s-star, the universal achievement/rating signal, matches mockup).
    // Ranks 2+ render as a plain number in the card (mockup 10b shows numbers, not medals).
    if (rank === 0) return <Trophy size={18} className="text-s-star shrink-0" />;
    return null;
  };

  const getDisplayName = (barber: BarberStats, index: number) =>
    anonymized ? `${t("barber")} ${String.fromCharCode(65 + index)}` : barber.staff_name;

  const chartData = sorted.map((b, i) => ({
    name: getDisplayName(b, i),
    [columns.find((c) => c.key === sortBy)?.label ?? t("value")]: b[sortBy],
  }));

  return (
    <div className="rounded-[16px] bg-white border border-s-border p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy size={18} className="text-s-star" />
          <h3 className="font-heading text-sm font-semibold text-s-ink">{t("title")}</h3>
        </div>
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <button
            onClick={() => setViewMode(viewMode === "table" ? "chart" : "table")}
            aria-pressed={viewMode === "chart"}
            className="p-1.5 rounded-btn text-s-ink-2 hover:bg-s-bg-sunken transition-colors duration-150"
            title={viewMode === "table" ? t("view_chart") : t("view_table")}
            aria-label={viewMode === "table" ? t("view_chart") : t("view_table")}
          >
            {viewMode === "table" ? <BarChart2 size={14} /> : <Table2 size={14} />}
          </button>
          {/* Anonymize toggle */}
          <button
            onClick={() => setAnonymized(!anonymized)}
            aria-pressed={anonymized}
            className="p-1.5 rounded-btn text-s-ink-2 hover:bg-s-bg-sunken transition-colors duration-150"
            title={anonymized ? t("show_names") : t("anonymize")}
            aria-label={anonymized ? t("show_names") : t("anonymize")}
          >
            {anonymized ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
          {/* Period toggle */}
          <div className="flex rounded-btn border border-s-border overflow-hidden">
            {(["week", "month"] as Period[]).map((p) => (
              <button
                key={p}
                aria-pressed={period === p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 text-xs font-medium transition-colors duration-150 ${
                  period === p
                    ? "bg-s-accent-bright/10 text-s-accent-bright"
                    : "text-s-ink-2 hover:bg-s-bg-sunken"
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
                    ? "bg-s-accent-bright/10 text-s-accent-bright font-medium"
                    : "text-s-ink-2 hover:text-s-ink"
                }`}
              >
                {col.label}
              </button>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E4" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6B6B6B" }} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#6B6B6B" }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #E7E5E4" }} />
              <Bar
                dataKey={columns.find((c) => c.key === sortBy)?.label ?? t("value")}
                fill={CHART_ACCENT}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        /* ═══ RANKED CARDS VIEW (was 8-col table — unreadable on mobile) ═══ */
        <div className="space-y-2.5">
          {sorted.map((barber, i) => (
            <div key={barber.staff_id} className="rounded-[16px] border border-s-border p-3.5">
              {/* Card header: rank/medal + name + Top pill for #1 */}
              <div className="flex items-center gap-3 mb-3">
                {getRankIcon(i) ?? (
                  <span className="w-5 text-center font-heading font-bold text-[15px] text-s-ink-2 shrink-0">{i + 1}</span>
                )}
                <span className="flex-1 font-heading font-semibold text-[14.5px] text-s-ink truncate">
                  {getDisplayName(barber, i)}
                </span>
                {i === 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[12px] font-semibold bg-s-success-bg text-s-success shrink-0">
                    {t("top")}
                  </span>
                )}
              </div>
              {/* Metrics as a 3-up tile grid */}
              <div className="grid grid-cols-3 gap-2.5">
                {columns.map((col) => (
                  <div key={col.key}>
                    <p className="text-[12px] text-s-ink-2">{col.label}</p>
                    <p className="font-heading font-bold text-[14.5px] text-s-ink mt-0.5 tabular-nums">
                      {col.format(barber[col.key] as number)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
