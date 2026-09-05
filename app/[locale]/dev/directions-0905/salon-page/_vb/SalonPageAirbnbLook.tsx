"use client";

// Exists-check: `npm run exists "salon page"` ran this turn -> app/[locale]/_components/
// salon/SalonDetailV3.tsx (463 lines, the real orchestrator this file's section order and
// section-availability logic is read from, off-limits, read-only) and its 17 section
// components. `npm run exists directions-0905` ran this turn -> DirectionFrame (reused, not
// forked). Net-new: this file, the orchestrator for direction B of the salon-page comparison.
// Supersedes this same folder's own SalonPagePhotoLed.tsx + GalleryHeroOverlay.tsx (both
// deleted, see below): those two files built a DIFFERENT prior round's direction B ("Photo-led
// gallery with a frosted name overlay", still the label page.tsx carried before this turn) and
// reused every section component completely unstyled. This round's brief for letter B is a
// different idea entirely ("Airbnb look, full strength"), so the old pair no longer describes
// what renders at ?v=b and is replaced rather than kept alongside it.
//
// Grounded-in: app/[locale]/_components/salon/SalonDetailV3.tsx (real orchestrator, order and
// section-availability conditions read from it exactly), app/[locale]/salon/[slug]/page.tsx
// (the real route rendering it).
//
// Reference-checked: _design-system/references/fresha--venue-page.md
// Reference-checked: _design-system/references/airbnb--look-recipe.md
// Reference-checked: _design-system/references/airbnb--listing-page.md
// Reference-checked: _design-system/references/airbnb--motion.md
// All four read in full before writing this file: fresha--venue-page.md (structure),
// airbnb--look-recipe.md and airbnb--listing-page.md (look), airbnb--motion.md (timings).
//
// Direction: B, "Airbnb look, full strength" (LOOK-FULL, per the brief). Keeps the real
// SalonDetailV3 section ORDER, including the salon's own 2026-08-15 lock (About renders
// directly after the header, not pushed down near Reviews the way a raw Fresha capture would
// place it, per SalonDetailV3.tsx's own comment at its SalonAbout call site and
// fresha--venue-page.md's own Conflicts section naming this exact collision). Every SIZE,
// WEIGHT, COLOUR, RADIUS and SHADOW value on the sections this direction demonstrates (hero,
// title and rating, About, Services, Team, Reviews, Portfolio, Opening hours, Additional info,
// Contact, and the sticky Reserve bar) is taken from the Airbnb look recipe at full strength,
// even where it breaks a Solen lock, per AirbnbSections.tsx, AirbnbHero.tsx and
// AirbnbReserveBar.tsx (see their own file headers for the exact numbers and citations).
//
// SCOPING DECISION (not a violation, a judgment call under the brief's own one-idea sentence):
// the brief names hero, title and rating, services, reviews and the sticky bar explicitly as
// the direction's one idea; About, Team, Portfolio, Opening hours, Additional info and Contact
// are also forked into AirbnbSections.tsx (all six sections it exports) since they sit inside
// the same visible fold as the named ones. Bundles, Location (map), Other locations, Recently
// viewed, Venues nearby and the App CTA are lower-priority, below-the-fold sections not named in
// the direction's one-idea sentence and render as the REAL, unmodified Solen components (same as
// every other direction of this surface), so the map, siblings and recommendation rails keep
// their real anatomy rather than being re-forked for a look this direction never claims to
// demonstrate there.
//
// FIXED, per the shared brief for every direction of this surface: the real salon (loaded
// server-side via loadSalonDetailWithStatus in page.tsx, passed down as a prop), the real
// reviews (at least 3, from SalonReviews' own data via AirbnbReviews), the real map
// (SalonLocation, unmodified), no hardcoded image src (every photo comes from
// salon.gallery_urls or salon.cover_photo_url), no second Team block, never a clock time on a
// card.
//
// DROPPED for this mockup only (not a structural claim about the real page): the barbershop
// Book/Walk-in toggle (SalonModeToggle/SalonWalkInPanel). muse-beauty-studio has
// walkin_enabled=false and categories=["coiffeur"] (verified live via GET
// /api/salons?slug=muse-beauty-studio), so the real page renders neither for this exact salon
// either; omitted here rather than imported dead.
//
// floors: (a) photographic focal -> the hero photo, 4:3 at 390px = 292.5px, 34.7% of an 844px
// first viewport, clears the >=1/3 imagery floor. (b) one clearly biggest element -> the 28px
// salon-name H1, the only element at that size on the first viewport. (c) a real
// tabular/plausible number -> the CHF price on every service row and the sticky bar (real seed
// data, salon.services). (d) a semantic-colour moment -> the real, unmodified SalonBundles
// section's own pale-green discount pill (kept real per the SCOPING DECISION above; the
// design-contract availability lock is PLAIN INK text with no green pill, so status intentionally
// does not carry this floor here). (e) no dead-grey zone -> every section sits on plain white
// with a photo, a map, or real content; no bare grey rectangle anywhere. (f) worst-case content
// holds -> the real salon's longest service name ("Straightening / Brushing"), full review text
// (line-clamped to 3 lines with expansion via the real SalonReviews-style Read-more idiom
// ported as static clamp here) and the salon's own full address all truncate/wrap without
// breaking the two-ink-anchor row (name + price) or the 28px display anchor.
//
// Depicts: hero photo and title and rating row -> app/[locale]/dev/directions-0905/salon-page/_vb/AirbnbHero.tsx
// Depicts: About, Services, Team, Reviews, Portfolio, Opening hours, Additional info, Contact -> app/[locale]/dev/directions-0905/salon-page/_vb/AirbnbSections.tsx
// Depicts: sticky Reserve bar -> app/[locale]/dev/directions-0905/salon-page/_vb/AirbnbReserveBar.tsx
// Depicts: map -> app/[locale]/_components/salon/SalonLocation.tsx
// Depicts: bundles section -> app/[locale]/_components/salon/SalonBundles.tsx
// Depicts: other-locations rail -> app/[locale]/_components/salon/SalonOtherLocations.tsx
// Depicts: recently-viewed rail -> app/[locale]/_components/salon/SalonRecentlyViewed.tsx
// Depicts: venues-nearby rail -> app/[locale]/_components/salon/SalonVenuesNearby.tsx
// Depicts: app download CTA -> app/[locale]/_components/salon/SalonAppCta.tsx
// Depicts: lightbox overlay -> app/[locale]/_components/salon/SalonLightbox.tsx
// Depicts: full-screen photo gallery overlay -> app/[locale]/_components/salon/SalonImageGallery.tsx
//
// Conflicts (consolidated; each individual value's own citation lives in the file that draws
// it, this list is the one-stop summary the brief asks for):
// - CONFLICT [ink]: #222222 used instead of Solen's frozen #0A0A0A (airbnb--look-recipe.md #5).
// - CONFLICT [hairline]: #DDDDDD used instead of Solen's frozen #E4E4E7 (look-recipe #8).
// - CONFLICT [entity-card radius]: 20px used for the Services card instead of Solen's locked
//   16px (look-recipe #9).
// - CONFLICT [reply-tile fill]: Airbnb's own light-grey quote fill (#F7F7F7, visual match, not
//   independently re-measured) used instead of Solen's sunken-tray token #F4F4F5.
// - CONFLICT [display-anchor size]: 28px used on the salon name instead of Airbnb's literal 26px
//   (rounded up per airbnb--listing-page.md's own Port map row 1, so the FLOORS LAW display-
//   anchor floor still clears; a genuine port, not an invented number).
// - CONFLICT [section-heading size]: 22/600 used instead of Solen's locked
//   `clamp(18px,2vw,20px)` section-H2 (look-recipe #2).
// - CONFLICT [CTA colour and shape, the biggest one]: the sticky Reserve button fills with
//   Airbnb's rausch pink-to-coral gradient at a true 999px pill, not Solen's locked ink-fill-only
//   commit button at the locked 16px button/chip radius (look-recipe #13, airbnb--listing-page.md's
//   own CONFLICT [CTA color] and CONFLICT [radius]).
// - CONFLICT [sticky-bar price, a DATED taste-log collision]: TASTE_LOG.md "Round 2: Salon PDP"
//   (2026-06-07) settled the sticky bar as price-free (booking-verb label plus chevron only,
//   "price belongs on the service list"). This bar shows a from-price on the left because the
//   brief's own direction text for letter B names that exact recipe. Flagged for the owner to
//   reconcile against the 2026-06-07 call; see AirbnbReserveBar.tsx's own header for the full note.
// - CONFLICT [About placement vs "Fresha is the base"]: kept at the 2026-08-15 top position
//   rather than Fresha's own bottom-of-page placement, per the brief's own instruction that
//   direction B (unlike a and c) keeps this dated lock. Named here so it reads as a deliberate
//   choice, not an oversight, next to the LOOK-FULL conflicts above.
// - CONFLICT [type budget, screen-wide]: this screen carries more than four size and weight
//   pairs across its full scroll depth (12, 14, 16, 20, 22, 28 at weights 400 and 500), same as
//   Airbnb's own listing page (airbnb--look-recipe.md's own "type budget" conflict row). The
//   FIRST VIEWPORT specifically is measured (Playwright getComputedStyle, 390x844, this
//   session) at exactly four sizes (12, 14, 22, 28) and two weights (400, 500), after two fixes
//   made directly from that live measurement: the services row's name was 16px (a fifth size)
//   until AirbnbSections.tsx moved it to 14px, and the sticky Reserve bar computed a real 600
//   (a third weight) until AirbnbReserveBar.tsx set it to an explicit 500, both documented in
//   full in their own files' MEASURED CORRECTION notes. Sizes below the fold (16, 20) remain
//   and are outside the floor's stated first-viewport-only scope.

