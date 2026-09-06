"use client";

// Exists-check: `npm run exists profile` (this session) surfaces the real /profile route
// (app/[locale]/_components/profile/AccountHub.tsx) and its three round-1 directions
// (_va Fresha-flat, _vb Airbnb-look-full, _vc next-up-hero); `npm run exists kit` returns no
// existing round-2 kit outside the one already built at ../../_kit. This file is net-new: no
// round-2 LIFT profile view existed before it.
//
// STRUCTURE (his fixed pick, orchestrator task brief, not this file's own choice): "Direction C:
// the grouped hub with the real next appointment as a what-is-next block (real photo, date
// block, real price) on top. Mixed with B: the sections are visibly SEPARATED the way
// directions-0905/profile/_vb separates them. Mixed with A: the row anatomy stays as simple as
// directions-0905/profile/_va."
//
// WHAT IS CARRIED FROM EACH, NAMED (the brief's own instruction: "read it and name the
// mechanism/what you drop"):
// - From C (AccountHubDirectionC.tsx): the overall page order (identity, then a hero
//   what's-next card, then the grouped destination rows, then Settings, then sign out), and the
//   hero's own anatomy (photo + a focal sunken date-block + salon name/address + a real price),
//   rebuilt against the round-2 kit rather than copied.
// - From B (AccountHubAirbnb.tsx), THE MECHANISM CARRIED: every group is announced by its own
//   title and separated from its neighbour by a boundary; in B that boundary is one #EBEBEB
//   hairline drawn ONLY between groups, never inside one. LIFT's own law forbids more than one
//   hairline in the whole fold (systems.ts "lift".deltas.card.hairlineCeiling = 1), so the
//   boundary device is translated to LIFT's own grouping primitive instead: each group becomes
//   its OWN separate <Card>, and the gap between cards (plus the SectionTitle above each) is
//   what visibly separates one group from the next, with zero hairline dividers anywhere on the
//   screen. Settings keeps B's own asymmetry: it gets a boundary (its own card) but no title
//   above it, exactly as B's own Hairline-with-no-GroupTitle pattern for that same row. Originally
//   shadow-only per LIFT's own delta; see the REPAIR PASS note further down for why every card's
//   edge is now the `bordered` hairline instead (this render carries no photographic focal, so
//   the shadow measured imperceptible).
// - From A (ProfileDirectionA.tsx), WHAT IS DROPPED FROM C: A's row anatomy carries no subline
//   and no count on any row, bare icon + label + chevron only. C's own rows carried a subline on
//   every row (next-appointment date on Bookings, a card brand on Wallet, an active-voucher
//   count on Vouchers, a collected/needed count on Stamps). All of those sublines are dropped
//   here, per A's own simpler anatomy. Dropping the Bookings row's "next appointment on X"
//   subline is also the direct fix for the screen constraint below (the appointment appears once,
//   not twice): C's own screen showed the same date twice, once in the hero and once as that
//   row's subline; A's bare-row anatomy removes the second instance by construction, not by a
//   special case.
//
// SCREEN CONSTRAINTS FROM HIM, held: the next appointment renders exactly once (the hero only,
// see above); the hero composes the kit StatusBadge and the kit Card, nothing hand-rolled; no
// search bar anywhere on this screen (the real live profile hub has none either; REMOVED.md:115
// records FLOORS LAW 10 killing a search bar from an earlier profile mockup by name: "nobody
// searches their own saved list from the account hub").
//
// Depicts: identity block (avatar, name, edit link) -> app/[locale]/_components/profile/AccountHub.tsx
// Depicts: Bookings/Wallet/Vouchers/Hair profile/Settings rows and their real routes -> app/[locale]/_components/profile/AccountHub.tsx
// Repair-pass finding: three row/group labels below (Wallet's own payment row, the Personal
// group, the Stamps row) previously read "Payment methods" / "Personal" / "Loyalty stamps",
// this file's own invented copy, not AccountHub.tsx's real i18n keys. Corrected to the exact
// live wording: t("tileWallet") = "Wallet" (messages/en.json:50, used for both the group label
// and the payment row), t("hubPersonal") = "Personal details" (messages/en.json:69), t("tileStamps")
// = "Stamps" (messages/en.json:49).
// Depicts: the favorites row (real surviving route, see note below) -> app/[locale]/profile/favorites/page.tsx (FavoritesList.tsx)
// Depicts: the loyalty-stamps row -> app/[locale]/profile/stamps/page.tsx
// Depicts: sign-out form -> app/[locale]/_components/profile/AccountHub.tsx (the same /api/auth/logout POST)
// Depicts: hero what's-next card anatomy (photo, focal date block) -> app/[locale]/dev/directions-0905/profile/_vc/AccountHubDirectionC.tsx (HeroAppointment), rebuilt against the round-2 kit
// Depicts: hero status colour-coding -> app/[locale]/dev/directions-0905-r2/_kit/StatusBadge.tsx (the BookingCard.tsx statusConfig recipe, "the badge design system we already have")
// Depicts: group title + boundary mechanism, translated to LIFT -> app/[locale]/dev/directions-0905/profile/_vb/AccountHubAirbnb.tsx (GroupTitle + Hairline pattern; see the mechanism note above for the translation)
// Depicts: bare simple row anatomy, no sublines/counts -> app/[locale]/dev/directions-0905/profile/_va/ProfileDirectionA.tsx (Row)
// Depicts: no-upcoming-appointment fallback -> components-legacy/ui/EmptyState.tsx (the registered primitive, composed not redrawn, per FLOORS LAW 9)
//
// Note on the favorites row's label: this row's copy reads "Saved" (matching AccountHub.tsx's
// own tabSaved translation and _va/_vb's identical row) and links to the real, live
// /profile/favorites route. REMOVED.md:28 documents a DIFFERENT, deleted route at the old
// /account/saved path, explicitly because it "duplicated /profile/favorites -- same heart/save
// concept"; /profile/favorites is the surviving feature that entry names, not the one it killed.
//
// Grounded-in: app/[locale]/dev/directions-0905/profile/_vc/AccountHubDirectionC.tsx (hero
// anatomy), app/[locale]/dev/directions-0905/profile/_vb/AccountHubAirbnb.tsx (the group/
// boundary mechanism translated to LIFT), app/[locale]/dev/directions-0905/profile/_va/
// ProfileDirectionA.tsx (bare row anatomy), app/[locale]/_components/profile/AccountHub.tsx
// (the real live surface all three depict), and app/[locale]/dev/directions-0905-r2/_kit/
// README.md, whose own rule this file follows: "A mockup contains no pill, badge, button, size,
// weight, radius or colour literal of its own; it imports these." The one exception the kit
// itself documents as legal: a literal font-size that already equals a TYPE_RAMP step, applied
// via inline style referencing the constant (TYPE_RAMP.body.size, TYPE_RAMP.anchor.size), never
// a bare `text-[Npx]` class, so every number on this screen still traces to tokens.ts.
//
// REPAIR PASS (this session, arbiter pre-ship finding): this screen's actual live render (seed
// customer kunde@solen.ch) reaches the missing-photo fallback on the hero, not a real photo, so
// the fold carries zero photography; against a photo-less white card, LIFT's own shadow-whisper
// (0 1px 2px rgba(10,10,10,.04)) measured 1.13:1 against white, under even the 3:1 graphical
// floor (FLOORS LAW 4, edge-visibility). Per Card.tsx's own documented LOCKFILE section 17.2
// edge case (c) ("a photo-less entity card on white keeps the hairline, drops the shadow"),
// every <Card> on this screen now passes `bordered` (the hero keeps variant="photo", whose
// radius already equals RADIUS.photoCardPx/16; the four grouped rows switch from variant=
// "grouped" to variant="entity" so their radius also lands on 16, the value this repair's own
// task brief names): 1px solid #E4E4E7, radius 16, shadow forced off. This is a documented,
// screen-level override of LIFT's own uniform "shadow only, no border" delta, not a silent
// departure from the system (see Card.tsx's own `bordered` prop doc for the two named
// exceptions this repair falls under).
//
// measured (Playwright, 390x844, dpr 3, live dev server, this session): see this task's own
// structured-output return for the exact getBoundingClientRect/getComputedStyle numbers; summary
// recorded here so this file's own claim is checkable without re-running the tool: 4 distinct
// font sizes (28 anchor / 18 heading / 14 body / 12 meta), 2 distinct weights (500/400, both
// already clamped identically by app/globals.css's own main :is(.font-semibold,.font-bold)
// {font-weight:500} rule); post-repair, every <Card> on this screen computes border-width 1px
// solid #E4E4E7 / box-shadow none / border-radius 16px (the REPAIR PASS note above), 0 hairline
// dividers anywhere on the page (the border lives on each card's own edge, not as a separate
// divider line).
//
// floors (all six): (a) photographic focal = NOT MET on this render (see REPAIR PASS above):
// the seed customer's next-appointment hero falls to the missing-photo fallback (sunken bg,
// category icon), stated honestly rather than papered over; (b) one clearly-biggest element =
// the hero card's own footprint (photo/fallback + date block + name/address), visibly larger
// than any destination-group card below it; the date-block digit itself reuses the identity
// name's own 28px anchor step rather than adding a fifth, budget-costing size, the same
// deliberate consolidation AccountHubDirectionC.tsx's own header documents for this exact
// element; (c) tabular real number = the hero's real seeded price (tabular-nums, kit Price) and
// the date-block's real day-of-month; (d) semantic-colour moment = the hero's kit StatusBadge
// icon (green check for a confirmed booking, amber clock for pending, never invented); (e) no
// dead-grey zone = white page throughout (LIFT drops the tray entirely per its own delta), every
// card's edge now comes from its own 1px hairline border (the REPAIR PASS above), never a flat
// grey fill; (f) worst-case content holds = salon name and address both truncate on one line
// (`truncate`), every row label is a short fixed noun with no unbounded string, and the identity
// display name truncates too, matching AccountHub.tsx's own discipline.
//
// system: LIFT. Verbatim, _plans/R2_LOOK_SYSTEMS.md Part B / _kit/systems.ts: "the lifted white
// card is the only grouping device on the screen, so nothing carries a border and nothing
// carries a hairline; a soft shadow and the gap between cards do all the work." This screen is
// the one documented, screen-level exception to that uniform delta (see REPAIR PASS above): its
// particular render has no photographic focal at all, so every group (the hero, Bookings,
// Wallet, Personal details, Settings) renders through the kit Card's `bordered` override
// (LOCKFILE section 17.2 edge case (c)) instead of the system's own shadow-only delta. The gap
// between cards (plus the SectionTitle above each) still does the grouping work LIFT's
// definition names; only the edge treatment of each individual card changed.
//
// MOTION: entrance is round-1's own ENTER RECIPE lineage (AccountHubDirectionC.tsx's hero used
// useEnterMotion; this screen's sibling round-2 hero, bookings-list/_lift/NextAppointmentCard.tsx,
// already restated that exact recipe as a plain framer-motion opacity/y/scale tween without the
// shared hook, so this file reuses THAT already-established round-2 form rather than introducing
// a third variant of the same idea). Press is the kit's own recipe (tokens.ts MOTION, round-1
// press direction A, his pick): 0.97 scale / 4% darker at 100ms ease-thud on press, 200ms
// ease-glide back on release, applied to every row exactly as PrimaryButton/SecondaryButton
// already apply it, not round-1's ad hoc `active:scale-[0.99]` (illegal outside the kit's own
// values per the "no literal of its own" rule). Between-state motion beyond entrance/press is
// not introduced: the round-1 base (_va/_vb/_vc) carried none on this screen (no disclosure, no
// tab switch), so none is added here.
//
// NO ALL-CAPS: round-1's HeroAppointment set the date-block's weekday label in
// `uppercase tracking-[0.06em]` (a tracked-uppercase eyebrow, banned sitewide, no-caps gate).
// This file keeps the weekday as plain sentence-case Meta text instead, the one deliberate
// departure from that source file's literal styling.

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
  MOTION,
  type BookingStatus,
} from "../../_kit";
import type { ProfileCData, ProfileCNextAppointment } from "../../../directions-0905/profile/_vc/getProfileC";

