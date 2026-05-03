"use client";

import {
  ComposedChart, Bar, Line, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { TrendingUp, Info } from "lucide-react";
import { useTranslations } from "next-intl";

interface WeekRevenue {
  week: string;
  revenue: number;
}

interface ForecastWidgetProps {
  data: WeekRevenue[];
}

/** Simple linear regression — returns slope (m) and intercept (b) */
function linReg(points: { x: number; y: number }[]): { m: number; b: number } {
  const n = points.length;
  if (n < 2) return { m: 0, b: points[0]?.y ?? 0 };
  const sumX = points.reduce((s, p) => s + p.x, 0);
  const sumY = points.reduce((s, p) => s + p.y, 0);
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
  const sumX2 = points.reduce((s, p) => s + p.x * p.x, 0);
  const m = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const b = (sumY - m * sumX) / n;
  return { m, b };
}

export default function ForecastWidget({ data }: ForecastWidgetProps) {
  const t = useTranslations("dashboard");

  if (!data || data.length < 3) return null;

  const historical = data.slice(-8); // last 8 weeks
  const points = historical.map((w, i) => ({ x: i, y: w.revenue }));
  const { m, b } = linReg(points);
  const n = historical.length;
  const CONFIDENCE = 0.15;

  const chartData = [
    ...historical.map((w, i) => ({
      label: w.week,
      revenue: Math.round(w.revenue / 100),
      forecast: undefined,
      forecastHigh: undefined,
      forecastLow: undefined,
    })),
    ...Array.from({ length: 2 }, (_, i) => {
      const x = n + i;
      const projected = Math.max(0, Math.round((m * x + b) / 100));
      return {
        label: `+${i + 1}W`,
        revenue: undefined,
        forecast: projected,
        forecastHigh: Math.round(projected * (1 + CONFIDENCE)),
        forecastLow: Math.round(projected * (1 - CONFIDENCE)),
      };
    }),
  ];

  return (
    <div className="bg-[--raised] rounded-[12px] border border-s-ink/[0.06] p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-[8px] bg-s-amber/10 flex items-center justify-center">
            <TrendingUp size={13} className="text-s-amber" />
          </div>
          <div>
            <p className="text-sm font-heading font-bold text-s-ink">
              {t("forecastTitle")}
            </p>
            <p className="text-[10px] text-s-ink/35">
              {t("forecastSubtitle")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[9px] text-s-ink/30" title={t("forecastDisclaimer")}>
          <Info size={11} />
          {t("forecastEstimated")}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <ComposedChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,18,9,0.05)" />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: "rgba(26,18,9,0.35)" }} />
          <YAxis tick={{ fontSize: 10, fill: "rgba(26,18,9,0.35)" }} tickFormatter={(v) => `${v}`} width={36} />
          <Tooltip
            formatter={(v: number, name: string) => [`CHF ${v}`, name === "revenue" ? t("forecastRevenue") : t("forecastProjection")]}
            contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid rgba(26,18,9,0.08)" }}
          />
          <Bar dataKey="revenue" fill="#E8624A" radius={[4, 4, 0, 0]} maxBarSize={28} name="revenue" />
          <Area dataKey="forecastHigh" fill="#F3A864" fillOpacity={0.08} stroke="none" />
          <Area dataKey="forecastLow" fill="var(--raised, #FFFFFF)" fillOpacity={1} stroke="none" />
          <Line dataKey="forecast" stroke="#F3A864" strokeWidth={2} strokeDasharray="5 3" dot={{ r: 3, fill: "#F3A864" }} name="forecast" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
