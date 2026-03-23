"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Clock, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format-currency";
import type { LastMinuteSlot } from "@/lib/types";

interface LastMinuteCardProps {
  slot: LastMinuteSlot;
  locale?: string;
}

function getTimeLeft(startsAt: string): { label: string; minutesLeft: number } {
  const diff = new Date(startsAt).getTime() - Date.now();
  if (diff <= 0) return { label: "Jetzt", minutesLeft: 0 };
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  return {
    label: h > 0 ? `${h}h ${m}m` : `${m}m`,
    minutesLeft: Math.floor(diff / 60_000),
  };
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
  const isUrgent = timeLeft.minutesLeft <= 60 && timeLeft.minutesLeft > 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, y: -8 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -3, boxShadow: "0 10px 28px rgba(0,0,0,0.10)" }}
      className="will-change-transform"
    >
      <Link
        href={`/${locale}/salon/${slot.salon.slug}?slot=${slot.id}`}
        className={cn(
          "flex flex-col justify-between rounded-card bg-white dark:bg-s-dm-surface shadow-card overflow-hidden h-52 border-l-2",
          isUrgent
            ? "border-s-coral animate-coral-pulse"
            : "border-s-coral/40"
        )}
      >
        <div className="p-4 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="font-heading font-semibold text-s-ink dark:text-s-dm-text text-sm leading-tight line-clamp-2 flex-1">
              {slot.salon.name}
            </p>
            {isUrgent && (
              <Zap size={14} className="text-s-coral shrink-0 mt-0.5 fill-s-coral" />
            )}
          </div>
          <p className="text-xs text-s-ink/50 dark:text-s-dm-text/50 mt-0.5 font-body">{serviceName}</p>

          {/* Time */}
          <div className="mt-3 flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-s-coral animate-pulse" />
            <span className="data-text font-semibold text-s-coral text-base">{timeStr}</span>
          </div>

          {/* Countdown */}
          <div className="flex items-center gap-1 mt-1 text-s-ink/40 dark:text-s-dm-text/40">
            <Clock className="w-3 h-3" />
            <span className={cn("text-xs font-body", isUrgent && "text-s-coral font-semibold")}>
              in {timeLeft.label}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 pb-4 flex items-center justify-between">
          <span className="data-text font-bold text-s-ink dark:text-s-dm-text text-sm">
            {formatCurrency(slot.discounted_price, locale)}
          </span>
          {slot.price_override && slot.price_override > slot.discounted_price && (
            <span className="text-xs text-s-ink/30 dark:text-s-dm-text/30 line-through data-text">
              {formatCurrency(slot.price_override, locale)}
            </span>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
