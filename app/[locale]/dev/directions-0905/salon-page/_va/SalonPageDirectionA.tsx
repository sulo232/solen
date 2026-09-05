"use client";

/**
 * Grounded-in: app/[locale]/_components/salon/SalonDetailV3.tsx (the real orchestrator
 * this file forks: same imports, same real salon prop, same lightbox/gallery/walk-in
 * state shape, JSX reordered + wrapped in section dividers per Direction A below).
 *
 * Screen class (PRINCIPLES.md #1): this file PROTOTYPES a customer screen (the salon
 * page), so the FLOORS LAW (CLAUDE.md) governs the underlying design even though the
 * file itself lives under app/[locale]/dev/.
 *
 * Exists-check: `npm run exists directions-0905` -> 1 graveyard hit, an unrelated single-
 * treatment index batch from the day before this one, NOT re-proposed here (this is the
 * newly-requested three-directions-per-screen format, a different unit) + DirectionFrame
 * (reused, not forked). `npm run exists "salon page"` -> 26 matches, all either the real
 * production route (app/[locale]/salon/[slug]/page.tsx, imported from for its data
 * loader, not duplicated), graveyard hits for a retail-products section and an options
 * chips section on the SAME page (both left alone, not touched or restored), or
 * unrelated onboarding/DB rows. No existing dev route already builds a whole-screen
 * Fresha-order + Airbnb-finish salon comparison mockup.
 *
 * Depicts: gallery/hero -> app/[locale]/_components/salon/SalonHero.tsx (real, imported unchanged)
 * Depicts: name/rating/status/address header -> app/[locale]/_components/salon/SalonHeader.tsx (real, imported unchanged)
 * Depicts: about text -> app/[locale]/_components/salon/SalonAbout.tsx (real, imported unchanged)
 * Depicts: services list -> app/[locale]/_components/salon/SalonServices.tsx (real, imported unchanged)
 * Depicts: bundles row -> app/[locale]/_components/salon/SalonBundles.tsx (real, imported unchanged)
 * Depicts: team grid -> app/[locale]/_components/salon/SalonTeam.tsx (real, imported unchanged)
 * Depicts: reviews -> app/[locale]/_components/salon/SalonReviews.tsx (real, imported unchanged)
 * Depicts: photo portfolio -> app/[locale]/_components/salon/SalonPortfolio.tsx (real, imported unchanged)
 * Depicts: map -> app/[locale]/_components/salon/SalonLocation.tsx (real, imported unchanged)
 * Depicts: opening hours -> app/[locale]/_components/salon/SalonOpeningTimes.tsx (real, imported unchanged)
 * Depicts: additional info checklist -> app/[locale]/_components/salon/SalonAdditionalInfo.tsx (real, imported unchanged)
 * Depicts: contact rows -> app/[locale]/_components/salon/SalonContact.tsx (real, imported unchanged)
 * Depicts: venues nearby carousel -> app/[locale]/_components/salon/SalonVenuesNearby.tsx (real, imported unchanged, MOVED earlier in this file's order)
 * Depicts: other locations -> app/[locale]/_components/salon/SalonOtherLocations.tsx (real, imported unchanged)
 * Depicts: recently viewed rail -> app/[locale]/_components/salon/SalonRecentlyViewed.tsx (real, imported unchanged)
 * Depicts: desktop sticky sidebar -> app/[locale]/_components/salon/SalonSidebar.tsx (real, imported unchanged)
 * Depicts: mobile sticky book bar -> app/[locale]/_components/salon/SalonMobileBookBar.tsx (real, imported unchanged)
 * Depicts: lightbox overlay -> app/[locale]/_components/salon/SalonLightbox.tsx (real, imported unchanged)
 * Depicts: fullscreen gallery overlay -> app/[locale]/_components/salon/SalonImageGallery.tsx (real, imported unchanged)
 * Depicts: sticky in-page tab jump nav -> app/[locale]/_components/salon/SalonStickyTabNav.tsx (real, imported unchanged)
 * Depicts: breadcrumb -> app/[locale]/_components/salon/SalonBreadcrumb.tsx (real, imported unchanged)
 * Depicts: section dividers between sections -> NET-NEW: this file's own orchestrator wrapper, no child component render output changed
 * Depicts: section entrance motion -> NET-NEW: this file's own wrapper applying the already-locked MOTION.md ENTER RECIPE
 *
 * Direction A ("Fresha order"): section order follows the Fresha venue-page spec's
 * measured decision sequence (photos -> header/meta -> services -> team -> reviews ->
 * logistics -> nearby), laid over a real fork of SalonDetailV3.tsx (this file), reusing
 * every real section component UNCHANGED (FLOORS LAW 9, composed not drawn). Two real
 * structural changes versus current production:
 *   1. SalonVenuesNearby moves from the tail (after OtherLocations + RecentlyViewed) to
 *      directly after the Contact/AdditionalInfo logistics cluster, matching Fresha's
 *      measured item 15 (Venues nearby sits right after Additional information, before
 *      any Solen-only "more from us" content).
 *   2. A hairline divider + Airbnb-derived vertical rhythm (32px above the divider, 24px
 *      below it, both on the 4pt grid) is added BETWEEN each top-level section, at the
 *      orchestrator level only (no child component forked).
 * The About section's position is a NAMED EXCEPTION, see Conflicts below.
 *
 * Sources:
 *   - _design-system/references/fresha--venue-page.md: the measured 17-item order +
 *     its own "Port map" (Fresha element -> Solen file) and its own logged CONFLICT on
 *     the About section's position, quoted below.
 *   - _design-system/references/airbnb--look-recipe.md row 8 (hairline
 *     `rgb(221,221,221)`, already effectively our locked `s-border #E4E4E7`, no new
 *     token) and row 17 (section-to-row rhythm 35px+24px, "24 is portable as-is; 35
 *     would need rounding to 32 ... to stay on our 4pt scale" -> used 32/24 here).
 *   - _design-system/references/airbnb--listing-page.md: divider `rgb(221,221,221)`
 *     cross-confirmed; gallery photo count/ratio explicitly "Not measured" for Airbnb
 *     (comment: "whether it is a single hero photo or an n-up grid ... were not
 *     resolved"), so the gallery here is NOT re-treated: SalonHero's existing mobile
 *     behaviour (a swipeable single-photo carousel with a counter) already matches
 *     Fresha's OWN measured iOS anatomy (spec item 5, iOS variant) at this mockup's
 *     390px viewport, so it is reused as-is per the missing-Airbnb-number rule
 *     ("use the Solen token/behaviour and say so").
 *   - `_design-system/references/airbnb--motion.md` NAMED in the brief DOES NOT EXIST
 *     on disk (confirmed: only airbnb--animated-icons.md, category-switch,
 *     checkout-and-confirmation, fonts-vs-ours, home-mobile, home-search-chrome,
 *     host-and-rules, icons-vs-ours, listing-page, look-recipe, profile-1to1-diff,
 *     profile-list, reviews, search-results are present). Used the Solen contract
 *     instead: `_design-system/MOTION.md`'s locked ENTER RECIPE (opacity 0->1, scale
 *     0.96->1, blur 8px->0, 280ms, ease `glide` cubic-bezier(0.16,1,0.3,1)) on the one
 *     net-new entrance this file owns; every real section component's OWN internal
 *     motion (SalonHero swipe, SalonReviews expand, SalonLightbox/SalonImageGallery
 *     open) is untouched, reused as-is.
 *   - `_design-system/TASTE_LOG.md` row B1 (08-15, "About moves under the address") and
 *     SalonDetailV3.tsx's own code comment at its About call site (owner: "on the about
 *     us ... there should be, like, about us. Right now, maybe I don't see it").
 *
 * Conflicts (kept the Solen lock, logged rather than silently applied):
 *   - [About position] Fresha's OWN measured order (fresha--venue-page.md item 11)
 *     puts About near the BOTTOM, after Reviews. Solen moved it to the TOP of the
 *     content column on 2026-08-15 by explicit owner decision (TASTE_LOG.md B1), and
 *     the Fresha spec file itself flags this as the single biggest structural
 *     reversal and calls it an owner-only call. Per this task's own FIXED list ("the
 *     About block stays where the live page has it"), the dated lock wins: About stays
 *     directly after SalonHeader, before Services, NOT moved down to match Fresha.
 *   - [Section-heading size] Airbnb's section heading is 22px/600
 *     (airbnb--look-recipe.md #2). Solen's locked section-H2 is
 *     `clamp(18px,2vw,20px)` and every section heading lives INSIDE an off-limits
 *     child component (SalonServices.tsx, SalonTeam.tsx, SalonReviews.tsx, etc, all
 *     under the read-only `app/[locale]/_components/**`). Forking all nine of them to
 *     gain 2px of heading size was out of scope for this one-idea build (order +
 *     orchestrator-level finish only) and would also risk the page's 4-size/2-weight
 *     type-budget gate across nine independently-authored components. Kept Solen's
 *     size; noted here rather than silently skipped.
 *   - [CTA colour/shape] Airbnb's Reserve pill is a 999px capsule filled with the
 *     rausch gradient (look-recipe #13). Solen's ONE commit button (`SalonMobileBookBar`,
 *     reused unchanged) stays ink, radius 16, per the LOCKED design contract ("link"
 *     row) and is never forked here.
 *   - [Card elevation/radius] Airbnb's entity cards are 20px radius, flat, no shadow
 *     (look-recipe #9-10). Solen's locked entity-card/list-card radii + `shadow-whisper`
 *     inside SalonServices/SalonTeam/SalonReviews are untouched (off-limits, not
 *     forked).
 *
 * floors (customer-screen finished-screen pass, FLOORS LAW #1):
 *   (a) photo focal: SalonHero's real gallery photos (muse-beauty-studio, live).
 *   (b) one biggest element: the salon H1 name inside SalonHeader (unchanged, already
 *       the page's single display anchor).
 *   (c) real/tabular number: live review count "(11)" + real CHF service prices.
 *   (d) semantic colour: open/closed status text colour + the yellow review stars,
 *       both from the real, unmodified components.
 *   (e) no dead-grey zone: every section keeps its own existing white/sunken rhythm;
 *       nothing new introduced by this fork besides the hairline dividers.
 *   (f) worst-case content: muse-beauty-studio is a real, live, populated salon (11
 *       reviews, a full team, real services) exercising real long-content paths
 *       already, not a thin fabricated fixture.
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
import { SalonSidebar } from "@/app/[locale]/_components/salon/SalonSidebar";
import { SalonMobileBookBar } from "@/app/[locale]/_components/salon/SalonMobileBookBar";
import { SectionErrorBoundary } from "@/app/[locale]/_components/primitives/SectionErrorBoundary";
import SalonModeToggle from "@/components-legacy/salon/SalonModeToggle";
import SalonWalkInPanel from "@/components-legacy/salon/SalonWalkInPanel";
import { WalkInQueueProvider } from "@/components-legacy/salon/WalkInQueueContext";
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
 * opacity + scale + blur together, 280ms, glide easing. Wraps each top-level section so a
 * section's first paint on this comparison page arrives as "a material", not a bare cut.
 * Every section's OWN internal interaction motion (SalonReviews read-more, SalonHero
 * swipe, lightbox/gallery open) is the real component's, untouched.
 *
 * Animates once on MOUNT, not on scroll position: this surface is a STATIC screen
 * verified by one full-page screenshot with no scroll pass first, and a scroll-position-
 * linked reveal leaves every section below the first viewport sitting at its starting
 * (invisible) state forever in that single capture, blanking most of the page. Found by
 * comparing the raw server HTML (every section present) against the rendered screenshot
 * (blank past Services) before shipping this file; fixed by animating on mount instead. */
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