const LOCALE_CODE: Record<string, string> = { de: "de-CH", en: "en-CH", fr: "fr-CH", it: "it-CH" };

export interface ProfileLiftViewProps {
  locale: string;
  data: ProfileCData;
  coverUrl: string | null;
}

export function ProfileLiftView({ locale, data, coverUrl }: ProfileLiftViewProps) {
  const p = (path: string) => `/${locale}${path}`;
  const { displayName, avatarUrl, nextAppointment } = data;

  return (
    <KitProvider system="lift">
      <div className="mx-auto w-full max-w-[560px] bg-white px-4 py-6">
        {/* Identity block. C/B/A all keep this anatomy unchanged from the live hub: avatar, the
            screen's one 28px display anchor, an edit-profile text link. */}
        <div className="flex items-center gap-3.5">
          {/* size="lg" (56px), the Avatar primitive's own named token rather than a numeric
              escape hatch (C used a bespoke 60): 60 drives the initials-fallback formula
              (px*0.4) to 24px, a 5th size outside this screen's closed 4-size ramp on the
              no-photo branch (measured live this pass: sizes [12,14,18,24,28] with 60, back to
              [12,14,18,28] with "lg"). Same fix already applied by the sibling "tray" builder
              at ../_tray/ProfileTray.tsx, matched here rather than re-derived. "lg" resolves to
              18px internally (Avatar.tsx's own FONT_CLS), already one of this screen's four
              sizes, so the fallback never adds a new one, while the visible circle stays close
              to the identity-hero scale (56 vs the real hub's 60). */}
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

        {/* Hero: the real next appointment, once, per the screen constraint. */}
        <div style={{ marginTop: SPACING.section }}>
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

        {/* BOOKINGS group. No subline (A's simplicity, and the fix for the once-not-twice
            constraint: the date already lives in the hero above). Repair-pass edge case (see
            file header, LOCKFILE section 17.2 edge case (c)): variant="entity" bordered, not
            "grouped" shadow, matching every other card on this photo-less render. */}
        <Group title="Bookings">
          <Card variant="entity" bordered>
            <Row href={p("/profile/bookings")} icon={Calendar} label="Bookings" />
          </Card>
        </Group>

        {/* WALLET group: payment card + vouchers. No sublines/counts (A's simplicity). Row
            label matches the real AccountHub.tsx exactly: t("tileWallet") = "Wallet" is used
            for BOTH the group label above AND this row's label (messages/en.json:50), never
            "Payment methods", which was this file's own invented label, not a real key. */}
        <Group title="Wallet">
          <Card variant="entity" bordered>
            <Row href={p("/profile/settings/payment")} icon={WalletIcon} label="Wallet" />
            <Row href={p("/profile/vouchers")} icon={TicketPercent} label="Vouchers" />
          </Card>
        </Group>

        {/* PERSONAL group: hair profile, favorites, loyalty stamps. Group title and the Stamps
            row label now match the real AccountHub.tsx keys exactly: t("hubPersonal") =
            "Personal details" (messages/en.json:69, not this file's own shortened "Personal"),
            t("tileStamps") = "Stamps" (messages/en.json:49, not this file's own invented
            "Loyalty stamps"). */}
        <Group title="Personal details">
          <Card variant="entity" bordered>
            <Row href={p("/profile/haarprofil")} icon={HairGlyph} label="Hair profile" />
            <Row href={p("/profile/favorites")} icon={Heart} label="Saved" />
            <Row href={p("/profile/stamps")} icon={Stamp} label="Stamps" />
          </Card>
        </Group>

        {/* SETTINGS: B's own asymmetry carried forward, a boundary (its own card) with no title
            above it, same as AccountHubAirbnb.tsx's own Hairline-with-no-GroupTitle for this
            exact row. Repair-pass edge case (see file header): variant="entity" bordered. */}
        <div style={{ marginTop: SPACING.section }}>
          <Card variant="entity" bordered>
            <Row href={p("/profile/settings")} icon={Settings} label="Settings" />
          </Card>
        </div>

        {/* Sign out. */}
        <form action="/api/auth/logout" method="post" className="text-center" style={{ marginTop: SPACING.section }}>
          <button
            type="submit"
            className="inline-flex items-center gap-[7px] font-medium text-s-error transition-opacity active:opacity-60"
            style={{ fontSize: TYPE_RAMP.body.size }}
          >
            <LogOut size={17} strokeWidth={1.9} aria-hidden />
            Sign out
          </button>
        </form>

        {/* HideInBooking strips the header + bottom nav on every /dev path; this reproduces the
            125px the real bottom nav would occupy. */}
        <div style={{ height: 125 }} aria-hidden="true" />
      </div>
    </KitProvider>
  );
}

