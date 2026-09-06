/**
 * Round 3, Candidate A (RULE refined), Bookings list.
 *
 * Exists-check: `npm run exists directions-0905-r3` (run this session) returned 7 REMOVED hits
 * (the prior round's TRAY look system, its home A/B/C directions, its empty-state directions, the
 * search heading line, the review count, a switcher block that previewed the three look systems in
 * isolation, and a harness matching one service row's button to the sticky bar), none of them a
 * bookings-list screen for this round. No round-3 bookings-list file existed before this build.
 *
 * Grounded-in: app/[locale]/dev/directions-0905/bookings-list/_va/loadBookingsA.ts
 * Grounded-in: app/[locale]/dev/directions-0905-r3/_kit/index.ts
 * Grounded-in: _design-system/references/fresha--bookings-list.md
 *
 * Also grounded in (by hand, not copied): the prior round's own bookings-list RULE direction
 * (`BookingsListRule.tsx` + `NextAppointmentActions.tsx`, both read in full before writing this
 * file, never imported: this is a fresh hand-written view for Candidate A, not that file edited
 * in place). `_design-system/references/fresha--bookings-list.md`'s "Measured (iOS)" item 2 (the
 * section label + count pattern), item 3 (the Upcoming card's own field order: photo area, then
 * salon name as the largest text, then the date/time line, then a dot-separated meta line, then
 * two side-by-side actions at the card's bottom edge), and item 5 (the Past row: compact, no card
 * shell, small square thumbnail, one right-aligned action) are the placement authority. Every
 * size/weight/spacing/radius/colour value below reads from `../../_kit` (tokens.ts + systems.ts's
 * candidate "a" entry), nothing here is a literal. The real loader's own `salon.cover_photo_url`
 * column is read directly (see the closing report's "concerns" for the one known seed-data
 * limitation this creates).
 *
 * Depicts: page structure, one anchor sentence over hairline-divided rows -> app/[locale]/dev/directions-0905-r3/_kit/index.ts (candidate "a" entry, "no cards, inset hairlines, bare rows")
 * Depicts: the one named identity-block exception (next appointment) -> ../../_kit/index.ts Card.tsx, variant="entity" (systems.ts SYSTEMS.a.deltas.card.borderExceptionVariant === "entity"), same mechanism as this candidate's own confirmation screen's "Your appointment" Card
 * Depicts: booking row fields (photo, name, date/time, service, price, status) -> _design-system/references/fresha--bookings-list.md items 3 and 5, composed via ../../_kit/Price.tsx, DateLine.tsx, Meta.tsx, StatusBadge.tsx
 * Depicts: Get directions action -> components-legacy/booking/BookingConfirmation.tsx (the real google.com/maps/search pattern; unchanged anatomy)
 * Depicts: Manage disclosure (Reschedule / Cancel) -> ./NextAppointmentActionsA.tsx (this build's own client leaf; see that file's header)
 * Depicts: booking status badge, every row's real status -> components-legacy/booking/BookingCard.tsx (statusConfig map), composed via ../../_kit/StatusBadge.tsx, never redrawn; candidate A keeps the pastel treatment (orchestrator decision 4)
 * Depicts: "Book again" link -> app/[locale]/salon/[slug]/page.tsx (the real salon PDP route, reached via pdpHref, not a no-op)
 * Depicts: meta separator (the no-glyph gap) -> app/[locale]/_components/salon/MetaDot.tsx
 * Depicts: empty-state fallback -> components-legacy/ui/EmptyState.tsx, unmodified
 * Depicts: the salon's real cover photo on every row -> app/[locale]/dev/directions-0905/bookings-list/_va/loadBookingsA.ts (the loader's own salon.cover_photo_url column, never a hardcoded src)
 * Depicts: the on-photo relative-timing pill -> ../../_kit/TimingPill.tsx (ROOT_CAUSES.md Part 3.3 item 2, ratios ported from airbnb/CAPTURE.md Part B)
 * Depicts: the date and time as one run -> ../../_kit/DateLine.tsx (ROOT_CAUSES.md Part 3.3 item 3)
 *
 * ROOT_CAUSES.md Part 3.3 fix list, applied here (each numbered item below is that file's own
 * numbering for "Bookings"):
 *   1. Next-appointment unit under a named height. Fix-list target: the unit ends at or above
 *      y=400 (card <=340px, <=40% of the 844px fold) and the date/time run starts at or above
 *      y=280. First pass: the photo dropped from the base 5/4 ratio to 358x160, but both
 *      targets still missed by 95px/83px (unit bottom y=495, date/time y=363). REPAIR PASS,
 *      three compounding fixes: (a) the standalone "Next" section heading (18px/500) between
 *      the anchor and this block is removed, its own marginTop:32 collapsed to marginTop:12
 *      (SPACING.sibling), so the block now follows the anchor directly, same shape as
 *      candidates B and C; (b) the anchor sentence's long weekday/month format was wrapping to
 *      two lines at this card's 358px width (measured 64px tall for two lines vs ~32px for one),
 *      shortened to the short date format already used elsewhere on this screen (see
 *      `anchorText` below); (c) the photo drops a further 22px, 160 to 138 (see
 *      NEXT_PHOTO_HEIGHT). See the closing report for the re-measured numbers.
 *   2. A timing pill on the photo, top-left, neutral fill, relative copy ("In 4 days",
 *      "Tomorrow"), colour never encoding urgency. Applied via TimingPill, computed from the real
 *      `starts_at` column, never fabricated (see `relativeTiming` below).
 *   3. The date and time become the second-largest text, ONE run, 14px/500 ink (today 12/400
 *      grey, split across spans). Applied via DateLine; the salon name was already 18px/500.
 *   4. A reminder line, one run, 12px/400 grey, with the bell glyph. REPAIR PASS: the first pass
 *      ported "Sent 24 hours before your appointment" verbatim from confirmation's timeline
 *      subline, which is correct AFTER the appointment's reminder has actually fired but asserts
 *      a completed action on a booking that is still days out. Re-worded to future tense,
 *      "Reminder 24 hours before your appointment" (candidate C's own fix for the identical
 *      tense bug), true regardless of how far out the booking is.
 *   5. The page anchor stops being pixel-identical to a "Bookings" label. Already satisfied: this
 *      screen's anchor is a 28px/500 sentence ("Next visit is ..."), never the bare word
 *      "Bookings".
 *   6. The meta run gets one separator between a "when" group and a "what" group. Applied on the
 *      next-appointment row (service duration + name, one MetaDot); the "other bookings" rows
 *      already carried one MetaDot between date and service.
 *
 * REPAIR PASS, Cause 2 ("a record is a card", ROOT_CAUSES.md Part 1): candidate A's own value
 * sheet names one exception to its no-card system, "a single identity block per screen may carry
 * a border, forced through Card.tsx variant 'entity'" (R3_ONE_SYSTEM.md, Candidate A row 2). The
 * next appointment is that identity block (Fresha's own placement source already calls it a
 * "bordered/rounded container", item 3), so the fix wraps it in <Card variant="entity">, which
 * this system's own systems.ts forces a border onto (borderExceptionVariant: "entity") with the
 * shadow left off. "Other bookings" rows stay bare hairline rows, unchanged, matching Fresha item
 * 5's "Past row: no card shell" and A's own disclosed system-wide choice for everything past the
 * one exception.
 *
 * REPAIR PASS, orchestrator decision (2) ("filled ink on every state"): both <EmptyState> calls
 * (next-appointment and other-bookings) shipped with no `action` prop, so neither rendered a CTA.
 * Both now pass `action={<EmptyBookingsActionA .../>}`, a filled-ink PrimaryButton to /search,
 * this candidate's own copy of candidate B's equivalent (read, not imported, B's folder is
 * off-limits).
 *
 * REPAIR PASS, copy drift: the second section's label changes from "Other bookings" to "More
 * bookings" to match B and C (no sheet row governs this name; it was a plain content divergence
 * flagged by the critic, not a system value worth keeping distinct).
 *
 * Stays (from ROOT_CAUSES.md Part 3.3, so this build does not touch them): the two side-by-side
 * actions on the next-appointment unit ("Get directions" and "Manage"), per the Fresha placement
 * source's own authority; the stacked "Upcoming / Other" sections in one scroll; the seeded cover
 * photo and its reuse across rows for the same salon; the pale-green and pale-red badge recipes;
 * the 4-size / 2-weight budget; salon-name truncation and the un-truncated (wrapping) service-name
 * meta line (FLOORS LAW 1f, the worst-case content floor).
 *
 * measured: rendered at 390x844, dpr 3, /en/dev/directions-0905-r3/bookings-list/a, live dev
 * server, fresh load, via getBoundingClientRect / getComputedStyle. See the closing report for
 * the actual numbers (this comment states intent; the report states what was measured, per the
 * rule that a number in a report is one measured this run).
 *
 * floors: (a) photographic focal = the 358x138 flush salon photo on the next-appointment row, the
 * only photo on the screen; (b) one clearly biggest element = the 28px anchor sentence; (c) real
 * tabular number = price_paid (tabular-nums via the kit's Price) on every row, never invented;
 * (d) semantic colour moment = a cancelled booking's StatusBadge (pale red fill, red icon) among
 * "More bookings" when the real seed data has one; (e) no dead-grey zone = white page throughout,
 * hairlines do the separating, the only tinted surface is the photo-fallback tray on a genuinely
 * missing cover photo; (f) worst-case content = salon name truncates, the anchor sentence is
 * fixed-length regardless of salon-name length, and the service-name meta line wraps instead of
 * clipping (dropped `truncate`, kept `min-w-0`, the same fix the prior round's own repair pass
 * applied to the "other bookings" rows for the identical reason).
 *
 * system: "a", Candidate A (RULE refined), `_plans/R3_ONE_SYSTEM.md`. Applied: exactly one Card
 * (the named entity-block exception on the next appointment; everything else stays hairline rows
 * on white), every group boundary is a hairline inset 24px both sides (SPACING.dividerInset), the
 * pill/button radius is the capsule (RADIUS.pillPx, orchestrator decision (1) for this build),
 * and the status badge stays the pastel treatment (orchestrator decision (4)).
 */

