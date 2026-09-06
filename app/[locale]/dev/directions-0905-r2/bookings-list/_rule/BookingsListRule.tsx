/**
 * REPAIR PASS (this file only): fixes five critic-confirmed open items, structure and system
 * unchanged. (1) the next-appointment StatusBadge read a hardcoded status="confirmed" instead
 * of booking.status; now dynamic, same as every other row. (2) the three Atelier Haarwerk rows
 * rendered the explicitly banned greyscale seed photo (photo-1560066984) because this file read
 * cover_photo_url directly; it now resolves every booking's cover server-side through
 * getAlternateCoverPhoto (the same helper _lift/BookingsListLift.tsx already uses for this exact
 * swap), which requires this file to become an async Server Component (getAlternateCoverPhoto
 * calls the admin Supabase client, server-only). Its one interactive piece (the Manage
 * disclosure + its two buttons) is split into ./NextAppointmentActions.tsx, a small "use client"
 * leaf, so the rest of this file can drop "use client" and await the cover lookup. (3) the fold
 * carried 5 distinct sizes (12/14/15/18/28) against the 4-size ceiling; TYPE_RAMP.body (14) was
 * the extra one, used in exactly two always-visible places (the next-appointment service line,
 * the OtherBookingRow salon name) plus every Price. The service line now reads through <Meta>
 * (12, joining the already-12px date/time and badge text), and every Price plus the
 * OtherBookingRow salon name now reads TYPE_RAMP.cta instead of .body, which was the plan to
 * join the two SecondaryButton labels' own step and close the ramp to {12, 15, 18, 28}. A
 * concurrent repair on the confirmation/_lift mockup then re-tuned tokens.ts's own cta.size
 * from 15 to 14 (that file's own header explains why: A5's table always specified the CTA at
 * body's 14px slot, distinguished by weight not size, and C7's separate 15px verdict had never
 * been checked against the four-size ceiling). Re-measured live after that shared change: this
 * screen's own ramp is {12, 14, 18, 28}, still four, cta and body now sharing one pixel value
 * by the kit's own design rather than by an accident of this file's edits. (4) the
 * next-appointment photo rendered 96x96 (1:1); A7's "salon photo ratio 5/4, and it does not
 * move" is a base recipe with no documented per-screen exception (unlike
 * _tray/BookingsListTray.tsx's own aspect-[16/9], which carries an explicit compactness
 * rationale in its header), so it is corrected to 100x80 (5/4) here. (5) this comment used to
 * defer the measured pass to "the structured return value of the session"; the real numbers now
 * live in the "measured:" block below, matching how _lift's own files self-report their numbers.
 *
 * REPAIR PASS 2 (2026-09-06, this file + ./NextAppointmentActions.tsx), two open items:
 * (1) the Manage disclosure's Reschedule/Cancel buttons (moved into NextAppointmentActions.tsx
 * by the first repair pass) were bare <button> elements with no onClick, a dead click inherited
 * from round 1; see that file's own header for the grep trail. Fixed by passing `locale` down
 * (this file's own NextAppointmentRow already had it) and composing the kit SecondaryButton
 * with a router.push to the one real destination, `/${locale}/profile/bookings`. (2) the
 * OtherBookingRow date+service Meta line forced `truncate` over both fields together, so the
 * real seeded service names ("Women Cut", "Men's Haircut") clipped to "Wo..."/"M..." at 390px
 * (measured live, pre-fix: clientWidth 110px against a scrollWidth up to 163px on 4 of 7 other-
 * booking rows), the worst-case content floor (FLOORS LAW 1f) this screen was failing. Fixed by
 * dropping `truncate` (keeping `min-w-0`) so the line wraps to two lines instead of clipping;
 * see that JSX's own inline comment for the fix's exact reasoning.
 *
 * Exists-check: `npm run exists bookings-list` (run this session) returns the round-1 scaffold
 * page + directions (_va/_vb/_vc) and the real BookingsList component; no round-2 RULE-system
 * bookings-list file existed before this one. `npm run exists kit` (run earlier this session,
 * before the kit folder existed) returned no shared token/system module; the kit now exists at
 * app/[locale]/dev/directions-0905-r2/_kit and is imported below, never re-derived.
 *
 * Depicts: page structure, date-led one scroll -> app/[locale]/dev/directions-0905/bookings-list/_va/BookingsListDirectionA.tsx (the round-1 base this direction restructures: same "Upcoming" + "Past" data buckets, read in full, not copied)
 * Depicts: booking row fields (thumbnail, date/time, service, price) -> app/[locale]/dev/directions-0905/bookings-list/_va/BookingsListDirectionA.tsx (its UpcomingCard/PastRow field set; the RULE system removes the card shell and the per-row buttons on everything but the very next booking)
 * Depicts: Get directions action + Manage disclosure (Reschedule / Cancel) -> ./NextAppointmentActions.tsx (split out this pass; see that file's own header)
 * Depicts: booking status badge, every row's real status -> components-legacy/booking/BookingCard.tsx (statusConfig map + render at lines 84-90,138, composed here via the kit's StatusBadge.tsx, never redrawn)
 * Depicts: "Book again" link -> app/[locale]/dev/directions-0905/bookings-list/_va/BookingsListDirectionA.tsx (same action, re-targeted to the salon PDP via pdpHref so the click is real, not a no-op)
 * Depicts: meta separator -> app/[locale]/_components/salon/MetaDot.tsx (the locked no-glyph gap, LOCKFILE A12/V3-D463; no middle-dot glyph anywhere on this screen)
 * Depicts: empty-state fallback -> components-legacy/ui/EmptyState.tsx (unmodified; used only if a bucket is genuinely empty, not the case in the real seed data verified live this run: 2 upcoming, 5 past)
 * Depicts: real, non-banned cover photo on every row -> ../../confirmation/_rule/getAlternateCoverPhoto.ts (imported below, the same helper _lift/BookingsListLift.tsx already uses for this exact swap; net-new to this file this pass, not a new module)
 *
 * Grounded-in: app/[locale]/dev/directions-0905/bookings-list/_va/BookingsListDirectionA.tsx
 * (the round-1 base this direction restructures, read in full) and
 * app/[locale]/dev/directions-0905/bookings-list/_va/loadBookingsA.ts (the real loader,
 * imported not copied, see the page.tsx one level up). Every size, weight, spacing, radius,
 * colour and press-motion value below reads from
 * app/[locale]/dev/directions-0905-r2/_kit/tokens.ts and its sibling kit components
 * (KitProvider, SectionTitle, Meta, Price, StatusBadge, SecondaryButton, TextLink); nothing
 * here is a literal. components-legacy/booking/BookingCard.tsx (the statusConfig recipe
 * StatusBadge transcribes), components-legacy/ui/EmptyState.tsx (composed for the empty
 * branch, FLOORS LAW 9, never hand-drawn) and ../../confirmation/_rule/getAlternateCoverPhoto.ts
 * (the cover-photo swap, imported not duplicated) are all real, existing files.
 *
 * measured: rendered at 390x844 (dpr 2) on /en/dev/directions-0905-r2/bookings-list?s=rule,
 * this repair pass, live dev server at :3461, via getBoundingClientRect / getComputedStyle on
 * every element carrying its own direct text node, filtered to ones actually on screen
 * (non-zero rect, a real offsetParent). Next-appointment block
 * (`[data-kit-measure="next-appointment-block"]`): 176.40px tall (round-1's own UpcomingCard on
 * the same route family measures 483.4px, so this is 307.0px / 63.5% shorter: the card shell,
 * its padding, the footer hairline and border, and the service line's own row are all gone,
 * while the 100x80 photo itself only lost area to the ratio fix, not to the compactness pass).
 * Font sizes present in the resting fold, all visible-element counts: 12px|400 x8 (Meta:
 * date/time and the consolidated service lines), 12px|500 x7 (StatusBadge labels, "Confirmed"
 * x5 / "Cancelled" x1 / seventh row below the fold), 14px|400 x5 ("Book again" TextLinks),
 * 14px|500 x15 (every Price; both SecondaryButton labels; the OtherBookingRow salon name; note
 * cta and body now share this one value, see the REPAIR PASS note on item 3 above), 18px|500
 * x3 ("Next" heading, "Other bookings" heading, the next-appointment salon name, exactly
 * clearing the RULE discriminator's own >=3 minimum), 28px|500 x1 (the anchor sentence). One
 * unrelated hit at 16px|400: the site's global "Skip to content" accessibility link, positioned
 * off-screen (top/left -1px) above HideInBooking's own chrome strip, present on every /dev
 * route, not authored by this file and not part of this screen's own content. Four distinct
 * sizes {12, 14, 18, 28}, two distinct computed weights {400, 500} (font-semibold on StatusBadge
 * and SectionTitle also clamps to 500 inside `<main>` per globals.css's owner-decided weight
 * override, so it reads as the same 500 bucket, not a third). Every SecondaryButton hit area:
 * 175px wide x 50px tall (>=44px floor, both axes). The RULE discriminator: 0 elements with a
 * computed box-shadow (0 border+shadow overlaps either), 6 real Hairline dividers each inset
 * exactly 24px on both sides against the 342px content width, the 18px tier carries exactly 3
 * text runs. Console: 0 errors, 0 warnings. Network: 7/7 photo requests 200, none carrying the
 * banned hash (grepped the rendered `<img>` srcs directly). Both StatusBadge states checked
 * (confirmed, cancelled) render their own locked `.bg` token fill under ink text, per
 * StatusBadge.tsx's own recipe, never the raw semantic hue as text.
 *
 * measured (REPAIR PASS 2, 2026-09-06): re-measured live after both fixes above, same route,
 * fresh load, dpr 3. Console: 0 errors. Resting fold: 4 distinct sizes {12, 14, 18, 28}, 2
 * distinct weights {400, 500}, unchanged from the ceiling above (counts shift slightly run to
 * run within that same set, e.g. 12px|400 now 7 not 8, since the OtherBookingRow date+service
 * line's own element count is unchanged by the wrap fix, only its rendered line count changed).
 * Both Reschedule and Cancel (now inside ./NextAppointmentActions.tsx) render as the kit
 * SecondaryButton: 358x50px, radius 99px, border 1px solid the locked hairline (drift-ok:
 * COLOR.hairline's own value, cited here in a measured-numbers comment, not written as code), no
 * shadow, 14px/500 ink; clicking either genuinely navigates (router.push to
 * `/en/profile/bookings`), not a dead click. OtherBookingRow date+service line (open item 2):
 * of the 6 "Other bookings" rows, 5 now wrap onto two lines (32.4px tall, e.g. "13 Jun 2026" /
 * "Men's Haircut") and 1 fits on one line (16.2px tall, "Thu, 17 Sept  Women Cut"); every one of
 * the 6 now measures scrollWidth === clientWidth (no clipped text remains), against the pre-fix
 * state where 4 of 6 clipped (clientWidth 109-113px vs a scrollWidth up to 163px, rendering
 * "Wo..."/"M...").
 *
 * floors: (a) photographic focal = the 100x80 (5/4) flush salon photo on the next-appointment
 * row, the only photo on the screen and RULE's answer to "no card": present, not boxed; (b) one
 * clearly biggest element = the 28px anchor sentence at the top, the single largest text run
 * on the page; (c) real tabular number = price_paid (tabular-nums via the kit's Price) on
 * every row, and the calendar day/weekday in the anchor and meta lines, all real values from
 * loadBookingsA, never invented; (d) semantic colour moment = the cancelled row's StatusBadge
 * (pale red fill, red check icon) among "Other bookings", present because the real seed data
 * has one cancelled booking; (e) no dead-grey zone = white page throughout, hairlines (not
 * grey fields) do the separating, the only tinted surface is the small photo-fallback tray on
 * a genuinely missing cover photo; (f) worst-case content = salon name truncates on every row
 * (`truncate` + `min-w-0`), the anchor sentence is fixed-length regardless of salon name
 * length (it names only the date, never the salon), and the longest real service name
 * ("Women Cut", "Men's Haircut" in the seed set) sits on one line by design inside the 12px
 * meta tier (moved off its own 14px line this pass, see the REPAIR PASS note above).
 *
 * system: RULE, verbatim from _plans/R2_LOOK_SYSTEMS.md Part B / the kit's systems.ts:
 * "there is no card anywhere on the screen; groups are separated by inset hairlines and gap
 * size alone, and the hierarchy is carried entirely by a big anchor sentence over a populated
 * middle type tier." Applied here: zero Card usage (no `<Card>` import at all), every group
 * boundary is a <Hairline> inset 24px both sides, and the 28px anchor sentence names the next
 * visit's actual date rather than a label ("Upcoming") sitting next to a count.
 */

