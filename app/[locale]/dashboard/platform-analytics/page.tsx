"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Store, CalendarCheck, Wallet, Users, Star, BarChart3 } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import Spinner from "@/components/ui/Spinner";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface PlatformStats {
  total_salons: number;
  total_bookings_30d: number;
  total_revenue_30d: number;
  total_users: number;
  avg_platform_rating: number;
}

interface StatCardProps {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  decimals?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Count-up hook
// ─────────────────────────────────────────────────────────────────────────────

function useCountUp(target: number, duration = 1200, decimals = 0) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target === 0) return;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(parseFloat((eased * target).toFixed(decimals)));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration, decimals]);
  return value;
}

// ─────────────────────────────────────────────────────────────────────────────
// StatCard
// ─────────────────────────────────────────────────────────────────────────────

function StatCard({ label, value, prefix = "", suffix = "", icon: Icon, decimals = 0 }: StatCardProps) {
  const animated = useCountUp(value, 1200, decimals);
  return (
    <GlassCard className="p-5 flex items-start gap-4">
      <div className="p-2.5 rounded-xl bg-teal/10 shrink-0">
        <Icon size={20} className="text-teal" />
      </div>
      <div>
        <p className="text-xs text-dark/50 font-body mb-1">{label}</p>
        <p className="text-2xl font-data font-bold text-dark" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
          {prefix}{decimals > 0 ? animated.toFixed(decimals) : Math.round(animated)}{suffix}
        </p>
      </div>
    </GlassCard>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Placeholder chart data (will be replaced by real data from salon_analytics)
// ─────────────────────────────────────────────────────────────────────────────

const bookingsTrend = Array.from({ length: 30 }, (_, i) => ({
  day: `${i + 1}`,
  bookings: Math.floor(Math.random() * 15 + 2),
}));

const revenueTrend = Array.from({ length: 12 }, (_, i) => ({
  week: `W${i + 1}`,
  revenue: Math.floor(Math.random() * 2000 + 500),
}));

const customerTypes = [
  { name: "Neukunden", value: 40, color: "#4ECDC4" },
  { name: "Stammkunden", value: 60, color: "#FF6B6B" },
];

const categoryData = [
  { category: "Coiffeur",   bookings: 120 },
  { category: "Barbershop", bookings: 85  },
  { category: "Nails",      bookings: 70  },
  { category: "Spa",        bookings: 55  },
  { category: "Makeup",     bookings: 30  },
  { category: "Waxing",     bookings: 25  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function PlatformAnalyticsPage() {
  const locale = useLocale();
  const router = useRouter();
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    fetch("/api/analytics/platform")
      .then(async (r) => {
        if (r.status === 401 || r.status === 403) { setForbidden(true); return; }
        const data = await r.json();
        setStats(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (forbidden) {
    router.replace(`/${locale}/dashboard`);
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <BarChart3 size={24} style={{ color: "#4ECDC4" }} />
        <div>
          <h1 className="font-heading font-bold text-2xl text-dark" style={{ fontFamily: "Syne, sans-serif" }}>
            Plattform Statistiken
          </h1>
          <p className="text-sm text-dark/50 font-body">Letzte 30 Tage</p>
        </div>
      </div>

      {/* Section 1: Overview cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard label="Salons (gesamt)" value={stats?.total_salons ?? 0} icon={Store} />
        <StatCard label="Buchungen (30T)" value={stats?.total_bookings_30d ?? 0} icon={CalendarCheck} />
        <StatCard label="Umsatz (30T)" value={stats?.total_revenue_30d ?? 0} prefix="CHF " icon={Wallet} decimals={0} />
        <StatCard label="Nutzer (gesamt)" value={stats?.total_users ?? 0} icon={Users} />
        <StatCard label="Ø Bewertung" value={stats?.avg_platform_rating ?? 0} icon={Star} decimals={1} />
      </div>

      {/* Section 3: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Bookings over time */}
        <GlassCard className="p-5">
          <h2 className="font-heading font-semibold text-dark mb-4" style={{ fontFamily: "Syne, sans-serif" }}>
            Buchungen (letzte 30 Tage)
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={bookingsTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fontSize: 10 }} interval={6} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="bookings" stroke="#4ECDC4" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* Revenue over time */}
        <GlassCard className="p-5">
          <h2 className="font-heading font-semibold text-dark mb-4" style={{ fontFamily: "Syne, sans-serif" }}>
            Umsatz (letzte 12 Wochen)
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={revenueTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="week" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v: unknown) => [`CHF ${v}`, "Umsatz"]} />
              <Bar dataKey="revenue" fill="#4ECDC4" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* New vs returning customers */}
        <GlassCard className="p-5">
          <h2 className="font-heading font-semibold text-dark mb-4" style={{ fontFamily: "Syne, sans-serif" }}>
            Neu- vs. Stammkunden
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={customerTypes} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}%`}>
                {customerTypes.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* Category popularity */}
        <GlassCard className="p-5">
          <h2 className="font-heading font-semibold text-dark mb-4" style={{ fontFamily: "Syne, sans-serif" }}>
            Beliebteste Kategorien
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={categoryData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis dataKey="category" type="category" tick={{ fontSize: 11 }} width={70} />
              <Tooltip />
              <Bar dataKey="bookings" fill="#FF6B6B" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>
    </div>
  );
}