import Image from "next/image";
import Link from "next/link";
import { Bell, Calendar, Scissors } from "lucide-react";
import EmptyState from "@/components-legacy/ui/EmptyState";
import { MetaDot } from "@/app/[locale]/_components/salon/MetaDot";
import type { LoadedBooking } from "@/app/[locale]/dev/directions-0905/bookings-list/_va/loadBookingsA";
import {
  KitProvider,
  SectionTitle,
  Meta,
  Price,
  StatusBadge,
  TextLink,
  TimingPill,
  DateLine,
  Card,
  TYPE_RAMP,
  SPACING,
  COLOR,
  RADIUS,
  type BookingStatus,
} from "../../_kit";
import { NextAppointmentActionsA } from "./NextAppointmentActionsA";
import { EmptyBookingsActionA } from "./EmptyBookingsActionA";

interface Props {
  locale: string;
  upcoming: LoadedBooking[];
  past: LoadedBooking[];
}

const LOCALE_CODE: Record<string, string> = { de: "de-CH", en: "en-CH", fr: "fr-CH", it: "it-CH" };

const STATUS_LABELS: Record<BookingStatus, string> = {
  confirmed: "Confirmed",
  pending: "Pending",
  cancelled: "Cancelled",
  completed: "Completed",
  no_show: "No-show",
};

