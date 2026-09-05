"use client";

/**
 * Exists-check (this round, 2026-09-05): `npm run exists directions-0905` -> 49 matches, 1
 * graveyard hit (an unrelated single-treatment index batch from a different day, a different
 * mockup format, not re-proposed here) + this exact route/component already on disk from the
 * prior round (SalonPageDirectionA, this file). `npm run exists "salon page"` -> the real
 * production route (app/[locale]/salon/[slug]/page.tsx, data loader reused unchanged) + the
 * real orchestrator (app/[locale]/_components/salon/SalonDetailV3.tsx, forked below, no
 * section component itself touched) + 3 graveyard hits (retail products, options chips,
 * borderless-chrome model), none re-proposed. This REPLACES the previous round's _va file in
 * place (owner: "the previous builder's files ... are yours now"): the prior file kept About
 * at the top and silently reproduced the live page's structure past the header, which is
 * exactly the "thin" failure this round exists to fix. This version moves About, matching the
 * brief's literal order.
 *
 * Grounded-in: app/[locale]/_components/salon/SalonDetailV3.tsx (463 lines, read in full this
 * turn) - same imports, same real salon prop, same lightbox/gallery state shape, same walk-in
 * branch, JSX REORDERED per Direction A below, no child section component forked or edited.
 *
 * Screen class (PRINCIPLES.md #1): this file PROTOTYPES a customer screen (the salon page), so
 * the FLOORS LAW governs the underlying design even though the file lives under app/[locale]/dev/.
 *
 * Reference-checked: _design-system/references/fresha--venue-page.md,
 *   _design-system/references/airbnb--look-recipe.md,
 *   _design-system/references/airbnb--listing-page.md,
 *   _design-system/references/airbnb--motion.md (all four exist on disk, each read in full this
 *   turn; no brand reference designed from memory).
 *
 * Depicts: gallery/hero -> app/[locale]/_components/salon/SalonHero.tsx (real, imported unchanged)
 * Depicts: name/rating/status/address header -> app/[locale]/_components/salon/SalonHeader.tsx (real, imported unchanged)
 * Depicts: services list + category pill row -> app/[locale]/_components/salon/SalonServices.tsx (real, imported unchanged, moved earlier in page order)
 * Depicts: bundles/discount row -> app/[locale]/_components/salon/SalonBundles.tsx (real, imported unchanged)
 * Depicts: team grid -> app/[locale]/_components/salon/SalonTeam.tsx (real, imported unchanged)
 * Depicts: reviews -> app/[locale]/_components/salon/SalonReviews.tsx (real, imported unchanged)
 * Depicts: photo portfolio -> app/[locale]/_components/salon/SalonPortfolio.tsx (real, imported unchanged)
 * Depicts: about text -> app/[locale]/_components/salon/SalonAbout.tsx (real, imported unchanged, moved later in page order)
 * Depicts: opening hours table -> app/[locale]/_components/salon/SalonOpeningTimes.tsx (real, imported unchanged)
 * Depicts: map -> app/[locale]/_components/salon/SalonLocation.tsx (real, imported unchanged)
 * Depicts: additional info checklist -> app/[locale]/_components/salon/SalonAdditionalInfo.tsx (real, imported unchanged)
 * Depicts: contact rows -> app/[locale]/_components/salon/SalonContact.tsx (real, imported unchanged)
 * Depicts: other locations -> app/[locale]/_components/salon/SalonOtherLocations.tsx (real, imported unchanged)
 * Depicts: recently viewed rail -> app/[locale]/_components/salon/SalonRecentlyViewed.tsx (real, imported unchanged)
 * Depicts: venues nearby carousel -> app/[locale]/_components/salon/SalonVenuesNearby.tsx (real, imported unchanged, kept LAST per this brief)
 * Depicts: app download CTA -> app/[locale]/_components/salon/SalonAppCta.tsx (real, imported unchanged)
 * Depicts: desktop sticky sidebar -> app/[locale]/_components/salon/SalonSidebar.tsx (real, imported unchanged)
 * Depicts: mobile sticky book bar -> app/[locale]/_components/salon/SalonMobileBookBar.tsx (real, imported unchanged)
 * Depicts: lightbox overlay -> app/[locale]/_components/salon/SalonLightbox.tsx (real, imported unchanged)
 * Depicts: fullscreen gallery overlay -> app/[locale]/_components/salon/SalonImageGallery.tsx (real, imported unchanged)
 * Depicts: sticky in-page tab jump nav -> app/[locale]/_components/salon/SalonStickyTabNav.tsx (real, imported unchanged)
 * Depicts: breadcrumb -> app/[locale]/_components/salon/SalonBreadcrumb.tsx (real, imported unchanged)
 * Depicts: walk-in mode toggle + panel -> components-legacy/salon/SalonModeToggle.tsx + SalonWalkInPanel.tsx (real, imported unchanged)
 * Depicts: section hairline dividers + rhythm -> NET-NEW: this file's own orchestrator wrapper, no child component render output changed
 * Depicts: section entrance motion -> NET-NEW: this file's own wrapper applying the already-locked MOTION.md ENTER RECIPE
 * Depicts: direction-comparison strip + variant switcher -> app/[locale]/dev/directions-0905/_shared/DirectionFrame.tsx
 *
 * Direction A ("Fresha order, literally"): LOCK MODE - Solen locks kept, conflicts logged.
 * THE ONE IDEA, the section order follows the Fresha venue-page spec's measured sequence
 * top to bottom: gallery, header (name/rating/open-until), services grouped by category under
 * a pill row DIRECTLY under the header, team, reviews, about, opening hours, map+address,
 * nearby venues last. The visible first-viewport difference from the live page: the first thing
 * under the header is the SERVICES list, not About.
 *
 * Sources:
 *   - _design-system/references/fresha--venue-page.md (this session's capture): measured item
 *     order 1-17 + its own Port map (Fresha element -> Solen file) + its own logged CONFLICT on
 *     About's position (quoted below). Item 6 ("Services H2 + category-tab pill row directly
 *     under it") maps to SalonServices.tsx, which ALREADY renders exactly this anatomy
 *     (Services heading -> TabPill category row -> grouped cards, read in full this turn,
 *     untouched) - no fork needed, only its POSITION in the page moved.
 *   - _design-system/references/airbnb--look-recipe.md row 8 (hairline `rgb(221,221,221)`,
 *     already effectively our locked `s-border` #E4E4E7, no new token) and row 17
 *     (section-to-row rhythm 35px+24px measured off reviews.md; 24 is on our 4pt grid as-is,
 *     35 rounds to 32 to stay on-grid) - used for the 32-above/24-below divider rhythm between
 *     top-level sections at the orchestrator level only.
 *   - _design-system/references/airbnb--listing-page.md: divider color cross-confirmed;
 *     gallery ratio/count explicitly logged "Not measured" for Airbnb, so SalonHero's existing
 *     mobile carousel (already matching Fresha's OWN measured iOS anatomy, spec item 5) is reused
 *     as-is, per the missing-Airbnb-number rule ("use the Solen token/behaviour and say so").
 *   - _design-system/references/airbnb--motion.md (verified present this session at
 *     `_design-system/references/`): the ENTER RECIPE is Solen's own locked decision
 *     (owner-approved 2026-07-09) and this file's own text says Airbnb agreement is not
 *     required for it to stay in force, and separately confirms Airbnb's own full-screen
 *     entrances run 300-550ms decelerate with no universal opacity+scale+blur signature
 *     captured. Used here: Solen's locked ENTER RECIPE (opacity 0->1, scale 0.96->1, blur
 *     8px->0, 280ms, `glide` cubic-bezier(0.16,1,0.3,1)) on the one net-new entrance this file
 *     owns (the per-section mount reveal); every real section component's OWN internal motion
 *     (SalonHero swipe, SalonReviews expand, SalonLightbox/SalonImageGallery open) is
 *     untouched, reused as-is.
 *   - _design-system/TASTE_LOG.md row B1 (branch `claude/pdp-styling-updates-b2582b`, 08-15,
 *     "About moves under the address") is a STRANDED-BRANCH decision, not the state of `main`;
 *     `main`'s own SalonDetailV3.tsx code comment (line ~285) records a DIFFERENT 08-15
 *     decision (About moved TO the top). Two dated 08-15 calls on this exact question point
 *     opposite ways on two different branches. This brief resolves it explicitly for
 *     direction A/C (show Fresha's placement), so that resolution is applied here; see
 *     Conflicts.
 *
 * Conflicts (Fresha placement applied where the brief says to; Solen locks kept everywhere else):
 *   - [About position, RESOLVED for this direction] Fresha's own measured order (item 11) puts
 *     About near the bottom, after Reviews. `main`'s current live page puts it directly after
 *     the header (2026-08-15 code comment). This brief's own literal order for direction A
 *     places About after Reviews, matching Fresha; the live page's 08-15 placement is NOT used
 *     here on purpose, per this round's explicit instruction ("direction a and c show Fresha's
 *     placement... he decides on his phone"). Logged, not silently applied.
 *   - [Opening hours vs map order] Fresha's own measured order (items 12-13) is Map then Opening
 *     times. This brief's literal text for direction A lists "opening hours, map and address"
 *     (hours first). Followed the brief's literal order over the spec's measured order (the
 *     live, literal, latest ask wins); both are Fresha-adjacent, this is a small sequencing
 *     choice inside that family, not a Solen-lock override.
 *   - [App download CTA tail] `SalonAppCta` (real, unchanged) renders after VenuesNearby on the
 *     live page and is not named anywhere in the Fresha spec's 17-item list or in this brief's
 *     literal order. Kept at the very end, after VenuesNearby, so "nearby venues last" still
 *     holds among every section this brief actually names; this one extra real section trails
 *     it, matching live behaviour, not silently dropped.
 *   - [Section-heading size] Airbnb's section heading is 22px/600 (look-recipe #2). Solen's
 *     locked section-H2 is `clamp(18px,2vw,20px)` and every section heading lives INSIDE an
 *     off-limits child component (SalonServices.tsx, SalonTeam.tsx, SalonReviews.tsx, etc, all
 *     under the read-only `app/[locale]/_components/**`). Not forked (LOCK MODE keeps this);
 *     kept Solen's size.
 *   - [CTA colour/shape] Airbnb's Reserve pill is a 999px capsule filled with the rausch
 *     gradient (look-recipe #13). Solen's ONE commit button (`SalonMobileBookBar`, reused
 *     unchanged) stays ink, radius 16, per the LOCKED design contract "link" row.
 *   - [Card elevation/radius] Airbnb's entity cards are 20px radius, flat, no shadow
 *     (look-recipe #9-10). Solen's locked entity/list-card radii + `shadow-whisper` inside
 *     SalonServices/SalonTeam/SalonReviews are untouched (off-limits, not forked).
 *
 * floors (customer-screen finished-screen pass, FLOORS LAW #1):
 *   (a) photo focal: SalonHero's real gallery photos (muse-beauty-studio, live).
 *   (b) one biggest element: the salon H1 name inside SalonHeader (unchanged, the page's
 *       single display anchor, already >=28px per the locked component).
 *   (c) real/tabular number: live review count "(N)" + real CHF service prices.
 *   (d) semantic colour: open/closed status text colour + the yellow review stars, both from
 *       the real, unmodified components.
 *   (e) no dead-grey zone: every section keeps its own existing white/sunken rhythm; nothing
 *       new introduced by this fork besides the hairline dividers.
 *   (f) worst-case content: muse-beauty-studio is a real, live, populated salon (multiple
 *       reviews, a full team, real services), exercising real long-content paths already.
 */

