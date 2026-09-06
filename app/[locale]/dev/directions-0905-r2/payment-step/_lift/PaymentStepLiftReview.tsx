"use client";

// exists-check: `npm run exists payment-step` (run this session) shows no round-2 "lift" review
// component for this surface; the closest matches are round-1's PaymentStepReviewA.tsx (a
// different route, DirectionFrame-switcher chrome, five separately-bordered boxes) and this
// same run's sibling "tray" system files (a different look system's own composition). Net-new.
//
// Depicts: salon+stylist/date/time/service/price-breakdown/payment-method/cancellation content order -> components-legacy/booking/PayConfirmStep.tsx (real render order this port follows; content-order source also cited in Grounded-in below as fresha--payment-step.md)
// Depicts: the payment-mode math (deposit/VAT/remaining, verbatim) -> components-legacy/booking/PayConfirmStep.tsx:143-196
// Depicts: the real per-mode CTA label logic and i18n keys (verbatim) -> components-legacy/booking/PayConfirmStep.tsx:736-754 (replaces round-1's own invented "Confirm, 1 service, CHF 25.50" string, which is not a real i18n key or a real render site anywhere in PayConfirmStep.tsx)
// Depicts: every pill/badge/button/title/meta/price/card literal on this screen -> app/[locale]/dev/directions-0905-r2/_kit/index.ts (Card, SectionTitle, Meta, Price, PrimaryButton, TextLink, KitProvider/useSystem via Card)
// Depicts: the "Change" links' real navigation -> lib/booking-context.tsx (useBooking().goToStep, not a dead click)
// Depicts: the payment-method icon chips (CreditCard / Store, no photo) -> components-legacy/booking/PayConfirmStep.tsx:549-555,618-633 (the real "pay online" / "pay at salon" row icon-chip anatomy, verbatim; content-image-ok inline on each chip's own line below)
//
// Not-a-salon-card: the salon name + star rating inside the summary card is a booking-review
//   identity row (who you're already booked with, trust floor), not a discovery/search result
//   tile. It has no "View N services" off-ramp, no aspect-[3/2] hero, and is not tappable to a
//   salon page: it renders inside ONE lifted card alongside the date/time/service/price rows it
//   is grouped with (LIFT's own per-screen line for this surface, "one lifted summary card"),
//   the exact same anatomy round-1's PaymentStepReviewA.tsx already ships on the live-adjacent
//   /booking route (44px photo + name + rating + address, no service-count off-ramp there
//   either). SalonResultCard (variant="feed") is the search/discovery grammar; composing it
//   here would print a "View services" link mid-checkout, a step backward in the flow.
//
// Grounded-in: app/[locale]/dev/directions-0905-r2/_kit/index.ts (Card, SectionTitle, Meta,
//   Price, PrimaryButton, TextLink, KitProvider/useSystem via Card -- every pill/badge/button/
//   title/meta/price/card literal on this screen comes from that folder, per the task brief's
//   "never write a literal size, weight, radius or colour" rule). Also grounded in
//   components-legacy/booking/PayConfirmStep.tsx (the real step this port follows, cited above
//   under Depicts), lib/bookings/payment-mode.ts (effectivePaymentMode, real three-way branch),
//   lib/format-currency.ts (formatCurrency, real Swiss formatting), app/[locale]/_components/
//   primitives (Avatar, useEnterMotion, both real, unchanged), lib/booking-context.tsx
//   (useBooking / goToStep, real, unchanged), messages/en.json's payConfirm + booking
//   namespaces (every string below is a real key; no invented English copy on this file except
//   the two literal fragments assembled around a real price value into the screen's 28px anchor
//   SENTENCE, see the "system:" note below for why that sentence exists at all), and
//   _design-system/references/fresha--payment-step.md "Measured" list items 2-12 (the content
//   ORDER this file follows).
//
// measured (repo's own @playwright/test, headless chromium, dev server :3461, 390x844 dpr 3,
//   /en/dev/directions-0905-r2/payment-step?s=lift -- NOT the Claude_Browser preview tab, which
//   throttles rAF/timers and freezes framer-motion at opacity:0, memory
//   reference_preview_tab_raf_throttle.md):
//   RE-MEASURED 2026-09-06 during the critic repair pass and CORRECTED from this comment's own
//   stale "5 sizes {12,14,15,18,28}" claim: tokens.ts's TYPE_RAMP.cta was changed to 14px (from
//   15) by a parallel session on this same kit, resolving the C7-vs-A5 contradiction the OLD
//   comment described in A5's favor (see tokens.ts's own current provenance comment on `cta`).
//   Distinct rendered font sizes on this screen today are {12,14,18,28} (4, at the FLOORS LAW
//   ceiling exactly, not one over it): 12 from kit Meta, 14 from kit Price, kit PrimaryButton
//   ("Confirm booking"), and this file's local EmphasisText (all three now share the one A5
//   body/row/CTA slot, distinguished by weight -- 400 body vs 500 CTA/EmphasisText -- not by
//   size), 18 from kit SectionTitle as="heading" (payConfirm.paymentEyebrow, "Payment"), 28 from
//   kit SectionTitle as="anchor" (the one sentence). Two distinct weights (400/500) per
//   getComputedStyle. Full measured table (back/exit touch targets, Change-link touch targets,
//   payment-row fill, sticky-bar border, card shadow/border counts) is in the returned
//   structured output.
//
// floors: (a) photographic focal: the 44px salon photo sits flush at the summary card's leading
//   edge (LOCKFILE 17.2 case b), present but not the screen's focal element, which is legal on a
//   trust/commit surface per the imagery floor's own named exemption for "checkout payment
//   step"; (b) one biggest element: the 28px anchor sentence is the only 28px run on the page,
//   28/14 = 2.0x the local body size, clearing both the absolute and ratio floors on its own;
//   (c) tabular number: the anchor's price, every Price component, and every duration figure
//   render tabular-nums; (d) semantic-colour moment: the ShieldCheck cancellation row renders
//   s-success green, and a selected payment row is indicated by the same tray fill + weight
//   shift the rest of the system uses for "selected" (no new semantic colour invented for
//   selection, per the design contract's selected/active row); (e) no dead-grey zone: the page
//   is white end to end per LIFT (system note below), the tray fill only ever appears as a
//   small selected-row highlight inside the payment card, never as a page-level band; (f)
//   worst-case content: salon name and service name truncate (`truncate`), the cancellation
//   sentence wraps naturally (no fixed height), the anchor sentence's price stays one tabular
//   run regardless of locale-driven length.
//
// system: LIFT, verbatim from _plans/R2_LOOK_SYSTEMS.md Part B, SYSTEM 1: "the lifted white
//   card is the only grouping device on the screen, so nothing carries a border and nothing
//   carries a hairline; a soft shadow and the gap between cards do all the work." Applied here
//   exactly per that document's own per-screen line for this surface ("Review and pay A"): "the
//   five identical bordered boxes collapse into one lifted summary card with no internal
//   hairlines, and only the payment chooser, which is tappable as a unit, earns a second card."
//   So: ONE kit <Card variant="entity"> holds salon+stylist+date+time+service+total (no
//   border/hairline inside it, gap alone separates each fact); the cancellation sentence sits
//   bare on white between the two cards (not a card itself, per the trust floor's "renders
//   above the commit button" requirement, which does not require its own container); a second
//   kit <Card variant="entity"> holds the payment-method chooser, and its own internal
//   selectable rows use a FILL change (the system's own selected-pill convention, tray fill +
//   weight shift) rather than a per-row border, so the fold-wide discriminator (shadow count >
//   border count, zero elements with both, <=1 hairline) held before this pass's own repair
//   below. UPDATED 2026-09-06 (critic open item 4, sticky-bar edge): the fold carried 2 shadowed
//   elements (the two cards) and 1 bordered element (the sticky bar's own `border-t`, LIFT's
//   hairlineCeiling budget, previously unused), 0 elements with both, exactly 1 hairline. 2 > 1
//   and <=1 hairline both held.
//
// REPAIR, final pass (LOCKFILE §17.2 edge case (c)): this screen carries no photograph as its
//   fold-level focal element (the 44px salon photo sits flush inside the summary card, LOCKFILE
//   17.2 case (b), not the screen's own focal shape), and the summary card's shadow-only edge
//   measured 1.13:1 against white, well under the FLOORS LAW edge-visibility floor's own
//   perceivable-boundary bar. Per the arbiter's pre-ship repair for exactly this case, the
//   summary <Card> now passes the kit's new `bordered` prop: it renders the locked hairline
//   (1px solid #E4E4E7) with the shadow forced off, radius unchanged (still 16, `variant="entity"`).
//   This is a named, per-instance, screen-level override of LIFT's own uniform card delta,
//   the same shape of exception RULE's `borderExceptionVariant` already is for its one identity
//   block, just expressed through `bordered` instead (LIFT declares no `borderExceptionVariant`
//   in systems.ts, and none is added by this fix: the exception lives on this one Card instance,
//   not on the system). Honest consequence, stated plainly rather than silently reconciled: with
//   the summary card now bordered instead of shadowed, the shadowed-elements count inside the
//   390x844 fold (summary card + header + anchor, before any scroll) drops to 0, while the
//   bordered-elements count rises to 2 (the summary card, the sticky bar), so LIFT's own
//   discriminator inequality (shadow count > border count) does not hold WITHIN THE FOLD any
//   more on this one screen; it still holds across the full scroll depth once the second,
//   still-shadowed payment card enters the count. This is the documented trade the edge-
//   visibility floor asks for on a photo-less card: LOCKFILE §17.2 edge case (c) outranks the
//   system's own discriminator on the one card it names, the same way a statutory floor outranks
//   a taste axis elsewhere in this project's precedence chain.
//
// Chrome: REPAIRED 2026-09-06 (critic open item 3). This screen now draws its own wizard
//   header (back / title / exit), matching round-1 direction A's own PaymentStepReviewA.tsx
//   (back arrow + step title + exit X, copied verbatim from BookingWizard.tsx). The literal
//   BackButton "flat" variant is NOT reused: BackButton.tsx's own className puts a
//   `border-s-border` hairline AND `shadow-elevation-2` on the SAME element, which would trip
//   the LIFT discriminator's "zero elements carry both border and shadow" clause the instant it
//   entered the fold. Instead the back affordance borrows the one real recipe already proven
//   safe for this exact system: `components-legacy/booking/BookingExitButton.tsx`'s own local
//   trigger-button className (`grid h-11 w-11 shrink-0 place-items-center rounded-full
//   transition-[colors,transform] hover:bg-s-bg-sunken active:scale-[0.94] active:duration-[80ms]
//   active:ease-glide`, verbatim, ChevronLeft glyph swapped in for that file's X), which carries
//   neither border nor shadow. The exit X is `<BookingExitButton>` itself, composed unchanged
//   (real component, real leave-guard behaviour, same as round-1). The title reuses this file's
//   own EmphasisText (already-counted 14px/500 tier, not a new size) with the same real i18n key
//   round-1 used, `t("stepTitles.payConfirm")` ("Confirm & pay"). Back now calls the same
//   `goToStep("datetime")` the two "Change" links already use, a real navigation, not a dead
//   click (round-1's own BackButton had no onClick at all). Net effect on the discriminator: 0
//   bordered elements, 0 shadowed elements added by the header, so it stays 2 shadow / 0 border
//   as before, header included.
import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import Image from "next/image";
import { motion } from "motion/react";
import { ShieldCheck, Calendar, Clock, Scissors, Star, CreditCard, Store, Check, ChevronLeft } from "lucide-react";
import { useBooking } from "@/lib/booking-context";
import { Avatar, useEnterMotion } from "@/app/[locale]/_components/primitives";
import BookingExitButton from "@/components-legacy/booking/BookingExitButton";
import { effectivePaymentMode } from "@/lib/bookings/payment-mode";
import { formatCurrency } from "@/lib/format-currency";
import type { Salon, StaffMember } from "@/lib/types";
import { Card, SectionTitle, Meta, Price, PrimaryButton, TextLink, TYPE_RAMP, RADIUS, COLOR } from "@/app/[locale]/dev/directions-0905-r2/_kit";

