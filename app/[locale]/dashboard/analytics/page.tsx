"use client";

import { useEffect, useState } from "react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import Spinner from "@/components/ui/Spinner";

interface AnalyticsData {
  bookings_by_day: { date: string; count: number }[];
  revenue_by_week: { week: string; revenue: number }[];
  top_services: { name: string; bookings: number }[];
  customer_breakdown: { new_customers: number; returning_customers: number };
  cancellation_rate: number;
  average_rating: number;
  rating_trend: "up" | "down" | "flat";
  last_minute_performance: { week: string; booked: number; expired: number }[];
  percentile_rank?: number;
}

const TEAL = "#4ECDC4";
const CORAL = "#FF6B6B";
const DARK = "#1A1A2E";

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((p) => {
        if (p?.salon_id) return fetch(`/api/analytics/salon/${p.salon_id}?period=month`).then((r) => r.json());
        return null;
      })
      .then((d) => { if (d) setData(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="font-heading font-bold text-2xl text-dark">Statistiken</h1>
        <p className="text-sm text-dark/40 mt-0.5">Letzte 30 Tage</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : !data ? (
        <div className="text-center py-12 text-dark/30 text-sm">Keine Daten verfügbar</div>
      ) : (
        <div className="space-y-6">
          {/* KPI cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-white rounded-card border border-gray-100 p-4 shadow-card">
              <p className="text-xs text-dark/40 mb-1">Stornierungsrate</p>
              <p className="font-data font-bold text-2xl text-dark">{data.cancellation_rate.toFixed(1)}%</p>
            </div>
            <div className="bg-white rounded-card border border-gray-100 p-4 shadow-card">
              <p className="text-xs text-dark/40 mb-1">Bewertung</p>
              <div className="flex items-center gap-2">
                <p className="font-data font-bold text-2xl text-dark">{data.average_rating.toFixed(1)}</p>
                {data.rating_trend === "up" && <TrendingUp size={16} className="text-teal" />}
                {data.rating_trend === "down" && <TrendingDown size={16} className="text-coral" />}
              </div>
            </div>
            <div className="bg-white rounded-card border border-gray-100 p-4 shadow-card">
              <p className="text-xs text-dark/40 mb-1">Neue Kunden</p>
              <p className="font-data font-bold text-2xl text-teal">{data.customer_breakdown.new_customers}</p>
            </div>
          </div>

          {/* Benchmark card */}
          {data.percentile_rank != null && (
            <div className="bg-gradient-to-r from-teal/10 to-teal/5 rounded-card border border-teal/20 p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-teal/20 flex items-center justify-center shrink-0">
                <TrendingUp size={20} className="text-teal" />
              </div>
              <div>
                <p className="font-heading font-semibold text-dark text-sm">
                  Deine Bewertung: {data.average_rating.toFixed(1)} — Top {data.percentile_rank}% in Basel
                </p>
                <p className="text-xs text-dark/50 mt-0.5">
                  Basierend auf allen aktiven Salons in deiner Stadt
                </p>
              </div>
            </div>
          )}

          {/* Bookings over time */}
          <div className="bg-white rounded-card border border-gray-100 p-5 shadow-card">
            <h2 className="font-heading font-semibold text-base text-dark mb-4">Termine (täglich)</h2>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={data.bookings_by_day}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#1A1A2E66" }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#1A1A2E66" }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #f0f0f0" }} />
                <Line type="monotone" dataKey="count" stroke={TEAL} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Revenue */}
          <div className="bg-white rounded-card border border-gray-100 p-5 shadow-card">
            <h2 className="font-heading font-semibold text-base text-dark mb-4">Umsatz CHF (wöchentlich)</h2>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={data.revenue_by_week}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="week" tick={{ fontSize: 10, fill: "#1A1A2E66" }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#1A1A2E66" }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #f0f0f0" }}
                  formatter={(v: number) => [`CHF ${v}`, "Umsatz"]} />
                <Bar dataKey="revenue" fill={TEAL} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top services + Customer breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-card border border-gray-100 p-5 shadow-card">
              <h2 className="font-heading font-semibold text-base text-dark mb-4">Top Services</h2>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={data.top_services} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: "#1A1A2E66" }} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "#1A1A2E66" }} tickLine={false} width={80} />
                  <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #f0f0f0" }} />
                  <Bar dataKey="bookings" fill={TEAL} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-card border border-gray-100 p-5 shadow-card">
              <h2 className="font-heading font-semibold text-base text-dark mb-4">Kunden</h2>
              <ResponsiveContainer width="100%" height={180}>
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
                    <Cell fill={TEAL} />
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #f0f0f0" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Last-Minute performance */}
          <div className="bg-white rounded-card border border-gray-100 p-5 shadow-card">
            <h2 className="font-heading font-semibold text-base text-dark mb-4">Last-Minute Performance</h2>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={data.last_minute_performance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="week" tick={{ fontSize: 10, fill: "#1A1A2E66" }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#1A1A2E66" }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #f0f0f0" }} />
                <Bar dataKey="booked" fill={TEAL} radius={[4, 4, 0, 0]} stackId="a" name="Gebucht" />
                <Bar dataKey="expired" fill={CORAL} radius={[4, 4, 0, 0]} stackId="a" name="Abgelaufen" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
