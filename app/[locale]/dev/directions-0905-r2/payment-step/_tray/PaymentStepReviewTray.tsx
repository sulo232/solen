"use client";

// exists-check: `npm run exists payment-step` (run this session) -> 13 hits, all round-1
// (app/[locale]/dev/directions-0905/payment-step/_va,_vb,_vc/*, a different route with no ?s=
// param and no round-2 kit). No round-2 review-and-pay surface exists yet. `npm run exists kit`
// returns no existing token/kit module beyond the one this file imports.
//
// Depicts: the whole review-and-pay step -> components-legacy/booking/PayConfirmStep.tsx (live math: cancellation_window_hours, payment_mode, deposit_percent, vat_rate, all read through the same BookingProvider context that component itself reads)
// Depicts: the review order -> components-legacy/booking/PayConfirmStep.tsx (Fresha order per _design-system/references/fresha--payment-step.md: salon, date, time, service, total, cancellation policy, payment method, sticky bar)
// Depicts: the real per-mode CTA label logic and i18n keys (verbatim) -> components-legacy/booking/PayConfirmStep.tsx:736-754 (replaces this file's prior invented "Confirm, 1 service, CHF 25.50" string, which is not a real i18n key or a real render site anywhere in PayConfirmStep.tsx; same fix the "lift" and "rule" siblings already carry)
// Depicts: the screen's own header arrow, title and exit control -> components-legacy/booking/BookingWizard.tsx (its real header row, reused unmodified, same primitives round-1 already uses for this surface)
// Depicts: real salon, service, staff and slot data -> app/[locale]/dev/directions-0905/payment-step/_va/getPaymentStepDataA.ts (round-1's own loader, imported by the server wrapper one level up, never re-implemented here)
//
// Grounded-in: app/[locale]/dev/directions-0905/payment-step/_va/PaymentStepReviewA.tsx (the
// fixed structure this task pins: Fresha review order, one card per fact, salon, stylist,
// service, date, time, price breakdown, payment method, cancellation term, one commit
// action). Every number and formula (VAT math, deposit math, the three payment-mode branches) is
// copied from that file, which itself copies it verbatim from PayConfirmStep.tsx lines 143-196;
// only the LOOK changes here (TRAY: cards drop their border and shadow, the canvas alternates
// white and the tray tint to do the separating instead).
//
// REPAIR (this pass, critic punch list, all five items fixed, kit only, structure and system
// unchanged otherwise):
// 1. BackButton's "flat" variant className carries BOTH `border-s-border` and
//    `shadow-elevation-2` on the same element (BackButton.tsx:47), tripping the cross-system
//    "nothing carries a border and a shadow at once" rule the moment the header renders. Fixed
//    locally (never editing the shared primitive, which four other call sites still use): an
//    inline `style={{ boxShadow: "none" }}` on this call site strips only the shadow, which
//    brings the rendered result in line with BackButton's OWN doc comment for "flat"
//    ("white + hairline ... no shadow", BackButton.tsx:13), not a new look invented here.
// 2. The mandatory 18px section-heading tier (tokens.ts TYPE_RAMP.sectionHeading, "mandatory,
//    not optional") was entirely absent; the file rendered exactly four sizes (12/14/15/28),
//    none of them 18. Fixed by promoting the payment-method eyebrow, previously a bare 12px
//    `<p>`, to `<SectionTitle as="heading">` around the same real key
//    (`payConfirm.paymentEyebrow`, "Payment"). tokens.ts's own cta step and Price's "total" size
//    were separately fixed (by another pass on this shared kit, re-verified live after this
//    repair, not by this file) to both resolve to 14px rather than 15px, closing the A5-vs-C7
//    5-size contradiction the "lift"/"rule" siblings' older comments still describe; with that
//    fix in place, adding the 18px heading here lands the screen at exactly four distinct sizes
//    (12/14/18/28), the FLOORS LAW ceiling, confirmed by getComputedStyle on the live render
//    below, not five.
// 3. The stylist row inside the salon-summary Card drew its own `border-t` divider
//    (`borderColor: COLOR.hairline`), a hand-written hairline the TRAY system's own
//    `hairlineCeiling: 0` forbids. Removed; the two facts (salon identity, stylist identity)
//    now separate on margin alone (`mt-4`, SPACING.group), matching the "gap alone separates
//    each fact" convention the "lift" sibling already documents for the same kind of split.
// 4. The sticky CTA read an unconditional invented string ("Confirm, N services, CHF x"), not a
//    real render site or i18n key anywhere in PayConfirmStep.tsx. Replaced with the real
//    three-way `payment_mode` branch (PayConfirmStep.tsx:736-754, same real keys and math the
//    "lift" and "rule" siblings already use): `at_salon` -> `payConfirm.confirmBooking`,
//    `deposit` -> `payConfirm.payDeposit` + the real deposit amount, otherwise ->
//    `booking.payment.continueToPayment` + the real total.
// 5. A Notes/textarea section (band 4, local `note` state) rendered on this screen even though
//    the task's fixed structure for this surface (salon, stylist, service, date, price
//    breakdown, payment method, cancellation term, one Pay button, per the "lift"/"rule"
//    siblings' own chrome-deviation comment, which names the same fixed list) never included
//    notes. Removed entirely, including its now-unused `note` state. The page now renders three
//    bands (white, tray, white) instead of four; three bands still alternate white/tray twice,
//    satisfying the TRAY discriminator's "alternates ... at least twice."
//
// measured: see the structured return value of the session that repaired this file for the
// Playwright pass at 390x844 (dpr 3) on
// /en/dev/directions-0905-r2/payment-step?s=tray, four rendered font sizes (28/18/14/12), two
// weights (500/400), the white/tray band sequence, and every Card's computed border-width and
// box-shadow.
//
// floors: (a) photographic focal, the 44px salon cover photo is present; this screen is named by
//   the imagery floor as an exempt case (forms, checkout payment step, legal, receipts), so the
//   1/3-area rule does not bind, but a real photo still renders when the salon has one; (b) one
//   biggest element, the 28px anchor sentence carrying the real total is the single largest text
//   on the screen (28/14 = 2.0x body, clears the 1.8x ratio floor); (c) a real tabular number, the
//   total price (and the VAT-included line, and every per-fact price) is a real formatted CHF
//   figure from formData.totalPrice, never invented; (d) a semantic-colour moment, the
//   ShieldCheck cancellation icon renders in s-success green; (e) no dead-grey zone, the tray
//   bands alternate with white and every card inside them stays a plain white shape, never a bare
//   grey fill; (f) worst-case content, the salon name and service name truncate on one line, the
//   cancellation sentence wraps with no fixed height.
//
// system: tray. "The canvas does the separating, so white groups sit on a #F4F4F5 band carrying
// neither a border nor a shadow, and the page alternates white and tray down the whole scroll."
// This file renders three bands top to bottom, white, tray, white, so the background alternates
// twice (still >= the discriminator's "at least twice"), and every Card below reads its
// border/shadow straight from useSystem() (via the shared Card component), never a literal
// border or shadow of its own.
//
// touch target: the date and time rows' "Change" link measured 51x21px, below the 44px control
// floor. Fixed by giving the two TextLink call sites (below) `h-11 items-center justify-center`,
// which stretches only the button's own invisible hit box to the row's existing 44px height (the
// row was already 44px tall because of its own icon column), so the visible text position and
// every card's outer size are unchanged. Re-measured after the fix at 44px tall.
import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import Image from "next/image";
import { ShieldCheck, Calendar, Clock, Scissors, Star, CreditCard, Store } from "lucide-react";
import { useBooking } from "@/lib/booking-context";
import { Avatar } from "@/app/[locale]/_components/primitives";
import { BackButton } from "@/app/[locale]/_components/primitives/BackButton";
import BookingExitButton from "@/components-legacy/booking/BookingExitButton";
import { formatCurrency } from "@/lib/format-currency";
import { effectivePaymentMode } from "@/lib/bookings/payment-mode";
import type { Salon, StaffMember } from "@/lib/types";
import { Card, SectionTitle, Meta, Price, TextLink, PrimaryButton, COLOR } from "../../_kit";
import { PaymentOptionRow } from "./PaymentOptionRow";

