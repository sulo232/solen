"use client";

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Lock, AlertCircle } from "lucide-react";
import Spinner from "@/components-legacy/ui/Spinner";
import { formatPrice } from "@/lib/format";

/**
 * BookingPaymentForm — C1 online-pay card step (mockup
 * public/solen-booking-payflow-states.html states 1 form / 2 processing /
 * 3 3-D-Secure [Stripe's own modal] / 5 declined). State 4 "confirmed" is the
 * /confirmation page the parent routes to on success — this form never asserts
 * "paid" itself: the payment_intent.succeeded webhook is the source of truth.
 *
 * STRIPE SETUP is reused verbatim from WalkInPaymentForm: the same loadStripe
 * platform-publishable-key singleton + the same <Elements> appearance/fonts
 * recipe (theme "flat", Inter loaded into the iframe, ink colorPrimary). The
 * ONE behavioural difference vs walk-in: this booking PI is automatic-capture
 * (full prepay), so success is "succeeded" | "processing" (not the walk-in
 * manual-capture "requires_capture"), and we pass confirmParams.return_url so a
 * redirect-based 3-D Secure challenge can return here.
 */

// Singleton — loadStripe must run once, outside render. Platform publishable key:
// the booking PaymentIntent is a destination charge (transfer_data) on the platform
// account, so no `stripeAccount` option is needed (same as WalkInPaymentForm).
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "");

// Payment-error copy, keyed by locale (mirrors WalkInPaymentForm's inline dict).
// `failed` = generic decline / 3-D Secure abandoned; `notConfirmed` = unexpected PI status.
const PAY_COPY: Record<
  string,
  { pay: string; processing: string; processingHint: string; secure: string; failed: string; notConfirmed: string }
> = {
  de: {
    pay: "bezahlen",
    processing: "Zahlung wird bestätigt…",
    processingHint: "Einen Moment — Ihre Karte wird sicher belastet. Schliessen Sie die App nicht.",
    secure: "Sichere Zahlung über Stripe.",
    failed: "Ihre Karte wurde abgelehnt. Es wurde nichts belastet.",
    notConfirmed: "Zahlung nicht bestätigt. Es wurde nichts belastet.",
  },
  en: {
    pay: "Pay",
    processing: "Confirming payment…",
    processingHint: "One moment — your card is being charged securely. Don't close the app.",
    secure: "Secure payment via Stripe.",
    failed: "Your card was declined. Nothing was charged.",
    notConfirmed: "Payment not confirmed. Nothing was charged.",
  },
  fr: {
    pay: "Payer",
    processing: "Confirmation du paiement…",
    processingHint: "Un instant — votre carte est débitée en toute sécurité. Ne fermez pas l'application.",
    secure: "Paiement sécurisé via Stripe.",
    failed: "Votre carte a été refusée. Rien n'a été débité.",
    notConfirmed: "Paiement non confirmé. Rien n'a été débité.",
  },
  it: {
    pay: "Paga",
    processing: "Conferma del pagamento…",
    processingHint: "Un attimo — la tua carta viene addebitata in sicurezza. Non chiudere l'app.",
    secure: "Pagamento sicuro con Stripe.",
    failed: "La tua carta è stata rifiutata. Non è stato addebitato nulla.",
    notConfirmed: "Pagamento non confermato. Non è stato addebitato nulla.",
  },
};

interface BookingPaymentFormProps {
  clientSecret: string;
  /** CHF gross (incl. VAT) — display only; the server is the source of truth for the charged amount. */
  amount: number;
  locale: string;
  localeCode: string;
  /** Absolute return_url Stripe redirects to if the bank challenge needs a full redirect. */
  returnUrl: string;
  /** Fired once Stripe reports succeeded|processing — parent routes to /confirmation (webhook owns "paid"). */
  onSucceeded: () => void;
  /** "Andere Zahlungsart" — drop back to the payment-method selector. */
  onUseOtherMethod: () => void;
}

