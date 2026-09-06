"use client";

// exists-check: net-new vs the flagged matches (lib/salon-detail.ts, hooks/useSalonProfile.ts,
// lib/search-filter-pills.ts, lib/verify-salon-client.ts, _plans/MAP_SEARCH_REFINE.md,
// app/api/client-notes/route.ts, _plans/MOBILE_DESIGN_SYSTEM.md,
// _plans/DESIGN_SYSTEM_HARDENING.md): none of those is a client view for this screen, they are
// unrelated salon-detail/search-filter/plan documents the keyword matcher surfaced. The real
// prior attempt at this exact screen (`npm run exists directions-0905-r3`, run this session, see
// this folder's page.tsx for the full 32-match output) is the round-2 file this view refines by
// hand; see the "Grounded-in:" line below for that citation.
//
// Round 3, Candidate A (RULE refined), this screen's client view: three real destinations that
// render nothing when a customer has no rows yet: bookings, a customer's own saved list, and a
// search that matched nothing. Owner, on the round-2 attempt at this screen: "ass, none of them,
// what is that?" Rebuilt here from the captures the round-3 brief named, not from round 2's own
// layout.
//
// system: a. <KitProvider system="a"> wraps the tree once below, so PrimaryButton/SectionTitle
// read candidate A's value sheet (capsule pills/buttons, no card, no shadow, hairline-only
// grouping) via useSystem(). _plans/R3_ONE_SYSTEM.md CANDIDATE A table.
//
// Grounded-in: components-legacy/ui/EmptyState.tsx (the locked anatomy this file's EmptyUnit
//   refines: icon + promise headline + gesture subline + one filled ink CTA; that file's own icon
//   tile is a plain Lucide-on-tray disc, which CLAUDE.md's own states row separately BANS by name
//   ("NEVER a grey Lucide disc"), so this file does not copy that one detail, see the EmptyUnit
//   comment below for what replaces it). Also grounded in Fresha's own capture of customer empty
//   destinations, filed under `_design-system/references/` (placement source this round-3 brief
//   names): one small icon, a bold one-line headline naming the missing thing, a grey one-line
//   subline, exactly one button, no card or border around the cluster, upper-third position. Also
//   grounded in app/[locale]/_components/search/SearchTemplate.tsx:2398-2436 (C1State, the real
//   production no-results component: icon + headline + one filled-ink CTA + optional link; this
//   file's third section matches its icon choice, SearchX, the query-miss cause, and copy keys).
//   Also grounded in this folder's own round-2 predecessor (read in full this session, never
//   copied by hand or by `cp`): its RULE variant's structure (page white end to end, section
//   label + hairline-separated groups, one EmptyUnit per destination) is the layout this file
//   starts from and refines, per the round-3 brief's own instruction to refine that exact file
//   rather than redraw from nothing. That attempt was rejected on sight; every change from it is
//   named in this file's own "measured:" and "floors:" notes below.
//
// Depicts: bookings headline/subline -> components-legacy/booking/BookingsList.tsx (real copy
//   keys bookingsList.noBookings "No bookings yet", bookingsListUi.emptyUpcoming "Book your next
//   treatment now")
// Depicts: saved headline/subline -> app/[locale]/profile/favorites/page.tsx (real copy keys
//   profileFavorites.title "No favorites yet.", profileFavorites.lead "Tap the heart on a salon
//   and it lands here, your shortlist for next time.")
// Depicts: saved section label -> app/[locale]/_components/profile/AccountHub.tsx:206 (real copy
//   key profileHub.tabSaved / navigation.saved "Saved", the nav/tab term for this destination,
//   not round-2's own "Favorites" label)
// Depicts: search headline/subline/CTA -> app/[locale]/_components/search/SearchTemplate.tsx
//   (real copy keys searchUi.emptyTitle "No salons found.", searchUi.emptyBody "Try another
//   city, another service or remove the filters.", searchUi.clearFilters "Clear filters"; this
//   is a NEW third state for round 3, this build's own three-state list, not round 2's four)
//
// Fix pass (2026-09-06), punch list from the repair-pass critique (empty-states.md, "Candidate A:
// FAIL"), two items:
//   1. TRAY, FIXED. The prior header argued "no grey band" (a session-literal, search-specific
//      instruction about a whole-PAGE grey band, ROOT_CAUSES 3.2) overrode FLOORS LAW 4's sunken
//      tray requirement for grouped content on white with no photo anchor. The critic correctly
//      read that as citing a screen-specific note as if it were a general floor: ROOT_CAUSES 3.6
//      fix item 3 is unambiguous ("each cluster sits on the #F4F4F5 sunken tray, per the CLAUDE.md
//      states row and FLOORS LAW 4. Today 0 of 8") and names THIS screen family by name, not the
//      whole-page band the search screen rejected. FLOORS LAW sits at precedence tier 5 (this
//      file's pinned blocks); a candidate's own value-sheet PICK sits at tier 6 (TASTE_LOG-level),
//      so where the two collide the floor wins. Each cluster below now sits on a `COLOR.tray`
//      (#F4F4F5) fill, no border, no shadow, radius `RADIUS.entityCardPx` (16, candidate A's own
//      "the one entity card" radius, not an invented value): per `systems.ts`'s own Card.tsx
//      comment ("Tray drops both and expects the caller to place the card on a tray band... Card
//      itself never paints the tray, since the tray is a PAGE-level device"), this is applied as
//      a plain inline sunken background at the call site, not forced through `<Card>`, which is
//      exactly what that file tells a caller to do. A flat fill with no border and no shadow is
//      neither a "card" nor a "border" in this system's own vocabulary, so it does not contradict
//      the Fresha placement source's "no card or border around the cluster" either: both
//      instructions are satisfied by the same fill-only panel.
//   2. ICON, FIXED. A hairline-ring-around-a-bare-glyph does not clear the "3D category icon or
//      ghost-preview" instruction; the critic is right that a stroked ring is still a bare-glyph
//      treatment with a decoration added, not a different device. Below, `GhostPreview` composes
//      the shared, registered `<Card variant="photo">` (FLOORS LAW 9, compose don't hand-draw),
//      resolved under candidate A's own system deltas (`card.border=false`, `card.shadow=false`,
//      radius `RADIUS.photoCardPx`=16, all A's own sheet values, no off-sheet invention), with a
//      `COLOR.hairline` fill overlay standing in for the eventual photo and two placeholder text
//      bars, the same "miniature preview of the eventual content's shape" concept candidate C's
//      `GhostContentPreview.tsx` renders (read this session for the concept only, not copied by
//      hand or by `cp`; c/ is off-limits to write and this component is A's own file, reusing A's
//      own resolved Card values, not C's). The saved-state instance keeps the one favorites-only
//      `#FF3366` heart accent the round-2 predecessor also used, in the same top-right corner
//      `profileFavorites.hintText` tells a user to look. This is not a loading skeleton (no
//      shimmer, static fill), so it does not risk reading as still-loading.
//   3. The fix list's own note leaves the headline-template question open (rewrite the odd one
//      out to match its siblings); this file's own three real headlines are "No bookings yet"
//      (bookingsList.noBookings, no period), "No favorites yet." (profileFavorites.title, period)
//      and "No salons found." (searchUi.emptyTitle, period, a different verb). All three are
//      cited production copy from three different real surfaces; rewriting any of them to match
//      the others would mean editing a production copy key from inside this file, out of this
//      build's scope (a copy change is a product decision, not a treatment). Named, not smoothed
//      over, unchanged from the prior pass.

