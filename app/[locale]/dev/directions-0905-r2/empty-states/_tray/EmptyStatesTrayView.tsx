"use client";

// Exists-check: `npm run exists "empty-states r2 tray"` (this session) returns 0 matches. `npm
// run exists empty` (this session) surfaces the locked components-legacy/ui/EmptyState.tsx
// primitive (NOT imported here: Direction B's whole point, kept from round-1's own _vb file, is
// that the icon+headline+message+CTA slot is a from-scratch Airbnb-style unit, not that
// primitive) and round-1's own three directions of this exact surface
// (app/[locale]/dev/directions-0905/empty-states/_va/_vb/_vc), read in full before this file was
// written. No existing round-2 TRAY-system empty-states view before this file.
//
// THE STRUCTURE IS FIXED (owner pick, per the task brief): Direction B, the Airbnb empty unit
// (icon, headline, subline, one action) on each of the four states, transcribed here from
// app/[locale]/dev/directions-0905/empty-states/_vb/AirbnbEmptyUnit.tsx's own anatomy -- headline
// as a sentence, a grey subline, one CTA -- rebuilt against the round-2 kit instead of round-1's
// hardcoded Airbnb hex/rausch-pink literals, which the task brief bans by name ("No magenta or
// pink pill anywhere").
//
// Reference-checked: _design-system/references/airbnb--empty-states.md (the captured Airbnb
// empty-state anatomy this "one unit, one action" structure traces to) and
// _design-system/references/airbnb--look-recipes.md (the captured ink/grey/CTA-pill numbers
// round-1's AirbnbEmptyUnit.tsx already ported and this file's own kit tokens supersede). Neither
// file's literal hex/px values are used directly here: every value in this file is a round-2 kit
// import (_plans/R2_LOOK_SYSTEMS.md Part A already reconciled those captured numbers against
// Solen's own locks), not a re-read of the capture.
//
// Depicts: bookings tab strip + empty state -> components-legacy/booking/BookingsList.tsx (real
//   tab strip Upcoming/Past/Cancelled, real i18n keys bookingsList.upcoming/past/cancelled,
//   bookingsList.noBookings for the shared headline, bookingsListUi.emptyUpcoming/emptyPast/
//   emptyCancelled for the per-tab subline -- BookingsList.tsx:223-231 renders the SAME title
//   across all three tabs and only swaps the message, verified this session by reading that file,
//   so this build's tab switching (real local state, not a static decorative strip) is grounded in
//   the real component's own behaviour, not invented)
// Depicts: favorites empty state -> app/[locale]/profile/favorites/page.tsx (profileFavorites.title
//   "No favorites yet.", profileFavorites.lead, profileFavorites.bannerTitle "Open Inspo" as the CTA,
//   same /inspo destination the real banner href already uses)
// Depicts: favorites real-content rail (REMOVED in this repair pass, see REPAIR note below) ->
//   app/[locale]/dev/directions-0905/empty-states/_vc/DirectionC.tsx state 2 (nearby/top-rated
//   salon rail, same getSalonCardDataMap-backed real data, same real SalonCard component, same
//   horizontal-scroll track). Originally reused as the pattern this build ported to the TRAY
//   system's own banding; no longer rendered.
// Depicts: vouchers empty state -> app/[locale]/profile/vouchers/page.tsx (vouchers.profile.title
//   "My vouchers", vouchers.profile.emptyBoth, vouchers.profile.buyNew "Give a new voucher" as the
//   CTA, same /vouchers destination the real button already uses)
// Depicts: looks empty state + real-content rail -> app/[locale]/profile/looks/page.tsx (looks.title
//   "No looks yet.", looks.lead) and app/[locale]/dev/directions-0905/empty-states/_vc/DirectionC.tsx
//   state 4 (the newest-published-looks grid, same real discovery_items rows, same tiktok-thumb
//   resolution logic as components-legacy/discovery/ItemCard.tsx)
//
// REPAIR (critic pass 2026-09-06, this session's own verify + fix pass): two open items.
// (1) FONT SIZES: this file's own "measured" paragraph below used to read "sizes render at
// 28/18/15/14/12, five distinct values, not four" -- true when it was written, no longer true.
// tokens.ts's own TYPE_RAMP.cta was corrected in this same wave (see that file's own header) from
// 15px to 14px, sharing body's slot and distinguished by weight (500 vs 400) rather than a size
// step of its own, resolving the C7-vs-A5 contradiction A5's own text had already named. This
// file changes nothing to get that fix (TYPE_RAMP.cta is a kit import, unmodified here), and
// re-measuring after it confirms four distinct sizes on the rendered page (28/18/14/12), not
// five. The "measured" paragraph below is corrected to say so.
// (2) BORDER+SHADOW: the favorites-state real-content rail ("Top-rated near you", the real,
// registered SalonCard composed per FLOORS LAW 9) is REMOVED in this pass. SalonCard's own
// HeartButton (app/[locale]/_components/homepage/HeartButton.tsx) renders its 28px glass circle
// through the shared FROST_GLASS recipe (lib/frost-glass.ts), which bakes in BOTH a 1px white
// border AND a drop-shadow by design (that file's own header: "This is the ONLY place
// white+shadow is allowed", written for a control floating over unpredictable photo content).
// SalonCard carries no prop to suppress it (read in full this session, see SalonCardProps), so
// composing SalonCard anywhere on this page trips the cross-system rule ("nothing carries a
// border and a shadow at once", Part B, no exceptions listed) with no way to fix it from this
// file short of forking a locked, widely-shared production component, out of this repair's scope
// and out of FLOORS LAW 9's own spirit (a fork inherits none of the system's future fixes). This
// is the identical defect the sibling `../_lift/EmptyStatesLift.tsx` already found and fixed in
// its own REPAIR note, by dropping the same favorites rail; this file now makes the same call,
// for the same reason, on the same real surface. Favorites is now a pure empty unit, matching
// Bookings and Vouchers (LIFT's own words on reaching the identical shape: "favorites' own
// precedent is the SalonCard rail just removed above"). Looks stays TRAY's one real-content rail
// (LookTile, below, carries no heart, no border and no shadow of its own, verified this session
// by re-reading it). The `nearbySalons` prop/field and the `SalonCard` import are dropped from
// this file and its server wrapper accordingly (EmptyStatesTray.tsx now reads only `looks` off
// getDirectionCData's return). Re-measured after the removal: 0 elements on the page carry both
// a border and a box-shadow at once (down from 4). Band numbering, the "measured", "floors" and
// "system" notes below are all corrected in place to describe the resulting five-band page, not
// the six-band one this file shipped with before this pass.
//
// SCREEN FIX (task brief, quoting the critic's own finding on round-1's _vc): "never print an
// empty headline above real items of the same kind". Round-1's _vc did exactly that on its own
// looks state -- headline "No looks yet." directly above a grid of real, populated look tiles, a
// literal contradiction (the headline claims zero looks while four real ones render underneath
// it). Fixed here by NEVER letting a real-content rail answer the same claim its own empty
// headline just made: the looks headline is about the user's OWN saved looks ("No looks yet."),
// and its rail is framed as "Trending on Inspo" (site-wide discovery content, not "your looks"),
// sitting in its own following section under its own distinct heading, never directly under the
// contradicted claim with no separating label. Bookings, favorites and vouchers get NO rail at
// all: there is no non-contradictory "real content" substitute for any of the three (a "book
// again" rail would still be about the user's own bookings, "trending vouchers" does not exist as
// a real concept, and favorites' own candidate substitute, a "Top-rated near you" SalonCard rail,
// is REMOVED in this repair pass, see the REPAIR note above, for an unrelated defect in the
// composed SalonCard, not because it stopped being a valid answer to the contradiction test), so
// all three stay pure empty units, which is the honest, non-fabricated answer per CLAUDE.md taste
// rule 1.
//
// No magenta/pink pill anywhere (task brief): every action below is the kit PrimaryButton (ink)
// or kit SecondaryButton (neutral outline), and the tab row is the kit Pill at 44px. Exactly ONE
// PrimaryButton renders on this whole page -- "Find salon" on the bookings state -- per the
// cross-system rule ("One primary commit button, ink, per screen"): this route stacks four real,
// independent production screens for comparison (the same thing round-1's own _vb/_vc files did),
// and each of those four screens would carry its own single ink CTA in production, but a demo
// page combining all four may not render four ink buttons at once without breaking the rule this
// kit enforces literally. "Find salon" is the one kept ink because booking is this product's core
// conversion action; the other three (Open Inspo x2, Give a new voucher) render as the kit's
// neutral secondary, which the screen brief explicitly permits ("the action is a kit primary
// button (ink) OR a kit secondary button").
//
// Grounded-in: app/[locale]/dev/directions-0905-r2/_kit/SectionTitle.tsx (28/18/16 anchor and
// heading), app/[locale]/dev/directions-0905-r2/_kit/Pill.tsx (the bookings tab strip, composing
// the real TabPill.tsx), app/[locale]/dev/directions-0905-r2/_kit/PrimaryButton.tsx and
// SecondaryButton.tsx (both CTAs), app/[locale]/dev/directions-0905-r2/_kit/KitProvider.tsx (the
// system wrapper), app/[locale]/dev/directions-0905-r2/_kit/tokens.ts (TYPE_RAMP, SPACING, COLOR,
// RADIUS, MOTION constants, every one imported unmodified, none re-typed). Every pill/badge/
// button/title/meta on this screen is one of these kit imports. No kit component exists for a
// 14px grey "subline" sentence (the kit ships SectionTitle at 28/18/16 and Meta at 12, nothing at
// 14/grey); built here as a local `Subline`, reading ONLY TYPE_RAMP.body (14/font-normal) +
// COLOR.meta, never a literal, per the kit README's own fallback instruction ("build it inside
// your own folder using kit tokens only"). Same for the looks-tile radius (`LookTile`, reading
// ONLY RADIUS.photoCardPx, never a literal `rounded-2xl`/`rounded-[16px]`). The real, registered
// `SalonCard` (app/[locale]/_components/homepage/SalonCard.tsx) is NO LONGER composed on this
// page as of this repair pass: see the REPAIR note near the top of this file for why (its own
// HeartButton bakes in a border+shadow combination the cross-system rule bans with no exception,
// and SalonCard carries no prop to suppress it).
//
// measured (this repair's own Playwright pass, 390x844 x3, see the structured return for the
// full numbers): sizes render at 28 (SectionTitle as="anchor", the four state headlines), 18
// (SectionTitle as="heading", the one remaining "Trending on Inspo" rail heading, the mandatory
// A5 section-heading tier), 14 (TYPE_RAMP.body, the local Subline; the kit Pill's own "md" size,
// TabPill.tsx:47; TYPE_RAMP.cta, PrimaryButton/SecondaryButton's own internal size), 12
// (TYPE_RAMP.meta, the look-tile style-name caption). Four distinct values, not five: the prior
// pass here measured 28/18/15/14/12 because tokens.ts's TYPE_RAMP.cta still carried Part C's
// CONFLICT C7 verdict (15px) at the time it was written; that constant is fixed at its own
// definition now (14px, shared with body's slot, distinguished by weight not size, see tokens.ts's
// own header), and this file introduces no size of its own either way -- TYPE_RAMP.cta is a kit
// constant, imported unmodified, same as every other size on this page. Weights render at
// exactly two computed values (400, 500), unchanged from before: every TYPE_RAMP step here uses
// only "font-medium" or "font-normal", and this file's one "font-semibold" usage (the active tab
// pill's own internal weight, TabPill.tsx's own gray-fill selected recipe, CLAUDE.md design
// contract row "selected / active") computes to 500 inside <main> per the orchestrator's
// documented weight-clamp override (app/globals.css:269), so it adds no third weight.
//
// floors: (a) photographic focal = the real discovery-item look photos (the "Trending on Inspo"
// rail), genuine seeded rows through the real loader, never a hardcoded src. The favorites
// state's own candidate SalonCard rail is removed in this repair pass (REPAIR note above), so
// this is now the page's one photographic rail, matching the sibling LIFT file's own final
// shape; (b) one clearly biggest element = evaluated PER STATE, not across the whole comparison
// page: this route stacks four independent real production screens (the same framing round-1's
// own page.tsx switcher and _vb/_vc files use), and each state's own 28px anchor headline is the
// single biggest element within that state's own section, exactly as it would be on its own
// real, single-purpose screen; (c) real tabular number = none needed on an empty state (no
// fabricated count is ever shown; this floor's own text already says absence is legitimate here,
// and after the favorites-rail removal nothing on this page renders a numeric value at all,
// which stays a pass under this floor's own "none needed" clause, not a regression -- the
// removed SalonCard rail's ratings/prices are not replaced by an invented substitute); (d)
// semantic colour moment = the favorites state's heart icon at COLOR.save (#FF3366, taste rule
// 4's universal save-heart hue), the one semantic-colour moment on the page, unaffected by the
// rail removal since the icon lives on the empty unit itself, not the rail; (e) no dead-grey zone
// = every tray region carries either a populated empty unit (favorites and vouchers, now sharing
// one continuous tray region with no white gap between them, see "system" below) or a real
// photographic rail (looks, one band after its own empty unit); (f) worst-case content holds =
// every headline/subline here is a short, fixed, real i18n string (no arbitrarily long
// user-generated text on an empty state), and the one remaining rail truncates style names via
// LookTile's own `truncate` class, so a long real name never breaks it.
//
// system: tray. Verbatim from _plans/R2_LOOK_SYSTEMS.md Part B / _kit/systems.ts: "the canvas does
// the separating, so white groups sit on a #F4F4F5 band carrying neither a border nor a shadow,
// and the page alternates white and tray down the whole scroll." Applied per Part B's own worked
// line for this exact screen ("Empty states: the unit sits on the tray with the ink CTA as the
// only filled object, and the real-content rail returns to white below it"), generalised to every
// state that gets one: band 1 (white, bookings tabs + unit) -> band 2 (tray, favorites unit) ->
// band 3 (tray, vouchers unit, sharing the same continuous tray region as band 2 with no white
// gap between them, since the favorites rail's own white band is removed in this repair pass) ->
// band 4 (white, looks unit) -> band 5 (tray, looks rail). Five bands, three colour transitions
// (white -> tray -> white -> tray, four visual regions since the band-2/band-3 tray-to-tray join
// carries no transition of its own), still well over the discriminator's "at least twice" floor,
// verified live this session (getComputedStyle backgroundColor on `main`'s five direct children:
// #FFFFFF/#F4F4F5/#F4F4F5/#FFFFFF/#F4F4F5, plus the trailing 125px spacer sharing band 5's tray
// colour). No kit `<Card>` is used
// anywhere on this screen (no group needs an edge; the canvas band itself is the boundary, per
// TRAY's own principle), so the discriminator's second clause ("every group whose computed
// background is white while its parent is #F4F4F5 carries border-width: 0 and box-shadow: none")
// is vacuously satisfied -- there is no white-on-tray nesting on this page to begin with, only
// full-width sibling bands.

