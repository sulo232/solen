"use client";

import { useEffect } from "react";

/**
 * Root error boundary — LOCKFILE §15.3 typographic language (2026-06-11
 * video-audit; matches the approved errors mockup + the new 404). Replaces
 * the retired-s-coral AlertTriangle layout. Outside [locale], so next-intl
 * is unavailable — German copy hardcoded like before, §15.4 human voice
 * (cause named, no exclamation cheer). One ink CTA + one blue link.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-5 text-center">
      <span
        className="font-heading text-[clamp(64px,14vw,84px)] font-bold leading-none tracking-[-0.04em] bg-gradient-to-b from-s-ink from-30% to-[#BBBBBB] bg-clip-text text-transparent"
        aria-hidden
      >
        Uff.
      </span>
      <h1 className="mt-4 font-heading text-[clamp(19px,2.6vw,22px)] font-bold tracking-[-0.02em] text-s-ink">
        Das war unser Fehler.
      </h1>
      <p className="mx-auto mt-3 max-w-[320px] font-body text-[14.5px] leading-relaxed text-s-ink-2">
        Bei uns ist etwas kaputtgegangen. Deine Buchungen sind sicher, versuch
        es gleich nochmal.
      </p>
      <div className="mt-7 flex flex-col items-center gap-4">
        <button
          onClick={reset}
          className="rounded-btn bg-s-ink px-7 py-3.5 font-heading text-sm font-semibold text-white transition-[transform,filter] duration-150 hover:brightness-[1.06] active:scale-[0.97]"
        >
          Erneut versuchen
        </button>
        <a href="/" className="font-body text-[13.5px] font-semibold text-s-ink-2 transition-colors duration-150 hover:text-s-ink">
          Zur Startseite
        </a>
      </div>
    </div>
  );
}
