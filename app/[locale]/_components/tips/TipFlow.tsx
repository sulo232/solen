"use client";

// Shared SINGLE-SCREEN tip flow, powers booking (/tip/[bookingId]) + walk-in (/walk-in-tip/[token]).
// One screen, matching the approved mockup (variant B, no avatar ring): staff avatar + name,
// amount presets (blue selected), Stripe card field, green "100% to your stylist" pill, and a blue
// "CHF X Trinkgeld senden" button with the coins icon. The tip endpoints REUSE + UPDATE one
// PaymentIntent across amount changes, so clientSecret stays stable and the card field never remounts.

import { useEffect, useState } from "react";
import Image from "next/image";
import { Check, AlertCircle, CreditCard, Star } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { getPublicEnv } from "@/lib/env";
import Spinner from "@/components-legacy/ui/Spinner";

const STRIPE_KEY = getPublicEnv().NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = STRIPE_KEY ? loadStripe(STRIPE_KEY) : null;

// Swiss prefix format: "CHF 10", "CHF 12.50".
const chf = (rappen: number) =>
  Number.isFinite(rappen)
    ? `CHF ${(rappen / 100).toLocaleString("de-CH", { minimumFractionDigits: rappen % 100 === 0 ? 0 : 2, maximumFractionDigits: 2 })}`
    : "CHF 0";

type Copy = Record<string, string>;
const COPY: Record<string, Copy> = {
  de: { choose: "Betrag wählen", custom: "Eigener", send: "Trinkgeld senden", to100: "100% geht an deinen Coiffeur", thanks: "Danke!", sent: "gesendet", sub: "freut sich. Schönen Tag!", err: "Etwas ist schiefgelaufen. Bitte erneut versuchen." },
  en: { choose: "Choose an amount", custom: "Custom", send: "Send tip", to100: "100% goes to your stylist", thanks: "Thank you!", sent: "sent", sub: "appreciates it. Have a great day!", err: "Something went wrong. Please try again." },
  fr: { choose: "Choisir un montant", custom: "Autre", send: "Envoyer", to100: "100% va à votre coiffeur", thanks: "Merci !", sent: "envoyé", sub: "vous remercie. Bonne journée !", err: "Une erreur est survenue. Veuillez réessayer." },
  it: { choose: "Scegli un importo", custom: "Altro", send: "Invia", to100: "100% va al tuo parrucchiere", thanks: "Grazie!", sent: "inviata", sub: "ti ringrazia. Buona giornata!", err: "Qualcosa è andato storto. Riprova." },
};

export interface TipFlowProps {
  recipientName: string;
  recipientPhoto?: string | null;
  contextLine?: string;
  recipientRating?: number | null;
  recipientReviewCount?: number | null;
  locale: string;
  /** Creates OR updates the tip PaymentIntent for `amountRappen`; returns its clientSecret. */
  createIntent: (amountRappen: number) => Promise<{ clientSecret?: string; error?: string }>;
  presets?: number[];
  /** When rendered in a sheet: called to dismiss (the success state auto-closes after a beat). */
  onClose?: () => void;
  /** Preview only (?demo): render a placeholder card + send so the layout is visible without a live intent. */
  demo?: boolean;
}

// The send button lives inside <Elements> so it can confirm the card. It charges the PaymentIntent's
// server-side amount, which the parent keeps synced to `amount` (and disables send while syncing).
function SendButton({
  amount, label, disabled, errText, onSuccess, onError,
}: {
  amount: number; label: string; disabled: boolean; errText: string;
  onSuccess: () => void; onError: (m: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const submit = async () => {
    if (!stripe || !elements) return;
    setSubmitting(true);
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.href },
      redirect: "if_required",
    });
    if (error) {
      console.error("[TipFlow] confirmPayment failed:", error.message);
      onError(error.message ?? errText);
      setSubmitting(false);
    } else {
      onSuccess();
    }
  };
  return (
    <button
      type="button"
      onClick={submit}
      disabled={submitting || disabled || !stripe}
      className="mt-4 flex w-full items-center justify-center gap-2 rounded-btn bg-s-accent py-3.5 font-heading text-sm font-semibold text-white transition-[transform,filter] hover:brightness-[1.06] active:scale-[0.98] disabled:opacity-50"
    >
      {submitting && <Spinner size="sm" invert />}
      {chf(amount)} {label}
    </button>
  );
}

