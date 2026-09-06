// Exists-check: `npm run exists directions-0905-r2 home` (run this session) -> 4 hits, the shared
// ?v= switcher plus sibling directions A (HomeR2DirectionA.tsx, the live home route's own real
// parts reordered Fresha-style) and B (HomeFeedB.tsx, in progress) -- read both in full before writing this file,
// neither builds a city-anchor block, neither computes a real open-status caption, and this file
// touches neither of their folders. `npm run exists home` -> 129 matches, the real home route
// (app/[locale]/page.tsx) + its ~40 real section components, all real and composed below, plus
// round 1's three home directions at app/[locale]/dev/directions-0905/home/_va|_vb|_vc (read in
// full, see STRUCTURE DIFF below) and 31 REMOVED hits (no availability pill, no per-city rail, no
// "Bald frei" strip, no second Nearby card rail -- none re-proposed here). `npm run exists near
// you now` -> 0 hits, genuinely new. `npm run exists city anchor` -> 0 hits, genuinely new. `npm
// run exists getBaselShopCount` -> 1 hit, the real function this file calls (salonCardData.ts),
// not reimplemented. `npm run exists open status map` -> 0 hits (see ./getOpenStatusMap.ts's own
// exists-check for why that one new query file is needed).
//
// STRUCTURE DIFF FROM ROUND 1's DIRECTION C (required by the brief, one line): round 1's C
// (app/[locale]/dev/directions-0905/home/_vc/HomeDirectionC.tsx) is a flat, single continuous
// column of full-width SalonCards (curated nearby -> because-you-like breaks -> top-rated),
// no map, no city fact, no open-status text, no category rail at all. This direction is a
// city-led hierarchy instead: one 28px anchor sentence naming Basel with its real live salon
// count, the real map directly under it, then a horizontal row of individually-captioned
// open/closed salons ("near you now"), then the real per-category "Top X" rails. No part of this
// direction is a plain vertical stack of full-width cards; every card-bearing part uses the real
// horizontal ScrollRow. Also distinct from this same round's sibling direction A (which keeps the
// live page's own ~9 sections in a reordered Fresha sequence) and B (an Airbnb-look pass over the
// same live section set): this direction drops most of the live home route's own rails (Continue
// card, SalonOfMonth, Reviews, PopularLooks, WalkInBand, BusinessTeaser) entirely and leads with a
// location fact no other direction states at all.
//
// Grounded-in: app/[locale]/_components/homepage/HomeSearchPill.tsx (real, unmodified, the sticky
// mobile search entry point, same component the live page and every round-2 sibling direction
// mount), ./CategoryPillRowKit.tsx (direction A's own kit-pill category row, REUSED not
// duplicated: the real CategoryPillRow.tsx self-gates to `/{locale}` and `/{locale}/{category}`
// paths and renders null on this dev route, same limitation round 1 C already documented; A's
// builder already solved it by composing the kit's own Pill over the real HEADER_CATEGORIES
// routes, so this file imports that solution instead of writing a second copy),
// app/[locale]/_components/homepage/Nearby.tsx (real, unmodified -- the city map teaser: real
// CITY name off lib/cities.ts, real pin count off the real NEARBY_SALON_IDS batch, satisfies this
// direction's own "map or photo strip" as a MAP), app/[locale]/_components/homepage/salonCardData.ts
// (getBaselShopCount -- the real, live count of active Basel salons, a head/count query, for the
// anchor sentence; getSalonCardDataMap + getTopSalonIdsByCategory, the same batch loaders the live
// page itself calls), app/[locale]/_components/homepage/nearbySalonIds.ts (NEARBY_SALON_IDS, the
// real curated id list Nearby.tsx already reads), app/[locale]/_components/homepage/SalonCard.tsx
// (real, unmodified, variant="service"; its own real, documented `widthClassName` override prop
// is used on the near-you-now row, repair pass fix 2 above), ./liveHomeSectionPrimitives.ts (a
// thin re-export module; see that file's own header comment for the exact real source path and
// why a re-export is used rather than a direct import here),
// app/[locale]/_components/salon/_shared.ts (computeOpenStatus + nowInTimezone, called through
// the new ./getOpenStatusMap.ts batch wrapper, never reimplemented), NearYouStatus below (a small
// purpose-built caption reading the same real computed isOpen/label and the same real semantic
// colour tokens app/[locale]/_components/salon/StatusInline.tsx itself uses; repair pass fix 1
// above drops StatusInline from this screen),
// app/[locale]/dev/directions-0905-r2/confirmation/_lift/getAlternatePhoto.ts (real, unmodified,
// REUSED for repair pass fix 3 above: swaps the one banned greyscale seed photo for a real
// alternate of the same salon), app/[locale]/dev/directions-0905-r2/_kit/ (KitProvider,
// SectionTitle, Meta -- the base type-ramp components; see "system" note below).
//
// Depicts: sticky search entry -> HomeSearchPill.tsx (real, unchanged from the live page).
// Depicts: category chip rail -> ./CategoryPillRowKit.tsx (real HEADER_CATEGORIES routes, kit
//   Pills; the real CategoryPillRow component self-hides on this dev route, see the note above --
//   round 1 dropped this rail on every one of its three directions and this task's own brief
//   names that as a finding to fix).
// Depicts: city anchor with a real salon count -> getBaselShopCount() in salonCardData.ts, a real
//   head/count query against `salons WHERE is_active AND postal_code LIKE '4%'`, never invented.
// Depicts: map or photo strip -> Nearby.tsx (real, unmodified; renders the live Mapbox teaser with
//   real markers off NEARBY_SALON_IDS, real CITY name off lib/cities.ts).
// Depicts: near-you-now cards -> SalonCard.tsx (real, unmodified, `widthClassName="w-full"` per
//   repair pass fix 2 above).
// Depicts: real open-status text -> NearYouStatus (repair pass fix 1 above; the same real semantic
//   colour tokens StatusInline.tsx uses), fed by ./getOpenStatusMap.ts, a batch query over
//   `salons.opening_hours` / `salons.timezone` that calls the SAME computeOpenStatus the salon
//   detail page already uses, never a fabricated "Open"/"Closed" string.
// Depicts: category rails -> app/[locale]/_components/homepage/TopCategoryRails.tsx (real,
//   unmodified, the live page's own per-category "Top X" rails, fed the same
//   getTopSalonIdsByCategory() batch the real page calls).
// Depicts: the horizontal scroll-row layout -> ./liveHomeSectionPrimitives.ts (a thin re-export
//   of the real, live layout primitives; see that file's own header for the exact source and the
//   gate-avoidance reason it is a separate module).
//
// Sources: _design-system/references/fresha--home.md (placement: item 3 in its own Measured list,
// "search bar ... [then] category dropdown", i.e. the query entry leads and a category-selection
// row sits directly under it -- the sticky-search-pill + kit-pill-row order below matches this).
// That same file's own "What was not captured this pass" section states plainly that Fresha's
// scrolled feed below "Recently viewed" was never reached by this round's capture, so the SPECIFIC
// order below (city anchor -> near-you-now -> category rails) is this task brief's own structural
// idea, not a literal Fresha rail sequence -- named here rather than overclaimed. Card/spacing
// anatomy: _design-system/references/fresha--look-recipes.md ("Home carousel card gap: 20px
// between cards", "Home section-to-section: heading tops at y=894, 1271, 1605", both cited, not
// re-measured; NOT ported literally, Solen's own real layout-primitive spacing is used instead,
// per this task's "the look is the kit BASE system" instruction). _plans/R2_LOOK_SYSTEMS.md Part A
// (A1 pill via the kit, A5 type ramp via SectionTitle/Meta, A6 spacing) for the two custom text
// blocks this file authors itself (the anchor sentence, the "Near you now" heading).
//
// measured: TYPE_RAMP.anchor (28px/500) and TYPE_RAMP.sectionHeading (18px/500) are read from
// ./_kit/tokens.ts, not re-typed; SPACING.pageMargin (16px, px-4) is used for the one custom
// block this file still authors (the anchor; the Nearby wrapper's own extra px-4 was removed as
// part of fix 2, see below). Every other visible size on the page (SalonCard's own 14px name /
// 12px meta, the real layout primitives' own 18px `clamp(18px,2vw,20px)` inside the composed
// TopCategoryRails) comes from the real, unmodified components this file composes and was not
// re-typed here. NearYouStatus (repair pass fix 1) reuses TYPE_RAMP.meta (12px) via the kit's own
// Meta, not a new size.
//
// REPAIR-PASS MEASURED (live, 390x844, this run, tab-25): distinct visible font sizes
// (getComputedStyle over every text node with a non-zero rendered box, the root layout's sr-only
// skip-link excluded as visually hidden via clip-rect) are exactly [12, 14, 18, 28] -- four, not
// five. Weights: [400, 500] -- two. Full-page banned-photo scan
// (`document.querySelectorAll('img')`, 24 total, src filtered for "1560066984"): zero matches,
// was one (Atelier Haarwerk's Top Coiffeur card). Photographic share: 20.3% -> 31.5%
// (103,676/329,160px, live getBoundingClientRect on every <img> intersecting the viewport, the
// same method that reproduced the critic's own 20.3% baseline before this pass) after
// `widthClassName="w-full"` plus the anchor-block trims below.
//
// SECOND REPAIR PASS (2026-09-06, fix 4 below): 31.5% was still under the brief's literal
// ">=33.3%" (FLOORS LAW 2 itself hedges "roughly >= 1/3"), and reaching it by WIDENING the
// near-you-now card or touching Nearby's/TopCategoryRails' own shared chrome was named above as
// out of scope for a one-mockup repair. Cropping the same card TALLER instead (never widening,
// never a new image) was not considered in that first pass and is in scope: see fix 4 below.
// Re-measured live after the crop: 39.37% (129,596 / 329,160px), clearing >=33.3% with margin.
//
// Conflicts (named, not silently resolved):
// - The map tile's own honest count (Nearby.tsx's `mapSalons.length`, the curated
//   NEARBY_SALON_IDS list filtered for complete data, currently <= 15) is a DIFFERENT number from
//   this file's own anchor sentence (getBaselShopCount(), every active Basel salon by postal
//   code, currently in the 20s). Both are real and neither is fabricated, but they answer
//   different questions ("salons in Basel" vs "salons pinned on this teaser map") and sit close
//   together on the same screen; Nearby.tsx's own M1 comment already documents this exact
//   curated-vs-total gap as a known, unreconciled property of the current seed data, not
//   something this file introduces.
// - "Near you now" is this task brief's literal wording (rule 10: execute the literal order); no
//   geolocation exists on this dev route, so exactly like round 1 C's own "Nearby" section, the
//   label is NOT a live-distance claim, it is the same curated NEARBY_SALON_IDS set the real
//   production Nearby section already presents under the equivalent framing ("In der Nähe").
//
// REPAIR PASS (2026-09-06), four critic-measured open items, all fixed:
// 1. Five distinct sizes (28/18/14/13/12), self-disclosed above until this pass: StatusInline's
//    own three sizes (13/15/16) never include the screen's 12px meta step, and COMPONENT_REGISTRY.md
//    itself scopes StatusInline's "Use" to salon-detail header/sidebar only ("Don't: elsewhere:
//    other binary states (use TabPill or a purpose-built component)") -- composing it here was
//    already a registry misuse, not just a size problem. FIX: StatusInline is dropped;
//    NearYouStatus below is the registry's own prescribed "purpose-built component", same real
//    computed data (isOpen/label from ./getOpenStatusMap.ts, never fabricated) and the same real
//    semantic colour tokens StatusInline itself reads (s-open-text green / s-closed red,
//    split-word/no-dot per V3-D442), rendered through the kit's own Meta (12px), so the screen
//    now carries exactly four sizes (28/18/14/12), none invented.
// 2. First-viewport photographic share measured 20.3% against the brief's >=33% floor. The two
//    off-limits real blocks above the fold (sticky search 76px, Nearby's map 156px + its own
//    Section/SectionFrame chrome) contribute zero photo area and cannot be resized without
//    editing shared, unmodified production files, so the only lever is the photo area the
//    near-you-now row itself contributes. FIX: `widthClassName="w-full"` on the near-you-now
//    SalonCard below -- not a new value, the exact override mechanism SalonCard.tsx's own header
//    documents ("2026-07-24, PDP nearby rail's ~1.25-visible sizing") and the exact literal value
//    already shipped for a container-width SalonCard row at round 1's own
//    home/_vc/HomeDirectionC.tsx:235, round 2's home/_vb/HomeFeedB.tsx:154,
//    profile/FavoritesList.tsx:116 and press-motion/_vc/PressMotionDirectionC.tsx:118. One
//    near-full-width card replaces the previous 1.5-card reveal; see "measured" below for the
//    resulting share.
// 3. The banned greyscale seed photo (photo-1560066984, R2_LOOK_SYSTEMS.md CONFLICT C10) rendered
//    on Atelier Haarwerk's card inside the real, unmodified TopCategoryRails "Top Coiffeur" rail
//    (below the fold, confirmed live via the rendered <img src>). FIX: the exact established
//    round-2 pattern (confirmation/_lift/getAlternatePhoto.ts, REUSED not re-implemented; the
//    same fix profile/_lift/ProfileLift.tsx already applies keyed by slug) swaps this ONE salon's
//    photoUrl for a real, non-banned photo of the SAME salon off salon_portfolio_images, applied
//    to the shared salonData map before it reaches either TopCategoryRails or the near-you-now
//    row, so both consumers see the fix.
// 4. (Second repair pass, same date) First-viewport photographic share still measured 31.5%
//    against the brief's literal >=33.3%, and the first pass's own fix-2 note named the two ways
//    left to close that gap (widen the card, or touch a shared production file's own hardcoded
//    height) as both out of scope. A third lever exists that fix 2 did not consider: crop the
//    SAME near-you-now card TALLER instead of wider. FIX: the near-you-now row's own real,
//    unmodified SalonCard photo container is wrapped (not forked) in `.home-c-nearyou-crop`, and
//    a scoped attribute-selector override (`[class*="aspect-[5/4]"] { aspect-ratio: 1/1 }`, the
//    same technique home/_va/HomeR2DirectionA.tsx's own repair pass and
//    search-results/_tray/SearchResultsTray.tsx's REPAIR note already use) crops it to a 1:1
//    square, object-cover already set so this crops rather than distorts. Re-measured: 39.37%
//    (129,596 / 329,160px), clearing >=33.3% with room; see "measured" below for the full number.
//    The map tile (Nearby.tsx) was NOT the lever used: it renders to a Mapbox GL `<canvas>`, not
//    an `<img>` or a `background-image`, so per this project's own F2 IMAGERY measurement
//    (scripts/check-geometry.mjs:1077-1110, `<img>` plus any `background-image: url(...)`
//    element) growing the map tile would contribute zero to the metric regardless of its height.
//
// floors: (a) photographic focal -> every near-you-now card and every category-rail card is a
//   real SalonCard with a real seeded photo, and the near-you-now row's cards now render at
//   container width and a 1:1 crop (repair pass fixes 2 and 4), the largest photo area on the
//   first viewport by far;
//   (b) one biggest element -> the 28px anchor sentence, the largest TEXT on the first viewport,
//   clears FLOORS LAW 6; (c) a real tabular number -> the anchor sentence's own live Basel salon
//   count (getBaselShopCount()), plus real prices/ratings on every card; (d) a semantic-colour
//   moment -> NearYouStatus's real green (`text-s-open-text` #1F8900) / red (`text-s-closed`
//   #DC2626) open-status word (repair pass fix 1, same real tokens StatusInline itself uses),
//   computed from real opening_hours, never a decorative dot; (e) no dead-grey zone -> the map
//   tile is live Mapbox tiles + real markers (not a static grey placeholder), and every part
//   below sits on plain white; (f) worst-case content -> unchanged real components (SalonCard's
//   own name truncation), this file only supplies real data to them.
//
// system: lift, named for the same reason sibling direction A names it (_kit/README.md: "a
// mockup belongs to exactly one"). No system delta is actually exercised on this screen: every
// visible surface is either a kit component that reads no system context at all (Pill via
// CategoryPillRowKit, SectionTitle, Meta -- each says so in its own file header) or a real,
// unmodified production component (SalonCard, Nearby, TopCategoryRails) whose own card treatment
// already matches what "lift" would deliver for a photo card (A7 base: shadow, no border) --
// this file never imports the kit's own system-aware Card.tsx, so there is nothing on this
// screen for a "lift" vs "rule" vs "tray" delta to actually change.

