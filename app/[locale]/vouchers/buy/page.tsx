"use client";

/**
 * Voucher Purchase Page
 * Zone 3: Clean Functional (No glass, coral CTAs, structured inputs)
 *
 * Allows users to buy Gutscheine (platform or salon-specific)
 * Uses Stripe Elements for secure payment processing
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Gift, CreditCard, Mail } from "lucide-react";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

interface CheckoutFormProps {
  clientSecret: string;
  voucherCode: string;
}

function CheckoutForm({ clientSecret, voucherCode }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const t = useTranslations("vouchers") as any;
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/vouchers/success?code=${voucherCode}`,
      },
    });

    if (error) {
      setErrorMessage(error.message || "Ein Fehler ist aufgetreten");
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />

      {errorMessage && (
        <div className="rounded-[12px] bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800">
          {errorMessage}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full rounded-pill bg-s-coral hover:brightness-[1.06] active:scale-[0.97] px-8 py-4 font-heading font-bold uppercase text-xs tracking-[.04em] text-white shadow-coral-glow transition-[transform,filter] disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          background: "linear-gradient(135deg, #C05038 0%, #D4870A 100%)",
        }}
      >
        {isProcessing ? "Wird verarbeitet..." : "Gutschein kaufen"}
      </button>
    </form>
  );
}

export default function VoucherBuyPage() {
  const router = useRouter();
  const t = useTranslations("vouchers") as any;
  const [discountType, setDiscountType] = useState<"fixed" | "percent">("fixed");
  const [discountValue, setDiscountValue] = useState<number>(50);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [isGift, setIsGift] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [voucherCode, setVoucherCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Optional user profile — vouchers work for guests too
  const [user, setUser] = useState<{ id: string; email?: string; name?: string } | null>(null);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => {
        if (!r.ok) return null;
        return r.json();
      })
      .then((p) => {
        if (p?.id) setUser(p);
      })
      .catch((err) => console.error("[VoucherBuy] Profile fetch error:", err));
  }, []);

  const handleCreateVoucher = async () => {
    if (discountValue <= 0) {
      setError("Bitte gib einen gültigen Betrag ein");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/vouchers/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          discountType,
          discountValue,
          recipientEmail: isGift ? recipientEmail : undefined,
          customerId: user?.id ?? null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Fehler beim Erstellen des Gutscheins");
      }

      const data = await response.json();
      setClientSecret(data.clientSecret);
      setVoucherCode(data.voucherCode);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-s-cream dark:bg-s-dm-bg px-4 py-16">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-heading font-bold text-4xl text-s-ink dark:text-s-dm-text mb-2">
            Gutschein kaufen
          </h1>
          <p className="text-s-ink/70 dark:text-s-dm-text/70">
            Verschenke Schönheit — perfekt für jeden Anlass
          </p>
        </div>

        {!clientSecret ? (
          /* Step 1: Configure Voucher */
          <div className="rounded-card bg-white dark:bg-s-dm-surface p-8 shadow-v5-float">
            {/* Discount Type Selector */}
            <div className="mb-6">
              <label className="block font-heading uppercase text-[9px] tracking-[.20em] text-s-ink/60 dark:text-s-dm-text/60 mb-3">
                Art des Gutscheins
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setDiscountType("fixed")}
                  className={`rounded-[12px] px-6 py-4 border-2 transition-[background-color,border-color,box-shadow] ${
                    discountType === "fixed"
                      ? "border-s-coral bg-s-coral/5 dark:bg-s-coral/10 shadow-coral-glow"
                      : "border-s-ink/[0.08] dark:border-white/10 hover:border-s-ink/20"
                  }`}
                >
                  <CreditCard className="h-6 w-6 mx-auto mb-2 text-s-coral" />
                  <div className="font-heading font-bold text-xs uppercase tracking-[.04em] text-s-ink dark:text-s-dm-text">
                    Fester Betrag
                  </div>
                  <div className="text-[10px] text-s-ink/60 dark:text-s-dm-text/60 mt-1">
                    z.B. CHF 50
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setDiscountType("percent")}
                  className={`rounded-[12px] px-6 py-4 border-2 transition-[background-color,border-color,box-shadow] ${
                    discountType === "percent"
                      ? "border-s-coral bg-s-coral/5 dark:bg-s-coral/10 shadow-coral-glow"
                      : "border-s-ink/[0.08] dark:border-white/10 hover:border-s-ink/20"
                  }`}
                >
                  <Gift className="h-6 w-6 mx-auto mb-2 text-s-coral" />
                  <div className="font-heading font-bold text-xs uppercase tracking-[.04em] text-s-ink dark:text-s-dm-text">
                    Prozent
                  </div>
                  <div className="text-[10px] text-s-ink/60 dark:text-s-dm-text/60 mt-1">
                    z.B. 20%
                  </div>
                </button>
              </div>
            </div>

            {/* Value Input */}
            <div className="mb-6">
              <label className="block font-heading uppercase text-[9px] tracking-[.20em] text-s-ink/60 dark:text-s-dm-text/60 mb-3">
                {discountType === "fixed" ? "Betrag in CHF" : "Prozent"}
              </label>
              <div className="relative">
                {discountType === "fixed" && (
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-heading font-bold text-s-ink dark:text-s-dm-text">
                    CHF
                  </span>
                )}
                <input
                  type="number"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(Number(e.target.value))}
                  min={1}
                  max={discountType === "percent" ? 100 : 1000}
                  className={`w-full rounded-[10px] bg-s-cream dark:bg-s-dm-bg border border-s-ink/[0.08] dark:border-white/10 px-4 py-3 font-heading text-sm text-s-ink dark:text-s-dm-text focus:outline-none focus:ring-2 focus:ring-s-coral/15 ${
                    discountType === "fixed" ? "pl-16" : ""
                  }`}
                />
                {discountType === "percent" && (
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-heading font-bold text-s-ink dark:text-s-dm-text">
                    %
                  </span>
                )}
              </div>
            </div>

            {/* Gift Toggle */}
            <div className="mb-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isGift}
                  onChange={(e) => setIsGift(e.target.checked)}
                  className="w-5 h-5 rounded border-s-ink/20 text-s-coral focus:ring-s-coral/15"
                />
                <span className="font-heading font-bold uppercase text-[10px] tracking-[.06em] text-s-ink dark:text-s-dm-text">
                  Als Geschenk versenden
                </span>
              </label>
            </div>

            {/* Recipient Email (if gift) */}
            {isGift && (
              <div className="mb-6">
                <label className="block font-heading uppercase text-[9px] tracking-[.20em] text-s-ink/60 dark:text-s-dm-text/60 mb-3">
                  <Mail className="inline h-3 w-3 mr-1" />
                  Empfänger E-Mail
                </label>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="beispiel@email.com"
                  className="w-full rounded-[10px] bg-s-cream dark:bg-s-dm-bg border border-s-ink/[0.08] dark:border-white/10 px-4 py-3 font-heading text-sm text-s-ink dark:text-s-dm-text placeholder:text-s-ink/30 dark:placeholder:text-s-dm-text/30 focus:outline-none focus:ring-2 focus:ring-s-coral/15"
                />
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mb-6 rounded-[12px] bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800">
                {error}
              </div>
            )}

            {/* CTA */}
            <button
              onClick={handleCreateVoucher}
              disabled={loading || (isGift && !recipientEmail)}
              className="w-full rounded-pill bg-s-coral hover:brightness-[1.06] active:scale-[0.97] px-8 py-4 font-heading font-bold uppercase text-xs tracking-[.04em] text-white shadow-coral-glow transition-[transform,filter] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: "linear-gradient(135deg, #C05038 0%, #D4870A 100%)",
              }}
            >
              {loading ? "Wird erstellt..." : "Weiter zur Zahlung"}
            </button>
          </div>
        ) : (
          /* Step 2: Payment */
          <div className="rounded-card bg-white dark:bg-s-dm-surface p-8 shadow-v5-float">
            <div className="mb-6">
              <h2 className="font-heading font-bold text-xl text-s-ink dark:text-s-dm-text mb-2">
                Zahlung
              </h2>
              <p className="text-sm text-s-ink/70 dark:text-s-dm-text/70">
                Dein Gutschein-Code: <span className="font-heading font-bold text-s-coral">{voucherCode}</span>
              </p>
            </div>

            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <CheckoutForm clientSecret={clientSecret} voucherCode={voucherCode!} />
            </Elements>
          </div>
        )}
      </div>
    </div>
  );
}