// Inner form — must be a child of <Elements> to use the Stripe hooks. It still needs
// clientSecret for confirmPayment (the Elements provider holds it too, but confirmPayment
// is explicit here to match the walk-in/upcharge pattern).
function PayInner({
  clientSecret,
  amount,
  locale,
  localeCode,
  returnUrl,
  onSucceeded,
  onUseOtherMethod,
}: BookingPaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  // "processing" = confirmPayment in flight (mockup state 2). During 3-D Secure
  // Stripe paints its own bank modal OVER this; we just stay in "processing".
  const [processing, setProcessing] = useState(false);
  const [declined, setDeclined] = useState<string | null>(null);
  const c = PAY_COPY[locale] ?? PAY_COPY.de;

  const handlePay = async () => {
    if (!stripe || !elements) return;
    setProcessing(true);
    setDeclined(null);
    try {
      const { error: submitErr } = await elements.submit();
      if (submitErr) {
        // Card-field validation failed locally — surface Stripe's localized message, stay on the form.
        console.error("[BookingPaymentForm] elements.submit failed:", submitErr.message);
        setDeclined(submitErr.message ?? c.failed);
        setProcessing(false);
        return;
      }
      // redirect:"if_required" keeps card + inline-3DS on-page; only a redirect-based
      // challenge leaves (and returns to return_url). Full-prepay PI → "succeeded" on
      // capture, or "processing" for async methods. NEVER write paid here — the webhook owns it.
      const { error: confirmErr, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: { return_url: returnUrl },
        redirect: "if_required",
      });
      if (confirmErr) {
        // Declined, expired, or the customer dismissed the bank challenge — nothing captured.
        console.error("[BookingPaymentForm] confirmPayment failed:", confirmErr.message);
        setDeclined(confirmErr.message ?? c.failed);
        setProcessing(false);
        return;
      }
      if (paymentIntent && (paymentIntent.status === "succeeded" || paymentIntent.status === "processing")) {
        // Hand off to the parent (route to /confirmation). Keep the spinner up through navigation.
        onSucceeded();
        return;
      }
      // Any other status (requires_payment_method etc.) — treat as not-confirmed, offer retry.
      console.error("[BookingPaymentForm] unexpected PaymentIntent status:", paymentIntent?.status);
      setDeclined(c.notConfirmed);
      setProcessing(false);
    } catch (err) {
      console.error("[BookingPaymentForm] confirm threw:", err);
      setDeclined(c.failed);
      setProcessing(false);
    }
  };

  const amountStr = formatPrice(amount, localeCode);

  // ── PROCESSING (mockup state 2) — full spinner, locked CTA. 3-D Secure paints over this. ──
  if (processing) {
    return (
      <div className="flex flex-col items-center px-2 py-6 text-center">
        <div className="mb-4 flex h-[62px] w-[62px] items-center justify-center rounded-full bg-s-bg-sunken">
          <Spinner size="lg" />
        </div>
        <p className="font-heading text-[18px] font-semibold tracking-[-0.02em] text-s-ink">{c.processing}</p>
        <p className="mt-1.5 max-w-[280px] text-[12.5px] leading-[1.5] text-s-ink-2">{c.processingHint}</p>
      </div>
    );
  }

  const payCta =
    locale === "de" ? `${amountStr} ${c.pay}` : `${c.pay} ${amountStr}`;

  return (
    <div className="space-y-4">
      <PaymentElement options={{ layout: "tabs" }} />

      {/* DECLINED (mockup state 5) — nothing charged, slot not reserved, retry inline. */}
      {declined && (
        <div role="alert" className="flex items-start gap-2 rounded-[10px] bg-s-error-bg px-3 py-2.5">
          <AlertCircle size={14} strokeWidth={1.6} className="mt-[1px] shrink-0 text-s-error" aria-hidden />
          <p className="font-body text-[12px] leading-[1.4] text-s-error">{declined}</p>
        </div>
      )}

      {/* Pay CTA stays INK (the booking commit), per the mockup + V3-D426. */}
      <button
        type="button"
        onClick={handlePay}
        disabled={!stripe || !elements}
        className="flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-s-ink font-body text-[14.5px] font-semibold text-white transition-[transform,filter] duration-150 hover:brightness-[1.06] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Lock size={16} strokeWidth={1.9} aria-hidden />
        {payCta}
      </button>

      {declined && (
        <button
          type="button"
          onClick={onUseOtherMethod}
          className="h-[44px] w-full rounded-full border border-s-border bg-transparent font-body text-[13.5px] font-semibold text-s-ink-2 transition-colors duration-150 hover:bg-s-bg-sunken"
        >
          {locale === "en"
            ? "Other payment method"
            : locale === "fr"
              ? "Autre moyen de paiement"
              : locale === "it"
                ? "Altro metodo di pagamento"
                : "Andere Zahlungsart"}
        </button>
      )}

      <div className="flex items-center justify-center gap-1.5 text-[12px] font-medium text-s-ink-2">
        <Lock size={12} aria-hidden />
        {c.secure}
      </div>
    </div>
  );
}

export default function BookingPaymentForm({ clientSecret, ...rest }: BookingPaymentFormProps) {
  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        // Load Inter INTO the Stripe iframe so the card fields match the app body font
        // (V3-D410). Identical to WalkInPaymentForm so both card surfaces read the same.
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
      <PayInner {...rest} clientSecret={clientSecret} />
    </Elements>
  );
}
