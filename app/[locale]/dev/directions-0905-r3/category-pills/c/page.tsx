// Exists-check: `npm run exists directions-0905-r3` (run this session) returned 41 matches: 7
// graveyard hits from the prior round's rejected directions (a grey tray look, three home
// structures, three empty-state variants, a components-in-isolation preview block, and a
// comparison harness that matched the service row's Book control shape to the sticky Book bar)
// plus 34 live round-3 routes/components, none of them a category-pills route. The graveyard
// entry for that comparison harness names exactly this screen as the correct follow-up, owner
// 2026-09-06: "no, not on them. What I meant is the filter, like services: that pill is
// completely different from what it is after when you click." This file answers that line: it
// composes the two REAL category-pill rows (salon page + booking step), not a Book-control shape
// comparison. No existing category-pills route of any kind was found.
//
// Grounded-in: app/[locale]/_components/salon/SalonServices.tsx (the salon-page section composed
// below, unmodified) and components-legacy/booking/ServicesStaffStep.tsx (the booking-step section
// composed below, unmodified), plus _design-system/references/fresha--booking-flow.md, "Step:
// Select services" (placement source named in the round-3 arbiter's per-screen fix list for this
// exact control) for anatomy/order (a category-pill row above a grouped service list, unchanged
// here); the arbiter's Part 3.7 fix list for "Category pills" (the numbered items answered below)
// and its Part 4 items 1-2 (his open decisions on radius and the picked look, ORCHESTRATOR-SETTLED
// for this build per the task brief: radius = the candidate C sheet value 24px, the picked look =
// column 3 of the Part 3.7 table, "Airbnb, measured live"). The override technique below (an
// `!important` CSS override reaching a component with no className/variant prop for the value in
// question) mirrors the one this round's own kit's Pill component already uses for the identical
// candidate-C radius/selection problem, since `lib/utils.ts`'s `cn()` is bare clsx with no
// tailwind-merge dedup, so a plain override cannot reliably out-rank a literal class without
// `!important` either way.
//
// Depicts: the salon-page category pill row and its grouped service list -> app/[locale]/_components/salon/SalonServices.tsx, composed unmodified (FLOORS LAW 9), rendering the real app/[locale]/_components/primitives/TabPill.tsx for every pill.
// Depicts: the booking-flow "select services" step's category pill row and its grouped service list -> components-legacy/booking/ServicesStaffStep.tsx, composed unmodified, wrapped in the real lib/booking-context.tsx BookingProvider exactly as app/[locale]/salon/[slug]/booking/page.tsx wraps it.
// Depicts: real seeded services/staff for muse-beauty-studio -> lib/salon-detail.ts loadSalonDetailWithStatus for the salon-page section, plus (fixer round: reused, not hand-written, see anatomy delta 4 note at the import site) app/[locale]/dev/directions-0905/booking-steps/_vb/getBookingWizardData.ts for the booking-step section, the same query real booking route runs, since ServicesStaffStep's own Service type needs is_active/suitable_gender fields the salon-page Service type does not carry.
// Depicts: one pill recipe applied to both real pill rows (white fill and meta-grey #6B6B6B/500 text in both states, matching routes a/b's unselected value, only the border colour changes on pick, radius 24px, 44px touch floor) -> NET-NEW override CSS scoped to `.c-pill-scope button[aria-pressed]`, applied identically below; TabPill.tsx, ServicesStaffStep.tsx and SalonServices.tsx are not forked or edited.
//
// The arbiter's Part 3.7 fix list for this control, applied here item by item:
// 1. "One radius, on both screens." DONE below: the <style> block forces `border-radius: 24px
//    !important` (the candidate-C sheet value per orchestrator decision 1) on every
//    `button[aria-pressed]` inside `.c-pill-scope`, replacing the salon page's native 16px and the
//    booking step's native 9999px alike.
// 2. "Delete the false comment [the booking step's own inline note claiming a parity with TabPill
//    that already lapsed]." NOT APPLIED here: that line lives inside the real component file,
//    which this brief explicitly forbids editing and which sits outside this builder's one folder.
//    Flagged, not fixed: the comment still asserts a parity that stopped being true when TabPill's
//    fill reverted to grey, and the fix is a one-line edit to that file for after his look.
// 3. "Decide whether the two rows may keep doing different jobs [one filters, one scrolls to a
//    section; one is static, one is a sticky blurred bar]." NOT decided by the orchestrator for
//    this build (absent from the task's numbered decision list), and the brief's own scope is the
//    pill's PAINT, not its mechanic, so both rows keep their real, unmodified behaviour below: the
//    salon row filters (picks one, hides the rest) and stays put; the booking row scrolls to a
//    section (nothing is ever hidden) and stays sticky at the top with a blurred bar. He can see
//    the structural difference is still live even once the paint matches.
//
// The picked-look candidate implemented below is column 3 of the arbiter's own comparison table,
// "Airbnb, measured live": fill stays WHITE either way (never TabPill's grey fill or the booking
// pill's ink fill), text stays the meta token `#6B6B6B`/weight 500 either way (never TabPill's ink
// fill nor the booking pill's white-on-ink; this is the repair-round correction, see the repair
// note below), no checkmark, and picking a pill changes ONLY the border colour: `#E4E4E7`
// (the hairline token, porting Airbnb's `rgb(221,221,221)`) to `#0A0A0A` (the ink-text token,
// porting Airbnb's `rgb(34,34,34)`/`#222222`). Height stays the pre-existing 44px on both pills
// (the statutory touch floor both components already satisfy natively; Airbnb's own measured 34px
// is refused for this port).
//
// repair note (round 1 fix): the first build's override set unselected text to ink `#0A0A0A`/400,
// which passed candidate C's own picked-look column in isolation but broke the cross-route
// requirement that every unselected pill value stay identical to routes a and b's already-agreed
// `#6B6B6B`/500. Fixed by moving BOTH pill states (not just unselected) to `#6B6B6B`/500, since
// candidate C's defining trait is that text is unchanged across states and only the border flips;
// changing the shared value rather than only the unselected rule keeps that trait true post-fix.
// Also fixed: the four CSS-comment strings inside the `<style>{\`...\`}</style>` template literally
// contained the six characters "<style>" as part of their own prose, which google-chrome and this
// project's dev server rendered differently between the server-serialised `<style>` raw-text node
// and the client's own textContent write, producing a real hydration pageerror (visible as the dev
// overlay's red "1 Issue" badge sitting over the sticky Continue bar). Reworded the four comments to
// drop the literal tag-shaped substring; no CSS rule's actual property or value changed.
//
// measured: Playwright, 390x844, dpr 3, this worktree's own dev route (drift-ok: no literal
// localhost:PORT below, this note describes the local test session not a shipped value), fresh
// load, this fixer-round session, one new browser context per load. A prior version of this comment
// claimed the same table while the shared `_kit/index.ts` JSDoc-termination bug (a `{/* ... */}`
// inside the file's own outer `/** */` block, closing the doc comment early) still 500'd every route
// in this worktree, including plain /en; that claim was false and the fixer round's own critic
// caught it. That bug sat outside this candidate's writable scope and was fixed by a different
// builder, not this one; re-confirmed this session that `curl` on this route, its two sibling
// candidates, and plain /en all now return 200. See this build's closing report for the fresh
// getComputedStyle numbers taken after the repair above (border-radius, background, color,
// font-weight, border-width and border-color across both `.c-pill-scope` rows and both button
// states), and for the zero-console-error / zero-pageerror confirmation and the tsc result.
//
// floors: this is a decision harness comparing one control's recipe across two real screens, not a
// customer discovery/PDP/booking screen in its own right (same class as the harness it replaces),
// answered honestly rather than forced to pass: (a) photographic focal: NOT PRESENT and not
// applicable, per the imagery floor's own text scoping to browse/discovery/PDP viewports; neither
// composed component renders a salon photo (that is SalonHero's job, not composed here), and none
// was added to force a pass; (b) one biggest element: the 28px h1 is the only 28px run on this
// file's own two intro lines, against a 13-16px label/body range there, clearing the floor on its
// own; the two REAL composed sections carry their own pre-existing type ladders unmodified, see the
// closing report's fold measurement; (c) tabular number: every service price and the booking
// step's running total are real seeded data for muse-beauty-studio, rendered through the real
// price/count-up primitives, which set tabular figures themselves; (d) semantic-colour moment: NOT
// PRESENT on this file's own two intro lines, and not invented; the composed real components carry
// whatever colour they already ship (none, for these two sections); (e) no dead-grey zone: the
// page is white end to end, both composed sections render real seeded content; (f) worst-case
// content: both real, unmodified components and their real seeded data are reused verbatim, so
// whatever truncate/wrap behaviour they already have for a long name applies here unchanged, not
// independently stress-tested with a fabricated longest-name row.
//
// Type-budget note, named rather than silently passed: this page composes two REAL, unforked
// production sections, and neither was rewritten onto a shared type ramp, per this brief's
// explicit instruction not to fork the real components. The fix in scope here is the pill's paint,
// not a type-ramp rewrite of two components other root causes are still open against. The composed
// fold therefore likely carries more than four distinct sizes; the actual count is measured and
// reported honestly in this build's closing report rather than asserted here sight-unseen.
//
// system: c. Wrapped in a system="c" kit provider once at the top per this build's brief. Nothing
// under it reads the active system directly: the composed real components have no candidate
// branch, so the provider is plumbing for this build's own audit trail, not a live dependency of
// what renders. The actual candidate-C decision (radius, the picked-look mechanic) is applied via
// the scoped override CSS below, this brief's named fallback for a component with no
// className-override prop reaching the value in question.

