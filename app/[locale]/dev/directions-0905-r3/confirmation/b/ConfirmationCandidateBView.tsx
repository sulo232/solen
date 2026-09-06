"use client";

// Exists-check: `npm run exists directions-0905-r3` (run this session) returned 7 REMOVED hits,
// all owner-rejected round-2 surfaces unrelated to a confirmation receipt (a grey-band look
// system, three home-feed layouts, a set of empty-state treatments, a search-results heading
// line, a review-count display, an isolated component-preview switcher, and one booking-flow
// button harness); none names or governs this screen. `npm run exists confirmation` (this
// session) surfaces the real route + BookingConfirmation.tsx (671 lines), the surface this view
// is Candidate B's refinement of. Net-new: no round-3 candidate-B confirmation client view exists.
//
// Depicts: the hero photo, spanning the full page width outside every card -> components-legacy/booking/BookingConfirmation.tsx
// (the real 240px Image-fill hero anatomy, transcribed). Placement (outside every card, radius 0)
// is an orchestrator decision for this build (Candidate A and B both place the confirmation photo
// this way; Candidate C alone puts it inside the receipt card), matching
// _design-system/references/fresha--confirmation.md item 1 (a full-width photo spanning the
// whole screen, flush at every edge).
// Depicts: the help control floating over the photo -> lib/frost-glass.ts FROST_GLASS (the
// canonical over-photo control treatment) + components-legacy/booking/BookingConfirmation.tsx
// (same help-only top row; that file's own comment records why no second return control is drawn
// here: the app's shared header already renders one on this deep page, V3-D461, "one
// up-affordance, never both", so a second circle floated on this photo would duplicate it).
// Depicts: the confirmed-moment card (status badge + date/time anchor) -> app/[locale]/dev/directions-0905/confirmation/_vc/ConfirmationCelebration.tsx
// (this exploration's own anchor treatment, 28px, a sentence not a label+number) + the round-3
// kit's own StatusBadge.tsx (the confirmed-state recipe)
// Depicts: what-happens-next timeline (Confirmed / Reminder / Your visit) -> app/[locale]/dev/directions-0905/confirmation/_vc/ConfirmationCelebration.tsx
// (carried forward)
// Depicts: the combined "Your appointment" card -> components-legacy/booking/BookingConfirmation.tsx
// (the salon/service/staff row anatomy: name/address/chevron, service+duration+price, staff
// avatar+role). The ONE-card grouping itself (all three rows sharing one card) is this round's
// own fix, see the numbered header note below.
// Depicts: cancellation trust line -> components-legacy/booking/PayConfirmStep.tsx (free-cancellation
// copy) + app/[locale]/dev/directions-0905/confirmation/_vc/getCancellationInfo.ts (the real
// freeCancelHours value)
// Depicts: add-to-calendar .ics technique -> components-legacy/booking/BookingConfirmation.tsx
// (handleCalendar, transcribed not re-invented)
// Depicts: directions action -> components-legacy/booking/BookingConfirmation.tsx (directionsHref,
// a Google Maps search query)
// Depicts: manage-booking link + reference code footer -> components-legacy/booking/BookingConfirmation.tsx
// Depicts: money card, deposit vs total branch -> components-legacy/booking/BookingConfirmation.tsx
// lines 529-563 (the exact isPaid && remainingAtSalonLabel branch: the paid-so-far figure as a
// small line, the amount still owed at the salon as the ALWAYS-VISIBLE hero number, never behind
// a disclosure)
//
// Grounded-in: app/[locale]/dev/directions-0905/confirmation/_vc/ConfirmationCelebration.tsx
// (this exploration's own declared order: confirmed moment, date/time, timeline+actions, salon,
// facts, reused as the structural skeleton), components-legacy/booking/BookingConfirmation.tsx
// (money-card branch logic transcribed exactly), the round-3 kit at "../../_kit" (every
// pill/badge/button/title/meta/price/card on this screen is a kit import; no literal size,
// weight, radius or colour of its own).
//
// Applying the diagnosis pass's per-screen fix list for this surface (each numbered item, and
// where it lands in this file):
//   1. "Wrap the three appointment facets (salon, service, staff) in ONE card, with inset
//      hairlines between rows" -> the "Your appointment" <Card variant="entity"> below holds all
//      three rows, each separated by a `border-t border-s-border` inset divider, never a bare row
//      or a mid-list rule outside a card. FIX ROUND 1: was `variant="grouped"` (24px), corrected to
//      `variant="entity"` (16px) because three facts about ONE booking record is this sheet's own
//      "entity" definition, matching Card 1 and the Payment card, not "grouped" (multiple category
//      members). Also moved to render BEFORE "What happens next" so the salon name clears the
//      shared trust-floor fix, see this file's own comment on that card below.
//   2. "Wrap the what-happens-next rows in ONE card" -> already true of this exploration's own
//      prior build; kept unchanged, now with `hasPhoto={false}` passed explicitly (item 1 below
//      the numbered list explains why every card on this screen resolves to the no-photo edge).
//   3. "Headline drops to the date only, the time appears once, in the subtext line" -> already
//      true of this exploration's own prior build (the anchor renders `dateStr` alone; `timeStr`
//      appears exactly once, in the Meta row beneath it); kept unchanged.
//   4. "Dividers move onto one consistent inset" -> does not apply structurally: this screen has
//      no page-level `<hr>` at all under a card system, so there is no competing grid to reconcile.
//      The two dividers this file adds live INSIDE the combined card (item 1) and share one inset,
//      the card's own p-4 padding.
//   5. "Gap values collapse to the five-value spacing ladder [12/16/20/24/32]" -> every vertical
//      margin on this screen reads a SPACING/TYPE_RAMP token or one of those five literal values;
//      measured live post-build (see the measured note at the foot of this file).
//   6. "The confirmed-state icon renders success green, not ink" -> already fixed at the shared
//      component (StatusBadge.tsx's confirmed variant has read COLOR.success.DEFAULT since before
//      this round); nothing to change here.
//   7. "The smaller paid-so-far label is promoted from the meta tier to the body tier, matching
//      its own peer label below it" -> the "Paid online" label now renders at TYPE_RAMP.body
//      (14px/400/ink) instead of TYPE_RAMP.meta (12px/400/grey); see the `paidLineText` style
//      below. Kept this exploration's own established English wording ("Paid online" / "Due at
//      salon") rather than swapping in different copy, since the fix names a TYPE-TIER problem,
//      not a copy problem.
//
// system: b (Candidate B, LIFT refined, `_plans/R3_ONE_SYSTEM.md`). "Every group of facts about
// one record is one white card... a card WITH a photo takes the flush photo edge and the whisper
// shadow, a card with NO photo takes the 1px hairline and no shadow, and nothing ever carries
// both." Every <Card> below passes `hasPhoto` explicitly, per that system's own shippable fix.
// Because this build's one photo is the hero above (outside every card, see the orchestrator note
// up top), every remaining card on this screen resolves to the NO-photo edge: hairline border, no
// shadow. This is a real, named consequence of the hero placement, not an oversight; see this
// file's own closing return for the measured count and the concern it raises about the system's
// usual shadow-over-border discriminator.

