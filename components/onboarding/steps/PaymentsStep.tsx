"use client";

import { useState, useEffect } from "react";
import { CreditCard, ExternalLink, Loader2, Check } from "lucide-react";
import { useTranslations } from "next-intl";

interface PaymentsStepProps {
  salonId: string;
  onSaved: () => void;
}

type PaymentMode = "at_salon" | "deposit" | "prepay";

export default function PaymentsStep({ salonId, onSaved }: PaymentsStepProps) {
  const t = useTranslations("onboarding");
  const tc = useTranslations("common");
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("at_salon");
  const [connectStatus, setConnectStatus] = useState<"loading" | "not_connected" | "pending" | "connected">("loading");
  const [connectLoading, setConnectLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/stripe/connect/status")
      .then((r) => r.json())
      .then((d) => setConnectStatus(d.status ?? "not_connected"))
      .catch(() => setConnectStatus("not_connected"));
  }, []);

  const handleConnect = async () => {
    setConnectLoading(true);
    try {
      const res = await fetch("/api/stripe/connect/create-account", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } finally {
      setConnectLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch(`/api/salons/${salonId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payment_mode: paymentMode }),
      });
      onSaved();
    } catch { /* ignore */ } finally {
      setSaving(false);
    }
  };

  const modeOptions: { id: PaymentMode; labelKey: string; descKey: string }[] = [
    { id: "at_salon", labelKey: "payments.atSalonLabel", descKey: "payments.atSalonDesc" },
    { id: "deposit", labelKey: "payments.depositLabel", descKey: "payments.depositDesc" },
    { id: "prepay", labelKey: "payments.prepayLabel", descKey: "payments.prepayDesc" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-12 h-12 rounded-card bg-s-coral/10 dark:bg-s-coral/20 flex items-center justify-center">
          <CreditCard size={22} className="text-s-coral" />
        </div>
        <div>
          <h2 className="font-heading font-bold text-xl text-s-ink dark:text-s-dm-text">
            {t("payments.title")}
          </h2>
          <p className="text-sm text-s-ink/40 dark:text-s-dm-text/50">
            {t("payments.subtitle")}
          </p>
        </div>
      </div>

      {/* Payment mode selection */}
      <div className="bg-white dark:bg-s-dm-surface rounded-card border border-s-ink/5 dark:border-white/5 p-6 space-y-3">
        <p className="text-xs font-medium text-s-ink/50 dark:text-s-dm-text/50 mb-2">
          {t("payments.mode")}
        </p>
        {modeOptions.map((opt) => (
          <button
            key={opt.id}
            onClick={() => setPaymentMode(opt.id)}
            className={[
              "w-full rounded-card border p-4 text-left transition-all flex items-center gap-3",
              paymentMode === opt.id
                ? "border-s-coral bg-s-coral/5 dark:bg-s-coral/10 shadow-warm-sm"
                : "border-s-ink/10 dark:border-white/10 hover:border-s-ink/20 dark:hover:border-white/20",
            ].join(" ")}
          >
            <div className={[
              "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0",
              paymentMode === opt.id ? "border-s-coral" : "border-s-ink/20 dark:border-white/20",
            ].join(" ")}>
              {paymentMode === opt.id && <div className="w-2.5 h-2.5 rounded-full bg-s-coral" />}
            </div>
            <div>
              <p className={["text-sm font-medium", paymentMode === opt.id ? "text-s-coral" : "text-s-ink dark:text-s-dm-text"].join(" ")}>
                {t(opt.labelKey)}
              </p>
              <p className="text-[11px] text-s-ink/40 dark:text-s-dm-text/40 mt-0.5">{t(opt.descKey)}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Stripe Connect — only for deposit/prepay */}
      {paymentMode !== "at_salon" && (
        <div className="bg-white dark:bg-s-dm-surface rounded-card border border-s-ink/5 dark:border-white/5 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard size={16} className="text-s-ink/40 dark:text-s-dm-text/40" />
              <p className="text-sm font-medium text-s-ink dark:text-s-dm-text">
                {t("payments.connectBank")}
              </p>
            </div>
            {connectStatus === "connected" && (
              <span className="px-2 py-0.5 rounded-pill text-xs bg-s-coral/10 dark:bg-s-coral/20 text-s-coral font-medium flex items-center gap-1">
                <Check size={10} /> {t("payments.connected")}
              </span>
            )}
          </div>
          <p className="text-xs text-s-ink/50 dark:text-s-dm-text/50">
            {t("payments.stripeDesc")}
          </p>
          {connectStatus !== "connected" && (
            <button
              onClick={handleConnect}
              disabled={connectLoading || connectStatus === "loading"}
              className="flex items-center gap-2 px-4 py-2.5 rounded-btn border border-s-ink/10 dark:border-white/10 text-sm text-s-ink dark:text-s-dm-text hover:border-s-coral hover:text-s-coral transition-colors disabled:opacity-50"
            >
              {connectLoading ? <Loader2 size={14} className="animate-spin" /> : <ExternalLink size={14} />}
              {t("payments.connectBank")}
            </button>
          )}
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-3 rounded-btn bg-s-coral text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2 hover:bg-s-coral/90 transition-colors shadow-warm-sm"
      >
        {saving ? <Loader2 size={14} className="animate-spin" /> : null}
        {tc("save")}
      </button>
    </div>
  );
}