interface PaymentStepLiftReviewProps {
  salon: Salon;
  staff: StaffMember | null;
}

/** Local, kit-token-built helper: the ramp's "14 / row labels" tier at the EMPHASIS weight
 *  (500) rather than the plain body weight (400). The kit ships no component for this exact
 *  use (Meta is 12, Price is 14/15 but currency-only), so per the brief's own escape hatch
 *  ("build it inside your own folder using kit tokens only") this reads its size straight from
 *  tokens.ts's TYPE_RAMP.body rather than writing `text-[14px]` as a literal anywhere below. */
function EmphasisText({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={["font-heading font-semibold text-s-ink", className].filter(Boolean).join(" ")}
      style={{ fontSize: TYPE_RAMP.body.size, lineHeight: TYPE_RAMP.body.lineHeight }}
    >
      {children}
    </span>
  );
}

export default function PaymentStepLiftReview({ salon, staff }: PaymentStepLiftReviewProps) {
  const t = useTranslations("booking");
  const tp = useTranslations("payConfirm");
  const locale = useLocale();
  const { formData, goToStep } = useBooking();

  const cancellationHours = salon.cancellation_window_hours ?? 24;
  const dateLabel = formData.selectedDate
    ? new Intl.DateTimeFormat(locale, { weekday: "short", day: "numeric", month: "long" }).format(formData.selectedDate)
    : "";
  const timeLabel = formData.selectedTime ?? "";
  const totalPrice = formData.totalPrice ?? 0;
  const service = formData.services[0] ?? null;
  const notSetLabel = "Not set";

  // Same salon-payment-fields cast the real PayConfirmStep.tsx uses (values live on the Salon
  // row but not in the base Salon type), same math, verbatim.
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

  // The screen's one 28px anchor: a SENTENCE carrying the fact (FLOORS LAW 6 / LOCKFILE state
  // anchor), never a "Total  CHF x" label+value pair (that pair already exists lower down, in
  // the summary card, at the kit's own Price sizes). Reflects the real, currently-selected
  // amount due right now, branching the same three ways the real screen's CTA does.
  const amountDueNow = paymentMode === "deposit" ? depositAmount : paymentMode === "at_salon" ? (payChoice === "online" ? totalPrice : 0) : totalPrice;
  const payingNow = amountDueNow > 0;
  const anchorAmount = payingNow ? amountDueNow : totalPrice;

  const ctaLabel =
    paymentMode === "at_salon"
      ? tp("confirmBooking")
      : paymentMode === "deposit"
        ? `${tp("payDeposit")} ${formatCurrency(depositAmount, locale)}`
        : `${t("payment.continueToPayment")} ${formatCurrency(totalPrice, locale)}`;

  const summaryMotion = useEnterMotion(0);
  const policyMotion = useEnterMotion(0.05);
  const paymentMotion = useEnterMotion(0.1);

  return (
    <div className="min-h-screen bg-white px-4 pt-3">
      {/* Wizard header (critic open item 3): back / title / exit. Borderless, shadowless (see
          the file-header "Chrome:" note for why BackButton "flat" is not reused as-is), so it
          adds nothing to the LIFT discriminator's border/shadow counts. */}
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          aria-label={t("back")}
          onClick={() => goToStep("datetime")}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full transition-[colors,transform] hover:bg-s-bg-sunken active:scale-[0.94] active:duration-[80ms] active:ease-glide" /* content-image-ok: plain back-navigation icon button (verbatim BookingExitButton.tsx trigger recipe, ChevronLeft swapped for X); the hover tint is a transient state class, not a resting photo/avatar fallback box, so no category icon or initial applies */
        >
          <ChevronLeft size={20} strokeWidth={2.2} className="text-s-ink" aria-hidden />
        </button>
        <EmphasisText className="min-w-0 flex-1 truncate text-center font-semibold">{t("stepTitles.payConfirm")}</EmphasisText>
        <BookingExitButton slug={salon.slug} />
      </div>

      <SectionTitle as="anchor" className="mb-6">
        You&apos;ll pay <span className="tabular-nums">{formatCurrency(anchorAmount, locale)}</span>{" "}
        {payingNow ? "today" : "at the salon"}
      </SectionTitle>

      {/* ONE lifted summary card: salon+stylist, date, time, service, total. No border, no
          internal hairline anywhere inside it -- gap alone separates each fact (LIFT, Part B
          SYSTEM 1's own line for this exact screen). */}
      <motion.div {...summaryMotion}>
        <Card variant="entity" bordered className="p-4">
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
              <EmphasisText className="block truncate">{salon.name}</EmphasisText>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5">
                {salon.average_rating != null && Number(salon.average_rating) > 0 && salon.review_count != null && Number(salon.review_count) > 0 && (
                  <span className="flex items-center gap-1">
                    <Star size={13} className="fill-s-star text-s-star" aria-hidden />
                    <Meta className="font-semibold text-s-ink">{Number(salon.average_rating).toFixed(1)}</Meta>
                    <Meta className="text-s-accent">({salon.review_count})</Meta>
                  </span>
                )}
                {salon.address && <Meta className="truncate">{salon.address}</Meta>}
              </div>
            </div>
          </div>

          {staff && (
            <div className="mt-4 flex items-center gap-2.5">
              <Avatar src={staff.avatar_url} name={staff.name} size={28} />
              <Meta className="truncate">
                {tp("yourStylist")}: <span className="font-semibold text-s-ink">{staff.name}</span>
              </Meta>
            </div>
          )}

          <div className="mt-4 flex items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center text-s-ink-2">
              <Calendar size={20} strokeWidth={2.2} aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <EmphasisText className="block">{dateLabel || notSetLabel}</EmphasisText>
              <Meta>{tp("whenLabel")}</Meta>
            </div>
            {/* critic open item 1: the kit's TextLink has no built-in touch target (its root
                sizes to the 14px text alone); this instance-level className expands the tap
                area to the 44px floor without changing the visible text, per README's own
                "build it inside your own folder using kit tokens only" escape hatch , TextLink
                itself is unmodified, only this call site's className grows. */}
            <TextLink onClick={() => goToStep("datetime")} className="flex h-11 min-w-11 shrink-0 items-center justify-center">
              {tp("changeLabel")}
            </TextLink>
          </div>

          <div className="mt-3 flex items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center text-s-ink-2">
              <Clock size={20} strokeWidth={2.2} aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <EmphasisText className="block tabular-nums">{timeLabel || notSetLabel}</EmphasisText>
              {service?.duration_minutes ? <Meta className="tabular-nums">{service.duration_minutes} min</Meta> : null}
            </div>
            {/* critic open item 1: the kit's TextLink has no built-in touch target (its root
                sizes to the 14px text alone); this instance-level className expands the tap
                area to the 44px floor without changing the visible text, per README's own
                "build it inside your own folder using kit tokens only" escape hatch , TextLink
                itself is unmodified, only this call site's className grows. */}
            <TextLink onClick={() => goToStep("datetime")} className="flex h-11 min-w-11 shrink-0 items-center justify-center">
              {tp("changeLabel")}
            </TextLink>
          </div>

          {service && (
            <div className="mt-3 flex items-center gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center text-s-ink-2">
                <Scissors size={20} strokeWidth={2.2} aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <EmphasisText className="block truncate">{locale === "en" ? service.name_en : service.name_de}</EmphasisText>
                {service.duration_minutes ? <Meta className="tabular-nums">{service.duration_minutes} min</Meta> : null}
              </div>
              <Price amount={service.price} locale={locale} size="row" />
            </div>
          )}

          {/* Total, broken down with the included-VAT line (trust floor: the price is broken
              down). No border-top divider between the two lines: extra vertical gap alone
              stands in for the hairline the round-1 box used, per LIFT's "no internal
              hairlines" rule for this exact card. */}
          <div className="mt-5 flex items-baseline justify-between gap-3">
            <EmphasisText>{tp("totalLabel")}</EmphasisText>
            <Price amount={totalPrice} locale={locale} size="total" />
          </div>
          {salonVatRegistered && vatIncludedAmount > 0 && (
            <div className="mt-2 flex items-baseline justify-between gap-3">
              <Meta>{tp("vatIncl")}</Meta>
              <Meta className="tabular-nums">{formatCurrency(vatIncludedAmount, locale)}</Meta>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Cancellation policy: bare on white between the two cards, above the commit action
          (trust floor). Semantic-colour floor: the s-success ShieldCheck icon. */}
      <motion.div {...policyMotion} className="mt-5 flex items-start gap-2 px-1">
        <ShieldCheck size={14} strokeWidth={1.6} className="mt-[2px] shrink-0 text-s-success" aria-hidden />
        <Meta>{tp("cancellationPolicy", { hours: cancellationHours })}</Meta>
      </motion.div>

      {/* Second card: the payment chooser, tappable as a unit (LIFT's one named exception).
          Internal rows are distinguished by FILL (the system's own selected-pill convention:
          tray fill + a check), never a per-row border, so the fold keeps 0 bordered elements. */}
      <SectionTitle as="heading" className="mb-3 mt-8">
        {tp("paymentEyebrow")}
      </SectionTitle>
      <motion.div {...paymentMotion}>
        <Card variant="entity" className="p-2">
          {paymentMode === "at_salon" ? (
            <div className="flex flex-col gap-1">
              {onlineAvailable && (
                <button
                  type="button"
                  aria-pressed={payChoice === "online"}
                  onClick={() => setPayChoice("online")}
                  className="flex w-full items-center gap-3 p-2 text-left transition-colors"
                  style={{ borderRadius: RADIUS.entityCardPx, backgroundColor: payChoice === "online" ? COLOR.tray : "transparent" }}
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-s-accent-pale">{/* content-image-ok: payment-method icon chip, not a photo fallback (verbatim PayConfirmStep.tsx pay-online row) */}
                    <CreditCard size={20} strokeWidth={2.2} className="text-s-accent" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <EmphasisText className={payChoice === "online" ? "block" : "block font-normal"}>{tp("payOnlineTitle")}</EmphasisText>
                    <Meta className="mt-0.5 block">{tp("payOnlineSub")}</Meta>
                  </span>
                  {payChoice === "online" && <Check size={18} strokeWidth={2.4} className="shrink-0 text-s-ink" aria-hidden />}
                </button>
              )}
              <button
                type="button"
                aria-pressed={payChoice === "in_person"}
                onClick={() => setPayChoice("in_person")}
                className="flex w-full items-center gap-3 p-2 text-left transition-colors"
                style={{ borderRadius: RADIUS.entityCardPx, backgroundColor: payChoice === "in_person" ? COLOR.tray : "transparent" }}
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-s-bg-sunken">{/* content-image-ok: payment-method icon chip, not a photo fallback (verbatim PayConfirmStep.tsx pay-at-salon row) */}
                  <Store size={20} strokeWidth={2.2} className="text-s-ink" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <EmphasisText className={payChoice === "in_person" ? "block" : "block font-normal"}>{tp("payAtSalonTitle")}</EmphasisText>
                  <Meta className="mt-0.5 block">{tp("payAtSalonSub", { amount: formatCurrency(totalPrice, locale) })}</Meta>
                </span>
                {payChoice === "in_person" && <Check size={18} strokeWidth={2.4} className="shrink-0 text-s-ink" aria-hidden />}
              </button>
            </div>
          ) : paymentMode === "deposit" ? (
            <div className="p-2">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <EmphasisText className="block">{tp("depositNow")}</EmphasisText>
                  <Meta>{tp("percentOnline", { percent: depositPct })}</Meta>
                </div>
                <Price amount={depositAmount} locale={locale} size="total" />
              </div>
              <div className="mt-4 flex items-center justify-between gap-3">
                <Meta>{tp("restAtSalon")}</Meta>
                <Price amount={remainingAtSalon} locale={locale} size="row" />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1 p-4 text-center">
              <Meta>{tp("payOnlineNow")}</Meta>
              <Price amount={totalPrice} locale={locale} size="total" />
              <Meta>{tp("fullPrepayment")}</Meta>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Sticky commit bar: the one ink Pay button, kit recipe unchanged. Critic open item 4:
          the bar previously had no edge-visibility treatment at all (no shadow/border/gradient),
          so content scrolling underneath it would have no separation. Fixed with the real,
          shipped sticky-bar recipe this exact screen already ships in production
          (components-legacy/booking/PayConfirmStep.tsx:740, `border-t border-s-border`,
          verbatim), not an invented shadow: LIFT's own token budget already reserves exactly
          one hairline for this (tokens/systems.ts "lift".deltas.card.hairlineCeiling = 1, unused
          until now), and a chrome boundary (the bar's own top edge, not a content divider) is
          the one case SPACING.dividerInset's own comment names as exempt from the 24px inset
          content-hairlines get. Discriminator after the fix: 1 bordered element (this bar), 2
          shadowed elements (the two cards), 0 elements with both, exactly 1 hairline, so
          "shadow count > border count" (2 > 1) and "hairline count <= 1" both still hold. */}
      <div
        className="fixed bottom-0 left-0 right-0 z-20 border-t border-s-border bg-white p-4"
        style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto max-w-2xl">
          <PrimaryButton>{ctaLabel}</PrimaryButton>
        </div>
      </div>

      {/* Content clearance for the fixed bar above, then the 125px bottom spacer so the fold
          measures as it does on the real phone once HideInBooking's stripped BottomNav is
          accounted for (that 125px belongs to the real chrome, not drawn here). */}
      <div className="h-24" aria-hidden />
      <div style={{ height: 125 }} aria-hidden />
    </div>
  );
}
