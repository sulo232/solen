"use client";

import { useState } from "react";
import { Calendar, X } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

interface BookingBubbleProps {
  salonName: string;
  salonSlug: string;
  conversationId: string;
  messageCount: number;
}

export default function BookingBubble({ salonName, salonSlug, conversationId, messageCount }: BookingBubbleProps) {
  const locale = useLocale();
  const t = useTranslations("chat.bookingBubble") as any;
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem(`booking_bubble_${conversationId}`) === "1";
  });

  // Only show after 3+ messages
  if (messageCount < 3 || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(`booking_bubble_${conversationId}`, "1");
  };

  return (
    <div className="mx-4 mb-2 p-3 rounded-[12px] bg-s-coral/5 border border-s-coral/15 flex items-center gap-3">
      <Calendar size={18} className="text-s-coral shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-s-ink dark:text-s-dm-text">{t("title", { salonName })}</p>
      </div>
      <Link
        href={`/${locale}/salon/${salonSlug}`}
        className="shrink-0 px-3 py-1.5 rounded-btn active:scale-[0.98] bg-s-coral text-white text-xs font-medium hover:brightness-[1.06] transition-all"
      >
        {t("bookNow")}
      </Link>
      <button
        onClick={handleDismiss}
        className="shrink-0 p-1 text-s-ink/30 dark:text-s-dm-text/30 hover:text-s-ink/60 dark:hover:text-s-dm-text/60"
        aria-label={t("close")}
      >
        <X size={14} />
      </button>
    </div>
  );
}
