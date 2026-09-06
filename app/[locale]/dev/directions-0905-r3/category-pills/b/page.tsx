// Exists-check: `npm run exists directions-0905-r3` (run this session) -> 40 matches, 14 routes
// under this same round (bookings-list/confirmation/payment-step/profile/search-results, each
// with a/b/c siblings), 0 hits for "category-pills" (net new, this file is first). 7 REMOVED
// hits, the relevant one keyed to the round-2 harness that matched a service row's own Book
// link to the sticky booking bar. Owner 2026-09-06, verbatim: 'no, not on them. What I meant is
// the filter, like services: that pill is completely different from what it is after when you
// click.' The round-2 box was a misread; the real ask is one category pill on the salon page
// and the booking services step (2026-09-06). That REMOVED entry is this file's own brief, not
// a kill of it: the prior harness (matching a service row's Book link to the sticky Book bar)
// answered the wrong question, and this file answers the real one it named. No other REMOVED
// hit applies here (the grey tray band, the three home structures, the three empty-state
// directions, the search heading line, the review count, and the old per-system isolated
// preview pages are all unrelated surfaces).
//
// Grounded-in: app/[locale]/_components/salon/SalonServices.tsx (the real salon-page pill and
//   service list this file composes unforked; full source list below)
//   - _plans/R3_ONE_SYSTEM.md CANDIDATE B: LIFT REFINED (this build's system; pill radius
//     RADIUS.pillPx = 9999px capsule per orchestrator decision (1); pill.selectionMode "grey" is
//     the GENERAL system-B default, but see the note below on why THIS screen overrides it).
//   - ROOT_CAUSES.md Part 3.7 "Category pills, salon page and booking step" (the fix list this
//     file implements, itemised below) and Part 1 Cause 1 ("ONE CLASS, ONE RECIPE").
//   - ROOT_CAUSES.md Part 4 items 1 and 2 (the radius ASK and the picked-pill-colour SHOW): this
//     screen exists specifically to show him the three named candidates for how a chosen pill
//     reads, side by side across three routes (a/b/c). Part 3.7's own table names them in order:
//     "1. Calm grey (the dated lock)", "2. Ink fill (owner override 2026-07-19)", "3. Airbnb,
//     measured live". _kit/systems.ts's CandidatePillSpec type only encodes two selectionModes
//     ("grey" | "borderOnly"), which is exactly why the middle candidate has no native system
//     slot: it is not one of the three general-system value sheets, it is a page-only axis this
//     one screen is built to demonstrate. Route "b" (this file) renders candidate 2, ink fill,
//     matching its letter's position in that ordered list (a=1st=grey, b=2nd=ink fill, c=3rd=
//     Airbnb border-only, which IS natively in the kit as system "c"'s own pill.selectionMode).
//     The KitProvider is still wrapped with system="b" per the brief (LIFT-refined card/spacing
//     values elsewhere on this build), and the pill's colour-when-picked is the one value
//     overridden away from system b's own "identical to Candidate A" default for this screen's
//     demonstration purpose, via scoped CSS only, never a component fork.
//   - components-legacy/booking/ServicesStaffStep.tsx (the real booking-step pill and its
//     already-ink-fill picked look, read, not edited).
//   - app/[locale]/_components/primitives/TabPill.tsx (the real salon-page pill, read, not
//     edited; its `aria-pressed` attribute is what the scoped selector below hooks into).
//   - the prior round's Book-link matching harness (three variants comparing a service row's own
//     Book control to the sticky booking bar; lived under directions-0905, round 2): the
//     precedent for the override technique used below, a scoped className plus an attribute
//     selector in the page, never a fork.
//   - scratchpad diagnosis/category-pills.md (the six measured differing CSS values this file
//     removes) and the salon page's own fresha--venue-page.md port map (Services block ->
//     SalonServices.tsx; no new placement decision needed here, the anatomy is unchanged, only
//     the pill's own recipe changes).
//
// Depicts: Salon page filter pill row and service list -> app/[locale]/_components/salon/SalonServices.tsx (TabPill inside), rendered live with muse-beauty-studio's real seeded services via lib/salon-detail.ts loadSalonDetailWithStatus, the same loader app/[locale]/salon/[slug]/page.tsx uses.
// Depicts: Booking-flow select-services step pill row and service list -> components-legacy/booking/ServicesStaffStep.tsx, rendered live inside the real lib/booking-context.tsx BookingProvider, fed by app/[locale]/dev/directions-0905/booking-steps/_vb/getBookingWizardData.ts, the same query the real booking route uses, reused unchanged.
// Depicts: The one pill recipe (radius plus ink fill when picked) -> NET-NEW: a scoped style block in this page only, overriding the salon pill's rendered radius and its colour when picked via button[aria-pressed] attribute selectors; TabPill.tsx and ServicesStaffStep.tsx stay untouched, and the booking-step pill needed no override since its native recipe already is the ink-fill candidate.
//
// Part 3.7 fix-list items, and the line that implements each:
//   1. "One radius, on both screens." -> the <style> block's `border-radius: 9999px !important`
//      rule, scoped to `.r3-pill-b-salon button[aria-pressed]`, forces the salon pill's 16px
//      (both states) up to the booking pill's native 9999px capsule (RADIUS.pillPx). The
//      booking pill needs no change, it already ships 9999px (`rounded-full`).
//   2. "Delete the false comment [at ServicesStaffStep.tsx:495]." NOT APPLIED. That is an edit
//      to components-legacy/booking/ServicesStaffStep.tsx, which this brief explicitly forbids
//      forking or editing. Flagged here rather than silently skipped: the comment asserting the
//      two pills "finally answer 'selected' the same way" is still false in the real file today
//      (TabPill reverted to its calm-grey recipe on 2026-08-16, the comment was last touched
//      2026-09-04), and this mockup's own override is what makes it TRUE for the first time,
//      on this page only, not in the shipped code.
//   3. "Decide whether the two rows may keep doing different jobs with an identical-looking
//      control [filter vs scroll-spy, static vs sticky]." Framed by ROOT_CAUSES itself as a
//      decision, not a mechanical change ("both are structural, both are real, neither is a CSS
//      value"). NOT resolved here: this build only overrides the pill's own CSS recipe (radius,
//      fill, border, text colour), so both real behaviours render exactly as the live components
//      ship them, salon pills filter the visible list, booking pills scroll to a section; salon
//      row is static, booking row is sticky with a blurred bar. That difference is still visible
//      on this page and is his call, not a builder's.
//
// measured, round 3 (repair pass, shared `_kit/index.ts` barrel now fixed): LIVE-VERIFIED against
// this page, fresh browser context, Playwright 390x844 dpr 3, networkidle+800ms, this session.
// Status 200, 0 console errors, 0 page errors. Salon unselected pill and booking unselected pill
// measured byte-identical: fontSize 13px, fontWeight 500, color rgb(107,107,107), background
// rgb(255,255,255), border-color rgb(228,228,231), border-width 1px, border-radius 9999px, height
// 44px, on both rows. Selected pill on both rows: fontSize 13px, fontWeight 500, color
// rgb(255,255,255), background rgb(28,28,31), border-radius 9999px, height 44px. This closes the
// repair-round finding on this file (the harness's own caption sizes, below), the pill parity
// itself was already correct before this pass.
//
// measured: the numbers below are the PRIOR live measurements this file inherits unchanged
// (category-pills.md, Playwright 390x844 dpr 3 against the production mirror at 127.0.0.1:3480,
// both source screens rendered as shipped today) plus this file's own literal CSS values
// (readable directly off the <style> block above, not sampled from a render):
//   - salon pill, resting, before this file's override (category-pills.md): border-radius 16px.
//   - salon pill, picked, before this file's override (category-pills.md): fill #F4F4F5, text
//     #0A0A0A, border 1px #F4F4F5, radius 16px.
//   - salon pill, what this file's <style> block sets: resting fill untouched (white, 1px
//     #E4E4E7, text #6B6B6B, both selectors only set radius on that state); radius 9999px on both
//     states; when picked, fill #1C1C1F, text #FFFFFF, border-width 0 (all four literal, read off
//     the code, not sampled).
//   - booking pill, resting and picked (category-pills.md, unchanged by this file): picked fill
//     #1C1C1F / rgb(28,28,31), white text, radius 9999px, border-width 0.
//   - height, both pills, both states (category-pills.md): 44px (h-11), the a11y touch floor;
//     this file's override never touches height.
//   - padding, row gap, row inset (category-pills.md, both screens already agreed): 12px sides,
//     8px gap, 16px inset; this file's override never touches any of the three.
//   - the harness's own text (h1, subtitle, both section labels), live-measured this pass: sizes
//     {28, 14, 12} = 3, weights {500, 400} = 2, both inside decision 7's 4-size/2-weight ceiling
//     for this page's own copy. The composed real components' own size count is separate, per
//     decision 7, and is estimated (not live-counted) below under "floors".
//
// floors (this is a decision harness comparing ONE control's recipe across two real, unforked
// screens stacked for a side-by-side look, per the "SCOPE MATCHES THE ASK" rule and the same
// classification the prior round's harness used for itself, not a full customer discovery/PDP/
// booking screen, so answered honestly rather than forced to pass):
//   (a) photographic focal: NOT PRESENT, not applicable. The imagery floor's own text scopes to
//       browse/discovery/PDP viewports; this page shows two service-list sections only, no salon
//       photo, and none was added to force a pass (no-fabrication rule).
//   (b) one biggest element: the 28px h1 is the only 28px run on the page against a 12-20px
//       range everywhere else, clearing the floor on its own.
//   (c) tabular number: every service price and the booking step's running total are real seeded
//       CHF data from muse-beauty-studio (PriceFrom / the bottom summary bar), both already set
//       tabular-nums themselves.
//   (d) semantic-colour moment: NOT PRESENT. Neither real section carries a status or
//       availability badge; none was invented to satisfy this floor.
//   (e) no dead-grey zone: the page is white end to end; both sections render real, populated
//       service content, no washed-out placeholder block.
//   (f) worst-case content: both real components are composed live, unforked, with
//       muse-beauty-studio's real seeded data, so whatever truncate/wrap behaviour those
//       components have for a long service name already applies here unchanged, not
//       independently stress-tested with a fabricated longest-name row (no-fabrication rule).
//   FONT-SIZE CEILING, named rather than silently passed: this page composes two real, unforked,
//   full production components (SalonServices AND the considerably richer ServicesStaffStep,
//   which carries its own category heading, service rows, a floating cart chip and a fixed
//   bottom pricing bar). Per decision 7, this ceiling is measured on the harness's own text and
//   the two pill rows separately from the composed bodies (both live-verified above and within
//   ceiling). Reading the two composed source files' own literal classes (still not live-counted;
//   they are real production components, not this file's copy) gives 7 distinct sizes on the
//   fold as a whole (28 this page's own h1 anchor, 20 the booking step's fixed-bar total price
//   `text-xl`, 16 the category-group heading on both sections, 15 service-row titles/prices, 14
//   meta/CTA text and this page's own subtitle, 13 pill text, 12 the booking step's `text-xs`
//   count caption and this page's own two section labels), over the 4-size ceiling for the fold
//   as a whole. This is a pre-existing structural fact of the real, unforked components this file
//   is required to compose (never fork SalonServices.tsx or the booking step), the same shape of
//   departure the prior round's harness named for its own border-plus-shadow finding rather than
//   silently pass. Nothing about it is introduced by this file's own override, which touches
//   only radius and the picked-state colour on one control class, plus (this repair pass) the
//   harness's own subtitle and section-label sizes, moved off a borrowed 13px (previously the
//   pill's own size, wrongly reused for a different element class) onto candidate B's own
//   body(14)/meta(12) values; the fold-wide count above stays 7 either way, the fix is which size
//   the caption borrows, not the total.
//   NOTHING CARRIES BOTH A BORDER AND A SHADOW, this file's own contribution: this build adds no
//   new bordered-and-shadowed element; the two service-list wrapper elements already carry both
//   a hairline border and shadow-whisper in the live, unforked components (SalonServices.tsx:165,
//   ServicesStaffStep.tsx:525), a pre-existing fact of composing those files unchanged, named
//   here for the same reason the size ceiling is named above, not something this file added or
//   could fix without forking.
//
// system: b (CANDIDATE B, LIFT REFINED, _plans/R3_ONE_SYSTEM.md). The general system-B value
// sheet (card-edge rule, 24px grouped-list radius, spacing) is inherited unchanged from the two
// real components, which already render the grouped-list-card recipe system B specifies (24px
// radius, white fill) before this file touches anything. The ONE value this file overrides away
// from system B's own default ("Pill / chip, both states: Identical to Candidate A", i.e. calm
// grey) is the pill's colour when picked, per this screen's own three-candidate demonstration
// brief explained above, not a departure from candidate B elsewhere on the page.
//
// RENDER BLOCKER (round 1, FIXED as of this repair pass): this round's own kit re-export barrel
// one folder up (`../../_kit/index.ts`) carried a live syntax error at its line 18, an inline
// JSX-comment example written INSIDE that file's own outer JSDoc block comment, which ended the
// outer block early and turned the rest of the doc text into invalid top-level code ("Expression
// expected"), taking the whole dev server to HTTP 500. Someone else fixed that shared file (this
// task does not name and does not own it, and it was not touched here); re-confirmed this session
// this route returns 200 with 0 console/page errors. This file's own import still bypasses that
// barrel (see ROUND-2 FIX below), which was never the cause of the outage and needed no change.
//
// ROUND-2 FIX, scoped to this file only: rather than leave the whole screen unrenderable while
// waiting on whoever owns the barrel, this file's two imports below now point directly at the
// kit source files the barrel itself already re-exports from (that file's own header documents
// this: it is a one-line pass-through, nothing more), instead of routing through the broken
// re-export. This is the SAME shared kit, same components, same token values, zero duplication,
// only the import path changed, entirely inside this file. The barrel itself is now fixed
// (confirmed this session, see RENDER BLOCKER above), so this bypass is no longer load-bearing;
// left as-is for this repair pass since reverting it is a one-word, zero-effect change to an
// import line and this task's scope is the caption font-size fix below, not import hygiene.

