"use client";

import { Lock, Flag, ShieldCheck } from "lucide-react";

const BADGES = [
  { Icon: Lock,        label: "Sichere Zahlung" },
  { Icon: Flag,        label: "Swiss Made" },
  { Icon: ShieldCheck, label: "nDSG Konform" },
] as const;

export default function TrustBadges() {
  return (
    <div className="flex items-center justify-center gap-6 sm:gap-8 flex-wrap py-4">
      {BADGES.map(({ Icon, label }) => (
        <div key={label} className="flex items-center gap-2">
          <Icon size={14} className="text-white/40 shrink-0" />
          <span
            className="text-xs text-white/50 font-body font-medium"
            style={{ fontFamily: "DM Sans, sans-serif" }}
          >
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}
