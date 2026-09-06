// Exists-check: `npm run exists directions-0905-r3` (run this session) returned 7 REMOVED hits
// (grey-band tray look system, home A/B/C structures, the round-2 lift/rule/tray builds of this
// same screen family, a search heading line, a review count, an index switcher block, a
// service-row button harness -- see _design-system/REMOVED.md for the full detail; owner
// 2026-09-06 on this exact screen family: "ass, none of them, bro. What is that?"). No candidate
// C build of this screen exists anywhere. `npm run exists kit` -> the shared round-3 kit,
// imported below, never re-derived.
//
// Real-source: components-legacy/booking/BookingsList.tsx (bookingsList.noBookings copy key).
//
// Grounded-in: this cluster's anatomy and entrance motion are hand-adapted from round 2's own
// LIFT-system unit component for this same screen family (EmptyUnit.tsx / its screen wrapper,
// already cited by name in ./EmptyClusterC.tsx's own header) plus the placement/look captures
// under _design-system/references/: the Fresha zero-content capture (small icon, bold one-line
// headline naming the missing thing, grey subline, exactly one CTA, no card/border around the
// cluster, upper-third position), the Airbnb zero-content capture, and the Airbnb Trips-tab
// capture's own "Measured, zero-content states" section (the ghost-preview/card-stack-skeleton
// idea GhostContentPreview.tsx ports, and the ratios ROOT_CAUSES.md Part 1 Cause 3 cites off
// airbnb/CAPTURE.md Part B).
//
// Depicts: bookings condition with nothing in it → components-legacy/booking/BookingsList.tsx (real EmptyState call, bookingsList.noBookings / bookingsListUi.emptyUpcoming copy).
// Depicts: saved condition with nothing in it → app/[locale]/profile/favorites/page.tsx (real branch, profileFavorites.title / .lead / .bannerTitle copy).
// Depicts: search results condition with nothing in it → app/[locale]/_components/search/SearchTemplate.tsx (its own C1State/EmptyState function, generic-fallback branch, searchUi.emptyTitle / .emptyBody / .clearFilters copy).
//
// This page stacks all three on one scrollable document as a dev-only side-by-side comparison
// harness (not a real page structure any customer ever sees; each is independently a full real
// screen on its own real route).
//
// Grounded-in, copy (every string below is a real, currently-shipped copy key, none invented):
//   messages/en.json bookingsList.noBookings = "No bookings yet"; bookingsListUi.emptyUpcoming =
//   "Book your next treatment now"; searchUi.findSalon = "Find salon".
//   messages/en.json profileFavorites.title = "No favorites yet."; profileFavorites.lead = "Tap
//   the heart on a salon and it lands here, your shortlist for next time."; profileFavorites.
//   bannerTitle = "Open Inspo".
//   messages/en.json searchUi.emptyTitle = "No salons found."; searchUi.emptyBody = "Try another
//   city, another service or remove the filters."; searchUi.clearFilters = "Clear filters". The
//   real SearchTemplate.tsx generic-fallback branch renders emptyTitle plus the primary action
//   alone (no subline); this cluster pairs it with emptyBody, a real key from the SAME copy
//   namespace that the live component simply does not reach on this branch, to satisfy the locked
//   anatomy's mandatory subline (CLAUDE.md "states" row) without inventing a new string.
// The three real headline strings above carry inconsistent terminal punctuation (none / period /
// period): this is production copy exactly as it ships today, not altered here (altering it would
// be inventing copy), and is the same class of finding the round-3 diagnosis note for this screen
// family names elsewhere on it (Part 1 Cause 5), a copy-consistency item for whoever owns the
// strings, not something a mockup silently rewrites.
//
// ROOT_CAUSES.md Part 3.6 fix-list items applied here at the page level (component-level items are
// named in ./EmptyClusterC.tsx and ./GhostContentPreview.tsx's own headers):
//   1. one CTA treatment, 3 of 3 filled ink → every EmptyClusterC call below.
//   3. sunken tray per cluster → EmptyClusterC's own wrapper.
//   4. no bare Lucide glyph → GhostContentPreview.
// Cause 1 ("one class, one recipe") applied across all three: identical cluster component,
// identical spacing ladder, identical CTA treatment; the favorites cluster's heart accent is the
// one documented, named exception (GhostContentPreview.tsx's own header states the job it does).
// Cause 4 ("five gaps, no more"): the whole page draws from exactly four ladder values -- 12
// (headline-to-subline), 16 (icon-to-headline), 24 (subline-to-CTA and the tray's own side
// padding), 32 (the tray's own top/bottom padding and the gap between clusters).
//
// floors (the six-item finished pass, honestly answered per condition):
//   (a) photographic focal: this build's own FLOORS line names a screen with nothing in it yet as
//       exempt from the photo-share floor. No real photo exists for that condition; forcing one
//       would fabricate content. The ghost-preview's placeholder block is an illustration, not a
//       photograph, and is not offered as a substitute for this floor.
//   (b) one clearly biggest element: yes on every cluster, the 28px headline (SectionTitle
//       as="anchor") is the single largest text run; the ghost-preview block is the single
//       largest SHAPE.
//   (c) tabular/real number: genuinely absent, and forcing one would fabricate data (there is
//       nothing yet to count). Named as a gap, not faked, the same waiver hierarchy-density-04
//       already grants a below-floor real section.
//   (d) semantic-colour moment: the favorites cluster's heart accent, Solen's own locked save hue
//       #FF3366 (see GhostContentPreview.tsx's own header for why this one, not the achromatic
//       over-photo-control port).
//   (e) no dead-grey zone: each cluster's own #F4F4F5 tray panel sits on an otherwise pure-white
//       page, alternating white/tray/white/tray/white down the scroll; the page background itself
//       stays #FFFFFF end to end per candidate C's own "Page background" row.
//   (f) worst-case content: every string rendered is real, live, production copy (see the
//       Grounded-in block above), never a synthetic long placeholder; the longest headline
//       ("No favorites yet.") and longest subline ("Tap the heart on a salon and it lands here,
//       your shortlist for next time.") both sit inside the same 280px max-width column as the
//       shortest pair with no truncation, since this is a centred label stack, not a value column.
//
// measured: this route now renders (200), fixed by the round-3 fix pass this comment is part of.
// The blocker was the shared kit barrel (`_kit/index.ts`, one directory up, not owned by this
// file): a JSX-style comment `{/* exactly one candidate per screen */}` sat INSIDE its outer
// `/** ... */` block comment at line 18, whose embedded `*/` closed the outer comment early
// ("x Expression expected"), 500 on every route under directions-0905-r3, all three candidates,
// not just this screen family. The fix (applied by the fixer, one line, comment prose only, no
// exported value/token touched: `{/* exactly one candidate per screen */}` to `(exactly one
// candidate per screen)`) is outside this file's named scope, so it is reported here rather than
// claimed as this file's own change; it is the exact fix all three round-2 builders and the
// round-3 critic already named. Playwright at 390x844, dsf 3, networkidle+800ms, this session:
// tray `#F4F4F5`, radius 20px on both the tray and the ghost-preview photo block (matches
// candidate C's own card radius, no fifth radius value introduced); CTA fill `#1c1c1f`, text
// white, height 44px, radius 12px (rounded rect, not a capsule, per the 44px touch-floor override
// on Airbnb's 40px row) on 3 of 3 clusters (fix item 1); heart accent `#FF3366` fill / white
// stroke on the favorites cluster only; gap ladder measured exactly 12 (headline to subline), 16
// (ghost-preview to headline), 24 (subline to CTA, and the tray's own side padding), 32 (tray top/
// bottom padding, and cluster to cluster); visible text carries 2 sizes (28, 14) and 2 weights
// (400, 500), inside the 4-size/2-weight ceiling with room to spare (the `16px` webpack/next-dev
// script and skip-link chrome the DOM also reports is not visible page copy). Screenshots taken
// under this fixer pass sit in the round-3 mockup output folder, fold crop and full page.
//
// system: candidate C (_plans/R3_ONE_SYSTEM.md CANDIDATE C). <KitProvider system="c"> wraps the
// whole tree once; every kit component underneath reads its own candidate-C branch from there.

import { KitProvider } from "../../_kit";
import { EmptyClusterC } from "./EmptyClusterC";

export default function EmptyStatesCandidateCPage() {
  return (
    <KitProvider system="c">
      <div className="mx-auto flex w-full max-w-[560px] flex-col gap-8 bg-white px-4 py-6">
        <EmptyClusterC
          index={0}
          headline="No bookings yet"
          subline="Book your next treatment now"
          ctaLabel="Find salon"
          ctaHref="/en/search"
        />
        <EmptyClusterC
          index={1}
          headline="No favorites yet."
          subline="Tap the heart on a salon and it lands here, your shortlist for next time."
          ctaLabel="Open Inspo"
          ctaHref="/en/inspo"
          withHeartAccent
        />
        <EmptyClusterC
          index={2}
          headline="No salons found."
          subline="Try another city, another service or remove the filters."
          ctaLabel="Clear filters"
          ctaHref="/en/search"
        />
      </div>
    </KitProvider>
  );
}
