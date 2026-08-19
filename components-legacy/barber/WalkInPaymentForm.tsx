"use client";

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Lock, ArrowRight } from "lucide-react";
import Spinner from "@/components-legacy/ui/Spinner";
import { formatCurrency } from "@/lib/format-currency";

// Singleton — loadStripe must run once, outside render. Platform publishable key:
// destination charges (transfer_data) stay on the platform account, so no
// `stripeAccount` option is needed here.
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "");

interface WalkInPaymentFormProps {
  clientSecret: string;
  amount: number;
  locale: string;
  /** Called once Stripe confirms the payment is authorized (manual-capture hold). */
  onPaid: (paymentIntentId: string) => void;
  payLabel: string;
  secureLabel: string;
}

// Payment-error copy, keyed by locale (matches the inline-dict pattern on the pay page).
// `failed` is the generic payment failure; `notConfirmed` is the unexpected-PI-status case.
const PAY_ERRORS: Record<string, { failed: string; notConfirmed: string }> = {
  de: { failed: "Zahlung fehlgeschlagen", notConfirmed: "Zahlung nicht bestätigt" },
  en: { failed: "Payment failed", notConfirmed: "Payment not confirmed" },
  fr: { failed: "Échec du paiement", notConfirmed: "Paiement non confirmé" },
  it: { failed: "Pagamento non riuscito", notConfirmed: "Pagamento non confermato" },
};

// Inner form — must be a child of <Elements> to use the Stripe hooks.
function PayInner({ amount, locale, onPaid, payLabel, secureLabel }: Omit<WalkInPaymentFormProps, "clientSecret">) {
  const stripe = useStripe();
  const elements = useElements();
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const e = PAY_ERRORS[locale] ?? PAY_ERRORS.de;

  const handlePay = async () => {
    if (!stripe || !elements) return;
    setPaying(true);
    setError(null);
    try {
      const { error: submitErr } = await elements.submit();
      if (submitErr) {
        // Stripe localizes its own validation messages via the Elements `locale`; fall back to ours.
        setError(submitErr.message ?? e.failed);
        return;
      }
      // redirect: "if_required" keeps card payments on-page; only redirect-based
      // methods (e.g. TWINT) leave. Manual-capture intent → "requires_capture" on success.
      const { error: confirmErr, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
      });
      if (confirmErr) {
        setError(confirmErr.message ?? e.failed);
        return;
      }
      if (paymentIntent && (paymentIntent.status === "requires_capture" || paymentIntent.status === "succeeded")) {
        onPaid(paymentIntent.id);
      } else {
        setError(e.notConfirmed);
      }
    } catch (err) {
      console.error("[WalkInPaymentForm] confirm failed:", err);
      setError(e.failed);
    } finally {
      setPaying(false);
    }
  };

  const amountStr = formatCurrency(amount, locale);
  const cta = locale === "en" ? `Pay ${amountStr}` : locale === "fr" ? `Payer ${amountStr}` : locale === "it" ? `Paga ${amountStr}` : `${amountStr} ${payLabel}`;

  return (
    <div className="space-y-4">
      <PaymentElement options={{ layout: "tabs" }} />
      {error && <p className="text-xs text-s-error">{error}</p>}
      <button
        onClick={handlePay}
        disabled={!stripe || paying}
        className="group flex h-[52px] w-full items-center justify-center gap-2 rounded-btn bg-s-ink font-body text-[15px] font-semibold text-white shadow-elevation-2 transition-[transform,filter] hover:brightness-[1.06] active:scale-[0.98] disabled:opacity-50"
      >
        {cta}
        {paying ? <Spinner size="sm" invert /> : <ArrowRight size={16} strokeWidth={1.9} className="transition-transform duration-200 ease-glide group-hover:translate-x-0.5" />}
      </button>
      <div className="flex items-center justify-center gap-1.5 text-[12px] font-medium text-s-ink-2">
        <Lock size={12} />
        {secureLabel}
      </div>
    </div>
  );
}

export default function WalkInPaymentForm({ clientSecret, ...rest }: WalkInPaymentFormProps) {
  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        // Load Inter INTO the Stripe iframe so the card fields match the app body font
        // (V3-D410: app body is Inter). Without this, Stripe falls back to system-ui and
        // the card form looks foreign next to the rest of the page.
        fonts: [{ cssSrc: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" }],
        appearance: {
          theme: "flat",
          variables: {
            colorPrimary: "#0A0A0A",
            colorText: "#0A0A0A",
            colorDanger: "#DC2626",
            fontFamily: "'Inter', system-ui, sans-serif",
            borderRadius: "12px",
            spacingUnit: "4px",
          },
        },
      }}
    >
      <PayInner {...rest} />
    </Elements>
  );
}