export default function TipFlow({
  recipientName, recipientPhoto, contextLine, recipientRating, recipientReviewCount, locale, createIntent, presets = [500, 1000, 1500], onClose, demo = false,
}: TipFlowProps) {
  const l = COPY[locale] ?? COPY.de;
  const [selected, setSelected] = useState(presets[1] ?? presets[0]);
  const [useCustom, setUseCustom] = useState(false);
  const [customValue, setCustomValue] = useState("");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loadingIntent, setLoadingIntent] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const amount = useCustom ? Math.round(Number(customValue) * 100) : selected;
  const initial = recipientName?.trim()?.charAt(0)?.toUpperCase() || "✂";

  // Create/refresh the PaymentIntent whenever the amount settles. The endpoint reuses + updates the
  // SAME intent → clientSecret stays stable → the Payment Element never remounts (card stays entered).
  // Send is disabled while this is in flight, so a confirm can never charge a stale amount.
  useEffect(() => {
    if (demo) {
      setLoadingIntent(false);
      return;
    }
    if (!amount || amount < 100) {
      setLoadingIntent(false);
      return;
    }
    let cancelled = false;
    setLoadingIntent(true);
    const t = setTimeout(
      () => {
        createIntent(amount)
          .then((res) => {
            if (cancelled) return;
            if (res.clientSecret) {
              setClientSecret(res.clientSecret);
              setError(null);
            } else {
              setError(res.error ?? l.err);
            }
          })
          .catch((e) => {
            if (!cancelled) {
              console.error("[TipFlow] createIntent failed:", e);
              setError(l.err);
            }
          })
          .finally(() => {
            if (!cancelled) setLoadingIntent(false);
          });
      },
      clientSecret ? 350 : 0, // first load immediate; later amount changes debounced
    );
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount]);

  // In a sheet: slide away a couple seconds after success so the user lands back on their ticket.
  useEffect(() => {
    if (done && onClose) {
      const t = setTimeout(onClose, 2200);
      return () => clearTimeout(t);
    }
  }, [done, onClose]);

  const Avatar = (
    <div className="relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-[#F0A868] to-[#C0524A] font-heading text-base font-semibold text-white">
      {recipientPhoto ? <Image src={recipientPhoto} alt="" fill className="object-cover" unoptimized /> : initial}
    </div>
  );

  if (done) {
    return (
      <div className="flex flex-col items-center px-6 py-12 text-center">
        <div className="mb-4 grid h-16 w-16 place-items-center rounded-full bg-s-success-bg">
          <Check size={30} className="text-s-success" />
        </div>
        <p className="mb-1.5 font-heading text-[10px] font-semibold uppercase tracking-[.2em] text-s-success">
          {chf(amount)} {l.sent}
        </p>
        <h1 className="font-heading text-[20px] font-semibold text-s-ink">{l.thanks}</h1>
        <p className="mt-1.5 max-w-[15rem] text-[13px] text-s-ink-2">{recipientName} {l.sub}</p>
      </div>
    );
  }

  return (
    <div className="px-5 pb-7 pt-2">
      {/* Recipient — name + service · salon + rating (uniform with the walk-in pay barber row) */}
        <div className="mb-6 flex items-center gap-3">
          {Avatar}
          <div className="min-w-0">
            <h1 className="truncate font-heading text-[17px] font-semibold leading-tight text-s-ink">{recipientName}</h1>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[13px] text-s-ink-2">
              {contextLine && <span className="truncate">{contextLine}</span>}
              {recipientRating != null && recipientRating > 0 && (
                <span className="flex shrink-0 items-center gap-1">
                  <Star size={12} stroke="none" aria-hidden className="fill-s-star" />
                  <span className="font-semibold tabular-nums text-s-ink">{recipientRating.toFixed(1)}</span>
                  {recipientReviewCount != null && <span className="tabular-nums">({recipientReviewCount})</span>}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Amount */}
        <p className="mb-3 font-heading text-[10px] font-semibold uppercase tracking-[.14em] text-s-accent">{l.choose}</p>
        <div className="grid grid-cols-2 gap-2.5">
          {presets.map((p) => {
            const sel = !useCustom && selected === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => { setSelected(p); setUseCustom(false); }}
                className={`rounded-[16px] border-2 py-4 text-center font-heading text-[17px] font-bold tabular-nums transition-colors ${
                  sel ? "border-s-accent bg-s-accent/[0.07] text-s-accent" : "border-s-border text-s-ink hover:border-s-ink/40"
                }`}
              >
                {chf(p)}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setUseCustom(true)}
            className={`rounded-[16px] border-2 py-4 text-center font-heading text-[15px] font-bold transition-colors ${
              useCustom ? "border-s-accent bg-s-accent/[0.07] text-s-accent" : "border-s-border text-s-ink hover:border-s-ink/40"
            }`}
          >
            {l.custom}
          </button>
        </div>

        {useCustom && (
          <div className="mt-2.5 flex items-center gap-2 rounded-[16px] border-2 border-s-accent bg-s-accent/[0.04] px-4 py-3.5">
            <span className="shrink-0 text-[15px] font-semibold text-s-ink-2">CHF</span>
            <input
              type="number" min="1" step="0.5" inputMode="decimal" autoFocus
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              placeholder="0.00"
              className="w-full bg-transparent text-[16px] tabular-nums text-s-ink placeholder:text-s-ink-3 focus:outline-none"
            />
          </div>
        )}

        {/* Card + 100% pill + send (single screen) */}
        {demo ? (
          <div className="mt-4">
            <div className="flex items-center gap-2.5 rounded-input border border-s-border bg-s-bg-sunken px-3.5 py-4 text-[13px] text-s-ink-2">
              <CreditCard size={18} className="shrink-0 text-s-ink" /> Karte | MM / JJ | CVC
            </div>
            <button
              type="button"
              onClick={() => setDone(true)}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-btn bg-s-accent py-3.5 font-heading text-sm font-semibold text-white transition-[transform,filter] hover:brightness-[1.06] active:scale-[0.98]"
            >
              {chf(amount)} {l.send}
            </button>
          </div>
        ) : clientSecret && stripePromise ? (
          <Elements key={clientSecret} stripe={stripePromise} options={{ clientSecret, appearance: { theme: "stripe", variables: { colorPrimary: "#276EF1", borderRadius: "12px" } } }}>
            <div className="mt-4">
              <PaymentElement />
              {error && (
                <div className="mt-3 flex items-start gap-1.5 rounded-input bg-s-error-bg p-3 text-[12px] text-s-error">
                  <AlertCircle size={14} className="mt-0.5 shrink-0" /> <span>{error}</span>
                </div>
              )}
              <SendButton
                amount={amount}
                label={l.send}
                disabled={loadingIntent || amount < 100}
                errText={l.err}
                onSuccess={() => setDone(true)}
                onError={setError}
              />
            </div>
          </Elements>
        ) : (
          <div className="mt-8 flex justify-center">
            {error ? (
              <div className="flex items-start gap-1.5 rounded-input bg-s-error-bg p-3 text-[13px] text-s-error">
                <AlertCircle size={15} className="mt-0.5 shrink-0" /> <span>{error}</span>
              </div>
            ) : (
              <Spinner size="md" />
            )}
          </div>
        )}
    </div>
  );
}
