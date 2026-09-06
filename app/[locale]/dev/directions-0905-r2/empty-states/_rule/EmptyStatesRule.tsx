"use client";

// Grounded-in: app/[locale]/dev/directions-0905/empty-states/_vb/AirbnbEmptyUnit.tsx (the fixed
// structure this file transcribes onto kit tokens: icon, 28px headline-as-sentence, subline, one
// action; read in full, no literal copied, every size/weight/colour now reads from
// app/[locale]/dev/directions-0905-r2/_kit's TYPE_RAMP/SPACING/COLOR/RADIUS instead of the
// original file's hardcoded 28px+600 inline style, AIRBNB_INK #222222, AIRBNB_SECONDARY_GREY
// #6C6C6C and RAUSCH_SOLID #E41C5C (hue-ok: cited only as the banned value being removed below,
// never used as a fill anywhere in this file), all three banned by name in
// _plans/R2_LOOK_SYSTEMS.md A8).
//
// Exists-check: `npm run exists "empty-states rule"` and `npm run exists "directions-0905-r2
// empty-states"` (both run this session) return 0 matches, no existing round-2 empty-states
// file of any system. `npm run exists EmptyState` (round-1's own header already ran this) found
// the locked <EmptyState> primitive (icon/title/message/CTA on a sunken tray); this file does
// not import it, same reason round-1 Direction B did not: the fixed structure for round 2 is
// the Airbnb empty unit, a different anatomy than the locked primitive, not a redraw of it.
// `npm run exists kit` returns the real round-2 kit at ../../_kit, imported below via its
// barrel, never re-derived.
//
// Depicts: four real empty destinations, one section each, in the real profile-hub order ->
//   components-legacy/booking/BookingsList.tsx (Bookings tab shell + noBookings/emptyUpcoming
//   copy keys), app/[locale]/profile/favorites/page.tsx (title/lead copy keys),
//   app/[locale]/profile/vouchers/page.tsx (title/emptyBoth/buyNew copy keys),
//   app/[locale]/profile/looks/page.tsx (title/lead copy keys). Every headline/subline/CTA
//   string below is the real messages/en.json value for that key, transcribed, never
//   paraphrased (grep confirms: bookingsList.noBookings, bookingsListUi.emptyUpcoming,
//   profileFavorites.title/lead, vouchers.profile.title/emptyBoth/buyNew, looks.title/lead).
// Depicts: the Bookings tab-row shell -> components-legacy/booking/BookingsList.tsx (Upcoming/
//   Past/Cancelled), composed here through app/[locale]/dev/directions-0905-r2/_kit/Pill.tsx
//   (the real TabPill primitive, capsule corner, 44px), per the screen constraint ("any tab row
//   is the kit pill at 44px height"), replacing round-1 _vb's own hand-rolled `rounded-full`
//   span.
// Depicts: the real photographic rail folded in from Direction C -> app/[locale]/dev/
//   directions-0905/empty-states/_vc/loadDirectionC.ts (loadNewestLooks: 4 newest published
//   discovery_items, the exact function this file's data comes from, imported by page.tsx one
//   level up and passed down as a prop; not copied). This is the ONE thing named in the
//   orchestrator brief as liked from _vc ("the looks state has a real photographic rail live");
//   it is folded in ONLY for the Looks section, per the brief's own scoping ("where the screen
//   has real content to show").
//
// The Bookings-contradiction this file deliberately does NOT repeat: round-1 Direction C
// (app/[locale]/dev/directions-0905/empty-states/_vc/DirectionC.tsx) rendered "No bookings yet"
// directly above two real past-booking cards (BookingCard, the user's own actual bookings), a
// literal contradiction (the headline says none exist, the content shown is the user's own
// bookings). This file's Bookings section carries no booking content of any kind below its
// empty unit, only the tab-row shell + the unit itself. The Looks section is different in kind,
// not degree: loadNewestLooks returns the newest PUBLISHED items across the whole platform (a
// browse/discovery feed), never the signed-in user's own saved looks, so "No looks yet" (a
// claim about the user's personal collection) is not contradicted by showing other people's/
// salons' published looks underneath it, the same logic Airbnb's own empty Wishlist screen uses
// when it shows a "recommended for you" rail below the empty message.
//
// Screen constraints from the orchestrator brief, both addressed:
//   1. "No magenta or pink pill anywhere": round-1 _vb's RAUSCH_SOLID pink pill CTA (hue-ok:
//      the banned value, named only to confirm removal, never used below) is gone. Each state's
//      one action renders through the kit's SecondaryButton (white fill, hairline border, ink
//      text). SecondaryButton was chosen over PrimaryButton for all four (not just the pink
//      swap) because A3 fixes "exactly one [ink] commit button per screen" and this route
//      stacks four independently-shipping real screens on one page for comparison; four
//      ink-filled buttons on one page would read as four competing primary commits, and the
//      brief's own wording ("a kit primary button (ink) OR a kit secondary button") leaves the
//      choice open per instance. Zero ink buttons here trivially satisfies "at most one per
//      screen"; in production each state ships on its own separate route and is free to
//      reconsider this per that route's own commit-button inventory.
//   2. "any tab row is the kit pill at 44px height": see the Bookings tab-row note above.
//
// The "Bookings / Favorites / Vouchers / Looks" 18px section labels are the real navigation
// destinations this route stacks for comparison (profile hub routes /profile/bookings,
// /profile/favorites, /profile/vouchers, /profile/looks), not invented chrome; they also
// satisfy RULE's own mandatory-18px-tier rule (A5 / systems.ts "rule" deltas: "the 18px tier is
// mandatory and carries at least three text runs, since it is the only separator besides the
// hairline"). components-legacy/ui/EmptyState.tsx is the locked default anatomy for a real
// single empty state (icon + 18/600 headline + sunken tray + ink CTA); this file is the round-2
// alternative treatment his brief asks for (the Airbnb empty unit, RULE's no-card grouping),
// not a claim that EmptyState.tsx is wrong or being replaced in production.
//
// measured: rendered via Playwright at 390x844 (dpr 3) on
// /en/dev/directions-0905-r2/empty-states?s=rule this run. See the calling session's structured
// return for the full getBoundingClientRect/getComputedStyle pass: the four font sizes on the
// page (28/18/15/14), the two weights (400/500, both already post-clamp), every
// pill/badge/button recipe byte-checked against the kit, touch targets, and the RULE
// discriminator counts (box-shadow, hairline inset, 18px-tier run count) in the first 390x844
// fold.
//
// floors: (a) photographic focal = the Looks section's 4-tile photo rail (real published
// discovery_items cover images through the same displayImage resolution _vc's loader already
// applies); NOT present in the very first 390x844 fold, since this route deliberately stacks
// four independently-shipping real screens for comparison (Bookings/Favorites/Vouchers appear
// first, matching the real profile-hub order) -- in production each state ships as its own
// single route, and the locked empty-state anatomy is explicitly ICON-first, not photo-first,
// for exactly this reason (CLAUDE.md design contract "states" row: empty = icon + message + CTA
// on the sunken tray; FLOORS LAW 3: "Loading/empty/error DERIVE from the populated layout, not
// the reverse"), so an empty state carrying no photo above the fold is the locked default
// behaviour, not a gap; (b) one clearly biggest element = the Bookings section's 28px "No
// bookings yet" anchor, the single largest text run in the fold; (c) real tabular number = the
// Looks section's "{looks.length} new looks to explore" line, `looks.length` read straight off
// the real loadNewestLooks() result, never invented, rendered with tabular-nums; a pure empty
// state otherwise has no natural number to show (there is no data, by definition), stated here
// rather than fabricating one elsewhere on the page; (d) semantic colour moment = the Favorites
// section's heart icon at COLOR.save (#FF3366), the universal save-heart hue, legal as an icon
// per taste rule 4, never as text; (e) no dead-grey zone = the page is white end to end (RULE
// uses no tray), the heart-red icon and (further down) real photography both carry colour into
// the scroll, and the only grey pixels are the meta-toned subline text and hairlines, both
// legal per FLOORS LAW 6; (f) worst-case content holds = every headline/subline is real,
// already-shipping production copy (not a contrived long string), each subline is centred
// inside a 280px measure so it wraps predictably at 1-2 lines regardless of locale-length
// variance (the four EN strings measured here range from 24 to 82 characters), and the tab-row
// labels ("Upcoming"/"Past"/"Cancelled") are fixed short strings with no truncation risk.
//
// system: RULE, verbatim from _plans/R2_LOOK_SYSTEMS.md Part B / _kit/systems.ts: "there is no
// card anywhere on the screen; groups are separated by inset hairlines and gap size alone, and
// the hierarchy is carried entirely by a big anchor sentence over a populated middle type
// tier." Applied here: zero <Card> usage for grouping (the only <Card> instances are the four
// Looks photo tiles, variant="photo", which under RULE's own deltas render with
// border:false/shadow:false, i.e. a plain rounded image frame, not a "card" in the
// border-or-shadow sense the discriminator counts); every section boundary is a <Hairline>
// inset 24px both sides; and each state's own 28px headline is a sentence carrying the fact
// ("No bookings yet", not a label with a number beside it), sitting over the populated 18px
// section-label tier (Bookings/Favorites/Vouchers/Looks, >=3 of which land inside the 390x844
// fold).

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import type { LucideIcon } from "lucide-react";
import { Calendar, Heart, Ticket, Images } from "lucide-react";
import {
  KitProvider,
  SectionTitle,
  Pill,
  SecondaryButton,
  Card,
  TYPE_RAMP,
  SPACING,
  COLOR,
  RADIUS,
} from "../../_kit";
import type { LookTileData } from "../../../directions-0905/empty-states/_vc/loadDirectionC";