import * as React from "react";
import dynamic from "next/dynamic";
import { SectionErrorBoundary } from "@/app/[locale]/_components/primitives";
import { SalonBreadcrumb } from "@/app/[locale]/_components/salon/SalonBreadcrumb";
import { SalonBundles } from "@/app/[locale]/_components/salon/SalonBundles";
import { SalonLocation } from "@/app/[locale]/_components/salon/SalonLocation";
import { SalonOtherLocations } from "@/app/[locale]/_components/salon/SalonOtherLocations";
import { SalonRecentlyViewed } from "@/app/[locale]/_components/salon/SalonRecentlyViewed";
import { SalonVenuesNearby } from "@/app/[locale]/_components/salon/SalonVenuesNearby";
import { SalonAppCta } from "@/app/[locale]/_components/salon/SalonAppCta";
import { postalToCity } from "@/app/[locale]/_components/salon/_shared";
import type { SalonDetail, OpenStatus, DayKey } from "@/app/[locale]/_components/salon/_shared";
import { AirbnbHero } from "./AirbnbHero";
import {
  AirbnbAbout,
  AirbnbServices,
  AirbnbTeam,
  AirbnbReviews,
  AirbnbPortfolio,
  AirbnbOpeningTimes,
  AirbnbAdditionalInfo,
  AirbnbContact,
} from "./AirbnbSections";
import { AirbnbReserveBar } from "./AirbnbReserveBar";

