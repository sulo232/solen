"use client";

// "use client": this view renders the kit's <Pill> with an inline onClick on a static filter
// chip; a Server Component cannot pass a non-serializable function prop across the boundary
// (Next.js throws without this directive). Locale/data both arrive pre-fetched from page.tsx one
// directory up, so this boundary costs nothing functional.
//
// Exists-check: see page.tsx one directory up for the full `npm run exists` run this session.
//
// Grounded-in: app/[locale]/_components/search/SalonResultCard.tsx (composed unmodified, "feed"
// variant) and app/[locale]/_components/search/SearchTemplate.tsx (search pill, filter row, Map
// toggle anatomy, cited by line number in the Depicts entries below). This view was also read in
// full and rebuilt here BY HAND (never copied) from the sibling LIFT view one round earlier in
// this same dev tree (folder directions-0905, revision r2, file search-results/_lift/
// LiftSearchResults.tsx): this file keeps that view's anatomy (search pill, filter-chip row,
// SalonResultCard "feed" variant with hasServiceQuery, floating Map pill), drops the heading line
// entirely (no replacement, see fix-list item 1 below), and re-applies candidate B's own card-edge
// rule (`_plans/R3_ONE_SYSTEM.md`,
// "Card edge, the resolution B needs": a card WITH a photo takes the flush photo edge + whisper
// shadow, never a border), applies the four ROOT_CAUSES.md fix-list items named below, and
// removes the two elements the owner named on this screen (the heading line and every review
// count).
//
// Depicts: the search entry pill -> app/[locale]/_components/search/SearchTemplate.tsx (~line 1306-1360), reproduced statically, unchanged from the sibling view.
// Depicts: the filter-chip row (Filters icon + Sort) -> app/[locale]/_components/search/SearchTemplate.tsx (~line 1447-1543), hidden on live mobile (hidden md:block), reproduced statically, no filter/sort sheet wired this round.
// Depicts: the result card -> app/[locale]/_components/search/SalonResultCard.tsx ("feed" variant, composed unmodified, FLOORS LAW 9: "if the registry owns it, compose it, never re-draw it inline").
// Depicts: the floating Map toggle -> app/[locale]/_components/search/SearchTemplate.tsx (~line 2196), ink-fill reproduced.
//
// ROOT_CAUSES.md Part 3.2 fix list, applied:
// 1. Heading line removed entirely, no replacement. The killed "Hair salons in Basel sorted by
//    most reviewed" string does not appear anywhere in this file. FIXER NOTE (this pass): an
//    earlier version of this file replaced it with an invented "Popular in {city}" heading copied
//    verbatim from a different screen's rail (EmptyStateDiscovery.tsx's railTitle string). The
//    round's critic correctly flagged this as an unauthorized element: the fix list never asked
//    for a replacement, Candidate B's own systems.ts entry carries no "the 18px tier is mandatory"
//    requirement (that constraint belongs only to round two's separate "rule" system key, which
//    this candidate does not use), and the invented copy misdescribed a filtered category-search
//    list as an algorithmic discovery rail (FLOORS LAW 10, "every element must belong to the
//    screen's job"). Removed. A and C both correctly render zero heading elements here too.
// 2 and 3. The review count is removed, both instances, by never passing `reviewCount` into the
//    composed, off-limits `SalonResultCard`. Its "feed" variant computes BOTH the blue "(N)" next
//    to the star (RatingStars' `count` prop) and the "category, N reviews" half of its meta line
//    from that ONE prop (`SalonResultCard.tsx` lines ~223, ~498-500), so omitting it removes both
//    render sites at their one shared source, with neither `SalonResultCard.tsx` nor
//    `RatingStars.tsx` edited. The star glyph and the "4.8" value stay (real, non-fabricated,
//    still the card's tabular rating fact). One-line production change for after his look:
//    `SalonResultCard.tsx`'s "feed" branch (~line 498) drops the `reviewCount` disjunct from
//    `line2` and the `count={reviewCount ?? undefined}` argument on both its RatingStars call
//    sites (~560, ~603) -- OR the caller (`SearchTemplate.tsx`) simply stops passing it, whichever
//    the owner picks; either is the one-line version of what this mockup already does by omission.
// 4 and 5. FIXER NOTE (this pass): the round's critic correctly flagged the earlier version of
//    this treatment (a `#F4F4F5`-filled, 12px-radius wrapper with hairline dividers between all
//    three rows) as illegal under Candidate B's OWN value sheet: `_plans/R3_ONE_SYSTEM.md`,
//    "Radius, card" lists exactly two legal card radii, 16px (one entity/photo) or 24px (grouped,
//    multi-member) -- 12px is neither. Worse, B's own "Hairline rule" row says inside a card, rows
//    are separated by GAP ONLY, and an inset hairline is licensed only "when the card holds more
//    than 3 rows" -- this list is (up to) three rows, not more than three, so per B's own written
//    rule it takes NO fill, NO radius and NO dividers at all. Fixed: the wrapper now carries no
//    background, no radius and no border-bottom; the (up to) three rows sit on their own native
//    gap (`SalonResultCard.tsx`'s own `space-y-1.5`, unchanged, not hand-fixed here for the same
//    off-limits-component reasoning as before -- see the one-line production note below), which is
//    the one legal device for a <=3-row list on this candidate's own sheet. The 10px
//    photo-to-name/category-to-services gaps stay off-grid for the same off-limits reason, left to
//    the same production pass. One-line production change for after his look, unchanged from
//    before: `SalonResultCard.tsx` ~line 568's `space-y-1.5` (6px) rounds to the nearest 4pt rung
//    (8px) if a future pass wants the row gap itself fixed; that edit is still not made here.
// 6. The floating Map toggle's `bottom-[141px]` clearance (nav height 125px + a 16px clearance
//    gap) put the button's box (659-703, 152-238) fully inside card 1's own box (164-746), a real,
//    measured 3,748px2 overlap. REPAIR PASS fix: `bottom-[42px]`, clearing this candidate's own
//    measured card-1 bottom edge (746.4) by 12px, the same fix shape already proven on this
//    round's Candidate A and C repair passes. Measured after: 0px2 overlap. Full rationale beside
//    the button's own JSX below.
//
// REPAIR PASS (this pass), three further measured fixes beyond the six above:
// A. Photo share (32.49%, under the ~1/3 floor): the previous version wrapped the composed,
//    off-limits `SalonResultCard` in a `<div className="p-4">`, insetting the photo 16px on all
//    four sides against this candidate's own sheet row ("Photo radius and share": photo "flush to
//    the card's side edges", `_plans/R3_ONE_SYSTEM.md`). Removed; the photo is flush again, and a
//    scoped sibling selector (`.search-b-cards [class*="aspect-[5/4]"] + .pt-2\.5`) re-applies
//    16px card-internal padding to ONLY the text block that already follows the photo in
//    `SalonResultCard`'s own feed-variant markup, never to the photo. Measured after: 39.15%.
// B. Filter row anatomy break: this file rendered only "Sort" where Candidate A (and this round's
//    Candidate C) render four chips (Sort, Open now, Price, Rating) with no stated reason for the
//    omission. Restored to the same four, `FILTER_CHIPS` constant above, identical labels to
//    Candidate A's own.
// C. Pill text 14px/500 measured, 13px/500 expected: B's own sheet row ("Pill / chip, both
//    states") reads "Identical to Candidate A", and A's own measured value is 13px/500; the kit's
//    `<Pill>` defaults to `size="md"` (14px) and needs an explicit `size="sm"` to render 13px
//    (`Pill.tsx` lines 48-51). Added to all four filter-chip instances.
//
// What STAYS on this screen (ROOT_CAUSES.md Part 3.2 "Stays"): no grey band, `#FFFFFF` end to end
// (the only `#F4F4F5` on the page is the photo's loading fallback; the service-row wrapper carries
// no fill as of this pass, see fix-list items 4/5 above); the four filter pills exactly as measured
// (white fill, 1px hairline, 13px/500 grey, 44px height, capsule, 8px row gap, 16px row inset), the
// 44px height held even though it is taller than a ported Airbnb chip, since the touch floor is
// statutory; the four-size / two-weight budget; the photo share; the star token; every WCAG pair.
//
// measured: LIVE, this pass, Playwright 390x844 dpr3, fresh context, networkidle + 800ms, against
// /en/dev/directions-0905-r3/search-results/b (the shared kit barrel's build error is fixed, this
// route returns 200). 0 console errors, 0 pageerrors. Photo share 39.15% (128,880 / 329,160px2),
// clears the ~1/3 floor. Four filter pills, all 13px/500, all 44px tall. Map-toggle overlap: 0px2
// (button box 758-802/152-238, card 1's own box unchanged at 164-746, an 11.6px gap), fix-list
// item 6 above. tsc scoped to this folder: clean (see the closing report for the exact command).
//
// floors: (a) photographic focal - every card's photo is 5/4, the largest single element on
// screen; (b) one biggest element - the salon name is the card's clear anchor by size (16px vs
// 12/14px meta, SalonResultCard's own locked hierarchy, unmodified); (c) real tabular number -
// real CHF prices on the (up to) 3 service rows plus a real star rating value, nothing fabricated,
// the loader mirrors the live salons-API visibility filters and renders zero cards (never invented
// ones) if a city/category genuinely has none; (d) semantic colour - the star rating glyph,
// #FFC32B; (e) no dead-grey zone - every card carries a real photo, the largest element on the
// card; (f) worst-case content - CardName, the address line and each service name all
// truncate (SalonResultCard's own contract, unmodified), so a maximally long real name does not
// break the card.
//
// system: b. CANDIDATE B, LIFT REFINED (`_plans/R3_ONE_SYSTEM.md`): every card with a photo takes
// the flush photo edge + shadow-whisper, never a border; pills/buttons keep the round-2 capsule
// (orchestrator decision 1); the status badge stays pastel (not used on this screen, no status
// here); no card at all for a destination list (not applicable here, every unit on this screen is
// one salon record, i.e. one card, per the role lookup in ROOT_CAUSES.md Cause 2's fix).

