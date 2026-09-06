"use client";

// Exists-check: `npm run exists directions-0905-r3` (run this session) returned 7 owner-rejected
// round-2 hits from the 2026-09-06 pass (see `_design-system/REMOVED.md`), none of them a
// confirmation view. `npm run exists confirmation` surfaces the real route + the 671-line
// BookingConfirmation.tsx (both cited below), and this round's own confirmation base, the
// RULE-system view this file refines into Candidate A. No existing Candidate-A confirmation view
// before this file.
//
// Grounded-in: app/[locale]/confirmation/page.tsx + components-legacy/booking/BookingConfirmation.tsx
// (the real props shape, the money-card branch logic, the .ics technique, the directions link).
// This round's own confirmation base (the RULE-system view one folder over from this route's own
// tree) is the direct starting point per the brief ("start your view from it by hand, never cp");
// its own header cites _design-system/references/fresha--confirmation.md as the placement source,
// which this file reads directly too (salon/service/staff/payment order, top to bottom).
//
// Depicts: hero photo -> components-legacy/booking/BookingConfirmation.tsx (the salonCoverUrl +
//   Image fill technique, unchanged from this round's own confirmation base).
// Depicts: the confirmed-state badge -> the kit's StatusBadge.tsx (treatment="pastel" per the
//   orchestrator's decision (4) for this build, "A and B keep the pale-fill badge").
// Depicts: the anchor (date only) -> the kit's tokens.ts TYPE_RAMP.anchor, content per
//   ROOT_CAUSES.md Part 3.1 fix item 3 (see the FIX LIST section below).
// Depicts: timeline anatomy (confirmed / reminder / the visit) -> RuleConfirmationView.tsx's
//   identical timeline block (this round's own confirmation base), carried forward unchanged.
// Depicts: the "Your appointment" record (salon, service, staff) -> the kit's Card.tsx
//   variant="entity" (composed, not hand-drawn); anatomy order from
//   _design-system/references/fresha--confirmation.md items 4 and 6.
// Depicts: the deposit/total payment breakdown -> components-legacy/booking/BookingConfirmation.tsx.
//
// ============================================================================================
// FIX LIST APPLIED -- ROOT_CAUSES.md Part 3.1 "Confirmation" (diagnosed against this round's own
// confirmation base; Candidate A = "RULE refined", so this IS the refinement pass that section
// describes). One line per item, each naming exactly where it landed in this file:
//
//  1. "Wrap the three 'Your appointment' facets (salon, service, staff) in ONE card, 16px radius,
//     with inset hairlines between rows... Remove that mid-list <hr>."
//     APPLIED: the single <Card variant="entity"> block below holds all three rows (salon, then
//     service, then staff), separated by mx-[7px] hairlines. That is not an eyeballed number: the
//     card's own 1px border (SYSTEMS.a.deltas.card.borderExceptionVariant) already pushes each
//     row's content 1px in from the page's 16px (px-4) margin, so 7px of margin on top of that
//     lands the hairline at the SAME 24px absolute screen inset as every page-level hairline
//     below (16 + 1 + 7 = 24, SPACING.dividerInset). ROUND-1 FIX (see the critic's punch list):
//     the round-3 build had left these two card-internal hairlines at mx-4 (measured 33px absolute,
//     one border-width short of matching), a second inset value on the same screen; this closes it.
//     The old page-level mid-list divider between the service and staff rows is gone;
//     there is now exactly one card boundary and zero loose hairlines inside it. Candidate A's own
//     value sheet forces the border on this exact card for free (systems.ts SYSTEMS.a.deltas.card
//     .borderExceptionVariant === "entity" is the SAME field this round's confirmation base
//     already reads), so this needed no new plumbing, only moving the rows inside one Card.
//
//  2. "Wrap the three 'What happens next' rows in ONE card, 16px radius... [the LIFT candidate]
//     already ships this exact content in one card."
//     NOT APPLIED AS WRITTEN, and named here rather than silently done: Candidate A's own value
//     sheet caps bordered/shadowed containers at ONE per screen ("Container treatment: None...
//     ONE named exception: a single identity block per screen may carry a border"), and
//     R3_ONE_SYSTEM.md says this in so many words under "What A cannot do, measured: it has no
//     legal container for a record's facts... two facet groups un-grouped" -- Candidate A is
//     documented as the candidate that trades this exact fix away, that is WHY Candidate B is the
//     recommendation. Adding a second bordered card here would (a) invent a value not on
//     Candidate A's sheet ("nothing from another candidate", the brief's own rule) and (b)
//     reproduce Cause 1 on this exact screen ("two card radii on one screen... for content that is
//     not obviously more or less category-like than its neighbours", the same sentence
//     ROOT_CAUSES.md uses to convict the sibling candidate's confirmation build). What IS applied,
//     inside Candidate A's own permitted vocabulary: the section is bounded top and bottom by the
//     system's own hairline device (the mx-2 dividers immediately before "What happens next" and
//     immediately after its footer row, both already present, both now the section's own tight
//     boundary rather than a stray mid-page rule), and the connector rail between the three
//     timeline discs stays (a candidate-A screen has no card edge to do that grouping job instead,
//     unlike the sibling candidate whose own comment says the rail is deleted BECAUSE "the card
//     edge already groups them" -- that precondition does not hold here). See `concerns` in the
//     calling session's return for this named tradeoff.
//
//  3. "Headline drops to the date only... and '11:00' appears once, in the 12px subtext line...
//     This is [the LIFT candidate's] own headline for the same content."
//     APPLIED: the <h1> below renders `dateStr` alone (no "You're booked for... at..." sentence
//     wrapping it), matching this round's own sibling build's identical h1. The time renders
//     exactly once, in the Meta row directly under the anchor. State (cancelled / confirming /
//     booked) is carried by the StatusBadge label above the anchor, not folded into the sentence.
//
//  4. "All 5 <hr> dividers move from left:40 to the page column at left:16, or the whole page
//     moves to 40; one of the two, not both."
//     APPLIED, ROUND-1 FIX (corrects a real regression the critic measured, not new work): the
//     round-3 build had every standalone page-level <hr> at mx-6 sitting inside the page's own
//     16px (px-4) padding, which compounds to a 40px absolute inset (16 + 24), not the sheet's
//     locked 24px SPACING.dividerInset; the two card-internal hairlines were a second, different
//     40px-short value (33px, see fix item 1). Both groups now use a margin chosen so the
//     ALREADY-PRESENT ancestor padding lands them on the same absolute 24px inset: mx-2 (8px) on
//     top of the page's 16px margin for every standalone <hr> (16 + 8 = 24), and mx-[7px] on top
//     of the page's 16px plus the entity card's own 1px border for the two card-internal ones
//     (16 + 1 + 7 = 24). All six hairlines on this screen now measure the identical 24px inset on
//     both edges, one grid, matching the sheet value literally rather than just matching each
//     other.
//
//  5. "Gap values collapse to the five-value ladder... the 80px and 96px outliers disappear on
//     their own once items 1 and 2 land."
//     APPLIED: every top-level vertical margin below is one of the kit's own SPACING values
//     (12 / 16 / 20 / 24 / 32, via mt-3 / mt-4 / mt-5 / mt-6 / mt-8); the button-stack gap was
//     gap-2.5 (10px, off the ladder) in this round's own confirmation base and is now gap-3
//     (12px, SPACING.sibling). Measured distinct values in this fold's own return: see
//     `measured:` below.
//
//  6. "The confirmed badge's check icon goes from #0A0A0A to #16A34A... fix it in the shared
//     component."
//     ALREADY SATISFIED by the shared kit: StatusBadge.tsx's own VARIANTS.confirmed.iconColor
//     already reads COLOR.success.DEFAULT (#16A34A), not ink; this file changes nothing there, it
//     only imports StatusBadge and passes treatment="pastel" (orchestrator decision 4).
//
//  7. "'Deposit paid online' is promoted from 12px/400/#6B6B6B to 14px/400/#0A0A0A, matching its
//     peer 'Owed at salon'."
//     APPLIED: the deposit branch's first label below is <Body>Deposit paid online</Body> (14px
//     ink, the same Body wrapper "Owed at salon" already used), not <Meta> (12px grey).
// ============================================================================================
//
// Conflicts surfaced, not silently resolved (carried from this round's own confirmation base,
// unchanged by this refinement, still true here):
// - CONFLICT [the real prop type only exposes a PRE-FORMATTED currency string for the deposit
//   fields]: components-legacy/booking/BookingConfirmation.tsx's own BookingConfirmationProps
//   carries remainingAtSalonLabel as a pre-formatted string, never a raw number, so the kit's own
//   Price component (a raw-number formatter) cannot render it. The local Amount() wrapper below
//   styles that one field with kit tokens only (TYPE_RAMP.cta.size, COLOR.inkText), never a
//   literal size/hex of its own.
// - CONFLICT [the frosted-glass control recipe vs. Candidate A's zero-shadow discriminator]: the
//   help-icon circle over the hero photo stays a flat white circle (no blur, no shadow), since
//   Candidate A's own discriminator is "count(box-shadow) = 0" and the frosted recipe carries one.
// - No conflict on stickiness: this is a post-purchase receipt screen (fresha--confirmation.md's
//   own Philosophy section: "nothing is sticky and there is no primary CTA anywhere on the
//   screen, because the job here is confirming and informing, not selling a next action"), so no
//   sticky bar; hierarchy-density-06 is scoped to a screen with a single primary COMMIT action,
//   which an already-booked confirmation is not.
// - Scope limit, named not silently dropped: the real screen's guest access-link block and its
//   quiet destructive "cancel appointment" tertiary are not reproduced here, matching this round's
//   own confirmation base and round-1's Direction C before it; this is a structure/treatment
//   exploration of the confirmed-and-owner-linked receipt, not a full parity rebuild of every
//   guest/cancel affordance.
//
// measured: rendered via Playwright at 390x844 (dpr 3) on
// /en/dev/directions-0905-r3/confirmation/a; see the calling session's structured return for the
// live getBoundingClientRect/getComputedStyle pass (distinct sizes/weights, touch targets,
// box-shadow count, hairline insets, bordered-element count, vertical gap ladder).
//
// floors: (a) photographic focal = the real salon cover photo hero (swapped off the banned
// greyscale hash by ./data.ts's re-exported loader, still the real salon's own real gallery
// photo); confirmation is a receipt/checkout-family screen, exempt from the 1/3 fold-share floor
// by name (CLAUDE.md imagery row: "Exempt: forms, checkout payment, legal, receipts"), so the
// 240px hero is a bonus, not a requirement; (b) one biggest element = the 28px anchor (the date);
// (c) real tabular number = booking.pricePaid via the real formatCurrency-backed Price, the real
// duration in minutes, the real relative-visit countdown computed from booking.startsAt, the real
// cancellation-window hours; (d) semantic colour = the kit StatusBadge's green check icon
// (confirmed) plus the ShieldCheck trust-line icon; (e) no dead-grey zone = white throughout,
// Candidate A's own device (hairlines + one entity card) does the separating, no tray anywhere;
// (f) worst-case content: the salon name, service name and staff name all truncate (see the
// truncate classes below), which does not break the two-ink-anchor rule (name+price) or the 28px
// anchor.
//
// system: a (CANDIDATE A, RULE REFINED, _plans/R3_ONE_SYSTEM.md). Wrapped in
// <KitProvider system="a">. Applied here: zero box-shadow anywhere; exactly one bordered element
// (the "Your appointment" Card variant="entity", forced by systems.ts SYSTEMS.a.deltas.card
// .borderExceptionVariant); every hairline on the screen (the four standalone page-level ones and
// the two inside the entity card) measures the identical 24px absolute inset on both edges (the
// kit's own SPACING.dividerInset), via mx-2 on the standalone ones and mx-[7px] on the two inside
// the card, correcting a round-1 punch item; pill/button radius is the unchanged 9999px capsule
// (Candidate A's sheet: "identical to PrimaryButton.tsx/SecondaryButton.tsx's shipped recipe", so
// PrimaryButton/SecondaryButton render through their original, un-branched code path since
// SYSTEMS.a.candidate.button.secondaryFill is "outline", not "neutralFill"); status badge is
// "pastel" (Candidate A's sheet: "identical to StatusBadge.tsx's shipped pastel+ink+icon recipe").