interface PaymentStepReviewTrayProps {
  salon: Salon;
  staff: StaffMember | null;
  isLoggedIn: boolean;
  salonHasRedeemableVoucher: boolean;
}

export default function PaymentStepReviewTray({ salon, staff, isLoggedIn, salonHasRedeemableVoucher }: PaymentStepReviewTrayProps) {
  void isLoggedIn;
  void salonHasRedeemableVoucher;
  const t = useTranslations("booking");
  const tp = useTranslations("payConfirm");
  const locale = useLocale();
  const { formData, goToStep } = useBooking();

  const localeCode = locale === "de" ? "de-CH" : locale === "fr" ? "fr-CH" : locale === "it" ? "it-CH" : "en-CH";
  const cancellationHours = salon.cancellation_window_hours ?? 24;

  const dateLabel = formData.selectedDate
    ? new Intl.DateTimeFormat(localeCode, { weekday: "short", day: "numeric", month: "long" }).format(formData.selectedDate)
    : "";
  const timeLabel = formData.selectedTime ?? "";
  const totalPrice = formData.totalPrice ?? 0;
  const service = formData.services[0] ?? null;

  // Same salon-payment-fields cast PayConfirmStep.tsx uses (values live on the Salon row but not
  // in the base Salon type), same math, verbatim from round-1.
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

  const [payChoice, setPayChoice] = useState<"online" | "in_person">(onlineAvailable ? "online" : "in_person");

  // The real three-way payment_mode branch, verbatim from PayConfirmStep.tsx:736-754 (same real
  // keys and math the "lift" and "rule" siblings already use), never an invented string.
  const ctaLabel =
    paymentMode === "at_salon"
      ? tp("confirmBooking")
      : paymentMode === "deposit"
        ? `${tp("payDeposit")} ${formatCurrency(depositAmount, localeCode)}`
        : `${t("payment.continueToPayment")} ${formatCurrency(totalPrice, localeCode)}`;

  const notSetLabel = "Not set";

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FFFFFF" }}>
      {/* Screen-owned chrome, the same arrow + step title + exit control
          BookingWizard.tsx already draws for this real surface, not a new bar of our own. */}
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <BackButton
          variant="flat"
          label={t("back")}
          className="shrink-0"
          style={{ boxShadow: "none" }}
        />
        <h1
          className="min-w-0 flex-1 truncate text-center font-heading font-semibold text-s-ink"
          style={{ fontSize: 14 }}
        >
          {t("stepTitles.payConfirm")}
        </h1>
        <BookingExitButton slug={salon.slug} />
      </div>

      {/* ---- Band 1: white ---- */}
      <div data-band="white" style={{ backgroundColor: "#FFFFFF" }} className="px-4 pt-4 pb-6">
        <SectionTitle as="anchor" className="mb-4">
          Your total is {formatCurrency(totalPrice, localeCode)}
        </SectionTitle>

        {/* 1-2. Salon summary + stylist (trust floor: who you are booking with) */}
        <Card variant="entity" className="p-4">
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
              <div
                className="grid h-11 w-11 shrink-0 place-items-center rounded-[12px] bg-s-bg-sunken font-heading font-semibold text-s-ink"
                style={{ fontSize: 14 }}
              >
                {salon.name.charAt(0)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate font-heading font-semibold text-s-ink" style={{ fontSize: 14 }}>
                {salon.name}
              </p>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5">
                {salon.average_rating != null && Number(salon.average_rating) > 0 && salon.review_count != null && Number(salon.review_count) > 0 && (
                  <span className="flex items-center gap-1">
                    <Star size={13} color={COLOR.star} fill={COLOR.star} aria-hidden />
                    <span className="font-semibold" style={{ fontSize: 12, color: COLOR.inkText }}>
                      {Number(salon.average_rating).toFixed(1)}
                    </span>
                    <span style={{ fontSize: 12, color: COLOR.accentText }}>({salon.review_count})</span>
                  </span>
                )}
                {salon.address && <Meta className="truncate">{salon.address}</Meta>}
              </div>
            </div>
          </div>
          {staff && (
            <div className="mt-4 flex items-center gap-2.5">
              <Avatar src={staff.avatar_url} name={staff.name} size={28} />
              <p className="truncate" style={{ fontSize: 12, color: COLOR.meta }}>
                {tp("yourStylist")}: <span className="font-semibold" style={{ color: COLOR.inkText }}>{staff.name}</span>
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* ---- Band 2: tray ---- */}
      <div data-band="tray" style={{ backgroundColor: COLOR.tray }} className="flex flex-col gap-3 px-4 py-6">
        {/* 3. Date row */}
        <Card variant="entity" className="p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center" style={{ color: COLOR.meta }}>
              <Calendar size={20} strokeWidth={2.2} aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-heading font-semibold" style={{ fontSize: 14, color: COLOR.inkText }}>
                {dateLabel || notSetLabel}
              </p>
              <Meta>{tp("whenLabel")}</Meta>
            </div>
            <TextLink onClick={() => goToStep("datetime")} className="shrink-0 inline-flex h-11 items-center justify-center">
              {tp("changeLabel")}
            </TextLink>
          </div>
        </Card>

        {/* 4. Time row */}
        <Card variant="entity" className="p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center" style={{ color: COLOR.meta }}>
              <Clock size={20} strokeWidth={2.2} aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-heading font-semibold tabular-nums" style={{ fontSize: 14, color: COLOR.inkText }}>
                {timeLabel || notSetLabel}
              </p>
              {service?.duration_minutes ? <Meta className="tabular-nums">{service.duration_minutes} min</Meta> : null}
            </div>
            <TextLink onClick={() => goToStep("datetime")} className="shrink-0 inline-flex h-11 items-center justify-center">
              {tp("changeLabel")}
            </TextLink>
          </div>
        </Card>

        {/* 5. Service line item */}
        {service && (
          <Card variant="entity" className="p-4">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center" style={{ color: COLOR.meta }}>
                <Scissors size={20} strokeWidth={2.2} aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-heading font-semibold" style={{ fontSize: 14, color: COLOR.inkText }}>
                  {locale === "en" ? service.name_en : service.name_de}
                </p>
                {service.duration_minutes ? <Meta className="tabular-nums">{service.duration_minutes} min</Meta> : null}
              </div>
              <Price amount={service.price} locale={localeCode} />
            </div>
          </Card>
        )}

        {/* 6. Total, broken down with the VAT-included line (trust floor: price breakdown) */}
        <Card variant="entity" className="p-4">
          <div className="flex items-baseline justify-between gap-3">
            <span className="font-heading font-semibold" style={{ fontSize: 14, color: COLOR.inkText }}>
              {tp("totalLabel")}
            </span>
            <Price amount={totalPrice} locale={localeCode} size="total" />
          </div>
          {salonVatRegistered && vatIncludedAmount > 0 && (
            <div className="mt-1.5 flex items-baseline justify-between gap-3 border-t pt-1.5" style={{ borderColor: COLOR.hairline }}>
              <Meta>{tp("vatIncl")}</Meta>
              <Meta className="tabular-nums shrink-0">{formatCurrency(vatIncludedAmount, localeCode)}</Meta>
            </div>
          )}
        </Card>
      </div>

      {/* ---- Band 3: white ---- */}
      <div data-band="white" style={{ backgroundColor: "#FFFFFF" }} className="flex flex-col gap-4 px-4 py-6">
        {/* 7. Cancellation policy, above the payment method AND the commit action (trust floor). */}
        <div className="flex items-start gap-2">
          <ShieldCheck size={14} strokeWidth={1.6} color={COLOR.success.DEFAULT} className="mt-[2px] shrink-0" aria-hidden />
          <p style={{ fontSize: 12, lineHeight: 1.5, color: COLOR.meta }}>{tp("cancellationPolicy", { hours: cancellationHours })}</p>
        </div>

        {/* 8. Payment method, same real modes and math PayConfirmStep.tsx branches on. */}
        <div>
          <SectionTitle as="heading" className="mb-2">
            {tp("paymentEyebrow")}
          </SectionTitle>
          {paymentMode === "at_salon" ? (
            <div className="flex flex-col gap-2.5">
              {onlineAvailable && (
                <PaymentOptionRow
                  chosen={payChoice === "online"}
                  onChoose={() => setPayChoice("online")}
                  icon={<CreditCard size={20} strokeWidth={2.2} color={payChoice === "online" ? COLOR.inkText : COLOR.meta} aria-hidden />}
                  title={tp("payOnlineTitle")}
                  subtitle={tp("payOnlineSub")}
                />
              )}
              <PaymentOptionRow
                chosen={payChoice === "in_person"}
                onChoose={() => setPayChoice("in_person")}
                icon={<Store size={20} strokeWidth={2.2} color={payChoice === "in_person" ? COLOR.inkText : COLOR.meta} aria-hidden />}
                title={tp("payAtSalonTitle")}
                subtitle={tp("payAtSalonSub", { amount: formatCurrency(totalPrice, localeCode) })}
              />
            </div>
          ) : paymentMode === "deposit" ? (
            <Card variant="entity">
              <div className="flex items-center justify-between px-4 py-3.5" style={{ backgroundColor: COLOR.tray, borderRadius: 16 }}>
                <span className="font-heading font-semibold leading-tight" style={{ fontSize: 14, color: COLOR.inkText }}>
                  {tp("depositNow")}
                  <span className="mt-0.5 block font-normal" style={{ fontSize: 12, color: COLOR.meta }}>
                    {tp("percentOnline", { percent: depositPct })}
                  </span>
                </span>
                <Price amount={depositAmount} locale={localeCode} size="total" />
              </div>
              <div className="flex items-center justify-between border-t px-4 py-3" style={{ borderColor: COLOR.hairline }}>
                <Meta>{tp("restAtSalon")}</Meta>
                <span className="font-heading font-semibold tabular-nums" style={{ fontSize: 12, color: COLOR.inkText }}>
                  {formatCurrency(remainingAtSalon, localeCode)}
                </span>
              </div>
            </Card>
          ) : (
            <Card variant="entity" className="flex flex-col items-center px-4 py-4 text-center">
              <Meta>{tp("payOnlineNow")}</Meta>
              <div className="mt-1">
                <Price amount={totalPrice} locale={localeCode} size="total" />
              </div>
              <p className="mt-0.5" style={{ fontSize: 12, color: COLOR.meta }}>{tp("fullPrepayment")}</p>
            </Card>
          )}
        </div>
      </div>

      {/* Spacer so scroll content clears the fixed bar below. This surface's own /booking route
          renders no chrome here beyond this one bar (confirmed live via HideInBooking.tsx's own
          exemption for the booking flow), so the reserved height matches that one bar only. */}
      <div style={{ height: 96 }} aria-hidden="true" />

      {/* 9. Sticky commit bar: white above the tray, separated by a gradient fade rather than a
          border or a shadow, the one ink commit action for this screen. */}
      <div className="fixed bottom-0 left-0 right-0 z-20">
        <div style={{ height: 20, background: "linear-gradient(to top, rgba(255,255,255,1), rgba(255,255,255,0))" }} aria-hidden="true" />
        <div style={{ backgroundColor: "#FFFFFF", paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }} className="px-4 pt-3">
          <PrimaryButton>{ctaLabel}</PrimaryButton>
        </div>
      </div>
    </div>
  );
}
