'use client';

// measure-ok: this is a STRUCTURE-only direction (LOCK MODE: Solen locks kept). Every font
// size and radius below is copied verbatim from the REAL, already-shipped
// components-legacy/booking/PayConfirmStep.tsx (the live implementation of this exact step),
// only rounded to the nearest LOCKED type-scale step where that file itself used an
// off-scale half-pixel value (12.5/13.5/16.5px -> 13/14/16px). Nothing here is pixel-sampled
// from the Fresha reference image: the Fresha spec file
// (_design-system/references/fresha--payment-step.md) this direction follows documents
// CONTENT ORDER ("Measured (ordered element list)"), not font-size/px numbers, because
// Mobbin iOS stills don't expose computed styles; its own Method note says so. The thing
// being ported from Fresha here is the ORDER of elements, not a pixel value, so there is no
// reference px to cite for a `measured:` note; the port map in that file already says this.

// exists-check: net-new vs lib/auth/require.ts, lib/payment-brand.ts, _tasks/SOLEN_DESIGN.md,
// lib/min-price-service.ts, lib/cancellation-policy.ts, lib/verify-salon-client.ts,
// scripts/check-trust-floor.mjs, app/api/client-notes/route.ts (the exists-guard's nearest
// matches for "PaymentStepReviewA"). None of these renders the review-step UI: require.ts and
// verify-salon-client.ts are auth helpers, payment-brand.ts is a card-brand icon lookup,
// min-price-service.ts computes a salon's "from CHF" figure, cancellation-policy.ts is the
// hours-lookup this file already reuses indirectly via salon.cancellation_window_hours,
// check-trust-floor.mjs is a static grep gate (read, not extended), and client-notes/route.ts
// is the dashboard's staff-facing client-notes API, unrelated to a customer booking note. This
// file is net-new: this surface's own review-step component (this fan-out's brief).

/**
 * Direction: Fresha review order, literally, applied to the LIVE review-and-pay step.
 * Declared VARY axis: STRUCTURE (information order) only. Solen's tokens, radii, colors,
 * icons and one-ink-CTA lock are all kept unchanged; nothing about the LOOK is ported from
 * Airbnb in this direction (that is direction b's job).
 *
 * Sources:
 * - Structure (the order below, top to bottom): _design-system/references/fresha--payment-step.md
 *   "Measured" list items 2-12: salon summary card (photo/name/rating/address) -> date row
 *   -> time row -> service line item (name+duration, price) -> Total -> cancellation policy
 *   paragraph -> payment method -> notes -> sticky bar (price + item count, one commit pill).
 *   This is the literal order named in the fan-out brief for direction A, which is Fresha's
 *   order minus its "discount code" slot (not offered on this surface per the FIXED
 *   payment-method-stays clause) and minus a separate stylist row (Fresha's own capture
 *   never shows staff info in-frame; the trust floor's "who you're booking with" requirement
 *   is met instead by naming the stylist inside the salon card, see below).
 * - Values (price, VAT math, deposit math, payment-mode branching): copied verbatim from
 *   components-legacy/booking/PayConfirmStep.tsx lines 143-196 (this is a STRUCTURE-only
 *   direction, so every number/formula is the real one, only the layout position moves).
 * - Copy: real i18n keys from `payConfirm` + `booking` namespaces (messages/en.json), read
 *   through next-intl exactly like the real step. One new English string introduced by this
 *   direction only (the sticky-bar copy shape the brief specifies, "Confirm, 1 service,
 *   CHF 25.50", which does not exist as a key anywhere) is written inline below, English.
 * - Type scale: every size below is a LOCKED value (12/13/14/15/16/22/28px per
 *   LOCKFILE section 2), not the arbitrary halves (12.5/13.5/16.5px) PayConfirmStep.tsx
 *   itself uses; the type-scale gate refused those on this net-new file, rounded to the
 *   nearest locked step instead, per the gate's own suggestion.
 * - Motion: ENTER RECIPE (opacity+y+scale together) per _design-system/MOTION.md, same
 *   `useEnterMotion` hook PayConfirmStep.tsx already uses (primitives/motion), staggered by
 *   0.05s per card top to bottom, matching that file's own stagger value.
 *
 * Conflicts (Solen locks kept, direction is structure-only):
 * - kept: rounded-card (16px) + shadow-elevation-1 on every card (LOCKFILE radius row).
 * - kept: bg-s-ink pill sticky CTA (the one commit-button lock), never a gradient/brand pill.
 * - kept: blue s-accent ONLY on the small "Change" text links (taste rule 3, sparse blue).
 * - kept: neutral outline (border-s-ink 2px on select) for the payment-method radio rows,
 *   identical treatment to PayConfirmStep.tsx, no new selected-state invented.
 * - added (not in Fresha's literal item list): the stylist's name inside the salon card, one
 *   line under the address. Required by this surface's FIXED trust floor ("who you're
 *   booking with is visible above the commit action"), which the literal Fresha item list
 *   does not itself carry (that capture's crop never showed a staff row). Named here per the
 *   fan-out brief's "list every broken lock / addition" instruction; this is not a broken
 *   Solen lock, it is an addition beyond the reference's literal list to satisfy a floor that
 *   binds regardless of direction.
 * - the wizard's own header (back arrow + step title + exit X) is copied verbatim from
 *   components-legacy/booking/BookingWizard.tsx lines ~190-216 (same BackButton +
 *   BookingExitButton components, same classNames), not redrawn, so this mockup's chrome
 *   matches the live route's own screen-owned chrome exactly (both are 1 nav row; the global
 *   site Header is hidden on both routes by HideInBooking.tsx's `/dev` and `/booking` rules,
 *   so 0 there on both sides too).
 *
 * floors: (a) photo focal = the 44px salon cover photo is present but this is a review/
 *   commit screen, exempt per the imagery floor's named exemption for checkout; (b) one
 *   biggest element = the 22px total price value; (c) tabular number = price + duration,
 *   tabular-nums; (d) semantic-color moment = the ShieldCheck cancellation-policy row (green
 *   s-success icon); (e) no dead-grey zone = alternating white cards on white page background
 *   with hairline borders, no bare grey fill; (f) worst-case content: service/salon names
 *   truncate (`truncate` class), the cancellation sentence wraps naturally (no fixed height).
 */
