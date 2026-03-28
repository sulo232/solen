"use client";

import { useEffect, useState } from "react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { useLocale } from "next-intl";
import { TrendingUp, TrendingDown, Calendar, Users, Scissors, UsersRound, ToggleLeft, ToggleRight } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import Spinner from "@/components/ui/Spinner";
import HeatmapChart from "@/components/dashboard/HeatmapChart";
import StaffComparison from "@/components/dashboard/StaffComparison";
import BarberLeaderboard from "@/components/dashboard/barber/BarberLeaderboard";
import ForecastWidget from "@/components/dashboard/ForecastWidget";
import { DateRangePicker, type DateRange } from "@/components/ui/DateRangePicker";
import { ExportButton } from "@/components/ui/ExportButton";
import { useExportCSV } from "@/hooks/useExportCSV";
import { formatCurrency } from "@/lib/format-currency";

type AnalyticsTab = "overview" | "bookings" | "customers" | "services" | "team";

interface AnalyticsData {
  bookings_by_day: { date: string; count: number }[];
  revenue_by_week: { week: string; revenue: number }[];
  top_services: { name: string; bookings: number }[];
  customer_breakdown: { new_customers: number; returning_customers: number };
  cancellation_rate: number;
  no_show_rate?: number;
  average_rating: number;
  rating_trend?: "up" | "down" | "flat";
  last_minute_performance?: { week: string; booked: number; expired: number }[];
  percentile_rank?: number;
  peak_hours_heatmap?: Record<string, Record<string, number>>;
  popular_services?: { name: string; count: number; revenue: number }[];
  retention_rate?: number;
  new_vs_returning?: { new: number; returning: number };
  acquisition_sources?: { source: string; count: number }[];
  posthog_profile_views?: number;
  posthog_conversion_rate?: number;
}

const CORAL = "#E8624A";
const AMBER = "#D4870A";

const TABS: { key: AnalyticsTab; label: string; icon: typeof Calendar }[] = [
  { key: "overview", label: "Übersicht", icon: TrendingUp },
  { key: "bookings", label: "Termine", icon: Calendar },
  { key: "customers", label: "Kunden", icon: Users },
  { key: "services", label: "Services", icon: Scissors },
  { key: "team", label: "Team", icon: UsersRound },
];

function defaultRange(): DateRange {
  const to = new Date();
  const from = new Date(to.getTime() - 30 * 86400000);
  return { from, to };
}