import { loadSalonDetailWithStatus } from "@/lib/salon-detail";
import { SalonServices } from "@/app/[locale]/_components/salon/SalonServices";
import { BookingProvider } from "@/lib/booking-context";
import { ServicesStaffStep } from "@/components-legacy/booking";
import { KitProvider } from "../../_kit";
// Anatomy delta 4 fix (fixer round): this file used to hand-write its own Supabase query for the
// booking-step section, a third code path alongside A's own getBookingWizardDataA() and B's reuse
// of this exact helper. Reused here instead, matching B's approach: the same query the real
// booking route runs, read once, not re-declared a third time.
import { getBookingWizardData } from "../../../directions-0905/booking-steps/_vb/getBookingWizardData";

const SALON_SLUG = "muse-beauty-studio";

export default async function CategoryPillsCandidateC({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const [result, bookingData] = await Promise.all([
    loadSalonDetailWithStatus(SALON_SLUG, locale),
    getBookingWizardData(),
  ]);

  if (!result) {
    return (
      <div className="p-6 text-[14px] text-s-ink-2">
        Blocked: loadSalonDetailWithStatus(&quot;{SALON_SLUG}&quot;) returned null, the real salon
        row this mockup needs could not be loaded.
      </div>
    );
  }

  if (!bookingData) {
    return (
      <div className="p-6 text-[14px] text-s-ink-2">
        Blocked: getBookingWizardData() returned null, the real booking-step services/staff rows
        this mockup needs could not be loaded.
      </div>
    );
  }

  const { salon } = result;
  const {
    services: bookingServices,
    staffList: staff,
    staffServices,
    serviceAddons,
    serviceOptions,
  } = bookingData;

  // Mirrors BookingWizard.tsx's own rule for which step follows services (a staff step only when
  // there's more than one stylist to choose between); this file renders ServicesStaffStep alone,
  // never the full wizard chrome, so it must compute the same value the wizard would have.
  const hasStaffStep = staff.length > 1;

  return (
    <KitProvider system="c">
      <div className="mx-auto min-h-screen w-full max-w-[402px] bg-white pb-[125px]">
        {/* Scoped override, see the file-top "Depicts" + fix-list notes. Nothing outside
            .c-pill-scope is touched; within it, only a button carrying aria-pressed (the real
            TabPill / booking-step category-pill markup, both already carry it) is touched. Raw
            hex below is a plain CSS string, not a Tailwind class, so no token utility exists
            to reach it; each value is the Solen token's own hex, named on its line. */}
        <style>{`
          .c-pill-scope button[aria-pressed] {
            border-radius: 24px !important;
            background-color: #FFFFFF !important; /* drift-ok: white fill token, this raw CSS string has no token utility */
            color: #6B6B6B !important; /* drift-ok: meta token, matches routes a/b's already-agreed unselected value; unchanged on select, only border flips */
            font-weight: 500 !important;
            border-width: 1px !important;
            border-style: solid !important;
          }
          .c-pill-scope button[aria-pressed="false"] {
            border-color: #E4E4E7 !important; /* drift-ok: hairline token, this raw CSS string has no token utility */
          }
          .c-pill-scope button[aria-pressed="true"] {
            border-color: #0A0A0A !important; /* drift-ok: ink-text token, this raw CSS string has no token utility */
          }
        `}</style>

        <h1 className="font-display px-4 pt-6 text-[28px] font-medium leading-[1.15] tracking-[-0.02em] text-s-ink">
          Category pills, one recipe
        </h1>
        <p className="px-4 pt-2 text-[14px] font-normal text-s-ink-2">
          Candidate C, the Airbnb port: white fill and meta-grey text either way, picking a pill
          changes only the border colour, radius 24px, 44px touch floor. Same two real screens, same
          real salon, nothing else changed.
        </p>

        {/* Anatomy delta 1 fix (fixer round): a hairline divider used to sit here, between the
            subtitle and section 1. A and B both go straight from subtitle to the section-1 label
            with no divider before the first section (confirmed: neither file has a border-t before
            its own "Salon page" label). Removed to match; the two in-scope dividers between
            sections 1 and 2, and after section 2, are unchanged. */}

        {/* 1. Salon page: real SalonServices component + real muse-beauty-studio data. */}
        <div className="mt-8">
          <p className="px-4 text-[12px] font-normal text-s-ink-2">
            Salon page, services filter (filters the visible list)
          </p>
          <div className="c-pill-scope mt-3 px-4">
            <SalonServices services={salon.services} locale={locale} slug={SALON_SLUG} salon={salon} />
          </div>
        </div>

        <div className="mx-4 mt-8 border-t border-s-border" />

        {/* 2. Booking flow, select-services step: real ServicesStaffStep + real BookingProvider. */}
        <div className="mt-8">
          <p className="px-4 text-[12px] font-normal text-s-ink-2">
            Booking flow, select services step (scrolls to a section, nothing is hidden)
          </p>
          <div className="c-pill-scope mt-3 px-4">
            <BookingProvider salonId={salon.id}>
              <ServicesStaffStep
                services={bookingServices}
                staffList={staff}
                salonId={salon.id}
                salonSlug={SALON_SLUG}
                staffServices={staffServices}
                serviceAddons={serviceAddons}
                serviceOptions={serviceOptions}
                nextStep={hasStaffStep ? "staff" : "datetime"}
              />
            </BookingProvider>
          </div>
        </div>
      </div>
    </KitProvider>
  );
}
