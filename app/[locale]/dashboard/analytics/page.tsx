"use client";

import { useEffect, useState } from "react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { useLocale, useTranslations } from "next-intl";
import { TrendingUp, TrendingDown, Calendar, Users, Scissors, UsersRound, ToggleLeft, ToggleRight } from "lucide-react";
import DashboardLayout from "@/components-legacy/dashboard/DashboardLayout";
import Spinner from "@/components-legacy/ui/Spinner";
import HeatmapChart from "@/components-legacy/dashboard/HeatmapChart";
import StaffComparison from "@/components-legacy/dashboard/StaffComparison";
import BarberLeaderboard from "@/components-legacy/dashboard/barber/BarberLeaderboard";
import ForecastWidget from "@/components-legacy/dashboard/ForecastWidget";
import { DateRangePicker, type DateRange } from "@/components-legacy/ui/DateRangePicker";
import { ExportButton } from "@/components-legacy/ui/ExportButton";
import { useExportCSV } from "@/hooks/useExportCSV";
import { formatCurrency } from "@/lib/format-currency";

type AnalyticsTab = "overview" | "bookings" | "customers" | "services" | "team";

interface AnalyticsData {
  daily?: { date: string; bookings: number; revenue: number; confirmed: number; cancelled: number }[];
  popular_services?: { id: string; name: string; count: number }[];
  new_vs_returning?: { new: number; returning: number };
  new_customers?: number;
  cancellation_rate: number;
  no_show_rate?: number;
  avg_rating: number;
  rating_trend?: "up" | "down" | "flat";
  percentile_rank?: number;
  peak_hours_heatmap?: Record<string, Record<string, number>>;
  retention_rate?: number;
  acquisition_sources?: { source: string; count: number }[];
  posthog_profile_views?: number;
  posthog_conversion_rate?: number;
}

// Locked chart palette (V3-D204/D421): primary series = accent-bright #276EF1;
// comparison/prior series = muted accent-pale #EAEFFE. Replaces the old dark-green
// (#1B4D1B) + amber (#F3A864) hexes. Semantic green/red stay where they're semantic.
const ACCENT = "#276EF1";
const ACCENT_PALE = "#EAEFFE";

const TABS: { key: AnalyticsTab; labelKey: string; icon: typeof Calendar }[] = [
  { key: "overview", labelKey: "tabOverview", icon: TrendingUp },
  { key: "bookings", labelKey: "tabBookings", icon: Calendar },
  { key: "customers", labelKey: "tabCustomers", icon: Users },
  { key: "services", labelKey: "tabServices", icon: Scissors },
  { key: "team", labelKey: "tabTeam", icon: UsersRound },
];

function defaultRange(): DateRange {
  const to = new Date();
  const from = new Date(to.getTime() - 30 * 86400000);
  return { from, to };
}

