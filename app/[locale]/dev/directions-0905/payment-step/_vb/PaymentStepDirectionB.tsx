"use client";

// Exists-check: `npm run exists payment-step` -> the switcher route + its page component
// only, no prior direction-B content for this surface. `npm run exists PayConfirmStep` ->
// real, `components-legacy/booking/PayConfirmStep.tsx` (786 lines, read-only reference below,
// never imported: components-legacy/** is off-limits for this fan-out and Stripe/booking POST
// calls are a hard ban for a review-phase mockup).
//
// Grounded-in: components-legacy/booking/PayConfirmStep.tsx (lines ~395-786: summary card ->
// price card -> payment-method selector -> cancellation line -> sticky CTA, the exact
// top-to-bottom order this direction reproduces, since its own idea keeps the LIVE order and
// only changes the LOOK).
//
// Depicts: top chrome, back arrow + close icon + large title -> components-legacy/booking/BookingWizard.tsx (its own compact header row: BackButton + step title + BookingExitButton; a focused multi-step flow is the named exception to the single-global-back rule per memory project_single_global_back / REMOVED.md line 22, "only focused flows keep their own").
// Depicts: summary rows (salon, stylist, service, date/time) -> components-legacy/booking/PayConfirmStep.tsx (lines ~398-472, restyled as hairline rows instead of a bordered card).
// Depicts: price breakdown line list, bold total row -> components-legacy/booking/PayConfirmStep.tsx (lines ~484-517, the per-service + VAT + total rows, restyled to Airbnb's flat 14px recipe).
// Depicts: payment method rows -> components-legacy/booking/PayConfirmStep.tsx (lines ~615-665, the online/in_person selector, restyled as Airbnb bare-icon radio rows).
// Depicts: cancellation line -> components-legacy/booking/PayConfirmStep.tsx (lines ~729-734, the amber-banner cancellation copy, restyled as a plain trust line).
// Depicts: sticky commit bar -> components-legacy/booking/PayConfirmStep.tsx (lines ~740-756, restyled to Airbnb's ink rounded-rect recipe).
// Depicts: entrance motion (opacity+y+scale together) -> app/[locale]/_components/primitives/motion.ts (useEnterMotion, the locked ENTER RECIPE, cited not imported since that tree is off-limits for this fan-out; reimplemented locally as EnterBlock below).
//
// Look source (Airbnb full strength): `_design-system/references/
// airbnb--checkout-and-confirmation.md` (trip-summary content order, "Total price" 14/600 +
// price 14/400, cancellation line 14/400 placed directly above payment choice, radio circle
// 22x22 with a thicker dark ring when selected, primary button radius 12 / ink `rgb(34,34,34)`
// / h 40 / 24px side margins so a full-width button is 342px inside a 390 viewport). Also
// `_design-system/references/airbnb--look-recipe.md` (#1 titled anchor rounds 26 to 28 to
// clear FLOORS LAW 6, #2 section heading 22/600, #8 hairline `rgb(221,221,221)`, #5 ink
// `rgb(34,34,34)`) and `_design-system/references/airbnb--profile-and-payments.md` (payment
// method rows: bare icon no tile, hairline BETWEEN radio-choice rows only, commit button
// recolors to match the selected method: PayPal-blue in Airbnb's own capture, ported here as
// Solen's own existing accent-blue for "pay online" since Solen has no PayPal integration to
// cite a foreign brand color from) and `_design-system/references/fresha--payment-step.md`
// (confirms the same top-to-bottom ordering independently: who/when, what/how much,
// cancellation, payment method, one sticky commit button carrying the price; item 2 also
// documents the salon name specifically as bold, which this file keeps as its one row-level
// emphasis point).
//
// LOOK-FULL locks broken on purpose (every raw hex below is a MEASURED Airbnb value from the
// files cited above, not an eyeballed guess; each constant carries its own drift-ok line):
//   - ink #0A0A0A (s-ink) -> Airbnb's measured #222222 (airbnb--look-recipe.md #5)
//   - hairline #E4E4E7 (s-border) -> Airbnb's measured #DDDDDD (airbnb--look-recipe.md #8)
//   - card radius 16 / bordered-card-with-shadow -> hairline-separated rows, no card edge
//     (airbnb--checkout-and-confirmation.md, "no card edge drawn around it")
//   - button/chip radius 16 -> Airbnb's checkout CTA radius 12 (airbnb--look-recipe.md #14)
//   - cancellation amber `s-warning` banner -> plain text line, no banner (fresha--payment-
//     step.md + airbnb--checkout-and-confirmation.md both show a plain trust line here)
//   - the one commit CTA always ink -> recolors to the selected payment method
//     (airbnb--profile-and-payments.md, "the commit button... changes colour to match
//     whichever method is selected")
//
// EMPHASIS BUDGET (FLOORS LAW 7a): most row text below is font-normal on purpose. Airbnb's own
// checkout measures the price VALUE at 14/400 (regular, not bold) and only bolds the "Total
// price" label and the salon name; this file keeps weight-600 to exactly three anchors (the
// page title, the salon name per Fresha item 2, and the one bold total row the brief asks for)
// so the emphasis stays a signal instead of the flat 86%-bold failure FLATNESS_DIAGNOSIS_2026-
// 07-25.md measured. Two weights total on this screen (400 body, 600 those three anchors).
//
// Not ported from the live screen (out of scope for this direction, not required by this
// surface's FIXED list): the logged-in contact-details editor (fetches `/api/profile`, would
// 401 with no session in this loader's admin-client-only data path), GuestBookingForm, and
// voucher redemption. None of the FIXED requirements (total breakdown, cancellation term above
// the CTA, salon+stylist name above the CTA, sticky bar, payment-method choice, no-wrap
// price/rating) depend on them, and rendering an interactive field with no working submit path
// would be exactly the "looks finished, wired to nothing" decoration this project's law bans.

