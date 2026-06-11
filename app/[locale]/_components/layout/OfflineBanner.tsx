"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { WifiOff, Wifi } from "lucide-react";

/**
 * OfflineBanner — Layer 3 connectivity status (mockup 10 "offline", implemented
 * as a banner instead of a dedicated page: a website can't serve a route while
 * offline without a service worker, but client-side it CAN tell the user why
 * nothing loads. §15 voice, no exclamation cheer).
 *
 * Behavior: slides up from the bottom when the browser loses connectivity,
 * flips to a green "back online" confirmation for a beat on reconnect, then
 * hides. No layout shift (fixed, above safe-area).
 */
const COPY: Record<string, { off: string; on: string }> = {
  de: { off: "Keine Verbindung. Wir verbinden automatisch neu.", on: "Wieder online." },
  en: { off: "No connection. We'll reconnect automatically.", on: "Back online." },
  fr: { off: "Pas de connexion. Reconnexion automatique en cours.", on: "De retour en ligne." },
  it: { off: "Nessuna connessione. Ci ricolleghiamo automaticamente.", on: "Di nuovo online." },
};

export default function OfflineBanner() {
  const locale = useLocale();
  const l = COPY[locale] ?? COPY.de;
  const [offline, setOffline] = useState(false);
  const [justBack, setJustBack] = useState(false);

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

  if (!offline && !justBack) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={[
        "fixed inset-x-0 bottom-0 z-[90] flex items-center justify-center gap-2 px-4 py-3",
        "pb-[max(12px,env(safe-area-inset-bottom))] font-body text-[13.5px] font-medium text-white",
        offline ? "bg-s-ink" : "bg-s-success",
      ].join(" ")}
    >
      {offline ? (
        <WifiOff size={15} strokeWidth={2} aria-hidden />
      ) : (
        <Wifi size={15} strokeWidth={2} aria-hidden />
      )}
      {offline ? l.off : l.on}
    </div>
  );
}
