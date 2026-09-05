"use client";

// Exists-check: `npm run exists "salon page"` -> app/[locale]/_components/salon/SalonDetailV3.tsx
// (the real orchestrator, off-limits, read-only) and its 17 section components, all real
// and reused unchanged below except the hero+header pair (see GalleryHeroOverlay.tsx for
// that swap and its own exists-check). Net-new: this file itself, an orchestrator built
// for THIS direction only, not an edit of SalonDetailV3.tsx.
//
// Grounded-in: app/[locale]/_components/salon/SalonDetailV3.tsx (463 lines, the real
// orchestrator this file's section order and section-availability logic is read from),
// app/[locale]/salon/[slug]/page.tsx (the real route that renders it).
//
// Reference-checked: _design-system/references/fresha--venue-page.md (Fresha section order
// and anatomy, read in full before writing this file) and
// _design-system/references/airbnb--look-recipe.md (Airbnb look-recipe conflicts list, also
// read in full).
//
// Depicts: About/Services/Bundles/Team/Reviews/Portfolio/Location/OpeningTimes/AdditionalInfo/Contact/OtherLocations/RecentlyViewed/VenuesNearby/AppCta order -> app/[locale]/_components/salon/SalonDetailV3.tsx
// Depicts: sticky mobile book bar -> app/[locale]/_components/salon/SalonMobileBookBar.tsx
// Depicts: lightbox + full-screen gallery overlays -> app/[locale]/_components/salon/SalonLightbox.tsx, app/[locale]/_components/salon/SalonImageGallery.tsx
// Depicts: hero + name/meta block -> NET-NEW: see GalleryHeroOverlay.tsx in this same folder for the swap and its own exists-check/Depicts lines
//
// FIXED, unchanged from every direction of this surface (per the shared brief): the real
// salon (loaded server-side via loadSalonDetailWithStatus, same loader page.tsx uses), the
// existing SalonMobileBookBar as the sticky book bar, the locked card/pill contract, each
// section's own anatomy (each component is the real, unedited Solen component already
// ported from Fresha's anatomy per fresha--venue-page.md's port map), real reviews, the
// map, no hardcoded image src.
//
// DATED LOCK KEPT: SalonAbout renders directly after the hero/name block (matching
// SalonDetailV3.tsx's own 2026-08-15 move, see that file's comment at its SalonAbout call
// site), NOT pushed down near Reviews the way fresha--venue-page.md's raw Fresha capture
// would place it. This direction changes the HERO/name treatment only, not section order.
//
// DROPPED for this mockup only (not a structural claim about the real page): the
// barbershop Book/Walk-in toggle (SalonModeToggle/SalonWalkInPanel) and the hidden mobile
// SalonBuy card. muse-beauty-studio has walkin_enabled=false and categories=["coiffeur"]
// (verified live via GET /api/salons?slug=muse-beauty-studio), so the real page renders
// neither of these for this exact salon either; omitted here rather than imported dead.

import * as React from "react";
import dynamic from "next/dynamic";
import { SectionErrorBoundary } from "@/app/[locale]/_components/primitives";
import { SalonBreadcrumb } from "@/app/[locale]/_components/salon/SalonBreadcrumb";
import { SalonAbout } from "@/app/[locale]/_components/salon/SalonAbout";
import { SalonServices } from "@/app/[locale]/_components/salon/SalonServices";
import { SalonBundles } from "@/app/[locale]/_components/salon/SalonBundles";
import { SalonTeam } from "@/app/[locale]/_components/salon/SalonTeam";
import { SalonReviews } from "@/app/[locale]/_components/salon/SalonReviews";
import { SalonPortfolio } from "@/app/[locale]/_components/salon/SalonPortfolio";
import { SalonLocation } from "@/app/[locale]/_components/salon/SalonLocation";
import { SalonOpeningTimes } from "@/app/[locale]/_components/salon/SalonOpeningTimes";
import { SalonAdditionalInfo } from "@/app/[locale]/_components/salon/SalonAdditionalInfo";
import { SalonContact } from "@/app/[locale]/_components/salon/SalonContact";
import { SalonOtherLocations } from "@/app/[locale]/_components/salon/SalonOtherLocations";
import { SalonRecentlyViewed } from "@/app/[locale]/_components/salon/SalonRecentlyViewed";
import { SalonVenuesNearby } from "@/app/[locale]/_components/salon/SalonVenuesNearby";
import { SalonAppCta } from "@/app/[locale]/_components/salon/SalonAppCta";
import { SalonMobileBookBar } from "@/app/[locale]/_components/salon/SalonMobileBookBar";
import { postalToCity } from "@/app/[locale]/_components/salon/_shared";
import { CATEGORY_LABEL } from "@/app/[locale]/_components/search/SalonResultCard";
import type { SalonDetail, OpenStatus, DayKey } from "@/app/[locale]/_components/salon/_shared";
import { GalleryHeroOverlay } from "./GalleryHeroOverlay";

