"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { Package, Check } from "lucide-react";
import Spinner from "@/components/ui/Spinner";

interface PackageRedeemBannerProps {
  packageId: string;
  packageName: string;
  sessionsUsed: number;
  totalSessions: number;
  slotId: string;
  serviceId: string;
  onRedeemed: () => void;
}

export default function PackageRedeemBanner({
  packageId,
  packageName,
  sessionsUsed,
  totalSessions,
  slotId,
  serviceId,
  onRedeemed,
}: PackageRedeemBannerProps) {
  const locale = useLocale();
  const [redeeming, setRedeeming] = useState(false);
  const [redeemed, setRedeemed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remaining = totalSessions - sessionsUsed;

  const labels = {
    de: {
      remaining: `Du hast noch ${remaining} von ${totalSessions} Terminen in deinem Paket «${packageName}»`,
      redeem: "Jetzt einlösen",
      redeemed: "Eingelöst!",
      desc: "Kein zusätzlicher Betrag fällig.",
    },
    en: {
      remaining: `You have ${remaining} of ${totalSessions} sessions left in your «${packageName}» package`,
      redeem: "Redeem now",
      redeemed: "Redeemed!",
      desc: "No additional charge.",
    },
  };
  const l = labels[locale as "de" | "en"] ?? labels.de;

  const handleRedeem = async () => {
    setRedeeming(true);
    setError(null);
    try {
      const res = await fetch("/api/packages/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ package_purchase_id: packageId, slot_id: slotId, service_id: serviceId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Fehler");
      }
      setRedeemed(true);
      onRedeemed();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Einlösung fehlgeschlagen");
    } finally {
      setRedeeming(false);
    }
  };

  if (redeemed) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-[12px]"
        style={{ background: "rgba(212,135,10,.08)", border: "1px solid rgba(212,135,10,.20)" }}>
        <div className="w-8 h-8 rounded-[8px] flex items-center justify-center shrink-0"
          style={{ background: "rgba(76,175,111,.14)" }}>
          <Check size={15} className="text-[#4CAF6F]" />
        </div>
        <div>
          <p className="text-xs font-heading font-bold text-[#4CAF6F]">{l.redeemed}</p>
          <p className="text-[9px] font-heading uppercase tracking-[.10em] text-s-ink/40 dark:text-s-dm-text/40 mt-0.5">{l.desc}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-[12px]"
      style={{ background: "rgba(212,135,10,.08)", border: "1px solid rgba(212,135,10,.20)" }}>
      <div className="w-8 h-8 rounded-[8px] flex items-center justify-center shrink-0"
        style={{ background: "rgba(212,135,10,.14)" }}>
        <Package size={15} className="text-s-amber" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-heading font-bold text-s-amber-text dark:text-s-amber truncate">{packageName}</p>
        <p className="text-[9px] font-heading uppercase tracking-[.10em] text-s-ink/40 dark:text-s-dm-text/40 mt-0.5">
          {sessionsUsed}/{totalSessions} Sessions genutzt
        </p>
        {/* Progress dots */}
        <div className="flex gap-1 mt-1.5">
          {Array.from({ length: totalSessions }).map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full ${i < sessionsUsed ? "bg-s-amber" : "bg-s-ink/10 dark:bg-white/10"}`}
            />
          ))}
        </div>
        {error && <p className="text-xs text-s-coral mt-1">{error}</p>}
      </div>
      <button
        onClick={handleRedeem}
        disabled={redeeming}
        className="px-3 py-2 rounded-btn active:scale-[0.98] text-white text-[10px] font-heading font-bold uppercase tracking-[.04em] transition-all disabled:opacity-50 flex items-center gap-1.5 shrink-0"
        style={{ background: "#D4870A", boxShadow: "0 2px 4px rgba(212,135,10,.22)" }}
      >
        {redeeming && <Spinner size="sm" invert />}
        {l.redeem}
      </button>
    </div>
  );
}