import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Image from 'next/image';
import { motion } from 'motion/react';
import { ShieldCheck, Calendar, Clock, Scissors, Star, CreditCard, Store } from 'lucide-react';
import { useBooking } from '@/lib/booking-context';
import { Avatar, useEnterMotion } from '@/app/[locale]/_components/primitives';
import { BackButton } from '@/app/[locale]/_components/primitives/BackButton';
import BookingExitButton from '@/components-legacy/booking/BookingExitButton';
import { formatPrice } from '@/lib/format';
import { effectivePaymentMode } from '@/lib/bookings/payment-mode';
import type { Salon, StaffMember } from '@/lib/types';

interface PaymentStepReviewAProps {
  salon: Salon;
  staff: StaffMember | null;
  isLoggedIn: boolean;
  salonHasRedeemableVoucher: boolean;
}

export default function PaymentStepReviewA({ salon, staff, isLoggedIn, salonHasRedeemableVoucher }: PaymentStepReviewAProps) {
  void isLoggedIn;
  void salonHasRedeemableVoucher;
  const t = useTranslations('booking');
  const tp = useTranslations('payConfirm');
  const locale = useLocale();
  const { formData, goToStep } = useBooking();

  const localeCode = locale === 'de' ? 'de-CH' : locale === 'fr' ? 'fr-CH' : locale === 'it' ? 'it-CH' : 'en-GB';
  const cancellationHours = salon.cancellation_window_hours ?? 24;

  const dateLabel = formData.selectedDate
    ? new Intl.DateTimeFormat(localeCode, { weekday: 'short', day: 'numeric', month: 'long' }).format(formData.selectedDate)
    : '';
  const timeLabel = formData.selectedTime ?? '';
  const totalPrice = formData.totalPrice ?? 0;
  const service = formData.services[0] ?? null;

  // Same salon-payment-fields cast PayConfirmStep.tsx uses (values live on the Salon row but
  // not in the base Salon type), same math, verbatim.
  const salonExt = salon as Salon & {
    payment_mode?: string | null;
    payment_mode_admin?: string | null;
    payment_mode_enforced?: boolean | null;
    deposit_percent?: number;
    accepts_online_payment?: boolean;
    vat_registered?: boolean;
    vat_rate?: number;
  };
  const onlineAvailable = salonExt.accepts_online_payment === true;
  const paymentMode = effectivePaymentMode({
    payment_mode: salonExt.payment_mode ?? null,
    payment_mode_admin: salonExt.payment_mode_admin ?? null,
    payment_mode_enforced: salonExt.payment_mode_enforced ?? null,
  });
  const depositPct = Math.min(100, Math.max(1, Number(salonExt.deposit_percent) || 20));
  const depositAmount = Math.round(totalPrice * depositPct) / 100;
  const remainingAtSalon = Math.round((totalPrice - depositAmount) * 100) / 100;
  const salonVatRegistered = salonExt.vat_registered === true;
  const vatRatePercent = salonExt.vat_rate == null ? 8.1 : Number(salonExt.vat_rate);
  const vatFraction = vatRatePercent / 100;
  const vatIncludedAmount = vatFraction > 0 ? (totalPrice * vatFraction) / (1 + vatFraction) : 0;

  const [payChoice, setPayChoice] = useState<'online' | 'in_person'>(onlineAvailable ? 'online' : 'in_person');
  const [note, setNote] = useState('');

  // ENTER RECIPE (MOTION.md), same stagger PayConfirmStep.tsx uses per card.
  const salonCardMotion = useEnterMotion();
  const dateTimeMotion = useEnterMotion(0.05);
  const serviceMotion = useEnterMotion(0.1);
  const totalMotion = useEnterMotion(0.15);
  const policyMotion = useEnterMotion(0.2);
  const paymentMotion = useEnterMotion(0.25);
  const notesMotion = useEnterMotion(0.3);

  const serviceCount = formData.services.length;
  // New copy, this direction only (brief's exact shape, no existing key matches it):
  const ctaLabel = `Confirm, ${serviceCount} service${serviceCount === 1 ? '' : 's'}, ${formatPrice(totalPrice, localeCode)}`;

  const notSetLabel = 'Not set';

  return (
    <div className="space-y-5 pb-32">
      {/* Screen-owned chrome, copied verbatim from BookingWizard.tsx's own header row (not
          redrawn): back arrow + step title + exit X. The global site Header is hidden on
          both this /dev route and the live /booking route by HideInBooking.tsx. */}
      <div className="flex items-center justify-between pt-1 pb-1">
        <BackButton variant="flat" label={t('back')} className="shrink-0" />
        <h1 className="min-w-0 flex-1 truncate text-center font-heading text-[15px] font-semibold tracking-[-0.01em] text-s-ink">
          {t('stepTitles.payConfirm')}
        </h1>
        <BookingExitButton slug={salon.slug} />
      </div>

      {/* 1. Salon summary card: photo, name, rating, address (+ stylist, trust-floor addition) */}
      <motion.div {...salonCardMotion} className="rounded-card border border-s-border bg-white p-4 shadow-elevation-1">
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
              {salon.average_rating != null && Number(salon.average_rating) > 0 && salon.review_count != null && Number(salon.review_count) > 0 && (
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
        {staff && (
          <div className="mt-3 flex items-center gap-2.5 border-t border-s-border pt-3">
            <Avatar src={staff.avatar_url} name={staff.name} size={28} />
            <p className="truncate text-[13px] text-s-ink-2">
              {tp('yourStylist')}: <span className="font-semibold text-s-ink">{staff.name}</span>
            </p>
          </div>
        )}
      </motion.div>

      {/* 2-3. Date row and time row, each its own row with a Change link (Fresha item 3-4) */}
      <motion.div {...dateTimeMotion} className="space-y-3">
        <div className="flex items-center gap-3 rounded-card border border-s-border bg-white p-4 shadow-elevation-1">
          <div className="grid h-11 w-11 shrink-0 place-items-center text-s-ink-2">
            <Calendar size={20} strokeWidth={2.2} aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-heading text-[15px] font-semibold text-s-ink">{dateLabel || notSetLabel}</p>
            <p className="text-[13px] text-s-ink-2">{tp('whenLabel')}</p>
          </div>
          <button type="button" onClick={() => goToStep('datetime')} className="shrink-0 text-[13px] font-semibold text-s-accent">
            {tp('changeLabel')}
          </button>
        </div>
        <div className="flex items-center gap-3 rounded-card border border-s-border bg-white p-4 shadow-elevation-1">
          <div className="grid h-11 w-11 shrink-0 place-items-center text-s-ink-2">
            <Clock size={20} strokeWidth={2.2} aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-heading text-[15px] font-semibold tabular-nums text-s-ink">{timeLabel || notSetLabel}</p>
            {service?.duration_minutes ? (
              <p className="text-[13px] tabular-nums text-s-ink-2">{service.duration_minutes} min</p>
            ) : null}
          </div>
          <button type="button" onClick={() => goToStep('datetime')} className="shrink-0 text-[13px] font-semibold text-s-accent">
            {tp('changeLabel')}
          </button>
        </div>
      </motion.div>

      {/* 4. Service line item: name + duration on the left, price on the right (Fresha item 5) */}
      {service && (
        <motion.div {...serviceMotion} className="flex items-center gap-3 rounded-card border border-s-border bg-white p-4 shadow-elevation-1">
          <div className="grid h-11 w-11 shrink-0 place-items-center text-s-ink-2">
            <Scissors size={20} strokeWidth={2.2} aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-heading text-[15px] font-semibold text-s-ink">{locale === 'en' ? service.name_en : service.name_de}</p>
            {service.duration_minutes ? <p className="text-[13px] tabular-nums text-s-ink-2">{service.duration_minutes} min</p> : null}
          </div>
          <span className="shrink-0 tabular-nums text-[14px] font-semibold text-s-ink">{formatPrice(service.price, localeCode)}</span>
        </motion.div>
      )}

      {/* 5. Total, broken down with the included-VAT line (Fresha items 6-7, trust-floor price breakdown) */}
      <motion.div {...totalMotion} className="rounded-card border border-s-border bg-white p-4 shadow-elevation-1">
        <div className="flex items-baseline justify-between gap-3">
          <span className="font-heading text-[15px] font-semibold text-s-ink">{tp('totalLabel')}</span>
          <span className="font-heading text-[22px] font-bold tabular-nums tracking-[-0.01em] text-s-ink">{formatPrice(totalPrice, localeCode)}</span>
        </div>
        {salonVatRegistered && vatIncludedAmount > 0 && (
          <div className="mt-1.5 flex items-baseline justify-between gap-3 border-t border-s-border pt-1.5 text-[13px]">
            <span className="text-s-ink-2">{tp('vatIncl')}</span>
            <span className="shrink-0 tabular-nums text-s-ink-2">{formatPrice(vatIncludedAmount, localeCode)}</span>
          </div>
        )}
      </motion.div>

      {/* 6. Cancellation policy, one paragraph, ABOVE the payment method + the commit bar
          (Fresha item 9, and this surface's trust floor: the cancellation term above the
          commit button). Semantic-color floor: the s-success ShieldCheck icon. */}
      <motion.div {...policyMotion} className="flex items-start gap-2 px-1">
        <ShieldCheck size={14} strokeWidth={1.6} className="mt-[2px] shrink-0 text-s-success" aria-hidden />
        <p className="text-[13px] leading-[1.5] text-s-ink-2">{tp('cancellationPolicy', { hours: cancellationHours })}</p>
      </motion.div>

      {/* 7. Payment method: the two real modes as radio rows, exact same math + branch
          PayConfirmStep.tsx uses (Fresha item 10, FIXED "payment-method choice stays"). */}
      <motion.div {...paymentMotion}>
        <p className="mb-2 text-[13px] font-semibold text-s-ink">{tp('paymentEyebrow')}</p>
        {paymentMode === 'at_salon' ? (
          <div className="flex flex-col gap-2.5">
            {onlineAvailable && (
              <button
                type="button"
                aria-pressed={payChoice === 'online'}
                onClick={() => setPayChoice('online')}
                className={`flex w-full items-center gap-3 rounded-[12px] bg-white px-4 py-4 text-left transition-colors ${payChoice === 'online' ? 'border-2 border-s-ink' : 'border border-s-border'}`}
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-s-accent-pale">
                  <CreditCard size={20} strokeWidth={2.2} className="text-s-accent" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] font-semibold text-s-ink">{tp('payOnlineTitle')}</span>
                  <span className="mt-0.5 block text-[13px] text-s-ink-2">{tp('payOnlineSub')}</span>
                </span>
              </button>
            )}
            <button
              type="button"
              aria-pressed={payChoice === 'in_person'}
              onClick={() => setPayChoice('in_person')}
              className={`flex w-full items-center gap-3 rounded-[12px] bg-white px-4 py-4 text-left transition-colors ${payChoice === 'in_person' ? 'border-2 border-s-ink' : 'border border-s-border'}`}
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-s-bg-sunken">
                <Store size={20} strokeWidth={2.2} className="text-s-ink" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-semibold text-s-ink">{tp('payAtSalonTitle')}</span>
                <span className="mt-0.5 block text-[13px] text-s-ink-2">{tp('payAtSalonSub', { amount: formatPrice(totalPrice, localeCode) })}</span>
              </span>
            </button>
          </div>
        ) : paymentMode === 'deposit' ? (
          <div className="overflow-hidden rounded-[12px] border border-s-border">
            <div className="flex items-center justify-between bg-s-bg-sunken px-4 py-3.5">
              <span className="font-heading text-[14px] font-semibold leading-tight text-s-ink">
                {tp('depositNow')}
                <span className="mt-0.5 block text-[12px] font-medium text-s-ink/70">{tp('percentOnline', { percent: depositPct })}</span>
              </span>
              <span className="font-heading text-[22px] font-bold tabular-nums text-s-ink">{formatPrice(depositAmount, localeCode)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-s-border px-4 py-3 text-[13px]">
              <span className="text-s-ink-2">{tp('restAtSalon')}</span>
              <span className="font-heading font-semibold tabular-nums">{formatPrice(remainingAtSalon, localeCode)}</span>
            </div>
          </div>
        ) : (
          <div className="rounded-[12px] border border-s-border px-4 py-4 text-center">
            <p className="text-[12px] text-s-ink-2">{tp('payOnlineNow')}</p>
            <p className="mt-1 font-heading text-[28px] font-bold tabular-nums text-s-ink">{formatPrice(totalPrice, localeCode)}</p>
            <p className="mt-0.5 text-[12px] text-s-ink/40">{tp('fullPrepayment')}</p>
          </div>
        )}
      </motion.div>

      {/* 8. Notes field (Fresha item 11). Not present as a render site anywhere in
          PayConfirmStep.tsx today (see this direction's Sources note); local-only state, no
          submit, this is the REVIEW phase only per the hard ban on POST /api/bookings. Real
          copy keys reused from booking.preferences (the wizard's HairStep note field). */}
      <motion.div {...notesMotion} className="rounded-input border border-s-border bg-s-bg-surface p-4">
        <label htmlFor="review-a-notes" className="mb-2 block text-[13px] font-semibold text-s-ink">
          {t('preferences.notes_label')}
        </label>
        <textarea
          id="review-a-notes"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t('preferences.notes_placeholder')}
          rows={3}
          className="w-full resize-none text-[14px] text-s-ink placeholder:text-s-ink-2"
        />
      </motion.div>

      {/* 9. Sticky commit bar: price + item count on the button itself (Fresha item 12). */}
      <div
        className="fixed bottom-0 left-0 right-0 z-20 border-t border-s-border bg-white p-4"
        style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
      >
        <div className="mx-auto max-w-2xl px-4">
          <button
            type="button"
            className="inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-s-ink px-5 text-[15px] font-semibold text-white transition-[transform,filter] duration-150 hover:brightness-[1.06] active:scale-[0.97] active:duration-[80ms] active:ease-glide"
          >
            {ctaLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
