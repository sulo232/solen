"use client";

/**
 * Direction A: Fresha copy.
 *
 * Exists-check: `npm run exists confirmation` -> components-legacy/booking/BookingConfirmation.tsx
 * (671 lines, the real screen), app/[locale]/confirmation/page.tsx (the real route). SuccessMark
 * exists (app/[locale]/_components/primitives/SuccessMark.tsx) but BookingConfirmation.tsx's own
 * header comment records it as an owner-killed pattern for THIS screen specifically ("The big
 * SuccessMark disc is an owner-killed pattern and does not come back for any state", receipt
 * rebuild, commit 77f47b00b, 2026-06-09), matching TASTE_LOG C4 ("KEEP the calm confirmation").
 * MOTION.md's own line "Celebratory moments on emotional peaks -> use <SuccessMark>. The peak is
 * booking-confirmed (done)" is therefore STALE against the real component: this is a surfaced
 * contradiction (rule 18), not silently resolved either way, reported in this builder's return.
 * This direction does NOT render <SuccessMark>; the "confirmed moment" is a small pale-green
 * indicator BookingConfirmation.tsx already ships elsewhere on this same screen (its "paidShort"
 * chip, a rounded success-tint chip with a Lucide `Check`), hoisted to the top of the stack per
 * Fresha's own element order (a small icon-in-chip, never a big animated disc).
 *
 * Grounded-in: components-legacy/booking/BookingConfirmation.tsx (real 671-line screen; every
 * data field, derivation (isPaid/isConfirming/isCancelledNow/canManage/canCancel/canReschedule),
 * action (handleCalendar, directionsHref, manageHref) and copy string below is taken from that
 * file, not invented) + app/[locale]/confirmation/page.tsx (the real server route feeding it).
 *
 * Direction: Fresha's own confirmation anatomy (`_design-system/references/fresha--confirmation.md`)
 * placed in the FIXED order this surface's brief sets for all three directions: the confirmed
 * moment, then date and time, then the salon, then service/professional/price/duration, then the
 * actions. The photo hero stays first as pure chrome (Fresha's own element #1, verified: "Photo
 * hero, spanning the full width... Share/heart/back are venue-gallery chrome, not confirmation-specific"),
 * everything else follows the brief's fixed sequence. Airbnb's look-recipe supplies the FINISH
 * only: type sizes/weights, divider rhythm, and the ink rounded-rect button recipe (`airbnb--
 * checkout-and-confirmation.md`: "Next" button, ink black, no gradient, no capsule), never Airbnb's
 * own Reserve-pill/brand-gradient CTA (a named CONFLICT against Solen's ink-only commit-button
 * lock, kept, see Conflicts). Fresha's own "grouped action-row" anatomy (icon disc + title +
 * subtitle, no chevron, hairline divider) replaces the real screen's plain calendar/directions/
 * manage rows, per the reference file's own port-map suggestion ("This grouped action-row block is
 * the clearest NEW anatomy Fresha suggests porting").
 *
 * Sources:
 * - fresha--confirmation.md: element order (indicator -> headline -> duration -> venue -> action
 *   rows -> Overview/Total -> cancellation policy -> booking ref -> nothing sticky), ~40px
 *   action-row icon discs (verified), no chevron on action rows (verified), no sticky CTA
 *   (verified, "no primary CTA renders anywhere on this screen").
 * - airbnb--look-recipe.md: Solen's frozen ink token kept over Airbnb's slightly lighter reading
 *   (CONFLICT, frozen LOCKFILE literal, kept); hairline kept at Solen's own value, close enough
 *   to Airbnb's neutral-grey family, no change; card radius kept at Solen's locked 16px, not
 *   Airbnb's 20px (CONFLICT, named, kept); card shadow kept at the elevation-2 token per the
 *   design contract's PDP/booking-sidebar-card row (Airbnb runs flat, CONFLICT, named, kept, also
 *   needs an edge-visibility boundary Airbnb's bare-radius card does not automatically clear).
 * - airbnb--checkout-and-confirmation.md: "Next"/"Got it" button recipe (dark solid fill, radius
 *   12, h 40, no gradient) is the compatible half named in that file's own conflicts list; ported
 *   here as the CTA finish, with Solen's locked 16px radius kept over Airbnb's 12px (CONFLICT,
 *   minor, named, kept) and Solen's 44px touch-target floor kept over Airbnb's 40px (a11y floor
 *   outranks a look number). The warm off-white confirmation background is the file's OWN flagged
 *   conflict against Solen's neutral-surface rule and is NOT ported; this screen stays white.
 * - airbnb--motion.md: press-feedback duration (100ms) confirmed as already matching Solen's own
 *   80-100ms press tier (THE SPEED LAW); Solen's decelerate-on-press curve pairing is KEPT over
 *   Airbnb's single universal curve (an already-decided, named divergence in that file's own
 *   Conflicts section, not re-opened here). Hover-lift 200ms glide matches Solen's own locked
 *   "Hover lift (cards): 200ms glide" row exactly, used on the action rows' hover state.
 * - 21st-dev--motion-kit.md: Tabs in-place-select timing (150ms, a standard ease-out curve) is a
 *   byte-for-byte match to Solen's locked snap token; used on the price-breakdown chevron's rotate
 *   flip below (an in-place toggle, the exact case that table names).
 * - `_design-system/MOTION.md` THE ENTER RECIPE (opacity 0->1, scale 0.96->1, blur 8px->0, 280ms
 *   glide) and its shared primitives module (`app/[locale]/_components/primitives/motion.ts`,
 *   read-only, imported unchanged, never forked): `useStaggerVariants` drives the whole-screen
 *   entrance (the "confirmed moment animates once on entry" requirement), `enterVariants` drives
 *   the price-breakdown reveal (the "more motion when I click stuff, between stuff" requirement).
 *   This file lives under a /dev/ route, which the motion-recipe gate's own docstring says it
 *   skips by design; the recipe is still followed exactly, on the brief's own instruction, not
 *   because a gate would otherwise block it.
 *
 * Conflicts (locks kept over the reference, per the brief):
 * - Solen's ink CTA fill kept on both action buttons (never Airbnb's rausch-gradient pill).
 * - Radius kept at Solen's locked 16px everywhere a button/card/chip renders (cards, the two CTA
 *   buttons), not Airbnb's 20px card radius or 12px button radius.
 * - The two CTA buttons here render an explicit 16px corner, NOT the Tailwind capsule token the
 *   REAL BookingConfirmation.tsx still ships (`tailwind.config.js` defines its own `btn` radius as
 *   a true capsule at 99px, which predates the 2026-08-16 button/chip-radius lock, "16px, NOT a
 *   capsule... owner 2026-08-16, 'you're really elongating this pill'"). The real production
 *   screen has not been swept to the current lock yet; this mockup follows the CURRENT lock
 *   (LOCKFILE/design-contract outranks an unswept token per the precedence chain), flagged here
 *   rather than silently "fixed" in real code.
 * - Blue stays sparse: only the "Manage booking" text link and the price-breakdown toggle chevron
 *   are blue-adjacent-clickable; no blue on the CTA, price, or any heading.
 * - No sticky bottom bar: Fresha's own capture states "nothing is sticky, no primary CTA renders
 *   anywhere on this screen" for a confirmation receipt, and the sticky-bottom-bar floor is scoped
 *   to a screen with a single primary commit action, which a post-purchase receipt is not. Both
 *   CTAs render in normal flow, matching the real production screen's own placement.
 * - No warm off-white background (Airbnb's own confirmation screen is the one warm surface in
 *   that whole capture; Solen's neutral-surfaces rule bans it). This screen stays white/sunken
 *   only.
 * - No middle-dot separator: the date/time meta line uses the shared no-glyph spacer component,
 *   not a dot character, between the time and the duration.
 *
 * floors: (a) photo focal = the salon's real cover photo, a 240px hero spanning the full width
 * with no side margin; (b) one biggest element = the date/time headline at 30px, the single
 * largest text on screen (Total price sits at 24px, a clearly smaller secondary anchor); (c) real
 * numbers = the real appointment date/time, real duration, real price (tabular-nums), real VAT
 * rate and net/VAT split when the payment settled; (d) semantic colour moment = the pale-green
 * "Confirmed" indicator (reused from the real screen's own paid-status chip recipe) plus the
 * quiet red "Cancel appointment" text when eligible; (e) no dead-grey zone = white hero-adjacent
 * content alternates with one elevated white card (never a flat grey block) and the sunken
 * action-row icon discs carry warmth via the real photo above them; (f) worst-case content holds
 * = service name and salon name truncate, address wraps to one line and truncates, the two-anchor
 * rule (headline + Total price, both larger than every row title) survives a long salon/service
 * name because both anchors sit in their own row with flexible siblings, and the display anchor
 * (30px) does not depend on content length.
 */
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
  Check,
  Calendar,
  MapPin,
  ChevronRight,
  ChevronDown,
  Scissors,
  ShieldCheck,
  HelpCircle,
} from "lucide-react";
import { FROST_GLASS } from "@/lib/frost-glass";
import { formatCurrency } from "@/lib/format-currency";
import { Avatar } from "@/app/[locale]/_components/primitives/Avatar";
import { MetaDot } from "@/app/[locale]/_components/salon/MetaDot";
import {
  useStaggerVariants,
  enterVariants,
  butterPress,
  SPRING_GENTLE,
} from "@/app/[locale]/_components/primitives/motion";
import type { BookingConfirmationProps } from "@/components-legacy/booking/BookingConfirmation";

