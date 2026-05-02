"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ShoppingBag, TrendingUp } from "lucide-react";
import { useTranslations } from "next-intl";

interface RetailKPIs {
  total_revenue: number;
  total_units: number;
  avg_sale: number;
  top_product: string | null;
}

interface WeekRow {
  week: string;
  revenue: number;
}

interface TopProduct {
  name: string;
  units: number;
  revenue: number;
}

interface RetailSalesDashboardProps {
  salonId: string;
}

export default function RetailSalesDashboard({ salonId }: RetailSalesDashboardProps) {
  const t = useTranslations("nail_dashboard") as any;
  const [kpis, setKpis] = useState<RetailKPIs | null>(null);
  const [weekly, setWeekly] = useState<WeekRow[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/dashboard/nail/retail-sales?salon_id=${salonId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) {
          setKpis(d.kpis ?? null);
          setWeekly(d.weekly ?? []);
          setTopProducts(d.top_products ?? []);
        }
      })
      .catch((err) => console.error("[RetailSalesDashboard] failed to load retail sales data:", err))
      .finally(() => setLoading(false));
  }, [salonId]);

  const fmt = (cents: number) => `CHF ${(cents / 100).toFixed(2)}`;

  return (
    <div className="space-y-4">
      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: t("retail_total_revenue"), value: kpis ? fmt(kpis.total_revenue) : "–", color: "text-s-coral" },
          { label: t("retail_units_sold"), value: kpis ? `${kpis.total_units}` : "–", color: "text-s-amber" },
          { label: t("retail_avg_sale"), value: kpis ? fmt(kpis.avg_sale) : "–", color: "text-s-blue" },
          { label: t("retail_top_product"), value: kpis?.top_product ?? "–", color: "text-s-sage" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-[12px] border border-s-ink/[0.06] p-3">
            <p className="text-[9px] font-heading font-bold uppercase tracking-[.15em] text-s-ink/35 mb-1">
              {label}
            </p>
            <p className={`text-lg font-heading font-bold data-text truncate ${color}`}>
              {loading ? <span className="inline-block w-16 h-4 bg-s-ink/[0.06] rounded animate-pulse" /> : value}
            </p>
          </div>
        ))}
      </div>

      {/* Weekly revenue chart */}
      <div className="bg-white rounded-[12px] border border-s-ink/[0.06] p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={13} className="text-s-coral" />
          <p className="text-sm font-heading font-bold text-s-ink">
            {t("retail_weekly_revenue")}
          </p>
        </div>
        {loading ? (
          <div className="h-[140px] animate-pulse bg-s-ink/[0.04] rounded-[8px]" />
        ) : (
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={weekly} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,18,9,0.05)" />
              <XAxis dataKey="week" tick={{ fontSize: 9, fill: "rgba(26,18,9,0.35)" }} />
              <YAxis tick={{ fontSize: 9, fill: "rgba(26,18,9,0.35)" }} tickFormatter={(v) => `${v}`} />
              <Tooltip
                formatter={(v: number) => [fmt(v), t("retail_revenue")]}
                contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid rgba(26,18,9,0.08)" }}
              />
              <Bar dataKey="revenue" fill="#E8735A" radius={[4, 4, 0, 0]} maxBarSize={24} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Top 5 products */}
      {topProducts.length > 0 && (
        <div className="bg-white rounded-[12px] border border-s-ink/[0.06] p-4">
          <div className="flex items-center gap-2 mb-3">
            <ShoppingBag size={13} className="text-s-amber" />
            <p className="text-sm font-heading font-bold text-s-ink">
              {t("retail_top_products")}
            </p>
          </div>
          <div className="space-y-2">
            {topProducts.map((p, i) => (
              <div key={p.name} className="flex items-center gap-3">
                <span className="text-[10px] font-heading font-bold text-s-ink/30 w-4">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-heading font-semibold text-s-ink truncate">
                    {p.name}
                  </p>
                  <p className="text-[10px] text-s-ink/40">
                    {p.units} {t("units")} · {fmt(p.revenue)}
                  </p>
                </div>
                <div
                  className="h-1.5 bg-s-coral rounded-pill"
                  style={{ width: `${Math.round((p.units / (topProducts[0]?.units || 1)) * 80)}px` }}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
