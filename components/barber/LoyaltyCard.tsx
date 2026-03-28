"use client";

import { useState } from "react";
import { Check, Circle, Gift, QrCode, X } from "lucide-react";
import { useTranslations } from "next-intl";

interface LoyaltyCardProps {
  card: {
    id: string;
    stamps_collected: number;
    status: string;
    salon_id: string;
    barber_loyalty_programs: {
      name: string;
      stamps_required: number;
      reward_type: string;
      reward_value: number | null;
    } | null;
  };
  salonName?: string;
}

export default function LoyaltyCard({ card, salonName }: LoyaltyCardProps) {
  const t = useTranslations("barber.loyalty") as any;
  const [showQR, setShowQR] = useState(false);
  const [qrSvg, setQrSvg] = useState<string | null>(null);
  const [loadingQR, setLoadingQR] = useState(false);

  const program = card.barber_loyalty_programs;
  const stampsRequired = program?.stamps_required ?? 10;
  const stamps = Array.from({ length: stampsRequired }, (_, i) => i);
  const isComplete = card.status === "completed" || card.stamps_collected >= stampsRequired;
  const isRedeemed = card.status === "redeemed";

  const rewardText = program?.reward_type === "free_service"
    ? t("rewardFreeService")
    : program?.reward_type === "chf_discount"
    ? t("rewardChfDiscount", { value: program.reward_value })
    : t("rewardPercentDiscount", { value: program?.reward_value });

  const handleShowQR = async () => {
    if (qrSvg) {
      setShowQR(true);
      return;
    }
    setLoadingQR(true);
    try {
      const res = await fetch(`/api/loyalty/qr/${card.id}`);
      if (res.ok) {
        const svg = await res.text();
        setQrSvg(svg);
        setShowQR(true);
      }
    } catch {
      // Error loading QR
    }
    setLoadingQR(false);
  };

  return (
    <>
      <div
        className={`rounded-[16px] p-4 border ${
          isComplete && !isRedeemed
            ? "border-s-coral/30 bg-s-coral/5 dark:bg-s-coral/10 shadow-[0_0_12px_rgba(232,98,74,0.15)]"
            : isRedeemed
            ? "border-s-ink/5 dark:border-s-dm-text/5 bg-s-bg-surface dark:bg-s-dm-bg opacity-60"
            : "border-s-ink/5 dark:border-s-dm-text/10 bg-white dark:bg-s-dm-surface"
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-medium text-s-ink dark:text-s-dm-text">
              {program?.name ?? t("loyaltyCard")}
            </p>
            {salonName && (
              <p className="text-xs text-s-ink/50 dark:text-s-dm-text/50">{salonName}</p>
            )}
          </div>
          {isComplete && !isRedeemed && (
            <span className="flex items-center gap-1 text-xs font-medium text-s-coral bg-s-coral/10 rounded-pill px-2 py-1">
              <Gift size={12} />
              {t("rewardAvailable", { reward: rewardText })}
            </span>
          )}
          {isRedeemed && (
            <span className="text-xs text-s-ink/40 dark:text-s-dm-text/40">{t("redeemed")}</span>
          )}
        </div>

        {/* Stamp grid */}
        <div className="flex flex-wrap gap-2 mb-3">
          {stamps.map((i) => (
            i < card.stamps_collected ? (
              <div key={i} className="w-7 h-7 rounded-full bg-s-coral/10 flex items-center justify-center">
                <Check size={14} className="text-s-coral" />
              </div>
            ) : (
              <div key={i} className="w-7 h-7 rounded-full flex items-center justify-center">
                <Circle size={14} className="text-s-ink/15 dark:text-s-dm-text/15" />
              </div>
            )
          ))}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs text-s-ink/50 dark:text-s-dm-text/50">
            {t("stamps", { collected: card.stamps_collected, required: stampsRequired })}
          </p>
          {!isRedeemed && (
            <button
              onClick={handleShowQR}
              disabled={loadingQR}
              className="flex items-center gap-1 text-xs text-s-coral hover:brightness-[1.06] transition-colors"
              aria-label={t("showQr")}
            >
              <QrCode size={14} />
              {loadingQR ? "..." : t("showQr")}
            </button>
          )}
        </div>
      </div>

      {/* QR Fullscreen overlay */}
      {showQR && qrSvg && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t("qrCodeTitle")}
          className="fixed inset-0 z-50 bg-s-ink/80 dark:bg-s-dm-bg/90 flex items-center justify-center p-8"
          onClick={() => setShowQR(false)}
        >
          <div className="relative bg-white dark:bg-s-dm-surface rounded-[24px] p-6 max-w-xs w-full text-center" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowQR(false)}
              className="absolute top-3 right-3 text-s-ink/40 dark:text-s-dm-text/40 hover:text-s-ink dark:hover:text-s-dm-text"
              aria-label={t("close")}
            >
              <X size={20} />
            </button>
            <p className="text-sm font-medium text-s-ink dark:text-s-dm-text mb-4">
              {t("showQrToBarber")}
            </p>
            {/* QR SVG from our own qrcode server library — safe to render */}
            <div
              className="mx-auto w-48 h-48 [&>svg]:w-full [&>svg]:h-full"
              dangerouslySetInnerHTML={{ __html: qrSvg }}
            />
            <p className="text-xs text-s-ink/50 dark:text-s-dm-text/50 mt-4">
              {t("stamps", { collected: card.stamps_collected, required: stampsRequired })} · {program?.name}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
