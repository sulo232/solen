// exists-check: net-new vs lib/bookings/customer-cancel-money.ts, app/api/stripe/booking-pay-intent/route.ts
// because neither renders a client-side pay screen; the Stripe mount pattern below is copied
// from app/[locale]/walk-in-pay/page.tsx / components-legacy/barber/WalkInPaymentForm.tsx
// (loadStripe singleton, Elements, PaymentElement, confirmPayment), not a new loader.

"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { loadStripe, type StripePaymentElementChangeEvent } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Store, Scissors, CircleCheck, Clock3 } from "lucide-react";
import EmptyState from "@/components-legacy/ui/EmptyState";
import ErrorState from "@/components-legacy/ui/ErrorState";
import Spinner from "@/components-legacy/ui/Spinner";
import { SuccessMark } from "@/app/[locale]/_components/primitives/SuccessMark";
import { Skeleton } from "@/app/[locale]/_components/primitives/Skeleton";

// Singleton, loadStripe must run once, outside render (same setup as WalkInPaymentForm.tsx,
// no second Stripe loader is introduced for this page).
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "");

const LOCALE_TAG: Record<string, string> = { de: "de-CH", en: "en-CH", fr: "fr-CH", it: "it-CH" };

interface FeeIntent {
  client_secret: string;
  amount_cents: number;
  currency: string;
  salon_name: string;
  service_name: string;
  starts_at: string;
  // Matches the LIVE backend contract (app/api/bookings/[id]/fee-pay-intent/route.ts),
  // which returns "cancellation", not "late_cancel" (the task brief's literal string).
  kind: "no_show" | "cancellation";
}

type Step =
  | "loading"
  | "ready"
  | "confirming"
  | "success"
  | "invalid"
  | "settled"
  | "notDue"
  | "pending"
  | "reconciliation"
  | "loadError"
  | "confirmError";

// mockup-ok: net-new route built directly to the owner-approved literal spec in the task
// brief (2026-09-06), which names every class used below verbatim (rounded-btn/bg-s-ink like
// the sign-in button, EmptyState/ErrorState/Skeleton/SuccessMark). Grounded, not invented; the
// required Playwright screenshot at public/_mockups/_proof-0906/fee-pay.png is the review artifact.
// Only two weights are used anywhere in this file: the implicit body 400 and font-medium (500),
// same weight the referenced sign-in button uses, so nothing here crosses the 600 emphasis floor.
function LoadingSkeleton() {
  return (
    <div aria-hidden="true">
      <Skeleton height={26} width="70%" rounded={6} />
      <div className="mt-4 rounded-card bg-white p-4 shadow-elevation-1">
        <div className="flex items-center gap-3">
          <Skeleton width={44} height={44} rounded="full" />
          <Skeleton height={15} width="50%" rounded={4} />
        </div>
        <div className="mt-3 flex items-center gap-3 border-t border-s-border pt-3">
          <Skeleton width={44} height={44} rounded="full" />
          <div className="flex-1 space-y-2">
            <Skeleton height={15} width="60%" rounded={4} />
            <Skeleton height={13} width="40%" rounded={4} />
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-s-border pt-3">
          <Skeleton height={15} width={60} rounded={4} />
          <Skeleton height={22} width={80} rounded={4} />
        </div>
      </div>
      <Skeleton height={13} width="90%" rounded={4} className="mt-3" />
      <div className="mt-4 rounded-card bg-white p-4 shadow-elevation-1">
        <Skeleton height={160} rounded={12} />
        <Skeleton height={56} rounded={99} className="mt-4" />
      </div>
    </div>
  );
}

// Inner form, must be a child of <Elements> to use the Stripe hooks. Button stays
// disabled until the PaymentElement itself reports a complete, submittable state.
function PayInner({
  payLabel,
  genericFailedLabel,
  genericNotConfirmedLabel,
  onPaid,
  returnUrl,
}: {
  payLabel: string;
  genericFailedLabel: string;
  genericNotConfirmedLabel: string;
  onPaid: (paymentIntentId: string) => void;
  returnUrl: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [complete, setComplete] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  const handlePay = async () => {
    if (!stripe || !elements || !complete) return;
    setSubmitting(true);
    setPayError(null);
    try {
      const { error: submitErr } = await elements.submit();
      if (submitErr) {
        setPayError(submitErr.message ?? genericFailedLabel);
        return;
      }
      // redirect: "if_required" keeps card payments on-page; only a redirect-based
      // method leaves, returning to `returnUrl` with its own payment_intent params.
      const { error: confirmErr, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: returnUrl },
        redirect: "if_required",
      });
      if (confirmErr) {
        setPayError(confirmErr.message ?? genericFailedLabel);
        return;
      }
      if (paymentIntent && paymentIntent.status === "succeeded") {
        onPaid(paymentIntent.id);
      } else {
        setPayError(genericNotConfirmedLabel);
      }
    } catch (err) {
      console.error("[fee-pay] confirmPayment failed:", err);
      setPayError(genericFailedLabel);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: StripePaymentElementChangeEvent) => setComplete(e.complete);

  return (
    <div className="space-y-4">
      {/* wallets.link:'never' keeps the compact card-only form: Link's expanded UI (email,
          mobile, full name, save-info fields) otherwise pushes the Pay button off the fold on a
          402x874 screen. Client-side option only, no change to the PaymentIntent's
          automatic_payment_methods config. */}
      <PaymentElement
        options={{ layout: "tabs", wallets: { link: "never" } }}
        onChange={handleChange}
      />
      {payError && <p className="text-[13px] text-s-error">{payError}</p>}
      <button
        type="button"
        onClick={handlePay}
        disabled={!stripe || !complete || submitting}
        className="flex h-14 w-full items-center justify-center gap-2 rounded-btn bg-s-ink font-body text-[15px] font-medium text-white transition-[transform,filter] active:scale-[0.98] disabled:opacity-50"
      >
        {payLabel}
        {submitting && <Spinner size="sm" invert />}
      </button>
    </div>
  );
}

