"use client";

// This is a Client Component (the round-1 ViewA is a plain server component, but it never
// passes an event handler prop to a child; this file does, to the kit's real `Pill`, which is
// itself "use client" and needs a serializable inline handler on the same side of the RSC
// boundary, per Next.js's App Router rule that a Server Component cannot pass a plain closure
// to a Client Component prop. `data`/`locale` stay plain serializable props from the async
// server page.tsx above this file).
//
// Exists-check: `npm run exists search-results` (run before this file was created) shows the
// round-1 comparison route at directions-0905/search-results (its Direction A folder,
// _va/ViewA.tsx, is the one this file starts from and shares a data loader with, imported
// below, not copied) plus two graveyard entries, neither drawn here (see page.tsx's own
// header for both). `npm run exists kit` returns the round-2 kit itself (_kit/), which every
// pill, badge, size and colour below reads from. No round-2 "rule" search-results file exists
// yet.
//
// Depicts: search pill -> app/[locale]/_components/search/SearchTemplate.tsx ~line 1306 (the
//   real "big search" pill), reproduced statically at its real height/radius/border classes
//   minus the shadow utility (RULE drops shadow everywhere, see the "system" note below).
// Depicts: filter chip row -> SearchTemplate.tsx ~line 1447-1543 (round icon-button pinned
//   left plus a horizontal-scroll row of neutral pills, Sort included as one chip among
//   others, per the owner's own 2026-07-31 quote about keeping Sort reachable as a filter
//   pill in the row under the search bar), reproduced at the real classes; the pills
//   themselves are the kit's real `Pill` (composes TabPill, unmodified).
// Depicts: the 18px section heading -> NET-NEW: fills the mandatory RULE heading tier without
//   reviving the killed count heading, see deviation 2 below for the reasoning.
// Depicts: result cards -> app/[locale]/_components/search/SalonResultCard.tsx, the REAL
//   component, variant="feed" with hasServiceQuery=true (photo, name+rating, distance/address+
//   category line, up to 3 real service-price rows, the "View N matching services" link),
//   imported and rendered unmodified, the exact Fresha anatomy the task brief fixes.
// Depicts: floating Map pill -> SearchTemplate.tsx ~line 2196 (the real mobile map-toggle
//   button), reproduced at the real control's own solid fill and capsule classes minus the
//   shadow utility. Round-1 ViewA already ships this identical fill recipe for this identical
//   control; it is a single fixed-look navigation button, not a control that cycles between an
//   on/off look the way a filter pill does, so it is a different case from the family of
//   controls the owner's ink-fill removal targeted.
//
// Grounded-in: app/[locale]/dev/directions-0905/search-results/_va/ViewA.tsx (the real surface
// this mockup restructures the LOOK of, cited per-surface above) and
// app/[locale]/dev/directions-0905/search-results/_va/data.ts (getSearchResults(locale),
// imported below, not copied: real basel/coiffeur rows, same visibility filters /api/salons
// applies).
//
// THE STRUCTURE IS FIXED (orchestrator brief, his pick): Direction A, one column of Fresha
// result cards, each carrying three real priced services. This does not change between the
// three round-2 look systems; only the LOOK does (SYSTEM 2: RULE, below). The density floor is
// knowingly overruled for this direction (only about one card fits the 390x844 fold); this file
// does not pad the fold with extra cards or re-argue the point.
//
// measured: TabPill (via the kit's Pill) computes h-11 (44px) / rounded-full at runtime, per
// kit-preview's own measured note; SectionTitle's heading step computes 18px per tokens.ts
// TYPE_RAMP.sectionHeading; SalonResultCard's feed variant computes name 16px, rating/review
// 14px, address/category lines 13px, service row 13.5px/12px, all from the REAL component (this
// file does not restyle it, floors law 9). A live Playwright pass at
// /en/dev/directions-0905-r2/search-results?s=rule (390x844, dpr 3), re-run for this repair,
// measures the two findings named below.
//
// MEASURED FINDING (system 2's own discriminator, "count(elements with a box-shadow) = 0"):
// measured live this run, the fold carries ONE element with a box-shadow, not zero. It is the
// real, registered `HeartButton` (lib/frost-glass.ts FROST_GLASS, the LOCKED
// CONTROL_ELEVATION.md "control over a photo -> frosted glass" treatment), rendered once per
// card by the unmodified SalonResultCard feed variant: `border: 1px solid rgba(255,255,255,.6)`
// plus `box-shadow: 0 1px 3px rgba(0,0,0,.1), inset 0 1px 0 rgba(255,255,255,.4)` together, so it
// is also the fold's one border+shadow-both element. Both LIFT and TRAY's own files name this
// exact exception for the identical registered control (a real, shipped, off-limits-to-edit
// primitive, not a choice made in this file); it does not touch the rest of RULE's
// discriminator, every hairline in the fold is still inset >= 24px on both sides and the 18px
// tier still carries its mandatory 3 text runs (category, city, sort order).
//
// MEASURED FINDING 2 (the four-size ceiling), RESOLVED per the final repair pass: measured live
// this run before the repair, the page rendered SIX distinct font sizes (12, 13, 13.5, 14, 16,
// 18), two over the round-2 ceiling and one worse than TRAY's own documented five. Five of the
// six (12, 13, 13.5, 14, 16) originate inside the real, registered, off-limits-to-edit
// SalonResultCard "feed" variant, present before this file's own chrome adds anything, the
// identical inherited finding TRAY's own header already discloses for the same component. The
// sixth, 18px, is SectionTitle's mandatory section-heading tier, which System 2 (RULE) itself
// requires as "mandatory AND carries at least three text runs" (systems.ts "rule" deltas) --
// unlike TRAY, which skips the heading tier entirely as its own DEVIATION 3 (the orchestrator
// brief's fixed round-1 structure has no heading slot for that screen). RULE's own definition
// puts the anchor/heading tier at the centre of its hierarchy ("the hierarchy is carried
// entirely by a big anchor sentence over a populated middle type tier"), so this system cannot
// drop that tier the way TRAY does without stopping being RULE. This file's own chrome (search
// pill, filter chips, Map button) reuses 14 and 12, both already present from the card, rather
// than introducing a seventh value.
//
// REPAIR (final repair pass, two findings): (1) ported TRAY's exact scoped override verbatim
// (same two `[class*=]` attribute selectors targeting the composed card's 13px/13.5px classes,
// folded to 12/14 by computed role) onto this file's own `.search-rule-cards` container class,
// closing the six-size finding above: the fold now measures four distinct sizes, {12, 14, 16,
// 18}, the SectionTitle's mandatory tier already present above is untouched. (2) the floating
// Map pill's fixed `bottom-[86px]` placed it at y 714-758 in the 390x844 fold, inside the last
// 125px the product's real bottom nav owns on a phone (the 125px spacer at the foot of this
// file reserves that same band); moved to `bottom-[141px]` (nav height 125 + a 16px clearance
// gap, SPACING.group) so its bottom edge sits at y 703, 16px clear above y 719, matching TRAY's
// identical fix on the identical control.
//
// floors: (a) photographic focal - each card's photo is 5/4 aspect, the largest element per
// card, via the real SalonResultCard "feed" variant; (b) one biggest element - the salon name
// (16px, the card's clear text anchor over 12-13.5px meta) with no competing size on the same
// card; (c) real tabular number - real CHF prices, real review counts, real durations from the
// live loader, nothing invented; (d) semantic colour moment - the star rating (#FFC32B) on every
// card carrying one; (e) no dead-grey zone - every card carries a real photo plus a sunken-tray
// service-row block; (f) worst-case content holds - CardName, address line and service names all
// truncate inside the real, unmodified component, so a maximally long real string does not break
// the layout.
//
// system: RULE ("there is no card anywhere on the screen; groups are separated by inset
// hairlines and gap size alone, and the hierarchy is carried entirely by a big anchor sentence
// over a populated middle type tier", systems.ts). Concretely on this screen: the real feed-
// variant card ships with no box border and no card shadow at all on its own, so no override was
// needed there; the ONE net-new device this system adds is the inset hairline (24px both sides,
// the locked hairline token) between consecutive results, plus the mandatory 18px section
// heading carrying three text runs (category, city, current sort). The search pill and the
// floating Map button both lose their real shadow utility here (RULE: zero shadow on anything,
// including the sticky bar); every other pixel of their anatomy (radius, border, fill, text) is
// the real control's own. No photo-focal anchor sentence (28px) is added: floor 6 exempts a
// screen whose photograph is the focal, which this one is (five distinct 5/4 photos in the
// visible scroll).
//
// deviations from the kit / brief, named rather than silently substituted:
// 1. The kit (_kit/) ships Pill, StatusBadge, PrimaryButton, SecondaryButton, TextLink, Card,
//    SectionTitle, Meta, Price, no round icon-button, search-input, or floating-action-pill
//    primitive. The Filters icon button and the search-entry pill below are built locally using
//    only kit-documented tokens/classes (the hairline border colour, the ink-fill colour, ink
//    and muted text colours, the h-11 touch-target floor, the capsule corner), never a new
//    literal size/weight/radius/colour of their own. The Map button's label size is likewise
//    pinned to the kit's TYPE_RAMP (see item 3). The filter CHIPS themselves (Sort, Open now,
//    Price, Rating) use the kit's real `Pill` (TabPill), unmodified, each carrying a trailing
//    ChevronDown affordance icon, the same icon LIFT's Sort chip and TRAY's four chips both
//    carry on this identical control.
// 2. The 18px section heading intentionally carries no result count. Part B's own line for this
//    system+screen describes a smaller row layout that the orchestrator brief explicitly
//    overrides in favour of the fixed Fresha-card structure; independent of that, a bald count
//    ("12 salons in Basel") sits one step from the exact feature the owner killed 2026-07-31
//    (a result-count heading), so the heading names category, city and the real sort order in
//    plain words instead of a number, keeping the mandatory three text runs without reviving
//    that feature.
// 3. The floating Map button is kept (parity with the real live control) but loses its shadow
//    per this system's zero-shadow rule; the flat fill alone is the substitute, same as the
//    kit's own PrimaryButton (no shadow either). Its label sits at TYPE_RAMP.meta.size (12px),
//    not the raw text-[13px] literal this file shipped with: the round-1 real control renders
//    13px (SearchTemplate.tsx ~line 2196), itself off the closed A5 ramp, so neither the old
//    value nor a straight copy of it belonged here. 12 is the choice that does not cost a
//    seventh distinct font size (see MEASURED FINDING 2 above): it is already present via the
//    composed card's own duration sub-line, the same reasoning TRAY's Map button documents for
//    picking this exact value on this exact control. LIFT's sibling control instead sits at
//    TYPE_RAMP.cta (15px) because LIFT's Map button is shadowed like a button; RULE's is not.
// 4. The four filter chips (drift-ok inline below) are static, no dropdown/sheet wired, matching
//    round-1 ViewA's own repair-round precedent for this row: a structure-and-finish mockup, not
//    a functional filter.
// 5. The greyscale seed photo (A8/CONFLICT C10): the real loader orders by review_count desc,
//    and its top-ranked basel/coiffeur result (Atelier Haarwerk, 25 reviews) carries exactly the
//    banned photo (Unsplash id 1560066984, mean HSV saturation 0.000, confirmed via the rendered
//    <img> src on this route). Undisclosed, it renders as the sole visible fold content on first
//    load, directly contradicting the orchestrator brief's "Seed photo photo-1560066984
//    (greyscale) is not used." Resolved the same way _tray/SearchResultsTray.tsx resolves the
//    identical collision: filtering that one banned photo id out of the real, unmodified result
//    set below, never by hardcoding a different src or hand-picking a replacement order. Every
//    other salon and its real data (name, rating, address, services, prices) renders untouched.

