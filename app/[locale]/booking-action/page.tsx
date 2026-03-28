"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import { motion } from "framer-motion";
import { Check, X, AlertTriangle } from "lucide-react";
import Spinner from "@/components/ui/Spinner";

export default function BookingActionPage() {
  const searchParams = useSearchParams();
  const locale = useLocale();
  const bookingId = searchParams.get("id");
  const token = searchParams.get("token");

  const [result, setResult] = useState<"confirmed" | "cancelled" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bookingId || !token) {
      setError("Missing parameters");
      setLoading(false);
      return;
    }

    fetch(`/api/bookings/${bookingId}/quick-action?token=${encodeURIComponent(token)}`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) {
          setError(data.error ?? "Action failed");
          return;
        }
        setResult(data.result as "confirmed" | "cancelled");
      })
      .catch(() => setError("Request failed"))
      .finally(() => setLoading(false));
  }, [bookingId, token]);

  const labels = {
    de: {
      confirmed: "Termin bestätigt",
      confirmedDesc: "Dein Termin wurde erfolgreich bestätigt.",
      cancelled: "Termin abgesagt",
      cancelledDesc: "Dein Termin wurde abgesagt.",
      error: "Aktion fehlgeschlagen",
    },
    en: {
      confirmed: "Booking Confirmed",
      confirmedDesc: "Your booking has been confirmed successfully.",
      cancelled: "Booking Cancelled",
      cancelledDesc: "Your booking has been cancelled.",
      error: "Action Failed",
    },
  };
  const l = labels[locale as "de" | "en"] ?? labels.de;

  return (
    <div className="min-h-screen bg-s-bg-surface dark:bg-s-dm-bg flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-s-dm-surface rounded-[12px] shadow-warm-md max-w-sm w-full p-6 text-center"
      >
        {loading ? (
          <div className="py-12"><Spinner size="lg" /></div>
        ) : error ? (
          <>
            <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center bg-s-amber-subtle">
              <AlertTriangle size={24} className="text-s-amber" />
            </div>
            <h2 className="font-heading font-bold text-lg text-s-ink dark:text-s-dm-text mb-2">{l.error}</h2>
            <p className="text-sm text-s-ink/50 dark:text-s-dm-text/50">{error}</p>
          </>
        ) : result === "confirmed" ? (
          <>
            <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center bg-s-coral/10">
              <Check size={24} className="text-s-coral" />
            </div>
            <h2 className="font-heading font-bold text-lg text-s-ink dark:text-s-dm-text mb-2">{l.confirmed}</h2>
            <p className="text-sm text-s-ink/50 dark:text-s-dm-text/50">{l.confirmedDesc}</p>
          </>
        ) : (
          <>
            <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center bg-s-ink/5 dark:bg-s-dm-text/5">
              <X size={24} className="text-s-ink/40 dark:text-s-dm-text/40" />
            </div>
            <h2 className="font-heading font-bold text-lg text-s-ink dark:text-s-dm-text mb-2">{l.cancelled}</h2>
            <p className="text-sm text-s-ink/50 dark:text-s-dm-text/50">{l.cancelledDesc}</p>
          </>
        )}
      </motion.div>
    </div>
  );
}