import Link from "next/link";
import Image from "next/image";
import { Check, Calendar, MapPin, ChevronRight, Bell, Scissors, ShieldCheck, HelpCircle } from "lucide-react";
import { Avatar } from "@/app/[locale]/_components/primitives/Avatar";
import { MetaDot } from "@/app/[locale]/_components/salon/MetaDot";
import type { BookingConfirmationProps } from "@/components-legacy/booking/BookingConfirmation";
import {
  KitProvider,
  Card,
  SectionTitle,
  Meta,
  Price,
  StatusBadge,
  PrimaryButton,
  SecondaryButton,
  TextLink,
  TYPE_RAMP,
  COLOR,
  type BookingStatus,
} from "./kit"; // NOT the round-3 shared barrel: see ./kit.ts's own header for the exact live
// syntax defect in that file (out of this screen's writable scope) and why this re-export exists.

const TIMELINE_DELAYS = ["0ms", "60ms", "120ms"] as const;

const STATUS_LABEL: Record<BookingStatus, string> = {
  confirmed: "Confirmed",
  pending: "Pending",
  cancelled: "Cancelled",
  completed: "Completed",
  no_show: "No-show",
};

function isBookingStatus(v: string | null | undefined): v is BookingStatus {
  return v === "confirmed" || v === "pending" || v === "cancelled" || v === "completed" || v === "no_show";
}