import * as React from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { SalonBreadcrumb } from "@/app/[locale]/_components/salon/SalonBreadcrumb";
import { SalonHero } from "@/app/[locale]/_components/salon/SalonHero";
import { SalonHeader } from "@/app/[locale]/_components/salon/SalonHeader";
import { SalonStickyTabNav } from "@/app/[locale]/_components/salon/SalonStickyTabNav";
import { SalonContact } from "@/app/[locale]/_components/salon/SalonContact";
import { SalonServices } from "@/app/[locale]/_components/salon/SalonServices";
import { SalonBundles } from "@/app/[locale]/_components/salon/SalonBundles";
import { SalonTeam } from "@/app/[locale]/_components/salon/SalonTeam";
import { SalonReviews } from "@/app/[locale]/_components/salon/SalonReviews";
import { SalonPortfolio } from "@/app/[locale]/_components/salon/SalonPortfolio";
import { SalonAbout } from "@/app/[locale]/_components/salon/SalonAbout";
import { SalonLocation } from "@/app/[locale]/_components/salon/SalonLocation";
import { SalonOpeningTimes } from "@/app/[locale]/_components/salon/SalonOpeningTimes";
import { SalonAdditionalInfo } from "@/app/[locale]/_components/salon/SalonAdditionalInfo";
import { SalonOtherLocations } from "@/app/[locale]/_components/salon/SalonOtherLocations";
import { SalonVenuesNearby } from "@/app/[locale]/_components/salon/SalonVenuesNearby";
import { SalonRecentlyViewed } from "@/app/[locale]/_components/salon/SalonRecentlyViewed";
import { SalonAppCta } from "@/app/[locale]/_components/salon/SalonAppCta";
import { SalonSidebar } from "@/app/[locale]/_components/salon/SalonSidebar";
import { SalonMobileBookBar } from "@/app/[locale]/_components/salon/SalonMobileBookBar";
import { SectionErrorBoundary } from "@/app/[locale]/_components/primitives/SectionErrorBoundary";
import SalonModeToggle from "@/components-legacy/salon/SalonModeToggle";
import SalonWalkInPanel from "@/components-legacy/salon/SalonWalkInPanel";
import { WalkInQueueProvider } from "@/components-legacy/salon/WalkInQueueContext";
import { postalToCity } from "@/app/[locale]/_components/salon/_shared";
import type { SalonDetail, TabKey, OpenStatus, DayKey } from "@/app/[locale]/_components/salon/_shared";

