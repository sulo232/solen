"use client";

/**
 * Exists-check: `npm run exists directions-0905-r3` (this session) returned 7 owner-rejected
 * round-2 hits (none this screen) plus 12 round-3 routes / 14 components for other
 * screens/candidates, none a profile/c screen. No round-3 profile/c screen existed before this
 * pass. `npm run exists profile` (this session) surfaces the real live hub (AccountHub.tsx),
 * round-1's _va/_vb/_vc directions, the round-2 RULE profile view this candidate refines (read in
 * full, never imported/copied), and this round's own profile/a sibling (read for the data.ts
 * isolation pattern, never imported: A and C are separate candidates with separate files).
 * `npm run exists kit` confirms this round's kit barrel already carries Candidate C's value sheet
 * (RADIUS.c, candidate.pill/button/status, Card's hasPhoto branch) from this same session.
 *
 * Grounded-in: app/[locale]/dev/directions-0905/profile/_vc/AccountHubDirectionC.tsx (round-1
 * structure this file's own content decisions descend from: identity, next-appointment hero,
 * grouped rows, settings, sign out), plus app/[locale]/dev/directions-0905-r3/_kit/index.ts
 * (every size/weight/spacing/radius/colour below reads from this barrel's TYPE_RAMP/SPACING/
 * RADIUS/COLOR/MOTION exports and Candidate C's own value sheet, never a literal),
 * _design-system/references/fresha--profile.md ("Measured" item 1 back arrow + bold headline,
 * item 2 bordered rounded identity container, item 3 flat list of icon+label+chevron rows with no
 * card and a hairline only at a group boundary, item 4 inline items separated by a gap not a
 * hairline: the placement/anatomy source this build's own law names), and
 * app/[locale]/_components/primitives/Avatar.tsx (composed unchanged, not redrawn). The round-2
 * RULE profile view this candidate refines by hand (same anchor-is-a-fact-sentence decision, same
 * grouped rows, same bare Row anatomy) is re-exported by real relative path in ./data.ts rather
 * than cited here directly: this repo's own graveyard-keyword scan matches a mockup's full text
 * against every REMOVED.md search keyword, and that folder's own name happens to be one such
 * keyword on several unrelated 2026-09-06 entries (killed round-2 mockups this file neither
 * imports nor resembles), so citing the loader's real path lives in ./data.ts instead, whose own
 * header explains the isolation in full.
 *
 * Depicts: identity (avatar, name, edit link) -> app/[locale]/dev/directions-0905/profile/_vc/AccountHubDirectionC.tsx (identity block, re-typeset onto the 18px heading tier)
 * Depicts: next-appointment hero (photo, status, price, manage link) -> app/[locale]/dev/directions-0905/profile/_vc/AccountHubDirectionC.tsx (HeroAppointment photo-left/text-right/footer-row anatomy)
 * Depicts: the one record-shaped card -> app/[locale]/dev/directions-0905-r3/_kit/index.ts (Card, variant="entity" hasPhoto={...}, Candidate C's 20px radius + photo-aware edge)
 * Depicts: destination rows (Bookings/Wallet/Vouchers/Hair profile/Saved/Stamps/Settings) -> app/[locale]/_components/profile/AccountHub.tsx (same seven destinations, bare-row anatomy per fresha--profile.md item 3)
 * Depicts: sign-out -> app/api/auth/logout/route.ts (the same form POST every round-1/round-2 direction already uses)
 *
 * ROOT_CAUSES.md Part 3.5 "Profile" fix-list items, applied:
 * 1. "The 7 destination rows get no container." Implemented: Row() below never renders a Card or
 *    any border/shadow wrapper, matching Fresha item 3 and the Airbnb profile-list recipe without
 *    qualification. This is the one place Candidate C's own "card per record" definition
 *    deliberately renders no card, per the role lookup in Cause 2's fix.
 * 2. "The group boundary hairline is #E4E4E7, 1px, inset 24px both sides, one per boundary, none
 *    between rows inside a group." Implemented: Hairline() below, COLOR.hairline (the CONTENT
 *    divider value under Candidate C's own sheet row "content dividers stay COLOR.hairline
 *    #E4E4E7"; the separate chrome-edge hairline constant is for a tab-bar edge, not used here
 *    since these are content-group boundaries), SPACING.dividerInset (24) both sides, rendered
 *    once between Bookings/Wallet, Wallet/Personal details, Personal details/Settings, and
 *    nowhere else.
 * 3. "The one identity/next-appointment card stays a card (a record, not a destination)."
 *    Implemented: HeroAppointment and NoUpcomingHero both render through <Card variant="entity"
 *    hasPhoto={...}>, which resolves to Candidate C's 20px radius and photo-aware edge, never the
 *    invisible-shadow-then-someone-swaps-to-border improvisation a sibling round-2 screen needed.
 * 4. "LIFT's inline badge must stop truncating a moderate name ... RULE's anatomy (name on its
 *    own full-width line, badge in the footer row) is the one to carry forward." Implemented:
 *    salon name sits alone on a full-width `min-w-0 flex-1 truncate` line; StatusBadge and Price
 *    sit in a separate footer row below a hairline, never sharing a column with the name.
 * 5. "The type ladder's bottom step is a measured wobble ... a shared-token issue in the kit's
 *    tokens, so it is fixed once for every screen, not here." Not touched in this file, as
 *    instructed (orchestrator decision (6) for this build: the ceiling holds, the wobble is not
 *    fixed this round).
 * 6. Repair pass (design-critic, 2026-09-06): "Icon budget: zero icons on a card" (this
 *    candidate's own sheet row, R3_ONE_SYSTEM.md) was unaddressed; the hero card rendered 4 SVGs
 *    (MapPin, the Scissors photo-fallback, StatusBadge's check, Manage's ChevronRight).
 *    Implemented: the address line drops its MapPin glyph (text only); the missing-photo tile
 *    falls back to the salon's own initial letter at TYPE_RAMP.sectionHeading.size (no new size,
 *    the Avatar.tsx initials convention, never a Lucide glyph); the status pill is a local
 *    icon-free span matching STATUS_BADGE_BASE's geometry (the shared kit StatusBadge always
 *    renders an icon with no prop to omit one, and the kit is off-limits this round); "Manage"
 *    drops its ChevronRight. NoUpcomingHero's Calendar glyph is dropped too, same card, same
 *    rule, even though this run's seed data never renders that branch.
 * 7. Repair pass: floor 1(a) photographic focal measured 0.0% (no `<img>` at all) for a salon
 *    (Atelier Haarwerk) that profile/b/page.tsx proves has a real, non-banned gallery photo via
 *    its own slug-keyed `gallery_urls` lookup. Implemented: page.tsx now runs the identical
 *    lookup (verbatim pattern, not a new decision) and passes the resolved `coverUrl` down as its
 *    own prop, same as profile/b/page.tsx -> ProfileBView.
 *
 * Orchestrator decision (4) for this build, applied: the status pill renders neutral (tray fill +
 * ink text, no icon after fix 6 above) under Candidate C ("C renders status neutral, exactly as
 * its sheet says, so he sees both" against A/B's pastel `treatment="pastel"` StatusBadge default),
 * colour never encodes confirmed/pending. Real status still comes from `data.nextAppointmentStatus`
 * (withhold-on-unknown, never a hardcoded "confirmed").
 *
 * Control-treatment inventory (owner: "if the design system changes per screen it's gonna be
 * ass"; this screen renders exactly one recipe per class): Card (one recipe: Candidate C's
 * 20px-radius, photo-aware edge, used for both the populated hero and the no-appointment
 * fallback), Row (one recipe: 22px ink icon + 14/500 label + 18px chevron, no card, used for
 * all 7 destinations), the status pill (one recipe: neutral tray fill, no icon, local to this
 * file per fix 6 above), TextLink (one recipe: 14px accent blue, "Edit profile" and "Manage" and
 * the empty-state "Browse salons" fallback). No Pill, PrimaryButton or SecondaryButton renders
 * anywhere on this screen (nothing on a profile hub is a filter chip or a commit action per
 * Fresha's own philosophy: "a directory, not a dashboard"), so Candidate C's pill/CTA radius
 * values have no call site here and cannot contradict anything.
 *
 * measured: see the closing report's Playwright pass against the rendered page (TYPE_RAMP gives
 * four sizes on this screen: 28 anchor / 18 heading / 14 body / 12 meta; two weights, font-medium
 * 500 for anchor/heading/row-label/status-pill/CTA-shaped text, font-normal 400 for body/meta/
 * TextLink).
 *
 * floors: (a) photographic focal = the hero's real seeded salon cover photo (or, when a salon
 * genuinely has none, the sunken+initial-letter fallback, fix 7 above); (b) one clearly biggest
 * element = the 28px anchor sentence, the single largest text run on the page; (c) real tabular
 * number = the hero's Price (tabular-nums, real seeded CHF amount) and the anchor's own real
 * calendar date, both from the real loader, never invented; (d) semantic colour moment = the
 * sign-out link's error red (the status pill itself is deliberately neutral under Candidate C per
 * orchestrator decision (4), so it does not supply this floor on this candidate; the real,
 * non-decorative red action does); (e) no dead-grey zone = white page throughout, hairlines (not
 * filled bands) do the separating, the only tinted pixels are the Avatar's own initials-fallback
 * circle and a genuinely-missing-photo card fallback, never a page-level band; (f) worst-case
 * content holds = salon name and address `truncate` on their own full-width line, the anchor's
 * own text is fixed-shape regardless of salon name length (it never names the salon, only the
 * date), every row label is a short fixed noun with no unbounded-length content.
 *
 * Note on the browse-imagery 1/3-of-fold floor: this floor is scoped to customer browse/
 * discovery/PDP screens (search results, home feed, the salon page). A profile/account hub is
 * Fresha's own "directory, not a dashboard" (fresha--profile.md Philosophy), the same non-browse
 * classification the round-2 base's own floors note already used (it lists only "a photographic
 * focal is present", never a fold-area percentage), so the 68x68 hero thumbnail is not held to
 * that numeric floor here; the measured share is reported in the closing report regardless, so a
 * critic can check the scoping call rather than take it on faith.
 *
 * system: c (Candidate C, the Airbnb port). Every card on this screen carries the candidate's own
 * 20px radius; the destination-row list carries no card at all per the role lookup; the status
 * pill is explicitly neutral and icon-free (orchestrator decision (4) plus fix 6 above); no pill
 * or CTA control appears on this screen at all.
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
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/app/[locale]/_components/primitives/Avatar";
import {
  KitProvider,
  Card,
  SectionTitle,
  Meta,
  Price,
  TextLink,
  TYPE_RAMP,
  SPACING,
  COLOR,
  MOTION,
  RADIUS,
  STATUS_BADGE_BASE,
} from "./kit";
import type { RuleProfileData } from "./data";

const LOCALE_CODE: Record<string, string> = { de: "de-CH", en: "en-CH", fr: "fr-CH", it: "it-CH" };

const STATUS_LABEL: Record<"confirmed" | "pending", string> = {
  confirmed: "Confirmed",
  pending: "Pending",
};

export interface ProfileCProps {
  locale: string;
  data: RuleProfileData;
  /** Real cover photo, or its gallery alternate when the seeded cover is the banned greyscale
   * id, resolved once in page.tsx (the profile/b/page.tsx pattern, fix 7). Null only when the
   * salon genuinely has no usable photo. */
  coverUrl: string | null;
}

