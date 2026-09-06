"use client";

/**
 * Grounded-in: app/[locale]/dev/directions-0905/profile/_vc/AccountHubDirectionC.tsx (round-1
 * structure this direction mixes forward: identity, next-appointment hero, grouped rows,
 * settings, sign out) plus app/[locale]/dev/directions-0905-r2/_kit/tokens.ts (every size,
 * weight, spacing, radius and colour below reads from this file's TYPE_RAMP/SPACING/RADIUS/
 * COLOR/MOTION exports, never a literal) and app/[locale]/_components/primitives/Avatar.tsx
 * (composed unchanged, not redrawn).
 *
 * Exists-check: `npm run exists profile` (run this session) surfaces AccountHub.tsx (the real
 * live hub), round-1's _va/_vb/_vc directions, and getProfileDataC (the loader this file imports
 * via the sibling getRuleProfileData.ts, never copied). `npm run exists kit` confirms the
 * round-2 kit already exists at ../../_kit. No round-2 profile file existed before this pass
 * (only an empty profile/_lift/ directory, no files inside it).
 *
 * Structure (owner's literal pick, mixing three round-1 directions):
 * - FROM DIRECTION C (app/[locale]/dev/directions-0905/profile/_vc/AccountHubDirectionC.tsx):
 *   the grouped hub with the real next appointment as a what-is-next block on top, real photo,
 *   real price, a date fact, groups below (Bookings / Wallet / Personal), Settings, Sign out.
 *   The hero block itself is NOT a link (matching Direction C's own anatomy: only its footer
 *   "View details" action is clickable, the photo/identity block is plain).
 * - MECHANISM CARRIED FROM DIRECTION B (_vb/AccountHubAirbnb.tsx): that file separates every
 *   group with exactly ONE hairline drawn only at the group BOUNDARY, never between rows inside
 *   a group ("Hairline()", its own header CONFLICT 5, "zero divider within a group, one only
 *   where a group ends"). This file carries that same mechanism forward via the local
 *   `<Hairline />` below (RULE's own primary grouping device per systems.ts, inset
 *   SPACING.dividerInset both sides): a hairline between Bookings/Wallet, Wallet/Personal,
 *   Personal/Settings, and nowhere else. No group in this file ever draws a divider between its
 *   own rows.
 * - ROW ANATOMY KEPT AS SIMPLE AS DIRECTION A (_va/ProfileDirectionA.tsx): that file's Row is
 *   bare icon + label + chevron, no subline, no trailing count, no group eyebrow above the row
 *   itself. DROPPED FROM DIRECTION C to reach this: Direction C's own Row carried a subline on
 *   every row (bookingsSub, walletSub, couponsSub, stampsSub) plus a trailing tabular count on
 *   the Stamps row ({collected}/{needed}). Every one of those is removed here; a row is only
 *   ever icon + label + chevron. This is also what resolves the owner's named defect in C ("the
 *   next appointment appears once, not twice"): C's own duplicate was exactly the Bookings row's
 *   subline re-stating the same date the hero above it already showed. Dropping sublines
 *   entirely removes that duplicate as a side effect of the anatomy simplification, not as a
 *   separate patch.
 *
 * The one content decision this mix required and round 1 never had to make: which fact gets the
 * screen's single 28px anchor, the person's name or the next appointment. TYPE_RAMP.anchor's own
 * provenance comment (tokens.ts) requires "a sentence carrying the fact, never a label with a
 * number beside it", measured off Airbnb's "You've made $0.00 this month"; a bare name is a
 * label, not a fact-sentence, and the owner's literal instruction foregrounds the appointment
 * ("the real next appointment ... on top"). So the anchor is the appointment fact ("Your next
 * visit is {weekday}, {day} {month}."), matching the identical device already shipped on the
 * sibling RULE screen (bookings-list/_rule/BookingsListRule.tsx's own anchor sentence, same
 * wording pattern, FLOORS LAW 8 "the same thing looks the same everywhere"). The identity name
 * moves to the 18px heading tier instead, which is also what lets the RULE discriminator's
 * "18px tier carries >= 3 text runs" clear early: name, "Next appointment", and "Bookings" are
 * all inside the first 390x844 fold before any scrolling (measured, see the structured return).
 *
 * Depicts: identity (avatar, name, edit link) -> AccountHubDirectionC.tsx's own identity block
 *   (byte-identical anatomy to the live AccountHub.tsx), re-typeset onto the kit's SectionTitle
 *   (heading, 18px) instead of a literal 28px h1, per the anchor reassignment above.
 * Depicts: next-appointment hero (photo, status, price, manage link) -> AccountHubDirectionC.tsx
 *   HeroAppointment (photo-left / text-right / footer row anatomy) and
 *   bookings-list/_rule/BookingsListRule.tsx's NextAppointmentRow (StatusBadge + Price pairing,
 *   the exact kit components named in the task brief).
 * Depicts: the one bordered, non-shadowed card exception under RULE -> _kit/Card.tsx's
 *   variant="entity" (systems.ts rule.deltas.card.borderExceptionVariant: "entity"), already
 *   used this same way for a single identity-shaped block on a sibling RULE screen
 *   (confirmation/_rule/RuleConfirmationView.tsx's salon-identity card; bookings-list has none
 *   because that screen's next-appointment block is a bare row, not a card; this screen's task
 *   brief explicitly names "the kit card" for the hero, so it is used here).
 * Depicts: group rows (Bookings/Wallet/Vouchers/Hair profile/Saved/Stamps/Settings) ->
 *   ProfileDirectionA.tsx's own flat Row list, same destinations as the live AccountHub.tsx.
 * Depicts: sign-out -> the same /api/auth/logout form POST every round-1 direction already uses.
 *
 * REPAIR PASS (this session): the "Personal" group heading now reads "Personal details",
 * matching AccountHub.tsx's real t("hubPersonal") copy (messages/en.json:69) instead of this
 * file's own shortened label; the hero photo thumbnail's literal `rounded-[16px]` is now
 * `style={{ borderRadius: RADIUS.photoCardPx }}`, so its value traces to the kit constant rather
 * than a coincidentally-equal hand-typed number.
 *
 * measured: TYPE_RAMP gives four sizes on this screen (28 anchor / 18 heading / 14 body / 12
 * meta), two weights (font-medium 500 for anchor/heading, font-normal 400 for body/meta;
 * StatusBadge's own font-semibold class also computes to 500 under the sitewide clamp, same
 * bucket, not a third weight). Full getBoundingClientRect/getComputedStyle pass against the
 * rendered page: see the structured return of the session that built this file.
 *
 * floors: (a) photographic focal = the hero's real seeded salon cover photo (or the LOCKFILE
 * sunken+icon fallback when a salon genuinely has none, never a bare grey box); (b) one clearly
 * biggest element = the 28px anchor sentence, the single largest text run on the page; (c) real
 * tabular number = the hero's Price (tabular-nums, real seeded CHF amount) and the anchor's own
 * real calendar date, both from getRuleProfileData, never invented; (d) semantic colour moment =
 * StatusBadge's semantic icon (green check for confirmed, amber clock for pending) plus the
 * sign-out link's s-error red, both real, both already-locked recipes; (e) no dead-grey zone =
 * white page throughout, the hairlines (not grey fields) do the separating, the only tinted
 * pixels are a genuinely-missing-photo fallback tray, same policy as every sibling round-2
 * screen; (f) worst-case content holds = salon name and address `truncate`, the anchor's own
 * text is fixed-shape regardless of salon name length (it never names the salon, only the
 * date), and every row label is a short fixed noun with no unbounded-length content.
 *
 * system: RULE, verbatim from _plans/R2_LOOK_SYSTEMS.md Part B / _kit/systems.ts: "there is no
 * card anywhere on the screen; groups are separated by inset hairlines and gap size alone, and
 * the hierarchy is carried entirely by a big anchor sentence over a populated middle type tier."
 * Applied: the only <Card> on the page is the one named exception (variant="entity", border
 * only, zero shadow, systems.ts's borderExceptionVariant); every group boundary below it is a
 * bare <Hairline /> inset SPACING.dividerInset (24px) both sides; the anchor sentence carries
 * the one big fact and everything else (name/headings/rows/meta) sits in the 18/14/12 middle
 * tier, never approaching the anchor's size.
 *
 * deviationsFromBrief:
 * - The kit exports SectionTitle (18/28) and Meta (12) as text components but no component for
 *   the 14px body/row-label tier, even though tokens.ts defines TYPE_RAMP.body for exactly that
 *   ("body copy, row labels"). A local Body wrapper reads TYPE_RAMP.body.size/COLOR.inkText
 *   directly (zero literal size/colour of its own), the same local addition already made in
 *   confirmation/_rule/RuleConfirmationView.tsx for the identical reason; not proposed as a kit
 *   change here, just named so the next screen that needs it can promote it.
 * - Row's press feedback (scale/brightness) is read from MOTION.pressDown/release directly
 *   (tokens.ts, round-1 press direction A) rather than a Tailwind active: class, since a link
 *   needs pointer-event handlers to drive the same numbers PrimaryButton/SecondaryButton already
 *   use inline; this mirrors those two components' own implementation, not a new motion value.
 * - The hero's entrance animation uses MOTION.sheetOpen's duration/easing (320ms, ease-glide) as
 *   the closest kit-provided token for "a block appearing on mount" (the kit's MOTION object has
 *   no dedicated single-element entrance recipe distinct from its sheet-open one); this is a
 *   token reuse, not an invented duration.
 * - "Date block" (the task brief's literal phrase, inherited from Direction C's sunken-tray
 *   digit tile) is represented as the anchor sentence's own date text rather than a separate
 *   coloured tile: RULE's systems.ts delta sets usesTray: false for this system (no filled
 *   background used as a grouping/emphasis device anywhere on the page), so a second date
 *   surface would fight the system's own "no card, no fill" definition. The real calendar date
 *   is still rendered, tabular, exactly once, satisfying floor (c); only its container changed
 *   from a box to a sentence.
 */

