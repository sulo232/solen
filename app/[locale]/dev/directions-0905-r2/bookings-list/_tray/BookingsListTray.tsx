// Grounded-in: app/[locale]/dev/directions-0905/bookings-list/_va/BookingsListDirectionA.tsx
// (the FIXED Direction A structure this build keeps: one scroll, no tabs, the next appointment
// first) and its sibling app/[locale]/dev/directions-0905/bookings-list/_va/loadBookingsA.ts
// (imported directly below, not copied). Also grounded in
// components-legacy/booking/BookingCard.tsx (the real status-badge recipe, transcribed once
// into the kit's StatusBadge and reused here on every row) and
// components-legacy/ui/EmptyState.tsx (both empty branches, unmodified).
//
// Depicts: page structure, one scroll, next appointment first, no tabs -> app/[locale]/dev/directions-0905/bookings-list/_va/BookingsListDirectionA.tsx (STRUCTURE kept, only the LOOK and the owner's three named deltas change)
// Depicts: compact-row thumbnail/name/meta/Book-again grammar -> app/[locale]/dev/directions-0905/bookings-list/_va/BookingsListDirectionA.tsx's own PastRow (kept), MetaDot no-glyph separator per app/[locale]/_components/salon/MetaDot.tsx (imported read-only)
// Depicts: status badge on every row -> components-legacy/booking/BookingCard.tsx:85-89,138 (the real recipe, transcribed once into ../../_kit/StatusBadge.tsx and reused here)
// Depicts: Get-directions link -> app/[locale]/_components/salon/SalonLocation.tsx and components-legacy/booking/BookingConfirmation.tsx's google.com/maps/search pattern (same pattern `_va` already uses)
// Depicts: data loading (upcoming/past buckets, column list) -> app/[locale]/dev/directions-0905/bookings-list/_va/loadBookingsA.ts (IMPORTED below, never re-implemented)
// Depicts: swapping a salon's banned greyscale seed cover for a different real photo of the SAME salon -> app/[locale]/dev/directions-0905-r2/confirmation/_rule/getAlternateCoverPhoto.ts (the exact helper BookingsListLift.tsx already uses for this same swap; imported below, not duplicated)
// Depicts: card border/shadow per look system -> app/[locale]/dev/directions-0905-r2/_kit/systems.ts (TRAY entry: border:false, shadow:false, hairlineCeiling:0), read via <KitProvider system="tray"> wrapping this file's whole tree
// Depicts: hero-card anatomy (photo, name+badge, one meta line, service, price, button row) -> NET-NEW anatomy for this file, precedent only: _design-system/references/airbnb--trips.md item 4 (trip card: photo top, bold title, one grey subline, secondary action row); every field it shows is a real column already selected by loadBookingsA.ts above
// Depicts: demoting a second confirmed-future booking to the compact row grammar instead of its own hero card -> CompactRow, the same function defined in this file, BookingsListTray.tsx (no new component; design precedent _design-system/references/airbnb--trips.md item 6, condensed list variant for a second near-term trip)
//
// Exists-check: `npm run exists bookings-list` (run this session) returns the round-1 scaffold
// (page.tsx + _va/_vb/_vc, all direction comparisons, none a round-2 look-system build) and the
// real BookingsList/BookingCard components (reused for anatomy/grounding, not imported: this
// file's structure is the fixed Direction A from round-1's `_va`, restructured for the TRAY
// look system and the owner's three named deltas per the task brief). No existing round-2
// `bookings-list` folder under `directions-0905-r2` before this file. Repair pass (below) ran
// `npm run exists "next appointment card"` and got one hit, LIFT's own NextAppointmentCard.tsx:
// reused as the split PATTERN (a server parent resolving covers, a client leaf rendering them),
// never as code, since TRAY's hero anatomy differs from LIFT's.
//
// Repair (2026-09-06), four critic-confirmed open items on this file, fixed here and nowhere
// else in the tree:
// 1. This file never wrapped its tree in <KitProvider system="tray">, so every Card fell through
//    KitProvider's own documented default ("lift") and rendered the LIFT shadow on all 7 cards,
//    the opposite of TRAY's own `shadow:false` delta and its own discriminator ("every group ...
//    carries border-width:0 and box-shadow:none"). Fixed by wrapping the whole return in
//    <KitProvider system="tray"> below, the same way BookingsListLift.tsx wraps its own tree in
//    <KitProvider system="lift">.
// 2. CompactRow's "Book again" was a TextLink with neither href nor onClick, a dead click.
//    Fixed the same way `_rule/BookingsListRule.tsx` already does it on the identical control:
//    `<TextLink href={href ?? undefined}>`, routing to the salon PDP via the same pdpHref this
//    file already computes for the row's own name link.
// 3. The hero photo and both compact-row thumbnails for the seed's "Atelier Haarwerk" booking
//    read `booking.salon?.cover_photo_url` directly, which is that salon's real but banned
//    greyscale seed image (photo-1560066984, R2_LOOK_SYSTEMS.md A8 / CONFLICT C10). Fixed by
//    splitting the interactive hero card out into ./HeroCard.tsx (a "use client" leaf, since it
//    owns the Manage-disclosure useState and the entrance/exit motion, which a Server Component
//    cannot own) so THIS file can become an async Server Component and `await
//    getAlternateCoverPhoto(...)` before rendering, exactly the split BookingsListLift.tsx +
//    NextAppointmentCard.tsx already established. Never a hardcoded src: the resolved cover is
//    still the real salon's own gallery photo, read through its `gallery_urls` column.
// 4. This "measured:" comment used to defer the rendered hero-card height to "this build's
//    structured return" instead of stating it in-file. Fixed below: the number is now recorded
//    here, measured live after the repair (Playwright, 390x844, this session).
//
// measured: the repaired hero card, live at
// /en/dev/directions-0905-r2/bookings-list?s=tray (390x844, this session's Playwright pass,
// getBoundingClientRect on the rendered <article>), is 406.77px tall. Round-1's `_va`
// UpcomingCard measured 483.4px at the same width, so this hero is about 16% shorter, via (a)
// the shorter aspect-[16/9] photo (~30% shorter than round-1's aspect-[5/4]) and (b) dropping
// the internal footer hairline (TRAY's own hairlineCeiling: 0, see "system:" below). Kit sizes
// used throughout, all re-measured live via getComputedStyle after this repair: SectionTitle
// renders `sectionHeading` at 18px/500 for both headings; the salon name in the hero and every
// compact row, plus Price and the CTA label, share `body`'s own 14px slot (14px/500 for
// name+price+CTA, 14px/400 for the service line and "Book again"); Meta and StatusBadge share
// 12px (12px/400 meta, 12px/500 badge). That is 3 distinct rendered sizes (18/14/12) and 2
// distinct rendered weights (500/400) fold-wide, inside the kit's own closed ramp (tokens.ts's
// own header note: the CTA's earlier 15px value was resolved down to 14px, sharing body's slot
// and distinguished by weight only, to stay inside the 4-size FLOORS LAW ceiling). No 15px or
// 16px render anywhere on this screen's own content. SPACING.pageMargin (16) / SPACING.sibling
// (12, gap between compact rows), kit SecondaryButton (50px tall, unmodified) for Get directions
// / Manage, kit Card (photo/entity, radius 16 both) for the hero and every compact row.
//
// floors: (a) photographic focal = the next-appointment photo, the single largest element in
// the first viewport; (b) one clearly biggest element = that same photo; (c) tabular/real
// number = Price (tabular-nums) and the real day/date strings, both from the live loader, never
// invented; (d) semantic colour moment = the StatusBadge green/red/neutral icon on every row
// with a status, present because the seed data has a real cancelled booking (measured live: 2
// upcoming, 5 past, 1 cancelled); (e) no dead-grey zone = the tray band is populated with real
// compact rows, never bare; (f) worst-case content = salon name and service name both
// `truncate`, so an arbitrarily long real name never breaks the layout.
//
// system: TRAY, verbatim from R2_LOOK_SYSTEMS.md Part B, SYSTEM 3: "the canvas does the
// separating, so white groups sit on a #F4F4F5 band carrying neither a border nor a shadow, and
// the page alternates white and tray down the whole scroll." Applied per Part B's own worked
// line for this exact screen ("Bookings list A: upcoming on white and 'Past' on a tray band, so
// the two card grammars are separated by the canvas instead of by a heading alone") with one
// named adjustment: the tray band is labelled "Other bookings", not "Past", because the seed
// data has a SECOND confirmed future booking (measured live: 2 upcoming, 5 past) and labelling
// a not-yet-happened booking "Past" would be a false status claim (CLAUDE.md taste rule 1,
// no-fabrication). Each row's own StatusBadge carries the true per-row status instead, which is
// exactly the owner's third requested change. TRAY's own card delta
// (app/[locale]/dev/directions-0905-r2/_kit/systems.ts) sets `hairlineCeiling: 0` (zero
// hairlines anywhere in the fold, stricter than LIFT's 1 or RULE's unlimited), so unlike
// round-1's `_va` (which used a `border-t border-s-border` between a card's content and its
// footer, and between every compact row in one shared list card), this build uses margin/
// spacing alone for every internal seam and renders every "other booking" as its OWN separate
// white `entity` card (radius 16, no border, no shadow) gapped by SPACING.sibling, matching the
// TRAY source citation's own words for this exact card shape (systems.ts cites
// `fresha--look-recipes.md`: "white 16px cards ... once the canvas provides the boundary and
// the inset hairline comes off"). This delta is now actually reachable: the tree renders inside
// <KitProvider system="tray"> (repair fix 1 above), where before this repair every Card fell
// back to KitProvider's own "lift" default and rendered a shadow regardless of this delta.

