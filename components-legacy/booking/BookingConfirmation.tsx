"use client";

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
} from "lucide-react";
import { FROST_GLASS } from "@/lib/frost-glass";
import { formatCurrency } from "@/lib/format-currency";
import { Avatar } from "@/app/[locale]/_components/primitives/Avatar";
import { toast } from "@/app/[locale]/_components/primitives/Toast";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import { attributeStoredReferral } from "@/lib/referral/attributeStoredReferral";
import RescheduleSheet from "./RescheduleSheet";
import CancelBookingSheet from "./CancelBookingSheet";
import type { Booking } from "./BookingCard";

/**
 * BookingConfirmation: the screen a customer lands on right after paying (or reserving).
 *
 * RECEIPT REBUILD (owner-approved mockup `public/_mockups/confirmation-v2.html` + the portable
 * handoff spec `public/_mockups/confirmation-spec.html`; both live on branch
 * `claude/backend-analysis-improvements-77f02b`, not in this worktree's history). This receipt
 * layout is ONE consistent structure for every payment state (confirmed, confirming, and
 * pay-at-salon alike), replacing the SENIOR REBUILD 2026-06-09 centered-celebration layout
 * (SuccessMark disc + centered h1 + one card, 344 lines) everywhere, not just for a paid booking.
 * The big SuccessMark disc is an owner-killed pattern and does not come back for any state. What
 * IS unchanged from before this rebuild: the payment-status DERIVATION (isPaid / isConfirming
 * booleans below) and the translation KEYS the confirming / pay-at-salon states already used
 * (`t("title")`, `t("paymentConfirming")`, `t("paidInPerson")`); only their visual container
 * changed, from the old centered card to this receipt. The new receipt:
 *   - Full-bleed 240px salon cover photo at the top (image flush(0), no side margins), with
 *     frosted back/help circles floating on it (FROST_GLASS, lib/frost-glass.ts). No photo:
 *     the hero is omitted, back/help render flat (frost is earned by the photo, CLAUDE.md taste
 *     rule 7) in a plain header row instead.
 *   - Salon name + address BELOW the photo (never overlaid, REMOVED.md 2026-07-02 killed
 *     photo-overlay text), chevron to the salon page.
 *   - Headline: same receipt position and 24/700 type scale for every state. Only the colour and
 *     copy branch on payment_status: green "confirmed" text when it is actually 'paid' (isPaid
 *     below), otherwise the original ink `title` copy (confirming / pay-at-salon). No check disc
 *     next to it (the word already says it, taste rule 2) and no date sub-line (the date lives
 *     in the details card, copy economy).
 *   - Details card + money card: elevation-2, radius 16, white (never the sunken selected-state
 *     grey the SENIOR REBUILD used as a decorative panel).
 *   - NEW: the date row opens RescheduleSheet (real in-place reschedule) when the booking is
 *     over 24h out and still confirmed/pending; a quiet red "cancel appointment" text row opens
 *     CancelBookingSheet when the booking is upcoming and confirmed (mirrors BookingCard.tsx's
 *     own gate). For a GUEST both wait on the silent cookie exchange below, see the
 *     `canManage` comment for why.
 *
 * AESTHETIC: Solen B&W chrome, Inter Tight + Inter (font-mono-code for the reference code), ink
 *   primary CTA, s-accent functional-only, success-green / error-red semantic (never monochromed).
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
  /** services.price (CHF), the SERVICE price shown on the service row. Distinct from
   *  pricePaid/paid_amount (money-card figures); null omits the price on that row entirely,
   *  never substitutes another amount. */
  servicePrice?: number | null;
  staffName: string | null;
  startsAt: string; // ISO
  durationMinutes: number | null;
  pricePaid: number;
  priceLabel: string; // pre-formatted currency (server-side, avoids locale drift)
  paidVia: string | null; // 'stripe' | 'package' | 'gift_card' | 'walk_in'
  paidNowLabel?: string | null; // deposit: pre-formatted amount charged online now
  remainingAtSalonLabel?: string | null; // deposit: pre-formatted rest paid at the salon (discount-aware); null hides the breakdown
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
  /** true when the row carries a Stripe payment_intent_id (online pay initiated). */
  hasOnlinePayment?: boolean;
  isGuest: boolean;
  /** Guest only: the full re-entry link incl. the raw token (?code=&t=). */
  accessLink: string | null;
  /** Guest only: the raw access_token itself (same token embedded in accessLink), used to
   *  silently exchange it for the httpOnly solen_guest_access cookie on this screen so the
   *  inline reschedule/cancel sheets below can authorize (see the canManage comment). */
  accessToken: string | null;
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
  /**
   * The five raw ids/timestamps below exist ONLY so this screen can hand a booking to
   * RescheduleSheet / CancelBookingSheet (built for BookingsList's `Booking` shape, BookingCard.tsx).
   * referenceCode is a public display code, never the row id the reschedule/cancel routes key on.
   */
  bookingId: string;
  salonId: string;
  serviceId: string;
  staffId: string | null;
  endsAt: string; // ISO
}

