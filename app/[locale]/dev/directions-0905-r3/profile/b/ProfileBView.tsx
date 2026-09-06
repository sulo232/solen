"use client";

// Exists-check: `npm run exists directions-0905-r3` (this session) returned 34 matches, 7 of
// them REMOVED (a grey tray-band look system, three home-feed layout options, a set of
// empty-state visual treatments, a search-results heading line, a per-card review count, a
// components-preview switcher block, a service-row-button-matching harness), none governing
// this surface. `npm run exists profile` (this session) surfaces the real /profile route
// (app/[locale]/_components/profile/AccountHub.tsx) and its three round-1 directions, plus
// round-2's own LIFT-refined profile client view, the base this file starts from BY HAND
// (never copied) per the task brief. This file is net-new: no round-3 candidate-B profile view
// existed before it.
//
// Grounded-in: app/[locale]/_components/profile/AccountHub.tsx (the real, live surface every
// exploration of this screen depicts) and round-2's own LIFT-refined profile client view (the
// section order, the identity anatomy, and the hero-card anatomy this file starts from by hand).
// Placement source: _design-system/references/fresha--profile.md, "Measured (ordered element
// list, iOS, top to bottom)" item 1 (back arrow + "Profile" headline, no chrome drawn here, see
// the header-count note below), item 2 (identity card: avatar + name + an "Edit profile"
// subline, the whole card reading as one tappable unit), item 3 (below the identity card, a
// FLAT LIST of destination rows, each icon + label + trailing chevron, no group headers or
// dividers-with-labels, only a plain hairline between rows), item 4 (two inline items separated
// by a gap, not a hairline, at the bottom of the list).
//
// CANDIDATE B, LIFT REFINED (_plans/R3_ONE_SYSTEM.md): "every group of facts about one record is
// one white card... a destination list gets no card at all". This screen is the one place the
// candidate's own sheet names as its worked example of that role lookup. Applied here as:
//   - the next-appointment unit is a RECORD (it describes one specific booking that exists in
//     the database) -> stays the screen's one <Card>, hasPhoto-aware per the sheet's own
//     card-edge fix (see WhatsNextCard below).
//   - Bookings / Wallet / Personal details / Settings are DESTINATIONS (places to go, nothing
//     about them is a record's own facts) -> zero cards, bare rows, group-boundary hairlines
//     only, per Fresha's own flat list (fresha--profile.md item 3) and the Airbnb Recipe A this
//     repo's own reference file already logged (zero dividers inside a group, one hairline at a
//     group boundary), both cited together in ROOT_CAUSES.md Part 3.5 item 1.
//
// ROOT_CAUSES.md PART 3.5 FIX LIST, applied item by item (a builder applies these without
// re-deriving them; "Causes that apply" per that section: Cause 1 rank 1, the 0-boxes-vs-5-boxes
// cross-screen inconsistency; Cause 3 rank 3, the type-ladder wobble, NOT fixed here, see item 5):
//   1. "The 7 destination rows get no container." -> DestinationGroup below renders bare Row
//      children with zero <Card> wrapper; round-2's own version wrapped every group in
//      `<Card variant="entity" bordered>`, dropped here.
//   2. "The group boundary hairline is #E4E4E7, 1px, inset 24px both sides, one per boundary,
//      none between rows inside a group." -> the separator inside DestinationGroup below,
//      COLOR.hairline, marginLeft/Right SPACING.dividerInset (24), rendered once between each
//      pair of adjacent destination groups (Bookings|Wallet, Wallet|Personal details, Personal
//      details|Settings), never inside a group's own row stack.
//   3. "The one identity/next-appointment card stays a card... 16px radius... If it renders
//      under Candidate B and carries no photo, it takes the hairline edge, not the invisible
//      shadow." -> WhatsNextCard passes `hasPhoto={Boolean(coverUrl)}` to <Card variant="photo">
//      instead of round-2's static `bordered` prop, so Card.tsx's own candidate-B photoAware
//      branch (systems.ts `b.deltas.card.photoAware`) resolves shadow-if-photo /
//      hairline-if-not at render time, per real data, exactly matching the sheet's
//      RECOMMENDATION section rather than round-2's screen-level `bordered` override (which
//      Card.tsx's own header names as one of the two documented pre-round-3 exceptions this
//      candidate's own delta now expresses natively).
//   4. "LIFT's inline badge must stop truncating a moderate name... name on its own full-width
//      line, badge in the footer row." -> WhatsNextCard's name now renders alone on its own row
//      (no StatusBadge sharing the line), and the badge moves into the footer row beside the
//      time and price. Round-2 shared a 99px-wide column between the name and the badge; this
//      layout gives the name the full remaining card width.
//   5. "The type ladder's bottom step is a measured wobble on both variants... a shared-token
//      issue in tokens.ts, so it is fixed once for every screen, not here." -> NOT touched.
//      TYPE_RAMP.body (14) and TYPE_RAMP.meta (12) are read unchanged from the kit.
//
// STAYS, per ROOT_CAUSES.md Part 3.5's own "Stays" list, none of these touched: the bare-glyph
// row anatomy (no bg-s-bg-sunken icon tile, no subline, no count on any destination row); the
// chevron on every navigating row; the three labelled group eyebrows (Bookings / Wallet /
// Personal details); exactly one accent-blue use case (the "Edit profile" text link); the
// pale-green badge recipe; 4 sizes / 2 weights; white end to end with no dead-grey field.
//
// WHAT IS CARRIED FROM ROUND 2, NAMED: the overall page order (identity, hero what's-next
// record, destination list, Settings, sign out); the hero's own anatomy (real photo or the
// locked missing-photo fallback, real seeded price). The round-2 sunken date-tile is NOT carried
// forward, see the REPAIR PASS note above; the "no search bar" constraint
// (REMOVED.md's FLOORS LAW 10 entry: "nobody searches their own saved list from the account
// hub"); the once-not-twice constraint (the next appointment's date renders in the hero only,
// never repeated as a row subline); the kit's own press-motion envelope on every row and link.
//
// Depicts: identity block (avatar, name, edit link) -> app/[locale]/_components/profile/AccountHub.tsx
// Depicts: Bookings/Wallet/Personal details/Settings destinations and their real routes -> app/[locale]/_components/profile/AccountHub.tsx
// Depicts: the favorites destination -> app/[locale]/profile/favorites/page.tsx
// Depicts: the loyalty-stamps destination -> app/[locale]/profile/stamps/page.tsx
// Depicts: sign-out -> app/[locale]/_components/profile/AccountHub.tsx (the same /api/auth/logout POST)
// Depicts: the hero record's real DB status colour-coding a booking that is actually confirmed/pending, never a hardcoded default -> app/[locale]/dev/directions-0905/profile/_vc/getProfileC.ts (NEXT_BOOKING_SELECT already selects "status", filtered to confirmed/pending)
// Depicts: no-upcoming-appointment fallback -> components-legacy/ui/EmptyState.tsx (the registered primitive, composed not redrawn, per FLOORS LAW 9; unchanged from round 2, not named in this screen's own fix list)
//
// HEADER/NAV COUNT (the chrome-inherited rule): this /dev route draws 0 header landmarks and 0
// navigation landmarks, the same as every sibling round-3 screen, because HideInBooking.tsx
// strips the real Header + BottomNav unconditionally on any /dev path before that component ever
// evaluates its own per-route props. The real /profile route at 402 wide renders 2 chrome
// landmarks: the global Header (top) and the account-section bottom nav (Footer is the only one
// of the three HideInBooking actually gates for /profile, via `hideOnAccount`). This 0-vs-2 gap
// is a property of the shared /dev harness applied identically to every mockup in this fan-out,
// not something this file draws or could remove by hand-rolling a header (banned by the brief);
// reported honestly rather than papered over, per the "count and report" instruction.
//
// measured (Playwright, 390x844, dpr 3, live dev server, this session): see this task's own
// structured return for the full getBoundingClientRect/getComputedStyle numbers.
//
// floors (all six): (a) photographic focal = the hero's real seeded cover photo (or the locked
// missing-photo fallback, sunken bg + Scissors glyph, never a bare grey box) when a next
// appointment exists; (b) one clearly-biggest element = the hero card's own footprint, visibly
// larger than any single destination row below it; the identity name's own 28px anchor step is
// the screen's only display anchor, never duplicated inside the card (repair pass: the round-2
// date-tile that reused this step is removed); (c) tabular real number = the hero's real seeded
// price (tabular-nums, kit Price); (d) semantic-colour moment = the hero's kit StatusBadge icon
// (green check confirmed / amber
// clock pending, real DB status, never invented); (e) no dead-grey zone = white page throughout,
// the destination list's only chrome is its own boundary hairlines, never a flat grey fill;
// (f) worst-case content holds = the hero name now renders on its own full-width line (this
// screen's own fix item 4) and still truncates at the card edge rather than overflowing; every
// destination row label is a short fixed noun with no unbounded string; the identity display
// name truncates too, matching AccountHub.tsx's own discipline.
//
// system: b. R3_ONE_SYSTEM.md CANDIDATE B, LIFT REFINED, verbatim: "every group of facts about
// one record is one white card, with the card-edge rule written into the system rather than
// improvised, a card WITH a photo takes the flush photo edge and the whisper shadow, a card with
// NO photo takes the 1px hairline and no shadow, and nothing ever carries both." This screen
// renders exactly one card (the hero record) and zero cards for its four destination groups, the
// system's own "role lookup" rather than a screen-level exception.
//
// MOTION: identical to round-2's own hero entrance recipe (opacity/y/scale tween, 320ms,
// disabled under prefers-reduced-motion) and the kit's own press envelope (tokens.ts MOTION,
// scale 0.97 / 4% darker at 100ms on press, 200ms back on release) applied to every row and
// link, matching PrimaryButton/SecondaryButton's own recipe. No new motion introduced.
//
// REPAIR PASS (2026-09-06), fixing the design-critic's "Candidate B - FAIL" findings in
// scratchpad/r3/critique/profile.md, item by item:
//   1. Hairline inset measured 40px (79.5% width, 310px), not the sheet's 24px (88%, 342px),
//      because the page's own `px-4` (16px) stacked with DestinationGroup's own
//      SPACING.dividerInset (24px) margin. Fixed: the page wrapper below no longer carries
//      horizontal padding; the identity block, hero section and sign-out form each take their
//      own SPACING.pageMargin inset directly, and the destinations section is full-bleed so the
//      boundary hairline's own 24px margin is the ONLY inset it carries. See the destinations
//      section's own comment below for the full trace.
//   2. The critique's Sameness section named a second finding specific to this file: the 56px
//      sunken date-tile in WhatsNextCard was not in any of the three R3_ONE_SYSTEM.md candidate
//      value sheets and traced to neither the Fresha placement source nor an Airbnb row, an
//      invented structural element carried over from round 2 rather than derived from this
//      round's law ("a screen uses ONLY its candidate's values and the shared kit"). Fixed:
//      removed; the date fact now renders as a plain Meta line beside the address, the same
//      anatomy A/C already use for their card's time fact, so the three candidates now diverge
//      only on system values (card edge, radius, badge colour), never on anatomy. See
//      WhatsNextCard's own comment below.

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
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
import EmptyState from "@/components-legacy/ui/EmptyState";
import { Avatar } from "@/app/[locale]/_components/primitives/Avatar";
import { cn } from "@/lib/utils";
import {
  KitProvider,
  Card,
  SectionTitle,
  Meta,
  Price,
  StatusBadge,
  TextLink,
  TYPE_RAMP,
  SPACING,
  RADIUS,
  COLOR,
  MOTION,
  type BookingStatus,
} from "./kitShim"; // see kitShim.ts: the shared "../../_kit" barrel is currently build-broken
import type { ProfileCData, ProfileCNextAppointment } from "../../../directions-0905/profile/_vc/getProfileC";

