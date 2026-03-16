"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import {
  Calendar, MessageCircle, Users, TrendingUp, AlertTriangle,
  Plus, Scissors, Star,
} from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import Spinner from "@/components/ui/Spinner";
import type { Booking } from "@/lib/types";

interface DashboardStats {
  total_bookings: number;
  revenue: number;
  new_customers: number;
  average_rating: number;
  low_slots_warning: boolean;
  pending_cancellations: number;
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
      {showCelebration && (
        <div className="mb-6 bg-teal text-white rounded-card px-5 py-4 flex items-center gap-3 shadow-card">
          <span className="text-2xl">🎉</span>
          <div>
            <p className="font-heading font-bold">Willkommen bei solen.ch!</p>
            <p className="text-sm text-white/80">Dein Salon ist jetzt live. Kunden können dich ab sofort buchen.</p>
          </div>
        </div>
      )}

      <div className="mb-6">
        <h1 className="font-heading font-bold text-2xl text-dark">Übersicht</h1>
        <p className="text-sm text-dark/40 mt-0.5">{today}</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : (
        <div className="space-y-6">
          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Termine diese Woche", value: stats.total_bookings, Icon: Calendar, color: "text-teal" },
                { label: "Umsatz (CHF)", value: stats.revenue.toFixed(0), Icon: TrendingUp, color: "text-dark" },
                { label: "Neukunden", value: stats.new_customers, Icon: Users, color: "text-coral" },
                { label: "Bewertung", value: stats.average_rating.toFixed(1), Icon: Star, color: "text-amber-400" },
              ].map((s) => (
                <div key={s.label} className="bg-white rounded-card border border-gray-100 p-4 shadow-card">
                  <s.Icon size={16} className={s.color + " mb-2"} />
                  <p className="font-data font-bold text-xl text-dark">{s.value}</p>
                  <p className="text-xs text-dark/40 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Alerts */}
          {stats && (stats.low_slots_warning || stats.pending_cancellations > 0) && (
            <div className="space-y-2">
              <h2 className="text-xs font-medium text-dark/40 uppercase tracking-wide">Handlungsbedarf</h2>
              {stats.low_slots_warning && (
                <div className="bg-coral/5 border border-coral/20 rounded-card px-4 py-3 flex items-center gap-3">
                  <AlertTriangle size={16} className="text-coral shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-dark">Wenig freie Slots</p>
                    <p className="text-xs text-dark/50">Weniger als 5 Slots in den nächsten 7 Tagen.</p>
                  </div>
                  <a href={`/${locale}/dashboard/calendar`} className="text-xs text-teal font-medium">Erstellen →</a>
                </div>
              )}
              {stats.pending_cancellations > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-card px-4 py-3 flex items-center gap-3">
                  <AlertTriangle size={16} className="text-amber-500 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-dark">{stats.pending_cancellations} Stornierungsanfragen</p>
                  </div>
                  <a href={`/${locale}/dashboard/bookings?status=cancelled`} className="text-xs text-teal font-medium">Anzeigen →</a>
                </div>
              )}
            </div>
          )}

          {/* Unread messages */}
          {unread > 0 && (
            <a href={`/${locale}/dashboard/messages`}
              className="block bg-white rounded-card border border-gray-100 p-4 shadow-card hover:border-teal transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-coral/10 flex items-center justify-center">
                  <MessageCircle size={18} className="text-coral" />
                </div>
                <div>
                  <p className="text-sm font-medium text-dark">{unread} ungelesene Nachricht{unread > 1 ? "en" : ""}</p>
                  <p className="text-xs text-dark/40">Jetzt antworten →</p>
                </div>
              </div>
            </a>
          )}

          {/* Today's bookings */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-medium text-dark/40 uppercase tracking-wide">Heute</h2>
              <a href={`/${locale}/dashboard/bookings`} className="text-xs text-teal hover:underline">Alle →</a>
            </div>
            {bookings.length === 0 ? (
              <div className="bg-white rounded-card border border-gray-100 p-6 text-center text-dark/30">
                <Calendar size={28} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Keine Termine heute</p>
              </div>
            ) : (
              <div className="space-y-2">
                {bookings.map((b) => (
                  <div key={b.id} className="bg-white rounded-card border border-gray-100 p-4 flex items-center gap-4">
                    <p className="font-data font-bold text-sm text-teal w-12 shrink-0 text-center">
                      {new Date(b.starts_at).toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-dark truncate">{b.customer_name}</p>
                      <p className="text-xs text-dark/40 truncate">{b.service_name}</p>
                    </div>
                    {b.is_first_visit && (
                      <span className="px-2 py-0.5 rounded-pill bg-coral/10 text-coral text-[10px] font-bold shrink-0">
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
            <h2 className="text-xs font-medium text-dark/40 uppercase tracking-wide mb-3">Schnellaktionen</h2>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Termin erstellen", href: `/${locale}/dashboard/calendar`, Icon: Plus },
                { label: "Service hinzufügen", href: `/${locale}/dashboard/services`, Icon: Scissors },
                { label: "Nachrichten", href: `/${locale}/dashboard/messages`, Icon: MessageCircle },
              ].map(({ label, href, Icon }) => (
                <a key={href} href={href}
                  className="bg-white rounded-card border border-gray-100 p-3 flex flex-col items-center gap-2 text-center hover:border-teal transition-colors">
                  <Icon size={18} className="text-teal" />
                  <p className="text-xs text-dark/60 leading-tight">{label}</p>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
