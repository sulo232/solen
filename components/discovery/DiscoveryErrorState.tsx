"use client";
import { AlertCircle } from "lucide-react";

interface DiscoveryErrorStateProps {
  onRetry: () => void;
}

export default function DiscoveryErrorState({ onRetry }: DiscoveryErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-14 h-14 rounded-[16px] flex items-center justify-center mb-4"
        style={{ background: "rgba(232,98,74,.08)" }}>
        <AlertCircle size={24} className="text-s-coral" />
      </div>
      <p className="text-[9px] font-heading font-bold uppercase tracking-[.18em] text-s-coral mb-2">
        Fehler
      </p>
      <p className="font-heading font-semibold text-base text-s-ink dark:text-s-dm-text mb-1">Laden fehlgeschlagen</p>
      <p className="text-xs font-body text-s-ink/40 dark:text-s-dm-text/40 mb-5">Überprüfe deine Verbindung und versuche es erneut.</p>
      <button onClick={onRetry}
        className="px-5 py-3 rounded-btn text-white text-xs font-heading font-bold active:scale-[0.98] transition-all"
        style={{ background: "#E8624A", boxShadow: "0 2px 4px rgba(232,98,74,.25), 0 4px 12px rgba(232,98,74,.15)" }}>
        Erneut versuchen
      </button>
    </div>
  );
}