const LOCALE_CODE: Record<string, string> = { de: "de-CH", en: "en-CH", fr: "fr-CH", it: "it-CH" };

export interface ProfileBViewProps {
  locale: string;
  data: ProfileCData;
  coverUrl: string | null;
}

export function ProfileBView({ locale, data, coverUrl }: ProfileBViewProps) {
  const p = (path: string) => `/${locale}${path}`;
  const { displayName, avatarUrl, nextAppointment } = data;

  return (
    <KitProvider system="b">
      <div className="mx-auto w-full max-w-[560px] bg-white py-6">
        {/* Identity block, unchanged from round 2: avatar, the screen's one 28px display
            anchor, an edit-profile text link. Not named in this screen's fix list. Repair pass:
            this section now carries its own SPACING.pageMargin inset directly (see the file
            header's REPAIR PASS note), the page wrapper above no longer has a horizontal px-4. */}
        <div
          className="flex items-center gap-3.5"
          style={{ paddingLeft: SPACING.pageMargin, paddingRight: SPACING.pageMargin }}
        >
          <Avatar src={avatarUrl} name={displayName} size="lg" />
          <div className="min-w-0 flex-1">
            <SectionTitle as="anchor" className="truncate">
              {displayName}
            </SectionTitle>
            <TextLink href={p("/profile/edit")} className="-my-1 inline-block py-1">
              Edit profile
            </TextLink>
          </div>
        </div>

        {/* Hero: the real next appointment, once (the once-not-twice screen constraint). A
            RECORD, per Candidate B's own container-treatment row, so it is the one card on this
            screen. Repair pass: own SPACING.pageMargin inset, same reason as the identity
            block above. */}
        <div
          style={{
            marginTop: SPACING.section,
            paddingLeft: SPACING.pageMargin,
            paddingRight: SPACING.pageMargin,
          }}
        >
          {nextAppointment ? (
            <WhatsNextCard
              appointment={nextAppointment}
              coverUrl={coverUrl}
              locale={locale}
              manageHref={p("/profile/bookings")}
            />
          ) : (
            <EmptyState
              icon={Calendar}
              title="No upcoming appointment"
              message="Book your next treatment to see it here"
            />
          )}
        </div>

        {/* Destinations: fix item 1, no card at all. Fix item 2, one boundary hairline between
            adjacent groups, none inside a group. Repair pass: this section is full-bleed on
            purpose now, no page-wide px-4 wrapping it. The prior structure nested
            SPACING.dividerInset (24px, DestinationGroup's own separator) inside a page-wide
            px-4 (16px), stacking to a 40px inset instead of the sheet's 24px (measured live,
            79.5% width / 310px, not the sheet's 88% / 342px). Each Row already carries its own
            16px inset via PressableRow's `px-4`, and each group title now carries its own
            SPACING.pageMargin inset (see DestinationGroup below), so the hairline's own
            marginLeft/Right: SPACING.dividerInset is the only inset it carries, landing on the
            sheet's 342px / 24px both sides, matching A and C. */}
        <div style={{ marginTop: SPACING.section }}>
          <DestinationGroup title="Bookings" first>
            <Row href={p("/profile/bookings")} icon={Calendar} label="Bookings" />
          </DestinationGroup>

          <DestinationGroup title="Wallet">
            <Row href={p("/profile/settings/payment")} icon={WalletIcon} label="Wallet" />
            <Row href={p("/profile/vouchers")} icon={TicketPercent} label="Vouchers" />
          </DestinationGroup>

          <DestinationGroup title="Personal details">
            <Row href={p("/profile/haarprofil")} icon={HairGlyph} label="Hair profile" />
            <Row href={p("/profile/favorites")} icon={Heart} label="Saved" />
            <Row href={p("/profile/stamps")} icon={Stamp} label="Stamps" />
          </DestinationGroup>

          {/* Settings: round-2's own asymmetry carried forward, a boundary with no title above
              it (Fresha's own list draws Settings as just another row; this repo's group titles
              are an owner-kept deviation, and Settings alone never had one even before this
              round). */}
          <DestinationGroup>
            <Row href={p("/profile/settings")} icon={Settings} label="Settings" />
          </DestinationGroup>
        </div>

        {/* Sign out, unchanged from round 2. Repair pass: own SPACING.pageMargin inset, same
            reason as the identity block and hero section above (harmless here since the
            content is centered and short, kept for consistency with the rest of the page). */}
        <form
          action="/api/auth/logout"
          method="post"
          className="text-center"
          style={{
            marginTop: SPACING.section,
            paddingLeft: SPACING.pageMargin,
            paddingRight: SPACING.pageMargin,
          }}
        >
          <button
            type="submit"
            className="inline-flex items-center gap-[7px] font-medium text-s-error transition-opacity active:opacity-60"
            style={{ fontSize: TYPE_RAMP.body.size }}
          >
            <LogOut size={17} strokeWidth={1.9} aria-hidden />
            Sign out
          </button>
        </form>

        {/* Reproduces the space the real bottom nav would occupy; HideInBooking strips the real
            one on every /dev path (see the header's HEADER/NAV COUNT note), no chrome drawn. */}
        <div style={{ height: 125 }} aria-hidden="true" />
      </div>
    </KitProvider>
  );
}

