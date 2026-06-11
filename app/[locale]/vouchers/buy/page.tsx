"use client";

/**
 * Voucher Purchase Page
 * V3-D277 (W6, 2026-05-27): full retired-token sweep per LOCKFILE §1 — coral
 * gradients dropped, primary CTAs → bg-s-ink (§0.2), cream surface → bg-s-bg-sunken,
 * raw bg-red-50 → s-error-bg, focus rings → s-accent.
 *
 * Allows users to buy Gutscheine (platform or salon-specific) — Stripe Elements for payment.
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
import { SuccessMark } from "@/app/[locale]/_components/primitives/SuccessMark";
import { getPublicEnv } from "@/lib/env";

const publishableKey = getPublicEnv().NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey ? loadStripe(publishableKey) : Promise.resolve(null);

interface CheckoutFormProps {
  onSuccess: () => void;
}

function CheckoutForm({ onSuccess }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
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
      // Inline success (no /vouchers/success route — it 404'd). redirect:"if_required"
      // resolves a non-3DS charge here; a 3DS method returns to this URL and the webhook
      // (voucher-handler) finalizes server-side regardless.
      confirmParams: { return_url: window.location.href },
      redirect: "if_required",
    });

    if (error) {
      setErrorMessage(error.message || "Ein Fehler ist aufgetreten");
      setIsProcessing(false);
    } else {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />

      {errorMessage && (
        <div className="rounded-[12px] bg-s-error-bg px-4 py-3 text-sm text-s-error border border-s-error/20">
          {errorMessage}
        </div>
      )}

      {/* V3-D277 (W6): primary CTA — drop coral linear-gradient + rounded-pill, use bg-s-ink + rounded-btn per LOCKFILE §0 rule 2 + §3 */}
      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full rounded-btn bg-s-ink hover:brightness-[1.06] active:scale-[0.97] px-8 py-4 font-heading uppercase text-xs tracking-[.04em] text-white shadow-elevation-2 transition-[transform,filter] disabled:opacity-50 disabled:cursor-not-allowed"
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
  const [done, setDone] = useState(false);

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

  // Success (inline — payment confirmed). Mirrors the gift-card SuccessMark moment.
  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-s-bg-surface px-4">
        <div className="text-center max-w-sm">
          <SuccessMark size={58} className="mx-auto mb-4" />
          <h1
            className="celebrate-rise font-display text-[24px] font-semibold tracking-[-0.02em] text-s-ink mb-2"
            style={{ animationDelay: "0.46s" }}
          >
            Gutschein gekauft!
          </h1>
          <p
            className="celebrate-rise text-[14px] text-s-ink-2 mb-4"
            style={{ animationDelay: "0.56s" }}
          >
            {isGift ? `An ${recipientEmail} gesendet` : "Dein Gutschein ist bereit"}
          </p>
          {voucherCode && (
            <div
              className="celebrate-rise rounded-card p-4 border border-s-border bg-s-bg-surface shadow-float"
              style={{ animationDelay: "0.68s" }}
            >
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-s-ink-2 mb-1">Code</p>
              <p className="font-mono-code text-[20px] font-bold text-s-ink">{voucherCode}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    // V3-D277 (W6): retired s-cream → s-bg-sunken; H1 → LOCKFILE Page H2 spec
    <div className="min-h-screen bg-s-bg-sunken px-4 py-16">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-heading text-[clamp(22px,2.8vw,26px)] font-semibold leading-[1.0] tracking-[-0.03em] text-s-ink mb-2">
            Gutschein kaufen
          </h1>
          <p className="text-s-ink-2">
            Verschenke Schönheit — perfekt für jeden Anlass
          </p>
        </div>

        {!clientSecret ? (
          /* Step 1: Configure Voucher.
             V3-D277 (W6): retired coral selected → s-accent pale; icons coral → ink;
             cream input bg → sunken; form focus → s-accent. */
          <div className="rounded-card bg-white p-8 border border-s-border">
            {/* Discount Type Selector */}
            <div className="mb-6">
              <label className="block font-body text-[12px] font-bold uppercase tracking-[0.16em] text-s-ink-2 mb-3">
                Art des Gutscheins
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setDiscountType("fixed")}
                  className={`rounded-[12px] px-6 py-4 border-2 transition-[background-color,border-color,box-shadow] ${
                    discountType === "fixed"
                      ? "border-s-ink bg-s-bg-sunken"
                      : "border-s-border hover:border-s-ink"
                  }`}
                >
                  <CreditCard className="h-6 w-6 mx-auto mb-2 text-s-ink" />
                  <div className="font-heading text-xs uppercase tracking-[.04em] text-s-ink">
                    Fester Betrag
                  </div>
                  <div className="text-[12px] text-s-ink-2 mt-1">
                    z.B. CHF 50
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setDiscountType("percent")}
                  className={`rounded-[12px] px-6 py-4 border-2 transition-[background-color,border-color,box-shadow] ${
                    discountType === "percent"
                      ? "border-s-ink bg-s-bg-sunken"
                      : "border-s-border hover:border-s-ink"
                  }`}
                >
                  <Gift className="h-6 w-6 mx-auto mb-2 text-s-ink" />
                  <div className="font-heading text-xs uppercase tracking-[.04em] text-s-ink">
                    Prozent
                  </div>
                  <div className="text-[12px] text-s-ink-2 mt-1">
                    z.B. 20%
                  </div>
                </button>
              </div>
            </div>

            {/* Value Input */}
            <div className="mb-6">
              <label className="block font-body text-[12px] font-bold uppercase tracking-[0.16em] text-s-ink-2 mb-3">
                {discountType === "fixed" ? "Betrag in CHF" : "Prozent"}
              </label>
              <div className="relative">
                {discountType === "fixed" && (
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-heading text-s-ink">
                    CHF
                  </span>
                )}
                <input
                  type="number"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(Number(e.target.value))}
                  min={1}
                  max={discountType === "percent" ? 100 : 1000}
                  className={`w-full rounded-input bg-s-bg-sunken border border-s-border px-4 py-3 font-heading text-sm text-s-ink focus:outline-none focus:ring-2 focus:ring-s-accent/15 focus:border-s-accent ${
                    discountType === "fixed" ? "pl-16" : ""
                  }`}
                />
                {discountType === "percent" && (
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-heading text-s-ink">
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
                  className="w-5 h-5 rounded border-s-border text-s-accent focus:ring-s-accent/15"
                />
                <span className="font-heading uppercase text-[12px] tracking-[.06em] text-s-ink">
                  Als Geschenk versenden
                </span>
              </label>
            </div>

            {/* Recipient Email (if gift) */}
            {isGift && (
              <div className="mb-6">
                <label className="block font-body text-[12px] font-bold uppercase tracking-[0.16em] text-s-ink-2 mb-3">
                  <Mail className="inline h-3 w-3 mr-1" />
                  Empfänger E-Mail
                </label>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="beispiel@email.com"
                  className="w-full rounded-input bg-s-bg-sunken border border-s-border px-4 py-3 font-heading text-sm text-s-ink placeholder:text-s-ink-2 focus:outline-none focus:ring-2 focus:ring-s-accent/15 focus:border-s-accent"
                />
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mb-6 rounded-[12px] bg-s-error-bg px-4 py-3 text-sm text-s-error border border-s-error/20">
                {error}
              </div>
            )}

            {/* Primary CTA — V3-D277: drop coral gradient + rounded-pill, use bg-s-ink per LOCKFILE §0.2 */}
            <button
              onClick={handleCreateVoucher}
              disabled={loading || (isGift && !recipientEmail)}
              className="w-full rounded-btn bg-s-ink hover:brightness-[1.06] active:scale-[0.97] px-8 py-4 font-heading uppercase text-xs tracking-[.04em] text-white shadow-elevation-2 transition-[transform,filter] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Wird erstellt..." : "Weiter zur Zahlung"}
            </button>
          </div>
        ) : (
          /* Step 2: Payment — h2 to Section H2 spec; voucher code = data (ink, not accent) */
          <div className="rounded-card bg-white p-8 border border-s-border">
            <div className="mb-6">
              <h2 className="font-heading text-[clamp(18px,2vw,20px)] font-semibold leading-[1.2] tracking-[-0.02em] text-s-ink mb-2">
                Zahlung
              </h2>
              <p className="text-sm text-s-ink-2">
                Dein Gutschein-Code: <span className="font-heading text-s-ink">{voucherCode}</span>
              </p>
            </div>

            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <CheckoutForm onSuccess={() => setDone(true)} />
            </Elements>
          </div>
        )}
      </div>
    </div>
  );
}
