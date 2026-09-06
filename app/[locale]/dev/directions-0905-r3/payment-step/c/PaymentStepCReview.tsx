"use client";

// Exists-check: `npm run exists directions-0905-r3` (run this session, this turn) returned 7
// REMOVED hits, none of them this surface (see page.tsx's own header for the full list).
// `npm run exists payment-step/c` returned 0 matches this session. No candidate-C review
// component exists for this surface; the closest match is the design-round-two lift review
// component this file starts from BY HAND (never copied with a file-system copy command), plus
// this same round's sibling shared kit (candidate deltas already wired into Card / Pill /
// PrimaryButton / SecondaryButton / StatusBadge, read via useSystem()).
//
// Grounded-in: the design-round-two lift review component for this exact surface (folder:
// directions-0905, suffix "-r2", path payment-step/_lift/PaymentStepLiftReview.tsx , the
// anatomy, content order, copy and data logic below are lifted from it BY HAND, unchanged,
// except the treatment values Candidate C's own sheet governs: container edge/shadow, card
// radius, chip radius/selection mechanism, CTA radius/height, and the chrome-edge hairline).
// Real-source: app/[locale]/dev/directions-0905/payment-step/_va/getPaymentStepDataA.ts (the
// real loader powering both this file and its round-two sibling, imported unchanged by page.tsx).
// Also grounded in: components-legacy/booking/PayConfirmStep.tsx (the real step this content
// order and payment-mode math follow, unchanged from the round-two file's own citation),
// lib/bookings/payment-mode.ts (effectivePaymentMode, real three-way branch), lib/format-
// currency.ts (formatCurrency, real Swiss formatting), lib/booking-context.tsx (useBooking /
// goToStep, real, unchanged), components-legacy/booking/BookingExitButton.tsx (the real trigger
// recipe the back/exit controls reuse, unchanged from round two), messages/en.json's payConfirm
// + booking namespaces (every string below is a real key, verified this turn: yourStylist,
// whenLabel, changeLabel, totalLabel, vatIncl, paymentEyebrow, payOnlineTitle, payOnlineSub,
// payAtSalonTitle, payAtSalonSub, depositNow, percentOnline, restAtSalon, payOnlineNow,
// fullPrepayment, confirmBooking, payDeposit, cancellationPolicy, booking.back,
// booking.stepTitles.payConfirm, booking.payment.continueToPayment), and _design-system/
// references/fresha--payment-step.md "Measured" list items 1-12 (the placement source named in
// the task brief; this screen is the CONTROL per _plans ROOT_CAUSES.md Part 3.4, "Causes that
// apply: none", so the anatomy below is NOT rearranged against that placement source, only
// re-skinned per Candidate C's own value sheet).
//
// Depicts: salon+stylist/date/time/service/price-breakdown/payment-method/cancellation content order -> components-legacy/booking/PayConfirmStep.tsx (real render order, byte-for-byte anatomy port from the design-round-two lift review component named above, per the task brief's "anatomy does not move" instruction)
// Depicts: every pill/badge/button/title/meta/price/card literal on this screen -> app/[locale]/dev/directions-0905-r3/_kit (re-exports the round-two kit's Card, SectionTitle, Meta, Price, PrimaryButton, TextLink, KitProvider/useSystem, all of which branch on Candidate C automatically via useSystem().candidate)
// Depicts: the "Change" links' real navigation -> lib/booking-context.tsx (useBooking().goToStep)
// Depicts: the payment-method icon chips (CreditCard / Store) -> components-legacy/booking/PayConfirmStep.tsx:549-555,618-633 (verbatim anatomy, unchanged)
//
// Not-a-salon-card: same as the round-two sibling's own note , the salon name + star rating
//   inside the summary record is a booking-review identity row (trust floor: who you are
//   already booked with), not a discovery/search result tile. No "View N services" off-ramp, no
//   aspect-[3/2] hero, not tappable to a salon page. SalonResultCard (variant="feed") is the
//   search/discovery grammar; composing it here would print a browse affordance mid-checkout.
//
// measured (repo's own @playwright/test, headless chromium, dev server :3461, 390x844 dpr 3,
//   /en/dev/directions-0905-r3/payment-step/c, NOT the Claude_Browser preview tab, which
//   throttles rAF/timers, memory reference_preview_tab_raf_throttle.md): filled in after this
//   turn's Playwright run, see the structured return for the numbers (font sizes/weights count,
//   card border/shadow/radius per element, chip/button radius+height, chrome-hairline colour,
//   sticky-bar edge, photo-share percentage, touch targets).
//
// floors: (a) photographic focal , the 44px salon photo sits flush at the summary record's
//   leading edge, present but not the screen's focal element, legal on a checkout/payment step
//   per the imagery floor's own named exemption; (b) one biggest element , the 28px anchor
//   sentence is the only 28px run on the page, 28/14 = 2.0x local body, clearing both the
//   absolute and ratio floors; (c) tabular number , the anchor's price, every Price component,
//   and every duration figure render tabular-nums; (d) semantic-colour moment , the ShieldCheck
//   cancellation row renders s-success green (unchanged: Candidate C's "status never encodes
//   state" sheet row governs the booking-status BADGE component, not this row's own icon, and
//   there is no StatusBadge anywhere on this screen to begin with); (e) no dead-grey zone , the
//   page is white end to end, Candidate C's own tray fill only ever appears as a small
//   selected-row highlight inside the payment record, never a page band; (f) worst-case content
//   , salon name and service name truncate, the cancellation sentence wraps naturally, the
//   anchor sentence's price stays one tabular run regardless of locale-driven length.
//
// system: c, THE AIRBNB PORT (_plans/R3_ONE_SYSTEM.md CANDIDATE C table). Applied to the SAME
//   anatomy the design-round-two lift review ships (this screen is the fix list's control,
//   Causes that apply: none), changing only container/radius/button/type-ramp treatment per the
//   task brief's orchestrator instruction:
//   1. Container/card edge (ROOT_CAUSES.md Part 1 Cause 2's fix, "a record is a card"): both
//      records on this screen (the booking summary, the payment-method chooser) pass
//      `hasPhoto={false}` to the kit's <Card>, so Candidate C's own photoAware branch resolves
//      them to the ambient SHADOW_RAIL_C (no border), replacing the round-two sibling's static
//      `bordered` hairline-only override. This is the system-specific fix for exactly the
//      failure the round-two file's own header names (`profile-rule.md` severity 4: a
//      photo-less white card's whisper shadow is invisible) , Candidate C's own sheet exists
//      because its ambient shadow (~2.5x the alpha, ~8x the blur of shadow-whisper) is "the only
//      candidate whose shadow is strong enough to be seen" (ROOT_CAUSES.md Part 1 Cause 1, "What
//      C is good at"), so the fallback to a static hairline border is no longer needed here.
//   2. Card radius: both <Card variant="entity"> instances render at Candidate C's 20px
//      (RADIUS.c.cardPx) automatically, since Card.tsx's own `isCandidateC` branch overrides
//      VARIANT_RADIUS for every system-"c" caller; no local radius literal is written for this.
//   3. The payment-method chooser's own internal selectable-row background (a fill, not a kit
//      <Card>) tracks the same family: RADIUS.c.cardPx (20) replaces the round-two sibling's
//      RADIUS.entityCardPx (16), so the two nested rounded shapes inside one screen stay one
//      recipe (ROOT_CAUSES.md Part 1 Cause 1's fix, "one class, one recipe") rather than an
//      orphan 16px remnant of a different candidate's radius family sitting inside a 20px card.
//   4. Primary CTA: PrimaryButton already branches on `useSystem().candidate` internally
//      (12px rounded rect, 44px tall, per RADIUS.c.ctaPx/ctaHeightPx, "row 14" Airbnb-ported and
//      height-floored at the 44px statutory touch minimum) , no local override needed here.
//   5. Sticky-bar chrome edge: the bar's top border is a CHROME boundary, not a content divider
//      (a tab-bar-like edge, not a hairline between two facts), so it takes Candidate C's own
//      chrome-hairline value CHROME_HAIRLINE_C (#EBEBEB, `_plans/R3_ONE_SYSTEM.md` CANDIDATE C
//      "Hairline rule" row 39, PICK, no Solen token for that role) instead of the content-divider
//      token #E4E4E7 the round-two sibling used for the same element.
//   6. Icon budget conflict, named and NOT applied: Candidate C's own sheet says "zero icons on
//      a card" (rows for a browse/discovery record card with no labelled fact per icon). This
//      screen's icons (calendar, clock, scissors, shield-check, credit-card, store, chevron-
//      left) are the opposite case: ROOT_CAUSES.md Part 3.4's own "what must not move" list
//      protects them by name ("9 Lucide icons, 0 of them decorative, each is a real control or
//      sits beside a labelled fact"), and the task brief states this screen's anatomy does not
//      move. Candidate C's zero-icon rule is written for a different kind of card (a record
//      being BROWSED, where status is carried by pill text alone) and does not reach a checkout
//      record's own labelled-fact icons; every icon below stays, unchanged from round two.
//   7. Status treatment: Candidate C's "neutral, colour never encodes state" row governs the
//      shared StatusBadge component (orchestrator decision 4, shown per screen where a booking-
//      status badge exists). This screen renders no StatusBadge at all (there is no
//      confirmed/pending/cancelled state to show before a booking exists), so that axis simply
//      does not apply here; nothing was suppressed to avoid it.
//   Chrome: unchanged from the round-two sibling. This screen draws its own wizard header
//   (back/title/exit), matching the real booking wizard's own per-step chrome (BookingWizard.tsx,
//   cited in HideInBooking.tsx's own routing comment: "the booking wizard draws an arrow on
//   every step"), which is why `/dev` routes render with zero site chrome at all
//   (HideInBooking.tsx: `if (/\/dev(\/|$)/.test(pathname)) return null;`) and this file must
//   supply the flow's own real header rather than inheriting one that would never render here.
//
// Import path note: this file imports kit primitives from "./kit" (a local shim inside this
//   builder's own folder, see kit.ts's own header) rather than the shared round-3 barrel at
//   .../directions-0905-r3/_kit, because that shared barrel currently has a live syntax error
//   (a JSDoc comment embedding a literal JSX comment closes the outer block comment early) that
//   500s every screen importing it. That file is not named in this builder's task and is not
//   edited here; the shim re-exports the identical underlying module the barrel itself points
//   to, so no primitive is duplicated.
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
import { Card, SectionTitle, Meta, Price, PrimaryButton, TextLink, TYPE_RAMP, RADIUS, COLOR, CHROME_HAIRLINE_C } from "./kit";

