"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { motion } from "framer-motion";
import { Gift, Search, AlertCircle, CheckCircle, ChevronRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/format-currency";
import Spinner from "@/components-legacy/ui/Spinner";
import InteractiveHoverButton from "@/components-legacy/ui/interactive-hover-button";
import { getPublicEnv } from "@/lib/env";

const publishableKey = getPublicEnv().NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey ? loadStripe(publishableKey) : Promise.resolve(null);

interface Salon {
  id: string;
  name_de: string;
  name_en: string;
  slug: string;
  cover_photo_url?: string;
}

// Inner payment form component
function VoucherPaymentForm({
  clientSecret,
  onSuccess,
}: {
  clientSecret: string;
  onSuccess: () => void;
}) {
  const locale = useLocale();
  const t = useTranslations("vouchers.payment") as any;
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/${locale}/vouchers/success`,
      },
    });

    if (confirmError) {
      setError(confirmError.message ?? "Payment failed");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement options={{ layout: "tabs" }} />

      {error && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-[10px] border border-s-coral/20"
          style={{ background: "rgba(27, 77, 27,.06)" }}>
          <AlertCircle size={13} className="text-s-coral shrink-0" />
          <p className="text-xs font-body text-s-coral">{error}</p>
        </div>
      )}

      <InteractiveHoverButton
        type="submit"
        disabled={!stripe || loading}
        text={loading ? "Verarbeite..." : t("payNow")}
        className="w-full py-3.5 rounded-btn text-[11px] font-heading uppercase tracking-[.06em] shadow-elevation-2 disabled:opacity-60"
      />
    </form>
  );
}

// Main vouchers page
export default function VouchersPage() {
  const locale = useLocale();
  const t = useTranslations("vouchers") as any;

  const [step, setStep] = useState<"browse" | "configure" | "payment">("browse");
  const [salons, setSalons] = useState<Salon[]>([]);
  const [loadingSalons, setLoadingSalons] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Configuration state
  const [selectedSalon, setSelectedSalon] = useState<Salon | null>(null);
  const [amount, setAmount] = useState(50);
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [message, setMessage] = useState("");

  // Payment state
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [voucherId, setVoucherId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Load salons on mount
  useEffect(() => {
    fetch("/api/salons")
      .then((r) => r.json())
      .then((data) => {
        setSalons(data.salons ?? []);
      })
      .catch((err) => console.error("[Vouchers] failed to load salons:", err))
      .finally(() => setLoadingSalons(false));
  }, []);

  const filteredSalons = salons.filter((s) =>
    (locale === "en" ? s.name_en : s.name_de)
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const handleConfigureVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSalon || !recipientEmail || !recipientName) return;

    setCreating(true);
    setCreateError(null);

    try {
      const res = await fetch("/api/vouchers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salon_id: selectedSalon.id,
          amount,
          recipient_email: recipientEmail,
          recipient_name: recipientName,
          message: message || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Fehler beim Erstellen");
      }

      setClientSecret(data.client_secret);
      setVoucherId(data.voucher_id);
      setStep("payment");
    } catch (error) {
      setCreateError(
        error instanceof Error ? error.message : "Fehler bei der Verarbeitung"
      );
    } finally {
      setCreating(false);
    }
  };

  const handlePaymentSuccess = async () => {
    // Confirm voucher with server
    if (!clientSecret || !voucherId) return;

    try {
      const res = await fetch("/api/vouchers/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payment_intent_id: clientSecret.split("_secret_")[0],
          voucher_id: voucherId,
        }),
      });

      if (res.ok) {
        setStep("browse"); // Reset for next purchase
        // Redirect will happen from Stripe success page
      }
    } catch (error) {
      console.error("[Vouchers] confirmation error:", error);
    }
  };

  // Step 1: Browse salons
  if (step === "browse") {
    return (
      <div className="min-h-screen bg-white py-12 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-[16px] flex items-center justify-center bg-s-coral/10">
                <Gift size={24} className="text-s-coral" />
              </div>
              <div>
                <h1 className="font-heading text-2xl text-s-ink">
                  {t("title")}
                </h1>
                <p className="text-sm text-s-ink/50 mt-0.5">
                  {t("subtitle")}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-s-ink/30" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="w-full pl-10 pr-4 py-3 rounded-[12px] border border-s-ink/[0.08] bg-white text-sm placeholder:text-s-ink/35 focus:border-s-coral focus:ring-2 focus:ring-s-coral/15 outline-none"
            />
          </div>

          {/* Salons grid */}
          {loadingSalons ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : filteredSalons.length === 0 ? (
            <div className="text-center py-12">
              <Gift className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm text-s-ink/40">
                {t("noSalons")}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredSalons.map((salon) => (
                <motion.button
                  key={salon.id}
                  onClick={() => {
                    setSelectedSalon(salon);
                    setStep("configure");
                  }}
                  whileHover={{ y: -2 }}
                  className="p-4 rounded-[12px] border border-s-ink/[0.06] bg-white hover:shadow-elevation-2 transition-[background-color] duration-150 text-left"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-heading text-sm text-s-ink">
                        {locale === "en" ? salon.name_en : salon.name_de}
                      </p>
                      <p className="text-xs text-s-ink/50 mt-1">
                        {t("selectToGift")}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-s-ink/20" />
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Step 2: Configure voucher
  if (step === "configure" && selectedSalon) {
    return (
      <div className="min-h-screen bg-white py-12 px-4">
        <div className="max-w-lg mx-auto">
          {/* Back button */}
          <button
            onClick={() => setStep("browse")}
            className="mb-6 text-[10px] font-heading uppercase tracking-[.10em] text-s-ink/30 hover:text-s-coral transition-colors flex items-center gap-1.5"
          >
            <ChevronRight size={12} className="rotate-180" />
            {t("backToSalons")}
          </button>

          <motion.form
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onSubmit={handleConfigureVoucher}
            className="bg-white rounded-[16px] border border-s-ink/[0.06] p-6 space-y-4"
          >
            <h2 className="font-heading text-lg text-s-ink">
              {t("configure.title")}
            </h2>
            <p className="text-sm text-s-ink/50">
              {locale === "en" ? selectedSalon.name_en : selectedSalon.name_de}
            </p>

            {/* Amount selection */}
            <div>
              <label className="text-xs font-medium text-s-ink/60 mb-2 block">
                {t("configure.amount")}
              </label>
              <div className="flex gap-2 mb-3">
                {[25, 50, 100, 150].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAmount(preset)}
                    className={`px-3 py-2 rounded-pill text-xs font-heading uppercase tracking-[.06em] transition-colors ${
                      amount === preset
                        ? "bg-s-coral text-white"
                        : "bg-s-bg-sunken text-s-ink/60 hover:bg-s-ink/5:bg-white/15"
                    }`}
                  >
                    CHF {preset}
                  </button>
                ))}
              </div>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                min={10}
                max={999}
                className="w-full px-4 py-3 rounded-[10px] border border-s-ink/[0.08] bg-white text-sm text-s-ink focus:border-s-coral focus:ring-2 focus:ring-s-coral/15 outline-none"
              />
            </div>

            {/* Recipient details */}
            <div>
              <label className="text-xs font-medium text-s-ink/60 mb-2 block">
                {t("configure.recipientName")}
              </label>
              <input
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-[10px] border border-s-ink/[0.08] bg-white text-sm text-s-ink placeholder:text-s-ink/25 focus:border-s-coral focus:ring-2 focus:ring-s-coral/15 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-s-ink/60 mb-2 block">
                {t("configure.recipientEmail")}
              </label>
              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-[10px] border border-s-ink/[0.08] bg-white text-sm text-s-ink placeholder:text-s-ink/25 focus:border-s-coral focus:ring-2 focus:ring-s-coral/15 outline-none"
              />
            </div>

            {/* Message */}
            <div>
              <label className="text-xs font-medium text-s-ink/60 mb-2 block">
                {t("configure.message")} <span className="text-s-ink/30">({t("optional")})</span>
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={200}
                placeholder={t("configure.messagePlaceholder")}
                className="w-full px-4 py-3 rounded-[10px] border border-s-ink/[0.08] bg-white text-sm text-s-ink placeholder:text-s-ink/25 focus:border-s-coral focus:ring-2 focus:ring-s-coral/15 outline-none resize-none h-20"
              />
              <p className="text-[9px] text-s-ink/30 mt-1">
                {message.length}/200
              </p>
            </div>

            {createError && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-[10px] border border-s-coral/20"
                style={{ background: "rgba(27, 77, 27,.06)" }}>
                <AlertCircle size={13} className="text-s-coral shrink-0" />
                <p className="text-xs font-body text-s-coral">{createError}</p>
              </div>
            )}

            {/* CTA and summary */}
            <div className="pt-4 border-t border-s-ink/[0.06]">
              <div className="flex justify-between mb-4">
                <span className="text-sm text-s-ink/60">{t("configure.total")}</span>
                <span className="font-heading text-xl text-s-coral">
                  {formatCurrency(amount, locale)}
                </span>
              </div>

              <InteractiveHoverButton
                type="submit"
                disabled={creating || !recipientName || !recipientEmail}
                text={creating ? "Lädt..." : t("configure.continue")}
                className="w-full py-3.5 rounded-btn text-[11px] font-heading uppercase tracking-[.06em] shadow-elevation-2 disabled:opacity-60"
              />
            </div>
          </motion.form>
        </div>
      </div>
    );
  }

  // Step 3: Payment
  if (step === "payment" && clientSecret && selectedSalon) {
    return (
      <Elements stripe={stripePromise} options={{ clientSecret }}>
        <div className="min-h-screen bg-white py-12 px-4">
          <div className="max-w-lg mx-auto">
            <h2 className="font-heading text-2xl text-s-ink mb-2">
              {t("payment.title")}
            </h2>
            <p className="text-sm text-s-ink/50 mb-6">
              {locale === "en" ? selectedSalon.name_en : selectedSalon.name_de} · {formatCurrency(amount, locale)}
            </p>

            <div className="bg-white rounded-[12px] border border-s-ink/[0.06] p-6">
              <VoucherPaymentForm
                clientSecret={clientSecret}
                onSuccess={handlePaymentSuccess}
              />
            </div>
          </div>
        </div>
      </Elements>
    );
  }

  return null;
}
