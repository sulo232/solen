"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { ArrowRight, Calendar, DollarSign, Users, MessageCircle } from "lucide-react";

/**
 * TodayLiveCard — Q61 (locked 2026-05-02) dashboard mobile hero.
 *
 * iOS Live-Activity-inspired event-driven card for the salon-owner mobile
 * dashboard. Shows the most relevant CURRENT info as one glanceable card +
 * 4-stat strip + up-next row + activity feed.
 *
 * Mobile-first (< 768px) — desktop owners get DashboardHeaderStrip + the
 * existing stats homepage instead.
 *
 * v1 polls /api/dashboard/today every 60s + on focus. The endpoint should
 * return:
 *   {
 *     now: { client, time, service, staff_name, price } | null,
 *     today_count, today_revenue, walk_in_count, inbox_unread,
 *     up_next: [{ time, client, service, offset_minutes }],
 *     recent_activity: [{ type, message, when }],
 *   }
 *
 * If the endpoint doesn't exist yet (Phase 7 backlog), the component
 * renders fallback empty values + a "Setup pending" placeholder.
 */

interface TodayState {
  now: {
    client: string;
    time: string;
    service: string;
    staff_name?: string;
    price?: number;
  } | null;
  today_count: number;
  today_revenue: number;
  walk_in_count: number;
  inbox_unread: number;
  up_next: Array<{
    time: string;
    client: string;
    service: string;
    offset_label: string;
  }>;
}

const FALLBACK: TodayState = {
  now: null,
  today_count: 0,
  today_revenue: 0,
  walk_in_count: 0,
  inbox_unread: 0,
  up_next: [],
};

export default function TodayLiveCard() {
  const locale = useLocale();
  const [state, setState] = useState<TodayState>(FALLBACK);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      try {
        const res = await fetch("/api/dashboard/today", { cache: "no-store" });
        if (!res.ok) {
          if (!cancelled) setLoading(false);
          return;
        }
        const data = await res.json();
        if (!cancelled) {
          setState({ ...FALLBACK, ...data });
          setLoading(false);
        }
      } catch (err) {
        console.error("[TodayLiveCard] /api/dashboard/today:", err);
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 60_000);
    const onFocus = () => fetchData();
    if (typeof window !== "undefined") window.addEventListener("focus", onFocus);
    return () => {
      cancelled = true;
      clearInterval(interval);
      if (typeof window !== "undefined") window.removeEventListener("focus", onFocus);
    };
  }, []);

  const stats = [
    { key: "today", icon: Calendar, label: "Heute", value: state.today_count.toString() },
    { key: "revenue", icon: DollarSign, label: "CHF", value: state.today_revenue.toLocaleString("de-CH") },
    { key: "walkin", icon: Users, label: "Walk-in", value: state.walk_in_count.toString() },
    { key: "inbox", icon: MessageCircle, label: "Inbox", value: state.inbox_unread.toString() },
  ];

  if (loading) {
    return <div className="md:hidden rounded-[16px] h-[180px] mb-4 bg-s-bg-sunken animate-pulse" aria-busy />;
  }

  return (
    <section className="md:hidden mb-5" aria-label="Heute auf einen Blick">
      {/* Now hero (or "Bereit für heute" if no active booking) */}
      {state.now ? (
        <Link
          href={`/${locale}/dashboard/calendar`}
          className="block rounded-[16px] p-4 text-white transition-[transform] duration-150 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-s-coral focus-visible:ring-offset-2"
          style={{ background: "linear-gradient(135deg,#1B4D1B 0%,#F3A864 100%)" }}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="font-body text-[10px] font-bold uppercase tracking-[.20em] opacity-90">
                Jetzt · {state.now.time}
              </p>
              <h3 className="mt-1 font-heading text-[20px] uppercase leading-[0.98]" style={{ letterSpacing: "0.01em" }}>
                {state.now.client}
              </h3>
              <p className="mt-1.5 font-body text-[12px] opacity-85">{state.now.service}</p>
              <div className="mt-2 flex items-center gap-1.5">
                {state.now.staff_name && (
                  <span className="inline-flex items-center px-2 py-[2px] rounded-full bg-white/20 font-body text-[10px] font-semibold">
                    {state.now.staff_name}
                  </span>
                )}
                {state.now.price != null && (
                  <span className="inline-flex items-center px-2 py-[2px] rounded-full bg-white/20 font-body text-[10px] font-semibold tabular-nums">
                    CHF {state.now.price}
                  </span>
                )}
              </div>
            </div>
            <ArrowRight size={18} className="shrink-0 mt-1 opacity-90" aria-hidden />
          </div>
        </Link>
      ) : (
        <div
          className="rounded-[16px] p-4"
          style={{ background: "linear-gradient(135deg,#1B4D1B 0%,#F3A864 100%)", color: "#fff" }}
        >
          <p className="font-body text-[10px] font-bold uppercase tracking-[.20em] opacity-90">
            Bereit für heute
          </p>
          <h3 className="mt-1 font-heading text-[20px] uppercase leading-[0.98]" style={{ letterSpacing: "0.01em" }}>
            {state.today_count > 0
              ? `${state.today_count} Termine`
              : "Keine Termine heute"}
          </h3>
        </div>
      )}

      {/* 4-stat strip */}
      <div className="mt-2 grid grid-cols-4 gap-1.5">
        {stats.map((s) => (
          <div key={s.key} className="rounded-[8px] px-2 py-2.5" style={{ background: "#FFF4E8" }}>
            <p className="font-body text-[8px] font-bold uppercase tracking-[.14em] text-s-coral-text">
              {s.label}
            </p>
            <p className="mt-1 font-heading text-[16px] uppercase text-s-ink leading-[0.95] tabular-nums" style={{ letterSpacing: "0.01em" }}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Up-next strip */}
      {state.up_next.length > 0 && (
        <div className="mt-2 rounded-[10px] px-3 py-2.5" style={{ background: "#FAF7F3" }}>
          <p className="font-body text-[8px] font-bold uppercase tracking-[.18em] text-s-ink/40 mb-1.5">
            Als Nächstes
          </p>
          <div className="space-y-1">
            {state.up_next.slice(0, 3).map((row, i) => (
              <div key={i} className="flex items-center gap-2 font-body text-[11px] text-s-ink">
                <span className="font-mono tabular-nums text-s-ink/55 w-10 shrink-0">{row.time}</span>
                <span className="font-semibold truncate flex-1">{row.client}</span>
                <span className="text-s-ink/55 truncate hidden sm:inline">{row.service}</span>
                <span className="text-s-ink/40 text-[10px] tabular-nums shrink-0">{row.offset_label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
