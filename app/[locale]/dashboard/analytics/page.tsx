"use client";

import { useEffect, useState } from "react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { useLocale } from "next-intl";
import { TrendingUp, TrendingDown, Calendar, Users, Scissors, UsersRound } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import Spinner from "@/components/ui/Spinner";
import HeatmapChart from "@/components/dashboard/HeatmapChart";
import StaffComparison from "@/components/dashboard/StaffComparison";
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
  rating_trend: "up" | "down" | "flat";
  last_minute_performance: { week: string; booked: number; expired: number }[];
  percentile_rank?: number;
  peak_hours_heatmap?: Record<string, Record<string, number>>;
  popular_services?: { name: string; count: number; revenue: number }[];
  retention_rate?: number;
  new_vs_returning?: { new: number; returning: number };
  acquisition_sources?: { source: string; count: number }[];
}

const CORAL = "#E8624A";
const AMBER = "#D4870A";
const DARK = "#1A1209";

const TABS: { key: AnalyticsTab; label: string; icon: typeof Calendar }[] = [
  { key: "overview", label: "Übersicht", icon: TrendingUp },
  { key: "bookings", label: "Termine", icon: Calendar },
  { key: "customers", label: "Kunden", icon: Users },
  { key: "services", label: "Services", icon: Scissors },
  { key: "team", label: "Team", icon: UsersRound },
];