import Link from "next/link";
import Image from "next/image";
import { Calendar, MapPin, ChevronRight, HelpCircle, Bell, ShieldCheck, Scissors, Check } from "lucide-react";
import { Avatar } from "@/app/[locale]/_components/primitives/Avatar";
import { MetaDot } from "@/app/[locale]/_components/salon/MetaDot";
import { FROST_GLASS } from "@/lib/frost-glass";
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
} from "../../_kit";

export function ConfirmationCandidateBView({
  booking,
  freeCancelHours,
  locale,
}: {
  booking: BookingConfirmationProps;
  freeCancelHours: number;
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
  // inferred from anything else.
  const hasDepositSplit = isPaid && booking.remainingAtSalonLabel != null;

  const diffDays = Math.round((start.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const relativeVisit = diffDays <= 0 ? "Today" : diffDays === 1 ? "Tomorrow" : `In ${diffDays} days`; // plural-ok: mockup-only English state label (today/tomorrow/in N days), not routed through next-intl per this dev comparison's own English-only rule

  // The banned greyscale seed photo (mean HSV saturation 0.000) is already swapped out one layer
  // up (see page.tsx); this flag only decides whether the hero renders at all, matching every
  // sibling build's own missing-photo fallback (never a bare grey box).
  const hasPhoto = Boolean(booking.salonCoverUrl);
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

  // Kit StatusBadge. BookingStatus only has 5 slots (confirmed/pending/cancelled/completed/no_show);
  // "pay at salon" is a genuinely confirmed booking (booking.status IS "confirmed" in the DB, just
  // not paid online yet, a real production flow), so it maps to "confirmed" with its own label
  // rather than inventing a 6th status the kit does not have.
  const statusInfo: { status: BookingStatus; label: string } = isCancelledNow
    ? { status: "cancelled", label: "Appointment cancelled" }
    : isPaid
      ? { status: "confirmed", label: "Confirmed" }
      : isConfirming
        ? { status: "pending", label: "Confirming payment" }
        : { status: "confirmed", label: "Pay at the salon" };

  const bodyText = {
    fontSize: TYPE_RAMP.body.size,
    lineHeight: TYPE_RAMP.body.lineHeight,
  } as const;

  // Fix item 7: the paid-so-far label promoted from TYPE_RAMP.meta (12/400/grey) to
  // TYPE_RAMP.body (14/400/ink), so it lands on the same type tier as its peer label below it
  // ("Due at salon"), never the smallest, lightest run in the money card.
  const paidLineText = {
    fontSize: TYPE_RAMP.body.size,
    lineHeight: TYPE_RAMP.body.lineHeight,
    color: COLOR.inkText,
  } as const;

  return (
    <KitProvider system="b">
      <div className="min-h-[100dvh] bg-white text-s-ink">
        <main className="mx-auto w-full max-w-[440px] pb-6">
          {hasPhoto ? (
            <div className="relative h-[240px] w-full overflow-hidden">
              <Image
                src={booking.salonCoverUrl as string}
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
                  className="grid h-11 w-11 place-items-center rounded-full text-s-ink"
                  style={FROST_GLASS}
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
            {/* Card 1: the confirmed moment. hasPhoto=false: this screen's one photo lives in the
                hero above, so every card here resolves to Candidate B's no-photo edge (hairline,
                no shadow). */}
            <Card variant="entity" hasPhoto={false} className="mt-5 p-4">
              <StatusBadge status={statusInfo.status} label={statusInfo.label} treatment="pastel" />
              <h1
                className={`mt-3 font-heading text-s-ink ${TYPE_RAMP.anchor.weightClass}`}
                style={{ fontSize: TYPE_RAMP.anchor.size, lineHeight: TYPE_RAMP.anchor.lineHeight }}
              >
                {dateStr}
              </h1>
              <div className="mt-1 flex items-center">
                <Meta>{timeStr}</Meta>
                {booking.durationMinutes ? (
                  <>
                    <MetaDot />
                    <Meta>{booking.durationMinutes} min</Meta>
                  </>
                ) : null}
              </div>
            </Card>

            {/* "Your appointment" (fix item 1: salon, service and staff combined into ONE
                card, three rows, an inset divider between each) now renders FIRST, directly
                below the confirmed-moment card and above the "What happens next" card that
                holds the two commit buttons. This is the shared-floor fix (LOCKFILE
                hierarchy-density-05(c), orchestrator decision 8): the salon name must render
                above "Add to calendar" / "Directions", inside the first 844px, in the position
                fresha--confirmation.md item 5 puts the venue line ("Venue details" / the venue
                name, in the action-row list directly under the date headline, before Overview).
                Card variant is "entity" (16px), not "grouped" (24px): three facts about ONE
                booking record is the sheet's own "entity" definition, matching Card 1 and the
                Payment card below, never the "grouped" bucket (multiple category members). */}
            <SectionTitle as="heading" className="mb-3 mt-8">
              Your appointment
            </SectionTitle>
            <Card variant="entity" hasPhoto={false} className="p-4">
              <Link href={`/${locale}/salon/${booking.salonSlug}`} className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div style={bodyText} className={`truncate ${TYPE_RAMP.body.weightClass} text-s-ink`}>
                    {booking.salonName}
                  </div>
                  {booking.salonAddress && (
                    <div className="mt-0.5 flex items-center gap-1">
                      <MapPin size={12} className="shrink-0 text-s-ink-2" aria-hidden />
                      <Meta className="truncate">{booking.salonAddress}</Meta>
                    </div>
                  )}
                </div>
                <ChevronRight size={17} strokeWidth={1.9} className="shrink-0 text-s-ink-2" aria-hidden />
              </Link>

              <div className="mt-4 flex items-center gap-3 border-t border-s-border pt-4">
                <Scissors size={18} strokeWidth={1.9} className="shrink-0 text-s-ink-2" aria-hidden />
                <div className="min-w-0 flex-1">
                  <div style={bodyText} className={`truncate ${TYPE_RAMP.body.weightClass} text-s-ink`}>
                    {booking.serviceName}
                  </div>
                  {booking.durationMinutes ? (
                    <Meta>{showVat ? `${booking.durationMinutes} min, incl. VAT` : `${booking.durationMinutes} min`}</Meta>
                  ) : null}
                </div>
                {booking.servicePrice != null && <Price amount={booking.servicePrice} locale={localeCode} />}
              </div>

              {booking.staffName && (
                <div className="mt-4 flex items-center gap-3 border-t border-s-border pt-4">
                  <Avatar src={null} name={booking.staffName} size="xs" />
                  <div className="min-w-0 flex-1">
                    <div style={bodyText} className={`truncate ${TYPE_RAMP.body.weightClass} text-s-ink`}>
                      {booking.staffName}
                    </div>
                    <Meta>your stylist</Meta>
                  </div>
                </div>
              )}
            </Card>

            {/* What happens next (now the second record card on the page, see the reorder note above). */}
            <SectionTitle as="heading" className="mb-3 mt-8">
              What happens next
            </SectionTitle>
            <Card variant="grouped" hasPhoto={false} className="p-4">
              <div className="flex flex-col gap-5">
                <div className="flex gap-3">
                  <span
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-full"
                    style={{ backgroundColor: COLOR.success.DEFAULT }}
                  >
                    <Check size={17} strokeWidth={2.4} className="text-white" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1 pt-1.5">
                    <div style={bodyText} className={`${TYPE_RAMP.body.weightClass} text-s-ink`}>
                      Confirmed
                    </div>
                    <Meta>Just now</Meta>
                  </div>
                </div>

                {!isCancelledNow && (
                  <div className="flex gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-s-border bg-white">
                      <Bell size={16} strokeWidth={1.9} className="text-s-ink-2" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1 pt-1.5">
                      <div style={bodyText} className={`${TYPE_RAMP.body.weightClass} text-s-ink`}>
                        Reminder
                      </div>
                      <Meta>Sent {freeCancelHours}h before your appointment</Meta>
                    </div>
                  </div>
                )}

                {!isCancelledNow && (
                  <div className="flex gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-s-border bg-white">
                      <Calendar size={16} strokeWidth={1.9} className="text-s-ink-2" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1 pt-1.5">
                      <div style={bodyText} className={`${TYPE_RAMP.body.weightClass} text-s-ink`}>
                        Your visit
                      </div>
                      <Meta>{relativeVisit}</Meta>
                    </div>
                  </div>
                )}
              </div>

              {!isCancelledNow && (
                <div className="mt-5 flex items-start gap-3">
                  <ShieldCheck size={14} strokeWidth={1.6} className="mt-[2px] shrink-0 text-s-success" aria-hidden />
                  <p style={{ fontSize: TYPE_RAMP.meta.size, lineHeight: 1.5 }} className="font-normal text-s-ink-2">
                    {`Free cancellation up to ${freeCancelHours}h before your appointment.`}
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

              <div className="mt-4 flex items-center justify-between gap-3">
                {booking.referenceCode ? <Meta>{booking.referenceCode}</Meta> : <span />}
                <TextLink href={manageHref}>
                  <span className="inline-flex items-center gap-0.5">
                    Manage booking
                    <ChevronRight size={15} strokeWidth={1.9} aria-hidden />
                  </span>
                </TextLink>
              </div>
            </Card>

            {/* Card 4: payment. THE FIX -- see the top comment's "money card, deposit vs total
                branch" note. A genuine deposit split renders the paid-so-far figure as a small
                line and the amount owed at the salon OPEN as the hero figure, never behind a
                caret and never labelled "Total". Only the true single-total case keeps that
                word. */}
            <SectionTitle as="heading" className="mb-3 mt-8">
              Payment
            </SectionTitle>
            <Card variant="entity" hasPhoto={false} className="p-4">
              {hasDepositSplit ? (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <span style={paidLineText} className={TYPE_RAMP.body.weightClass}>
                      Paid online
                    </span>
                    <Meta className="tabular-nums">{booking.paidNowLabel}</Meta>
                  </div>
                  <div className="mt-3 flex items-end justify-between gap-3">
                    <span style={bodyText} className="font-semibold text-s-ink">
                      Due at salon
                    </span>
                    <span
                      className="shrink-0 font-heading font-semibold tabular-nums text-s-ink"
                      style={{ fontSize: TYPE_RAMP.cta.size }}
                    >
                      {booking.remainingAtSalonLabel}
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex items-end justify-between gap-3">
                  <div className="min-w-0">
                    <Meta>{showVat ? "Total, incl. VAT" : "Total"}</Meta>
                    {isCancelledNow ? (
                      <Meta className="mt-1 block text-s-error">Cancelled</Meta>
                    ) : isPaid ? (
                      <span className="mt-1 inline-flex">
                        <StatusBadge status="confirmed" label="Paid" treatment="pastel" />
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
            </Card>
          </div>

          <div style={{ height: 125 }} aria-hidden="true" />
        </main>
      </div>
    </KitProvider>
  );
}
