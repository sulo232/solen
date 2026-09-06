// Exists-check: `npm run exists book button` -> one graveyard hit, unrelated (the map-preview
// "Book button" removed 2026-07-02 for mis-click risk; this is a different surface, the salon
// PAGE service row, not a map card, so it is not a re-proposal of that removal). No live "match
// the row Book to the bar Book" surface exists yet, so this is new: a comparison harness only,
// built on the real components below, nothing hand-drawn.
//
// Grounded-in: app/[locale]/_components/salon/SalonServices.tsx (the real service row + its
// "Buchen"/"Book" Link, rendered here unmodified three times with real data) composed via the
// same loader the real route uses, app/[locale]/salon/[slug]/page.tsx -> lib/salon-detail.ts
// loadSalonDetailWithStatus("muse-beauty-studio", locale). The reference button at the bottom
// reproduces app/[locale]/_components/salon/SalonMobileBookBar.tsx's Link className string
// (see note above that block) rather than importing the live component, because the live
// component: (a) portals to document.body and renders position:fixed, so it cannot sit
// "statically in the flow" on this page; (b) returns null until cookie consent is answered
// (SalonMobileBookBar.tsx:71, `!hasConsented`) and until a client mount flag flips, so this dev
// route would render nothing there on first load.
//
// REPAIR 2026-09-05 (open items 1-5): "classes copied verbatim so the pixels match" was false on
// two axes, both confirmed live and both fixed below. (a) `.bg-s-ink` does not compute to #0A0A0A
// at runtime: app/globals.css's owner-dated ink-fill/ink-text split (2026-08-15) redefines
// `.bg-s-ink { background-color: theme("colors.s-ink-soft.DEFAULT") }` to #1C1C1F, keeping
// #0A0A0A for TEXT only. Variant 3 below had hardcoded the text hex as a fill, so it did not
// match its own claimed recipe. (b) app/globals.css also has
// `main :is(.font-semibold, .font-bold) { font-weight: 500 }`, and this whole route renders
// inside app/[locale]/layout.tsx's <main id="main-content"> (no route-local layout overrides it),
// so the Reference block's font-semibold class was silently downgraded to 500 on this page even
// though the real, portaled SalonMobileBookBar sits outside <main> and stays at 600. The
// Reference block now carries an inline `style={{ fontWeight: 600 }}` to cancel that scoped
// override, since inline style always outranks a non-!important class selector; that is the
// smallest fix that keeps the block reference-only and does not touch the shared main-scoped rule
// (font weight demotion is an owner-approved, dated decision for real customer copy, see
// app/globals.css's "TWO TEXT WEIGHTS ON CUSTOMER SURFACES" note; this page's job is to show what
// the real button renders, not to inherit a rule meant for a different kind of text).
//
// Deviations: SalonServices exposes no prop to restyle its Book Link (see the component: the
// className is a literal string on the Link at SalonServices.tsx:250, no variant/className
// prop). Per the brief's fallback, variants 2 and 3 wrap the untouched live component in a
// scoped className ("r2-match-shape" / "r2-match-full") and override ONLY the Book anchor via
// an attribute selector (`a[href*="/booking?service="]`) in the <style> block below - the
// component itself is never forked or copied. The override uses !important because Tailwind's
// own arbitrary-value utilities (`text-[13px]`, `py-2`) sit at the same specificity tier as a
// plain class selector and source order is not something this wrapper controls; the scoped
// class keeps the blast radius to these three boxes only.
//
// measured: per-service Book link (Current, unmodified) via getBoundingClientRect/getComputedStyle at 390x844 dpr 3 -- 73.53px wide x 37.5px tall, white fill rgb(255,255,255), 1px hairline border rgb(228,228,231), 13px font-weight 500, 9999px border-radius, box-shadow none. This 37.5px height is a genuine production touch-target gap (LOCKFILE's 44px floor), surfaced here rather than fixed here: SalonServices exposes no prop to reach this anchor (see Deviations), so raising Current's own height would mean forking the live component, out of this pass's scope.
// measured: sticky-bar Book button via getComputedStyle (SalonMobileBookBar.tsx:80) -- full width, approx 50px tall (py-3.5 around a 15px line-height plus a 16px icon), ink FILL #1C1C1F / rgb(28,28,31) (`.bg-s-ink` resolves to the `s-ink-soft` token at runtime, not the #0A0A0A ink-TEXT hex; corrected 2026-09-05, was the stale reading that caused open item 1), white text, 15px font-weight 600, 9999px border-radius.
// measured: "Matched in shape"/"Matched in full" Book anchors, re-measured after this pass's
// kit-cta fix -- 83.95px wide x 44px tall (LOCKFILE touch-target floor, h-11, not the bar's
// 50px, since a row-sized control keeping the a11y minimum is what "row-sized height" means
// here), 14px font-weight 500 (TYPE_RAMP.cta; was 15px font-weight 600 before this pass),
// 9999px border-radius, box-shadow none. Shape: white fill rgb(255,255,255), 1px border
// rgb(228,228,231), text rgb(10,10,10). Full: fill rgb(28,28,31), border rgb(28,28,31), white
// text.
//
// A fresh Playwright pass at /en/dev/directions-0905-r2/salon-book-button (390x844, dpr 3)
// re-measures every Book button on THIS page; see the structured return value for that table.
//
// Depicts: the service row (name/duration/price/Book) -> app/[locale]/_components/salon/SalonServices.tsx (ServiceRow, rendered live 3x with muse-beauty-studio's real seeded services)
// Depicts: real service data -> lib/salon-detail.ts loadSalonDetailWithStatus, same call as app/[locale]/salon/[slug]/page.tsx
// Depicts: the sticky-bar Book button (reference row) -> app/[locale]/_components/salon/SalonMobileBookBar.tsx (className string reproduced verbatim; not the live portaled/consent-gated component, see above)
// Depicts: shape/fill overrides on the row's Book anchor -> NET-NEW: comparison-only CSS scoped to this dev route (.r2-match-shape / .r2-match-full), not present on any real surface
//
// REPAIR 2026-09-06 (open items 1-3): this file was missing the mockup-law floors/system lines
// (zero grep hits for either) and its bottom spacer was pb-16 (64px computed) against this
// round's required 125px bottom spacer (HideInBooking.tsx strips the real header + BottomNav on
// every /dev path, and every round-2 mockup restores that exact space so the fold measures like
// the real phone). All three fixed below, kit-only, structure and system unchanged.
//
// REPAIR 2026-09-06, second pass (open items 1-4): (1) "Matched in shape"/"Matched in full" had
// hand-written the row Book anchor's override at 15px/font-weight:600 in the <style> block below,
// a value that traced to nowhere in the kit (it was the STICKY-BAR's recipe, not a row-sized
// control's); the kit is law, so both now read TYPE_RAMP.cta.size (imported from
// "../_kit/tokens", interpolated into the CSS string below, currently 14) at font-weight 500,
// the kit's own cta step (TYPE_RAMP.cta: 14px, weightClass "font-medium", which computes to 500
// directly, no main-scoped clamp involved since the clamp only touches font-semibold/font-bold),
// still inside the 44px capsule height (LOCKFILE touch-target floor), which this pass already
// had right. (2) the Reference block below is deliberately
// NOT touched by this fix and does not import from the kit at all: its whole job is to depict the
// real, shipped SalonMobileBookBar recipe (15px/600) byte-for-byte, which is a different number
// on purpose, so nothing here claims that block is kit-composed; only the two row overrides read
// TYPE_RAMP. (3) the "system:" note below used to claim RULE; corrected to LIFT, see that block.
// (4) the Current section's real 37.5px-tall Book button (measured live, getBoundingClientRect,
// see the "measured" bullets below) is named explicitly as a genuine production touch-target gap
// this harness surfaces, not something to "fix" on this page, since SalonServices exposes no
// className/variant prop to reach it (see Deviations) and forking the live component is out of
// this pass's scope.
//
// floors: this is a decision harness comparing one component's button recipe across four states
//   (current / matched-in-shape / matched-in-full / the real reference), not a customer
//   discovery/PDP/booking screen, so answered honestly rather than forced to pass: (a)
//   photographic focal: NOT PRESENT and not applicable -- the imagery floor's own text scopes to
//   "browse/discovery/PDP" viewports; this page shows service rows only, no salon photo, and
//   none was added to force a pass (no-fabrication rule); (b) one biggest element: the 28px h1
//   ("Service row Book button") is the only 28px run on the page against a 13-15px body/label
//   range, clearing both the absolute floor and the 1.8x ratio floor on its own; (c) tabular
//   number: every service price rendered (3x per section x4 sections) is real seeded CHF data
//   from muse-beauty-studio via PriceFrom, which sets `tabular-nums` itself
//   (primitives/PriceFrom.tsx:29); (d) semantic-colour moment: NOT PRESENT -- this harness has no
//   status/availability/success element to carry one, and none was invented to satisfy this
//   floor; (e) no dead-grey zone: the page is white end to end with real service content in every
//   section, no washed-out placeholder block; (f) worst-case content: the real, unmodified
//   SalonServices component and its real seeded data are reused verbatim in all three sections
//   (no fork), so whatever truncate/wrap behaviour that live component has for a long service
//   name already applies here unchanged -- not independently stress-tested with a fabricated
//   longest-name row, per the no-fabrication rule.
//
// system: LIFT (RELABELED, second 2026-09-06 pass, open item 3; this block used to claim RULE).
//   verbatim from _plans/R2_LOOK_SYSTEMS.md Part B, SYSTEM 1 / _kit/systems.ts: "the lifted white
//   card is the only grouping device on the screen, so nothing carries a border and nothing
//   carries a hairline; a soft shadow and the gap between cards do all the work." The prior label
//   was RULE, whose own definition is "there is no card anywhere on the screen ... the hierarchy
//   is carried entirely by a big anchor sentence over a populated middle type tier" and whose
//   discriminator is "count(elements with a box-shadow) = 0" -- a claim this page could never
//   pass, since the composed, unmodified SalonServices list wrapper
//   (`<ul class="... rounded-[24px] border border-s-border ... shadow-whisper">`,
//   SalonServices.tsx:165) has always carried shadow-whisper on all three copies. That mismatched
//   discriminator claim is dropped here rather than repeated: LIFT is the closer label because a
//   shadow-led grouped-list card is exactly LIFT's own signature device (systems.ts "lift" note:
//   "card radius stays Solen's 16/24 ... shadow value stays shadow-whisper"), where RULE's
//   grouping device is a hairline-only network under a mandatory >=3-run 18px section-heading
//   tier, neither of which this harness has (no section headings; its four comparison captions
//   are 13px labels, since the screen's job is a component-level A/B/C/D comparison, not a
//   full-page composition in either system). Live-measured at 390x844 (getComputedStyle over
//   every element): 9 elements carry a box-shadow (the three SalonServices `<ul>` wrappers' own
//   shadow-whisper, pre-existing, reused verbatim per Grounded-in, not something this harness
//   composes or could remove without forking the live component), and those same 9 elements each
//   also carry a border. Departure from LIFT's own discriminator, named rather than silently
//   passed: LIFT's discriminator also requires "count(elements carrying BOTH border and shadow)
//   = 0" and a hairline ceiling of 1 per fold; this page fails both of those on the same
//   pre-existing fact (SalonServices.tsx:165's border+shadow combination, and the three
//   `border-t border-s-border` dividers this file draws between its own four sections at `mx-4`
//   16px inset). This is the one cross-system rule ("nothing carries a border and a shadow at
//   once") the page cannot honour while showing the real component unforked, same fact as before
//   the relabel, now stated against the correct system. The 28px h1 stays the page's one display
//   anchor per tokens.ts TYPE_RAMP.anchor / FLOORS LAW 6 -- that requirement is universal, not
//   tied to whichever system is named. All of this is a pre-existing structural fact this repair
//   pass leaves untouched (scoped to the four named open items only, not a system redesign or a
//   fork of the live SalonServices component).
//
// emphasis-ok: the reference block's font-semibold class is a byte-for-byte reproduction of the
// real sticky-bar button's class string (see Deviations above), not a styling choice; the inline
// fontWeight:600 next to it is a compensation for this route's own main-scoped CSS (see REPAIR
// note above), not a second weight decision, since it reproduces the same 600 the real button and
// this page's own r2-match-full override already use. The four comparison labels are font-normal,
// and the 28px title is the page's one display anchor.

