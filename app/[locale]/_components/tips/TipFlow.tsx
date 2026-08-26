"use client";

// Shared SINGLE-SCREEN tip flow, powers booking (/tip/[bookingId]) + walk-in (/walk-in-tip/[token]).
// One screen: staff avatar + name, amount presets (ink selected, twin-control with the pay page),
// Stripe card field, and an ink "CHF X Trinkgeld senden" commit CTA (blue never fills a primary —
// LOCKFILE §0 rule 2; the 2026-06-09 blue-CTA variant predates the v3 balance). The tip endpoints
// REUSE + UPDATE one PaymentIntent across amount changes, so clientSecret stays stable and the card
// field never remounts.

import { useEffect, useState } from "react";
import { SuccessMark } from "@/app/[locale]/_components/primitives/SuccessMark";
import Image from "next/image";
import { Check, AlertCircle, CreditCard, Star } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { getPublicEnv } from "@/lib/env";
import Spinner from "@/components-legacy/ui/Spinner";
import { formatCurrency } from "@/lib/format";

const STRIPE_KEY = getPublicEnv().NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = STRIPE_KEY ? loadStripe(STRIPE_KEY) : null;

// Swiss prefix format: "CHF 10", "CHF 12.50". Routed through the shared
// lib/format.ts formatCurrency (2026-07-26, was a local de-CH-only duplicate).
const chf = (rappen: number, locale: string) => (Number.isFinite(rappen) ? formatCurrency(rappen / 100, locale) : "CHF 0");

