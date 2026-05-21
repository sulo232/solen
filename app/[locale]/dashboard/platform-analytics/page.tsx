"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { Store, UsersRound, Calendar, DollarSign, Star, BarChart3 } from "lucide-react";
import { useLocale } from "next-intl";
import DashboardLayout from "@/components-legacy/dashboard/DashboardLayout";
import Spinner from "@/components-legacy/ui/Spinner";
import { formatCurrency } from "@/lib/format-currency";
import { containerVariants, itemVariants } from "@/lib/animations";

interface PlatformStats {
  total_salons: number;
  total_bookings_30d: number;
  total_revenue_30d: number;
  total_users: number;
  avg_platform_rating: number;
}

/* ─── Count-up hook ─── */
function useCountUp(target: number, duration = 1200, decimals = 0) {
  const [value, setValue] = useState(0);
  const raf = useRef<number>(0);
  useEffect(() => {
    if (target === 0) { setValue(0); return; }
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(parseFloat((eased * target).toFixed(decimals)));
      if (progress < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration, decimals]);
  return value;
}

/* ─── StatCard ─── */
function StatCard({
  label,
  value,
  prefix = "",
  suffix = "",
  icon: Icon,
  bg,
  color,
  decimals = 0,
  formatValue,
}: {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  icon: React.ElementType;
  bg: string;
  color: string;
  decimals?: number;
  formatValue?: (v: number) => string;
}) {
  const animated = useCountUp(value, 1200, decimals);
  return (
    <motion.div
      variants={itemVariants}
      className="bg-white rounded-[12px] border border-s-ink/5 shadow-warm-md p-5 flex items-start gap-4"
    >
      <div className={`p-2.5 rounded-[12px] ${bg} shrink-0`}>
        <Icon size={20} className={color} />
      </div>
      <div>
        <p className="text-xs text-s-ink/50 font-body mb-1">{label}</p>
        <p className="text-2xl font-data font-bold text-s-ink">
          {formatValue
            ? formatValue(animated)
            : `${prefix}${decimals > 0 ? animated.toFixed(decimals) : Math.round(animated)}${suffix}`}
        </p>
      </div>
    </motion.div>
  );
}

/* ─── Main Page ─── */
export default function PlatformAnalyticsPage() {
  const locale = useLocale();
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics/platform")
      .then((r) => r.json())
      .then((d) => setStats(d))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-heading text-2xl text-s-ink">Plattform Statistiken</h1>
        <p className="text-sm text-s-ink/40 mt-0.5">Gesamtübersicht der Plattform</p>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
          {/* Stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <StatCard label="Salons" value={stats?.total_salons ?? 0} icon={Store} bg="bg-s-coral/5" color="text-s-coral" />
            <StatCard label="Nutzer" value={stats?.total_users ?? 0} icon={UsersRound} bg="bg-s-ink/5" color="text-s-ink" />
            <StatCard label="Buchungen (30T)" value={stats?.total_bookings_30d ?? 0} icon={Calendar} bg="bg-s-coral/5" color="text-s-coral" />
            <StatCard label="Umsatz (30T)" value={stats?.total_revenue_30d ?? 0} formatValue={(v) => formatCurrency(Math.round(v), locale)} icon={DollarSign} bg="bg-s-coral/5" color="text-s-coral" />
            <StatCard label="Ø Bewertung" value={stats?.avg_platform_rating ?? 0} icon={Star} bg="bg-s-amber-subtle" color="text-s-amber" decimals={1} />
          </div>

          {/* Charts placeholder */}
          <motion.div
            variants={itemVariants}
            className="bg-white rounded-[12px] border border-s-ink/5 shadow-warm-md p-10 text-center"
          >
            <BarChart3 size={36} className="mx-auto mb-3 text-s-coral opacity-40" />
            <p className="text-sm text-s-ink/40 font-body">
              Detaillierte Charts werden bald verfügbar.
            </p>
          </motion.div>
        </motion.div>
      )}
    </DashboardLayout>
  );
}
