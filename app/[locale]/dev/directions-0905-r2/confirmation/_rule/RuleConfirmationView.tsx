"use client";

// exists-check: `npm run exists confirmation` (this session) -> the real route + 671-line
// BookingConfirmation.tsx, the surface this view is a round-2 RULE-system treatment of. `npm
// run exists "directions-0905-r2 confirmation"` found the sibling _lift/LiftConfirmationView
// (a different look system's own build, not yet on disk as of this write, not this file). No
// existing RULE-system confirmation view before this file.
//
// Depicts: hero photo -> components-legacy/booking/BookingConfirmation.tsx
// Depicts: help icon -> components-legacy/booking/BookingConfirmation.tsx (anatomy only; the
//   frost treatment itself is NOT reused, see the system note below)
// Depicts: booking status derivation -> components-legacy/booking/BookingConfirmation.tsx
// Depicts: the confirmed-state badge -> app/[locale]/dev/directions-0905-r2/_kit/StatusBadge.tsx
// Depicts: the anchor sentence -> app/[locale]/dev/directions-0905-r2/_kit/tokens.ts TYPE_RAMP.anchor
// Depicts: timeline anatomy (confirmed / reminder / the visit) -> app/[locale]/dev/directions-0905/confirmation/_vc/ConfirmationCelebration.tsx
// Depicts: relative visit countdown -> NET-NEW: computed from booking.startsAt, never fabricated
// Depicts: reminder window copy -> app/api/cron/sms-reminders/route.ts
// Depicts: cancellation policy line -> components-legacy/booking/PayConfirmStep.tsx
// Depicts: add-to-calendar .ics technique -> components-legacy/booking/BookingConfirmation.tsx
// Depicts: directions link -> components-legacy/booking/BookingConfirmation.tsx
// Depicts: salon identity row -> components-legacy/booking/BookingConfirmation.tsx, composed as
//   app/[locale]/dev/directions-0905-r2/_kit/Card.tsx variant="entity"
// Depicts: service row -> components-legacy/booking/BookingConfirmation.tsx
// Depicts: staff row -> components-legacy/booking/BookingConfirmation.tsx
// Depicts: the deposit/total payment breakdown -> components-legacy/booking/BookingConfirmation.tsx
//
// Grounded-in: app/[locale]/dev/directions-0905/confirmation/_vc/ConfirmationCelebration.tsx
// (timeline/actions/salon-row logic, the native-CSS entrance stagger, the .ics technique, the
// derivation booleans), components-legacy/booking/BookingConfirmation.tsx (the MONEY card's two
// branches, transcribed with the two label/placement fixes below), lib/frost-glass.ts (read, not
// used, see the deviation note below).
//
// Screen constraints from the orchestrator brief, both addressed:
//   1. "label the deposit as a deposit, never as Total": the Payment section's deposit branch
//      never renders the word "Total" anywhere; it reads "Deposit paid online" / "Owed at salon".
//   2. "show the CHF still owed at the salon in the open, not behind a caret": the owed amount is
//      a plain row directly in the DOM flow, no button, no chevron, no collapsed state, no
//      client-side toggle of any kind on this section.
//
// Conflicts surfaced, not silently resolved:
// - CONFLICT [the real prop type only exposes a PRE-FORMATTED currency string for the deposit
//   fields]: components-legacy/booking/BookingConfirmation.tsx's own BookingConfirmationProps
//   (off-limits, the real production type) carries remainingAtSalonLabel as a string, never a
//   raw number, because the shared seedBooking.ts loader (also off-limits) formats it once at
//   fetch time. The kit's Price (app/[locale]/dev/directions-0905-r2/_kit/Price.tsx) only accepts
//   a raw numeric amount and calls formatCurrency itself, so it cannot render this field
//   directly. Built here: a local Amount component, using ONLY kit tokens (TYPE_RAMP.cta.size,
//   COLOR.inkText, imported, never a literal 15 or hex written here) to style the already-locale-
//   correct pre-formatted string. The deposit-paid row DOES use the real kit Price (its raw
//   number, booking.pricePaid, is genuinely available and equal in value to paidNowLabel), so
//   this deviation is scoped to the one field with no raw-number counterpart on the real type.
//   Listed under deviationsFromBrief, not silently patched into Price.tsx (a file also imported,
//   unforked, by the other two look-system builders working the same kit tree concurrently).
// - CONFLICT [FROST_GLASS vs the RULE system's zero-shadow discriminator]: FROST_GLASS
//   (lib/frost-glass.ts) is the canonical over-photo control treatment, but it carries a
//   box-shadow, and RULE's own discriminator (_plans/R2_LOOK_SYSTEMS.md SYSTEM 2) is
//   "count(elements with a box-shadow) = 0" across the fold. Resolved in favour of the system: a
//   flat white circle (no blur, no shadow), which still reads clearly against the photo at 100%
//   white opacity. Listed under deviationsFromBrief.
// - No conflict on stickiness: this is a post-purchase receipt-style screen (round-1's own
//   Direction C header makes the same call), so no sticky bar; hierarchy-density-06 is scoped to
//   a screen with a single primary COMMIT action (Buchen/Bezahlen), which this already-booked
//   confirmation is not.
// - Scope limit, named not silently dropped: same as round-1's Direction C, the real screen's
//   GUEST access-link block and its quiet destructive "cancel appointment" tertiary are not
//   reproduced here (round-1's own Direction C never carried a cancel control either); this is a
//   structure/treatment exploration of the confirmed-and-owner-linked receipt, not a full parity
//   rebuild of every guest/cancel affordance.
//
// measured: rendered via Playwright at 390x844 (dpr 3) on
// /en/dev/directions-0905-r2/confirmation?s=rule; see the calling session's structured return
// for the live getBoundingClientRect/getComputedStyle pass (distinct sizes/weights, touch
// targets, box-shadow count, hairline insets, 18px-tier run count).
//
// floors: (a) photographic focal = the real salon cover photo hero (swapped off the banned
// greyscale hash per ./getAlternateCoverPhoto.ts, still the real salon's own real gallery photo);
// (b) one biggest element = the 28px anchor sentence; (c) real tabular number = booking.pricePaid
// via the real formatCurrency-backed Price, the real duration in minutes, the real relative-visit
// countdown computed from booking.startsAt, the real cancellation-window hours; (d) semantic
// colour = the kit StatusBadge's green check icon (confirmed) plus the ShieldCheck trust-line
// icon; (e) no dead-grey zone = white throughout, RULE's own device (hairlines) does the
// separating so there is no sunken tray anywhere on this screen; (f) worst-case content: the
// salon name, service name and staff name all truncate (see the truncate classes below), which
// does not break the two-ink-anchor rule (name+price) or the 28px anchor.
//
// system: RULE (_plans/R2_LOOK_SYSTEMS.md SYSTEM 2). "There is no card anywhere on the screen;
// groups are separated by inset hairlines and gap size alone, and the hierarchy is carried
// entirely by a big anchor sentence over a populated middle type tier." Applied here: zero
// box-shadow anywhere (Card variant="entity" for the one named identity-block exception renders
// border-only, per systems.ts rule.deltas.card.borderExceptionVariant, still shadow:false); every
// hairline is mx-6 (24px each side, app/[locale]/dev/directions-0905-r2/_kit/tokens.ts
// SPACING.dividerInset); the 18px sectionHeading tier (SectionTitle as="heading") appears three
// times ("What happens next", "Your appointment", "Payment"), clearing the >=3-run discriminator;
// the anchor (as="anchor") is one full sentence carrying the confirmed fact, never a bare date
// label.

