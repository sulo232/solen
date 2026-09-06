// Exists-check: `npm run exists directions-0905-r3` (run this session) returned 41 matches: 7
// graveyard hits (none of them a category-pills build; the newest one is the owner's own dated
// correction of a prior round's mis-scoped service-row-button comparison, saying the real ask is
// one category pill on the salon page and the booking services step, which is exactly this file),
// 15 sibling candidate routes, 2 page-section hits and 17 sibling components, none of them a
// category-pills surface. No existing category-pills route or component anywhere in the scan;
// this is net-new. Full graveyard text: `_design-system/REMOVED.md`, most recent entry.
//
// Grounded-in: app/[locale]/_components/salon/SalonServices.tsx (the salon page's real services
// section, read in full, composed unmodified below via its own real props) and
// components-legacy/booking/ServicesStaffStep.tsx (the booking flow's real services step, read in
// full lines 1-640, composed unmodified below, never forked or edited). Also read in full:
// app/[locale]/_components/primitives/TabPill.tsx (the salon page's real pill primitive, for its
// `aria-pressed` attribute and its shipped radius/fill/text values, never edited);
// _design-system/references/fresha--venue-page.md, "Measured" item 6, a Services heading followed
// by a horizontal category chip row, first chip selected, rest outline (the placement authority
// for where this control sits relative to the services list on both screens); _plans/
// R3_ONE_SYSTEM.md CANDIDATE A table, "Pill / chip, unselected/selected" rows; and the round-3
// arbiter's diagnosis of this exact pair of pills (the measured 6-CSS-value drift this build
// removes) plus its per-screen fix list and open-decisions section (orchestrator decision (1):
// pill radius = the candidate's own sheet value, not re-asked here).
//
// Depicts:
//   - the salon page services section + its filter pill row -> app/[locale]/_components/salon/
//     SalonServices.tsx, composed live via loadSalonDetailWithStatus("muse-beauty-studio", locale),
//     the SAME loader app/[locale]/salon/[slug]/page.tsx uses. Renders the real TabPill primitive
//     unmodified except for a scoped corner-radius override (see the <style> block below).
//   - the booking step services section + its category pill row -> components-legacy/booking/
//     ServicesStaffStep.tsx, composed live via getBookingWizardDataA() (REUSED, not re-declared:
//     the same real loader that already fetches this identical seed salon for a sibling booking
//     demo one directory up), wrapped in the real <BookingProvider>. Renders the component's own
//     hand-written pill unmodified except for a scoped selected-state colour override.
//   - page-level anchor + section labels -> plain JSX below, matching the shared kit's own
//     documented anchor/meta values exactly (see the import-site note for why these are not
//     imported this round).
//
// THE OWNER ON THIS SCREEN (orchestrator brief, verbatim): "the filter, like services, they're all
// on other colors when you select that one. That pill is completely different from what it is after
// when you click." Both real screens below render the identical selected/unselected recipe.
//
// PER-SCREEN FIX LIST (the arbiter's diagnosis for this pair, one line each):
// 1. ONE RADIUS ON BOTH SCREENS: 9999px capsule (orchestrator decision (1) for this build, candidate
//    A's own sheet value). The booking step's hand-written pill already ships `rounded-full`
//    (9999px) and needs no radius change. Only the salon page's shared TabPill (16px, the
//    2026-08-16 lock) is overridden, via `.cp-a-salon button[aria-pressed]` in the <style> block
//    below, WITHOUT touching TabPill.tsx (29 files import it; a source edit was also out of scope,
//    the brief bars it explicitly).
// 2. A STALE PARITY COMMENT lives at ServicesStaffStep.tsx line 495, asserting the booking pill
//    already shares TabPill's token, which stopped being true three weeks before that comment's own
//    last-touched date. It is NOT edited here: the brief bans touching that file. Flagged in this
//    build's closing report instead of silently fixed.
// 3. WHETHER THE TWO ROWS MAY KEEP DOING DIFFERENT JOBS (the salon pill FILTERS and hides
//    non-matching rows; the booking pill SCROLLS to a section and hides nothing; one row is sticky
//    with a blurred bar, the other is not) is named in the diagnosis as structural and real, and
//    left exactly as it renders on each screen: not something a CSS override should paper over or
//    a mockup should silently decide.
//
// SELECTED-STATE CANDIDATE (the diagnosis's three-column table): this route renders column 1,
// "calm grey, the dated lock" -- fill #F4F4F5, text #0A0A0A, border 1px #F4F4F5 (matches fill), no
// bold -- on BOTH screens. The salon page's TabPill already ships this recipe verbatim (only its
// radius moves, see fix 1); the booking step's hand-written pill is overridden from ink-fill/
// white-text to this same recipe via `.cp-a-booking button[aria-pressed="true"]` in the <style>
// block below. Sibling routes for this same screen render the other two columns (an ink-fill
// selected state per the 2026-07-19 owner override, and an Airbnb-measured border-only state).
//
// system: a (CANDIDATE A, RULE refined, _plans/R3_ONE_SYSTEM.md). Pill radius 9999px capsule and
// selected fill #F4F4F5 / text #0A0A0A / border 1px #F4F4F5 are candidate A's own "Pill / chip" rows
// -- identical to what TabPill already ships (systems.ts SYSTEMS.a.candidate.pill: selectionMode
// "grey", unchanged from the prior round). No KitProvider wraps this page this round, see the
// import-site note below for why; the page-level anchor and section labels are still written to
// candidate A's own type ramp values by hand. The two real pill components are composed unmodified
// except for the scoped CSS named above, per the brief's "never fork or edit" instruction. No card,
// no shadow, no tray band anywhere on this page
// (candidate A's own container rule: none, inset hairlines and gap only) -- the only chrome is the
// one hairline between the two screen sections and the two real components' own borders/shadows
// (SalonServices' grouped-24 card, ServicesStaffStep's grouped-24 card and sticky bottom bar),
// which are the DEPICTED components' own shipped chrome, not something this candidate route adds.
//
// deviations, named rather than silently substituted:
// 1. The booking step's real "Continue" bottom bar and its "N selected" scroll-back pill are both
//    `position: fixed` (ServicesStaffStep.tsx:555, :571), which is how the component behaves
//    everywhere it is used, including a prior round's booking-steps demo that already embeds this
//    same component inside a larger dev page. Embedded here below the salon-page section, the
//    fixed bar pins to the bottom of whatever the browser viewport shows, exactly as it does in
//    production; this build does not suppress or reposition it.
// 2. Neither real section carries photography in its own anatomy (a service row is name + duration
//    + price text, per the Fresha venue-page reference; photos live in the salon page's hero
//    section, out of this section's scope per the brief's own section boundary and per the
//    scope-matches-the-ask rule). The imagery floor is exempted here for the same reason it exempts
//    forms/checkout: this is a component-level comparison of a section that itself carries no
//    photographic focal in the real product, not a browse/discovery screen. Not silently skipped,
//    named again in "floors" below.
//
// measured: BLOCKED, not run this session, said plainly rather than presented as verified. This
// worktree's dev server currently returns 500 on EVERY route, including the app's own homepage,
// not only this one: confirmed live this session on /en/dev/directions-0905-r3/category-pills/a,
// two sibling round-3 routes, and plain /en. Every one throws the identical build error, sourced
// to the same shared file (quoted verbatim in this build's closing report). That file sits outside
// this builder's writable scope, was already broken before this file was written (its content was
// read unchanged earlier this session), and this builder does not run `next dev` / kill / restart
// the shared server per the hard bans. So the numbers below are read directly off source, not off
// a render, and are named as such:
//   Salon page pill row (.cp-a-salon): TabPill.tsx ships unselected as white fill, 1px #E4E4E7
//   border, 13px/500 (computes 500 inside <main>, globals.css) text #6B6B6B, height 44px (h-11),
//   radius 16px (rounded-[16px]); selected as fill/border #F4F4F5, text #0A0A0A, same size/weight/
//   height. The override in the <style> block above sets border-radius: 9999px on both states via
//   `button[aria-pressed]`; every other value is untouched source, not overridden.
//   Booking step pill row (.cp-a-booking): ServicesStaffStep.tsx ships both states at height 44px
//   (h-11), radius 9999px (rounded-full), 13px font-semibold (computes 500 inside <main>);
//   unselected as white fill, 1px #E4E4E7 border, text #6B6B6B; selected as ink fill #1C1C1F
//   (the same ink-fill token the design contract's dated 2026-07-19 booking override names), no
//   border, white text. The override sets selected fill/border to #F4F4F5, border-width 1px solid,
//   text #0A0A0A via `button[aria-pressed="true"]`; unselected and the radius are untouched source.
//   Read this way, both rows land on the same 6 values this build set out to unify (radius,
//   selected fill, selected border colour, selected border width, selected text colour, and the
//   font-weight computation, which globals.css already equalises), and the two named structural
//   differences (filter-vs-scroll, sticky-vs-not) are untouched, per fix 3 above. This is a
//   source-level claim, not a rendered one, until the shared server is fixed and this route can
//   actually be loaded, screenshotted and measured with Playwright as the brief requires.
//
// re-checked, fixer round, this session: `curl -s -o /dev/null -w "%{http_code}"` against this
// route and plain /en both still return 500, identical ModuleBuildError, still sourced to
// `_kit/index.ts:18` (the JSX comment `{/* exactly one candidate per screen */}` sitting inside
// the file's own outer `/** ... */` doc comment, closing it early). `npx tsc --noEmit -p .` run
// fresh this session returns 46 errors, all 46 on lines 18-26 of that same file, zero in this
// page.tsx or its two sibling candidates' page.tsx files. No screenshot exists yet at
// public/_mockups/directions-0905-r3/category-pills-a.png or -fold.png (checked this session,
// directory listing empty for this surface) because the route has never once rendered. This
// builder's own values above (the CSS override literals and the source-level pill measurements)
// were independently re-checked against `_plans/R3_ONE_SYSTEM.md` Candidate A's own "Pill / chip"
// rows (lines 37-38: unselected white/#E4E4E7/13px/500/#6B6B6B/44px/9999px; selected
// fill/text/border #F4F4F5/#0A0A0A/#F4F4F5, no bold) this session and match byte for byte; nothing
// in this file changed as a result, because nothing in it was found wrong. `_kit/index.ts` is
// still not edited here: it sits outside this route's folder and the fixer brief names it
// off-limits the same way the original brief did. Still BLOCKED, not fixed, not routed around.
//
// floors: the six-item finished-screen pass, argued from source per the "measured" note above
// (the shared server is down, so nothing here was confirmed by eye or by Playwright this session).
//   (a) photographic focal -- NOT PRESENT, and named rather than silently skipped: neither real
//       section this build composes carries a photo in its own anatomy (see deviation 2). This is
//       a component-level comparison of the services list + its pill row, not a browse/discovery
//       screen; the exemption is the same shape the floor already grants forms/checkout/receipts.
//   (b) exactly one element clearly biggest -- the 28px page anchor over a 12-14px body/meta field
//       clears the ratio, and within each real section the service name (14px/500) is the
//       section's own biggest text, matching both components' shipped hierarchy.
//   (c) at least one tabular/real number -- real CHF prices and real minute durations from the
//       live seeded muse-beauty-studio service rows on both screens (never invented); the booking
//       step's bottom bar also renders a real tabular running total (CHF 0 with an empty cart, the
//       true first-load state, not fabricated).
//   (d) at least one semantic-color moment -- NOT PRESENT, named rather than silently skipped: a
//       plain (non-discounted, non-rated) service row carries no semantic-colour element in either
//       real component's own shipped anatomy (no star, no success/warning tint); a sibling
//       section's discount tag is out of this build's scope.
//   (e) no dead-grey zone -- page is white end to end; each real section's own grouped-24 card
//       (white, bordered, whisper shadow) is the only fill either component ships, and this route
//       adds no additional grey band.
//   (f) worst-case content holds -- both sections render the real, unmodified components, so their
//       own shipped truncation/wrap rules apply exactly as they do in production; no long-content
//       case was fabricated or altered by this build.

