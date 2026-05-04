"use client";

import { useEffect, useState } from "react";
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
  if (data.length === 0) return <p className="text-xs text-s-ink/30 text-center py-4">Keine Daten</p>;

  const maxRevenue = Math.max(...data.map((s) => s.revenue));

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-heading text-sm text-s-ink">Team-Vergleich</h3>
        <div className="flex rounded-btn border border-s-ink/10 overflow-hidden">
          <button onClick={() => setViewMode("table")} aria-pressed={viewMode === "table"}
            className={`px-2 py-1 text-xs transition-colors duration-150 ${viewMode === "table" ? "bg-s-coral text-white" : "text-s-ink/50"}`}>
            <Table2 size={12} />
          </button>
          <button onClick={() => setViewMode("chart")} aria-pressed={viewMode === "chart"}
            className={`px-2 py-1 text-xs transition-colors duration-150 ${viewMode === "chart" ? "bg-s-coral text-white" : "text-s-ink/50"}`}>
            <BarChart2 size={12} />
          </button>
        </div>
      </div>

      {viewMode === "table" ? (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-s-ink/5">
                <th className="text-left py-2 pr-3 font-medium text-s-ink/50">Stylist</th>
                <th className="text-right py-2 px-2 font-medium text-s-ink/50">Termine</th>
                <th className="text-right py-2 px-2 font-medium text-s-ink/50">Umsatz</th>
                <th className="text-right py-2 px-2 font-medium text-s-ink/50">Bewertung</th>
                <th className="text-right py-2 pl-2 font-medium text-s-ink/50">Retention</th>
              </tr>
            </thead>
            <tbody>
              {data.map((s) => (
                <tr key={s.staff_member_id} className="border-b border-s-ink/5">
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
      ) : (
        <div className="space-y-2">
          {data.map((s) => (
            <div key={s.staff_member_id} className="flex items-center gap-3">
              <span className="text-xs font-medium text-s-ink w-20 truncate">{s.name.split(" ")[0]}</span>
              <div className="flex-1 h-5 bg-s-ink/5 rounded-btn overflow-hidden">
                <div className="h-full bg-s-coral rounded-btn transition-[width] duration-200"
                  style={{ width: `${maxRevenue > 0 ? (s.revenue / maxRevenue) * 100 : 0}%` }} />
              </div>
              <span className="text-xs data-text text-s-ink/60 w-16 text-right">
                CHF {(s.revenue / 100).toFixed(0)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