// ROOT_CAUSES.md Part 3.3 item 1: the photo is the one place height slack comes from, a
// documented departure from the base 5/4 ratio (which would render 358x286.4 here, the exact
// figure the fix item names as the thing to shrink). Full content width at the 390px viewport
// (390 - 2 x SPACING.pageMargin). REPAIR PASS: dropped from 160 to 138 (an additional 22px),
// the remaining amount needed after the anchor-wrap and heading-removal fixes to clear the
// y<=400 fix-item-1 target with the card's own bottom edge, measured at 399.75px without this
// step. This further shrinks an already-below-floor photo share (measured 19.6% pre-repair
// against FLOORS LAW 2's ~33%), a tension already surfaced as open and shared by all three
// candidates (see the critic's "shared floor tension" note), not resolved here.
const NEXT_PHOTO_WIDTH = 358;
const NEXT_PHOTO_HEIGHT = 138;

function serviceName(booking: LoadedBooking, locale: string): string {
  if (!booking.service) return "";
  if (locale === "en") return booking.service.name_en || booking.service.name_de || "";
  return booking.service.name_de || booking.service.name_en || "";
}

function pdpHref(locale: string, booking: LoadedBooking): string | null {
  return booking.salon?.slug ? `/${locale}/salon/${booking.salon.slug}` : null;
}

