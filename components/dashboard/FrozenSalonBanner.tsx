import { AlertTriangle } from "lucide-react";
import type { Salon } from "@/lib/types";

export default function FrozenSalonBanner({ salon }: { salon: Salon & { frozen_at?: string | null, frozen_reason?: string | null } }) {
  if (!salon.frozen_at) return null;

  return (
    <div className="rounded-[12px] px-4 py-4 mb-4 flex items-center gap-4"
      style={{ background: "rgba(26,18,9,.94)", border: "1px solid rgba(26,18,9,.20)" }}>
      <AlertTriangle size={18} className="text-white/70 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-heading text-white">Salon gesperrt</p>
        <p className="text-[10px] text-white/55 mt-0.5">
          {salon.frozen_reason || "Dein Konto wurde temporär deaktiviert. Kontaktiere den Support."}
        </p>
      </div>
      <a href="mailto:support@solen.ch"
        className="text-[10px] font-heading uppercase tracking-[.06em] px-3 py-2 rounded-[8px] bg-white/10 text-white hover:bg-white/20 transition-colors shrink-0">
        Kontakt
      </a>
    </div>
  );
}