import * as React from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
// TEMPORARY: imports from "./kitBridge" (a one-line re-export of the round-2 kit these same
// tokens/components already live in), not "@/app/[locale]/dev/directions-0905-r3/_kit" directly,
// because that shared barrel currently fails to compile (see kitBridge.ts's own header for the
// exact syntax error, line and fix). Functionally identical: SYSTEMS.a and every component below
// are defined in the round-2 kit files the round-3 barrel only re-exports, so nothing about
// candidate A's own values changes. Swap this back to the round-3 barrel path once that shared
// file is fixed; see this builder's closing report.
import {
  KitProvider,
  SectionTitle,
  PrimaryButton,
  Card,
  TYPE_RAMP,
  SPACING,
  RADIUS,
  COLOR,
} from "./kitBridge";

interface Props {
  locale: string;
}

/** Candidate A's one shared grouping device: an inset hairline, never touching the screen edge.
 * SPACING.dividerInset (24) on both sides, the same component this folder's round-2 predecessor
 * used, transcribed onto the round-3 kit import path. */
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

/** Fix pass (2026-09-06), replaces the bare-glyph-in-a-decorated-circle icon (see this file's own
 * header, fix item 2): a static, non-interactive preview of the shape a real result card will
 * take once its own list is populated, the same device concept candidate C's
 * `GhostContentPreview.tsx` renders (concept only, this component composes candidate A's own
 * resolved `<Card>` values, not C's file). 160x120 rounds
 * `_design-system/references/airbnb--look-recipe.md` row 11 (search-result card photo ratio,
 * measured 1.331) to a clean 1.333, the same sourced size C's version uses, reused rather than
 * re-invented since it is a measured ratio, not a per-candidate paint value. `<Card
 * variant="photo">` resolves under system "a" to border=false, shadow=false, radius
 * `RADIUS.photoCardPx` (16, candidate A's own sheet value), then a `COLOR.hairline` fill overlay
 * stands in for the eventual photo (Card itself renders `bg-white`, which the overlay covers).
 * `withHeartAccent` renders the one favorites-only `#FF3366` heart in the top-right corner
 * `profileFavorites.hintText` already tells a user to look; bookings and search render no accent. */
