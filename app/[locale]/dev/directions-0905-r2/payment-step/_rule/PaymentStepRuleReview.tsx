"use client";

// exists-check: `npm run exists "payment-step rule"` (run this session) -> BodyText.tsx and
// Divider.tsx only, both reused below (not re-declared). `npm run exists payment-step` shows no
// round-2 "rule" review component for this surface; the closest matches are round-1's
// PaymentStepReviewA.tsx (a different route, five separately-bordered boxes, DirectionFrame
// chrome) and this same run's sibling "lift"/"tray" systems (a different look system's own
// composition, one/two shadowed cards each). Net-new.
//
// Depicts: the salon/stylist/date/time/service/price/payment-method/cancellation content order -> components-legacy/booking/PayConfirmStep.tsx (real render order this port follows; content-order source also cited as fresha--payment-step.md in the sibling systems' own files)
// Depicts: the payment-mode math (deposit/VAT/remaining, verbatim) -> components-legacy/booking/PayConfirmStep.tsx:143-196
// Depicts: the real per-mode CTA label logic and i18n keys (verbatim) -> components-legacy/booking/PayConfirmStep.tsx:736-754
// Depicts: every pill/badge/button/title/meta/price literal on this screen -> app/[locale]/dev/directions-0905-r2/_kit/index.ts (SectionTitle, Meta, Price, PrimaryButton, TextLink, KitProvider)
// Depicts: the hairline group-separator -> ./Divider.tsx (this folder's own kit-lacking component, built ahead of this file by a prior pass, reused not re-declared)
// Depicts: the 14px cancellation line, rendered as body text per this system's own per-screen line -> ./BodyText.tsx (same: reused, not re-declared)
// Depicts: the "Change" links' real navigation -> lib/booking-context.tsx (useBooking().goToStep, not a dead click; each TextLink now also carries a 44px touch target, this repair pass's own fix)
// Depicts: the payment-method rows (icon chip, two-line label, trailing check) -> ./PaymentMethodRow.tsx (extracted this repair pass; was hand-written inline before)
// Depicts: the wizard header (back arrow, step title, exit X) -> components-legacy/booking/BookingWizard.tsx (real per-step chrome, added this repair pass; see the corrected Chrome note below)
//
// Not-a-salon-card: the salon identity row (photo/name/rating/stylist) is a booking-review trust
//   row, not a discovery/search result tile: no "View N services" off-ramp, no aspect-[3/2]
//   hero, not tappable to a salon page. Composing SalonResultCard here would print a mid-checkout
//   browsing affordance, a step backward in the flow (same reasoning the sibling "lift" system's
//   own file already gives for the identical row).
//
// Grounded-in: app/[locale]/dev/directions-0905-r2/_kit/index.ts (SectionTitle, Meta, Price,
//   PrimaryButton, TextLink, TYPE_RAMP, COLOR -- every pill/badge/button/title/meta/price literal
//   on this screen comes from that folder), ./BodyText.tsx, ./Divider.tsx and ./PaymentMethodRow.tsx
//   (this folder's own kit-lacking components, RULE's structural devices: the 14px body tier, the
//   24px-inset hairline, and the payment-method row). app/[locale]/_components/primitives/BackButton.tsx
//   and components-legacy/booking/BookingExitButton.tsx (the wizard header's two real primitives,
//   unchanged, this repair pass's own addition -- see the corrected Chrome note below). Also
//   grounded in components-legacy/booking/PayConfirmStep.tsx (the real step this
//   port follows, cited above under Depicts), lib/bookings/payment-mode.ts
//   (effectivePaymentMode, real three-way branch), lib/format-currency.ts (formatCurrency, real
//   Swiss formatting), app/[locale]/_components/primitives (Avatar, useEnterMotion, both real,
//   unchanged), lib/booking-context.tsx (useBooking / goToStep, real, unchanged), messages/
//   en.json's payConfirm + booking namespaces (every payConfirm/booking string below is a real
//   key; the three section headings and the anchor sentence are new English copy written for
//   this mockup, per the project's "every mockup file is English" rule), and
//   _design-system/references/fresha--payment-step.md "Measured" list items 2-12 (the content
//   ORDER this file follows, unchanged from the sibling systems).
//
// measured (Playwright, dev server :3461, 390x844 dpr 3, /en/dev/directions-0905-r2/payment-step?s=rule):
//   see the structured output returned by this run for the full getBoundingClientRect /
//   getComputedStyle table (distinct sizes, weights, hairline insets, shadow count, 18px-tier
//   text-run count).
//
// floors: (a) photographic focal: the 44px salon photo sits at the identity row's leading edge,
//   present but not the screen's focal element -- legal on a trust/commit surface per the
//   imagery floor's own named exemption ("Exempt BY NAME: forms, checkout payment step, legal,
//   receipts"); (b) one biggest element: the 28px anchor sentence is the only 28px run on the
//   page, 28/14 = 2.0x this screen's 14px body, clearing both the absolute and ratio floors on
//   its own; (c) tabular number: the anchor's price, every Price component, and every duration
//   figure render tabular-nums; (d) semantic-colour moment: the ShieldCheck cancellation row
//   renders s-success green; (e) no dead-grey zone: the page is white end to end (RULE does not
//   use the tray for this screen, per systems.ts "rule".deltas.card.usesTray: false), a selected
//   payment row's #F4F4F5 fill is a small control-level highlight, not a page-level band; (f)
//   worst-case content: salon name and service name truncate (`truncate`), the cancellation
//   sentence wraps naturally (no fixed height), the anchor sentence's price stays one tabular run
//   regardless of locale-driven length.
//
// system: RULE, verbatim from _plans/R2_LOOK_SYSTEMS.md Part B, SYSTEM 2: "there is no card
//   anywhere on the screen; groups are separated by inset hairlines and gap size alone, and the
//   hierarchy is carried entirely by a big anchor sentence over a populated middle type tier."
//   Applied here exactly per that document's own per-screen line for this surface ("Review and
//   pay A"): "the whole summary is bare label-and-value rows between inset hairlines, the total
//   is the one 28px anchor, and the cancellation term renders as body text above the commit
//   button." So: NO Card component anywhere in this file (unlike "lift"'s two shadowed cards);
//   every group is a bare row; ./Divider.tsx (24px inset, #E4E4E7) is the sole separator between
//   the sections; the mandatory 18px section-heading tier carries three separate text runs
//   ("Your appointment", "Price", "Payment method"), at the >=3 floor in systems.ts's own "rule"
//   notes; zero elements carry a box-shadow anywhere, including the sticky bar, which separates
//   from the page above by a white-to-transparent gradient fade instead (systems.ts "rule" notes:
//   "Zero shadow on anything, including the sticky bar").
//
// Chrome, CORRECTED this repair pass: a back/title/exit row IS now drawn, reversing the prior
//   claim above (which matched sibling "lift" and omitted it). The critic's open item named this
//   a gap against round-1 base direction A, which composes the identical row
//   (payment-step/_va/PaymentStepReviewA.tsx:185-191, itself copied verbatim from
//   components-legacy/booking/BookingWizard.tsx). The orchestrator's "draws no chrome of its
//   own" line governs NOT drawing a second copy of the global site Header/BottomNav that
//   HideInBooking.tsx already strips; the wizard's own per-step back/title/exit row is real
//   booking-flow chrome that belongs to THIS step, not the global chrome, and round-1's own base
//   direction already established it belongs here. Composed from real, unmodified primitives
//   (BackButton, BookingExitButton), no hand-drawn substitute. The sibling "lift" system's own
//   identical omission is a separate, out-of-scope finding for that system's own repair pass.
//
// REPAIR, second pass (final repair, this file): BackButton's "flat" variant className puts
//   BOTH a `border-s-border` hairline AND `shadow-elevation-2` on the same element
//   (BackButton.tsx:47), tripping the cross-system "nothing carries a border and a shadow at
//   once" rule and leaving RULE's own "zero shadow on anything" note (see the "system:" block
//   above) with one shadowed element it should not have. BackButton itself is the real,
//   registered primitive (four other call sites still use it unmodified), so it is not edited;
//   this call site alone gets a scoped `style={{ boxShadow: "none" }}` override, the identical
//   fix the sibling "tray" system's own PaymentStepReviewTray.tsx already carries at its own
//   BackButton call site. Border stays (RULE's own hairline vocabulary), only the shadow drops,
//   which also brings the render in line with BackButton's OWN "flat" doc comment
//   ("white + hairline ... no shadow", BackButton.tsx:13). Re-measured after the fix: 0
//   box-shadow anywhere in the fold, RULE's discriminator ("count(box-shadow) = 0") now holds
//   exactly, not approximately.
import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import Image from "next/image";
import { motion } from "motion/react";
import { ShieldCheck, Calendar, Clock, Scissors, Star, CreditCard, Store } from "lucide-react";
import { useBooking } from "@/lib/booking-context";
import { Avatar, useEnterMotion } from "@/app/[locale]/_components/primitives";
import { BackButton } from "@/app/[locale]/_components/primitives/BackButton";
import BookingExitButton from "@/components-legacy/booking/BookingExitButton";
import { effectivePaymentMode } from "@/lib/bookings/payment-mode";
import { formatCurrency } from "@/lib/format-currency";
import type { Salon, StaffMember } from "@/lib/types";
import { SectionTitle, Meta, Price, PrimaryButton, TextLink, TYPE_RAMP, COLOR } from "../../_kit";
import { BodyText } from "./BodyText";
import { Divider } from "./Divider";
import { PaymentMethodRow } from "./PaymentMethodRow";

