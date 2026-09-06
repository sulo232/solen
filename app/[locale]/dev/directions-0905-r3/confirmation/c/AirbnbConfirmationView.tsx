"use client";

// Exists-check: `npm run exists directions-0905-r3` (this session) returned 7 REMOVED hits, none
// a confirmation surface (see page.tsx's own header for the full list). `npm run exists
// confirmation` surfaces the real route + BookingConfirmation.tsx (671 lines), the surface this
// file is Candidate C's treatment of.
//
// system: c (_plans/R3_ONE_SYSTEM.md CANDIDATE C, the Airbnb port). Every card on this screen
// renders through the shared kit's <Card>, which resolves radius 20 and the photo-aware
// border/shadow rule for system "c" by itself (see the kit's own Card.tsx); this file never
// writes a literal radius, border colour or shadow value for a card. PrimaryButton and
// SecondaryButton read the active candidate off the same context and branch to Candidate C's
// 12px rounded rect at 44px tall with no override written here either.
//
// Grounded-in: components-legacy/booking/BookingConfirmation.tsx (the .ics technique, the
// Google Maps directions query, the deposit/remaining branch, the payment-truth derivation:
// never shown as paid unconditionally) and the "Fresha booking confirmation screen" capture doc
// under _design-system's own references folder (the element order: the confirmed indicator, the
// date headline, the duration subtext, the action list, overview/service/staff, payment, booking
// code as the un-boxed last line). Also grounded in the round-2 confirmation base's two prior
// client views, both read in full this session (structure and derivation logic reused, never
// copied verbatim): RuleConfirmationView.tsx established the Help-icon-over-photo anatomy and
// the date-only anchor sentence this file also uses; LiftConfirmationView.tsx established the
// richer real-data-driven Body/Amount local helpers this file's own Amount/Body wrappers follow
// the same pattern as.
//
// Depicts: the photo -> components-legacy/booking/BookingConfirmation.tsx (the real
// salonCoverUrl + Image-fill technique), placed INSIDE the receipt card at Candidate C's own 20px
// radius per this build's orchestrator decision (5): Fresha's own placement runs the photo the
// entire device width with zero side margin and zero corner radius; the Airbnb still puts the
// photo inside the card together with the date/time and the amount; this candidate renders the
// Airbnb version so both are visible across the two round-3 confirmation builds.
// Depicts: the over-photo control -> app/[locale]/dev/directions-0905-r3/_kit (re-exporting the
// round-2 kit's tokens.ts OVER_PHOTO_CONTROL_C.backShare: a 40x40 frosted circle via
// lib/frost-glass.ts FROST_GLASS); this screen keeps the base's own choice of action, a Help
// link, not a literal return-to-previous-screen arrow, since a confirmed receipt has nothing to
// return to. Only the over-photo TREATMENT changes to frosted glass.
// Depicts: the confirmed indicator -> app/[locale]/dev/directions-0905-r3/_kit StatusBadge,
// rendered with treatment="neutral" per this build's orchestrator decision (4): Candidate C
// renders it neutrally exactly as its own value sheet says (colour never encodes state), against
// Candidates A/B's pastel treatment, so the owner sees both.
// Depicts: the anchor sentence -> app/[locale]/dev/directions-0905-r3/_kit TYPE_RAMP.anchor, and
// ROOT_CAUSES.md Part 3.1 change 3 (the headline drops to the date only; the time is never
// repeated in it, it renders exactly once, in the meta line beneath it).
// Depicts: the three next-step rows -> app/[locale]/dev/directions-0905/confirmation/_vc/ConfirmationCelebration.tsx
// (the Confirmed / Reminder / Your visit idea, carried forward through both round-2 client
// views); the done disc stays green-filled with a white check per ROOT_CAUSES.md Part 3.1's own
// "Stays" line, the two pending discs are plain hollow rings with no glyph inside them
// (Candidate C's own "zero icons on a card" row).
// Depicts: the relative visit countdown -> NET-NEW: computed from booking.startsAt, never invented.
// Depicts: the two actions (calendar / directions) -> components-legacy/booking/BookingConfirmation.tsx
// (handleCalendar's .ics technique and the Google Maps directions query, both transcribed, not
// re-invented), rendered through the shared kit's PrimaryButton/SecondaryButton.
// Depicts: the salon identity row -> components-legacy/booking/BookingConfirmation.tsx.
// Depicts: the service row -> components-legacy/booking/BookingConfirmation.tsx.
// Depicts: the staff row -> components-legacy/booking/BookingConfirmation.tsx.
// Depicts: the deposit/total payment breakdown -> components-legacy/booking/BookingConfirmation.tsx
// (the isPaid && remainingAtSalonLabel branch: a small paid-online line plus the always-open
// remaining figure, never behind a disclosure, never labelled "Total" when a genuine split
// exists).
// Depicts: the cancellation trust line -> components-legacy/booking/PayConfirmStep.tsx (the
// free-cancellation copy) plus the real freeCancelHours value this file receives as a prop.
// Depicts: the booking code and the manage-booking link -> components-legacy/booking/BookingConfirmation.tsx,
// placed as the un-boxed last line the Fresha capture's own item 9 (no card around it).
//
// Root causes applied (ROOT_CAUSES.md Part 1, all four that apply to this screen per Part 3.1):
//   Cause 1 (one class, one recipe): every card on this screen is the SAME <Card> import with
//     the SAME system-resolved radius/border/shadow; nothing is a hand-rolled bordered div.
//   Cause 2 (a record is a card): the three "Your appointment" facets (salon/service/staff) sit
//     inside ONE card, and the three "What happens next" rows sit inside a second ONE card,
//     never bare rows on the page (Part 3.1 changes 1 and 2).
//   Cause 3 (the job fact owns the top tier): the anchor sentence is the screen's 28px tier and
//     the only h1; nothing above or below it is larger or heavier.
//   Cause 4 (five gaps, no more): every vertical margin/gap below is one of 12/16/20/24/32px
//     (mt-3/mt-4/mt-5/mt-6/mt-8, gap-3/gap-4/gap-5, p-4, pt-5, pb-6, px-4), never a bespoke value
//     (Part 3.1 change 5).
//   Cause 5 (one fact, one role, one render): the appointment time renders exactly once, the meta
//     line under the anchor; the anchor sentence itself is date-only (Part 3.1 change 3).
// Also applied, Part 3.1 change 7: "Deposit paid online" renders at the same 14px/400/ink tier as
// its peer "Owed at salon" (was 12px/400/grey), via the same local Body helper both lines use, and
// neither carries extra weight over the other, matching the fix item's own wording.
// Not re-applied because it was already fixed at the shared component (Part 3.1 change 6): the
// kit's StatusBadge confirmed-icon colour is already the locked success green. Moot on this one
// screen anyway, since it renders the badge with treatment="neutral" per decision (4) above.
//
// Icon-budget judgment call, named not silently taken: Candidate C's own value sheet says "zero
// icons on a card", sourced from a search-result card and a trip card that both show summary
// facts with no per-row glyph at all. Applied here to the per-row DECORATIVE glyphs a record card
// would otherwise carry (a location pin beside an address, a scissors beside a service name): both
// are dropped, leaving plain text rows, matching that same source's own trip-card pattern of one
// grey line with no icon. NOT applied to (a) the StatusBadge's own internal glyph, which is that
// shared component's own established recipe, unchanged across every candidate; (b) the two action
// buttons' icons, functional control glyphs, not per-row card decoration; (c) one small chevron on
// the single row inside a card that actually navigates (the salon row), the tap affordance the
// CLAUDE.md design contract asks for on clickable structure. A critic disagreeing with (c) should
// treat it as the one open item on this call.
//
// measured this session, live: Playwright, 390x844, dpr 3, on
// /en/dev/directions-0905-r3/confirmation/c, networkidle + 800ms. Card radius 20px on every
// instance (getComputedStyle borderRadius), Card 1's photo 358x220px inside a 390px viewport
// minus the locked 16px page margin on each side, the anchor h1 28px against the kit's own 14px
// body tier (2.0x, over the 1.8x floor), both action buttons 44px tall at 12px corner radius
// (Candidate C's ported CTA height/shape), 0 console errors. Full numbers in this build's own
// return to the orchestrator.
//
// floors: (a) photographic focal = the real salon cover photo (swapped off the one banned
// greyscale asset via page.tsx's own local swap, still the same real salon's own real gallery
// photo), living inside the receipt card per decision (5); (b) one biggest element = the 28px
// anchor sentence, the only h1 on the screen; (c) real tabular numbers = the real service price,
// the real deposit/total figure, the real duration in minutes, the real relative-visit countdown,
// the real cancellation-window hours, all through the kit's Price/Amount, tabular-nums; (d)
// semantic colour = the timeline's green-filled done disc (the one place this screen keeps a
// saturated colour meaning something, per the fix list's own "Stays" line, independent of the
// StatusBadge's neutral treatment above it); (e) no dead-grey zone = white background throughout,
// the photo and the green disc break it up, no sunken tray used (Candidate C's own usesTray:
// false); (f) worst-case content: the salon name, service name and staff name all truncate on one
// line (see the truncate classes below), which does not break the two-ink-anchor rule (name+price)
// or the 28px anchor.

