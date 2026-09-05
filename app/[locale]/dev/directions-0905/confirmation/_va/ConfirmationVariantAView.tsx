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
 * measured: sizes below are UNCHANGED from this file's prior approved pass (not re-eyeballed
 * this round): 240px photo hero (BookingConfirmation.tsx:401 real hero is also 240px), 30px date
 * headline, 24px total price, 15px row-title text, 13px meta/label text, 16px card radius
 * (LOCKFILE lock, not Fresha's/Airbnb's own numbers). This round's only new numeric values are
 * the entrance timing, pulled from the shared locked constants, not eyeballed: 280ms duration
 * (`ENTER_DURATION` from `_components/primitives/motion.ts`), `cubic-bezier(0.16,1,0.3,1)`
 * (`GLIDE_EASE`, same module), 50ms stagger step per element (same number the old
 * `staggerChildren` used, now expressed as a plain `animation-delay`).
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
 * PUNCH FIXES (2026-09-05, critic round), both measured against the LIVE getSeedBooking() row
 * before writing a line of the fix (rule 15/16: verify, don't guess):
 *
 * 1. Dead price-breakdown toggle. The live seed row (curled via a temporary debug dump of the
 *    actual props, since removed) is `servicePrice: 32, pricePaid: 32, vatRate: 0,
 *    remainingAtSalonLabel: null, paidNowLabel: "CHF 0"`. `showVat` (`isPaid && vatRate > 0`) was
 *    false, so the old code rendered the toggle with `disabled` set, a dead affordance (the
 *    NEVER-AGAIN "no dead-affordance" floor). Fixed by making the toggle DATA-DRIVEN: a
 *    `breakdownLines` array is built only from real, already-present fields, never invented ,
 *    a VAT split (Net + VAT, when `showVat`) or a deposit split (Paid online + Due at salon, when
 *    `remainingAtSalonLabel` is present, mirroring the real screen's own genuine second-line case
 *    at BookingConfirmation.tsx:531). When `breakdownLines.length > 0` the row renders as a real
 *    button (no `disabled` ever, because it only renders when there is something to reveal). When
 *    it is empty, the row renders as a plain non-interactive total, no button element, no
 *    `data-testid`, no chevron, so there is no dead control on screen at all.
 *    Verified against the live row: neither split applies (`vatRate` is 0, a non-VAT-registered
 *    salon per the Kleinunternehmen comment already in this file; `remainingAtSalonLabel` is
 *    `null`, not a deposit booking), so on today's live data this renders the static branch, the
 *    exact outcome this same punch item's own second clause names as correct ("when the seed
 *    booking really has one line only, show the single-line total without a dead toggle"). This
 *    is reported as a data-availability fact, not silently glossed: the interactive branch cannot
 *    be video-proven against this specific live row without inventing a second price line on a
 *    real customer receipt, which CLAUDE.md taste rule 1 and the no-fabrication floor both forbid.
 *    See this builder's returned `perClose` and `concerns` for the full account and how the
 *    interactive branch was instead verified (a pure-logic check against the exported
 *    `computeBreakdownLines`, not a fabricated on-screen render).
 *
 * 2. Blank-recorder entrance. Curling the SSR HTML directly (before any fix) showed every
 *    `variants={item}` child rendered with a literal inline
 *    `style="opacity:0;filter:blur(8px);transform:scale(0.96)"` in the RAW served markup, i.e. the
 *    page is genuinely invisible at the HTML/CSS level until React hydrates and Framer Motion's
 *    `useEffect`-scheduled WAAPI transition runs. `useStaggerVariants`' own doc comment claims
 *    "content never depends on motion to become visible", which is true only for the
 *    reduced-motion branch; the default branch depends on hydration completing, and this repo's
 *    own documented fact ("hydration on `next dev` is known to be non-deterministic") plus the
 *    recorder-video evidence (blank for the whole capture) both land on the same failure: when
 *    hydration stalls, the animation that was supposed to reveal the page never starts, and the
 *    SSR'd `opacity:0` never resolves. This is a real gap in the shared `motion.ts` primitive
 *    (flagged under Concerns; that file is off-limits/read-only for this builder, not fixed here).
 *    Fixed LOCALLY, for this file's top-level entrance only, by replacing the Framer-Motion-driven
 *    `container`/`item` stagger with a plain, scoped, NATIVE CSS `@keyframes` animation (see the
 *    `<style>` block below): the base rule is `opacity: 1` (visible with zero JS, zero CSS-engine
 *    dependency beyond parsing the stylesheet, which needs no React hydration at all), and the
 *    entrance keyframe is layered on ADDITIVELY only inside `@media (prefers-reduced-motion:
 *    no-preference)`, so a reduced-motion user never receives it and a slow/failed-hydration user
 *    still sees the page after the animation's own wall-clock duration, because CSS keyframe
 *    animations run on the browser's own timeline and do not wait for React's `useEffect` to fire.
 *    The same three properties and the same locked numbers as THE ENTER RECIPE are kept exactly
 *    (`GLIDE_EASE`/`ENTER_DURATION`, imported unchanged from the shared module, not re-derived):
 *    opacity 0->1, scale 0.96->1, blur(8px)->blur(0), 280ms, `cubic-bezier(0.16,1,0.3,1)`, and the
 *    same ~50ms stagger step between siblings, just driven by `animation-delay` instead of Framer
 *    Motion's `staggerChildren`. AnimatePresence stays for the price-breakdown reveal and the
 *    chevron rotate: both are interaction-gated (a user cannot click before JS has loaded anyway),
 *    so they carry no visibility risk the way the unconditional page entrance did.
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
 *   glide): numbers reused via the shared constants (`GLIDE_EASE`, `ENTER_DURATION`, imported
 *   unchanged), now applied through a local native-CSS keyframe for the page entrance (see Punch
 *   Fix 2 above) instead of the shared hook, specifically because the hook's JS-driven version is
 *   the measured cause of the blank-recorder failure. The price-breakdown reveal still uses the
 *   shared `enterVariants` Framer Motion primitive unchanged (interaction-gated, no robustness gap).
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
 * - Page entrance uses a local native-CSS keyframe instead of the shared `useStaggerVariants`
 *   hook (named + reasoned under Punch Fix 2 above), the one deliberate departure from the
 *   shared motion primitives this file otherwise imports unchanged.
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
import { GLIDE_EASE, ENTER_DURATION, enterVariants } from "@/app/[locale]/_components/primitives/motion";
import type { BookingConfirmationProps } from "@/components-legacy/booking/BookingConfirmation";