function mapsHref(booking: LoadedBooking): string | null {
  if (!booking.salon?.address) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.salon.address)}`;
}

/** ROOT_CAUSES.md Part 3.3 item 2: "Copy is relative ... and the colour does not encode
 * urgency." Derived from the booking's real `starts_at`, never invented; the locked
 * no-times-in-listings convention (never an absolute clock time on a listing). */
function relativeTiming(startsAt: string, now: Date): string {
  const start = new Date(startsAt);
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round((startDay.getTime() - nowDay.getTime()) / 86400000);
  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays < 7) return `In ${diffDays} days`;
  if (diffDays < 14) return "In 1 week";
  if (diffDays < 30) return `In ${Math.round(diffDays / 7)} weeks`;
  return `In ${Math.round(diffDays / 30)} months`;
}

/** A real column (`service.duration_minutes`), formatted, never invented. */
function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}min`;
}

/** Candidate A's primary grouping device: an inset hairline, never touching the screen edge.
 * SPACING.dividerInset (24) on both sides. */
function Hairline() {
  return (
    <div
      aria-hidden="true"
      style={{
        marginLeft: SPACING.dividerInset,
        marginRight: SPACING.dividerInset,
        borderTop: `1px solid ${COLOR.hairline}`,
      }}
    />
  );
}

export default function BookingsListA({ locale, upcoming, past }: Props) {
  const localeCode = LOCALE_CODE[locale] ?? "en-CH";
  const next = upcoming[0] ?? null;
  const otherUpcoming = upcoming.slice(1);
  const others = [...otherUpcoming, ...past];
  const now = new Date();

  const coverFor = (b: LoadedBooking): string | null => b.salon?.cover_photo_url ?? null;

  // Repair pass: the anchor sentence used the long weekday/month format ("Your next visit is
  // Thursday, 10 September."), which wraps to two lines at this card's 358px width, doubling the
  // anchor's own rendered height (measured 64px for two lines vs ~32px for one) and pushing
  // everything below it, including the y<=400/y<=280 fix-item-1 targets, down by that same
  // amount. Switched to the short date format already used by every other date on this screen
  // (DateLine, OtherBookingRow) and dropped "Your" (measured natural width 363.7px against a
  // 358px container, 5.7px over, still wrapped even after the date shortened); still a full
  // sentence, not a label-plus-number (FLOORS LAW 6).
  const anchorText = next
    ? (() => {
        const start = new Date(next.starts_at);
        const weekday = start.toLocaleDateString(localeCode, { weekday: "short" });
        const dayMonth = start.toLocaleDateString(localeCode, { day: "2-digit", month: "short" });
        return `Next visit is ${weekday}, ${dayMonth}.`;
      })()
    : "You have no upcoming visits.";

  return (
    <KitProvider system="a">
      <div className="w-full bg-white" style={{ paddingTop: SPACING.section }}>
        <div style={{ paddingLeft: SPACING.pageMargin, paddingRight: SPACING.pageMargin }}>
          <SectionTitle as="anchor">{anchorText}</SectionTitle>
        </div>

        <div
          style={{
            paddingLeft: SPACING.pageMargin,
            paddingRight: SPACING.pageMargin,
            marginTop: SPACING.sibling,
          }}
          data-kit-measure="next-appointment-block"
        >
          {/* Repair pass: the standalone "Next" heading (18px/500) that sat between the anchor
              and this block is removed. It duplicated the anchor sentence's own job (naming the
              next visit), pushed the unit's bottom edge to y=495 against the y<=400 fix-item-1
              target (95px over) and the date/time run to y=363 against y<=280 (83px over), and
              neither B nor C carries an equivalent heading here. */}
          {next ? (
            <NextAppointmentRow
              booking={next}
              locale={locale}
              localeCode={localeCode}
              coverUrl={coverFor(next)}
              now={now}
            />
          ) : (
            <EmptyState
              icon={Calendar}
              title="No upcoming bookings"
              message="Book your next treatment now"
              action={<EmptyBookingsActionA locale={locale} label="Find a salon" />}
            />
          )}
        </div>

        <div style={{ marginTop: SPACING.section }}>
          <Hairline />
        </div>

        <div
          style={{
            paddingLeft: SPACING.pageMargin,
            paddingRight: SPACING.pageMargin,
            marginTop: SPACING.group,
          }}
        >
          <SectionTitle as="heading">More bookings</SectionTitle>
        </div>

        {others.length === 0 ? (
          <div
            style={{
              paddingLeft: SPACING.pageMargin,
              paddingRight: SPACING.pageMargin,
              marginTop: SPACING.group,
            }}
          >
            <EmptyState
              icon={Calendar}
              title="No more bookings"
              message="Your booking history will appear here"
              action={<EmptyBookingsActionA locale={locale} label="Find a salon" />}
            />
          </div>
        ) : (
          <div style={{ marginTop: SPACING.group }}>
            {others.map((booking, i) => (
              <div key={booking.id}>
                <OtherBookingRow
                  booking={booking}
                  locale={locale}
                  localeCode={localeCode}
                  isUpcoming={i < otherUpcoming.length}
                  coverUrl={coverFor(booking)}
                />
                {i < others.length - 1 ? <Hairline /> : null}
              </div>
            ))}
          </div>
        )}

        {/* The real product chrome (header + bottom nav) is stripped on every /dev path by the
            shared dev layout; this spacer reproduces that space so the fold measures like the
            real phone, matching the prior round's own bookings-list files. */}
        <div style={{ height: 125 }} aria-hidden="true" />
      </div>
    </KitProvider>
  );
}

