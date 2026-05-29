"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Calendar, CheckCircle2, ArrowUpRight, ArrowDownRight } from "lucide-react";
import DashboardLayout from "@/components-legacy/dashboard/DashboardLayout";
import SetupBanner from "@/components-legacy/dashboard/SetupBanner";
import ActivityFeed from "@/components-legacy/dashboard/ActivityFeed";
import {
  DashPanel, DashStatusPill, DashRow, DashButton, DashLineChart, DashBarChart,
} from "@/app/[locale]/_components/dashboard/DashboardUI";
import { cn } from "@/lib/utils";
import type { Booking } from "@/lib/types";

interface DailyPoint { date: string; bookings: number; revenue: number; confirmed: number; cancelled: number }
interface DashboardStats {
  total_bookings: number;
  total_revenue: number;
  new_customers: number;
  avg_rating: number;
  trends_vs_prior?: { bookings: number; revenue: number; new_customers: number; rating: number };
  daily?: DailyPoint[];
  popular_services?: { id: string; name: string; count: number }[];
}
interface EnrichedBooking extends Booking { customer_name: string; service_name: string }
interface StaffStat { id: string; name: string; revenue?: number; bookings?: number }

const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-s-ink-3 mb-3">{children}</p>
);

function Delta({ v }: { v?: number }) {
  if (v === undefined) return null;
  const up = v > 0, flat = v === 0;
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-[12px] font-semibold ml-2", up ? "text-s-success" : flat ? "text-s-ink-3" : "text-s-error")}>
      {up && <ArrowUpRight size={12} strokeWidth={2.4} />}
      {!up && !flat && <ArrowDownRight size={12} strokeWidth={2.4} />}
      {Math.abs(v)}%
    </span>
  );
}

function statusPill(status: string) {
  switch (status) {
    case "confirmed": return <DashStatusPill tone="success">Bestätigt</DashStatusPill>;
    case "pending": return <DashStatusPill tone="warning">Ausstehend</DashStatusPill>;
    case "cancelled": return <DashStatusPill tone="error">Storniert</DashStatusPill>;
    default: return <DashStatusPill tone="neutral">{status}</DashStatusPill>;
  }
}
const initials = (name: string) => {
  const p = name.trim().split(/\s+/);
  return ((p[0]?.[0] ?? "") + (p[1]?.[0] ?? "")).toUpperCase() || "—";
};
const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" });
const fmtChf = (n: number) => n.toLocaleString("de-CH");