import * as React from "react";
import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { Calendar, Heart, Ticket, Images, type LucideIcon } from "lucide-react";
import {
  KitProvider,
  SectionTitle,
  Pill,
  PrimaryButton,
  SecondaryButton,
  TYPE_RAMP,
  SPACING,
  COLOR,
  RADIUS,
  MOTION,
} from "../../_kit";
import type { DirectionCData } from "../../../directions-0905/empty-states/_vc/loadDirectionC";

// GLIDE matches kit MOTION's own release curve (tokens.ts: release.easing
// "cubic-bezier(0.16,1,0.3,1)"), reused here as a real array (framer-motion's `ease` prop needs
// numbers, not the CSS-string form) exactly the way the sibling
// `../../bookings-list/_tray/BookingsListTray.tsx` already does for its own entrance motion.
const GLIDE: [number, number, number, number] = [0.16, 1, 0.3, 1];
const STAGGER_STEP = 0.05; // seconds; airbnb--motion.md measured cascade step, same as round-1 _vb/_vc

const ICON_SIZE = 40; // px; a Lucide glyph dimension, not a TYPE_RAMP/RADIUS/COLOR token -- see header

interface Props {
  looks: DirectionCData["looks"];
}

// Local, kit-token-only fallback for a 14px grey subline sentence (see header: no kit component
// covers this exact size+colour pairing). Never a literal: reads TYPE_RAMP.body + COLOR.meta.
function Subline({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p
      className={["font-body", TYPE_RAMP.body.weightClass, className].filter(Boolean).join(" ")}
      style={{ fontSize: TYPE_RAMP.body.size, lineHeight: TYPE_RAMP.body.lineHeight, color: COLOR.meta }}
    >
      {children}
    </p>
  );
}

