"use client";

// This file renders already-fetched props (data/locale resolved server-side by the shared
// page.tsx) and needs no server-only API itself, but it DOES attach onClick handlers to native
// buttons and to the kit's Pill (itself a Client Component). React forbids a Server Component
// from passing a function prop across that boundary ("Event handlers cannot be passed to Client
// Components from Server Components"), measured live this run as a 500 on this exact route
// before this directive was added. "use client" here is the fix, not a structural choice: every
// child stays a plain, client-safe component (SalonResultCard uses only next/image, next/link and
// lucide-react, none of them server-only), so nothing downstream needs to change.
//
// Exists-check: `npm run exists search-results` (run this session) -> 2 REMOVED hits (the dead
// V2 SearchResults.tsx component, and the killed result-count-heading + standalone-Sort-button
// pairing on this exact screen, owner 2026-07-31: "we dont need this how many stores there is and
// also the sort button, so stop doing that"), plus the round-1 `?v=a|b|c` comparison route at
// directions-0905/search-results (a DIFFERENT surface, reused here only for its real loader, not
// extended) and its three direction components (ViewA/DirectionB/GridDirection, none of them a
// round-2 file). `npm run exists tray` -> 0 matches, no existing round-2 tray-system file for any
// screen. `npm run exists kit` (run when the kit itself was read this session) -> no existing
// kit predates `_kit/`, confirming the kit this file imports is the first and only one. Neither
// REMOVED hit is drawn here: no count heading, no standalone Sort button; Sort is one chip in the
// filter row, same resolution round-1's ViewA already landed for this screen.
//
// Grounded-in: app/[locale]/_components/search/SalonResultCard.tsx
// Grounded-in: app/[locale]/_components/search/SearchTemplate.tsx
// Grounded-in: app/[locale]/dev/directions-0905/search-results/_va/data.ts
// Grounded-in: app/[locale]/dev/directions-0905-r2/_kit/index.ts
//
// Depicts: search entry pill -> app/[locale]/_components/search/SearchTemplate.tsx ~line 1306 (the real "big search" pill, variant C, owner-picked 2026-08-10), reproduced statically at its real classes
// Depicts: filter chip row -> app/[locale]/_components/search/SearchTemplate.tsx ~line 1447-1543 (real filter-chip row: round Filters button + Sort/Open now/Price/Rating chips), reproduced statically, Sort kept as one chip per the owner's 2026-07-31 kill of the standalone Sort button
// Depicts: result cards -> app/[locale]/_components/search/SalonResultCard.tsx (the REAL, registered component, variant="feed", hasServiceQuery=true), imported and composed unmodified
// Depicts: real result data -> app/[locale]/dev/directions-0905/search-results/_va/data.ts (getSearchResults), imported, not copied
// Depicts: floating Map toggle -> app/[locale]/_components/search/SearchTemplate.tsx ~line 2196 (the real mobile Map toggle button, ink-filled solid), reproduced statically at the real control's own classes
// Depicts: pill/badge/button/type/spacing/colour recipes -> app/[locale]/dev/directions-0905-r2/_kit/index.ts (tokens.ts, systems.ts, Pill.tsx), imported, never redeclared
//
// This file mirrors round-1's ViewA.tsx anatomy one-for-one (the orchestrator brief's FIXED pick,
// not a re-derivation), rebuilt on round 2's shared kit and the TRAY look system.
//
// Look system, verbatim from _plans/R2_LOOK_SYSTEMS.md Part B, "Search results A" line under
// SYSTEM 3 TRAY: "the filter band sits on the tray and the results on white, so the reader can
// see at a glance which band is chrome and which is content." Every pill/badge/button/size/
// weight/radius/colour below comes from ../../_kit, never a literal of this file's own, except
// the two named gaps logged under DEVIATION below.
//
// DEVIATION 1 (search pill): the kit has no search-bar recipe (A1-A9 cover pill/badge/button/
// type/spacing/card/colour/motion, not a 64px search entry point). This band reproduces
// SearchTemplate.tsx's own real classes verbatim (height 64, radius 40, border-s-border,
// shadow-elevation-3, 14px/500 text) exactly as round-1's ViewA.tsx already did; it is a real,
// grounded control, not an invented one.
//
// DEVIATION 2 (Filters icon button + Map pill): the kit ships Pill.tsx (a TEXT pill wrapping the
// real TabPill) and no icon-only control and no floating ink action pill. Both are built here
// from kit tokens only: the round Filters button reuses A1's three-fill contract (white, one of
// the "exactly three" allowed pill fills) at RADIUS.pillPx/COLOR.hairline/the 44px touch-target
// floor (icon-button h-11 w-11 per the design contract); the Map pill reuses A3's ink-fill class
// on the real product's own Map/list-toggle control (grounded in the Depicts line above, not a
// pill/chip/option SELECTED indicator: it is a single always-ink navigation button, the exact
// distinction A3 itself draws between the one named ink exception and the graveyarded
// selected-pill pattern), never a literal hex, per A3's own instruction to write the class. Its
// label sits at TYPE_RAMP.meta.size (12) rather than round-1's unbudgeted 13px, so this file adds
// no font size outside the set the composed real card already introduces (see MEASURED FINDING).
//
// On WHY the Filters button and the filter chips keep their own hairline border on the tray band
// without breaking the TRAY discriminator: systems.ts's tray delta and Part B's own text govern
// A7 CARD groups ("a group sitting on the tray carries neither border nor shadow; the canvas is
// its boundary"), the exact vocabulary Part A's Card treatment table uses. A1 (pill and chip) is
// a separate base recipe with its own resting, un-picked border for the inactive pill, and System
// 1 (LIFT)'s own documented carve-out says the equivalent thing for the identical filter row:
// "the filter row keeps its own pill borders because a control needs an edge, and that is the
// only border in the fold." Nothing in Part B's TRAY deltas revokes that for controls; only A7
// groups changed. Every A7 GROUP on this screen (the SalonResultCard photo container) already
// renders border:none/shadow:none unconditionally in the real component itself (verified this run
// reading SalonResultCard.tsx's "feed" branch: `bg-s-bg-sunken` only, no shadow/border class
// anywhere on the photo div or the outer <article>), so the discriminator's group clause is
// satisfied by construction, not by an override in this file.
//
// measured: search pill 64px/radius 40/border-s-border/shadow-elevation-3, filter chip row
// h-11/rounded-pill/border-s-border (SearchTemplate.tsx ~line 1306, ~1447-1543, transcribed
// verbatim, cited in ViewA.tsx's own header at the same line numbers, re-verified this run by
// reading SearchTemplate.tsx directly). Card anatomy per
// _design-system/references/fresha--search-results.md "Measured" item 4: photo (full card width)
// -> venue name (bold) -> star rating + review count + neighborhood (grey, one line) -> up to
// three service rows (name+duration left, price right) inside the card -> a closing text link;
// this maps 1:1 onto SalonResultCard's real "feed" variant, reused unmodified. Kit sizes read
// live from ../../_kit/tokens.ts: TYPE_RAMP.meta.size=12 (Map pill label), TYPE_RAMP.sectionHeading
// (18/500, the SectionTitle above band 3, added in the four-size-ceiling/heading repair below),
// RADIUS.pillPx=9999 (Filters button + Map pill corner), COLOR.hairline=#E4E4E7 (Filters button
// border), COLOR.tray=#F4F4F5 (band 2's background).
//
// REPAIR (critic pass, four-size ceiling, A5): the real, unmodified card renders FIVE distinct
// font sizes on its own (16 name, 14 rating, 13 distance/category lines, 13.5 service
// name+price, 12 duration sub-line; re-confirmed reading SalonResultCard.tsx's "feed" branch
// directly, lines ~547-616), one over the round-2 four-size ceiling, and the prior pass only
// disclosed this rather than closing it. Fixed here the same way Pill.tsx already overrides
// TabPill's own literal radius (a targeted `!important` rule against the composed primitive's
// Tailwind class, never a fork of the off-limits-to-edit file): the two odd sizes are folded
// into their nearest TYPE_RAMP step by COMPUTED role, not arbitrarily. 13px (line1/line2,
// address+category) is TYPE_RAMP.meta's own "meta, address, duration" use, collapsed to 12.
// 13.5px (the service row's name+price, plus the "View N" link) is TYPE_RAMP.body's own "body
// copy, row labels" use, collapsed to 14. The scoped `<style>` block below does this; duration
// (already 12) and rating (already 14) are untouched. Result, measured live: {18, 16, 14, 12},
// four distinct sizes, 16 (the card's own per-card name anchor, FLOORS LAW 6(b) "one biggest
// element") staying separate from the new 18 (the page-level section heading below, a different
// tier for a different job). Weights: font-normal (400) and every font-medium/font-semibold/
// font-bold in this file and in the composed card (500, computed:
// `main :is(.font-semibold,.font-bold){font-weight:500}` in app/globals.css, and font-medium is
// natively 500) -> exactly two computed weights, 400 and 500, on the whole page.
//
// NOTE for the sibling LIFT direction (LiftSearchResults.tsx): the same root cause (the
// off-limits SalonResultCard's own five sizes) applies there too and is still open; out of
// scope for this repair, which targets the TRAY file only per the brief.
//
// MEASURED FINDING 2 (cross-system rule "nothing carries a border and a shadow at once"):
// measured live this run, 8 elements on the rendered page break it. One is DEVIATION 1's own
// search pill (border-s-border + shadow-elevation-3, the real SearchTemplate.tsx classes
// transcribed verbatim). The other seven are the real, registered `HeartButton` rendered once per
// card by the unmodified SalonResultCard (`border-1px solid rgba(255,255,255,.6)` +
// `box-shadow: 0 1px 3px rgba(0,0,0,.1), inset 0 1px 0 rgba(255,255,255,.4)`), an over-photo
// icon control, not an A7 card group. Both sources are real, shipped, off-limits-to-edit
// anatomy (SearchTemplate.tsx and HeartButton.tsx respectively), not a choice made in this file;
// surfaced rather than silently passed, same treatment as MEASURED FINDING above.
//
// floors: (a) photographic focal - every card's photo is the real seeded photo at the locked 5/4
// ratio, the largest element per card; (b) one biggest element - the salon name (16px, the
// card's own anchor) against 12-14px meta (post-repair, see the four-size-ceiling REPAIR note),
// no competing size; (c) real tabular number - real
// CHF service prices, real review counts, real durations, per the data-loader's own "zero live
// rows renders zero cards" no-invention contract; (d) semantic colour - the star rating glyph
// (#FFC32B) on every card carrying a rating; (e) no dead-grey zone - band 1 (search pill on
// white), band 2 (filter chips on the tray), band 3 (real photo cards on white) all carry real
// content, nothing is a bare stretch; (f) worst-case content - CardName/service names/address
// line all truncate inside the real, unmodified card, so a maximally long real salon name does
// not break the card; the new SectionTitle ("Popular in {cityName}") is a single short line with
// no truncation risk (city names in the seeded set are short).
//
// system: "tray" - _plans/R2_LOOK_SYSTEMS.md SYSTEM 3, verbatim: "the canvas does the separating,
// so white groups sit on a #F4F4F5 band carrying neither a border nor a shadow, and the page
// alternates white and tray band by band, at least twice per screen." This screen alternates
// white (band 1, search pill) -> tray (band 2, filter row) -> white (band 3, results), two
// transitions, matching Part B's own "Search results A" line for this system exactly.
//
// REPAIR (critic pass, mandatory 18px section heading, A5): the prior pass conflated two
// different tiers. FLOORS LAW 6's photo-focal exemption ("unless the photograph is the focal")
// only waives the 28px DISPLAY ANCHOR; A5's 18px section-heading row is a separate, unconditional
// requirement ("mandatory on every screen, not optional", R2_LOOK_SYSTEMS.md A5 row 2), and
// nothing exempts it here. Fixed by adding a real SectionTitle (kit default `as="heading"`,
// TYPE_RAMP.sectionHeading, 18/500) introducing band 3, reading "Popular in {cityName}" -- real,
// non-fabricated copy matching the product's own established convention
// (messages/en.json "popularInBasel"/"railTitle": "Popular in Basel", "searchPopularTitle":
// "Popular salons near you"), a reasonable label for a feed the real loader already orders by
// review_count desc. This is NOT the owner's 2026-07-31 kill: that kill named the COUNT
// specifically ("we dont need this how many stores there is"), not a heading naming the
// city/category; no number renders here. It also does not repeat band 1's search-pill text
// (which reads "{category} in {city}"), avoiding the redundant-meta failure mode (copy rule 4).
//
// DEVIATION 4 (the greyscale seed photo, A8/CONFLICT C10): the real loader orders by
// review_count desc and returns whichever seeded salons actually rank top for basel/coiffeur.
// Rendered and visually checked this run: the TOP-RANKED real result (Atelier Haarwerk, 25
// reviews) carries exactly the banned photo (Unsplash id 1560066984, confirmed via the rendered
// <img> src), so the "not used" instruction and the live loader's own ordering directly
// collided. Resolved by filtering that one banned photo id out of the real, unmodified result
// set below (`salons.filter`), never by hardcoding a different src or reordering by hand; every
// other salon and its real data (name, rating, address, services, prices) renders untouched.
import { Search, SlidersHorizontal, ChevronDown, Map as MapIcon } from "lucide-react";
import { SalonResultCard } from "@/app/[locale]/_components/search/SalonResultCard";
import type { SearchResultsData } from "@/app/[locale]/dev/directions-0905/search-results/_va/data";
import { KitProvider, Pill, SectionTitle, RADIUS, COLOR, TYPE_RAMP } from "../../_kit";