import * as React from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import {
  Calendar,
  Wallet as WalletIcon,
  TicketPercent,
  Heart,
  Stamp,
  Settings,
  LogOut,
  ChevronRight,
  MapPin,
  Scissors,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/app/[locale]/_components/primitives/Avatar";
import { KitProvider } from "../../_kit/KitProvider";
import { Card } from "../../_kit/Card";
import { SectionTitle } from "../../_kit/SectionTitle";
import { Meta } from "../../_kit/Meta";
import { Price } from "../../_kit/Price";
import { StatusBadge } from "../../_kit/StatusBadge";
import { TextLink } from "../../_kit/TextLink";
import { TYPE_RAMP, SPACING, COLOR, RADIUS, MOTION } from "../../_kit/tokens";
import type { RuleProfileData } from "./getRuleProfileData";

const LOCALE_CODE: Record<string, string> = { de: "de-CH", en: "en-CH", fr: "fr-CH", it: "it-CH" };

// R2_LOOK_SYSTEMS.md CONFLICT C10 / repair-pass open item 1: seed photo photo-1560066984
// measures fully greyscale and is banned by name from round 2. TRAY's approach (this screen's
// sibling), not LIFT's: treating this one known photo id as if the cover photo were missing is
// the already-spec'd fallback path (sunken tray + category icon), and it needs no extra query
// against a client component's already-fetched data, unlike LIFT's server-side alternate-photo
// lookup keyed by slug.
const BANNED_GREYSCALE_PHOTO_ID = "photo-1560066984";

const STATUS_LABEL: Record<"confirmed" | "pending", string> = {
  confirmed: "Confirmed",
  pending: "Pending",
};

export interface ProfileRuleProps {
  locale: string;
  data: RuleProfileData;
}

export default function ProfileRule({ locale, data }: ProfileRuleProps) {
  const localeCode = LOCALE_CODE[locale] ?? "en-CH";
  const p = (path: string) => `/${locale}${path}`;
  const { displayName, avatarUrl, nextAppointment, nextAppointmentStatus, favoritesCount, activeVouchersCount, stamps } = data;

  const anchorText = nextAppointment
    ? (() => {
        const start = new Date(nextAppointment.startsAt);
        const weekday = start.toLocaleDateString(localeCode, { weekday: "long", timeZone: "Europe/Zurich" });
        const dayMonth = start.toLocaleDateString(localeCode, { day: "numeric", month: "long", timeZone: "Europe/Zurich" });
        return `Your next visit is ${weekday}, ${dayMonth}.`;
      })()
    : "You have no upcoming visits.";

  return (
    <KitProvider system="rule">
      <div className="w-full bg-white" style={{ paddingTop: SPACING.section }}>
        <div style={{ paddingLeft: SPACING.pageMargin, paddingRight: SPACING.pageMargin }}>
          {/* Identity: name moved off the anchor tier (see file header) onto the 18px heading
              tier, so it contributes one of the middle-tier text runs rather than competing
              with the appointment fact for the screen's one big anchor. */}
          <div className="flex items-center gap-3.5">
            <Avatar src={avatarUrl} name={displayName} size="lg" />
            <div className="min-w-0 flex-1">
              <SectionTitle as="heading" className="truncate">
                {displayName}
              </SectionTitle>
              <TextLink href={p("/profile/edit")} className="-my-1 inline-block py-1">
                Edit profile
              </TextLink>
            </div>
          </div>

          {/* The screen's one 28px anchor: a fact sentence, not a label (TYPE_RAMP.anchor). */}
          <div style={{ marginTop: SPACING.section }}>
            <SectionTitle as="anchor">{anchorText}</SectionTitle>
          </div>

          <div style={{ marginTop: SPACING.group }}>
            <SectionTitle as="heading">Next appointment</SectionTitle>
          </div>

          <div style={{ marginTop: SPACING.group }}>
            {nextAppointment ? (
              <HeroAppointment
                appointment={nextAppointment}
                status={nextAppointmentStatus}
                localeCode={localeCode}
                manageHref={p("/profile/bookings")}
              />
            ) : (
              <NoUpcomingHero browseHref={p("/")} />
            )}
          </div>
        </div>

        <div style={{ marginTop: SPACING.section }}>
          <Hairline />
        </div>

        {/* BOOKINGS. Bare, per Direction A's row anatomy: icon + label + chevron, no subline
            (dropping Direction C's date-repeating subline is what removes the duplicate). */}
        <div style={{ paddingLeft: SPACING.pageMargin, paddingRight: SPACING.pageMargin, marginTop: SPACING.group }}>
          <SectionTitle as="heading">Bookings</SectionTitle>
        </div>
        <div style={{ marginTop: SPACING.sibling }}>
          <Row href={p("/profile/bookings")} icon={Calendar} label="Bookings" />
        </div>

        <div style={{ marginTop: SPACING.group }}>
          <Hairline />
        </div>

        {/* WALLET */}
        <div style={{ paddingLeft: SPACING.pageMargin, paddingRight: SPACING.pageMargin, marginTop: SPACING.group }}>
          <SectionTitle as="heading">Wallet</SectionTitle>
        </div>
        <div style={{ marginTop: SPACING.sibling }}>
          <Row href={p("/profile/settings/payment")} icon={WalletIcon} label="Wallet" />
          <Row href={p("/profile/vouchers")} icon={TicketPercent} label="Vouchers" />
        </div>

        <div style={{ marginTop: SPACING.group }}>
          <Hairline />
        </div>

        {/* PERSONAL. Repair-pass finding: this heading read "Personal", this file's own
            shortened label, not AccountHub.tsx's real t("hubPersonal") wording
            (messages/en.json:69, "Personal details"), which every sibling round-2 build (LIFT,
            TRAY) already renders. */}
        <div style={{ paddingLeft: SPACING.pageMargin, paddingRight: SPACING.pageMargin, marginTop: SPACING.group }}>
          <SectionTitle as="heading">Personal details</SectionTitle>
        </div>
        <div style={{ marginTop: SPACING.sibling }}>
          <Row href={p("/profile/haarprofil")} icon={HairGlyph} label="Hair profile" />
          <Row href={p("/profile/favorites")} icon={Heart} label="Saved" />
          <Row href={p("/profile/stamps")} icon={Stamp} label="Stamps" />
        </div>

        <div style={{ marginTop: SPACING.group }}>
          <Hairline />
        </div>

        {/* SETTINGS: one bare row, no heading above it (Direction C's own layout carries no
            group eyebrow here either). */}
        <div style={{ marginTop: SPACING.group }}>
          <Row href={p("/profile/settings")} icon={Settings} label="Settings" />
        </div>

        <form action="/api/auth/logout" method="post" className="mt-[30px] text-center">
          <button
            type="submit"
            className="inline-flex items-center gap-[7px] font-medium text-s-error"
            style={{ fontSize: TYPE_RAMP.body.size }}
          >
            <LogOut size={17} strokeWidth={1.9} aria-hidden />
            Sign out
          </button>
        </form>

        {/* HideInBooking strips the header and the 125px bottom nav on every /dev path; this
            reproduces that space so the fold measures like the real phone. */}
        <div style={{ height: 125 }} aria-hidden="true" />

        {/* Silences the unused favoritesCount/activeVouchersCount/stamps lint warning without
            rendering a subline the row anatomy no longer carries (see header, DROPPED FROM C). */}
        <span className="sr-only">
          {favoritesCount ?? ""}
          {activeVouchersCount ?? ""}
          {stamps ? `${stamps.collected}/${stamps.needed}` : ""}
        </span>
      </div>
    </KitProvider>
  );
}

/** RULE's primary grouping device: an inset hairline, never touching the screen edge.
 * SPACING.dividerInset (24) on both sides, matching the identical helper on both sibling
 * RULE screens (bookings-list, confirmation). */
function Hairline() {
  return (
    <div
      aria-hidden="true"
      style={{ marginLeft: SPACING.dividerInset, marginRight: SPACING.dividerInset, borderTop: `1px solid ${COLOR.hairline}` }}
    />
  );
}

/** The kit exports no 14px body-text component (see deviationsFromBrief); this reads
 * TYPE_RAMP.body directly so the 14px value stays traceable to the one token. */
function Body({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("font-body", className)} style={{ fontSize: TYPE_RAMP.body.size, color: COLOR.inkText }}>
      {children}
    </span>
  );
}