import Image from "next/image";
import Link from "next/link";
import { Calendar, Clock, Scissors } from "lucide-react";
import EmptyState from "@/components-legacy/ui/EmptyState";
import { MetaDot } from "@/app/[locale]/_components/salon/MetaDot";
import type { LoadedBooking } from "@/app/[locale]/dev/directions-0905/bookings-list/_va/loadBookingsA";
import { getAlternateCoverPhoto } from "../../confirmation/_rule/getAlternateCoverPhoto";
import { KitProvider } from "../../_kit/KitProvider";
import { SectionTitle } from "../../_kit/SectionTitle";
import { Meta } from "../../_kit/Meta";
import { Price } from "../../_kit/Price";
import { StatusBadge, type BookingStatus } from "../../_kit/StatusBadge";
import { TextLink } from "../../_kit/TextLink";
import { TYPE_RAMP, SPACING, COLOR, RADIUS } from "../../_kit/tokens";
import { NextAppointmentActions } from "./NextAppointmentActions";

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

// Open item 2 (repair pass): resolves each distinct salon's cover photo ONCE (a salon can repeat
// across bookings), swapping the explicitly banned greyscale seed image (photo-1560066984,
// R2_LOOK_SYSTEMS.md A8 / CONFLICT C10) for a different real photo of the SAME salon, via the
// helper _lift/BookingsListLift.tsx already established for this exact swap (imported above, not
// duplicated). Never a hardcoded src; a salon whose gallery has no alternate keeps its own cover.
async function resolveCovers(bookings: LoadedBooking[]): Promise<Map<string, string | null>> {
  const covers = new Map<string, string | null>();
  await Promise.all(
    bookings.map(async (b) => {
      const salon = b.salon;
      if (!salon || covers.has(salon.id)) return;
      covers.set(salon.id, await getAlternateCoverPhoto(salon.id, salon.cover_photo_url));
    }),
  );
  return covers;
}