import { ChevronRight } from "lucide-react";
import { loadSalonDetailWithStatus } from "@/lib/salon-detail";
import { SalonServices } from "@/app/[locale]/_components/salon/SalonServices";
import { TYPE_RAMP } from "../_kit/tokens";

const SALON_SLUG = "muse-beauty-studio";

export default async function SalonBookButtonDirections({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const result = await loadSalonDetailWithStatus(SALON_SLUG, locale);

  if (!result) {
    return (
      <div className="p-6 text-[14px] text-s-ink-2">
        Blocked: loadSalonDetailWithStatus(&quot;{SALON_SLUG}&quot;) returned null, the real
        salon row this mockup needs could not be loaded.
      </div>
    );
  }

  const { salon } = result;

  return (
    <div className="mx-auto min-h-screen w-full max-w-[402px] bg-white pb-[125px]">
      {/* Scoped overrides, see the "Deviations" comment above. Nothing outside
          .r2-match-shape / .r2-match-full is touched. */}
      <style>{`
        .r2-match-shape a[href*="/booking?service="],
        .r2-match-full a[href*="/booking?service="] {
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          height: 44px !important;
          padding: 0 24px !important;
          font-size: ${TYPE_RAMP.cta.size}px !important;
          font-weight: 500 !important;
        }
        /* #1C1C1F is .bg-s-ink's runtime computed background (the s-ink-soft token,
           app/globals.css "INK FILL vs INK TEXT" rule, owner 2026-08-15), not the #0A0A0A
           ink-TEXT hex; using the text hex here was open item 1's bug. */
        .r2-match-full a[href*="/booking?service="] {
          background-color: #1C1C1F !important;
          border-color: #1C1C1F !important;
          color: #ffffff !important;
        }
        .r2-match-full a[href*="/booking?service="]:hover {
          background-color: #000000 !important;
        }
      `}</style>

      <h1 className="font-display px-4 pt-6 text-[28px] font-semibold leading-[1.15] tracking-[-0.02em] text-s-ink">
        Service row Book button
      </h1>

      {/* 1. Current, untouched */}
      <div className="mt-8">
        <p className="px-4 text-[13px] font-normal text-s-ink-2">Current</p>
        <div className="pt-3">
          <div className="px-4">
            <SalonServices
              services={salon.services}
              locale={locale}
              slug={SALON_SLUG}
              salon={salon}
            />
          </div>
        </div>
      </div>

      <div className="mx-4 mt-8 border-t border-s-border" />

      {/* 2. Matched in shape: main button's type + corner + a row-sized 44px
          height (the a11y touch-target floor, LOCKFILE "touch target"), still
          a neutral white/hairline/ink outline. */}
      <div className="mt-8">
        <p className="px-4 text-[13px] font-normal text-s-ink-2">Matched in shape</p>
        <div className="r2-match-shape pt-3">
          <div className="px-4">
            <SalonServices
              services={salon.services}
              locale={locale}
              slug={SALON_SLUG}
              salon={salon}
            />
          </div>
        </div>
      </div>

      <div className="mx-4 mt-8 border-t border-s-border" />

      {/* 3. Matched in full: the main button's exact recipe at row size. */}
      <div className="mt-8">
        <p className="px-4 text-[13px] font-normal text-s-ink-2">Matched in full</p>
        <p className="px-4 pt-1 text-[14px] text-s-ink">
          Conflict: the contract allows one ink commit button per screen (CLAUDE.md taste rule
          3); this variant renders six.
        </p>
        <div className="r2-match-full pt-3">
          <div className="px-4">
            <SalonServices
              services={salon.services}
              locale={locale}
              slug={SALON_SLUG}
              salon={salon}
            />
          </div>
        </div>
      </div>

      <div className="mx-4 mt-8 border-t border-s-border" />

      {/* Reference: the main Book button, class string reproduced verbatim from
          SalonMobileBookBar.tsx (see the file-top note on why it isn't imported live). */}
      <div className="mt-8">
        <p className="px-4 text-[13px] font-normal text-s-ink-2">
          Reference: the main Book button
        </p>
        <p className="px-4 pt-1 text-[13px] text-s-ink-2">
          The className string below is the real SalonMobileBookBar.tsx recipe verbatim; the
          inline fontWeight cancels this route&apos;s inherited `main .font-semibold =&gt; 500`
          rule (app/globals.css) so this block renders the true 600 the portaled button carries
          outside &lt;main&gt;, instead of silently reading one weight lighter.
        </p>
        <div className="px-4 pt-3">
          <div
            className="font-body flex w-full items-center justify-center gap-2 rounded-full bg-s-ink py-3.5 text-[15px] font-semibold text-white transition-[colors,transform] hover:bg-black active:bg-black active:scale-[0.97] active:duration-[80ms] active:ease-glide"
            style={{ fontWeight: 600 }}
          >
            Book appointment
            <ChevronRight size={16} strokeWidth={1.9} />
          </div>
        </div>
      </div>
    </div>
  );
}