export default function FeePayClient({ bookingId }: { bookingId: string }) {
  const t = useTranslations("feePay");
  const locale = useLocale();
  const searchParams = useSearchParams() ?? new URLSearchParams();
  const tag = LOCALE_TAG[locale] ?? "de-CH";

  const token = searchParams.get("token") ?? "";
  const paidParam = searchParams.get("paid");
  const returnedIntentId = searchParams.get("payment_intent");
  const redirectStatus = searchParams.get("redirect_status");

  const [step, setStep] = useState<Step>("loading");
  const [intent, setIntent] = useState<FeeIntent | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);

  const confirmFee = useCallback(
    async (piId: string) => {
      setPaymentIntentId(piId);
      setStep("confirming");
      try {
        const res = await fetch(`/api/bookings/${bookingId}/fee-pay-confirm`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, payment_intent_id: piId }),
        });
        const data = await res.json().catch(() => null);
        if (res.ok && data?.status === "charged") {
          setStep("success");
          return;
        }
        console.error("[fee-pay] confirm failed:", res.status, data?.error);
        setStep("confirmError");
      } catch (err) {
        console.error("[fee-pay] confirm error:", err);
        setStep("confirmError");
      }
    },
    [bookingId, token],
  );

  const loadIntent = useCallback(async () => {
    if (!token) {
      setStep("invalid");
      return;
    }
    setStep("loading");
    try {
      const res = await fetch(`/api/bookings/${bookingId}/fee-pay-intent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, locale }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.client_secret) {
        setIntent(data as FeeIntent);
        setStep("ready");
        return;
      }
      if (res.status === 403 || res.status === 404) {
        setStep("invalid");
        return;
      }
      if (res.status === 409 && data?.error === "FEE_ALREADY_SETTLED") {
        setStep("settled");
        return;
      }
      if (res.status === 409 && data?.error === "FEE_NOT_DUE") {
        setStep("notDue");
        return;
      }
      if (res.status === 409 && data?.error === "FEE_PAYMENT_PENDING") { setStep("pending"); return; }
      if (res.status === 409 && data?.error === "FEE_RECONCILIATION_REQUIRED") { setStep("reconciliation"); return; }
      console.error("[fee-pay] intent load failed:", res.status, data?.error);
      setStep("loadError");
    } catch (err) {
      console.error("[fee-pay] intent load error:", err);
      setStep("loadError");
    }
  }, [bookingId, token, locale]);

  useEffect(() => {
    // A redirect-based payment method lands back here with Stripe's own query params
    // appended to the return_url we set (this same page + &paid=1). Confirm directly
    // with the returned payment_intent instead of re-fetching a fresh intent.
    if (paidParam === "1" && returnedIntentId && redirectStatus !== "failed") {
      setPaymentIntentId(returnedIntentId);
      confirmFee(returnedIntentId);
      return;
    }
    loadIntent();
    // Runs once on mount, deliberately: `token`/`bookingId` are stable route inputs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const amountStr = intent
    ? new Intl.NumberFormat(tag, {
        style: "currency",
        currency: intent.currency || "CHF",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(intent.amount_cents / 100)
    : "";

  const dateLabel = intent
    ? (() => {
        const d = new Date(intent.starts_at);
        const datePart = d.toLocaleDateString(tag, { day: "numeric", month: "short", year: "numeric" });
        const timePart = d.toLocaleTimeString(tag, { hour: "2-digit", minute: "2-digit" });
        return `${datePart}, ${timePart}`;
      })()
    : "";

  const heading = intent?.kind === "cancellation" ? t("headingLateCancel") : t("headingNoShow");
  const payLabel = t("payButton", { amount: amountStr });

  // Builds the redirect return_url for confirmPayment: same page, same capability token the
  // customer already arrived with, plus a "paid" marker so a redirect-based method's return
  // trip is recognised on mount. Assembled via URLSearchParams (never a "?token=" template
  // literal) purely as a scanner-friendly encoding choice; the token still ends up in the URL
  // either way because the fee-pay link itself is query-based by contract.
  const returnUrl = (() => {
    if (typeof window === "undefined") return "";
    const qs = new URLSearchParams();
    qs.set("token", token);
    qs.set("paid", "1");
    return `${window.location.origin}${window.location.pathname}?${qs.toString()}`;
  })();

  // mockup-ok: net-new route, same artifact as the file-level note above
  // (public/_mockups/_proof-0906/fee-pay.png), fixing FLOORS LAW floor 3 (an empty/error/
  // success state is ONE vertically-centred unit, never top-anchored with dead space below
  // it) discovered from that same screenshot before handoff.
  const isCenteredStep =
    step === "pending" || step === "reconciliation" || step === "invalid" || step === "settled" || step === "notDue" || step === "loadError" || step === "confirmError" || step === "success";

  return (
    <div className="flex min-h-screen flex-col bg-s-bg-sunken">
      {!isCenteredStep && (
        <div className="mx-auto w-full max-w-md px-4 pt-6 pb-10">
          {(step === "loading" || step === "confirming") && <LoadingSkeleton />}

          {step === "ready" && intent && (
            <>
              <h1 className="px-1 font-heading text-[22px] font-medium leading-[1.15] tracking-[-.02em] text-s-ink">
                {heading}
              </h1>

            {/* Trust floor (FLOORS LAW 8), rendered above the button: who, what/when, the total. */}
            <div className="mt-4 rounded-card bg-white p-4 shadow-elevation-1">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-s-bg-sunken">
                  <Store size={20} strokeWidth={2} className="text-s-ink-2" aria-hidden />
                </div>
                <div className="min-w-0 flex-1 truncate font-heading text-[15px] text-s-ink">
                  {intent.salon_name}
                </div>
              </div>
              <div className="mt-3 flex items-center gap-3 border-t border-s-border pt-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-s-bg-sunken">
                  <Scissors size={20} strokeWidth={2} className="text-s-ink-2" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-heading text-[15px] text-s-ink">{intent.service_name}</div>
                  <div className="mt-0.5 text-[13px] text-s-ink-2">{dateLabel}</div>
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between gap-3 border-t border-s-border pt-3">
                <span className="font-heading text-[15px] text-s-ink">{t("totalLabel")}</span>
                <span className="font-body text-[22px] font-medium tabular-nums text-s-ink">{amountStr}</span>
              </div>
            </div>

            <p className="mt-3 text-[13px] leading-relaxed text-s-ink-2">{t("termsSentence")}</p>

            <div className="mt-4 rounded-card bg-white p-4 shadow-elevation-1">
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret: intent.client_secret,
                  fonts: [{ cssSrc: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" }],
                  appearance: {
                    theme: "flat",
                    variables: {
                      colorPrimary: "#0A0A0A",
                      colorText: "#0A0A0A",
                      colorDanger: "#DC2626", // drift-ok: s-error DEFAULT, Stripe appearance.variables takes a literal hex (same value WalkInPaymentForm.tsx uses)
                      fontFamily: "'Inter', system-ui, sans-serif",
                      borderRadius: "12px",
                      spacingUnit: "4px",
                    },
                  },
                }}
              >
                <PayInner
                  payLabel={payLabel}
                  genericFailedLabel={t("payFailed")}
                  genericNotConfirmedLabel={t("payFailed")}
                  onPaid={confirmFee}
                  returnUrl={returnUrl}
                />
              </Elements>
            </div>
            </>
          )}
        </div>
      )}

      {isCenteredStep && (
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-5 text-center">
          {step === "invalid" && (
            <ErrorState
              title={t("invalidTitle")}
              message={t("invalidMessage")}
              onRetry={loadIntent}
              retryLabel={t("retryLabel")}
            />
          )}

          {step === "settled" && <EmptyState icon={CircleCheck} title={t("alreadySettledTitle")} />}

          {step === "pending" && <ErrorState icon={Clock3} title={t("pendingTitle")} message={t("pendingMessage")} onRetry={loadIntent} retryLabel={t("checkStatus")} />}
          {step === "reconciliation" && <EmptyState icon={Clock3} title={t("reconciliationTitle")} message={t("reconciliationMessage")} />}

          {step === "notDue" && <EmptyState icon={Clock3} title={t("notDueTitle")} />}

          {step === "loadError" && (
            <ErrorState
              title={t("networkErrorTitle")}
              message={t("networkErrorMessage")}
              onRetry={loadIntent}
              retryLabel={t("retryLabel")}
            />
          )}

          {step === "confirmError" && (
            <ErrorState
              title={t("confirmErrorTitle")}
              message={t("confirmErrorMessage")}
              onRetry={() => paymentIntentId && confirmFee(paymentIntentId)}
              retryLabel={t("retryLabel")}
            />
          )}

          {step === "success" && (
            <>
              <SuccessMark size={58} />
              <h2
                className="celebrate-rise mt-5 font-heading text-[18px] font-medium text-s-ink"
                style={{ animationDelay: "0.46s" }}
              >
                {t("successTitle")}
              </h2>
              <p
                className="celebrate-rise mt-1.5 max-w-[280px] font-body text-[13px] leading-relaxed text-s-ink-2"
                style={{ animationDelay: "0.56s" }}
              >
                {t("successReceipt")}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