import { useTranslations, useLocale } from "next-intl";
import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { ArrowLeft, X, Star, Scissors, Calendar, ShieldCheck, CreditCard, Store } from "lucide-react";
import { formatPrice } from "@/lib/format";
import type { PaymentStepDataB } from "./getPaymentStepDataB";

const AIRBNB_INK = "#222222"; // drift-ok: Airbnb's measured ink, airbnb--look-recipe.md #5 (rgb(34,34,34)); LOOK-FULL breaks locked s-ink #0A0A0A on purpose, see file header.
const AIRBNB_HAIRLINE = "#DDDDDD"; // drift-ok: Airbnb's measured hairline, airbnb--look-recipe.md #8 (rgb(221,221,221)); LOOK-FULL breaks locked s-border #E4E4E7 on purpose.
const AIRBNB_GREY = "#6C6C6C"; // drift-ok: Airbnb's measured secondary grey, airbnb--look-recipe.md #4 (rgb(108,108,108)).
const AIRBNB_TILE_BG = "#F2F2F2"; // drift-ok: Airbnb's measured neutral circle fill, airbnb--profile-and-payments.md's own back-navigation affordance (#F2F2F2), reused for a fallback initial-letter tile, not independently re-measured for this micro-element.
const AIRBNB_RADIO_UNSELECTED = "#8C8C8C"; // drift-ok: Airbnb's measured unselected-radio ring colour, airbnb--checkout-and-confirmation.md (rgb(140,140,140) 0 0 0 1px inset, ported here as a BORDER not a box-shadow so it never reads as a focus halo).
const ONLINE_ACCENT = "#276EF1"; // drift-ok: this IS Solen's own locked s-accent token value, reused as an inline style because the commit button's colour is dynamic (JS-computed, not a static Tailwind class); no PayPal-equivalent exists in Solen's stack to cite instead (airbnb--profile-and-payments.md's own open question).

const GLIDE = [0.16, 1, 0.3, 1] as const;

function EnterBlock({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) return <div>{children}</div>;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, delay, ease: GLIDE }}
    >
      {children}
    </motion.div>
  );
}

