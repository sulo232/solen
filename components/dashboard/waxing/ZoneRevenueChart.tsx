"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { BarChart3 } from "lucide-react";
import { useTranslations } from "next-intl";

interface ZoneRow {
  zone: string;
  revenue: number;
  count: number;
}

interface ZoneRevenueChartProps {
  salonId: string;
}

const COLORS = ["#E8735A", "#D4870A", "#6BA3C8", "#7BA688", "#4A1E3C", "#F2C144"];

export default function ZoneRevenueChart({ salonId }: ZoneRevenueChartProps) {
  const t = useTranslations("dashboardWaxing") as any;
  const [data, setData] = useState<ZoneRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const r = await fetch(`/api/dashboard/waxing/zone-revenue?salon_id=${salonId}`);
        if (!r.ok || cancelled) return;
        const d = await r.json();
        if (!cancelled && d?.zones) setData(d.zones);
      } catch {
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [salonId]);

  return (
    <div className="bg-[--raised] dark:bg-s-dm-surface rounded-[12px] border border-s-ink/[0.06] dark:border-white/[0.06] p-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-[8px] bg-s-plum/10 flex items-center justify-center">
          <BarChart3 size={13} className="text-s-plum" />
        </div>
        <div>
          <p className="text-sm font-heading font-bold text-s-ink dark:text-s-dm-text">{t("zoneRevenueTitle")}</p>
          <p className="text-[10px] text-s-ink/35 dark:text-s-dm-text/35">{t("zoneRevenueSubtitle")}</p>
        </div>
      </div>

      {loading ? (
        <div className="h-[160px] animate-pulse bg-s-ink/[0.04] dark:bg-s-dm-text/[0.04] rounded-[8px]" />
      ) : data.length === 0 ? (
        <p className="text-xs text-s-ink/40 dark:text-s-dm-text/40 text-center py-6">{t("noData")}</p>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,18,9,0.05)" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 9, fill: "rgba(26,18,9,0.35)" }}
              tickFormatter={(v) => `CHF ${(v / 100).toFixed(0)}`} />
            <YAxis type="category" dataKey="zone" tick={{ fontSize: 9, fill: "rgba(26,18,9,0.35)" }} width={60} />
            <Tooltip
              formatter={(v: number) => [`CHF ${(v / 100).toFixed(2)}`, t("revenue")]}
              contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid rgba(26,18,9,0.08)" }}
            />
            <Bar dataKey="revenue" radius={[0, 4, 4, 0]} maxBarSize={20}>
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
