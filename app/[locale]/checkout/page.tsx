"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { motion } from "framer-motion";
import { MapPin, Calendar, User, Shield, ChevronRight, Loader2, Lock, CreditCard, Tag, Wallet, PartyPopper, AlertCircle, CheckCircle } from "lucide-react";
import { formatCurrency } from "@/lib/format-currency";
import Spinner from "@/components/ui/Spinner";
import InteractiveHoverButton from "@/components/ui/interactive-hover-button";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface BookingIntent {
  salon_id: string;
  salon_name: string;
  salon_address?: string;
  service_name: string;
  staff_name?: string;
  date: string;       // "Montag, 24. März 2026"
  time: string;       // "14:00"
  estimated_price: number;
  deposit_amount: number;
  slot_id?: string;
  service_id?: string;
  staff_member_id?: string;
  free_cancel_hours?: number;
  payment_mode?: "prepay" | "deposit" | "at_salon";
}

// ─────────────────────────────────────────────────────────────────────────────
// Inner checkout form (needs Stripe Elements context)
// ─────────────────────────────────────────────────────────────────────────────

function CheckoutForm({ intent, paymentIntentId, onSuccess }: {
  intent: BookingIntent;
  paymentIntentId: string;
  onSuccess: () => void;
}) {
  const locale = useLocale();
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remainder = intent.estimated_price - intent.deposit_amount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/${locale}/checkout/success?booking_intent=${encodeURIComponent(window.location.search.replace("?booking_intent=", ""))}&pi=${paymentIntentId}`,
      },
    });

    if (confirmError) {
      setError(confirmError.message ?? "Zahlung fehlgeschlagen");
      setLoading(false);
    }
    // On success, Stripe redirects to return_url
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement options={{ layout: "tabs" }} />

      {error && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-[10px] border border-s-coral/20"
          style={{ background: "rgba(232,98,74,.06)" }}>
          <AlertCircle size={13} className="text-s-coral shrink-0" />
          <p className="text-xs font-body text-s-coral">{error}</p>
        </div>
      )}

      <InteractiveHoverButton
        type="submit"
        disabled={!stripe || loading}
        text={loading ? "Verarbeite..." : `Jetzt buchen · ${formatCurrency(intent.deposit_amount, locale)}`}
        className="w-full py-3.5 rounded-btn text-[11px] font-heading font-bold uppercase tracking-[.06em] shadow-coral-glow disabled:opacity-60"
      />

      <p className="text-[9px] text-center font-heading uppercase tracking-[.10em] text-s-ink/50 mt-3">
        Kostenlose Stornierung bis {intent.free_cancel_hours ?? 24}h vorher
      </p>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main checkout page
// ─────────────────────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const locale = useLocale();
  const tc = useTranslations("common");
  const searchParams = useSearchParams();
  const [intent, setIntent] = useState<BookingIntent | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmingAtSalon, setConfirmingAtSalon] = useState(false);
  const [atSalonConfirmed, setAtSalonConfirmed] = useState(false);

  // Promo code state
  const [promoCode, setPromoCode] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoResult, setPromoResult] = useState<{ valid: boolean; discount_amount: number; code: string } | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);

  // Voucher state
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [voucherResult, setVoucherResult] = useState<{ valid: boolean; amount: number; remaining_amount: number; code: string; message?: string } | null>(null);
  const [voucherError, setVoucherError] = useState<string | null>(null);

  // User credits
  const [userCredits, setUserCredits] = useState(0);

  useEffect(() => {
    const raw = searchParams.get("booking_intent");
    if (!raw) { setError(tc("noBookingData")); setLoading(false); return; }

    let parsed: BookingIntent;
    try {
      parsed = JSON.parse(decodeURIComponent(raw));
    } catch {
      setError(tc("errorValidation")); setLoading(false); return;
    }
    setIntent(parsed);

    // For at_salon mode: no Stripe needed
    if (parsed.payment_mode === "at_salon") {
      setLoading(false);
      return;
    }

    // For prepay: charge full amount, for deposit: charge deposit_amount
    const chargeAmount = parsed.payment_mode === "prepay" ? parsed.estimated_price : parsed.deposit_amount;

    // Create payment intent
    fetch("/api/stripe/create-payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        salon_id: parsed.salon_id,
        service_name: parsed.service_name,
        estimated_price: parsed.estimated_price,
        deposit_amount: chargeAmount,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setError(data.error); return; }
        setClientSecret(data.client_secret);
        setPaymentIntentId(data.payment_intent_id);
      })
      .catch(() => setError(tc("errorPaymentLoading")))
      .finally(() => setLoading(false));
  }, [searchParams]);

  // Fetch user credits
  useEffect(() => {
    fetch("/api/referral")
      .then((r) => r.json())
      .then((data) => {
        // Sum available credits from user_credits endpoint would be better,
        // but for now we can show earned amount as available
        if (data.total_earned) setUserCredits(data.total_earned);
      })
      .catch((err) => console.error("[Checkout] failed to load referral credits:", err));
  }, []);

  // Validate promo code
  const handlePromoValidate = async () => {
    if (!promoCode.trim() || !intent) return;
    setPromoLoading(true);
    setPromoError(null);
    setPromoResult(null);

    try {
      const res = await fetch("/api/promo/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: promoCode.trim(),
          salon_id: intent.salon_id,
          booking_amount: intent.estimated_price,
        }),
      });
      const data = await res.json();
      if (data.valid) {
        setPromoResult({ valid: true, discount_amount: data.discount_amount, code: data.code });
      } else {
        setPromoError(data.message ?? tc("errorValidation"));
      }
    } catch {
      setPromoError(tc("errorValidation"));
    } finally {
      setPromoLoading(false);
    }
  };

  // Validate voucher code
  const handleVoucherValidate = async () => {
    if (!voucherCode.trim() || !intent) return;
    setVoucherLoading(true);
    setVoucherError(null);
    setVoucherResult(null);

    try {
      const res = await fetch("/api/vouchers/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: voucherCode.trim(),
          salon_id: intent.salon_id,
        }),
      });
      const data = await res.json();
      if (data.valid) {
        setVoucherResult({
          valid: true,
          amount: data.amount,
          remaining_amount: data.remaining_amount,
          code: data.code,
          message: data.message,
        });
      } else {
        setVoucherError(data.message ?? tc("errorValidation"));
      }
    } catch {
      setVoucherError(tc("errorValidation"));
    } finally {
      setVoucherLoading(false);
    }
  };

  // Handle at_salon booking confirmation (no payment)
  const handleAtSalonConfirm = async () => {
    if (!intent?.slot_id) return;
    setConfirmingAtSalon(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slot_id: intent.slot_id,
          service_id: intent.service_id,
          staff_member_id: intent.staff_member_id,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).message ?? tc("errorGeneric"));
      setAtSalonConfirmed(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : tc("errorProcessing"));
    } finally {
      setConfirmingAtSalon(false);
    }
  };

  // P13 — Loading skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-s-bg-base py-12 px-4">
        <div className="max-w-lg mx-auto space-y-4 animate-pulse">
          {/* Summary card skeleton */}
          <div className="bg-white rounded-[12px] border border-s-ink/[0.06] p-5">
            <div className="h-2.5 w-20 bg-s-bg-sunken rounded mb-3" />
            <div className="h-4 w-36 bg-s-bg-sunken rounded mb-5" />
            <div className="space-y-3">
              <div className="h-3 w-48 bg-s-bg-sunken rounded" />
              <div className="h-3 w-40 bg-s-bg-sunken rounded" />
              <div className="h-3 w-32 bg-s-bg-sunken rounded" />
            </div>
          </div>
          {/* Payment card skeleton */}
          <div className="bg-white rounded-[12px] border border-s-ink/[0.06] p-5">
            <div className="h-3 w-28 bg-s-bg-sunken rounded mb-4" />
            <div className="h-10 w-full bg-s-bg-sunken rounded-[10px] mb-3" />
            <div className="h-10 w-full bg-s-bg-sunken rounded-[10px] mb-3" />
            <div className="h-12 w-full bg-s-bg-sunken rounded-btn" />
          </div>
        </div>
      </div>
    );
  }

  // P14 — Error state
  if (error || !intent) {
    return (
      <div className="min-h-screen bg-s-bg-base flex items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-[12px] border border-s-coral/20 p-8 text-center shadow-warm-lg"
          style={{ background: "rgba(232,98,74,.04)", boxShadow: "0 4px 16px rgba(26,18,9,.06)" }}>
          <div className="w-12 h-12 rounded-[12px] flex items-center justify-center mx-auto mb-4"
            style={{ background: "rgba(232,98,74,.12)" }}>
            <AlertCircle size={22} className="text-s-coral" />
          </div>
          <p className="text-[9px] font-heading font-bold uppercase tracking-[.18em] text-s-coral mb-1">Fehler</p>
          <p className="text-xs font-body text-s-ink/55 mb-5">{error ?? "Etwas ist schiefgelaufen."}</p>
          <Link href={`/${locale}`}
            className="inline-flex items-center gap-1.5 px-5 py-3 rounded-btn border border-s-ink/[0.08] text-[11px] font-heading font-bold uppercase tracking-[.06em] text-s-ink/60 hover:border-s-coral/40 hover:text-s-coral transition-colors">
            Zurück zur Startseite
          </Link>
        </div>
      </div>
    );
  }

  const paymentMode = intent.payment_mode ?? "at_salon";
  let baseChargeAmount = paymentMode === "prepay" ? intent.estimated_price : intent.deposit_amount;

  // Apply promo discount
  let discountAmount = 0;
  if (promoResult) {
    discountAmount += promoResult.discount_amount;
  }

  // Apply voucher discount (use remaining_amount for partial vouchers)
  if (voucherResult) {
    discountAmount += voucherResult.remaining_amount;
  }

  const chargeAmount = Math.max(0, baseChargeAmount - discountAmount);
  const remainder = intent.estimated_price - baseChargeAmount;

  // P9 — At-salon confirmed success
  if (atSalonConfirmed) {
    return (
      <div className="min-h-screen bg-s-bg-base flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="rounded-[12px] border border-s-success/20 p-8 flex flex-col items-center gap-4 shadow-warm-lg"
            style={{ background: "rgba(46,125,50,.06)", boxShadow: "0 4px 16px rgba(26,18,9,.06)" }}>
            <div className="w-16 h-16 rounded-[18px] flex items-center justify-center"
              style={{ background: "rgba(46,125,50,.12)" }}>
              <PartyPopper size={28} className="text-s-success" />
            </div>
            <div>
              <p className="text-[9px] font-heading font-bold uppercase tracking-[.18em] text-s-success mb-2">
                Buchung bestätigt
              </p>
              <p className="font-heading font-bold text-xl text-s-ink">Termin fixiert!</p>
              <p className="text-xs font-body text-s-ink/50 mt-1 leading-relaxed">Du zahlst direkt im Salon. Bis bald!</p>
            </div>
            <Link href={`/${locale}/profile`}
              className="inline-flex items-center gap-1.5 px-6 py-3.5 rounded-btn bg-s-coral text-white text-[11px] font-heading font-bold uppercase tracking-[.06em] active:scale-[0.97] transition-[transform,filter] hover:brightness-[1.06] shadow-coral-glow">
              Meine Buchungen
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
      className="min-h-screen bg-s-bg-base py-12 px-4"
    >
      {/* P15 — Breadcrumb */}
      <div className="max-w-lg mx-auto mb-4 flex items-center gap-1.5">
        <Link href={`/${locale}`}
          className="text-[10px] font-heading font-semibold uppercase tracking-[.10em] text-s-ink/50 hover:text-s-coral transition-colors">
          Startseite
        </Link>
        <ChevronRight className="w-2.5 h-2.5 text-s-ink/20" />
        <span className="text-[10px] font-heading font-semibold uppercase tracking-[.10em] text-s-ink/50">
          Checkout
        </span>
      </div>

      <div className="max-w-lg mx-auto space-y-4">
        {/* P2 — Booking summary card */}
        <div className="bg-white rounded-[12px] border border-s-ink/[0.07] shadow-warm-md">
          <div className="px-5 pt-5 pb-4 border-b border-s-ink/[0.05]">
            <p className="text-[9px] font-heading font-bold uppercase tracking-[.20em] text-s-ink/50 mb-1">
              Deine Buchung
            </p>
            <h1 className="font-heading font-bold text-base text-s-ink">Buchungsübersicht</h1>
          </div>
          <div className="px-5 py-4">

          {/* P3 — Booking detail rows */}
          <div className="space-y-3">
            {/* Salon + address */}
            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-s-coral mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-heading font-semibold text-s-ink">{intent.salon_name}</p>
                {intent.salon_address && (
                  <p className="text-[10px] font-body text-s-ink/45 mt-0.5">{intent.salon_address}</p>
                )}
              </div>
            </div>
            {/* Date + time */}
            <div className="flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-s-coral shrink-0" />
              <p className="text-xs font-heading font-semibold text-s-ink">
                {intent.date} · {intent.time} Uhr
              </p>
            </div>
            {/* Staff */}
            {intent.staff_name && (
              <div className="flex items-center gap-2.5">
                <User className="w-4 h-4 text-s-coral shrink-0" />
                <p className="text-xs font-heading font-semibold text-s-ink">{intent.staff_name}</p>
              </div>
            )}
          </div>

          <div className="border-t border-s-ink/5 mt-4 pt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-s-ink/60">{intent.service_name}</span>
              <span className="font-medium text-s-ink">{formatCurrency(intent.estimated_price, locale)}</span>
            </div>

            {/* Discount breakdown */}
            {discountAmount > 0 && (
              <>
                {promoResult && (
                  <div className="flex justify-between text-s-success">
                    <span className="text-xs">Promo-Code</span>
                    <span className="text-xs font-semibold">-{formatCurrency(promoResult.discount_amount, locale)}</span>
                  </div>
                )}
                {voucherResult && (
                  <div className="flex justify-between text-s-success">
                    <span className="text-xs">Gutschein</span>
                    <span className="text-xs font-semibold">-{formatCurrency(voucherResult.remaining_amount, locale)}</span>
                  </div>
                )}
              </>
            )}

            {paymentMode === "deposit" && (
              <>
                <div className="flex justify-between text-s-ink/60">
                  <span>Anzahlung ({Math.round((baseChargeAmount / intent.estimated_price) * 100)}%)</span>
                  <span>{formatCurrency(baseChargeAmount, locale)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-s-success text-xs">
                    <span>Nach Rabatten</span>
                    <span className="font-semibold">{formatCurrency(chargeAmount, locale)}</span>
                  </div>
                )}
                <div className="border-t border-s-ink/5 pt-2 flex justify-between">
                  <span className="text-s-ink/50 text-xs">Restbetrag vor Ort</span>
                  <span className="text-s-ink/50 text-xs">{formatCurrency(remainder, locale)}</span>
                </div>
              </>
            )}
            {paymentMode === "prepay" && (
              <>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-s-success text-xs">
                    <span>Nach Rabatten</span>
                    <span className="font-semibold">{formatCurrency(chargeAmount, locale)}</span>
                  </div>
                )}
              </>
            )}
            {paymentMode === "at_salon" && (
              <div className="flex justify-between text-s-coral">
                <span>Zahlung vor Ort</span>
                <span className="font-medium">{formatCurrency(intent.estimated_price, locale)}</span>
              </div>
            )}
          </div>

          {/* P4 — What you pay now */}
          {paymentMode !== "at_salon" && (
            <div className="mt-4 rounded-[10px] border-l-4 border-s-coral pl-3 pr-4 py-3 flex items-center justify-between"
              style={{ background: "rgba(232,98,74,.05)", borderTopColor: "rgba(232,98,74,.15)", borderRightColor: "rgba(232,98,74,.15)", borderBottomColor: "rgba(232,98,74,.15)" }}>
              <div>
                <p className="text-[9px] font-heading font-bold uppercase tracking-[.14em] text-s-coral">
                  {paymentMode === "prepay" ? "Jetzt zu zahlen" : "Anzahlung jetzt"}
                </p>
                <p className="text-[10px] font-body text-s-ink/40 mt-0.5">
                  {paymentMode === "prepay"
                    ? "Voller Betrag wird jetzt belastet"
                    : "Wird bei Erscheinen angerechnet"}
                </p>
              </div>
              <span className="font-heading font-bold text-xl text-s-coral">{formatCurrency(chargeAmount, locale)}</span>
            </div>
          )}
          </div>
        </div>

        {/* P5 — Promo code + credits */}
        <div className="bg-white rounded-[12px] border border-s-ink/[0.07] shadow-warm-md p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Tag className="w-3.5 h-3.5 text-s-coral" />
            <p className="text-[9px] font-heading font-bold uppercase tracking-[.14em] text-s-ink/40">
              Promo-Code oder Guthaben
            </p>
          </div>

          {/* Promo code input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
              placeholder="Code eingeben"
              disabled={!!promoResult}
              className="flex-1 px-4 py-3.5 rounded-[10px] border border-s-ink/[0.08] bg-white text-sm font-body text-s-ink uppercase tracking-[.08em] placeholder:text-s-ink/25 placeholder:normal-case placeholder:tracking-normal focus:border-s-coral focus:ring-2 focus:ring-s-coral/15 outline-none disabled:opacity-50 transition-colors"
            />
            {promoResult ? (
              <button
                onClick={() => { setPromoResult(null); setPromoCode(""); }}
                className="px-4 py-3.5 rounded-[10px] border border-s-ink/[0.08] text-[11px] font-heading font-bold uppercase tracking-[.06em] text-s-ink/50 hover:border-s-ink/20 transition-colors"
              >
                Entfernen
              </button>
            ) : (
              <InteractiveHoverButton
                onClick={handlePromoValidate}
                disabled={promoLoading || !promoCode.trim()}
                text={promoLoading ? "..." : "Anwenden"}
                className="px-5 rounded-btn text-[11px] font-heading font-bold uppercase tracking-[.06em] shadow-coral-glow disabled:opacity-50"
              />
            )}
          </div>

          {/* P6 — Promo error/success states */}
          {promoError && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-[10px] border border-s-coral/20"
              style={{ background: "rgba(232,98,74,.06)" }}>
              <AlertCircle size={13} className="text-s-coral shrink-0" />
              <p className="text-xs font-body text-s-coral">{promoError}</p>
            </div>
          )}

          {promoResult && (
            <div className="flex items-center justify-between rounded-[10px] border border-s-success/25 px-3 py-2.5"
              style={{ background: "rgba(46,125,50,.06)" }}>
              <div className="flex items-center gap-2">
                <CheckCircle size={13} className="text-s-success shrink-0" />
                <span className="text-xs font-heading font-semibold text-s-success">{promoResult.code} angewendet</span>
              </div>
              <span className="text-xs font-heading font-bold text-s-success">-{formatCurrency(promoResult.discount_amount, locale)}</span>
            </div>
          )}

          {/* P7 — User credits */}
          {userCredits > 0 && !promoResult && (
            <div className="flex items-center justify-between rounded-[10px] px-3 py-2.5"
              style={{ background: "rgba(212,135,10,.06)", border: "1px solid rgba(212,135,10,.15)" }}>
              <div className="flex items-center gap-2">
                <Wallet className="w-3.5 h-3.5 text-s-amber shrink-0" />
                <p className="text-[10px] font-heading font-bold uppercase tracking-[.10em] text-s-amber/80">
                  Guthaben verfügbar
                </p>
              </div>
              <span className="text-xs font-heading font-bold text-s-amber">{formatCurrency(userCredits, locale)}</span>
            </div>
          )}
        </div>

        {/* P5b — Voucher code section */}
        {!promoResult && (
          <div className="bg-white rounded-[12px] border border-s-ink/[0.07] shadow-warm-md p-5 space-y-3">
            <div className="flex items-center gap-2">
              <PartyPopper className="w-3.5 h-3.5 text-s-coral" />
              <p className="text-[9px] font-heading font-bold uppercase tracking-[.14em] text-s-ink/40">
                Gutscheincode
              </p>
            </div>

            {/* Voucher code input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                placeholder="Code eingeben"
                disabled={!!voucherResult}
                className="flex-1 px-4 py-3.5 rounded-[10px] border border-s-ink/[0.08] bg-white text-sm font-body text-s-ink uppercase tracking-[.08em] placeholder:text-s-ink/25 placeholder:normal-case placeholder:tracking-normal focus:border-s-coral focus:ring-2 focus:ring-s-coral/15 outline-none disabled:opacity-50 transition-colors"
              />
              {voucherResult ? (
                <button
                  onClick={() => { setVoucherResult(null); setVoucherCode(""); }}
                  className="px-4 py-3.5 rounded-[10px] border border-s-ink/[0.08] text-[11px] font-heading font-bold uppercase tracking-[.06em] text-s-ink/50 hover:border-s-ink/20:border-white/20 transition-colors"
                >
                  Entfernen
                </button>
              ) : (
                <InteractiveHoverButton
                  onClick={handleVoucherValidate}
                  disabled={voucherLoading || !voucherCode.trim()}
                  text={voucherLoading ? "..." : "Anwenden"}
                  className="px-5 rounded-btn text-[11px] font-heading font-bold uppercase tracking-[.06em] shadow-coral-glow disabled:opacity-50"
                />
              )}
            </div>

            {/* Voucher error/success states */}
            {voucherError && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-[10px] border border-s-coral/20"
                style={{ background: "rgba(232,98,74,.06)" }}>
                <AlertCircle size={13} className="text-s-coral shrink-0" />
                <p className="text-xs font-body text-s-coral">{voucherError}</p>
              </div>
            )}

            {voucherResult && (
              <div className="flex items-center justify-between rounded-[10px] border border-s-success/25 px-3 py-2.5"
                style={{ background: "rgba(46,125,50,.06)" }}>
                <div className="flex items-center gap-2">
                  <CheckCircle size={13} className="text-s-success shrink-0" />
                  <span className="text-xs font-heading font-semibold text-s-success">{voucherResult.code} angewendet</span>
                </div>
                <span className="text-xs font-heading font-bold text-s-success">-{formatCurrency(voucherResult.remaining_amount, locale)}</span>
              </div>
            )}

            {/* Show voucher message if available */}
            {voucherResult?.message && (
              <div className="text-xs font-body text-s-ink/60 italic px-3">
                "{voucherResult.message}"
              </div>
            )}
          </div>
        )}

        {/* Payment card — or at_salon confirm */}
        {paymentMode === "at_salon" ? (
          // P8 — At-salon confirm card
          <div className="bg-white rounded-[12px] border border-s-ink/[0.07] shadow-warm-md p-5">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0"
                style={{ background: "rgba(76,175,111,.10)" }}>
                <Wallet size={17} className="text-s-sage" />
              </div>
              <div>
                <p className="text-[9px] font-heading font-bold uppercase tracking-[.18em] text-s-ink/50 mb-0.5">
                  Zahlungsart
                </p>
                <h2 className="font-heading font-bold text-base text-s-ink">Zahlung vor Ort</h2>
                <p className="text-xs font-body text-s-ink/50 mt-1">Keine Online-Zahlung nötig. Du bezahlst direkt im Salon.</p>
              </div>
            </div>
            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-[10px] border border-s-coral/20 mb-3"
                style={{ background: "rgba(232,98,74,.06)" }}>
                <AlertCircle size={13} className="text-s-coral shrink-0" />
                <p className="text-xs font-body text-s-coral">{error}</p>
              </div>
            )}
            <InteractiveHoverButton
              onClick={handleAtSalonConfirm}
              disabled={confirmingAtSalon}
              text={confirmingAtSalon ? tc("confirming") : tc("confirmAppointment")}
              className="w-full py-4 rounded-btn text-[11px] font-heading font-bold uppercase tracking-[.06em] shadow-coral-glow disabled:opacity-60"
            />
            <p className="text-[10px] text-center font-heading uppercase tracking-[.10em] text-s-ink/25 mt-3">
              Kostenlose Stornierung bis {intent.free_cancel_hours ?? 24}h vorher
            </p>
          </div>
        ) : (
          // P10 — Payment card (Stripe Elements) — header only, DO NOT touch Elements/appearance
          <div className="bg-white rounded-[12px] border border-s-ink/[0.07] shadow-warm-md overflow-hidden">
            <div className="px-5 pt-5 pb-4 border-b border-s-ink/[0.05] flex items-center gap-2">
              <Lock size={13} className="text-s-ink/45 shrink-0" />
              <p className="text-[9px] font-heading font-bold uppercase tracking-[.14em] text-s-ink/45">
                Sichere Zahlung
              </p>
            </div>
            <div className="p-5">
            {clientSecret ? (
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: {
                    theme: "stripe",
                    variables: {
                      colorPrimary: "#C05038",
                      colorDanger: "#A32D2D",
                      borderRadius: "12px",
                      fontFamily: "DM Sans, sans-serif",
                    },
                  },
                }}
              >
                <CheckoutForm
                  intent={intent}
                  paymentIntentId={paymentIntentId!}
                  onSuccess={() => {}}
                />
              </Elements>
            ) : (
              <div className="flex justify-center py-6"><Spinner size="lg" /></div>
            )}
            </div>
          </div>
        )}

        {/* P12 — Trust strip */}
        <div className="flex items-center justify-center flex-wrap gap-3 py-6">
          {[
            { icon: Lock,       label: "256-bit SSL" },
            { icon: CreditCard, label: "Visa · Mastercard · Apple Pay" },
            { icon: Shield,     label: "Powered by Stripe" },
          ].map(({ icon: Icon, label }) => (
            <span key={label} className="flex items-center gap-1.5 text-[9px] font-heading font-bold uppercase tracking-[.10em] text-s-ink/25">
              <Icon size={10} />
              {label}
            </span>
          ))}
          <span className="text-[9px] font-heading font-bold uppercase tracking-[.10em] text-s-ink/25">TWINT</span>
        </div>
      </div>
    </motion.div>
  );
}
