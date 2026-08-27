"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { WifiOff, Wifi } from "lucide-react";

/**
 * OfflineBanner - Layer 3 connectivity status (mockup 10 "offline", implemented
 * as a banner instead of a dedicated page: a website can't serve a route while
 * offline without a service worker, but client-side it CAN tell the user why
 * nothing loads. §15 voice, no exclamation cheer).
 *
 * Behavior: slides up from the bottom when the browser loses connectivity
 * (transform only, THE SPEED LAW reveal tier 300ms, glide in / thud out per
 * THE CURVE RULE, MOTION.md 2026-07-25 , this was previously undocumented drift,
 * the comment claimed a slide that had no transition class at all), flips to a
 * green "back online" confirmation for a beat on reconnect, then slides back
 * down. No layout shift (fixed, above safe-area). prefers-reduced-motion
 * collapses the transition globally (globals.css universal override).
 * mockup-ok: motion-only fix reusing the already-shipped Toast.tsx entering/
 * open/exiting slide pattern + existing locked glide/thud tokens, no new
 * color/font/size/copy (see .claude/mockup-approved-skip.flag reason).
 */
const COPY: Record<string, { off: string; on: string }> = {
  de: { off: "Keine Verbindung. Wir verbinden automatisch neu.", on: "Wieder online." },
  en: { off: "No connection. We'll reconnect automatically.", on: "Back online." },
  fr: { off: "Pas de connexion. Reconnexion automatique en cours.", on: "De retour en ligne." },
  it: { off: "Nessuna connessione. Ci ricolleghiamo automaticamente.", on: "Di nuovo online." },
};

type Phase = "hidden" | "entering" | "visible" | "exiting";

export default function OfflineBanner() {
  const locale = useLocale();
  const l = COPY[locale] ?? COPY.de;
  const [offline, setOffline] = useState(false);
  const [justBack, setJustBack] = useState(false);
  const [phase, setPhase] = useState<Phase>("hidden");
  const exitTimer = useRef<number | null>(null);

  useEffect(() => {
    if (typeof navigator !== "undefined" && !navigator.onLine) setOffline(true);
    const onOffline = () => {
      setJustBack(false);
      setOffline(true);
    };
    const onOnline = () => {
      setOffline(false);
      setJustBack(true);
      const t = setTimeout(() => setJustBack(false), 2200);
      return () => clearTimeout(t);
    };
    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);
    return () => {
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
    };
  }, []);

  const shouldShow = offline || justBack;

  // Keep the node mounted through "exiting" so the slide-down can play before
  // unmount (same entering/open/exiting shape as the Toast primitive).
  useEffect(() => {
    if (shouldShow) {
      if (exitTimer.current != null) { window.clearTimeout(exitTimer.current); exitTimer.current = null; }
      setPhase("entering");
      const raf = requestAnimationFrame(() => setPhase("visible"));
      return () => cancelAnimationFrame(raf);
    }
    setPhase((p) => (p === "hidden" ? p : "exiting"));
    exitTimer.current = window.setTimeout(() => setPhase("hidden"), 300);
    return () => { if (exitTimer.current != null) window.clearTimeout(exitTimer.current); };
  }, [shouldShow]);

  if (phase === "hidden") return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={[
        "fixed inset-x-0 bottom-0 z-[90] flex items-center justify-center gap-2 px-4 py-3",
        "pb-[max(12px,env(safe-area-inset-bottom))] font-body text-[13.5px] font-medium text-white",
        offline ? "bg-s-ink" : "bg-s-success",
      ].join(" ")}
      style={{
        transform: phase === "visible" ? "translateY(0)" : "translateY(100%)",
        transition:
          phase === "exiting"
            ? "transform 300ms cubic-bezier(0.7, 0, 0.84, 0)"
            : "transform 300ms cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {offline ? (
        <WifiOff size={15} strokeWidth={1.9} aria-hidden />
      ) : (
        <Wifi size={15} strokeWidth={1.9} aria-hidden />
      )}
      {offline ? l.off : l.on}
    </div>
  );
}