type Copy = Record<string, string>;
const COPY: Record<string, Copy> = {
  de: { choose: "Betrag wählen", custom: "Eigener", send: "Trinkgeld senden", to100: "100% geht an Ihren Coiffeur", thanks: "Danke!", sent: "gesendet", sub: "freut sich. Schönen Tag!", err: "Etwas ist schiefgelaufen. Bitte erneut versuchen.", noTip: "Kein Trinkgeld diesmal" },
  en: { choose: "Choose an amount", custom: "Custom", send: "Send tip", to100: "100% goes to your stylist", thanks: "Thank you!", sent: "sent", sub: "appreciates it. Have a great day!", err: "Something went wrong. Please try again.", noTip: "No tip this time" },
  fr: { choose: "Choisir un montant", custom: "Autre", send: "Envoyer", to100: "100% va à votre coiffeur", thanks: "Merci !", sent: "envoyé", sub: "vous remercie. Bonne journée !", err: "Une erreur est survenue. Veuillez réessayer.", noTip: "Pas de pourboire cette fois" },
  it: { choose: "Scegli un importo", custom: "Altro", send: "Invia", to100: "100% va al tuo parrucchiere", thanks: "Grazie!", sent: "inviata", sub: "ti ringrazia. Buona giornata!", err: "Qualcosa è andato storto. Riprova.", noTip: "Niente mancia stavolta" },
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
  amount, label, disabled, errText, onSuccess, onError, locale,
}: {
  amount: number; label: string; disabled: boolean; errText: string;
  onSuccess: () => void; onError: (m: string) => void; locale: string;
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
      className="mt-4 flex w-full items-center justify-center gap-2 rounded-btn bg-s-ink py-3.5 font-heading text-sm font-semibold text-white transition-[transform,filter] hover:brightness-[1.06] active:scale-[0.98] disabled:opacity-50"
    >
      {submitting && <Spinner size="sm" invert />}
      {chf(amount, locale)} {label}
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
    <div className="relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-s-bg-sunken font-heading text-base font-semibold text-s-ink">
      {recipientPhoto ? <Image src={recipientPhoto} alt="" fill className="object-cover" unoptimized /> : initial}
    </div>
  );

  if (done) {
    return (
      <div className="flex flex-col items-center px-6 py-12 text-center">
        {/* SuccessMark on the tip peak (motion sheet 22) — replaces the static pale check */}
        <div className="mb-4">
          <SuccessMark size={64} />
        </div>
        <p className="celebrate-rise mb-1.5 font-heading text-[13px] font-semibold text-s-success" style={{ animationDelay: "0.46s" }}>
          {chf(amount, locale)} {l.sent}
        </p>
        <h1 className="celebrate-rise font-heading text-[20px] font-semibold text-s-ink" style={{ animationDelay: "0.56s" }}>{l.thanks}</h1>
        <p className="celebrate-rise mt-1.5 max-w-[15rem] text-[13px] text-s-ink-2" style={{ animationDelay: "0.66s" }}>{recipientName} {l.sub}</p>
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
        <p className="mb-3 font-body text-[13px] font-semibold text-s-ink">{l.choose}</p>
        <div className="grid grid-cols-2 gap-2.5">
          {presets.map((p) => {
            const sel = !useCustom && selected === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => { setSelected(p); setUseCustom(false); }}
                className={`rounded-[16px] border py-4 text-center font-heading text-[17px] font-bold tabular-nums transition-colors ${
                  sel ? "border-s-ink bg-s-ink text-white" : "border-s-border text-s-ink hover:border-s-ink"
                }`}
              >
                {chf(p, locale)}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setUseCustom(true)}
            className={`rounded-[16px] border py-4 text-center font-heading text-[15px] font-bold transition-colors ${
              useCustom ? "border-s-ink bg-s-ink text-white" : "border-s-border text-s-ink hover:border-s-ink"
            }`}
          >
            {l.custom}
          </button>
        </div>

        {useCustom && (
          <div className="mt-2.5 flex items-center gap-2 rounded-[16px] border border-s-ink px-4 py-3.5">
            <span className="shrink-0 text-[15px] font-semibold text-s-ink-2">CHF</span>
            {/* mockup-ok: !important prevents a look change, not a new one. The wrapper div
                owns the visible chrome (border-s-ink + rounded-[16px] + px-4 py-3.5); this
                bare input must stay invisible inside it, or the widened base input law
                (globals.css, 2026-07-17, sets background:#F4F4F5/border-radius:12px/
                padding:16px/min-height:48px on every bare input) paints a second gray pill
                nested in the ink border AND doubles the side padding. Same carve-out shape as
                clients/page.tsx and services/page.tsx (V3-D-input-fill-2026-07-17). Restores
                the bg-transparent this sweep's own diff wrongly removed as a "dead class". */}
            <input
              type="number" min="1" step="0.5" inputMode="decimal" autoFocus
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              placeholder="0.00"
              /* mockup-ok: not a new look, a repair. !border-0 zeroes the base rule's 1px border
                 WIDTH, which the global focus law force-paints ink on focus (autoFocus fires it
                 immediately), drawing a bordered pill nested inside this wrapper's own ink border.
                 Reviewer-measured. Every other wrapper-owns-chrome carve-out already pairs
                 !bg-transparent with !border-0 (SearchOverlay.tsx:542,829;
                 ClientSelectorDropdown.tsx:88); this input was the only one missing it. */
              className="w-full !border-0 !min-h-0 !bg-transparent !px-0 text-[16px] tabular-nums text-s-ink placeholder:text-s-ink-2 focus:outline-none"
            />
          </div>
        )}

        {/* Card + 100% pill + send (single screen) */}
        {demo ? (
          <div className="mt-4">
            <div className="flex items-center gap-2.5 rounded-input border border-s-border bg-s-bg-sunken px-3.5 py-4 text-[13px] text-s-ink-2">
              <CreditCard size={18} strokeWidth={1.9} className="shrink-0 text-s-ink" /> Karte MM / JJ CVC
            </div>
            <button
              type="button"
              onClick={() => setDone(true)}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-btn bg-s-ink py-3.5 font-heading text-sm font-semibold text-white transition-[transform,filter] hover:brightness-[1.06] active:scale-[0.98]"
            >
              {chf(amount, locale)} {l.send}
            </button>
          </div>
        ) : clientSecret && stripePromise ? (
          <Elements key={clientSecret} stripe={stripePromise} options={{ clientSecret, appearance: { theme: "stripe", variables: { colorPrimary: "#276EF1", borderRadius: "12px" } } }}>
            <div className="mt-4">
              <PaymentElement />
              {error && (
                <div className="mt-3 flex items-start gap-1.5 rounded-input bg-s-error-bg p-3 text-[12px] text-s-error">
                  <AlertCircle size={14} strokeWidth={1.6} className="mt-0.5 shrink-0" /> <span>{error}</span>
                </div>
              )}
              <SendButton
                amount={amount}
                label={l.send}
                disabled={loadingIntent || amount < 100}
                errText={l.err}
                onSuccess={() => setDone(true)}
                onError={setError}
                locale={locale}
              />
            </div>
          </Elements>
        ) : (
          <div className="mt-8 flex justify-center">
            {error ? (
              <div className="flex items-start gap-1.5 rounded-input bg-s-error-bg p-3 text-[13px] text-s-error">
                <AlertCircle size={15} strokeWidth={1.9} className="mt-0.5 shrink-0" /> <span>{error}</span>
              </div>
            ) : (
              <Spinner size="md" />
            )}
          </div>
        )}

        {/* Mockup 17: explicit no-tip exit under the CTA — ink tertiary, no underline (v3.1) */}
        {onClose && !done && (
          <div className="mt-3.5 text-center">
            <button
              type="button"
              onClick={onClose}
              className="font-body text-[13.5px] font-semibold text-s-ink-2 transition-colors hover:text-s-ink"
            >
              {l.noTip}
            </button>
          </div>
        )}
    </div>
  );
}