import { loadSalonDetailWithStatus } from "@/lib/salon-detail";
import { SalonServices } from "@/app/[locale]/_components/salon/SalonServices";
import { getBookingWizardDataA } from "@/app/[locale]/dev/directions-0905/booking-steps/_va/getBookingWizardDataA";
import { BookingProvider } from "@/lib/booking-context";
import ServicesStaffStep from "@/components-legacy/booking/ServicesStaffStep";
// BLOCKED, not routed around by touching anything outside this folder: the shared kit barrel this
// page would otherwise import KitProvider/SectionTitle/Meta from currently fails to compile (its
// own header nests a JSX-style comment inside its outer doc comment, closing that doc comment
// early, so the dev server throws "Expression expected" on the very next line); see this build's
// closing report for the exact error and file. That barrel sits outside this builder's writable
// scope. A same-content import straight from the underlying kit module one round back was also
// attempted and is refused by this repo's own automated content check on this file (it flags any
// literal mention of that round's path segment regardless of context, including a plumbing import
// to a live, non-removed module, and the fix for that check is not this builder's to make either).
// So this page renders its two small page-level text elements as plain JSX below, matching that
// kit's own documented values exactly rather than importing either component: the anchor at
// 28px/font-medium/1.15 line-height, the section labels at 12px/font-normal/1.35 line-height/
// #6B6B6B, both read from that kit's tokens module earlier this session.

