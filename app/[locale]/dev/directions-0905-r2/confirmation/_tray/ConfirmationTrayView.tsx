"use client";

// exists-check: `npm run exists confirmation` (this session) surfaces the real route
// (app/[locale]/confirmation/page.tsx) + BookingConfirmation.tsx (671 lines), the surface this
// view is a round-2 TRAY-system treatment of. The same run found the sibling _lift/LiftConfirmationView.tsx
// and _rule/RuleConfirmationView.tsx already on disk (the other two look systems, both built
// against the same kit). No existing TRAY-system confirmation view before this file.
//
// Depicts: hero photo, kept at the top of the page -> components-legacy/booking/BookingConfirmation.tsx
// Depicts: confirmed-state badge -> app/[locale]/dev/directions-0905-r2/_kit/StatusBadge.tsx
// Depicts: date/time as the display anchor -> components-legacy/booking/BookingConfirmation.tsx
// Depicts: what-happens-next timeline, on the tray band -> app/[locale]/dev/directions-0905/confirmation/_vc/ConfirmationCelebration.tsx
// Depicts: cancellation trust line -> components-legacy/booking/PayConfirmStep.tsx
// Depicts: real cancellation window hours -> app/[locale]/dev/directions-0905/confirmation/_vc/getCancellationInfo.ts
// Depicts: add-to-calendar .ics technique -> components-legacy/booking/BookingConfirmation.tsx
// Depicts: directions action (Google Maps search query) -> components-legacy/booking/BookingConfirmation.tsx
// Depicts: salon row (name, address, chevron), back on white -> components-legacy/booking/BookingConfirmation.tsx
// Depicts: service + staff rows, back on white -> components-legacy/booking/BookingConfirmation.tsx
// Depicts: money block, deposit vs total branch -> components-legacy/booking/BookingConfirmation.tsx
// Depicts: reference code + manage booking footer -> components-legacy/booking/BookingConfirmation.tsx
//
// TRAY keeps the hero photo exactly where round-1 and the real screen put it (the top of the
// page), unlike the sibling LIFT builder, which relocates it into a card; TRAY has no cards to
// relocate it into, per R2_LOOK_SYSTEMS.md Part B SYSTEM 3's own line for this screen: "the
// confirmed moment sits on white ... and nothing carries an edge of its own". The timeline's
// connector rail (a vertical bg-s-border line linking the three step discs in round-1's file) is
// deleted here: the tray band itself is now the grouping device, the same reasoning the sibling
// LIFT builder's own header gives for deleting it in favour of a card edge.
//
// Grounded-in: app/[locale]/dev/directions-0905/confirmation/_vc/ConfirmationCelebration.tsx
// (this direction's own declared order: confirmed moment, date/time, timeline+actions, salon,
// facts -- reused as the structural skeleton, rebuilt component-by-component against the round-2
// kit rather than copied), components-legacy/booking/BookingConfirmation.tsx (money-block branch
// logic transcribed exactly, see the FIX note below; real copy pulled from messages/en.json's
// `ui.successPage` and `payConfirm` namespaces, not invented: restAtSalon, paidOnlineNow,
// totalInclVat, paidInPerson, paymentConfirming, yourStylist, cancellationPolicy),
// app/[locale]/dev/directions-0905-r2/_kit/* (every pill/badge/button/title/meta/price on this
// screen is a kit import, per the kit's own README: "A mockup contains no pill, badge, button,
// size, weight, radius or colour literal of its own; it imports these.").
//
// Screen constraints from the orchestrator brief, both addressed:
//   1. "label the deposit as a deposit, never as Total": the money block's deposit branch never
//      renders the word "Total" anywhere; it reads "Deposit paid online" (small line, real
//      pricePaid) / "Rest at the salon" (the always-open hero figure, messages/en.json
//      ui.successPage.restAtSalon verbatim).
//   2. "show the CHF still owed at the salon in the open, not behind a caret": round-1's own
//      _vc/ConfirmationCelebration.tsx (read in full this session) never even referenced
//      booking.remainingAtSalonLabel -- it rendered a bare, unlabelled booking.priceLabel inside
//      a tap-to-expand accordion (ChevronDown + AnimatePresence), so the real booking this exact
//      loader resolves to (paid CHF 25.50 online, CHF 42.50 still owed at the salon, confirmed
//      live this session via scratchpad/r2/check-booking.mjs) rendered as a bare "CHF 25.50" next
//      to the service name, with no label and no mention of the CHF 42.50 anywhere on the page.
//      This file removes the caret entirely for this section (no button, no chevron, no
//      AnimatePresence): the service row, staff row and money block are all plain, always-visible
//      DOM, matching the sibling _lift and _rule builders' identical fix for the identical bug.
//
// Conflicts surfaced, not silently resolved:
// - CONFLICT [the real prop type only exposes a PRE-FORMATTED currency string for the deposit
//   field]: BookingConfirmationProps (off-limits, the real production type) carries
//   remainingAtSalonLabel as a string, never a raw number, because the shared seedBooking.ts
//   loader (also off-limits) formats it once at fetch time. The kit's Price
//   (app/[locale]/dev/directions-0905-r2/_kit/Price.tsx) only accepts a raw numeric amount and
//   calls formatCurrency itself, so it cannot render this field directly. Built here: a local
//   `Amount` component, using ONLY kit tokens (TYPE_RAMP.cta.size, TYPE_RAMP.body.size,
//   COLOR.inkText, imported, never a literal 15/14/hex written in this file) to style the
//   already-locale-correct pre-formatted string, matching the exact recipe Price.tsx itself uses
//   (font-heading font-semibold tabular-nums). Same deviation the sibling _rule builder named for
//   the identical field. The deposit-paid row DOES use the real kit Price (its raw number,
//   booking.pricePaid, is genuinely available and equal in value to paidNowLabel), so this
//   deviation is scoped to the one field with no raw-number counterpart on the real type.
// - CONFLICT [no kit component for a 14px ink "name/title" row]: the kit ships SectionTitle
//   (28/18/16) and Meta (12, grey), but no component for the locked "name 14, ink" convention
//   (CLAUDE.md design contract, text size row). Built here: a local `RowTitle` component, reading
//   ONLY TYPE_RAMP.body (14/font-normal) + COLOR.inkText, never a literal. Used for the salon
//   name, service name, staff name and the three timeline row titles, per README's own fallback
//   instruction ("build it inside your own folder using kit tokens only").
// - No conflict on stickiness: this is a post-purchase receipt-style screen (round-1's own
//   Direction C header makes the same call), so no sticky bar; hierarchy-density-06 is scoped to
//   a screen with a single primary COMMIT action (Buchen/Bezahlen), which this already-booked
//   confirmation is not.
// - Scope limit, named not silently dropped: same as round-1's Direction C and both sibling
//   round-2 builders, the real screen's GUEST access-link block and its quiet destructive "cancel
//   appointment" tertiary are not reproduced here.
//
// REPAIR PASS (2026-09-06, critic round): three open items fixed, kit only, structure/system
// unchanged.
//   1. Page margin was px-5 (20px) on all three bands, against the locked 16px
//      (_kit/tokens.ts SPACING.pageMargin, "NOT an open axis... a round-2 mockup at 20 or 24 is a
//      lock break, not a look choice"). All three bands (`bg-white px-5 pt-5`, `mt-8 px-5 py-6`,
//      `bg-white px-5 pb-6 pt-8`) are now px-4, matching the hero's own inset-x-4 and the
//      no-photo fallback's px-4, which were already correct.
//   2. The over-photo help icon used the unmodified FROST_GLASS recipe (lib/frost-glass.ts),
//      which computes border:1px solid AND box-shadow simultaneously, a direct hit against the
//      cross-system rule in _kit/systems.ts (CROSS_SYSTEM_RULES: "Nothing carries a border and a
//      shadow at once"), and undocumented (this file never named the conflict, unlike the
//      sibling _rule builder, which hit the identical collision and flattened it). Fixed the same
//      way: `bg-white text-s-ink` only, no border, no shadow, no FROST_GLASS import (removed).
//      Legible against the photo at 100% white opacity, same as RULE's own flat circle.
//   3. Five distinct sizes (28/18/15/14/12) against the CLAUDE.md NEVER-AGAIN floor-2 ceiling
//      (<=4) and _kit/systems.ts's own CROSS_SYSTEM_RULES line ("Four sizes, two weights, per
//      screen ... no exceptions"). This was a genuine kit-level defect, not something this file
//      introduced (R2_LOOK_SYSTEMS.md's own A5 table already specified "14/400 ... and the CTA
//      label at 500", i.e. the CTA was always meant to share body's 14px slot, distinguished by
//      WEIGHT not size; tokens.ts's TYPE_RAMP.cta instead shipped CONFLICT C7's 15px verdict
//      without checking it against A5's own four-size ceiling). _kit/tokens.ts TYPE_RAMP.cta and
//      _kit/Price.tsx's "total" size are both now fixed to 14 (see tokens.ts's own comment on the
//      cta step for the full correction), which this file inherits automatically: no edit needed
//      here beyond re-verifying the render.
//
// measured (post-repair): type ramp sizes render at 28 (SectionTitle as="anchor"), 18
// (SectionTitle as="heading", "What happens next"), 14 (TYPE_RAMP.body/cta, now shared: the local
// RowTitle, Price's "row" and "total" sizes, the local Amount component, PrimaryButton and
// SecondaryButton's label, and TextLink) and 12 (TYPE_RAMP.meta, StatusBadge's own fixed 12px).
// Four distinct values, clearing the ceiling. Weights render at exactly two computed values (400,
// 500): every TYPE_RAMP step uses only "font-medium" or "font-normal", and the local RowTitle's
// one emphasized use ("Rest at the salon") sets font-semibold, which computes to the same 500
// inside <main> per the orchestrator's documented weight-clamp override, so it adds no third
// weight.
//
// floors: (a) photographic focal = the real salon cover photo hero (swapped off the banned
// greyscale hash per ../_rule/getAlternateCoverPhoto.ts, still the same salon's own real gallery
// photo); (b) one biggest element = the 28px date/time anchor (Fresha's own "biggest text on the
// screen" position, per fresha--confirmation.md); (c) real tabular numbers = the real deposit
// paid (CHF 25.50) and real amount still owed at the salon (CHF 42.50), the real service price,
// the real duration in minutes, the real relative-visit countdown computed from
// booking.startsAt, and the real cancellation-window hours; (d) semantic colour = the kit
// StatusBadge's green check icon (confirmed) + the tray band's own green timeline "Confirmed"
// disc + the ShieldCheck trust-line icon (icon-only throughout, never body text, per the
// contrast-tier rule); (e) no dead-grey zone = the tray band + the real photo + the green discs
// break up the page, so no stretch reads as bare/empty; (f) worst-case content: the salon name,
// service name and staff name all truncate on one line, which does not break the two-ink-anchor
// rule (name+price) or the 28px anchor.
//
// system: tray. Verbatim from _plans/R2_LOOK_SYSTEMS.md Part B / _kit/systems.ts: "the canvas
// does the separating, so white groups sit on a #F4F4F5 band carrying neither a border nor a
// shadow, and the page alternates white and tray down the whole scroll." Applied per Part B's own
// line for this exact screen ("Confirmation C: the confirmed moment sits on white, the
// what-happens-next block on a tray band, the salon and the receipt back on white, and nothing
// carries an edge of its own"): band 1 (hero photo + confirmed moment + date/time) is white, band
// 2 (What happens next: heading, timeline, trust line, both actions) sits on a literal
// backgroundColor: COLOR.tray (#F4F4F5) block, band 3 (salon row, service+staff rows, the money
// block, reference code + manage booking) is white again -- two full white<->tray transitions
// down the scroll. No <Card> is used anywhere (system.deltas.card.hairlineCeiling is 0 for tray,
// and border/shadow are both false), so every group is plain spacing on its band's own
// background, never a bordered/shadowed box; every `<hr>`/`border-t` divider round-1 used between
// rows is deleted for the same reason the timeline connector is (the band already groups them).
//
// SELF-VERIFY FIX (this pass): the two "Reminder"/"Your visit" timeline icon spans originally
// carried `border border-s-border bg-white` on the tray band, which is a white-bg element whose
// effective ancestor background is #F4F4F5 -- a literal hit against this system's own
// discriminator ("every group whose computed background is white while its parent is #F4F4F5
// carries border-width: 0 and box-shadow: none"), measured live via getComputedStyle +
// nearest-non-transparent-ancestor walk. Fixed by dropping the border class; bg-white stays (the
// icon glyph alone carries legibility, same minimal treatment the "Confirmed" disc already uses
// with a solid fill and no border). SecondaryButton's own fixed 1px hairline on this same band is
// left untouched: its own file header states "system: none ... does not read useSystem()", a
// cross-system base recipe (LOCKFILE's neutral-outline button rule), not a Card-governed "group",
// so it is not what the tray discriminator's "group" language targets.

