"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle, Calendar, Scissors } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import AnimatedButton from "@/components/ui/AnimatedButton";
import Spinner from "@/components/ui/Spinner";

interface BookingWithIncrease {
  id: string;
  starts_at: string;
  estimated_price: number;
  final_price: number;
  price_paid: number;
  status: string;
  payment_status: string;
  price_increase_requested_at: string | null;
  services: { name_de: string } | null;
  salons: { name: string; slug: string } | null;
}

export default function ApproveIncreasePage() {
  const params = useParams();
  const bookingId = params.id as string;
  const locale = useLocale();
  const router = useRouter();

  const [booking, setBooking] = useState<BookingWithIncrease | null>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [approved, setApproved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/bookings/${bookingId}`)
      .then((r) => r.json())
      .then((d) => setBooking(d.data ?? null))
      .catch(() => setError("Buchung nicht gefunden."))
      .finally(() => setLoading(false));
  }, [bookingId]);

  const handleApprove = async () => {
    setApproving(true);
    try {
      const res = await fetch("/api/stripe/approve-increase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ booking_id: bookingId }),
      });
      if (!res.ok) throw new Error("Fehler beim Bestätigen.");
      setApproved(true);
      setTimeout(() => router.push(`/${locale}/profile`), 2500);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unbekannter Fehler.");
    } finally {
      setApproving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <AlertTriangle size={32} className="text-coral mx-auto mb-3" />
          <p className="text-dark font-medium">{error ?? "Buchung nicht gefunden."}</p>
          <button onClick={() => router.push(`/${locale}/profile`)} className="mt-4 text-teal text-sm underline">
            Zurück zum Konto
          </button>
        </div>
      </div>
    );
  }

  if (!booking.price_increase_requested_at) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <CheckCircle size={32} className="text-teal mx-auto mb-3" />
          <p className="text-dark font-medium">Keine ausstehende Preiserhöhung.</p>
          <button onClick={() => router.push(`/${locale}/profile`)} className="mt-4 text-teal text-sm underline">
            Zurück zum Konto
          </button>
        </div>
      </div>
    );
  }

  const diff = (booking.final_price ?? 0) - (booking.estimated_price ?? 0);
  const dateStr = new Date(booking.starts_at).toLocaleDateString("de-CH", {
    weekday: "long", day: "numeric", month: "long",
  });
  const timeStr = new Date(booking.starts_at).toLocaleTimeString("de-CH", {
    hour: "2-digit", minute: "2-digit",
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal/5 to-white py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-md mx-auto space-y-4"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-3">
            <AlertTriangle size={24} className="text-amber-500" />
          </div>
          <h1 className="font-heading font-bold text-2xl text-dark">Preisänderung</h1>
          <p className="text-sm text-dark/50 mt-1">Der Salon hat eine Preisanpassung beantragt.</p>
        </div>

        {/* Booking info */}
        <GlassCard>
          <div className="flex items-center gap-2.5 mb-3">
            <Scissors size={16} className="text-teal shrink-0" />
            <span className="font-medium text-dark">{booking.services?.name_de ?? "Service"}</span>
          </div>
          <div className="flex items-center gap-2.5 text-sm text-dark/60">
            <Calendar size={14} className="text-teal shrink-0" />
            <span>{dateStr} · {timeStr} Uhr</span>
          </div>
          <p className="text-sm text-dark/50 mt-1 ml-5">{booking.salons?.name ?? "Salon"}</p>
        </GlassCard>

        {/* Price comparison */}
        <GlassCard>
          <h2 className="font-heading font-semibold text-dark text-sm mb-4">Preisübersicht</h2>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-dark/60">Ursprünglicher Preis</span>
              <span className="font-data text-sm text-dark line-through text-dark/40">
                CHF {booking.estimated_price.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-dark">Neuer Preis</span>
              <span className="font-data font-bold text-lg text-dark">
                CHF {booking.final_price.toFixed(2)}
              </span>
            </div>
            {diff > 0 && (
              <div className="flex justify-between items-center bg-amber-50 border border-amber-200 rounded-button px-3 py-2">
                <span className="text-xs text-amber-700 font-medium">Preisunterschied</span>
                <span className="font-data font-bold text-sm text-amber-700">+CHF {diff.toFixed(2)}</span>
              </div>
            )}
          </div>
        </GlassCard>

        {/* Error */}
        {error && (
          <div className="bg-coral/10 border border-coral/20 rounded-card px-4 py-3 text-sm text-coral">
            {error}
          </div>
        )}

        {/* Actions */}
        {approved ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-teal/10 border border-teal/20 rounded-card p-5 text-center"
          >
            <CheckCircle size={24} className="text-teal mx-auto mb-2" />
            <p className="font-heading font-semibold text-dark">Preis bestätigt!</p>
            <p className="text-sm text-dark/50 mt-1">Weiterleitung zu deinem Konto…</p>
          </motion.div>
        ) : (
          <div className="flex flex-col gap-2">
            <AnimatedButton
              onClick={handleApprove}
              loading={approving}
              fullWidth
              variant="primary"
              size="lg"
            >
              <CheckCircle size={16} />
              Preis akzeptieren · CHF {booking.final_price.toFixed(2)}
            </AnimatedButton>
            <button
              onClick={() => router.push(`/${locale}/profile`)}
              className="w-full py-2.5 rounded-button border border-gray-200 text-sm text-dark/60 hover:bg-gray-50 transition-colors"
            >
              Ablehnen &amp; zurück
            </button>
          </div>
        )}

        <p className="text-xs text-center text-dark/30 pb-6">
          Bei Fragen wende dich an{" "}
          <a href="mailto:support@solen.ch" className="text-teal hover:underline">support@solen.ch</a>
        </p>
      </motion.div>
    </div>
  );
}