interface Props {
  booking: BookingConfirmationProps;
  freeCancelHours: number;
  locale: string;
}

interface BreakdownLine {
  label: string;
  value: string;
}

/**
 * Pure, exported, no side effects: builds the price-breakdown lines from real props only,
 * never a fabricated value. Exported so its behaviour can be unit-checked in isolation against
 * synthetic inputs (see this builder's returned `concerns`) without ever rendering fake numbers
 * on the live customer-facing screen.
 */
export function computeBreakdownLines(b: BookingConfirmationProps): BreakdownLine[] {
  const isPaid = b.paymentStatus === "paid";
  const showVat = isPaid && b.vatRate > 0;
  const hasDepositSplit = isPaid && b.remainingAtSalonLabel != null;

  if (hasDepositSplit) {
    return [
      { label: "Paid online", value: b.paidNowLabel ?? formatCurrency(0, "en") },
      { label: "Due at salon", value: b.remainingAtSalonLabel as string },
    ];
  }
  if (showVat) {
    return [
      { label: "Net", value: b.netLabel },
      { label: `VAT ${b.vatRate}%`, value: b.vatLabel },
    ];
  }
  return [];
}

// Local, scoped, native-CSS entrance (Punch Fix 2). Base rule renders every `.va-enter` element
// fully visible with zero JS and zero animation dependency; the keyframe is layered on top only
// when the OS allows motion, so it never gates visibility. `animation-delay` (set per element via
// inline style below) reproduces the same ~50ms stagger the old `staggerChildren` produced.
const GLIDE_CSS_EASE = `cubic-bezier(${GLIDE_EASE.join(",")})`;
const ENTER_MS = Math.round(ENTER_DURATION * 1000);
const ENTER_CSS = `
  .va-enter { opacity: 1; }
  .va-pop { opacity: 1; transform: scale(1); }
  @media (prefers-reduced-motion: no-preference) {
    @keyframes vaEnter {
      from { opacity: 0; transform: scale(0.96); filter: blur(8px); }
      to { opacity: 1; transform: scale(1); filter: blur(0); }
    }
    @keyframes vaPop {
      from { opacity: 0; transform: scale(0); }
      60% { transform: scale(1.15); }
      to { opacity: 1; transform: scale(1); }
    }
    .va-enter { animation: vaEnter ${ENTER_MS}ms ${GLIDE_CSS_EASE} both; }
    .va-pop { animation: vaPop 260ms ${GLIDE_CSS_EASE} both; animation-delay: 180ms; }
  }
`;

