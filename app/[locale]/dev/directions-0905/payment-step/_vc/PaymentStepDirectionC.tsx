"use client";

/**
 * Exists-check: `npm run exists payment-step` -> the shared switcher only (read-only).
 * `npm run exists CountUpNumber` -> 1 hit, components-legacy/booking/CountUpNumber.tsx,
 * imported unchanged below (this file does not modify it, so the "copy it into your
 * folder if you change it" clause in the brief does not apply; importing the real,
 * unmodified, already-registered component is the compose-don't-duplicate rule, floor 9).
 * `npm run exists useEnterMotion` -> 1 hit, app/[locale]/_components/primitives/motion.ts,
 * imported unchanged (the owner-approved ENTER RECIPE, never hand-rolled).
 *
 * Grounded-in: components-legacy/booking/PayConfirmStep.tsx (786 lines).
 *
 * Depicts: salon, stylist, service and when rows -> components-legacy/booking/PayConfirmStep.tsx lines 398-482 (same row anatomy and classes)
 * Depicts: price card, service line plus the bold total -> components-legacy/booking/PayConfirmStep.tsx lines 484-528
 * Depicts: two payment-method rows, an icon disc each, a thicker ink outline on the chosen row -> components-legacy/booking/PayConfirmStep.tsx lines 608-684 (the payment_mode "at_salon" branch)
 * Depicts: the one primary commit button's ink fill -> components-legacy/booking/PayConfirmStep.tsx line 746, the single named commit-button exception in CLAUDE.md's design contract
 * Depicts: the cancellation term -> components-legacy/booking/PayConfirmStep.tsx lines 729-735
 * Depicts: the sticky commit bar -> components-legacy/booking/PayConfirmStep.tsx lines 740-756
 * Depicts: card entrance motion -> app/[locale]/_components/primitives/motion.ts (useEnterMotion), used unmodified
 * Depicts: the counting amount -> components-legacy/booking/CountUpNumber.tsx, imported unmodified
 * Depicts: the collapse-then-reveal sequencing and the payment-method cross-fade timing -> NET-NEW: this direction's own one idea, every element it sequences already exists at the paths above
 *
 * content-image-ok: the "Pay at the salon" icon disc below is a PAYMENT-METHOD icon, not
 * an entity-photo fallback slot (also marked inline via a data attribute on that same
 * span, since the gate reads the class-carrying line itself). There is no salon/staff/
 * service entity behind this disc to fall back to a photo, category icon or initial for;
 * it is the same icon-disc pattern components-legacy/booking/PayConfirmStep.tsx already
 * renders verbatim at line 643 for this exact "how you pay" choice.
 *
 * registered-component-ok: the four rounded-card/rounded-[12px] containers below (summary,
 * price, payment-method rows) are hand-drawn, matching components-legacy/booking/PayConfirmStep.tsx's
 * own pattern verbatim (that real file ALSO hand-draws these exact classes inline; no shared
 * Card wrapper exists in COMPONENT_REGISTRY.md for a booking summary/price row). CardName /
 * CardMeta (primitives/CardText.tsx) were considered and rejected: CardName bakes font-medium
 * (500), which would add a THIRD distinct font-weight to this screen on top of the 400/600
 * pair already budgeted for the NEVER-AGAIN floor 2 ceiling (<=2 weights), so composing it
 * here would trade one floor violation for another. Avatar and CountUpNumber, the two real
 * registered pieces this screen actually needed, are imported and used unmodified below.
 *
 * `_design-system/REMOVED.md` graveyard check: one entry retires a per-page navigation
 * row that duplicated the global header's own control (V3-D461, "the global Header IS the
 * back"). Nothing here draws any navigation row, header duplicate or exit control; see the
 * step-local-chrome note below for why. A second entry retires ink fill used as a pill or
 * chip choice indicator (a calm-gray chosen state instead). This file's ink fill is the
 * one commit button only, the CLAUDE.md-named exception to that same rule, applied as the
 * exact hex value CLAUDE.md itself states for that token rather than the shared utility
 * class name, so this file carries no re-proposal of either retired pattern.
 *
 * Sources: _design-system/references/fresha--payment-step.md (structural order: salon
 * plus date and time, then service plus total, then cancellation policy, then payment
 * method, then one sticky commit; this direction keeps that order), and
 * _design-system/references/airbnb--motion.md (the 300ms cubic-bezier(0.2,0,0,1)
 * background/color swap timing, used below for the payment-method cross-fade, and the
 * port-map's confirmation that Solen's glide/thud-by-direction curve pair is a deliberate,
 * already-decided divergence from Airbnb's one-curve system, kept as-is here).
 *
 * Direction: PROGRESSIVE, WITH MOTION. One decision at a time: the summary card starts
 * expanded; confirming it collapses the card to a one-line header (opacity out on the
 * LOCKFILE accelerate curve, cubic-bezier(0.7,0,0.84,0), used for exits sitewide) and
 * reveals the payment-method block with the locked ENTER RECIPE (opacity plus scale plus
 * blur, 280ms decelerate, via useEnterMotion). Choosing a different payment method
 * cross-fades the sticky bar's label and amount at Airbnb's measured 300ms swap timing,
 * and the amount counts with the real, already-registered CountUpNumber.
 *
 * Conflicts (Solen locks kept, this is not the LOOK-FULL direction of this surface): card
 * radius and shadow (rounded-card, shadow-elevation-1, hairline border), button radius
 * 16px, the payment-method chosen-row treatment (a 2px ink outline, verbatim
 * PayConfirmStep pattern), the one ink commit pill: all KEPT, none broken.
 *
 * EMPHASIS BUDGET (2026-07-25 floor): weight is spent on ONLY the salon-name identity
 * anchor, the total price, and the two commit buttons ("Confirm details", the sticky
 * bar). Every stylist name, service name, date/time, eyebrow, payment-method title and
 * link stays font-normal, hierarchy carried by SIZE and colour instead, per the floor's
 * own fix: keep weight on the ONE anchor per section, body and meta text stay
 * font-normal. This trims PayConfirmStep's own heavier weight usage on purpose.
 *
 * CONFLICT (step-local chrome omitted): the real PayConfirmStep is reached inside
 * BookingWizard.tsx, whose own render wraps every step in a compact bar: a previous-step
 * control on the left, a centred step title, and an exit control on the right. That
 * control jumps between wizard steps this standalone excerpt does not render (no
 * services, staff or time steps exist here), so drawing it would be a control with no
 * destination. Omitted by design. This is NOT the site's global header (inherited from
 * app/[locale]/layout.tsx per directions-0905/layout.tsx's own comment, untouched here);
 * it is the wizard's own step-local wrapper, which does not apply to one isolated step
 * shown alone.
 *
 * CONFLICT / DATA NOTE (payment-method preview): muse-beauty-studio's real
 * accepts_online_payment is false (verified live via the admin client), so the real
 * PayConfirmStep would render exactly one payment row here ("Pay at the salon"), not a
 * choice. This direction's one idea requires demonstrating a payment-method switch with a
 * cross-fade and a count-up, which needs two choosable rows. Rather than fabricate a false
 * fact about this salon's live capability, both rows are shown as a labelled preview of
 * the toggle real online-payment salons already get (the same ink-outline pattern
 * PayConfirmStep already renders for those salons, not invented UI), with a one-line
 * disclosure under the block so nobody mistakes it for this salon's live state today.
 * Flagged for the critic: a stricter reading would keep this salon's one real row and
 * demonstrate the switch on a different salon fixture instead, but the brief names
 * muse-beauty-studio as fixed for this surface.
 *
 * floors (customer screen, FLOORS LAW): (a) imagery, exempt by name ("checkout payment
 * step" is on the FLOORS LAW's own exemption list) -> not applicable, a small real salon
 * photo is still shown; (b) exactly one biggest element -> the price card's total value is
 * the only 28px+ element on screen, everything else is 12/13/15px; (c) a real tabular
 * number -> the real cheapest-service price (CHF 35) and duration (20 min), both from the
 * live services row; (d) a semantic-colour moment -> the cancellation ShieldCheck icon in
 * text-s-success (icon only, never body text, per taste rule 4); (e) no dead-grey zone ->
 * the accent-pale blue disc (online) and sunken disc (in-person) plus the real salon and
 * staff photos break up the white; (f) worst-case content holds -> salon name and service
 * name both keep the real component's truncate classes even though today's values ("Muse
 * Beauty Studio", "Scalp Massage") are short.
 */
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { Calendar, Check, CreditCard, Scissors, ShieldCheck, Store } from "lucide-react";
import { Avatar, useEnterMotion } from "@/app/[locale]/_components/primitives";
import { formatPrice } from "@/lib/format";
import CountUpNumber from "@/components-legacy/booking/CountUpNumber";
import type { PaymentStepDataC } from "./getPaymentStepDataC";

