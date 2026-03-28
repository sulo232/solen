"use client";

import React, { useEffect, useState } from "react";
import { Loader2, Plus, CreditCard, Trash2 } from "lucide-react";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import GlassModal from "@/components/ui/GlassModal";
import { useTranslations } from "next-intl";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
}

function AddCardForm({ clientSecret, onSuccess, onCancel }: { clientSecret: string; onSuccess: () => void; onCancel: () => void }) {
  const t = useTranslations("paymentMethods") as any;
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setError(null);

    const { error: setupError } = await stripe.confirmSetup({
      elements,
      confirmParams: {
        return_url: window.location.href, // Required even with redirect: "if_required", but not always redirected
      },
      redirect: "if_required",
    });

    if (setupError) {
      setError(setupError.message ?? "Fehler beim Hinzufügen der Karte.");
      setProcessing(false);
    } else {
      // success
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement options={{ layout: "tabs" }} />
      {error && <div className="text-s-error text-xs">{error}</div>}
      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={processing}
          className="px-4 py-2 text-sm text-s-ink/60 dark:text-s-dm-text/60 disabled:opacity-50"
        >
          {t("cancel")}
        </button>
        <button
          type="submit"
          disabled={!stripe || processing}
          className="px-5 py-2 rounded-btn bg-s-coral text-white text-sm font-medium flex items-center gap-2 disabled:opacity-50"
        >
          {processing ? <Loader2 size={16} className="animate-spin" /> : t("save")}
        </button>
      </div>
    </form>
  );
}

export function PaymentMethodsSection() {
  const t = useTranslations("paymentMethods") as any;
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const fetchMethods = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/payment-methods");
      if (!res.ok) { setLoading(false); return; }
      const data = await res.json();
      setMethods(data.methods ?? []);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMethods();
  }, []);

  const handleAddClick = async () => {
    setShowAddForm(true);
    setClientSecret(null);
    try {
      const res = await fetch("/api/stripe/payment-methods", { method: "POST" });
      if (!res.ok) { setShowAddForm(false); return; }
      const data = await res.json();
      if (data.client_secret) setClientSecret(data.client_secret);
    } catch {
      setShowAddForm(false);
    }
  };

  const handleSuccess = () => {
    setShowAddForm(false);
    setClientSecret(null);
    fetchMethods();
  };

  // Static options that are currently disabled
  const disabledOptions = [
    { label: "TWINT", sub: "Direkte Zahlung", icon: "🟢" },
    { label: "Apple Pay", sub: "iOS & Safari", icon: "🍎" },
    { label: "Google Pay", sub: "Android & Chrome", icon: "🔵" },
  ];

  return (
    <div className="pt-4 border-t border-s-ink/5 dark:border-white/10 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[9px] font-heading font-bold uppercase tracking-[.14em] text-s-ink/30 dark:text-s-dm-text/30">
          {t("title")}
        </p>
        <button
          onClick={handleAddClick}
          className="text-xs font-heading font-bold text-s-coral uppercase tracking-[.04em] flex items-center gap-1"
          aria-label={t("add")}
        >
          <Plus size={12} /> {t("add")}
        </button>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 size={24} className="animate-spin text-s-ink/30" />
          </div>
        ) : methods.length > 0 ? (
          methods.map((m) => (
            <div
              key={m.id}
              className="flex items-center gap-3 px-4 py-3 rounded-[12px] border border-s-ink/[0.06] dark:border-white/[0.06] bg-[--raised] dark:bg-s-dm-surface"
            >
              <CreditCard size={20} className="text-s-ink/30 dark:text-s-dm-text/30 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-heading font-medium text-s-ink dark:text-s-dm-text">
                  {t("cardEndingIn", { last4: m.last4 })}
                </p>
                <p className="text-xs text-s-ink/40 dark:text-s-dm-text/40 mt-0.5 capitalize">
                  {m.brand} • {t("expires")} {m.exp_month}/{m.exp_year}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="flex items-center gap-3 px-4 py-3 rounded-[12px] border border-s-ink/[0.06] dark:border-white/[0.06] bg-[--raised] dark:bg-s-dm-surface">
            <CreditCard size={20} className="text-s-ink/30 dark:text-s-dm-text/30 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-heading font-medium text-s-ink dark:text-s-dm-text">{t("creditCard")}</p>
              <p className="text-xs text-s-ink/40 dark:text-s-dm-text/40 mt-0.5">{t("noCard")}</p>
            </div>
          </div>
        )}

        {disabledOptions.map(({ label, sub, icon }) => (
          <div
            key={label}
            className="flex items-center gap-3 px-4 py-3 rounded-[12px] border border-s-ink/[0.06] dark:border-white/[0.06] bg-[--raised] dark:bg-s-dm-surface opacity-60 grayscale"
          >
            <span className="text-lg">{icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-heading font-medium text-s-ink dark:text-s-dm-text">{label}</p>
              <p className="text-xs text-s-ink/40 dark:text-s-dm-text/40 mt-0.5">{sub}</p>
            </div>
            <span className="px-2 py-0.5 rounded-[6px] text-[9px] font-heading font-bold uppercase tracking-[.06em] bg-s-amber-subtle/30 text-s-amber">
              {t("comingSoon")}
            </span>
          </div>
        ))}
      </div>

      <GlassModal open={showAddForm} onClose={() => setShowAddForm(false)}>
        <div className="p-6">
          <h3 className="text-lg font-heading font-bold text-s-ink dark:text-s-dm-text mb-4">{t("addCard")}</h3>
          
          {!clientSecret ? (
            <div className="flex justify-center py-8">
              <Loader2 size={32} className="animate-spin text-s-ink/30" />
            </div>
          ) : (
            <Elements
              stripe={stripePromise}
              options={{ clientSecret, appearance: { theme: 'stripe' } }}
            >
              <AddCardForm
                clientSecret={clientSecret}
                onSuccess={handleSuccess}
                onCancel={() => setShowAddForm(false)}
              />
            </Elements>
          )}
        </div>
      </GlassModal>
    </div>
  );
}