export default function AnalyticsPage() {
  const locale = useLocale();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<AnalyticsTab>("overview");
  const [salonId, setSalonId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((p) => {
        setSalonId(p?.salon_id ?? null);
        if (p?.salon_id) return fetch(`/api/analytics/salon/${p.salon_id}?period=month`).then((r) => r.json());
        return null;
      })
      .then((d) => { if (d) setData(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout>
      <div className="mb-4">
        <h1 className="font-heading font-bold text-2xl text-s-ink dark:text-s-dm-text">Statistiken</h1>
        <p className="text-sm text-s-ink/40 dark:text-s-dm-text/40 mt-0.5">Letzte 30 Tage</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-button text-xs font-medium whitespace-nowrap transition-colors ${tab === t.key ? "bg-s-coral text-white" : "text-s-ink/50 dark:text-s-dm-text/50 hover:bg-s-coral/5"}`}>
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
            {/* KPI cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white dark:bg-s-dm-surface rounded-card border border-s-ink/5 dark:border-white/5 p-4 shadow-card">
                <p className="text-xs text-s-ink/40 dark:text-s-dm-text/40 mb-1">Stornierungsrate</p>
                <p className="data-text font-bold text-2xl text-s-ink dark:text-s-dm-text">{data.cancellation_rate.toFixed(1)}%</p>
              </div>
              <div className="bg-white dark:bg-s-dm-surface rounded-card border border-s-ink/5 dark:border-white/5 p-4 shadow-card">
                <p className="text-xs text-s-ink/40 dark:text-s-dm-text/40 mb-1">Bewertung</p>
                <div className="flex items-center gap-2">
                  <p className="data-text font-bold text-2xl text-s-ink dark:text-s-dm-text">{data.average_rating.toFixed(1)}</p>
                  {data.rating_trend === "up" && <TrendingUp size={16} className="text-s-coral" />}
                  {data.rating_trend === "down" && <TrendingDown size={16} className="text-s-coral" />}
                </div>
              </div>
              <div className="bg-white dark:bg-s-dm-surface rounded-card border border-s-ink/5 dark:border-white/5 p-4 shadow-card">
                <p className="text-xs text-s-ink/40 dark:text-s-dm-text/40 mb-1">Neue Kunden</p>
                <p className="data-text font-bold text-2xl text-s-coral">{data.customer_breakdown.new_customers}</p>
              </div>
              {data.retention_rate != null && (
                <div className="bg-white dark:bg-s-dm-surface rounded-card border border-s-ink/5 dark:border-white/5 p-4 shadow-card">
                  <p className="text-xs text-s-ink/40 dark:text-s-dm-text/40 mb-1">Retention</p>
                  <p className="data-text font-bold text-2xl text-s-ink dark:text-s-dm-text">{data.retention_rate.toFixed(0)}%</p>
                </div>
              )}
            </div>

            {data.percentile_rank != null && (
              <div className="bg-gradient-to-r from-s-coral/10 to-s-coral/5 rounded-card border border-s-coral/20 p-4 flex items-center gap-3">
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

            {/* Revenue chart */}
            <div className="bg-white dark:bg-s-dm-surface rounded-card border border-s-ink/5 dark:border-white/5 p-5 shadow-card">
              <h2 className="font-heading font-semibold text-base text-s-ink dark:text-s-dm-text mb-4">Umsatz CHF (wöchentlich)</h2>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={data.revenue_by_week}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="week" tick={{ fontSize: 10, fill: "#1A120966" }} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#1A120966" }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #f0f0f0" }}
                    formatter={(v: number) => [formatCurrency(Number(v), locale), "Umsatz"]} />
                  <Bar dataKey="revenue" fill={CORAL} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>)}

          {/* ═══ BOOKINGS TAB ═══ */}
          {tab === "bookings" && (<>
            <div className="bg-white dark:bg-s-dm-surface rounded-card border border-s-ink/5 dark:border-white/5 p-5 shadow-card">
              <h2 className="font-heading font-semibold text-base text-s-ink dark:text-s-dm-text mb-4">Termine (täglich)</h2>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={data.bookings_by_day}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#1A120966" }} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#1A120966" }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #f0f0f0" }} />
                  <Line type="monotone" dataKey="count" stroke={CORAL} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Peak hours heatmap */}
            {data.peak_hours_heatmap && (
              <div className="bg-white dark:bg-s-dm-surface rounded-card border border-s-ink/5 dark:border-white/5 p-5 shadow-card">
                <h2 className="font-heading font-semibold text-base text-s-ink dark:text-s-dm-text mb-4">Stosszeiten</h2>
                <HeatmapChart data={data.peak_hours_heatmap} />
              </div>
            )}

            {/* Last-Minute */}
            <div className="bg-white dark:bg-s-dm-surface rounded-card border border-s-ink/5 dark:border-white/5 p-5 shadow-card">
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
          </>)}

          {/* ═══ CUSTOMERS TAB ═══ */}
          {tab === "customers" && (<>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-s-dm-surface rounded-card border border-s-ink/5 dark:border-white/5 p-5 shadow-card">
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

              {/* Acquisition sources */}
              {data.acquisition_sources && data.acquisition_sources.length > 0 && (
                <div className="bg-white dark:bg-s-dm-surface rounded-card border border-s-ink/5 dark:border-white/5 p-5 shadow-card">
                  <h2 className="font-heading font-semibold text-base text-s-ink dark:text-s-dm-text mb-4">Wie haben sie uns gefunden?</h2>
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
            <div className="bg-white dark:bg-s-dm-surface rounded-card border border-s-ink/5 dark:border-white/5 p-5 shadow-card">
              <h2 className="font-heading font-semibold text-base text-s-ink dark:text-s-dm-text mb-4">Top Services</h2>
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

            {/* Popular services detail table */}
            {data.popular_services && data.popular_services.length > 0 && (
              <div className="bg-white dark:bg-s-dm-surface rounded-card border border-s-ink/5 dark:border-white/5 p-5 shadow-card">
                <h2 className="font-heading font-semibold text-base text-s-ink dark:text-s-dm-text mb-3">Service-Details</h2>
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
          {tab === "team" && salonId && (
            <div className="bg-white dark:bg-s-dm-surface rounded-card border border-s-ink/5 dark:border-white/5 p-5 shadow-card">
              <StaffComparison salonId={salonId} />
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