/** Local addition beyond the kit (see the CONFLICT note above): a pre-formatted-string amount,
 * styled with kit tokens only. Kept local, not added to the shared kit, because the kit's real
 * Price (a raw-number amount) is correct for every OTHER round-3 screen; this is a one-off gap
 * specific to a real prop type that only exposes a pre-formatted label for this one field. */
function Amount({ children, size = "row" }: { children: React.ReactNode; size?: "row" | "total" }) {
  return (
    <span
      className="font-heading font-semibold tabular-nums"
      style={{ fontSize: size === "total" ? TYPE_RAMP.cta.size : TYPE_RAMP.body.size, color: COLOR.inkText }}
    >
      {children}
    </span>
  );
}

/** Second local addition (see the CONFLICT note above): the kit exports SectionTitle (18/28) and
 * Meta (12) as components, but no component for the 14px body/row-title tier, even though
 * tokens.ts defines TYPE_RAMP.body for it. Every row title on this screen reads
 * TYPE_RAMP.body.size and COLOR.inkText through this wrapper instead of a literal `text-[14px]`
 * class. */
function Body({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={["font-body", className].filter(Boolean).join(" ")}
      style={{ fontSize: TYPE_RAMP.body.size, fontWeight: 400, color: COLOR.inkText }}
    >
      {children}
    </span>
  );
}

