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

  return (
    <>
      <button
        type="button"
        onClick={toggle}
        aria-label={isSaved ? "Gespeichert" : "Speichern"}
        aria-pressed={isSaved}
        className={cn(
          "absolute right-2 top-2 grid h-6 w-6 place-items-center bg-transparent p-0 text-s-ink-3 transition-transform duration-200 ease-snap",
          "hover:scale-110",
          "focus-visible:outline-2 focus-visible:outline-s-brand focus-visible:outline-offset-2 focus-visible:rounded-full",
          isSaved && "text-[#FF4A6B]",
          className,
        )}
        style={{
          filter: isSaved
            ? "drop-shadow(0 1px 2px rgba(255, 74, 107, 0.20))"
            : "drop-shadow(0 1px 2px rgba(0, 0, 0, 0.18))",
        }}
      >
        <Heart
          size={24}
          strokeWidth={2}
          fill={isSaved ? "currentColor" : "none"}
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