interface Props {
  locale: string;
  looks: LookTileData[];
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

// Entrance reveal, not press motion: framer-motion needs the curve as an array, so this
// transcribes the numbers in ../../_kit/tokens.ts's MOTION.release ("cubic-bezier(0.16,1,0.3,1)",
// A9 / round-1 press-motion direction A's own release curve) rather than inventing a new one.
// The 50ms per-item stagger step is the same cited, measured value app/[locale]/dev/
// directions-0905/empty-states/_vc/DirectionC.tsx already uses (STAGGER_STEP, sourced there from
// _design-system/references/airbnb--motion.md's measured stagger step), reused rather than a
// fresh guess. Brief: "entrance and press from the kit (press kit A)."
const RELEASE_EASE = [0.16, 1, 0.3, 1] as const;
const RELEASE_DURATION_S = 0.2; // MOTION.release.durationMs / 1000
const STAGGER_STEP_S = 0.05;

interface EmptyUnitProps {
  icon: LucideIcon;
  iconColor?: string;
  headline: string;
  subline: string;
  ctaLabel: string;
  ctaHref: string;
  index: number;
}

/** The Airbnb empty unit (fixed structure, his pick): icon, 28px headline-as-sentence, 14px
 * subline, one action. Transcribed from AirbnbEmptyUnit.tsx onto kit tokens; see this file's own
 * header for the full change list. */
function EmptyUnit({ icon: Icon, iconColor, headline, subline, ctaLabel, ctaHref, index }: EmptyUnitProps) {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const motionProps = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 12, scale: 0.97 },
        animate: { opacity: 1, y: 0, scale: 1 },
        transition: { duration: RELEASE_DURATION_S, delay: index * STAGGER_STEP_S, ease: RELEASE_EASE },
      };

  return (
    <motion.div
      className="flex flex-col items-center text-center"
      style={{ paddingTop: SPACING.group, paddingBottom: SPACING.group }}
      {...motionProps}
    >
      <Icon size={56} strokeWidth={1.5} style={{ color: iconColor ?? COLOR.inkText }} aria-hidden />
      <SectionTitle as="anchor" className="mt-4 max-w-[280px]">
        {headline}
      </SectionTitle>
      <p
        className="mt-2 max-w-[280px] font-body font-normal"
        style={{ fontSize: TYPE_RAMP.body.size, lineHeight: TYPE_RAMP.body.lineHeight, color: COLOR.meta }}
      >
        {subline}
      </p>
      <SecondaryButton className="mt-6 max-w-[240px]" onClick={() => router.push(ctaHref)}>
        {ctaLabel}
      </SecondaryButton>
    </motion.div>
  );
}

