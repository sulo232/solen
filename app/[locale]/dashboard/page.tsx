"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Plus, Calendar, CheckCircle2, ArrowUpRight, ArrowDownRight } from "lucide-react";
import DashboardLayout from "@/components-legacy/dashboard/DashboardLayout";
import SetupBanner from "@/components-legacy/dashboard/SetupBanner";
import ActivityFeed from "@/components-legacy/dashboard/ActivityFeed";
import {
  DashPanel, DashStatusPill, DashRow, DashLineChart, DashBarChart,
} from "@/app/[locale]/_components/dashboard/DashboardUI";
import DashboardAdvicePanel from "@/app/[locale]/_components/dashboard/DashboardAdvice";
import { cn } from "@/lib/utils";
import { resolveSwissLocale } from "@/lib/format";
import { avGrad } from "@/lib/avatar-gradients";
import type { Booking } from "@/lib/types";
import type { DashboardAdvice } from "@/lib/dashboard-advice";

interface DailyPoint { date: string; bookings: number; revenue: number; confirmed: number; cancelled: number }
interface DashboardStats {
  total_bookings: number;
  total_revenue: number;
  new_customers: number;
  avg_rating: number;
  trends_vs_prior?: { bookings: number; revenue: number; new_customers: number; rating: number };
  daily?: DailyPoint[];
  popular_services?: { id: string; name: string; count: number }[];
  /** Only present because this page asks for it with &advice=1. */
  advice?: DashboardAdvice;
}
interface EnrichedBooking extends Booking { customer_name: string; service_name: string }
interface StaffStat { id: string; name: string; revenue?: number; bookings?: number }

// mockup-ok: hook-enforced no-caps compliance fix (CLAUDE.md rule 10), ported from reviewed commit 37e703762
const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[12px] font-semibold text-s-ink-2 mb-3">{children}</p>
);

// D4 fix (owner-approved 2026-07-15, fixes-refined): compareLabel turns the inline delta into a
// standalone comparison line under the KPI number ("+X% vs. letzte Woche"). Reuses the same
// trends_vs_prior value already computed server-side, no new data; still renders nothing when v
// is undefined (mockup-ok: no fabricated comparison when there is no prior-week data).
function Delta({ v, compareLabel, className }: { v?: number; compareLabel?: string; className?: string }) {
  if (v === undefined) return null;
  const up = v > 0, flat = v === 0;
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-[12px] font-semibold", up ? "text-s-success" : flat ? "text-s-ink-2" : "text-s-error", className)}>
      {up && <ArrowUpRight size={12} strokeWidth={2.4} />}
      {!up && !flat && <ArrowDownRight size={12} strokeWidth={2.4} />}
      {Math.abs(v)}%{compareLabel ? <span className="text-s-ink-2 font-medium ml-1">{compareLabel}</span> : null}
    </span>
  );
}

// Mobile-only stat tile (2×2 grid replaces the cramped desktop charts on small screens).
// Same data, glanceable. Delta sits below the value rather than inline.
function StatTile({ label, children, delta }: { label: string; children: React.ReactNode; delta?: number }) {
  const up = (delta ?? 0) > 0, flat = delta === 0;
  return (
    <div className="rounded-card-lg border border-s-border bg-white p-3.5">
      <p className="text-[12px] font-semibold text-s-ink-2 mb-2">{label}</p>
      <div className="text-[22px] font-semibold tracking-[-0.02em] leading-none text-s-ink flex items-baseline">{children}</div>
      {delta !== undefined && (
        <span className={cn("inline-flex items-center gap-0.5 text-[12px] font-semibold mt-2", up ? "text-s-success" : flat ? "text-s-ink-2" : "text-s-error")}>
          {up && <ArrowUpRight size={12} strokeWidth={2.4} />}
          {!up && !flat && <ArrowDownRight size={12} strokeWidth={2.4} />}
          {Math.abs(delta)}%
        </span>
      )}
    </div>
  );
}

function statusPill(status: string, t: ReturnType<typeof useTranslations<"dashboard.homePage">>) {
  switch (status) {
    case "confirmed": return <DashStatusPill tone="success">{t("statusConfirmed")}</DashStatusPill>;
    case "pending": return <DashStatusPill tone="warning">{t("statusPending")}</DashStatusPill>;
    case "cancelled": return <DashStatusPill tone="error">{t("statusCancelled")}</DashStatusPill>;
    default: return <DashStatusPill tone="neutral">{status}</DashStatusPill>;
  }
}
const initials = (name: string) => {
  const p = name.trim().split(/\s+/);
  return ((p[0]?.[0] ?? "") + (p[1]?.[0] ?? "")).toUpperCase() || "—";
};
// locale param added 2026-07-26 (de-CH literal sweep): both were hardcoded de-CH; default
// keeps prior behavior for any caller that still doesn't pass one.
const fmtTime = (iso: string, locale: string = "de") => new Date(iso).toLocaleTimeString(resolveSwissLocale(locale), { hour: "2-digit", minute: "2-digit" });
const fmtChf = (n: number, locale: string = "de") => n.toLocaleString(resolveSwissLocale(locale));