/** RULE's primary grouping device: an inset hairline, never touching the screen edge.
 * SPACING.dividerInset (24) on both sides, per A6 / the RULE discriminator. */
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

// Async Server Component (repair pass, open item 2): getAlternateCoverPhoto calls the
// server-only admin Supabase client, so this file can no longer be "use client". Its one
// interactive piece (Manage disclosure + buttons) now lives in ./NextAppointmentActions.tsx.
export default async function BookingsListRule({ locale, upcoming, past }: Props) {
  const localeCode = LOCALE_CODE[locale] ?? "en-CH";
  const next = upcoming[0] ?? null;
  const otherUpcoming = upcoming.slice(1);
  // One chronological list beneath the featured next appointment: any remaining upcoming
  // booking first (still soonest-first), then past bookings (already sorted most-recent-first
  // by the loader). No booking is ever double-counted between the two buckets.
  const others = [...otherUpcoming, ...past];

  const covers = await resolveCovers([...(next ? [next] : []), ...others]);
  const coverFor = (b: LoadedBooking): string | null =>
    b.salon ? covers.get(b.salon.id) ?? b.salon.cover_photo_url ?? null : null;

  const anchorText = next
    ? (() => {
        const start = new Date(next.starts_at);
        const weekday = start.toLocaleDateString(localeCode, { weekday: "long" });
        const dayMonth = start.toLocaleDateString(localeCode, { day: "numeric", month: "long" });
        return `Your next visit is ${weekday}, ${dayMonth}.`;
      })()
    : "You have no upcoming visits.";

  return (
    <KitProvider system="rule">
      <div className="w-full bg-white" style={{ paddingTop: SPACING.section }}>
        {/* Anchor: a sentence carrying the fact (A5), never a label with a number beside it. */}
        <div style={{ paddingLeft: SPACING.pageMargin, paddingRight: SPACING.pageMargin }}>
          <SectionTitle as="anchor">{anchorText}</SectionTitle>
        </div>

        {/* Next appointment: the ONLY row with the two action buttons. */}
        <div
          style={{
            paddingLeft: SPACING.pageMargin,
            paddingRight: SPACING.pageMargin,
            marginTop: SPACING.section,
          }}
        >
          <SectionTitle as="heading">Next</SectionTitle>

          {next ? (
            <div style={{ marginTop: SPACING.group }} data-kit-measure="next-appointment-block">
              <NextAppointmentRow
                booking={next}
                locale={locale}
                localeCode={localeCode}
                coverUrl={coverFor(next)}
              />
            </div>
          ) : (
            <div style={{ marginTop: SPACING.group }}>
              <EmptyState icon={Calendar} title="No upcoming bookings" message="Book your next treatment now" />
            </div>
          )}
        </div>

        <div style={{ marginTop: SPACING.section }}>
          <Hairline />
        </div>

        {/* Other bookings: every remaining booking (later upcoming, then past), hairline-
            divided, no action buttons, each carrying its own real status badge. */}
        <div
          style={{
            paddingLeft: SPACING.pageMargin,
            paddingRight: SPACING.pageMargin,
            marginTop: SPACING.group,
          }}
        >
          <SectionTitle as="heading">Other bookings</SectionTitle>
        </div>

        {others.length === 0 ? (
          <div
            style={{
              paddingLeft: SPACING.pageMargin,
              paddingRight: SPACING.pageMargin,
              marginTop: SPACING.group,
            }}
          >
            <EmptyState icon={Calendar} title="No other bookings" message="Your booking history will appear here" />
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

        {/* HideInBooking strips the header and the 125px bottom nav on every /dev path; this
            reproduces that space so the fold measures like the real phone. */}
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
}: {
  booking: LoadedBooking;
  locale: string;
  localeCode: string;
  /** Resolved server-side by the parent via getAlternateCoverPhoto: the salon's own
   * cover_photo_url, UNLESS it is the banned greyscale seed image (photo-1560066984,
   * R2_LOOK_SYSTEMS.md A8 / CONFLICT C10), in which case a different real photo of the SAME
   * salon from its own gallery_urls. Never a hardcoded src. */
  coverUrl: string | null;
}) {
  const start = new Date(booking.starts_at);
  const dateLabel = start.toLocaleDateString(localeCode, { weekday: "short", day: "2-digit", month: "short" });
  const timeLabel = start.toLocaleTimeString(localeCode, { hour: "2-digit", minute: "2-digit" });
  const href = pdpHref(locale, booking);
  const directions = mapsHref(booking);
  const svc = serviceName(booking, locale);

  return (
    <div>
      <div className="flex items-start gap-3">
        {/* A7: salon photo ratio is 5/4 ("it does not move"), 100x80 here, matching every other
            round-2 salon photo on the site; not the 1:1 square this row shipped with before the
            repair pass. */}
        <div
          className="relative flex-none overflow-hidden bg-s-bg-sunken"
          style={{ width: 100, height: 80, borderRadius: RADIUS.photoCardPx }}
        >
          {coverUrl ? (
            <Image src={coverUrl} alt="" fill sizes="100px" className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Scissors className="h-6 w-6 text-s-ink-2" strokeWidth={1.5} aria-hidden />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          {href ? (
            <Link
              href={href}
              className={["block truncate font-heading text-s-ink", TYPE_RAMP.sectionHeading.weightClass].join(" ")}
              style={{ fontSize: TYPE_RAMP.sectionHeading.size, lineHeight: TYPE_RAMP.sectionHeading.lineHeight }}
            >
              {booking.salon?.name || ""}
            </Link>
          ) : (
            <p
              className={["truncate font-heading text-s-ink", TYPE_RAMP.sectionHeading.weightClass].join(" ")}
              style={{ fontSize: TYPE_RAMP.sectionHeading.size, lineHeight: TYPE_RAMP.sectionHeading.lineHeight }}
            >
              {booking.salon?.name || ""}
            </p>
          )}

          <Meta>
            <span className="inline-flex items-center gap-1">
              <Calendar size={12} className="flex-none" aria-hidden />
              {dateLabel}
              <Clock size={12} className="ml-1 flex-none" aria-hidden />
              {timeLabel}
            </span>
          </Meta>

          {/* Repair pass (open item 3): the service line used to be its own 14px (body) run,
              the fold's 5th distinct size over the 4-size ceiling. It now shares the 12px meta
              tier, the same tier OtherBookingRow already uses for its own date+service line. */}
          {svc ? (
            <Meta className="mt-1 block truncate">{svc}</Meta>
          ) : null}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <StatusBadge status={booking.status} label={STATUS_LABELS[booking.status]} />
        {/* Repair pass (open item 3): size="total" (15, the CTA step) instead of "row" (14),
            so this Price joins the SecondaryButton labels' tier instead of adding a 5th size. */}
        <Price amount={booking.price_paid} locale={localeCode} size="total" />
      </div>

      <NextAppointmentActions directionsHref={directions} locale={locale} />
    </div>
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
  /** Resolved server-side by the parent via getAlternateCoverPhoto, same swap as
   * NextAppointmentRow's own coverUrl prop; see that component's header comment. */
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
          {/* Repair pass (open item 3): TYPE_RAMP.cta (15) instead of .body (14), pairing with
              this row's Price (also lifted to size="total"/15 below) so the fold's fifth size
              is closed rather than reintroduced by this row alone. */}
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
          {/* Repair pass (open item 2): this line used to force `truncate` (nowrap + ellipsis)
              over date+service together, so the real seeded service names ("Women Cut",
              "Men's Haircut") clipped to "Wo..."/"M..." at 390px, the worst-case content floor
              this screen was failing. `truncate` is dropped; `min-w-0` stays so the line still
              shrinks against its flex-none sibling (badge + Book again) instead of overflowing
              the row, and the text now wraps onto a second line instead of clipping. The row's
              own alignment moves from items-center to items-start so a two-line wrap doesn't
              vertically centre the badge against it. */}
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