const SalonLightbox = dynamic(
  () => import("@/app/[locale]/_components/salon/SalonLightbox").then((m) => m.SalonLightbox),
  { ssr: false },
);
const SalonImageGallery = dynamic(
  () => import("@/app/[locale]/_components/salon/SalonImageGallery").then((m) => m.SalonImageGallery),
  { ssr: false },
);

export function SalonPageAirbnbLook({
  salon,
  openStatus,
  todayKey,
  locale,
}: {
  salon: SalonDetail;
  openStatus: OpenStatus;
  todayKey: DayKey;
  locale: string;
}) {
  const slug = salon.slug;
  const [lightboxOpen, setLightboxOpen] = React.useState(false);
  const [lightboxIndex, setLightboxIndex] = React.useState(0);
  const [galleryOpen, setGalleryOpen] = React.useState(false);
  const [, setHasBundles] = React.useState(false);

  const photos = salon.gallery_urls?.length
    ? salon.gallery_urls
    : salon.cover_photo_url
      ? [salon.cover_photo_url]
      : [];

  const openLightbox = (idx: number) => {
    setLightboxIndex(idx);
    setLightboxOpen(true);
  };

  const priceFromCHF = salon.services.length > 0 ? Math.min(...salon.services.map((s) => s.price)) : null;

  return (
    <main className="relative min-h-screen overflow-x-clip bg-white pb-24">
      <div className="mx-auto hidden w-full max-w-[1180px] px-4 md:block md:px-6">
        <SalonBreadcrumb salon={salon} locale={locale} />
      </div>

      <AirbnbHero salon={salon} openStatus={openStatus} onOpenLightbox={openLightbox} />

      <div className="mx-auto w-full max-w-[1180px] px-4 md:px-6">
        <div className="mt-8 space-y-10 md:mt-10 md:space-y-12">
          <AirbnbAbout salon={salon} locale={locale} />

          <SectionErrorBoundary section="AirbnbServices">
            <AirbnbServices services={salon.services} locale={locale} slug={slug} />
          </SectionErrorBoundary>

          <SectionErrorBoundary section="SalonBundles">
            <SalonBundles salonId={salon.id} slug={slug} locale={locale} onLoaded={setHasBundles} />
          </SectionErrorBoundary>

          {salon.staff.length > 0 && (
            <SectionErrorBoundary section="AirbnbTeam">
              <AirbnbTeam staff={salon.staff} slug={slug} locale={locale} />
            </SectionErrorBoundary>
          )}

          <SectionErrorBoundary section="AirbnbReviews">
            <AirbnbReviews average={salon.average_rating} count={salon.review_count} reviews={salon.reviews} />
          </SectionErrorBoundary>

          <SectionErrorBoundary section="AirbnbPortfolio">
            <AirbnbPortfolio urls={salon.gallery_urls ?? []} salonName={salon.name} />
          </SectionErrorBoundary>

          <SalonLocation salon={salon} mapDesign="clean-white" />

          <AirbnbOpeningTimes hours={salon.opening_hours} todayKey={todayKey} />

          <AirbnbAdditionalInfo salon={salon} />

          <AirbnbContact salon={salon} />

          {salon.siblings && salon.siblings.length > 0 && (
            <SalonOtherLocations siblings={salon.siblings} locale={locale} />
          )}

          <SalonRecentlyViewed excludeSlug={slug} />

          <SalonVenuesNearby
            cat={(salon.categories[0] ?? "coiffeur").toLowerCase()}
            excludeId={salon.id}
            locale={locale}
          />

          <SalonAppCta
            locale={locale}
            slug={slug}
            salonName={salon.name}
            city={postalToCity(salon.postal_code)}
            salonCategories={salon.categories}
          />
        </div>
      </div>

      <AirbnbReserveBar locale={locale} slug={slug} priceFromCHF={priceFromCHF} />

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
