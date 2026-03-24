import { AlertTriangle } from "lucide-react";
import type { Salon } from "@/lib/types";

export default function FrozenSalonBanner({ salon }: { salon: Salon & { frozen_at?: string | null, frozen_reason?: string | null } }) {
  if (!salon.frozen_at) return null;

  return (
    <div className="bg-s-error-bg border border-s-error/20 rounded-card p-4 mb-6 relative overflow-hidden">
      {/* Decorative background element pattern matching solen styling */}
      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
        <AlertTriangle className="w-32 h-32 text-s-error translate-x-4 -translate-y-4" />
      </div>

      <div className="flex items-start gap-4 relative z-10">
        <div className="p-2 bg-s-error/10 rounded-btn shrink-0">
          <AlertTriangle className="text-s-error w-5 h-5" />
        </div>
        <div className="flex-1">
          <h3 className="font-heading font-bold text-s-ink text-base">Ihr Salon-Konto wurde eingefroren</h3>
          <p className="text-sm text-s-ink/70 mt-1 mb-3">
            Ihr Salon ist aktuell nicht auf der Plattform sichtbar und kann keine neuen Buchungen erhalten.
          </p>
          
          {salon.frozen_reason && (
            <div className="bg-white dark:bg-s-dm-surface border border-s-error/10 rounded-card px-3 py-2 mb-3">
              <p className="text-xs font-medium text-s-error/80 uppercase tracking-wider mb-1">Grund</p>
              <p className="text-sm text-s-ink/80">{salon.frozen_reason}</p>
            </div>
          )}
          
          <div className="pt-2 flex items-center gap-2">
            <span className="text-sm text-s-ink/60">Bitte kontaktieren Sie</span>
            <a 
              href="mailto:support@solen.ch" 
              className="px-3 py-1.5 bg-white dark:bg-s-dm-surface border border-s-error/20 rounded-btn text-sm font-medium text-s-error hover:bg-s-error/5 transition-colors"
            >
              support@solen.ch
            </a>
            <span className="text-sm text-s-ink/60">zur Klärung.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
