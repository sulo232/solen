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
  // V2-D43 (Emil polish): spring-feel pop animation on save toggle.
  // popKey increments only when toggling FROM unsaved TO saved (not on unsave).
  // The key change re-mounts the SVG so the @keyframes heart-pop animation
  // restarts cleanly each time. Range 0.5 → 1.15 → 1.0 mimics Apple's spring.
  const [popKey, setPopKey] = React.useState(0);

  const toggle = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = !isSaved;
    setIsSaved(next);
    if (next) setPopKey((k) => k + 1);
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
          // V2-D48-4: glass effect ON the heart ITSELF (no surrounding circle).
          // Dual drop-shadow: dark for lift off photo + white sliver for glass sheen.
          // Saved adds love-red glow; unsaved is ink-defined.
          filter: isSaved
            ? "drop-shadow(0 2px 6px rgba(255, 74, 107, 0.40)) drop-shadow(0 0 1px rgba(255, 255, 255, 0.7))"
            : "drop-shadow(0 1px 3px rgba(42, 31, 24, 0.25)) drop-shadow(0 0 1px rgba(255, 255, 255, 0.5))",
        }}
        className={cn(
          "absolute right-2 top-2 grid h-6 w-6 place-items-center bg-transparent border-0 p-0",
          // V2-D43 motion polish — kept
          "transition-transform duration-200 ease-glide",
          "hover:scale-110 active:scale-[0.97] active:duration-[80ms]",
          "focus-visible:outline-2 focus-visible:outline-s-brand focus-visible:outline-offset-2 focus-visible:rounded-full",
          className,
        )}
      >
        <Heart
          // V2-D43: key re-mounts SVG on each save → CSS animation restarts.
          key={popKey}
          size={24}
          strokeWidth={2.25}
          // V2-D49e: outline-only unsaved state — fill removed entirely so
          // the photo bleeds through the heart shape with NO inner film.
          // Saved keeps translucent love-red fill (universal "saved" signal).
          fill={isSaved ? "rgba(255, 74, 107, 0.65)" : "none"}
          // V2-D49e: glassmorphic outline — translucent white stroke at 0.9
          // opacity. Reads on dark photos directly + on light photos via the
          // dual drop-shadow filter (dark halo) on the parent button.
          // Saved keeps opaque love-red stroke for contrast.
          stroke={isSaved ? "#FF4A6B" : "rgba(255, 255, 255, 0.9)"}
          // V2-D43: spring-feel pop on save (not on unsave).
          className={isSaved && popKey > 0 ? "animate-heart-pop" : undefined}
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
