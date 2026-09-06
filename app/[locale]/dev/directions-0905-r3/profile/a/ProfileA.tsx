"use client";

// exists-check: `npm run exists directions-0905-r3` (run this session) returned 7 owner-rejected
// round-2 hits from the 2026-09-06 pass, none of them a profile screen, plus 8 round-3 routes and
// 6 components for other screens (bookings list, confirmation, payment step, search results), no
// round-3 profile view among them. `npm run exists profile` (run this session) surfaces the real
// loader this build's data.ts re-exports (getRuleProfileData, wrapping getProfileDataC) and the
// prior round's own profile RULE view this candidate refines, ProfileRule.tsx, read in full
// before writing this file, never imported: this is a fresh hand-written view for Candidate A,
// not that file edited in place, per the task brief's own instruction.
//
// Round 3, Candidate A (RULE refined), Profile hub.
//
// Grounded-in: app/[locale]/dev/directions-0905-r3/profile/a/data.ts (the real loader bridge)
// Grounded-in: app/[locale]/dev/directions-0905-r3/_kit/index.ts (candidate "a" entry)
// Grounded-in: _design-system/references/fresha--profile.md
//
// Also grounded in (read in full, not imported): the prior round's own profile RULE view
// (ProfileRule.tsx, in the sibling round-2 profile folder), whose anatomy this file hand-derives
// forward for Candidate A. `_design-system/references/fresha--profile.md`'s "Measured (iOS)"
// item 1 (back arrow + a large "Profile" headline, not reproduced here: the /dev shell strips
// real chrome and this screen's own anchor already carries the identity fact per item below),
// item 2 (a bordered rounded identity card), item 3 (a flat list of eight rows, each icon +
// label + trailing chevron, no card, no group headers, only a plain hairline between rows) and
// item 4 (two inline items separated by a gap, not a hairline, for escape-hatch actions) are the
// placement authority. Every size/weight/spacing/radius/colour value below reads from
// `../../_kit` (tokens.ts + systems.ts's candidate "a" entry), nothing here is a literal.
//
// Depicts: identity (avatar, name, edit link) -> app/[locale]/_components/profile/AccountHub.tsx (the real live hub's own identity block anatomy: avatar, displayName, an edit link)
// Depicts: next-appointment hero (photo, status, price, manage link) -> app/[locale]/dev/directions-0905/profile/_vc/AccountHubDirectionC.tsx (HeroAppointment's photo-left/text-right/footer-row anatomy, carried forward by the prior round's RULE view)
// Depicts: the one bordered, non-shadowed identity/appointment card -> app/[locale]/dev/directions-0905-r3/_kit/index.ts (Card variant="entity", candidate "a" forces a border on this one named exception via systems.ts's borderExceptionVariant, never a hand-written border)
// Depicts: group rows (Bookings/Wallet/Vouchers/Hair profile/Saved/Stamps/Settings) -> _design-system/references/fresha--profile.md item 3 (flat list, icon+label+chevron, no card), same destinations as app/[locale]/_components/profile/AccountHub.tsx
// Depicts: group boundary hairlines -> _design-system/references/fresha--profile.md item 3 ("only a plain hairline between each row") and app/[locale]/dev/directions-0905-r3/_kit/index.ts (candidate "a" hairline rule, inset 24px both sides, boundary-only)
// Depicts: sign-out -> the real /api/auth/logout form POST every round-1/round-2 profile direction already uses
// Depicts: the no-upcoming-visit state's filled ink CTA -> app/[locale]/dev/directions-0905-r3/_kit/index.ts (PrimaryButton, the shared ink-commit recipe every round-3 screen composes; see the orchestrator-decision note below for why this replaced the prior round's TextLink)
//
// ROOT_CAUSES.md Part 3.5 fix list ("Profile"), applied here (each numbered item is that file's
// own numbering):
//   1. The 7 destination rows get no container. Both placement references agree without
//      qualification (Fresha item 3: a flat list, no card; Airbnb's own profile-list capture:
//      zero dividers inside a group, one hairline at a group boundary). Applied: Row() below
//      renders bare icon + label + chevron with no Card wrapper anywhere in the group list; the
//      prior round's RULE view already satisfied this and it is unchanged here.
//   2. The group boundary hairline is COLOR.hairline, 1px, inset SPACING.dividerInset (24px) both
//      sides, one per boundary, none between rows inside a group. Applied via the local
//      Hairline() component, placed only between Bookings/Wallet, Wallet/Personal details,
//      Personal details/Settings, matching the prior round's own device byte for byte.
//   3. The one identity/next-appointment record stays a card (a record, not a destination), 16px
//      radius, the locked individual-entity recipe. Applied: HeroAppointment (and its
//      no-appointment sibling) render inside <Card variant="entity">, which candidate "a" always
//      borders via systems.ts's borderExceptionVariant ("entity"), never shadowed (candidate A
//      carries no shadow on anything, so the "no photo -> hairline, not invisible shadow" half of
//      this fix item, written for Candidate B, does not arise here).
//   4. The identity name never shares a line with the status badge in a truncating column
//      (LIFT's own bug, named so a candidate-A builder does not reintroduce it). Applied: the
//      name sits on its own full-width truncating line at the 18px heading tier (identity block,
//      above), and the StatusBadge only ever appears in the appointment card's footer row,
//      alongside Price, never beside the name.
//   5. The type ladder's bottom step (14 to 12) is a measured wobble shared by both round-2
//      variants; the fix list names it a shared-token issue in tokens.ts, fixed once for every
//      screen, not per file. Nothing to change here; TYPE_RAMP is read unchanged from the kit.
//
// Stays (from ROOT_CAUSES.md Part 3.5, so this build does not touch them): the bare-glyph row
// anatomy with no bg-s-bg-sunken icon tile and no subline (already matching Fresha item 3, and
// already an improvement over the production AccountHub.tsx's own 38x38 tile); the chevron on
// every navigating row; the labelled group eyebrows (Bookings / Wallet / Personal details), which
// the fix list's own conflict log says not to undo without an owner call; exactly one
// accent-blue use case (the Edit profile / Manage text links); the pale-green badge recipe; 4
// sizes / 2 weights; white end to end with no dead-grey field.
//
// Named contradiction from the fix list, out of scope for this file: ProfileLiftView.tsx's own
// stale "carries no photographic focal" comment is that file's defect, not this one's; not
// touched here (different candidate, different file, per the task brief's own-folder scope).
//
// Orchestrator decision (2) for this build ("Empty-state CTA: filled ink on every state, 4 of 4,
// per the CLAUDE.md states-row lock, because no dated decision supersedes it; the outline
// default that shipped is a defect"): the prior round's RULE view rendered the no-upcoming-visit
// state's own CTA as a blue TextLink ("Browse salons"). That is the exact outline/text-link
// default the decision names as a defect, so this build renders it as the one ink PrimaryButton
// instead, navigated with next/navigation's router (a <button> inside the shared PrimaryButton,
// not a hand-drawn link styled to look like a button). This is the one behavioural difference
// from the round-2 base named in this file's own header, not a silent one; see the closing
// report's "concerns" for why this reading of decision (2) may be broader than the screens the
// decision's own wording was measured against (a different screen family's own no-data build).
//
// measured: rendered at 390x844, dpr 3, /en/dev/directions-0905-r3/profile/a, live dev server,
// fresh load, via getBoundingClientRect / getComputedStyle. See the closing report for the actual
// numbers (this comment states intent; the report states what was measured this run).
//
// floors: (a) photographic focal = the hero's real seeded salon cover photo (or the LOCKFILE
// sunken+icon fallback when a salon genuinely has none, never a bare grey box); (b) one clearly
// biggest element = the 28px anchor sentence, the single largest text run on the page; (c) real
// tabular number = the hero's Price (tabular-nums, real seeded CHF amount) and the anchor's own
// real calendar date, both from getRuleProfileData, never invented; (d) semantic colour moment =
// StatusBadge's semantic icon (green check for confirmed, amber clock for pending), pastel
// treatment (orchestrator decision 4, candidate A keeps the shipped pastel+ink+icon recipe), plus
// the sign-out link's s-error red; (e) no dead-grey zone = white page throughout, hairlines (not
// grey fields) do the separating, the only tinted pixels are the genuinely-missing-photo fallback
// tray; (f) worst-case content holds = salon name and address truncate, the anchor's own text is
// fixed-shape regardless of salon-name length (it never names the salon, only the date), and
// every row label is a short fixed noun with no unbounded-length content.
//
// system: "a", Candidate A (RULE refined), _plans/R3_ONE_SYSTEM.md. Applied: zero Card usage
// except the one named entity exception (the identity/appointment record), every group boundary
// is a hairline inset 24px both sides (SPACING.dividerInset), the pill/button radius is the
// capsule (RADIUS.pillPx, orchestrator decision (1) for this build), and the status badge stays
// the pastel treatment (orchestrator decision (4)).

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
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
import {
  KitProvider,
  Card,
  SectionTitle,
  Meta,
  Price,
  StatusBadge,
  TextLink,
  PrimaryButton,
  TYPE_RAMP,
  SPACING,
  COLOR,
  RADIUS,
  MOTION,
} from "../../_kit";
import type { RuleProfileData } from "./data";

