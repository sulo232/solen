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
      <div className="rounded-card border border-s-coral/20 bg-s-coral/5 p-4 flex items-center gap-3">
        <Check size={18} className="text-s-coral shrink-0" />
        <div>
          <p className="text-sm font-medium text-s-coral">{l.redeemed}</p>
          <p className="text-xs text-s-ink/50 dark:text-s-dm-text/50">{l.desc}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-card border border-s-coral/20 bg-s-coral/5 p-4">
      <div className="flex items-center gap-2 mb-2">
        <Package size={16} className="text-s-coral" />
        <p className="text-sm text-s-ink dark:text-s-dm-text">{l.remaining}</p>
      </div>
      {/* Progress dots */}
      <div className="flex gap-1 mb-3">
        {Array.from({ length: totalSessions }).map((_, i) => (
          <div
            key={i}
            className={`w-2.5 h-2.5 rounded-full ${i < sessionsUsed ? "bg-s-coral" : "bg-s-ink/10 dark:bg-white/10"}`}
          />
        ))}
      </div>
      {error && <p className="text-xs text-s-coral mb-2">{error}</p>}
      <button
        onClick={handleRedeem}
        disabled={redeeming}
        className="px-4 py-2 rounded-btn bg-s-coral text-white text-sm font-medium hover:bg-s-coral/90 transition-colors disabled:opacity-50 flex items-center gap-2"
      >
        {redeeming && <Spinner size="sm" invert />}
        {l.redeem}
      </button>
    </div>
  );
}
