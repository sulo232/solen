"use client";

import * as React from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * SalonCard heart toggle — V3 (LIVE_TRUTH §16.3.3).
 *
 * Floating SVG, NO circle background. Light photo bg → ink-3 stroke.
 * Dark photo bg (spa cat) → white 0.85 stroke (set via parent class).
 * Saved → love-red fill + soft love-red drop-shadow.
 *
 * Backend wiring deferred — for now, local state only. Phase 1 wires:
 *   - logged-in: optimistic UI + mutate `/api/favorites/toggle`
 *   - logged-out: open Login modal w copy `Speichere deine Lieblings-Salons.
 *     Melde dich an oder erstelle ein Konto.` (LIVE_TRUTH §A.1)
 */
export function HeartButton({
  isSaved: initialSaved = false,
  salonName,
  className,
}: {
  isSaved?: boolean;
  salonName: string;
  className?: string;
}) {
  const [isSaved, setIsSaved] = React.useState(initialSaved);
  const [announcement, setAnnouncement] = React.useState("");

  const toggle = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = !isSaved;
    setIsSaved(next);
    setAnnouncement(
      next ? `${salonName} gespeichert` : `${salonName} entfernt`,
    );
    // TODO: backend mutate via /api/favorites/toggle
  };

  // §16.3.0 universal glass formula applied to heart slot.
  // Default: white-neutral variant (clean white tint, fits any photo bg).
  // Saved: love-red applied through formula (rgba 255,74,107 at 0.22 / 0.32).
  // SPEC NOTE: V2-D34 §16.3.3 currently says NO circle bg. This is a spec
  // refinement (glass != solid) that needs §16.3.3 + §16.3.4 update + V2-D##
  // log entry once user signs off on the visual.
  const glassStyle = isSaved
    ? {
        background: "rgba(255, 74, 107, 0.22)",
        border: "1px solid rgba(255, 74, 107, 0.32)",
        backdropFilter: "blur(14px) saturate(1)",
        WebkitBackdropFilter: "blur(14px) saturate(1)",
        boxShadow: "0 1px 3px rgba(255, 74, 107, 0.12)",
      }
    : {
        background: "rgba(255, 255, 255, 0.55)",
        border: "1px solid rgba(255, 255, 255, 0.45)",
        backdropFilter: "blur(14px) saturate(1)",
        WebkitBackdropFilter: "blur(14px) saturate(1)",
        boxShadow: "0 1px 3px rgba(26, 18, 9, 0.06)",
      };

  return (
    <>
      <button
        type="button"
        onClick={toggle}
        aria-label={isSaved ? "Gespeichert" : "Speichern"}
        aria-pressed={isSaved}
        style={glassStyle}
        className={cn(
          "absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full p-0 transition-transform duration-200 ease-snap",
          "hover:scale-110 active:scale-95",
          "focus-visible:outline-2 focus-visible:outline-s-brand focus-visible:outline-offset-2",
          className,
        )}
      >
        <Heart
          size={16}
          strokeWidth={2}
          fill={isSaved ? "#FF4A6B" : "none"}
          stroke={isSaved ? "#FF4A6B" : "#7A6957"}
          aria-hidden
        />
      </button>
      {/* Screen-reader live region for save toggle announcement */}
      <span className="sr-only" aria-live="polite">
        {announcement}
      </span>
    </>
  );
}
