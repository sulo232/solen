"use client";

import { useEffect, useState } from "react";
import { Trophy, ArrowUpDown, Eye, EyeOff } from "lucide-react";

interface BarberStats {
  staff_id: string;
  staff_name: string;
  bookings_count: number;
  revenue: number;
  retention_pct: number;
  avg_tip: number;
  walkin_conversion_pct: number;
  chair_utilization_pct: number;
}

interface BarberLeaderboardProps {
  salonId: string;
}

type SortKey = keyof Omit<BarberStats, "staff_id" | "staff_name">;
type Period = "week" | "month";

export default function BarberLeaderboard({ salonId }: BarberLeaderboardProps) {
  const [stats, setStats] = useState<BarberStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortKey>("bookings_count");
  const [period, setPeriod] = useState<Period>("week");
  const [anonymized, setAnonymized] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`/api/dashboard/barber-leaderboard?salon_id=${salonId}&period=${period}`);
        if (res.ok) {
          const data = await res.json();
          setStats(data.stats ?? []);
        }
      } catch {
        // Error loading
      }
      setLoading(false);
    };
    fetchStats();
  }, [salonId, period]);

  const sorted = [...stats].sort((a, b) => (b[sortBy] as number) - (a[sortBy] as number));

  const columns: { key: SortKey; label: string; format: (v: number) => string }[] = [
    { key: "bookings_count", label: "Buchungen", format: (v) => `${v}` },
    { key: "revenue", label: "Umsatz", format: (v) => `CHF ${v.toFixed(0)}` },
    { key: "retention_pct", label: "Retention", format: (v) => `${v}%` },
    { key: "avg_tip", label: "Ø Trinkgeld", format: (v) => `CHF ${v.toFixed(1)}` },
    { key: "walkin_conversion_pct", label: "Walk-in Conv.", format: (v) => `${v}%` },
    { key: "chair_utilization_pct", label: "Stuhl-Ausl.", format: (v) => `${v}%` },
  ];

  return (
    <div className="rounded-card bg-white dark:bg-s-dm-surface border border-s-ink/5 dark:border-s-dm-text/10 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy size={18} className="text-s-amber" />
          <h3 className="font-heading text-sm font-bold text-s-ink dark:text-s-dm-text">Barber Leaderboard</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAnonymized(!anonymized)}
            className="p-1.5 rounded-button text-s-ink/40 dark:text-s-dm-text/40 hover:bg-s-bg-surface dark:hover:bg-s-dm-bg transition-colors"
            title={anonymized ? "Namen zeigen" : "Anonymisieren"}
          >
            {anonymized ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
          <div className="flex rounded-button border border-s-ink/10 dark:border-s-dm-text/10 overflow-hidden">
            {(["week", "month"] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 text-xs font-medium transition-colors ${
                  period === p
                    ? "bg-s-coral text-white"
                    : "text-s-ink/50 dark:text-s-dm-text/50 hover:bg-s-bg-surface dark:hover:bg-s-dm-bg"
                }`}
              >
                {p === "week" ? "Woche" : "Monat"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-8 text-center text-sm text-s-ink/40 dark:text-s-dm-text/40">Laden...</div>
      ) : stats.length === 0 ? (
        <div className="py-8 text-center text-sm text-s-ink/40 dark:text-s-dm-text/40">Keine Daten</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-s-ink/5 dark:border-s-dm-text/5">
                <th className="text-left py-2 text-xs font-medium text-s-ink/50 dark:text-s-dm-text/50 pr-4">#</th>
                <th className="text-left py-2 text-xs font-medium text-s-ink/50 dark:text-s-dm-text/50 pr-4">Barber</th>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => setSortBy(col.key)}
                    className="text-right py-2 text-xs font-medium text-s-ink/50 dark:text-s-dm-text/50 cursor-pointer hover:text-s-ink dark:hover:text-s-dm-text pr-3 whitespace-nowrap"
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      {sortBy === col.key && <ArrowUpDown size={10} />}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((barber, i) => (
                <tr key={barber.staff_id} className="border-b border-s-ink/5 dark:border-s-dm-text/5 last:border-0">
                  <td className="py-2.5 text-s-ink/40 dark:text-s-dm-text/40 pr-4 font-medium">{i + 1}</td>
                  <td className="py-2.5 text-s-ink dark:text-s-dm-text pr-4 font-medium whitespace-nowrap">
                    {anonymized ? `Barber ${String.fromCharCode(65 + i)}` : barber.staff_name}
                  </td>
                  {columns.map((col) => (
                    <td key={col.key} className="py-2.5 text-right text-s-ink/70 dark:text-s-dm-text/70 pr-3 tabular-nums whitespace-nowrap">
                      {col.format(barber[col.key] as number)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
