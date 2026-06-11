"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useParams } from "next/navigation";
import { Gift, Send, AlertCircle } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import Spinner from "@/components-legacy/ui/Spinner";
import { SuccessMark } from "@/app/[locale]/_components/primitives/SuccessMark";
import { formatCurrency } from "@/lib/format-currency";
import { getPublicEnv } from "@/lib/env";

const AMOUNT_PRESETS = [2500, 5000, 10000, 20000]; // in cents
const STRIPE_KEY = getPublicEnv().NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = STRIPE_KEY ? loadStripe(STRIPE_KEY) : null;

// Stripe payment form — mirrors PackagePaymentForm in the packages page.
// V3-D (2026-06-09): gift-card purchase previously showed success + code WITHOUT
// charging (free gift cards). Now the purchase API returns a clientSecret and we
// confirm payment here; success (SuccessMark) only renders AFTER the charge.
function GiftCardPaymentForm({ onSuccess, onError }: { onSuccess: () => void; onError: (msg: string) => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.href },
      redirect: "if_required",
    });
    if (error) {
      console.error("[GiftCard] payment confirm failed:", error);
      onError(error.message ?? "Zahlung fehlgeschlagen");
      setSubmitting(false);
    } else {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {/* Primary CTA stays bg-s-ink per LOCKFILE §0 rule 2 */}
      <button
        type="submit"
        disabled={submitting || !stripe}
        className="w-full py-3 rounded-btn bg-s-ink text-white font-semibold text-sm hover:brightness-[1.06] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {submitting && <Spinner size="sm" invert />}
        Jetzt bezahlen
      </button>
    </form>
  );
}

