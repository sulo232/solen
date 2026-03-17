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
import { MapPin, Calendar, User, Shield, ChevronRight, Loader2, Lock, CreditCard } from "lucide-react";
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
        Kostenlose Stornierung bis 24 Stunden vorher
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

    // Create payment intent
    fetch("/api/stripe/create-payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        salon_id: parsed.salon_id,
        service_name: parsed.service_name,
        estimated_price: parsed.estimated_price,
        deposit_amount: parsed.deposit_amount,
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

  const remainder = intent.estimated_price - intent.deposit_amount;

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
        <div className="bg-white rounded-card shadow-card p-5">
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
            <div className="flex justify-between text-dark/60">
              <span>Kaution (No-Show-Schutz)</span>
              <span>– CHF {intent.deposit_amount.toFixed(2)}</span>
            </div>
            <div className="border-t border-gray-100 pt-2 flex justify-between">
              <span className="text-dark/50 text-xs">Restbetrag vor Ort</span>
              <span className="text-dark/50 text-xs">CHF {remainder.toFixed(2)}</span>
            </div>
          </div>

          {/* What you pay now */}
          <div className="mt-3 bg-teal/5 border border-teal/15 rounded-button p-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-teal font-semibold">Jetzt zu zahlen (Kaution)</p>
              <p className="text-xs text-dark/40 mt-0.5">Wird bei Erscheinen auf den Gesamtpreis angerechnet</p>
            </div>
            <span className="font-heading font-bold text-lg text-teal">CHF {intent.deposit_amount.toFixed(2)}</span>
          </div>
        </div>

        {/* Payment card */}
        <div className="bg-white rounded-card shadow-card p-5">
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

        {/* Trust badges */}
        <div className="flex items-center justify-center gap-4 text-xs text-dark/30 pb-8 flex-wrap">
          <span className="flex items-center gap-1"><Lock size={11} /> 256-bit SSL</span>
          <span>·</span>
          <span className="flex items-center gap-1"><CreditCard size={11} /> Card, TWINT, Apple Pay, Google Pay</span>
          <span>·</span>
          <span className="flex items-center gap-1"><Shield size={11} /> Powered by Stripe</span>
        </div>
      </div>
    </motion.div>
  );
}