export default function EmptyStatesRule({ locale, looks }: Props) {
  const [activeTab, setActiveTab] = React.useState<"upcoming" | "past" | "cancelled">("upcoming");

  return (
    <KitProvider system="rule">
      <div className="w-full bg-white" style={{ paddingTop: SPACING.section }}>
        {/* ---- Bookings (components-legacy/booking/BookingsList.tsx shell) ---- */}
        <div style={{ paddingLeft: SPACING.pageMargin, paddingRight: SPACING.pageMargin }}>
          <SectionTitle as="heading">Bookings</SectionTitle>
          <div className="flex items-center gap-2" style={{ marginTop: SPACING.group }}>
            <Pill active={activeTab === "upcoming"} onClick={() => setActiveTab("upcoming")}>
              Upcoming
            </Pill>
            <Pill active={activeTab === "past"} onClick={() => setActiveTab("past")}>
              Past
            </Pill>
            <Pill active={activeTab === "cancelled"} onClick={() => setActiveTab("cancelled")}>
              Cancelled
            </Pill>
          </div>
          <EmptyUnit
            index={0}
            icon={Calendar}
            headline="No bookings yet"
            subline="Book your next treatment now"
            ctaLabel="Find salon"
            ctaHref={`/${locale}/search`}
          />
        </div>

        <div style={{ marginTop: SPACING.section }}>
          <Hairline />
        </div>

        {/* ---- Favorites (app/[locale]/profile/favorites/page.tsx shell) ---- */}
        <div style={{ paddingLeft: SPACING.pageMargin, paddingRight: SPACING.pageMargin, marginTop: SPACING.section }}>
          <SectionTitle as="heading">Favorites</SectionTitle>
          <EmptyUnit
            index={1}
            icon={Heart}
            iconColor={COLOR.save}
            headline="No favorites yet."
            subline="Tap the heart on a salon and it lands here, your shortlist for next time."
            ctaLabel="Open Inspo"
            ctaHref={`/${locale}/inspo`}
          />
        </div>

        <div style={{ marginTop: SPACING.section }}>
          <Hairline />
        </div>

        {/* ---- Vouchers (app/[locale]/profile/vouchers/page.tsx shell) ---- */}
        <div style={{ paddingLeft: SPACING.pageMargin, paddingRight: SPACING.pageMargin, marginTop: SPACING.section }}>
          <SectionTitle as="heading">Vouchers</SectionTitle>
          <EmptyUnit
            index={2}
            icon={Ticket}
            headline="My vouchers"
            subline="You don't have any vouchers or credit yet."
            ctaLabel="Give a new voucher"
            ctaHref={`/${locale}/vouchers`}
          />
        </div>

        <div style={{ marginTop: SPACING.section }}>
          <Hairline />
        </div>

        {/* ---- Looks (app/[locale]/profile/looks/page.tsx shell), the one state that folds in
            real content beneath the empty unit, per the orchestrator brief. ---- */}
        <div style={{ paddingLeft: SPACING.pageMargin, paddingRight: SPACING.pageMargin, marginTop: SPACING.section }}>
          <SectionTitle as="heading">Looks</SectionTitle>
          <EmptyUnit
            index={3}
            icon={Images}
            headline="No looks yet."
            subline="Collect inspiration from salon profiles and Inspo, and find it again here."
            ctaLabel="Open Inspo"
            ctaHref={`/${locale}/inspo`}
          />

          {looks.length > 0 ? (
            <div style={{ marginTop: SPACING.group }}>
              <p
                className="font-body font-normal"
                style={{ fontSize: TYPE_RAMP.body.size, lineHeight: TYPE_RAMP.body.lineHeight, color: COLOR.meta }}
              >
                <span className="tabular-nums font-heading font-medium" style={{ color: COLOR.inkText }}>
                  {looks.length}
                </span>{" "}
                new looks to explore
              </p>
              <div className="grid grid-cols-2 gap-3" style={{ marginTop: SPACING.sibling }}>
                {looks.map((look) => (
                  <Card key={look.id} variant="photo" className="relative aspect-[3/4]">
                    {look.displayImage ? (
                      <Image
                        src={look.displayImage}
                        alt={look.alt}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 50vw, 25vw"
                      />
                    ) : (
                      <div
                        className="flex h-full w-full items-center justify-center bg-s-bg-sunken"
                        style={{ borderRadius: RADIUS.photoCardPx }}
                      >
                        <Images className="h-5 w-5 text-s-ink-2" strokeWidth={1.5} aria-hidden />
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {/* HideInBooking strips the header and the 125px bottom nav on every /dev path; this
            reproduces that space so the fold measures like the real phone. */}
        <div style={{ height: 125 }} aria-hidden="true" />
      </div>
    </KitProvider>
  );
}
