"use client";

// Exists-check: `npm run exists directions-0905-r3` (run this session) -> 7 REMOVED-list hits
// from round-2 work unrelated to this surface (see page.tsx's own header for the full list);
// none is a payment-step review component. `npm run exists payment-step` -> round-1's
// _va/_vb/_vc, round-2's switcher and its lift/rule/tray reviews (all read in full this turn:
// the round-2 lift-system review for this surface, payment-step/_lift/PaymentStepLiftReview.tsx,
// is the approved-anatomy base this file starts from BY HAND, never copied; the round-2
// rule-system review for the same surface, payment-step/_rule/PaymentStepRuleReview.tsx, is read
// as a working reference for the Divider/bare-row/gradient-fade devices candidate A also needs,
// not imported: that file lives in a sibling, round-2-only system's private folder). No round-3
// candidate-A review component exists for this surface. Net-new.
//
// Depicts: salon+stylist/date/time/service/price-breakdown/payment-method/cancellation order, unchanged from the approved control -> the round-2 lift-system review (payment-step/_lift/PaymentStepLiftReview.tsx), also matches components-legacy/booking/PayConfirmStep.tsx's real render order and _design-system/references/fresha--payment-step.md's measured item order 2-12
// Depicts: the payment-mode math (deposit/VAT/remaining), verbatim, unchanged from the control -> components-legacy/booking/PayConfirmStep.tsx:143-196
// Depicts: the real per-mode CTA label logic and i18n keys, verbatim, unchanged -> components-legacy/booking/PayConfirmStep.tsx:736-754
// Depicts: every pill/badge/button/title/meta/price/card literal -> app/[locale]/dev/directions-0905-r3/_kit (re-exports Card/SectionTitle/Meta/Price/PrimaryButton/TextLink/KitProvider, now carrying candidate A's own value sheet under system key "a")
// Depicts: the ONE named identity-block border exception candidate A's container rule allows -> app/[locale]/dev/directions-0905-r3/_kit Card.tsx (borderExceptionVariant, resolved from systems.ts SYSTEMS.a.deltas.card)
// Depicts: the group-boundary hairline replacing the control's second (shadowed) card -> ./Divider.tsx (this folder's own kit-token-built primitive, net-new)
// Depicts: the "Change" links' real navigation -> lib/booking-context.tsx (useBooking().goToStep, not a dead click)
// Depicts: the payment-method icon chips (CreditCard / Store, no photo) -> components-legacy/booking/PayConfirmStep.tsx:549-555,618-633 (verbatim anatomy, unchanged from the control; content-image-ok inline on each chip's own line below)
//
// Not-a-salon-card: the salon name + star rating inside the summary block is a booking-review
//   identity row (who you're already booked with, trust floor), not a discovery/search result
//   tile: no "View N services" off-ramp, no aspect-[3/2] hero, not tappable to a salon page. Same
//   reasoning the control's own file already gives for the identical row.
//
// Grounded-in: app/[locale]/dev/directions-0905-r3/_kit/index.ts (Card, SectionTitle, Meta, Price,
//   PrimaryButton, TextLink, KitProvider/useSystem via Card, TYPE_RAMP, RADIUS, COLOR, SPACING --
//   every pill/badge/button/title/meta/price/card literal on this screen comes from that
//   re-export barrel). ./Divider.tsx (this folder's own kit-token-built hairline, net-new). Also
//   grounded in components-legacy/booking/PayConfirmStep.tsx (the real step this port follows,
//   cited above under Depicts), lib/bookings/payment-mode.ts (effectivePaymentMode, real
//   three-way branch), lib/format-currency.ts (formatCurrency, real Swiss formatting),
//   app/[locale]/_components/primitives (Avatar, useEnterMotion, real, unchanged),
//   components-legacy/booking/BookingExitButton.tsx (real, unchanged, the same borderless
//   trigger recipe the control already uses for its own back affordance), lib/booking-context.tsx
//   (useBooking / goToStep, real, unchanged), messages/en.json's payConfirm + booking namespaces
//   (every string below is a real key, confirmed present this run), and _design-system/
//   references/fresha--payment-step.md "Measured" list items 2-12 (the content order this file
//   follows, unchanged from the control).
//
// ROOT_CAUSES.md Part 3.4 ("Pay: THE CONTROL, what must not move") fix list: "Causes that apply:
//   none. Zero severity-2, -3 or -4 findings." There is no Changes list for this screen; every
//   line below is a "what must not move" bullet, preserved exactly, with the one line that keeps
//   it true noted inline:
//   - 4 sizes (28/18/14/12) and 2 weights (400/500): unchanged, same TYPE_RAMP import as the
//     control, same local EmphasisText helper reading TYPE_RAMP.body.
//   - Anchor 28 over body 14 = 2.0x, the anchor IS the fact: unchanged, same SectionTitle
//     as="anchor" sentence.
//   - "0 elements carrying both border and shadow": preserved by construction, candidate A's own
//     system delta never sets both true on the same Card instance.
//   - "exactly 2 hairlines, both #E4E4E7": this screen renders ONE group-boundary hairline
//     (./Divider.tsx, replacing the control's second card with candidate A's own container
//     device, since candidate A allows only ONE named exception per screen, already spent on the
//     summary block); the control's OTHER hairline was its sticky-bar top rule, which candidate A
//     cannot keep (see the sticky-bar note below), so the count moves from 2 to 1, a direct,
//     named consequence of applying candidate A's own container rule, not an unrelated drift.
//   - 5 spacing values (12/16/20/24/32): unchanged Tailwind classes, same as the control; the new
//     Divider's own vertical margin uses the same ladder.
//   - 9 Lucide icons, 0 decorative: same icon set as the control, unchanged.
//   - 1 ink commit button, 358x52, used once: unchanged, same kit PrimaryButton import.
//   - Touch targets (back/exit 44x44, Change 44px tap height, payment row 56px tall, CTA 52px
//     tall): unchanged, same className recipes as the control.
//   - Trust floor (price broken down, cancellation term above the button, salon named): unchanged.
//
// measured: BLOCKED this run. The route 500s at build time because the shared round-3 kit
//   barrel this file imports through (this folder's own "../_kit" re-export, one level up) has a
//   pre-existing syntax bug outside this builder's own folder: its own JSDoc example, `{/* exactly
//   one candidate per screen */}`, closes the surrounding /** */ docblock at its first `*/`,
//   corrupting the rest of the file; confirmed live via SWC's own build error at :3461, "Module
//   build failed... x Expression expected", pointing at that exact line. Not fixed here per the
//   hard "editing a file your task does not name" ban. The natural workaround (import the
//   identical, unbroken underlying module directly, the round-2 kit folder one level further up
//   that this barrel itself only re-exports, the exact same source the approved LIFT control
//   already imports from) is itself blocked: the mockup-depicts-gate's graveyard arm treats that
//   folder's own path segment as a killed-feature keyword, since five UNRELATED round-2 SCREENS
//   were graveyarded and happen to share that token in their REMOVED.md keyword field; the round-2
//   kit MODULE itself, and the approved LIFT control that already imports from that exact path,
//   were never killed. Per this builder's own instructions ("if a gate blocks you, paste its deny
//   text verbatim and stop"), that edit was not forced through a skip flag. Reported as a blocker
//   in this builder's structured return, with both the SWC error and the gate's deny text pasted
//   verbatim.
//
// floors: (a) photographic focal: the 44px salon photo sits flush at the summary block's leading
//   edge, present but not the screen's focal element, legal on a trust/commit surface per the
//   imagery floor's own named exemption for "checkout payment step" (unchanged from the control);
//   (b) one biggest element: the 28px anchor sentence is the only 28px run on the page, 28/14 =
//   2.0x the local body size (unchanged); (c) tabular number: the anchor's price, every Price
//   component and every duration figure render tabular-nums (unchanged); (d) semantic-colour
//   moment: the ShieldCheck cancellation row renders s-success green, and a selected payment row
//   is indicated by the same tray fill the rest of the system uses for "selected" (unchanged);
//   (e) no dead-grey zone: the page is white end to end per candidate A's own "usesTray: false"
//   delta, the tray fill only ever appears as a small selected-row highlight, never a page-level
//   band (unchanged); (f) worst-case content: salon name and service name truncate (`truncate`),
//   the cancellation sentence wraps naturally, the anchor sentence's price stays one tabular run
//   regardless of locale-driven length (unchanged).
//
// system: CANDIDATE A, RULE REFINED, verbatim from _plans/R3_ONE_SYSTEM.md: "no cards, inset
//   hairlines, bare rows... Groups are separated by inset hairlines and gap size alone. One named
//   exception: a single identity block per screen may carry a border, forced through Card.tsx
//   variant `entity`, never hand-written." Wired via `_kit/systems.ts` SYSTEMS.a: border:false,
//   shadow:false, hairlineCeiling:"unlimited", usesTray:false, borderExceptionVariant:"entity",
//   discriminator "count(box-shadow)=0 AND every hairline inset>=24px both sides AND at most one
//   bordered element exists (the named entity exception)". Concretely, the ONLY deltas from the
//   approved LIFT control (candidate A's own sheet declares pill/button/status/type-ramp/spacing
//   "identical to the round-2 base", so nothing else on this screen changes):
//   1. The summary block keeps its ONE Card, `variant="entity"`, with NO `bordered` prop: under
//      LIFT the control had to pass `bordered` explicitly as a screen-level repair (LOCKFILE
//      section 17.2 edge case c, its own shadow proving invisible on a photo-less card); under
//      candidate A the identical rendered result (hairline border, no shadow, radius 16) falls
//      out of the system's own `borderExceptionVariant: "entity"` delta automatically, exactly
//      the "never hand-written" instruction in the sheet's own Container-treatment row.
//   2. The payment-method chooser, which the control holds in a SECOND shadowed Card, has no
//      legal second container under candidate A ("one named exception... a single identity block
//      per screen"), so it renders as bare rows (same button markup as the control, only the
//      enclosing Card removed) preceded by ONE ./Divider.tsx hairline marking the group boundary
//      the card's own edge used to mark. This is candidate A's own known limitation, named
//      plainly in _plans/R3_ONE_SYSTEM.md ("What A cannot do, measured: it has no legal container
//      for a record's facts"), applied honestly rather than smuggled back in as a second Card.
//   3. The sticky bar drops its top hairline rule (candidate A: "Shadow: none, on anything,
//      including the sticky bar (separated by gradient fade instead)", and a top rule would also
//      be a SECOND bordered element, breaking the discriminator's "at most one bordered element
//      exists"). Replaced with the same white-to-transparent gradient-fade device round-2's own
//      rule system already uses for the identical reason.
//
// Chrome: the wizard header (back / title / exit) is drawn exactly as the control draws it: a
//   custom back control borrowing BookingExitButton.tsx's own local trigger className (borderless,
//   shadowless, ChevronLeft swapped in), so it adds nothing to candidate A's own border/shadow
//   counts, same as the control.
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
import { Card, SectionTitle, Meta, Price, PrimaryButton, TextLink, TYPE_RAMP, RADIUS, COLOR } from "@/app/[locale]/dev/directions-0905-r3/_kit";
import { Divider } from "./Divider";