export default function AnalyticsPage() {
  const locale = useLocale();
  const t = useTranslations("dashboard.analytics") as any;
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
      .catch((err) => console.error("[DashboardAnalytics] failed to fetch analytics data:", err))
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
      .catch((err) => { console.error("[DashboardAnalytics] failed to fetch profile:", err); setLoading(false); });
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
          .catch((err) => console.error("[DashboardAnalytics] failed to fetch comparison period data:", err));
      } else {
        setPriorData(null);
      }
    }
  }

  // Derived chart series — the live API returns a single `daily` array + `popular_services`;
  // these reshape it into the {week,revenue} / {date,count} / {name,bookings} shapes the charts,
  // CSV exports, and ForecastWidget expect. Safe against null `data`.
  const revenueSeries = (data?.daily ?? []).map((d) => ({ week: d.date, revenue: d.revenue }));
  const priorRevenueSeries = (priorData?.daily ?? []).map((d) => ({ week: d.date, revenue: d.revenue }));
  const bookingsSeries = (data?.daily ?? []).map((d) => ({ date: d.date, count: d.bookings }));
  const priorBookingsSeries = (priorData?.daily ?? []).map((d) => ({ date: d.date, count: d.bookings }));
  const topServices = (data?.popular_services ?? []).map((s) => ({ name: s.name, bookings: s.count }));

  return (
    <DashboardLayout>
      {/* Page header with date range picker */}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl text-s-ink">{t("pageTitle")}</h1>
          <p className="text-sm text-s-ink/40 mt-0.5">{t("pageSubtitle")}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onToggleComparison}
            aria-label={t("compareAria")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-btn border text-[12px] font-heading transition-[colors,transform] active:scale-[0.97] active:duration-[80ms] active:ease-glide ${showComparison ? "border-s-accent-bright/30 bg-s-accent-bright/10 text-s-accent-bright" : "border-s-border text-s-ink-2 hover:border-s-accent-bright/40 hover:text-s-accent-bright"}`}
          >
            {showComparison ? <ToggleRight size={13} className="text-s-accent-bright" /> : <ToggleLeft size={13} />}
            {t("compare")}
          </button>
          <DateRangePicker value={dateRange} onChange={onRangeChange} />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 overflow-x-auto pb-1">
        {TABS.map((tabItem) => (
          <button key={tabItem.key} onClick={() => setTab(tabItem.key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-btn text-xs font-medium whitespace-nowrap transition-[colors,transform] active:scale-[0.97] active:duration-[80ms] active:ease-glide ${tab === tabItem.key ? "bg-s-accent-bright/10 text-s-accent-bright" : "bg-white border border-s-border text-s-ink-2 hover:bg-s-bg-sunken"}`}>
            <tabItem.icon size={12} /> {t(tabItem.labelKey)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : !data ? (
        <div className="text-center py-12 text-s-ink/30 text-sm">{t("noData")}</div>
      ) : (
        <div className="space-y-6">
          {/* ═══ OVERVIEW TAB ═══ */}
          {tab === "overview" && (<>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: t("kpiCancellationRate"), value: `${(data.cancellation_rate ?? 0).toFixed(1)}%` },
                { label: t("kpiRating"), value: (data.avg_rating ?? 0).toFixed(1) },
                { label: t("kpiNewCustomers"), value: String(data.new_customers ?? 0), highlight: true },
                ...(data.retention_rate != null ? [{ label: t("kpiRetention"), value: `${data.retention_rate.toFixed(0)}%` }] : []),
              ].map((kpi) => (
                <div key={kpi.label} className="bg-white rounded-[16px] border border-s-border p-4 shadow-warm-md">
                  <p className="text-xs text-s-ink-2 mb-1">{kpi.label}</p>
                  <p className={`data-text font-bold text-2xl ${kpi.highlight ? "text-s-accent-bright" : "text-s-ink"}`}>{kpi.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 mb-3">
              <div className="bg-white rounded-[16px] border border-s-border p-4 shadow-warm-md">
                <p className="text-xs text-s-ink-2 mb-1">{t("profileViews")}</p>
                <p className="data-text font-bold text-2xl text-s-ink">{data.posthog_profile_views ?? 0}</p>
              </div>
              <div className="bg-white rounded-[16px] border border-s-border p-4 shadow-warm-md">
                <p className="text-xs text-s-ink-2 mb-1">{t("conversionRate")}</p>
                <p className="data-text font-bold text-2xl text-s-ink">{(data.posthog_conversion_rate ?? 0).toFixed(1)}%</p>
              </div>
            </div>

            {data.percentile_rank != null && (
              <div className="bg-s-accent-bright/[0.06] rounded-[16px] border border-s-accent-bright/20 p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-s-accent-bright/15 flex items-center justify-center shrink-0">
                  <TrendingUp size={20} strokeWidth={2.2} className="text-s-accent-bright" />
                </div>
                <div>
                  <p className="font-heading text-s-ink text-sm">
                    {t("percentileHeadline", { rating: (data.avg_rating ?? 0).toFixed(1), rank: data.percentile_rank })}
                  </p>
                  <p className="text-xs text-s-ink-2 mt-0.5">{t("percentileSub")}</p>
                </div>
              </div>
            )}

            {/* Revenue chart + comparison */}
            <div className="bg-white rounded-[16px] border border-s-border p-5 shadow-warm-md">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading text-base text-s-ink">{t("revenueChartTitle")}</h2>
                <ExportButton
                  onClick={() => triggerExport("umsatz", revenueSeries.map(w => ({ Woche: w.week, "Umsatz CHF": Math.round(w.revenue) })))}
                  loading={exporting}
                />
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={revenueSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="week" tick={{ fontSize: 10, fill: "#22222266" }} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#22222266" }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #f0f0f0" }}
                    formatter={(v: number, name: string) => [formatCurrency(Number(v), locale), name === "revenue" ? t("current") : t("priorPeriod")]} />
                  <Bar dataKey="revenue" fill={ACCENT} radius={[4, 4, 0, 0]} name="revenue" />
                  {priorData && (
                    <Bar dataKey="revenue" data={priorRevenueSeries as any} fill={ACCENT_PALE} radius={[4, 4, 0, 0]} name="prior" />
                  )}
                </BarChart>
              </ResponsiveContainer>
              {showComparison && priorData && (
                <div className="mt-2 flex items-center gap-3 text-[12px] text-s-ink-2">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-s-accent-bright inline-block" /> {t("current")}</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-s-accent-pale inline-block" /> {t("priorPeriod")}</span>
                </div>
              )}
            </div>

            {/* Forecast widget */}
            {revenueSeries.length >= 3 && (
              <ForecastWidget data={revenueSeries} />
            )}
          </>)}

          {/* ═══ BOOKINGS TAB ═══ */}
          {tab === "bookings" && (<>
            <div className="bg-white rounded-[16px] border border-s-border p-5 shadow-warm-md">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading text-base text-s-ink">{t("bookingsChartTitle")}</h2>
                <ExportButton
                  onClick={() => triggerExport("termine", bookingsSeries.map(d => ({ Datum: d.date, Termine: d.count })))}
                  loading={exporting}
                />
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={bookingsSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#22222266" }} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#22222266" }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #f0f0f0" }} />
                  <Line type="monotone" dataKey="count" stroke={ACCENT} strokeWidth={2} dot={false} name={t("bookingsSeries")} />
                  {priorData && (
                    <Line type="monotone" data={priorBookingsSeries} dataKey="count" stroke="#9CA3AF" strokeWidth={2} strokeDasharray="4 2" dot={false} name={t("priorPeriod")} />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>

            {data.peak_hours_heatmap && (
              <div className="bg-white rounded-[16px] border border-s-border p-5 shadow-warm-md">
                <h2 className="font-heading text-base text-s-ink mb-4">{t("peakHours")}</h2>
                <HeatmapChart data={data.peak_hours_heatmap} />
              </div>
            )}
          </>)}

          {/* ═══ CUSTOMERS TAB ═══ */}
          {tab === "customers" && (<>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white rounded-[16px] border border-s-border p-5 shadow-warm-md">
                <h2 className="font-heading text-base text-s-ink mb-4">{t("newVsReturning")}</h2>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: t("newCustomersLabel"), value: data.new_vs_returning?.new ?? 0 },
                        { name: t("returningCustomers"), value: data.new_vs_returning?.returning ?? 0 },
                      ]}
                      cx="50%" cy="50%" outerRadius={70}
                      dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      <Cell fill={ACCENT} />
                      <Cell fill="#C7D6FB" />
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #f0f0f0" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {data.acquisition_sources && data.acquisition_sources.length > 0 && (
                <div className="bg-white rounded-[16px] border border-s-border p-5 shadow-warm-md">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-heading text-base text-s-ink">{t("acquisitionTitle")}</h2>
                    <ExportButton
                      onClick={() => triggerExport("quellen", data.acquisition_sources!.map(s => ({ Quelle: s.source, Buchungen: s.count })))}
                      loading={exporting}
                    />
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={data.acquisition_sources}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                      <XAxis dataKey="source" tick={{ fontSize: 10, fill: "#22222266" }} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "#22222266" }} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #f0f0f0" }} />
                      <Bar dataKey="count" fill={ACCENT} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </>)}

          {/* ═══ SERVICES TAB ═══ */}
          {tab === "services" && (<>
            <div className="bg-white rounded-[16px] border border-s-border p-5 shadow-warm-md">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading text-base text-s-ink">{t("topServices")}</h2>
                <ExportButton
                  onClick={() => triggerExport("services", topServices.map(s => ({ Service: s.name, Buchungen: s.bookings })))}
                  loading={exporting}
                />
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={topServices} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: "#22222266" }} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "#22222266" }} tickLine={false} width={80} />
                  <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #f0f0f0" }} />
                  <Bar dataKey="bookings" fill={ACCENT} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {data.popular_services && data.popular_services.length > 0 && (
              <div className="bg-white rounded-[16px] border border-s-border p-5 shadow-warm-md">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-heading text-base text-s-ink">{t("serviceDetails")}</h2>
                  <ExportButton
                    onClick={() => triggerExport("service-details", data.popular_services!.map(s => ({ Service: s.name, Buchungen: s.count })))}
                    loading={exporting}
                  />
                </div>
                {/* Mobile: stacked cards (table is unreadable at 390px) */}
                <div className="space-y-2 sm:hidden">
                  {data.popular_services.map((s) => (
                    <div key={s.name} className="rounded-[12px] border border-s-border p-3">
                      <p className="text-sm font-medium text-s-ink mb-2">{s.name}</p>
                      <div>
                        <p className="text-[12px] text-s-ink-2">{t("bookingsLabel")}</p>
                        <p className="data-text text-sm font-bold text-s-ink tabular-nums">{s.count}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Desktop: keep the table */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-s-border">
                        <th className="text-left py-2 pr-3 font-medium text-s-ink-2">{t("serviceColumn")}</th>
                        <th className="text-right py-2 pl-2 font-medium text-s-ink-2">{t("bookingsLabel")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.popular_services.map((s) => (
                        <tr key={s.name} className="border-b border-s-border">
                          <td className="py-2 pr-3 text-s-ink">{s.name}</td>
                          <td className="py-2 pl-2 text-right data-text text-s-ink">{s.count}</td>
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
            <div className="bg-white rounded-[16px] border border-s-border p-5 shadow-warm-md">
              <StaffComparison salonId={salonId} />
            </div>
            {isBarbershop && <BarberLeaderboard salonId={salonId} />}
          </>)}
        </div>
      )}
    </DashboardLayout>
  );
}
