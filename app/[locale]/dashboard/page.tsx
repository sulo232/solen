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
import Spinner from "@/components/ui/Spinner";
import { containerVariants, itemVariants } from "@/lib/animations";
import type { Booking } from "@/lib/types";

function useCountUp(target: number, duration = 1000) {
  const [value, setValue] = useState(0);
  const raf = useRef<number>(0);
  useEffect(() => {
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      setValue(Math.round(target * progress));
      if (progress < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);
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
    <motion.div variants={itemVariants} className="bg-white dark:bg-s-dm-surface rounded-card border border-s-ink/5 dark:border-white/5 p-4 shadow-card">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-8 h-8 rounded-btn ${bg} flex items-center justify-center`}>
          <Icon size={15} className={color} />
        </div>
        {sparklineData && sparklineData.length > 1 && (
          <MiniSparkline data={sparklineData} color={sparklineColor} width={64} height={24} />
        )}
      </div>
      <p className="data-text font-bold text-2xl text-s-ink dark:text-s-dm-text">{display}</p>
      <p className="text-xs text-s-ink/40 dark:text-s-dm-text/40 mt-0.5 leading-tight">{label}</p>
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
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35 }}
            className="mb-6 bg-s-coral text-white rounded-card px-5 py-4 flex items-center gap-3 shadow-warm-sm"
          >
            <PartyPopper size={22} className="shrink-0" />
            <div>
              <p className="font-heading font-bold">Willkommen bei solen.ch!</p>
              <p className="text-sm text-white/80">Dein Salon ist jetzt live. Kunden können dich ab sofort buchen.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <SetupBanner />

      <div className="mb-6">
        <h1 className="font-heading font-bold text-2xl text-s-ink dark:text-s-dm-text">Übersicht</h1>
        <p className="text-sm text-s-ink/40 dark:text-s-dm-text/40 mt-0.5">{today}</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
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
              <h2 className="text-xs font-medium text-s-ink/40 dark:text-s-dm-text/40 uppercase tracking-wide">Handlungsbedarf</h2>
              {stats.verification_overdue && (
                <div className="bg-s-coral/5 border border-s-coral/20 rounded-card px-4 py-3 flex items-center gap-3">
                  <ShieldAlert size={16} className="text-s-coral shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-s-ink dark:text-s-dm-text">Verifizierung überfällig</p>
                    <p className="text-xs text-s-ink/50 dark:text-s-dm-text/50">Dein Salon wurde seit über 90 Tagen nicht verifiziert.</p>
                  </div>
                  <a href={`/${locale}/dashboard/settings?tab=verification`} className="text-xs text-s-coral font-medium">Verifizieren →</a>
                </div>
              )}
              {stats.low_slots_warning && (
                <div className="bg-s-coral/5 border border-s-coral/20 rounded-card px-4 py-3 flex items-center gap-3">
                  <AlertTriangle size={16} className="text-s-coral shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-s-ink dark:text-s-dm-text">Wenig freie Slots</p>
                    <p className="text-xs text-s-ink/50 dark:text-s-dm-text/50">Weniger als 5 Slots in den nächsten 7 Tagen.</p>
                  </div>
                  <a href={`/${locale}/dashboard/calendar`} className="text-xs text-s-coral font-medium">Erstellen →</a>
                </div>
              )}
              {stats.pending_cancellations > 0 && (
                <div className="bg-s-amber-subtle/50 border border-s-amber/20 rounded-card px-4 py-3 flex items-center gap-3">
                  <AlertTriangle size={16} className="text-s-amber shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-s-ink dark:text-s-dm-text">{stats.pending_cancellations} Stornierungsanfragen</p>
                  </div>
                  <a href={`/${locale}/dashboard/bookings?status=cancelled`} className="text-xs text-s-coral font-medium">Anzeigen →</a>
                </div>
              )}
            </div>
          )}

          {/* Unread messages */}
          {unread > 0 && (
            <a href={`/${locale}/dashboard/messages`}
              className="block bg-white dark:bg-s-dm-surface rounded-card border border-s-ink/5 dark:border-white/5 p-4 shadow-card hover:border-s-coral transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-s-coral/10 flex items-center justify-center">
                  <MessageCircle size={18} className="text-s-coral" />
                </div>
                <div>
                  <p className="text-sm font-medium text-s-ink dark:text-s-dm-text">{unread} ungelesene Nachricht{unread > 1 ? "en" : ""}</p>
                  <p className="text-xs text-s-ink/40 dark:text-s-dm-text/40">Jetzt antworten →</p>
                </div>
              </div>
            </a>
          )}

          {/* Today's bookings */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-medium text-s-ink/40 dark:text-s-dm-text/40 uppercase tracking-wide">Heute</h2>
              <a href={`/${locale}/dashboard/bookings`} className="text-xs text-s-coral hover:underline">Alle →</a>
            </div>
            {bookings.length === 0 ? (
              <div className="bg-white dark:bg-s-dm-surface rounded-card border border-s-ink/5 dark:border-white/5 p-6 text-center text-s-ink/30 dark:text-s-dm-text/30">
                <Calendar size={28} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Keine Termine heute</p>
              </div>
            ) : (
              <div className="space-y-2">
                {bookings.map((b) => (
                  <div key={b.id} className="bg-white dark:bg-s-dm-surface rounded-card border border-s-ink/5 dark:border-white/5 p-4 flex items-center gap-4">
                    <p className="data-text font-bold text-sm text-s-coral w-12 shrink-0 text-center">
                      {new Date(b.starts_at).toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-s-ink dark:text-s-dm-text truncate">{b.customer_name}</p>
                      <p className="text-xs text-s-ink/40 dark:text-s-dm-text/40 truncate">{b.service_name}</p>
                    </div>
                    {b.is_first_visit && (
                      <span className="px-2 py-0.5 rounded-pill bg-s-coral/10 text-s-coral text-[10px] font-bold shrink-0">
                        NEUKUNDE
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div>
            <h2 className="text-xs font-medium text-s-ink/40 dark:text-s-dm-text/40 uppercase tracking-wide mb-3">Schnellaktionen</h2>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Termin erstellen", href: `/${locale}/dashboard/calendar`, Icon: Plus },
                { label: "Service hinzufügen", href: `/${locale}/dashboard/services`, Icon: Scissors },
                { label: "Nachrichten", href: `/${locale}/dashboard/messages`, Icon: MessageCircle },
              ].map(({ label, href, Icon }) => (
                <a key={href} href={href}
                  className="bg-white dark:bg-s-dm-surface rounded-card border border-s-ink/5 dark:border-white/5 p-3 flex flex-col items-center gap-2 text-center hover:border-s-coral transition-colors">
                  <Icon size={18} className="text-s-coral" />
                  <p className="text-xs text-s-ink/60 dark:text-s-dm-text/60 leading-tight">{label}</p>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