import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
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
} from "../../_kit";

// Timeline entrance: a native CSS @keyframes animation driven by animation-delay per row, so the
// browser paints and animates before hydration, no JavaScript required (round-1's
// ConfirmationCelebration.tsx established this technique for the same reason: a framer-motion
// stagger ships its initial opacity:0 as an inline SSR style and stays invisible until
// hydration). Reused unchanged, not re-derived.
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

/**
 * The one local addition this view needs beyond the kit (see the CONFLICT note in the header
 * comment above): a pre-formatted-string amount, styled with kit tokens only (never a literal
 * size/weight/colour of its own). Kept local to this file, not added to the shared kit, because
 * the kit Price's real job (a raw-number amount through formatCurrency) is correct for every
 * OTHER round-2 screen; this is a one-off gap specific to a real prop type that only exposes a
 * pre-formatted label for this one field.
 */
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

/**
 * The second local addition (see the CONFLICT note above): the kit exports SectionTitle (18/28)
 * and Meta (12) as components, but no component for the 14px body/row-title tier, even though
 * tokens.ts defines TYPE_RAMP.body for it. Every row title on this screen (timeline row labels,
 * the salon/service/staff names, the "Owed at salon" label) reads TYPE_RAMP.body.size and
 * COLOR.inkText through this wrapper instead of a literal `text-[14px]` class, so the 14px value
 * on this screen is traceable to the same one token every other round-2 screen would use if the
 * kit grows this component. Listed under deviationsFromBrief for the same reason as Amount.
 */
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