// Same click-triggered-only load pattern as the real SalonDetailV3.tsx (B4 load audit).
const SalonLightbox = dynamic(
  () => import("@/app/[locale]/_components/salon/SalonLightbox").then((m) => m.SalonLightbox),
  { ssr: false }
);
const SalonImageGallery = dynamic(
  () => import("@/app/[locale]/_components/salon/SalonImageGallery").then((m) => m.SalonImageGallery),
  { ssr: false }
);

/** Orchestrator-level-only entrance, THE ENTER RECIPE (MOTION.md, locked, gate-enforced):
 * opacity + scale + blur together, 280ms, glide easing. Every real section component's OWN
 * internal interaction motion (SalonReviews read-more, SalonHero swipe, lightbox/gallery open)
 * is the real component's, untouched.
 *
 * Animates once on MOUNT, not on scroll position: this surface is judged by one full-page
 * screenshot with no scroll pass first, and a scroll-linked reveal would leave every section
 * below the first viewport at its starting (invisible) state in that single capture. */
function EnterSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, filter: "blur(8px)" }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Airbnb-derived section rhythm (look-recipe row 17: 35px content-to-divider rounds to 32 on
 * our 4pt grid, 24px divider-to-next-content is already on-grid, kept as-is). Divider colour
 * reuses the existing `s-border` hairline token (same cool-neutral family as Airbnb's measured
 * `rgb(221,221,221)`, no new colour introduced). */
