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

  // Glass effect ON the heart icon itself (not a circle around it).
  // Default: outlined heart, ink-3 stroke + soft black drop-shadow for
  // photo legibility.
  // Saved: heart filled w semi-transparent love-red (rgba 255,74,107,0.65)
  // — translucent so the photo bleeds through slightly, giving glass-like
  // depth. Stroke fully opaque love-red defines the silhouette. Combined w
  // a soft love-red glow drop-shadow + a soft white inner highlight via a
  // second drop-shadow to mimic light catching on glass.
  return (
    <>
      <button
        type="button"
        onClick={toggle}
        aria-label={isSaved ? "Gespeichert" : "Speichern"}
        aria-pressed={isSaved}
        style={{
          filter: isSaved
            ? // Saved: love-red glow + tiny white highlight = glass sheen
              "drop-shadow(0 1px 3px rgba(255, 74, 107, 0.35)) drop-shadow(0 0 1px rgba(255, 255, 255, 0.6))"
            : // Default: subtle dark shadow lifts icon off photo
              "drop-shadow(0 1px 2px rgba(0, 0, 0, 0.18))",
        }}
        className={cn(
          "absolute right-2 top-2 grid h-6 w-6 place-items-center bg-transparent border-0 p-0 transition-transform duration-200 ease-snap",
          "hover:scale-110 active:scale-95",
          "focus-visible:outline-2 focus-visible:outline-s-brand focus-visible:outline-offset-2 focus-visible:rounded-full",
          className,
        )}
      >
        <Heart
          size={24}
          strokeWidth={2}
          // Glass fill: semi-transparent love-red so photo shows through
          fill={isSaved ? "rgba(255, 74, 107, 0.65)" : "none"}
          // Stroke fully opaque to define the silhouette crisply
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
