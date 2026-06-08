"use client";

import { useCallback, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import Image from "next/image";
import {
  Check,
  Copy,
  Share2,
  Calendar,
  MapPin,
  KeyRound,
  TriangleAlert,
  CreditCard,
  User,
  Sparkles,
  FileText,
} from "lucide-react";

/**
 * BookingConfirmation: the screen a customer lands on right after paying
 * (SP-1 / task #19). PayConfirmStep redirects here via /confirmation.
 *
 * STRUCTURE: Fresha / Treatwell confirmation. Mockup
 *   public/solen-refund-confirmation-order-number.html
 *   (success mark -> order-number hero -> booking summary -> save-access-link
 *    [guest] / saved-to-account [logged-in] -> actions -> manage/report hook).
 * AESTHETIC: Solen design system. B&W chrome, Inter Tight + Inter +
 *   JetBrains Mono (font-mono-code), ink primary CTA, s-accent functional-only
 *   (focus ring), success-green Layer-3, no decorative dots, no underline,
 *   no raw hex. Flat controls on sunken per CONTROL_ELEVATION (B).
 *
 * The reference_code (SOL-XXXXX) is the hero. For a guest, the access link is
 * their only credential, so the save-link block is mandatory + emphasised; the
 * real link points at the guest-lookup route (?code=&t=) that exchanges the raw
 * token once for the httpOnly cookie. For a logged-in customer the block softens
 * to a "saved to your account" reassurance (no raw token is ever shown).
 *
 * NOTE: the mockup's "Add to Apple Wallet" button is intentionally omitted. No
 * wallet-pass infrastructure exists yet. Calendar + Directions + Share are wired
 * with real handlers (ICS download / maps / Web Share).
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
   * VAT/MWST receipt breakdown (Swiss, per-salon, VAT-inclusive). Populated only for a
   * settled payment from a VAT-registered salon: vatRate is the rate actually applied
   * (0 ⇒ no VAT line shown at all — non-registered / Kleinunternehmen). netLabel + vatLabel
   * are pre-formatted server-side from the SAME displayed total, so they sum to it exactly.
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
  const dateStr = start.toLocaleDateString(localeCode, {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const timeStr = start.toLocaleTimeString(localeCode, { hour: "2-digit", minute: "2-digit" });
  const code = props.referenceCode ?? "";

  // Payment truth, gated on the row (never an unconditional "paid in full"). The discriminator
  // is payment_status, NOT paid_via: paid_via defaults to 'stripe' for both online AND pay-at-salon
  // bookings, so it can't tell them apart. payment_status 'none' is the unique fingerprint the
  // C1 online-pay path writes; the pay-at-salon path leaves it at the 'pending'/null default.
  const isPaid = props.paymentStatus === "paid";
  // Online-pay, charge not yet confirmed by the payment_intent.succeeded webhook (brief window
  // or an async/processing payment). 'processing' is defensive — the enum persists 'none' here.
  const isConfirming =
    !isPaid && (props.paymentStatus === "none" || props.paymentStatus === "processing");
  // Everything else => pay at the salon (in-person): not charged online, not "confirming a card".

  // Summary "Paid with" row: only meaningful once a charge actually settled.
  const paidWithLabel = isPaid ? t("paidOnline") : null;

  // The total block's state label.
  const totalStateLabel = isPaid
    ? t("paidInFull")
    : isConfirming
      ? t("paymentConfirming")
      : t("paidInPerson");

  // VAT/MWST breakdown — only on a settled payment from a registered salon (vatRate > 0).
  // Net + VAT are recomputed server-side from the displayed total (see the confirmation
  // route), so Netto + MWST == the inclusive total exactly. rateStr keeps "8.1" / "8".
  const showVat = isPaid && props.vatRate > 0;
  const rateStr = props.vatRate % 1 === 0 ? String(props.vatRate) : props.vatRate.toFixed(1);

  // ---- clipboard + share (client only) ----
  const [copiedCode, setCopiedCode] = useState(false);
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

  const handleShare = useCallback(async () => {
    const shareData = {
      title: t("shareTitle"),
      text: t("shareText", { salon: props.salonName, code }),
      url: props.accessLink ?? `https://www.solen.ch/${locale}/salon/${props.salonSlug}`,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await copyText(shareData.url, setCopiedCode);
      }
    } catch (err) {
      // AbortError fires when the user dismisses the native sheet (not a real failure).
      if ((err as Error)?.name !== "AbortError") {
        console.error("[BookingConfirmation] share failed:", err);
      }
    }
  }, [t, props.salonName, props.accessLink, props.salonSlug, code, locale, copyText]);

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
      <main className="mx-auto w-full max-w-[460px] px-5 pb-14 pt-8 md:max-w-[920px]">
        {/* ── success mark ── */}
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-[58px] w-[58px] items-center justify-center rounded-pill bg-s-success-bg">
            <Check size={30} strokeWidth={2.4} className="text-s-success" aria-hidden />
          </div>
          <h1 className="font-display text-[24px] font-semibold leading-[1.2] tracking-[-0.02em] md:text-[28px]">
            {t("title")}
          </h1>
          <p className="mt-2 max-w-[330px] text-[14px] leading-[1.5] text-s-ink-2 md:max-w-[420px] md:text-[15px]">
            {t("subtitleAt", { salon: props.salonName })}
          </p>
        </div>

        {/* desktop: two columns (code + actions | summary + access). mobile: stacked. */}
        <div className="md:grid md:grid-cols-2 md:items-start md:gap-7">
          {/* ── left column ── */}
          <div>
            {/* order-number hero */}
            <section className="mt-6 overflow-hidden rounded-card border border-s-border bg-s-bg-surface shadow-elevation-1">
              <p className="px-4 pt-[18px] text-center text-[11px] font-semibold uppercase tracking-[0.08em] text-s-ink-2">
                {t("orderNumber")}
              </p>
              <p className="px-3 pb-[2px] pt-[5px] text-center font-mono-code text-[34px] font-bold leading-[1.1] tracking-[0.04em] text-s-ink md:text-[40px]">
                {code || "SOL-•••••"}
              </p>
              <p className="px-[22px] pb-4 text-center text-[12.5px] leading-[1.45] text-s-ink-2">
                {t("orderNumberHint")}
              </p>
              <div className="flex gap-2 px-4 pb-4">
                <button
                  type="button"
                  onClick={() => copyText(code, setCopiedCode)}
                  aria-label={copiedCode ? t("copied") : t("copyNumber")}
                  className={[
                    "flex h-[44px] flex-1 items-center justify-center gap-2 rounded-btn bg-s-bg-sunken font-body text-[14px] font-medium transition-[background-color,color] duration-150",
                    "hover:brightness-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-s-accent focus-visible:ring-offset-2",
                    copiedCode ? "text-s-success" : "text-s-ink",
                  ].join(" ")}
                >
                  {copiedCode ? (
                    <Check size={16} aria-hidden />
                  ) : (
                    <Copy size={16} aria-hidden />
                  )}
                  <span>{copiedCode ? t("copied") : t("copyNumber")}</span>
                </button>
                <button
                  type="button"
                  onClick={handleShare}
                  aria-label={t("share")}
                  className="flex h-[44px] flex-1 items-center justify-center gap-2 rounded-btn bg-s-bg-sunken font-body text-[14px] font-medium text-s-ink transition-[background-color] duration-150 hover:brightness-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-s-accent focus-visible:ring-offset-2"
                >
                  <Share2 size={16} aria-hidden />
                  <span>{t("share")}</span>
                </button>
              </div>
            </section>

            {/* actions: calendar + directions (desktop keeps them on the left) */}
            <div className="mt-4 hidden md:flex md:flex-col md:gap-2.5">
              <button
                type="button"
                onClick={handleCalendar}
                className="flex h-[50px] w-full items-center justify-center gap-2 rounded-btn border border-s-border bg-s-bg-surface font-body text-[15px] font-medium text-s-ink transition-[background-color] duration-150 hover:bg-s-bg-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-s-accent focus-visible:ring-offset-2"
              >
                <Calendar size={17} aria-hidden />
                {t("addToCalendar")}
              </button>
              <a
                href={directionsHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-[50px] w-full items-center justify-center gap-2 rounded-btn border border-s-border bg-s-bg-surface font-body text-[15px] font-medium text-s-ink transition-[background-color] duration-150 hover:bg-s-bg-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-s-accent focus-visible:ring-offset-2"
              >
                <MapPin size={17} aria-hidden />
                {t("directions")}
              </a>
            </div>

            {/* manage / report hook, desktop (calm, Section-11 entry point) */}
            <div className="mt-[22px] hidden border-t border-s-border pt-[18px] text-center md:block">
              <p className="text-[12.5px] leading-[1.5] text-s-ink-2">{t("problemPrompt")}</p>
              <div className="mt-2.5 flex flex-wrap justify-center gap-2">
                <Link
                  href={`/${locale}/booking/lookup`}
                  className="rounded-btn border border-s-border bg-s-bg-surface px-3.5 py-2 text-[13px] font-medium text-s-ink transition-[background-color] duration-150 hover:bg-s-bg-sunken"
                >
                  {t("manageBooking")}
                </Link>
                <Link
                  href={`/${locale}/booking/lookup`}
                  className="inline-flex items-center gap-1.5 rounded-btn border border-s-border bg-s-bg-surface px-3.5 py-2 text-[13px] font-medium text-s-ink transition-[background-color] duration-150 hover:bg-s-bg-sunken"
                >
                  <TriangleAlert size={14} aria-hidden />
                  {t("reportProblem")}
                </Link>
              </div>
            </div>
          </div>

          {/* ── right column ── */}
          <div>
            {/* booking summary */}
            <section className="mt-[14px] overflow-hidden rounded-card border border-s-border bg-s-bg-surface shadow-elevation-1 md:mt-6">
              <div className="flex items-center gap-3 p-4">
                {props.salonCoverUrl ? (
                  <Image
                    src={props.salonCoverUrl}
                    alt=""
                    width={54}
                    height={54}
                    className="h-[54px] w-[54px] shrink-0 rounded-[12px] object-cover"
                    aria-hidden
                  />
                ) : (
                  <div className="h-[54px] w-[54px] shrink-0 rounded-[12px] bg-s-bg-sunken" aria-hidden />
                )}
                <div className="min-w-0">
                  <div className="font-display text-[15px] font-semibold tracking-[-0.01em] text-s-ink">
                    {props.salonName}
                  </div>
                  {props.salonAddress && (
                    <div className="mt-0.5 flex items-center gap-1.5 truncate text-[13px] text-s-ink-2">
                      <MapPin size={13} className="shrink-0 text-s-ink-2" aria-hidden />
                      <span className="truncate">{props.salonAddress}</span>
                    </div>
                  )}
                </div>
              </div>
              <hr className="border-s-border" />
              <div className="px-4 py-1.5">
                <Row
                  icon={<Calendar size={16} className="text-s-ink-2" aria-hidden />}
                  k={t("rowDate")}
                  v={dateStr}
                  sub={`${timeStr}${props.durationMinutes ? ` · ${props.durationMinutes} min` : ""}`}
                />
                {props.staffName && (
                  <Row
                    icon={<User size={16} className="text-s-ink-2" aria-hidden />}
                    k={t("rowStylist")}
                    v={props.staffName}
                  />
                )}
                <Row
                  icon={<Sparkles size={16} className="text-s-ink-2" aria-hidden />}
                  k={t("rowService")}
                  v={props.serviceName}
                />
                {paidWithLabel && (
                  <Row
                    icon={<CreditCard size={16} className="text-s-ink-2" aria-hidden />}
                    k={t("rowPaidWith")}
                    v={paidWithLabel}
                  />
                )}
              </div>
              {/* VAT/MWST breakdown — Netto / MWST x% above the inclusive total, per the approved
                  receipt mockup. Shown only for a settled payment from a registered salon. */}
              {showVat && (
                <div className="px-4 pt-2 pb-1">
                  <VatLine k={t("vatNet")} v={props.netLabel} />
                  <VatLine k={t("vatAmountLabel", { rate: rateStr })} v={props.vatLabel} />
                </div>
              )}
              <div className="flex items-center justify-between bg-s-bg-sunken px-4 py-3.5">
                <div className="text-[13.5px] text-s-ink-2">
                  {showVat ? t("totalInclVat") : t("total")}
                  <span
                    className={[
                      "mt-0.5 block font-display text-[14px] font-semibold",
                      isConfirming ? "text-s-ink-2" : "text-s-ink",
                    ].join(" ")}
                  >
                    {totalStateLabel}
                  </span>
                  {isConfirming && (
                    <span className="mt-0.5 block text-[12px] font-normal leading-[1.4] text-s-ink-2">
                      {t("paymentConfirmingHint")}
                    </span>
                  )}
                </div>
                <span className="font-display text-[18px] font-semibold tracking-[-0.01em] text-s-ink tabular-nums">
                  {props.priceLabel}
                </span>
              </div>
              {/* MWST-Nr. footer — the salon's Swiss UID. Only a registered salon carries one. */}
              {showVat && props.salonVatNumber && (
                <div className="flex items-center gap-1.5 border-t border-s-border px-4 py-2.5 text-[11px] text-s-ink-2">
                  <FileText size={12} className="shrink-0 text-s-ink-2" aria-hidden />
                  <span>{t("vatNumberLabel", { nr: props.salonVatNumber })}</span>
                </div>
              )}
            </section>

            {/* save-access-link (guest) OR saved-to-account (logged-in) */}
            {props.isGuest ? (
              <section className="mt-[14px] rounded-card border border-s-border bg-s-bg-surface p-4 shadow-elevation-1">
                <div className="flex items-start gap-3">
                  <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[9px] bg-s-bg-sunken">
                    <KeyRound size={18} className="text-s-ink" aria-hidden />
                  </div>
                  <div>
                    <div className="font-display text-[14.5px] font-semibold tracking-[-0.01em] text-s-ink">
                      {t("saveLinkTitle")}
                    </div>
                    <p className="mt-[3px] text-[13px] leading-[1.5] text-s-ink-2">
                      {t("saveLinkDesc")}
                    </p>
                  </div>
                </div>
                {props.accessLink && (
                  <div className="mt-3 flex h-[46px] items-center gap-2 rounded-[12px] border border-s-border bg-s-bg-sunken pl-3 pr-1.5 transition-[border-color,box-shadow] duration-150 focus-within:border-s-accent focus-within:bg-s-bg-surface focus-within:ring-2 focus-within:ring-s-accent-pale">
                    <span className="flex-1 truncate font-mono-code text-[12px] text-s-ink-2">
                      {props.accessLink}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyText(props.accessLink as string, setCopiedLink)}
                      aria-label={copiedLink ? t("copied") : t("copyLink")}
                      className={[
                        "flex h-[34px] shrink-0 items-center gap-1.5 rounded-[9px] border border-s-border bg-s-bg-surface px-3.5 text-[13px] font-medium transition-colors duration-150",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-s-accent focus-visible:ring-offset-1",
                        copiedLink ? "text-s-success" : "text-s-ink",
                      ].join(" ")}
                    >
                      {copiedLink ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}
                      {copiedLink ? t("copied") : t("copyLink")}
                    </button>
                  </div>
                )}
                <p className="mt-[11px] flex gap-2 text-[12px] leading-[1.45] text-s-ink-2">
                  <TriangleAlert size={14} className="mt-[1px] shrink-0 text-s-ink-2" aria-hidden />
                  {t("saveLinkWarning")}
                </p>
              </section>
            ) : (
              <section className="mt-[14px] rounded-card border border-s-border bg-s-bg-surface p-4 shadow-elevation-1">
                <div className="flex items-start gap-3">
                  <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[9px] bg-s-bg-sunken">
                    <Check size={18} className="text-s-ink" aria-hidden />
                  </div>
                  <div>
                    <div className="font-display text-[14.5px] font-semibold tracking-[-0.01em] text-s-ink">
                      {t("savedToAccountTitle")}
                    </div>
                    <p className="mt-[3px] text-[13px] leading-[1.5] text-s-ink-2">
                      {t("savedToAccountDesc")}
                    </p>
                  </div>
                </div>
                {props.contactEmail && (
                  <div className="mt-3 flex items-center gap-2.5 rounded-[12px] bg-s-bg-sunken px-3.5 py-3 text-[13px] text-s-ink-2">
                    <Check size={16} className="shrink-0 text-s-success" aria-hidden />
                    <span className="truncate">
                      {t("emailedTo", { email: props.contactEmail })}
                    </span>
                  </div>
                )}
              </section>
            )}

            {/* actions: mobile (calendar + directions stacked under the cards) */}
            <div className="mt-4 flex flex-col gap-2.5 md:hidden">
              <button
                type="button"
                onClick={handleCalendar}
                className="flex h-[50px] w-full items-center justify-center gap-2 rounded-btn border border-s-border bg-s-bg-surface font-body text-[15px] font-medium text-s-ink transition-[background-color] duration-150 hover:bg-s-bg-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-s-accent focus-visible:ring-offset-2"
              >
                <Calendar size={17} aria-hidden />
                {t("addToCalendar")}
              </button>
              <a
                href={directionsHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-[50px] w-full items-center justify-center gap-2 rounded-btn border border-s-border bg-s-bg-surface font-body text-[15px] font-medium text-s-ink transition-[background-color] duration-150 hover:bg-s-bg-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-s-accent focus-visible:ring-offset-2"
              >
                <MapPin size={17} aria-hidden />
                {t("directions")}
              </a>
            </div>

            {/* manage / report hook, mobile */}
            <div className="mt-[22px] border-t border-s-border pt-[18px] text-center md:hidden">
              <p className="text-[12.5px] leading-[1.5] text-s-ink-2">{t("problemPrompt")}</p>
              <div className="mt-2.5 flex flex-wrap justify-center gap-2">
                <Link
                  href={`/${locale}/booking/lookup`}
                  className="rounded-btn border border-s-border bg-s-bg-surface px-3.5 py-2 text-[13px] font-medium text-s-ink transition-[background-color] duration-150 hover:bg-s-bg-sunken"
                >
                  {t("manageBooking")}
                </Link>
                <Link
                  href={`/${locale}/booking/lookup`}
                  className="inline-flex items-center gap-1.5 rounded-btn border border-s-border bg-s-bg-surface px-3.5 py-2 text-[13px] font-medium text-s-ink transition-[background-color] duration-150 hover:bg-s-bg-sunken"
                >
                  <TriangleAlert size={14} aria-hidden />
                  {t("reportProblem")}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

/** One key/value summary row. Icon + label on the left, value (+ optional sub) right-aligned. */
function Row({
  icon,
  k,
  v,
  sub,
}: {
  icon: React.ReactNode;
  k: string;
  v: string;
  sub?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <span className="flex shrink-0 items-center gap-2.5 text-[13px] text-s-ink-2">
        {icon}
        {k}
      </span>
      <span className="text-right text-[14px] font-medium tracking-[-0.005em] text-s-ink">
        {v}
        {sub && <small className="mt-0.5 block text-[12.5px] font-normal text-s-ink-2">{sub}</small>}
      </span>
    </div>
  );
}

/** A VAT-breakdown sub-row: grey label left, value right. No icon, tighter than Row — used only
 *  for the Netto / MWST lines above the inclusive total. */
function VatLine({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-[13px] text-s-ink-2">{k}</span>
      <span className="text-[13.5px] font-medium tabular-nums text-s-ink">{v}</span>
    </div>
  );
}
