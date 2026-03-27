"use client";

import { useEffect, useState, useRef } from "react";
import { useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar, MessageCircle, Users, TrendingUp, AlertTriangle, ShieldAlert,
  Plus, Scissors, Star, PartyPopper,
} from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import SetupBanner from "@/components/dashboard/SetupBanner";
import MiniSparkline from "@/components/dashboard/MiniSparkline";
import { containerVariants, itemVariants } from "@/lib/animations";
import type { Booking } from "@/lib/types";

function useCountUp(target: number, duration = 1000) {
  const prefersReduced = typeof window !== "undefined"
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const [value, setValue] = useState(prefersReduced ? target : 0);
  const raf = useRef<number>(0);
  useEffect(() => {
    if (prefersReduced) { setValue(target); return; }
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      setValue(Math.round(target * progress));
      if (progress < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration, prefersReduced]);
  return value;
}

interface StatCardProps {
  label: string;
  value: number;
  Icon: React.ElementType;
  color: string;
  bg: string;
  isRating?: boolean;
  sparklineData?: number[];
  sparklineColor?: string;
}

function StatCard({ label, value, Icon, color, bg, isRating, sparklineData, sparklineColor }: StatCardProps) {
  const count = useCountUp(value);
  const display = isRating ? (count / 10).toFixed(1) : count;
  return (
    <motion.div variants={itemVariants}
      className="bg-white dark:bg-s-dm-surface rounded-card border border-s-ink/[0.06] dark:border-white/[0.06] p-4">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-8 h-8 rounded-[10px] ${bg} flex items-center justify-center`}>
          <Icon size={15} className={color} />
        </div>
        {sparklineData && sparklineData.length > 1 && (
          <MiniSparkline data={sparklineData} color={sparklineColor} width={64} height={24} />
        )}
      </div>
      <p className="font-heading font-bold text-[28px] text-s-ink dark:text-s-dm-text leading-none">{display}</p>
      <p className="text-[9px] font-heading font-bold uppercase tracking-[.16em] text-s-ink/35 mt-2">{label}</p>
    </motion.div>
  );
}

interface DashboardStats {
  total_bookings: number;
  revenue: number;
  new_customers: number;
  average_rating: number;
  low_slots_warning: boolean;
  pending_cancellations: number;
  trends?: {
    bookings: number[];
    revenue: number[];
    new_customers: number[];
    rating: number[];
  };
  verification_overdue?: boolean;
}

interface EnrichedBooking extends Booking {
  customer_name: string;
  service_name: string;
}

const SectionLabel = ({ children, amber }: { children: React.ReactNode; amber?: boolean }) => (
  <p className={`text-[9px] font-heading font-bold uppercase tracking-[.18em] mb-3 ${amber ? "text-s-amber" : "text-s-ink/35"}`}>
    {children}
  </p>
);

export default function DashboardPage() {
  const locale = useLocale();
  const params = useSearchParams();
  const [bookings, setBookings] = useState<EnrichedBooking[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [salonName, setSalonName] = useState<string | undefined>();
  const [showCelebration, setShowCelebration] = useState(params.get("onboarded") === "1");

  useEffect(() => {
    if (showCelebration) {
      const t = setTimeout(() => setShowCelebration(false), 4000);
      return () => clearTimeout(t);
    }
  }, [showCelebration]);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    fetch("/api/profile")
      .then((r) => r.json())
      .then((profile) => {
        setSalonName(profile?.salon_name);
        const salonId = profile?.salon_id;
        const todayBookings = fetch(`/api/bookings?date=${today}&limit=20`).then((r) => r.json());
        const analytics = salonId
          ? fetch(`/api/analytics/salon/${salonId}?period=week`).then((r) => r.json())
          : Promise.resolve(null);
        const convos = salonId
          ? fetch(`/api/conversations?salon_id=${salonId}&unread=true`).then((r) => r.json())
          : Promise.resolve(null);
        return Promise.all([todayBookings, analytics, convos]);
      })
      .then(([bData, analyticsData, convoData]) => {
        setBookings(bData?.bookings ?? []);
        if (analyticsData) setStats(analyticsData);
        if (convoData) setUnread(convoData.unread_count ?? 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const today = new Date().toLocaleDateString("de-CH", { weekday: "long", day: "numeric", month: "long" });

  return (
    <DashboardLayout salonName={salonName} unreadCount={unread}>
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="mb-6 rounded-card px-4 py-4 flex items-center gap-3"
            style={{ background: "#E8624A" }}
          >
            <PartyPopper size={20} className="shrink-0 text-white/80" />
            <div>
              <p className="font-heading font-bold text-sm text-white">Willkommen bei solen.ch!</p>
              <p className="text-xs text-white/70 mt-0.5">Dein Salon ist jetzt live. Kunden können dich ab sofort buchen.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <SetupBanner />

      <div className="mb-8">
        <p className="text-[9px] font-heading font-bold uppercase tracking-[.20em] text-s-ink/30 mb-1">
          {today}
        </p>
        <h1 className="font-heading font-bold text-[28px] text-s-ink dark:text-s-dm-text leading-none">
          Übersicht
        </h1>
      </div>

      {loading ? (
        <div className="space-y-6">
          {/* Stat card skeletons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-card border border-s-ink/[0.06] p-4 bg-white dark:bg-s-dm-surface animate-pulse">
                <div className="w-8 h-8 rounded-[10px] bg-s-bg-sunken dark:bg-s-dm-raised mb-4" />
                <div className="h-7 w-16 bg-s-bg-sunken dark:bg-s-dm-raised rounded mb-2" />
                <div className="h-2.5 w-24 bg-s-bg-sunken dark:bg-s-dm-raised rounded" />
              </div>
            ))}
          </div>
          {/* Booking row skeletons */}
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="rounded-card border border-s-ink/[0.06] px-4 py-3.5 flex items-center gap-4 bg-white dark:bg-s-dm-surface animate-pulse">
                <div className="w-10 h-10 bg-s-bg-sunken dark:bg-s-dm-raised rounded-[8px] shrink-0" />
                <div className="w-px h-8 bg-s-ink/[0.05] shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-32 bg-s-bg-sunken dark:bg-s-dm-raised rounded" />
                  <div className="h-2.5 w-20 bg-s-bg-sunken dark:bg-s-dm-raised rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Stats */}
          {stats && (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-2 sm:grid-cols-4 gap-3"
            >
              {[
                { label: "Termine diese Woche", value: stats.total_bookings, Icon: Calendar, color: "text-s-coral", bg: "bg-s-coral/5", sparklineData: stats.trends?.bookings, sparklineColor: "#E8624A" },
                { label: "Umsatz (CHF)", value: Math.round(stats.revenue), Icon: TrendingUp, color: "text-s-ink", bg: "bg-s-ink/5", sparklineData: stats.trends?.revenue, sparklineColor: "#1A1209" },
                { label: "Neukunden", value: stats.new_customers, Icon: Users, color: "text-s-coral", bg: "bg-s-coral/5", sparklineData: stats.trends?.new_customers, sparklineColor: "#D4870A" },
                { label: "Bewertung", value: Math.round(stats.average_rating * 10), Icon: Star, color: "text-s-amber", bg: "bg-s-amber-subtle/50", isRating: true, sparklineData: stats.trends?.rating, sparklineColor: "#D4870A" },
              ].map((s) => (
                <StatCard key={s.label} {...s} />
              ))}
            </motion.div>
          )}

          {/* Alerts */}
          {stats && (stats.low_slots_warning || stats.pending_cancellations > 0 || stats.verification_overdue) && (
            <div className="space-y-2">
              <SectionLabel amber>Handlungsbedarf</SectionLabel>
              {stats.verification_overdue && (
                <div className="rounded-card px-4 py-3.5 flex items-center gap-3"
                  style={{ background: "rgba(232,98,74,.06)", border: "1px solid rgba(232,98,74,.18)" }}>
                  <ShieldAlert size={16} className="text-s-coral shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-heading font-semibold text-s-ink dark:text-s-dm-text">Verifizierung überfällig</p>
                    <p className="text-[10px] text-s-ink/45 mt-0.5">Seit über 90 Tagen nicht verifiziert.</p>
                  </div>
                  <a href={`/${locale}/dashboard/settings?tab=verification`}
                    className="text-[10px] font-heading font-bold uppercase tracking-[.04em] text-s-coral shrink-0">
                    Verifizieren →
                  </a>
                </div>
              )}
              {stats.low_slots_warning && (
                <div className="rounded-card px-4 py-3.5 flex items-center gap-3"
                  style={{ background: "rgba(232,98,74,.06)", border: "1px solid rgba(232,98,74,.18)" }}>
                  <AlertTriangle size={16} className="text-s-coral shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-heading font-semibold text-s-ink dark:text-s-dm-text">Wenig freie Slots</p>
                    <p className="text-[10px] text-s-ink/45 mt-0.5">Weniger als 5 Slots in den nächsten 7 Tagen.</p>
                  </div>
                  <a href={`/${locale}/dashboard/calendar`}
                    className="text-[10px] font-heading font-bold uppercase tracking-[.04em] text-s-coral shrink-0">
                    Erstellen →
                  </a>
                </div>
              )}
              {stats.pending_cancellations > 0 && (
                <div className="rounded-card px-4 py-3.5 flex items-center gap-3"
                  style={{ background: "rgba(212,135,10,.06)", border: "1px solid rgba(212,135,10,.20)" }}>
                  <AlertTriangle size={16} className="text-s-amber shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-heading font-semibold text-s-ink dark:text-s-dm-text">{stats.pending_cancellations} Stornierungsanfragen</p>
                  </div>
                  <a href={`/${locale}/dashboard/bookings?status=cancelled`}
                    className="text-[10px] font-heading font-bold uppercase tracking-[.04em] text-s-amber shrink-0">
                    Anzeigen →
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Unread messages */}
          {unread > 0 && (
            <a href={`/${locale}/dashboard/messages`}
              className="block rounded-card border border-s-ink/[0.06] dark:border-white/[0.06] p-4 bg-white dark:bg-s-dm-surface hover:border-s-coral/40 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-[10px] bg-s-coral/10 flex items-center justify-center">
                  <MessageCircle size={18} className="text-s-coral" />
                </div>
                <div>
                  <p className="text-sm font-heading font-semibold text-s-ink dark:text-s-dm-text">{unread} ungelesene Nachricht{unread > 1 ? "en" : ""}</p>
                  <p className="text-[10px] text-s-ink/40 dark:text-s-dm-text/40 mt-0.5">Jetzt antworten →</p>
                </div>
              </div>
            </a>
          )}

          {/* Today's bookings */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <SectionLabel>Heute</SectionLabel>
              <a href={`/${locale}/dashboard/bookings`} className="text-[10px] font-heading font-bold uppercase tracking-[.04em] text-s-coral">Alle →</a>
            </div>
            {bookings.length === 0 ? (
              <div className="rounded-card border border-s-ink/[0.06] border-dashed p-8 text-center bg-white dark:bg-s-dm-surface">
                <Calendar size={24} className="mx-auto mb-2 text-s-ink/20" />
                <p className="text-xs font-heading text-s-ink/30 uppercase tracking-[.10em]">Keine Termine heute</p>
              </div>
            ) : (
              <div className="space-y-2">
                {bookings.map((b) => (
                  <div key={b.id}
                    className="rounded-card border border-s-ink/[0.06] px-4 py-3.5 flex items-center gap-4 bg-white dark:bg-s-dm-surface">
                    {/* Time column */}
                    <div className="shrink-0 text-center w-10">
                      <p className="data-text font-bold text-base text-s-coral leading-none">
                        {new Date(b.starts_at).toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    {/* Divider */}
                    <div className="w-px h-8 bg-s-ink/[0.07] shrink-0" />
                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-heading font-semibold text-s-ink dark:text-s-dm-text truncate">{b.customer_name}</p>
                      <p className="text-[10px] font-heading uppercase tracking-[.08em] text-s-ink/40 truncate mt-0.5">{b.service_name}</p>
                    </div>
                    {/* Status + badge */}
                    <div className="shrink-0 flex items-center gap-2">
                      {b.is_first_visit && (
                        <span className="px-2 py-0.5 rounded-[6px] text-[9px] font-heading font-bold uppercase tracking-[.06em]"
                          style={{ background: "rgba(232,98,74,.10)", color: "#7A2415" }}>
                          Neu
                        </span>
                      )}
                      <div className={`w-2 h-2 rounded-full ${
                        b.status === "confirmed" ? "bg-[#4CAF6F]" :
                        b.status === "pending" ? "bg-s-amber" : "bg-s-ink/20"
                      }`} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div>
            <SectionLabel>Schnellaktionen</SectionLabel>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Termin", href: `/${locale}/dashboard/calendar`, Icon: Plus },
                { label: "Service", href: `/${locale}/dashboard/services`, Icon: Scissors },
                { label: "Nachrichten", href: `/${locale}/dashboard/messages`, Icon: MessageCircle },
              ].map(({ label, href, Icon }) => (
                <a key={href} href={href}
                  className="rounded-card border border-s-ink/[0.06] p-4 flex flex-col items-center gap-2.5 text-center bg-white dark:bg-s-dm-surface hover:border-s-coral/40 hover:bg-s-coral/[0.03] transition-colors">
                  <div className="w-9 h-9 rounded-[10px] flex items-center justify-center"
                    style={{ background: "rgba(232,98,74,.08)" }}>
                    <Icon size={17} className="text-s-coral" />
                  </div>
                  <p className="text-[9px] font-heading font-bold uppercase tracking-[.10em] text-s-ink/55 leading-tight">{label}</p>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