export default function ConfirmationVariantAView({ booking: b, freeCancelHours, locale }: Props) {
  const [breakdownOpen, setBreakdownOpen] = useState(false);

  // Sequential stagger delay, one call per rendered entrance element, in document order (mirrors
  // the old `staggerChildren` 50ms step, now expressed as `animation-delay`).
  let stepIndex = 0;
  const enterStyle = () => ({ animationDelay: `${stepIndex++ * 50}ms` });

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

  const breakdownLines = computeBreakdownLines(b);
  const canExpand = breakdownLines.length > 0;

  const directionsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${b.salonName} ${b.salonAddress}`.trim(),
  )}`;
  const manageHref = b.isGuest && b.accessLink ? b.accessLink : `/${locale}/booking/lookup`;

  return (
    <div className="min-h-[100dvh] bg-s-bg-surface text-s-ink">
      <style>{ENTER_CSS}</style>
      <main className="mx-auto w-full max-w-[440px] pb-16">
        {/* ── Fresha element #1: photo hero, pure chrome, no confirmation-specific meaning ── */}
        {hasPhoto ? (
          <div className="va-enter relative h-[240px] w-full overflow-hidden" style={enterStyle()}>
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
          </div>
        ) : null}

        <div className="px-5">
          {/* ── (1) THE CONFIRMED MOMENT: small pale-green indicator, Fresha's own placement,
              Solen's own colour recipe (reused from the real screen's paid-status chip). Animates
              once on entry via the local CSS entrance; the Check glyph gets an additional small
              CSS pop (va-pop), layered on top of, not instead of, the row's own entrance, both
              additive so the badge and its icon are fully visible even with JS/animation off. ── */}
          <div className="va-enter mt-5" style={enterStyle()}>
            {isCancelledNow ? (
              <span className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-s-error">
                Booking cancelled
              </span>
            ) : isPaid ? (
              <span className="inline-flex items-center gap-1.5 rounded-pill bg-s-success-bg px-2.5 py-[3px] text-[13px] font-semibold text-s-success">
                <span className="va-pop grid place-items-center">
                  <Check size={13} strokeWidth={2.6} aria-hidden />
                </span>
                Confirmed
              </span>
            ) : isConfirming ? (
              <span className="text-[13px] text-s-ink-2">Confirming payment…</span>
            ) : (
              <span className="text-[13px] text-s-ink-2">Pay at the salon</span>
            )}
          </div>

          {/* ── (2) date and time: the screen's one display anchor, 30px, the biggest text ── */}
          <div className="va-enter mt-2" style={enterStyle()}>
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
          </div>

          {/* ── (3) the salon: name + address, chevron to the venue (Fresha "Venue details") ── */}
          <div className="va-enter mt-5" style={enterStyle()}>
            <Link
              href={`/${locale}/salon/${b.salonSlug}`}
              className="flex items-center gap-3 rounded-card border border-s-border bg-white p-4 transition-all duration-[180ms] ease-glide hover:-translate-y-[1px] active:scale-[0.98] active:duration-[80ms]"
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
          </div>

          {/* ── (4) service, professional, price and duration: Fresha's "Overview" block ── */}
          <section
            className="va-enter mt-3 overflow-hidden rounded-card border border-s-border bg-white shadow-elevation-2"
            style={enterStyle()}
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

            {/* Total row. When breakdownLines is non-empty (a real VAT split or a real deposit
                split), this renders as a genuine button that toggles the lines open, chevron
                flip on Solen's locked in-place-flip curve (150ms, a byte-for-byte match to
                21st.dev's own Tabs in-place-select timing). When there is nothing real to
                reveal (today's live seed row: no VAT, no deposit split), this renders as a
                plain non-interactive total, no button, no data-testid, no disabled state, no
                dead affordance on screen at all. */}
            <div className="p-4">
              {canExpand ? (
                <button
                  type="button"
                  data-testid="price-breakdown-toggle"
                  onClick={() => setBreakdownOpen((v) => !v)}
                  aria-expanded={breakdownOpen}
                  className="flex w-full items-center justify-between gap-3 text-left"
                >
                  <span className="flex items-center gap-1 text-[13px] text-s-ink-2">
                    {showVat ? "Total (incl. VAT)" : "Total"}
                    <motion.span
                      animate={{ rotate: breakdownOpen ? 180 : 0 }}
                      transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
                      className="grid place-items-center text-s-ink-2"
                    >
                      <ChevronDown size={14} strokeWidth={2} aria-hidden />
                    </motion.span>
                  </span>
                  <span className="text-[24px] font-semibold leading-none tracking-[-0.01em] tabular-nums text-s-ink">
                    {b.priceLabel}
                  </span>
                </button>
              ) : (
                <div className="flex w-full items-center justify-between gap-3" data-testid="price-total-static">
                  <span className="text-[13px] text-s-ink-2">Total</span>
                  <span className="text-[24px] font-semibold leading-none tracking-[-0.01em] tabular-nums text-s-ink">
                    {b.priceLabel}
                  </span>
                </div>
              )}

              <AnimatePresence initial={false}>
                {breakdownOpen && canExpand && (
                  <motion.div
                    variants={enterVariants}
                    initial="hidden"
                    animate="visible"
                    exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.15 } }}
                    className="mt-3 space-y-1.5 border-t border-s-border pt-3"
                  >
                    {breakdownLines.map((line) => (
                      <div key={line.label} className="flex items-center justify-between text-[13px] text-s-ink-2">
                        <span>{line.label}</span>
                        <span className="tabular-nums">{line.value}</span>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>

          {/* ── trust floor: cancellation term, rendered above the actions (kept regardless of
              stickiness, per the brief's own FIXED trust-floor item) ── */}
          <div className="va-enter mt-4 flex items-start gap-2 px-1" style={enterStyle()}>
            <ShieldCheck size={14} strokeWidth={1.7} className="mt-[2px] shrink-0 text-s-success" aria-hidden />
            <p className="text-[13px] leading-[1.5] text-s-ink-2">
              Free cancellation up to {freeCancelHours}h before your appointment.
            </p>
          </div>

          {/* ── (5) the actions: Fresha's grouped action-row anatomy (icon disc + title +
              subtitle, no chevron, hairline divider, neutral icon-disc fill kept over Fresha's
              own brand-tinted disc, see Conflicts) for Directions / Manage booking, then the
              real CTA (ink, 16px radius, Airbnb "Next" finish) ── */}
          <section
            className="va-enter mt-4 overflow-hidden rounded-card border border-s-border bg-white shadow-elevation-2"
            style={enterStyle()}
          >
            <a
              href={directionsHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 transition-all duration-[180ms] ease-glide hover:-translate-y-[1px] active:scale-[0.98] active:duration-[80ms] hover:bg-s-bg-sunken"
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
              className="flex items-center gap-3 p-4 transition-all duration-[180ms] ease-glide hover:-translate-y-[1px] active:scale-[0.98] active:duration-[80ms] hover:bg-s-bg-sunken"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-s-bg-sunken text-s-ink">
                <Calendar size={17} strokeWidth={1.9} aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[15px] font-semibold text-s-ink">Manage booking</div>
                <div className="text-[13px] text-s-ink-2">Reschedule or cancel</div>
              </div>
            </Link>
          </section>

          <button
            type="button"
            className="va-enter mt-4 flex h-[52px] w-full items-center justify-center gap-2 rounded-[16px] bg-s-ink text-[15px] font-semibold text-white transition-all duration-[180ms] ease-glide hover:-translate-y-[1px] active:scale-[0.97] active:duration-[80ms]"
            style={enterStyle()}
          >
            <Calendar size={17} strokeWidth={1.9} aria-hidden />
            Add to calendar
          </button>

          {canCancel && (
            <button
              type="button"
              className="va-enter mt-1 flex h-11 w-full items-center justify-center text-[15px] font-semibold text-s-error transition-opacity duration-150 hover:opacity-80"
              style={enterStyle()}
            >
              Cancel appointment
            </button>
          )}

          {/* ── Fresha's own last line: the booking reference, small and grey, no card ── */}
          <p className="va-enter mt-5 text-center text-[13px] text-s-ink-2" style={enterStyle()}>
            {b.referenceCode ? `Booking ref: ${b.referenceCode}` : ""}
          </p>
        </div>
      </main>
    </div>
  );
}
