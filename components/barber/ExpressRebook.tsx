"use client";

import { useEffect, useState } from "react";
import { Scissors, CalendarCheck, AlertCircle, RefreshCw } from "lucide-react";
import { formatCurrency } from "@/lib/format-currency";
import { useTranslations } from "next-intl";

interface ExpressRebookProps {
  salonId: string;
  customerId?: string;
}

interface LastCut {
  service_name: string;
  staff_name: string;
  shape: string | null;
  fade_type: string | null;
  top_style: string | null;
  created_at: string;
  service_id: string;
  staff_member_id: string;
}

interface SuggestedSlot {
  slot_id: string;
  staff_member_id: string;
  staff_name: string;
  starts_at: string;
  ends_at: string;
  service_id: string;
  price: number;
}

export default function ExpressRebook({ salonId, customerId }: ExpressRebookProps) {
  const [lastCut, setLastCut] = useState<LastCut | null>(null);
  const [suggested, setSuggested] = useState<SuggestedSlot | null>(null);
  const [step, setStep] = useState<"idle" | "searching" | "confirm" | "booking" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const t = useTranslations("barber") as any;

  useEffect(() => {
    if (!customerId) { setLoading(false); return; }
    const fetchLast = async () => {
      try {
        const res = await fetch(`/api/clients/${customerId}/repeat-last-cut`);
        if (res.ok) {
          const data = await res.json();
          setLastCut(data.cut ?? null);
        }
      } catch {
        // No last cut available
      }
      setLoading(false);
    };
    fetchLast();
  }, [customerId]);

  const daysAgo = lastCut
    ? Math.floor((Date.now() - new Date(lastCut.created_at).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const handleRebook = async () => {
    if (!lastCut) return;
    setStep("searching");
    setError("");

    try {
      const res = await fetch("/api/bookings/express-rebook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salon_id: salonId,
          service_id: lastCut.service_id,
          staff_member_id: lastCut.staff_member_id,
        }),
      });
      const data = await res.json();
      if (res.ok && data.slot) {
        setSuggested(data.slot);
        setStep("confirm");
      } else {
        setError(data.error ?? t("express.errorNoSlot"));
        setStep("error");
      }
    } catch {
      setError(t("express.errorNetwork"));
      setStep("error");
    }
  };

  const handleConfirm = async () => {
    if (!suggested) return;
    setStep("booking");

    try {
      const res = await fetch("/api/bookings/express-rebook/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slot_id: suggested.slot_id,
          service_id: suggested.service_id,
          staff_member_id: suggested.staff_member_id,
        }),
      });
      if (res.ok) {
        setStep("done");
      } else {
        const data = await res.json();
        setError(data.error ?? t("express.errorBooking"));
        setStep("error");
      }
    } catch {
      setError(t("express.errorNetwork"));
      setStep("error");
    }
  };

  if (loading || !lastCut) return null;

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("de-CH", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  };

  const cutDescription = [lastCut.shape, lastCut.fade_type, lastCut.top_style]
    .filter(Boolean)
    .join(" + ") || lastCut.service_name;

  return (
    <div className="rounded-[16px] bg-white dark:bg-s-dm-surface shadow-warm-xl p-4 border border-s-ink/5 dark:border-s-dm-text/10">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-full bg-s-coral/10 shrink-0">
          <Scissors size={18} className="text-s-coral" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-s-ink dark:text-s-dm-text">
            {t("express.lastCut")}: {cutDescription} {t("express.staffAt")} {lastCut.staff_name}, {t("express.daysAgo", { days: daysAgo })}
          </p>

          {step === "idle" && (
            <button
              onClick={handleRebook}
              className="mt-3 w-full flex items-center justify-center gap-2 rounded-pill active:scale-[0.98] bg-s-coral text-white font-heading font-bold uppercase tracking-[.04em] py-2.5 text-xs hover:brightness-[1.06] transition-[transform,filter] duration-150 shadow-coral-glow"
            >
              <RefreshCw size={16} />
              {t("express.rebook")}
            </button>
          )}

          {step === "searching" && (
            <p className="mt-2 text-sm text-s-ink/50 dark:text-s-dm-text/50 animate-pulse">
              {t("express.searching")}
            </p>
          )}

          {step === "confirm" && suggested && (
            <div className="mt-3 space-y-2">
              <div className="rounded-input bg-s-bg-surface dark:bg-s-dm-bg p-3 text-sm text-s-ink dark:text-s-dm-text">
                <div className="flex items-center gap-2 mb-1">
                  <CalendarCheck size={14} className="text-s-sage" />
                  <span className="font-medium">{formatDate(suggested.starts_at)}</span>
                </div>
                <p className="text-s-ink/60 dark:text-s-dm-text/60">
                  {t("express.staffAt")} {suggested.staff_name} · {formatCurrency(suggested.price)}
                </p>
              </div>
              <button
                onClick={handleConfirm}
                className="w-full rounded-pill active:scale-[0.98] bg-s-coral text-white font-heading font-bold uppercase tracking-[.04em] py-2.5 text-xs hover:brightness-[1.06] transition-[transform,filter] duration-150 shadow-coral-glow"
              >
                {t("express.confirm")}
              </button>
            </div>
          )}

          {step === "booking" && (
            <p className="mt-2 text-sm text-s-ink/50 dark:text-s-dm-text/50 animate-pulse">
              {t("express.booking")}
            </p>
          )}

          {step === "done" && (
            <div className="mt-3 flex items-center gap-2 text-sm text-s-sage">
              <CalendarCheck size={16} />
              {t("express.booked")}
            </div>
          )}

          {step === "error" && (
            <div className="mt-3">
              <div className="flex items-center gap-2 text-sm text-s-error mb-2">
                <AlertCircle size={14} />
                {error}
              </div>
              <button
                onClick={() => setStep("idle")}
                className="text-xs text-s-coral hover:underline"
              >
                {t("express.retry")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