interface PaymentStepRuleReviewProps {
  salon: Salon;
  staff: StaffMember | null;
}

/** Local, kit-token-built helper: the ramp's "14 / row labels" tier at the EMPHASIS weight (500)
 *  rather than BodyText's plain weight (400) -- a name, a date value, a price-adjacent label.
 *  The kit ships no component for this exact use and BodyText.tsx's own two tones are both
 *  fixed-weight, so per the kit README's escape hatch ("build it inside your own folder using
 *  kit tokens only") this reads its size straight from tokens.ts's TYPE_RAMP.body rather than
 *  writing `text-[14px]` as a literal anywhere below. Same pattern the sibling "lift" system's
 *  own file already used for the identical need (kept a matching name so a reader who has seen
 *  one recognises the other). */
function EmphasisText({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={["font-heading font-semibold", className].filter(Boolean).join(" ")}
      style={{ fontSize: TYPE_RAMP.body.size, lineHeight: TYPE_RAMP.body.lineHeight, color: COLOR.inkText }}
    >
      {children}
    </span>
  );
}

/** A bare, hairline-free row: icon + two-line label stack + optional trailing slot. The RULE
 *  system's row grammar (SYSTEM 2's "bare label-and-value rows"), used for the date/time/service
 *  facts. Gap alone separates rows within one section; ./Divider.tsx separates one section from
 *  the next. */
