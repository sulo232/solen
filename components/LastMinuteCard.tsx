"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock } from "lucide-react";
import type { LastMinuteSlot } from "@/lib/types";

interface LastMinuteCardProps {
  slot: LastMinuteSlot;
  locale?: string;
}

function getTimeLeft(startsAt: string): string {
  const diff = new Date(startsAt).getTime() - Date.now();
  if (diff <= 0) return "Jetzt";
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function LastMinuteCard({ slot, locale = "de" }: LastMinuteCardProps) {
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(slot.starts_at));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft(slot.starts_at));
    }, 60_000);
    return () => clearInterval(interval);
  }, [slot.starts_at]);

  const timeStr = new Date(slot.starts_at).toLocaleTimeString(locale === "de" ? "de-CH" : "en-CH", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const serviceName = locale === "de" ? slot.service.name_de : slot.service.name_en;

  return (
    <Link
      href={`/${locale}/salon/${slot.salon.slug}?slot=${slot.id}`}
      className="flex-shrink-0 w-48 h-52 flex flex-col justify-between rounded-card bg-white shadow-card hover:shadow-md transition-all duration-200 overflow-hidden border-l-2 border-coral"
    >
      <div className="p-4 flex-1">
        <p className="font-heading font-semibold text-dark text-sm leading-tight line-clamp-2">
          {slot.salon.name}
        </p>
        <p className="text-xs text-dark/50 mt-0.5">{serviceName}</p>

        {/* Time */}
        <div className="mt-3 flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-coral animate-pulse" />
          <span className="font-data font-semibold text-coral text-base">{timeStr}</span>
        </div>

        {/* Countdown */}
        <div className="flex items-center gap-1 mt-1 text-dark/40">
          <Clock className="w-3 h-3" />
          <span className="text-xs">in {timeLeft}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 pb-4 flex items-center justify-between">
        <span className="font-data font-bold text-dark text-sm">
          CHF {slot.discounted_price}
        </span>
        {slot.price_override && slot.price_override > slot.discounted_price && (
          <span className="text-xs text-dark/30 line-through font-data">
            CHF {slot.price_override}
          </span>
        )}
      </div>
    </Link>
  );
}