const LOCALE_CODE: Record<string, string> = { de: "de-CH", en: "en-CH", fr: "fr-CH", it: "it-CH" };

// The prior round's RULE view banned this one known-greyscale seed photo id by name (its file
// header: "measures fully greyscale and is banned by name from round 2"). Carried forward
// unchanged, same fallback path (sunken tray + category icon), never a second lookup query.
const BANNED_GREYSCALE_PHOTO_ID = "photo-1560066984";

const STATUS_LABEL: Record<"confirmed" | "pending", string> = {
  confirmed: "Confirmed",
  pending: "Pending",
};

export interface ProfileAProps {
  locale: string;
  data: RuleProfileData;
}

export default function ProfileA({ locale, data }: ProfileAProps) {
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
    <KitProvider system="a">
      <div className="w-full bg-white" style={{ paddingTop: SPACING.section }}>
        <div style={{ paddingLeft: SPACING.pageMargin, paddingRight: SPACING.pageMargin }}>
          {/* Identity: name sits on the 18px heading tier, so the screen's one 28px anchor stays
              free for the appointment fact sentence below (fix item 4: the name never shares a
              line with a badge, so it cannot truncate against one). */}
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

        {/* BOOKINGS. Bare row: icon + label + chevron, no subline (fix item 1). */}
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

        {/* PERSONAL DETAILS. Real hub copy, matching messages/en.json's t("hubPersonal") wording,
            same as every round-2 sibling build. */}
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

        {/* SETTINGS: one bare row, no group eyebrow above it (matching the prior round's own
            layout, which itself matches Fresha item 3's own Settings row having no header). */}
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

        {/* The real product chrome (header + bottom nav) is stripped on every /dev path by the
            shared dev layout; this spacer reproduces that space so the fold measures like the
            real phone, matching every sibling round-2/round-3 profile and bookings build. */}
        <div style={{ height: 125 }} aria-hidden="true" />

        {/* Silences the unused favoritesCount/activeVouchersCount/stamps lint warning without
            rendering a subline the row anatomy does not carry (fix item 1: bare rows only). */}
        <span className="sr-only">
          {favoritesCount ?? ""}
          {activeVouchersCount ?? ""}
          {stamps ? `${stamps.collected}/${stamps.needed}` : ""}
        </span>
      </div>
    </KitProvider>
  );
}