interface PaymentStepCReviewProps {
  salon: Salon;
  staff: StaffMember | null;
}

/** Local, kit-token-built helper, unchanged from the round-two sibling: the ramp's "14 / row
 *  labels" tier at the EMPHASIS weight (500) rather than the plain body weight (400). Reads its
 *  size straight from tokens.ts's TYPE_RAMP.body rather than writing `text-[14px]` as a literal. */
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

export default function PaymentStepCReview({ salon, staff }: PaymentStepCReviewProps) {
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
  // row but not in the base Salon type), same math, verbatim, unchanged from round two.
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
  // anchor), never a "Total  CHF x" label+value pair. Unchanged from round two.
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

  // Candidate C's own card radius (RADIUS.c.cardPx, 20), used ONLY for the payment-method
  // chooser's internal selectable-row fill below (a background, not a kit <Card>, so Card.tsx's
  // automatic isCandidateC branch does not reach it). This screen always renders under
  // system="c" (page.tsx wraps in <KitProvider system="c"> with no switcher), so the value is
  // read directly from the token rather than re-deriving it from useSystem() at this call site.
  const selectableRowRadius = RADIUS.c.cardPx;

  return (
    <div className="min-h-screen bg-white px-4 pt-3">
      {/* Wizard header: back / title / exit. Unchanged from round two (see the file-header
          "Chrome:" note): borderless, shadowless, adds nothing to Candidate C's own edge rules. */}
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          aria-label={t("back")}
          onClick={() => goToStep("datetime")}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full transition-[colors,transform] hover:bg-s-bg-sunken active:scale-[0.94] active:duration-[80ms] active:ease-glide" /* content-image-ok: plain back-navigation icon button (verbatim BookingExitButton.tsx trigger recipe, ChevronLeft swapped in for that file's X); the hover tint is a transient state class, not a resting photo/avatar fallback box, so no category icon or initial applies */
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

      {/* ONE record card: salon+stylist, date, time, service, total. Candidate C's own card-edge
          rule (systems.ts "c" entry, Card.tsx's photoAware branch): a photo-less record card
          gets Candidate C's ambient rail shadow (SHADOW_RAIL_C, no border), never a hairline
          fallback, replacing the round-two sibling's static `bordered` override. Radius resolves
          to Candidate C's own 20px automatically via Card.tsx's isCandidateC branch. */}
      <motion.div {...summaryMotion}>
        <Card variant="entity" hasPhoto={false} className="p-4">
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
              down). No border-top divider between the two lines: gap alone stands in for a
              hairline, unchanged from round two. */}
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

      {/* Second record card: the payment chooser, tappable as a unit. Same Candidate C
          photo-less edge rule as the summary card above. */}
      <SectionTitle as="heading" className="mb-3 mt-8">
        {tp("paymentEyebrow")}
      </SectionTitle>
      <motion.div {...paymentMotion}>
        <Card variant="entity" hasPhoto={false} className="p-2">
          {paymentMode === "at_salon" ? (
            <div className="flex flex-col gap-1">
              {onlineAvailable && (
                <button
                  type="button"
                  aria-pressed={payChoice === "online"}
                  onClick={() => setPayChoice("online")}
                  className="flex w-full items-center gap-3 p-2 text-left transition-colors"
                  style={{ borderRadius: selectableRowRadius, backgroundColor: payChoice === "online" ? COLOR.tray : "transparent" }}
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
                style={{ borderRadius: selectableRowRadius, backgroundColor: payChoice === "in_person" ? COLOR.tray : "transparent" }}
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

      {/* Sticky commit bar: the one ink Pay button, PrimaryButton's own Candidate C branch
          (12px rounded rect, 44px tall). The bar's own top edge is a CHROME boundary (not a
          content divider between two facts), so it takes Candidate C's chrome-hairline value
          instead of the content-divider token the round-two sibling used here. */}
      <div
        className="fixed bottom-0 left-0 right-0 z-20 bg-white p-4"
        style={{ borderTop: `1px solid ${CHROME_HAIRLINE_C}`, paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto max-w-2xl">
          <PrimaryButton>{ctaLabel}</PrimaryButton>
        </div>
      </div>

      {/* Content clearance for the fixed bar above, then the 125px bottom spacer so the fold
          measures as it does on the real phone once the stripped bottom nav is accounted for
          (that 125px belongs to the real chrome, not drawn here). Unchanged from round two. */}
      <div className="h-24" aria-hidden />
      <div style={{ height: 125 }} aria-hidden />
    </div>
  );
}