export default function DashboardPage() {
  const locale = useLocale();
  const params = useSearchParams();
  const [bookings, setBookings] = useState<EnrichedBooking[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [staff, setStaff] = useState<StaffStat[]>([]);
  const [salonId, setSalonId] = useState<string | undefined>();
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [salonName, setSalonName] = useState<string | undefined>();
  const [salonCategories, setSalonCategories] = useState<string[] | undefined>();
  const [showCelebration, setShowCelebration] = useState(params.get("onboarded") === "1");

  useEffect(() => {
    if (showCelebration) {
      const timer = setTimeout(() => setShowCelebration(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [showCelebration]);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    fetch("/api/profile")
      .then((r) => r.json())
      .then((profile) => {
        setSalonName(profile?.salon_name);
        setSalonCategories(profile?.salon_categories);
        const sid = profile?.salon_id;
        setSalonId(sid);
        const todayBookings = fetch(`/api/bookings?date=${today}&limit=20`).then((r) => r.json());
        const analytics = sid ? fetch(`/api/analytics/salon/${sid}?period=week`).then((r) => r.json()) : Promise.resolve(null);
        const convos = sid ? fetch(`/api/conversations?salon_id=${sid}&unread=true`).then((r) => r.json()) : Promise.resolve(null);
        const staffStats = sid ? fetch(`/api/analytics/staff-comparison?salon_id=${sid}&period=month`).then((r) => r.json()) : Promise.resolve(null);
        return Promise.all([todayBookings, analytics, convos, staffStats]);
      })
      .then(([bData, analyticsData, convoData, staffData]) => {
        setBookings(bData?.bookings ?? []);
        if (analyticsData) setStats(analyticsData);
        if (staffData?.staff) setStaff(staffData.staff);
        if (convoData) {
          const convos: { unread_count_salon?: number }[] = convoData.conversations ?? convoData.data ?? [];
          setUnread(convos.reduce((sum, c) => sum + (c.unread_count_salon ?? 0), 0));
        }
      })
      .catch((err) => console.error("[Dashboard] Failed to fetch dashboard data:", err))
      .finally(() => setLoading(false));
  }, []);

  const today = new Date().toLocaleDateString("de-CH", { weekday: "long", day: "numeric", month: "long" });
  const prior = stats?.trends_vs_prior;
  const daily = stats?.daily ?? [];

  return (
    <DashboardLayout salonName={salonName} salonCategories={salonCategories} unreadCount={unread}>
      <AnimatePresence>
        {showCelebration && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}
            className="mb-6 rounded-card-lg bg-s-success-bg border border-s-success/20 px-5 py-4 flex items-center gap-3">
            <CheckCircle2 size={20} className="shrink-0 text-s-success" />
            <div>
              <p className="text-[15px] font-semibold text-s-ink">Willkommen bei Solen</p>
              <p className="text-[13px] text-s-ink-2 mt-0.5">Dein Salon ist live. Kund:innen können dich ab sofort buchen.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <SetupBanner />

      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-s-ink-3 mb-2">{today}</p>
          <h1 className="text-[26px] font-semibold tracking-[-0.015em] text-s-ink leading-none">Übersicht</h1>
        </div>
        <DashButton icon={Plus} href={`/${locale}/dashboard/calendar`}>Termin erstellen</DashButton>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
          {[...Array(2)].map((_, i) => <div key={i} className="rounded-card-lg border border-s-border bg-white h-56 animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-3.5">
          {/* Row 1 — charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
            <div className="rounded-card-lg border border-s-border bg-white p-5">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-s-ink">Umsatz</h2>
                <span className="text-[12px] text-s-ink-3">Diese Woche</span>
              </div>
              <p className="text-[30px] font-semibold tracking-[-0.02em] leading-none text-s-ink">
                <span className="text-[15px] font-semibold text-s-ink-2 mr-1">CHF</span>{fmtChf(Math.round(stats?.total_revenue ?? 0))}
                <Delta v={prior?.revenue} />
              </p>
              <div className="mt-4">
                <DashLineChart lines={[
                  { values: daily.map((d) => d.revenue), className: "stroke-s-accent-bright" },
                  { values: daily.map((d) => d.bookings), className: "stroke-s-success" },
                ]} />
              </div>
              <div className="flex gap-4 mt-2 text-[11.5px] text-s-ink-2">
                <span className="inline-flex items-center gap-1.5"><span className="w-3.5 h-[3px] rounded bg-s-accent-bright" />Umsatz</span>
                <span className="inline-flex items-center gap-1.5"><span className="w-3.5 h-[3px] rounded bg-s-success" />Termine</span>
              </div>
            </div>
            <div className="rounded-card-lg border border-s-border bg-white p-5">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-s-ink">Termine</h2>
                <span className="text-[12px] text-s-ink-3">Diese Woche</span>
              </div>
              <p className="text-[30px] font-semibold tracking-[-0.02em] leading-none text-s-ink">
                {stats?.total_bookings ?? 0}<span className="text-[15px] font-semibold text-s-ink-2 ml-1">gebucht</span>
                <Delta v={prior?.bookings} />
              </p>
              <div className="mt-4">
                <DashBarChart data={daily.map((d) => ({ primary: d.confirmed, secondary: d.cancelled }))} />
              </div>
              <div className="flex gap-4 mt-2 text-[11.5px] text-s-ink-2">
                <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-s-accent-bright" />Bestätigt</span>
                <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-s-error" />Storniert</span>
              </div>
            </div>
          </div>

          {/* Row 2 — activity + today */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
            {salonId && (
              <DashPanel title="Aktivität"><div className="p-4"><ActivityFeed salonId={salonId} /></div></DashPanel>
            )}
            <DashPanel title="Heute" actionLabel="Alle ansehen" actionHref={`/${locale}/dashboard/bookings`}>
              {bookings.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <Calendar size={26} className="mx-auto mb-3 text-s-ink-3" strokeWidth={1.6} />
                  <p className="text-[14px] text-s-ink-2">Keine Termine heute</p>
                </div>
              ) : (
                <div>
                  {bookings.slice(0, 6).map((b) => (
                    <DashRow key={b.id} href={`/${locale}/dashboard/bookings`}>
                      <span className="text-[14px] font-semibold tracking-[-0.01em] text-s-ink w-[52px] shrink-0">{fmtTime(b.starts_at)}</span>
                      <span className="grid place-items-center w-[30px] h-[30px] rounded-full bg-s-ink text-white text-[12px] font-semibold shrink-0">{initials(b.customer_name)}</span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-[15px] font-semibold tracking-[-0.005em] text-s-ink truncate">{b.customer_name}</span>
                        <span className="block text-[13px] text-s-ink-2 truncate">{b.service_name}</span>
                      </span>
                      {statusPill(b.status)}
                    </DashRow>
                  ))}
                </div>
              )}
            </DashPanel>
          </div>

          {/* Row 3 — top services + top team */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
            <DashPanel title="Top Services">
              {(stats?.popular_services?.length ?? 0) === 0 ? (
                <div className="px-5 py-10 text-center text-[14px] text-s-ink-2">Noch keine Daten</div>
              ) : (
                <div>
                  {stats!.popular_services!.map((s, i) => (
                    <DashRow key={s.id}>
                      <span className="text-[13px] font-semibold text-s-ink-3 w-5 shrink-0">{i + 1}</span>
                      <span className="flex-1 text-[15px] font-semibold tracking-[-0.005em] text-s-ink truncate">{s.name}</span>
                      <span className="text-[13px] text-s-ink-2">{s.count}× gebucht</span>
                    </DashRow>
                  ))}
                </div>
              )}
            </DashPanel>
            <DashPanel title="Top Mitarbeiter">
              {staff.length === 0 ? (
                <div className="px-5 py-10 text-center text-[14px] text-s-ink-2">Noch keine Daten</div>
              ) : (
                <div>
                  {staff.slice(0, 5).map((m) => (
                    <DashRow key={m.id}>
                      <span className="grid place-items-center w-[30px] h-[30px] rounded-full bg-s-ink text-white text-[12px] font-semibold shrink-0">{initials(m.name)}</span>
                      <span className="flex-1 text-[15px] font-semibold tracking-[-0.005em] text-s-ink truncate">{m.name}</span>
                      {m.revenue !== undefined && <span className="text-[13px] font-semibold text-s-ink">CHF {fmtChf(Math.round(m.revenue))}</span>}
                      {m.bookings !== undefined && <span className="text-[13px] text-s-ink-2 w-14 text-right">{m.bookings} Term.</span>}
                    </DashRow>
                  ))}
                </div>
              )}
            </DashPanel>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