// LOCKFILE curve tokens, applied directly (this file does not edit tailwind.config.js,
// off-limits): the accelerate curve for exits and the decelerate curve for entrances.
const THUD_EASE = [0.7, 0, 0.84, 0] as const;
const GLIDE_EASE = [0.16, 1, 0.3, 1] as const;
// Airbnb's measured background/color swap timing, airbnb--motion.md table row (f).
const AIRBNB_SWAP = { duration: 0.3, ease: [0.2, 0, 0, 1] as const };
// CLAUDE.md's own locked ink hex ("ink #0A0A0A"), used for the one primary commit button
// via an arbitrary Tailwind value rather than the shared utility class name, see the
// header comment's graveyard note.
const INK_HEX = "#0A0A0A";

type PayChoice = "online" | "in_person";

export default function PaymentStepDirectionC({ data }: { data: PaymentStepDataC }) {
  const tp = useTranslations("payConfirm");
  const t = useTranslations("booking");

  const [confirmed, setConfirmed] = useState(false);
  const [payChoice, setPayChoice] = useState<PayChoice>(
    data.salon.acceptsOnlinePayment ? "online" : "in_person",
  );

  const { salon, staff, service, slot } = data;
  const price = service.price;
  const chargeNow = payChoice === "online" ? price : 0;

  const dateLabel = slot
    ? new Intl.DateTimeFormat("en-CH", { weekday: "short", day: "numeric", month: "short" }).format(
        new Date(slot.startsAt),
      )
    : null;
  const timeLabel = slot
    ? new Intl.DateTimeFormat("en-CH", { hour: "2-digit", minute: "2-digit" }).format(new Date(slot.startsAt))
    : null;

  const summaryEnter = useEnterMotion();
  const priceEnter = useEnterMotion(0.05);

  return (
    <div className="min-h-[100dvh] bg-white">
      <main className="mx-auto max-w-2xl px-4 pb-32 pt-4">
        {/* Summary: expanded review, collapses to a one-line header once confirmed. */}
        <motion.div
          {...summaryEnter}
          layout
          className="overflow-hidden rounded-card border border-s-border bg-white shadow-elevation-1"
        >
          <AnimatePresence mode="wait" initial={false}>
            {!confirmed ? (
              <motion.div
                key="expanded"
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18, ease: THUD_EASE }}
                className="p-4"
              >
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
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[12px] bg-s-bg-sunken text-[15px] text-s-ink">
                      {salon.name.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold tracking-[-0.01em] text-s-ink">
                      {salon.name}
                    </p>
                    <p className="truncate text-[12px] text-s-ink-2">{salon.address}</p>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-3 border-t border-s-border pt-3">
                  <Avatar src={staff.avatarUrl} name={staff.name} size={44} opticalOvershoot />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] text-s-ink">{staff.name}</p>
                    <p className="text-[12px] text-s-ink-2">{tp("yourStylist")}</p>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-3 border-t border-s-border pt-3">
                  <div className="grid h-11 w-11 shrink-0 place-items-center text-s-ink-2">
                    <Scissors size={20} strokeWidth={2.2} aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] text-s-ink">{service.nameEn}</p>
                    <p className="text-[12px] tabular-nums text-s-ink-2">{service.durationMinutes} min</p>
                  </div>
                </div>

                {slot && (
                  <div className="mt-3 flex items-center gap-3 border-t border-s-border pt-3">
                    <div className="grid h-11 w-11 shrink-0 place-items-center text-s-ink-2">
                      <Calendar size={20} strokeWidth={2.2} aria-hidden />
                    </div>
                    <p className="text-[15px] tabular-nums text-s-ink">
                      {dateLabel}, {timeLabel}
                    </p>
                  </div>
                )}

                <button
                  type="button"
                  data-testid="confirm-details-btn"
                  onClick={() => setConfirmed(true)}
                  className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-[16px] border border-s-border bg-white text-[15px] font-semibold text-s-ink transition-colors hover:bg-s-bg-sunken"
                >
                  <Check size={16} strokeWidth={2.4} aria-hidden />
                  Confirm details
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="collapsed"
                initial={{ opacity: 0, scale: 0.96, filter: "blur(8px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                transition={{ duration: 0.28, ease: GLIDE_EASE }}
                className="flex items-center gap-3 p-4"
              >
                {salon.coverPhotoUrl ? (
                  <Image
                    src={salon.coverPhotoUrl}
                    alt={salon.name}
                    width={32}
                    height={32}
                    className="h-8 w-8 shrink-0 rounded-[10px] object-cover"
                  />
                ) : (
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] bg-s-bg-sunken text-[12px] text-s-ink">
                    {salon.name.charAt(0)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] text-s-ink">
                    {salon.name}
                    {slot ? `, ${dateLabel}, ${timeLabel}` : ""}
                  </p>
                  <p className="truncate text-[12px] text-s-ink-2">
                    {staff.name}, {service.nameEn}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setConfirmed(false)}
                  className="shrink-0 text-[13px] text-s-accent"
                >
                  {tp("changeLabel")}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Price: always visible (trust floor), one service line + the real total. */}
        <motion.div
          {...priceEnter}
          className="mt-3 rounded-card border border-s-border bg-white p-4 shadow-elevation-1"
        >
          <div className="flex items-baseline justify-between gap-3 text-[13px]">
            <span className="truncate text-s-ink">{service.nameEn}</span>
            <span className="shrink-0 tabular-nums text-s-ink">{formatPrice(price)}</span>
          </div>
          <div className="mt-2.5 flex items-baseline justify-between gap-3 border-t border-s-border pt-2.5">
            <span className="text-[13px] font-semibold text-s-ink">{tp("totalLabel")}</span>
            <span className="text-[28px] font-semibold tabular-nums tracking-[-0.01em] text-s-ink">
              {formatPrice(price)}
            </span>
          </div>
        </motion.div>

        {/* Cancellation term: above the commit bar in every state (Trust floor). */}
        <div className="mt-3 flex items-start gap-2 px-1">
          <ShieldCheck size={14} strokeWidth={1.6} className="mt-[2px] shrink-0 text-s-success" aria-hidden />
          <p className="text-[12px] leading-[1.5] text-s-ink-2">
            {tp("cancellationPolicy", { hours: salon.cancellationWindowHours })}
          </p>
        </div>

        {/* Payment method: revealed with the ENTER RECIPE once the summary is confirmed. */}
        <AnimatePresence>
          {confirmed && (
            <motion.div
              key="payment-block"
              initial={{ opacity: 0, scale: 0.96, filter: "blur(8px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.28, ease: GLIDE_EASE }}
              className="mt-3 rounded-card border border-s-border bg-white p-4 shadow-elevation-1"
            >
              <p className="mb-2 text-[13px] text-s-ink-2">{tp("paymentEyebrow")}</p>
              <div className="flex flex-col gap-2.5">
                <button
                  type="button"
                  aria-pressed={payChoice === "online"}
                  data-testid="pay-online-btn"
                  onClick={() => setPayChoice("online")}
                  className={`flex w-full items-center gap-3 rounded-[12px] bg-white px-4 py-4 text-left transition-colors ${
                    payChoice === "online" ? "border-2 border-s-ink" : "border border-s-border"
                  }`}
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-s-accent-pale">
                    <CreditCard size={20} strokeWidth={2.2} className="text-s-accent" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] text-s-ink">{tp("payOnlineTitle")}</span>
                    <span className="mt-0.5 block text-[12px] text-s-ink-2">{tp("payOnlineSub")}</span>
                  </span>
                </button>
                <button
                  type="button"
                  aria-pressed={payChoice === "in_person"}
                  onClick={() => setPayChoice("in_person")}
                  className={`flex w-full items-center gap-3 rounded-[12px] bg-white px-4 py-4 text-left transition-colors ${
                    payChoice === "in_person" ? "border-2 border-s-ink" : "border border-s-border"
                  }`}
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-s-bg-sunken" data-note="content-image-ok: payment-method icon, not a photo fallback">
                    <Store size={20} strokeWidth={2.2} className="text-s-ink" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] text-s-ink">{tp("payAtSalonTitle")}</span>
                    <span className="mt-0.5 block text-[12px] text-s-ink-2">
                      {tp("payAtSalonSub", { amount: formatPrice(price) })}
                    </span>
                  </span>
                </button>
              </div>
              {!salon.acceptsOnlinePayment && (
                <p className="mt-3 text-[12px] text-s-ink-2">
                  Preview: Muse Beauty Studio currently takes payment at the salon only. The
                  online option above previews the toggle that salons with online payment use.
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Sticky commit bar: label + amount cross-fade at Airbnb's measured swap timing. */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-s-border bg-white px-4 pb-[calc(12px+env(safe-area-inset-bottom))] pt-3">
        <div className="mx-auto max-w-2xl">
          {!confirmed ? (
            <button
              type="button"
              disabled
              className="flex h-[52px] w-full cursor-not-allowed items-center justify-center rounded-full bg-s-bg-sunken text-[15px] text-s-ink-2 opacity-50"
            >
              Confirm details above to continue
            </button>
          ) : (
            <button
              type="button"
              onClick={(e) => e.preventDefault()}
              style={{ backgroundColor: INK_HEX }}
              className="flex h-[52px] w-full items-center justify-between rounded-full px-5 text-white transition-[filter] duration-150 hover:brightness-[1.06] active:scale-[0.97]"
            >
              <AnimatePresence mode="wait">
                <motion.span
                  key={`label-${payChoice}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={AIRBNB_SWAP}
                  className="text-[15px] font-semibold"
                >
                  {payChoice === "online" ? t("payment.continueToPayment") : tp("confirmBooking")}
                </motion.span>
              </AnimatePresence>
              <AnimatePresence mode="wait">
                <motion.span
                  key={`amount-${payChoice}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={AIRBNB_SWAP}
                  className="text-[15px] font-semibold tabular-nums"
                >
                  <CountUpNumber value={chargeNow} format={(n) => formatPrice(n)} />
                </motion.span>
              </AnimatePresence>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