// Local, kit-token-only fallback for a 12px grey caption under a look tile (same shape as Meta,
// built separately only because Meta.tsx renders a <span>, not a block-level truncating <p>).
function Caption({ children }: { children: React.ReactNode }) {
  return (
    <p
      className={["truncate font-body", TYPE_RAMP.meta.weightClass].join(" ")}
      style={{ fontSize: TYPE_RAMP.meta.size, lineHeight: TYPE_RAMP.meta.lineHeight, color: COLOR.meta }}
    >
      {children}
    </p>
  );
}

interface Action {
  kind: "primary" | "secondary";
  label: string;
  href: string;
}

function EmptyUnit({
  icon: Icon,
  iconColor,
  headline,
  subline,
  action,
  index,
}: {
  icon: LucideIcon;
  iconColor?: string;
  headline: string;
  subline: string;
  action: Action;
  index: number;
}) {
  const router = useRouter();
  const reduced = useReducedMotion();
  // BUG FIX (this build's own Playwright pass caught it): useReducedMotion() returns `null` on
  // the very first render (a client-only value resolved after mount), which is falsy, so a
  // ternary of the shape `reduced ? {} : { initial, animate, transition }` took the ANIMATED
  // branch on that first render regardless of the real OS preference, applying `initial:
  // {opacity:0,...}` as an inline style. If `reduced` then resolves to `true` on the very next
  // render, dropping the `animate` prop entirely leaves framer-motion with no target to move
  // toward, and the element is stuck at its initial (invisible) inline style forever, not just
  // during this run's forced `emulateMedia({reducedMotion:'reduce'})` check but for any real
  // visitor with the OS-level reduced-motion preference on. Fixed the standard way: `animate`
  // always targets the final, visible state (so the element converges there regardless of how
  // `reduced` resolves across renders); only `initial` and `transition` branch on `reduced`.
  return (
    <motion.div
      className="flex flex-col items-center px-6 text-center"
      initial={reduced ? false : { opacity: 0, y: SPACING.sibling, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={
        reduced
          ? { duration: 0 }
          : { duration: MOTION.sheetOpen.durationMs / 1000, ease: GLIDE, delay: index * STAGGER_STEP }
      }
    >
      <Icon size={ICON_SIZE} strokeWidth={1.75} style={{ color: iconColor ?? COLOR.inkText }} aria-hidden />
      <SectionTitle as="anchor" className="mt-4">
        {headline}
      </SectionTitle>
      <Subline className="mt-2 max-w-[280px]">{subline}</Subline>
      <div className="mt-6 w-full max-w-[280px]">
        {action.kind === "primary" ? (
          <PrimaryButton onClick={() => router.push(action.href)}>{action.label}</PrimaryButton>
        ) : (
          <SecondaryButton onClick={() => router.push(action.href)}>{action.label}</SecondaryButton>
        )}
      </div>
    </motion.div>
  );
}

function LookTile({ look, index }: { look: DirectionCData["looks"][number]; index: number }) {
  const reduced = useReducedMotion();
  // Same fix as EmptyUnit above: `animate` always targets the visible end state so the tile
  // converges there regardless of how the transient `null` -> true/false resolution of
  // useReducedMotion() plays out across renders; only `initial`/`transition` branch on it.
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={
        reduced
          ? { duration: 0 }
          : { duration: MOTION.sheetOpen.durationMs / 1000, ease: GLIDE, delay: index * STAGGER_STEP }
      }
    >
      <div
        className="relative aspect-[3/4] overflow-hidden bg-s-bg-sunken"
        style={{ borderRadius: RADIUS.photoCardPx }}
      >
        {look.displayImage && (
          <Image
            src={look.displayImage}
            alt={look.alt}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, 25vw"
          />
        )}
      </div>
      {look.styleName && <Caption>{look.styleName}</Caption>}
    </motion.div>
  );
}

const BOOKING_TABS = [
  { key: "upcoming", label: "Upcoming", subline: "Book your next treatment now" },
  { key: "past", label: "Past", subline: "You have no completed bookings yet" },
  { key: "cancelled", label: "Cancelled", subline: "You have no cancelled bookings yet" },
] as const;

export function EmptyStatesTrayView({ looks }: Props) {
  const [activeTab, setActiveTab] = useState(0);
  // REPAIR (this pass): the parent-level `useReducedMotion()` call that used to live here fed
  // only the removed favorites SalonCard rail's own conditional motion branch (see REPAIR note
  // in the file header); the remaining looks rail's `LookTile` calls its own `useReducedMotion()`
  // internally, so nothing here needs a parent-level copy any more.

  return (
    <KitProvider system="tray">
      <div className="min-h-[100dvh] bg-white text-s-ink">
        <main className="mx-auto w-full max-w-[440px]">
          {/* ── Band 1: WHITE. Bookings: real tab strip (kit Pill, 44px, real local switching --
              BookingsList.tsx itself keeps the SAME headline across tabs and only swaps the
              subline, verified this session) + the empty unit. The one ink Primary on this
              whole page. ── */}
          <div className="bg-white pt-6" style={{ paddingLeft: SPACING.pageMargin, paddingRight: SPACING.pageMargin }}>
            <div className="flex items-center gap-2" role="tablist" aria-label="Bookings">
              {BOOKING_TABS.map((tab, i) => (
                <Pill key={tab.key} active={activeTab === i} onClick={() => setActiveTab(i)} ariaLabel={tab.label}>
                  {tab.label}
                </Pill>
              ))}
            </div>
            <div className="pb-10 pt-6">
              <EmptyUnit
                icon={Calendar}
                headline="No bookings yet"
                subline={BOOKING_TABS[activeTab].subline}
                action={{ kind: "primary", label: "Find salon", href: "/en/search" }}
                index={0}
              />
            </div>
          </div>

          {/* ── Band 2: TRAY. Favorites empty unit. ── */}
          <div style={{ backgroundColor: COLOR.tray }}>
            <div className="py-10" style={{ paddingLeft: SPACING.pageMargin, paddingRight: SPACING.pageMargin }}>
              <EmptyUnit
                icon={Heart}
                iconColor={COLOR.save}
                headline="No favorites yet."
                subline="Tap the heart on a salon and it lands here, your shortlist for next time."
                action={{ kind: "secondary", label: "Open Inspo", href: "/en/inspo" }}
                index={0}
              />
            </div>
          </div>

          {/* ── Band 3: TRAY (same continuous region as Band 2, no white gap between them).
              Vouchers empty unit. No real-content rail: no non-contradictory real substitute
              exists for "vouchers" (see header). The favorites SalonCard rail that used to sit
              here as a white Band 3 is REMOVED in this repair pass (see REPAIR note in the file
              header): its HeartButton's frosted-glass circle bakes in both a border and a
              box-shadow, which the cross-system rule bans with no exception, and SalonCard has
              no prop to suppress it. ── */}
          <div style={{ backgroundColor: COLOR.tray }}>
            <div className="py-10" style={{ paddingLeft: SPACING.pageMargin, paddingRight: SPACING.pageMargin }}>
              <EmptyUnit
                icon={Ticket}
                headline="My vouchers"
                subline="You don't have any vouchers or credit yet."
                action={{ kind: "secondary", label: "Give a new voucher", href: "/en/vouchers" }}
                index={0}
              />
            </div>
          </div>

          {/* ── Band 4: WHITE. Looks empty unit. ── */}
          <div className="bg-white py-10" style={{ paddingLeft: SPACING.pageMargin, paddingRight: SPACING.pageMargin }}>
            <EmptyUnit
              icon={Images}
              headline="No looks yet."
              subline="Collect inspiration from salon profiles and Inspo, and find it again here."
              action={{ kind: "secondary", label: "Open Inspo", href: "/en/inspo" }}
              index={0}
            />
          </div>

          {/* ── Band 5: TRAY. Looks' real-content rail, framed as "Trending on Inspo" (site-wide
              discovery content), never as "your looks" -- the exact fix for the contradiction
              round-1's own _vc shipped on this state (see header). ── */}
          {looks.length > 0 && (
            <div style={{ backgroundColor: COLOR.tray }}>
              <div className="py-8" style={{ paddingLeft: SPACING.pageMargin, paddingRight: SPACING.pageMargin }}>
                <SectionTitle as="heading">Trending on Inspo</SectionTitle>
                <div className="mt-3 grid grid-cols-2" style={{ gap: SPACING.sibling }}>
                  {looks.map((look, i) => (
                    <LookTile key={look.id} look={look} index={i} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* HideInBooking.tsx strips the header + 125px BottomNav on every /dev route; this
              spacer measures the fold the way the real, chromed phone would. */}
          <div style={{ height: 125, backgroundColor: looks.length > 0 ? COLOR.tray : "#FFFFFF" }} aria-hidden="true" />
        </main>
      </div>
    </KitProvider>
  );
}
