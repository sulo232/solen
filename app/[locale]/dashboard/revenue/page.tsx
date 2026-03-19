"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, DollarSign, Calendar, ArrowUpRight, Percent, CreditCard, Banknote } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { useLocale } from "next-intl";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import Spinner from "@/components/ui/Spinner";
import { formatCurrency } from "@/lib/format-currency";
import { containerVariants, itemVariants } from "@/lib/animations";

interface DailyRevenue {
  date: string;
  revenue: number;
  bookings: number;
}

interface RevenueStats {
  total_revenue: number;
  total_bookings: number;
  avg_booking_value: number;
  growth_percent: number;
  total_commission: number;
  total_net_to_salons: number;
  current_commission_rate: number;
  daily: DailyRevenue[];
  top_salons: { name: string; revenue: number; bookings: number }[];
}

function fmt(n: number) {
  return n.toLocaleString("de-CH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function RevenuePage() {
  const locale = useLocale();
  const [data, setData] = useState<RevenueStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"week" | "month" | "year">("month");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/revenue?period=${period}`)
      .then((r) => r.json())
      .then((d) => setData(d ?? null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [period]);

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading font-bold text-2xl text-s-ink">Umsatz</h1>
          <p className="text-sm text-s-ink/40 mt-0.5">Plattform-Einnahmen</p>
        </div>
        {/* Period picker */}
        <div className="flex rounded-button overflow-hidden border border-s-ink/10 bg-white shadow-card shrink-0">
          {(["week", "month", "year"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={[
                "px-3 py-1.5 text-xs font-medium transition-colors",
                period === p ? "bg-s-coral text-white" : "text-s-ink/50 hover:text-s-ink",
              ].join(" ")}
            >
              {p === "week" ? "Woche" : p === "month" ? "Monat" : "Jahr"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : !data ? (
        <div className="text-center py-20 text-s-ink/30 text-sm">Keine Daten verfügbar.</div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-5"
        >
          {/* KPI cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              {
                label: "GMV (Gesamtumsatz)",
                value: formatCurrency(data.total_revenue, locale),
                icon: DollarSign,
                color: "text-s-coral",
                bg: "bg-s-coral/5",
              },
              {
                label: `Kommission (${data.current_commission_rate > 0 ? `${data.current_commission_rate.toFixed(1)}%` : "—"})`,
                value: formatCurrency(data.total_commission, locale),
                icon: Percent,
                color: "text-s-coral",
                bg: "bg-s-coral/5",
              },
              {
                label: "Netto an Salons",
                value: formatCurrency(data.total_net_to_salons, locale),
                icon: Banknote,
                color: "text-s-coral",
                bg: "bg-s-coral/5",
              },
              {
                label: "Transaktionen",
                value: data.total_bookings.toString(),
                icon: CreditCard,
                color: "text-s-ink",
                bg: "bg-s-ink/5",
              },
              {
                label: "Ø Buchungswert",
                value: formatCurrency(data.avg_booking_value, locale),
                icon: Calendar,
                color: "text-s-ink",
                bg: "bg-s-ink/5",
              },
              {
                label: "Wachstum",
                value: `${data.growth_percent >= 0 ? "+" : ""}${data.growth_percent.toFixed(1)}%`,
                icon: ArrowUpRight,
                color: data.growth_percent >= 0 ? "text-s-coral" : "text-s-coral",
                bg: data.growth_percent >= 0 ? "bg-s-coral/5" : "bg-s-coral/5",
              },
            ].map((card) => (
              <motion.div
                key={card.label}
                variants={itemVariants}
                className="bg-white rounded-card border border-s-ink/5 p-4 shadow-card"
              >
                <div className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center mb-3`}>
                  <card.icon size={15} className={card.color} />
                </div>
                <p className="data-text font-bold text-xl text-s-ink leading-tight">{card.value}</p>
                <p className="text-xs text-s-ink/40 mt-0.5">{card.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Revenue chart */}
          {data.daily.length > 0 && (
            <motion.div variants={itemVariants} className="bg-white rounded-card border border-s-ink/5 p-5 shadow-card">
              <h2 className="font-heading font-semibold text-s-ink text-sm mb-4">Tagesumsatz (CHF)</h2>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={data.daily} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#E8624A" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#E8624A" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: "#1A120950" }}
                    tickFormatter={(d) => new Date(d).toLocaleDateString("de-CH", { day: "numeric", month: "short" })}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#1A120950" }}
                    tickFormatter={(v) => `${v}`}
                    axisLine={false}
                    tickLine={false}
                    width={40}
                  />
                  <Tooltip
                    formatter={(v: unknown) => [formatCurrency(Number(v), locale), "Umsatz"]}
                    labelFormatter={(d) => new Date(d).toLocaleDateString("de-CH", { weekday: "long", day: "numeric", month: "long" })}
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #f0f0f0" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#E8624A"
                    strokeWidth={2}
                    fill="url(#revenueGradient)"
                    dot={false}
                    activeDot={{ r: 4, fill: "#E8624A" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {/* Top salons table */}
          {data.top_salons.length > 0 && (
            <motion.div variants={itemVariants} className="bg-white rounded-card border border-s-ink/5 shadow-card overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-50">
                <h2 className="font-heading font-semibold text-s-ink text-sm">Top Salons</h2>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-s-bg-surface/80">
                    <th className="text-left px-5 py-2.5 text-xs font-semibold text-s-ink/40 uppercase tracking-wide">Salon</th>
                    <th className="text-right px-5 py-2.5 text-xs font-semibold text-s-ink/40 uppercase tracking-wide">Buchungen</th>
                    <th className="text-right px-5 py-2.5 text-xs font-semibold text-s-ink/40 uppercase tracking-wide">Umsatz</th>
                  </tr>
                </thead>
                <tbody>
                  {data.top_salons.map((salon, i) => (
                    <tr
                      key={salon.name}
                      className="border-t border-gray-50 hover:bg-s-bg-surface/60 transition-colors"
                    >
                      <td className="px-5 py-3 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-s-coral/10 text-s-coral text-[10px] font-bold flex items-center justify-center shrink-0">
                          {i + 1}
                        </span>
                        <span className="font-medium text-s-ink">{salon.name}</span>
                      </td>
                      <td className="px-5 py-3 text-right data-text text-s-ink/60">{salon.bookings}</td>
                      <td className="px-5 py-3 text-right data-text font-semibold text-s-ink">{formatCurrency(salon.revenue, locale)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          )}
        </motion.div>
      )}
    </DashboardLayout>
  );
}