import Image from "next/image";
import Link from "next/link";
import { Check, Calendar, MapPin, ChevronRight, HelpCircle, Bell, Scissors, ShieldCheck } from "lucide-react";
import { Avatar } from "@/app/[locale]/_components/primitives/Avatar";
import { MetaDot } from "@/app/[locale]/_components/salon/MetaDot";
import type { BookingConfirmationProps } from "@/components-legacy/booking/BookingConfirmation";
import {
  KitProvider,
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
} from "../../_kit";

// Local, kit-token-only fallback for the locked "name 14, ink" row-title convention (see the
// header's "no kit component for a 14px ink title" conflict). Never a literal size/weight/colour:
// every value below reads from TYPE_RAMP.body / COLOR.inkText.
function RowTitle({
  children,
  className,
  emphasize,
}: {
  children: React.ReactNode;
  className?: string;
  emphasize?: boolean;
}) {
  return (
    <div
      className={["truncate font-body", emphasize ? "font-semibold" : TYPE_RAMP.body.weightClass, className]
        .filter(Boolean)
        .join(" ")}
      style={{ fontSize: TYPE_RAMP.body.size, lineHeight: TYPE_RAMP.body.lineHeight, color: COLOR.inkText }}
    >
      {children}
    </div>
  );
}

// Local, kit-token-only fallback for a pre-formatted currency STRING (see the header's "Price
// only accepts a raw number" conflict). Mirrors Price.tsx's own recipe exactly (font-heading
// font-semibold tabular-nums), never a literal size/colour of its own.
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