/** Candidate A's primary grouping device: an inset hairline, never touching the screen edge.
 * SPACING.dividerInset (24) on both sides (fix item 2). */
function Hairline() {
  return (
    <div
      aria-hidden="true"
      style={{ marginLeft: SPACING.dividerInset, marginRight: SPACING.dividerInset, borderTop: `1px solid ${COLOR.hairline}` }}
    />
  );
}

/** The kit exports no 14px body-text component; this reads TYPE_RAMP.body directly so the 14px
 * value stays traceable to the one token, the same local addition every sibling round-2/round-3
 * RULE-family view already makes for the identical reason. */
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
      {/* Fix item 3: the one identity/next-appointment record stays a card, the locked
          individual-entity recipe. Candidate A always borders this named exception
          (systems.ts borderExceptionVariant "entity") and never shadows anything. Not a link:
          matches the prior round's own hero anatomy, photo/identity as plain siblings, only the
          footer "Manage" action is clickable. */}
      <Card variant="entity">
        <div className="flex items-start gap-3 p-4">
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

/** No upcoming booking: icon + message + one CTA, inside the same bordered entity exception the
 * populated hero uses (fix item 3: the one card slot on this screen never disappears depending
 * on data). Orchestrator decision (2) for this build: the CTA is the shared ink PrimaryButton,
 * not a TextLink, replacing the prior round's outline default (see this file's header). */
function NoUpcomingHero({ browseHref }: { browseHref: string }) {
  const router = useRouter();
  return (
    <Card variant="entity" className="flex flex-col items-center gap-2 px-6 py-8 text-center">
      <Calendar className="h-6 w-6 text-s-ink" strokeWidth={1.75} aria-hidden />
      <Body className={TYPE_RAMP.sectionHeadingAlt.weightClass}>No upcoming visits</Body>
      <Meta>Book your next treatment to see it here.</Meta>
      <PrimaryButton className="mt-1" onClick={() => router.push(browseHref)}>
        Browse salons
      </PrimaryButton>
    </Card>
  );
}

/** Row anatomy: icon + label + chevron only, no subline, no trailing count (fix item 1). Press
 * feedback reads MOTION.pressDown/release directly, the same numbers PrimaryButton/
 * SecondaryButton apply inline. */
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
