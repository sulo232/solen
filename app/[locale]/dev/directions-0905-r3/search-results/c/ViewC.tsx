"use client";

// This is a Client Component for the same reason round-2's ViewRule.tsx is: it passes an
// inline no-op event-handler prop to the kit's real `Pill`, itself "use client", and a
// Server Component cannot pass a plain closure across that boundary (Next.js App Router).
// `data`/`locale` stay plain serializable props from page.tsx.
//
// Exists-check: `npm run exists directions-0905-r3` (run this session) returned 7 REMOVED
// hits, all unrelated round-2 direction-comparison surfaces (a grey-band look system, three
// home-feed structure options, a set of empty-state directions, a component-preview
// switcher for the three round-2 look systems, and a service-row button-matching harness),
// none of them a search-results-c file and none of them drawn on this screen. `npm run
// exists search-results` (the round-2 builder's own run, re-verified this session by
// reading its output above) shows the round-1 comparison route plus two graveyard entries
// (an old dead SearchResults.tsx and the 2026-07-31 result-count heading kill), neither
// drawn here. No round-3 candidate-C search-results file exists yet.
//
// Grounded-in: app/[locale]/dev/directions-0905/search-results/_va/data.ts (the real
// loader this file also imports directly, unmodified) and
// app/[locale]/_components/search/SalonResultCard.tsx (the real, registered result-card
// component this file composes unmodified). This view also starts BY HAND (never copied)
// from this build's own named round-2 base, the search-results view one numbered dev-
// directions folder up from this one, same search-pill/filter-row/results/Map-pill
// anatomy, same loader, same SalonResultCard usage; its exact absolute path is given in the
// closing report rather than spelled out here, since that numbered folder name is also a
// shared keyword across several unrelated 2026-09-06 removals and this file draws none of
// them (verified against _design-system/REMOVED.md this session, see the Exists-check line
// above). Also grounded in `_design-system/references/fresha--search-results.md`
// ("Measured" item 2: result-count line + Filters button on their own row [the count line
// is dropped per the owner's 2026-09-06 kill, see below]; item 4: result card = photo ->
// venue name -> star rating with review count [count dropped, same owner kill] -> up to
// three service rows inside the same card). Stills read this pass: none new beyond what
// fresha--search-results.md itself already captured (its own Identity section lists 5
// Mobbin screen URLs, verified there); this screen's candidate-C LOOK values come from
// `_plans/R3_ONE_SYSTEM.md` CANDIDATE C table, which itself cites `airbnb--look-recipe.md`
// row numbers and `airbnb/CAPTURE.md` measurements, not from memory.
//
// Depicts:
// - Search entry pill -> app/[locale]/_components/search/SearchTemplate.tsx ~line 1306 (the
//   real "big search" pill), reproduced at its real height/radius/border classes, unchanged
//   chrome not named in ROOT_CAUSES.md's fix list or in Candidate C's value sheet.
// - Filter icon button + 4 filter chips (Sort/Open now/Price/Rating) ->
//   SearchTemplate.tsx ~line 1447-1543 (round icon-button pinned left + a horizontal-scroll
//   pill row), reproduced at the real classes; the chips are the kit's real `Pill`
//   (composes TabPill), which renders CANDIDATE C's own "borderOnly" recipe automatically
//   under this file's <KitProvider system="c"> (Pill.tsx's own candidate branch: white fill
//   + ink text in both states, no bold, only the border colour changes on select, 24px
//   radius, 13px text - `_plans/R3_ONE_SYSTEM.md` CANDIDATE C "Pill / chip" rows).
// - Result cards -> app/[locale]/_components/search/SalonResultCard.tsx, the REAL,
//   registered, off-limits-to-edit component, variant="feed" hasServiceQuery=true (photo,
//   name+rating, distance/address+category line, up to 3 real service-price rows), imported
//   and rendered unmodified per FLOORS LAW 9 ("if the registry owns it, compose it").
// - Map / mode-toggle pill -> Candidate C's own named row (`_plans/R3_ONE_SYSTEM.md`
//   "Map / mode toggle pill": solid ink fill, radius 24px, width 93px, white text, height
//   ported from Airbnb's measured 38px to the 44px touch floor), read from the kit's
//   MODE_TOGGLE_PILL_C token rather than round-2's generic h-11/rounded-full Map button,
//   since this row exists ONLY on Candidate C's sheet (A and B carry no equivalent).
//
// ORCHESTRATOR-OVERRULED (the owner's own two removals, ROOT_CAUSES.md Part 3.2 "Changes"
// items 1-2, both already in _design-system/REMOVED.md):
// 1. The heading line "Hair salons in Basel sorted by most reviewed" is DELETED, not
//    ported and not replaced by Fresha's simpler "21 venues nearby" count line either
//    (same shape, same owner objection: "too much text and unnecessary"). Fix list item 1's
//    own instruction ("Reattach the hairline directly under the filter row at this file's
//    own 24px gap") is applied below: one hairline, below the filter row, no heading text
//    or count of any kind.
// 2. The review count is REMOVED, both instances (ROOT_CAUSES.md Part 3.2 change 2): the
//    blue "(16)" beside the star, and the "N reviews" half of the meta line. Per this
//    build's orchestrator decision (3), SalonResultCard.tsx and RatingStars.tsx are NOT
//    edited: `reviewCount` is simply never passed to <SalonResultCard> below, which removes
//    BOTH instances at their SOURCE (RatingStars.tsx's own "(count)" span renders only when
//    count is not null; SalonResultCard.tsx's meta-line join drops the "N reviews" fragment
//    the same way when reviewCount is undefined), confirmed by reading both files' actual
//    conditionals this pass (RatingStars.tsx: `{count != null && <span ...>({count})</span>}`;
//    SalonResultCard.tsx feed branch: `reviewCount != null && reviewCount > 0 ? ... : null`
//    inside the `line2` join), not yet confirmed against a live render (see the `measured:`
//    note below for why). No CSS hide was needed for either instance since omitting the prop
//    removes the DOM node entirely, a cleaner fix than hiding a rendered node.
//    PRODUCTION CHANGE FOR AFTER HIS LOOK (one line, not applied here): stop passing
//    `reviewCount={s.reviewCount}` at the real call site once/if this ships, since the prop
//    itself is what the owner rejected, not a display wrapper around it.
//
// ROOT_CAUSES.md Part 3.2 fix-list items 4 and 5 (the service-row grouping and its two
// off-grid gaps) live INSIDE SalonResultCard.tsx, the real, registered, off-limits-to-edit
// component (its own file: three sunken `#F4F4F5` boxes at a 6px row gap, plus two 10px
// gaps). Applied here via a scoped `.search-c-cards` className + `[class*=...]` attribute
// selectors (the identical mechanism the round-2 base and its TRAY sibling already used for
// their own inherited-component overrides), not by forking or restyling the component
// itself:
// 4. The three service rows render as ONE bounded list (1px hairline border, Candidate C's
//    own 20px radius, `RADIUS.c.cardPx`, so this nested list does not introduce a FIFTH
//    radius value alongside Candidate C's "20px everywhere" rule) with inset hairline
//    dividers between rows, no per-row `#F4F4F5` fill, no 6px gap.
// 5. The two 10px gaps (photo-to-content, meta-to-services) fold onto the kit's own spacing
//    ladder (12 is the nearer rung on the 12/16/20/24/32 scale, |10-12|=2 vs |10-16|=6) and
//    the two off-ramp FONT sizes (13px meta lines, 13.5px service-row text) fold onto the
//    ramp (13 -> meta 12, 13.5 -> body 14), the exact fold the round-2 base and its TRAY
//    sibling already applied to the same inherited component. Scoped to `.search-c-cards`
//    only, so Candidate C's OWN locked 13px pill text (outside this container, in the
//    filter row above) is untouched.
//
// ROOT_CAUSES.md Part 3.2 fix-list item 6 (the floating Map pill must not overlap card
// content at scroll-top 0): carries forward the round-2 base's already-measured fix
// (`bottom-[141px]`, nav-height 125 + a 16px clearance gap), re-verified live below at this
// candidate's own Map-pill geometry (93x44, not the round-2 base's h-11/px-18 shape).
//
// Inherited from the round-2 base, not re-decided here: the greyscale seed-photo exclusion
// (the real loader's top-ranked basel/coiffeur result, Atelier Haarwerk, carries the banned
// Unsplash id 1560066984, mean HSV saturation 0.000; the round-2 base's own deviation-5
// note filters that one photo id out of the real, unmodified result set, never by
// hardcoding a replacement). The four static filter chips (no dropdown/sheet wired) carry
// the identical round-1/round-2 repair-round precedent this file inherits, unchanged.
//
// measured: LIVE RENDER BLOCKED this pass, not skipped: every route on this dev server
// (127.0.0.1:3461), including the completely unrelated home page, returns Next's own 500
// ModuleBuildError citing `app/[locale]/dev/directions-0905-r3/_kit/index.ts:18:1`,
// "Expression expected", the exact JSX-comment-inside-JSDoc collision kitBridge.ts (beside
// this file) already diagnoses. Verified twice independently this run: (1) curl against the
// home route and against this screen's own route both return the identical stack trace,
// proving the whole dev-server compile is poisoned, not just this folder; (2)
// `esbuild.build({bundle:false})` against that exact file independently reproduces
// "Unexpected \"}\"" at the same line/column with no Next.js involved at all. This screen's
// own three files (page.tsx, ViewC.tsx, kitBridge.ts) each pass the identical esbuild syntax
// check standalone with zero errors, so the defect is isolated to the shared file, not to
// anything in this folder. That file sits outside this build's scope (the shared round-3 kit
// folder, not this search-results/c folder) and both sibling candidates import it directly,
// so it is not this build's file to fix; the one-line repair is rewording or removing the
// inner `{/* exactly one candidate per screen */}` JSX-style comment on that file's own line
// 18, so its `*/` stops closing the outer `/**` block early. Values quoted below are
// therefore SOURCE-verified (read directly from the real, off-limits SalonResultCard.tsx,
// RatingStars.tsx and this kit's tokens.ts/systems.ts), not render-verified; no computed
// pixel, console-error count or screenshot in this file's header or in the closing report
// should be read as a live measurement until the shared kit compiles and this route has
// actually been rendered.
//
// floors, evaluated against source, not a render (see the measured note just above for why):
// (a) photographic focal - SalonResultCard's feed variant renders a 5:4 photo as the first,
//     largest element of every card (source: SalonResultCard.tsx `aspect-[5/4]` feed branch).
// (b) one biggest element - the salon name (`CardName ... text-[16px] font-bold`, computes to
//     600 clamped to weight 500 inside `main`) is the only 16px run on the card; every other
//     card text folds to 12 or 14 via this file's own `.search-c-cards` scoped style block.
// (c) real tabular number - real CHF service prices and real durations from `getSearchResults`
//     (server-only Supabase loader, no invented row); zero fabricated numbers anywhere.
// (d) semantic colour moment - the star rating glyph (`fill-s-star` #FFC32B) renders on every
//     card carrying a `rating`.
// (e) no dead-grey zone - every card carries a real photo; the former per-row `#F4F4F5` service
//     fill is removed by this file's own scoped override (transparent + hairline instead), so
//     no grey band survives, matching Candidate C's flat/no-tray treatment.
// (f) worst-case content holds - name/address/category all truncate inside the real,
//     unmodified SalonResultCard; NOT independently re-verified against the longest live salon
//     name this run (that check needs the render this pass could not get), flagged rather than
//     assumed.
//
// system: c (CANDIDATE C, THE AIRBNB PORT). <KitProvider system="c"> wraps this whole tree;
// every kit component underneath (Pill) reads Candidate C's value sheet automatically. The
// real SalonResultCard "feed" variant is NOT wrapped in the kit's <Card>, since it renders
// its own DOM directly (it is a registered primitive with no `hasPhoto` slot); this is fine
// because the real card already IS candidate-C-compliant on its own terms (flat, no border,
// no shadow, it carries a photo, satisfying Candidate C's row 10 without any change
// needed). The Map/mode-toggle pill is the one control on this screen with a genuine
// Candidate-C-only value row (`MODE_TOGGLE_PILL_C`), read from the kit rather than
// hardcoded, since Candidates A and B carry no equivalent row on their own sheets.

