"use client";

import * as React from "react";

/**
 * WalkInQueueProvider — ONE source of truth for the walk-in queue (owner 2026-07-24).
 * Holds the selected barber + the live queue-stats poll, so the at-rest status bar
 * (SalonWalkInPanel) and the scrolled sticky bar (SalonWalkInStickyStatus) always show
 * the SAME numbers. Previously each fetched queue-stats on its own and could disagree.
 * Picking a barber refetches THAT barber's line; the sticky bar reflects it too.
 */
type WalkInStats = { ahead: number; wait_minutes: number; wait_low?: number; busy?: boolean } | null;

type WalkInQueueValue = {
  barberId: string | null;
  setBarberId: (id: string | null) => void;
  stats: WalkInStats;
};

const WalkInQueueContext = React.createContext<WalkInQueueValue | null>(null);

export function WalkInQueueProvider({ salonId, children }: { salonId: string; children: React.ReactNode }) {
  const [barberId, setBarberId] = React.useState<string | null>(null); // null = "Egal"
  const [stats, setStats] = React.useState<WalkInStats>(null);

  React.useEffect(() => {
    let cancelled = false;
    const load = () =>
      fetch(`/api/walkin/queue-stats?salon_id=${salonId}${barberId ? `&staff_id=${barberId}` : ""}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => { if (!cancelled && d) setStats(d); })
        .catch((e) => console.error("[WalkInQueueProvider] queue-stats failed:", e));
    load();
    // Re-poll so the "live" wait actually moves while the user is on the page.
    const t = setInterval(load, 60_000);
    return () => { cancelled = true; clearInterval(t); };
  }, [salonId, barberId]);

  const value = React.useMemo(() => ({ barberId, setBarberId, stats }), [barberId, stats]);
  return <WalkInQueueContext.Provider value={value}>{children}</WalkInQueueContext.Provider>;
}

export function useWalkInQueue(): WalkInQueueValue {
  const ctx = React.useContext(WalkInQueueContext);
  if (!ctx) throw new Error("useWalkInQueue must be used within a WalkInQueueProvider");
  return ctx;
}
