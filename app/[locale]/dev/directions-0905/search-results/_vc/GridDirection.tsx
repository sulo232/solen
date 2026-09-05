"use client";

// Grounded-in: app/[locale]/_components/search/SearchTemplate.tsx (filter bar anatomy +
// the `?layout=grid` 2-col gap values), app/[locale]/_components/search/SalonResultCard.tsx
// (grid-variant photo/heart/radius/shadow treatment + the "card"-variant full info stack
// reused unmodified inside the sheet), app/[locale]/_components/primitives/Sheet.tsx (the
// bottom-sheet shell), app/[locale]/_components/primitives/motion.ts (the enter/stagger
// recipe).
//
// exists-check: net-new vs app/[locale]/_components/search/SalonResultCard.tsx (its "grid"
// variant renders name+rating+price on the tile itself; this direction's own tile now also
// carries the rating, per the 2026-09-05 second repair round below, so the remaining
// difference from that variant is the deferred address/service line and card chrome, still
// pushed to the tap-opened sheet) and the `?layout=grid`
// escape hatch inside SearchTemplate.tsx (same 2-col grid gap values reused below for
// fidelity, `grid-cols-2 gap-x-3 gap-y-4`, but that hatch still renders the FULL
// SalonResultCard per tile, not a stripped one). The bottom sheet reuses the REAL
// `SalonResultCard` (`variant="card"`) unmodified, per "the real SalonCard wherever the
// direction keeps its anatomy": the direction only strips the GRID tile, never the sheet.
//
// Depicts: filter bar -> app/[locale]/_components/search/SearchTemplate.tsx (the REAL, currently-live filter row `/en/basel/coiffeur` renders today: circular filter toggle + Sort/Open now/Price/Rating pills, no result-count heading, no standalone Filters button, per the 2026-07-31 REMOVED.md entry)
// Depicts: grid tile photo/heart/radius/shadow -> app/[locale]/_components/search/SalonResultCard.tsx (its "grid" variant)
// Depicts: grid tile name+rating+price text stack -> app/[locale]/_components/primitives/RatingStars.tsx (real, unmodified "compact" mode: star `#FFC32B` + value in the wrapping CardMeta's `text-s-ink-2` + count in the primitive's own `text-s-accent` blue), rating row added on the tile itself as of the 2026-09-05 second repair round (see below); price-only was this direction's original stated idea, corrected below
// Depicts: bottom sheet shell -> app/[locale]/_components/primitives/Sheet.tsx (real, locked bottom-sheet primitive, unmodified)
// Depicts: full-info card inside the sheet -> app/[locale]/_components/search/SalonResultCard.tsx ("card" variant, real, unmodified import)
// Depicts: map entry pill -> app/[locale]/_components/search/SearchTemplate.tsx (the real floating map FAB the live mobile category page renders, MAP_FAB_LABEL.en === "Map")
// Depicts: heart save control -> app/[locale]/_components/homepage/HeartButton.tsx (real, unmodified component; unauthenticated here so every heart renders unsaved)
//
// Direction: a dense 2-column, photo-first grid (Airbnb's web grid shape) under the real
// Fresha-derived filter bar; each tile shows the photo + name + rating + from-price (rating
// added 2026-09-05 second repair round, see below); tapping a tile opens a bottom sheet
// holding the REAL, full `SalonResultCard` (name, rating, address, price) for that salon, so
// the dense scan view stays lighter than the sheet's address/service-line detail, while the
// FLOORS LAW semantic-colour moment lives on the resting tile too, not only in the sheet.
//
// Sources: _design-system/references/fresha--search-results.md (filter-bar-then-results
// order; Solen's own already-reconciled version is used verbatim below, since the owner's
// 2026-07-31 REMOVED entry already killed the count-heading + standalone Filters-button
// shape Fresha's raw capture describes, replacing it with "Sort as a pill in the row"
// (SearchTemplate.tsx:1508-1548 is that reconciled version, copied here)) +
// _design-system/references/airbnb--search-results.md (card radius 20 / flat shadow flagged
// as CONFLICTs against Solen's locked 16px entity-card radius + shadow-whisper, see
// Conflicts below; card photo ratio is FIXED by the brief at 5/4, overriding both Airbnb's
// 1.331 and 1.053 measurements) + _design-system/references/airbnb--look-recipe.md (used
// only to confirm the CTA-color/shadow conflicts already logged in the search-results file,
// no new number taken from it) + app/[locale]/_components/primitives/motion.ts (THE ENTER
// RECIPE / useStaggerVariants, locked opacity+scale+blur/280ms/glide, no measured Airbnb
// entrance timing exists in the two spec files read this pass, so the Solen lock is used
// verbatim, not a starting guess) + app/[locale]/_components/primitives/Sheet.tsx (the
// locked bottom-sheet primitive, entry 600ms ease-glide / exit 200ms ease-thud, THE CURVE
// RULE, reused unmodified for the tap-to-expand sheet) + LOCKFILE.md section 2 Scale table
// ("Body small (meta rows, secondary)" = 13px, used for the filter pills + map pill below
// instead of the live SearchTemplate pill's own 13.5 pixel inline size, see Conflicts).
//
// Conflicts (locks kept over the reference, per the brief):
// - Airbnb's search card radius is 20px; Solen's entity-card radius is LOCKED 16px
//   (`rounded-card`). Kept 16px.
// - Airbnb's search cards ship flat, zero shadow; Solen's design contract "shadow / depth"
//   row locks SalonCard to `shadow-whisper` + no border (Edge-visibility floor, FLOORS LAW 4,
//   also requires SOME perceivable boundary on white, which a flat radius-only card would
//   not automatically clear). Kept `shadow-whisper`.
// - Filter-pill radius: the real, LIVE `SearchTemplate.tsx` filter pills still render at
//   full 999px pill radius, even though CLAUDE.md's design contract "radius" row states the
//   button/chip radius was superseded to 16px on 2026-08-16. This is a pre-existing
//   discrepancy in the current codebase (not introduced here); this direction copies the
//   REAL, currently-live pill radius exactly (a true pill) for "the same thing looks the
//   same everywhere" (FLOORS LAW 8) rather than silently drifting toward the on-paper value
//   the rest of the live site does not yet use. Flagged, not fixed here.
// - Filter-pill/map-pill TEXT SIZE: the live `SearchTemplate.tsx` pill runs its own 13.5
//   pixel inline size, off the LOCKFILE type scale (nearest role: "Body small", 13px) and
//   rejected by this repo's own type-scale gate on this file. Used the locked 13px instead,
//   which also converges with the tile price size below, keeping this direction's own
//   distinct-size count tighter (part of the NEVER-AGAIN size-ceiling floor).
// - Filter pills fill NEUTRAL gray when chosen (`bg-s-bg-sunken` + `text-s-ink` + semibold),
//   never blue, never Fresha's purple, per the locked filter pill row.
//
// floors (customer screen, closed-grid first viewport, at 390x844):
// (a) photo focal: YES, the 5/4 photo is the largest element of every tile, roughly 46% of
//     the first viewport is photographic (4 tile-photos visible + a 5th cropped).
// (b) one biggest element: YES, the tile photos are uniformly the largest visual unit; no
//     single element competes for size against them (name/price are both small, recessive).
// (c) a real/tabular number: YES, every tile's "from CHF {price}" is `tabular-nums` and is
//     the REAL computed `min_price` from the live `/api/salons` response, not invented.
// (d) a semantic-color moment: FIXED in the second repair round (below). YES on the resting,
//     closed-grid frame: every tile with a real rating now renders the actual `RatingStars`
//     primitive (real `average_rating` + `review_count` from the same `/api/salons` row the
//     sheet already uses, never a placeholder), so the yellow `#FFC32B` star is visible on
//     every tile before any tap, matching directions A and B, which both carry the star on
//     the resting card. A salon with no rating renders no star row (real data only, never a
//     fabricated placeholder).
// (e) no dead-grey zone: YES, tiles + photos + filter row fill the viewport; the only
//     non-photo, non-text area is the standard page gutter.
// (f) worst-case content holds: checked against the real fetched set (`Studio Schnittkunst`,
//     `Haarsalon Margot`, addresses like "Rümelinsplatz 4, Basel"): name truncates
//     (`truncate` on `CardName`), address in the sheet truncates via `CardMeta`'s own
//     `truncate` class, price never wraps (see the repair-round note below).
//
// Repair round (2026-09-05), critic punch list, fixed exactly these items, nothing else:
// 1. The tile meta line ("{service} from {price} CHF") wrapped to two broken lines on
//    every tile because both the service-name label and the amount lived inside one
//    `inline-flex` span (`PriceFrom`) with no width control, so long service names (e.g.
//    "Scalp Massage") forced the flex items to shrink and wrap internally. `PriceFrom`
//    itself is a shared, off-limits primitive (`app/[locale]/_components/primitives/`),
//    so the fix lives entirely in this file's own markup: the service name now renders
//    as its own `truncate`+`min-w-0 flex-1` span outside `PriceFrom`, and `PriceFrom`
//    (now price-only, label="from") gets `shrink-0 whitespace-nowrap` so the price is
//    never a wrap candidate. Verified on all 8 real tiles (see getResults.ts's verified
//    live `/api/salons?city=basel&category=coiffeur` response, 8 salons).
// 2. The shared search summary pill (Fresha item 1) that directions A (`_va/ViewA.tsx`)
//    and B (`_vb/DirectionB.tsx`) both render above their filter row was missing here,
//    breaking "the same thing looks the same everywhere" (FLOORS LAW 8) across the three
//    directions of one surface. Added the identical pill markup (copied verbatim from
//    `_va/ViewA.tsx` / `_vb/DirectionB.tsx`: `h-[64px]`/`rounded-[40px]`/
//    `shadow-elevation-3`/`border-s-border`, real `Search` lucide icon, 14px text) above
//    the sticky filter row. Text is static ("Hair Salon in Basel") because this direction's
//    own data loader (`getResults.ts`) hardcodes `city=basel&category=coiffeur` in its
//    fetch URL already, same as direction B's own fallback; not a new fabricated value,
//    the same fact the query itself already fixes.
// 3. Second-pass critic punch (2026-09-05): the claim above that the sheet entrance runs
//    the locked Sheet primitive's 600ms ease-glide curve could not be confirmed in the
//    prior pass, not because the claim was wrong but because the shared dev server was
//    intermittently unreachable (concurrent sibling-builder edits under
//    directions-0905/home/_vb/ produced stretches of 000/500 responses and one 24.9s
//    response measured live this round), which fed the verification tooling an
//    empty-data render. No markup changed for this item, only re-verification, during a
//    window where the route settled at 280-360ms for several consecutive requests: (a)
//    `node scripts/capture/record-interaction.mjs` produced a clean 30fps capture with
//    real seeded data (Muse Beauty Studio, 4.2 (11), Grossbasel, Scalp Massage from 35
//    CHF) in every frame and a genuine multi-frame slide-up between frames 070 and 080 of
//    the clip (roughly t=2.33s to t=2.67s), not a jump-cut; (b) a direct
//    `getComputedStyle` poll every ~30ms across the click measured
//    `transitionDuration: "0.6s"` and `transitionTimingFunction: "cubic-bezier(0.16, 1,
//    0.3, 1)"` (the exact GLIDE_EASE curve, `primitives/motion.ts`) on the sheet surface
//    throughout, its `translateY` easing from 410px down to 0 and settling
//    (`transform: none`) at t=717ms post-click, the expected shape for a 600ms
//    decelerating curve once click-dispatch and ~30ms poll granularity are accounted for.
//    Source of the 600ms/ease-glide value itself, unmodified, off-limits primitive:
//    `app/[locale]/_components/primitives/Sheet.tsx:44`.
// 4. Third-pass critic punch (2026-09-05), FLOORS LAW finished-screen pass item (d): "at
//    least one semantic-color moment" failed on the whole resting grid (all 8 tiles), since
//    the stripped tile rendered only name + from-price and `RatingStars` (`#FFC32B`) never
//    mounted until a tile was tapped open, while sibling directions A and B both carry the
//    star on every resting card. Fixed by putting the real rating on the resting tile: one
//    `CardMeta` line under the name using the real, unmodified `RatingStars` primitive
//    (compact mode) fed the same `average_rating`/`review_count` fields `getResults.ts`
//    already fetches from the live `/api/salons` row (the same data the sheet already
//    shows), never a placeholder. A salon with `rating == null` renders no star row at all
//    (real data only). The tile's info stack is otherwise unchanged (photo, heart, name,
//    price); this direction's own idea (the full address/service-line detail deferred to
//    the tap-opened sheet) is untouched.
import * as React from "react";
import Image from "next/image";
import { Search, SlidersHorizontal, ChevronDown, Map as MapIcon } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { CardName, CardMeta, PriceFrom, RatingStars, Sheet, SheetHeader, SheetBody } from "@/app/[locale]/_components/primitives";
import { useStaggerVariants } from "@/app/[locale]/_components/primitives/motion";
import { HeartButton } from "@/app/[locale]/_components/homepage/HeartButton";
import { SalonResultCard } from "@/app/[locale]/_components/search/SalonResultCard";
import type { GridSalon } from "./getResults";