export default function DashboardPage() {
  const locale = useLocale();
  const t = useTranslations("dashboard.homePage");
  const params = useSearchParams() ?? new URLSearchParams();
  const [bookings, setBookings] = useState<EnrichedBooking[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [staff, setStaff] = useState<StaffStat[]>([]);
  const [salonId, setSalonId] = useState<string | undefined>();
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
        const todayBookings = sid ? fetch(`/api/bookings?salon_id=${sid}&date=${today}&limit=20`).then((r) => r.json()) : Promise.resolve(null);
        // advice=1 rides on the analytics call this page already makes, so the panel
        // costs no extra round trip from the browser.
        const analytics = sid ? fetch(`/api/analytics/salon/${sid}?period=week&advice=1`).then((r) => r.json()) : Promise.resolve(null);
        const convos = sid ? fetch(`/api/conversations?salon_id=${sid}&unread=true`).then((r) => r.json()) : Promise.resolve(null);
        const staffStats = sid ? fetch(`/api/analytics/staff-comparison?salon_id=${sid}&period=month`).then((r) => r.json()) : Promise.resolve(null);
        return Promise.all([todayBookings, analytics, convos, staffStats]);
      })
      .then(([bData, analyticsData, convoData, staffData]) => {
        setBookings(bData?.bookings ?? []);
        if (analyticsData) setStats(analyticsData);
        if (staffData?.staff) setStaff(staffData.staff);
      })
      .catch((err) => console.error("[Dashboard] Failed to fetch dashboard data:", err))
      .finally(() => setLoading(false));
  }, []);

  const today = new Date().toLocaleDateString(resolveSwissLocale(locale), { weekday: "long", day: "numeric", month: "long" });
  const prior = stats?.trends_vs_prior;
  const daily = stats?.daily ?? [];

  return (
    <DashboardLayout salonName={salonName} salonCategories={salonCategories}>
      <AnimatePresence>
        {showCelebration && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.28 }} /* mockup-ok: retime only, motion-ok: pre-existing entrance retimed to THE SPEED LAW reveal tier, not net-new */
            className="mb-6 rounded-card-lg bg-s-success-bg border border-s-success/20 px-5 py-4 flex items-center gap-3">
            <CheckCircle2 size={20} strokeWidth={2.2} className="shrink-0 text-s-success" />
            <div>
              <p className="text-[15px] font-semibold text-s-ink">{t("welcomeTitle")}</p>
              <p className="text-[13px] text-s-ink-2 mt-0.5">{t("welcomeBody")}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <SetupBanner />

      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          {/* mockup-ok: D2 fix, sentence case 13px semibold (approved public/_mockups/fixes-refined) */}
          <p className="text-[13px] font-semibold text-s-ink-2 mb-2">{today}</p>
          <h1 className="text-[26px] font-semibold tracking-[-0.015em] text-s-ink leading-none">{t("title")}</h1>
        </div>
        <Link
          href={`/${locale}/dashboard/calendar`}
          className="inline-flex items-center gap-2 shrink-0 whitespace-nowrap rounded-full bg-s-ink px-[18px] py-2.5 text-[15px] font-medium tracking-[-0.005em] text-white transition-[colors,transform] hover:bg-black active:scale-[0.97] active:duration-[80ms] active:ease-glide"
        >
          <Plus size={17} strokeWidth={1.9} />{t("createAppointment")}
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
          {/* mockup-ok: WCAG 2.2.2 conformance, page-load skeleton bounded (tailwind.config.js pulse-bounded) */}
          {[...Array(2)].map((_, i) => <div key={i} className="rounded-card-lg border border-s-border bg-white h-56 animate-pulse-bounded" />)}
        </div>
      ) : (
        <div className="space-y-3.5">
          {/* Mobile stat tiles — same data as the desktop charts, glanceable on small screens */}
          <div className="grid grid-cols-2 gap-2.5 lg:hidden">
            <StatTile label={t("revenue")} delta={prior?.revenue}>
              <span className="text-[13px] font-semibold text-s-ink-2 mr-1">CHF</span>{fmtChf(Math.round(stats?.total_revenue ?? 0), locale)}
            </StatTile>
            <StatTile label={t("bookings")} delta={prior?.bookings}>{stats?.total_bookings ?? 0}</StatTile>
            <StatTile label={t("newCustomers")} delta={prior?.new_customers}>{stats?.new_customers ?? 0}</StatTile>
            <StatTile label={t("rating")} delta={(stats?.avg_rating ?? 0) > 0 ? prior?.rating : undefined}>
              {(stats?.avg_rating ?? 0) > 0 ? (stats?.avg_rating ?? 0).toFixed(1) : "—"}
              <span className="text-s-star text-[17px] ml-0.5 leading-none">★</span>
            </StatTile>
          </div>

          {/* Mobile revenue mini-chart — reuses DashBarChart on the same stats.daily series (desktop keeps its own charts below) */}
          <div className="rounded-[16px] border border-s-border bg-white px-4 py-[15px] lg:hidden">
            <div className="flex items-end justify-between mb-3">
              <div>
                <p className="text-[14.5px] font-semibold tracking-[-0.01em] text-s-ink">{t("revenue")}</p>
                <p className="text-[12px] text-s-ink-2 mt-0.5">{t("last7Days")}</p>
              </div>
              <p className="text-[20px] font-semibold tabular-nums tracking-[-0.02em] leading-none text-s-ink">
                <span className="text-[13px] font-semibold text-s-ink-2 mr-1">CHF</span>{fmtChf(Math.round(stats?.total_revenue ?? 0), locale)}
              </p>
            </div>
            <DashBarChart height={90} data={daily.map((d) => ({ primary: d.revenue }))} primaryClassName="fill-s-accent-bright" />
            <div className="flex gap-3.5 mt-3">
              <span className="inline-flex items-center gap-1.5 text-[12px] text-s-ink-2"><span className="w-[9px] h-[9px] rounded-[3px] bg-s-accent-bright" />{t("revenue")}</span>
              <span className="inline-flex items-center gap-1.5 text-[12px] text-s-ink-2"><span className="w-[9px] h-[9px] rounded-[3px] bg-s-accent-pale" />{t("priorWeek")}</span>
            </div>
          </div>

          {/* mockup-ok: Row 1, charts (desktop only; mobile uses the tiles above).
              D4 fix (owner-approved 2026-07-15, fixes-refined): the two tiles were equal weight
              with nothing signalling the primary metric. Revenue now leads: lg:col-span-2 (wider
              tile), a bigger number, and a comparison line under each number instead of inline
              next to it (same trends_vs_prior data, no new fields; renders nothing when the prior
              value is undefined, per no-fabricated-data). */}
          <div className="hidden lg:grid lg:grid-cols-3 gap-3.5">
            <div className="rounded-card-lg border border-s-border bg-white p-5 lg:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-s-ink">{t("revenue")}</h2>
                <span className="text-[12px] text-s-ink-2">{t("thisWeek")}</span>
              </div>
              <p className="text-[34px] font-semibold tracking-[-0.02em] leading-none text-s-ink">
                <span className="text-[16px] font-semibold text-s-ink-2 mr-1">CHF</span>{fmtChf(Math.round(stats?.total_revenue ?? 0), locale)}
              </p>
              <Delta v={prior?.revenue} compareLabel={t("vsPriorWeek")} className="mt-1.5" />
              <div className="mt-4">
                <DashLineChart lines={[
                  { values: daily.map((d) => d.revenue), className: "stroke-s-accent-bright" },
                  { values: daily.map((d) => d.bookings), className: "stroke-s-success" },
                ]} />
              </div>
              <div className="flex gap-4 mt-2 text-[12px] text-s-ink-2">
                <span className="inline-flex items-center gap-1.5"><span className="w-3.5 h-[3px] rounded bg-s-accent-bright" />{t("revenue")}</span>
                <span className="inline-flex items-center gap-1.5"><span className="w-3.5 h-[3px] rounded bg-s-success" />{t("bookings")}</span>
              </div>
            </div>
            <div className="rounded-card-lg border border-s-border bg-white p-5 lg:col-span-1">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-[14px] font-semibold tracking-[-0.01em] text-s-ink-2">{t("bookings")}</h2>
                <span className="text-[12px] text-s-ink-2">{t("thisWeek")}</span>
              </div>
              <p className="text-[24px] font-semibold tracking-[-0.02em] leading-none text-s-ink">
                {stats?.total_bookings ?? 0}<span className="text-[13px] font-semibold text-s-ink-2 ml-1">{t("booked")}</span>
              </p>
              <Delta v={prior?.bookings} compareLabel={t("vsPriorWeek")} className="mt-1.5" />
              <div className="mt-4">
                <DashBarChart data={daily.map((d) => ({ primary: d.confirmed, secondary: d.cancelled }))} />
              </div>
              <div className="flex gap-4 mt-2 text-[12px] text-s-ink-2">
                <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-s-accent-bright" />{t("statusConfirmed")}</span>
                <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-s-error" />{t("statusCancelled")}</span>
              </div>
            </div>
          </div>

          {/* Row 2 — activity (desktop only) + today */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
            {salonId && (
              <div className="hidden lg:block"><DashPanel title={t("activity")}><div className="p-4"><ActivityFeed salonId={salonId} /></div></DashPanel></div>
            )}
            <DashPanel title={t("today")} actionLabel={t("viewAll")} actionHref={`/${locale}/dashboard/bookings`}>
              {bookings.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <Calendar size={26} className="mx-auto mb-3 text-s-ink-2" strokeWidth={1.6} />
                  <p className="text-[14px] text-s-ink-2">{t("noBookingsToday")}</p>
                </div>
              ) : (
                <div>
                  {bookings.slice(0, 6).map((b) => (
                    <DashRow key={b.id} href={`/${locale}/dashboard/bookings`}>
                      <span className="text-[14px] font-semibold tracking-[-0.01em] text-s-ink w-[52px] shrink-0">{fmtTime(b.starts_at, locale)}</span>
                      <span className={`grid place-items-center w-[30px] h-[30px] rounded-full bg-gradient-to-br ${avGrad(b.customer_name)} text-white text-[12px] font-semibold shrink-0`}>{initials(b.customer_name)}</span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-[15px] font-semibold tracking-[-0.005em] text-s-ink truncate">{b.customer_name}</span>
                        <span className="block text-[13px] text-s-ink-2 truncate">{b.service_name}</span>
                      </span>
                      {statusPill(b.status, t)}
                    </DashRow>
                  ))}
                </div>
              )}
            </DashPanel>
          </div>

          {/* Mobile activity feed — same component as the desktop one above (which is hidden lg:block) */}
          {salonId && (
            <div className="lg:hidden">
              <DashPanel title={t("activity")}><div className="p-4"><ActivityFeed salonId={salonId} /></div></DashPanel>
            </div>
          )}

          {/* Advice (owner decision 9, 2026-08-09). Sits below today's list, because it is a
              "then what" panel and not a "right now" one, and above the top-services and
              top-team ranks it gives a reason to act on. Renders only when the server
              actually returned the block; there is no client-side fallback advice. */}
          {stats?.advice && <DashboardAdvicePanel advice={stats.advice} />}

          {/* Row 3 — top services + top team */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
            <DashPanel title={t("topServices")} actionLabel={t("viewAll")} actionHref={`/${locale}/dashboard/services`}>
              {(stats?.popular_services?.length ?? 0) === 0 ? (
                <div className="px-5 py-10 text-center text-[14px] text-s-ink-2">{t("noData")}</div>
              ) : (
                <div>
                  {stats!.popular_services!.map((s, i) => (
                    <DashRow key={s.id}>
                      <span className="text-[13px] font-semibold text-s-ink-2 w-5 shrink-0">{i + 1}</span>
                      <span className="flex-1 text-[15px] font-semibold tracking-[-0.005em] text-s-ink truncate">{s.name}</span>
                      <span className="text-[13px] text-s-ink-2">{t("timesBooked", { n: s.count })}</span>
                    </DashRow>
                  ))}
                </div>
              )}
            </DashPanel>
            <DashPanel title={t("topStaff")} actionLabel={t("viewAll")} actionHref={`/${locale}/dashboard/staff`}>
              {staff.length === 0 ? (
                <div className="px-5 py-10 text-center text-[14px] text-s-ink-2">{t("noData")}</div>
              ) : (
                <div>
                  {staff.slice(0, 5).map((m) => (
                    <DashRow key={m.id}>
                      <span className={`grid place-items-center w-[30px] h-[30px] rounded-full bg-gradient-to-br ${avGrad(m.name)} text-white text-[12px] font-semibold shrink-0`}>{initials(m.name)}</span>
                      <span className="flex-1 text-[15px] font-semibold tracking-[-0.005em] text-s-ink truncate">{m.name}</span>
                      {m.revenue !== undefined && <span className="text-[13px] font-semibold text-s-ink">CHF {fmtChf(Math.round(m.revenue), locale)}</span>}
                      {m.bookings !== undefined && <span className="text-[13px] text-s-ink-2 w-14 text-right">{t("bookingsShort", { n: m.bookings })}</span>}
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
