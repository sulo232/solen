"use client";

import { useEffect, useState } from "react";

/**
 * DashboardHeaderStrip — Q61 (locked 2026-05-02) sticky stats strip for desktop.
 *
 * Renders only on desktop (≥ md breakpoint). Pinned at the top of the
 * dashboard content area, just below the page chrome. Carries:
 *   - Gradient "Now" pill (coral-amber): current/next booking client + time
 *   - 4 stat pills (white bg + coral eyebrow + Anton tabular value):
 *     Heute count · CHF revenue · Walk-in queue · ★ avg rating
 *
 * Mirrors TodayLiveCard data via the same /api/dashboard/today endpoint
 * but compresses to a single horizontal row for the desktop register
 * (where space is plentiful and owner is multi-tasking with hands on
 * the calendar grid).
 *
 * Hidden on mobile (< md) — TodayLiveCard handles that surface.
 */
interface TodayState {
  now: { client: string; time: string } | null;
  today_count: number;
  today_revenue: number;
  walk_in_count: number;
  avg_rating: number;
}

const FALLBACK: TodayState = {
  now: null,
  today_count: 0,
  today_revenue: 0,
  walk_in_count: 0,
  avg_rating: 0,
};

export default function DashboardHeaderStrip() {
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
        console.error("[DashboardHeaderStrip] /api/dashboard/today:", err);
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

  if (loading) {
    return <div className="hidden md:flex h-[58px] mb-5 rounded-[10px] bg-s-bg-sunken animate-pulse" aria-busy />;
  }

  return (
    <div
      className="hidden md:flex items-center gap-2 px-3 py-2 mb-5 rounded-[10px] border border-s-amber/30"
      style={{ background: "#FFF4E8" }}
      aria-label="Heute auf einen Blick"
    >
      {/* Gradient "Now" pill */}
      <div
        className="flex items-center gap-2 px-3 py-1.5 rounded-[8px] text-white shrink-0"
        style={{ background: "linear-gradient(135deg,#1B4D1B 0%,#F3A864 100%)" }}
      >
        <span className="font-body text-[8px] font-bold uppercase tracking-[.18em] opacity-95">
          Jetzt
        </span>
        {state.now ? (
          <>
            <span className="font-heading text-[12px] uppercase leading-none" style={{ letterSpacing: "0.01em" }}>
              {state.now.client}
            </span>
            <span className="font-body text-[10px] opacity-90 tabular-nums">·  {state.now.time}</span>
          </>
        ) : (
          <span className="font-heading text-[11px] uppercase opacity-90">Frei</span>
        )}
      </div>

      {/* Stat pills */}
      <div className="flex items-center gap-1.5 ml-auto">
        <StatPill label="Heute" value={state.today_count.toString()} />
        <StatPill label="CHF" value={state.today_revenue.toLocaleString("de-CH")} />
        <StatPill label="Walk-in" value={state.walk_in_count.toString()} />
        <StatPill label="★" value={state.avg_rating > 0 ? state.avg_rating.toFixed(1) : "–"} />
      </div>
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-1.5 px-2.5 py-1.5 rounded-[6px] bg-white">
      <span className="font-body text-[8px] font-bold uppercase tracking-[.14em] text-s-coral-text">{label}</span>
      <span className="font-heading text-[13px] uppercase text-s-ink leading-none tabular-nums" style={{ letterSpacing: "0.01em" }}>
        {value}
      </span>
    </div>
  );
}