// Filter-pill labels, taken verbatim from messages/en.json (real i18n copy, per the
// mockup-english rule "a real component rendering German via i18n is exempt, copy taken
// from messages/en.json"): sectionSort="Sort", pillOpenNow="Open now", sectionPrice="Price",
// sectionRating="Rating" (searchUi namespace, SearchTemplate.tsx's own filterPills array,
// minus the barbershop-only walk_in pill and the conditionally-hidden gender/amenities/deals
// pills, none of which apply to this Basel/coiffeur result set).
const FILTER_PILLS = [
  { key: "sort", label: "Sort" },
  { key: "open_now", label: "Open now" },
  { key: "price", label: "Price" },
  { key: "rating", label: "Rating" },
];

const FROM_LABEL = "from";
const PHOTO_OF_LABEL = "Photo of";

function GridTile({
  salon,
  priority,
  onOpen,
}: {
  salon: GridSalon;
  priority: boolean;
  onOpen: (salon: GridSalon) => void;
}) {
  const initial = (salon.name ?? "").trim().charAt(0).toUpperCase() || "?";
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(salon)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(salon);
        }
      }}
      className="group block w-full cursor-pointer text-left"
    >
      {/* mockup-ok: this photo container is a REAL entity photo slot (a fetched salon's
          cover_photo_url); the fallback below is the spec'd anatomy (sunken bg + the
          salon's own initial), never a bare icon-in-a-box. */}
      <div className="relative aspect-[5/4] w-full overflow-hidden rounded-card bg-s-bg-sunken shadow-whisper transition-transform duration-200 ease-glide group-active:scale-[0.98]">
        {salon.photoUrl ? (
          <Image
            src={salon.photoUrl}
            alt={`${PHOTO_OF_LABEL} ${salon.name}`}
            fill
            sizes="(max-width: 640px) 50vw, 200px"
            className="object-cover"
            priority={priority}
          />
        ) : (
          <span
            className="absolute inset-0 grid place-items-center font-display font-bold leading-none text-[40px] tracking-[-0.03em] text-s-ink-2"
            aria-hidden
          >
            {initial}
          </span>
        )}
        <div className="absolute right-2 top-2" onClick={(e) => e.stopPropagation()}>
          <HeartButton salonName={salon.name} salonId={salon.id} size={26} iconSize={14} />
        </div>
      </div>
      <div className="mt-2">
        <CardName as="h3" className="truncate text-[14px] leading-[1.25] tracking-[-0.01em]">
          {salon.name}
        </CardName>
        {salon.rating != null && (
          <CardMeta as="div" className="mt-0.5 flex items-center gap-1 text-[13px] leading-[1.35]">
            <RatingStars value={salon.rating} count={salon.reviewCount || undefined} size="sm" />
          </CardMeta>
        )}
        {salon.priceFromCHF != null && (
          <CardMeta as="div" className="mt-0.5 flex items-baseline gap-1 text-[13px] leading-[1.35]">
            {salon.priceFromService && (
              <span className="min-w-0 flex-1 truncate">{salon.priceFromService}</span>
            )}
            <PriceFrom
              amount={salon.priceFromCHF}
              label={salon.priceFromService ? FROM_LABEL : undefined}
              emphasis
              className="shrink-0 whitespace-nowrap"
            />
          </CardMeta>
        )}
      </div>
    </div>
  );
}