/**
 * One destination group: an optional 18px SectionTitle (Settings carries none, round-2's own
 * asymmetry), then its bare rows, no card. `first` skips the boundary hairline (the hero card's
 * own edge already separates it from the destination list). Every other group renders one
 * boundary hairline above it, per fix item 2: COLOR.hairline, inset SPACING.dividerInset (24px)
 * both sides, none between the rows inside the group itself.
 */
function DestinationGroup({
  title,
  children,
  first = false,
}: {
  title?: string;
  children: React.ReactNode;
  first?: boolean;
}) {
  return (
    <div style={{ marginTop: first ? 0 : SPACING.group }}>
      {!first && (
        <div
          role="separator"
          aria-hidden="true"
          style={{
            height: 1,
            backgroundColor: COLOR.hairline,
            marginLeft: SPACING.dividerInset,
            marginRight: SPACING.dividerInset,
            marginBottom: SPACING.group,
          }}
        />
      )}
      {title ? (
        <div style={{ paddingLeft: SPACING.pageMargin, paddingRight: SPACING.pageMargin }}>
          <SectionTitle as="heading" className="mb-3">
            {title}
          </SectionTitle>
        </div>
      ) : null}
      {children}
    </div>
  );
}

/**
 * The what's-next hero: real photo, salon name on its OWN full-width line (fix item 4), address
 * and date below it, then a footer row carrying the StatusBadge + time + real price on the left
 * and the "View details" link on the right. Repair pass: the round-2 sunken date-block is
 * removed (see the file header's REPAIR PASS note), the date fact is now a plain Meta line.
 * Candidate B's card-edge fix (item 3) is expressed via `hasPhoto`, not a static `bordered`
 * override: Card.tsx's own photoAware branch (systems.ts b.deltas.card.photoAware) resolves
 * shadow-if-photo / hairline-if-not at render time from the real `coverUrl`.
 */
