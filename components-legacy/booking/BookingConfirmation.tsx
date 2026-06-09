"use client";

import { useCallback, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import Image from "next/image";
import { Check, Copy, Calendar, MapPin, KeyRound, ChevronRight } from "lucide-react";
import { SuccessMark } from "@/app/[locale]/_components/primitives/SuccessMark";

/**
 * BookingConfirmation: the screen a customer lands on right after paying (or reserving).
 *
 * SENIOR REBUILD 2026-06-09 (SENIOR_SCORECARD.md, 5/5; approved mockup
 * public/solen-confirm-senior.html). The prior screen made the reference code the visual hero,
 * stacked 3-4 cards, and ran 4 explainer paragraphs + ~11 font sizes — it failed every scorecard
 * dimension. This version:
 *   - EMPHASIS: the DATE is the focal (what the customer actually came for). The reference code
 *     drops to a 13px footer line (it's a support-lookup key, not a hero).
 *   - COPY: headline only, no subtitle; no explainer paragraphs.
 *   - COLOR: green carries the "paid/confirmed" beat (check + paid pill); never dead-grey, never rainbow.
 *   - TYPE: 4 sizes (24/19/15/13), 2 weights (600/400). Mono only for the code.
 *   - STRUCTURE: ONE essentials card + one ink primary (Add to calendar) + one flat secondary.
 *
 * AESTHETIC: Solen B&W chrome, Inter Tight + Inter + JetBrains Mono (font-mono-code), ink primary
 *   CTA, s-accent functional-only (focus ring), success-green Layer-3, no raw hex.
 *
 * Payment truth is gated on the row (never an unconditional "paid"): the green paid pill shows ONLY
 * when payment_status === 'paid'; 'none'/'processing' → "confirming"; anything else → pay-at-salon.
 *
 * Guest vs logged-in: for a GUEST the access link is their only credential, so a COMPACT access-link
 * block is retained (de-emphasized) below the actions + the footer "manage" points at it. The full
 * VAT net/MWST split + the itemized receipt live on the emailed receipt, not on this celebration
 * screen; on-page we keep total + "incl. X% VAT" + the salon MWST-Nr (when registered) for compliance.
 */
export interface BookingConfirmationProps {
  referenceCode: string | null;
  salonName: string;
  salonSlug: string;
  salonAddress: string;
  salonCoverUrl: string | null;
  serviceName: string;
  staffName: string | null;
  startsAt: string; // ISO
  durationMinutes: number | null;
  pricePaid: number;
  priceLabel: string; // pre-formatted currency (server-side, avoids locale drift)
  paidVia: string | null; // 'stripe' | 'package' | 'gift_card' | 'walk_in'
  /**
   * Booking lifecycle + payment truth (read off the row). The payment-state copy is gated on
   * these — never shown as "paid in full" unconditionally:
   *   - payment_status 'paid'  -> the webhook confirmed the charge      => PAID.
   *   - payment_status 'none'  -> the online-pay fingerprint (only the C1
   *     create-then-charge path writes 'none'); the payment_intent.succeeded
   *     webhook hasn't landed yet (brief window / async processing)      => CONFIRMING.
   *   - anything else (status confirmed/pending_approval, payment_status
   *     'pending'/null) -> the pay-at-salon path, never charged online    => PAY AT SALON.
   */
  status: string | null; // 'pending' | 'confirmed' | 'pending_approval' | 'cancelled' | ...
  paymentStatus: string | null; // 'none' | 'pending' | 'paid' | 'card_saved' | ...
  isGuest: boolean;
  /** Guest only: the full re-entry link incl. the raw token (?code=&t=). */
  accessLink: string | null;
  /** Logged-in only: the email the confirmation was sent to (if known). */
  contactEmail: string | null;
  /**
   * VAT/MWST receipt breakdown (Swiss, per-salon, VAT-inclusive). Populated only for a settled
   * payment from a VAT-registered salon: vatRate is the rate actually applied (0 ⇒ no VAT shown —
   * non-registered / Kleinunternehmen). netLabel + vatLabel are kept in the props for the email
   * receipt parity but are no longer rendered inline (the split lives on the emailed receipt).
   */
  vatRate: number;
  netLabel: string;
  vatLabel: string;
  salonVatNumber: string | null;
}

export default function BookingConfirmation(props: BookingConfirmationProps) {
  const t = useTranslations("ui.successPage") as any;
  const locale = useLocale();

  const localeCode =
    locale === "de" ? "de-CH" : locale === "fr" ? "fr-CH" : locale === "it" ? "it-CH" : "en-CH";
  const start = new Date(props.startsAt);
  // The date is the screen's focal — weekday + day + month, no year (near-term booking; year is noise).
  const dateStr = start.toLocaleDateString(localeCode, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const timeStr = start.toLocaleTimeString(localeCode, { hour: "2-digit", minute: "2-digit" });
  const displayEnd = props.durationMinutes
    ? new Date(start.getTime() + props.durationMinutes * 60 * 1000).toLocaleTimeString(localeCode, {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;
  // Separator is a thin vertical line, not a middle-dot (owner 2026-06-09: "stop using dots, use a line").
  const timeline = `${timeStr}${displayEnd ? ` – ${displayEnd}` : ""}${
    props.durationMinutes ? `  |  ${props.durationMinutes} min` : ""
  }`;
  const code = props.referenceCode ?? "";

  // Payment truth, gated on the row (never an unconditional "paid in full"). The discriminator is
  // payment_status, NOT paid_via (paid_via defaults to 'stripe' for both online AND pay-at-salon).
  const isPaid = props.paymentStatus === "paid";
  const isConfirming =
    !isPaid && (props.paymentStatus === "none" || props.paymentStatus === "processing");

  // VAT shown only on a settled payment from a registered salon. The label carries "(inkl. MWST)"
  // and the footer carries the MWST-Nr; the itemized net/rate split lives on the emailed receipt.
  const showVat = isPaid && props.vatRate > 0;

  // Guest "manage" + the access link point at the same re-entry; logged-in goes to the lookup route.
  const manageHref = props.isGuest && props.accessLink ? props.accessLink : `/${locale}/booking/lookup`;

  const [copiedLink, setCopiedLink] = useState(false);
  const copyText = useCallback(async (text: string, mark: (v: boolean) => void) => {
    try {
      if (navigator.clipboard && text) await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error("[BookingConfirmation] clipboard copy failed:", err);
    }
    mark(true);
    setTimeout(() => mark(false), 1400);
  }, []);

  const handleCalendar = useCallback(() => {
    const end = new Date(start.getTime() + (props.durationMinutes ?? 60) * 60 * 1000);
    const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Solen.ch//Booking//EN",
      "BEGIN:VEVENT",
      `DTSTART:${fmt(start)}`,
      `DTEND:${fmt(end)}`,
      `SUMMARY:${props.serviceName} @ ${props.salonName}`,
      `DESCRIPTION:${t("calendarDescription")}`,
      `LOCATION:${props.salonAddress || props.salonName}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `solen-${(code || "booking").toLowerCase()}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  }, [start, props.durationMinutes, props.serviceName, props.salonName, props.salonAddress, code, t]);

  const directionsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${props.salonName} ${props.salonAddress}`.trim(),
  )}`;

  return (
    <div className="min-h-[100dvh] bg-s-bg-surface text-s-ink">
      <main className="mx-auto w-full max-w-[440px] px-5 pb-16 pt-9">
        {/* ── celebratory header: SuccessMark + headline only (the card carries the rest) ── */}
        <div className="flex flex-col items-center text-center">
          <SuccessMark size={58} className="mb-4" />
          <h1
            className="celebrate-rise font-display text-[24px] font-semibold leading-[1.15] tracking-[-0.02em]"
            style={{ animationDelay: "0.46s" }}
          >
            {t("title")}
          </h1>
        </div>

        {/* ── ONE essentials card: salon · date (focal) · service · paid ── */}
        <section
          className="celebrate-rise mt-7 overflow-hidden rounded-card border border-s-border bg-s-bg-surface shadow-float"
          style={{ animationDelay: "0.58s" }}
        >
          {/* the whole store identity row is tappable → the salon page (owner 2026-06-09) */}
          <Link
            href={`/${locale}/salon/${props.salonSlug}`}
            className="flex items-center gap-3 p-4 transition-colors duration-150 hover:bg-s-bg-sunken focus-visible:bg-s-bg-sunken focus-visible:outline-none"
          >
            {props.salonCoverUrl ? (
              <Image
                src={props.salonCoverUrl}
                alt=""
                width={44}
                height={44}
                className="h-[44px] w-[44px] shrink-0 rounded-[11px] object-cover"
                aria-hidden
              />
            ) : (
              <div className="h-[44px] w-[44px] shrink-0 rounded-[11px] bg-s-bg-sunken" aria-hidden />
            )}
            <div className="min-w-0 flex-1">
              <div className="truncate font-display text-[15px] font-semibold tracking-[-0.01em] text-s-ink">
                {props.salonName}
              </div>
              {props.salonAddress && (
                <div className="mt-0.5 flex items-center gap-1.5 text-[13px] text-s-ink-2">
                  <MapPin size={13} className="shrink-0 text-s-accent" aria-hidden />
                  <span className="truncate">{props.salonAddress}</span>
                </div>
              )}
            </div>
            <ChevronRight size={18} className="shrink-0 text-s-ink-2" aria-hidden />
          </Link>
          <hr className="border-s-border" />
          {/* date = the focal */}
          <div className="px-4 pb-1 pt-4">
            <div className="font-display text-[19px] font-semibold leading-[1.2] tracking-[-0.01em] text-s-ink">
              {dateStr}
            </div>
            <div className="mt-0.5 text-[13px] text-s-ink-2">{timeline}</div>
          </div>
          {/* service + stylist */}
          <div className="px-4 pb-4 pt-3">
            <div className="font-display text-[15px] font-semibold tracking-[-0.01em] text-s-ink">
              {props.serviceName}
            </div>
            {props.staffName && (
              <div className="mt-0.5 text-[13px] text-s-ink-2">
                {t("withStylist", { name: props.staffName })}
              </div>
            )}
          </div>
          {/* paid + price */}
          <div className="flex items-center justify-between gap-3 bg-s-bg-sunken px-4 py-3.5">
            <div className="min-w-0">
              <div className="text-[13px] text-s-ink-2">{showVat ? t("totalInclVat") : t("total")}</div>
              {isPaid ? (
                <span className="mt-1 inline-flex items-center gap-1.5 rounded-pill bg-s-success-bg px-2.5 py-[3px] text-[13px] font-semibold text-s-success">
                  <Check size={13} strokeWidth={2.6} aria-hidden />
                  {t("paidShort")}
                </span>
              ) : isConfirming ? (
                <span className="mt-1 block text-[13px] text-s-ink-2">{t("paymentConfirming")}</span>
              ) : (
                <span className="mt-1 block text-[13px] text-s-ink-2">{t("paidInPerson")}</span>
              )}
            </div>
            <span className="shrink-0 font-display text-[19px] font-semibold tracking-[-0.01em] text-s-ink tabular-nums">
              {props.priceLabel}
            </span>
          </div>
        </section>

        {/* ── one primary action (ink) + one secondary (flat) ── */}
        <button
          type="button"
          onClick={handleCalendar}
          className="celebrate-rise mt-5 flex h-[52px] w-full items-center justify-center gap-2 rounded-btn bg-s-ink font-body text-[15px] font-semibold text-white transition-[filter,transform] duration-150 hover:brightness-[0.94] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-s-accent focus-visible:ring-offset-2"
          style={{ animationDelay: "0.68s" }}
        >
          <Calendar size={17} aria-hidden />
          {t("addToCalendar")}
        </button>
        <a
          href={directionsHref}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2.5 flex h-[50px] w-full items-center justify-center gap-2 rounded-btn border border-s-border bg-s-bg-surface font-body text-[15px] font-semibold text-s-accent transition-[background-color] duration-150 hover:bg-s-accent-pale focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-s-accent focus-visible:ring-offset-2"
        >
          <MapPin size={17} aria-hidden />
          {t("directions")}
        </a>

        {/* ── guest only: compact access-link (their only way back — kept, de-emphasized) ── */}
        {props.isGuest && props.accessLink && (
          <div className="mt-4 rounded-card border border-s-border bg-s-bg-surface p-3.5 shadow-float">
            <div className="flex items-center gap-2 text-[13px] text-s-ink-2">
              <KeyRound size={15} className="shrink-0 text-s-ink" aria-hidden />
              <span>{t("saveLinkShort")}</span>
            </div>
            <div className="mt-2.5 flex h-[44px] items-center gap-2 rounded-[12px] border border-s-border bg-s-bg-sunken pl-3 pr-1.5">
              <span className="flex-1 truncate font-mono-code text-[13px] text-s-ink-2">
                {props.accessLink}
              </span>
              <button
                type="button"
                onClick={() => copyText(props.accessLink as string, setCopiedLink)}
                aria-label={copiedLink ? t("copied") : t("copyLink")}
                className={[
                  "flex h-[34px] shrink-0 items-center gap-1.5 rounded-[9px] border border-s-border bg-s-bg-surface px-3 text-[13px] font-semibold transition-colors duration-150",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-s-accent focus-visible:ring-offset-1",
                  copiedLink ? "text-s-success" : "text-s-ink",
                ].join(" ")}
              >
                {copiedLink ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}
                {copiedLink ? t("copied") : t("copyLink")}
              </button>
            </div>
          </div>
        )}

        {/* ── tiny footer: reference code (support lookup) + manage ── */}
        <div className="mt-6 flex items-center justify-between gap-3 border-t border-s-border pt-4 text-[13px]">
          <span className="font-mono-code text-s-ink-2">{code || "SOL-•••••"}</span>
          <Link
            href={manageHref}
            className="inline-flex items-center gap-0.5 font-semibold text-s-accent transition-opacity duration-150 hover:opacity-80"
          >
            {t("manageBooking")}
            <ChevronRight size={15} aria-hidden />
          </Link>
        </div>
        {showVat && props.salonVatNumber && (
          <p className="mt-2 text-center text-[13px] text-s-ink-2">
            {t("vatNumberLabel", { nr: props.salonVatNumber })}
          </p>
        )}
      </main>
    </div>
  );
}