interface PaymentStepAReviewProps {
  salon: Salon;
  staff: StaffMember | null;
}

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

export default function PaymentStepAReview({ salon, staff }: PaymentStepAReviewProps) {
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

      <motion.div {...summaryMotion}>
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

      <motion.div {...policyMotion} className="mt-5 flex items-start gap-2 px-1">
        <ShieldCheck size={14} strokeWidth={1.6} className="mt-[2px] shrink-0 text-s-success" aria-hidden />
        <Meta>{tp("cancellationPolicy", { hours: cancellationHours })}</Meta>
      </motion.div>

      <Divider className="mt-8" />

      <SectionTitle as="heading" className="mb-3 mt-8">
        {tp("paymentEyebrow")}
      </SectionTitle>
      <motion.div {...paymentMotion}>
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

      <div className="pointer-events-none fixed bottom-[125px] left-0 right-0 z-20 h-6 bg-gradient-to-t from-white to-transparent" aria-hidden />
      <div
        className="fixed bottom-0 left-0 right-0 z-20 bg-white p-4"
        style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto max-w-2xl">
          <PrimaryButton>{ctaLabel}</PrimaryButton>
        </div>
      </div>

      <div className="h-24" aria-hidden />
      <div style={{ height: 125 }} aria-hidden />
    </div>
  );
}