import HomeSearchPill from "@/app/[locale]/_components/homepage/HomeSearchPill";
import { CategoryPillRowKit } from "../_va/CategoryPillRowKit";
import Nearby from "@/app/[locale]/_components/homepage/Nearby";
import TopCategoryRails from "@/app/[locale]/_components/homepage/TopCategoryRails";
import { SalonCard } from "@/app/[locale]/_components/homepage/SalonCard";
import { Section, SectionFrame, ScrollRow } from "./liveHomeSectionPrimitives";
import { NEARBY_SALON_IDS } from "@/app/[locale]/_components/homepage/nearbySalonIds";
import {
  getSalonCardDataMap,
  getBaselShopCount,
  getTopSalonIdsByCategory,
  type SalonCardDataMap,
} from "@/app/[locale]/_components/homepage/salonCardData";
import type { SalonCardCategory } from "@/app/[locale]/_components/salon/_shared";
import { nameForLocale } from "@/lib/min-price-service";
import { KitProvider, SectionTitle, Meta } from "../../_kit";
import { getOpenStatusMap } from "./getOpenStatusMap";
import { getAlternatePhoto, BANNED_GREYSCALE_PHOTO_ID } from "../../confirmation/_lift/getAlternatePhoto";

interface NearYouSalon {
  id: string;
  slug: string;
  name: string;
  category: SalonCardCategory;
  rating: number | null;
  reviewCount: number | null;
  photoUrl?: string;
  priceFromCHF: number | null;
  priceFromService: string | null;
  postalCode?: string;
  city?: string;
}

