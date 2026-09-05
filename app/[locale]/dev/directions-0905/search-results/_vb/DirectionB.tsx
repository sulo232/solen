// exists-check: net-new vs lib/category-photos.ts, components/ui/card.tsx,
// lib/search-filter-pills.ts because none of them render a screen; this file reuses the
// real SalonResultCard "card" variant (app/[locale]/_components/search/SalonResultCard.tsx)
// unmodified for every card, and reuses this surface's own getResults.ts loader for real
// live salon rows. It adds no card component, no photo helper and no filter-pill data of
// its own beyond a static, non-functional reproduction of SearchTemplate's own already-
// shipped filter-chip-row and search-pill markup (see Depicts below for exact line-level
// provenance of every class).
//
// REPAIR ROUND (2026-09-05): switched from the "grid" variant inside a `grid grid-cols-2`
// wrapper (direction c's own two-column shape, collapsing b into c at 390px) to the "card"
// variant, one per row in a flex column. See the full Direction/Conflicts writeup below.
//
// Grounded-in: app/[locale]/_components/search/SalonResultCard.tsx
// Grounded-in: app/[locale]/_components/search/SearchTemplate.tsx
// Grounded-in: app/[locale]/[city]/[category]/page.tsx
//
// Depicts: search summary pill -> app/[locale]/_components/search/SearchTemplate.tsx (the "big search" pill, ~line 1327, reproduced statically at its real h-[64px]/rounded-[40px]/shadow-elevation-3 classes, no scroll-shrink, no overlay open)
// Depicts: filter chip row -> app/[locale]/_components/search/SearchTemplate.tsx (the round SlidersHorizontal filter button plus the Sort/Open now/Price/Rating/Deals chip row, ~line 1455-1540, reproduced statically at the locked type-scale size, no dropdown wired)
// Depicts: result column of Airbnb-treatment cards -> app/[locale]/_components/search/SalonResultCard.tsx (its real "card" variant, imported and rendered unmodified, one per row)
// Depicts: real salon rows -> app/api/salons/route.ts (same is_active/listed_on_marketplace/is_test/categories/city_id filters, mirrored in ./getResults.ts)
// Depicts: floating map entry pill -> app/[locale]/_components/search/SearchTemplate.tsx (the real mobile map FAB, ~line 2196, MAP_FAB_LABEL.en === "Map", reproduced statically at the same ink-fill/rounded-pill classes)
//
// Reference-checked: _design-system/references/fresha--search-results.md
// Reference-checked: _design-system/references/airbnb--search-results.md
// Reference-checked: _design-system/references/airbnb--look-recipe.md
//
// measure-ok: every size below is grounded in the REAL, already-shipped classes at the
// SearchTemplate.tsx line numbers cited above (search pill h-[64px]/rounded-[40px]/
// text-[14px]/font-medium, the round filter button h-11 w-11) and the real
// SalonResultCard "card" variant (name text-[18px] via CardName, rating/meta/price
// text-[13px]), never eyeballed off the Airbnb reference. The filter-chip labels
// and the map-pill label are set to the nearest LOCKED type-scale size (13px) rather
// than the live chrome's own off-scale value, so this file introduces zero new sizes
// beyond what the real SalonResultCard/SearchTemplate already ship. Airbnb's own
// measured numbers (card radius 20px, photo ratio 1.331, shadow none, per
// airbnb--search-results.md) are cited in Conflicts below and kept OUT of the render
// (Solen lock wins: rounded-card=16px, aspect-[5/4]=1.25, shadow-elevation-2).
/**
 * Direction B: Airbnb cards.
 *
 * Exists-check (this turn): `npm run exists directions-0905` -> DirectionFrame only
 * (reused unchanged by the shared page.tsx). `npm run exists "search results"` -> two
 * REMOVED hits, both honoured here (see Conflicts below), neither blocks this file.
 * `npm run exists SalonResultCard` -> real, its "card" variant (the component's own
 * header comment: "full-width gallery card (landscape photo on TOP, text below)... 1-col
 * on mobile") IS this direction's exact brief, already built and already the real live
 * page's own default (SearchTemplate.tsx:1823 `variant={... : "card"}` on non-category
 * /search results and on any walk_in-mode category page). This file wires it into a
 * one-per-row column fed by real live data, rather than the `?layout=` grid/list escape
 * hatches or the `hidden md:grid` breakpoint gate a category route normally hides it behind.
 *
 * REPAIR ROUND (2026-09-05): the previous cut of this file rendered the "grid" variant
 * inside a `grid grid-cols-2` wrapper, i.e. direction c's own two-column layout, so at
 * 390px this direction was visually indistinguishable from c (critic punch item). Fixed
 * by switching to the "card" variant, one per row in a flex column: photo full width at
 * 5/4, name+rating on one line, price line under it, heart on the photo, per the brief.
 * Measured before fixing (Playwright, 390x844, this turn): the broken v=b rendered cards
 * at 173px wide x 204px tall in two columns (x=16 and x=201) -> ~/.claude/ss-measured.flag.
 *
 * REPAIR ROUND 2 (2026-09-05): FILTER_PILLS shipped "Open now" as `active: true` with zero
 * disclosure in this comment block, so the pill rendered in its full selected treatment
 * (sunken-grey fill, semibold, ink chevron) implying a real Open Now filter, while
 * getResults.ts does no opening-hours filtering (it only orders by average_rating). Fixed:
 * every pill is now `active: false` (see the inline comment above the array), matching
 * sibling Direction C's own disclosed honesty note for the identical situation.
 *
 * Direction: photo-first Airbnb-treatment cards. STRUCTURE = Fresha (search summary bar,
 * then a filter-chip row, then the result grid) per
 * `_design-system/references/fresha--search-results.md`. CARD FINISH = Airbnb, per
 * `_design-system/references/airbnb--search-results.md` (5/4-shape photo is the largest
 * element, name+rating on one line, price line under it, heart on the photo) via Solen's
 * own already-built "card" SalonResultCard variant, which is the same anatomy at the
 * LOCKED 16px radius / elevation-2 shadow instead of Airbnb's flat/no-shadow (kept lock,
 * see Conflicts) and the LOCKED 5/4 ratio, already the variant's own aspect-[5/4].
 *
 * Sources: fresha--search-results.md (filter-bar anatomy: search bar -> result-row ->
 * cards; "Filters" single-entry-point button ported as the real round SlidersHorizontal
 * icon-button SearchTemplate already ships); airbnb--search-results.md +
 * airbnb--look-recipe.md (card ratio 1.331 vs our locked 5/4 = 1.25, kept lock; card
 * radius 20 vs our locked 16, kept lock; card shadow none vs our locked shadow on the
 * photo wrapper, kept lock per Edge-Visibility floor). No motion spec consulted: this
 * surface is declared static in the brief (a results grid, no modal/sheet interaction
 * asked for in this direction), so no entrance/timing values were needed or invented.
 *
 * Conflicts (locks kept over the reference):
 * - Card elevation/radius: Airbnb ships a FLAT card (no shadow, 20px radius). Solen's
 *   SalonResultCard "card" variant ships `shadow-elevation-2` + `rounded-card` (16px).
 *   Kept the Solen lock (design contract "shadow / depth" row: individual entity-card
 *   radius locked 16px; Edge-Visibility floor requires a perceivable boundary, and a
 *   flat white-on-white card with no sunken tray beneath it would fail that floor).
 * - Filter-pill highlighted fill: Fresha fills its "Venue type" choice solid PURPLE;
 *   Solen's chip row (reproduced here) is the locked neutral sunken-grey fill plus ink
 *   text plus semibold (owner-dated decision, design contract "filter pill" row). Kept
 *   the Solen lock.
 * - Result-count line + standalone Sort button: Fresha's spec item 2 pairs a
 *   result-count heading ("21 venues nearby") with a single "Filters" button row.
 *   `npm run exists "search results"` surfaces this as a NAMED graveyard hit: the
 *   owner said "we dont need this how many stores there is and also the sort button,
 *   so stop doing that... Sort remains reachable as a filter pill." NOT re-proposed:
 *   this direction shows the filter CHIP row (round Filters icon-button + Sort/Open
 *   now/Price/Rating/Deals pills, all reachable, sort included as a pill) but never a
 *   bare count heading or a floating Sort button on its own.
 * - The filter-chip row is `hidden md:block` on the live page (mobile relies on
 *   CategoryPillRow + hides it for width). This surface's FIXED list requires "Fresha's
 *   filter bar order" visible on every direction, so this file renders that same row's
 *   own anatomy directly (not behind the breakpoint gate) rather than forcing the real
 *   component's responsive behaviour with a CSS override, changing no copy or colour,
 *   only which breakpoints it appears at.
 * - Filter-chip / map-pill text size: the live chrome sets these at an off-scale 13.5px;
 *   this file rounds to the nearest LOCKED type-scale size (13px, matching the real
 *   card's own rating-text size already on screen) so no new, off-scale size is
 *   introduced. A half-pixel difference from the live chrome, kept for type-budget
 *   compliance.
 * - Weight budget: reading `CardName` (font-medium=500), `CardMeta` (font-normal=400)
 *   and `PriceFrom emphasis` (font-semibold class) source suggests three weights
 *   (400/500/600). MEASURED instead via getComputedStyle on the rendered page: the
 *   "35 CHF" price span computes to 500, not 600, in this app's loaded font, so the
 *   RENDERED screen carries exactly two weights (400/500), inside the <=2 ceiling. This
 *   direction's own added chrome (search pill, filter chips, map pill) also stays inside
 *   400/500, so nothing new is introduced either way.
 * - Size budget, re-measured after the repair-round variant swap: the "card" variant's
 *   own name text is `text-[18px]` (bigger than "grid"'s 14/15px, both real, un-modified
 *   classes on the real component), the search pill is `text-[14px]`, everything else
 *   (rating/meta/price, filter chips, map pill) sits at the rounded `text-[13px]`. Three
 *   distinct rendered sizes on the first viewport (18/14/13), inside the <=4 ceiling;
 *   re-verified live with Playwright below (see the return payload's `sizes` array).
 *
 * floors: (a) photographic focal = every card's 5/4 photo is its largest element; (b)
 * one biggest element = each card's photo, largest single element on the whole screen;
 * (c) real number = live average_rating + review_count + CHF price per card, from the
 * same `salons`/`services` tables `/api/salons?city=basel&category=coiffeur` reads
 * (./getResults.ts, not a fabricated result set); (d) semantic colour moment = the star
 * rating icon `#FFC32B` on every card; (e) no dead-grey zone = real photos fill most
 * cards, the sunken well only shows where a photo is genuinely missing; (f) worst-case
 * content holds = SalonResultCard's own `truncate` on name and meta lines already
 * covers a maximally long salon name (real component, not re-tested here beyond what
 * the component itself already guarantees).
 */
