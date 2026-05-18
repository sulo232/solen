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
  salonId: _salonId,
  tone: _tone,
}: {
  isSaved?: boolean;
  salonName: string;
  className?: string;
  /** Reserved for future `/api/favorites/toggle` wiring (V2-D52 Tier 1 #15). */
  salonId?: string;
  /** Optional visual variant hint (e.g. "spa" / "warm") — currently unused; surfaced for caller compatibility. */
  tone?: string;
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
          // V2-D60-cards (2026-05-14): frosted-glass CIRCLE wrapper around the heart.
          // V2-D71 (2026-05-18): white alpha bumped 0.45 → 0.70 per user spec
          // "make the white slightly transparent (e.g., 70% opacity)". More
          // visible glass surface — reads as a deliberate element on ANY photo
          // background, not just a soft veil.
          background: "rgba(255, 255, 255, 0.70)",
          backdropFilter: "blur(12px) saturate(1.4)",
          WebkitBackdropFilter: "blur(12px) saturate(1.4)",
          border: "1px solid rgba(255, 255, 255, 0.6)",
          boxShadow:
            "0 1px 3px rgba(0, 0, 0, 0.10), inset 0 1px 0 rgba(255, 255, 255, 0.4)",
        }}
        className={cn(
          "absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full p-0",
          "transition-transform duration-200 ease-glide",
          "hover:scale-110 active:scale-[0.97] active:duration-[80ms]",
          "focus-visible:outline-2 focus-visible:outline-s-brand focus-visible:outline-offset-2",
          className,
        )}
      >
        <Heart
          // V2-D43: key re-mounts SVG on each save → CSS animation restarts.
          key={popKey}
          size={18}
          strokeWidth={2.25}
          // V2-D60-heart: SAVED = solid red fill, no stroke. UNSAVED = ink stroke
          // (no white outline needed — glass circle wrapper handles photo-contrast).
          fill={isSaved ? "#FF4A6B" : "none"}
          stroke={isSaved ? "none" : "var(--color-heading)"}
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
