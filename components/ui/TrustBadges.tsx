"use client";

import { Shield, Flag, CheckCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const BADGES: { Icon: LucideIcon; label: string }[] = [
  { Icon: Shield, label: "Sichere Zahlung" },
  { Icon: Flag, label: "Swiss Made" },
  { Icon: CheckCircle, label: "nDSG Konform" },
];

export default function TrustBadges() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 py-8 border-t border-b border-white/[0.06] my-8">
      {BADGES.map(({ Icon, label }) => (
        <div
          key={label}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-white/10"
        >
          <Icon size={13} className="text-white/50 shrink-0" />
          <span className="text-[9px] font-heading font-bold uppercase tracking-[.14em] text-white/50">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}