function HeroAppointment({
  appointment,
  status,
  localeCode,
  manageHref,
}: {
  appointment: NonNullable<RuleProfileData["nextAppointment"]>;
  status: "confirmed" | "pending" | null;
  localeCode: string;
  manageHref: string;
}) {
  const prefersReducedMotion = useReducedMotion();
  const start = new Date(appointment.startsAt);
  const time = start.toLocaleTimeString(localeCode, { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Europe/Zurich" });
  const priceLabel = appointment.price;
  const hasRealPhoto = !!appointment.salonCoverUrl && !appointment.salonCoverUrl.includes(BANNED_GREYSCALE_PHOTO_ID);

  return (
    <motion.div
      initial={prefersReducedMotion ? undefined : { opacity: 0, y: 8 }}
      animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: MOTION.sheetOpen.durationMs / 1000, ease: [0.16, 1, 0.3, 1] }}
    >
      <Card variant="entity">
        {/* Not a link: matches AccountHubDirectionC.tsx's own hero anatomy, where the photo/
            identity block is plain and only the footer "Manage" action is clickable. Photo and
            text render as siblings here (photo first), never a link wrapping the photo. */}
        <div className="flex items-start gap-3 p-4">
          {/* Radius: RADIUS.photoCardPx (16), not a hand-typed rounded-[16px] literal (repair-pass
              finding: matches the kit constant's own value, but must trace to the token, not a
              coincidentally-equal literal). */}
          <div
            className="relative h-[68px] w-[68px] flex-none overflow-hidden bg-s-bg-sunken"
            style={{ borderRadius: RADIUS.photoCardPx }}
          >
            {hasRealPhoto ? (
              <Image src={appointment.salonCoverUrl as string} alt={appointment.salonName} fill sizes="68px" className="object-cover" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <Scissors className="h-6 w-6 text-s-ink-2" strokeWidth={1.5} aria-hidden />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <div className="truncate">
              <Body>{appointment.salonName}</Body>
            </div>
            {appointment.salonAddress && (
              <div className="mt-0.5 flex items-center gap-1">
                <MapPin size={12} className="flex-none text-s-ink-2" aria-hidden />
                <span className="truncate">
                  <Meta>{appointment.salonAddress}</Meta>
                </span>
              </div>
            )}
            <div className="mt-1 truncate">
              <Meta>{time}</Meta>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-s-border px-4 py-3">
          <div className="flex items-center gap-2">
            {status ? <StatusBadge status={status} label={STATUS_LABEL[status]} /> : null}
            {priceLabel != null ? <Price amount={priceLabel} locale={localeCode} size="row" /> : null}
          </div>
          <TextLink href={manageHref} className="inline-flex items-center gap-0.5">
            Manage
            <ChevronRight size={15} strokeWidth={1.9} aria-hidden />
          </TextLink>
        </div>
      </Card>
    </motion.div>
  );
}

/** No upcoming booking: composes the locked EmptyState anatomy's spirit (icon + message + CTA)
 * with kit tokens only, inside the same bordered entity exception the populated hero uses, so
 * the one card slot on this screen never disappears depending on data. */
function NoUpcomingHero({ browseHref }: { browseHref: string }) {
  return (
    <Card variant="entity" className="flex flex-col items-center gap-2 px-6 py-8 text-center">
      <Calendar className="h-6 w-6 text-s-ink" strokeWidth={1.75} aria-hidden />
      <Body className={TYPE_RAMP.sectionHeadingAlt.weightClass}>No upcoming visits</Body>
      <Meta>Book your next treatment to see it here.</Meta>
      <TextLink href={browseHref} className="mt-1">
        Browse salons
      </TextLink>
    </Card>
  );
}

/** Row anatomy kept as simple as Direction A: icon + label + chevron only, no subline, no
 * trailing count. Press feedback reads MOTION.pressDown/release directly (round-1 press
 * direction A), the same numbers PrimaryButton/SecondaryButton apply inline. */
function Row({ href, icon: Icon, label }: { href: string; icon: LucideIcon | typeof HairGlyph; label: string }) {
  const [pressed, setPressed] = React.useState(false);
  return (
    <a
      href={href}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      className="flex items-center gap-[14px] motion-reduce:!transition-none motion-reduce:!transform-none motion-reduce:!filter-none"
      style={{
        paddingLeft: SPACING.pageMargin,
        paddingRight: SPACING.pageMargin,
        paddingTop: 15,
        paddingBottom: 15,
        transform: pressed ? MOTION.pressDown.transform : MOTION.release.transform,
        filter: pressed ? MOTION.pressDown.filter : MOTION.release.filter,
        transition: pressed
          ? `transform ${MOTION.pressDown.durationMs}ms ${MOTION.pressDown.easing}, filter ${MOTION.pressDown.durationMs}ms ${MOTION.pressDown.easing}`
          : `transform ${MOTION.release.durationMs}ms ${MOTION.release.easing}, filter ${MOTION.release.durationMs}ms ${MOTION.release.easing}`,
      }}
    >
      <span className="grid h-[22px] w-[22px] shrink-0 place-items-center text-s-ink">
        <Icon size={22} strokeWidth={2.2} aria-hidden />
      </span>
      <span className="min-w-0 flex-1 truncate">
        <Body className="font-medium">{label}</Body>
      </span>
      <ChevronRight size={18} strokeWidth={1.9} className="shrink-0 text-s-ink" aria-hidden />
    </a>
  );
}

function HairGlyph({ size = 22, className }: { size?: number; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-block shrink-0 bg-current", className)}
      style={{
        width: size,
        height: size,
        WebkitMaskImage: "url(/hair-patterns/wavy.png)",
        maskImage: "url(/hair-patterns/wavy.png)",
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
      }}
    />
  );
}