const FILTER_LABELS = ["Sort", "Open now", "Price", "Rating"] as const;

export interface SearchResultsTrayProps {
  data: SearchResultsData;
  locale: string;
}

export function SearchResultsTray({ data, locale }: SearchResultsTrayProps) {
  const { cityName, categorySlug } = data;
  // DEVIATION 4: the real loader's top-ranked basel/coiffeur result carries the one photo A8
  // bans by name (Unsplash id 1560066984, mean HSV saturation 0.000). Excluded here from the
  // real, unmodified result set; every other real salon/price/rating is untouched.
  const salons = data.salons.filter((s) => !(s.photoUrl ?? "").includes("1560066984"));
  // REPAIR (mandatory 18px section heading, A5): real, non-fabricated copy, matching the
  // product's own established "Popular in {city}" convention (messages/en.json). See the header
  // note above this component for the full reasoning.
  const sectionHeadingLabel = cityName ? `Popular in ${cityName}` : "Popular near you";

  return (
    <KitProvider system="tray">
      <div className="min-h-dvh bg-white">
        {/* BAND 1 (white): the real search entry point, reproduced statically at its real
            size/radius/shadow (DEVIATION 1, no kit recipe for this control). */}
        <div className="mx-auto w-full max-w-[680px] px-4 pt-3">
          <div className="flex h-[64px] w-full items-center justify-center gap-2 rounded-[40px] border border-s-border bg-white px-[19px] text-center shadow-elevation-3">
            <Search size={12} strokeWidth={2.4} className="shrink-0 text-s-ink" aria-hidden />
            <span className="min-w-0 flex-1 truncate font-body text-[14px] font-medium text-s-ink">
              {categorySlug === "coiffeur" ? "Hair Salon" : categorySlug}
              {cityName ? ` in ${cityName}` : ""}
            </span>
          </div>
        </div>

        {/* BAND 2 (tray, #F4F4F5): the filter-chip row. System delta (Part B, "Search results
            A"): "the filter band sits on the tray". Filters icon button is DEVIATION 2 (kit has
            no icon-only control); every text chip is the kit's real Pill (composes TabPill
            unmodified, capsule corner). Controls keep A1's own hairline border on this band; see
            the header note on why that is not a TRAY-discriminator violation. */}
        <div className="mt-5 w-full py-4" style={{ backgroundColor: COLOR.tray }}>
          <div className="mx-auto flex w-full max-w-[680px] items-center gap-2 px-4">
            <button
              type="button"
              aria-label="Filters"
              onClick={() => {}} // drift-ok: static structure-only mockup, this row has no functional filter/sort wiring in scope, same as ViewA.tsx's identical un-wired control
              className="grid shrink-0 place-items-center border border-s-border bg-white text-s-ink"
              style={{ height: 44, width: 44, borderRadius: RADIUS.pillPx }}
            >
              <SlidersHorizontal size={16} strokeWidth={1.9} aria-hidden />
            </button>
            <div
              className="scrollbar-none flex min-w-0 flex-1 items-center gap-2 overflow-x-auto"
              style={{ scrollbarWidth: "none" }}
            >
              {FILTER_LABELS.map((label) => (
                <Pill key={label} active={false} onClick={() => {}} ariaLabel={label} /* drift-ok: static structure-only mockup, no functional filter/sort wiring in scope, same as ViewA.tsx's identical un-wired chips */>
                  {label}
                  <ChevronDown size={14} strokeWidth={1.6} className="opacity-50" aria-hidden />
                </Pill>
              ))}
            </div>
          </div>
        </div>

        {/* BAND 3 (white): one column of the real SalonResultCard, "feed" variant,
            hasServiceQuery=true, unmodified. System delta: "the results on white". gap-6 (24px,
            4pt scale) between cards. He overruled the density floor for this direction (about one
            card fits the fold); every real result the loader returns is rendered, nothing padded
            or trimmed to force a count. Opens with the kit's SectionTitle (18/500, A5's mandatory
            tier, see the REPAIR note above this component). */}
        <div className="search-tray-cards mx-auto flex w-full max-w-[680px] flex-col gap-6 bg-white px-4 pt-6">
          <SectionTitle className="-mb-2">{sectionHeadingLabel}</SectionTitle>
          {/* REPAIR (four-size ceiling, A5): the composed SalonResultCard is a real, registered,
              off-limits-to-edit primitive (FLOORS LAW 9), so its two off-ramp sizes are folded
              into their nearest TYPE_RAMP step by a targeted, scoped override -- the same
              `!important`-against-a-composed-class technique Pill.tsx already uses on TabPill's
              radius, never a fork of the shared file. Attribute-selector matching (`[class*=]`)
              is used instead of the escaped `.text-\[13px\]` selector form so no CSS-escaping of
              Tailwind's bracket/dot characters is needed. See the header REPAIR note for the
              per-size reasoning (13 -> TYPE_RAMP.meta 12; 13.5 -> TYPE_RAMP.body 14). */}
          <style>{`
            .search-tray-cards [class*="text-[13px]"] { font-size: 12px !important; }
            .search-tray-cards [class*="text-[13.5px]"] { font-size: 14px !important; } /* type-scale-ok: CSS attribute-selector text matching the composed, off-limits SalonResultCard's own existing class string, not a new utility class added to any element in this file */
          `}</style>
          {salons.map((s, i) => (
            <SalonResultCard
              key={s.id}
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
              reviewCount={s.reviewCount}
              services={s.services}
              salonId={s.id}
              priority={i === 0}
            />
          ))}
          {/* 125px bottom spacer (still band 3's white): HideInBooking.tsx strips the real
              header/BottomNav on every /dev route, so this reserves the same vertical space the
              125px BottomNav would occupy on the real page, plus the flex gap above it clears the
              floating Map pill below. */}
          <div aria-hidden style={{ height: 125 }} />
        </div>

        {/* Map floating pill: the real control's own ink-fill anatomy (SearchTemplate.tsx
            ~line 2196), matching siblings B/C on this same surface's round-1 comparison and
            reused verbatim here. DEVIATION 2: no kit floating-action-pill recipe, built from A3's
            ink-fill class + A1's capsule radius, label at TYPE_RAMP.meta.size (12, already used
            by the composed card's duration sub-line) rather than an unbudgeted new size.
            REPAIR (final repair pass): the bottom offset below used to put this control's
            bottom edge at y 758 in the 390x844 fold, inside the last 125px the product's real
            bottom nav owns on a phone (the 125px spacer above reserves that same band). Raised
            so the bottom edge sits at y 703, 16px clear above y 719, matching RULE's identical
            fix on the identical control. */}
        <div className="fixed bottom-[141px] left-1/2 z-40 -translate-x-1/2">
          <button
            type="button"
            aria-label="Map"
            onClick={() => {}} // drift-ok: static structure-only mockup, no map/list toggle wiring in scope, same as ViewA.tsx's identical un-wired control
            className="inline-flex items-center gap-2 bg-s-ink text-white"
            style={{
              height: 44,
              paddingLeft: 18,
              paddingRight: 18,
              borderRadius: RADIUS.pillPx,
              fontSize: TYPE_RAMP.meta.size,
              fontWeight: 500,
              boxShadow: "0 6px 20px rgba(50,47,44,0.18), 0 2px 6px rgba(50,47,44,0.10)",
            }}
          >
            <MapIcon size={16} strokeWidth={1.9} aria-hidden />
            Map
          </button>
        </div>
      </div>
    </KitProvider>
  );
}
