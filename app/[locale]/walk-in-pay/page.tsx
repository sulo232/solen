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
        transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
        className="bg-white dark:bg-s-dm-surface rounded-card max-w-md w-full p-6 shadow-v5-float"
      >
        {loading ? (
          <div className="flex items-center justify-center gap-1.5 py-14">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-s-coral/50 animate-pulse"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        ) : paid ? (
          <div className="text-center py-8">
            <div
              className="w-16 h-16 rounded-[18px] mx-auto mb-5 flex items-center justify-center"
              style={{ background: "rgba(232,98,74,.10)" }}
            >
              <Check size={26} className="text-s-coral" />
            </div>
            <p className="text-[9px] font-heading font-bold uppercase tracking-[.22em] text-s-coral mb-2">
              Zahlung
            </p>
            <h2 className="font-heading font-bold text-lg text-s-ink dark:text-s-dm-text mb-2">{l.paid}</h2>
            <p className="text-sm font-body text-s-ink/50 dark:text-s-dm-text/50 leading-relaxed">{l.paidDesc}</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <div
              className="w-16 h-16 rounded-[18px] mx-auto mb-5 flex items-center justify-center"
              style={{ background: "rgba(212,135,10,.10)" }}
            >
              <AlertTriangle size={26} className="text-s-amber" />
            </div>
            <p className="text-[9px] font-heading font-bold uppercase tracking-[.20em] text-s-amber mb-2">
              Fehler
            </p>
            <p className="text-sm font-body text-s-ink/60 dark:text-s-dm-text/60">
              {error === "No token provided" ? l.noToken : l.invalid}
            </p>
          </div>
        ) : booking ? (
          <>
            <div className="flex items-start gap-3 mb-6">
              <div
                className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0"
                style={{ background: "rgba(232,98,74,.10)" }}
              >
                <CreditCard size={17} className="text-s-coral" />
              </div>
              <div>
                <p className="text-[9px] font-heading font-bold uppercase tracking-[.18em] text-s-ink/50 dark:text-s-dm-text/50 mb-0.5">
                  Walk-in
                </p>
                <h1 className="font-heading font-bold text-lg text-s-ink dark:text-s-dm-text">{l.title}</h1>
              </div>
            </div>

            <div className="rounded-[12px] p-4 mb-6 space-y-3" style={{ background: "rgba(26,18,9,.03)" }}>
              {/* Salon row */}
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-heading font-bold uppercase tracking-[.12em] text-s-ink/50 dark:text-s-dm-text/50">{l.salon}</span>
                <span className="text-xs font-heading font-semibold text-s-ink dark:text-s-dm-text">{booking.salon_name}</span>
              </div>
              {/* Service row */}
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-heading font-bold uppercase tracking-[.12em] text-s-ink/50 dark:text-s-dm-text/50">{l.service}</span>
                <span className="text-xs font-heading font-semibold text-s-ink dark:text-s-dm-text">{booking.service_name}</span>
              </div>
              {/* Time row */}
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-heading font-bold uppercase tracking-[.12em] text-s-ink/50 dark:text-s-dm-text/50">{l.time}</span>
                <span className="text-xs font-heading font-semibold text-s-ink dark:text-s-dm-text flex items-center gap-1">
                  <Clock size={11} className="text-s-ink/40" />
                  {new Date(booking.starts_at).toLocaleTimeString(locale === "de" ? "de-CH" : "en-GB", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              {/* Amount row */}
              <div className="border-t border-s-ink/[0.07] dark:border-white/[0.06] pt-3 flex justify-between items-center">
                <span className="text-[9px] font-heading font-bold uppercase tracking-[.12em] text-s-ink/50 dark:text-s-dm-text/50">{l.amount}</span>
                <span className="font-heading font-bold text-lg text-s-coral">{formatCurrency(booking.amount, locale)}</span>
              </div>
            </div>

            <button
              onClick={handlePay}
              disabled={paying}
              className="w-full px-4 py-3.5 rounded-btn bg-s-coral text-white text-xs font-heading font-bold uppercase tracking-[.04em] hover:brightness-[1.06] active:scale-[0.97] disabled:opacity-50 flex items-center justify-center gap-2 transition-[transform,filter] shadow-coral-glow"
            >
              {paying ? <Spinner size="sm" invert /> : <CreditCard size={15} />}
              {l.pay}
            </button>
          </>
        ) : null}
      </motion.div>
    </div>
  );
}
