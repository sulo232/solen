"use client";

import { Search } from "lucide-react";

export default function DiscoveryEmptyState({ onReset }: { onReset?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-[18px] flex items-center justify-center mb-5"
        style={{ background: "rgba(232,98,74,.08)" }}>
        <Search size={26} className="text-s-coral/60" />
      </div>
      <p className="text-[9px] font-heading font-bold uppercase tracking-[.20em] text-s-ink/30 dark:text-s-dm-text/30 mb-2">
        Kein Ergebnis
      </p>
      <p className="font-heading font-semibold text-base text-s-ink dark:text-s-dm-text mb-1">Nichts gefunden</p>
      <p className="text-xs font-body text-s-ink/40 dark:text-s-dm-text/40 mb-5 max-w-xs">
        Versuche einen anderen Filter oder setze die Suche zurück.
      </p>
      {onReset && (
        <button onClick={onReset}
          className="px-5 py-3 rounded-btn border border-s-ink/[0.08] dark:border-white/[0.08] text-xs font-heading font-bold text-s-ink/60 dark:text-s-dm-text/60 hover:border-s-coral/40 hover:text-s-coral transition-colors">
          Filter zurücksetzen
        </button>
      )}
    </div>
  );
}