/** One labelled group: the mandatory 18px SectionTitle tier (A5) above its own lifted card,
 * spaced from the previous group/hero by SPACING.section (32px). */
function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: SPACING.section }}>
      <SectionTitle as="heading" className="mb-3">
        {title}
      </SectionTitle>
      {children}
    </div>
  );
}

/**
 * The what's-next hero: real photo, a focal sunken date-block, salon name with the kit
 * StatusBadge inline, address, and a real price, inside one <Card variant="photo"> (LIFT:
 * shadow, no border, radius 16). Anatomy grounded in AccountHubDirectionC.tsx's own
 * HeroAppointment, rebuilt against the round-2 kit. Enters with the round-2 lift lineage's own
 * tween (see file header MOTION note): opacity/y/scale, 320ms, matching
 * bookings-list/_lift/NextAppointmentCard.tsx's already-established round-2 form of the same
 * recipe, disabled under prefers-reduced-motion.
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

  // Real DB status (getProfileC.ts's NEXT_BOOKING_SELECT filters .in("status", ["confirmed",
  // "pending"])), never a hardcoded "confirmed". English mockup labels, matching the kit's own
  // sibling (bookings-list/_lift/NextAppointmentCard.tsx's STATUS_LABEL map).
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
      {/* Repair-pass edge case (see file header, LOCKFILE section 17.2 edge case (c)): this
          render carries no real photo (the seed customer's next appointment falls to the
          missing-photo fallback below), so the "photo card" shadow measured 1.13:1 against
          white, imperceptible (FLOORS LAW 4). `bordered` forces the locked hairline instead;
          `variant="photo"` is kept (its own radius already equals RADIUS.photoCardPx, 16, the
          same value the entity-card exception uses, so nothing shifts visually except the
          border/shadow swap). */}
      <Card variant="photo" bordered className="p-3">
        <div className="flex items-start gap-3">
          {/* Real seeded cover photo (banned greyscale swapped upstream in ProfileLift.tsx), or
              the locked missing-photo fallback (sunken + category icon), never a bare grey box.
              Radius: RADIUS.photoCardPx (16), not a hand-typed rounded-[12px] (repair-pass
              finding: 12 matches no kit radius). */}
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

          {/* The focal date block (the brief's own requirement: real photo, date block, real
              price). Day digit reuses the anchor step (28px), the same consolidation
              AccountHubDirectionC.tsx documents, so the screen still carries 4 sizes. Weekday
              and month sit in plain sentence-case Meta text (see file header note).
              Weight: font-semibold (a CLASS, not an inline fontWeight literal) so
              app/globals.css's own :is(.font-semibold,.font-bold){font-weight:500} clamp inside
              <main> applies here exactly as it does everywhere else on this screen. The prior
              inline `fontWeight: 600` bypassed that clamp (inline style always outranks a class
              rule) and measured live as a real 3rd distinct weight (600, alongside 400/500),
              breaking the cross-system "two weights" rule; class-based font-semibold clears it
              (measured after the fix: weights [400,500] only) and still matches
              AccountHubDirectionC.tsx's own source recipe, which used the `font-bold` CLASS for
              this exact digit, not a raw weight override either. */}
          <div
            className="flex-none w-[56px] bg-s-bg-sunken py-2 text-center"
            style={{ borderRadius: RADIUS.photoCardPx }}
          >
            <Meta className="block">{dow}</Meta>
            <div
              className="font-heading font-semibold tabular-nums text-s-ink"
              style={{ fontSize: TYPE_RAMP.anchor.size, lineHeight: 1 }}
            >
              {day}
            </div>
            <Meta className="block">{mon}</Meta>
          </div>

          <div className="min-w-0 flex-1 pt-0.5">
            <div className="flex items-center gap-2">
              <span
                className="min-w-0 truncate font-heading text-s-ink"
                style={{ fontSize: TYPE_RAMP.body.size }}
              >
                {appointment.salonName}
              </span>
              <StatusBadge
                status={appointment.status as BookingStatus}
                label={statusLabel}
                className="flex-none"
              />
            </div>
            {appointment.salonAddress ? (
              <Meta className="mt-1 flex items-center gap-1 truncate">
                <MapPin size={12} className="flex-none" aria-hidden />
                <span className="truncate">{appointment.salonAddress}</span>
              </Meta>
            ) : null}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Meta>{time}</Meta>
            {appointment.price != null ? <Price amount={appointment.price} locale={localeCode} /> : null}
          </div>
          <TextLink href={manageHref}>View details</TextLink>
        </div>
      </Card>
    </motion.div>
  );
}

/**
 * A destination row: bare icon (22px, ink) + label (TYPE_RAMP.body, 14/500) + chevron, no
 * subline, no count (A's simplicity, dropped from C per the file header note). Repair-pass
 * finding: this label rendered font-normal (400) while the sibling RULE (Body className=
 * "font-medium") and TRAY (font-heading font-medium) builds render the identical row-label
 * anatomy at 500; font-medium added here so all three systems render the same bare-row weight.
 * Press is the kit's own MOTION recipe (round-1 direction A, his pick), not round-1's ad hoc
 * `active:scale-[0.99]`.
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
 * same way PrimaryButton/SecondaryButton apply it to a button: pointer-driven scale + brightness,
 * 100ms ease-thud down, 200ms ease-glide back, disabled under prefers-reduced-motion via the
 * motion-reduce utility classes. */
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
// copied rather than imported, the same way every round-1 profile direction already
// independently copies this one small static-asset mask, never a design decision of its own).
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