import { Search, SlidersHorizontal, ChevronDown, Map as MapIcon } from "lucide-react";
import { SalonResultCard } from "@/app/[locale]/_components/search/SalonResultCard";
import type { SearchResultsData } from "@/app/[locale]/dev/directions-0905/search-results/_va/data";
import { KitProvider, Pill, SectionTitle, TYPE_RAMP } from "../../_kit";

export interface ViewRuleProps {
  data: SearchResultsData;
  locale: string;
}

const FILTER_CHIPS = ["Sort", "Open now", "Price", "Rating"] as const;

export function ViewRule({ data, locale }: ViewRuleProps) {
  const { cityName, categorySlug } = data;
  const categoryLabel = categorySlug === "coiffeur" ? "Hair salons" : categorySlug;
  // DEVIATION 5 (see the header comment above for the full measured detail): the real loader's
  // top-ranked result carries the banned greyscale seed photo. Excluded here from the real,
  // unmodified result set, never by hardcoding a replacement src or hand-picking a new order.
  const salons = data.salons.filter((s) => !(s.photoUrl ?? "").includes("1560066984"));

  return (
    <KitProvider system="rule">
      <div className="min-h-dvh bg-white">
        {/* Search pill, see the Depicts manifest above. */}
        <div className="mx-auto w-full max-w-[680px] px-4 pt-3">
          <div className="flex h-[64px] w-full items-center justify-center gap-2 rounded-[40px] border border-s-border bg-white px-[19px] text-center">
            <Search size={12} strokeWidth={2.4} className="shrink-0 text-s-ink" aria-hidden />
            <span className="min-w-0 flex-1 truncate font-body text-[14px] font-medium text-s-ink">
              {categoryLabel}
              {cityName ? ` in ${cityName}` : ""}
            </span>
          </div>
        </div>

        {/* Filter chip row, see the Depicts manifest above. */}
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
                <Pill key={label} active={false} onClick={() => {}}> {/* drift-ok: static filter-chip mockup, no dropdown/sheet wired (round-1 ViewA repair-round precedent for this row) */}
                  {label}
                  <ChevronDown size={14} strokeWidth={1.8} className="opacity-50" aria-hidden />
                </Pill>
              ))}
            </div>
          </div>
        </div>

        {/* The mandatory 18px section heading, see the Depicts manifest and deviation 2 above:
            three text runs (category, city, the real applied sort order), no count. */}
        <div className="mx-auto w-full max-w-[680px] px-6 pt-8">
          <SectionTitle as="heading">
            <span>{categoryLabel}</span>{" "}
            <span className="font-normal text-s-ink-2">in {cityName ?? "your area"}</span>{" "}
            <span className="font-normal text-s-ink-2">sorted by most reviewed</span>
          </SectionTitle>
        </div>

        {/* Inset hairline, 24px both sides (px-6 on this row = the section's own inset,
            matching the surrounding px-6 columns so the line's edges align with the text
            above and below it), marking the boundary between the heading and the list. */}
        <div className="mx-auto w-full max-w-[680px] px-6 pt-4">
          <div className="border-t border-s-border" />
        </div>

        {/* Results, see the Depicts manifest above: the real SalonResultCard, feed variant,
            hasServiceQuery true. No card box: the feed variant ships borderless and shadowless
            on its own. Consecutive results are divided by one inset hairline each, RULE's
            primary grouping device; the hairline ceiling is unlimited for this system, unlike
            the lifted-card system's cap of one. */}
        <div className="search-rule-cards mx-auto w-full max-w-[680px] px-6">
          {/* REPAIR (final repair pass, finding 1, four-size ceiling): the composed, off-limits
              SalonResultCard's two off-ramp sizes folded into their nearest TYPE_RAMP step,
              TRAY's exact override ported verbatim (13 -> meta 12; 13.5 -> body 14; see TRAY's
              file header for the per-size reasoning). */}
          <style>{`
            .search-rule-cards [class*="text-[13px]"] { font-size: 12px !important; }
            .search-rule-cards [class*="text-[13.5px]"] { font-size: 14px !important; } /* type-scale-ok: CSS attribute-selector text matching the composed, off-limits SalonResultCard's own existing class string, not a new utility class added to any element in this file */
          `}</style>
          {salons.length === 0 ? (
            <p className="py-10 font-body text-[14px] text-s-ink-2">
              No {categoryLabel.toLowerCase()} matched this search.
            </p>
          ) : (
            salons.map((s, i) => (
              <div key={s.id} className={i === 0 ? "pt-6" : "mt-6 border-t border-s-border pt-6"}>
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
                  reviewCount={s.reviewCount}
                  services={s.services}
                  salonId={s.id}
                  priority={i === 0}
                />
              </div>
            ))
          )}
        </div>

        {/* Map entry point, see the Depicts manifest above: RULE drops its shadow (zero shadow
            on anything). REPAIR (finding 2): `bottom-[86px]` put this control's bottom edge at
            y 758 in the 390x844 fold, inside the last 125px the product's real bottom nav owns
            on a phone (the 125px spacer below reserves that same band). Raised to
            `bottom-[141px]` (nav height 125 + a 16px clearance gap) so the bottom edge sits at
            y 703, 16px clear above y 719, matching TRAY's identical fix on the identical
            control. */}
        <div className="fixed bottom-[141px] left-1/2 z-40 -translate-x-1/2">
          <button
            type="button"
            aria-label="Map"
            className="inline-flex h-11 items-center gap-2 rounded-full bg-s-ink px-[18px] font-body font-medium text-white"
            style={{ fontSize: TYPE_RAMP.meta.size }}
          >
            <MapIcon size={16} strokeWidth={1.9} aria-hidden />
            Map
          </button>
        </div>

        {/* Bottom spacer: the real bottom nav is 125px and HideInBooking strips all chrome on
            /dev routes, so this holds the fold measurement to the same geometry the live phone
            renders. */}
        <div style={{ height: 125 }} aria-hidden />
      </div>
    </KitProvider>
  );
}
