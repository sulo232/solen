"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useLocale } from "next-intl";
import { Heart, Check, AlertCircle } from "lucide-react";
import Spinner from "@/components/ui/Spinner";
import { formatCurrency } from "@/lib/format-currency";

const TIP_PRESETS = [500, 1000, 1500]; // in cents

const labels = {
  de: { thanks: "Danke für dein Trinkgeld!", sent: "gesendet", give: "Trinkgeld geben", custom: "Eigener Betrag", send: "Trinkgeld senden", error: "Fehler" },
  en: { thanks: "Thank you for your tip!", sent: "sent", give: "Leave a tip", custom: "Custom amount", send: "Send tip", error: "Error" },
  fr: { thanks: "Merci pour votre pourboire !", sent: "envoyé", give: "Laisser un pourboire", custom: "Montant personnalisé", send: "Envoyer le pourboire", error: "Erreur" },
  it: { thanks: "Grazie per la mancia!", sent: "inviato", give: "Lascia una mancia", custom: "Importo personalizzato", send: "Invia mancia", error: "Errore" },
};

export default function TipPage() {
  const params = useParams();
  const locale = useLocale();
  const l = labels[locale as keyof typeof labels] ?? labels.de;
  const bookingId = params.bookingId as string;
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAmount, setSelectedAmount] = useState(1000);
  const [customAmount, setCustomAmount] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [paying, setPaying] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/bookings/${bookingId}`)
      .then((r) => r.json())
      .then((d) => setBooking(d.booking ?? d))
      .catch((err) => console.error("[Tip] failed to load booking:", err))
      .finally(() => setLoading(false));
  }, [bookingId]);

  const tipAmount = useCustom ? Math.round(Number(customAmount) * 100) : selectedAmount;

  const handlePay = async () => {
    if (tipAmount < 100) return; // Min CHF 1
    setPaying(true);
    setError(null);
    try {
      const res = await fetch("/api/tips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ booking_id: bookingId, amount: tipAmount }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? l.error);
      }
      // In a full implementation, we'd use Stripe Elements here to confirm the payment
      // For now, the PaymentIntent is created and the tip is recorded
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : l.error);
    } finally {
      setPaying(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-s-bg-base dark:bg-s-dm-bg">
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="w-1.5 h-1.5 rounded-full bg-s-coral/50 animate-pulse"
            style={{ animationDelay: `${i * 0.2}s` }} />
        ))}
      </div>
    </div>
  );

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-s-bg-base dark:bg-s-dm-bg px-4">
        <div className="text-center">
          <div className="w-16 h-16 rounded-[18px] flex items-center justify-center mx-auto mb-5 animate-bounce"
            style={{ background: "rgba(232,98,74,.10)" }}>
            <Check size={28} className="text-s-coral" />
          </div>
          <p className="text-[9px] font-heading font-bold uppercase tracking-[.22em] text-s-coral mb-2">
            Trinkgeld gesendet
          </p>
          <h1 className="font-heading font-bold text-xl text-s-ink dark:text-s-dm-text mb-2">
            {l.thanks}
          </h1>
          <p className="text-xs font-heading font-semibold text-s-ink/50 dark:text-s-dm-text/50">
            {formatCurrency(tipAmount / 100, locale)} {l.sent}
          </p>
        </div>
      </div>
    );
  }

  const staffName = booking?.staff_name ?? booking?.staff_member_name ?? "Stylist";
  const staffAvatar = booking?.staff_avatar_url ?? null;
  const serviceName = booking?.service_name ?? "Service";

  return (
    <div className="min-h-screen bg-s-bg-base dark:bg-s-dm-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-20 h-20 rounded-full bg-s-coral/10 flex items-center justify-center mx-auto mb-3 overflow-hidden relative">
            {staffAvatar ? (
              <Image src={staffAvatar} alt="" fill className="object-cover" unoptimized />
            ) : (
              <Heart size={28} className="text-s-coral" />
            )}
          </div>
          <h1 className="font-heading font-bold text-xl text-s-ink dark:text-s-dm-text">{staffName}</h1>
          <p className="text-sm text-s-ink/40 dark:text-s-dm-text/40">{serviceName}</p>
        </div>

        <div className="bg-white dark:bg-s-dm-surface rounded-card p-5 shadow-v5-card">
          <p className="text-[9px] font-heading font-bold uppercase tracking-[.20em] text-s-ink/45 dark:text-s-dm-text/45 mb-3">
            {l.give}
          </p>

          {/* Preset amounts */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            {TIP_PRESETS.map((amount) => (
              <button key={amount}
                onClick={() => { setSelectedAmount(amount); setUseCustom(false); }}
                className={`py-3 rounded-btn text-xs font-heading font-bold transition-colors ${
                  !useCustom && selectedAmount === amount
                    ? "bg-s-coral text-white shadow-coral-glow"
                    : "border border-s-ink/[0.08] dark:border-white/[0.08] text-s-ink/65 dark:text-s-dm-text/65 hover:border-s-coral/50"
                }`}>
                {formatCurrency(amount / 100, locale)}
              </button>
            ))}
          </div>

          {/* Custom amount */}
          <button onClick={() => setUseCustom(true)}
            className={`w-full py-2.5 rounded-btn text-[10px] font-heading font-bold uppercase tracking-[.06em] mb-3 transition-colors ${
              useCustom
                ? "border border-s-coral/25 text-s-coral"
                : "border border-s-ink/[0.08] dark:border-white/[0.08] text-s-ink/45 dark:text-s-dm-text/45"
            }`}
            style={useCustom ? { background: "rgba(232,98,74,.06)" } : undefined}>
            {l.custom}
          </button>
          {useCustom && (
            <div className="relative mb-3">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-heading font-bold text-s-ink/45 dark:text-s-dm-text/45">
                CHF
              </span>
              <input type="number" min="1" step="0.5"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-12 pr-3 py-3 rounded-[10px] border border-s-ink/[0.08] dark:border-white/[0.08] bg-white dark:bg-s-dm-bg text-sm font-body text-s-ink dark:text-s-dm-text focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/15 transition-colors"
                autoFocus />
            </div>
          )}

          {error && (
            <div className="flex items-center gap-1.5 mb-3">
              <AlertCircle size={12} className="text-s-coral shrink-0" />
              <p className="text-[10px] font-heading font-bold text-s-coral">{error}</p>
            </div>
          )}

          <button onClick={handlePay}
            disabled={paying || tipAmount < 100}
            className="w-full py-3.5 rounded-btn bg-s-coral text-white text-xs font-heading font-bold uppercase tracking-[.04em] hover:brightness-[1.06] active:scale-[0.97] transition-[transform,filter] disabled:opacity-50 flex items-center justify-center gap-2 shadow-coral-glow">
            {paying ? <Spinner size="sm" invert /> : <Heart size={13} />}
            {formatCurrency(tipAmount / 100, locale)} — {l.send}
          </button>
        </div>
      </div>
    </div>
  );
}
