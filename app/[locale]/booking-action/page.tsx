"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { motion } from "motion/react";
import { Check, X, AlertTriangle } from "lucide-react";
import Spinner from "@/components-legacy/ui/Spinner";

export default function BookingActionPage() {
  const searchParams = useSearchParams() ?? new URLSearchParams();
  const t = useTranslations("bookingAction");
  const bookingId = searchParams.get("id");
  const token = searchParams.get("token");

  const [result, setResult] = useState<"confirmed" | "cancelled" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bookingId || !token) {
      setError(t("errMissingParams"));
      setLoading(false);
      return;
    }

    fetch(`/api/bookings/${bookingId}/quick-action?token=${encodeURIComponent(token)}`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) {
          setError(data.error ?? t("errActionFailed"));
          return;
        }
        setResult(data.result as "confirmed" | "cancelled");
      })
      .catch(() => setError(t("errRequestFailed")))
      .finally(() => setLoading(false));
  }, [bookingId, token, t]);

  return (
    <div className="min-h-screen bg-s-bg-surface flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[12px] shadow-warm-md max-w-sm w-full p-6 text-center"
      >
        {loading ? (
          <div className="py-12"><Spinner size="lg" /></div>
        ) : error ? (
          <>
            <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center bg-s-warning-bg">
              <AlertTriangle size={24} strokeWidth={2.4} className="text-s-warning" />
            </div>
            <h2 className="font-heading text-lg text-s-ink mb-2">{t("error")}</h2>
            <p className="text-sm text-s-ink-2">{error}</p>
          </>
        ) : result === "confirmed" ? (
          <>
            <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center bg-s-ink/10">
              <Check size={24} strokeWidth={2.4} className="text-s-success" />
            </div>
            <h2 className="font-heading text-lg text-s-ink mb-2">{t("confirmed")}</h2>
            <p className="text-sm text-s-ink-2">{t("confirmedDesc")}</p>
          </>
        ) : (
          <>
            <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center bg-s-ink/5">
              <X size={24} strokeWidth={2.4} className="text-s-ink/40" />
            </div>
            <h2 className="font-heading text-lg text-s-ink mb-2">{t("cancelled")}</h2>
            <p className="text-sm text-s-ink-2">{t("cancelledDesc")}</p>
          </>
        )}
      </motion.div>
    </div>
  );
}
