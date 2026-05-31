"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import { motion } from "framer-motion";
import { ChevronLeft, Clock, MapPin, Lock } from "lucide-react";
import Link from "next/link";

interface Salon {
  id: string;
  name: string;
  address: string;
}

interface Service {
  id: string;
  name: string;
  price: number;
  duration_minutes: number;
}

interface QueueStats {
  ahead: number;
  wait_minutes: number;
}

export default function WalkInJoinPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();

  const salonId = searchParams.get("salon_id");

  const [salon, setSalon] = useState<Salon | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [queueStats, setQueueStats] = useState<QueueStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch salon + services.
  useEffect(() => {
    if (!salonId) {
      setError("Salon ID required");
      setLoading(false);
      return;
    }

    const fetch_ = async () => {
      try {
        const res = await fetch(`/api/walkin/salon-info?salon_id=${salonId}&locale=${locale}`, { method: "GET" });
        if (!res.ok) throw new Error("Salon not found");
        const data = await res.json();
        setSalon(data.salon);
        setServices(data.services || []);
        if (data.services?.length > 0) {
          setSelectedServiceId(data.services[0].id);
        }
      } catch (e) {
        console.error("[walk-in-join]", e);
        setError("Could not load salon");
      } finally {
        setLoading(false);
      }
    };

    fetch_();
  }, [salonId, locale]);

  // Fetch queue stats when service selected.
  useEffect(() => {
    if (!selectedServiceId || !salonId) return;

    const fetch_ = async () => {
      try {
        const res = await fetch(
          `/api/walkin/queue-stats?salon_id=${salonId}&service_id=${selectedServiceId}`
        );
        if (!res.ok) throw new Error("Could not fetch queue stats");
        const data = await res.json();
        setQueueStats(data);
      } catch (e) {
        console.error("[walk-in-join] queue stats failed:", e);
        setQueueStats(null);
      }
    };

    fetch_();
  }, [selectedServiceId, salonId]);

  const selectedService = services.find((s) => s.id === selectedServiceId);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-s-ink border-t-s-accent" />
        </div>
      </div>
    );
  }

  if (error || !salon) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <p className="mb-4 text-s-ink-2">{error || "Salon not found"}</p>
          <Link href={`/${locale}`} className="text-s-accent underline">
            Back
          </Link>
        </div>
      </div>
    );
  }

  const handleProceedToPay = () => {
    if (!selectedService || !salonId) return;
    const params = new URLSearchParams({
      salon_id: salonId,
      service_id: selectedService.id,
    });
    router.push(`/${locale}/walk-in-pay?${params.toString()}`);
  };

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Header */}
      <div className="border-b border-s-ink-5 px-4 py-3">
        <Link
          href={`/${locale}`}
          className="flex items-center gap-2 text-[15px] font-semibold text-s-accent"
        >
          <ChevronLeft size={20} />
          Back
        </Link>
      </div>

      {/* Scrollable content */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex-1 overflow-y-auto px-4 py-5"
      >
        {/* Salon info */}
        <div className="mb-6">
          <h1 className="font-heading text-[22px] font-bold tracking-[-.02em] text-s-ink">
            {salon.name}
          </h1>
          <div className="mt-2 flex items-center gap-1.5 text-[13px] text-s-ink-2">
            <MapPin size={14} />
            {salon.address}
          </div>
        </div>

        {/* Queue status */}
        {queueStats && (
          <div className="mb-6 rounded-xl bg-s-ink-1 p-4">
            <div className="flex items-center gap-2 text-[14px] font-medium text-s-ink">
              <Clock size={16} className="text-s-accent" />
              <span>
                {queueStats.ahead} ahead • {queueStats.wait_minutes} min wait
              </span>
            </div>
          </div>
        )}

        {/* Service selection */}
        <div className="mb-6">
          <p className="mb-3 text-[13px] font-semibold uppercase tracking-[0.5px] text-s-ink-3">
            Service
          </p>
          <div className="space-y-2">
            {services.map((svc) => (
              <button
                key={svc.id}
                onClick={() => setSelectedServiceId(svc.id)}
                className={`w-full rounded-lg border-2 px-4 py-3 text-left transition-colors ${
                  selectedServiceId === svc.id
                    ? "border-s-ink bg-white"
                    : "border-s-ink-4 bg-s-ink-1 hover:border-s-ink-3"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-s-ink">{svc.name}</p>
                    <p className="text-[12px] text-s-ink-2">
                      {svc.duration_minutes} min
                    </p>
                  </div>
                  <p className="font-heading text-[15px] font-semibold text-s-accent">
                    CHF {svc.price.toFixed(2)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Info block */}
        <div className="mb-6 flex items-start gap-2.5 rounded-lg bg-s-ink-1 p-4 text-[13px] text-s-ink-2">
          <Lock size={15} className="mt-0.5 shrink-0 text-s-ink-3" />
          <p>
            You'll see a payment screen next. Your card is securely held until
            your service is complete.
          </p>
        </div>
      </motion.div>

      {/* Sticky CTA */}
      <div
        className="bg-white px-4 pt-4 pb-[calc(16px+env(safe-area-inset-bottom))]"
        style={{ boxShadow: "0 -10px 28px -14px rgba(10,10,10,0.12)" }}
      >
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleProceedToPay}
          disabled={!selectedService}
          className="w-full rounded-btn bg-s-ink py-[13px] font-heading text-[15px] font-semibold text-white shadow-elevation-2 transition-all hover:brightness-[1.06] disabled:opacity-50"
        >
          Proceed to Payment
        </motion.button>
      </div>
    </div>
  );
}
