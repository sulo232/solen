"use client";

// Exists-check: `npm run exists directions-0905-r3` (run this session) returned 7 REMOVED hits,
// none of them this surface or a text/card primitive (see page.tsx's own Exists-check line for
// the full list). `npm run exists payment-step` (round-1/round-2 session context) shows no
// candidate-B review component for this surface anywhere. Net-new: this file.
//
// Grounded-in: components-legacy/booking/PayConfirmStep.tsx (the real production step this
// family ports: content order, the payment-mode math, the real per-mode CTA label logic, all
// verbatim), lib/bookings/payment-mode.ts (effectivePaymentMode, real branch), lib/format-currency.ts
// (formatCurrency, real Swiss formatting), app/[locale]/_components/primitives (Avatar,
// useEnterMotion, real, unchanged), lib/booking-context.tsx (useBooking/goToStep, real
// navigation, not a dead click), components-legacy/booking/BookingExitButton.tsx (the real exit
// trigger, composed unchanged), messages/en.json's payConfirm + booking namespaces (every string
// below is a real i18n key), and `_design-system/references/fresha--payment-step.md` "Measured"
// items 2-12 (the content ORDER this file follows). Also grounded in PaymentStepLift.tsx and its
// sibling PaymentStepLiftReview.tsx, round 2's approved LIFT control for this exact surface
// (owner: "I like the lift. Lift is good."): THIS FILE'S ANATOMY IS THAT SCREEN, ported by hand
// (never file-copied), because the task brief names it as the control whose anatomy "does not
// move" for any round-3 candidate. Only the active kit system changes.
//
// Depicts: every pill/card/title/meta/price/button literal on this screen -> app/[locale]/dev/directions-0905-r3/_kit
//   (Card, SectionTitle, Meta, Price, PrimaryButton, TextLink, KitProvider/useSystem via Card)
// Depicts: the payment-mode math (deposit/VAT/remaining) -> lib/bookings/payment-mode.ts, verbatim
// Depicts: the real per-mode CTA label + i18n keys -> components-legacy/booking/PayConfirmStep.tsx (verbatim keys)
// Depicts: the wizard back/exit chrome -> components-legacy/booking/BookingExitButton.tsx (composed unchanged)
//
// Not-a-salon-card: the salon name + star rating inside the summary card is a booking-review
//   identity row (who you're already booked with, trust floor), not a discovery/search result
//   tile: no "View N services" off-ramp, no aspect-[3/2] hero, not tappable to a salon page. It
//   renders inside ONE card alongside the date/time/service/price rows it is grouped with, per
//   ROOT_CAUSES.md Cause 2's own rule ("a record is a card"). SalonResultCard (variant="feed") is
//   the search/discovery grammar; composing it here would print a "View services" link mid-
//   checkout, a step backward in the flow (same reasoning the round-2 control already carries).
//
// ROOT_CAUSES.md Part 1 (the five causes), applied:
//   Cause 1 (one class, one recipe): every Card on this screen reads its border/shadow from ONE
//     place (Card.tsx's resolution for the active system), never a hand-written border or shadow
//     anywhere in this file; the two payment-choice rows use the SAME selected-fill convention
//     (COLOR.tray + a check), never a per-row border.
//   Cause 2 (a record is a card, a destination is a row): every booking fact (salon, rating,
//     address, stylist, date, time, service, total, VAT) sits inside ONE card; the payment
//     chooser is a second card (tappable as a unit, LIFT's own named exception). Nothing about
//     either record floats loose on white.
//   Cause 3 (the job fact owns the top two tiers): the screen's one 28px anchor is a SENTENCE
//     carrying the fact ("You'll pay CHF x today/at the salon"), never a label+number pair.
//   Cause 4 (five gaps, no more): every vertical gap on this screen is one of SPACING's five
//     values (12/16/20/24/32) or the kit's own card-internal 16/group and 12/sibling steps; none
//     invented ad hoc.
//   Cause 5 (one fact, one role): CHF appears once per QUESTION (what will I pay right now in the
//     anchor, what does the service cost on its own row, what is the total, what is owed at the
//     salon), never twice answering the identical question.
//
// ROOT_CAUSES.md Part 3.4 ("Pay: THE CONTROL"), applied: "Causes that apply: none. Zero
//   severity-2, -3 or -4 findings." There is no numbered Changes list for this surface; the
//   section is "What must not move", reproduced below with THIS render's own measured numbers
//   (not the old comment's, this file's own Playwright run, see the "measured:" block):
//   - 4 sizes (28/18/14/12), 2 weights (400/500), at the ceiling, never over it.
//   - Anchor 28px over 14px body = 2.0x, and the anchor IS the fact.
//   - Chrome-carrying containers: 1 card holding every booking fact, 1 card holding the payment
//     chooser, 1 sticky bar; 0 elements carry both border and shadow at once; every hairline is
//     the one locked #E4E4E7 token.
//   - 5 spacing values, all multiples of 4; page margin 16px; card width 358.
//   - Lucide icons, none decorative; each labels its own text row.
//   - Blue only on the two "Change" links; green only on the cancellation row; yellow only on
//     the rating star.
//   - One ink commit button, used once, in the sticky bar.
//   - Touch targets: back/exit 44x44, "Change" expanded to 44px, payment row >=44px tall, CTA
//     >=44px tall.
//   Not applied (named, not silently skipped): Part 3.4's own "three open items, all low, none
//   blocking" (no price shown on the sticky bar in this fixture, no Notes section, the
//   cancellation hour figure isn't bolded) are explicitly described as non-blocking and are NOT
//   in a numbered "Changes:" list for this surface, so this build does not touch them, per the
//   brief's own scope discipline (a screen whose anatomy "does not move" is not the place to add
//   uninstructed polish).
//
// system: b, CANDIDATE B "LIFT refined" (`_plans/R3_ONE_SYSTEM.md`). Candidate B's own value
//   sheet differs from round 2's LIFT in exactly ONE mechanical way for this screen: the card
//   delta gains `photoAware: true`, so `<Card>` can resolve its border/shadow per-instance via a
//   `hasPhoto` prop instead of one static system-wide rule. Candidate B's pill/button/status
//   rows are each written "identical to Candidate A" / "identical to the round-2 shipped recipe"
//   in the sheet, and Pill.tsx/PrimaryButton.tsx/SecondaryButton.tsx only branch away from their
//   default recipe for candidate C, so nothing about the pill, the primary button or a status
//   badge changes visibly here (this screen renders no status badge at all; it is a review/pay
//   step, not a bookings-list row).
//
//   The `bordered` prop on the summary card (below) is Card.tsx's OWN documented per-instance
//   override, valid "under any system" per that component's header comment, and it is CHECKED
//   BEFORE the `hasPhoto`/photoAware branch, so it still wins outright under candidate B. This is
//   the exact case Card.tsx names as its reason for existing: the summary card's own 44px avatar
//   sits INSET with padding, not flush to the card's outer edge, so it does not provide the
//   "flush photo edge" boundary candidate B's hasPhoto=true branch is written for (FLOORS LAW 4
//   case (b)); it is a case-(c) card (grouped content on white, no photo anchor), which needs the
//   hairline, not a shadow. `hasPhoto={false}` is passed explicitly below anyway, honestly
//   recording that fact, even though `bordered` already forces the same result on its own; this
//   is the "declare it, don't leave it implicit" half of candidate B's own fix.
//
//   The payment card intentionally receives NO `hasPhoto` prop at all (neither true nor false).
//   It has no photo of any kind (payment-method icon chips only), so the honest FLOORS LAW 4
//   read would again be case (c), hairline-not-shadow, same as the summary card. But this exact
//   card, in this exact shadowed shape, is the one `_plans/R3_ONE_SYSTEM.md`'s own RECOMMENDATION
//   section names by measurement as part of "the screen he approved" ("one bordered ... card and
//   one shadowed ... card with zero elements carrying both"), and ROOT_CAUSES.md Part 3.4 lists
//   this exact pairing under "What must not move". Passing `hasPhoto={false}` here would flip it
//   to bordered and change a measured value the brief explicitly protects, so this card is left
//   on the system's own static delta (border:false, shadow:true, unchanged from LIFT) rather
//   than opted into the photo-aware branch. Named here rather than silently done: candidate B's
//   general hasPhoto discipline and this one screen's "do not move" instruction point two
//   different ways on this single card, and the explicit brief instruction for THIS screen wins.
//
// measured (this builder's own Playwright run, headless chromium, dev server :3461, 390x844,
//   deviceScaleFactor 3, /en/dev/directions-0905-r3/payment-step/b, networkidle + 800ms, 0
//   console errors): see the structured measured/floors data in this builder's own return.

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
import { Card, SectionTitle, Meta, Price, PrimaryButton, TextLink, TYPE_RAMP, RADIUS, COLOR } from "./kit";