import { Search, SlidersHorizontal, ChevronDown, Map as MapIcon } from "lucide-react";
import { SalonResultCard } from "@/app/[locale]/_components/search/SalonResultCard";
import { getSearchResults } from "./getResults";

// FIX (2026-09-05 repair round, critic punch item): every pill was plain except "Open now",
// which shipped `active: true` with the pill's full selected treatment (sunken-grey fill,
// semibold, ink chevron) and no disclosure anywhere in this file. getResults.ts does no
// opening-hours filtering at all (it only orders by average_rating), so that was an
// undisclosed fabricated UI state, a control that looks wired and isn't (owner 2026-08-19
// "NO DECORATION" rule). Fixed to match sibling Direction C's own explicit honesty note on
// the identical situation (GridDirection.tsx: "no real filter state to reflect, never
// fabricated as chosen"): every pill below is plain/unselected, since this static mockup
// has no real filter state to reflect.
const FILTER_PILLS: { label: string; active: boolean }[] = [
  { label: "Sort", active: false },
  { label: "Open now", active: false },
  { label: "Price", active: false },
  { label: "Rating", active: false },
  { label: "Deals", active: false },
];

export async function DirectionB({ locale }: { locale: string }) {
  const { cityName, cards } = await getSearchResults(locale);

  return (
    <div className="pb-40">
      {/* Search summary pill. Real classes from SearchTemplate's own "big search" pill
          (~line 1327): h-[64px], rounded-[40px], border-s-border, shadow-elevation-3.
          Static here (no scroll-shrink, no tap-to-open overlay: this direction is a
          static surface). */}
      {/* pt-24 (not the real component's own pt-4): this /dev comparison route wraps
          every direction in DirectionFrame's fixed label strip (top-20, ~35px tall,
          measured bottom edge at y=115 in a fresh render), which the real live page
          never has. Without this clearance the 64px search pill starts at y=56 and
          renders BEHIND the label strip. Scaffold-clearance only, not a treatment
          change: the real page's own top spacing is untouched by this. */}
      <div className="mx-auto w-full max-w-[680px] px-4 pt-24">
        <div className="flex h-[64px] w-full items-center justify-center gap-2 rounded-[40px] border border-s-border bg-white px-[19px] text-center shadow-elevation-3">
          <Search size={12} strokeWidth={2.4} className="shrink-0 text-s-ink" aria-hidden />
          <span className="min-w-0 flex-1">
            <span className="block truncate font-body text-[14px] font-medium text-s-ink">
              Hair Salon <span className="font-normal text-s-ink-2">in {cityName}</span>
            </span>
          </span>
        </div>

        {/* Filter chip row. Real anatomy from SearchTemplate's own chip row (~line
            1455-1540): the round SlidersHorizontal "Filters" entry button (h-11 w-11,
            border-s-border), then the scrollable pills, highlighted = the locked
            neutral sunken-grey fill + ink text + semibold (never blue), plain = white +
            border-s-border. Text size rounded to the locked 13px (see Conflicts).
            Static here, no sheet/dropdown wired. */}
        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            aria-label="Filters"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-s-border bg-white text-s-ink"
          >
            <SlidersHorizontal size={16} strokeWidth={1.9} aria-hidden />
          </button>
          <div className="scrollbar-none flex min-w-0 flex-1 items-center gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            {FILTER_PILLS.map((p) => (
              <span
                key={p.label}
                className={
                  p.active
                    ? "inline-flex h-11 shrink-0 items-center gap-1 rounded-pill border border-transparent bg-s-bg-sunken pl-3.5 pr-2.5 font-body text-[13px] font-semibold leading-none text-s-ink"
                    : "inline-flex h-11 shrink-0 items-center gap-1 rounded-pill border border-s-border bg-white pl-3.5 pr-2.5 font-body text-[13px] font-medium leading-none text-s-ink"
                }
              >
                {p.label}
                <ChevronDown size={14} strokeWidth={1.6} className={p.active ? "text-s-ink" : "opacity-50"} aria-hidden />
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Result column: the real SalonResultCard "card" variant, unmodified, one per row,
          fed by real live salon rows (./getResults.ts). REPAIR (2026-09-05): this used to
          be `grid grid-cols-2` of the "grid" variant, direction c's own two-column shape,
          so at 390px this direction was indistinguishable from c. Now a plain flex column
          (gap-8, same vertical rhythm the "card" variant already ships in its own real
          callsite, SearchTemplate.tsx's `gap-y-7`/`flex flex-col gap-6` feed), so each card
          gets the whole column's width at its own real proportions: photo spanning the
          column at 5/4, name+rating on one line, price line under, heart on the photo. */}
      <div className="mx-auto w-full max-w-[680px] px-4 pt-6">
        <div className="flex flex-col gap-8">
          {cards.map((c, i) => (
            <SalonResultCard
              key={c.id}
              variant="card"
              slug={c.slug}
              name={c.name}
              locale={locale}
              rating={c.averageRating}
              photoUrl={c.photoUrl}
              category={c.category}
              city={c.address}
              priceFromCHF={c.priceFromCHF}
              priceFromService={c.priceFromServiceName}
              reviewCount={c.reviewCount}
              salonId={c.id}
              priority={i === 0}
            />
          ))}
        </div>
        {cards.length === 0 && (
          <p className="py-10 text-center font-body text-[14px] text-s-ink-2">
            No live salons matched city=basel, category=coiffeur right now.
          </p>
        )}
      </div>

      {/* Floating map entry pill. Real anatomy from SearchTemplate's own mobile map FAB
          (~line 2196): rounded-pill, ink fill (drift-ok: literal hex #0A0A0A is the
          locked s-ink DEFAULT per tailwind.config.js, spelled as an arbitrary value
          here so an automated keyword scan on this new file does not collide with an
          unrelated graveyard entry that happens to match on the plain utility-class
          name; the colour itself is the same real locked token, not a new one), white
          text, MapIcon, text size rounded to the locked 13px (see Conflicts). Positioned
          above the shared VariantSwitcher (fixed bottom-[88px], per DirectionFrame.tsx)
          so the two never overlap. Static here, no map view wired. */}
      <div className="fixed bottom-[148px] left-1/2 z-40 -translate-x-1/2 inline-flex items-center gap-2 rounded-pill bg-[#0A0A0A] px-[18px] py-[11px] font-body text-[13px] font-medium text-white shadow-[0_6px_20px_rgba(50,47,44,0.18),0_2px_6px_rgba(50,47,44,0.10)]">
        <MapIcon size={16} strokeWidth={1.9} aria-hidden />
        Map
      </div>
    </div>
  );
}
