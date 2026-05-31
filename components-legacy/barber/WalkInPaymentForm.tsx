"use client";

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Lock } from "lucide-react";
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

// Inner form — must be a child of <Elements> to use the Stripe hooks.
function PayInner({ amount, locale, onPaid, payLabel, secureLabel }: Omit<WalkInPaymentFormProps, "clientSecret">) {
  const stripe = useStripe();
  const elements = useElements();
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePay = async () => {
    if (!stripe || !elements) return;
    setPaying(true);
    setError(null);
    try {
      const { error: submitErr } = await elements.submit();
      if (submitErr) {
        setError(submitErr.message ?? "Zahlung fehlgeschlagen");
        return;
      }
      // redirect: "if_required" keeps card payments on-page; only redirect-based
      // methods (e.g. TWINT) leave. Manual-capture intent → "requires_capture" on success.
      const { error: confirmErr, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
      });
      if (confirmErr) {
        setError(confirmErr.message ?? "Zahlung fehlgeschlagen");
        return;
      }
      if (paymentIntent && (paymentIntent.status === "requires_capture" || paymentIntent.status === "succeeded")) {
        onPaid(paymentIntent.id);
      } else {
        setError("Zahlung nicht bestätigt");
      }
    } catch {
      setError("Zahlung fehlgeschlagen");
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
        className="flex h-[52px] w-full items-center justify-center gap-2 rounded-btn bg-s-ink font-heading text-[15px] text-white shadow-elevation-2 transition-[transform,filter] hover:brightness-[1.06] active:scale-[0.98] disabled:opacity-50"
      >
        {paying ? <Spinner size="sm" invert /> : <Lock size={15} />}
        {cta}
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
        // Load Hanken Grotesk INTO the Stripe iframe so the card fields match the app font.
        // Without this, Stripe can't see the self-hosted next/font and falls back to system-ui,
        // making the card form look foreign next to the rest of the page.
        fonts: [{ cssSrc: "https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700&display=swap" }],
        appearance: {
          theme: "flat",
          variables: {
            colorPrimary: "#0A0A0A",
            colorText: "#0A0A0A",
            colorDanger: "#D32F2F",
            fontFamily: "'Hanken Grotesk', system-ui, sans-serif",
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
