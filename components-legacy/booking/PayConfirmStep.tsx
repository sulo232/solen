'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'motion/react';
import { ShieldCheck, AlertCircle, Scissors, Calendar, Star, CreditCard, Store, UserRound } from 'lucide-react';
import { useBooking } from '@/lib/booking-context';
import { toast } from '@/app/[locale]/_components/primitives/Toast';
import { formatSwissPhoneInput, usePhoneCaretInput } from '@/lib/format-phone';
import { Avatar, useEnterMotion } from '@/app/[locale]/_components/primitives';
import { formatPrice } from '@/lib/format';
import Spinner from '@/components-legacy/ui/Spinner';
import GuestBookingForm, {
  type GuestInfo,
  type GuestBookingFormHandle,
} from '@/components-legacy/booking/GuestBookingForm';
import BookingPaymentForm from '@/components-legacy/booking/BookingPaymentForm';
import type { Salon, StaffMember } from '@/lib/types';

// Local-parts yyyy-mm-dd (timezone-safe — avoids the UTC date shift toISOString() causes).
const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;

/**
 * PayConfirmStep — Q55 (locked 2026-05-02) wizard step 3 of 3.
 *
 * Merges the V5-era ConfirmationStep (194L) + PaymentStep (216L) into a
 * single review-and-pay screen per Q55 lock. Matches Stripe Checkout /
 * Apple Pay / Booksy / Fresha pattern (~12% conversion lift vs 4-step).
 *
 * Single-screen anatomy (top → bottom):
 *   (a) Q48 SignatureLockup: eyebrow `Schritt 3 / 3` + Anton headline
 *       `Bestätigen & Zahlen`
 *   (b) Summary card (service + stylist + date/time + price tabular Q43)
 *   (c) Cancellation policy mini-banner (warm-amber bg, single sentence)
 *   (d) Payment method selector (radio chips: Karte / Vor Ort)
 *   (e) Primary `Buchen · CHF <total>` CTA — sticky at bottom
 *
 * The actual booking-creation API call (POST /api/bookings → /confirmation
 * redirect) is preserved verbatim from PaymentStep — no booking-revenue
 * logic changes here, only the surface combines two steps into one.
 */
interface PayConfirmStepProps {
  salon: Salon;
  staff: StaffMember | null;
  // SP-1: false => render GuestBookingForm + send guest_name/phone/email to POST /api/bookings.
  isLoggedIn: boolean;
  // Owner 2026-08-21: gates the voucher code field below, true only when this salon has at
  // least one redeemable voucher.
  salonHasRedeemableVoucher: boolean;
}