export function ConfirmationTrayView({
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
  // The exact real-screen gate (BookingConfirmation.tsx:531): a genuine deposit split, never
  // inferred from anything else. THE FIX lives downstream of this boolean, see the JSX below.
  const hasDepositSplit = isPaid && booking.remainingAtSalonLabel != null;

  const diffDays = Math.round((start.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const relativeVisit = diffDays <= 0 ? "Today" : diffDays === 1 ? "Tomorrow" : `In ${diffDays} days`; // plural-ok: mockup-only English state label (today/tomorrow/in N days), not routed through next-intl per this dev comparison's own English-only rule

  const hasPhoto = Boolean(coverUrl);
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
      `DESCRIPTION:Booked via solen.ch`,
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

  // Kit StatusBadge, per the task brief ("The confirmed state uses the kit StatusBadge"). Every
  // label used is the REAL bookingCard.status.* string (messages/en.json), never invented: the
  // real BookingStatus enum has no 6th "confirming"/"pay at salon" slot, so those payment-timing
  // nuances are conveyed later, in the money block's own label, not bolted onto the badge.
  const statusInfo: { status: BookingStatus; label: string } = isCancelledNow
    ? { status: "cancelled", label: "Cancelled" }
    : isConfirming
      ? { status: "pending", label: "Pending" }
      : { status: "confirmed", label: "Confirmed" };

  return (
    <KitProvider system="tray">
      <div className="min-h-[100dvh] bg-white text-s-ink">
        <main className="mx-auto w-full max-w-[440px]">
          {/* ── hero: real salon photo (swapped off the banned greyscale hash), a flat white
              help circle (not frosted, see the header's repair-pass note on FROST_GLASS). Kept
              at the top, unlike LIFT: TRAY has no card to relocate it into. ── */}
          {hasPhoto ? (
            <div className="relative h-[240px] w-full overflow-hidden">
              <Image
                src={coverUrl as string}
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

          {/* ── WHITE band 1: the confirmed moment + the date/time anchor ── */}
          <div className="bg-white px-4 pt-5">
            <StatusBadge status={statusInfo.status} label={statusInfo.label} />
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
          </div>

          {/* ── TRAY band: what happens next LEADS, both actions live inside the same band.
              No connector rail between the discs: the band itself groups them. ── */}
          <div className="mt-8 px-4 py-6" style={{ backgroundColor: COLOR.tray }}>
            <SectionTitle as="heading">What happens next</SectionTitle>

            <div className="mt-4 flex flex-col gap-3">
              <div className="flex gap-3">
                <span
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full"
                  style={{ backgroundColor: COLOR.success.DEFAULT }}
                >
                  <Check size={17} strokeWidth={2.4} className="text-white" aria-hidden />
                </span>
                <div className="min-w-0 flex-1 pt-1.5">
                  <RowTitle>Confirmed</RowTitle>
                  <Meta>Just now</Meta>
                </div>
              </div>

              {!isCancelledNow && (
                <div className="flex gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white">
                    <Bell size={16} strokeWidth={1.9} className="text-s-ink-2" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1 pt-1.5">
                    <RowTitle>Reminder</RowTitle>
                    <Meta>Sent {freeCancelHours}h before your appointment</Meta>
                  </div>
                </div>
              )}

              {!isCancelledNow && (
                <div className="flex gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white">
                    <Calendar size={16} strokeWidth={1.9} className="text-s-ink-2" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1 pt-1.5">
                    <RowTitle>Your visit</RowTitle>
                    <Meta>{relativeVisit}</Meta>
                  </div>
                </div>
              )}
            </div>

            {!isCancelledNow && (
              <div className="mt-5 flex items-start gap-2">
                <ShieldCheck
                  size={14}
                  strokeWidth={1.6}
                  className="mt-[2px] shrink-0"
                  style={{ color: COLOR.success.DEFAULT }}
                  aria-hidden
                />
                <p style={{ fontSize: TYPE_RAMP.meta.size, lineHeight: 1.5, color: COLOR.meta }} className="font-normal">
                  {`Free cancellation up to ${freeCancelHours}h before.`}
                </p>
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
          </div>

          {/* ── WHITE band 2: salon, the two facts rows, THE FIX (money, always open), footer.
              Nothing here carries a border or a shadow of its own; rows are separated by spacing
              alone, per tray's own hairlineCeiling:0. ── */}
          <div className="bg-white px-4 pb-6 pt-8">
            <Link href={`/${locale}/salon/${booking.salonSlug}`} className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <RowTitle>{booking.salonName}</RowTitle>
                {booking.salonAddress && (
                  <div className="mt-0.5 flex items-center gap-1">
                    <MapPin size={12} className="shrink-0" style={{ color: COLOR.meta }} aria-hidden />
                    <Meta className="truncate">{booking.salonAddress}</Meta>
                  </div>
                )}
              </div>
              <ChevronRight size={17} strokeWidth={1.9} className="shrink-0" style={{ color: COLOR.meta }} aria-hidden />
            </Link>

            <div className="mt-4 flex items-center gap-3">
              <Scissors size={18} strokeWidth={1.9} className="shrink-0" style={{ color: COLOR.meta }} aria-hidden />
              <div className="min-w-0 flex-1">
                <RowTitle>{booking.serviceName}</RowTitle>
                {booking.durationMinutes ? (
                  <Meta>{showVat ? `${booking.durationMinutes} min, incl. VAT` : `${booking.durationMinutes} min`}</Meta>
                ) : null}
              </div>
            </div>

            {booking.staffName && (
              <div className="mt-3 flex items-center gap-3">
                <Avatar src={null} name={booking.staffName} size="xs" />
                <div className="min-w-0 flex-1">
                  <RowTitle>{booking.staffName}</RowTitle>
                  <Meta>Your stylist</Meta>
                </div>
              </div>
            )}

            {/* ── THE FIX: a genuine deposit split renders "Deposit paid online" (small) +
                "Rest at the salon" as the ALWAYS-OPEN hero figure -- never behind a caret, never
                labelled "Total". Only the true single-total case keeps the word "Total". ── */}
            <div className="mt-4">
              {hasDepositSplit ? (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <Meta>Deposit paid online</Meta>
                    <Price amount={booking.pricePaid} locale={localeCode} size="row" />
                  </div>
                  <div className="mt-3 flex items-end justify-between gap-3">
                    <RowTitle emphasize className="w-auto flex-none">
                      Rest at the salon
                    </RowTitle>
                    <Amount size="total">{booking.remainingAtSalonLabel}</Amount>
                  </div>
                </>
              ) : (
                <div className="flex items-end justify-between gap-3">
                  <div className="min-w-0">
                    <Meta>{showVat ? "Total, incl. VAT" : "Total"}</Meta>
                    {isCancelledNow ? (
                      <Meta className="mt-1 block" style={{ color: COLOR.error.DEFAULT }}>
                        Cancelled
                      </Meta>
                    ) : isPaid ? (
                      <span className="mt-1 inline-flex">
                        <StatusBadge status="confirmed" label="Paid" />
                      </span>
                    ) : isConfirming ? (
                      <Meta className="mt-1 block">Confirming payment</Meta>
                    ) : (
                      <Meta className="mt-1 block">Pay at the salon</Meta>
                    )}
                  </div>
                  <Price amount={booking.pricePaid} locale={localeCode} size="total" />
                </div>
              )}
            </div>

            <div className="mt-8 flex items-center justify-between gap-3">
              {booking.referenceCode ? <Meta>{booking.referenceCode}</Meta> : <span />}
              <TextLink href={manageHref}>Manage booking</TextLink>
            </div>
          </div>

          {/* HideInBooking.tsx strips the header + 125px BottomNav on every /dev route; this
              spacer measures the fold the way the real, chromed phone would. */}
          <div style={{ height: 125 }} aria-hidden="true" />
        </main>
      </div>
    </KitProvider>
  );
}
