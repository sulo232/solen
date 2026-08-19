"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { TrendingUp, DollarSign, Calendar, ArrowUpRight, Percent, CreditCard, Banknote, Gift, Heart } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { useLocale, useTranslations } from "next-intl";
import DashboardLayout from "@/components-legacy/dashboard/DashboardLayout";
import Spinner from "@/components-legacy/ui/Spinner";
import { formatCurrency } from "@/lib/format-currency";
import { resolveSwissLocale } from "@/lib/format";
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
  staff_commissions?: { name: string; bookings: number; revenue: number; commission_pct: number; commission_amount: number; tips: number }[];
  gift_card_revenue?: number;
  tips_total?: number;
}

// locale param added 2026-07-26 (de-CH literal sweep); default keeps prior behavior
// for any caller that still doesn't pass one. (Currently unreferenced in this file.)
function fmt(n: number, locale: string = "de") {
  return n.toLocaleString(resolveSwissLocale(locale), { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function RevenuePage() {
  const locale = useLocale();
  const t = useTranslations("dashboard.revenuePage");
  const [data, setData] = useState<RevenueStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"week" | "month" | "year">("month");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/revenue?period=${period}`)
      .then((r) => r.json())
      .then((d) => setData(d ?? null))
      .catch((err) => console.error("[DashboardRevenue] Failed to fetch revenue data:", err))
      .finally(() => setLoading(false));
  }, [period]);

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl text-s-ink">{t("title")}</h1>
          <p className="text-sm text-s-ink/40 mt-0.5">{t("subtitle")}</p>
        </div>
        {/* Period picker */}
        <div className="flex rounded-btn overflow-hidden border border-s-border bg-white shadow-warm-md shrink-0">
          {(["week", "month", "year"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={[
                "px-3 py-1.5 text-xs font-medium transition-colors",
                period === p ? "bg-s-accent text-white" : "text-s-ink-2 hover:text-s-ink",
              ].join(" ")}
            >
              {p === "week" ? t("periodWeek") : p === "month" ? t("periodMonth") : t("periodYear")}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : !data ? (
        <div className="text-center py-20 text-s-ink/30 text-sm">{t("noData")}</div>
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
                label: t("kpiGmv"),
                value: formatCurrency(data.total_revenue, locale),
                icon: DollarSign,
                color: "text-s-coral",
                bg: "bg-s-coral/5",
              },
              {
                label: t("kpiCommission", { rate: data.current_commission_rate > 0 ? `${data.current_commission_rate.toFixed(1)}%` : "—" }),
                value: formatCurrency(data.total_commission, locale),
                icon: Percent,
                color: "text-s-coral",
                bg: "bg-s-coral/5",
              },
              {
                label: t("kpiNetToSalons"),
                value: formatCurrency(data.total_net_to_salons, locale),
                icon: Banknote,
                color: "text-s-coral",
                bg: "bg-s-coral/5",
              },
              {
                label: t("kpiTransactions"),
                value: data.total_bookings.toString(),
                icon: CreditCard,
                color: "text-s-ink",
                bg: "bg-s-ink/5",
              },
              {
                label: t("kpiAvgBookingValue"),
                value: formatCurrency(data.avg_booking_value, locale),
                icon: Calendar,
                color: "text-s-ink",
                bg: "bg-s-ink/5",
              },
              {
                label: t("kpiGrowth"),
                value: `${data.growth_percent >= 0 ? "+" : ""}${data.growth_percent.toFixed(1)}%`,
                icon: ArrowUpRight,
                // mockup-ok: fabrication/dead-control fix (FRONTEND_AUDIT_2026-07-08.md,
                // dash-money bucket) , both ternary branches resolved to the identical
                // class, so the KPI never actually reflected growth direction. Uses the
                // existing locked s-success/s-error semantic tokens, not a new color.
                color: data.growth_percent >= 0 ? "text-s-success" : "text-s-error",
                bg: data.growth_percent >= 0 ? "bg-s-success/5" : "bg-s-error/5",
              },
            ].map((card) => (
              <motion.div
                key={card.label}
                variants={itemVariants}
                className="bg-white rounded-[12px] border border-s-ink/5 p-4 shadow-warm-md"
              >
                <div className={`w-8 h-8 rounded-btn ${card.bg} flex items-center justify-center mb-3`}>
                  <card.icon size={15} className={card.color} />
                </div>
                <p className="data-text font-bold text-xl text-s-ink leading-tight">{card.value}</p>
                <p className="text-xs text-s-ink/40 mt-0.5">{card.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Revenue chart */}
          {data.daily.length > 0 && (
            <motion.div variants={itemVariants} className="bg-white rounded-[12px] border border-s-ink/5 p-5 shadow-warm-md">
              <h2 className="font-heading text-s-ink text-sm mb-4">{t("dailyRevenueTitle")}</h2>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={data.daily} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1B4D1B" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#1B4D1B" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: "#1A120950" }}
                    tickFormatter={(d) => new Date(d).toLocaleDateString(resolveSwissLocale(locale), { day: "numeric", month: "short" })}
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
                    formatter={(v: unknown) => [formatCurrency(Number(v), locale), t("chartTooltipRevenue")]}
                    labelFormatter={(d) => new Date(d).toLocaleDateString(resolveSwissLocale(locale), { weekday: "long", day: "numeric", month: "long" })}
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #f0f0f0" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#1B4D1B"
                    strokeWidth={2}
                    fill="url(#revenueGradient)"
                    dot={false}
                    activeDot={{ r: 4, fill: "#1B4D1B" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {/* Top salons table */}
          {data.top_salons.length > 0 && (
            <motion.div variants={itemVariants} className="bg-white rounded-[12px] border border-s-ink/5 shadow-warm-md overflow-hidden">
              <div className="px-5 py-4 border-b border-s-ink/5">
                <h2 className="font-heading text-s-ink text-sm">{t("topSalonsTitle")}</h2>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-s-bg-surface/80">
                    <th className="text-left px-5 py-2.5 text-xs font-semibold text-s-ink/40 uppercase tracking-wide">{t("colSalon")}</th>
                    <th className="text-right px-5 py-2.5 text-xs font-semibold text-s-ink/40 uppercase tracking-wide">{t("colBookings")}</th>
                    <th className="text-right px-5 py-2.5 text-xs font-semibold text-s-ink/40 uppercase tracking-wide">{t("colRevenue")}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.top_salons.map((salon, i) => (
                    <tr
                      key={salon.name}
                      className="border-t border-s-ink/5 hover:bg-s-bg-surface/60 transition-colors"
                    >
                      <td className="px-5 py-3 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-s-coral/10 text-s-coral text-[12px] font-bold flex items-center justify-center shrink-0">
                          {i + 1}
                        </span>
                        <span className="font-medium text-s-ink">{salon.name}</span>
                      </td>
                      <td className="px-5 py-3 text-right data-text text-s-ink-2">{salon.bookings}</td>
                      <td className="px-5 py-3 text-right data-text font-semibold text-s-ink">{formatCurrency(salon.revenue, locale)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          )}

          {/* Staff commissions */}
          {data.staff_commissions && data.staff_commissions.length > 0 && (
            <motion.div variants={itemVariants} className="bg-white rounded-[12px] border border-s-ink/5 shadow-warm-md overflow-hidden">
              <div className="px-5 py-4 border-b border-s-ink/5">
                <h2 className="font-heading text-s-ink text-sm">{t("staffCommissionsTitle")}</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-s-bg-surface/80">
                      <th className="text-left px-5 py-2.5 text-xs font-semibold text-s-ink/40">{t("colStylist")}</th>
                      <th className="text-right px-3 py-2.5 text-xs font-semibold text-s-ink/40">{t("colAppointments")}</th>
                      <th className="text-right px-3 py-2.5 text-xs font-semibold text-s-ink/40">{t("colRevenue")}</th>
                      <th className="text-right px-3 py-2.5 text-xs font-semibold text-s-ink/40">%</th>
                      <th className="text-right px-3 py-2.5 text-xs font-semibold text-s-ink/40">{t("colCommission")}</th>
                      <th className="text-right px-5 py-2.5 text-xs font-semibold text-s-ink/40">{t("colTips")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.staff_commissions.map((s) => (
                      <tr key={s.name} className="border-t border-s-ink/5">
                        <td className="px-5 py-3 font-medium text-s-ink">{s.name}</td>
                        <td className="px-3 py-3 text-right data-text text-s-ink-2">{s.bookings}</td>
                        <td className="px-3 py-3 text-right data-text text-s-ink">{formatCurrency(s.revenue, locale)}</td>
                        <td className="px-3 py-3 text-right data-text text-s-ink/40">{s.commission_pct}%</td>
                        <td className="px-3 py-3 text-right data-text font-semibold text-s-coral">{formatCurrency(s.commission_amount, locale)}</td>
                        <td className="px-5 py-3 text-right data-text text-s-ink/40">{formatCurrency(s.tips, locale)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* Gift cards & Tips summary */}
          {(data.gift_card_revenue != null || data.tips_total != null) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {data.gift_card_revenue != null && (
                <motion.div variants={itemVariants} className="bg-white rounded-[12px] border border-s-ink/5 p-4 shadow-warm-md flex items-center gap-3">
                  <div className="w-10 h-10 rounded-btn bg-s-coral/5 flex items-center justify-center shrink-0">
                    <Gift size={18} strokeWidth={1.9} className="text-s-coral" />
                  </div>
                  <div>
                    <p className="data-text font-bold text-xl text-s-ink">{formatCurrency(data.gift_card_revenue, locale)}</p>
                    <p className="text-xs text-s-ink/40">{t("giftCardRevenue")}</p>
                  </div>
                </motion.div>
              )}
              {data.tips_total != null && (
                <motion.div variants={itemVariants} className="bg-white rounded-[12px] border border-s-ink/5 p-4 shadow-warm-md flex items-center gap-3">
                  <div className="w-10 h-10 rounded-btn bg-s-coral/5 flex items-center justify-center shrink-0">
                    <Heart size={18} strokeWidth={1.9} className="text-s-coral" />
                  </div>
                  <div>
                    <p className="data-text font-bold text-xl text-s-ink">{formatCurrency(data.tips_total, locale)}</p>
                    <p className="text-xs text-s-ink/40">{t("tipsReceived")}</p>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </motion.div>
      )}
    </DashboardLayout>
  );
}