function NextAppointmentRow({
  booking,
  locale,
  localeCode,
  coverUrl,
  now,
}: {
  booking: LoadedBooking;
  locale: string;
  localeCode: string;
  coverUrl: string | null;
  now: Date;
}) {
  const start = new Date(booking.starts_at);
  const dateLabel = start.toLocaleDateString(localeCode, { weekday: "short", day: "2-digit", month: "short" });
  const timeLabel = start.toLocaleTimeString(localeCode, { hour: "2-digit", minute: "2-digit" });
  const href = pdpHref(locale, booking);
  const directions = mapsHref(booking);
  const svc = serviceName(booking, locale);
  const timing = relativeTiming(booking.starts_at, now);
  const duration = booking.service ? formatDuration(booking.service.duration_minutes) : null;

  return (
    /* Repair pass, Cause 2 ("a record is a card"): candidate A's own value sheet names ONE
       named exception to its no-card system, "a single identity block per screen may carry a
       border, forced through Card.tsx variant 'entity'" (R3_ONE_SYSTEM.md, Candidate A row 2).
       The next appointment is that one identity block (Fresha's own placement source,
       fresha--bookings-list.md item 3, already calls it a "bordered/rounded container"), so it
       is the single legal place to spend that exception; "Other bookings" rows below stay bare,
       matching item 5's "Past row: no card shell" and A's own disclosed system-wide choice. Same
       mechanism already used on this candidate's confirmation screen (AConfirmationView.tsx's
       "Your appointment" Card). */
    <Card variant="entity">
      {/* Fix item 1 + item 2: the photo is where height slack comes from (358x138, a documented
          departure from the 5/4 default), and it carries the on-photo timing pill. Full card
          width, no side padding: Card's own overflow-hidden + 16px radius clip its top corners. */}
      <div className="relative w-full overflow-hidden bg-s-bg-sunken" style={{ height: NEXT_PHOTO_HEIGHT }}>
        {coverUrl ? (
          <Image src={coverUrl} alt="" fill sizes="358px" className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Scissors className="h-8 w-8 text-s-ink-2" strokeWidth={1.5} aria-hidden />
          </div>
        )}
        <TimingPill label={timing} photoWidthPx={NEXT_PHOTO_WIDTH} />
      </div>

      <div className="p-3">
        <div className="flex items-baseline justify-between gap-2">
          {href ? (
            <Link
              href={href}
              className={["min-w-0 truncate font-heading text-s-ink", TYPE_RAMP.sectionHeading.weightClass].join(
                " ",
              )}
              style={{ fontSize: TYPE_RAMP.sectionHeading.size, lineHeight: TYPE_RAMP.sectionHeading.lineHeight }}
            >
              {booking.salon?.name || ""}
            </Link>
          ) : (
            <p
              className={["min-w-0 truncate font-heading text-s-ink", TYPE_RAMP.sectionHeading.weightClass].join(
                " ",
              )}
              style={{ fontSize: TYPE_RAMP.sectionHeading.size, lineHeight: TYPE_RAMP.sectionHeading.lineHeight }}
            >
              {booking.salon?.name || ""}
            </p>
          )}
          <Price amount={booking.price_paid} locale={localeCode} size="total" />
        </div>

        {/* Fix item 3: the date and time as ONE 14px/500 ink run, the second-largest fact on the
            card, never split across icon+text spans. */}
        <DateLine date={dateLabel} time={timeLabel} />

        {/* Fix item 6: one separator between the "when" group (duration) and the "what" group
            (service name), per the Fresha placement source's own dot-separated meta line. Never
            `truncate`, only `min-w-0`: the worst-case content floor (a long real service name
            wraps, it never clips), the same fix the prior round's repair pass applied to the row
            below. */}
        <div className="mt-0 flex items-start justify-between gap-2">
          <Meta className="min-w-0 block">
            {duration}
            {duration && svc ? <MetaDot /> : null}
            {svc}
          </Meta>
          <StatusBadge status={booking.status} label={STATUS_LABELS[booking.status]} />
        </div>

        {/* Fix item 4: one run, 12px/400 grey, the bell glyph. Repair pass: re-worded to future
            tense ("Reminder ... before your appointment", matching candidate C's own fix)
            instead of the ported-verbatim "Sent 24 hours before your appointment", which asserted
            a reminder had already gone out on a booking that is still days away. */}
        <Meta className="mt-3 flex items-center gap-1">
          <Bell size={12} className="flex-none" aria-hidden />
          Reminder 24 hours before your appointment
        </Meta>

        <div style={{ marginTop: SPACING.sibling }}>
          <NextAppointmentActionsA directionsHref={directions} locale={locale} />
        </div>
      </div>
    </Card>
  );
}

