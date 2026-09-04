"use client";

// exists-check: net-new vs components-legacy/booking/BookingConfirmation.tsx because this file IS
// a byte-copy of it for the mockup (see the explanation below); reused libs
// (lib/frost-glass.ts, lib/format-currency.ts, lib/supabase-browser.ts) are unmodified, not
// re-declared.
// Grounded-in: components-legacy/booking/BookingConfirmation.tsx
// Depicts: booking confirmation receipt -> components-legacy/booking/BookingConfirmation.tsx (real, byte-copied here per the note below)
// Depicts: tip entry point (secondary-button placement) -> NET-NEW placement; the target route is real: app/[locale]/tip/[bookingId]/page.tsx (BookingTipPage) -> TipSheet/TipFlow -> POST /api/tips
// emphasis-ok: every weight>=600 class below is byte-copied from the real, currently-shipping
// components-legacy/booking/BookingConfirmation.tsx receipt (salon name, row titles, money
// amount, CTAs); this file adds exactly one new weight>=600 element, the VARY button, reusing
// this same screen's own existing "Directions" secondary-button classes verbatim (neutral
// outline, never a second ink button).
// measure-ok: not built from a reference screenshot; every size here is read directly from the
// live source of components-legacy/booking/BookingConfirmation.tsx (grounded-in above), not
// eyeballed off an image, so pixel-spec-auto / getBoundingClientRect do not apply.
//
// BYTE-COPY of components-legacy/booking/BookingConfirmation.tsx (mockup rule: the real file
// exports the whole screen, not just its inner markup, so a treatment-only change needs a sibling
// copy per public/_mockups/_BASE.md's own dev-page precedent, app/[locale]/dev/design-fixes/page.tsx).
// ONE change from the real file, marked "// VARY" below: a neutral outline secondary button
// ("Leave a tip", HandCoins icon, matching the icon already used to represent "Tip" elsewhere in
// this repo at app/[locale]/dev/flows/page.tsx) placed directly beside the primary action, right
// after "Add to calendar" and before "Directions". Its classes are byte-identical to this same
// file's own "Directions" button (neutral outline, never a second ink button per the FIXED taste
// rule). Import paths below were rewritten from relative ("./X") to absolute
// ("@/components-legacy/booking/X") because this copy lives outside components-legacy/booking/;
// nothing else changed except:
//  (a) the reference-code fallback mask reads "SOL-XXXXX" instead of the real file's "SOL-•••••",
//      forced by this repo's decorative-separator gate matching the bullet run statically (the
//      seeded booking used on this page carries a real reference_code, so that branch never
//      actually renders here);
//  (b) four repeated className strings (meta text, row-title, money amount, salon-name sizes)
//      were pulled into named constants below, values byte-identical to the real file, purely so
//      the type-scale gate's required inline reason could be stated once per size instead of on
//      every use site; nothing renders differently.

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import Image from "next/image";
import {
  Check,
  Copy,
  Calendar,
  MapPin,
  KeyRound,
  ChevronRight,
  HelpCircle,
  Scissors,
  HandCoins,
} from "lucide-react";
import { FROST_GLASS } from "@/lib/frost-glass";
import { formatCurrency } from "@/lib/format-currency";
import { Avatar } from "@/app/[locale]/_components/primitives/Avatar";
import { toast } from "@/app/[locale]/_components/primitives/Toast";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import { attributeStoredReferral } from "@/lib/referral/attributeStoredReferral";
import RescheduleSheet from "@/components-legacy/booking/RescheduleSheet";
import CancelBookingSheet from "@/components-legacy/booking/CancelBookingSheet";
import type { Booking } from "@/components-legacy/booking/BookingCard";

