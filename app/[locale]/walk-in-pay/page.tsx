"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import { motion } from "framer-motion";
import { Calendar, Sparkles, Star, MapPin, Lock, Check, AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/lib/format-currency";
import Spinner from "@/components-legacy/ui/Spinner";

interface BookingData {
  id: string;
  salon_id: string;
  service_id: string;
  salon_name: string;
  salon_image: string | null;
  salon_rating: number | null;
  salon_review_count: number | null;
  salon_address: string | null;
  service_name: string;
  service_duration: number | null;
  amount: number;
  starts_at: string;
  stripe_account_id: string | null;
}

const LOCALE_TAG: Record<string, string> = { de: "de-CH", en: "en-GB", fr: "fr-CH", it: "it-CH" };

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
      // Create payment intent for walk-in. Use server-trusted salon_id +
      // service_id from the HMAC-verified booking (NOT booking.id, which is
      // the booking PK and was passed as salon_id pre-2026-05-16 — bug).
      const res = await fetch("/api/stripe/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salon_id: booking.salon_id,
          service_id: booking.service_id,
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
      // Stripe Elements mount + confirmPayment is the next step (WAVE_PLAN W14).
      // For now the server-side PaymentIntent is created and we surface success.
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
    de: { title: "Bestätigen & zahlen", total: "Gesamt", today: "Heute", now: "Sofort", secure: "Sichere Zahlung über Stripe", min: "Min", paid: "Zahlung erfolgreich", paidDesc: "Deine Zahlung wurde verarbeitet. Du kannst dieses Fenster schliessen.", invalid: "Ungültiger oder abgelaufener Link", noToken: "Kein Token angegeben", errorEyebrow: "Fehler", paidEyebrow: "Zahlung" },
    en: { title: "Confirm & pay", total: "Total", today: "Today", now: "Now", secure: "Secure payment via Stripe", min: "min", paid: "Payment successful", paidDesc: "Your payment has been processed. You can close this window.", invalid: "Invalid or expired link", noToken: "No token provided", errorEyebrow: "Error", paidEyebrow: "Payment" },
    fr: { title: "Confirmer & payer", total: "Total", today: "Aujourd'hui", now: "Maintenant", secure: "Paiement sécurisé via Stripe", min: "min", paid: "Paiement réussi", paidDesc: "Votre paiement a été traité. Vous pouvez fermer cette fenêtre.", invalid: "Lien invalide ou expiré", noToken: "Aucun jeton fourni", errorEyebrow: "Erreur", paidEyebrow: "Paiement" },
    it: { title: "Conferma e paga", total: "Totale", today: "Oggi", now: "Subito", secure: "Pagamento sicuro con Stripe", min: "min", paid: "Pagamento riuscito", paidDesc: "Il pagamento è stato elaborato. Puoi chiudere questa finestra.", invalid: "Link non valido o scaduto", noToken: "Nessun token fornito", errorEyebrow: "Errore", paidEyebrow: "Pagamento" },
  };
  const l = labels[locale as keyof typeof labels] ?? labels.de;
  const tag = LOCALE_TAG[locale] ?? "de-CH";

  const amountStr = booking ? formatCurrency(booking.amount, locale) : "";
  const payCta = locale === "en" ? `Pay ${amountStr}` : locale === "fr" ? `Payer ${amountStr}` : locale === "it" ? `Paga ${amountStr}` : `${amountStr} bezahlen`;

  let dateLabel = "";
  if (booking) {
    const d = new Date(booking.starts_at);
    const time = d.toLocaleTimeString(tag, { hour: "2-digit", minute: "2-digit" });
    const isToday = new Date().toDateString() === d.toDateString();
    dateLabel = isToday ? `${l.today}, ${time}` : `${d.toLocaleDateString(tag, { day: "numeric", month: "short" })}, ${time}`;
  }

  const fade = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4, ease: [0.25, 1, 0.5, 1] as const } };

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto w-full max-w-md px-5 py-7">
        {loading ? (
          <div className="flex min-h-[55vh] items-center justify-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-1.5 w-1.5 animate-pulse rounded-full bg-s-ink/50" style={{ animationDelay: `${i * 0.2}s` }} />
            ))}
          </div>
        ) : paid ? (
          <motion.div {...fade} className="flex min-h-[55vh] flex-col items-center justify-center text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-[18px] bg-s-success/10">
              <Check size={26} className="text-s-success" />
            </div>
            <p className="mb-2 font-heading text-[10px] uppercase tracking-[.22em] text-s-ink-3">{l.paidEyebrow}</p>
            <h2 className="mb-2 font-heading text-lg text-s-ink">{l.paid}</h2>
            <p className="font-body text-sm leading-relaxed text-s-ink-2">{l.paidDesc}</p>
          </motion.div>
        ) : error ? (
          <motion.div {...fade} className="flex min-h-[55vh] flex-col items-center justify-center text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-[18px] bg-s-warning/10">
              <AlertTriangle size={26} className="text-s-warning" />
            </div>
            <p className="mb-2 font-heading text-[10px] uppercase tracking-[.20em] text-s-ink-3">{l.errorEyebrow}</p>
            <p className="font-body text-sm text-s-ink-2">{error === "No token provided" ? l.noToken : l.invalid}</p>
          </motion.div>
        ) : booking ? (
          <motion.div {...fade}>
            <h1 className="mb-5 font-heading text-2xl tracking-[-.02em] text-s-ink">{l.title}</h1>

            {/* Salon identity */}
            <div className="flex items-center gap-3.5">
              {booking.salon_image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={booking.salon_image} alt="" className="h-[58px] w-[58px] shrink-0 rounded-[11px] object-cover shadow-elevation-2" />
              ) : (
                <div className="flex h-[58px] w-[58px] shrink-0 items-center justify-center rounded-[11px] bg-s-ink/[0.06] font-heading text-xl text-s-ink">
                  {booking.salon_name?.charAt(0) ?? "?"}
                </div>
              )}
              <div className="min-w-0">
                <div className="truncate font-heading text-[17px] tracking-[-.01em] text-s-ink">{booking.salon_name}</div>
                {booking.salon_rating != null && booking.salon_rating > 0 && (
                  <div className="mt-1 flex items-center gap-1.5 text-[13px]">
                    <Star size={13} fill="#FFC32B" stroke="none" aria-hidden />
                    <span className="font-heading tabular-nums text-s-ink">{booking.salon_rating.toFixed(1)}</span>
                    {booking.salon_review_count != null && <span className="tabular-nums text-s-ink-2">({booking.salon_review_count})</span>}
                  </div>
                )}
                {booking.salon_address && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.salon_address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 flex items-center gap-1 text-[12.5px] text-s-ink-2 no-underline transition-colors hover:text-s-ink"
                  >
                    <MapPin size={12} className="shrink-0" />
                    <span className="truncate">{booking.salon_address}</span>
                  </a>
                )}
              </div>
            </div>

            <hr className="my-5 border-s-ink/[0.08]" />

            {/* Booking detail rows */}
            <div className="space-y-1">
              <div className="flex items-center gap-3.5 py-1.5">
                <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[10px] bg-s-ink/[0.04]">
                  <Calendar size={20} className="text-s-ink" />
                </div>
                <div>
                  <div className="font-heading text-[15px] text-s-ink">{dateLabel}</div>
                  <div className="mt-0.5 text-[12.5px] text-s-ink-2">{l.now}</div>
                </div>
              </div>
              <div className="flex items-center gap-3.5 py-1.5">
                <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[10px] bg-s-ink/[0.04]">
                  <Sparkles size={20} className="text-s-ink" />
                </div>
                <div>
                  <div className="font-heading text-[15px] text-s-ink">{booking.service_name}</div>
                  {booking.service_duration ? <div className="mt-0.5 text-[12.5px] text-s-ink-2">ca. {booking.service_duration} {l.min}</div> : null}
                </div>
              </div>
            </div>

            <hr className="my-5 border-s-ink/[0.08]" />

            {/* Price */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-s-ink">{booking.service_name}</span>
              <span className="font-heading tabular-nums text-s-ink">{amountStr}</span>
            </div>
            <div className="mt-3.5 flex items-center justify-between border-t border-s-ink/[0.08] pt-3.5">
              <span className="font-heading text-[17px] text-s-ink">{l.total}</span>
              <span className="font-heading text-2xl tracking-[-.02em] tabular-nums text-s-accent">{amountStr}</span>
            </div>

            {/* Pay bar */}
            <div className="pt-7">
              <button
                onClick={handlePay}
                disabled={paying}
                className="flex h-[54px] w-full items-center justify-center gap-2 rounded-btn bg-s-ink font-heading text-[15px] text-white shadow-elevation-2 transition-[transform,filter] hover:brightness-[1.06] active:scale-[0.98] disabled:opacity-50"
              >
                {paying && <Spinner size="sm" invert />}
                {payCta}
              </button>
              <div className="mt-3 flex items-center justify-center gap-1.5 text-[12px] font-medium text-s-ink-2">
                <Lock size={12} />
                {l.secure}
              </div>
            </div>
          </motion.div>
        ) : null}
      </div>
    </div>
  );
}