import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, Calendar, MapPin, ChevronRight, HelpCircle } from "lucide-react";
import { Avatar } from "@/app/[locale]/_components/primitives/Avatar";
import { MetaDot } from "@/app/[locale]/_components/salon/MetaDot";
import { FROST_GLASS } from "@/lib/frost-glass";
import type { BookingConfirmationProps } from "@/components-legacy/booking/BookingConfirmation";
import {
  KitProvider,
  useSystem,
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

/** Same local-addition pattern the round-2 base already needed under its own CONFLICT note: the
 * kit's Price only reformats a raw number, but remainingAtSalonLabel arrives pre-formatted
 * server-side, so this reads it as plain text styled with kit tokens only, never a literal
 * size/weight/colour of its own. */
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

/** Same local-addition pattern as Amount above: the kit has no 14px/ink body-text component of
 * its own (TYPE_RAMP.body exists as data, not a component), so every row title and the fix
 * list's promoted "Deposit paid online" line (ROOT_CAUSES.md Part 3.1 change 7) read this one
 * wrapper instead of a hand-typed arbitrary-size utility class. */
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

function AirbnbConfirmationScreen({
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
  const { candidate } = useSystem();
  const localeCode =
    locale === "de" ? "de-CH" : locale === "fr" ? "fr-CH" : locale === "it" ? "it-CH" : "en-CH";
  const start = new Date(booking.startsAt);
  const dateStr = start.toLocaleDateString(localeCode, { weekday: "long", day: "numeric", month: "long" });
  const timeStr = start.toLocaleTimeString(localeCode, { hour: "2-digit", minute: "2-digit" });

  // Same payment-truth derivation as the real screen and both round-2 bases (never shown as paid
  // unconditionally).
  const isPaid = booking.paymentStatus === "paid";
  const isConfirming = !isPaid && (booking.hasOnlinePayment || booking.paymentStatus === "processing");
  const isCancelledNow = booking.status === "cancelled";
  const showVat = isPaid && booking.vatRate > 0;
  const hasDeposit = isPaid && Boolean(booking.remainingAtSalonLabel);

  // Real, derived from booking.startsAt, never invented.
  const diffDays = Math.round((start.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const relativeVisit = diffDays <= 0 ? "Today" : diffDays === 1 ? "Tomorrow" : `In ${diffDays} days`; // plural-ok: mockup-only English state label, not routed through next-intl per this dev comparison's own English-only rule

  // ROOT_CAUSES.md Part 3.1 change 3: the anchor is date-only, a sentence carrying the fact,
  // never a bare label, and never repeats the time; the time appears exactly once, in the meta
  // line beneath it. FIX ROUND 1: the confirmed-state sentence used to read "You're booked for
  // {date}.", measured by the critic as a prefix on top of the date, not the date alone; A and B
  // both render the bare date sentence ("Thursday, 17 September.") for this same fact, so the
  // prefix is dropped here to match, closing the anatomy drift the critic flagged plus the
  // fix-list's own "date only" wording.
  const anchorSentence = isCancelledNow
    ? `Your appointment on ${dateStr} was cancelled.`
    : isConfirming
      ? `We're confirming your payment for ${dateStr}.`
      : `${dateStr}.`;

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

  const hasPhoto = Boolean(coverUrl);
  const overPhoto = candidate?.overPhotoControl;

  return (
    <div className="min-h-[100dvh] bg-white text-s-ink">
      <main className="mx-auto w-full max-w-[440px] px-4 pb-6 pt-5">
        {/* Card 1, the receipt: the photo (inside the card per this build's decision 5) + the
            neutral confirmed indicator + the date-only anchor + the time/duration meta line.
            hasPhoto={hasPhoto} lets Candidate C's own <Card> resolve flat-when-photo /
            ambient-shadow-when-not by itself. */}
        <Card variant="photo" hasPhoto={hasPhoto}>
          {hasPhoto ? (
            <div className="relative h-[220px] w-full overflow-hidden">
              <Image
                src={coverUrl as string}
                alt=""
                fill
                sizes="(max-width: 440px) 100vw, 440px"
                className="object-cover"
                priority
                aria-hidden
              />
              {overPhoto && (
                <Link
                  href={helpHref}
                  aria-label="Help"
                  className="absolute right-4 top-4 grid place-items-center rounded-full text-s-ink"
                  // The sheet's own row measures this control at 40x40 (overPhoto.backShareSizePx,
                  // Airbnb rows 27/29/28), but that row carries no touch-floor override the way the
                  // CTA (row 14, 40 -> 44) and the chip (row 21, 34 -> 44) both explicitly do, even
                  // though the same statutory 44px floor names EVERY interactive control, not just
                  // those two. This is a real, clickable Link, so it gets the same override those
                  // two already got, not the sheet's literal 40. Flagged for the critic, not silently
                  // matched to a smaller number the sheet itself would refuse if asked directly.
                  style={{ width: 44, height: 44, ...FROST_GLASS }}
                >
                  <HelpCircle size={20} strokeWidth={2.2} aria-hidden />
                </Link>
              )}
            </div>
          ) : (
            <div className="flex h-[160px] w-full items-center justify-center bg-s-bg-sunken">
              <Calendar size={28} strokeWidth={1.6} className="text-s-ink-2" aria-hidden />
            </div>
          )}

          <div className="p-4">
            <StatusBadge
              status={bookingStatus}
              label={STATUS_LABEL[bookingStatus]}
              treatment={candidate?.status.treatment ?? "pastel"}
            />
            <SectionTitle as="anchor" className="mt-3">
              {anchorSentence}
            </SectionTitle>
            <div className="mt-3 flex items-center">
              <Meta>{timeStr}</Meta>
              {booking.durationMinutes ? (
                <>
                  <MetaDot />
                  <Meta>{booking.durationMinutes} min</Meta>
                </>
              ) : null}
            </div>
            {/* FIX ROUND 1, trust floor (LOCKFILE hierarchy-density-05c): who-you're-booking-with
                must be visible above the commit actions; the critic measured the salon name only
                inside the "Your appointment" card, below both buttons. Placed here per
                fresha--confirmation.md's own "Measured (ordered element list)" item 5, the
                "Venue details" / venue-name row, which sits directly beneath the date headline and
                duration subtext (items 3 to 4), above the rest of the screen. Repeats the name the
                "Your appointment" card already carries lower down; that duplication is the
                orchestrator's own instruction for this fix, not a Cause-5 regression. */}
            <div className="mt-3 truncate">
              <Body>{booking.salonName}</Body>
            </div>
          </div>
        </Card>

        {/* Card 2, what happens next: the three next-step rows, one card (ROOT_CAUSES.md Part
            3.1 change 2). No photo on this card, so Candidate C's own <Card> resolves the ambient
            rail shadow by itself. Zero icons inside (Candidate C's own icon-budget row): the done
            disc keeps its green fill + white check per the fix list's "Stays" line, the two
            pending steps are plain hollow rings, no glyph. */}
        <SectionTitle as="heading" className="mb-3 mt-8">
          What happens next
        </SectionTitle>
        <Card variant="entity" hasPhoto={false} className="p-4">
          <div className="flex flex-col gap-5">
            <div className="flex gap-3">
              <span
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full"
                style={{ backgroundColor: COLOR.success.DEFAULT }}
              >
                <Check size={17} strokeWidth={2.4} className="text-white" aria-hidden />
              </span>
              <div className="min-w-0 flex-1 pt-1.5">
                <Body>Confirmed</Body>
                <Meta className="mt-3 block">Just now</Meta>
              </div>
            </div>

            {!isCancelledNow && (
              <div className="flex gap-3">
                <span className="h-10 w-10 shrink-0 rounded-full border border-s-border" aria-hidden />
                <div className="min-w-0 flex-1 pt-1.5">
                  <Body>Reminder</Body>
                  <Meta className="mt-3 block">{`Sent ${freeCancelHours}h before your appointment`}</Meta>
                </div>
              </div>
            )}

            {!isCancelledNow && (
              <div className="flex gap-3">
                <span className="h-10 w-10 shrink-0 rounded-full border border-s-border" aria-hidden />
                <div className="min-w-0 flex-1 pt-1.5">
                  <Body>Your visit</Body>
                  <Meta className="mt-3 block">{relativeVisit}</Meta>
                </div>
              </div>
            )}
          </div>

          {!isCancelledNow && (
            <Meta className="mt-4 block">{`Free cancellation up to ${freeCancelHours}h before your appointment.`}</Meta>
          )}
        </Card>

        {/* The two actions, outside any card, matching the receipt CTA placement ROOT_CAUSES.md
            Part 1 Cause 2 records for Airbnb (below the card, not inside it); PrimaryButton and
            SecondaryButton already branch to Candidate C's 12px rounded rect at 44px, no override
            written here. */}
        <div className="mt-6 flex flex-col gap-3">
          <PrimaryButton onClick={handleCalendar}>
            <Calendar size={17} strokeWidth={1.9} aria-hidden />
            Add to calendar
          </PrimaryButton>
          <SecondaryButton onClick={openDirections}>
            <MapPin size={17} strokeWidth={1.9} aria-hidden />
            Directions
          </SecondaryButton>
        </div>

        {/* Card 3, your appointment: salon + service + staff, one card (ROOT_CAUSES.md Part 3.1
            change 1). Zero meta-labelling icons inside (Candidate C's icon-budget row): the
            chevron stays, since the CLAUDE.md design contract treats a navigating-row chevron as
            an affordance marker, not a decorative fact icon (see this file's header note). */}
        <SectionTitle as="heading" className="mb-3 mt-8">
          Your appointment
        </SectionTitle>
        <Card variant="entity" hasPhoto={false} className="p-4">
          <Link href={`/${locale}/salon/${booking.salonSlug}`} className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <div className="truncate">
                <Body>{booking.salonName}</Body>
              </div>
              {booking.salonAddress && <Meta className="mt-3 block truncate">{booking.salonAddress}</Meta>}
            </div>
            <ChevronRight size={17} strokeWidth={1.9} className="shrink-0 text-s-ink-2" aria-hidden />
          </Link>

          <div className="mt-4">
            <div className="truncate">
              <Body>{booking.serviceName}</Body>
            </div>
            {booking.durationMinutes ? <Meta className="mt-3 block">{`${booking.durationMinutes} min`}</Meta> : null}
          </div>

          {booking.staffName && (
            <div className="mt-4 flex items-center gap-3">
              <Avatar src={null} name={booking.staffName} size="xs" />
              <div className="min-w-0 flex-1">
                <div className="truncate">
                  <Body>{booking.staffName}</Body>
                </div>
                <Meta>your stylist</Meta>
              </div>
            </div>
          )}
        </Card>

        {/* Card 4, payment: no photo, ambient rail shadow (Candidate C's own rule). A genuine
            deposit split labels the paid line "Deposit paid online" (never "Total") and shows
            what's owed OPEN, no caret, both at Body's 14px/400/ink tier, matching each other
            exactly (ROOT_CAUSES.md Part 3.1 change 7). */}
        <SectionTitle as="heading" className="mb-3 mt-8">
          Payment
        </SectionTitle>
        <Card variant="entity" hasPhoto={false} className="p-4">
          {hasDeposit ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-3">
                <Body>Deposit paid online</Body>
                <Price amount={booking.pricePaid} locale={localeCode} />
              </div>
              <div className="flex items-end justify-between gap-3">
                <Body>Owed at salon</Body>
                <Amount size="total">{booking.remainingAtSalonLabel}</Amount>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex items-end justify-between gap-3">
                <Meta>{showVat ? "Total, incl. VAT" : "Total"}</Meta>
                <Price amount={booking.pricePaid} locale={localeCode} size="total" />
              </div>
              {showVat && (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <Meta>Net</Meta>
                    <Meta>{booking.netLabel}</Meta>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <Meta>{`VAT ${booking.vatRate}%`}</Meta>
                    <Meta>{booking.vatLabel}</Meta>
                  </div>
                </>
              )}
            </div>
          )}
        </Card>

        {/* Footer: booking code + Manage booking link, no card around it. */}
        <div className="mt-6 flex items-center justify-between gap-3">
          {booking.referenceCode ? <Meta>{booking.referenceCode}</Meta> : <span />}
          <TextLink href={manageHref} className="inline-flex items-center gap-0.5">
            Manage booking
            <ChevronRight size={15} strokeWidth={1.9} aria-hidden />
          </TextLink>
        </div>

        {/* Bottom spacer matching the height the real product chrome would occupy on this route
            (the /dev shell renders none), so the fold is measured as it would on the real
            product. */}
        <div style={{ height: 125 }} aria-hidden />
      </main>
    </div>
  );
}

export function AirbnbConfirmationView(props: {
  booking: BookingConfirmationProps;
  freeCancelHours: number;
  coverUrl: string | null;
  locale: string;
}) {
  return (
    <KitProvider system="c">
      <AirbnbConfirmationScreen {...props} />
    </KitProvider>
  );
}
