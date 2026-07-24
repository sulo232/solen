"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Clock, Users } from "lucide-react";

/**
 * SalonWalkInStickyStatus — owner 2026-07-24 (round 2): a COMPACT, sticky live-status
 * bar. As the user scrolls past the full walk-in status card (browsing services / team),
 * this slim pill sticks just below the sticky tab-nav so the LIVE wait stays on screen and
 * updates as it changes. Own lightweight queue-stats poll (anyone-wait); this is a first
 * pass and is NOT yet synced to a barber the user picked in the main panel.
 * No em-dashes (owner rule); the numeric wait range uses an en-dash, which is allowed.
 */
const COPY: Record<string, { open: string; busy: string; closed: string; ahead: string; min: string; noWait: string }> = {
  de: { open: "Offen", busy: "Stark gefragt", closed: "Geschlossen", ahead: "vor dir", min: "Min", noWait: "Keine Wartezeit" },
  en: { open: "Open", busy: "In demand", closed: "Closed", ahead: "ahead", min: "min", noWait: "No wait" },
  fr: { open: "Ouvert", busy: "Forte affluence", closed: "Fermé", ahead: "devant vous", min: "min", noWait: "Pas d'attente" },
  it: { open: "Aperto", busy: "Molto richiesto", closed: "Chiuso", ahead: "prima di te", min: "min", noWait: "Nessuna attesa" },
};

export default function SalonWalkInStickyStatus({
  salonId,
  isOpen = true,
  locale,
}: {
  salonId: string;
  isOpen?: boolean;
  locale: string;
}) {
  const l = COPY[locale] ?? COPY.de;
  const [stats, setStats] = React.useState<{ ahead: number; wait_minutes: number; wait_low?: number; busy?: boolean } | null>(null);
  const [show, setShow] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    let cancelled = false;
    const load = () =>
      fetch(`/api/walkin/queue-stats?salon_id=${salonId}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => { if (!cancelled && d) setStats(d); })
        .catch(() => {});
    load();
    // Re-poll every 60s so the "live" wait actually moves while the bar is visible.
    const t = setInterval(load, 60_000);
    return () => { cancelled = true; clearInterval(t); };
  }, [salonId]);

  React.useEffect(() => {
    // Appears once scrolled past the full status card (roughly the toggle + card height on
    // mobile); the full card is the at-rest presentation, this is the scrolled-past echo.
    const onScroll = () => setShow(window.scrollY > 380);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!mounted) return null;

  const ahead = stats?.ahead ?? 0;
  const wait = stats?.wait_minutes ?? 0;
  const low = stats?.wait_low ?? 0;
  const busy = !!stats?.busy;
  const hasQueue = ahead > 0;
  const dot = !isOpen ? "#9CA3AF" : busy ? "#C2410C" : "#1F8900";
  const label = !isOpen ? l.closed : busy ? l.busy : l.open;
  const waitTxt = hasQueue ? `${low}–${wait} ${l.min}` : l.noWait;

  const bar = (
    <div
      className={`fixed inset-x-0 top-[104px] z-[59] flex justify-center px-4 transition-all duration-200 md:top-[56px] ${
        show ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-2 opacity-0"
      }`}
    >
      <div className="flex items-center gap-3 rounded-full border border-s-border bg-white/95 px-4 py-2 shadow-whisper backdrop-blur">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: dot }} />
          <span className="font-display text-[13px] font-semibold tracking-[-.01em]" style={{ color: dot }}>{label}</span>
        </span>
        {isOpen && (
          <>
            <span className="h-3 w-px bg-s-border" aria-hidden />
            <span className="inline-flex items-center gap-1.5 text-s-ink">
              <Clock className="h-3.5 w-3.5 text-s-ink-2" aria-hidden />
              <span className="font-display text-[13px] font-semibold tabular-nums tracking-[-.01em]">{waitTxt}</span>
            </span>
            {hasQueue && (
              <span className="inline-flex items-center gap-1 text-s-ink-2">
                <Users className="h-3.5 w-3.5" aria-hidden />
                <span className="font-body text-[12px] tabular-nums">{ahead} {l.ahead}</span>
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );

  return createPortal(bar, document.body);
}