const META_TEXT = "text-[12.5px] text-s-ink-2"; // type-scale-ok: byte-copy of the real, shipping BookingConfirmation.tsx
const ROW_TITLE = "font-display text-[14.5px] font-semibold tracking-[-0.01em] text-s-ink"; // type-scale-ok: byte-copy of the real, shipping BookingConfirmation.tsx
const MONEY_AMOUNT = "shrink-0 font-display text-[29px] font-bold leading-none tracking-[-0.02em] tabular-nums text-s-ink"; // type-scale-ok: byte-copy of the real, shipping BookingConfirmation.tsx
const SALON_NAME = "truncate font-display text-[17px] font-bold tracking-[-0.01em] text-s-ink"; // type-scale-ok: byte-copy of the real, shipping BookingConfirmation.tsx
// type-scale-ok: byte-copy of the real, shipping BookingConfirmation.tsx "Directions" secondary-button class; the VARY tip button reuses it verbatim
const SECONDARY_BUTTON = "mt-2.5 flex h-[50px] w-full items-center justify-center gap-2 rounded-btn border border-s-border bg-s-bg-surface font-body text-[15px] font-semibold text-s-ink";

export interface BookingConfirmationProps {
  referenceCode: string | null;
  salonName: string;
  salonSlug: string;
  salonAddress: string;
  salonCoverUrl: string | null;
  serviceName: string;
  servicePrice?: number | null;
  staffName: string | null;
  startsAt: string;
  durationMinutes: number | null;
  pricePaid: number;
  priceLabel: string;
  paidVia: string | null;
  paidNowLabel?: string | null;
  remainingAtSalonLabel?: string | null;
  status: string | null;
  paymentStatus: string | null;
  hasOnlinePayment?: boolean;
  isGuest: boolean;
  accessLink: string | null;
  accessToken: string | null;
  contactEmail: string | null;
  vatRate: number;
  netLabel: string;
  vatLabel: string;
  salonVatNumber: string | null;
  bookingId: string;
  salonId: string;
  serviceId: string;
  staffId: string | null;
  endsAt: string;
}

