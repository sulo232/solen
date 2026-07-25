"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { useTranslations } from "next-intl";

interface PLComparisonProps {
  salonId: string;
}

interface PLStats {
  appointment_revenue: number;
  walkin_revenue: number;
  appointment_count: number;
  walkin_count: number;
  appointment_avg: number;
  walkin_avg: number;
}

interface WeeklyRow {
  week: string;
  appointments: number;
  walkins: number;
}

export default function PLComparison({ salonId }: PLComparisonProps) {
  const t = useTranslations("dashboardBarber");
  const [stats, setStats] = useState<PLStats | null>(null);
  const [weekly, setWeekly] = useState<WeeklyRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch_ = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/dashboard/barber/pl-comparison?salon_id=${salonId}`);
        if (res.ok) {
          const json = await res.json();
          setStats(json.stats ?? null);
          setWeekly(json.weekly ?? []);
        }
      } catch {
        //
      }
      setLoading(false);
    };
    fetch_();
  }, [salonId]);

  const total = stats ? stats.appointment_revenue + stats.walkin_revenue : 0;
  const walkinShare = total > 0 ? Math.round((stats!.walkin_revenue / total) * 100) : 0;
  const apptShare = 100 - walkinShare;

  const formatCHF = (v: number) => `CHF ${(v / 100).toFixed(0)}`;

  return (
    <div className="bg-white rounded-[16px] border border-s-border p-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-[8px] bg-s-success-bg flex items-center justify-center">
          <DollarSign size={13} className="text-s-success" />
        </div>
        <div>
          <p className="text-sm font-heading text-s-ink">
            {t("plTitle")}
          </p>
          <p className="text-[12px] text-s-ink-2">
            {t("plSubtitle")}
          </p>
        </div>
      </div>

      {loading ? (
        // mockup-ok: WCAG 2.2.2 conformance, mount-load skeleton bounded (tailwind.config.js pulse-bounded)
        <div className="space-y-3 animate-pulse-bounded">
          <div className="h-16 bg-s-bg-sunken rounded-[8px]" />
          <div className="h-[160px] bg-s-bg-sunken rounded-[8px]" />
        </div>
      ) : !stats ? (
        <p className="text-sm text-s-ink-3 text-center py-6">
          {t("noData")}
        </p>
      ) : (
        <>
          {/* KPI row */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-s-bg-sunken rounded-[8px] p-3">
              <p className="text-[12px] font-heading uppercase tracking-[.15em] text-s-ink-2 mb-0.5">
                {t("appointments")}
              </p>
              <p className="text-xl font-heading text-s-ink data-text">
                {formatCHF(stats.appointment_revenue)}
              </p>
              <p className="text-[12px] text-s-ink-2">
                {stats.appointment_count} × {formatCHF(stats.appointment_avg)} ⌀ {apptShare}%
              </p>
            </div>
            <div className="bg-s-warning-bg rounded-[8px] p-3">
              <p className="text-[12px] font-heading uppercase tracking-[.15em] text-s-warning-text mb-0.5">
                {t("walkIns")}
              </p>
              <p className="text-xl font-heading text-s-ink data-text">
                {formatCHF(stats.walkin_revenue)}
              </p>
              <p className="text-[12px] text-s-ink-2">
                {stats.walkin_count} × {formatCHF(stats.walkin_avg)} ⌀ {walkinShare}%
              </p>
            </div>
          </div>

          {/* Share bar. motion audit RANK 5: was `transition-[width]` (hard rule 2).
              Unlike a fill-inside-a-fixed-track bar, these two divs ARE the layout
              (their widths sum to the row, there's no separate static track to scale
              a fill inside), so a scaleX conversion here would need new wrapper
              elements per segment, a structural change outside a treatment-only
              fix. Removed the transition instead: the split still updates on data
              change, it now snaps rather than interpolating a reflow mid-frame. */}
          <div className="flex rounded-full overflow-hidden h-2 mb-4">
            <div
              className="bg-s-ink"
              style={{ width: `${apptShare}%` }}
            />
            <div
              className="bg-s-warning"
              style={{ width: `${walkinShare}%` }}
            />
          </div>

          {/* Weekly stacked bar */}
          {weekly.length > 0 && (
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={weekly} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,18,9,0.05)" />
                <XAxis dataKey="week" tick={{ fontSize: 9, fill: "rgba(26,18,9,0.35)" }} />
                <YAxis tick={{ fontSize: 9, fill: "rgba(26,18,9,0.35)" }} tickFormatter={(v) => `${v}`} />
                <Tooltip
                  formatter={(v: number, name: string) => [formatCHF(v), name === "appointments" ? t("appointments") : t("walkIns")]}
                  contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid rgba(26,18,9,0.08)" }}
                />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} formatter={(name) => name === "appointments" ? t("appointments") : t("walkIns")} />
                {/* recharts needs literal colors — appointments=s-ink #0A0A0A, walkins=s-warning #F1AE27 (LOCKFILE §1) */}
                <Bar dataKey="appointments" stackId="a" fill="#0A0A0A" radius={[0, 0, 0, 0]} maxBarSize={24} />
                <Bar dataKey="walkins" stackId="a" fill="#F1AE27" radius={[4, 4, 0, 0]} maxBarSize={24} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </>
      )}
    </div>
  );
}