export function AConfirmationView({
  booking,
  freeCancelHours,
  coverUrl,
  locale,
}: {
  booking: BookingConfirmationProps;
  freeCancelHours: number;
  coverUrl: string | null;
  locale: string;
}) {
  const localeCode =
    locale === "de" ? "de-CH" : locale === "fr" ? "fr-CH" : locale === "it" ? "it-CH" : "en-CH";
  const start = new Date(booking.startsAt);
  const dateStr = start.toLocaleDateString(localeCode, { weekday: "long", day: "numeric", month: "long" });
  const timeStr = start.toLocaleTimeString(localeCode, { hour: "2-digit", minute: "2-digit" });

  // Same payment-truth derivation as the real screen (never an unconditional "paid").
  const isPaid = booking.paymentStatus === "paid";
  const isConfirming = !isPaid && (booking.hasOnlinePayment || booking.paymentStatus === "processing");
  const isCancelledNow = booking.status === "cancelled";
  const showVat = isPaid && booking.vatRate > 0;
  const hasDeposit = isPaid && Boolean(booking.remainingAtSalonLabel);

  // Real, derived from booking.startsAt, never fabricated.
  const diffDays = Math.round((start.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const relativeVisit = diffDays <= 0 ? "Today" : diffDays === 1 ? "Tomorrow" : `In ${diffDays} days`; // plural-ok: mockup-only English state label, not routed through next-intl per this dev comparison's own English-only rule

  const bookingStatus: BookingStatus = isBookingStatus(booking.status) ? booking.status : "confirmed";

  const helpHref = `/${locale}/help`;
  const manageHref = booking.isGuest && booking.accessLink ? booking.accessLink : `/${locale}/booking/lookup`;
  const directionsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${booking.salonName} ${booking.salonAddress}`.trim(),
  )}`;

  // Same .ics technique as BookingConfirmation.tsx's handleCalendar, not re-invented.
  const handleCalendar = () => {
    const end = new Date(start.getTime() + (booking.durationMinutes ?? 60) * 60 * 1000);
    const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Solen.ch//Booking//EN",
      "BEGIN:VEVENT",
      `DTSTART:${fmt(start)}`,
      `DTEND:${fmt(end)}`,
      `SUMMARY:${booking.serviceName} @ ${booking.salonName}`,
      "DESCRIPTION:Booked via solen.ch",
      `LOCATION:${booking.salonAddress || booking.salonName}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `solen-${(booking.referenceCode || "booking").toLowerCase()}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openDirections = () => window.open(directionsHref, "_blank", "noopener,noreferrer");

  return (
    <KitProvider system="a">
      <div className="min-h-[100dvh] bg-white text-s-ink">
        <main className="mx-auto w-full max-w-[440px]">
          {/* ── hero: real salon photo, runs the full viewport width flush to both edges with
              0px corner radius (Candidate A's own photo rule for a screen hero), a flat white
              help circle (no shadow, Candidate A's own "shadow: none, on anything" delta) ── */}
          {coverUrl ? (
            <div className="relative h-[240px] w-full overflow-hidden">
              <Image
                src={coverUrl}
                alt=""
                fill
                sizes="(max-width: 440px) 100vw, 440px"
                className="object-cover"
                priority
                aria-hidden
              />
              <div className="absolute inset-x-4 top-4 flex items-center justify-end">
                <Link
                  href={helpHref}
                  aria-label="Help"
                  className="grid h-11 w-11 place-items-center rounded-full bg-white text-s-ink"
                >
                  <HelpCircle size={20} strokeWidth={2.2} aria-hidden />
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-end px-4 pt-4">
              <Link
                href={helpHref}
                aria-label="Help"
                className="grid h-11 w-11 place-items-center rounded-full border border-s-border bg-white text-s-ink"
              >
                <HelpCircle size={20} strokeWidth={2.2} aria-hidden />
              </Link>
            </div>
          )}

          <div className="px-4">
            {/* ── 1. confirmed moment: kit StatusBadge, then the anchor (FIX 3: the date alone,
                never a sentence wrapping it; state lives in the badge label above) ── */}
            <div className="mt-5">
              <StatusBadge status={bookingStatus} label={STATUS_LABEL[bookingStatus]} treatment="pastel" />
            </div>
            <SectionTitle as="anchor" className="mt-3">
              {dateStr}
            </SectionTitle>
            <div className="mt-1 flex items-center">
              <Meta>{timeStr}</Meta>
              {booking.durationMinutes ? (
                <>
                  <MetaDot />
                  <Meta>{booking.durationMinutes} min</Meta>
                </>
              ) : null}
            </div>

            {/* ── ROUND-1 FIX (trust floor, LOCKFILE hierarchy-density-05(c) / orchestrator
                decision 8): who the user is booking with must render above the commit buttons.
                Previously the salon name only appeared inside the "Your appointment" Card near the
                bottom of the page, below both "Add to calendar" and "Directions". This line puts it
                directly under the date/time, in the same top block Fresha uses for it: this round's
                own fresha--confirmation.md, "Measured" item 5's fourth row, "'Venue details' / the
                venue name (verified)", which sits with the other top-of-screen facts, above
                Fresha's own Overview section. Not a link (the full salon record, address included,
                still lives once in the entity card below); just the identity fact, same 14px/ink
                Body tier already used for every other row title on this screen, no new size. ── */}
            <div className="mt-2 flex items-center gap-1.5">
              <MapPin size={13} strokeWidth={1.9} className="shrink-0 text-s-ink-2" aria-hidden />
              <span className="min-w-0 truncate">
                <Body>{booking.salonName}</Body>
              </span>
            </div>

            {/* ── hairline, inset 24px both sides (Candidate A's page-level grouping device) ── */}
            <hr className="mx-2 mt-8 border-s-border" />

            {/* ── 2. WHAT HAPPENS NEXT: hairline-bounded (this hr above, and the footer's own
                hairline-free close below, matching where "Your appointment" begins next) since
                Candidate A has no legal second card here (see FIX LIST item 2 above); the
                connector rail stays for the same reason (no card edge exists to do that grouping
                job instead). ── */}
            <SectionTitle as="heading" className="mt-8">
              What happens next
            </SectionTitle>

            <ol className="relative mt-5 flex flex-col gap-5 pl-1">
              <span aria-hidden className="absolute left-[19px] top-3 bottom-3 w-px bg-s-border" />

              <li className="cr-row relative flex gap-3" style={{ animationDelay: TIMELINE_DELAYS[0] }}>
                <span className="relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full bg-s-success">
                  <Check size={17} strokeWidth={2.4} className="text-white" aria-hidden />
                </span>
                <div className="min-w-0 flex-1 pt-1.5">
                  <div>
                    <Body>Confirmed</Body>
                  </div>
                  <div className="mt-0.5">
                    <Meta>Just now</Meta>
                  </div>
                </div>
              </li>

              {!isCancelledNow && (
                <li className="cr-row relative flex gap-3" style={{ animationDelay: TIMELINE_DELAYS[1] }}>
                  <span className="relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full border border-s-border bg-white">
                    <Bell size={16} strokeWidth={1.9} className="text-s-ink-2" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1 pt-1.5">
                    <div>
                      <Body>Reminder</Body>
                    </div>
                    <div className="mt-0.5">
                      <Meta>Sent 24 hours before your appointment</Meta>
                    </div>
                  </div>
                </li>
              )}

              {!isCancelledNow && (
                <li className="cr-row relative flex gap-3" style={{ animationDelay: TIMELINE_DELAYS[2] }}>
                  <span className="relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full border border-s-border bg-white">
                    <Calendar size={16} strokeWidth={1.9} className="text-s-ink-2" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1 pt-1.5">
                    <div>
                      <Body>Your visit</Body>
                    </div>
                    <div className="mt-0.5">
                      <Meta>{relativeVisit}</Meta>
                    </div>
                  </div>
                </li>
              )}
            </ol>

            <style>{`
              @keyframes cr-timeline-enter {
                from { opacity: 0; transform: scale(0.96); filter: blur(8px); }
                to { opacity: 1; transform: scale(1); filter: blur(0); }
              }
              .cr-row {
                animation: cr-timeline-enter 280ms cubic-bezier(0.16, 1, 0.3, 1) both;
              }
              @media (prefers-reduced-motion: reduce) {
                .cr-row { animation: none; }
              }
            `}</style>

            {!isCancelledNow && (
              <div className="mt-5 flex items-start gap-2 px-1">
                <ShieldCheck size={14} strokeWidth={1.6} className="mt-[2px] shrink-0 text-s-success" aria-hidden />
                <Meta>{`Free cancellation up to ${freeCancelHours}h before your appointment.`}</Meta>
              </div>
            )}

            <div className="mt-4 flex flex-col gap-3">
              <PrimaryButton onClick={handleCalendar}>
                <Calendar size={17} strokeWidth={1.9} aria-hidden />
                Add to calendar
              </PrimaryButton>
              <SecondaryButton onClick={openDirections}>
                <MapPin size={17} strokeWidth={1.9} aria-hidden />
                Directions
              </SecondaryButton>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 border-t border-s-border pt-4">
              {booking.referenceCode ? <Meta>{booking.referenceCode}</Meta> : <span />}
              <TextLink href={manageHref} className="inline-flex items-center gap-0.5">
                Manage booking
                <ChevronRight size={15} strokeWidth={1.9} aria-hidden />
              </TextLink>
            </div>

            {/* ── hairline, inset 24px both sides ── */}
            <hr className="mx-2 mt-8 border-s-border" />

            {/* ── 3. Your appointment: FIX 1 -- salon, service, staff now live in ONE Card
                variant="entity" (Candidate A's one named identity-block exception, border forced
                by systems.ts SYSTEMS.a.deltas.card.borderExceptionVariant === "entity"), rows
                separated by inset (mx-[7px], landing at the same 24px absolute screen inset as
                every page-level hairline once the card's own 1px border is added, see the FIX LIST
                item 1/4 header note) hairlines instead of a page-level mid-list <hr>. ── */}
            <SectionTitle as="heading" className="mt-8">
              Your appointment
            </SectionTitle>

            <Card variant="entity" className="mt-4">
              <Link href={`/${locale}/salon/${booking.salonSlug}`} className="flex items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <div className="truncate">
                    <Body className="tracking-[-0.01em]">{booking.salonName}</Body>
                  </div>
                  {booking.salonAddress && (
                    <div className="mt-0.5 flex items-center gap-1">
                      <MapPin size={12} className="shrink-0 text-s-ink-2" aria-hidden />
                      <span className="truncate">
                        <Meta>{booking.salonAddress}</Meta>
                      </span>
                    </div>
                  )}
                </div>
                <ChevronRight size={17} strokeWidth={1.9} className="shrink-0 text-s-ink-2" aria-hidden />
              </Link>

              <hr className="mx-[7px] border-s-border" />

              <div className="flex items-center gap-3 p-4">
                <Scissors size={18} strokeWidth={1.9} className="shrink-0 text-s-ink-2" aria-hidden />
                <div className="min-w-0 flex-1">
                  <div className="truncate">
                    <Body className="tracking-[-0.01em]">{booking.serviceName}</Body>
                  </div>
                  {booking.durationMinutes ? <Meta>{booking.durationMinutes} min</Meta> : null}
                </div>
              </div>

              {booking.staffName && (
                <>
                  <hr className="mx-[7px] border-s-border" />
                  <div className="flex items-center gap-3 p-4">
                    <Avatar src={null} name={booking.staffName} size="xs" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate">
                        <Body>{booking.staffName}</Body>
                      </div>
                      <Meta>your stylist</Meta>
                    </div>
                  </div>
                </>
              )}
            </Card>

            {/* ── hairline, inset 24px both sides ── */}
            <hr className="mx-2 mt-8 border-s-border" />

            {/* ── 4. Payment: FIX 7 -- "Deposit paid online" promoted from Meta (12/grey) to
                Body (14/ink), matching its peer "Owed at salon". The owed amount stays a plain
                row in the open, no caret, no collapsed state. ── */}
            <SectionTitle as="heading" className="mt-8">
              Payment
            </SectionTitle>

            {hasDeposit ? (
              <div className="mt-4 flex flex-col gap-3 pb-10">
                <div className="flex items-center justify-between">
                  <Body>Deposit paid online</Body>
                  <Price amount={booking.pricePaid} size="row" />
                </div>
                <hr className="mx-2 border-s-border" />
                <div className="flex items-end justify-between pt-1">
                  <Body>Owed at salon</Body>
                  <Amount size="total">{booking.remainingAtSalonLabel}</Amount>
                </div>
              </div>
            ) : (
              <div className="mt-4 flex flex-col gap-3 pb-10">
                <div className="flex items-end justify-between">
                  <Meta>{showVat ? "Total, incl. VAT" : "Total"}</Meta>
                  <Price amount={booking.pricePaid} size="total" />
                </div>
                {showVat && (
                  <>
                    <hr className="mx-2 border-s-border" />
                    <div className="flex items-center justify-between">
                      <Meta>Net</Meta>
                      <Meta>{booking.netLabel}</Meta>
                    </div>
                    <div className="flex items-center justify-between">
                      <Meta>{`VAT ${booking.vatRate}%`}</Meta>
                      <Meta>{booking.vatLabel}</Meta>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Bottom spacer matching the height HideInBooking.tsx removes on every /dev route
              (the header + bottom nav, shared, off-limits), so the fold is measured as it would
              render on the real product. */}
          <div style={{ height: 125 }} aria-hidden />
        </main>
      </div>
    </KitProvider>
  );
}