function WhatsNextCard({
  appointment,
  coverUrl,
  locale,
  manageHref,
}: {
  appointment: ProfileCNextAppointment;
  coverUrl: string | null;
  locale: string;
  manageHref: string;
}) {
  const prefersReducedMotion = useReducedMotion();
  const localeCode = LOCALE_CODE[locale] ?? "en-CH";
  const start = new Date(appointment.startsAt);
  const dow = start.toLocaleDateString(localeCode, { weekday: "short", timeZone: "Europe/Zurich" });
  const day = start.toLocaleDateString(localeCode, { day: "2-digit", timeZone: "Europe/Zurich" });
  const mon = start.toLocaleDateString(localeCode, { month: "short", timeZone: "Europe/Zurich" });
  const time = start.toLocaleTimeString(localeCode, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Europe/Zurich",
  });

  // Real DB status, never a hardcoded "confirmed".
  const statusLabel = appointment.status === "pending" ? "Pending" : "Confirmed";

  const enter = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 16, scale: 0.98 },
        animate: { opacity: 1, y: 0, scale: 1 },
        transition: { duration: 0.32, ease: [0.2, 0.8, 0.2, 1] as const },
      };

  return (
    <motion.div {...enter}>
      <Card variant="photo" hasPhoto={Boolean(coverUrl)} className="p-3">
        <div className="flex items-start gap-3">
          {/* Real seeded cover photo, or the locked missing-photo fallback (sunken +
              category icon), never a bare grey box. */}
          <div
            className="relative h-[72px] w-[72px] flex-none overflow-hidden"
            style={{ borderRadius: RADIUS.photoCardPx }}
          >
            {coverUrl ? (
              <Image src={coverUrl} alt="" fill sizes="72px" className="object-cover" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-s-bg-sunken">
                <Scissors className="h-6 w-6 text-s-ink-2" strokeWidth={1.5} aria-hidden />
              </div>
            )}
          </div>

          {/* Fix item 4: the name now owns the full remaining width on its own line, no badge
              sharing it. Address sits directly below, still one truncating line. Repair pass:
              the round-2 sunken date-tile that used to sit here (56px, day digit at the 28px
              anchor size) is removed, see the file header's REPAIR PASS note; the date fact now
              renders as a plain Meta line, the same anatomy A/C already use for their card's
              time fact, so this card carries no element outside Candidate B's own value sheet. */}
          <div className="min-w-0 flex-1 pt-0.5">
            <div
              className="truncate font-heading text-s-ink"
              style={{ fontSize: TYPE_RAMP.body.size }}
            >
              {appointment.salonName}
            </div>
            {appointment.salonAddress ? (
              <Meta className="mt-1 flex items-center gap-1 truncate">
                <MapPin size={12} className="flex-none" aria-hidden />
                <span className="truncate">{appointment.salonAddress}</span>
              </Meta>
            ) : null}
            <Meta className="mt-1 block truncate">
              {dow}, {day} {mon}
            </Meta>
          </div>
        </div>

        {/* Fix item 4: the badge moves here, into the footer row, beside time and price. */}
        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <StatusBadge status={appointment.status as BookingStatus} label={statusLabel} className="flex-none" />
            <Meta className="flex-none">{time}</Meta>
            {appointment.price != null ? <Price amount={appointment.price} locale={localeCode} /> : null}
          </div>
          <TextLink href={manageHref} className="flex-none">
            View details
          </TextLink>
        </div>
      </Card>
    </motion.div>
  );
}