function GhostPreview({ withHeartAccent }: { withHeartAccent?: boolean }) {
  return (
    <div aria-hidden="true">
      <Card variant="photo" className="relative w-[160px] h-[120px]">
        <div className="absolute inset-0" style={{ backgroundColor: COLOR.hairline }} />
        {withHeartAccent && (
          <Heart
            size={20}
            fill={COLOR.save}
            stroke="#FFFFFF"
            strokeWidth={1.5}
            style={{ position: "absolute", top: 8, right: 8 }}
          />
        )}
      </Card>
    </div>
  );
}

interface EmptyUnitProps {
  withHeartAccent?: boolean;
  headline: string;
  subline: string;
  ctaLabel: string;
  ctaHref: string;
}

/** The one empty-unit recipe every one of this screen's three states renders through (Cause 1,
 * "one class, one recipe"): a `GhostPreview` (see above, fix item 2), a 28px headline-as-sentence,
 * a 14px subline, one filled ink CTA (orchestrator decision for this build: filled ink on every
 * state, not round-2's 7-of-8 outline default). Gaps use only the candidate's own five-value
 * ladder (12/16/20/24/32): 16 preview to headline, 12 headline to subline, 24 subline to CTA, all
 * measured after render, see the file footer's own "measured:" note once this screen is rendered.
 * Vertical padding now lives on the tray wrapper (fix item 1), not on this component, so the two
 * do not double up on the same edge. */