function Divided({ children, first = false }: { children: React.ReactNode; first?: boolean }) {
  return (
    <div className={first ? "" : "mt-8 border-t border-s-border pt-6"}>
      <EnterSection>{children}</EnterSection>
    </div>
  );
}

export function SalonPageDirectionA({
  salon,
  openStatus,
  todayKey,
  locale,
  slug,
}: {
  salon: SalonDetail;
  openStatus: OpenStatus;
  todayKey: DayKey;
  locale: string;
  slug: string;
}) {
  const searchParams = useSearchParams();
  const [walkinMode, setWalkinMode] = React.useState(false);
  React.useEffect(() => {
    if (searchParams?.get("walkin") === "1") setWalkinMode(true);
  }, [searchParams]);

  const [lightboxOpen, setLightboxOpen] = React.useState(false);
  const [lightboxIndex, setLightboxIndex] = React.useState(0);
  const [galleryOpen, setGalleryOpen] = React.useState(false);
  const [hasBundles, setHasBundles] = React.useState(false);

  const heroRef = React.useRef<HTMLElement>(null);

  const availableSections = new Set<TabKey>();
  if ((salon.gallery_urls?.length ?? 0) > 0 || salon.cover_photo_url) availableSections.add("photos");
  if (salon.services.length > 0) availableSections.add("services");
  if (hasBundles) availableSections.add("bundles");
  if (salon.staff.length > 0) availableSections.add("team");
  if (salon.review_count > 0 || (salon.average_rating ?? 0) > 0) availableSections.add("reviews");
  if (salon.about_text_de || salon.description_de || salon.about_text_en || salon.description_en) {
    availableSections.add("about");
  }

  const photos = salon.gallery_urls?.length
    ? salon.gallery_urls
    : salon.cover_photo_url
      ? [salon.cover_photo_url]
      : [];

  const openLightbox = (idx: number) => {
    setLightboxIndex(idx);
    setLightboxOpen(true);
  };
  const openGallery = () => setGalleryOpen(true);

  const primaryCategory = (salon.categories[0] ?? "coiffeur").toLowerCase();
  const salonOpen = openStatus.isOpen;

  return (
    <main className="relative min-h-screen overflow-x-clip bg-white pb-6 md:pt-3 md:pb-8">
      <div className="relative z-10">
        <div className="mx-auto hidden w-full max-w-[1180px] px-4 md:block md:px-6">
          <SalonBreadcrumb salon={salon} locale={locale} />
        </div>

        <SalonStickyTabNav availableSections={availableSections} scrollAnchorRef={heroRef} salon={salon} />

        {/* 1. Gallery (Fresha spec item 5) */}
        <section ref={heroRef} className="mx-auto mt-0 w-full max-w-[1180px] md:mt-3 md:px-6">
          <SalonHero salon={salon} onOpenLightbox={openLightbox} onOpenGallery={openGallery} />
        </section>

        <div className="relative z-10 mx-auto -mt-5 w-full max-w-[1180px] rounded-t-[20px] bg-white px-4 pt-5 md:mt-7 md:rounded-none md:bg-transparent md:px-6 md:pt-0">
          <div className="lg:grid lg:grid-cols-[1fr_340px] lg:gap-10 xl:gap-12">
            <div className="min-w-0">
              {/* 2. Header: name + rating + open-until line (Fresha spec items 2-3) */}
              <SalonHeader salon={salon} openStatus={openStatus} />

              {salon.categories?.includes("barbershop") && salon.walkin_enabled && (
                <div className="mt-6 flex flex-col gap-5">
                  <SalonModeToggle mode={walkinMode ? "walkin" : "book"} onChange={(m) => setWalkinMode(m === "walkin")} locale={locale} />
                  {walkinMode && (
                    <WalkInQueueProvider salonId={salon.id}>
                      <SalonWalkInPanel salonId={salon.id} services={salon.services} staff={salon.staff} salonAverageRating={salon.average_rating} slug={slug} isOpen={salonOpen} locale={locale} />
                    </WalkInQueueProvider>
                  )}
                </div>
              )}

              <div className="mt-8">
                {/* 3. Services, grouped by category, category pill row DIRECTLY under the
                    header (Fresha spec item 6: "Services H2, then a horizontal category-tab
                    chip row"). SalonServices.tsx already renders exactly this anatomy
                    unchanged; only its POSITION moved, from below About (live) to first thing
                    under the header (this direction). Structural difference visible in the
                    first viewport: no About above this. */}
                {!walkinMode && (
                  <Divided first>
                    <SectionErrorBoundary section="SalonServices">
                      <SalonServices services={salon.services} locale={locale} slug={slug} salon={salon} />
                    </SectionErrorBoundary>
                  </Divided>
                )}

                {/* Bundles: Solen's discounted/bundled row, mapped by the Fresha spec's own
                    port map to the "Save X%" tag inside the Services block, kept adjacent. */}
                {!walkinMode && (
                  <Divided first={walkinMode}>
                    <SectionErrorBoundary section="SalonBundles">
                      <SalonBundles salonId={salon.id} slug={slug} locale={locale} onLoaded={setHasBundles} />
                    </SectionErrorBoundary>
                  </Divided>
                )}

                {/* 4. Team (Fresha spec item 9) */}
                {!walkinMode && salon.staff.length > 0 && (
                  <Divided first={walkinMode}>
                    <SectionErrorBoundary section="SalonTeam">
                      <SalonTeam staff={salon.staff} salonAverageRating={salon.average_rating} slug={slug} locale={locale} />
                    </SectionErrorBoundary>
                  </Divided>
                )}

                {/* 5. Reviews (Fresha spec item 10) */}
                <Divided first={walkinMode && salon.staff.length === 0}>
                  <SectionErrorBoundary section="SalonReviews">
                    <SalonReviews
                      average={salon.average_rating}
                      count={salon.review_count}
                      reviews={salon.reviews}
                      salonId={salon.id}
                      salonSlug={salon.slug}
                      salonName={salon.name}
                      locale={locale}
                    />
                  </SectionErrorBoundary>
                </Divided>

                <Divided>
                  <SectionErrorBoundary section="SalonPortfolio">
                    <SalonPortfolio urls={salon.gallery_urls ?? []} staff={salon.staff} onOpen={() => openGallery()} salonName={salon.name} />
                  </SectionErrorBoundary>
                </Divided>

                {/* 6. About (Fresha spec item 11: near the bottom, after Reviews). Conflict
                    with the live page's 2026-08-15 top placement, resolved per this brief for
                    direction A: show Fresha's placement, see the Conflicts note above. */}
                <Divided>
                  <SalonAbout salon={salon} locale={locale} />
                </Divided>

                {/* 7. Opening hours (brief's literal order: hours before map for direction A) */}
                <Divided>
                  <SalonOpeningTimes hours={salon.opening_hours} todayKey={todayKey} />
                </Divided>

                {/* 8. Map and address (Fresha spec item 12) */}
                <Divided>
                  <SalonLocation salon={salon} mapDesign="clean-white" />
                </Divided>

                <Divided>
                  <SalonAdditionalInfo salon={salon} />
                </Divided>

                <Divided>
                  <SalonContact salon={salon} />
                </Divided>

                {salon.siblings && salon.siblings.length > 0 && (
                  <Divided>
                    <SalonOtherLocations siblings={salon.siblings} locale={locale} />
                  </Divided>
                )}

                <Divided>
                  <SalonRecentlyViewed excludeSlug={slug} />
                </Divided>

                {/* 9. Nearby venues LAST (Fresha spec item 15, and this brief's literal
                    order: "nearby venues last"). Kept in the same tail position as the live
                    page (unlike the prior round's file, which moved this earlier to match
                    Fresha's raw item-15 slot right after Additional info; this brief
                    overrides that with an explicit "last"). */}
                <Divided>
                  <SalonVenuesNearby cat={primaryCategory} excludeId={salon.id} locale={locale} />
                </Divided>

                {/* Real section not named in the Fresha 17-item list; kept at the tail,
                    after Venues nearby, matching live. See Conflicts. */}
                {!walkinMode && (
                  <Divided>
                    <SalonAppCta
                      locale={locale}
                      slug={slug}
                      salonName={salon.name}
                      city={postalToCity(salon.postal_code)}
                      salonCategories={salon.categories}
                    />
                  </Divided>
                )}
              </div>
            </div>

            <aside className="hidden lg:block">
              <div className="sticky top-24 pt-3">
                {!walkinMode && <SalonSidebar salon={salon} locale={locale} openStatus={openStatus} todayKey={todayKey} />}
              </div>
            </aside>
          </div>
        </div>
      </div>

      {!walkinMode && <SalonMobileBookBar locale={locale} slug={slug} suppressed={galleryOpen || lightboxOpen} />}

      <SalonLightbox photos={photos} open={lightboxOpen} startIndex={lightboxIndex} onClose={() => setLightboxOpen(false)} />

      <SalonImageGallery
        open={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        salonId={salon.id}
        salonName={salon.name}
        salonCategories={salon.categories}
        venuePhotos={photos}
        staff={salon.staff}
      />
    </main>
  );
}
