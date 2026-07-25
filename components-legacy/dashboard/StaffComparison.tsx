"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { BarChart2, Table2 } from "lucide-react";
import Spinner from "@/components-legacy/ui/Spinner";

interface StaffStats {
  staff_member_id: string;
  name: string;
  bookings: number;
  revenue: number;
  avg_rating: number | null;
  retention_rate: number | null;
  unique_customers: number;
}

interface StaffComparisonProps {
  salonId: string;
}

export default function StaffComparison({ salonId }: StaffComparisonProps) {
  const t = useTranslations("dashboard.staffComparison");
  const [data, setData] = useState<StaffStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"table" | "chart">("table");

  useEffect(() => {
    fetch(`/api/analytics/staff-comparison?salon_id=${salonId}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) setData(d.staff ?? d.items ?? []); })
      .catch((err) => console.error("[StaffComparison] failed to load staff comparison data:", err))
      .finally(() => setLoading(false));
  }, [salonId]);

  if (loading) return <div className="flex justify-center py-6"><Spinner size="md" /></div>;
  if (data.length === 0) return <p className="text-xs text-s-ink/30 text-center py-4">{t("noData")}</p>;

  const maxRevenue = Math.max(...data.map((s) => s.revenue));

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-heading text-sm text-s-ink">{t("title")}</h3>
        <div className="flex rounded-btn border border-s-border overflow-hidden">
          <button onClick={() => setViewMode("table")} aria-pressed={viewMode === "table"}
            className={`px-2 py-1 text-xs transition-colors duration-150 ${viewMode === "table" ? "bg-s-bg-sunken text-s-ink" : "text-s-ink-2"}`}>
            <Table2 size={12} />
          </button>
          <button onClick={() => setViewMode("chart")} aria-pressed={viewMode === "chart"}
            className={`px-2 py-1 text-xs transition-colors duration-150 ${viewMode === "chart" ? "bg-s-bg-sunken text-s-ink" : "text-s-ink-2"}`}>
            <BarChart2 size={12} />
          </button>
        </div>
      </div>

      {viewMode === "table" ? (
        <>
          {/* Mobile: stacked cards (5-col table is unreadable at 390px) */}
          <div className="space-y-2 sm:hidden">
            {data.map((s) => (
              <div key={s.staff_member_id} className="rounded-[12px] border border-s-border p-3">
                <p className="text-sm font-medium text-s-ink mb-2">{s.name}</p>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <p className="text-[12px] text-s-ink-2">{t("bookings")}</p>
                    <p className="data-text text-sm font-bold text-s-ink tabular-nums">{s.bookings}</p>
                  </div>
                  <div>
                    <p className="text-[12px] text-s-ink-2">{t("revenue")}</p>
                    <p className="data-text text-sm font-bold text-s-ink tabular-nums">CHF {(s.revenue / 100).toFixed(0)}</p>
                  </div>
                  <div>
                    <p className="text-[12px] text-s-ink-2">{t("rating")}</p>
                    <p className="data-text text-sm font-bold text-s-ink tabular-nums">{s.avg_rating?.toFixed(1) ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-[12px] text-s-ink-2">{t("retention")}</p>
                    <p className="data-text text-sm font-bold text-s-ink tabular-nums">{s.retention_rate != null ? `${s.retention_rate.toFixed(0)}%` : "—"}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* Desktop: keep the table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-s-border">
                  <th className="text-left py-2 pr-3 font-medium text-s-ink-2">{t("stylist")}</th>
                  <th className="text-right py-2 px-2 font-medium text-s-ink-2">{t("bookings")}</th>
                  <th className="text-right py-2 px-2 font-medium text-s-ink-2">{t("revenue")}</th>
                  <th className="text-right py-2 px-2 font-medium text-s-ink-2">{t("rating")}</th>
                  <th className="text-right py-2 pl-2 font-medium text-s-ink-2">{t("retention")}</th>
                </tr>
              </thead>
              <tbody>
                {data.map((s) => (
                  <tr key={s.staff_member_id} className="border-b border-s-border">
                    <td className="py-2 pr-3 font-medium text-s-ink">{s.name}</td>
                    <td className="py-2 px-2 text-right data-text text-s-ink">{s.bookings}</td>
                    <td className="py-2 px-2 text-right data-text text-s-ink">CHF {(s.revenue / 100).toFixed(0)}</td>
                    <td className="py-2 px-2 text-right data-text text-s-ink">{s.avg_rating?.toFixed(1) ?? "—"}</td>
                    <td className="py-2 pl-2 text-right data-text text-s-ink">{s.retention_rate != null ? `${s.retention_rate.toFixed(0)}%` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="space-y-2">
          {data.map((s) => (
            <div key={s.staff_member_id} className="flex items-center gap-3">
              <span className="text-xs font-medium text-s-ink w-20 truncate">{s.name.split(" ")[0]}</span>
              {/* motion audit RANK 5: was `transition-[width]` (hard rule 2), converted
                  to a transform-only scaleX from the left edge, retimed to the reveal
                  tier (250-300ms, THE SPEED LAW) since the bar travels. */}
              <div className="flex-1 h-5 bg-s-bg-sunken rounded-btn overflow-hidden">
                <div className="h-full w-full origin-left bg-s-accent-bright rounded-btn transition-transform duration-[280ms]"
                  style={{ transform: `scaleX(${maxRevenue > 0 ? s.revenue / maxRevenue : 0})` }} />
              </div>
              <span className="text-xs data-text text-s-ink-2 w-16 text-right">
                CHF {(s.revenue / 100).toFixed(0)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