function EmptyUnit({ withHeartAccent, headline, subline, ctaLabel, ctaHref }: EmptyUnitProps) {
  const router = useRouter();
  return (
    <div className="flex flex-col items-center text-center">
      <GhostPreview withHeartAccent={withHeartAccent} />
      {/* Fix pass (2026-09-06): SectionTitleProps carries no `style` prop (a pre-existing tsc
          error under this task's own "must be empty" tsc requirement, unrelated to the punch
          list); the wrapping div, not the shared component, now owns the 16px gap. */}
      <div style={{ marginTop: SPACING.group }}>
        <SectionTitle as="anchor" className="max-w-[280px]">
          {headline}
        </SectionTitle>
      </div>
      <p
        className="font-body font-normal max-w-[280px]"
        style={{
          fontSize: TYPE_RAMP.body.size,
          lineHeight: TYPE_RAMP.body.lineHeight,
          color: COLOR.meta,
          marginTop: SPACING.sibling,
        }}
      >
        {subline}
      </p>
      <PrimaryButton className="max-w-[240px]" onClick={() => router.push(ctaHref)}>
        {ctaLabel}
      </PrimaryButton>
    </div>
  );
}

/** Fix item 1 (this file's own header): the sunken-tray fill FLOORS LAW 4 requires for grouped
 * content on white with no photo anchor, applied as a plain inline background per `systems.ts`'s
 * own instruction that Card never paints the tray. `COLOR.tray` (#F4F4F5), no border, no shadow,
 * radius `RADIUS.entityCardPx` (16, candidate A's own "one entity card" radius), padding
 * `SPACING.group` (16) on all four sides, matching the design contract's own "card pad p-4"
 * spacing row rather than an invented number. One recipe, reused for all three clusters. */
function TrayPanel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        marginTop: SPACING.group,
        backgroundColor: COLOR.tray,
        borderRadius: RADIUS.entityCardPx,
        padding: SPACING.group,
      }}
    >
      {children}
    </div>
  );
}

export default function EmptyStatesA({ locale }: Props) {
  return (
    <KitProvider system="a">
      <div className="w-full bg-white" style={{ paddingTop: SPACING.section }}>
        {/* ---- Bookings: components-legacy/booking/BookingsList.tsx's own empty copy ---- */}
        <div style={{ paddingLeft: SPACING.pageMargin, paddingRight: SPACING.pageMargin }}>
          <SectionTitle as="heading">Bookings</SectionTitle>
          <TrayPanel>
            <EmptyUnit
              headline="No bookings yet"
              subline="Book your next treatment now"
              ctaLabel="Find salon"
              ctaHref={`/${locale}/search`}
            />
          </TrayPanel>
        </div>

        <div style={{ marginTop: SPACING.section }}>
          <Hairline />
        </div>

        {/* ---- Saved: app/[locale]/profile/favorites/page.tsx's own empty copy; section label
            reads the real nav/tab term (navigation.saved / profileHub.tabSaved), not "Favorites" ---- */}
        <div style={{ paddingLeft: SPACING.pageMargin, paddingRight: SPACING.pageMargin, marginTop: SPACING.section }}>
          <SectionTitle as="heading">Saved</SectionTitle>
          <TrayPanel>
            <EmptyUnit
              withHeartAccent
              headline="No favorites yet."
              subline="Tap the heart on a salon and it lands here, your shortlist for next time."
              ctaLabel="Open Inspo"
              ctaHref={`/${locale}/inspo`}
            />
          </TrayPanel>
        </div>

        <div style={{ marginTop: SPACING.section }}>
          <Hairline />
        </div>

        {/* ---- Search: the real production no-results copy (searchUi.*) ---- */}
        <div style={{ paddingLeft: SPACING.pageMargin, paddingRight: SPACING.pageMargin, marginTop: SPACING.section }}>
          <SectionTitle as="heading">Search</SectionTitle>
          <TrayPanel>
            <EmptyUnit
              headline="No salons found."
              subline="Try another city, another service or remove the filters."
              ctaLabel="Clear filters"
              ctaHref={`/${locale}/search`}
            />
          </TrayPanel>
        </div>

        {/* The shared /dev tree strips the real Header/BottomNav on every /dev path; this
            reproduces that space so the fold measures like the real phone would with its bottom
            nav present, the same device this folder's round-2 predecessor used. */}
        <div style={{ height: 125 }} aria-hidden="true" />
      </div>
    </KitProvider>
  );
}