export default function PayConfirmStep({ salon, staff, isLoggedIn, salonHasRedeemableVoucher }: PayConfirmStepProps) {
  const t = useTranslations('booking');
  // P1: NEW pay/confirm copy lives in its own `payConfirm` namespace (existing booking.* keys untouched).
  const tp = useTranslations('payConfirm');
  // SP-1: the guest-form copy lives in the top-level `guestBookingForm` namespace (shared with
  // GuestBookingForm.tsx); read it directly rather than via a cross-namespace path.
  const tg = useTranslations('guestBookingForm');
  const locale = useLocale();
  const router = useRouter();
  const { formData, goToStep, resetForm } = useBooking();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Owner 2026-06-12: errors surface as the standard top toast, not a block
  // buried at the bottom of the page. State is kept for CTA gating logic.
  const showError = (m: string) => { setError(m); toast.error(m); };

  // Owner 2026-06-12: booking requires NAME + PHONE for everyone. Logged-in users
  // get a compact contact block prefilled from the profile; missing fields gate the
  // CTA. Saved back to the profile on confirm (so it's a one-time ask).
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactLoaded, setContactLoaded] = useState(false);
  const [editingContact, setEditingContact] = useState(false);
  // ig2 (2026-07-16): same caret-preserving helper as GuestBookingForm's phone field,
  // shared math lives in lib/format-phone.ts (usePhoneCaretInput / formatSwissPhoneWithCaret).
  const { inputRef: contactPhoneInputRef, onChange: handleContactPhoneChange } = usePhoneCaretInput(
    (formatted) => setContactPhone(formatted),
  );
  useEffect(() => {
    if (!isLoggedIn) return;
    let alive = true;
    fetch('/api/profile')
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!alive) return;
        const prof = j?.data ?? j;
        setContactName(prof?.display_name ?? '');
        setContactPhone(prof?.phone_number ? formatSwissPhoneInput(String(prof.phone_number)) : '');
        setContactLoaded(true);
      })
      .catch(() => { if (alive) setContactLoaded(true); });
    return () => { alive = false; };
  }, [isLoggedIn]);
  // Phase D: paymentMethod is now DERIVED from the salon's payment_mode (computed below), not a
  // free customer choice — at_salon books in person (no charge), deposit/prepay pay online.
  // SP-1: a logged-out guest fills name/phone (email optional) via GuestBookingForm. It lifts a
  // valid GuestInfo live (null while incomplete); the booking POST is gated on it being present.
  // The single "Buchen" CTA force-validates via the form ref so errors surface on press.
  const [guestInfo, setGuestInfo] = useState<GuestInfo | null>(null);
  const guestFormRef = useRef<GuestBookingFormHandle>(null);

  // C1 create-then-charge: the online-pay step has two phases.
  //   'select' — the payment-method selector (this view today).
  //   'pay'    — the Stripe card form (BookingPaymentForm), shown AFTER the pending booking +
  //              PaymentIntent are created once. in_person never enters 'pay' (it just books).
  const [phase, setPhase] = useState<'select' | 'pay'>('select');
  // The pending booking + its PaymentIntent are created ONCE and reused (retry uses the same
  // client_secret → same PI, idempotent server-side). chargeRef guards against a double-create
  // from a re-render / double-tap while the create round-trip is in flight.
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  // The /confirmation URL is built once at create time (carries the guest token/ref handoff) and
  // reused for BOTH the success navigation and Stripe's redirect-3DS return_url, so an inline
  // confirm and a redirect confirm land on the exact same page.
  const [confirmationPath, setConfirmationPath] = useState<string | null>(null);
  const chargeRef = useRef(false);

  // Voucher spend (#19/#50, 2026-07-18): the backend (booking-pay-intent) already implements
  // voucher_code redemption + auto-applied referral credit, this wires the FE. voucherCodeInput
  // is the live-typed value; appliedVoucherCode is committed by the "Anwenden" button and is what
  // actually goes on the wire, so a half-typed code never rides along on a stray Buchen click.
  // The real redemption + validation only happens server-side inside booking-pay-intent (there is
  // no separate voucher preview endpoint, only promo has one), so payIntentSummary holds whatever
  // that response actually reports applied, never a client-guessed figure.
  const [voucherCodeInput, setVoucherCodeInput] = useState('');
  const [appliedVoucherCode, setAppliedVoucherCode] = useState<string | null>(null);
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [payIntentSummary, setPayIntentSummary] = useState<{
    amount: number;
    creditApplied: number;
    voucherApplied: number;
    voucherCode: string | null;
  } | null>(null);

  const localeCode = locale === 'de' ? 'de-CH' : locale === 'fr' ? 'fr-CH' : locale === 'it' ? 'it-CH' : 'en-GB';
  const cancellationHours = salon.cancellation_window_hours ?? 24;

  const dateLabel = formData.selectedDate
    ? new Intl.DateTimeFormat(localeCode, {
        weekday: 'short',
        day: 'numeric',
        month: 'long',
      }).format(formData.selectedDate)
    : '';
  const timeLabel = formData.selectedTime ?? '';
  const totalPrice = formData.totalPrice ?? 0;

  // Phase D — the salon's payment_mode drives the pay step (was a free choice that ignored it):
  //   at_salon → no online charge (pay in person);  deposit → deposit_percent% now;  prepay → full.
  const salonExt = salon as Salon & { payment_mode?: string; deposit_percent?: number; accepts_online_payment?: boolean; vat_registered?: boolean; vat_rate?: number };
  // Online pay is offered ONLY when the salon can actually take it (owner repro
  // 2026-06-12: the chooser offered online, the server then errored "kassiert vor
  // Ort"). The pay-intent route stays the fail-closed backstop.
  const onlineAvailable = salonExt.accepts_online_payment === true;
  // Unset / unknown → at_salon (the DB default), the safe choice: book without an online charge.
  const paymentMode: 'at_salon' | 'deposit' | 'prepay' =
    salonExt.payment_mode === 'deposit' || salonExt.payment_mode === 'prepay' ? salonExt.payment_mode : 'at_salon';
  const depositPct = Math.min(100, Math.max(1, Number(salonExt.deposit_percent) || 20));
  const depositAmount = Math.round(totalPrice * depositPct) / 100;              // CHF charged now (deposit)
  const remainingAtSalon = Math.round((totalPrice - depositAmount) * 100) / 100;
  // VAT (legal): only a vat_registered salon charges MwSt, so the "included VAT" line is shown
  // for them ONLY , a non-registered salon must not display a tax line (it collects none). Mirrors
  // the booking-record gate in /api/bookings (vat_registered + computeVat). vat_rate is a PERCENT
  // (8.1); null/undefined -> the standard 8.1 (route.ts uses `?? 8.1`), but a stored 0 stays 0 so
  // a registered-but-zero-rate salon shows no line. Uses the salon's own rate, not a hardcoded 8.1.
  const salonVatRegistered = salonExt.vat_registered === true;
  const vatRatePercent = salonExt.vat_rate == null ? 8.1 : Number(salonExt.vat_rate);
  const vatFraction = vatRatePercent / 100;
  const vatIncludedAmount = vatFraction > 0 ? (totalPrice * vatFraction) / (1 + vatFraction) : 0;

  // deposit/prepay -> online (salon-mandated). at_salon -> the CUSTOMER chooses
  // (mockup 24d ink, owner-approved 2026-06-12): online preselected, salon below.
  const [payChoice, setPayChoice] = useState<'online' | 'in_person'>(onlineAvailable ? 'online' : 'in_person');
  const paymentMethod: 'online' | 'in_person' = paymentMode === 'at_salon' ? payChoice : 'online';
  const chargeNow = paymentMode === 'at_salon' ? (paymentMethod === 'online' ? totalPrice : 0) : paymentMode === 'deposit' ? depositAmount : totalPrice;

  // Build the /confirmation path. A guest carries access_token (+ ref) so the page can show the
  // order number + exchange the token for the httpOnly cookie; a logged-in user just gets the id.
  const buildConfirmationPath = (
    bookingId: string,
    accessToken: string | null,
    referenceCode: string | null,
  ) => {
    if (!isLoggedIn && accessToken) {
      const params = new URLSearchParams({
        booking_id: bookingId,
        access_token: accessToken,
        ...(referenceCode ? { ref: referenceCode } : {}),
      });
      return `/confirmation?${params.toString()}`;
    }
    return `/confirmation?booking_id=${bookingId}`;
  };

  const handleConfirm = async () => {
    if (!paymentMethod) {
      showError(t('payment.selectPaymentMethod'));
      return;
    }
    if (!formData.selectedDate || !formData.selectedTime || formData.services.length === 0) {
      showError(tp('fillRequiredFields'));
      return;
    }
    // SP-1: a logged-out guest must supply contact info before booking. Force-validate the form on
    // press so field errors surface, and use the freshly-validated value (don't trust a stale state).
    let resolvedGuest = guestInfo;
    if (!isLoggedIn) {
      resolvedGuest = guestFormRef.current?.validate() ?? null;
      if (!resolvedGuest) {
        showError(tg('fillRequired'));
        return;
      }
    }

    // C1: guard against a double-create (re-render / double-tap) while the round-trip is open.
    if (chargeRef.current) return;
    if (isLoggedIn && (!contactName.trim() || contactPhone.replace(/\D/g, '').length < 9)) {
      showError(tp('fillRequiredFields'));
      return;
    }
    chargeRef.current = true;
    setIsSubmitting(true);
    setError(null);

    try {
      // TZ-safe: selectedDate is a LOCAL calendar day and selectedTime is a Swiss wall-clock
      // "HH:MM". Use local date parts (toISOString() UTC-shifts the day, rolling it near midnight),
      // and DON'T append `Z` — `Z` forces the wall-clock to UTC, storing 14:00 CH as 16:00. A
      // local-time Date yields the correct instant on a CH-local device.
      const dateStr = ymd(formData.selectedDate);
      const startsAt = new Date(`${dateStr}T${formData.selectedTime}:00`).toISOString();

      // 1. Create the booking. For online-pay it lands as status "pending" / payment_status "none"
      //    (the abandon-sweep cron cancels it if the card step is never completed). For in_person
      //    it's created exactly as before (no charge) — behaviour below is byte-for-byte unchanged.
      // Persist the contact onto the profile (best-effort; booking proceeds regardless)
      if (isLoggedIn && contactName.trim()) {
        fetch('/api/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ display_name: contactName.trim(), phone_number: contactPhone.replace(/\s/g, '') }),
        }).catch(() => {});
      }
      const bookingRes = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          salon_id: salon.id,
          service_id: formData.services[0].id,
          extra_service_ids: formData.services.slice(1).map((s) => s.id),
          // A5 BUG-1: carry the bundle tag through so the server recomputes the discounted bundle
          // price (loadPricedBundle) instead of the full sum. No client price is trusted; this id
          // only selects which bundle to price against. Absent => a normal (non-bundle) booking.
          bundle_id: formData.bundleId || undefined,
          staff_member_id: formData.selectedStaffId === 'any' ? null : formData.selectedStaffId,
          starts_at: startsAt,
          payment_method: paymentMethod,
          promo_code: formData.promoCode || null,
          gift_card_code: formData.giftCardCode || null,
          total_price: totalPrice,
          is_first_visit: true,
          customer_note: formData.customerNote || null,
          // SP-1: send guest fields only when logged out. The route ignores them for a session
          // user; for a guest it requires name + phone (email optional).
          ...(!isLoggedIn && resolvedGuest
            ? {
                guest_name: resolvedGuest.name,
                guest_phone: resolvedGuest.phone,
                guest_email: resolvedGuest.email || undefined,
              }
            : {}),
        }),
      });

      if (!bookingRes.ok) {
        const errorData = await bookingRes.json().catch(() => null);
        console.error('[PayConfirmStep] create booking failed:', errorData?.message);
        // Friendly localized copy, not the raw server string.
        throw new Error(t('payment.bookingFailed'));
      }

      const booking = await bookingRes.json();
      const bookingId = booking.data?.id ?? booking.id;
      const path = buildConfirmationPath(
        bookingId,
        !isLoggedIn ? (booking.access_token ?? null) : null,
        booking.reference_code ?? null,
      );

      // 2a. IN-PERSON (and any non-online method): unchanged — the booking is created without a
      //     charge; go straight to the confirmation page.
      if (paymentMethod !== 'online') {
        // Locale-prefix the push , without it next-intl middleware rerouted /de bookings
        // to the default-locale /en/confirmation (found in the 2026-06-11 e2e).
        // Reset the wizard so browser-back can't re-confirm a fully-armed flow
        // (owner 2026-06-12: "they can just click back and book as many times as
        // they want"); the server DUPLICATE_BOOKING guard is the backstop.
        // REPLACE not push (owner 2026-07-02: "after you book, click back it jumps you into the
        // search version"): the booking is done, so drop the wizard from history , back goes to
        // the salon page, not the reset booking flow.
        resetForm();
        router.replace(`/${locale}${path}`);
        return;
      }

      // 2b. ONLINE: create the PaymentIntent for THIS booking and switch to the card step. The
      //     PI + client_secret are created once here and reused on retry (idempotent server-side).
      const piRes = await fetch('/api/stripe/booking-pay-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: bookingId,
          ...(appliedVoucherCode ? { voucher_code: appliedVoucherCode } : {}),
        }),
      });
      const piData = await piRes.json().catch(() => null);
      if (!piRes.ok || !piData?.client_secret) {
        console.error('[PayConfirmStep] booking-pay-intent failed:', piData?.error ?? piRes.status);
        throw new Error(t('payment.bookingFailed'));
      }

      // The response is the source of truth for what actually got redeemed (never the request
      // echoed back): a requested code that is wrong / wrong-salon / expired / exhausted comes
      // back with voucher_code:null and voucher_applied:0, so it surfaces as an inline error
      // instead of silently charging full price with no explanation.
      setPayIntentSummary({
        amount: Number(piData.amount) || 0,
        creditApplied: Number(piData.credit_applied) || 0,
        voucherApplied: Number(piData.voucher_applied) || 0,
        voucherCode: piData.voucher_code ?? null,
      });
      const voucherFailed = appliedVoucherCode && !piData.voucher_code;
      setVoucherError(voucherFailed ? tp('voucherInvalid') : null);
      // The inline error text lives in the phase:'select' voucher block, which unmounts in
      // this SAME state update once phase flips to 'pay' below, so it would never actually
      // become visible. A toast is phase-independent (still visible on the card step), and
      // payment still proceeds at the un-discounted price rather than blocking the booking.
      if (voucherFailed) toast.error(tp('voucherInvalid'));

      setConfirmationPath(path);
      setClientSecret(piData.client_secret);
      setPhase('pay');
    } catch (err) {
      console.error('[PayConfirmStep] Booking failed:', err);
      showError(err instanceof Error ? err.message : t('payment.unknownError'));
      // Allow another attempt — the booking either wasn't created or its PI step failed.
      chargeRef.current = false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // ENTER RECIPE (MOTION.md, owner-approved 2026-07-09), applied per-card, not the
  // `space-y-5 pb-28` root: the root also holds the fixed bottom CTA bar (further down
  // this tree), and a resting `filter: blur(0px)` never collapses to `none` (framer-
  // motion only special cases `transform`), so it would establish a containing block
  // and detach the bar from the viewport. Neither card below has a `position: fixed`
  // descendant, so both are safe. mockup-ok: approved /dev/motion-recipe ENTER RECIPE
  const summaryCardMotion = useEnterMotion();
  const priceCardMotion = useEnterMotion(0.05);

  return (
    <div className="space-y-5 pb-28">
      {/* Step title comes from the wizard header (matches the services + date steps), no duplicate lockup / green eyebrow here. */}
      {/* (b) Booking summary — owner-approved mockup booking-pay-step (2026-06-11):
          white icon-led rows (walk-in-pay checkout language), normal-case Inter Tight,
          Ändern links jump back to the owning step, MwSt line + blue total. NO
          uppercase/tracked eyebrows (owner-banned). */}
      <motion.div {...summaryCardMotion} className="rounded-card border border-s-border bg-white p-4 shadow-elevation-1">
        {/* Salon */}
        <div className="flex items-center gap-3">
          {salon.cover_photo_url ? (
            <Image
              src={salon.cover_photo_url}
              alt={salon.name}
              width={44}
              height={44}
              className="h-11 w-11 shrink-0 rounded-[12px] object-cover"
            />
          ) : (
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[12px] bg-s-bg-sunken font-heading text-base font-semibold text-s-ink">
              {salon.name.charAt(0)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate font-heading text-[15px] font-semibold tracking-[-0.01em] text-s-ink">{salon.name}</p>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[13px]">
              {salon.average_rating != null && Number(salon.average_rating) > 0 &&
                salon.review_count != null && Number(salon.review_count) > 0 && (
                <span className="flex items-center gap-1">
                  <Star size={13} className="fill-s-star text-s-star" aria-hidden />
                  <span className="font-semibold tabular-nums text-s-ink">{Number(salon.average_rating).toFixed(1)}</span>
                  <span className="tabular-nums text-s-accent">({salon.review_count})</span>
                </span>
              )}
              {salon.address && <span className="truncate text-s-ink-2">{salon.address}</span>}
            </div>
          </div>
        </div>

        {/* Stylist */}
        {staff && (
          <div className="mt-3 flex items-center gap-3 border-t border-s-border pt-3">
            {/* Sits directly under the salon row's 44px SQUARE tile above (h-11 w-11
                rounded-[12px]) at the same left-column position, so this circle gets the
                owner-approved 2026-07-15 overshoot (RATIONALE.md:144, lib/optical.ts) to
                read as the same size as that square. */}
            <Avatar src={staff.avatar_url} name={staff.name} size={44} opticalOvershoot />
            <div className="min-w-0 flex-1">
              <p className="truncate font-heading text-[15px] font-semibold text-s-ink">{staff.name}</p>
              <p className="text-[13px] text-s-ink-2">{tp('yourStylist')}</p>
            </div>
            {phase === 'select' && (
              <button type="button" onClick={() => goToStep('services-staff')} className="shrink-0 text-[13px] font-semibold text-s-accent">
                {tp('changeLabel')}
              </button>
            )}
          </div>
        )}

        {/* Services */}
        {formData.services.map((s, i) => (
          <div key={s.id} className="mt-3 flex items-center gap-3 border-t border-s-border pt-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center text-s-ink-2">
              <Scissors size={20} strokeWidth={2.2} aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-heading text-[15px] font-semibold text-s-ink">{locale === 'en' ? s.name_en : s.name_de}</p>
              {s.duration_minutes ? <p className="text-[13px] tabular-nums text-s-ink-2">{s.duration_minutes} Min</p> : null}
            </div>
            {phase === 'select' && i === 0 && (
              <button type="button" onClick={() => goToStep('services-staff')} className="shrink-0 text-[13px] font-semibold text-s-accent">
                {tp('changeLabel')}
              </button>
            )}
          </div>
        ))}

        {/* When */}
        <div className="mt-3 flex items-center gap-3 border-t border-s-border pt-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center text-s-ink-2">
            <Calendar size={20} strokeWidth={2.2} aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-heading text-[15px] font-semibold tabular-nums text-s-ink">{dateLabel} {timeLabel}</p>
          </div>
          {phase === 'select' && (
            <button type="button" onClick={() => goToStep('datetime')} className="shrink-0 text-[13px] font-semibold text-s-accent">
              {tp('changeLabel')}
            </button>
          )}
        </div>
      </motion.div>

      {/* Price card, per-service lines + included VAT + blue total (walk-in-pay pattern) */}
      <motion.div {...priceCardMotion} className="rounded-card border border-s-border bg-white p-4 shadow-elevation-1">
        <div className="space-y-1.5">
          {formData.services.map((s) => (
            <div key={s.id} className="flex items-baseline justify-between gap-3 text-[14px]">
              <span className="truncate text-s-ink">{locale === 'en' ? s.name_en : s.name_de}</span>
              <span className="shrink-0 tabular-nums text-s-ink">{formatPrice(s.price, localeCode)}</span>
            </div>
          ))}
          {salonVatRegistered && vatIncludedAmount > 0 && (
            <div className="flex items-baseline justify-between gap-3 text-[13px]">
              <span className="text-s-ink-2">{tp('vatIncl')}</span>
              <span className="shrink-0 tabular-nums text-s-ink-2">{formatPrice(vatIncludedAmount, localeCode)}</span>
            </div>
          )}
          {/* Voucher + credit line items (#19/#50/#52): only rendered once the pay-intent response
              confirms a real applied Rappen amount, never a client-guessed preview. mockup-ok: this
              is an EXACT reuse of the VAT row directly above (same text-[13px] row, same flex
              layout), swapping only the LOCKFILE semantic success token text-s-success for the
              savings amount, no new size/color/spacing invented. */}
          {payIntentSummary && payIntentSummary.voucherApplied > 0 && (
            <div className="flex items-baseline justify-between gap-3 text-[13px]"> {/* mockup-ok */}
              <span className="text-s-success">{tp('voucherLine')}</span>
              <span className="shrink-0 tabular-nums text-s-success">-{formatPrice(payIntentSummary.voucherApplied, localeCode)}</span>
            </div>
          )}
          {payIntentSummary && payIntentSummary.creditApplied > 0 && (
            <div className="flex items-baseline justify-between gap-3 text-[13px]"> {/* mockup-ok */}
              <span className="text-s-success">{tp('creditLine')}</span>
              <span className="shrink-0 tabular-nums text-s-success">-{formatPrice(payIntentSummary.creditApplied, localeCode)}</span>
            </div>
          )}
        </div>
        <div className="mt-2.5 flex items-baseline justify-between gap-3 border-t border-s-border pt-2.5">
          <span className="font-heading text-[15px] font-semibold text-s-ink">{tp('totalLabel')}</span>
          <span className="font-heading text-[22px] font-bold tabular-nums tracking-[-0.01em] text-s-ink">
            {formatPrice(
              payIntentSummary
                ? Math.max(0, totalPrice - payIntentSummary.voucherApplied - payIntentSummary.creditApplied)
                : totalPrice,
              localeCode,
            )}
          </span>
        </div>
      </motion.div>


      {/* ── PHASE 'select' — payment-method selector + (guest) contact form + Buchen CTA ── */}
      {phase === 'select' && (
      <>
      {/* SP-1: guest contact form (logged-out only). Rebuilt to the review-and-confirm mockup
          (solen-refund-guest-booking-form.html): fields-only, lifts GuestInfo live; the single
          Buchen CTA force-validates via the form ref. */}
      {/* Contact — mockup 28/28b (owner-approved 2026-06-12): complete data shows a
          quiet SUMMARY ROW with Ändern; anything missing (or editing) shows only the
          needed fields. Guests keep GuestBookingForm below (they ARE the type-in case). */}
      {isLoggedIn && contactLoaded && (
        contactName.trim() && contactPhone.replace(/\D/g, '').length >= 9 && !editingContact ? (
          <div className="rounded-input border border-s-border bg-s-bg-surface p-4">
            <div className="flex items-center gap-3">
              <UserRound size={18} strokeWidth={1.9} className="shrink-0 text-s-ink-2" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="font-body text-[14.5px] font-semibold text-s-ink">{contactName}</p>
                <p className="font-body mt-px text-[13px] text-s-ink-2">{contactPhone}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingContact(true)}
                className="font-body text-[13.5px] font-semibold text-s-accent transition-opacity hover:opacity-80"
              >
                {tp('contactChange')}
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-input border border-s-border bg-s-bg-surface p-4">
            {contactName.trim() && !editingContact ? (
              <div className="flex items-center gap-3">
                <UserRound size={18} strokeWidth={1.9} className="shrink-0 text-s-ink-2" aria-hidden />
                <p className="font-body text-[14.5px] font-semibold text-s-ink">{contactName}</p>
              </div>
            ) : (
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder={tp('contactName')}
                aria-label={tp('contactName')}
                className="w-full"
              />
            )}
            <input
              type="tel"
              inputMode="tel"
              ref={contactPhoneInputRef}
              value={contactPhone}
              onChange={handleContactPhoneChange}
              placeholder={tp('contactPhone')}
              aria-label={tp('contactPhone')}
              className="mt-3 w-full"
            />
            <p className="font-body mt-1.5 text-[12px] text-s-ink-2">{tp('contactHint')}</p>
          </div>
        )
      )}

      {!isLoggedIn && (
        <div className="rounded-input border border-s-border bg-s-bg-surface p-4">
          <div className="mb-4">
            <p className="font-heading text-[15px] font-semibold text-s-ink tracking-[-0.01em]">
              {tg('title')}
            </p>
            <p className="text-[13px] text-s-ink-2 mt-0.5">{tg('subtitle')}</p>
          </div>
          <GuestBookingForm
            ref={guestFormRef}
            onChange={(info) => {
              setGuestInfo(info);
              if (info) setError(null);
            }}
          />
        </div>
      )}

      {/* (d) Payment — driven by the salon's payment_mode (Phase D), not a free customer choice */}
      <div>
        <p className="mb-2 text-[13px] font-semibold text-s-ink">
          {tp('paymentEyebrow')}
        </p>
        {paymentMode === 'at_salon' ? (
          /* Mockup 24d (ink, owner 2026-06-12): online ABOVE, salon below; selected =
             2px ink wrap (no radio dots); icon discs (blue card / ink store). */
          <div className="flex flex-col gap-2.5">
            {onlineAvailable && (
            <button
              type="button"
              aria-pressed={payChoice === 'online'}
              onClick={() => setPayChoice('online')}
              className={`flex w-full items-center gap-3 rounded-[12px] bg-white px-4 py-4 text-left transition-colors ${
                payChoice === 'online' ? 'border-2 border-s-ink' : 'border border-s-border'
              }`}
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-s-accent-pale">
                <CreditCard size={20} strokeWidth={2.2} className="text-s-accent" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-body text-[14px] font-semibold text-s-ink">{tp('payOnlineTitle')}</span>
                <span className="mt-0.5 block font-body text-[12.5px] text-s-ink-2">{tp('payOnlineSub')}</span>
              </span>
            </button>
            )}
            <button
              type="button"
              aria-pressed={payChoice === 'in_person'}
              onClick={() => setPayChoice('in_person')}
              className={`flex w-full items-center gap-3 rounded-[12px] bg-white px-4 py-4 text-left transition-colors ${
                payChoice === 'in_person' ? 'border-2 border-s-ink' : 'border border-s-border'
              }`}
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-s-bg-sunken">
                <Store size={20} strokeWidth={2.2} className="text-s-ink" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-body text-[14px] font-semibold text-s-ink">{tp('payAtSalonTitle')}</span>
                <span className="mt-0.5 block font-body text-[12.5px] text-s-ink-2">
                  {tp('payAtSalonSub', { amount: formatPrice(totalPrice, localeCode) })}
                </span>
              </span>
            </button>
          </div>
        ) : paymentMode === 'deposit' ? (
          <>
            <div className="rounded-[12px] border border-s-border overflow-hidden">
              <div className="flex items-center justify-between bg-s-bg-sunken px-4 py-3.5">
                <span className="font-heading font-semibold text-[13.5px] text-s-ink leading-tight">
                  {tp('depositNow')}
                  <span className="block font-body font-medium text-[12px] text-s-ink/70 mt-0.5">{tp('percentOnline', { percent: depositPct })}</span>
                </span>
                <span className="font-heading font-bold text-[22px] text-s-ink tabular-nums">{formatPrice(depositAmount, localeCode)}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-3 text-[13px] border-t border-s-border">
                <span className="text-s-ink-2">{tp('restAtSalon')}</span>
                <span className="font-heading font-semibold tabular-nums">{formatPrice(remainingAtSalon, localeCode)}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-3 text-[13px] border-t border-s-border">
                <span className="text-s-ink font-medium">{tp('grandTotal')}</span>
                <span className="font-heading font-semibold tabular-nums">{formatPrice(totalPrice, localeCode)}</span>
              </div>
            </div>
            <p className="flex items-center gap-1.5 text-[12px] text-s-success mt-2">
              <ShieldCheck size={14} strokeWidth={1.6} aria-hidden /> {tp('secureWithDeposit', { percent: depositPct })}
            </p>
          </>
        ) : (
          <div className="rounded-[12px] border border-s-border px-4 py-4 text-center">
            <p className="font-body text-[12px] text-s-ink-2">{tp('payOnlineNow')}</p>
            <p className="font-heading font-bold text-[28px] text-s-ink tabular-nums mt-1">{formatPrice(totalPrice, localeCode)}</p>
            <p className="font-body text-[12px] text-s-ink/40 mt-0.5">{tp('fullPrepayment')}</p>
          </div>
        )}
      </div>

      {/* Voucher spend (#19/#50, 2026-07-18): only offered when THIS booking will actually
          create a PaymentIntent (deposit/prepay always online; at_salon only when the
          customer picked "online" above). A purely in-person booking never reaches the
          redemption path server-side, so the field would be a dead promise there.
          mockup-ok: wrapper reuses the EXACT contact-block classes above (rounded-input
          border border-s-border bg-s-bg-surface p-4), the label reuses the "(d) Payment"
          eyebrow classes above, the input is the bare global input primitive (same as
          contactName/contactPhone), the button reuses BookingPaymentForm's existing
          "Andere Zahlungsart" neutral-outline classes verbatim. No new size/color/radius.
          Owner 2026-08-21: also hidden when the salon has no redeemable voucher, so the field
          is never offered where it can never work. */}
      {paymentMethod === 'online' && salonHasRedeemableVoucher && (
        <div className="rounded-input border border-s-border bg-s-bg-surface p-4">
          <p className="mb-2 text-[13px] font-semibold text-s-ink">{tp('voucherLabel')}</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={voucherCodeInput}
              onChange={(e) => { setVoucherCodeInput(e.target.value); setVoucherError(null); }}
              placeholder={tp('voucherPlaceholder')}
              aria-label={tp('voucherLabel')}
              className={`min-w-0 flex-1${voucherError ? ' input-error' : ''}`}
            />
            <button
              type="button"
              onClick={() => {
                const code = voucherCodeInput.trim().toUpperCase();
                setAppliedVoucherCode(code || null);
                setVoucherError(null);
                setPayIntentSummary(null);
              }}
              disabled={!voucherCodeInput.trim()}
              className="h-11 shrink-0 rounded-full border border-s-border bg-transparent px-5 font-body text-[13.5px] font-semibold text-s-ink-2 transition-colors duration-150 hover:bg-s-bg-sunken disabled:cursor-not-allowed disabled:opacity-50"
            >
              {tp('voucherApply')}
            </button>
          </div>
          {voucherError && (
            <p className="mt-2 text-[12.5px] text-s-error">{voucherError}</p>
          )}
        </div>
      )}

      {/* Cancellation policy mini-banner (below Zahlung per owner, mockup 24c/24d) */}
      <div className="flex items-start gap-2 px-1">
        <ShieldCheck size={14} strokeWidth={1.6} className="mt-[2px] shrink-0 text-s-success" aria-hidden />
        <p className="font-body text-[12.5px] leading-[1.5] text-s-ink-2">
          {tp('cancellationPolicy', { hours: cancellationHours })}
        </p>
      </div>


      {/* (e) Sticky bottom CTA. Online → "Weiter zur Zahlung" (next is the card form);
          in-person → "Buchen" (commits immediately). */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-s-border bg-white p-4 z-20">
        <div className="max-w-2xl mx-auto px-4">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="w-full inline-flex items-center justify-center gap-2 min-h-[52px] px-5 rounded-full bg-s-ink text-white font-body text-[15px] font-semibold transition-[transform,filter] duration-150 hover:brightness-[1.06] active:scale-[0.97] active:duration-[80ms] active:ease-glide disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting && <Spinner size="sm" invert />}
            {paymentMode === 'at_salon'
              ? tp('confirmBooking')
              : paymentMode === 'deposit'
                ? `${tp('payDeposit')} ${formatPrice(depositAmount, localeCode)}`
                : `${t('payment.continueToPayment')} ${formatPrice(totalPrice, localeCode)}`}
          </button>
        </div>
      </div>
      </>
      )}

      {/* ── PHASE 'pay' — real Stripe card form (mockup states 1/2/3/5). On success the parent
          routes to /confirmation; the payment_intent.succeeded webhook owns the "paid" flip. ── */}
      {phase === 'pay' && clientSecret && confirmationPath && (
        <div className="rounded-input border border-s-border bg-s-bg-surface p-4">
          <BookingPaymentForm
            clientSecret={clientSecret}
            amount={payIntentSummary?.amount ?? chargeNow}
            locale={locale}
            localeCode={localeCode}
            returnUrl={`${typeof window !== 'undefined' ? window.location.origin : ''}/${locale}${confirmationPath}`}
            onSucceeded={() => { resetForm(); router.replace(`/${locale}${confirmationPath}`); }}
            onUseOtherMethod={() => {
              // Drop back to the selector. The pending online booking is left for the
              // abandon-sweep cron; a fresh selection creates its own booking. The prior
              // pay-intent summary is stale once a new booking/PI gets created on retry.
              setPhase('select');
              setClientSecret(null);
              setConfirmationPath(null);
              setPayIntentSummary(null);
              chargeRef.current = false;
            }}
          />
        </div>
      )}
    </div>
  );
}