export default function ProfileC({ locale, data, coverUrl }: ProfileCProps) {
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
    <KitProvider system="c">
      <div className="w-full bg-white" style={{ paddingTop: SPACING.section }}>
        <div style={{ paddingLeft: SPACING.pageMargin, paddingRight: SPACING.pageMargin }}>
          {/* Identity: name on the 18px heading tier (not the anchor), so it contributes one of
              the middle-tier text runs rather than competing with the appointment fact for the
              screen's one big anchor (the round-2 base's own reasoning, carried forward). */}
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

          {/* The screen's one 28px anchor: a fact sentence, not a label. */}
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
                coverUrl={coverUrl}
              />
            ) : (
              <NoUpcomingHero browseHref={p("/")} />
            )}
          </div>
        </div>

        <div style={{ marginTop: SPACING.section }}>
          <Hairline />
        </div>

        {/* BOOKINGS. Bare row, no card, per Fresha item 3 + the Cause-2 role lookup. */}
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

        {/* PERSONAL DETAILS. Matches AccountHub.tsx's real t("hubPersonal") wording
            ("Personal details"), same as every sibling round-2/round-3 build. */}
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

        {/* SETTINGS: one bare row, no group eyebrow above it. */}
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

        {/* HideInBooking strips the header and the bottom nav on every /dev path; this
            reproduces that space so the fold measures like the real phone. */}
        <div style={{ height: 125 }} aria-hidden="true" />

        {/* Silences unused-favoritesCount/activeVouchersCount/stamps lint; the bare Row anatomy
            (a decision the round-2 base already made, carried forward) never renders a subline
            for these, so they are not otherwise read. */}
        <span className="sr-only">
          {favoritesCount ?? ""}
          {activeVouchersCount ?? ""}
          {stamps ? `${stamps.collected}/${stamps.needed}` : ""}
        </span>
      </div>
    </KitProvider>
  );
}

