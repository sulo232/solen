"use client";

import { Shield, Flag, CheckCircle } from "lucide-react";

const BADGES = [
  { Icon: Shield, label: "Sichere Zahlung", desc: "Stripe verschlüsselt" },
  { Icon: Flag, label: "Swiss Made", desc: "Entwickelt in Basel" },
  { Icon: CheckCircle, label: "nDSG Konform", desc: "Datenschutzkonform" },
] as const;

export default function TrustBadges() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 py-6">
      {BADGES.map(({ Icon, label, desc }) => (
        <div
          key={label}
          className="flex items-center gap-3 px-4 py-3 rounded-card bg-white/5 backdrop-blur-sm border border-white/10"
        >
          <Icon size={18} className="text-s-coral shrink-0" />
          <div>
            <p className="text-xs font-medium text-white/80 font-body">{label}</p>
            <p className="text-[10px] text-white/40 font-body">{desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