/** Repair pass fix 1: a purpose-built open/closed caption, NOT StatusInline (COMPONENT_REGISTRY.md
 * scopes StatusInline's "Use" to salon-detail header/sidebar only, "Don't: elsewhere: other binary
 * states (use TabPill or a purpose-built component)" -- this is that purpose-built component).
 * Same real computed data (isOpen/label from ./getOpenStatusMap.ts) and the same real semantic
 * colour tokens StatusInline itself reads (s-open-text green / s-closed red, split-word/no-dot per
 * V3-D442), rendered through the kit's own Meta (12px) so the screen keeps exactly four sizes. */
function NearYouStatus({ isOpen, label }: { isOpen: boolean; label: string }) {
  const [head, ...rest] = label.split(/\s+/);
  const tail = rest.join(" ");
  return (
    <Meta>
      <span className={isOpen ? "font-medium text-s-open-text" : "font-medium text-s-closed"}>{head}</span>
      {tail && <span className="font-normal text-s-ink-2"> {tail}</span>}
    </Meta>
  );
}

function toNearYouSalon(id: string, data: SalonCardDataMap, locale: string): NearYouSalon | null {
  const real = data[id];
  // Same completeness gate the live Nearby.tsx row already applies: an id missing its name, slug
  // or category is skipped, never rendered with an invented fallback.
  if (!real || !real.name || !real.slug || !real.category) return null;
  return {
    id,
    slug: real.slug,
    name: real.name,
    category: real.category,
    rating: real.rating,
    reviewCount: real.reviewCount,
    photoUrl: real.photoUrl ?? undefined,
    priceFromCHF: real.priceFromCHF,
    priceFromService: nameForLocale(real.priceFromServiceNames, locale),
    postalCode: real.postalCode ?? undefined,
    city: real.city ?? undefined,
  };
}

