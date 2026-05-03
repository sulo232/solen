"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Package, Check } from "lucide-react";
import Spinner from "@/components/ui/Spinner";

interface PackageRedeemBannerProps {
  packageId: string;
  packageName: string;
  sessionsUsed: number;
  totalSessions: number;
  slotId: string;
  serviceId?: string;
  onRedeemed: () => void;
}

export default function PackageRedeemBanner({
  packageId,
  packageName,
  sessionsUsed,
  totalSessions,
  slotId,
  onRedeemed,
}: PackageRedeemBannerProps) {
  const t = useTranslations("booking.packageRedeemBanner") as any;
  const [redeeming, setRedeeming] = useState(false);
  const [redeemed, setRedeemed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remaining = totalSessions - sessionsUsed;

  const handleRedeem = async () => {
    setRedeeming(true);
    setError(null);
    try {
      const res = await fetch("/api/packages/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purchase_id: packageId, booking_id: slotId }),
      });
      if (!res.ok) {
        let msg = t("error");
        try { const data = await res.json(); msg = data.error ?? msg; } catch { /* non-JSON */ }
        throw new Error(msg);
      }
      setRedeemed(true);
      onRedeemed();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("redemptionFailed"));
    } finally {
      setRedeeming(false);
    }
  };

  if (redeemed) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-[12px]"
        style={{ background: "rgba(243,168,100,.08)", border: "1px solid rgba(243,168,100,.20)" }}>
        <div className="w-8 h-8 rounded-[8px] flex items-center justify-center shrink-0"
          style={{ background: "rgba(22,163,74,.14)" }}>
          <Check size={15} className="text-s-sage" />
        </div>
        <div>
          <p className="text-xs font-heading text-s-sage">{t("redeemed")}</p>
          <p className="text-[9px] font-heading uppercase tracking-[.10em] text-s-ink/40 mt-0.5">{t("noAdditionalCharge")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-[12px]"
      style={{ background: "rgba(243,168,100,.08)", border: "1px solid rgba(243,168,100,.20)" }}>
      <div className="w-8 h-8 rounded-[8px] flex items-center justify-center shrink-0"
        style={{ background: "rgba(243,168,100,.14)" }}>
        <Package size={15} className="text-s-amber" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-heading text-s-amber-text truncate">{packageName}</p>
        <p className="text-[9px] font-heading uppercase tracking-[.10em] text-s-ink/40 mt-0.5">
          {t("sessionsUsed", { used: sessionsUsed, total: totalSessions })}
        </p>
        {/* Progress dots */}
        <div className="flex gap-1 mt-1.5">
          {Array.from({ length: totalSessions }).map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full ${i < sessionsUsed ? "bg-s-amber" : "bg-s-ink/10"}`}
            />
          ))}
        </div>
        {error && <p className="text-xs text-s-coral mt-1">{error}</p>}
      </div>
      <button
        onClick={handleRedeem}
        disabled={redeeming}
        className="px-3 py-2 rounded-pill active:scale-[0.97] bg-s-amber text-white text-[10px] font-heading uppercase tracking-[.04em] shadow-elevation-1 transition-[transform,filter] duration-150 disabled:opacity-50 flex items-center gap-1.5 shrink-0"
      >
        {redeeming && <Spinner size="sm" invert />}
        {t("redeemNow")}
      </button>
    </div>
  );
}