export function RuleConfirmationView({
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

  const anchorSentence = isCancelledNow
    ? `Your appointment on ${dateStr} was cancelled.`
    : isConfirming
      ? `We're confirming your payment for ${dateStr} at ${timeStr}.`
      : `You're booked for ${dateStr} at ${timeStr}.`;

  const bookingStatus: BookingStatus = isBookingStatus(booking.status) ? booking.status : "confirmed";

  const helpHref = `/${locale}/help`;
  const manageHref = booking.isGuest && booking.accessLink ? booking.accessLink : `/${locale}/booking/lookup`;
  const directionsHref = useMemo(
    () =>
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${booking.salonName} ${booking.salonAddress}`.trim(),
      )}`,
    [booking.salonName, booking.salonAddress],
  );

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
    <KitProvider system="rule">
      <div className="min-h-[100dvh] bg-white text-s-ink">
        <main className="mx-auto w-full max-w-[440px]">
          {/* ── hero: real salon photo (swapped off the banned greyscale hash), a flat white
              help circle (not frosted, see the header comment's FROST_GLASS conflict note) ── */}
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
            {/* ── 1. confirmed moment: kit StatusBadge, then the anchor SENTENCE (never a bare
                date label) carrying the fact ── */}
            <div className="mt-5">
              <StatusBadge status={bookingStatus} label={STATUS_LABEL[bookingStatus]} />
            </div>
            <SectionTitle as="anchor" className="mt-3">
              {anchorSentence}
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

            {/* ── hairline, inset 24px both sides (RULE's primary separating device) ── */}
            <hr className="mx-6 mt-8 border-s-border" />

            {/* ── 2. WHAT HAPPENS NEXT leads: mandatory 18px section heading (run 1 of 3),
                timeline, trust line, the two kit actions, reference + manage link ── */}
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

            <div className="mt-4 flex flex-col gap-2.5">
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
            <hr className="mx-6 mt-8 border-s-border" />

            {/* ── 3. Fresha element order below the lead: salon identity, service, staff.
                18px section heading (run 2 of 3). The salon row is the one named RULE exception
                (systems.ts rule.deltas.card.borderExceptionVariant: "entity"), so it is the only
                bordered box on the whole screen. ── */}
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
            </Card>

            <div className="mt-4 flex items-center gap-3">
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
                <hr className="mx-6 mt-4 border-s-border" />
                <div className="mt-4 flex items-center gap-3">
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

            {/* ── hairline, inset 24px both sides ── */}
            <hr className="mx-6 mt-8 border-s-border" />

            {/* ── 4. Payment: 18px section heading (run 3 of 3). Deposit branch labelled
                "Deposit paid online" / "Owed at salon", never "Total"; the owed amount renders
                as a plain row, in the open, no caret, no collapsed state. ── */}
            <SectionTitle as="heading" className="mt-8">
              Payment
            </SectionTitle>

            {hasDeposit ? (
              <div className="mt-4 flex flex-col gap-3 pb-10">
                <div className="flex items-center justify-between">
                  <Meta>Deposit paid online</Meta>
                  <Price amount={booking.pricePaid} size="row" />
                </div>
                <hr className="mx-6 border-s-border" />
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
                    <hr className="mx-6 border-s-border" />
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