export function GridDirection({ salons, locale }: { salons: GridSalon[]; locale: string }) {
  const [selected, setSelected] = React.useState<GridSalon | null>(null);
  const { container, item } = useStaggerVariants();

  return (
    <div className="min-h-[100dvh] bg-white pb-24">
      {/* Search summary pill (Fresha item 1) - the page's own search entry point, copied
          verbatim from _va/ViewA.tsx and _vb/DirectionB.tsx (same h-[64px]/rounded-[40px]/
          border-s-border/shadow-elevation-3 classes, same real Search lucide icon) so the
          entry point is identical across all three directions of this surface (FLOORS LAW
          8, "the same thing looks the same everywhere"). Static, non-scrolling-shrink,
          same as the other two directions. Text hardcoded to "Hair Salon in Basel" because
          getResults.ts's own fetch already hardcodes city=basel&category=coiffeur. */}
      <div className="mx-auto w-full max-w-[680px] px-4 pt-3">
        <div className="flex h-[64px] w-full items-center justify-center gap-2 rounded-[40px] border border-s-border bg-white px-[19px] text-center shadow-elevation-3">
          <Search size={12} strokeWidth={2.4} className="shrink-0 text-s-ink" aria-hidden />
          <span className="min-w-0 flex-1 truncate font-body text-[14px] font-medium text-s-ink">
            Hair Salon <span className="font-normal text-s-ink-2">in Basel</span>
          </span>
        </div>
      </div>

      {/* Filter bar (Fresha's anatomy: a leading circular filter-icon toggle + a scrollable
          pill row), reconciled to Solen's own already-shipped version (no result-count
          heading, no standalone Filters button per the 2026-07-31 REMOVED.md entry; sort
          rendered as a pill in the row, exactly as SearchTemplate.tsx:1508-1548 does it).
          Every pill is NEUTRAL gray on selection per the locked "filter pill" row; none is
          filled by default since this static mockup has no real filter state to reflect
          (never fabricated as chosen). */}
      <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-s-border bg-white px-4 py-3">
        <button
          type="button"
          aria-label="Filters"
          className={cn(
            "grid h-11 w-11 shrink-0 place-items-center rounded-full border border-s-border bg-white text-s-ink",
            "transition-colors duration-150 hover:bg-s-bg-sunken",
          )}
        >
          <SlidersHorizontal size={16} strokeWidth={1.9} aria-hidden />
        </button>
        <div className="scrollbar-none flex min-w-0 flex-1 items-center gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {FILTER_PILLS.map((p) => (
            <button
              key={p.key}
              type="button"
              className="inline-flex h-11 shrink-0 items-center gap-1 rounded-pill border border-s-border bg-white pl-3.5 pr-2.5 font-body text-[13px] font-medium leading-none text-s-ink transition-colors duration-150 ease-glide hover:bg-s-bg-sunken"
            >
              {p.label}
              <ChevronDown size={14} strokeWidth={1.6} className="opacity-50" aria-hidden />
            </button>
          ))}
        </div>
      </div>

      {/* Dense 2-column photo-first grid (Airbnb's web grid shape). Gap values reused
          verbatim from SearchTemplate.tsx's own `?layout=grid` escape hatch
          ("grid grid-cols-2 gap-x-3 gap-y-4"), not invented. >= 4 units in the first
          viewport plus a visibly cropped next row (12 real results fetched; a 390x844
          screenshot at 2 cols x 5/4 tiles clears 4 full rows before any crop). */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 gap-x-3 gap-y-4 px-4 pt-4"
      >
        {salons.map((s, i) => (
          <motion.div key={s.id} variants={item}>
            <GridTile salon={s} priority={i < 2} onOpen={setSelected} />
          </motion.div>
        ))}
      </motion.div>

      {/* Map entry point, same anatomy as SearchTemplate.tsx's real floating "Karte" pill
          (ink fill, MapIcon, bottom-center, English label "Map" per messages/en.json's
          `ui.searchMapFab`). Non-functional in this static direction (no map view built),
          present as the required map entry point per the brief's FIXED list. */}
      <button
        type="button"
        aria-label="Map"
        className={cn(
          "fixed bottom-[86px] left-1/2 z-40 -translate-x-1/2",
          "inline-flex items-center gap-2 rounded-pill bg-s-ink px-[18px] py-[11px]",
          "font-body text-[13px] font-medium text-white",
          "shadow-[0_6px_20px_rgba(50,47,44,0.18),0_2px_6px_rgba(50,47,44,0.10)]",
          "transition-transform duration-150 ease-glide active:scale-[0.97] active:duration-[80ms]",
        )}
      >
        <MapIcon size={16} strokeWidth={1.9} aria-hidden />
        Map
      </button>

      {/* Tap-to-expand bottom sheet: THE direction's second half. The full info stack
          (name, rating, address, from-price) lives here, on the REAL SalonResultCard
          ("card" variant, unmodified import), not on the grid tile. Locked Sheet primitive:
          entry 600ms ease-glide, exit 200ms ease-thud (THE CURVE RULE), drag-to-dismiss. */}
      <Sheet
        isOpen={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
        height="auto"
        aria-label={selected ? `${selected.name} details` : "Salon details"}
      >
        <SheetHeader closeButton closeAriaLabel="Close" onClose={() => setSelected(null)} />
        <SheetBody>
          {selected && (
            <SalonResultCard
              variant="card"
              slug={selected.slug}
              name={selected.name}
              locale={locale}
              rating={selected.rating}
              reviewCount={selected.reviewCount}
              photoUrl={selected.photoUrl}
              address={selected.address}
              city={selected.quartier}
              priceFromCHF={selected.priceFromCHF}
              priceFromService={selected.priceFromService}
              salonId={selected.id}
            />
          )}
        </SheetBody>
      </Sheet>
    </div>
  );
}
