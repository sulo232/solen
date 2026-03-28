"use client";

import { Shield, Flag, CheckCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";

const BADGE_KEYS: { Icon: LucideIcon; key: "securePayment" | "swissMade" | "gdprCompliant" }[] = [
  { Icon: Shield, key: "securePayment" },
  { Icon: Flag, key: "swissMade" },
  { Icon: CheckCircle, key: "gdprCompliant" },
];

export default function TrustBadges() {
  const t = useTranslations("home.trust");
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 py-8 border-t border-b border-white/[0.06] my-8">
      {BADGE_KEYS.map(({ Icon, key }) => (
        <div
          key={key}
          className="flex items-center gap-2 px-4 py-2.5 rounded-pill border border-white/10"
        >
          <Icon size={13} className="text-white/50 shrink-0" />
          <span className="text-[9px] font-heading font-bold uppercase tracking-[.14em] text-white/50">
            {t(key)}
          </span>
        </div>
      ))}
    </div>
  );
}
