"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";

interface SolenExclusiveBadgeProps {
  featureDescription: string;
  variant?: "inline" | "floating";
}

/**
 * "Nur bei Solen" feature badge.
 *
 * V3-D328 (Section A, 2026-05-27): full rewrite. Previous version used
 * `bg-gradient-to-r 0/20
 * ` — NONE of those numbered s-coral shades exist in
 * `tailwind.config.js`. All 4 classes silently dropped, leaving the inner
 * badge as inherited (black) text with no background — causing the
 * "blue pill but black text the contrast is too much" complaint when this
 * sat inside a `bg-s-accent-pale` parent pill.
 *
 * V3-D330 (Phase 2 sweep, 2026-05-28): updated for §1.5 Accent Application
 * Rules — decorative text-s-accent is now forbidden. Badge text + Sparkles
 * icon → text-s-ink-2 grey. The badge is semantically a Tag/Status role
 * ("this feature is Solen-exclusive") — color identity comes from the icon
 * shape (sparkles = special) + uppercase tracking, not from blue hue.
 * Tracking 0.08em is canonical (§2.5).
 */
export default function SolenExclusiveBadge({
  featureDescription,
  variant = "inline",
}: SolenExclusiveBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <span
      className={`relative ${variant === "floating" ? "absolute z-10" : "inline-flex"}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={() => setShowTooltip((v) => !v)}
    >
      <span className="inline-flex items-center gap-1 text-[12px] font-semibold uppercase tracking-[0.08em] text-s-ink-2 cursor-help whitespace-nowrap">
        <Sparkles size={10} aria-hidden />
        Nur bei Solen
      </span>
      {showTooltip && (
        <span className="absolute z-10 bg-s-ink text-white text-xs px-3 py-2 rounded-btn shadow-elevation-2 max-w-[200px] -top-10 left-1/2 -translate-x-1/2 pointer-events-none">
          {featureDescription}
          <span className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-s-ink" />
        </span>
      )}
    </span>
  );
}