interface Props {
  booking: BookingConfirmationProps;
  freeCancelHours: number;
  locale: string;
}

export default function ConfirmationVariantAView({ booking: b, freeCancelHours, locale }: Props) {
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  const { container, item } = useStaggerVariants();

  const localeCode =
    locale === "de" ? "de-CH" : locale === "fr" ? "fr-CH" : locale === "it" ? "it-CH" : "en-CH";
  const start = new Date(b.startsAt);
  const dateLine1 = start.toLocaleDateString(localeCode, { weekday: "long", day: "numeric", month: "long" });
  const dateLine2 = start.toLocaleTimeString(localeCode, { hour: "2-digit", minute: "2-digit" });

  // Same derivations as the real screen (components-legacy/booking/BookingConfirmation.tsx),
  // not re-invented: isPaid gates the green indicator, isConfirming gates the "confirming" text.
  const isPaid = b.paymentStatus === "paid";
  const isConfirming = !isPaid && (b.hasOnlinePayment || b.paymentStatus === "processing");
  const isCancelledNow = b.status === "cancelled";
  const showVat = isPaid && b.vatRate > 0;
  const hasPhoto = Boolean(b.salonCoverUrl);

  const isUpcoming = start.getTime() > Date.now();
  const canCancel = !isCancelledNow && b.status === "confirmed" && isUpcoming;

  const directionsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${b.salonName} ${b.salonAddress}`.trim(),
  )}`;
  const manageHref = b.isGuest && b.accessLink ? b.accessLink : `/${locale}/booking/lookup`;

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="visible"
      className="min-h-[100dvh] bg-s-bg-surface text-s-ink"
    >
      <main className="mx-auto w-full max-w-[440px] pb-16">
        {/* ── Fresha element #1: photo hero, pure chrome, no confirmation-specific meaning ── */}
        {hasPhoto ? (
          <motion.div variants={item} className="relative h-[240px] w-full overflow-hidden">
            <Image
              src={b.salonCoverUrl as string}
              alt=""
              fill
              sizes="(max-width: 440px) 100vw, 440px"
              className="object-cover"
              priority
              aria-hidden
            />
            <div className="absolute inset-x-4 top-4 flex items-center justify-end">
              <span className="grid h-11 w-11 place-items-center rounded-full text-s-ink" style={FROST_GLASS}>
                <HelpCircle size={20} strokeWidth={2.2} aria-hidden />
              </span>
            </div>
          </motion.div>
        ) : null}

        <div className="px-5">
          {/* ── (1) THE CONFIRMED MOMENT: small pale-green indicator, Fresha's own placement,
              Solen's own colour recipe (reused from the real screen's paid-status chip). Animates
              once on entry via the shared stagger recipe; the Check glyph gets an additional
              small spring pop, layered on top of, not instead of, the container's opacity+scale+
              blur entrance. ── */}
          <motion.div variants={item} className="mt-5">
            {isCancelledNow ? (
              <span className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-s-error">
                Booking cancelled
              </span>
            ) : isPaid ? (
              <span className="inline-flex items-center gap-1.5 rounded-pill bg-s-success-bg px-2.5 py-[3px] text-[13px] font-semibold text-s-success">
                <motion.span
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ ...SPRING_GENTLE, delay: 0.18 }}
                  className="grid place-items-center"
                >
                  <Check size={13} strokeWidth={2.6} aria-hidden />
                </motion.span>
                Confirmed
              </span>
            ) : isConfirming ? (
              <span className="text-[13px] text-s-ink-2">Confirming payment…</span>
            ) : (
              <span className="text-[13px] text-s-ink-2">Pay at the salon</span>
            )}
          </motion.div>

          {/* ── (2) date and time: the screen's one display anchor, 30px, the biggest text ── */}
          <motion.div variants={item} className="mt-2">
            <h1 className="text-[30px] font-semibold leading-[1.1] tracking-[-0.02em] text-s-ink">
              {dateLine1}
            </h1>
            <p className="mt-1 flex items-center text-[13px] text-s-ink-2">
              <span>{dateLine2}</span>
              {b.durationMinutes ? (
                <>
                  <MetaDot />
                  <span>{b.durationMinutes} min</span>
                </>
              ) : null}
            </p>
          </motion.div>

          {/* ── (3) the salon: name + address, chevron to the venue (Fresha "Venue details") ── */}
          <motion.div variants={item} className="mt-5">
            <Link
              href={`/${locale}/salon/${b.salonSlug}`}
              className={`flex items-center gap-3 rounded-card border border-s-border bg-white p-4 ${butterPress("row")}`}
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-[15px] font-semibold text-s-ink">{b.salonName}</div>
                {b.salonAddress && (
                  <div className="mt-0.5 flex items-center gap-1 text-[13px] text-s-ink-2">
                    <MapPin size={12} className="shrink-0" aria-hidden />
                    <span className="truncate">{b.salonAddress}</span>
                  </div>
                )}
              </div>
              <ChevronRight size={17} strokeWidth={1.9} className="shrink-0 text-s-ink-2" aria-hidden />
            </Link>
          </motion.div>

          {/* ── (4) service, professional, price and duration: Fresha's "Overview" block ── */}
          <motion.section
            variants={item}
            className="mt-3 overflow-hidden rounded-card border border-s-border bg-white shadow-elevation-2"
          >
            <div className="flex items-center gap-3 p-4">
              <Scissors size={18} strokeWidth={1.9} className="shrink-0 text-s-ink-2" aria-hidden />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[15px] font-semibold text-s-ink">{b.serviceName}</div>
                <div className="mt-0.5 text-[13px] text-s-ink-2">
                  {b.durationMinutes ? `${b.durationMinutes} min` : ""}
                </div>
              </div>
              {b.servicePrice != null && (
                <span className="shrink-0 text-[15px] font-semibold tabular-nums text-s-ink">
                  {formatCurrency(b.servicePrice, locale)}
                </span>
              )}
            </div>

            {b.staffName && (
              <>
                <hr className="border-s-border" />
                <div className="flex items-center gap-3 p-4">
                  {/* size="sm" (13px initials), not the default "xs" (12px): xs would add a
                      5th distinct font size to this screen (the type-budget ceiling is 4),
                      measured live after first building this with "xs". "sm" collapses the
                      avatar's initials into the same 13px meta-text bucket everything else on
                      this row already uses, at the cost of a 36px circle instead of 28px, a
                      real tradeoff logged here rather than silently picked. */}
                  <Avatar src={null} name={b.staffName} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[15px] font-semibold text-s-ink">{b.staffName}</div>
                    <div className="mt-0.5 text-[13px] text-s-ink-2">Your stylist</div>
                  </div>
                </div>
              </>
            )}

            <hr className="border-s-border" />

            {/* Total row, click toggles the Net/VAT breakdown open. Chevron flip uses Solen's
                locked in-place-flip curve (150ms), a byte-for-byte match to 21st.dev's own Tabs
                in-place-select timing. Breakdown reveal itself uses the shared ENTER RECIPE
                (enterVariants), same opacity+scale+blur family, not a second bespoke animation. */}
            <div className="p-4">
              <button
                type="button"
                data-testid="price-breakdown-toggle"
                onClick={() => setBreakdownOpen((v) => !v)}
                disabled={!showVat}
                aria-expanded={breakdownOpen}
                className="flex w-full items-center justify-between gap-3 text-left disabled:cursor-default"
              >
                <span className="flex items-center gap-1 text-[13px] text-s-ink-2">
                  {showVat ? "Total (incl. VAT)" : "Total"}
                  {showVat && (
                    <motion.span
                      animate={{ rotate: breakdownOpen ? 180 : 0 }}
                      transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
                      className="grid place-items-center text-s-ink-2"
                    >
                      <ChevronDown size={14} strokeWidth={2} aria-hidden />
                    </motion.span>
                  )}
                </span>
                <span className="text-[24px] font-semibold leading-none tracking-[-0.01em] tabular-nums text-s-ink">
                  {b.priceLabel}
                </span>
              </button>

              <AnimatePresence initial={false}>
                {breakdownOpen && showVat && (
                  <motion.div
                    variants={enterVariants}
                    initial="hidden"
                    animate="visible"
                    exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.15 } }}
                    className="mt-3 space-y-1.5 border-t border-s-border pt-3"
                  >
                    <div className="flex items-center justify-between text-[13px] text-s-ink-2">
                      <span>Net</span>
                      <span className="tabular-nums">{b.netLabel}</span>
                    </div>
                    <div className="flex items-center justify-between text-[13px] text-s-ink-2">
                      <span>VAT {b.vatRate}%</span>
                      <span className="tabular-nums">{b.vatLabel}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.section>

          {/* ── trust floor: cancellation term, rendered above the actions (kept regardless of
              stickiness, per the brief's own FIXED trust-floor item) ── */}
          <motion.div variants={item} className="mt-4 flex items-start gap-2 px-1">
            <ShieldCheck size={14} strokeWidth={1.7} className="mt-[2px] shrink-0 text-s-success" aria-hidden />
            <p className="text-[13px] leading-[1.5] text-s-ink-2">
              Free cancellation up to {freeCancelHours}h before your appointment.
            </p>
          </motion.div>

          {/* ── (5) the actions: Fresha's grouped action-row anatomy (icon disc + title +
              subtitle, no chevron, hairline divider, neutral icon-disc fill kept over Fresha's
              own brand-tinted disc, see Conflicts) for Directions / Manage booking, then the
              real CTA (ink, 16px radius, Airbnb "Next" finish) ── */}
          <motion.section
            variants={item}
            className="mt-4 overflow-hidden rounded-card border border-s-border bg-white shadow-elevation-2"
          >
            <a
              href={directionsHref}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-3 p-4 ${butterPress("row")} hover:bg-s-bg-sunken`}
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-s-bg-sunken text-s-ink">
                <MapPin size={17} strokeWidth={1.9} aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[15px] font-semibold text-s-ink">Directions</div>
                <div className="truncate text-[13px] text-s-ink-2">{b.salonAddress || b.salonName}</div>
              </div>
            </a>
            <hr className="border-s-border" />
            <Link
              href={manageHref}
              className={`flex items-center gap-3 p-4 ${butterPress("row")} hover:bg-s-bg-sunken`}
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-s-bg-sunken text-s-ink">
                <Calendar size={17} strokeWidth={1.9} aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[15px] font-semibold text-s-ink">Manage booking</div>
                <div className="text-[13px] text-s-ink-2">Reschedule or cancel</div>
              </div>
            </Link>
          </motion.section>

          <motion.button
            variants={item}
            type="button"
            className={`mt-4 flex h-[52px] w-full items-center justify-center gap-2 rounded-[16px] bg-s-ink text-[15px] font-semibold text-white ${butterPress("cta")}`}
          >
            <Calendar size={17} strokeWidth={1.9} aria-hidden />
            Add to calendar
          </motion.button>

          {canCancel && (
            <motion.button
              variants={item}
              type="button"
              className="mt-1 flex h-11 w-full items-center justify-center text-[15px] font-semibold text-s-error transition-opacity duration-150 hover:opacity-80"
            >
              Cancel appointment
            </motion.button>
          )}

          {/* ── Fresha's own last line: the booking reference, small and grey, no card ── */}
          <motion.p variants={item} className="mt-5 text-center text-[13px] text-s-ink-2">
            {b.referenceCode ? `Booking ref: ${b.referenceCode}` : ""}
          </motion.p>
        </div>
      </main>
    </motion.div>
  );
}