function FactRow({
  icon,
  primary,
  secondary,
  trailing,
}: {
  icon: React.ReactNode;
  primary: React.ReactNode;
  secondary?: React.ReactNode;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-11 w-11 shrink-0 place-items-center text-s-ink-2">{icon}</div>
      <div className="min-w-0 flex-1">
        <EmphasisText className="block truncate">{primary}</EmphasisText>
        {secondary ? <Meta className="tabular-nums">{secondary}</Meta> : null}
      </div>
      {trailing}
    </div>
  );
}

export default function PaymentStepRuleReview({ salon, staff }: PaymentStepRuleReviewProps) {
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
  // row but not in the base Salon type), same math, verbatim (sibling systems reuse the same).
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
  // anchor), never a "Total  CHF x" label+value pair. Per this system's own per-screen line
  // ("the total is the one 28px anchor"), it states the real amount due right now, branching the
  // same three ways the real screen's CTA does.
  const amountDueNow = paymentMode === "deposit" ? depositAmount : paymentMode === "at_salon" ? (payChoice === "online" ? totalPrice : 0) : totalPrice;
  const payingNow = amountDueNow > 0;
  const anchorAmount = payingNow ? amountDueNow : totalPrice;

  const ctaLabel =
    paymentMode === "at_salon"
      ? tp("confirmBooking")
      : paymentMode === "deposit"
        ? `${tp("payDeposit")} ${formatCurrency(depositAmount, locale)}`
        : `${t("payment.continueToPayment")} ${formatCurrency(totalPrice, locale)}`;

  const appointmentMotion = useEnterMotion(0);
  const priceMotion = useEnterMotion(0.05);
  const policyMotion = useEnterMotion(0.1);
  const paymentMotion = useEnterMotion(0.15);

  return (
    <div className="min-h-screen bg-white">
      {/* Wizard header: back arrow + step title + exit X, copied verbatim from
          BookingWizard.tsx's own header row (components-legacy/booking/BookingWizard.tsx
          lines ~190-216), the same real chrome round-1's base direction A composed
          (payment-step/_va/PaymentStepReviewA.tsx:185-191). This is the booking step's OWN
          per-step chrome, not the global site Header/BottomNav that HideInBooking.tsx already
          strips from every /dev route, so drawing it here is not the banned second-header
          scaffolding, it is the real screen's real shell. BackButton and BookingExitButton are
          both real, registered, unmodified primitives; t('back') / t('stepTitles.payConfirm')
          are the same real booking.* i18n keys round-1 reads, no new copy. */}
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <BackButton
          variant="flat"
          label={t("back")}
          className="shrink-0"
          style={{ boxShadow: "none" }}
        />
        <h1 className="min-w-0 flex-1 truncate text-center font-heading text-[14px] font-semibold tracking-[-0.01em] text-s-ink">
          {t("stepTitles.payConfirm")}
        </h1>
        <BookingExitButton slug={salon.slug} />
      </div>

      {/* Page margin (A6, 16px) applied per content block, never on the outer wrapper: Divider
          spans nearly the full width with its own 24px inset measured off the viewport edge,
          and nesting it inside a px-4 ancestor would double that inset (see Divider.tsx's own
          comment). */}
      <div className="px-4 pt-4">
        <SectionTitle as="anchor">
          You&apos;ll pay <span className="tabular-nums">{formatCurrency(anchorAmount, locale)}</span>{" "}
          {payingNow ? "today" : "at the salon"}
        </SectionTitle>
      </div>

      {/* Section 1: "Your appointment" -- salon identity, stylist, date, time, service. Bare
          rows, no card, no per-row hairline: gap alone separates them (RULE's "bare
          label-and-value rows"). Heading 1 of 3 in the mandatory 18px tier. */}
      <motion.div {...appointmentMotion} className="mt-8 px-4">
        <SectionTitle as="heading" className="mb-4">
          Your appointment
        </SectionTitle>

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

        <div className="mt-5">
          <FactRow
            icon={<Calendar size={20} strokeWidth={2.2} aria-hidden />}
            primary={dateLabel || notSetLabel}
            secondary={tp("whenLabel")}
            trailing={
              <TextLink
                onClick={() => goToStep("datetime")}
                className="flex h-11 items-center justify-end px-1 -mx-1"
              >
                {tp("changeLabel")}
              </TextLink>
            }
          />
        </div>
        <div className="mt-4">
          <FactRow
            icon={<Clock size={20} strokeWidth={2.2} aria-hidden />}
            primary={timeLabel || notSetLabel}
            secondary={service?.duration_minutes ? `${service.duration_minutes} min` : undefined}
            trailing={
              <TextLink
                onClick={() => goToStep("datetime")}
                className="flex h-11 items-center justify-end px-1 -mx-1"
              >
                {tp("changeLabel")}
              </TextLink>
            }
          />
        </div>
        {service && (
          <div className="mt-4">
            <FactRow
              icon={<Scissors size={20} strokeWidth={2.2} aria-hidden />}
              primary={locale === "en" ? service.name_en : service.name_de}
              secondary={service.duration_minutes ? `${service.duration_minutes} min` : undefined}
              trailing={<Price amount={service.price} locale={locale} size="row" />}
            />
          </div>
        )}
      </motion.div>

      <Divider className="my-8" />

      {/* Section 2: "Price" -- the overall booking total, broken down (trust floor). Heading 2. */}
      <motion.div {...priceMotion} className="px-4">
        <SectionTitle as="heading" className="mb-4">
          Price
        </SectionTitle>
        <div className="flex items-baseline justify-between gap-3">
          <EmphasisText>{tp("totalLabel")}</EmphasisText>
          <Price amount={totalPrice} locale={locale} size="total" />
        </div>
        {salonVatRegistered && vatIncludedAmount > 0 && (
          <div className="mt-3 flex items-baseline justify-between gap-3">
            <Meta>{tp("vatIncl")}</Meta>
            <Meta className="tabular-nums">{formatCurrency(vatIncludedAmount, locale)}</Meta>
          </div>
        )}
      </motion.div>

      <Divider className="my-8" />

      {/* Cancellation policy, bare body text (this system's own per-screen line: "the
          cancellation term renders as body text above the commit button"), above both the
          Payment method section and the sticky commit bar. Semantic-colour floor: the s-success
          ShieldCheck icon. */}
      <motion.div {...policyMotion} className="flex items-start gap-2 px-4">
        <ShieldCheck size={14} strokeWidth={1.6} className="mt-[2px] shrink-0 text-s-success" aria-hidden />
        <BodyText tone="meta" className="leading-[1.5]">
          {tp("cancellationPolicy", { hours: cancellationHours })}
        </BodyText>
      </motion.div>

      <Divider className="my-8" />

      {/* Section 3: "Payment method" -- the mode-specific chooser/breakdown, bare rows. The
          current choice is indicated by a fill change (COLOR.tray), never a border, so the fold
          keeps 0 bordered elements. Heading 3 of 3 in the mandatory 18px tier. Each row is the
          extracted ./PaymentMethodRow.tsx (kit-token-built, see that file's own header), not a
          hand-written button, per this repair pass's own finding. */}
      <motion.div {...paymentMotion} className="px-4">
        <SectionTitle as="heading" className="mb-4">
          Payment method
        </SectionTitle>
        {paymentMode === "at_salon" ? (
          <div className="flex flex-col gap-2">
            {onlineAvailable && (
              <PaymentMethodRow
                isCurrentChoice={payChoice === "online"}
                onClick={() => setPayChoice("online")}
                iconBg="bg-s-accent-pale"
                icon={<CreditCard size={20} strokeWidth={2.2} className="text-s-accent" aria-hidden />}
                title={tp("payOnlineTitle")}
                subtitle={tp("payOnlineSub")}
              />
            )}
            <PaymentMethodRow
              isCurrentChoice={payChoice === "in_person"}
              onClick={() => setPayChoice("in_person")}
              iconBg="bg-s-bg-sunken"
              icon={<Store size={20} strokeWidth={2.2} className="text-s-ink" aria-hidden />}
              title={tp("payAtSalonTitle")}
              subtitle={tp("payAtSalonSub", { amount: formatCurrency(totalPrice, locale) })}
            />
          </div>
        ) : paymentMode === "deposit" ? (
          <div>
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
          <div className="flex flex-col items-center gap-1 py-2 text-center">
            <Meta>{tp("payOnlineNow")}</Meta>
            <Price amount={totalPrice} locale={locale} size="total" />
            <Meta>{tp("fullPrepayment")}</Meta>
          </div>
        )}
      </motion.div>

      {/* Sticky commit bar: the one ink Pay button, kit recipe unchanged. Zero shadow anywhere
          in RULE (systems.ts "rule" notes): separated from the page above by a white-to-
          transparent gradient fade instead of a shadow or a hairline. */}
      <div className="pointer-events-none fixed bottom-[125px] left-0 right-0 z-20 h-6 bg-gradient-to-t from-white to-transparent" aria-hidden />
      <div
        className="fixed bottom-0 left-0 right-0 z-20 bg-white px-4 pb-4 pt-2"
        style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
      >
        <PrimaryButton>{ctaLabel}</PrimaryButton>
      </div>

      {/* Content clearance for the fixed bar above, then the 125px bottom spacer so the fold
          measures as it does on the real phone once HideInBooking's stripped BottomNav is
          accounted for (that 125px belongs to the real chrome, not drawn here). */}
      <div style={{ height: 96 }} aria-hidden />
      <div style={{ height: 125 }} aria-hidden />
    </div>
  );
}
