"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { Users, TrendingUp, Gift, Share2 } from "lucide-react";
import { formatCurrency } from "@/lib/format-currency";
import Spinner from "@/components/ui/Spinner";

interface ReferralStats {
  total_referrals: number;
  completed_referrals: number;
  total_revenue_from_referrals: number;
  top_referrers: { name: string; referrals: number; revenue: number }[];
}

interface ReferralDashboardProps {
  salonId: string;
}

export default function ReferralDashboard({ salonId }: ReferralDashboardProps) {
  const locale = useLocale();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/analytics/referrals?salon_id=${salonId}`)
      .then((r) => { if (!r.ok || cancelled) return null; return r.json(); })
      .then((d) => { if (!cancelled && d) setStats(d); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [salonId]);

  if (loading) return <div className="flex justify-center py-6"><Spinner size="md" /></div>;

  const data = stats ?? { total_referrals: 0, completed_referrals: 0, total_revenue_from_referrals: 0, top_referrers: [] };

  return (
    <div>
      <h3 className="font-heading font-bold text-sm text-s-ink dark:text-s-dm-text flex items-center gap-2 mb-4">
        <Share2 size={14} className="text-s-coral" /> Empfehlungs-Programm
      </h3>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { label: "Empfehlungen gesamt", value: data.total_referrals, icon: Users },
          { label: "Abgeschlossen", value: data.completed_referrals, icon: Gift },
          { label: "Umsatz durch Empfehlungen", value: formatCurrency(data.total_revenue_from_referrals, locale), icon: TrendingUp },
        ].map((s) => (
          <div key={s.label} className="bg-s-bg-surface/50 dark:bg-s-dm-bg/50 rounded-[16px] border border-s-ink/5 dark:border-white/5 p-3 text-center">
            <s.icon size={16} className="text-s-coral mx-auto mb-1" />
            <p className="data-text font-bold text-lg text-s-ink dark:text-s-dm-text">{s.value}</p>
            <p className="text-[10px] text-s-ink/40 dark:text-s-dm-text/40">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Top referrers */}
      {data.top_referrers.length > 0 ? (
        <div>
          <h4 className="text-xs font-semibold text-s-ink/40 dark:text-s-dm-text/40 uppercase tracking-wide mb-2">Top Empfehler</h4>
          <div className="space-y-1">
            {data.top_referrers.map((r, i) => (
              <div key={r.name} className="flex items-center justify-between text-xs py-2 border-b border-s-ink/5 dark:border-white/5 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-s-coral/10 text-s-coral text-[10px] font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <span className="font-medium text-s-ink dark:text-s-dm-text">{r.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-s-ink/40 dark:text-s-dm-text/40">{r.referrals} Empfehlungen</span>
                  <span className="data-text font-semibold text-s-ink dark:text-s-dm-text">{formatCurrency(r.revenue, locale)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-xs text-s-ink/30 dark:text-s-dm-text/30 text-center py-6">Noch keine Empfehlungen erhalten</p>
      )}
    </div>
  );
}