/** Airbnb-derived section rhythm (look-recipe row 17: 35px content-to-divider rounds to
 * 32 on our 4pt grid, 24px divider-to-next-content is already on-grid, kept as-is).
 * Divider colour reuses the existing `s-border` hairline token (already the same cool-
 * neutral family as Airbnb's measured `rgb(221,221,221)`, no new colour introduced). */
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

  const salonOpen = openStatus.isOpen;

  return (
    <main className="relative min-h-screen overflow-x-clip bg-white pb-6 md:pt-3 md:pb-8">
      <div className="relative z-10">
        <div className="mx-auto hidden w-full max-w-[1180px] px-4 md:block md:px-6">
          <SalonBreadcrumb salon={salon} locale={locale} />
        </div>

        <SalonStickyTabNav availableSections={availableSections} scrollAnchorRef={heroRef} salon={salon} />

        <section ref={heroRef} className="mx-auto mt-0 w-full max-w-[1180px] md:mt-3 md:px-6">
          <SalonHero salon={salon} onOpenLightbox={openLightbox} onOpenGallery={openGallery} />
        </section>

        <div className="relative z-10 mx-auto -mt-5 w-full max-w-[1180px] rounded-t-[20px] bg-white px-4 pt-5 md:mt-7 md:rounded-none md:bg-transparent md:px-6 md:pt-0">
          <div className="lg:grid lg:grid-cols-[1fr_340px] lg:gap-10 xl:gap-12">
            <div className="min-w-0">
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
                {/* About: LOCKED near the top per TASTE_LOG B1 (08-15), a dated owner call
                    that beats Fresha's own measured item-11 placement. See Conflicts above. */}
                <Divided first>
                  <SalonAbout salon={salon} locale={locale} />
                </Divided>

                {!walkinMode && (
                  <Divided>
                    <SectionErrorBoundary section="SalonServices">
                      <SalonServices services={salon.services} locale={locale} slug={slug} salon={salon} />
                    </SectionErrorBoundary>
                  </Divided>
                )}

                {!walkinMode && (
                  <Divided>
                    <SectionErrorBoundary section="SalonBundles">
                      <SalonBundles salonId={salon.id} slug={slug} locale={locale} onLoaded={setHasBundles} />
                    </SectionErrorBoundary>
                  </Divided>
                )}

                {!walkinMode && salon.staff.length > 0 && (
                  <Divided>
                    <SectionErrorBoundary section="SalonTeam">
                      <SalonTeam staff={salon.staff} salonAverageRating={salon.average_rating} slug={slug} locale={locale} />
                    </SectionErrorBoundary>
                  </Divided>
                )}

                <Divided>
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

                <Divided>
                  <SalonLocation salon={salon} mapDesign="clean-white" />
                </Divided>

                <Divided>
                  <SalonOpeningTimes hours={salon.opening_hours} todayKey={todayKey} />
                </Divided>

                <Divided>
                  <SalonAdditionalInfo salon={salon} />
                </Divided>

                <Divided>
                  <SalonContact salon={salon} />
                </Divided>

                {/* MOVED (direction A's structural change #1): Fresha's own measured order
                    (spec item 15) puts "Venues nearby" directly after "Additional
                    information", before any Solen-only "more from us" content. Production
                    currently runs OtherLocations -> RecentlyViewed -> VenuesNearby; here
                    VenuesNearby comes right after the logistics cluster instead. */}
                <Divided>
                  <SalonVenuesNearby cat={(salon.categories[0] ?? "coiffeur").toLowerCase()} excludeId={salon.id} locale={locale} />
                </Divided>

                {salon.siblings && salon.siblings.length > 0 && (
                  <Divided>
                    <SalonOtherLocations siblings={salon.siblings} locale={locale} />
                  </Divided>
                )}

                <Divided>
                  <SalonRecentlyViewed excludeSlug={slug} />
                </Divided>
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
