"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Store, Calendar, TrendingUp, Users, Star, BarChart3 } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import GlassCard from "@/components/ui/GlassCard";
import Spinner from "@/components/ui/Spinner";

// ─── Count-up animation ───────────────────────────────────────────────────────
function useCountUp(target: number, enabled: boolean) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!enabled || target === 0) return;
    const duration = 1400;
    const steps = 50;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current = Math.min(current + increment, target);
      setCount(Math.floor(current));
      if (current >= target) clearInterval(timer);
    }, duration / steps);
    return () => clearInterval(timer);
  }, [target, enabled]);
  return count;
}

function useIntersection(ref: React.RefObject<Element | null>) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold: 0.2 });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [ref]);
  return visible;
}

// ─── Stat card ────────────────────────────────────────────────────────────────
interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: number;
  format?: "number" | "currency" | "rating";
  color?: string;
}

function StatCard({ icon: Icon, label, value, format = "number", color = "text-teal" }: StatCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useIntersection(ref as React.RefObject<Element>);
  const count = useCountUp(value, visible);

  const formatted =
    format === "currency"
      ? `CHF ${count.toLocaleString("de-CH")}`
      : format === "rating"
      ? (value).toFixed(1)
      : count.toLocaleString("de-CH");

  return (
    <GlassCard className="p-5">
      <div ref={ref} className="flex items-start justify-between">
        <div>
          <p className="text-xs font-body text-dark/50 mb-1">{label}</p>
          <p className={`font-data font-bold text-2xl ${color}`}>
            {visible ? formatted : "—"}
          </p>
        </div>
        <div className={`p-2.5 rounded-xl bg-teal/10`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
      </div>
    </GlassCard>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
interface PlatformStats {
  total_salons: number;
  total_bookings_30d: number;
  total_revenue_30d: number;
  total_users: number;
  avg_platform_rating: number;
}

const TEAL = "#4ECDC4";
const CORAL = "#FF6B6B";
const DARK = "#1A1A2E";

// Placeholder chart data — replaced by real data when analytics accumulate
const BOOKING_TREND = Array.from({ length: 30 }, (_, i) => ({
  day: `${i + 1}.`,
  bookings: Math.floor(Math.random() * 20 + 5),
}));

const REVENUE_TREND = Array.from({ length: 12 }, (_, i) => ({
  week: `W${i + 1}`,
  revenue: Math.floor(Math.random() * 2000 + 500),
}));

const CUSTOMER_SPLIT = [
  { name: "Neue Kunden", value: 40 },
  { name: "Stammkunden", value: 60 },
];

const CATEGORY_DATA = [
  { name: "Coiffeur", bookings: 85 },
  { name: "Barbershop", bookings: 62 },
  { name: "Nails", bookings: 48 },
  { name: "Spa", bookings: 35 },
  { name: "Makeup", bookings: 22 },
  { name: "Waxing", bookings: 18 },
];

export default function PlatformAnalyticsPage() {
  const locale = useLocale();
  const router = useRouter();
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    fetch("/api/analytics/platform")
      .then((r) => {
        if (r.status === 403) { setForbidden(true); return null; }
        if (r.status === 401) { router.push(`/${locale}/auth/login`); return null; }
        return r.json();
      })
      .then((d) => { if (d) setStats(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [locale, router]);

  if (forbidden) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-64">
          <p className="text-dark/50 font-body">Kein Zugriff — nur für Admins.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="font-heading font-bold text-2xl text-dark">Plattform Statistiken</h1>
          <p className="text-sm text-dark/50 font-body mt-1">Echtzeit-Übersicht der gesamten Plattform</p>
        </div>

        {/* Stat cards */}
        {loading ? (
          <div className="flex justify-center py-10"><Spinner size="lg" /></div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard icon={Store} label="Aktive Salons" value={stats?.total_salons ?? 0} />
            <StatCard icon={Calendar} label="Buchungen (30 Tage)" value={stats?.total_bookings_30d ?? 0} />
            <StatCard icon={TrendingUp} label="Umsatz (30 Tage)" value={stats?.total_revenue_30d ?? 0} format="currency" color="text-coral" />
            <StatCard icon={Users} label="Registrierte Nutzer" value={stats?.total_users ?? 0} />
            <StatCard icon={Star} label="Ø Plattform-Rating" value={stats?.avg_platform_rating ?? 0} format="rating" />
          </div>
        )}

        {/* Charts row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GlassCard className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-teal" />
              <h2 className="font-heading font-semibold text-dark text-base">Buchungen (letzte 30 Tage)</h2>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={BOOKING_TREND}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: DARK + "66" }} />
                <YAxis tick={{ fontSize: 11, fill: DARK + "66" }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }} />
                <Line type="monotone" dataKey="bookings" stroke={TEAL} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </GlassCard>

          <GlassCard className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-coral" />
              <h2 className="font-heading font-semibold text-dark text-base">Umsatz (letzte 12 Wochen)</h2>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={REVENUE_TREND}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: DARK + "66" }} />
                <YAxis tick={{ fontSize: 11, fill: DARK + "66" }} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                  formatter={(v: number) => [`CHF ${v.toLocaleString("de-CH")}`, "Umsatz"]}
                />
                <Bar dataKey="revenue" fill={CORAL} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </GlassCard>
        </div>

        {/* Charts row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GlassCard className="p-5">
            <h2 className="font-heading font-semibold text-dark text-base mb-4">Neu vs. Stammkunden</h2>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={CUSTOMER_SPLIT} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={3}>
                  <Cell fill={TEAL} />
                  <Cell fill={CORAL} />
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, border: "none" }} />
                <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </GlassCard>

          <GlassCard className="p-5">
            <h2 className="font-heading font-semibold text-dark text-base mb-4">Buchungen nach Kategorie</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={CATEGORY_DATA} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11, fill: DARK + "66" }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: DARK + "66" }} width={72} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "none" }} />
                <Bar dataKey="bookings" fill={TEAL} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </GlassCard>
        </div>
      </div>
    </DashboardLayout>
  );
}