export default function BookingConfirmation(props: BookingConfirmationProps) {
  const t = useTranslations("ui.successPage") as any;
  const tCommon = useTranslations("common");
  const tBookings = useTranslations("bookingsList");
  // Reused, not new (CLAUDE.md exists-check protocol): bookingCard.status.confirmed is the SAME
  // one-word "Confirmed" status label already live on BookingsList's cards; payConfirm.yourStylist
  // is the same "your stylist" caption PayConfirmStep already shows one step earlier in this exact
  // flow. Both keys exist in all 4 locale files already.
  const tBookingCard = useTranslations("bookingCard");
  const tPayConfirm = useTranslations("payConfirm");
  const locale = useLocale();
  const router = useRouter();

  // SEC-09: this screen authorizes a guest straight off `access_token` in the URL (the server
  // component above verified it against the stored hash before rendering; unlike the lookup
  // route it does NOT set the httpOnly guest cookie, so the durable re-entry stays the emailed
  // `booking/lookup?code=&t=` link, untouched by this effect). Strip the token from the address
  // bar with a history REPLACE (never push, so Back can't resurrect it) so it doesn't sit there
  // for pageview analytics or a shoulder-surfer. No failure branch to guard here, unlike the
  // lookup page: an invalid token fails inside the server component itself (`notFound()`), so
  // this client code never mounts in that case, only the already-authorized success path does.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (!url.searchParams.has("access_token")) return;
    url.searchParams.delete("access_token");
    window.history.replaceState(null, "", url.pathname + url.search + url.hash);
  }, []);

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
  const code = props.referenceCode ?? "";

  // Payment truth, gated on the row (never an unconditional "paid in full").
  // payment_status 'none' is the DB DEFAULT for pay-at-salon too, so it can't
  // discriminate alone (bug seen 2026-06-12: salon-pay bookings showed
  // "Zahlung wird bestätigt…"). The online-pay fingerprint is payment_intent_id:
  // only the C1 create-then-charge path sets it.
  const isPaid = props.paymentStatus === "paid";
  const isConfirming =
    !isPaid && (props.hasOnlinePayment || props.paymentStatus === "processing");

  // VAT shown only on a settled payment from a registered salon. The label carries "(inkl. MWST)"
  // and the footer carries the MWST-Nr; the itemized net/rate split lives on the emailed receipt.
  const showVat = isPaid && props.vatRate > 0;

  // Silently exchange the guest's raw access_token for the httpOnly solen_guest_access
  // cookie, the SAME GET /api/bookings/guest-lookup call the /booking/lookup page already
  // makes (app/[locale]/booking/lookup/page.tsx), just triggered here instead of requiring a
  // second click-through. Runs once per booking; on 200 the cookie is set and
  // resolveBookingActor's guest branch can authorize the reschedule/cancel routes below.
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
        console.error("[BookingConfirmation] guest cookie exchange failed:", err);
      }
    })();
    return () => {
      alive = false;
    };
  }, [props.isGuest, props.accessToken, props.referenceCode]);

  // GAP #49 second retry hook. At signup the referred user almost always has 0 bookings
  // yet, so the onboarding hook (OnboardingFlow.tsx) leaves any stored referral code in
  // place. This screen is the first point after a REAL booking exists, where the
  // anti-farming "complete a booking first" gate in POST /api/referral/complete
  // (app/api/referral/complete/route.ts:68-79) can actually pass, so it is the right
  // place to retry. Guest bookings have no user_id to credit, so this checks a real
  // browser session (not just `!props.isGuest`, which only reflects the BOOKING's owner,
  // not who is currently looking at this screen) before ever calling out. Shares the
  // exact read-code / POST / handle-response / clear logic with the onboarding hook via
  // attributeStoredReferral, so the two can never drift.
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

  // Guest "manage" + the access link point at the same re-entry; logged-in goes to the lookup route.
  const manageHref = props.isGuest && props.accessLink ? props.accessLink : `/${locale}/booking/lookup`;

  // ── reschedule / cancel affordances (checklist item 9) ──────────────────────────────────
  // Both RescheduleSheet's POST and CancelBookingSheet's GET/POST authorize through
  // resolveBookingActor (lib/bookings/authorize.ts), whose guest branch reads the httpOnly
  // `solen_guest_access` cookie (lib/bookings/guest-access.ts). That cookie is only ever
  // written by setGuestCookie, called from ONE place: GET /api/bookings/guest-lookup
  // (app/api/bookings/guest-lookup/route.ts:65), the SAME exchange the /booking/lookup page
  // already performs. This confirmation page's own guest read (app/[locale]/confirmation/page.tsx)
  // verifies the access_token itself against the admin client and never calls that route, so a
  // guest used to land here with no cookie set. The useEffect below now runs that exact
  // exchange itself as soon as the screen mounts, so the cookie exists before either sheet's
  // first request. `canManage` waits on `guestAuthReady` (the exchange's own success signal)
  // rather than trusting `!isGuest` alone, so the sheets never appear before the cookie that
  // authorizes them actually exists.
  const canManage = !props.isGuest || guestAuthReady;

  const isUpcoming = start.getTime() > Date.now();
  const hoursUntilBooking = (start.getTime() - Date.now()) / (1000 * 60 * 60);
  // A cancel that just succeeded on THIS page reads the same "cancelled" branch as a booking that
  // was already cancelled server-side (a stale confirmation link reopened later), so the headline
  // is never wrong either way (checklist item 7).
  const [cancelledNow, setCancelledNow] = useState(false);
  const isCancelledNow = cancelledNow || props.status === "cancelled";
  // Mirrors RescheduleSheet's own RESCHEDULE_MIN_LEAD_HOURS gate so the chevron never opens onto
  // an already-passed sheet.
  const canReschedule =
    canManage &&
    !isCancelledNow &&
    hoursUntilBooking > 24 &&
    (props.status === "confirmed" || props.status === "pending");
  // Mirrors BookingCard.tsx's own cancel gate (`booking.status === 'confirmed' && isUpcoming`).
  const canCancel = canManage && !isCancelledNow && props.status === "confirmed" && isUpcoming;

  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [cancelSheetOpen, setCancelSheetOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // Adapter: RescheduleSheet + CancelBookingSheet were both built for BookingsList's `Booking`
  // shape (BookingCard.tsx), not this screen's flatter prop list. Fields neither sheet ever reads
  // (user_id, slot_id, salon.average_rating/review_count, service.price) get inert placeholders,
  // confirmed by reading both sheet files line by line, so this never displays fabricated data.
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

  // Mirrors BookingsList's confirmCancel (BookingsList.tsx): same endpoint, same error handling.
  const confirmCancel = useCallback(async () => {
    setCancelling(true);
    try {
      const response = await fetch(`/api/bookings/${props.bookingId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // A9-email-locale: thread the page's own locale through so a guest cancel (no
        // profiles row to resolve locale from server-side) still gets its email in-language.
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
      console.error("[BookingConfirmation] Failed to cancel booking:", err);
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

  const hasPhoto = Boolean(props.salonCoverUrl); // mockup-ok
  // Help: the real /{locale}/help route. No back button here (V3-D461, "one up-affordance,
  // never both"): the global Header already renders its own back arrow on this deep page
  // (app/[locale]/_components/layout/Header.tsx:355-368), so a second frosted back circle on
  // the photo duplicated it, render-verified 2026-07-16.
  const helpHref = `/${locale}/help`;
  const iconBtnClass = hasPhoto // mockup-ok
    ? "grid h-11 w-11 place-items-center rounded-full text-s-ink transition active:scale-95"
    : "grid h-11 w-11 place-items-center rounded-full border border-s-border bg-white text-s-ink transition active:scale-95";

  return (
    <div className="min-h-[100dvh] bg-s-bg-surface text-s-ink">
      <main className="mx-auto w-full max-w-[440px] pb-16">
        {/* ── hero: full-bleed 240px cover photo, frosted back/help float on it (rule 7). No
            photo -> the hero is omitted entirely, back/help render flat instead (no fabricated
            placeholder image). ── */}
        {hasPhoto ? (
          <div className="relative h-[240px] w-full overflow-hidden"> {/* mockup-ok */}
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
          <div className="flex items-center justify-end px-4 pt-4"> {/* mockup-ok */}
            <Link href={helpHref} aria-label={t("helpAria")} className={iconBtnClass}>
              <HelpCircle size={20} strokeWidth={2.2} aria-hidden />
            </Link>
          </div>
        )}

        <div className="px-5"> {/* mockup-ok */}
          {/* ── salon name + address BELOW the photo (never overlaid), chevron to the salon page ── */}
          <Link
            href={`/${locale}/salon/${props.salonSlug}`}
            className="mt-4 flex items-center gap-2 py-1 focus-visible:bg-s-bg-sunken focus-visible:outline-none" // mockup-ok
          >
            <div className="min-w-0 flex-1">
              <div className="truncate font-display text-[17px] font-bold tracking-[-0.01em] text-s-ink">
                {props.salonName}
              </div>
              {props.salonAddress && (
                <div className="mt-0.5 flex items-center gap-1 text-[12.5px] text-s-ink-2">
                  <MapPin size={12} className="shrink-0 text-s-ink-2" aria-hidden />
                  <span className="truncate">{props.salonAddress}</span>
                </div>
              )}
            </div>
            <ChevronRight size={17} strokeWidth={1.9} className="shrink-0 text-s-ink-2" aria-hidden />
          </Link>

          {/* ── headline: one receipt position/size for every state, only colour + copy branch ,
              green "confirmed" text when payment_status is actually 'paid', ink + the original
              `title` copy for confirming / pay-at-salon (same derivation + keys as before this
              rebuild, new container), red + appointmentCancelled when cancelled. ── */}
          <h1
            className={`celebrate-rise mt-6 font-display text-[24px] font-bold leading-[1.15] tracking-[-0.02em] ${
              isCancelledNow ? "text-s-error" : isPaid ? "text-s-success" : "text-s-ink"
            }`}
            style={{ animationDelay: "0.2s" }}
          >
            {isCancelledNow ? tCommon("appointmentCancelled") : isPaid ? tBookingCard("status.confirmed") : t("title")}
          </h1>

          {/* ── details card: date (reschedule when >24h out + confirmed/pending), service, stylist ── */}
          <section className="celebrate-rise mt-5 overflow-hidden rounded-card border border-s-border bg-white shadow-elevation-2"> {/* mockup-ok */}
            {canReschedule ? (
              <button
                type="button"
                onClick={() => setRescheduleOpen(true)}
                aria-label={tBookings("rescheduleTitle")}
                className="flex w-full items-center gap-3 p-4 text-left focus-visible:bg-s-bg-sunken focus-visible:outline-none" // mockup-ok
              >
                <Calendar size={18} strokeWidth={1.9} className="shrink-0 text-s-ink-2" aria-hidden />
                <div className="min-w-0 flex-1">
                  <div className="font-display text-[14.5px] font-semibold tracking-[-0.01em] text-s-ink">
                    {dateStr}
                  </div>
                  <div className="mt-0.5 flex items-center gap-2.5 text-[12.5px] text-s-ink-2">
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
                  <div className="font-display text-[14.5px] font-semibold tracking-[-0.01em] text-s-ink">
                    {dateStr}
                  </div>
                  <div className="mt-0.5 flex items-center gap-2.5 text-[12.5px] text-s-ink-2">
                    <span>{timeStr}</span>
                    {props.durationMinutes ? <span>{props.durationMinutes} min</span> : null}
                  </div>
                </div>
              </div>
            )}
            <hr className="border-s-border" />
            {/* service row , no chevron, no edit backend (dead-click contract) */}
            <div className="flex items-center gap-3 p-4">
              <Scissors size={18} strokeWidth={1.9} className="shrink-0 text-s-ink-2" aria-hidden />
              <div className="min-w-0 flex-1">
                <div className="truncate font-display text-[14.5px] font-semibold tracking-[-0.01em] text-s-ink">
                  {props.serviceName}
                </div>
                {/* SERVICE price (services.price), never priceLabel/paid_amount , those are the
                    money card's figures, a different number in this slot is a mislabel. */}
                {props.servicePrice != null && (
                  <div className="mt-0.5 text-[12.5px] text-s-ink-2">
                    {formatCurrency(props.servicePrice, locale)}
                  </div>
                )}
              </div>
            </div>
            {props.staffName && (
              <>
                <hr className="border-s-border" />
                {/* stylist row , no chevron. Avatar primitive = the canonical photo-or-initials
                    circle (SalonTeam.tsx's own staff row uses it); no avatar_url is fetched for
                    this screen, so it falls to initials-on-B&W, never a bare unexplained fill. */}
                <div className="flex items-center gap-3 p-4">
                  <Avatar src={null} name={props.staffName} size="xs" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-display text-[14.5px] font-semibold tracking-[-0.01em] text-s-ink">
                      {props.staffName}
                    </div>
                    <div className="mt-0.5 text-[12.5px] text-s-ink-2">{tPayConfirm("yourStylist")}</div>
                  </div>
                </div>
              </>
            )}
          </section>

          {/* ── money card: white, never the sunken selected-state token , owed is the hero number ── */}
          <section className="celebrate-rise mt-4 rounded-card border border-s-border bg-white p-4 shadow-elevation-2"> {/* mockup-ok */}
            {props.remainingAtSalonLabel && isPaid ? (
              <>
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-1.5 text-[13px] text-s-ink-2">
                    {t("paidOnlineNow")}
                  </span>
                  <span className="shrink-0 text-[13px] text-s-ink-2 tabular-nums">{props.paidNowLabel}</span>
                </div>
                <div className="mt-3 flex items-end justify-between gap-3 border-t border-s-border pt-3">
                  <span className="font-display text-[14.5px] font-semibold tracking-[-0.01em] text-s-ink">
                    {t("restAtSalon")}
                  </span>
                  <span className="shrink-0 font-display text-[29px] font-bold leading-none tracking-[-0.02em] tabular-nums text-s-ink">
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
                <span className="shrink-0 font-display text-[29px] font-bold leading-none tracking-[-0.02em] tabular-nums text-s-ink">
                  {props.priceLabel}
                </span>
              </div>
            )}
          </section>

        {/* ── one primary action (ink) + one secondary (flat) ── */}
        <button
          type="button"
          onClick={handleCalendar}
          className="celebrate-rise mt-5 flex h-[52px] w-full items-center justify-center gap-2 rounded-btn bg-s-ink font-body text-[15px] font-semibold text-white transition-[filter,transform] duration-150 hover:brightness-[0.94] active:scale-[0.98]"
          style={{ animationDelay: "0.68s" }}
        >
          <Calendar size={17} strokeWidth={1.9} aria-hidden />
          {t("addToCalendar")}
        </button>
        <a
          href={directionsHref}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2.5 flex h-[50px] w-full items-center justify-center gap-2 rounded-btn border border-s-border bg-s-bg-surface font-body text-[15px] font-semibold text-s-ink"
        >
          <MapPin size={17} strokeWidth={1.9} aria-hidden />
          {t("directions")}
        </a>

        {/* ── quiet destructive tertiary: red TEXT, no fill, no border , opens CancelBookingSheet.
            Only rendered when cancellation is actually possible (mirrors BookingCard.tsx's own gate). ── */}
        {canCancel && (
          <button
            type="button"
            onClick={() => setCancelSheetOpen(true)}
            className="mt-1 flex h-11 w-full items-center justify-center text-[15px] font-semibold text-s-error transition-opacity duration-150 hover:opacity-80"
          >
            {t("cancelAppointment")}
          </button>
        )}

        {/* ── guest only: compact access-link (their only way back , kept, de-emphasized) ── */}
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

        {/* ── tiny footer: reference code (support lookup) + manage ── */}
        <div className="mt-6 flex items-center justify-between gap-3 border-t border-s-border pt-4 text-[13px]">
          <span className="font-mono-code text-s-ink-2">{code || "SOL-•••••"}</span>
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

      {/* ── reschedule / cancel sheets (checklist item 9: canManage stays false, and
          sheetBooking null, until a guest's silent cookie exchange above succeeds) ── */}
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