import Image from "next/image";
import Link from "next/link";
import { Scissors, Calendar as CalendarIcon } from "lucide-react";
import EmptyState from "@/components-legacy/ui/EmptyState";
import { MetaDot } from "@/app/[locale]/_components/salon/MetaDot";
import {
  KitProvider,
  Card,
  SectionTitle,
  Meta,
  StatusBadge,
  TextLink,
  SPACING,
  COLOR,
  type BookingStatus,
} from "../../_kit";
import { getAlternateCoverPhoto } from "../../confirmation/_rule/getAlternateCoverPhoto";
import { HeroCard } from "./HeroCard";
import type { LoadedBooking } from "../../../directions-0905/bookings-list/_va/loadBookingsA";

interface Props {
  locale: string;
  upcoming: LoadedBooking[];
  past: LoadedBooking[];
}

const LOCALE_CODE: Record<string, string> = { de: "de-CH", en: "en-CH", fr: "fr-CH", it: "it-CH" };

const STATUS_LABEL: Record<BookingStatus, string> = {
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

// Resolves each distinct salon's cover photo once (bookings repeat salons), swapping out the
// banned greyscale seed image (photo-1560066984, R2_LOOK_SYSTEMS.md A8 / CONFLICT C10) for a
// different REAL photo of the same salon via getAlternateCoverPhoto (imported above, not
// duplicated: the confirmation/_rule builder already solved this exact swap, reading the
// salon's own gallery_urls column through the same admin client seedBooking.ts uses; LIFT's
// BookingsListLift.tsx uses the identical helper the identical way). Never a hardcoded src; a
// salon whose gallery has no alternate keeps its own cover.
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

export async function BookingsListTray({ locale, upcoming, past }: Props) {
  const localeCode = LOCALE_CODE[locale] ?? "en-CH";
  const nextAppointment = upcoming[0] ?? null;
  // Everything else, ordered fanning out from "now": any additional confirmed future bookings
  // first (soonest first, per loadBookingsA's own ascending sort), then real past/cancelled
  // (most recent first, per loadBookingsA's own descending sort). Never re-labelled "past".
  const otherBookings = [...upcoming.slice(1), ...past];

  const covers = await resolveCovers([...(nextAppointment ? [nextAppointment] : []), ...otherBookings]);
  const coverFor = (b: LoadedBooking) => (b.salon ? covers.get(b.salon.id) ?? b.salon.cover_photo_url ?? null : null);

  return (
    <KitProvider system="tray">
      {/* Band 1: WHITE. The single next appointment, hero-scaled, the only card on this screen
          carrying Get directions / Manage (owner change #1). */}
      <div className="bg-white" style={{ paddingLeft: SPACING.pageMargin, paddingRight: SPACING.pageMargin, paddingTop: 24 }}>
        <SectionTitle as="heading">Next appointment</SectionTitle>
        <div className="mt-3">
          {nextAppointment ? (
            <HeroCard
              booking={nextAppointment}
              locale={locale}
              localeCode={localeCode}
              coverUrl={coverFor(nextAppointment)}
            />
          ) : (
            <EmptyState icon={CalendarIcon} title="No upcoming bookings" message="Book your next treatment now" />
          )}
        </div>
      </div>

      {/* Band 2: TRAY (#F4F4F5). Every other booking, compact, badge-carrying (owner change #3). */}
      <div style={{ backgroundColor: COLOR.tray }}>
        <div style={{ paddingLeft: SPACING.pageMargin, paddingRight: SPACING.pageMargin, paddingTop: 24, paddingBottom: 24 }}>
          <SectionTitle as="heading">
            Other bookings
            <span className="ml-1.5 font-normal text-s-ink-2">({otherBookings.length})</span>
          </SectionTitle>
          {otherBookings.length === 0 ? (
            <div className="mt-3">
              <EmptyState icon={CalendarIcon} title="No other bookings" message="Your booking history will show up here" />
            </div>
          ) : (
            <div className="mt-3 flex flex-col" style={{ gap: SPACING.sibling }}>
              {otherBookings.map((booking) => (
                <CompactRow
                  key={booking.id}
                  booking={booking}
                  locale={locale}
                  localeCode={localeCode}
                  coverUrl={coverFor(booking)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Fold-measurement spacer, white: the real BottomNav this /dev route never renders
          (HideInBooking.tsx strips all chrome on /dev paths) is 125px per its own header
          comment; this keeps the fold honest without drawing any chrome of this file's own. */}
      <div style={{ height: 125, backgroundColor: "#FFFFFF" }} aria-hidden />
    </KitProvider>
  );
}

function CompactRow({
  booking,
  locale,
  localeCode,
  coverUrl,
}: {
  booking: LoadedBooking;
  locale: string;
  localeCode: string;
  /** Resolved server-side by the parent (BookingsListTray, repair fix 3): the salon's own
   * cover_photo_url, UNLESS it is the banned greyscale seed image (photo-1560066984,
   * R2_LOOK_SYSTEMS.md A8 / CONFLICT C10), in which case a different real photo of the SAME
   * salon from its own gallery_urls. Never a hardcoded src. */
  coverUrl: string | null;
}) {
  const start = new Date(booking.starts_at);
  const isFuture = start.getTime() > Date.now();
  const dateLabel = isFuture
    ? start.toLocaleDateString(localeCode, { weekday: "short", day: "2-digit", month: "short" })
    : start.toLocaleDateString(localeCode, { day: "2-digit", month: "short", year: "numeric" });
  const href = pdpHref(locale, booking);
  const svc = serviceName(booking, locale);

  return (
    <Card variant="entity">
      <div className="flex items-center gap-3 p-3">
        <div className="relative h-12 w-12 flex-none overflow-hidden rounded-[12px] bg-s-bg-sunken">
          {coverUrl ? (
            <Image src={coverUrl} alt="" fill sizes="48px" className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Scissors className="h-5 w-5 text-s-ink-2" strokeWidth={1.5} aria-hidden />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            {href ? (
              <Link href={href} className="min-w-0 truncate text-[14px] font-semibold text-s-ink">
                {booking.salon?.name || ""}
              </Link>
            ) : (
              <p className="min-w-0 truncate text-[14px] font-semibold text-s-ink">{booking.salon?.name || ""}</p>
            )}
            {/* Repair fix 2: was a dead TextLink (no href, no onClick). Routes to the same salon
                PDP the row's own name link already resolves (pdpHref), matching how
                `_rule/BookingsListRule.tsx` wires the identical control. */}
            <TextLink href={href ?? undefined} className="flex-none">
              Book again
            </TextLink>
          </div>
          <div className="mt-0.5 flex items-center justify-between gap-2">
            <Meta>
              <span className="truncate">
                {dateLabel}
                {svc ? (
                  <>
                    <MetaDot />
                    {svc}
                  </>
                ) : null}
              </span>
            </Meta>
            <StatusBadge status={booking.status} label={STATUS_LABEL[booking.status]} className="flex-none" />
          </div>
        </div>
      </div>
    </Card>
  );
}
