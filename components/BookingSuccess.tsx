"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Calendar, Share2, MapPin } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { formatPrice } from "@/lib/format";
import { markFirstBooking } from "@/components/ui/PWAInstallPrompt";
import SignatureLockup from "@/components/ui/SignatureLockup";
import CelebrationRing from "@/components/ui/CelebrationRing";

/**
 * BookingSuccess — Q57 (locked 2026-05-02) confirmation screen.
 *
 * Layered moment per Q57 lock:
 *   - Q36 celebration ring (booking kind, ~700ms coral expand + checkmark
 *     scale-in, replaces the retired window-wide CSS confetti)
 *   - Q48 signature: eyebrow `Bestätigt · #<bookingId>` + Anton headline
 *     `Buchung bestätigt`
 *   - Warm sub-line: `Wir freuen uns auf dich`
 *   - Summary card (Was / Wann / Wo / Wer) — 4 rows minimum, right-aligned
 *     values, left-aligned labels, FAF7F3 sunken bg
 *   - 3 utility chips: In Kalender · Wegbeschreibung · Teilen (vertical
 *     stack on mobile, horizontal on desktop, all 48px hit area per Q46)
 *   - Secondary CTA `Zur Buchung →` (neutral, NOT coral) — user picks,
 *     NO auto-redirect
 *
 * NOT on this screen per Q57:
 *   - Confetti / emoji-heavy copy
 *   - Auto-redirect after N seconds
 *   - Upsell CTAs ('Add another service', 'Buy gift card', referral promo)
 *   - ReviewPrompt — that stays in the 24h cron, NOT here
 */
interface BookingSuccessProps {
  bookingId: string;
  salonName: string;
  salonSlug: string;
  serviceName: string;
  staffName?: string;
  dateTime: string; // ISO string
  duration: number; // minutes
  price: number;
  cardLast4?: string;
  cancellationHours?: number;
}

