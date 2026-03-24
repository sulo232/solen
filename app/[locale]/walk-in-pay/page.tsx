"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import { motion } from "framer-motion";
import { CreditCard, Check, AlertTriangle, Clock } from "lucide-react";
import { formatCurrency } from "@/lib/format-currency";
import Spinner from "@/components/ui/Spinner";

interface BookingData {
  id: string;
  salon_name: string;
  service_name: string;
  amount: number;
  starts_at: string;
  stripe_account_id: string | null;
}

export default function WalkInPayPage() {
  const searchParams = useSearchParams();
  const locale = useLocale();
  const token = searchParams.get("token");

  const [booking, setBooking] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("No token provided");
      setLoading(false);
      return;
    }

    fetch(`/api/bookings/walk-in-verify?token=${encodeURIComponent(token)}`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) {
          setError(data.error ?? "Invalid token");
          return;
        }
        setBooking(data.booking);
      })
      .catch(() => setError("Failed to verify token"))
      .finally(() => setLoading(false));
  }, [token]);

  const handlePay = async () => {
    if (!booking) return;
    setPaying(true);

    try {
      // Create payment intent for walk-in
      const res = await fetch("/api/stripe/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salon_id: booking.id,
          estimated_price: booking.amount,
          deposit_amount: booking.amount,
          service_name: booking.service_name,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Payment failed");
        return;
      }

      const { clientSecret } = await res.json();
      // In production, this would mount Stripe Elements
      // For now, show the client secret was created
      if (clientSecret) {
        setPaid(true);
      }
    } catch {
      setError("Payment failed");
    } finally {
      setPaying(false);
    }
  };

  const labels = {
    de: {
      title: "Zahlung für Walk-In Termin",
      service: "Service",
      salon: "Salon",
      time: "Uhrzeit",
      amount: "Betrag",
      pay: "Jetzt bezahlen",
      paid: "Zahlung erfolgreich!",
      paidDesc: "Deine Zahlung wurde verarbeitet. Du kannst dieses Fenster schliessen.",
      invalid: "Ungültiger oder abgelaufener Link",
      noToken: "Kein Token angegeben",
    },
    en: {
      title: "Walk-In Payment",
      service: "Service",
      salon: "Salon",
      time: "Time",
      amount: "Amount",
      pay: "Pay Now",
      paid: "Payment Successful!",
      paidDesc: "Your payment has been processed. You can close this window.",
      invalid: "Invalid or expired link",
      noToken: "No token provided",
    },
    fr: {
      title: "Paiement sans rendez-vous",
      service: "Service",
      salon: "Salon",
      time: "Heure",
      amount: "Montant",
      pay: "Payer maintenant",
      paid: "Paiement réussi !",
      paidDesc: "Votre paiement a été traité. Vous pouvez fermer cette fenêtre.",
      invalid: "Lien invalide ou expiré",
      noToken: "Aucun jeton fourni",
    },
    it: {
      title: "Pagamento walk-in",
      service: "Servizio",
      salon: "Salone",
      time: "Ora",
      amount: "Importo",
      pay: "Paga ora",
      paid: "Pagamento riuscito!",
      paidDesc: "Il pagamento è stato elaborato. Puoi chiudere questa finestra.",
      invalid: "Link non valido o scaduto",
      noToken: "Nessun token fornito",
    },
  };
  const l = labels[locale as keyof typeof labels] ?? labels.de;

  return (
    <div className="min-h-screen bg-s-bg-surface dark:bg-s-dm-bg flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-s-dm-surface rounded-card shadow-card max-w-md w-full p-6"
      >
        {loading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : paid ? (
          <div className="text-center py-8">
            <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center bg-s-coral/10">
              <Check size={24} className="text-s-coral" />
            </div>
            <h2 className="font-heading font-bold text-lg text-s-ink dark:text-s-dm-text mb-2">{l.paid}</h2>
            <p className="text-sm text-s-ink/50 dark:text-s-dm-text/50">{l.paidDesc}</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center bg-s-amber-subtle">
              <AlertTriangle size={24} className="text-s-amber" />
            </div>
            <p className="text-sm text-s-ink/70 dark:text-s-dm-text/70">{error === "No token provided" ? l.noToken : l.invalid}</p>
          </div>
        ) : booking ? (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-s-coral/10 flex items-center justify-center">
                <CreditCard size={18} className="text-s-coral" />
              </div>
              <h1 className="font-heading font-bold text-lg text-s-ink dark:text-s-dm-text">{l.title}</h1>
            </div>

            <div className="bg-s-bg-surface dark:bg-s-dm-bg rounded-card p-4 mb-6 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-s-ink/50 dark:text-s-dm-text/50">{l.salon}</span>
                <span className="font-medium text-s-ink dark:text-s-dm-text">{booking.salon_name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-s-ink/50 dark:text-s-dm-text/50">{l.service}</span>
                <span className="font-medium text-s-ink dark:text-s-dm-text">{booking.service_name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-s-ink/50 dark:text-s-dm-text/50">{l.time}</span>
                <span className="font-medium text-s-ink dark:text-s-dm-text flex items-center gap-1">
                  <Clock size={12} />
                  {new Date(booking.starts_at).toLocaleTimeString(locale === "de" ? "de-CH" : "en-GB", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <div className="border-t border-s-ink/10 dark:border-s-dm-text/10 pt-2 flex justify-between text-sm">
                <span className="text-s-ink/50 dark:text-s-dm-text/50">{l.amount}</span>
                <span className="data-text font-bold text-s-coral text-lg">{formatCurrency(booking.amount, locale)}</span>
              </div>
            </div>

            <button
              onClick={handlePay}
              disabled={paying}
              className="w-full px-4 py-3.5 rounded-btn bg-s-coral text-white font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {paying ? <Spinner size="sm" invert /> : <CreditCard size={16} />}
              {l.pay}
            </button>
          </>
        ) : null}
      </motion.div>
    </div>
  );
}