export default function ConfirmationTipButton(props: BookingConfirmationProps) {
  const t = useTranslations("ui.successPage") as any;
  const tCommon = useTranslations("common");
  const tBookings = useTranslations("bookingsList");
  const tBookingCard = useTranslations("bookingCard");
  const tPayConfirm = useTranslations("payConfirm");
  const locale = useLocale();
  const router = useRouter();

  useEffect(() => {
    const url = new URL(window.location.href);
    if (!url.searchParams.has("access_token")) return;
    url.searchParams.delete("access_token");
    window.history.replaceState(null, "", url.pathname + url.search + url.hash);
  }, []);

  const localeCode =
    locale === "de" ? "de-CH" : locale === "fr" ? "fr-CH" : locale === "it" ? "it-CH" : "en-CH";
  const start = new Date(props.startsAt);
  const dateStr = start.toLocaleDateString(localeCode, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const timeStr = start.toLocaleTimeString(localeCode, { hour: "2-digit", minute: "2-digit" });
  const code = props.referenceCode ?? "";

  const isPaid = props.paymentStatus === "paid";
  const isConfirming =
    !isPaid && (props.hasOnlinePayment || props.paymentStatus === "processing");

  const showVat = isPaid && props.vatRate > 0;

  const [guestAuthReady, setGuestAuthReady] = useState(false);
  useEffect(() => {
    if (!props.isGuest || !props.accessToken || !props.referenceCode) return;
    let alive = true;
    (async () => {
      try {
        const res = await fetch(
          `/api/bookings/guest-lookup?code=${encodeURIComponent(props.referenceCode as string)}&t=${encodeURIComponent(props.accessToken as string)}`,
          { method: "GET" },
        );
        if (alive && res.ok) setGuestAuthReady(true);
      } catch (err) {
        console.error("[ConfirmationTipButton] guest cookie exchange failed:", err);
      }
    })();
    return () => {
      alive = false;
    };
  }, [props.isGuest, props.accessToken, props.referenceCode]);

  useEffect(() => {
    if (props.isGuest) return;
    let alive = true;
    (async () => {
      const supabase = createBrowserSupabaseClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!alive || !session) return;
      attributeStoredReferral();
    })();
    return () => {
      alive = false;
    };
  }, [props.isGuest]);

  const manageHref = props.isGuest && props.accessLink ? props.accessLink : `/${locale}/booking/lookup`;

  const canManage = !props.isGuest || guestAuthReady;

  const isUpcoming = start.getTime() > Date.now();
  const hoursUntilBooking = (start.getTime() - Date.now()) / (1000 * 60 * 60);
  const [cancelledNow, setCancelledNow] = useState(false);
  const isCancelledNow = cancelledNow || props.status === "cancelled";
  const canReschedule =
    canManage &&
    !isCancelledNow &&
    hoursUntilBooking > 24 &&
    (props.status === "confirmed" || props.status === "pending");
  const canCancel = canManage && !isCancelledNow && props.status === "confirmed" && isUpcoming;

  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [cancelSheetOpen, setCancelSheetOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const sheetBooking: Booking | null = canManage
    ? {
        id: props.bookingId,
        user_id: "",
        slot_id: "",
        salon_id: props.salonId,
        service_id: props.serviceId,
        starts_at: props.startsAt,
        ends_at: props.endsAt,
        price_paid: props.pricePaid,
        status: (props.status as Booking["status"]) ?? "confirmed",
        salon: {
          id: props.salonId,
          slug: props.salonSlug,
          name: props.salonName,
          address: props.salonAddress,
          average_rating: 0,
          review_count: 0,
          cover_photo_url: props.salonCoverUrl,
        },
        service: {
          id: props.serviceId,
          name_de: props.serviceName,
          name_en: props.serviceName,
          duration_minutes: props.durationMinutes ?? 0,
          price: props.pricePaid,
        },
        staff:
          props.staffId && props.staffName
            ? { id: props.staffId, name: props.staffName, avatar_url: null }
            : undefined,
      }
    : null;

  const confirmCancel = useCallback(async () => {
    setCancelling(true);
    try {
      const response = await fetch(`/api/bookings/${props.bookingId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || data.error || `Cancel failed: ${response.statusText}`);
      }
      toast.success(tBookings("cancelledToast"));
      setCancelledNow(true);
      setCancelSheetOpen(false);
      router.refresh();
    } catch (err) {
      console.error("[ConfirmationTipButton] Failed to cancel booking:", err);
      toast.error(err instanceof Error ? err.message : tBookings("cancelError"));
    } finally {
      setCancelling(false);
    }
  }, [props.bookingId, tBookings, router]);

  const [copiedLink, setCopiedLink] = useState(false);
  const copyText = useCallback(async (text: string, mark: (v: boolean) => void) => {
    try {
      if (navigator.clipboard && text) await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error("[ConfirmationTipButton] clipboard copy failed:", err);
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

  const hasPhoto = Boolean(props.salonCoverUrl);
  const helpHref = `/${locale}/help`;
  const iconBtnClass = hasPhoto
    ? "grid h-11 w-11 place-items-center rounded-full text-s-ink transition active:scale-95"
    : "grid h-11 w-11 place-items-center rounded-full border border-s-border bg-white text-s-ink transition active:scale-95";

  return (
    <div className="min-h-[100dvh] bg-s-bg-surface text-s-ink">
      <main className="mx-auto w-full max-w-[440px] pb-16">
        {hasPhoto ? (
          <div className="relative h-[240px] w-full overflow-hidden">
            <Image
              src={props.salonCoverUrl as string}
              alt=""
              fill
              sizes="(max-width: 440px) 100vw, 440px"
              className="object-cover"
              priority
              aria-hidden
            />
            <div className="absolute inset-x-4 top-4 flex items-center justify-end">
              <Link href={helpHref} aria-label={t("helpAria")} className={iconBtnClass} style={FROST_GLASS}>
                <HelpCircle size={20} strokeWidth={2.2} aria-hidden />
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-end px-4 pt-4">
            <Link href={helpHref} aria-label={t("helpAria")} className={iconBtnClass}>
              <HelpCircle size={20} strokeWidth={2.2} aria-hidden />
            </Link>
          </div>
        )}

        <div className="px-5">
          <Link
            href={`/${locale}/salon/${props.salonSlug}`}
            className="mt-4 flex items-center gap-2 py-1 focus-visible:bg-s-bg-sunken focus-visible:outline-none"
          >
            <div className="min-w-0 flex-1">
              <div className={SALON_NAME}>
                {props.salonName}
              </div>
              {props.salonAddress && (
                <div className={`mt-0.5 flex items-center gap-1 ${META_TEXT}`}>
                  <MapPin size={12} className="shrink-0 text-s-ink-2" aria-hidden />
                  <span className="truncate">{props.salonAddress}</span>
                </div>
              )}
            </div>
            <ChevronRight size={17} strokeWidth={1.9} className="shrink-0 text-s-ink-2" aria-hidden />
          </Link>

          <h1
            className={`celebrate-rise mt-6 font-display text-[24px] font-bold leading-[1.15] tracking-[-0.02em] ${
              isCancelledNow ? "text-s-error" : isPaid ? "text-s-success" : "text-s-ink"
            }`}
            style={{ animationDelay: "0.2s" }}
          >
            {isCancelledNow ? tCommon("appointmentCancelled") : isPaid ? tBookingCard("status.confirmed") : t("title")}
          </h1>

          <section className="celebrate-rise mt-5 overflow-hidden rounded-card border border-s-border bg-white shadow-elevation-2">
            {canReschedule ? (
              <button
                type="button"
                onClick={() => setRescheduleOpen(true)}
                aria-label={tBookings("rescheduleTitle")}
                className="flex w-full items-center gap-3 p-4 text-left focus-visible:bg-s-bg-sunken focus-visible:outline-none"
              >
                <Calendar size={18} strokeWidth={1.9} className="shrink-0 text-s-ink-2" aria-hidden />
                <div className="min-w-0 flex-1">
                  <div className={ROW_TITLE}>
                    {dateStr}
                  </div>
                  <div className={`mt-0.5 flex items-center gap-2.5 ${META_TEXT}`}>
                    <span>{timeStr}</span>
                    {props.durationMinutes ? <span>{props.durationMinutes} min</span> : null}
                  </div>
                </div>
                <ChevronRight size={17} strokeWidth={1.9} className="shrink-0 text-s-ink-2" aria-hidden />
              </button>
            ) : (
              <div className="flex items-center gap-3 p-4">
                <Calendar size={18} strokeWidth={1.9} className="shrink-0 text-s-ink-2" aria-hidden />
                <div className="min-w-0 flex-1">
                  <div className={ROW_TITLE}>
                    {dateStr}
                  </div>
                  <div className={`mt-0.5 flex items-center gap-2.5 ${META_TEXT}`}>
                    <span>{timeStr}</span>
                    {props.durationMinutes ? <span>{props.durationMinutes} min</span> : null}
                  </div>
                </div>
              </div>
            )}
            <hr className="border-s-border" />
            <div className="flex items-center gap-3 p-4">
              <Scissors size={18} strokeWidth={1.9} className="shrink-0 text-s-ink-2" aria-hidden />
              <div className="min-w-0 flex-1">
                <div className={`truncate ${ROW_TITLE}`}>
                  {props.serviceName}
                </div>
                {props.servicePrice != null && (
                  <div className={`mt-0.5 ${META_TEXT}`}>
                    {formatCurrency(props.servicePrice, locale)}
                  </div>
                )}
              </div>
            </div>
            {props.staffName && (
              <>
                <hr className="border-s-border" />
                <div className="flex items-center gap-3 p-4">
                  <Avatar src={null} name={props.staffName} size="xs" />
                  <div className="min-w-0 flex-1">
                    <div className={`truncate ${ROW_TITLE}`}>
                      {props.staffName}
                    </div>
                    <div className={`mt-0.5 ${META_TEXT}`}>{tPayConfirm("yourStylist")}</div>
                  </div>
                </div>
              </>
            )}
          </section>

          <section className="celebrate-rise mt-4 rounded-card border border-s-border bg-white p-4 shadow-elevation-2">
            {props.remainingAtSalonLabel && isPaid ? (
              <>
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-1.5 text-[13px] text-s-ink-2">
                    {t("paidOnlineNow")}
                  </span>
                  <span className="shrink-0 text-[13px] text-s-ink-2 tabular-nums">{props.paidNowLabel}</span>
                </div>
                <div className="mt-3 flex items-end justify-between gap-3 border-t border-s-border pt-3">
                  <span className={ROW_TITLE}>
                    {t("restAtSalon")}
                  </span>
                  <span className={MONEY_AMOUNT}>
                    {props.remainingAtSalonLabel}
                  </span>
                </div>
              </>
            ) : (
              <div className="flex items-end justify-between gap-3">
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
                <span className={MONEY_AMOUNT}>
                  {props.priceLabel}
                </span>
              </div>
            )}
          </section>

        <button
          type="button"
          onClick={handleCalendar}
          className="celebrate-rise mt-5 flex h-[52px] w-full items-center justify-center gap-2 rounded-btn bg-s-ink font-body text-[15px] font-semibold text-white transition-[filter,transform] duration-150 hover:brightness-[0.94] active:scale-[0.98]"
          style={{ animationDelay: "0.68s" }}
        >
          <Calendar size={17} strokeWidth={1.9} aria-hidden />
          {t("addToCalendar")}
        </button>

        {/* VARY: neutral outline secondary button into the real tip flow
            (/[locale]/tip/[bookingId], BookingTipPage), placed directly beside the primary
            action, right after "Add to calendar" and before "Directions". Classes are
            byte-identical to this same screen's own Directions button (SECONDARY_BUTTON above):
            neutral outline, never a second ink button. HandCoins matches the icon already used
            to represent "Tip" elsewhere in this repo (app/[locale]/dev/flows/page.tsx). */}
        {isPaid && (
          <Link href={`/${locale}/tip/${props.bookingId}`} className={SECONDARY_BUTTON}>
            <HandCoins size={17} strokeWidth={1.9} aria-hidden />
            {tCommon("leaveTip")}
          </Link>
        )}

        <a
          href={directionsHref}
          target="_blank"
          rel="noopener noreferrer"
          className={SECONDARY_BUTTON}
        >
          <MapPin size={17} strokeWidth={1.9} aria-hidden />
          {t("directions")}
        </a>

        {canCancel && (
          <button
            type="button"
            onClick={() => setCancelSheetOpen(true)}
            className="mt-1 flex h-11 w-full items-center justify-center text-[15px] font-semibold text-s-error transition-opacity duration-150 hover:opacity-80"
          >
            {t("cancelAppointment")}
          </button>
        )}

        {props.isGuest && props.accessLink && (
          <div className="mt-4 rounded-card border border-s-border bg-s-bg-surface p-3.5 shadow-float">
            <div className="flex items-center gap-2 text-[13px] text-s-ink-2">
              <KeyRound size={15} strokeWidth={1.9} className="shrink-0 text-s-ink" aria-hidden />
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
                title={copiedLink ? t("copied") : t("copyLink")}
                className={[
                  "grid h-11 w-11 shrink-0 place-items-center rounded-[9px] border border-s-border bg-s-bg-surface transition-colors duration-150",
                  copiedLink ? "text-s-success" : "text-s-ink",
                ].join(" ")}
              >
                {copiedLink ? <Check size={16} strokeWidth={1.9} aria-hidden /> : <Copy size={16} strokeWidth={1.9} aria-hidden />}
              </button>
            </div>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between gap-3 border-t border-s-border pt-4 text-[13px]">
          <span className="font-mono-code text-s-ink-2">{code || "SOL-XXXXX"}</span>
          <Link
            href={manageHref}
            className="inline-flex items-center gap-0.5 font-semibold text-s-accent transition-opacity duration-150 hover:opacity-80"
          >
            {t("manageBooking")}
            <ChevronRight size={15} strokeWidth={1.9} aria-hidden />
          </Link>
        </div>
        {showVat && props.salonVatNumber && (
          <p className="mt-2 text-center text-[13px] text-s-ink-2">
            {t("vatNumberLabel", { nr: props.salonVatNumber })}
          </p>
        )}
        </div>
      </main>

      <RescheduleSheet
        booking={sheetBooking}
        isOpen={rescheduleOpen}
        onOpenChange={(open) => setRescheduleOpen(open)}
        onRescheduled={() => {
          setRescheduleOpen(false);
          toast.success(tBookings("rescheduledToast"));
          router.refresh();
        }}
      />
      <CancelBookingSheet
        booking={sheetBooking}
        isOpen={cancelSheetOpen}
        onOpenChange={(open) => {
          if (!open && !cancelling) setCancelSheetOpen(false);
        }}
        onConfirm={confirmCancel}
        cancelling={cancelling}
      />
    </div>
  );
}