const SalonLightbox = dynamic(
  () => import("@/app/[locale]/_components/salon/SalonLightbox").then((m) => m.SalonLightbox),
  { ssr: false },
);
const SalonImageGallery = dynamic(
  () => import("@/app/[locale]/_components/salon/SalonImageGallery").then((m) => m.SalonImageGallery),
  { ssr: false },
);

export function SalonPagePhotoLed({
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
  const openGallery = () => setGalleryOpen(true);

  const primaryCategory = (salon.categories[0] ?? "coiffeur").toLowerCase();

  return (
    <main className="relative min-h-screen overflow-x-clip bg-white pb-6">
      <div className="mx-auto hidden w-full max-w-[1180px] px-4 md:block md:px-6">
        <SalonBreadcrumb salon={salon} locale={locale} />
      </div>

      <GalleryHeroOverlay salon={salon} openStatus={openStatus} onOpenLightbox={openLightbox} />

      <div className="mx-auto w-full max-w-[1180px] px-4 pt-8 md:px-6">
        <div className="space-y-10 md:space-y-12">
          <SalonAbout salon={salon} locale={locale} />

          <SectionErrorBoundary section="SalonServices">
            <SalonServices services={salon.services} locale={locale} slug={slug} salon={salon} />
          </SectionErrorBoundary>

          <SectionErrorBoundary section="SalonBundles">
            <SalonBundles salonId={salon.id} slug={slug} locale={locale} onLoaded={setHasBundles} />
          </SectionErrorBoundary>

          {salon.staff.length > 0 && (
            <SectionErrorBoundary section="SalonTeam">
              <SalonTeam staff={salon.staff} salonAverageRating={salon.average_rating} slug={slug} locale={locale} />
            </SectionErrorBoundary>
          )}

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

          <SectionErrorBoundary section="SalonPortfolio">
            <SalonPortfolio
              urls={salon.gallery_urls ?? []}
              staff={salon.staff}
              onOpen={() => openGallery()}
              salonName={salon.name}
              categoryLabel={CATEGORY_LABEL[primaryCategory] ?? null}
            />
          </SectionErrorBoundary>

          <SalonLocation salon={salon} mapDesign="clean-white" />

          <SalonOpeningTimes hours={salon.opening_hours} todayKey={todayKey} />

          <SalonAdditionalInfo salon={salon} />

          <SalonContact salon={salon} />

          {salon.siblings && salon.siblings.length > 0 && (
            <SalonOtherLocations siblings={salon.siblings} locale={locale} />
          )}

          <SalonRecentlyViewed excludeSlug={slug} />

          <SalonVenuesNearby cat={primaryCategory} excludeId={salon.id} locale={locale} />

          <SalonAppCta
            locale={locale}
            slug={slug}
            salonName={salon.name}
            city={postalToCity(salon.postal_code)}
            salonCategories={salon.categories}
          />
        </div>
      </div>

      <SalonMobileBookBar locale={locale} slug={slug} suppressed={galleryOpen || lightboxOpen} />

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