const SALON_SLUG = "muse-beauty-studio";

export default async function CategoryPillsCandidateA({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const [salonResult, bookingData] = await Promise.all([
    loadSalonDetailWithStatus(SALON_SLUG, locale),
    getBookingWizardDataA(),
  ]);

  if (!salonResult) {
    return (
      <div className="p-6 font-body text-[14px] text-s-ink-2">
        Blocked: loadSalonDetailWithStatus(&quot;{SALON_SLUG}&quot;) returned null, the real salon
        row the salon-page half of this mockup needs could not be loaded.
      </div>
    );
  }

  if (!bookingData) {
    return (
      <div className="p-6 font-body text-[14px] text-s-ink-2">
        Blocked: getBookingWizardDataA() returned null, the real salon/services/staff rows the
        booking-step half of this mockup needs could not be loaded. See the server console for the
        query that failed.
      </div>
    );
  }

  if (bookingData.services.length === 0) {
    return (
      <div className="p-6 font-body text-[14px] text-s-ink-2">
        Blocked: {SALON_SLUG} has no active services right now, so the booking step's category
        pill row has nothing to render.
      </div>
    );
  }

  const { salon } = salonResult;

  return (
    <div className="mx-auto min-h-dvh w-full max-w-[402px] bg-white pb-24">
        {/* Scoped overrides, see the header comment's "PER-SCREEN FIX LIST" above. Nothing outside
            .cp-a-salon / .cp-a-booking is touched, and neither TabPill.tsx nor
            ServicesStaffStep.tsx is forked or edited. */}
        <style>{`
          .cp-a-salon button[aria-pressed] {
            border-radius: 9999px !important; /* fix 1: one radius, the candidate's own capsule value */
          }
          .cp-a-booking button[aria-pressed="true"] {
            background-color: #F4F4F5 !important; /* calm-grey selected fill, the dated lock */
            border-width: 1px !important;
            border-style: solid !important;
            border-color: #F4F4F5 !important; /* border matches fill, same as the salon page's TabPill */
            color: #0A0A0A !important;
          }
        `}</style>

        <div className="px-4 pt-6">
          <h1
            className="font-heading font-medium text-s-ink"
            style={{ fontSize: 28, lineHeight: 1.15 }}
          >
            One category pill, both screens
          </h1>
          <p className="mt-2 font-body text-[14px] text-s-ink-2">
            Same control, same job: choosing a service category. Selected and unselected render
            identically below on both real screens.
          </p>
        </div>

        <div className="mt-8">
          <span
            className="block px-4 font-body font-normal"
            style={{ fontSize: 12, lineHeight: 1.35, color: "#6B6B6B" }}
          >
            Salon page, Services section
          </span>
          <div className="cp-a-salon mt-3 px-4">
            <SalonServices
              services={salon.services}
              locale={locale}
              slug={SALON_SLUG}
              salon={salon}
            />
          </div>
        </div>

        <div className="mx-4 mt-10 border-t border-s-border" />

        <div className="mt-8">
          <span
            className="block px-4 font-body font-normal"
            style={{ fontSize: 12, lineHeight: 1.35, color: "#6B6B6B" }}
          >
            Booking step, Services
          </span>
          <div className="cp-a-booking mt-3">
            <BookingProvider salonId={bookingData.salon.id}>
              <div className="px-4">
                <ServicesStaffStep
                  services={bookingData.services}
                  staffList={bookingData.staffList}
                  salonId={bookingData.salon.id}
                  salonSlug={bookingData.salon.slug ?? SALON_SLUG}
                  staffServices={bookingData.staffServices}
                  serviceAddons={bookingData.serviceAddons}
                  serviceOptions={bookingData.serviceOptions}
                  nextStep={bookingData.staffList.length > 1 ? "staff" : "datetime"}
                />
              </div>
            </BookingProvider>
          </div>
        </div>
      </div>
  );
}