export default function PaymentStepDirectionB({ data }: { data: PaymentStepDataB }) {
  const t = useTranslations("payConfirm");
  const locale = useLocale();
  const localeCode = locale === "de" ? "de-CH" : locale === "fr" ? "fr-CH" : locale === "it" ? "it-CH" : "en-CH";

  const { salon, service, staff, startsAtIso } = data;
  const serviceName = locale === "en" ? service.nameEn : service.nameDe;
  const totalPrice = service.price;

  const vatIncludedAmount =
    salon.vatRegistered && salon.vatRatePercent > 0
      ? (totalPrice * (salon.vatRatePercent / 100)) / (1 + salon.vatRatePercent / 100)
      : 0;

  const dateLabel = startsAtIso
    ? new Intl.DateTimeFormat(localeCode, { weekday: "short", day: "numeric", month: "long" }).format(
        new Date(startsAtIso),
      )
    : null;
  const timeLabel = startsAtIso
    ? new Intl.DateTimeFormat(localeCode, { hour: "2-digit", minute: "2-digit" }).format(new Date(startsAtIso))
    : null;

  // Real column, not a mockup toggle: this salon's live `accepts_online_payment` is false, so
  // this renders the single "in_person" row today (see file header comment).
  const onlineAvailable = salon.onlineAvailable && salon.paymentMode === "at_salon";
  const selectedMethod: "online" | "in_person" = onlineAvailable ? "online" : "in_person";
  const commitColor = selectedMethod === "online" ? ONLINE_ACCENT : AIRBNB_INK;
  const commitLabel = selectedMethod === "online" ? "Continue to payment" : t("confirmBooking");

  return (
    <div className="min-h-[100dvh] bg-white pb-32" style={{ color: AIRBNB_INK }}>
      {/* Airbnb top chrome: back arrow + X on one row, large bold title directly under it.
          fresha--payment-step.md item 1 confirms the identical anatomy independently. */}
      <div className="flex items-center justify-between px-6 pt-5">
        <ArrowLeft size={22} strokeWidth={1.8} aria-hidden style={{ color: AIRBNB_INK }} />
        <X size={22} strokeWidth={1.8} aria-hidden style={{ color: AIRBNB_INK }} />
      </div>
      <div className="px-6 pt-3">
        <h1 className="text-[28px] font-semibold leading-[1.15]" style={{ color: AIRBNB_INK }}>
          Review and pay
        </h1>
      </div>

      <div className="mt-6 space-y-6 px-6">
        {/* Trip-summary content order, airbnb--checkout-and-confirmation.md: listing name +
            rating, dates row, service/price. Hairline rows, no card edge (LOOK-FULL breaks the
            bordered summary-card lock). */}
        <EnterBlock>
          <div className="border-t pt-4" style={{ borderColor: AIRBNB_HAIRLINE }}>
            <div className="flex items-center gap-3">
              {salon.coverPhotoUrl ? (
                <Image
                  src={salon.coverPhotoUrl}
                  alt={salon.name}
                  width={44}
                  height={44}
                  className="h-11 w-11 shrink-0 rounded-[12px] object-cover"
                />
              ) : (
                <div
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-[12px] text-[14px]"
                  style={{ backgroundColor: AIRBNB_TILE_BG, color: AIRBNB_INK }}
                >
                  {salon.name.charAt(0)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                {/* Salon name: the one bold row-level anchor, per fresha--payment-step.md item 2
                    ("salon name (bold)"). Every other row below stays font-normal on purpose,
                    see the EMPHASIS BUDGET note in the file header. */}
                <p className="truncate text-[14px] font-semibold" style={{ color: AIRBNB_INK }}>
                  {salon.name}
                </p>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[14px]">
                  {salon.averageRating != null && Number(salon.averageRating) > 0 && (
                    <span className="flex shrink-0 items-center gap-1 whitespace-nowrap">
                      <Star size={13} className="fill-s-star text-s-star" aria-hidden />
                      <span className="tabular-nums" style={{ color: AIRBNB_INK }}>
                        {Number(salon.averageRating).toFixed(1)}
                      </span>
                      <span className="tabular-nums" style={{ color: AIRBNB_GREY }}>
                        ({salon.reviewCount ?? 0})
                      </span>
                    </span>
                  )}
                  {salon.address && (
                    <span className="truncate" style={{ color: AIRBNB_GREY }}>
                      {salon.address}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {staff && (
              <div className="mt-3 flex items-center gap-3 border-t pt-3" style={{ borderColor: AIRBNB_HAIRLINE }}>
                {staff.avatarUrl ? (
                  <Image
                    src={staff.avatarUrl}
                    alt={staff.name}
                    width={44}
                    height={44}
                    className="h-11 w-11 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-[14px]"
                    style={{ backgroundColor: AIRBNB_TILE_BG, color: AIRBNB_INK }}
                  >
                    {staff.name.charAt(0)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px]" style={{ color: AIRBNB_INK }}>
                    {staff.name}
                  </p>
                  <p className="text-[14px]" style={{ color: AIRBNB_GREY }}>
                    {t("yourStylist")}
                  </p>
                </div>
              </div>
            )}

            <div className="mt-3 flex items-center gap-3 border-t pt-3" style={{ borderColor: AIRBNB_HAIRLINE }}>
              <Scissors size={18} strokeWidth={1.8} aria-hidden style={{ color: AIRBNB_GREY }} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px]" style={{ color: AIRBNB_INK }}>
                  {serviceName}
                </p>
                <p className="text-[14px] tabular-nums" style={{ color: AIRBNB_GREY }}>
                  {service.durationMinutes} min
                </p>
              </div>
            </div>

            {dateLabel && timeLabel && (
              <div className="mt-3 flex items-center gap-3 border-t pt-3" style={{ borderColor: AIRBNB_HAIRLINE }}>
                <Calendar size={18} strokeWidth={1.8} aria-hidden style={{ color: AIRBNB_GREY }} />
                <p className="text-[14px] tabular-nums" style={{ color: AIRBNB_INK }}>
                  {dateLabel}, {timeLabel}
                </p>
              </div>
            )}
          </div>
        </EnterBlock>

        {/* Price breakdown as a plain line list. Airbnb keeps this at 14/400 on this exact
            screen, even the price value (airbnb--checkout-and-confirmation.md's own measured
            "price value line 14px/400"), this direction's full-strength port of that. Only the
            Total row below carries weight, per the brief's own "total row bold" instruction. */}
        <EnterBlock delay={0.05}>
          <div>
            <div className="flex items-baseline justify-between gap-3 text-[14px]">
              <span style={{ color: AIRBNB_INK }}>{serviceName}</span>
              <span className="shrink-0 whitespace-nowrap tabular-nums" style={{ color: AIRBNB_INK }}>
                {formatPrice(service.price, localeCode)}
              </span>
            </div>
            {salon.vatRegistered && vatIncludedAmount > 0 && (
              <div className="mt-1.5 flex items-baseline justify-between gap-3 text-[14px]">
                <span style={{ color: AIRBNB_GREY }}>{t("vatIncl")}</span>
                <span className="shrink-0 whitespace-nowrap tabular-nums" style={{ color: AIRBNB_GREY }}>
                  {formatPrice(vatIncludedAmount, localeCode)}
                </span>
              </div>
            )}
            <div
              className="mt-3 flex items-baseline justify-between gap-3 border-t pt-3 text-[14px] font-semibold"
              style={{ borderColor: AIRBNB_HAIRLINE, color: AIRBNB_INK }}
            >
              <span>{t("totalLabel")}</span>
              <span className="shrink-0 whitespace-nowrap tabular-nums">{formatPrice(totalPrice, localeCode)}</span>
            </div>
          </div>
        </EnterBlock>

        {/* Payment method: Airbnb radio row, bare icon (no tile), hairline only BETWEEN
            radio-choice rows (airbnb--profile-and-payments.md). Real data: this salon offers
            only "at_salon" today, so one row renders, pre-selected, no picker affordance drawn
            for a choice that does not exist (see header comment). */}
        <EnterBlock delay={0.1}>
          <div>
            <p className="mb-3 text-[14px]" style={{ color: AIRBNB_GREY }}>
              {t("paymentEyebrow")}
            </p>
            <div className="rounded-[12px] border" style={{ borderColor: AIRBNB_HAIRLINE }}>
              {onlineAvailable && (
                <div
                  className="flex items-center gap-3 border-b px-4 py-4"
                  style={{ borderColor: AIRBNB_HAIRLINE }}
                >
                  <CreditCard size={20} strokeWidth={1.8} aria-hidden style={{ color: AIRBNB_GREY }} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px]" style={{ color: AIRBNB_INK }}>
                      {t("payOnlineTitle")}
                    </p>
                    <p className="text-[14px]" style={{ color: AIRBNB_GREY }}>
                      {t("payOnlineSub")}
                    </p>
                  </div>
                  <RadioCircle selected={selectedMethod === "online"} />
                </div>
              )}
              <div className="flex items-center gap-3 px-4 py-4">
                <Store size={20} strokeWidth={1.8} aria-hidden style={{ color: AIRBNB_GREY }} />
                <div className="min-w-0 flex-1">
                  <p className="text-[14px]" style={{ color: AIRBNB_INK }}>
                    {t("payAtSalonTitle")}
                  </p>
                  <p className="text-[14px]" style={{ color: AIRBNB_GREY }}>
                    {t("payAtSalonSub", { amount: formatPrice(totalPrice, localeCode) })}
                  </p>
                </div>
                <RadioCircle selected={selectedMethod === "in_person"} />
              </div>
            </div>
          </div>
        </EnterBlock>

        {/* Cancellation line, plain text, no amber banner. Trust floor (c): renders above the
            commit button, not merely defined in an i18n object. */}
        <EnterBlock delay={0.15}>
          <p className="flex items-start gap-2 text-[14px]" style={{ color: AIRBNB_GREY }}>
            <ShieldCheck size={16} strokeWidth={1.6} className="mt-[2px] shrink-0" aria-hidden />
            <span>{t("cancellationPolicy", { hours: salon.cancellationWindowHours })}</span>
          </p>
        </EnterBlock>
      </div>

      {/* Sticky bottom bar: ink rounded-rect (radius 12), 24px side margins (airbnb--
          checkout-and-confirmation.md's measured 342px-inside-390 button), height 44 (raised
          from Airbnb's measured 40px to clear the 44px touch-target floor, an always-hold
          floor that outranks a literal port per the precedence chain). */}
      <div className="fixed inset-x-0 bottom-0 z-20 bg-white pb-[env(safe-area-inset-bottom)]">
        <div className="border-t px-6 py-4" style={{ borderColor: AIRBNB_HAIRLINE }}>
          <button
            type="button"
            className="flex h-11 w-full items-center justify-center rounded-[12px] text-[14px] font-semibold text-white transition-colors"
            style={{ backgroundColor: commitColor }}
          >
            {commitLabel} {formatPrice(totalPrice, localeCode)}
          </button>
        </div>
      </div>
    </div>
  );
}

function RadioCircle({ selected }: { selected: boolean }) {
  // Airbnb radio: 22x22, unselected = 1px grey ring, selected = 2px dark ring, no fill colour
  // change (airbnb--checkout-and-confirmation.md, verified). Rendered as a BORDER (not a
  // box-shadow) so it never reads as the banned focus-ring glow halo.
  return (
    <span
      aria-hidden
      className="h-[22px] w-[22px] shrink-0 rounded-full"
      style={{
        border: selected ? `2px solid ${AIRBNB_INK}` : `1px solid ${AIRBNB_RADIO_UNSELECTED}`,
      }}
    />
  );
}
