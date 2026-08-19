"use client";

// PaymentMethods, the client half of /profile/settings/payment (2026-07-21, owner-approved
// public/_mockups/sweep-payment-methods/index.html): fetches the REAL saved cards from
// GET /api/stripe/payment-methods (backend already exists, this is the first UI consuming it),
// renders them as card rows or the locked EmptyState, and lets the user add a card via the
// existing POST /api/stripe/payment-methods SetupIntent + Stripe Elements (mirrors
// components-legacy/barber/WalkInPaymentForm.tsx's confirm pattern, swapped to confirmSetup for
// a SetupIntent instead of confirmPayment for a PaymentIntent). No set-default / remove actions:
// the backend has no endpoint for either, so none are rendered (flagged in the mockup too).
//
// exists-check: `npm run exists "payment methods"` ran this turn, 1 hit: the API
// /api/stripe/payment-methods (GET+POST, app/api/stripe/payment-methods/route.ts) already exists
// and is REUSED as-is, not touched. No existing UI component renders it (grep of app/**/*.tsx
// found zero importers of that route before this file). Net-new vs the guard's other suggested
// matches: lib/stripe.ts is the server SDK client, not a UI component; components/ui/card.tsx is
// the generic shadcn <Card> shell (no payment-method semantics); StaffProfileSheet.tsx,
// barber-clients/page.tsx, the two _plans/*.md audits, and the migration file are unrelated
// dashboard, planning, and DB surfaces. This file is genuinely the first account-level UI for
// the existing backend.

import * as React from "react";
import { CreditCard, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { getPublicEnv } from "@/lib/env";
import { Skeleton, Sheet, SheetHeader, SheetBody } from "@/app/[locale]/_components/primitives";
import EmptyState from "@/components-legacy/ui/EmptyState";
import Spinner from "@/components-legacy/ui/Spinner";
import { CARD_BRAND_NAME } from "@/lib/payment-brand";

// Singleton, loadStripe must run once, outside render (same pattern as WalkInPaymentForm.tsx).
const STRIPE_KEY = getPublicEnv().NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = STRIPE_KEY ? loadStripe(STRIPE_KEY) : null;

interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  exp_month?: number | null;
  exp_year?: number | null;
}

// Short badge codes (this file's own concern). The brand display name (Visa/Mastercard/...)
// now lives in lib/payment-brand.ts, shared with AccountHub's Wallet row (2026-08-02).
const BRAND_BADGE: Record<string, string> = {
  visa: "VISA",
  mastercard: "MC",
  amex: "AMEX",
  discover: "DISC",
  diners: "DINERS",
  jcb: "JCB",
  unionpay: "UP",
};

function CardRow({ method, endsInLabel, validUntilLabel }: { method: PaymentMethod; endsInLabel: string; validUntilLabel: string }) {
  const brandKey = method.brand?.toLowerCase() ?? "";
  const badge = BRAND_BADGE[brandKey] ?? (brandKey.slice(0, 4).toUpperCase() || "CARD");
  const name = CARD_BRAND_NAME[brandKey] ?? (brandKey ? brandKey.charAt(0).toUpperCase() + brandKey.slice(1) : "Karte");
  const exp = method.exp_month && method.exp_year
    ? `${String(method.exp_month).padStart(2, "0")}/${String(method.exp_year).slice(-2)}`
    : null;

  return (
    <div className="flex items-center gap-3.5 rounded-card border border-s-border bg-white px-4 py-3.5">
      <div className="flex h-[30px] w-11 shrink-0 items-center justify-center rounded-[6px] bg-s-bg-sunken text-[11px] font-bold tracking-[.02em] text-s-ink"> {/* drift-ok: eyebrow-tier badge, LOCKFILE text-size row "eyebrow 11" + owner-approved sweep-payment-methods mockup's .brand{font-size:11px} */}
        {badge}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[15px] font-semibold text-s-ink">{name}</div>
        <div className="mt-px text-[12.5px] text-s-ink-2">
          {endsInLabel} {method.last4}
          {exp ? `, ${validUntilLabel} ${exp}` : ""}
        </div>
      </div>
    </div>
  );
}