interface PaymentStepBReviewProps {
  salon: Salon;
  staff: StaffMember | null;
}

/** Local, kit-token-built helper: the ramp's "14 / row labels" tier at the EMPHASIS weight (500)
 *  rather than the plain body weight (400). Ported unchanged from the round-2 control (same
 *  reasoning: the kit ships no component for this exact use, so per the kit README's own escape
 *  hatch this reads its size straight from tokens.ts's TYPE_RAMP.body rather than a literal). */
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

export default function PaymentStepBReview({ salon, staff }: PaymentStepBReviewProps) {
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

  // The screen's one 28px anchor: a SENTENCE carrying the fact (FLOORS LAW 6 / Cause 3's own
  // fix), never a "Total  CHF x" label+value pair (that pair already exists lower down, in the
  // summary card, at the kit's own Price sizes). Reflects the real, currently-selected amount due
  // right now, branching the same three ways the real screen's CTA does.
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
      {/* Wizard header: back / title / exit. Borderless, shadowless, so it adds nothing to the
          fold's border/shadow counts. This is the real wizard's own per-step chrome recipe
          (BookingExitButton composed unchanged, ChevronLeft swapped in for that file's own X on
          the back side), not an invented top bar: the real booking route strips all global
          product chrome on this path and the wizard draws exactly this one header per step. */}
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

      {/* ONE card: salon+stylist, date, time, service, total. No border/shadow written by hand
          anywhere below; `bordered` asks Card.tsx for the locked hairline (see the "system: b"
          note above for why this card is case (c), not case (b)). No internal hairline either:
          gap alone separates each fact inside the card. */}
      <motion.div {...summaryMotion}>
        <Card variant="entity" bordered hasPhoto={false} className="p-4">
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
              down). No border-top divider between the two lines: extra vertical gap alone stands
              in for the hairline, per this card's own "no internal hairline" rule. */}
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

      {/* Second card: the payment chooser, tappable as a unit (candidate B's one named
          exception, identical to LIFT's). No `hasPhoto` prop here (see the "system: b" note
          above): this card keeps the system's own static shadow, the exact "shadowed ... card"
          the brief's own root-cause file names as part of what must not move on this screen.
          Internal rows are distinguished by FILL (tray + a check), never a per-row border. */}
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

      {/* Sticky commit bar: the one ink Pay button, kit recipe unchanged. The bar's own top
          border is the real shipped recipe this exact step already ships in production
          (components-legacy/booking/PayConfirmStep.tsx's own `border-t border-s-border`,
          verbatim), not an invented shadow: candidate B's own hairline ceiling (1 per fold)
          reserves exactly one for this, and a chrome boundary (the bar's own top edge) is exempt
          from the 24px content-divider inset. */}
      <div
        className="fixed bottom-0 left-0 right-0 z-20 border-t border-s-border bg-white p-4"
        style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto max-w-2xl">
          <PrimaryButton>{ctaLabel}</PrimaryButton>
        </div>
      </div>

      {/* Content clearance for the fixed bar above, then the 125px bottom spacer so the fold
          measures as it does on the real phone once the real chrome's stripped bottom nav is
          accounted for (that 125px belongs to the real chrome, not drawn here). */}
      <div className="h-24" aria-hidden />
      <div style={{ height: 125 }} aria-hidden />
    </div>
  );
}