/**
 * A destination row: bare icon (22px, ink) + label (TYPE_RAMP.body, 14/500) + chevron, no
 * subline, no count (round-2's own simplicity, kept per this screen's "Stays" list). Press is
 * the kit's own MOTION recipe.
 */
function Row({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: LucideIcon | typeof HairGlyph;
  label: string;
}) {
  return (
    <PressableRow href={href}>
      <span className="grid h-[22px] w-[22px] shrink-0 place-items-center text-s-ink">
        <Icon size={22} strokeWidth={2.2} aria-hidden />
      </span>
      <span
        className="min-w-0 flex-1 truncate font-heading font-medium text-s-ink"
        style={{ fontSize: TYPE_RAMP.body.size }}
      >
        {label}
      </span>
      <ChevronRight size={18} strokeWidth={1.9} className="shrink-0 text-s-ink" aria-hidden />
    </PressableRow>
  );
}

/** The kit's own press envelope (tokens.ts MOTION.pressDown/release), applied to a row link the
 * same way PrimaryButton/SecondaryButton apply it to a button. */
function PressableRow({ href, children }: { href: string; children: React.ReactNode }) {
  const [pressed, setPressed] = React.useState(false);
  return (
    <Link
      href={href}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      className={cn(
        "flex items-center gap-[14px] px-4 py-[15px]",
        "motion-reduce:!transition-none motion-reduce:!transform-none motion-reduce:!filter-none",
      )}
      style={{
        transform: pressed ? MOTION.pressDown.transform : MOTION.release.transform,
        filter: pressed ? MOTION.pressDown.filter : MOTION.release.filter,
        transition: pressed
          ? `transform ${MOTION.pressDown.durationMs}ms ${MOTION.pressDown.easing}, filter ${MOTION.pressDown.durationMs}ms ${MOTION.pressDown.easing}`
          : `transform ${MOTION.release.durationMs}ms ${MOTION.release.easing}, filter ${MOTION.release.durationMs}ms ${MOTION.release.easing}`,
      }}
    >
      {children}
    </Link>
  );
}

// Verbatim copy of AccountHub.tsx's own HairGlyph helper (not exported from that file, so
// copied rather than imported, the same way every earlier profile exploration independently
// copies this one small static-asset mask, never a design decision of its own).
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