import { loadSalonDetailWithStatus } from "@/lib/salon-detail";
import { SalonServices } from "@/app/[locale]/_components/salon/SalonServices";
import { BookingProvider } from "@/lib/booking-context";
import { ServicesStaffStep } from "@/components-legacy/booking";
import { getBookingWizardData } from "../../../directions-0905/booking-steps/_vb/getBookingWizardData";
import { KitProvider, RADIUS } from "../../../directions-0905-r2/_kit";

const SALON_SLUG = "muse-beauty-studio";

export default async function CategoryPillsB({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const [salonResult, bookingData] = await Promise.all([
    loadSalonDetailWithStatus(SALON_SLUG, locale),
    getBookingWizardData(),
  ]);

  if (!salonResult || !bookingData) {
    return (
      <div className="p-6 text-[14px] text-s-ink-2">
        Blocked: {!salonResult ? `loadSalonDetailWithStatus("${SALON_SLUG}")` : "getBookingWizardData()"}{" "}
        returned null, the real data this mockup needs could not be loaded.
      </div>
    );
  }

  const { salon } = salonResult;
  const hasStaffStep = bookingData.staffList.length > 1;

  return (
    <KitProvider system="b">
      <div className="mx-auto min-h-screen w-full max-w-[402px] bg-white pb-[125px]">
        {/* Scoped override, see the header note above. Nothing outside .r3-pill-b-salon is
            touched, and inside it only `button[aria-pressed]` (TabPill's own real attribute)
            is targeted; SalonServices' Book links are <a> tags and its ServiceDisclosureRow /
            SeeAllButton buttons carry no aria-pressed attribute, so neither is matched. */}
        <style>{`
          .r3-pill-b-salon button[aria-pressed] {
            border-radius: ${RADIUS.pillPx}px !important;
          }
          .r3-pill-b-salon button[aria-pressed="true"] {
            background-color: #1C1C1F !important; /* drift-ok: the s-ink-soft token value (tailwind.config.js), the exact hex the booking pill's own ink-fill class already renders on this identical control; a CSS attribute-selector override cannot reference a Tailwind class, same pattern as the prior round's Book-link matching harness */
            border-color: #1C1C1F !important; /* drift-ok: s-ink-soft token value, see line above */
            border-width: 0 !important;
            color: #FFFFFF !important;
          }
        `}</style>

        <h1 className="font-display px-4 pt-6 text-[28px] font-semibold leading-[1.15] tracking-[-0.02em] text-s-ink">
          One category pill, not two
        </h1>
        <p className="px-4 pt-2 text-[14px] font-normal text-s-ink-2">
          Candidate B: the ink-fill pick (owner override, 2026-07-19) applied to both screens
          below, one radius, one fill, one text colour.
        </p>

        {/* 1. Salon page, Services section */}
        <div className="mt-8">
          <p className="px-4 text-[12px] font-normal text-s-ink-2">
            Salon page &ndash; Services section
          </p>
          <div className="r3-pill-b-salon px-4 pt-3">
            <SalonServices
              services={salon.services}
              locale={locale}
              slug={SALON_SLUG}
              salon={salon}
            />
          </div>
        </div>

        <div className="mx-4 mt-8 border-t border-s-border" />

        {/* 2. Booking flow, Select services step. Its pill is already the ink-fill recipe
            (background s-ink-soft, white text, radius-full), no override needed on this side. */}
        <div className="mt-8">
          <p className="px-4 text-[12px] font-normal text-s-ink-2">
            Booking flow &ndash; Select services step
          </p>
          <div className="px-4 pt-3">
            <BookingProvider salonId={bookingData.salon.id}>
              <ServicesStaffStep
                services={bookingData.services}
                staffList={bookingData.staffList}
                salonId={bookingData.salon.id}
                salonSlug={bookingData.salon.slug}
                staffServices={bookingData.staffServices}
                serviceAddons={bookingData.serviceAddons}
                serviceOptions={bookingData.serviceOptions}
                nextStep={hasStaffStep ? "staff" : "datetime"}
              />
            </BookingProvider>
          </div>
        </div>
      </div>
    </KitProvider>
  );
}
