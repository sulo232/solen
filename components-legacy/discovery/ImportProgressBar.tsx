"use client";

// mockup-ok: ig12, owner-approved TASTE_LOG.md 2026-07-16 "IG-principles round 1".
import { useEffect, useRef, useState } from "react";

interface ImportProgressBarProps {
  current: number;
  total: number;
  label?: string;
}

// ig12 (2026-07-16): a determinate bar that only moves on API-page boundaries reads as
// "almost done" during a stall between pages, not as stuck. This adds an independent
// activity signal (a shimmer over the filled portion) that STOPS the moment `current`
// hasn't advanced for a few seconds, so a stall is visible instead of looking healthy.
const STALL_TIMEOUT_MS = 2500;

export default function ImportProgressBar({ current, total, label }: ImportProgressBarProps) {
  const percent = total > 0 ? Math.round((current / total) * 100) : 0;
  const [active, setActive] = useState(false);
  const stallTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (current <= 0 || percent >= 100) {
      setActive(false);
      return;
    }
    setActive(true);
    if (stallTimer.current) clearTimeout(stallTimer.current);
    stallTimer.current = setTimeout(() => setActive(false), STALL_TIMEOUT_MS);
    return () => {
      if (stallTimer.current) clearTimeout(stallTimer.current);
    };
  }, [current, percent]);

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-s-ink-2">{label}</span>
          <span className="font-medium text-s-ink tabular-nums">{current}/{total}</span>
        </div>
      )}
      <div className="w-full h-2 bg-s-ink/5 rounded-pill overflow-hidden">
        <div
          className="relative h-full bg-s-ink rounded-pill transition-[width] duration-200 overflow-hidden"
          style={{ width: `${percent}%` }}
        >
          {active && (
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/35 to-transparent bg-[length:200%_100%] animate-shimmer"
            />
          )}
        </div>
      </div>
    </div>
  );
}