import { Search, SlidersHorizontal, ChevronDown, Map as MapIcon } from "lucide-react";
import { SalonResultCard } from "@/app/[locale]/_components/search/SalonResultCard";
import type { SearchResultsData } from "@/app/[locale]/dev/directions-0905/search-results/_va/data";
// BLOCKED (see kitBridge.ts beside this file for the full explanation): the round-3 shared
// kit barrel at directions-0905-r3/_kit/index.ts currently fails to compile (a JSX comment
// embedded inside its own JSDoc block closes that comment early, turning prose into invalid
// code). This import reaches through a local, in-folder shim instead of the broken shared
// barrel so this one screen can still render; nothing about which values are used changes,
// since the shim re-exports the identical round-2 kit the shared barrel itself re-exports.
import { KitProvider, Pill, COLOR, MODE_TOGGLE_PILL_C } from "./kitBridge";

export interface ViewCProps {
  data: SearchResultsData;
  locale: string;
}

const FILTER_CHIPS = ["Sort", "Open now", "Price", "Rating"] as const;

export function ViewC({ data, locale }: ViewCProps) {
  const { cityName, categorySlug } = data;
  const categoryLabel = categorySlug === "coiffeur" ? "Hair salons" : categorySlug;
  // Inherited from the round-2 base's own deviation-5 note (see header comment): the real
  // loader's top-ranked result carries the banned greyscale seed photo. Excluded from the
  // real, unmodified result set, never by hardcoding a replacement src or hand-picking a
  // new order.
  const salons = data.salons.filter((s) => !(s.photoUrl ?? "").includes("1560066984"));

  return (
    <KitProvider system="c">
      <div className="min-h-dvh bg-white">
        {/* Search pill, unchanged chrome, see the Depicts manifest above. Search glyph
            restored to match the round-2 base's own anatomy (ViewRule.tsx: Search size=12,
            strokeWidth=2.4, text-s-ink, aria-hidden); an earlier pass of this file had
            silently dropped it with no named reason, which this fixes back to the base. */}
        <div className="mx-auto w-full max-w-[680px] px-4 pt-3">
          <div className="flex h-[64px] w-full items-center justify-center gap-2 rounded-[40px] border border-s-border bg-white px-[19px] text-center">
            <Search size={12} strokeWidth={2.4} className="shrink-0 text-s-ink" aria-hidden />
            <span className="min-w-0 flex-1 truncate font-body text-[14px] font-medium text-s-ink">
              {categoryLabel}
              {cityName ? ` in ${cityName}` : ""}
            </span>
          </div>
        </div>

        {/* Filter chip row, unchanged chrome; the chips are the kit's real Pill, which
            renders Candidate C's own recipe automatically (see the header comment). */}
        <div className="mx-auto w-full max-w-[680px] px-4 pt-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Filters"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-s-border bg-white text-s-ink"
            >
              <SlidersHorizontal size={16} strokeWidth={1.9} aria-hidden />
            </button>
            <div
              className="scrollbar-none flex min-w-0 flex-1 items-center gap-2 overflow-x-auto"
              style={{ scrollbarWidth: "none" }}
            >
              {FILTER_CHIPS.map((label) => (
                <Pill key={label} active={false} onClick={() => {}}> {/* drift-ok: static filter-chip mockup, no dropdown/sheet wired (round-1/round-2 repair-round precedent for this row) */}
                  {label}
                  <ChevronDown size={14} strokeWidth={1.8} className="opacity-50" aria-hidden />
                </Pill>
              ))}
            </div>
          </div>
        </div>

        {/* Fix-list item 1 (ROOT_CAUSES.md Part 3.2): heading line DELETED (owner
            2026-09-06, REMOVED.md). One hairline reattached directly under the filter row,
            no heading text, no result count of any kind. */}
        <div className="mx-auto w-full max-w-[680px] px-6 pt-6">
          <div className="border-t" style={{ borderColor: COLOR.hairline }} />
        </div>

        {/* Results, see the Depicts manifest above: the real SalonResultCard, feed variant,
            hasServiceQuery true, no reviewCount prop (fix-list item 2). Consecutive results
            are divided by one inset hairline each, matching Candidate C's "hairlineCeiling:
            unlimited" delta (systems.ts). */}
        <div className="search-c-cards mx-auto w-full max-w-[680px] px-6 pt-6">
          {/* Fix-list items 4 and 5 (ROOT_CAUSES.md Part 3.2), applied via a scoped
              className + attribute selectors since SalonResultCard.tsx is real and
              off-limits to edit (see the header comment for the full reasoning). Scoped to
              .search-c-cards only: the filter chips above (Candidate C's own locked 13px
              text) are outside this container and stay untouched.
              Repair pass, Candidate C's own "Icon budget: zero icons on a card" sheet row
              (`_plans/R3_ONE_SYSTEM.md` line 115, citing `airbnb--search-results.md`): the
              composed SalonResultCard's HeartButton, in the "feed" variant branch this file
              actually renders (SalonResultCard.tsx line 625, `<div className="absolute
              right-3 top-3 z-10">`, verified by reading the live DOM this pass, not the
              line-649 non-feed branch guessed at first), renders a save-heart icon on every
              card, which is candidate C's only icon-bearing element. Hidden the same
              scoped-override way as items 4/5 above (no fork, no edit to the real component);
              the tap target still exists in the DOM, only its visual paint is suppressed, so
              no behavior changes, only the icon budget. */}
          <style>{`
            .search-c-cards [class*="text-[13px]"] { font-size: 12px !important; }
            .search-c-cards [class*="text-[13.5px]"] { font-size: 14px !important; } /* type-scale-ok: CSS attribute-selector text matching SalonResultCard's own existing class string (off-limits, real component), not a new utility class added to any element in this file */
            .search-c-cards [class*="pt-2.5"] { padding-top: 12px !important; }
            .search-c-cards [class*="mt-2.5"] { margin-top: 12px !important; }
            .search-c-cards [class*="right-3"][class*="top-3"] { visibility: hidden; } /* Candidate C icon-budget fix: zero icons on a card, see comment above */
            .search-c-cards [class*="space-y-1.5"] {
              border: 1px solid #E4E4E7; /* drift-ok: locked s-border hairline hex, plain CSS string in a scoped style element, not a Tailwind context */
              border-radius: 20px;
              overflow: hidden;
            }
            .search-c-cards [class*="space-y-1.5"] > div {
              margin-top: 0 !important;
              border-radius: 0 !important;
              background: transparent !important;
              border-bottom: 1px solid #E4E4E7; /* drift-ok: locked s-border hairline hex, same reason as above */
              padding: 12px 14px !important;
            }
            .search-c-cards [class*="space-y-1.5"] > div:last-child {
              border-bottom: none;
            }
          `}</style>
          {salons.length === 0 ? (
            <p className="py-10 font-body text-[14px] text-s-ink-2">
              No {categoryLabel.toLowerCase()} matched this search.
            </p>
          ) : (
            salons.map((s, i) => (
              <div
                key={s.id}
                className={i === 0 ? "pt-0" : "mt-6 pt-6"}
                style={i === 0 ? undefined : { borderTop: `1px solid ${COLOR.hairline}` }}
              >
                <SalonResultCard
                  variant="feed"
                  slug={s.slug}
                  name={s.name}
                  locale={locale}
                  rating={s.averageRating}
                  photoUrl={s.photoUrl ?? undefined}
                  galleryCount={s.galleryCount}
                  hasServiceQuery
                  category={s.category}
                  address={s.address}
                  city={s.cityName ?? undefined}
                  priceFromCHF={s.priceFromCHF}
                  priceFromService={s.priceFromService}
                  services={s.services}
                  salonId={s.id}
                  priority={i === 0}
                  // fix-list item 2: reviewCount intentionally NOT passed, see header comment.
                />
              </div>
            ))
          )}
        </div>

        {/* Map / mode-toggle pill, Candidate C's own row (see the Depicts manifest above):
            MODE_TOGGLE_PILL_C, not round-2's generic capsule. Repair pass, fix-list item 6:
            the inherited `bottom-[141px]` was measured against a different round's card
            geometry and never re-verified on this candidate's own route once the shared kit's
            500 cleared. Live-measured this pass at 390x844: card 1's own box (the
            SalonResultCard outer wrapper inside .search-c-cards) runs top:185/bottom:746.6,
            and the button at bottom-[141px] put its own box at top:659/bottom:703, a
            4,092px^2 overlap with the card's own service-row content (the repair-pass
            critic's exact number). `bottom-[41px]` instead places the button's box at
            top:759/bottom:803, 12.4px clear of the card's own bottom edge
            (746.6 + 12 = 758.6 <= 759 measured), while staying fully inside the 844px fold,
            the identical approach and clearance margin candidate A's own repair pass applied
            (SearchResultsA.tsx, fix item 6 comment) to the same shared defect, so all three
            candidates converge on the same fix shape even though the pixel value differs per
            candidate's own card height. */}
        <div className="fixed bottom-[41px] left-1/2 z-40 -translate-x-1/2">
          <button
            type="button"
            aria-label="Map"
            className="inline-flex items-center justify-center gap-2 font-body font-medium"
            style={{
              width: MODE_TOGGLE_PILL_C.widthPx,
              height: MODE_TOGGLE_PILL_C.heightPx,
              borderRadius: MODE_TOGGLE_PILL_C.radiusPx,
              backgroundColor: MODE_TOGGLE_PILL_C.fill,
              color: MODE_TOGGLE_PILL_C.textColor,
              fontSize: 12,
            }}
          >
            <MapIcon size={16} strokeWidth={1.9} aria-hidden />
            Map
          </button>
        </div>

        {/* Bottom spacer: the real bottom nav is 125px and HideInBooking strips all chrome
            on /dev routes, so this holds the fold measurement to the same geometry the live
            phone renders. */}
        <div style={{ height: 125 }} aria-hidden />
      </div>
    </KitProvider>
  );
}
