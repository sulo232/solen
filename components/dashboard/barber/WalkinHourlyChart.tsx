"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Clock } from "lucide-react";
import { useTranslations } from "next-intl";

interface HourlyBucket {
  hour: number;
  count: number;
}

interface WalkinHourlyChartProps {
  salonId: string;
}

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 8..20
const CHART_CORAL = "#E8624A"; // peak hour bar
const CHART_AMBER = "#D4870A"; // standard hour bar

export default function WalkinHourlyChart({ salonId }: WalkinHourlyChartProps) {
  const t = useTranslations("dashboardBarber");
  const [data, setData] = useState<HourlyBucket[]>([]);
  const [loading, setLoading] = useState(true);
  const [peakHour, setPeakHour] = useState<number | null>(null);

  useEffect(() => {
    const fetch_ = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/dashboard/walkin-analytics?salon_id=${salonId}&period=week&breakdown=hourly`
        );
        if (res.ok) {
          const json = await res.json();
          const buckets: HourlyBucket[] = json.hourly ?? [];
          // Fill missing hours with 0
          const filled = HOURS.map((h) => ({
            hour: h,
            count: buckets.find((b) => b.hour === h)?.count ?? 0,
          }));
          setData(filled);
          const peak = filled.reduce((best, b) => (b.count > best.count ? b : best), filled[0]);
          setPeakHour(peak?.count > 0 ? peak.hour : null);
        }
      } catch {
        //
      }
      setLoading(false);
    };
    fetch_();
  }, [salonId]);

  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="bg-white dark:bg-s-dm-surface rounded-[12px] border border-s-ink/[0.06] dark:border-white/[0.06] p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-[8px] bg-s-blue/10 flex items-center justify-center">
            <Clock size={13} className="text-s-blue" />
          </div>
          <div>
            <p className="text-sm font-heading font-bold text-s-ink dark:text-s-dm-text">
              {t("hourlyTitle")}
            </p>
            <p className="text-[10px] text-s-ink/35 dark:text-s-dm-text/35">
              {t("hourlySubtitle")}
            </p>
          </div>
        </div>
        {peakHour !== null && (
          <span className="text-[10px] font-heading font-semibold text-s-coral bg-s-coral/[0.08] px-2 py-1 rounded-pill">
            {t("peakHour", { hour: peakHour })}
          </span>
        )}
      </div>

      {loading ? (
        <div className="h-[160px] animate-pulse bg-s-ink/[0.04] dark:bg-s-dm-text/[0.04] rounded-[8px]" />
      ) : (
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,18,9,0.05)" />
            <XAxis
              dataKey="hour"
              tick={{ fontSize: 9, fill: "rgba(26,18,9,0.35)" }}
              tickFormatter={(h: number) => `${h}h`}
            />
            <YAxis tick={{ fontSize: 9, fill: "rgba(26,18,9,0.35)" }} allowDecimals={false} />
            <Tooltip
              formatter={(v: number) => [v, t("walkins")]}
              labelFormatter={(h: number) => `${h}:00–${h + 1}:00`}
              contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid rgba(26,18,9,0.08)" }}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={22}>
              {data.map((entry) => (
                <Cell
                  key={entry.hour}
                  fill={entry.count === maxCount && maxCount > 0 ? CHART_CORAL : CHART_AMBER}
                  fillOpacity={entry.count === 0 ? 0.2 : 1}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