export default function GiftCardPage() {
  const params = useParams()!;
  const slug = params.slug as string;
  const [salon, setSalon] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAmount, setSelectedAmount] = useState(5000);
  const [customAmount, setCustomAmount] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [message, setMessage] = useState("");
  const [paying, setPaying] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [giftCode, setGiftCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/salons/by-slug/${slug}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) setSalon(d.salon ?? d); })
      .catch((err) => console.error("[GiftCard] failed to load salon:", err))
      .finally(() => setLoading(false));
  }, [slug]);

  const amount = useCustom ? Math.round(Number(customAmount) * 100) : selectedAmount;

  // Step 1 — create the gift card (inactive) + a PaymentIntent. Does NOT mark success.
  const handlePurchase = async () => {
    if (amount < 500 || !recipientName.trim() || !recipientEmail.trim()) return;
    setPaying(true);
    setError(null);
    try {
      const res = await fetch("/api/gift-cards/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salon_id: salon.id,
          amount,
          recipient_name: recipientName.trim(),
          recipient_email: recipientEmail.trim(),
          message: message.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Fehler");
      if (!data.clientSecret) throw new Error(data.error ?? "Zahlung konnte nicht gestartet werden");
      setGiftCode(data.code);
      setClientSecret(data.clientSecret); // → render the payment step (no success yet)
    } catch (e) {
      console.error("[GiftCard] purchase failed:", e);
      setError(e instanceof Error ? e.message : "Fehler");
    } finally {
      setPaying(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white"><Spinner size="md" /></div>;
  if (!salon) return <div className="min-h-screen flex items-center justify-center bg-white"><p className="text-s-ink/30">Salon nicht gefunden</p></div>;

  // Step 3 — success (only after the charge confirms). Keeps the SuccessMark celebration.
  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-s-bg-surface px-4">
        <div className="text-center max-w-sm">
          <SuccessMark size={58} className="mx-auto mb-4" />
          <h1
            className="celebrate-rise font-display text-[24px] font-semibold tracking-[-0.02em] text-s-ink mb-2"
            style={{ animationDelay: "0.46s" }}
          >
            Geschenkkarte gesendet!
          </h1>
          <p
            className="celebrate-rise text-[14px] text-s-ink-2 mb-4"
            style={{ animationDelay: "0.56s" }}
          >
            {formatCurrency(amount / 100)} für {recipientName}
          </p>
          <div
            className="celebrate-rise rounded-card p-4 border border-s-border bg-s-bg-surface shadow-float"
            style={{ animationDelay: "0.68s" }}
          >
            <p className="text-[12px] font-semibold text-s-ink-2 mb-1">Code</p>
            <p className="font-mono-code text-[20px] font-bold text-s-ink">{giftCode}</p>
          </div>
        </div>
      </div>
    );
  }

  // Step 2 — payment. Real Stripe Elements; success is gated on the charge.
  if (clientSecret) {
    return (
      <div className="min-h-screen bg-white py-8 px-4">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-6">
            <Gift size={32} className="text-s-ink-3 mx-auto mb-2" />
            <h1 className="font-heading text-[clamp(18px,2vw,20px)] font-semibold leading-[1.2] tracking-[-0.02em] text-s-ink">Bezahlung</h1>
            <p className="text-sm text-s-ink-2">{formatCurrency(amount / 100)} für {recipientName}</p>
          </div>
          <div className="bg-white rounded-[16px] shadow-elevation-1 p-5">
            {error && (
              <p className="text-xs text-s-error mb-3 flex items-center gap-1">
                <AlertCircle size={13} /> {error}
              </p>
            )}
            {stripePromise ? (
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <GiftCardPaymentForm onSuccess={() => setDone(true)} onError={setError} />
              </Elements>
            ) : (
              <p className="text-xs text-s-error">Zahlung ist momentan nicht verfügbar.</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-8 px-4">
      <div className="max-w-md mx-auto">
        {/* V3-D337 (T5): Gift icon decorative accent → ink-3 per §1.5 forbidden. */}
        <div className="text-center mb-6">
          <Gift size={32} className="text-s-ink-3 mx-auto mb-2" />
          <h1 className="font-heading text-[clamp(18px,2vw,20px)] font-semibold leading-[1.2] tracking-[-0.02em] text-s-ink">Geschenkkarte</h1>
          <p className="text-sm text-s-ink-2">{salon.name}</p>
        </div>

        <div className="bg-white rounded-[16px] shadow-elevation-1 p-5 space-y-4">
          {/* Amount */}
          <div>
            <label className="text-xs font-medium text-s-ink-2 mb-2 block">Betrag</label>
            <div className="grid grid-cols-4 gap-2 mb-2">
              {AMOUNT_PRESETS.map((a) => (
                <button key={a} onClick={() => { setSelectedAmount(a); setUseCustom(false); }}
                  className={`py-2.5 rounded-btn text-[14px] font-semibold tabular-nums transition-colors ${!useCustom && selectedAmount === a ? "bg-s-ink text-white" : "border border-s-border text-s-ink hover:border-s-ink"}`}>
                  {(a / 100).toFixed(0)}
                </button>
              ))}
            </div>
            {/* Selected state = ink fill (twin of the presets); blue on button geometry is banned per §1.5 v3 */}
            <button onClick={() => setUseCustom(true)}
              className={`w-full py-2 rounded-btn text-[13px] font-semibold transition-colors ${useCustom ? "bg-s-ink text-white" : "border border-s-border text-s-ink-2 hover:border-s-ink"}`}>
              Eigener Betrag
            </button>
            {useCustom && (
              <div className="relative mt-2">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-s-ink-2">CHF</span>
                <input type="number" min="5" step="5" value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)} placeholder="0"
                  className="w-full pl-12 pr-3 py-2.5 rounded-btn border border-s-border bg-white text-sm text-s-ink focus:outline-none focus:border-s-accent data-text" />
              </div>
            )}
          </div>

          {/* Recipient */}
          <div>
            <label className="text-xs font-medium text-s-ink-2 mb-1 block">Empfänger *</label>
            <input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder="Name"
              className="w-full px-3 py-2 rounded-input border border-s-border bg-white text-sm text-s-ink focus:outline-none focus:border-s-accent mb-2" />
            <input type="email" value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} placeholder="E-Mail"
              className="w-full px-3 py-2 rounded-input border border-s-border bg-white text-sm text-s-ink focus:outline-none focus:border-s-accent" />
          </div>

          {/* Message */}
          <div>
            <label className="text-xs font-medium text-s-ink-2 mb-1 block">Persönliche Nachricht</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={2} placeholder="Optional…"
              className="w-full px-3 py-2 rounded-input border border-s-border bg-white text-sm text-s-ink focus:outline-none focus:border-s-accent resize-none" />
          </div>

          {/* Preview — mockup 14 (2026-06-11): a real gift-card visual (ink card, white type),
              replaces the grey box + tracked-uppercase VORSCHAU label (banned per drift A21). */}
          <div className="relative overflow-hidden rounded-[18px] bg-s-ink p-5 text-left">
            <Gift size={22} className="absolute right-4 top-4 text-white/50" />
            <p className="text-[11.5px] font-semibold text-white/60">Geschenkkarte, {salon.name}</p>
            <p className="mt-0.5 font-heading text-[32px] font-extrabold tracking-[-0.02em] text-white tabular-nums">{formatCurrency(amount / 100)}</p>
            {recipientName && <p className="mt-3 text-[13px] text-white/85">Für {recipientName}</p>}
            {message && <p className="mt-1 text-[12px] italic text-white/70">&quot;{message}&quot;</p>}
          </div>

          {error && <p className="text-xs text-s-error">{error}</p>}

          {/* Primary CTA — V3-D252 (W3): coral → ink per LOCKFILE §0 rule 2 (primary CTAs stay bg-s-ink) */}
          <button onClick={handlePurchase} disabled={paying || amount < 500 || !recipientName.trim() || !recipientEmail.trim()}
            className="w-full py-3 rounded-btn bg-s-ink text-white font-semibold text-sm hover:brightness-[1.06] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {paying ? <Spinner size="sm" invert /> : <Send size={14} />}
            Weiter zur Zahlung {formatCurrency(amount / 100)}
          </button>
        </div>
      </div>
    </div>
  );
}
