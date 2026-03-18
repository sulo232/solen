"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { motion } from "framer-motion";
import { MapPin, Calendar, User, Shield, ChevronRight, Loader2, Lock, CreditCard, Tag, Wallet } from "lucide-react";
import Spinner from "@/components/ui/Spinner";

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
        return_url: `${window.location.origin}/de/checkout/success?booking_intent=${encodeURIComponent(window.location.search.replace("?booking_intent=", ""))}&pi=${paymentIntentId}`,
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
        <div className="rounded-button bg-coral/10 border border-coral/20 px-3 py-2.5 text-sm text-coral">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full py-3.5 rounded-button bg-teal text-white font-semibold text-sm hover:bg-teal/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
        {loading ? "Verarbeite..." : `Jetzt buchen · CHF ${intent.deposit_amount.toFixed(2)}`}
      </button>

      <p className="text-xs text-center text-dark/40">
        Kostenlose Stornierung bis {intent.free_cancel_hours ?? 24} Stunden vorher
      </p>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main checkout page
// ─────────────────────────────────────────────────────────────────────────────

export default function CheckoutPage() {
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

  // User credits
  const [userCredits, setUserCredits] = useState(0);

  useEffect(() => {
    const raw = searchParams.get("booking_intent");
    if (!raw) { setError("Keine Buchungsdaten gefunden."); setLoading(false); return; }

    let parsed: BookingIntent;
    try {
      parsed = JSON.parse(decodeURIComponent(raw));
    } catch {
      setError("Ungültige Buchungsdaten."); setLoading(false); return;
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
      .catch(() => setError("Fehler beim Laden der Zahlungsseite."))
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
      .catch(() => {});
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
        setPromoError(data.message ?? "Ungültiger Code");
      }
    } catch {
      setPromoError("Fehler bei der Validierung");
    } finally {
      setPromoLoading(false);
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
      if (!res.ok) throw new Error((await res.json()).message ?? "Fehler");
      setAtSalonConfirmed(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Buchung fehlgeschlagen");
    } finally {
      setConfirmingAtSalon(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !intent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8">
          <p className="text-coral font-medium mb-2">Fehler</p>
          <p className="text-dark/60 text-sm">{error ?? "Etwas ist schiefgelaufen."}</p>
          <a href="/de" className="mt-4 inline-block text-teal text-sm underline">Zurück zur Startseite</a>
        </div>
      </div>
    );
  }

  const paymentMode = intent.payment_mode ?? "at_salon";
  const chargeAmount = paymentMode === "prepay" ? intent.estimated_price : intent.deposit_amount;
  const remainder = intent.estimated_price - chargeAmount;

  // At-salon confirmed success
  if (atSalonConfirmed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="rounded-card border border-teal/20 bg-teal/5 p-8 flex flex-col items-center gap-4 text-center max-w-sm w-full">
          <span className="text-5xl">🎉</span>
          <p className="font-heading font-bold text-xl text-dark">Buchung bestätigt!</p>
          <p className="text-sm text-dark/60">Du zahlst direkt im Salon. Bis bald!</p>
          <a href="/de/profile" className="mt-2 px-6 py-2.5 rounded-button bg-teal text-white text-sm font-medium hover:bg-teal/90 transition-colors">
            Meine Buchungen
          </a>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-gray-50 py-12 px-4"
    >
      {/* Breadcrumb */}
      <div className="max-w-lg mx-auto mb-4 text-xs text-dark/40 flex items-center gap-1">
        <a href="/de" className="hover:text-teal transition-colors">Startseite</a>
        <ChevronRight className="w-3 h-3" />
        <span className="text-dark/60">Buchung abschliessen</span>
      </div>

      <div className="max-w-lg mx-auto space-y-4">
        {/* Booking summary card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-card border border-gray-100 shadow-card p-5">
          <h1 className="font-heading font-bold text-lg text-dark mb-4">Buchungsübersicht</h1>

          <div className="space-y-2.5 text-sm">
            <div className="flex items-start gap-2.5 text-dark/70">
              <MapPin className="w-4 h-4 text-teal mt-0.5 shrink-0" />
              <span><strong className="text-dark">{intent.salon_name}</strong>{intent.salon_address ? ` · ${intent.salon_address}` : ""}</span>
            </div>
            <div className="flex items-center gap-2.5 text-dark/70">
              <Calendar className="w-4 h-4 text-teal shrink-0" />
              <span>{intent.date} · {intent.time} Uhr</span>
            </div>
            {intent.staff_name && (
              <div className="flex items-center gap-2.5 text-dark/70">
                <User className="w-4 h-4 text-teal shrink-0" />
                <span>{intent.staff_name}</span>
              </div>
            )}
          </div>

          <div className="border-t border-gray-100 mt-4 pt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-dark/60">{intent.service_name}</span>
              <span className="font-medium text-dark">CHF {intent.estimated_price.toFixed(2)}</span>
            </div>
            {paymentMode === "deposit" && (
              <>
                <div className="flex justify-between text-dark/60">
                  <span>Anzahlung ({Math.round((chargeAmount / intent.estimated_price) * 100)}%)</span>
                  <span>CHF {chargeAmount.toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-100 pt-2 flex justify-between">
                  <span className="text-dark/50 text-xs">Restbetrag vor Ort</span>
                  <span className="text-dark/50 text-xs">CHF {remainder.toFixed(2)}</span>
                </div>
              </>
            )}
            {paymentMode === "at_salon" && (
              <div className="flex justify-between text-teal">
                <span>Zahlung vor Ort</span>
                <span className="font-medium">CHF {intent.estimated_price.toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* What you pay now */}
          {paymentMode !== "at_salon" && (
            <div className="mt-3 bg-teal/5 border border-teal/15 rounded-button p-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-teal font-semibold">
                  {paymentMode === "prepay" ? "Jetzt zu zahlen" : "Anzahlung jetzt"}
                </p>
                <p className="text-xs text-dark/40 mt-0.5">
                  {paymentMode === "prepay"
                    ? "Voller Betrag wird jetzt belastet"
                    : "Wird bei Erscheinen auf den Gesamtpreis angerechnet"}
                </p>
              </div>
              <span className="font-heading font-bold text-lg text-teal">CHF {chargeAmount.toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* Promo code + credits */}
        <div className="bg-white/80 backdrop-blur-xl rounded-card border border-gray-100 shadow-card p-5 space-y-3">
          <h2 className="font-heading font-semibold text-sm text-dark flex items-center gap-2">
            <Tag className="w-4 h-4 text-teal" />
            Promo-Code oder Guthaben
          </h2>

          {/* Promo code input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
              placeholder="Code eingeben"
              disabled={!!promoResult}
              className="flex-1 px-3 py-2 rounded-button border border-gray-200 bg-white text-sm text-dark placeholder:text-dark/30 focus:border-teal focus:ring-2 focus:ring-teal/20 outline-none disabled:opacity-50"
            />
            {promoResult ? (
              <button
                onClick={() => { setPromoResult(null); setPromoCode(""); }}
                className="px-3 py-2 rounded-button bg-gray-100 text-dark/60 text-sm hover:bg-gray-200 transition-colors"
              >
                Entfernen
              </button>
            ) : (
              <button
                onClick={handlePromoValidate}
                disabled={promoLoading || !promoCode.trim()}
                className="px-4 py-2 rounded-button bg-teal text-white text-sm font-medium hover:bg-teal/90 transition-colors disabled:opacity-50"
              >
                {promoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Anwenden"}
              </button>
            )}
          </div>

          {promoError && (
            <p className="text-xs text-coral">{promoError}</p>
          )}

          {promoResult && (
            <div className="flex items-center justify-between bg-teal/5 border border-teal/15 rounded-button px-3 py-2">
              <span className="text-sm text-teal font-medium">{promoResult.code} angewendet</span>
              <span className="text-sm font-data font-bold text-teal">-CHF {promoResult.discount_amount.toFixed(2)}</span>
            </div>
          )}

          {/* User credits */}
          {userCredits > 0 && !promoResult && (
            <div className="flex items-center justify-between bg-gray-50 rounded-button px-3 py-2">
              <span className="text-sm text-dark/60 flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-teal" />
                Guthaben verfügbar
              </span>
              <span className="text-sm font-data font-semibold text-teal">CHF {userCredits.toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* Payment card — or at_salon confirm */}
        {paymentMode === "at_salon" ? (
          <div className="bg-white/80 backdrop-blur-xl rounded-card border border-gray-100 shadow-card p-5">
            <h2 className="font-heading font-bold text-base text-dark mb-3">Zahlung vor Ort</h2>
            <p className="text-sm text-dark/60 mb-4">
              Keine Online-Zahlung nötig. Du bezahlst direkt im Salon.
            </p>
            {error && (
              <div className="rounded-button bg-coral/10 border border-coral/20 px-3 py-2.5 text-sm text-coral mb-3">
                {error}
              </div>
            )}
            <button
              onClick={handleAtSalonConfirm}
              disabled={confirmingAtSalon}
              className="w-full py-3.5 rounded-button bg-teal text-white font-semibold text-sm hover:bg-teal/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {confirmingAtSalon ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
              {confirmingAtSalon ? "Wird bestätigt..." : "Termin bestätigen"}
            </button>
            <p className="text-xs text-center text-dark/40 mt-3">
              Kostenlose Stornierung bis {intent.free_cancel_hours ?? 24} Stunden vorher
            </p>
          </div>
        ) : (
          <div className="bg-white/80 backdrop-blur-xl rounded-card border border-gray-100 shadow-card p-5">
            <h2 className="font-heading font-bold text-base text-dark mb-4">Zahlung</h2>

            {clientSecret ? (
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: {
                    theme: "stripe",
                    variables: {
                      colorPrimary: "#4ECDC4",
                      colorDanger: "#FF6B6B",
                      borderRadius: "8px",
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
              <div className="flex justify-center py-8"><Spinner size="lg" /></div>
            )}
          </div>
        )}

        {/* Payment method icons */}
        <div className="flex items-center justify-center gap-4 text-xs text-dark/30 pb-8 flex-wrap">
          <span className="flex items-center gap-1"><Lock size={11} /> 256-bit SSL</span>
          <span>·</span>
          <span className="flex items-center gap-1"><CreditCard size={11} /> Visa, Mastercard, Apple Pay</span>
          <span>·</span>
          <span>TWINT</span>
          <span>·</span>
          <span className="flex items-center gap-1"><Shield size={11} /> Powered by Stripe</span>
        </div>
      </div>
    </motion.div>
  );
}