function generateICS(props: BookingSuccessProps): string {
  const start = new Date(props.dateTime);
  const end = new Date(start.getTime() + props.duration * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
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
  const prefersReducedMotion = useReducedMotion();
  const [celebrate, setCelebrate] = useState(false);

  // Mark first booking for PWA install prompt
  useEffect(() => {
    markFirstBooking();
  }, []);

  // Fire Q36 celebration ring once on mount
  useEffect(() => {
    setCelebrate(true);
    // CelebrationRing auto-resets internally; no need to clear here
  }, []);

  const localeCode = locale === "de" ? "de-CH" : locale === "fr" ? "fr-CH" : locale === "it" ? "it-CH" : "en-GB";
  const slot = new Date(props.dateTime);
  const dateStr = slot.toLocaleDateString(localeCode, { weekday: "short", day: "numeric", month: "long" });
  const timeStr = slot.toLocaleTimeString(localeCode, { hour: "2-digit", minute: "2-digit" });

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

  const handleDirections = () => {
    // Use the salon name as a query — opens native maps
    const q = encodeURIComponent(`${props.salonName} solen.ch`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, "_blank");
  };

  const handleShare = async () => {
    const shareData = {
      title: t("shareTitle", { salonName: props.salonName }),
      text: `${props.salonName} · ${dateStr} ${timeStr}`,
      url: `https://www.solen.ch/${locale}/salon/${props.salonSlug}`,
    };
    if (navigator.share) {
      await navigator.share(shareData).catch((err) => console.error("[BookingSuccess] navigator.share failed:", err));
    } else {
      await navigator.clipboard.writeText(shareData.url);
    }
  };

  const summaryRows: Array<{ label: string; value: string }> = [
    { label: "Was", value: props.serviceName },
    { label: "Wann", value: `${dateStr} · ${timeStr}` },
    { label: "Wo", value: props.salonName },
  ];
  if (props.staffName) summaryRows.push({ label: "Wer", value: props.staffName });

  return (
    <div className="max-w-md mx-auto py-10 px-5">
      {/* Q36 celebration anchor — fires once on mount */}
      <div className="relative mx-auto mb-6 w-16 h-16 flex items-center justify-center">
        <CelebrationRing kind="booking" active={celebrate} maxRadius={80} />
      </div>

      {/* Q48 signature lockup */}
      <SignatureLockup
        eyebrow={`Bestätigt · #${props.bookingId.slice(0, 8)}`}
        headline="Buchung bestätigt"
        subLine="Wir freuen uns auf dich."
        size="md"
        align="center"
      />

      {/* Summary card (Was / Wann / Wo / Wer) */}
      <div
        className="mt-6 rounded-[10px] px-4 py-3"
        style={{ background: "#FAF7F3" }}
      >
        {summaryRows.map((row, i) => (
          <div
            key={row.label}
            className={[
              "flex items-baseline justify-between gap-3 py-2",
              i < summaryRows.length - 1 ? "border-b border-s-ink/[0.05]" : "",
            ].join(" ")}
          >
            <span className="font-body text-[10px] font-bold uppercase tracking-[.18em] text-s-ink/45 shrink-0">
              {row.label}
            </span>
            <span className="font-body text-[14px] text-s-ink text-right">{row.value}</span>
          </div>
        ))}
        {props.price > 0 && (
          <div className="mt-2 pt-2 border-t border-s-ink/[0.05] flex items-baseline justify-between gap-3">
            <span className="font-body text-[10px] font-bold uppercase tracking-[.18em] text-s-ink/45 shrink-0">
              Total
            </span>
            <span className="font-heading text-[18px] text-s-ink tabular-nums">
              {formatPrice(props.price, localeCode)}
            </span>
          </div>
        )}
      </div>

      {/* Cancellation policy mini-banner */}
      <p className="mt-3 font-body text-[11px] text-s-ink/55 text-center">
        Kostenlos bis {props.cancellationHours ?? 24}h vorher stornieren.
      </p>

      {/* 3 utility chips per Q57 (48px hit area per Q46) */}
      <div className="mt-6 flex flex-col sm:flex-row gap-2">
        <button
          type="button"
          onClick={handleCalendarDownload}
          className="flex-1 inline-flex items-center justify-center gap-2 min-h-[48px] px-4 rounded-full bg-s-coral text-white font-body text-[13px] font-bold tracking-[.02em] transition-[transform,filter] duration-150 hover:brightness-[1.06] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-s-coral focus-visible:ring-offset-2"
        >
          <Calendar size={16} aria-hidden />
          In Kalender
        </button>
        <button
          type="button"
          onClick={handleDirections}
          className="flex-1 inline-flex items-center justify-center gap-2 min-h-[48px] px-4 rounded-full bg-white border border-s-ink/15 text-s-ink font-body text-[13px] font-semibold transition-[transform,border-color] duration-150 hover:border-s-coral/40 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-s-coral focus-visible:ring-offset-2"
        >
          <MapPin size={16} aria-hidden />
          Wegbeschreibung
        </button>
        <button
          type="button"
          onClick={handleShare}
          className="flex-1 inline-flex items-center justify-center gap-2 min-h-[48px] px-4 rounded-full bg-white border border-s-ink/15 text-s-ink font-body text-[13px] font-semibold transition-[transform,border-color] duration-150 hover:border-s-coral/40 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-s-coral focus-visible:ring-offset-2"
        >
          <Share2 size={16} aria-hidden />
          Teilen
        </button>
      </div>

      {/* Secondary CTA — neutral, NOT coral. User picks, no auto-redirect. */}
      <button
        type="button"
        onClick={() => router.push(`/${locale}/profile/bookings`)}
        className="mt-4 w-full text-center py-3 font-body text-[13px] text-s-ink/60 hover:text-s-ink transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-s-coral focus-visible:ring-offset-2 rounded-md"
      >
        Zur Buchung →
      </button>
    </div>
  );
}
