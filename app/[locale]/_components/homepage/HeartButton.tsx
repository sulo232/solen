"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { FROST_GLASS } from "@/lib/frost-glass";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import { toast } from "@/app/[locale]/_components/primitives/Toast";

/**
 * SalonCard heart toggle — V3 (LIVE_TRUTH §16.3.3).
 *
 * Floating SVG, NO circle background. Light photo bg → ink-3 stroke.
 * Dark photo bg (spa cat) → white 0.85 stroke (set via parent class).
 * Saved → love-red fill + soft love-red drop-shadow.
 *
 * Persistence (wired 2026-06-05) — only when a real `salonId` is passed:
 *   - logged-out: redirect to `/{locale}/auth/login?redirect={here}` so the
 *     save can complete after sign-in (matches the header login CTA pattern).
 *   - logged-in: optimistic toggle + `POST /api/favorites/toggle { salon_id }`,
 *     reverting the optimistic flip if the write fails. Reads/writes the same
 *     `favorites` table as /profile/favorites.
 * When NO `salonId` is passed (e.g. the Entdecken look-author heart) the control
 * stays local-state-only — there's nothing to persist.
 */
export function HeartButton({
  isSaved: initialSaved = false,
  salonName,
  className,
  salonId,
  lookId,
  onToggled,
  tone: _tone,
  size = 28,
  iconSize = 16,
  bare = false,
}: {
  isSaved?: boolean;
  salonName: string;
  className?: string;
  /** Salon UUID — enables `/api/favorites/toggle` persistence. Omit for non-salon hearts (local-only). */
  salonId?: string;
  /** Discovery-item UUID, enables `/api/discovery/save` persistence for a LOOK rather than a salon.
   *  Added 2026-08-16: the Popular looks rail composed this heart with neither id, so every tap
   *  flipped aria-pressed to true, fired no network call, and forgot the save on reload. A control
   *  that reports a state it never stored is a dead affordance, which this project bans by name,
   *  and it is worse than a missing control because the user believes the save happened.
   *  Optional and additive: every existing caller keeps its current behaviour untouched. */
  lookId?: string;
  /** Fires once the toggle has actually settled (after the optimistic flip and, when an id is
   *  passed, after the network write resolves), carrying the resulting saved state. Added
   *  2026-09-04: a parent list (e.g. /profile/favorites) needs to know the moment a card was
   *  un-saved so it can drop it from view, and the previous way to learn that without a callback
   *  was a MutationObserver scraping this component's own aria-pressed attribute back to a salon
   *  via a DOM data attribute on the card, fragile because it silently breaks the moment either
   *  attribute name changes. Optional and additive: every existing caller passes nothing and
   *  behaves exactly as before. */
  onToggled?: (isSaved: boolean) => void;
  /** Optional visual variant hint (e.g. "spa" / "warm") — currently unused; surfaced for caller compatibility. */
  tone?: string;
  /** Visible glass-circle size in px (default 28; salon hero uses 38, V3-D421). 44px hit area preserved. */
  size?: number;
  /** Heart glyph size in px (default 16). */
  iconSize?: number;
  /** Bare mode: drop the frosted-glass circle, render just the glyph. For controls sitting ON
   *  white chrome (e.g. the sticky tab nav) where the circle reads inconsistent next to a bare
   *  share icon. The default frosted circle stays for hearts floating OVER a photo. */
  bare?: boolean;
}) {
  const pathname = usePathname();
  const t = useTranslations("toasts");
  const [isSaved, setIsSaved] = React.useState(initialSaved);
  const [announcement, setAnnouncement] = React.useState("");
  // V2-D43 (Emil polish): spring-feel pop animation on save toggle.
  // popKey increments only when toggling FROM unsaved TO saved (not on unsave).
  // The key change re-mounts the SVG so the @keyframes heart-pop animation
  // restarts cleanly each time. Range 0.5 → 1.15 → 1.0 mimics Apple's spring.
  const [popKey, setPopKey] = React.useState(0);
  // Guard against double-submits / racing writes from rapid taps.
  const inFlight = React.useRef(false);

  // Keep local state in sync if the parent re-renders with a fresh saved value
  // (e.g. a section fetches the real favorite set after mount).
  React.useEffect(() => {
    setIsSaved(initialSaved);
  }, [initialSaved]);

  const persist = React.useCallback(
    async (next: boolean) => {
      // Neither id means there is genuinely nothing to write, and that stays local.
      if (!salonId && !lookId) return;
      if (inFlight.current) return;
      inFlight.current = true;

      const supabase = createBrowserSupabaseClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      // Logged-out → bounce to login, carrying the current path so the user lands
      // back here after auth. Revert the optimistic flip first (we never wrote).
      if (!session) {
        setIsSaved(!next);
        const locale = (pathname?.split("/")[1] || "de");
        const redirect = encodeURIComponent(pathname || `/${locale}`);
        window.location.href = `/${locale}/auth/login?redirect=${redirect}`;
        inFlight.current = false;
        return;
      }

      try {
        // A look and a salon are different objects with different endpoints. Both toggle and both
        // return the resulting state, so everything below this line is shape-identical.
        const res = salonId
          ? await fetch("/api/favorites/toggle", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ salon_id: salonId }),
            })
          : await fetch("/api/discovery/save", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ item_id: lookId }),
            });
        if (!res.ok) throw new Error(`toggle failed: ${res.status}`);
        const json: { saved?: boolean } = await res.json();
        // Reconcile with the server's authoritative state (handles the rare
        // case where optimistic + server disagree, e.g. a stale initialSaved).
        const finalSaved = typeof json.saved === "boolean" ? json.saved : next;
        if (typeof json.saved === "boolean" && json.saved !== next) {
          setIsSaved(json.saved);
        }
        onToggled?.(finalSaved);
        // Mobile-first confirmation: only on SAVE (not un-save). Whole toast is
        // tappable -> opens favorites. Pink-heart badge — mirrors the heart the
        // user just tapped (#FF3366 save color) instead of a generic green check.
        if (next && finalSaved) {
          const locale = pathname?.split("/")[1] || "de";
          toast.success(t("savedToFavorites"), {
            icon: Heart,
            iconClassName: "bg-s-love-soft text-[#FF3366]",
            action: {
              label: t("view"),
              onClick: () => {
                window.location.href = `/${locale}/profile/favorites`;
              },
            },
          });
        }
      } catch (err) {
        console.error("[HeartButton] favorite toggle failed:", err);
        // Revert the optimistic flip so the UI reflects reality.
        setIsSaved(!next);
        // 2026-08-16: was a hardcoded German literal, so /en, /fr and /it announced the failure in
        // German with the English name interpolated into it. Same defect class the owner reported
        // on the recently-viewed row on 2026-08-15.
        setAnnouncement(t("saveFailedItem", { name: salonName }));
        // Surface the failure (was silent) with a retry.
        toast.error(t("saveFailed"), {
          action: { label: t("retry"), onClick: () => void persist(next) },
        });
      } finally {
        inFlight.current = false;
      }
    },
    [salonId, lookId, pathname, salonName, t, onToggled],
  );

  const toggle = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = !isSaved;
    setIsSaved(next); // optimistic
    if (next) setPopKey((k) => k + 1);
    // 2026-08-16: these two were hardcoded German. Measured on the rendered /en homepage before the
    // fix, the live region read "Sleek Blunt Bob with Golden Ombre and Middle Part gespeichert".
    setAnnouncement(
      next
        ? t("savedItem", { name: salonName })
        : t("removedItem", { name: salonName }),
    );
    void persist(next);
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
      {/* V3-D73 (2026-05-18): touch target expansion per advanced-UI doc.
          Button hit area is 44×44 (WCAG + ergonomic minimum); the VISIBLE glass
          circle is 28×28 (V3-D354: shrunk from 32 - on the narrow ~157px homepage
          carousel cards the 32px disc read too big and landed on the subject's
          face). Outer button is transparent + larger; inner div carries all the
          glass styling. Hover/focus/active scale the inner glass, not the outer
          button (so the larger hit zone doesn't visually pulse). */}
      <button
        type="button"
        onClick={toggle}
        // 2026-08-16: was hardcoded German. Measured on the rendered /fr homepage, eight buttons
        // under the heading "Looks populaires" all announced themselves as "Speichern".
        aria-label={isSaved ? t("saved") : t("save")}
        aria-pressed={isSaved}
        className={cn(
          "group absolute right-[2px] top-[2px] grid h-11 w-11 place-items-center bg-transparent p-0",
          "focus-visible:outline-2 focus-visible:outline-s-ink focus-visible:outline-offset-2",
          "focus-visible:rounded-full",
          className,
        )}
      >
        <span
          aria-hidden
          // V2-D60-cards / V3-D72 / V3-D420: frosted-glass circle wrapper around
          // heart. Recipe now sourced from the shared FROST_GLASS util (was
          // re-derived inline) — 80% white + 4px backdrop blur + 1px white border.
          style={bare ? { height: size, width: size } : { ...FROST_GLASS, height: size, width: size }}
          className={cn(
            "relative grid place-items-center rounded-full",
            "transition-transform duration-200 ease-glide",
            "group-hover:scale-110 group-active:scale-[0.97] group-active:duration-[80ms]",
          )}
        >
          <Heart
            // V2-D43: key re-mounts SVG on each save → CSS animation restarts.
            key={popKey}
            size={iconSize}
            // 2026-08-19: was 2.25. The heart is only SOLID when saved; unsaved it is a
            // stroke, and at 16px his approved table (lib/icon-stroke.ts, 2026-07-16) says
            // 1.9. The sweep skipped it because of the conditional fill, so it is set here
            // by hand. Saved state is unaffected: fill wins and the stroke is not drawn.
            strokeWidth={1.9}
            // V3-D103 (2026-05-23): heart fill aligned with universal semantic
            // --heart-active #FF3366 per brand spec. Was held over at V2 muted
            // #CC4A60 from the old warm-reduction era — should have swapped at
            // the V3-D88 universal-semantics lock. SAVED = solid pink fill, no
            // stroke. UNSAVED = ink stroke.
            fill={isSaved ? "#FF3366" : "none"}
            stroke={isSaved ? "none" : "var(--color-heading)"}
            className={isSaved && popKey > 0 ? "animate-heart-pop" : undefined}
            aria-hidden
          />
          {/* Idea 2 (motion sheet 22): 6-particle burst on save — keyed so it replays */}
          {isSaved && popKey > 0 && (
            <span key={`burst-${popKey}`} aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center">
              <span className="heart-burst" /><span className="heart-burst" /><span className="heart-burst" />
              <span className="heart-burst" /><span className="heart-burst" /><span className="heart-burst" />
            </span>
          )}
        </span>
      </button>
      {/* Screen-reader live region for save toggle announcement */}
      <span className="sr-only" aria-live="polite">
        {announcement}
      </span>
    </>
  );
}
