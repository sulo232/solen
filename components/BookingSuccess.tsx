"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { CheckCircle, Calendar, Share2, RotateCcw, CreditCard, ShieldCheck, Gift } from "lucide-react";
import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/format-currency";
import { markFirstBooking } from "@/components/ui/PWAInstallPrompt";

interface BookingSuccessProps {
  bookingId: string;
  salonName: string;
  salonSlug: string;
  serviceName: string;
  dateTime: string; // ISO string
  duration: number; // minutes
  price: number;
  cardLast4?: string;
  cancellationHours?: number;
}

function generateICS(props: BookingSuccessProps): string {
  const start = new Date(props.dateTime);
  const end = new Date(start.getTime() + props.duration * 60 * 1000);

  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Solen.ch//Booking//DE",
    "BEGIN:VEVENT",
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${props.serviceName} bei ${props.salonName}`,
    `DESCRIPTION:Gebucht über solen.ch`,
    `LOCATION:${props.salonName}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export default function BookingSuccess(props: BookingSuccessProps) {
  const locale = useLocale();
  const t = useTranslations("ui.bookingSuccess") as any;
  const router = useRouter();
  const confettiRef = useRef(false);

  // Mark first booking for PWA install prompt
  useEffect(() => {
    markFirstBooking();
  }, []);

  const [rewardAmount, setRewardAmount] = useState<number>(10);

  useEffect(() => {
    fetch("/api/referral")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.reward_amount) {
          setRewardAmount(data.reward_amount / 100);
        }
      })
      .catch((err) => console.error("[BookingSuccess] Failed to fetch referral reward amount:", err));
  }, []);

  // Simple CSS confetti on mount
  useEffect(() => {
    if (confettiRef.current) return;
    confettiRef.current = true;

    // Create confetti particles
    const container = document.createElement("div");
    container.style.cssText = "position:fixed;inset:0;z-index:9999;pointer-events:none;overflow:hidden";
    document.body.appendChild(container);

    const colors = ["#E8624A", "#D4870A", "#FFD93D", "#6BCB77", "#6BA3C8"];
    for (let i = 0; i < 50; i++) {
      const el = document.createElement("div");
      const size = Math.random() * 8 + 4;
      el.style.cssText = `
        position:absolute;
        width:${size}px;height:${size}px;
        background:${colors[i % colors.length]};
        border-radius:${Math.random() > 0.5 ? "50%" : "2px"};
        left:${Math.random() * 100}%;
        top:-10px;
        animation:confetti-fall ${1.5 + Math.random() * 2}s ease-out forwards;
        animation-delay:${Math.random() * 0.5}s;
      `;
      container.appendChild(el);
    }

    // Add confetti keyframes
    const style = document.createElement("style");
    style.textContent = `
      @keyframes confetti-fall {
        0% { transform: translateY(0) rotate(0deg); opacity: 1; }
        100% { transform: translateY(100vh) rotate(${360 + Math.random() * 360}deg); opacity: 0; }
      }
    `;
    document.head.appendChild(style);

    setTimeout(() => {
      container.remove();
      style.remove();
    }, 4000);
  }, []);

  const localeCode = locale === "de" ? "de-CH" : locale === "fr" ? "fr-CH" : locale === "it" ? "it-CH" : "en-GB";
  const dateStr = new Date(props.dateTime).toLocaleDateString(localeCode, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const timeStr = new Date(props.dateTime).toLocaleTimeString(localeCode, {
    hour: "2-digit",
    minute: "2-digit",
  });

  const handleCalendarDownload = () => {
    const ics = generateICS(props);
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `solen-termin-${props.bookingId.slice(0, 8)}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    const shareData = {
      title: t("shareTitle", { salonName: props.salonName }),
      text: t("shareText", { serviceName: props.serviceName, salonName: props.salonName, date: dateStr, time: timeStr }),
      url: `https://www.solen.ch/${locale}/salon/${props.salonSlug}`,
    };
    if (navigator.share) {
      await navigator.share(shareData).catch((err) => console.error("[BookingSuccess] navigator.share failed:", err));
    } else {
      await navigator.clipboard.writeText(shareData.url);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ type: "spring", stiffness: 280, damping: 26, mass: 0.8 }}
      className="max-w-lg mx-auto text-center py-8 px-4"
    >
      <div className="w-16 h-16 rounded-full bg-s-coral/10 flex items-center justify-center mx-auto mb-4">
        <CheckCircle size={32} className="text-s-coral" />
      </div>

      <h2 className="font-heading font-bold text-2xl text-s-ink dark:text-s-dm-text mb-2">{t("title")}</h2>
      <p className="text-sm text-s-ink/50 dark:text-s-dm-text/50 mb-6">{t("subtitle")}</p>

      <div className="bg-s-bg-surface dark:bg-s-dm-surface rounded-card p-4 mb-6 text-left">
        <p className="font-heading font-semibold text-base text-s-ink dark:text-s-dm-text">{props.serviceName}</p>
        <p className="text-sm text-s-ink/60 dark:text-s-dm-text/60 mt-1">{props.salonName}</p>
        <div className="flex items-center gap-4 mt-3 text-sm text-s-ink/50 dark:text-s-dm-text/50">
          <span>{dateStr}</span>
          <span>{t("time", { time: timeStr })}</span>
          <span>{t("duration", { minutes: props.duration })}</span>
        </div>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-s-ink/5 dark:border-white/5">
          <div className="flex items-center gap-2">
            <CreditCard size={14} className="text-s-ink/50 dark:text-s-dm-text/50" />
            <span className="text-sm text-s-ink/50 dark:text-s-dm-text/50">
              {props.cardLast4 ? `•••• ${props.cardLast4}` : t("payment")}
            </span>
          </div>
          <p className="data-text font-semibold text-s-ink dark:text-s-dm-text">{formatCurrency(props.price, locale)}</p>
        </div>
      </div>

      {/* Cancellation policy */}
      <div className="flex items-start gap-2 bg-s-amber-subtle/50 rounded-btn p-3 mb-4 text-left">
        <ShieldCheck size={16} className="text-s-amber shrink-0 mt-0.5" />
        <p className="text-xs text-s-ink/60 dark:text-s-dm-text/60">
          {t("cancellationPolicy", { hours: props.cancellationHours ?? 24 })}
        </p>
      </div>

      {/* Referral CTA */}
      <div className="bg-s-coral/5 rounded-input p-4 mb-4 text-left border border-s-coral/10">
        <div className="flex items-center gap-2 mb-1">
          <Gift size={14} className="text-s-coral" />
          <p className="text-sm font-medium text-s-ink dark:text-s-dm-text">{t("referralTitle")}</p>
        </div>
        <p className="text-xs text-s-ink/50 dark:text-s-dm-text/50">{t("referralDesc", { amount: formatCurrency(rewardAmount, locale) })}</p>
      </div>

      <div className="flex flex-col gap-2">
        <button
          onClick={handleCalendarDownload}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-btn active:scale-[0.97] bg-s-coral text-white text-sm font-medium hover:brightness-[1.06] transition-[transform,filter] duration-150"
        >
          <Calendar size={16} />
          {t("addToCalendar")}
        </button>

        <button
          onClick={handleShare}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-btn border border-s-ink/10 dark:border-white/10 text-sm font-medium text-s-ink/70 dark:text-s-dm-text/70 hover:border-s-coral transition-colors"
        >
          <Share2 size={16} />
          {t("shareWithFriend")}
        </button>

        <button
          onClick={() => router.push(`/${locale}/salon/${props.salonSlug}`)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-btn border border-s-ink/10 dark:border-white/10 text-sm font-medium text-s-ink/70 dark:text-s-dm-text/70 hover:border-s-coral transition-colors"
        >
          <RotateCcw size={16} />
          {t("bookAgain")}
        </button>
      </div>
    </motion.div>
  );
}
