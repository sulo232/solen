'use client';

import { useState, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { CreditCard, Wallet, ShieldCheck, AlertCircle } from 'lucide-react';
import { useBooking } from '@/lib/booking-context';
import { formatPrice } from '@/lib/format';
import Spinner from '@/components-legacy/ui/Spinner';
import SignatureLockup from '@/components-legacy/ui/SignatureLockup';
import GuestBookingForm, {
  type GuestInfo,
  type GuestBookingFormHandle,
} from '@/components-legacy/booking/GuestBookingForm';
import BookingPaymentForm from '@/components-legacy/booking/BookingPaymentForm';
import type { Salon, StaffMember } from '@/lib/types';

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
}

export default function PayConfirmStep({ salon, staff, isLoggedIn }: PayConfirmStepProps) {
  const t = useTranslations('booking') as any;
  // SP-1: the guest-form copy lives in the top-level `guestBookingForm` namespace (shared with
  // GuestBookingForm.tsx); read it directly rather than via a cross-namespace path.
  const tg = useTranslations('guestBookingForm') as any;
  const locale = useLocale();
  const router = useRouter();
  const { formData } = useBooking();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'in_person' | null>(
    formData.paymentMethod ?? null,
  );
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

  const localeCode = locale === 'de' ? 'de-CH' : locale === 'fr' ? 'fr-CH' : locale === 'it' ? 'it-CH' : 'en-GB';
  const cancellationHours = (salon as any).cancellation_window_hours ?? 24;

  const dateLabel = formData.selectedDate
    ? new Intl.DateTimeFormat(localeCode, {
        weekday: 'short',
        day: 'numeric',
        month: 'long',
      }).format(formData.selectedDate)
    : '';
  const timeLabel = formData.selectedTime ?? '';
  const totalPrice = formData.totalPrice ?? 0;

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
      setError(t('payment.selectPaymentMethod'));
      return;
    }
    if (!formData.selectedDate || !formData.selectedTime || formData.services.length === 0) {
      setError('Bitte fülle alle erforderlichen Felder aus');
      return;
    }
    // SP-1: a logged-out guest must supply contact info before booking. Force-validate the form on
    // press so field errors surface, and use the freshly-validated value (don't trust a stale state).
    let resolvedGuest = guestInfo;
    if (!isLoggedIn) {
      resolvedGuest = guestFormRef.current?.validate() ?? null;
      if (!resolvedGuest) {
        setError(tg('fillRequired'));
        return;
      }
    }

    // C1: guard against a double-create (re-render / double-tap) while the round-trip is open.
    if (chargeRef.current) return;
    chargeRef.current = true;
    setIsSubmitting(true);
    setError(null);

    try {
      const dateStr = formData.selectedDate.toISOString().split('T')[0];
      const startsAt = new Date(`${dateStr}T${formData.selectedTime}:00Z`).toISOString();

      // 1. Create the booking. For online-pay it lands as status "pending" / payment_status "none"
      //    (the abandon-sweep cron cancels it if the card step is never completed). For in_person
      //    it's created exactly as before (no charge) — behaviour below is byte-for-byte unchanged.
      const bookingRes = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          salon_id: salon.id,
          service_id: formData.services[0].id,
          staff_member_id: formData.selectedStaffId === 'any' ? null : formData.selectedStaffId,
          starts_at: startsAt,
          payment_method: paymentMethod,
          promo_code: formData.promoCode || null,
          gift_card_code: formData.giftCardCode || null,
          total_price: totalPrice,
          is_first_visit: true,
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
        const errorData = await bookingRes.json();
        throw new Error(errorData.message || t('payment.bookingFailed'));
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
        router.push(path);
        return;
      }

      // 2b. ONLINE: create the PaymentIntent for THIS booking and switch to the card step. The
      //     PI + client_secret are created once here and reused on retry (idempotent server-side).
      const piRes = await fetch('/api/stripe/booking-pay-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_id: bookingId }),
      });
      const piData = await piRes.json().catch(() => null);
      if (!piRes.ok || !piData?.client_secret) {
        console.error('[PayConfirmStep] booking-pay-intent failed:', piData?.error ?? piRes.status);
        throw new Error(piData?.error || t('payment.bookingFailed'));
      }

      setConfirmationPath(path);
      setClientSecret(piData.client_secret);
      setPhase('pay');
    } catch (err) {
      console.error('[PayConfirmStep] Booking failed:', err);
      setError(err instanceof Error ? err.message : t('payment.unknownError'));
      // Allow another attempt — the booking either wasn't created or its PI step failed.
      chargeRef.current = false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5 pb-28">
      {/* (a) Q48 signature lockup */}
      <SignatureLockup
        eyebrow={`Schritt 3 / 3`}
        headline="Bestätigen & Zahlen"
        size="md"
      />

      {/* (b) Summary card */}
      <div className="rounded-[12px] p-4 bg-s-bg-sunken">
        <div className="flex items-start gap-3 mb-3 pb-3 border-b border-s-ink/[0.05]">
          {salon.cover_photo_url && (
            <Image
              src={salon.cover_photo_url}
              alt={salon.name}
              width={48}
              height={48}
              className="rounded-[8px] object-cover shrink-0"
            />
          )}
          <div className="min-w-0 flex-1">
            <p className="font-heading text-[14px] uppercase text-s-ink leading-[1.05]" style={{ letterSpacing: '0.01em' }}>
              {salon.name}
            </p>
            <p className="font-body text-[11px] text-s-ink/55 truncate mt-0.5">{salon.address}</p>
          </div>
        </div>

        <div className="space-y-2.5 text-[13px]">
          {formData.services.map((s) => (
            <div key={s.id} className="flex items-baseline justify-between gap-2">
              <span className="font-body text-s-ink">{locale === 'en' ? s.name_en : s.name_de}</span>
              <span className="font-body font-semibold text-s-ink tabular-nums">{formatPrice(s.price, localeCode)}</span>
            </div>
          ))}
          {staff && (
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-body text-s-ink/60">Mit</span>
              <span className="font-body font-semibold text-s-ink">{staff.name}</span>
            </div>
          )}
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-body text-s-ink/60">Wann</span>
            <span className="font-body font-semibold text-s-ink tabular-nums">
              {dateLabel} · {timeLabel}
            </span>
          </div>
          <div className="flex items-baseline justify-between gap-2 pt-2 mt-2 border-t border-s-ink/[0.05]">
            <span className="font-body font-bold text-[10px] uppercase tracking-[.18em] text-s-ink/45">Total</span>
            <span className="font-heading text-[20px] text-s-ink tabular-nums" style={{ letterSpacing: '0.01em' }}>
              {formatPrice(totalPrice, localeCode)}
            </span>
          </div>
        </div>
      </div>

      {/* (c) Cancellation policy mini-banner */}
      <div className="flex items-start gap-2 rounded-[10px] px-3 py-2.5 bg-s-warning-bg">
        <ShieldCheck size={14} className="text-s-amber shrink-0 mt-[1px]" aria-hidden />
        <p className="font-body text-[11px] text-s-ink/65 leading-[1.5]">
          Kostenlos bis {cancellationHours}h vorher stornieren.
        </p>
      </div>

      {/* ── PHASE 'select' — payment-method selector + (guest) contact form + Buchen CTA ── */}
      {phase === 'select' && (
      <>
      {/* SP-1: guest contact form (logged-out only). Rebuilt to the review-and-confirm mockup
          (solen-refund-guest-booking-form.html): fields-only, lifts GuestInfo live; the single
          Buchen CTA force-validates via the form ref. */}
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

      {/* (d) Payment method selector — radio chips */}
      <div>
        <p className="font-body text-[10px] font-bold uppercase tracking-[.22em] text-s-accent mb-2">
          Zahlung
        </p>
        <div className="space-y-2">
          {/* Online */}
          <button
            type="button"
            onClick={() => {
              setPaymentMethod('online');
              setError(null);
            }}
            className={[
              'w-full flex items-center gap-3 px-4 py-3 rounded-[10px] border-2 min-h-[56px] text-left transition-[border-color,background-color] duration-150',
              paymentMethod === 'online'
                ? 'border-s-accent bg-s-ink/[0.04]'
                : 'border-s-ink/10 hover:border-s-accent/30 bg-white',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-s-accent focus-visible:ring-offset-2',
            ].join(' ')}
          >
            <CreditCard size={20} className="text-s-ink/70 shrink-0" aria-hidden />
            <div className="flex-1 min-w-0">
              <p className="font-body text-[13px] font-semibold text-s-ink">Karte</p>
              <p className="font-body text-[11px] text-s-ink/55 mt-0.5">Sofort online bezahlen</p>
            </div>
            <span
              className={[
                'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-[border-color,background-color] duration-150',
                paymentMethod === 'online' ? 'bg-s-ink border-s-accent' : 'border-s-ink/25',
              ].join(' ')}
              aria-hidden
            >
              {paymentMethod === 'online' && <span className="w-1.5 h-1.5 bg-white rounded-full" />}
            </span>
          </button>
          {/* In person */}
          <button
            type="button"
            onClick={() => {
              setPaymentMethod('in_person');
              setError(null);
            }}
            className={[
              'w-full flex items-center gap-3 px-4 py-3 rounded-[10px] border-2 min-h-[56px] text-left transition-[border-color,background-color] duration-150',
              paymentMethod === 'in_person'
                ? 'border-s-accent bg-s-ink/[0.04]'
                : 'border-s-ink/10 hover:border-s-accent/30 bg-white',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-s-accent focus-visible:ring-offset-2',
            ].join(' ')}
          >
            <Wallet size={20} className="text-s-amber shrink-0" aria-hidden />
            <div className="flex-1 min-w-0">
              <p className="font-body text-[13px] font-semibold text-s-ink">Vor Ort</p>
              <p className="font-body text-[11px] text-s-ink/55 mt-0.5">Bezahlen beim Termin</p>
            </div>
            <span
              className={[
                'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-[border-color,background-color] duration-150',
                paymentMethod === 'in_person' ? 'bg-s-ink border-s-accent' : 'border-s-ink/25',
              ].join(' ')}
              aria-hidden
            >
              {paymentMethod === 'in_person' && <span className="w-1.5 h-1.5 bg-white rounded-full" />}
            </span>
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div role="alert" className="flex items-start gap-2 px-3 py-2.5 rounded-[10px] bg-s-error-bg">
          <AlertCircle size={14} className="shrink-0 mt-[1px] text-s-error" aria-hidden />
          <p className="font-body text-[12px] leading-[1.4] text-s-error">{error}</p>
        </div>
      )}

      {/* (e) Sticky bottom CTA. Online → "Weiter zur Zahlung" (next is the card form);
          in-person → "Buchen" (commits immediately). */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-s-ink/[0.06] bg-white p-4 z-20">
        <div className="max-w-2xl mx-auto px-4">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!paymentMethod || isSubmitting}
            className="w-full inline-flex items-center justify-center gap-2 min-h-[52px] px-5 rounded-full bg-s-ink text-white font-body text-[14px] font-bold uppercase tracking-[.04em] transition-[transform,filter] duration-150 hover:brightness-[1.06] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-s-accent focus-visible:ring-offset-2"
          >
            {isSubmitting && <Spinner size="sm" invert />}
            {paymentMethod === 'online'
              ? `${t('payment.continueToPayment')} · ${formatPrice(totalPrice, localeCode)}`
              : `Buchen · ${formatPrice(totalPrice, localeCode)}`}
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
            amount={totalPrice}
            locale={locale}
            localeCode={localeCode}
            returnUrl={`${typeof window !== 'undefined' ? window.location.origin : ''}/${locale}${confirmationPath}`}
            onSucceeded={() => router.push(confirmationPath)}
            onUseOtherMethod={() => {
              // Drop back to the selector. The pending online booking is left for the
              // abandon-sweep cron; a fresh selection creates its own booking.
              setPhase('select');
              setClientSecret(null);
              setConfirmationPath(null);
              setPaymentMethod(null);
              chargeRef.current = false;
            }}
          />
        </div>
      )}
    </div>
  );
}