function OtherBookingRow({
  booking,
  locale,
  localeCode,
  isUpcoming,
  coverUrl,
}: {
  booking: LoadedBooking;
  locale: string;
  localeCode: string;
  isUpcoming: boolean;
  coverUrl: string | null;
}) {
  const start = new Date(booking.starts_at);
  const dateLabel = isUpcoming
    ? start.toLocaleDateString(localeCode, { weekday: "short", day: "2-digit", month: "short" })
    : start.toLocaleDateString(localeCode, { day: "2-digit", month: "short", year: "numeric" });
  const href = pdpHref(locale, booking);
  const svc = serviceName(booking, locale);

  return (
    <div
      className="flex items-center gap-3"
      style={{ paddingLeft: SPACING.pageMargin, paddingRight: SPACING.pageMargin, paddingTop: 12, paddingBottom: 12 }}
    >
      <div
        className="relative flex-none overflow-hidden bg-s-bg-sunken"
        style={{ width: 48, height: 48, borderRadius: RADIUS.photoCardPx }}
      >
        {coverUrl ? (
          <Image src={coverUrl} alt="" fill sizes="48px" className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Scissors className="h-5 w-5 text-s-ink-2" strokeWidth={1.5} aria-hidden />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          {href ? (
            <Link
              href={href}
              className={["min-w-0 truncate font-body text-s-ink", TYPE_RAMP.cta.weightClass].join(" ")}
              style={{ fontSize: TYPE_RAMP.cta.size }}
            >
              {booking.salon?.name || ""}
            </Link>
          ) : (
            <p
              className={["min-w-0 truncate font-body text-s-ink", TYPE_RAMP.cta.weightClass].join(" ")}
              style={{ fontSize: TYPE_RAMP.cta.size }}
            >
              {booking.salon?.name || ""}
            </p>
          )}
          <Price amount={booking.price_paid} locale={localeCode} size="total" />
        </div>

        <div className="mt-1 flex items-start justify-between gap-2">
          {/* No `truncate`: the worst-case content floor (a long real service name wraps to a
              second line instead of clipping). `min-w-0` still shrinks this against its flex-none
              sibling (badge + Book again). */}
          <Meta className="min-w-0 block">
            {dateLabel}
            {svc ? (
              <>
                <MetaDot />
                {svc}
              </>
            ) : null}
          </Meta>

          <div className="flex flex-none items-center gap-2">
            <StatusBadge status={booking.status} label={STATUS_LABELS[booking.status]} />
            {!isUpcoming ? <TextLink href={href ?? undefined}>Book again</TextLink> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