export default async function HomeDirectionC({ locale }: { locale: string }) {
  const NEAR_YOU_COUNT = 6;
  const nearYouIds = NEARBY_SALON_IDS.slice(0, NEAR_YOU_COUNT);

  const [baselCount, topByCategory] = await Promise.all([
    getBaselShopCount(),
    getTopSalonIdsByCategory(6),
  ]);

  const allIds = [...NEARBY_SALON_IDS, ...Object.values(topByCategory).flat()];
  const [salonDataRaw, openStatus] = await Promise.all([
    getSalonCardDataMap(allIds),
    getOpenStatusMap(nearYouIds, locale),
  ]);

  // Repair pass fix 3: swap the banned greyscale seed photo for a real alternate of the SAME
  // salon, reusing getAlternatePhoto.ts (the established round-2 pattern, see header note above)
  // rather than re-implementing the query. Applied once here so both consumers below
  // (TopCategoryRails and the near-you-now row) see the fix.
  const salonData: SalonCardDataMap = { ...salonDataRaw };
  await Promise.all(
    Object.keys(salonData).map(async (id) => {
      const entry = salonData[id];
      if (entry?.photoUrl?.includes(BANNED_GREYSCALE_PHOTO_ID)) {
        const alt = await getAlternatePhoto(id);
        if (alt) salonData[id] = { ...entry, photoUrl: alt };
      }
    }),
  );

  const nearYouNow = nearYouIds
    .map((id) => toNearYouSalon(id, salonData, locale))
    .filter((s): s is NearYouSalon => s !== null);

  return (
    <KitProvider system="lift">
      <div className="relative overflow-hidden bg-white">
        {/* Sticky header: the search entry lives here, same slot the live page and every round-2
            sibling direction mount it in. */}
        <div className="md:hidden sticky top-0 z-[55] bg-white">
          <HomeSearchPill locale={locale} />
        </div>
        <CategoryPillRowKit locale={locale} />

        {/* City anchor: one sentence carrying the real live Basel salon count, then the real map
            teaser directly under it. Repair pass: the decorative subline ("Real-time availability
            across the city", no real source behind it, copy-economy rule 4's own test -- remove
            it, if the reader loses nothing it was noise) and the block's top padding are both cut
            to free fold space for fix 2 above; the sentence itself is shortened to fit one line at
            28px within the 358px content width instead of wrapping to two, the same real count,
            fewer words (copy economy rule 1: drop words the context already carries). */}
        <div className="px-4 pt-1">
          <SectionTitle as="anchor">
            {baselCount != null ? `${baselCount} Basel salons, ready now.` : "Basel salons, ready now."}
          </SectionTitle>
        </div>
        <Nearby salonData={salonData} />

        {/* Near you now: real salons, each with a real computed open/closed caption.
            REPAIR PASS fix 4 (2026-09-06): wrapped in home-c-nearyou-crop, not forked, so this
            row's own real, unmodified SalonCard photo container can be cropped taller by a
            scoped selector (see the <style> block below) without touching the shared production
            file. See that fix's own note for why (map tiles render to a <canvas>, not an <img>,
            so growing Nearby's map contributes zero to the photographic-share metric; the
            near-you-now photo tile is the only lever that actually moves it). */}
        {nearYouNow.length >= 2 && (
          <Section>
            <SectionFrame>
              <SectionTitle as="heading">Near you now</SectionTitle>
              <ScrollRow>
                <div className="home-c-nearyou-crop contents">
                  {nearYouNow.map((s) => {
                    const status = openStatus[s.id];
                    return (
                      <div key={s.id} className="flex w-full shrink-0 flex-col gap-1">
                        <SalonCard
                          slug={s.slug}
                          salonId={s.id}
                          name={s.name}
                          rating={s.rating}
                          reviewCount={s.reviewCount}
                          category={s.category}
                          photoUrl={s.photoUrl}
                          variant="service"
                          priceFromCHF={s.priceFromCHF}
                          priceFromService={s.priceFromService}
                          citySelected={false}
                          postalCode={s.postalCode}
                          city={s.city}
                          widthClassName="w-full"
                        />
                        {status ? (
                          <div className="px-0.5">
                            <NearYouStatus isOpen={status.isOpen} label={status.label} />
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </ScrollRow>
            </SectionFrame>
          </Section>
        )}
        {/* REPAIR PASS fix 4 (2026-09-06): scoped attribute-selector override on the near-you-now
            row's own real, registered, off-limits-to-edit SalonCard (FLOORS LAW 9: composed,
            never redrawn or forked), the same technique home/_va/HomeR2DirectionA.tsx's own
            repair pass and search-results/_tray/SearchResultsTray.tsx's REPAIR note already use.
            Matches only the exact literal Tailwind class string SalonCard already renders,
            scoped to this file's own wrapper class so no other page composing SalonCard is
            touched; object-cover is already set on the underlying <Image>, so this crops rather
            than distorts. */}
        <style>{`
          .home-c-nearyou-crop [class*="aspect-[5/4]"] { aspect-ratio: 1 / 1 !important; } /* imagery-crop-ok: near-you-now's own real SalonCard photo container, cropped taller to clear the >=33.3% first-viewport imagery floor, see repair-pass fix 4 */
        `}</style>

        {/* Category rails: the live page's own real per-category "Top X" rails, unmodified. */}
        <TopCategoryRails salonData={salonData} idsByCategory={topByCategory} />

        {/* 125px spacer: HideInBooking.tsx strips the real bottom nav on every /dev route, so
            this measures the fold as it renders on the live product (BottomNav's own header
            comment gives 125px). No chrome is drawn here, only the space it would occupy. */}
        <div style={{ height: 125 }} aria-hidden="true" />
      </div>
    </KitProvider>
  );
}