export default function AnalyticsPage() {
  const locale = useLocale();
  const { triggerExport, exporting } = useExportCSV();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [priorData, setPriorData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<AnalyticsTab>("overview");
  const [salonId, setSalonId] = useState<string | null>(null);
  const [isBarbershop, setIsBarbershop] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>(defaultRange);
  const [showComparison, setShowComparison] = useState(false);

  function buildUrl(sId: string, range: DateRange) {
    const from = range.from.toISOString().split("T")[0];
    const to = range.to.toISOString().split("T")[0];
    return `/api/analytics/salon/${sId}?from=${from}&to=${to}`;
  }

  function fetchAnalytics(sId: string, range: DateRange) {
    setLoading(true);
    const periodMs = range.to.getTime() - range.from.getTime();
    const priorTo = new Date(range.from.getTime() - 1);
    const priorFrom = new Date(priorTo.getTime() - periodMs);

    const main = fetch(buildUrl(sId, range)).then((r) => r.json());
    const prior = showComparison
      ? fetch(buildUrl(sId, { from: priorFrom, to: priorTo })).then((r) => r.json())
      : Promise.resolve(null);

    Promise.all([main, prior])
      .then(([d, p]) => { if (d) setData(d); setPriorData(p); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((p) => {
        const sid = p?.salon_id ?? null;
        setSalonId(sid);
        if (p?.categories?.includes("barbershop")) setIsBarbershop(true);
        if (sid) fetchAnalytics(sid, dateRange);
        else setLoading(false);
      })
      .catch(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onRangeChange(range: DateRange) {
    setDateRange(range);
    if (salonId) fetchAnalytics(salonId, range);
  }

  function onToggleComparison() {
    const next = !showComparison;
    setShowComparison(next);
    if (salonId) {
      const periodMs = dateRange.to.getTime() - dateRange.from.getTime();
      const priorTo = new Date(dateRange.from.getTime() - 1);
      const priorFrom = new Date(priorTo.getTime() - periodMs);
      if (next) {
        fetch(buildUrl(salonId, { from: priorFrom, to: priorTo }))
          .then((r) => r.json())
          .then((p) => setPriorData(p))
          .catch(() => {});
      } else {
        setPriorData(null);
      }
    }
  }

  return (
    <DashboardLayout>
      {/* Page header with date range picker */}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-heading font-bold text-2xl text-s-ink dark:text-s-dm-text">Statistiken</h1>
          <p className="text-sm text-s-ink/40 dark:text-s-dm-text/40 mt-0.5">Detaillierte Salon-Auswertung</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onToggleComparison}
            aria-label="Vorperiode vergleichen"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-btn border border-s-ink/[0.08] text-[10px] font-heading font-bold text-s-ink/55 hover:border-s-coral/40 hover:text-s-coral transition-colors"
          >
            {showComparison ? <ToggleRight size={13} className="text-s-coral" /> : <ToggleLeft size={13} />}
            Vergleich
          </button>
          <DateRangePicker value={dateRange} onChange={onRangeChange} />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-btn text-xs font-medium whitespace-nowrap transition-colors ${tab === t.key ? "bg-s-coral text-white" : "text-s-ink/50 dark:text-s-dm-text/50 hover:bg-s-coral/5"}`}>
            <t.icon size={12} /> {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : !data ? (
        <div className="text-center py-12 text-s-ink/30 text-sm">Keine Daten verfügbar</div>
      ) : (
        <div className="space-y-6">
          {/* ═══ OVERVIEW TAB ═══ */}
          {tab === "overview" && (<>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Stornierungsrate", value: `${data.cancellation_rate.toFixed(1)}%` },
                { label: "Bewertung", value: data.average_rating.toFixed(1) },
                { label: "Neue Kunden", value: String(data.customer_breakdown.new_customers), highlight: true },
                ...(data.retention_rate != null ? [{ label: "Retention", value: `${data.retention_rate.toFixed(0)}%` }] : []),
              ].map((kpi) => (
                <div key={kpi.label} className="bg-white dark:bg-s-dm-surface rounded-[12px] border border-s-ink/5 dark:border-white/5 p-4 shadow-warm-md">
                  <p className="text-xs text-s-ink/40 dark:text-s-dm-text/40 mb-1">{kpi.label}</p>
                  <p className={`data-text font-bold text-2xl ${kpi.highlight ? "text-s-coral" : "text-s-ink dark:text-s-dm-text"}`}>{kpi.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 mb-3">
              <div className="bg-white dark:bg-s-dm-surface rounded-[12px] border border-s-ink/5 dark:border-white/5 p-4 shadow-warm-md">
                <p className="text-xs text-s-ink/40 dark:text-s-dm-text/40 mb-1">Profilaufrufe</p>
                <p className="data-text font-bold text-2xl text-s-ink dark:text-s-dm-text">{data.posthog_profile_views ?? 0}</p>
              </div>
              <div className="bg-white dark:bg-s-dm-surface rounded-[12px] border border-s-ink/5 dark:border-white/5 p-4 shadow-warm-md">
                <p className="text-xs text-s-ink/40 dark:text-s-dm-text/40 mb-1">Conversion Rate</p>
                <p className="data-text font-bold text-2xl text-s-ink dark:text-s-dm-text">{(data.posthog_conversion_rate ?? 0).toFixed(1)}%</p>
              </div>
            </div>

            {data.percentile_rank != null && (
              <div className="bg-gradient-to-r from-s-coral/10 to-s-coral/5 rounded-[12px] border border-s-coral/20 p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-s-coral/20 flex items-center justify-center shrink-0">
                  <TrendingUp size={20} className="text-s-coral" />
                </div>
                <div>
                  <p className="font-heading font-semibold text-s-ink dark:text-s-dm-text text-sm">
                    Deine Bewertung: {data.average_rating.toFixed(1)} — Top {data.percentile_rank}% in Basel
                  </p>
                  <p className="text-xs text-s-ink/50 dark:text-s-dm-text/50 mt-0.5">Basierend auf allen aktiven Salons in deiner Stadt</p>
                </div>
              </div>
            )}

            {/* Revenue chart + comparison */}
            <div className="bg-white dark:bg-s-dm-surface rounded-[12px] border border-s-ink/5 dark:border-white/5 p-5 shadow-warm-md">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading font-semibold text-base text-s-ink dark:text-s-dm-text">Umsatz CHF (wöchentlich)</h2>
                <ExportButton
                  onClick={() => triggerExport("umsatz", data.revenue_by_week.map(w => ({ Woche: w.week, "Umsatz CHF": Math.round(w.revenue / 100) })))}
                  loading={exporting}
                />
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={data.revenue_by_week}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="week" tick={{ fontSize: 10, fill: "#1A120966" }} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#1A120966" }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #f0f0f0" }}
                    formatter={(v: number, name: string) => [formatCurrency(Number(v), locale), name === "revenue" ? "Aktuell" : "Vorperiode"]} />
                  <Bar dataKey="revenue" fill={CORAL} radius={[4, 4, 0, 0]} name="revenue" />
                  {priorData && (
                    <Bar dataKey="revenue" data={priorData.revenue_by_week as any} fill={AMBER} radius={[4, 4, 0, 0]} fillOpacity={0.5} name="prior" />
                  )}
                </BarChart>
              </ResponsiveContainer>
              {showComparison && priorData && (
                <div className="mt-2 flex items-center gap-3 text-[10px]">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-s-coral inline-block" /> Aktuell</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-s-amber inline-block opacity-60" /> Vorperiode</span>
                </div>
              )}
            </div>

            {/* Forecast widget */}
            {data.revenue_by_week && data.revenue_by_week.length >= 3 && (
              <ForecastWidget data={data.revenue_by_week} />
            )}
          </>)}

          {/* ═══ BOOKINGS TAB ═══ */}
          {tab === "bookings" && (<>
            <div className="bg-white dark:bg-s-dm-surface rounded-[12px] border border-s-ink/5 dark:border-white/5 p-5 shadow-warm-md">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading font-semibold text-base text-s-ink dark:text-s-dm-text">Termine (täglich)</h2>
                <ExportButton
                  onClick={() => triggerExport("termine", data.bookings_by_day.map(d => ({ Datum: d.date, Termine: d.count })))}
                  loading={exporting}
                />
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={data.bookings_by_day}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#1A120966" }} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#1A120966" }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #f0f0f0" }} />
                  <Line type="monotone" dataKey="count" stroke={CORAL} strokeWidth={2} dot={false} name="Termine" />
                  {priorData && (
                    <Line type="monotone" data={priorData.bookings_by_day} dataKey="count" stroke={AMBER} strokeWidth={2} strokeDasharray="4 2" dot={false} name="Vorperiode" />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>

            {data.peak_hours_heatmap && (
              <div className="bg-white dark:bg-s-dm-surface rounded-[12px] border border-s-ink/5 dark:border-white/5 p-5 shadow-warm-md">
                <h2 className="font-heading font-semibold text-base text-s-ink dark:text-s-dm-text mb-4">Stosszeiten</h2>
                <HeatmapChart data={data.peak_hours_heatmap} />
              </div>
            )}

            {data.last_minute_performance && (
              <div className="bg-white dark:bg-s-dm-surface rounded-[12px] border border-s-ink/5 dark:border-white/5 p-5 shadow-warm-md">
                <h2 className="font-heading font-semibold text-base text-s-ink dark:text-s-dm-text mb-4">Last-Minute Performance</h2>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={data.last_minute_performance}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis dataKey="week" tick={{ fontSize: 10, fill: "#1A120966" }} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#1A120966" }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #f0f0f0" }} />
                    <Bar dataKey="booked" fill={CORAL} radius={[4, 4, 0, 0]} stackId="a" name="Gebucht" />
                    <Bar dataKey="expired" fill={AMBER} radius={[4, 4, 0, 0]} stackId="a" name="Abgelaufen" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </>)}

          {/* ═══ CUSTOMERS TAB ═══ */}
          {tab === "customers" && (<>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-s-dm-surface rounded-[12px] border border-s-ink/5 dark:border-white/5 p-5 shadow-warm-md">
                <h2 className="font-heading font-semibold text-base text-s-ink dark:text-s-dm-text mb-4">Neu vs. Stammkunden</h2>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Neukunden", value: data.customer_breakdown.new_customers },
                        { name: "Stammkunden", value: data.customer_breakdown.returning_customers },
                      ]}
                      cx="50%" cy="50%" outerRadius={70}
                      dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      <Cell fill={CORAL} />
                      <Cell fill={AMBER} />
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #f0f0f0" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {data.acquisition_sources && data.acquisition_sources.length > 0 && (
                <div className="bg-white dark:bg-s-dm-surface rounded-[12px] border border-s-ink/5 dark:border-white/5 p-5 shadow-warm-md">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-heading font-semibold text-base text-s-ink dark:text-s-dm-text">Wie haben sie uns gefunden?</h2>
                    <ExportButton
                      onClick={() => triggerExport("quellen", data.acquisition_sources!.map(s => ({ Quelle: s.source, Buchungen: s.count })))}
                      loading={exporting}
                    />
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={data.acquisition_sources}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                      <XAxis dataKey="source" tick={{ fontSize: 10, fill: "#1A120966" }} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "#1A120966" }} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #f0f0f0" }} />
                      <Bar dataKey="count" fill={CORAL} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </>)}

          {/* ═══ SERVICES TAB ═══ */}
          {tab === "services" && (<>
            <div className="bg-white dark:bg-s-dm-surface rounded-[12px] border border-s-ink/5 dark:border-white/5 p-5 shadow-warm-md">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading font-semibold text-base text-s-ink dark:text-s-dm-text">Top Services</h2>
                <ExportButton
                  onClick={() => triggerExport("services", data.top_services.map(s => ({ Service: s.name, Buchungen: s.bookings })))}
                  loading={exporting}
                />
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.top_services} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: "#1A120966" }} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "#1A120966" }} tickLine={false} width={80} />
                  <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #f0f0f0" }} />
                  <Bar dataKey="bookings" fill={CORAL} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {data.popular_services && data.popular_services.length > 0 && (
              <div className="bg-white dark:bg-s-dm-surface rounded-[12px] border border-s-ink/5 dark:border-white/5 p-5 shadow-warm-md">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-heading font-semibold text-base text-s-ink dark:text-s-dm-text">Service-Details</h2>
                  <ExportButton
                    onClick={() => triggerExport("service-details", data.popular_services!.map(s => ({ Service: s.name, Buchungen: s.count, "Umsatz CHF": Math.round(s.revenue / 100) })))}
                    loading={exporting}
                  />
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-s-ink/5 dark:border-white/5">
                        <th className="text-left py-2 pr-3 font-medium text-s-ink/50 dark:text-s-dm-text/50">Service</th>
                        <th className="text-right py-2 px-2 font-medium text-s-ink/50 dark:text-s-dm-text/50">Buchungen</th>
                        <th className="text-right py-2 pl-2 font-medium text-s-ink/50 dark:text-s-dm-text/50">Umsatz</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.popular_services.map((s) => (
                        <tr key={s.name} className="border-b border-s-ink/5 dark:border-white/5">
                          <td className="py-2 pr-3 text-s-ink dark:text-s-dm-text">{s.name}</td>
                          <td className="py-2 px-2 text-right data-text text-s-ink dark:text-s-dm-text">{s.count}</td>
                          <td className="py-2 pl-2 text-right data-text text-s-ink dark:text-s-dm-text">CHF {(s.revenue / 100).toFixed(0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>)}

          {/* ═══ TEAM TAB ═══ */}
          {tab === "team" && salonId && (<>
            <div className="bg-white dark:bg-s-dm-surface rounded-[12px] border border-s-ink/5 dark:border-white/5 p-5 shadow-warm-md">
              <StaffComparison salonId={salonId} />
            </div>
            {isBarbershop && <BarberLeaderboard salonId={salonId} />}
          </>)}
        </div>
      )}
    </DashboardLayout>
  );
}