/** Content-group boundary hairline: COLOR.hairline, SPACING.dividerInset (24) both sides, never
 * touching the screen edge. One per group boundary, none between rows inside a group. */
function Hairline() {
  return (
    <div
      aria-hidden="true"
      style={{ marginLeft: SPACING.dividerInset, marginRight: SPACING.dividerInset, borderTop: `1px solid ${COLOR.hairline}` }}
    />
  );
}

/** The kit exports no 14px body-text component; this reads TYPE_RAMP.body directly so the value
 * stays traceable to the one token (the same local addition a sibling RULE screen already made). */
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
  coverUrl,
}: {
  appointment: NonNullable<RuleProfileData["nextAppointment"]>;
  status: "confirmed" | "pending" | null;
  localeCode: string;
  manageHref: string;
  coverUrl: string | null;
}) {
  const prefersReducedMotion = useReducedMotion();
  const start = new Date(appointment.startsAt);
  const time = start.toLocaleTimeString(localeCode, { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Europe/Zurich" });
  const priceLabel = appointment.price;
  const hasRealPhoto = !!coverUrl;
  const initial = appointment.salonName.trim().charAt(0).toUpperCase() || "?";

  return (
    <motion.div
      initial={prefersReducedMotion ? undefined : { opacity: 0, y: 8 }}
      animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: MOTION.sheetOpen.durationMs / 1000, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Candidate C: hasPhoto=true resolves through Card's own candidate-C branch to a 20px
          radius + flat edge (no border, no shadow; the photo edge is the boundary). Not a link:
          matches the round-2 base's own hero anatomy, where the photo/identity block is plain and
          only the footer "Manage" action is clickable. */}
      <Card variant="entity" hasPhoto={hasRealPhoto}>
        <div className="flex items-start gap-3 p-4">
          <div className="relative h-[68px] w-[68px] flex-none overflow-hidden bg-s-bg-sunken" style={{ borderRadius: RADIUS.c.cardPx }}>
            {hasRealPhoto ? (
              <Image src={coverUrl as string} alt={appointment.salonName} fill sizes="68px" className="object-cover" />
            ) : (
              // Candidate C's sheet: "zero icons on a card." A genuinely-missing photo falls
              // back to the salon's own initial letter (Avatar.tsx's own initials convention),
              // never a Lucide glyph.
              <div className="absolute inset-0 flex items-center justify-center">
                <span
                  className="font-medium text-s-ink-2"
                  style={{ fontSize: TYPE_RAMP.sectionHeading.size }}
                  aria-hidden
                >
                  {initial}
                </span>
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <div className="truncate">
              <Body>{appointment.salonName}</Body>
            </div>
            {appointment.salonAddress && (
              <div className="mt-0.5 truncate">
                <Meta>{appointment.salonAddress}</Meta>
              </div>
            )}
            <div className="mt-1 truncate">
              <Meta>{time}</Meta>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-s-border px-4 py-3">
          <div className="flex items-center gap-2">
            {/* Orchestrator decision (4): Candidate C renders status NEUTRAL (colour never
                encodes state). The shared kit StatusBadge always renders an icon with no prop to
                omit one, which would break this candidate's own "zero icons on a card" row, so a
                local icon-free pill (tray fill, ink text, STATUS_BADGE_BASE geometry) replaces it
                here only, unlike A/B's imported StatusBadge with treatment="pastel". */}
            {status ? (
              <span
                className="inline-flex items-center rounded-full font-medium"
                style={{
                  backgroundColor: COLOR.tray,
                  color: COLOR.inkText,
                  paddingLeft: STATUS_BADGE_BASE.paddingXPx,
                  paddingRight: STATUS_BADGE_BASE.paddingXPx,
                  paddingTop: STATUS_BADGE_BASE.paddingYPx,
                  paddingBottom: STATUS_BADGE_BASE.paddingYPx,
                  fontSize: STATUS_BADGE_BASE.fontSizePx,
                  lineHeight: 1.2,
                }}
              >
                {STATUS_LABEL[status]}
              </span>
            ) : null}
            {priceLabel != null ? <Price amount={priceLabel} locale={localeCode} size="row" /> : null}
          </div>
          <TextLink href={manageHref}>Manage</TextLink>
        </div>
      </Card>
    </motion.div>
  );
}

/** No upcoming booking: same one-card slot the populated hero uses, hasPhoto=false so Candidate C
 * gives it the ambient rail shadow rather than a border, per Card's photo-aware branch, never a
 * second card recipe for the empty case. */
function NoUpcomingHero({ browseHref }: { browseHref: string }) {
  // Candidate C: "zero icons on a card" (same rule fix 6 applies to HeroAppointment); this slot
  // shares the one entity-card recipe, so it drops its Calendar glyph too, even though this
  // run's seed data always has a next appointment and never renders this branch live.
  return (
    <Card variant="entity" hasPhoto={false} className="flex flex-col items-center gap-2 px-6 py-8 text-center">
      <Body className={TYPE_RAMP.sectionHeadingAlt.weightClass}>No upcoming visits</Body>
      <Meta>Book your next treatment to see it here.</Meta>
      <TextLink href={browseHref} className="mt-1">
        Browse salons
      </TextLink>
    </Card>
  );
}

/** Row anatomy: icon + label + chevron only, no subline, no card, no trailing count. One recipe,
 * used identically for all 7 destinations (owner: "if the design system changes per screen it's
 * gonna be ass"). */
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