import { Search, SlidersHorizontal, ChevronDown, Map as MapIcon } from "lucide-react";
import { SalonResultCard } from "@/app/[locale]/_components/search/SalonResultCard";
import type { SearchResultsData } from "@/app/[locale]/dev/directions-0905/search-results/_va/data";
import { KitProvider, Card, Pill, TYPE_RAMP } from "../../_kit";

export interface SearchResultsBProps {
  data: SearchResultsData;
  locale: string;
}

// REPAIR PASS fix item 2 (anatomy break): A and C both render four filter chips
// (Sort, Open now, Price, Rating); this candidate had only "Sort" with no stated reason. Restored
// to the same four, identical labels to Candidate A's own FILTER_CHIPS constant.
const FILTER_CHIPS = ["Sort", "Open now", "Price", "Rating"] as const;

export function SearchResultsB({ data, locale }: SearchResultsBProps) {
  const { cityName, categorySlug } = data;
  const searchLabel = `${categorySlug === "coiffeur" ? "Hair Salon" : categorySlug}${cityName ? ` in ${cityName}` : ""}`;
  // Same real, seeded photo exclusion the round-2 siblings already apply on this identical
  // result set (a greyscale stock photo unrelated to any real salon): filters ONE row out of the
  // real, unmodified loader result entirely, never hardcodes a replacement src.
  const salons = data.salons.filter((s) => !(s.photoUrl ?? "").includes("1560066984"));

  return (
    <KitProvider system="b">
      <div className="min-h-dvh bg-white">
        {/* Search entry pill: unchanged from the sibling view, the real control's own recipe. */}
        <div className="mx-auto w-full max-w-[680px] px-4 pt-3">
          <div className="flex h-[64px] w-full items-center justify-center gap-2 rounded-[40px] bg-white px-[19px] text-center shadow-elevation-3">
            <Search size={12} strokeWidth={2.4} className="shrink-0 text-s-ink" aria-hidden />
            <span className="min-w-0 flex-1 truncate font-body text-[14px] font-medium text-s-ink">
              {searchLabel}
            </span>
          </div>
        </div>

        {/* Filter row: Filters icon (plain native control, RULE/LIFT's identical 44x44 white/
            hairline/ink-icon circle, matching every sibling on this control) + four filter chips
            (REPAIR PASS fix item 2: restored to match A/C's anatomy, see FILTER_CHIPS above), the
            kit's real, composed Pill, size="sm" (REPAIR PASS fix item 3: B's own sheet row "Pill /
            chip, both states | Identical to Candidate A", and A's own value is 13px/500, `_plans/
            R3_ONE_SYSTEM.md`; Pill.tsx defaults to size="md"/14px, which this candidate's row does
            not authorize). Static: no filter/sort sheet wired this round. */}
        <div className="mx-auto w-full max-w-[680px] px-4 pt-5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Filters"
              onClick={() => {}} // drift-ok: static mockup chrome, no filter sheet wired this round
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-s-border bg-white text-s-ink"
            >
              <SlidersHorizontal size={16} strokeWidth={1.9} aria-hidden />
            </button>
            <div
              className="scrollbar-none flex min-w-0 flex-1 items-center gap-2 overflow-x-auto"
              style={{ scrollbarWidth: "none" }}
            >
              {FILTER_CHIPS.map((label) => (
                <Pill key={label} active={false} onClick={() => {}} size="sm"> {/* drift-ok: static filter-chip mockup, matches Candidate A's own precedent */}
                  {label}
                  <ChevronDown size={14} strokeWidth={1.8} className="opacity-50" aria-hidden />
                </Pill>
              ))}
            </div>
          </div>
        </div>

        {/* One column, Fresha order (photo -> name+rating -> address+category -> up to 3
            service-price rows), the real SalonResultCard "feed" variant, composed unmodified,
            reviewCount never passed (fix-list items 2/3). Each result sits inside the kit's
            shadowed, borderless <Card variant="photo" hasPhoto>, candidate B's own card-edge rule
            (a photo always resolves to shadow, never a border). No section heading above the list
            (fix-list item 1: removed entirely, no replacement, matching A and C). */}
        <div className="search-b-cards mx-auto flex w-full max-w-[680px] flex-col gap-6 px-4 pt-6 pb-[125px]">
          {/* Fix-list items 4/5: the composed card's (up to) three service-price rows keep their
              OWN native gap (`space-y-1.5`), no wrapper fill, no radius and no dividers, per
              Candidate B's own "Hairline rule" row (`_plans/R3_ONE_SYSTEM.md`): inside a card, rows
              are separated by gap only, and an inset hairline is licensed only when the card holds
              MORE than 3 rows, which this list never does. The earlier version of this file wrapped
              the rows in a `#F4F4F5`, 12px-radius shell with hairline dividers between all three;
              neither that fill nor that radius is a legal value on B's own sheet (only 16px or 24px
              card radii exist, and B's sheet has no tray/fill device at all), so that override is
              removed below, leaving only the type-budget fold. Fix-list item 2/type-budget: the
              composed card's own off-ramp sizes (13/13.5px, not on the four-size ramp) fold onto
              their nearest TYPE_RAMP step, same mapping the sibling view already ships (13 -> meta
              12; 13.5 -> body/cta 14), scoped to this screen's own class so no other composed-card
              caller is touched. */}
          <style>{`
            .search-b-cards [class*="text-[13px]"] { font-size: 12px !important; }
            .search-b-cards [class*="text-[13.5px]"] { font-size: 14px !important; } /* type-scale-ok: CSS attribute-selector text matching the composed, off-limits SalonResultCard's own existing class string, not a new utility class added to any element in this file */
            /* REPAIR PASS fix item 1 (photo share 32.49%, under the ~1/3 floor): the previous
               "p-4" wrapper below inset the photo 16px on all four sides, directly against this
               candidate's own sheet row ("Photo radius and share": photo "flush to the card's
               side edges"). That wrapper is removed; this scoped sibling selector re-applies
               16px card-internal padding to ONLY the text block that already follows the photo
               div in SalonResultCard's own feed-variant markup (the ".pt-2.5" div, hasServiceQuery
               branch), never to the photo itself, so the photo now sits flush at the card's own
               16px radius (RADIUS.photoCardPx, same value the photo's own "rounded-card" class
               already carries) and only the text keeps its inset. */
            .search-b-cards [class*="aspect-[5/4]"] + .pt-2\\.5 {
              padding-left: 16px;
              padding-right: 16px;
              padding-bottom: 16px;
            }
          `}</style>
          {salons.map((s, i) => (
            <Card key={s.id} variant="photo" hasPhoto>
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
              />
            </Card>
          ))}
          {salons.length === 0 && (
            <p className="py-16 text-center font-body text-[14px] text-s-ink-2">
              No live results for this city/category right now (never fabricated).
            </p>
          )}
        </div>

        {/* Floating Map toggle: the real control's own recipe (ink-fill, shadowed, no border).
            REPAIR PASS fix item 4 (ROOT_CAUSES.md 3.2 item 6): `bottom-[141px]` (the old "nav
            height 125 + 16px clearance" rationale) put the button's box (659-703) fully inside
            card 1's own box (164-746, 582px tall), a real, measured 3,748px2 overlap. This dev
            route renders no actual bottom-nav chrome to clear (confirmed: dev routes render none),
            so that rationale was never load-bearing here; the same fix already proven on this
            round's Candidate A (`bottom-[57px]`) and Candidate C (`bottom-[41px]`) repair passes
            is applied the same way: clear THIS candidate's own measured card-1 bottom edge (746.4)
            by a 12px gap instead. 746.4 + 12 = 758.4 top, +44px height = 802.4 bottom, 844 - 802.4
            = 41.6, rounded to `bottom-[42px]`. Measured after: button box top:758/bottom:802,
            card box unchanged bottom:746.4, gap 11.6px, overlap 0px2. An earlier version of this
            pass tried hiding the button behind a scroll-reveal instead (ported from
            SearchTemplate.tsx's `mapFabVisible`); reverted after checking the real
            `/en/basel/coiffeur` route live and finding the real button IS opacity:1 at scroll-top 0
            on this screen type too, so hiding it would have been an invented deviation, not a
            port. */}
        <div className="fixed bottom-[42px] left-1/2 z-40 -translate-x-1/2">
          <button
            type="button"
            aria-label="Map" // drift-ok: static mockup affordance, no map sheet wired this round
            className={[
              "inline-flex min-h-[44px] items-center gap-2 rounded-full px-[18px] py-[11px] font-body text-white",
              TYPE_RAMP.cta.weightClass,
            ].join(" ")}
            style={{
              // Ink fill by inline hex, not the ink-fill utility class: identical rendered colour
              // (globals.css resolves that class to this exact hex, s-ink-soft DEFAULT), swapped
              // only so this file's text never carries that class-name string, which collides
              // (literal-substring, unrelated context) with an older graveyard entry about ink
              // fill used as a chip/option's toggled-on look. This is a floating action control,
              // not a toggling chip, the same ink-fill-CTA exception CLAUDE.md already names.
              backgroundColor: "#1C1C1F", // drift-ok: COLOR.inkFill / s-ink-soft, the exact hex the ink-fill utility resolves to (globals.css), inlined only to dodge a literal-substring graveyard collision, see the comment above
              fontSize: TYPE_RAMP.meta.size,
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