function PaymentMethodsSkeleton() {
  return (
    <div className="space-y-2.5" aria-hidden="true">
      {[0, 1].map((i) => (
        <div key={i} className="flex items-center gap-3.5 rounded-card border border-s-border bg-white px-4 py-3.5">
          <Skeleton width={44} height={30} rounded={6} />
          <div className="min-w-0 flex-1">
            <Skeleton height={15} width="42%" rounded={4} />
            <Skeleton height={12} width="64%" rounded={4} className="mt-1.5" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Inner confirm form, must be a child of <Elements> to use the Stripe hooks. Deferred-intent
// pattern: elements.submit() validates/collects the fields, then confirmSetup() attaches the
// card to the customer (SetupIntent, not a charge, mirrors WalkInPaymentForm.tsx's
// confirmPayment shape, swapped to confirmSetup for the add-card use case).
function AddCardForm({ confirmLabel, errorFallback, onSuccess }: { confirmLabel: string; errorFallback: string; onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async () => {
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError(null);
    try {
      const { error: submitErr } = await elements.submit();
      if (submitErr) {
        setError(submitErr.message ?? errorFallback);
        return;
      }
      const { error: confirmErr } = await stripe.confirmSetup({
        elements,
        redirect: "if_required",
      });
      if (confirmErr) {
        console.error("[PaymentMethods] confirmSetup failed:", confirmErr.message);
        setError(confirmErr.message ?? errorFallback);
        return;
      }
      onSuccess();
    } catch (e) {
      console.error("[PaymentMethods] confirmSetup error:", e);
      setError(errorFallback);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 pb-2">
      <PaymentElement options={{ layout: "tabs" }} />
      {error && <p className="text-[13px] text-s-error">{error}</p>}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!stripe || submitting}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-btn bg-s-ink text-[15px] font-medium tracking-[-0.005em] text-white transition-[opacity,transform] duration-200 disabled:opacity-50 active:scale-[0.97] active:duration-[80ms] active:ease-glide"
      >
        {submitting && <Spinner size="sm" invert />}
        {confirmLabel}
      </button>
    </div>
  );
}

export default function PaymentMethods() {
  const t = useTranslations("profileHub");
  const tErr = useTranslations("errors");

  const [methods, setMethods] = React.useState<PaymentMethod[] | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [clientSecret, setClientSecret] = React.useState<string | null>(null);
  const [creatingIntent, setCreatingIntent] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(() => {
    setLoading(true);
    fetch("/api/stripe/payment-methods", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setMethods(d?.methods ?? []))
      .catch((e) => {
        console.error("[PaymentMethods] list fetch failed:", e);
        setMethods([]);
      })
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const openAddCard = async () => {
    setCreatingIntent(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/payment-methods", { method: "POST", credentials: "include" });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.client_secret) {
        console.error("[PaymentMethods] SetupIntent create failed:", data?.error);
        setError(tErr("server_error"));
        return;
      }
      setClientSecret(data.client_secret);
      setSheetOpen(true);
    } catch (e) {
      console.error("[PaymentMethods] SetupIntent create error:", e);
      setError(tErr("server_error"));
    } finally {
      setCreatingIntent(false);
    }
  };

  const closeSheet = (open: boolean) => {
    setSheetOpen(open);
    if (!open) setClientSecret(null);
  };

  const onCardAdded = () => {
    closeSheet(false);
    load();
  };

  return (
    <div>
      {loading ? (
        <PaymentMethodsSkeleton />
      ) : methods && methods.length > 0 ? (
        <div className="space-y-2.5">
          {methods.map((m) => (
            <CardRow key={m.id} method={m} endsInLabel={t("payEndsIn")} validUntilLabel={t("payValidUntil")} />
          ))}
        </div>
      ) : (
        <EmptyState icon={CreditCard} title={t("payEmpty")} message={t("payEmptySub")} />
      )}

      {error && <p className="mt-3 text-center text-[13px] text-s-error">{error}</p>}

      <button
        type="button"
        onClick={openAddCard}
        disabled={creatingIntent}
        className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-btn bg-s-ink text-[15px] font-medium tracking-[-0.005em] text-white transition-[opacity,transform] duration-200 disabled:opacity-50 active:scale-[0.97] active:duration-[80ms] active:ease-glide"
      >
        {creatingIntent ? <Spinner size="sm" invert /> : <Plus size={18} strokeWidth={1.9} aria-hidden />}
        {t("payAddCard")}
      </button>

      <Sheet isOpen={sheetOpen} onOpenChange={closeSheet} height="auto">
        <SheetHeader title={t("payAddCard")} onClose={() => closeSheet(false)} />
        <SheetBody>
          {clientSecret && stripePromise ? (
            <Elements
              key={clientSecret}
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: "flat",
                  variables: {
                    colorPrimary: "#0A0A0A",
                    colorText: "#0A0A0A",
                    colorDanger: "#DC2626", /* drift-ok: Stripe appearance.variables needs a raw hex (no Tailwind inside the Stripe iframe); equals the s-error token (tailwind.config.js "s-error".DEFAULT), same literal already ships in WalkInPaymentForm.tsx:114 which this file mirrors */
                    fontFamily: "'Inter', system-ui, sans-serif",
                    borderRadius: "12px",
                    spacingUnit: "4px",
                  },
                },
              }}
            >
              <AddCardForm confirmLabel={t("payAddCard")} errorFallback={tErr("server_error")} onSuccess={onCardAdded} />
            </Elements>
          ) : (
            <div className="flex justify-center py-10">
              <Spinner size="md" />
            </div>
          )}
        </SheetBody>
      </Sheet>
    </div>
  );
}
